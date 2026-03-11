/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

import { useState, useEffect, useMemo } from 'react';
import { ChevronDown, X } from 'lucide-react';
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

    // Pre-populate stage deadlines from existing deal data
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

    // Initialize form data from the existing deal
    const [formData, setFormData] = useState({
        name: deal.name || '',
        deal_type: deal.deal_type || 'acquisition',
        investment_condition: deal.investment_condition || '',
        ticket_size: deal.ticket_size ? formatWithCommas(String(deal.ticket_size)) : '',
        estimated_ev_currency: deal.estimated_ev_currency || 'USD',
        priority: deal.priority || 'medium',
        possibility: deal.possibility || 'Medium',
        ebitda_investor_value: (deal as any).ebitda_investor_value ?? '',
        ebitda_investor_times: (deal as any).ebitda_investor_times ?? '',
        ebitda_target_value: (deal as any).ebitda_target_value ?? '',
        ebitda_target_times: (deal as any).ebitda_target_times ?? '',
        internal_pic: [] as User[],
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
                const resp = await api.get('/api/pipeline-stages', { params: { pipeline_type: pipelineView } });
                const stageData = resp.data?.stages || resp.data || [];
                setStages(stageData.map((s: { code: string; name: string }) => ({ code: s.code, name: s.name })));
            } catch {
                // Silent fail — stages just won't appear
            }
        };
        fetchStages();
    }, [pipelineView]);

    // Compute which stages to show in timeline (from deal's current stage through last)
    const timelineStages = useMemo(() => {
        if (!deal.stage_code || stages.length === 0) return stages;
        const currentIdx = stages.findIndex(s => s.code === deal.stage_code);
        if (currentIdx === -1) return stages;
        return stages.slice(currentIdx);
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
                priority: formData.priority,
                possibility: formData.possibility,
                ebitda_investor_value: formData.ebitda_investor_value || null,
                ebitda_investor_times: formData.ebitda_investor_times || null,
                ebitda_target_value: formData.ebitda_target_value || null,
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

    const inputClass = "w-full px-4 py-2 border border-gray-300 rounded-[3px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm";
    const selectClass = "w-full px-4 py-2 pr-10 border border-gray-300 rounded-[3px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm appearance-none bg-white";

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-[3px] shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h2 className="text-lg font-medium text-gray-900">Edit Deal</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-[3px] transition-colors" title="Close modal" aria-label="Close modal">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[65vh] scrollbar-premium space-y-4">
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

                    {/* Deal Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Deal Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            className={inputClass}
                            placeholder="e.g., Buyer Corp – Seller Inc"
                        />
                    </div>

                    {/* Deal Type */}
                    <div>
                        <label htmlFor="edit-deal-type" className="block text-sm font-medium text-gray-700 mb-1">Deal Type</label>
                        <div className="relative">
                            <select
                                id="edit-deal-type"
                                value={formData.deal_type}
                                onChange={(e) => setFormData(prev => ({ ...prev, deal_type: e.target.value }))}
                                className={selectClass}
                            >
                                {DEAL_TYPES.map((dt) => (
                                    <option key={dt.value} value={dt.value}>
                                        {pipelineView === 'seller' ? dt.sellerLabel : dt.buyerLabel}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Investment Condition */}
                    <div>
                        <label htmlFor="edit-investment-condition" className="block text-sm font-medium text-gray-700 mb-1">Investment Condition</label>
                        <div className="relative">
                            <select
                                id="edit-investment-condition"
                                value={formData.investment_condition}
                                onChange={(e) => setFormData(prev => ({ ...prev, investment_condition: e.target.value }))}
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

                    {/* Transaction Size + Currency & Probability */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Size</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={formData.ticket_size}
                                    onChange={(e) => {
                                        const raw = e.target.value.replace(/[^0-9.,]/g, '');
                                        setFormData(prev => ({ ...prev, ticket_size: formatWithCommas(removeCommas(raw)) }));
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-[3px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    placeholder="Amount"
                                />
                                <div className="relative">
                                    <select
                                        id="edit-currency"
                                        aria-label="Currency"
                                        value={formData.estimated_ev_currency}
                                        onChange={(e) => setFormData(prev => ({ ...prev, estimated_ev_currency: e.target.value }))}
                                        className="w-[88px] appearance-none px-2 pr-7 py-2 border border-gray-300 rounded-[3px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm cursor-pointer"
                                    >
                                        {systemCurrencies.map(c => <option key={c.id} value={c.currency_code}>{c.currency_code}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="edit-probability" className="block text-sm font-medium text-gray-700 mb-1">Probability</label>
                            <div className="relative">
                                <select
                                    id="edit-probability"
                                    value={formData.possibility}
                                    onChange={(e) => setFormData(prev => ({ ...prev, possibility: e.target.value }))}
                                    className={selectClass}
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Priority + Target Close Date */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="edit-priority" className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                            <div className="relative">
                                <select
                                    id="edit-priority"
                                    value={formData.priority}
                                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as 'low' | 'medium' | 'high' }))}
                                    className={selectClass}
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
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
                                                        <span className="text-[9px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200 whitespace-nowrap">|| Parallel</span>
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
                                Stages are sequential by default. Toggle "Switch to Parallel" to allow overlapping dates.
                            </p>
                        )}
                    </div>

                    {/* EBITDA Fields (optional) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">EBITDA (Optional)</label>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Investor EBITDA Value</label>
                                <input
                                    type="number"
                                    value={formData.ebitda_investor_value}
                                    onChange={(e) => setFormData(prev => ({ ...prev, ebitda_investor_value: e.target.value }))}
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
                                    onChange={(e) => setFormData(prev => ({ ...prev, ebitda_investor_times: e.target.value }))}
                                    className={inputClass}
                                    placeholder="e.g. 8.5x"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Target EBITDA Value</label>
                                <input
                                    type="number"
                                    value={formData.ebitda_target_value}
                                    onChange={(e) => setFormData(prev => ({ ...prev, ebitda_target_value: e.target.value }))}
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
                                    onChange={(e) => setFormData(prev => ({ ...prev, ebitda_target_times: e.target.value }))}
                                    className={inputClass}
                                    placeholder="e.g. 6.0x"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Internal PIC */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Internal PIC (Assigned Staff)</label>
                        <Dropdown
                            countries={users}
                            selected={formData.internal_pic}
                            onSelect={(selected) => {
                                setFormData(prev => ({ ...prev, internal_pic: (Array.isArray(selected) ? selected : [selected]) as User[] }));
                            }}
                            multiSelect={true}
                            placeholder="Select Staff"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-[3px] transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-6 py-2 bg-[#064771] text-white rounded-[3px] hover:bg-[#053a5c] transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditDealModal;
