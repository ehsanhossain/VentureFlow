/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

import { useState, useEffect, useMemo } from 'react';
import { Calendar } from 'lucide-react';
import { VFDropdown } from '../../../components/VFDropdown';
import api from '../../../config/api';
import { getCachedCurrencies } from '../../../utils/referenceDataCache';
import { showAlert } from '../../../components/Alert';
import { Dropdown } from '../../prospects/components/Dropdown';
import VFDateRangePicker from '../../../components/VFDateRangePicker';
import { Deal } from '../DealPipeline';

interface EditDealModalProps {
    deal: Deal;
    onClose: () => void;
    onUpdated: () => void;
    pipelineView: 'buyer' | 'seller';
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
    const cleaned = value.replace(/,/g, '');
    if (!cleaned) return '';
    const parts = cleaned.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
};

/** Remove commas from formatted string for API submission */
const removeCommas = (value: string): string => value.replace(/,/g, '');

// Generic admin/system account names to exclude from PIC selections
const EXCLUDED_PIC_NAMES = ['admin user', 'staff user', 'admin', 'system'];

const EditDealModal = ({ deal, onClose, onUpdated, pipelineView }: EditDealModalProps) => {
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [systemCurrencies, setSystemCurrencies] = useState<{ id: number; currency_code: string }[]>([]);
    const [stages, setStages] = useState<{ code: string; name: string }[]>([]);
    const [showStageTimeline, setShowStageTimeline] = useState(false);

    // Pre-populate stage deadlines from existing deal data (ALL deadlines, including completed)
    const [stageDeadlines, setStageDeadlines] = useState<Record<string, { start_date: string; end_date: string; is_parallel: boolean }>>(() => {
        const map: Record<string, { start_date: string; end_date: string; is_parallel: boolean }> = {};
        if (deal.stage_deadlines) {
            deal.stage_deadlines.forEach((dl: any) => {
                map[dl.stage_code] = {
                    start_date: dl.start_date?.split('T')[0] || '',
                    end_date: dl.end_date?.split('T')[0] || '',
                    is_parallel: dl.is_parallel || false,
                };
            });
        }
        return map;
    });

    // Track which stage deadlines are completed (read-only past stages)
    const completedStageCodes = useMemo(() => {
        const set = new Set<string>();
        if (deal.stage_deadlines) {
            deal.stage_deadlines.forEach((dl: any) => {
                if (dl.is_completed) set.add(dl.stage_code);
            });
        }
        return set;
    }, [deal.stage_deadlines]);

    // Initialize form data from the existing deal
    const [formData, setFormData] = useState({
        name: deal.name || '',
        deal_type: deal.deal_type || 'acquisition',
        investment_condition: deal.investment_condition || '',
        ticket_size: deal.ticket_size ? formatWithCommas(String(deal.ticket_size)) : '',
        estimated_ev_currency: deal.estimated_ev_currency || 'USD',

        ebitda_investor_value: (deal as any).ebitda_investor_value ? formatWithCommas(String((deal as any).ebitda_investor_value)) : '',
        ebitda_investor_times: (deal as any).ebitda_investor_times ?? '',
        ebitda_target_value: (deal as any).ebitda_target_value ? formatWithCommas(String((deal as any).ebitda_target_value)) : '',
        ebitda_target_times: (deal as any).ebitda_target_times ?? '',
        internal_pic: [] as User[],
        stage_code: deal.stage_code || '',
    });

    // Fetch users for PIC selection
    useEffect(() => {
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
                    .filter((u: User) => !EXCLUDED_PIC_NAMES.includes(u.name.toLowerCase().trim()))
                );
            } catch {
                console.error('Failed to fetch users');
            }
        };
        fetchUsers();
    }, []);

    // Fetch currencies
    useEffect(() => {
        getCachedCurrencies().then(data => {
            setSystemCurrencies(data);
        });
    }, []);

    // Fetch pipeline stages for the stage timeline
    useEffect(() => {
        const fetchStages = async () => {
            try {
                const resp = await api.get('/api/pipeline-stages', { params: { type: pipelineView } });
                const stageData = resp.data?.stages || resp.data || [];
                setStages(stageData.map((s: { code: string; name: string }) => ({ code: s.code, name: s.name })));
            } catch {
                // Silent fail — stages just won't appear
            }
        };
        fetchStages();
    }, [pipelineView]);

    // Show ALL stages in timeline (past completed + current + future)
    const timelineStages = useMemo(() => {
        return stages;
    }, [stages]);

    // Find current stage index for visual distinction
    const currentStageIdx = useMemo(() => {
        if (!deal.stage_code || stages.length === 0) return -1;
        return stages.findIndex(s => s.code === deal.stage_code);
    }, [deal.stage_code, stages]);

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

    // Load existing internal_pic from deal (fetched from API)
    useEffect(() => {
        const loadDealPIC = async () => {
            try {
                const response = await api.get(`/api/deals/${deal.id}`);
                const dealData = response.data?.deal || response.data;
                const internalPic = dealData?.internal_pic;
                if (Array.isArray(internalPic) && internalPic.length > 0) {
                    setFormData(prev => ({
                        ...prev,
                        internal_pic: internalPic.map((p: { id: number; name: string }) => ({
                            id: p.id,
                            name: p.name,
                            flagSrc: '',
                            status: 'registered' as const,
                        })),
                    }));
                }
            } catch {
                // Silent fail — PICs will just be empty
            }
        };
        loadDealPIC();
    }, [deal.id]);

    const handleSubmit = async () => {
        if (!formData.name) {
            showAlert({ type: 'error', message: 'Deal name is required' });
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
            await api.patch(`/api/deals/${deal.id}`, {
                name: formData.name,
                deal_type: formData.deal_type,
                investment_condition: formData.investment_condition || null,
                ticket_size: removeCommas(formData.ticket_size) || null,
                estimated_ev_currency: formData.estimated_ev_currency,

                stage_code: formData.stage_code || undefined,
                ebitda_investor_value: removeCommas(formData.ebitda_investor_value) || null,
                ebitda_investor_times: formData.ebitda_investor_times || null,
                ebitda_target_value: removeCommas(formData.ebitda_target_value) || null,
                ebitda_target_times: formData.ebitda_target_times || null,
                internal_pic: formData.internal_pic.map(p => ({ id: p.id, name: p.name })),
                stage_deadlines: deadlinesPayload.length > 0 ? deadlinesPayload : undefined,
            });
            showAlert({ type: 'success', message: 'Deal updated successfully!' });
            onUpdated();
        } catch {
            showAlert({ type: 'error', message: 'Failed to update deal' });
        } finally {
            setLoading(false);
        }
    };

    // Buyer/Seller display info
    const buyerName = deal.buyer?.company_overview?.reg_name || (deal.buyer_id ? 'Investor' : null);
    const sellerName = deal.seller?.company_overview?.reg_name || (deal.seller_id ? 'Target' : null);

    const inputClass = "w-full min-h-[44px] px-4 py-2.5 border border-gray-300 rounded-[3px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm";

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-[3px] shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h2 className="text-lg font-medium text-gray-900">Edit Deal</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-[3px] transition-colors" title="Close modal" aria-label="Close modal">
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[65vh] scrollbar-premium space-y-6">
                    {/* Read-only Parties */}
                    <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-[3px] border border-gray-200">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                                style={{ backgroundColor: '#F2B200', color: '#3E2C06' }}>
                                {buyerName ? buyerName.substring(0, 2).toUpperCase() : 'TB'}
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs text-gray-400 leading-4">Investor</p>
                                <p className="text-sm font-medium text-gray-900 truncate">{buyerName || 'TBD'}</p>
                            </div>
                        </div>
                        <div className="text-xs text-gray-400 px-2">↔</div>
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
                                style={{ backgroundColor: '#030042' }}>
                                {sellerName ? sellerName.substring(0, 2).toUpperCase() : 'TB'}
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs text-gray-400 leading-4">Target</p>
                                <p className="text-sm font-medium text-gray-900 truncate">{sellerName || 'TBD'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Row 1: Deal Type + Investment Condition side-by-side */}
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label htmlFor="edit-deal-type" className="block text-sm font-medium text-gray-700 mb-2.5">Deal Type</label>
                            <VFDropdown
                                options={DEAL_TYPES.map(dt => ({ value: dt.value, label: pipelineView === 'seller' ? dt.sellerLabel : dt.buyerLabel }))}
                                value={formData.deal_type}
                                onChange={(val) => setFormData(prev => ({ ...prev, deal_type: val as string }))}
                                searchable={false}
                                placeholder="Select Deal Type"
                            />
                        </div>
                        <div className="flex-1">
                            <label htmlFor="edit-investment-condition" className="block text-sm font-medium text-gray-700 mb-2.5">Investment Condition</label>
                            <VFDropdown
                                options={INVESTMENT_CONDITIONS}
                                value={formData.investment_condition || null}
                                onChange={(val) => setFormData(prev => ({ ...prev, investment_condition: (val as string) || '' }))}
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
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            className={inputClass}
                            placeholder="e.g., Buyer Corp – Seller Inc"
                        />
                    </div>

                    {/* Row 3: Transaction Size + Deal Stage side-by-side */}
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2.5">Transaction Size</label>
                            <div className="flex gap-3 items-center">
                                <input
                                    type="text"
                                    value={formData.ticket_size}
                                    onChange={(e) => {
                                        const raw = e.target.value.replace(/[^0-9.,]/g, '');
                                        setFormData(prev => ({ ...prev, ticket_size: formatWithCommas(removeCommas(raw)) }));
                                    }}
                                    className="flex-1 min-h-[44px] px-4 py-2.5 border border-gray-300 rounded-[3px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    placeholder="80,244,360"
                                />
                                <div className="w-[100px]">
                                    <VFDropdown
                                        options={systemCurrencies.map(c => ({ value: c.currency_code, label: c.currency_code }))}
                                        value={formData.estimated_ev_currency}
                                        onChange={(val) => setFormData(prev => ({ ...prev, estimated_ev_currency: val as string }))}
                                        searchable={false}
                                        placeholder="USD"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex-1">
                            <label htmlFor="edit-deal-stage" className="block text-sm font-medium text-gray-700 mb-2.5">Deal Stage</label>
                            <VFDropdown
                                options={stages.map(s => ({ value: s.code, label: s.name }))}
                                value={formData.stage_code}
                                onChange={(val) => setFormData(prev => ({ ...prev, stage_code: val as string }))}
                                searchable={false}
                                placeholder="Select Stage"
                            />
                        </div>
                    </div>


                    {/* Row 5: Target Close Date + Set Stage Timeline */}
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

                    {/* ── Stage Timeline ── */}
                    {showStageTimeline && (
                        <div className="border border-gray-200 rounded-[3px] overflow-hidden">
                            {timelineStages.map((stage, idx) => {
                                const dl = stageDeadlines[stage.code] || { start_date: '', end_date: '', is_parallel: false };
                                const isFirst = idx === 0;
                                const isCompleted = completedStageCodes.has(stage.code);
                                const isCurrent = idx === currentStageIdx;
                                const stageMinDate = getStageMinDate(idx);
                                const letterCode = String.fromCharCode(65 + idx);
                                const hasDates = dl.start_date && dl.end_date;

                                return (
                                    <div key={stage.code} className={`flex items-center gap-3 px-4 py-3 ${!isFirst ? 'border-t border-gray-100' : ''} ${
                                        isCompleted ? 'bg-gray-50/60 opacity-75' :
                                        isCurrent ? 'bg-blue-50/40 border-l-2 border-l-[#064771]' :
                                        hasDates ? 'bg-blue-50/30' : ''
                                    }`}>
                                        {/* Stage indicator */}
                                        <div className="flex flex-col items-center gap-0.5 min-w-[32px]">
                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                                                isCompleted ? 'bg-emerald-500 text-white' :
                                                hasDates ? 'bg-[#064771] text-white' :
                                                'bg-[#dae8f0] text-[#064771]'
                                            }`}>
                                                {isCompleted ? '✓' : letterCode}
                                            </div>
                                            {idx < timelineStages.length - 1 && (
                                                <div className={`w-px h-3 ${isCompleted ? 'bg-emerald-300' : 'bg-gray-300'}`} />
                                            )}
                                        </div>

                                        {/* Stage name + status */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <p className={`text-sm font-medium truncate ${isCompleted ? 'text-gray-500' : 'text-gray-900'}`}>{stage.name}</p>
                                                {isCompleted && (
                                                    <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200 whitespace-nowrap">✓ Completed</span>
                                                )}
                                                {isCurrent && (
                                                    <span className="text-[9px] font-semibold text-[#064771] bg-blue-50 px-1.5 py-0.5 rounded-full border border-blue-200 whitespace-nowrap">Current</span>
                                                )}
                                                {!isCompleted && dl.is_parallel && (
                                                    <span className="text-[9px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200 whitespace-nowrap">∥ Parallel</span>
                                                )}
                                            </div>
                                            {/* Show completed date range as read-only text */}
                                            {isCompleted && dl.start_date && dl.end_date && (
                                                <p className="text-[10px] text-gray-400 mt-0.5">
                                                    {new Date(dl.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(dl.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </p>
                                            )}
                                            {!isCompleted && !isFirst && (
                                                <button
                                                    type="button"
                                                    onClick={() => toggleStageParallel(stage.code)}
                                                    className={`mt-0.5 text-[10px] font-medium transition-colors ${dl.is_parallel ? 'text-amber-600 hover:text-amber-700' : 'text-gray-400 hover:text-gray-600'}`}
                                                >
                                                    {dl.is_parallel ? 'Switch to Sequential' : 'Switch to Parallel'}
                                                </button>
                                            )}
                                        </div>

                                        {/* Date range picker (only for non-completed stages) */}
                                        <div className="shrink-0">
                                            {isCompleted ? (
                                                <span className="text-[10px] text-gray-400 italic">Locked</span>
                                            ) : (
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
                                            )}
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
                                        setFormData(prev => ({ ...prev, ebitda_investor_value: formatWithCommas(removeCommas(raw)) }));
                                    }}
                                    className={`flex-1 ${inputClass}`}
                                    placeholder="Value (e.g. 5,000,000)"
                                />
                                <input
                                    type="text"
                                    value={formData.ebitda_investor_times}
                                    onChange={(e) => setFormData(prev => ({ ...prev, ebitda_investor_times: e.target.value }))}
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
                                        setFormData(prev => ({ ...prev, ebitda_target_value: formatWithCommas(removeCommas(raw)) }));
                                    }}
                                    className={`flex-1 ${inputClass}`}
                                    placeholder="Value (e.g. 3,000,000)"
                                />
                                <input
                                    type="text"
                                    value={formData.ebitda_target_times}
                                    onChange={(e) => setFormData(prev => ({ ...prev, ebitda_target_times: e.target.value }))}
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
                                    const faRaw = deal.buyer?.company_overview?.financial_advisor;
                                    if (!faRaw) return <p className="text-sm text-gray-400">{!deal.buyer_id ? 'TBD' : 'None'}</p>;
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
                                    const faRaw = deal.seller?.company_overview?.financial_advisor;
                                    if (!faRaw) return <p className="text-sm text-gray-400">{!deal.seller_id ? 'TBD' : 'None'}</p>;
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

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-[3px] border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-6 py-2 bg-[#064771] text-white text-base rounded-[3px] hover:bg-[#053a5c] transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditDealModal;
