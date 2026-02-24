/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

import { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Navigate } from 'react-router-dom';
import { AuthContext } from '../../routes/AuthContext';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import api from '../../config/api';
import { getCachedCountries } from '../../utils/referenceDataCache';
import { Country, Dropdown } from '../currency/components/Dropdown';
import { showAlert } from '../../components/Alert';
import { BrandSpinner } from '../../components/BrandSpinner';
import { NotesSection, Note, parseActivityLogs } from '../../components/NotesSection';
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    closestCorners,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import StageColumn from './components/StageColumn';
import DealCard from './components/DealCard';
import CreateDealModal from './components/CreateDealModal';
import DealExpandedPreview from './components/DealExpandedPreview';
import MonetizationConfirmModal from './components/MonetizationConfirmModal';
import FinalSettlementModal from './components/FinalSettlementModal';
import GateBlockedModal from './components/GateBlockedModal';
import DealDeleteModal from './components/DealDeleteModal';
import { getCurrencySymbol, formatCompactNumber } from '../../utils/formatters';
import DataTableSearch from '../../components/table/DataTableSearch';

interface PipelineStage {
    code: string;
    name: string;
    progress: number;
}

type PipelineView = 'buyer' | 'seller';

export interface Deal {
    id: number;
    name: string;
    buyer_id: number | null;
    seller_id: number | null;
    industry: string | null;
    region: string | null;
    estimated_ev_value: number | null;
    estimated_ev_currency: string;
    stage_code: string;
    pipeline_type: 'buyer' | 'seller';
    progress_percent: number;
    priority: 'low' | 'medium' | 'high';
    pic_user_id: number | null;
    target_close_date: string | null;
    status: 'active' | 'on_hold' | 'lost' | 'won';
    ticket_size?: number | string;
    deal_type?: string;
    possibility?: string;
    shareholding_ratio?: string;
    share_ratio?: string;
    comment_count: number;
    attachment_count: number;
    updated_at: string;
    has_new_activity?: boolean;
    onChatClick?: (deal: Deal) => void;
    buyer?: {
        id: number;
        image?: string;
        company_overview?: {
            reg_name: string;
            hq_country?: number;
        };
        investment_critera?: {
            target_countries?: Array<{ id: number; name: string; svg_icon_url?: string }>;
            target_industries?: Array<{ id: number; name: string }>;
        };
    };
    seller?: {
        id: number;
        image?: string;
        company_overview?: {
            reg_name: string;
            hq_country?: number;
        };
        financial_details?: {
            desired_investment?: number;
            maximum_investor_shareholding_percentage?: string;
            ebitda?: number;
        };
    };
    pic?: {
        id: number;
        name: string;
    };
}


interface GroupedDeals {
    [key: string]: {
        code: string;
        name: string;
        progress: number;
        deals: Deal[];
    };
}

const DealPipeline = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const auth = useContext(AuthContext);
    const isPartner = auth?.isPartner;
    const [deals, setDeals] = useState<GroupedDeals>({});
    const [stages, setStages] = useState<PipelineStage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'board' | 'table' | 'lost' | 'won'>('board');
    const [selectedStage, setSelectedStage] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
    const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [countries, setCountries] = useState<Country[]>([]);
    const [selectedCountries, setSelectedCountries] = useState<Country[]>([]);
    const [pipelineView, setPipelineView] = useState<PipelineView>('buyer');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [chatDeal, setChatDeal] = useState<Deal | null>(null);
    const [chatNotes, setChatNotes] = useState<Note[]>([]);
    const [lostDeal, setLostDeal] = useState<Deal | null>(null);
    const [lostReason, setLostReason] = useState('');
    const [showWonCelebration, setShowWonCelebration] = useState<boolean>(false);

    // Monetization modal state
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [monetizationModal, setMonetizationModal] = useState<{ deal: Deal; stageName: string; stageCode: string; monetization: any } | null>(null);

    // Gate blocked modal state
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [gateBlockedModal, setGateBlockedModal] = useState<{ errors: string[]; errorDetails?: any[]; stageName: string; deal?: Deal; stageCode?: string } | null>(null);

    // Delete deal modal state
    const [deleteDeal, setDeleteDeal] = useState<Deal | null>(null);

    // Derive current user name from auth context
    const getCurrentUserName = () => {
        const userData = auth?.user as any;
        if (userData?.employee) {
            return `${userData.employee.first_name} ${userData.employee.last_name}`.trim();
        }
        return userData?.name || 'User';
    };

    // Fetch activity logs when chat drawer opens
    useEffect(() => {
        if (!chatDeal) {
            setChatNotes([]);
            return;
        }
        const fetchChatNotes = async () => {
            try {
                const resp = await api.get('/api/activity-logs', {
                    params: { entity_id: chatDeal.id, entity_type: 'deal' },
                });
                const logs = resp.data?.data || [];
                setChatNotes(parseActivityLogs(logs, getCurrentUserName()));
            } catch {
                setChatNotes([]);
            }
        };
        fetchChatNotes();
    }, [chatDeal?.id]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        })
    );

    useEffect(() => {
        const fetchCountries = async () => {
            try {
                const data = await getCachedCountries();
                const formatted = data.map((country: { id: number; name: string; svg_icon_url?: string }) => ({
                    id: country.id,
                    name: country.name,
                    flagSrc: country.svg_icon_url || '',
                    status: 'registered' as const,
                }));
                setCountries(formatted);
            } catch {
                // Silent fail
            }
        };
        fetchCountries();
    }, []);

    const fetchDeals = async () => {
        try {
            const status = activeTab === 'lost' ? 'lost' : activeTab === 'won' ? 'won' : 'active';
            const response = await api.get('/api/deals', {
                params: {
                    search: searchQuery || undefined,
                    countries: selectedCountries.length > 0 ? selectedCountries.map(c => c.id) : undefined,
                    view: pipelineView,
                    status: status,
                }
            });
            const enhancedGrouped = { ...response.data.grouped };
            // Add chat click handler to each deal
            Object.keys(enhancedGrouped).forEach(stage => {
                enhancedGrouped[stage].deals = enhancedGrouped[stage].deals.map((d: Deal) => ({
                    ...d,
                    onChatClick: (deal: Deal) => setChatDeal(deal),
                    // Mock: randomly add some activity for demo
                    has_new_activity: d.comment_count > 0 && Math.random() > 0.5
                }));
            });
            setDeals(enhancedGrouped);
            setStages(response.data.stages);
        } catch {
            showAlert({ type: 'error', message: 'Failed to fetch deals' });
        }
    };


    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            await fetchDeals();
            setIsLoading(false);
        };
        loadData();
    }, [searchQuery, selectedCountries, pipelineView, activeTab]);

    if (isPartner) {
        return <Navigate to="/" replace />;
    }

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const dealId = Number(active.id);

        for (const stageData of Object.values(deals)) {
            const found = stageData.deals.find((d) => d.id === dealId);
            if (found) {
                setActiveDeal(found);
                break;
            }
        }
    };

    /**
     * Perform a stage transition, optionally with fee confirmation.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const executeStageMove = async (deal: Deal, newStage: string, feeConfirmation?: any) => {
        const targetStage = deals[newStage];
        const stageName = targetStage?.name || newStage;

        // ── Optimistic update FIRST ──
        const oldDeals = { ...deals };
        const updatedDeals = { ...deals };

        if (updatedDeals[deal.stage_code]) {
            updatedDeals[deal.stage_code] = {
                ...updatedDeals[deal.stage_code],
                deals: updatedDeals[deal.stage_code].deals.filter((d) => d.id !== deal.id),
            };
        }

        if (updatedDeals[newStage]) {
            updatedDeals[newStage] = {
                ...updatedDeals[newStage],
                deals: [...updatedDeals[newStage].deals, { ...deal, stage_code: newStage, progress_percent: targetStage?.progress || 0 }],
            };
        }

        setDeals(updatedDeals);

        // ── Server call in background ──
        try {
            await api.patch(`/api/deals/${deal.id}/stage`, {
                stage_code: newStage,
                pipeline_type: pipelineView,
                fee_confirmation: feeConfirmation ?? undefined,
            });
            showAlert({ type: 'success', message: `Moved to ${stageName}` });
        } catch (error: unknown) {
            setDeals(oldDeals);
            const err = error as { response?: { data?: { gate_errors?: string[]; gate_error_details?: any[]; message?: string } } };
            if (err?.response?.data?.gate_errors) {
                setGateBlockedModal({
                    errors: err.response.data.gate_errors,
                    errorDetails: err.response.data.gate_error_details || [],
                    stageName,
                    deal,
                    stageCode: newStage,
                });
            } else {
                showAlert({ type: 'error', message: err?.response?.data?.message || 'Failed to move deal' });
            }
        }
    };

    /**
     * Call stageCheck pre-flight. Returns true if the move can proceed immediately.
     * Returns false if blocked (gate errors shown) or if monetization modal was opened.
     */
    const preflightStageCheck = async (deal: Deal, toStageCode: string, toStageName: string): Promise<boolean> => {
        try {
            const response = await api.get(`/api/deals/${deal.id}/stage-check`, {
                params: { to_stage: toStageCode, pipeline_type: pipelineView },
            });
            const data = response.data;

            if (!data.gate_passed) {
                setGateBlockedModal({
                    errors: data.gate_errors || ['Cannot move to this stage — conditions not met.'],
                    errorDetails: data.gate_error_details || [],
                    stageName: toStageName,
                    deal,
                    stageCode: toStageCode,
                });
                return false;
            }

            if (data.monetization && data.monetization.enabled) {
                // Show monetization confirmation modal instead of moving immediately
                setMonetizationModal({
                    deal,
                    stageName: toStageName,
                    stageCode: toStageCode,
                    monetization: data.monetization,
                });
                return false;
            }

            return true; // No gate issues, no monetization — proceed
        } catch {
            // If stage-check endpoint fails, proceed with the move anyway
            // (the server-side updateStage will enforce gates as a fallback)
            return true;
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDeal(null);

        if (!over) return;

        const dealId = Number(active.id);
        const newStage = String(over.id);

        let currentDeal: Deal | undefined;
        for (const stageData of Object.values(deals)) {
            currentDeal = stageData.deals.find((d) => d.id === dealId);
            if (currentDeal) break;
        }

        if (!currentDeal || currentDeal.stage_code === newStage) return;

        const targetStage = deals[newStage];
        if (!targetStage) {
            console.warn(`Target stage ${newStage} not found in current view.`);
            return;
        }

        // ── Optimistic update FIRST (instant visual move) ──
        const oldDeals = { ...deals };
        const updatedDeals = { ...deals };

        if (updatedDeals[currentDeal.stage_code]) {
            updatedDeals[currentDeal.stage_code] = {
                ...updatedDeals[currentDeal.stage_code],
                deals: updatedDeals[currentDeal.stage_code].deals.filter((d) => d.id !== dealId),
            };
        }

        const updatedDeal = {
            ...currentDeal,
            stage_code: newStage,
            progress_percent: targetStage.progress || 0,
        };

        updatedDeals[newStage] = {
            ...updatedDeals[newStage],
            deals: [...updatedDeals[newStage].deals, updatedDeal],
        };

        setDeals(updatedDeals);

        // ── Pre-flight check (gate rules + monetization) — runs AFTER visual move ──
        const canProceed = await preflightStageCheck(currentDeal, newStage, targetStage.name);
        if (!canProceed) {
            // Gate blocked or monetization modal shown — revert the optimistic move
            setDeals(oldDeals);
            return;
        }

        // ── Server-side stage update ──
        try {
            await api.patch(`/api/deals/${dealId}/stage`, {
                stage_code: newStage,
                pipeline_type: pipelineView
            });
            showAlert({ type: 'success', message: `Moved to ${targetStage.name || newStage}` });
        } catch (error: unknown) {
            console.error("Failed to move deal:", error);
            setDeals(oldDeals);
            const err = error as { response?: { data?: { gate_errors?: string[]; gate_error_details?: any[]; message?: string } } };
            if (err?.response?.data?.gate_errors) {
                setGateBlockedModal({
                    errors: err.response.data.gate_errors,
                    errorDetails: err.response.data.gate_error_details || [],
                    stageName: targetStage.name || newStage,
                    deal: currentDeal,
                    stageCode: newStage,
                });
            } else {
                showAlert({ type: 'error', message: 'Failed to update stage. Please refresh and try again.' });
            }
        }
    };

    const handleMove = async (deal: Deal, direction: 'forward' | 'backward') => {
        const currentIndex = stages.findIndex(s => s.code === deal.stage_code);
        if (currentIndex === -1) return;

        const nextIndex = direction === 'forward' ? currentIndex + 1 : currentIndex - 1;
        if (nextIndex < 0 || nextIndex >= stages.length) return;

        const nextStage = stages[nextIndex];

        // ── Optimistic update FIRST (instant visual move) ──
        const oldDeals = { ...deals };
        const updatedDeals = { ...deals };

        if (updatedDeals[deal.stage_code]) {
            updatedDeals[deal.stage_code] = {
                ...updatedDeals[deal.stage_code],
                deals: updatedDeals[deal.stage_code].deals.filter((d) => d.id !== deal.id),
            };
        }

        if (updatedDeals[nextStage.code]) {
            updatedDeals[nextStage.code] = {
                ...updatedDeals[nextStage.code],
                deals: [...updatedDeals[nextStage.code].deals, { ...deal, stage_code: nextStage.code, progress_percent: nextStage.progress || 0 }],
            };
        }

        setDeals(updatedDeals);

        // ── Pre-flight check (runs AFTER visual move) ──
        const canProceed = await preflightStageCheck(deal, nextStage.code, nextStage.name);
        if (!canProceed) {
            setDeals(oldDeals);
            return;
        }

        // ── Server call (executeStageMove does its own optimistic, but we already did it) ──
        try {
            await api.patch(`/api/deals/${deal.id}/stage`, {
                stage_code: nextStage.code,
                pipeline_type: pipelineView,
            });
            showAlert({ type: 'success', message: `Moved to ${nextStage.name}` });

            // Check for Won state
            if (direction === 'forward' && nextIndex === stages.length - 1) {
                setShowWonCelebration(true);
                try {
                    await api.patch(`/api/deals/${deal.id}`, { status: 'won' });
                } catch { /* ignore */ }
            }
        } catch (error: unknown) {
            setDeals(oldDeals);
            const err = error as { response?: { data?: { gate_errors?: string[]; gate_error_details?: any[]; message?: string } } };
            if (err?.response?.data?.gate_errors) {
                setGateBlockedModal({
                    errors: err.response.data.gate_errors,
                    errorDetails: err.response.data.gate_error_details || [],
                    stageName: nextStage.name,
                    deal,
                    stageCode: nextStage.code,
                });
            } else {
                showAlert({ type: 'error', message: err?.response?.data?.message || 'Failed to move deal' });
            }
        }
    };

    const handleConfirmLost = async () => {
        if (!lostDeal) return;
        try {
            await api.patch(`/api/deals/${lostDeal.id}`, {
                status: 'lost',
                lost_reason: lostReason
            });
            showAlert({ type: 'success', message: 'Deal marked as lost' });
            setLostDeal(null);
            setLostReason('');
            fetchDeals();
        } catch {
            showAlert({ type: 'error', message: 'Failed to update deal status' });
        }
    };

    const handleDealCreated = () => {
        setShowCreateModal(false);
        fetchDeals();
    };


    return (
        <div className="flex flex-col h-screen bg-white overflow-hidden">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between px-4 md:px-6 py-4 bg-white border-b gap-4">
                <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                    <h1 className="text-base font-medium text-gray-900 w-full md:w-auto">{t('navigation.dealPipeline')}</h1>

                    <div className="w-full md:w-72">
                        <Dropdown
                            countries={countries}
                            selected={selectedCountries}
                            onSelectMultiple={setSelectedCountries}
                            isMulti={true}
                            placeholder="Filter by Country"
                        />
                    </div>

                    <DataTableSearch
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder="Search deals..."
                    />
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2 text-white bg-[#064771] rounded-[3px] text-sm font-medium hover:bg-[#053a5c] transition-all active:scale-95"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create New Deal
                </button>
            </div>

            <div className="flex flex-1 overflow-hidden relative">
                {/* Mobile Sidebar Toggle Overlay */}
                {!sidebarCollapsed && (
                    <div
                        className="md:hidden absolute inset-0 bg-gray-900/50 z-20"
                        onClick={() => setSidebarCollapsed(true)}
                    />
                )}

                {/* Collapsible Sidebar */}
                <div className={`bg-white border-r overflow-y-auto scrollbar-premium shrink-0 transition-all duration-300 ease-in-out z-30
                    ${sidebarCollapsed ? 'w-0 md:w-20' : 'absolute inset-y-0 left-0 w-64 md:relative md:w-64'}
                `}>
                    <div className="p-3 bg-white h-full">
                        {/* Header with Collapse Toggle */}
                        <div className={`flex items-center mb-4 ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
                            {!sidebarCollapsed && (
                                <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    Pipeline Workflow
                                </h2>
                            )}
                            <button
                                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                                className="p-1.5 hover:bg-gray-100 rounded-[3px] transition-colors text-gray-400 hover:text-gray-600"
                                title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                            >
                                {sidebarCollapsed ? (
                                    <ChevronRight className="w-5 h-5" />
                                ) : (
                                    <ChevronLeft className="w-5 h-5" />
                                )}
                            </button>
                        </div>

                        {!sidebarCollapsed ? (
                            <>
                                {/* Buyer/Seller Toggle */}
                                <div className="relative flex bg-gray-100 rounded-[6px] p-1 mb-4" style={{ minWidth: '200px' }}>
                                    {/* Sliding pill background */}
                                    <div
                                        className="absolute top-1 bottom-1 rounded-[5px] bg-white shadow-sm transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                                        style={{
                                            width: 'calc(50% - 4px)',
                                            left: pipelineView === 'buyer' ? '4px' : 'calc(50%)',
                                        }}
                                    />
                                    <button
                                        onClick={() => setPipelineView('buyer')}
                                        className={`relative z-[1] flex-1 px-4 py-1.5 rounded-[5px] text-sm font-medium transition-colors duration-300 ${pipelineView === 'buyer'
                                            ? 'text-[#064771]'
                                            : 'text-gray-400 hover:text-gray-600'
                                            }`}
                                    >
                                        Investor
                                    </button>
                                    <button
                                        onClick={() => setPipelineView('seller')}
                                        className={`relative z-[1] flex-1 px-4 py-1.5 rounded-[5px] text-sm font-medium transition-colors duration-300 ${pipelineView === 'seller'
                                            ? 'text-[#064771]'
                                            : 'text-gray-400 hover:text-gray-600'
                                            }`}
                                    >
                                        Target
                                    </button>
                                </div>

                                {/* Summary Stats */}
                                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-[3px] p-3 mb-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-medium text-gray-500">Total Deals</span>
                                        <span className="text-lg font-medium text-[#064771]">
                                            {Object.values(deals).reduce((sum, s) => sum + (s.deals?.length || 0), 0)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all bg-[#064771]"
                                                style={{
                                                    width: `${stages.length > 0
                                                        ? Math.round((Object.values(deals).filter(s => s.deals?.length > 0).length / stages.length) * 100)
                                                        : 0}%`
                                                }}
                                            />
                                        </div>
                                        <span className="text-[10px] text-gray-400">
                                            {Object.values(deals).filter(s => s.deals?.length > 0).length}/{stages.length} active
                                        </span>
                                    </div>
                                </div>

                                {/* Clear Filter Button */}
                                {selectedStage && (
                                    <button
                                        onClick={() => setSelectedStage(null)}
                                        className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 mb-3 text-xs font-medium text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-[3px] transition-colors"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        Clear filter
                                    </button>
                                )}

                                {/* Stage List */}
                                <div className="space-y-1">
                                    {stages.map((stage) => {
                                        const code = stage.code;
                                        const stageDeals = deals[code]?.deals || [];
                                        const isSelected = selectedStage === code;

                                        const totalDealsInView = Object.values(deals).reduce((sum, s) => sum + (s.deals?.length || 0), 0);
                                        const dealPercentage = totalDealsInView > 0 ? Math.round((stageDeals.length / totalDealsInView) * 100) : 0;

                                        return (
                                            <button
                                                key={code}
                                                onClick={() => setSelectedStage(isSelected ? null : code)}
                                                className={`group w-full text-left px-2.5 py-2 rounded-[3px] text-xs transition-all ${isSelected
                                                    ? 'bg-blue-50 ring-1 ring-blue-200'
                                                    : 'hover:bg-gray-50'
                                                    }`}
                                                title={stage.name}
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                                        <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium ${isSelected
                                                            ? 'bg-[#064771] text-white'
                                                            : stageDeals.length > 0
                                                                ? 'bg-blue-100 text-[#064771]'
                                                                : 'bg-gray-100 text-gray-400'
                                                            }`}>
                                                            {code}
                                                        </span>
                                                        <span className={`truncate ${isSelected ? 'font-medium' : ''} ${isSelected
                                                            ? 'text-[#064771]'
                                                            : 'text-gray-600'
                                                            }`}>
                                                            {stage.name}
                                                        </span>
                                                    </div>
                                                    <span className={`flex-shrink-0 min-w-[20px] text-center px-1.5 py-0.5 rounded text-[10px] font-medium ${stageDeals.length > 0
                                                        ? 'bg-blue-100 text-[#064771]'
                                                        : 'bg-gray-100 text-gray-400'
                                                        }`}>
                                                        {stageDeals.length}
                                                    </span>
                                                </div>
                                                {/* Mini Deal Distribution Bar */}
                                                <div className="mt-1.5 flex items-center gap-2">
                                                    <div className="flex-1 bg-gray-100 rounded-full h-1 overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all bg-[#064771]/60
                                                                }`}
                                                            style={{ width: `${dealPercentage}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[9px] text-gray-400 w-8 text-right">{dealPercentage}%</span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Settings Link */}
                                <button
                                    onClick={() => navigate('/settings/pipeline')}
                                    className="w-full flex items-center justify-center gap-1.5 mt-4 px-3 py-2 text-xs font-medium text-gray-400 hover:text-[#064771] hover:bg-gray-50 rounded-[3px] transition-colors border border-dashed border-gray-200 hover:border-[#064771]/30"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    Configure Stages
                                </button>
                            </>
                        ) : (
                            /* Collapsed View */
                            <div className="space-y-3 flex flex-col items-center pt-2">
                                {/* Collapsed Toggle Icons */}
                                <div className="flex flex-col items-center gap-2 mb-4 pb-4 border-b border-gray-100 w-full">
                                    <button
                                        onClick={() => setPipelineView('buyer')}
                                        className={`w-10 h-10 rounded-[3px] flex items-center justify-center transition-all ${pipelineView === 'buyer'
                                            ? 'bg-[#064771] text-white shadow-md'
                                            : 'bg-gray-50 text-gray-400 hover:bg-gray-100 border border-gray-100'
                                            }`}
                                        title="Investor's Pipeline"
                                    >
                                        <span className="font-medium text-sm">B</span>
                                    </button>
                                    <button
                                        onClick={() => setPipelineView('seller')}
                                        className={`w-10 h-10 rounded-[3px] flex items-center justify-center transition-all ${pipelineView === 'seller'
                                            ? 'bg-[#064771] text-white shadow-md'
                                            : 'bg-gray-50 text-gray-400 hover:bg-gray-100 border border-gray-100'
                                            }`}
                                        title="Target Pipeline"
                                    >
                                        <span className="font-medium text-sm">S</span>
                                    </button>
                                </div>

                                {/* Collapsed Stage List */}
                                {stages.map((stage) => {
                                    const code = stage.code;
                                    const stageDeals = deals[code]?.deals || [];
                                    const isSelected = selectedStage === code;

                                    return (
                                        <button
                                            key={code}
                                            onClick={() => setSelectedStage(isSelected ? null : code)}
                                            className={`w-10 h-10 rounded-[3px] flex items-center justify-center font-medium text-sm transition-all relative ${isSelected
                                                ? 'bg-[#064771] text-white shadow-md'
                                                : stageDeals.length > 0
                                                    ? 'bg-blue-50 text-[#064771] border border-blue-100'
                                                    : 'bg-white text-gray-400 border border-gray-100 hover:border-gray-300'
                                                }`}
                                            title={`${stage.name} (${stageDeals.length})`}
                                        >
                                            {code}
                                            {stageDeals.length > 0 && (
                                                <span className={`absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full text-[9px] flex items-center justify-center border-2 border-white bg-[#064771] text-white
                                                    }`}>
                                                    {stageDeals.length}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 flex flex-col overflow-hidden">

                    <div className="flex items-center gap-4 px-4 py-2 bg-white border-b">
                        {(['board', 'table', 'lost', 'won'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 text-sm font-medium rounded-[3px] transition-colors capitalize ${activeTab === tab
                                    ? tab === 'lost' ? 'bg-red-50 text-red-700' : tab === 'won' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-[#064771]'
                                    : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                {tab === 'board' ? 'DealBoard' : tab === 'table' ? 'Table View' : tab}
                            </button>
                        ))}
                    </div>

                    {activeTab === 'board' && (
                        <div className="flex-1 overflow-x-auto overflow-y-auto p-4 bg-white scrollbar-premium">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="flex flex-col items-center gap-2">
                                        <BrandSpinner size="lg" />
                                        <span className="text-sm font-medium text-gray-500">Loading deals...</span>
                                    </div>
                                </div>
                            ) : (
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCorners}
                                    onDragStart={handleDragStart}
                                    onDragEnd={handleDragEnd}
                                >
                                    <div className="flex gap-4 min-w-max">
                                        {stages
                                            .filter((stage) => !selectedStage || selectedStage === stage.code)
                                            .map((stage) => (
                                                <StageColumn
                                                    key={stage.code}
                                                    code={stage.code}
                                                    name={stage.name}
                                                    deals={deals[stage.code]?.deals || []}
                                                    onDealClick={(deal) => setSelectedDeal(deal)}
                                                    onMove={handleMove}
                                                    onMarkLost={setLostDeal}
                                                    onDelete={setDeleteDeal}
                                                    pipelineView={pipelineView}
                                                />
                                            ))}
                                    </div>
                                    <DragOverlay dropAnimation={null}>
                                        {activeDeal ? <DealCard deal={activeDeal} isDragging pipelineView={pipelineView} /> : null}
                                    </DragOverlay>
                                </DndContext>
                            )}
                        </div>
                    )}

                    {(activeTab === 'table' || activeTab === 'lost' || activeTab === 'won') && (
                        <div className="flex-1 w-full px-4 md:px-8 overflow-auto py-6 scrollbar-premium">
                            <table className="min-w-full bg-white border border-gray-200 rounded-[3px] overflow-hidden shadow-sm">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deal Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{pipelineView === 'buyer' ? 'Investor' : 'Target'}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Probability</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {Object.values(deals).flatMap(d => d.deals).length === 0 ? (
                                        <tr><td colSpan={6} className="text-center py-8 text-gray-500">No deals found in this status.</td></tr>
                                    ) : (
                                        Object.values(deals).flatMap(d => d.deals).map(deal => (
                                            <tr
                                                key={deal.id}
                                                className="hover:bg-gray-50 transition-colors cursor-pointer"
                                                onClick={() => setSelectedDeal(deal)}
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {deal.name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {pipelineView === 'buyer'
                                                        ? (deal.buyer?.company_overview?.reg_name || 'N/A')
                                                        : (deal.seller?.company_overview?.reg_name || 'N/A')
                                                    }
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${deal.status === 'won' ? 'bg-green-100 text-green-800' :
                                                        deal.status === 'lost' ? 'bg-red-100 text-red-800' :
                                                            'bg-blue-100 text-[#064771]'
                                                        }`}>
                                                        {deals[deal.stage_code]?.name || deal.stage_code}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {deal.estimated_ev_value
                                                        ? `${getCurrencySymbol(deal.estimated_ev_currency)}${formatCompactNumber(deal.estimated_ev_value)}`
                                                        : '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <span className={`px-2 py-1 rounded-full text-xs ${deal.priority === 'high' ? 'bg-green-100 text-green-800' :
                                                        deal.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-gray-100 text-gray-900'
                                                        }`}>
                                                        {deal.priority}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(deal.updated_at).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {showCreateModal && (
                <CreateDealModal
                    onClose={() => setShowCreateModal(false)}
                    onCreated={handleDealCreated}
                    defaultView={pipelineView}
                />
            )}

            {selectedDeal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setSelectedDeal(null)} />
                    <div className="relative w-full max-w-2xl">
                        <DealExpandedPreview
                            deal={selectedDeal}
                            onClose={() => setSelectedDeal(null)}
                            onMove={(direction) => {
                                handleMove(selectedDeal, direction);
                                setSelectedDeal(null);
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Lost Remarks Modal */}
            {lostDeal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
                    <div className="bg-white rounded-[3px] shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900">Mark Deal as Lost</h3>
                            <button onClick={() => setLostDeal(null)} className="text-gray-400 hover:text-gray-600 focus:outline-none" aria-label="Close modal">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex flex-col items-center gap-2 py-4">
                                <div className="text-4xl">😔</div>
                                <p className="text-sm text-gray-500 text-center">We&apos;re sorry to hear that. Please provide a reason for marking this deal as lost.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Reason / Remarks</label>
                                <textarea
                                    value={lostReason}
                                    onChange={(e) => setLostReason(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-[3px] focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[100px]"
                                    placeholder="Enter reason here..."
                                />
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
                            <button
                                onClick={() => setLostDeal(null)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-[3px] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmLost}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-[3px] transition-colors"
                            >
                                Mark as Lost
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Won Celebration Modal */}
            {showWonCelebration && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[120] p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3px] shadow-2xl w-full max-w-lg overflow-hidden relative p-8 text-center flex flex-col items-center gap-6 animate-in zoom-in-95 duration-500">
                        <div className="absolute top-4 right-4">
                            <button onClick={() => { setShowWonCelebration(false); fetchDeals(); }} className="text-gray-400 hover:text-gray-600 p-2" aria-label="Close celebration">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="w-48 h-48 bg-yellow-50 rounded-full flex items-center justify-center">
                            <div className="text-8xl animate-bounce">🏆</div>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-3xl font-medium text-gray-900">Congratulations! 🎉</h2>
                            <p className="text-gray-500 text-lg">Amazing work! This deal has been officially won.</p>
                        </div>

                        <div className="py-4 px-6 bg-blue-50 rounded-[3px] border border-blue-100 w-full">
                            <p className="text-blue-800 text-sm font-medium">The deal has been moved to the <span className="font-medium">Won</span> tab.</p>
                        </div>

                        <button
                            onClick={() => { setShowWonCelebration(false); fetchDeals(); }}
                            className="w-full py-3 bg-[#064771] text-white rounded-[3px] font-medium shadow-lg hover:shadow-blue-200/50 hover:-translate-y-0.5 transition-all text-lg"
                        >
                            Awesome!
                        </button>
                    </div>
                </div>
            )}

            {/* Chat Overlay Drawer */}
            <div className={`fixed top-0 right-0 w-full md:w-[450px] h-screen bg-white shadow-2xl z-[100] transform transition-transform duration-300 ease-in-out border-l border-gray-100 p-0 flex flex-col ${chatDeal ? 'translate-x-0' : 'translate-x-full'}`}>
                {chatDeal && (
                    <>
                        <div className="flex items-center justify-between p-4 border-b bg-gray-50/50 shrink-0">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900">{chatDeal.name}</h3>
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Deal Activity & Audit Logs</p>
                            </div>
                            <button
                                onClick={() => setChatDeal(null)}
                                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                                aria-label="Close chat"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden p-0 min-h-0">
                            {/* NotesSection – same WhatsApp-style UI as prospects */}
                            <div className="h-full">
                                <NotesSection
                                    notes={chatNotes}
                                    onNotesChange={setChatNotes}
                                    entityId={chatDeal.id.toString()}
                                    entityType="deal"
                                    currentUserName={getCurrentUserName()}
                                />
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Overlay background for Chat */}
            {chatDeal && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] animate-in fade-in duration-300"
                    onClick={() => setChatDeal(null)}
                />
            )}

            {/* Monetization Confirmation Modal (Stage Fee or Final Settlement) */}
            {monetizationModal && monetizationModal.monetization?.mode === 'final_settlement' ? (
                <FinalSettlementModal
                    isOpen={true}
                    onClose={() => setMonetizationModal(null)}
                    onConfirm={(confirmation) => {
                        setMonetizationModal(null);
                        executeStageMove(monetizationModal.deal, monetizationModal.stageCode, confirmation);
                    }}
                    dealName={monetizationModal.deal.name}
                    stageName={monetizationModal.stageName}
                    monetization={monetizationModal.monetization}
                />
            ) : monetizationModal ? (
                <MonetizationConfirmModal
                    isOpen={true}
                    onClose={() => setMonetizationModal(null)}
                    onConfirm={(feeConfirmation) => {
                        setMonetizationModal(null);
                        executeStageMove(monetizationModal.deal, monetizationModal.stageCode, feeConfirmation);
                    }}
                    dealName={monetizationModal.deal.name}
                    stageName={monetizationModal.stageName}
                    monetization={monetizationModal.monetization}
                />
            ) : null}

            {/* Gate Rule Blocked Modal */}
            {gateBlockedModal && (
                <GateBlockedModal
                    isOpen={true}
                    onClose={() => setGateBlockedModal(null)}
                    stageName={gateBlockedModal.stageName}
                    errors={gateBlockedModal.errors}
                    errorDetails={gateBlockedModal.errorDetails}
                    dealId={gateBlockedModal.deal?.id}
                    pipelineType={pipelineView}
                    stageCode={gateBlockedModal.stageCode}
                    onResolved={() => {
                        setGateBlockedModal(null);
                        fetchDeals();
                    }}
                />
            )}

            {/* Deal Delete Modal */}
            {deleteDeal && (
                <DealDeleteModal
                    isOpen={true}
                    onClose={() => setDeleteDeal(null)}
                    onDeleted={() => {
                        setDeleteDeal(null);
                        fetchDeals();
                    }}
                    dealId={deleteDeal.id}
                    dealName={deleteDeal.name}
                />
            )}
        </div>
    );
};

export default DealPipeline;

