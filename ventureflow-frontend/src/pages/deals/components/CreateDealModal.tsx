/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

import { useState, useEffect, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import api from '../../../config/api';
import { getCachedCurrencies } from '../../../utils/referenceDataCache';
import { showAlert } from '../../../components/Alert';
import { Dropdown } from '../../prospects/components/Dropdown';
import VFDateRangePicker from '../../../components/VFDateRangePicker';

interface CreateDealModalProps {
    onClose: () => void;
    onCreated: () => void;
    defaultView?: 'buyer' | 'seller';
}

interface Buyer {
    id: number;
    created_at?: string;
    company_overview?: {
        reg_name: string;
        financial_advisor?: string | Record<string, string>[];
        internal_pic?: { id: number; name: string }[] | string;
    };
}

interface Seller {
    id: number;
    created_at?: string;
    company_overview?: {
        reg_name: string;
        financial_advisor?: string | Record<string, string>[];
        internal_pic?: { id: number; name: string }[] | string;
    };
    financial_details?: {
        expected_investment_amount?: { min?: string; max?: string } | string;
        default_currency?: string;
    } | null;
}

interface User {
    id: number;
    name: string;
    flagSrc: string;
    status: 'registered' | 'unregistered';
}

// Deal types — context-aware labels for buyer-side vs seller-side FA
const DEAL_TYPES = [
    { value: 'acquisition', buyerLabel: 'Acquisition', sellerLabel: 'Divestiture' },
    { value: 'merger', buyerLabel: 'Merger', sellerLabel: 'Merger' },
    { value: 'joint_venture', buyerLabel: 'Joint Venture', sellerLabel: 'Joint Venture' },
    { value: 'strategic_investment', buyerLabel: 'Strategic Investment', sellerLabel: 'Capital Raise' },
    { value: 'minority_stake', buyerLabel: 'Minority Acquisition', sellerLabel: 'Minority Divestiture' },
    { value: 'majority_stake', buyerLabel: 'Majority Acquisition', sellerLabel: 'Majority Divestiture' },
    { value: 'buyout', buyerLabel: 'Buyout', sellerLabel: 'Sell-out' },
    { value: 'partnership', buyerLabel: 'Partnership', sellerLabel: 'Partnership' },
    { value: 'management_buyout', buyerLabel: 'Management Buyout (MBO)', sellerLabel: 'Management Buyout (MBO)' },
    { value: 'leveraged_buyout', buyerLabel: 'Leveraged Buyout (LBO)', sellerLabel: 'Leveraged Buyout (LBO)' },
];

const INVESTMENT_CONDITIONS = [
    { value: 'Minority (<50%)', label: 'Minority (<50%)' },
    { value: 'Significant minority (25–49%)', label: 'Significant minority (25–49%)' },
    { value: 'Joint control (51/49)', label: 'Joint control (51/49)' },
    { value: 'Majority (51–99%)', label: 'Majority (51–99%)' },
    { value: 'Full acquisition (100%)', label: 'Full acquisition (100%)' },
    { value: 'Flexible', label: 'Flexible' },
];

/** Format a number string with commas (e.g. 4972520 → 4,972,520) */
const formatWithCommas = (value: string): string => {
    // Remove existing commas
    const cleaned = value.replace(/,/g, '');
    if (!cleaned) return '';
    // Split by decimal point
    const parts = cleaned.split('.');
    // Add commas to integer part
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
};

/** Remove commas from formatted string for API submission */
const removeCommas = (value: string): string => value.replace(/,/g, '');

// Generic admin/system account names to exclude from PIC selections
const EXCLUDED_PIC_NAMES = ['admin user', 'staff user', 'admin', 'system'];

const CreateDealModal = ({ onClose, onCreated, defaultView = 'buyer' }: CreateDealModalProps) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [buyers, setBuyers] = useState<Buyer[]>([]);
    const [sellers, setSellers] = useState<Seller[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [stages, setStages] = useState<{ code: string; name: string }[]>([]);
    const [searchBuyer, setSearchBuyer] = useState('');
    const [searchSeller, setSearchSeller] = useState('');

    // Stage deadlines: map of stage_code -> { start_date, end_date, is_parallel }
    const [stageDeadlines, setStageDeadlines] = useState<Record<string, { start_date: string; end_date: string; is_parallel: boolean }>>({}); 
    const [showStageTimeline, setShowStageTimeline] = useState(false);

    const [formData, setFormData] = useState({
        buyer_id: 0,
        seller_id: 0,
        name: '',
        ticket_size: '',
        estimated_ev_currency: 'USD',
        priority: 'medium',
        possibility: 'Medium',
        deal_type: 'acquisition',
        investment_condition: '',
        ebitda_investor_value: '',
        ebitda_investor_times: '',
        ebitda_target_value: '',
        ebitda_target_times: '',
        internal_pic: [] as User[],
        stage_code: '',
    });

    const [selectedBuyer, setSelectedBuyer] = useState<Buyer | null>(null);
    const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);

    // TBD flags for 1-sided deals
    const [buyerTBD, setBuyerTBD] = useState(false);
    const [sellerTBD, setSellerTBD] = useState(false);

    // Track if ticket size was manually edited
    const [ticketSizeManuallyEdited, setTicketSizeManuallyEdited] = useState(false);
    // Track if internal PIC was manually edited
    const [picManuallyEdited, setPicManuallyEdited] = useState(false);

    /** Parse internal_pic from a company_overview — handles both array and JSON string */
    const parsePICs = (raw: { id: number; name: string }[] | string | undefined): User[] => {
        if (!raw) return [];
        try {
            const arr = typeof raw === 'string' ? JSON.parse(raw) : raw;
            if (!Array.isArray(arr)) return [];
            return arr
                .filter((p: { id?: number; name?: string }) => p.id && p.name)
                .map((p: { id: number; name: string }) => ({
                    id: p.id,
                    name: p.name,
                    flagSrc: '',
                    status: 'registered' as const,
                }));
        } catch {
            return [];
        }
    };

    /** Merge PICs from buyer and seller, deduped by id */
    const mergePICs = (buyerPics: User[], sellerPics: User[]): User[] => {
        const map = new Map<number, User>();
        for (const p of [...buyerPics, ...sellerPics]) {
            if (!map.has(p.id)) map.set(p.id, p);
        }
        return Array.from(map.values());
    };

    useEffect(() => {
        fetchBuyers();
        fetchSellers();
        fetchUsers();
        fetchStages();
    }, []);

    const fetchStages = async () => {
        try {
            const response = await api.get('/api/pipeline-stages', {
                params: { type: defaultView }
            });
            const stagesData = response.data || [];
            // Backend filters by type, but ensuring client-side match as well
            const filteredStages = stagesData.filter((s: { pipeline_type: string }) => s.pipeline_type === defaultView);
            setStages(filteredStages);

            if (filteredStages.length > 0) {
                setFormData(prev => ({ ...prev, stage_code: filteredStages[0].code }));
            }

        } catch {
            console.error('Failed to fetch stages');
        }
    };

    const fetchBuyers = async () => {
        try {
            const response = await api.get('/api/buyer', { params: { per_page: 9999 } });
            setBuyers(response.data.data || []);
        } catch {
            console.error('Failed to fetch buyers');
        }
    };

    const fetchSellers = async () => {
        try {
            const response = await api.get('/api/seller', { params: { per_page: 9999 } });
            setSellers(response.data.data || []);
        } catch {
            console.error('Failed to fetch sellers');
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await api.get('/api/employees/fetch');
            const employees = response.data || [];
            setUsers(employees
                .map((e: { id: number; first_name?: string; last_name?: string; name?: string; full_name?: string }) => ({
                    id: e.id,
                    name: e.first_name && e.last_name ? `${e.first_name} ${e.last_name}` : (e.first_name || e.last_name || e.name || e.full_name || 'Unknown'),
                    flagSrc: '',
                    status: 'registered'
                }))
                // Filter out generic/admin accounts
                .filter((u: User) => !EXCLUDED_PIC_NAMES.includes(u.name.toLowerCase().trim()))
            );
        } catch {
            console.error('Failed to fetch users');
        }
    };

    const [systemCurrencies, setSystemCurrencies] = useState<{ id: number; currency_code: string }[]>([]);
    useEffect(() => {
        getCachedCurrencies().then(data => {
            setSystemCurrencies(data);
        });
    }, []);

    /** Extract the high (max) value from seller's expected_investment_amount */
    const getSellerInvestmentMax = (seller: Seller): string => {
        const fin = seller.financial_details;
        if (!fin || !fin.expected_investment_amount) return '';
        const amount = fin.expected_investment_amount;
        if (typeof amount === 'string') {
            try {
                const parsed = JSON.parse(amount);
                return parsed?.max || parsed?.min || amount;
            } catch {
                return amount;
            }
        }
        if (typeof amount === 'object') {
            return amount.max || amount.min || '';
        }
        return '';
    };

    const handleSelectBuyer = (buyer: Buyer) => {
        setSelectedBuyer(buyer);
        setBuyerTBD(false);
        setFormData((prev) => ({ ...prev, buyer_id: buyer.id }));
        // Auto-generate deal name
        const buyerName = buyer.company_overview?.reg_name || 'Buyer';
        if (selectedSeller) {
            const sellerName = selectedSeller.company_overview?.reg_name || 'Seller';
            setFormData((prev) => ({ ...prev, name: `${buyerName} – ${sellerName}` }));
        } else if (sellerTBD) {
            setFormData((prev) => ({ ...prev, name: `${buyerName} – TBD` }));
        }
        // Auto-fill PICs from buyer (merged with existing seller PICs)
        if (!picManuallyEdited) {
            const buyerPics = parsePICs(buyer.company_overview?.internal_pic);
            const sellerPics = selectedSeller ? parsePICs(selectedSeller.company_overview?.internal_pic) : [];
            setFormData((prev) => ({ ...prev, internal_pic: mergePICs(buyerPics, sellerPics) }));
        }
    };

    const handleSelectSeller = (seller: Seller) => {
        setSelectedSeller(seller);
        setSellerTBD(false);
        setFormData((prev) => ({ ...prev, seller_id: seller.id }));

        // Auto-grab ticket size from seller's investment range (high value)
        if (!ticketSizeManuallyEdited) {
            const maxVal = getSellerInvestmentMax(seller);
            if (maxVal) {
                setFormData((prev) => ({ ...prev, ticket_size: formatWithCommas(maxVal) }));
            }
            // Also grab currency if available
            if (seller.financial_details?.default_currency) {
                setFormData((prev) => ({ ...prev, estimated_ev_currency: seller.financial_details!.default_currency! }));
            }
        }

        // Auto-generate deal name
        const sellerName = seller.company_overview?.reg_name || 'Target';
        if (selectedBuyer) {
            const buyerName = selectedBuyer.company_overview?.reg_name || 'Investor';
            setFormData((prev) => ({
                ...prev,
                name: `${buyerName} – ${sellerName}`,
            }));
        } else if (buyerTBD) {
            setFormData((prev) => ({ ...prev, name: `TBD – ${sellerName}` }));
        }

        // Auto-fill PICs from seller (merged with existing buyer PICs)
        if (!picManuallyEdited) {
            const sellerPics = parsePICs(seller.company_overview?.internal_pic);
            const buyerPics = selectedBuyer ? parsePICs(selectedBuyer.company_overview?.internal_pic) : [];
            setFormData((prev) => ({ ...prev, internal_pic: mergePICs(buyerPics, sellerPics) }));
        }
    };

    const handleSkipBuyer = () => {
        setBuyerTBD(true);
        setSelectedBuyer(null);
        setFormData((prev) => ({ ...prev, buyer_id: 0 }));
        // Auto-name with TBD if seller exists
        if (selectedSeller) {
            const sellerName = selectedSeller.company_overview?.reg_name || 'Target';
            setFormData((prev) => ({ ...prev, name: `TBD – ${sellerName}` }));
        }
    };

    const handleSkipSeller = () => {
        setSellerTBD(true);
        setSelectedSeller(null);
        setFormData((prev) => ({ ...prev, seller_id: 0 }));
        // Auto-name with TBD if buyer exists
        if (selectedBuyer) {
            const buyerName = selectedBuyer.company_overview?.reg_name || 'Investor';
            setFormData((prev) => ({ ...prev, name: `${buyerName} – TBD` }));
        }
    };

    const getFANames = (fa: string | Record<string, string>[] | undefined) => {
        try {
            const parsed = typeof fa === 'string' ? JSON.parse(fa) : fa;
            if (Array.isArray(parsed)) return parsed.map((f: Record<string, string>) => f.name || f.reg_name).join(', ');
            return parsed?.name || parsed?.reg_name || 'None';
        } catch { return 'None'; }
    };

    // Compute which stages to show in timeline (from current stage through last)
    const timelineStages = useMemo(() => {
        if (!formData.stage_code || stages.length === 0) return stages;
        const currentIdx = stages.findIndex(s => s.code === formData.stage_code);
        if (currentIdx === -1) return stages;
        return stages.slice(currentIdx);
    }, [formData.stage_code, stages]);

    /** Update a single stage deadline and auto-cascade to next stage */
    const updateStageDeadline = (stageCode: string, field: 'start_date' | 'end_date', value: string) => {
        setStageDeadlines(prev => {
            const updated = { ...prev };
            if (!updated[stageCode]) updated[stageCode] = { start_date: '', end_date: '', is_parallel: false };
            updated[stageCode] = { ...updated[stageCode], [field]: value };

            // Auto-cascade: if end_date changed, set next sequential stage's start_date to end_date + 1 day
            if (field === 'end_date' && value) {
                const idx = timelineStages.findIndex(s => s.code === stageCode);
                if (idx >= 0 && idx < timelineStages.length - 1) {
                    const nextStage = timelineStages[idx + 1];
                    const nextDay = new Date(value);
                    nextDay.setDate(nextDay.getDate() + 1);
                    const nextDayStr = nextDay.toISOString().split('T')[0];
                    if (!updated[nextStage.code]) updated[nextStage.code] = { start_date: '', end_date: '', is_parallel: false };
                    // Auto-fill if not parallel and (empty or was auto-filled)
                    const nextIsParallel = updated[nextStage.code].is_parallel;
                    if (!nextIsParallel && (!updated[nextStage.code].start_date || updated[nextStage.code].start_date < nextDayStr)) {
                        updated[nextStage.code] = { ...updated[nextStage.code], start_date: nextDayStr };
                    }
                }
            }

            return updated;
        });
    };

    /** Toggle is_parallel for a stage and fix its start_date if needed */
    const toggleStageParallel = (stageCode: string) => {
        setStageDeadlines(prev => {
            const updated = { ...prev };
            if (!updated[stageCode]) updated[stageCode] = { start_date: '', end_date: '', is_parallel: false };
            const wasParallel = updated[stageCode].is_parallel;
            updated[stageCode] = { ...updated[stageCode], is_parallel: !wasParallel };

            // If turning off parallel, auto-enforce: set start_date to previous stage end + 1
            if (wasParallel) {
                const idx = timelineStages.findIndex(s => s.code === stageCode);
                if (idx > 0) {
                    const prevStage = timelineStages[idx - 1];
                    const prevEnd = updated[prevStage.code]?.end_date;
                    if (prevEnd) {
                        const nextDay = new Date(prevEnd);
                        nextDay.setDate(nextDay.getDate() + 1);
                        const nextDayStr = nextDay.toISOString().split('T')[0];
                        updated[stageCode] = { ...updated[stageCode], start_date: nextDayStr };
                        // Also clear end_date if it's now before start_date
                        if (updated[stageCode].end_date && updated[stageCode].end_date < nextDayStr) {
                            updated[stageCode] = { ...updated[stageCode], end_date: '' };
                        }
                    }
                }
            }

            return updated;
        });
    };

    /** Get the minDate for a stage based on previous non-parallel stage's end_date */
    const getStageMinDate = (idx: number): string | undefined => {
        if (idx === 0) return undefined;
        const currentDl = stageDeadlines[timelineStages[idx].code];
        if (currentDl?.is_parallel) return undefined; // parallel = no constraint
        // Walk backwards to find the last stage with an end_date
        for (let i = idx - 1; i >= 0; i--) {
            const prevDl = stageDeadlines[timelineStages[i].code];
            if (prevDl?.end_date) {
                const nextDay = new Date(prevDl.end_date);
                nextDay.setDate(nextDay.getDate() + 1);
                return nextDay.toISOString().split('T')[0];
            }
        }
        return undefined;
    };

    const handleSubmit = async () => {
        // Allow 1-sided: at least one party required
        if (!formData.buyer_id && !formData.seller_id) {
            showAlert({ type: 'error', message: 'Please select at least one party (buyer or seller)' });
            return;
        }
        if (!formData.name) {
            showAlert({ type: 'error', message: 'Please enter a deal name' });
            return;
        }

        // Build stage_deadlines array from stageDeadlines state
        const deadlinesPayload = Object.entries(stageDeadlines)
            .filter(([, v]) => v.start_date && v.end_date)
            .map(([code, v]) => ({
                stage_code: code,
                start_date: v.start_date,
                end_date: v.end_date,
                is_parallel: v.is_parallel || false,
            }));

        setLoading(true);
        try {
            await api.post('/api/deals', {
                ...formData,
                buyer_id: formData.buyer_id || null,
                seller_id: formData.seller_id || null,
                ticket_size: removeCommas(formData.ticket_size) || null,
                ebitda_investor_value: formData.ebitda_investor_value || null,
                ebitda_investor_times: formData.ebitda_investor_times || null,
                ebitda_target_value: formData.ebitda_target_value || null,
                ebitda_target_times: formData.ebitda_target_times || null,
                investment_condition: formData.investment_condition || null,
                pipeline_type: defaultView,
                stage_deadlines: deadlinesPayload.length > 0 ? deadlinesPayload : undefined,
            });
            showAlert({ type: 'success', message: 'Deal created successfully!' });
            onCreated();
        } catch {
            showAlert({ type: 'error', message: 'Failed to create deal' });
        } finally {
            setLoading(false);
        }
    };

    const filteredBuyers = buyers.filter((b) =>
        b.company_overview?.reg_name?.toLowerCase().includes(searchBuyer.toLowerCase())
    );

    const filteredSellers = sellers.filter((s) =>
        s.company_overview?.reg_name?.toLowerCase().includes(searchSeller.toLowerCase())
    );

    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const isNewEntry = (created_at?: string) => created_at ? (Date.now() - new Date(created_at).getTime()) < SEVEN_DAYS_MS : false;

    const sortedFilteredBuyers = [...filteredBuyers].sort((a, b) => {
        const aNew = isNewEntry(a.created_at);
        const bNew = isNewEntry(b.created_at);
        if (aNew && !bNew) return -1;
        if (!aNew && bNew) return 1;
        if (aNew && bNew) return new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime();
        return 0;
    });

    const sortedFilteredSellers = [...filteredSellers].sort((a, b) => {
        const aNew = isNewEntry(a.created_at);
        const bNew = isNewEntry(b.created_at);
        if (aNew && !bNew) return -1;
        if (!aNew && bNew) return 1;
        if (aNew && bNew) return new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime();
        return 0;
    });

    // Determine step labels based on defaultView
    const step1Label = defaultView === 'seller' ? 'Select Target' : 'Select Investor';
    const step2Label = defaultView === 'seller' ? 'Select Investor' : 'Select Target';

    // Determine whether step 1 deals with buyers or sellers
    const step1IsBuyer = defaultView === 'buyer';

    // Can proceed from step 1: must select primary party (no skip)
    const canProceedStep1 = step1IsBuyer
        ? !!selectedBuyer
        : !!selectedSeller;

    // Can proceed from step 2: selected or TBD (but at least ONE party must be real)
    const canProceedStep2 = step1IsBuyer
        ? (!!selectedSeller || sellerTBD)
        : (!!selectedBuyer || buyerTBD);

    const hasAtLeastOneParty = !!selectedBuyer || !!selectedSeller;

    // Shared input/component style with 3px border-radius
    const inputClass = "w-full px-4 py-2 border border-gray-300 rounded-[3px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm";
    const selectClass = "w-full px-4 py-2 pr-10 border border-gray-300 rounded-[3px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm appearance-none bg-white";
    const buttonItemClass = (isSelected: boolean, accentColor: string) =>
        `w-full flex items-center gap-3 px-4 py-3 rounded-[3px] border transition-colors ${isSelected
            ? `border-${accentColor}-500 bg-${accentColor}-50`
            : 'hover:bg-gray-50'
        }`;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-[3px] shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h2 className="text-lg font-medium text-gray-900">Create New Deal</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-[3px] transition-colors" title="Close modal" aria-label="Close modal">
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Steps Indicator */}
                <div className="flex items-center px-6 py-4 border-b bg-gray-50">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= s ? 'bg-[#064771] text-white' : 'bg-gray-200 text-gray-500'
                                    }`}
                            >
                                {s}
                            </div>
                            <span className={`ml-2 text-sm ${step >= s ? 'text-gray-900' : 'text-gray-500'}`}>
                                {s === 1 ? step1Label : s === 2 ? step2Label : 'Deal Details'}
                            </span>
                            {s < 3 && <div className="w-12 h-0.5 mx-4 bg-gray-200" />}
                        </div>
                    ))}
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[50vh] scrollbar-premium">
                    {/* ===== STEP 1 ===== */}
                    {step === 1 && (
                        <div>
                            {step1IsBuyer ? (
                                /* Step 1 is Select Investor (Buyer) */
                                <>
                                    <input
                                        type="text"
                                        placeholder="Search investors..."
                                        value={searchBuyer}
                                        onChange={(e) => setSearchBuyer(e.target.value)}
                                        className={`${inputClass} mb-4`}
                                    />
                                    <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-premium">
                                        {sortedFilteredBuyers.map((buyer) => (
                                            <button
                                                key={buyer.id}
                                                onClick={() => handleSelectBuyer(buyer)}
                                                className={buttonItemClass(selectedBuyer?.id === buyer.id, 'blue')}
                                                style={selectedBuyer?.id === buyer.id ? { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' } : {}}
                                            >
                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-[#064771] font-semibold">
                                                    {buyer.company_overview?.reg_name?.charAt(0) || 'B'}
                                                </div>
                                                <span className="text-sm font-medium text-gray-900">
                                                    {buyer.company_overview?.reg_name || `Buyer #${buyer.id}`}
                                                </span>
                                                {isNewEntry(buyer.created_at) && (
                                                    <span style={{ background: '#064771', color: 'white', fontSize: '10px', fontWeight: 600, padding: '1px 6px', borderRadius: '3px', lineHeight: '16px', marginLeft: 'auto', flexShrink: 0 }}>New</span>
                                                )}
                                            </button>
                                        ))}
                                        {filteredBuyers.length === 0 && (
                                            <p className="text-center text-gray-500 py-4">No investors found</p>
                                        )}
                                    </div>
                                    {/* No skip on step 1 — primary party is required */}
                                </>
                            ) : (
                                /* Step 1 is Select Target (Seller) */
                                <>
                                    <input
                                        type="text"
                                        placeholder="Search targets..."
                                        value={searchSeller}
                                        onChange={(e) => setSearchSeller(e.target.value)}
                                        className={`${inputClass} mb-4`}
                                    />
                                    <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-premium">
                                        {sortedFilteredSellers.map((seller) => (
                                            <button
                                                key={seller.id}
                                                onClick={() => handleSelectSeller(seller)}
                                                className={buttonItemClass(selectedSeller?.id === seller.id, 'green')}
                                                style={selectedSeller?.id === seller.id ? { borderColor: '#22C55E', backgroundColor: '#F0FDF4' } : {}}
                                            >
                                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-semibold">
                                                    {seller.company_overview?.reg_name?.charAt(0) || 'S'}
                                                </div>
                                                <span className="text-sm font-medium text-gray-900">
                                                    {seller.company_overview?.reg_name || `Seller #${seller.id}`}
                                                </span>
                                                {isNewEntry(seller.created_at) && (
                                                    <span style={{ background: '#064771', color: 'white', fontSize: '10px', fontWeight: 600, padding: '1px 6px', borderRadius: '3px', lineHeight: '16px', marginLeft: 'auto', flexShrink: 0 }}>New</span>
                                                )}
                                            </button>
                                        ))}
                                        {filteredSellers.length === 0 && (
                                            <p className="text-center text-gray-500 py-4">No targets found</p>
                                        )}
                                    </div>
                                    {/* No skip on step 1 — primary party is required */}
                                </>
                            )}
                        </div>
                    )}

                    {/* ===== STEP 2 ===== */}
                    {step === 2 && (
                        <div>
                            {step1IsBuyer ? (
                                /* Step 2 is Select Target (Seller) */
                                <>
                                    <input
                                        type="text"
                                        placeholder="Search targets..."
                                        value={searchSeller}
                                        onChange={(e) => setSearchSeller(e.target.value)}
                                        className={`${inputClass} mb-4`}
                                    />
                                    <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-premium">
                                        {sortedFilteredSellers.map((seller) => (
                                            <button
                                                key={seller.id}
                                                onClick={() => handleSelectSeller(seller)}
                                                className={buttonItemClass(selectedSeller?.id === seller.id, 'green')}
                                                style={selectedSeller?.id === seller.id ? { borderColor: '#22C55E', backgroundColor: '#F0FDF4' } : {}}
                                            >
                                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-semibold">
                                                    {seller.company_overview?.reg_name?.charAt(0) || 'S'}
                                                </div>
                                                <span className="text-sm font-medium text-gray-900">
                                                    {seller.company_overview?.reg_name || `Seller #${seller.id}`}
                                                </span>
                                                {isNewEntry(seller.created_at) && (
                                                    <span style={{ background: '#064771', color: 'white', fontSize: '10px', fontWeight: 600, padding: '1px 6px', borderRadius: '3px', lineHeight: '16px', marginLeft: 'auto', flexShrink: 0 }}>New</span>
                                                )}
                                            </button>
                                        ))}
                                        {filteredSellers.length === 0 && (
                                            <p className="text-center text-gray-500 py-4">No targets found</p>
                                        )}
                                    </div>
                                    {/* Skip option */}
                                    <button
                                        onClick={handleSkipSeller}
                                        className={`mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-[3px] border-2 border-dashed transition-colors ${sellerTBD
                                            ? 'border-amber-400 bg-amber-50 text-amber-700'
                                            : 'border-gray-300 text-gray-500 hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700'
                                            }`}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                        <span className="text-sm font-medium">Skip for now (Target TBD)</span>
                                    </button>
                                    {sellerTBD && (
                                        <p className="mt-2 text-xs text-amber-600 text-center">
                                            Deal will be created as a <strong>Buyer Mandate</strong> — you can assign a target later.
                                        </p>
                                    )}
                                </>
                            ) : (
                                /* Step 2 is Select Investor (Buyer) */
                                <>
                                    <input
                                        type="text"
                                        placeholder="Search investors..."
                                        value={searchBuyer}
                                        onChange={(e) => setSearchBuyer(e.target.value)}
                                        className={`${inputClass} mb-4`}
                                    />
                                    <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-premium">
                                        {sortedFilteredBuyers.map((buyer) => (
                                            <button
                                                key={buyer.id}
                                                onClick={() => handleSelectBuyer(buyer)}
                                                className={buttonItemClass(selectedBuyer?.id === buyer.id, 'blue')}
                                                style={selectedBuyer?.id === buyer.id ? { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' } : {}}
                                            >
                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-[#064771] font-semibold">
                                                    {buyer.company_overview?.reg_name?.charAt(0) || 'B'}
                                                </div>
                                                <span className="text-sm font-medium text-gray-900">
                                                    {buyer.company_overview?.reg_name || `Buyer #${buyer.id}`}
                                                </span>
                                                {isNewEntry(buyer.created_at) && (
                                                    <span style={{ background: '#064771', color: 'white', fontSize: '10px', fontWeight: 600, padding: '1px 6px', borderRadius: '3px', lineHeight: '16px', marginLeft: 'auto', flexShrink: 0 }}>New</span>
                                                )}
                                            </button>
                                        ))}
                                        {filteredBuyers.length === 0 && (
                                            <p className="text-center text-gray-500 py-4">No investors found</p>
                                        )}
                                    </div>
                                    {/* Skip option */}
                                    <button
                                        onClick={handleSkipBuyer}
                                        className={`mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-[3px] border-2 border-dashed transition-colors ${buyerTBD
                                            ? 'border-amber-400 bg-amber-50 text-amber-700'
                                            : 'border-gray-300 text-gray-500 hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700'
                                            }`}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                        <span className="text-sm font-medium">Skip for now (Investor TBD)</span>
                                    </button>
                                    {buyerTBD && (
                                        <p className="mt-2 text-xs text-amber-600 text-center">
                                            Deal will be created as a <strong>Seller Mandate</strong> — you can assign an investor later.
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* ===== STEP 3: Deal Details ===== */}
                    {step === 3 && (
                        <div className="space-y-4">
                            {/* Mandate indicator */}
                            {(buyerTBD || sellerTBD) && (
                                <div className="flex items-center gap-2 px-3 py-2 rounded-[3px] bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>
                                        Creating as <strong>{buyerTBD ? 'Seller Mandate' : 'Buyer Mandate'}</strong> — {buyerTBD ? 'Investor' : 'Target'} is TBD and can be assigned later.
                                    </span>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Deal Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                                    className={inputClass}
                                    placeholder="e.g., Buyer Corp – Seller Inc"
                                />
                            </div>

                            {/* Deal Type */}
                            <div>
                                <label htmlFor="deal-type" className="block text-sm font-medium text-gray-700 mb-1">Deal Type</label>
                                <div className="relative">
                                    <select
                                        id="deal-type"
                                        value={formData.deal_type}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, deal_type: e.target.value }))}
                                        className={selectClass}
                                    >
                                        {DEAL_TYPES.map((dt) => (
                                            <option key={dt.value} value={dt.value}>
                                                {defaultView === 'seller' ? dt.sellerLabel : dt.buyerLabel}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>
                                {/* Preview of how it will display */}
                                {(selectedBuyer || selectedSeller) && (
                                    <p className="mt-1.5 text-xs text-gray-500">
                                        Preview: <span className="font-medium text-gray-700">
                                            {(() => {
                                                const dt = DEAL_TYPES.find(r => r.value === formData.deal_type);
                                                const bName = selectedBuyer?.company_overview?.reg_name || 'Investor';
                                                const sName = selectedSeller?.company_overview?.reg_name || 'Target';
                                                if (defaultView === 'buyer') {
                                                    return `${bName} — ${dt?.buyerLabel} → ${sName}`;
                                                }
                                                return `${sName} — ${dt?.sellerLabel} → ${bName}`;
                                            })()}
                                        </span>
                                    </p>
                                )}
                            </div>

                            {/* Investment Condition */}
                            <div>
                                <label htmlFor="deal-investment-condition" className="block text-sm font-medium text-gray-700 mb-1">Investment Condition</label>
                                <div className="relative">
                                    <select
                                        id="deal-investment-condition"
                                        value={formData.investment_condition}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, investment_condition: e.target.value }))}
                                        className={selectClass}
                                    >
                                        <option value="">Select condition</option>
                                        {INVESTMENT_CONDITIONS.map((ic) => (
                                            <option key={ic.value} value={ic.value}>
                                                {ic.label}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Transaction Size
                                        {selectedSeller && !ticketSizeManuallyEdited && formData.ticket_size && (
                                            <span className="ml-1 text-xs font-normal" style={{ color: '#064771' }}>(auto-filled from target)</span>
                                        )}
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={formData.ticket_size}
                                            onChange={(e) => {
                                                setTicketSizeManuallyEdited(true);
                                                // Only allow digits, commas, and decimal point
                                                const raw = e.target.value.replace(/[^0-9.,]/g, '');
                                                setFormData((prev) => ({ ...prev, ticket_size: formatWithCommas(removeCommas(raw)) }));
                                            }}
                                            className={`flex-1 px-4 py-2 border border-gray-300 rounded-[3px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm`}
                                            placeholder="Amount"
                                        />
                                        <div className="relative">
                                            <select
                                                id="deal-currency"
                                                aria-label="Currency"
                                                value={formData.estimated_ev_currency}
                                                onChange={(e) => setFormData((prev) => ({ ...prev, estimated_ev_currency: e.target.value }))}
                                                className="w-[88px] appearance-none px-2 pr-7 py-2 border border-gray-300 rounded-[3px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm cursor-pointer"
                                            >
                                                {systemCurrencies.map(c => <option key={c.id} value={c.currency_code}>{c.currency_code}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="deal-stage" className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
                                    <select
                                        id="deal-stage"
                                        value={formData.stage_code}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, stage_code: e.target.value }))}
                                        className={selectClass}
                                    >
                                        {stages.map((stage) => (
                                            <option key={stage.code} value={stage.code}>
                                                {stage.code} - {stage.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="deal-probability" className="block text-sm font-medium text-gray-700 mb-1">Probability</label>
                                    <select
                                        id="deal-probability"
                                        value={formData.possibility}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, possibility: e.target.value }))}
                                        className={selectClass}
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 text-gray-400">Target Close Date</label>
                                    <p className="text-xs text-gray-400 italic">Auto-calculated from stage deadlines</p>
                                </div>
                            </div>

                            {/* ── Stage Timeline ── */}
                            <div>
                                <button
                                    type="button"
                                    onClick={() => setShowStageTimeline(!showStageTimeline)}
                                    className="flex items-center gap-2 text-sm font-medium text-[#064771] hover:text-[#053a5c] transition-colors"
                                >
                                    <svg className={`w-4 h-4 transition-transform duration-200 ${showStageTimeline ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                    Stage Timeline — Set Deadlines
                                    {Object.values(stageDeadlines).filter(v => v.start_date && v.end_date).length > 0 && (
                                        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#064771] px-1.5 text-[10px] font-medium text-white">
                                            {Object.values(stageDeadlines).filter(v => v.start_date && v.end_date).length}
                                        </span>
                                    )}
                                </button>

                                {showStageTimeline && (
                                    <div className="mt-3 space-y-0 border border-gray-200 rounded-[3px] overflow-hidden">
                                        {timelineStages.map((stage, idx) => {
                                            const dl = stageDeadlines[stage.code] || { start_date: '', end_date: '', is_parallel: false };
                                            const isFirst = idx === 0;
                                            const stageMinDate = getStageMinDate(idx);
                                            return (
                                                <div key={stage.code} className={`flex items-center gap-3 px-4 py-3 ${!isFirst ? 'border-t border-gray-100' : ''} ${dl.start_date && dl.end_date ? 'bg-blue-50/30' : ''}`}>
                                                    {/* Stage indicator */}
                                                    <div className="flex flex-col items-center gap-0.5 min-w-[32px]">
                                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${dl.start_date && dl.end_date
                                                            ? 'bg-[#064771] text-white'
                                                            : 'bg-gray-200 text-gray-500'
                                                            }`}>
                                                            {stage.code}
                                                        </div>
                                                        {idx < timelineStages.length - 1 && (
                                                            <div className="w-px h-3 bg-gray-300" />
                                                        )}
                                                    </div>

                                                    {/* Stage name + parallel toggle */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <p className="text-sm font-medium text-gray-900 truncate">{stage.name}</p>
                                                            {dl.is_parallel && (
                                                                <span className="text-[9px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200 whitespace-nowrap">∥ Parallel</span>
                                                            )}
                                                        </div>
                                                        {!isFirst && (
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleStageParallel(stage.code)}
                                                                className={`mt-0.5 text-[10px] font-medium transition-colors ${dl.is_parallel ? 'text-amber-600 hover:text-amber-700' : 'text-gray-400 hover:text-gray-600'}`}
                                                            >
                                                                {dl.is_parallel ? '⇄ Sequential' : '⇄ Parallel'}
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Date range picker */}
                                                    <div className="shrink-0">
                                                        <VFDateRangePicker
                                                            startDate={dl.start_date}
                                                            endDate={dl.end_date}
                                                            onRangeChange={(start, end) => {
                                                                updateStageDeadline(stage.code, 'start_date', start);
                                                                updateStageDeadline(stage.code, 'end_date', end);
                                                            }}
                                                            minDate={stageMinDate}
                                                            title={`${stage.name} date range`}
                                                            compact
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                                {showStageTimeline && (
                                    <p className="mt-2 text-[11px] text-gray-400">
                                        Stages are sequential by default — each stage starts after the previous one ends. Toggle "⇄ Parallel" to allow overlapping dates.
                                    </p>
                                )}
                            </div>

                            {/* EBITDA Fields (non-mandatory) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">EBITDA (Optional)</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Investor EBITDA Value</label>
                                        <input
                                            type="number"
                                            value={formData.ebitda_investor_value}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, ebitda_investor_value: e.target.value }))}
                                            className={inputClass}
                                            placeholder="e.g. 5000000"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Investor EBITDA Multiple</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={formData.ebitda_investor_times}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, ebitda_investor_times: e.target.value }))}
                                            className={inputClass}
                                            placeholder="e.g. 8.5x"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Target EBITDA Value</label>
                                        <input
                                            type="number"
                                            value={formData.ebitda_target_value}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, ebitda_target_value: e.target.value }))}
                                            className={inputClass}
                                            placeholder="e.g. 3000000"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Target EBITDA Multiple</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={formData.ebitda_target_times}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, ebitda_target_times: e.target.value }))}
                                            className={inputClass}
                                            placeholder="e.g. 6.0x"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Internal PIC (Assigned Staff)
                                    {!picManuallyEdited && formData.internal_pic.length > 0 && (
                                        <span className="ml-1 text-xs font-normal" style={{ color: '#064771' }}>(auto-filled from profiles)</span>
                                    )}
                                </label>
                                <Dropdown
                                    countries={users}
                                    selected={formData.internal_pic}
                                    onSelect={(selected) => {
                                        setPicManuallyEdited(true);
                                        setFormData(prev => ({ ...prev, internal_pic: (Array.isArray(selected) ? selected : [selected]) as User[] }));
                                    }}
                                    multiSelect={true}
                                    placeholder="Select Staff"
                                />
                            </div>

                            {/* FA Info Section */}
                            <div className="bg-blue-50 p-4 rounded-[3px] space-y-2 text-xs text-blue-800 border border-blue-100">
                                <p className="font-semibold flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    Financial Advisor (FA) Information
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="opacity-70">Investor FA:</span>
                                        <p className="font-medium">{selectedBuyer ? getFANames(selectedBuyer.company_overview?.financial_advisor) : (buyerTBD ? 'TBD' : 'None')}</p>
                                    </div>
                                    <div>
                                        <span className="opacity-70">Target FA:</span>
                                        <p className="font-medium">{selectedSeller ? getFANames(selectedSeller.company_overview?.financial_advisor) : (sellerTBD ? 'TBD' : 'None')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
                    <button
                        onClick={() => (step > 1 ? setStep(step - 1) : onClose())}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-[3px] transition-colors"
                    >
                        {step === 1 ? 'Cancel' : 'Back'}
                    </button>
                    <button
                        onClick={() => {
                            if (step === 1 && !canProceedStep1) {
                                showAlert({ type: 'error', message: `Please select ${step1IsBuyer ? 'an investor' : 'a target'} to proceed` });
                                return;
                            }
                            if (step === 2 && !canProceedStep2) {
                                showAlert({ type: 'error', message: `Please select ${step1IsBuyer ? 'a target' : 'an investor'} or skip for now` });
                                return;
                            }
                            if (step === 2 && !hasAtLeastOneParty) {
                                showAlert({ type: 'error', message: 'At least one party (buyer or seller) must be selected. You cannot skip both.' });
                                return;
                            }
                            if (step < 3) {
                                setStep(step + 1);
                            } else {
                                handleSubmit();
                            }
                        }}
                        disabled={loading}
                        className="px-6 py-2 bg-[#064771] text-white rounded-[3px] hover:bg-[#053a5c] transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Creating...' : step < 3 ? 'Next' : 'Create Deal'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateDealModal;
