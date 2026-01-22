import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import api from '../../config/api';
import { Country, Dropdown } from '../currency/components/Dropdown';
import { showAlert } from '../../components/Alert';
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

interface PipelineStage {
    code: string;
    name: string;
    progress: number;
}

type PipelineView = 'buyer' | 'seller';

export interface Deal {
    id: number;
    name: string;
    buyer_id: number;
    seller_id: number;
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
    comment_count: number;
    attachment_count: number;
    updated_at: string;
    has_new_activity?: boolean; // For notification dot
    onChatClick?: (deal: Deal) => void; // Callback for chat button
    buyer?: {
        id: number;
        company_overview?: {
            reg_name: string;
            hq_country?: number;
        };
    };
    seller?: {
        id: number;
        company_overview?: {
            reg_name: string;
            hq_country?: number;
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
    const [deals, setDeals] = useState<GroupedDeals>({});
    const [stages, setStages] = useState<PipelineStage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'board' | 'table'>('board');
    const [selectedStage, setSelectedStage] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [countries, setCountries] = useState<Country[]>([]);
    const [selectedCountries, setSelectedCountries] = useState<Country[]>([]);
    const [pipelineView, setPipelineView] = useState<PipelineView>('buyer');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [chatDeal, setChatDeal] = useState<Deal | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        })
    );

    useEffect(() => {
        const fetchCountries = async () => {
            try {
                const response = await api.get('/api/countries');
                const formatted = response.data.map((country: any) => ({
                    id: country.id,
                    name: country.name,
                    flagSrc: country.svg_icon_url,
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
            const response = await api.get('/api/deals', {
                params: {
                    search: searchQuery || undefined,
                    countries: selectedCountries.length > 0 ? selectedCountries.map(c => c.id) : undefined,
                    view: pipelineView,
                }
            });
            const enhancedGrouped = { ...response.data.grouped };
            // Add chat click handler to each deal
            Object.keys(enhancedGrouped).forEach(stage => {
                enhancedGrouped[stage].deals = enhancedGrouped[stage].deals.map((d: any) => ({
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
    }, [searchQuery, selectedCountries, pipelineView]);

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

    const handleDealCreated = () => {
        setShowCreateModal(false);
        fetchDeals();
    };


    return (
        <div className="flex flex-col h-full min-h-screen bg-gray-50 font-poppins overflow-x-hidden">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between px-4 md:px-6 py-4 bg-white border-b gap-4">
                <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                    <h1 className="text-xl md:text-2xl font-semibold text-gray-900 w-full md:w-auto">Deal Pipeline</h1>

                    <div className="w-full md:w-80">
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
                            className="w-full md:w-64 px-4 py-2 pl-10 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#064771]"
                        />
                        <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 text-white bg-[#064771] rounded-lg hover:bg-[#053a5c] transition-colors"
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
                                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    Pipeline Workflow
                                </h2>
                            )}
                            <button
                                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                                className="p-1.5 hover:bg-gray-100 rounded-md transition-colors text-gray-400 hover:text-gray-600"
                                title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                            >
                                {sidebarCollapsed ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                                    </svg>
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
                                        <span className={`text-lg font-bold ${pipelineView === 'buyer' ? 'text-[#064771]' : 'text-green-600'}`}>
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
                                                        <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${isSelected
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
                                        <span className="font-bold text-sm">B</span>
                                    </button>
                                    <button
                                        onClick={() => setPipelineView('seller')}
                                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${pipelineView === 'seller'
                                            ? 'bg-green-600 text-white shadow-md'
                                            : 'bg-gray-50 text-gray-400 hover:bg-gray-100 border border-gray-100'
                                            }`}
                                        title="Target Pipeline"
                                    >
                                        <span className="font-bold text-sm">S</span>
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
                                            className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm transition-all relative ${isSelected
                                                ? pipelineView === 'buyer' ? 'bg-[#064771] text-white shadow-md' : 'bg-green-600 text-white shadow-md'
                                                : stageDeals.length > 0
                                                    ? pipelineView === 'buyer' ? 'bg-blue-50 text-[#064771] border border-blue-100' : 'bg-green-50 text-green-700 border border-green-100'
                                                    : 'bg-white text-gray-300 border border-gray-100 hover:border-gray-300'
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
                        {(['board', 'table'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === tab
                                    ? 'bg-blue-50 text-[#064771]'
                                    : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                {tab === 'board' ? 'Deal Board' : 'Table View'}
                            </button>
                        ))}
                    </div>

                    {activeTab === 'board' && (
                        <div className="flex-1 overflow-x-auto p-4">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-64">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#064771]"></div>
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
                                                    onDealClick={(deal) => navigate(`/deals/${deal.id}`)}
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

                    {activeTab === 'table' && (
                        <div className="flex-1 w-full px-4 md:px-8 overflow-auto py-6">
                            <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Deal Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{pipelineView === 'buyer' ? 'Investor' : 'Target'}</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Stage</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Value</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Updated</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {Object.values(deals).flatMap(d => d.deals).length === 0 ? (
                                        <tr><td colSpan={6} className="text-center py-8 text-gray-500">No deals found.</td></tr>
                                    ) : (
                                        Object.values(deals).flatMap(d => d.deals).map(deal => (
                                            <tr
                                                key={deal.id}
                                                className="hover:bg-gray-50 transition-colors cursor-pointer"
                                                onClick={() => navigate(`/deals/${deal.id}`)}
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
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${pipelineView === 'buyer' ? 'bg-blue-100 text-[#064771]' : 'bg-green-100 text-green-800'
                                                        }`}>
                                                        {deals[deal.stage_code]?.name || deal.stage_code}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {deal.estimated_ev_value
                                                        ? `${deal.estimated_ev_currency} ${deal.estimated_ev_value.toLocaleString()}`
                                                        : '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <span className={`px-2 py-1 rounded-full text-xs ${deal.priority === 'high' ? 'bg-red-100 text-red-800' :
                                                        deal.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {deal.priority.charAt(0).toUpperCase() + deal.priority.slice(1)}
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

            {/* Chat Overlay Drawer */}
            <div className={`fixed inset-y-0 right-0 w-full md:w-[450px] bg-white shadow-2xl z-[100] transform transition-transform duration-300 ease-in-out border-l border-gray-100 p-0 flex flex-col ${chatDeal ? 'translate-x-0' : 'translate-x-full'}`}>
                {chatDeal && (
                    <>
                        <div className="flex items-center justify-between p-4 border-b bg-gray-50/50">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">{chatDeal.name}</h3>
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Deal Activity & Audit Logs</p>
                            </div>
                            <button
                                onClick={() => setChatDeal(null)}
                                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
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
                    className="fixed inset-0 bg-black/20 z-[90] animate-in fade-in duration-300"
                    onClick={() => setChatDeal(null)}
                />
            )}
        </div>
    );
};

export default DealPipeline;

