import { useState, useEffect, useContext } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { AuthContext } from '../../routes/AuthContext';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import api from '../../config/api';
import { getCachedCountries } from '../../utils/referenceDataCache';
import { Country, Dropdown } from '../currency/components/Dropdown';
import { showAlert } from '../../components/Alert';
import { BrandSpinner } from '../../components/BrandSpinner';
import { ActivityLogChat } from '../prospects/components/ActivityLogChat';
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
import { getCurrencySymbol, formatCompactNumber } from '../../utils/formatters';

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
    progress_percent: number;
    priority: 'low' | 'medium' | 'high';
    pic_user_id: number | null;
    target_close_date: string | null;
    status: 'active' | 'on_hold' | 'lost' | 'won';
    ticket_size?: number | string;
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
    const [lostDeal, setLostDeal] = useState<Deal | null>(null);
    const [lostReason, setLostReason] = useState('');
    const [showWonCelebration, setShowWonCelebration] = useState<boolean>(false);

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

        // Validating that the target stage exists in our current state map
        const targetStage = deals[newStage];
        if (!targetStage) {
            console.warn(`Target stage ${newStage} not found in current view.`);
            return;
        }

        const oldDeals = { ...deals };
        const updatedDeals = { ...deals };

        // Remove from old stage
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

        // Add to new stage
        updatedDeals[newStage] = {
            ...updatedDeals[newStage],
            deals: [...updatedDeals[newStage].deals, updatedDeal],
        };

        setDeals(updatedDeals);

        try {
            await api.patch(`/api/deals/${dealId}/stage`, {
                stage_code: newStage,
                pipeline_type: pipelineView
            });
            showAlert({ type: 'success', message: `Moved to ${targetStage.name || newStage}` });
        } catch (error) {
            console.error("Failed to move deal:", error);
            setDeals(oldDeals);
            showAlert({ type: 'error', message: 'Failed to update stage. Please refresh and try again.' });
        }
    };

    const handleMove = async (deal: Deal, direction: 'forward' | 'backward') => {
        const currentIndex = stages.findIndex(s => s.code === deal.stage_code);
        if (currentIndex === -1) return;

        let nextIndex = direction === 'forward' ? currentIndex + 1 : currentIndex - 1;
        if (nextIndex < 0 || nextIndex >= stages.length) return;

        const nextStage = stages[nextIndex];

        try {
            await api.patch(`/api/deals/${deal.id}/stage`, {
                stage_code: nextStage.code,
                pipeline_type: pipelineView
            });

            // Check for Won state
            if (direction === 'forward' && nextIndex === stages.length - 1) {
                setShowWonCelebration(true);
                // Also update status to won on backend automatically? 
                // The user said: "when mark as won ... take to Won" and "automatically mark as won deal if any deal reach the latest stage"
                await api.patch(`/api/deals/${deal.id}`, { status: 'won' });
            }

            showAlert({ type: 'success', message: `Moved to ${nextStage.name}` });
            fetchDeals();
        } catch {
            showAlert({ type: 'error', message: 'Failed to move deal' });
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
        <div className="flex flex-col h-full min-h-screen bg-gray-50 overflow-x-hidden">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between px-4 md:px-6 py-4 bg-white border-b gap-4">
                <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                    <h1 className="text-xl md:text-2xl font-medium text-gray-900 w-full md:w-auto">Deal Pipeline</h1>

                    <div className="w-full md:w-72">
                        <Dropdown
                            countries={countries}
                            selected={selectedCountries}
                            onSelectMultiple={setSelectedCountries}
                            isMulti={true}
                            placeholder="Filter by Country"
                        />
                    </div>

                    <div className="relative w-full md:w-auto">
                        <input
                            type="text"
                            placeholder="Search deals..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full md:w-72 px-4 py-2 pl-10 text-sm border border-gray-200 rounded-[3px] focus:outline-none focus:ring-2 focus:ring-[#064771] transition-all"
                        />
                        <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 text-white bg-[#064771] rounded-[3px] hover:bg-[#053a5c] transition-all"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <div className={`bg-white border-r overflow-y-auto shrink-0 transition-all duration-300 ease-in-out z-30
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
                                className="p-1.5 hover:bg-gray-100 rounded-md transition-colors text-gray-400 hover:text-gray-600"
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
                                <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
                                    <button
                                        onClick={() => setPipelineView('buyer')}
                                        className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-md transition-all duration-200 ${pipelineView === 'buyer'
                                            ? 'bg-white text-[#064771] shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        Investor
                                    </button>
                                    <button
                                        onClick={() => setPipelineView('seller')}
                                        className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-md transition-all duration-200 ${pipelineView === 'seller'
                                            ? 'bg-white text-green-600 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        Target
                                    </button>
                                </div>

                                {/* Summary Stats */}
                                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-3 mb-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-medium text-gray-500">Total Deals</span>
                                        <span className={`text-lg font-medium ${pipelineView === 'buyer' ? 'text-[#064771]' : 'text-green-600'}`}>
                                            {Object.values(deals).reduce((sum, s) => sum + (s.deals?.length || 0), 0)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all ${pipelineView === 'buyer' ? 'bg-[#064771]' : 'bg-green-500'}`}
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
                                        className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 mb-3 text-xs font-medium text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
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
                                                className={`group w-full text-left px-2.5 py-2 rounded-lg text-xs transition-all ${isSelected
                                                    ? pipelineView === 'buyer'
                                                        ? 'bg-blue-50 ring-1 ring-blue-200'
                                                        : 'bg-green-50 ring-1 ring-green-200'
                                                    : 'hover:bg-gray-50'
                                                    }`}
                                                title={stage.name}
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                                        <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium ${isSelected
                                                            ? pipelineView === 'buyer' ? 'bg-[#064771] text-white' : 'bg-green-600 text-white'
                                                            : stageDeals.length > 0
                                                                ? pipelineView === 'buyer' ? 'bg-blue-100 text-[#064771]' : 'bg-green-100 text-green-700'
                                                                : 'bg-gray-100 text-gray-400'
                                                            }`}>
                                                            {code}
                                                        </span>
                                                        <span className={`truncate ${isSelected ? 'font-medium' : ''} ${isSelected
                                                            ? pipelineView === 'buyer' ? 'text-[#064771]' : 'text-green-700'
                                                            : 'text-gray-600'
                                                            }`}>
                                                            {stage.name}
                                                        </span>
                                                    </div>
                                                    <span className={`flex-shrink-0 min-w-[20px] text-center px-1.5 py-0.5 rounded text-[10px] font-medium ${stageDeals.length > 0
                                                        ? pipelineView === 'buyer'
                                                            ? 'bg-blue-100 text-[#064771]'
                                                            : 'bg-green-100 text-green-700'
                                                        : 'bg-gray-100 text-gray-400'
                                                        }`}>
                                                        {stageDeals.length}
                                                    </span>
                                                </div>
                                                {/* Mini Deal Distribution Bar */}
                                                <div className="mt-1.5 flex items-center gap-2">
                                                    <div className="flex-1 bg-gray-100 rounded-full h-1 overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all ${pipelineView === 'buyer' ? 'bg-[#064771]/60' : 'bg-green-500/60'
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
                                    className="w-full flex items-center justify-center gap-1.5 mt-4 px-3 py-2 text-xs font-medium text-gray-400 hover:text-[#064771] hover:bg-gray-50 rounded-md transition-colors border border-dashed border-gray-200 hover:border-[#064771]/30"
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
                                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${pipelineView === 'buyer'
                                            ? 'bg-[#064771] text-white shadow-md'
                                            : 'bg-gray-50 text-gray-400 hover:bg-gray-100 border border-gray-100'
                                            }`}
                                        title="Investor's Pipeline"
                                    >
                                        <span className="font-medium text-sm">B</span>
                                    </button>
                                    <button
                                        onClick={() => setPipelineView('seller')}
                                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${pipelineView === 'seller'
                                            ? 'bg-green-600 text-white shadow-md'
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
                                            className={`w-10 h-10 rounded-lg flex items-center justify-center font-medium text-sm transition-all relative ${isSelected
                                                ? pipelineView === 'buyer' ? 'bg-[#064771] text-white shadow-md' : 'bg-green-600 text-white shadow-md'
                                                : stageDeals.length > 0
                                                    ? pipelineView === 'buyer' ? 'bg-blue-50 text-[#064771] border border-blue-100' : 'bg-green-50 text-green-700 border border-green-100'
                                                    : 'bg-white text-gray-400 border border-gray-100 hover:border-gray-300'
                                                }`}
                                            title={`${stage.name} (${stageDeals.length})`}
                                        >
                                            {code}
                                            {stageDeals.length > 0 && (
                                                <span className={`absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full text-[9px] flex items-center justify-center border-2 border-white ${pipelineView === 'buyer' ? 'bg-[#064771] text-white' : 'bg-green-600 text-white'
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
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors capitalize ${activeTab === tab
                                    ? tab === 'lost' ? 'bg-red-50 text-red-700' : tab === 'won' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-[#064771]'
                                    : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                {tab === 'board' ? 'Deal Board' : tab === 'table' ? 'Table View' : tab}
                            </button>
                        ))}
                    </div>

                    {activeTab === 'board' && (
                        <div className="flex-1 overflow-x-auto p-4">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-screen">
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
                                                    pipelineView={pipelineView}
                                                />
                                            ))}
                                    </div>
                                    <DragOverlay>
                                        {activeDeal ? <DealCard deal={activeDeal} isDragging pipelineView={pipelineView} /> : null}
                                    </DragOverlay>
                                </DndContext>
                            )}
                        </div>
                    )}

                    {(activeTab === 'table' || activeTab === 'lost' || activeTab === 'won') && (
                        <div className="flex-1 w-full px-4 md:px-8 overflow-auto py-6">
                            <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
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
                                                            pipelineView === 'buyer' ? 'bg-blue-100 text-[#064771]' : 'bg-green-100 text-green-800'
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
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
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
                                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[100px]"
                                    placeholder="Enter reason here..."
                                />
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
                            <button
                                onClick={() => setLostDeal(null)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmLost}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
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
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative p-8 text-center flex flex-col items-center gap-6 animate-in zoom-in-95 duration-500">
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

                        <div className="py-4 px-6 bg-blue-50 rounded-xl border border-blue-100 w-full">
                            <p className="text-blue-800 text-sm font-medium">The deal has been moved to the <span className="font-medium">Won</span> tab.</p>
                        </div>

                        <button
                            onClick={() => { setShowWonCelebration(false); fetchDeals(); }}
                            className="w-full py-3 bg-[#064771] text-white rounded-xl font-medium shadow-lg hover:shadow-blue-200/50 hover:-translate-y-0.5 transition-all text-lg"
                        >
                            Awesome!
                        </button>
                    </div>
                </div>
            )}

            {/* Chat Overlay Drawer */}
            <div className={`fixed inset-y-0 right-0 w-full md:w-[450px] bg-white shadow-2xl z-[100] transform transition-transform duration-300 ease-in-out border-l border-gray-100 p-0 flex flex-col ${chatDeal ? 'translate-x-0' : 'translate-x-full'}`}>
                {chatDeal && (
                    <>
                        <div className="flex items-center justify-between p-4 border-b bg-gray-50/50">
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
                        <div className="flex-1 overflow-hidden p-0">
                            {/* Make ActivityLogChat occupy the full height of this container */}
                            <div className="h-full">
                                <ActivityLogChat
                                    entityId={chatDeal.id.toString()}
                                    entityType="deal"
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
        </div>
    );
};

export default DealPipeline;

