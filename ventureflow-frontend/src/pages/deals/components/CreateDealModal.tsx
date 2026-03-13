/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

import { useState, useEffect, useMemo } from 'react';
import { Steps, ConfigProvider } from 'antd';
import { Calendar } from 'lucide-react';
import InvestorIcon from '../../../assets/icons/prospects/addinvestor.svg';
import TargetIcon from '../../../assets/icons/prospects/addtarget.svg';
import DealPipelineIcon from '../../../assets/icons/deals-pipeline.svg';
import { VFDropdown } from '../../../components/VFDropdown';
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
            setFormData((prev) => {
                const dt = DEAL_TYPES.find(r => r.value === prev.deal_type);
                const label = defaultView === 'buyer' ? dt?.buyerLabel : dt?.sellerLabel;
                return { ...prev, name: `${buyerName} — ${label} → ${sellerName}` };
            });
        } else if (sellerTBD) {
            setFormData((prev) => {
                const dt = DEAL_TYPES.find(r => r.value === prev.deal_type);
                const label = defaultView === 'buyer' ? dt?.buyerLabel : dt?.sellerLabel;
                return { ...prev, name: `${buyerName} — ${label} → TBD` };
            });
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
                setFormData((prev) => {
                    const dt = DEAL_TYPES.find(r => r.value === prev.deal_type);
                    const label = defaultView === 'buyer' ? dt?.buyerLabel : dt?.sellerLabel;
                    return { ...prev, name: `${buyerName} — ${label} → ${sellerName}` };
                });
        } else if (buyerTBD) {
            setFormData((prev) => {
                const dt = DEAL_TYPES.find(r => r.value === prev.deal_type);
                const label = defaultView === 'buyer' ? dt?.buyerLabel : dt?.sellerLabel;
                return { ...prev, name: `TBD — ${label} → ${sellerName}` };
            });
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
            setFormData((prev) => {
                const dt = DEAL_TYPES.find(r => r.value === prev.deal_type);
                const label = defaultView === 'buyer' ? dt?.buyerLabel : dt?.sellerLabel;
                return { ...prev, name: `TBD — ${label} → ${sellerName}` };
            });
        }
    };

    const handleSkipSeller = () => {
        setSellerTBD(true);
        setSelectedSeller(null);
        setFormData((prev) => ({ ...prev, seller_id: 0 }));
        // Auto-name with TBD if buyer exists
        if (selectedBuyer) {
            const buyerName = selectedBuyer.company_overview?.reg_name || 'Investor';
            setFormData((prev) => {
                const dt = DEAL_TYPES.find(r => r.value === prev.deal_type);
                const label = defaultView === 'buyer' ? dt?.buyerLabel : dt?.sellerLabel;
                return { ...prev, name: `${buyerName} — ${label} → TBD` };
            });
        }
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
                ebitda_investor_value: removeCommas(formData.ebitda_investor_value) || null,
                ebitda_investor_times: formData.ebitda_investor_times || null,
                ebitda_target_value: removeCommas(formData.ebitda_target_value) || null,
                ebitda_target_times: formData.ebitda_target_times || null,
                investment_condition: formData.investment_condition || null,
                internal_pic: formData.internal_pic.map(p => ({ id: p.id, name: p.name })),
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
    const inputClass = "w-full min-h-[44px] px-4 py-2.5 border border-gray-300 rounded-[3px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm";
    const buttonItemClass = (isSelected: boolean) =>
        `w-full flex items-center gap-3 px-4 py-3 rounded-[3px] border transition-colors ${isSelected
            ? ''
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
                <div className="px-6 py-4 border-b bg-gray-50">
                    <ConfigProvider theme={{
                        token: { colorPrimary: '#064771' },
                        components: {
                            Steps: {
                                iconSize: 36,
                                iconFontSize: 16,
                            }
                        }
                    }}>
                        <Steps
                            current={step - 1}
                            items={[
                                {
                                    title: step1Label,
                                    icon: <div style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: step >= 1 ? '#064771' : '#e5e7eb', transition: 'background 0.3s' }}>
                                        <img src={step1IsBuyer ? InvestorIcon : TargetIcon} alt="" style={{ width: 18, height: 18, filter: step >= 1 ? 'brightness(0) invert(1)' : 'none' }} />
                                    </div>,
                                },
                                {
                                    title: step2Label,
                                    icon: <div style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: step >= 2 ? '#064771' : '#e5e7eb', transition: 'background 0.3s' }}>
                                        <img src={step1IsBuyer ? TargetIcon : InvestorIcon} alt="" style={{ width: 18, height: 18, filter: step >= 2 ? 'brightness(0) invert(1)' : 'none' }} />
                                    </div>,
                                },
                                {
                                    title: 'Deal Details',
                                    icon: <div style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: step >= 3 ? '#064771' : '#e5e7eb', transition: 'background 0.3s' }}>
                                        <img src={DealPipelineIcon} alt="" style={{ width: 18, height: 18, filter: step >= 3 ? 'brightness(0) invert(1)' : 'none' }} />
                                    </div>,
                                },
                            ]}
                        />
                    </ConfigProvider>
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
                                                className={buttonItemClass(selectedBuyer?.id === buyer.id)}
                                                style={selectedBuyer?.id === buyer.id ? { borderColor: '#F2B200', backgroundColor: '#FFFBEB' } : {}}
                                            >
                                                <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold" style={{ backgroundColor: '#F2B200', color: '#3E2C06' }}>
                                                    {buyer.company_overview?.reg_name?.substring(0, 2).toUpperCase() || 'BU'}
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
                                                className={buttonItemClass(selectedSeller?.id === seller.id)}
                                                style={selectedSeller?.id === seller.id ? { borderColor: '#030042', backgroundColor: '#F0F0FF' } : {}}
                                            >
                                                <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold" style={{ backgroundColor: '#030042', color: '#FFFFFF' }}>
                                                    {seller.company_overview?.reg_name?.substring(0, 2).toUpperCase() || 'TA'}
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
                                                className={buttonItemClass(selectedSeller?.id === seller.id)}
                                                style={selectedSeller?.id === seller.id ? { borderColor: '#030042', backgroundColor: '#F0F0FF' } : {}}
                                            >
                                                <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold" style={{ backgroundColor: '#030042', color: '#FFFFFF' }}>
                                                    {seller.company_overview?.reg_name?.substring(0, 2).toUpperCase() || 'TA'}
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
                                        className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-[3px] border-2 border-dashed transition-colors"
                                        style={sellerTBD
                                            ? { borderColor: '#030042', backgroundColor: '#F0F0FF', color: '#030042' }
                                            : { borderColor: '#d1d5db', color: '#6b7280' }
                                        }
                                        onMouseEnter={(e) => { if (!sellerTBD) { e.currentTarget.style.borderColor = '#030042'; e.currentTarget.style.backgroundColor = '#F0F0FF'; e.currentTarget.style.color = '#030042'; } }}
                                        onMouseLeave={(e) => { if (!sellerTBD) { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = '#6b7280'; } }}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                        <span className="text-sm font-medium">Skip for now (Target TBD)</span>
                                    </button>
                                    {sellerTBD && (
                                        <p className="mt-2 text-xs text-center" style={{ color: '#030042' }}>
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
                                                className={buttonItemClass(selectedBuyer?.id === buyer.id)}
                                                style={selectedBuyer?.id === buyer.id ? { borderColor: '#F2B200', backgroundColor: '#FFFBEB' } : {}}
                                            >
                                                <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold" style={{ backgroundColor: '#F2B200', color: '#3E2C06' }}>
                                                    {buyer.company_overview?.reg_name?.substring(0, 2).toUpperCase() || 'BU'}
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
                                        className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-[3px] border-2 border-dashed transition-colors"
                                        style={buyerTBD
                                            ? { borderColor: '#F2B200', backgroundColor: '#FFFBEB', color: '#3E2C06' }
                                            : { borderColor: '#d1d5db', color: '#6b7280' }
                                        }
                                        onMouseEnter={(e) => { if (!buyerTBD) { e.currentTarget.style.borderColor = '#F2B200'; e.currentTarget.style.backgroundColor = '#FFFBEB'; e.currentTarget.style.color = '#3E2C06'; } }}
                                        onMouseLeave={(e) => { if (!buyerTBD) { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = '#6b7280'; } }}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                        <span className="text-sm font-medium">Skip for now (Investor TBD)</span>
                                    </button>
                                    {buyerTBD && (
                                        <p className="mt-2 text-xs text-center" style={{ color: '#92700C' }}>
                                            Deal will be created as a <strong>Seller Mandate</strong> — you can assign an investor later.
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* ===== STEP 3: Deal Details ===== */}
                    {step === 3 && (
                        <div className="space-y-6">
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

                            {/* Row 1: Deal Type + Investment Condition side-by-side */}
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label htmlFor="deal-type" className="block text-sm font-medium text-gray-700 mb-2.5">Deal Type</label>
                                    <VFDropdown
                                        options={DEAL_TYPES.map(dt => ({ value: dt.value, label: defaultView === 'seller' ? dt.sellerLabel : dt.buyerLabel }))}
                                        value={formData.deal_type}
                                        onChange={(val) => {
                                            const newDealType = val as string;
                                            setFormData((prev) => {
                                                const dt = DEAL_TYPES.find(r => r.value === newDealType);
                                                const label = defaultView === 'buyer' ? dt?.buyerLabel : dt?.sellerLabel;
                                                const bName = selectedBuyer?.company_overview?.reg_name || (buyerTBD ? 'TBD' : '');
                                                const sName = selectedSeller?.company_overview?.reg_name || (sellerTBD ? 'TBD' : '');
                                                const newName = bName && sName ? `${bName} — ${label} → ${sName}` : prev.name;
                                                return { ...prev, deal_type: newDealType, name: newName };
                                            });
                                        }}
                                        searchable={false}
                                        placeholder="Select Deal Type"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label htmlFor="deal-investment-condition" className="block text-sm font-medium text-gray-700 mb-2.5">Investment Condition</label>
                                    <VFDropdown
                                        options={INVESTMENT_CONDITIONS}
                                        value={formData.investment_condition || null}
                                        onChange={(val) => setFormData((prev) => ({ ...prev, investment_condition: (val as string) || '' }))}
                                        searchable={false}
                                        placeholder="Select Condition"
                                    />
                                </div>
                            </div>

                            {/* Row 2: Deal Name full-width */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2.5">Deal Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                                    className={inputClass}
                                    placeholder={(() => {
                                        const bName = selectedBuyer?.company_overview?.reg_name || '';
                                        const sName = selectedSeller?.company_overview?.reg_name || '';
                                        const dt = DEAL_TYPES.find(r => r.value === formData.deal_type);
                                        const label = defaultView === 'buyer' ? dt?.buyerLabel : dt?.sellerLabel;
                                        if (bName && sName) return `${bName} — ${label} → ${sName}`;
                                        return 'e.g., Buyer Corp – Seller Inc';
                                    })()}
                                />
                            </div>

                            {/* Row 3: Transaction Size + Deal Stage side-by-side */}
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-2.5">
                                        Transaction Size
                                        {selectedSeller && !ticketSizeManuallyEdited && formData.ticket_size && (
                                            <span className="ml-1 text-xs font-normal" style={{ color: '#064771' }}>(auto-filled from target)</span>
                                        )}
                                    </label>
                                    <div className="flex gap-3 items-center">
                                        <input
                                            type="text"
                                            value={formData.ticket_size}
                                            onChange={(e) => {
                                                setTicketSizeManuallyEdited(true);
                                                const raw = e.target.value.replace(/[^0-9.,]/g, '');
                                                setFormData((prev) => ({ ...prev, ticket_size: formatWithCommas(removeCommas(raw)) }));
                                            }}
                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-[3px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                            placeholder="80,244,360"
                                        />
                                        <div className="w-[100px]">
                                            <VFDropdown
                                                options={systemCurrencies.map(c => ({ value: c.currency_code, label: c.currency_code }))}
                                                value={formData.estimated_ev_currency}
                                                onChange={(val) => setFormData((prev) => ({ ...prev, estimated_ev_currency: val as string }))}
                                                searchable={false}
                                                placeholder="USD"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <label htmlFor="deal-stage" className="block text-sm font-medium text-gray-700 mb-2.5">Deal Stage</label>
                                    <VFDropdown
                                        options={stages.map(s => ({ value: s.code, label: s.name }))}
                                        value={formData.stage_code}
                                        onChange={(val) => setFormData((prev) => ({ ...prev, stage_code: val as string }))}
                                        searchable={false}
                                        placeholder="Select Stage"
                                    />
                                </div>
                            </div>

                            {/* Row 4: Target Close Date + Set Stage Timeline */}
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-gray-700">Target Close Date</label>
                                    <p className="text-xs text-gray-400 italic">
                                        {(() => {
                                            const filledDeadlines = Object.values(stageDeadlines).filter(v => v.start_date && v.end_date);
                                            if (filledDeadlines.length === 0) return 'Auto-calculated from stage deadlines';
                                            const allStarts = filledDeadlines.map(v => new Date(v.start_date).getTime());
                                            const allEnds = filledDeadlines.map(v => new Date(v.end_date).getTime());
                                            const earliest = new Date(Math.min(...allStarts));
                                            const latest = new Date(Math.max(...allEnds));
                                            const diffMs = latest.getTime() - earliest.getTime();
                                            const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                                            if (diffDays < 30) return `~${diffDays} day${diffDays !== 1 ? 's' : ''} (${earliest.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${latest.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})`;
                                            if (diffDays < 365) {
                                                const months = Math.round(diffDays / 30);
                                                return `~${months} month${months !== 1 ? 's' : ''} (${earliest.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${latest.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})`;
                                            }
                                            const years = (diffDays / 365).toFixed(1);
                                            return `~${years} year${parseFloat(years) !== 1 ? 's' : ''} (${earliest.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${latest.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})`;
                                        })()}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowStageTimeline(!showStageTimeline)}
                                    className="flex items-center gap-2 px-2 py-1 rounded-[3px] bg-[#f3f4f5] text-sm font-medium text-[#064771] hover:bg-gray-200 transition-colors"
                                >
                                    <Calendar className="w-4 h-4" />
                                    Set Stage Timeline
                                </button>
                            </div>

                            {/* ── Stage Timeline (always visible) ── */}
                            {showStageTimeline && (
                                <div className="border border-gray-200 rounded-[3px] overflow-hidden">
                                    {timelineStages.map((stage, idx) => {
                                        const dl = stageDeadlines[stage.code] || { start_date: '', end_date: '', is_parallel: false };
                                        const isFirst = idx === 0;
                                        const stageMinDate = getStageMinDate(idx);
                                        const letterCode = String.fromCharCode(65 + idx);
                                        const hasDates = dl.start_date && dl.end_date;

                                        return (
                                            <div
                                                key={stage.code}
                                                className={`flex items-center gap-3 px-4 py-3 ${!isFirst ? 'border-t border-gray-100' : ''} ${hasDates ? 'bg-blue-50/30' : ''}`}
                                            >
                                                {/* Left: Circle + Vertical connector */}
                                                <div className="flex flex-col items-center gap-0.5 min-w-[32px]">
                                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                                                        hasDates ? 'bg-[#064771] text-white' : 'bg-[#dae8f0] text-[#064771]'
                                                    }`}>
                                                        {letterCode}
                                                    </div>
                                                    {idx < timelineStages.length - 1 && (
                                                        <div className="w-px h-3 bg-gray-300" />
                                                    )}
                                                </div>

                                                {/* Center: Stage name + parallel toggle */}
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
                                                            {dl.is_parallel ? 'Switch to Sequential' : 'Switch to Parallel'}
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Right: Always show date picker */}
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

                            {/* EBITDA Details with separator */}
                            <div className="space-y-3.5">
                                <div>
                                    <p className="text-sm font-medium text-gray-700">EBITDA Details</p>
                                    <div className="mt-2 border-t border-dashed border-gray-300" />
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-sm font-medium text-gray-700 w-[64px] shrink-0">Investor</span>
                                    <div className="flex gap-3 flex-1">
                                        <input
                                            type="text"
                                            value={formData.ebitda_investor_value}
                                            onChange={(e) => {
                                                const raw = e.target.value.replace(/[^0-9.,]/g, '');
                                                setFormData((prev) => ({ ...prev, ebitda_investor_value: formatWithCommas(removeCommas(raw)) }));
                                            }}
                                            className={`flex-1 ${inputClass}`}
                                            placeholder="Value (e.g. 5,000,000)"
                                        />
                                        <input
                                            type="text"
                                            value={formData.ebitda_investor_times}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, ebitda_investor_times: e.target.value }))}
                                            className={`flex-1 ${inputClass}`}
                                            placeholder="Multiple (e.g. 8.5x)"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-sm font-medium text-gray-700 w-[64px] shrink-0">Target</span>
                                    <div className="flex gap-3 flex-1">
                                        <input
                                            type="text"
                                            value={formData.ebitda_target_value}
                                            onChange={(e) => {
                                                const raw = e.target.value.replace(/[^0-9.,]/g, '');
                                                setFormData((prev) => ({ ...prev, ebitda_target_value: formatWithCommas(removeCommas(raw)) }));
                                            }}
                                            className={`flex-1 ${inputClass}`}
                                            placeholder="Value (e.g. 3,000,000)"
                                        />
                                        <input
                                            type="text"
                                            value={formData.ebitda_target_times}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, ebitda_target_times: e.target.value }))}
                                            className={`flex-1 ${inputClass}`}
                                            placeholder="Multiple (e.g. 6.5x)"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Internal PIC */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2.5">Internal PIC</label>
                                <Dropdown
                                    countries={users}
                                    selected={formData.internal_pic}
                                    onSelect={(selected) => {
                                        setPicManuallyEdited(true);
                                        setFormData(prev => ({ ...prev, internal_pic: (Array.isArray(selected) ? selected : [selected]) as User[] }));
                                    }}
                                    multiSelect={true}
                                    placeholder="Select Assigned Staff"
                                />
                            </div>

                            {/* Financial Advisor (FA) Section — Avatar layout */}
                            <div>
                                <p className="text-sm font-medium text-gray-700 mb-2.5">Financial Advisor (FA)</p>
                                <div className="flex gap-8">
                                    {/* Investor FA Column */}
                                    <div className="flex-1 space-y-3">
                                        <p className="text-xs text-gray-900/70">Investor FA</p>
                                        {(() => {
                                            const faRaw = selectedBuyer?.company_overview?.financial_advisor;
                                            if (!faRaw) return <p className="text-sm text-gray-400">{buyerTBD ? 'TBD' : 'None'}</p>;
                                            try {
                                                const parsed = typeof faRaw === 'string' ? JSON.parse(faRaw) : faRaw;
                                                if (!Array.isArray(parsed) || parsed.length === 0) return <p className="text-sm text-gray-400">None</p>;
                                                return parsed.map((fa: Record<string, string>, i: number) => {
                                                    const name = fa.name || fa.reg_name || 'Unknown';
                                                    const initials = name.split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase();
                                                    return (
                                                        <div key={i} className="flex items-center gap-2">
                                                            <div className="w-[22px] h-[22px] rounded-full bg-[#064771] text-white flex items-center justify-center text-[9px] font-medium shrink-0">
                                                                {initials}
                                                            </div>
                                                            <span className="text-sm text-gray-900">{name}</span>
                                                        </div>
                                                    );
                                                });
                                            } catch {
                                                return <p className="text-sm text-gray-400">None</p>;
                                            }
                                        })()}
                                    </div>
                                    {/* Target FA Column */}
                                    <div className="flex-1 space-y-3">
                                        <p className="text-xs text-gray-900/70">Target FA</p>
                                        {(() => {
                                            const faRaw = selectedSeller?.company_overview?.financial_advisor;
                                            if (!faRaw) return <p className="text-sm text-gray-400">{sellerTBD ? 'TBD' : 'None'}</p>;
                                            try {
                                                const parsed = typeof faRaw === 'string' ? JSON.parse(faRaw) : faRaw;
                                                if (!Array.isArray(parsed) || parsed.length === 0) return <p className="text-sm text-gray-400">None</p>;
                                                return parsed.map((fa: Record<string, string>, i: number) => {
                                                    const name = fa.name || fa.reg_name || 'Unknown';
                                                    const initials = name.split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase();
                                                    return (
                                                        <div key={i} className="flex items-center gap-2">
                                                            <div className="w-[22px] h-[22px] rounded-full bg-[#064771] text-white flex items-center justify-center text-[9px] font-medium shrink-0">
                                                                {initials}
                                                            </div>
                                                            <span className="text-sm text-gray-900">{name}</span>
                                                        </div>
                                                    );
                                                });
                                            } catch {
                                                return <p className="text-sm text-gray-400">None</p>;
                                            }
                                        })()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
                    <div>
                        {step > 1 && (
                            <button
                                onClick={() => setStep(step - 1)}
                                className="px-4 py-2 rounded-[3px] text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                                Back
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-[3px] border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                        >
                            Cancel
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
                            className="px-6 py-2 rounded-[3px] transition-colors disabled:opacity-50 bg-[#064771] text-white hover:bg-[#053a5c]"
                        >
                            {loading ? 'Creating...' : step < 3 ? 'Next' : 'Create Deal'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateDealModal;
