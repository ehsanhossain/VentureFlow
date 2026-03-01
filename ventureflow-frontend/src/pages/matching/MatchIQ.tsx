/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../config/api';
import EngineController, { MatchWeights, EngineFilters } from './components/EngineController';
import InvestorClusterCard, { ClusteredInvestor } from './components/InvestorClusterCard';
import MatchComparisonPanel, { MatchDetail } from './components/MatchComparisonPanel';
import { BrandSpinner } from '../../components/BrandSpinner';
import { RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/* ─── Types ───────────────────────────────────────────────────────────── */

export interface MatchData {
    id: number;
    buyer_id: number;
    seller_id: number;
    total_score: number;
    industry_score: number;
    geography_score: number;
    financial_score: number;
    ownership_score: number;
    transaction_score: number;
    computed_at: string;
    buyer?: any;
    seller?: any;
}

export interface FilterCountry {
    id: number;
    country_name?: string;
    name?: string;
}

export interface FilterIndustry {
    id: number;
    name?: string;
    label?: string;
}

export interface MatchStats {
    total: number;
    excellent: number;
    strong: number;
    good: number;
    fair: number;
    avg_score: number;
}

export interface MatchFiltersState {
    min_score: number;
    industry_ids: number[];
    country_ids: number[];
    buyer_id: string;
    seller_id: string;
}

export interface InvestorCriteria {
    investor_id: string;
    industry_ids: number[];
    target_countries: number[];
    ebitda_min: string;
    budget_min: string;
    budget_max: string;
    ownership_condition: string;
}

type ViewMode = 'investor' | 'target';

/* ─── Constants ──────────────────────────────────────────────────────── */

const BRAND = '#064771';

const DEFAULT_WEIGHTS: MatchWeights = {
    industry: 30,
    geography: 25,
    financial: 25,
    transaction: 20,
};

const DEFAULT_FILTERS: EngineFilters = {
    minScore: 30,
    tier: 'all',
    industry: '',
    country: '',
};

/* ─── Resizable Divider ──────────────────────────────────────────────── */

const ResizeDivider: React.FC<{
    onResize: (delta: number) => void;
}> = ({ onResize }) => {
    const [dragging, setDragging] = useState(false);
    const lastX = useRef(0);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setDragging(true);
        lastX.current = e.clientX;

        const handleMouseMove = (ev: MouseEvent) => {
            const delta = ev.clientX - lastX.current;
            lastX.current = ev.clientX;
            onResize(delta);
        };

        const handleMouseUp = () => {
            setDragging(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    };

    return (
        <div
            onMouseDown={handleMouseDown}
            style={{
                width: 6,
                cursor: 'col-resize',
                background: dragging ? '#d1d5db' : 'transparent',
                borderLeft: '1px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'background 0.15s ease',
            }}
            onMouseEnter={e => { if (!dragging) e.currentTarget.style.background = '#f3f4f6'; }}
            onMouseLeave={e => { if (!dragging) e.currentTarget.style.background = 'transparent'; }}
            title="Drag to resize panels"
        >
            <div style={{
                width: 2, height: 32, borderRadius: 1,
                background: '#d1d5db',
            }} />
        </div>
    );
};

/* ─── MatchIQ Page ───────────────────────────────────────────────────── */

const MatchIQ: React.FC = () => {
    const { t } = useTranslation();

    // Engine state
    const [weights, setWeights] = useState<MatchWeights>(DEFAULT_WEIGHTS);
    const [filters, setFilters] = useState<EngineFilters>(DEFAULT_FILTERS);

    // View mode: investor-centric or target-centric
    const [viewMode, setViewMode] = useState<ViewMode>('investor');

    // Data
    const [clusters, setClusters] = useState<ClusteredInvestor[]>([]);
    const [stats, setStats] = useState<MatchStats | null>(null);
    const [countries, setCountries] = useState<FilterCountry[]>([]);
    const [industries, setIndustries] = useState<FilterIndustry[]>([]);

    // UI state
    const [loading, setLoading] = useState(true);
    const [rescanning, setRescanning] = useState(false);
    const [engineCollapsed, setEngineCollapsed] = useState(false);
    const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
    const [matchDetail, setMatchDetail] = useState<MatchDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    // Panel sizes (center column width)
    const [centerWidth, setCenterWidth] = useState<number | null>(null);

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    /* ─── Data Loading ────────────────────────────────────────────────── */

    const loadMatches = useCallback(async (pageNum = 1) => {
        setLoading(true);
        try {
            const params: Record<string, any> = {
                page: pageNum,
                per_page: 20,
                mode: viewMode,
            };
            if (filters.tier !== 'all') params.tier = filters.tier;
            if (filters.industry) params.industry_ids = [filters.industry];
            if (filters.country) params.country_ids = [filters.country];
            if (filters.minScore > 30) params.min_score = filters.minScore;

            const { data } = await api.get('/api/matchiq', { params });

            // Normalize target-mode response to match investor-mode shape
            if (viewMode === 'target') {
                const normalized = (data.data || []).map((item: any) => ({
                    investor: item.target || item.investor, // target becomes the "grouping entity"
                    targets: (item.investors || item.targets || []).map((inv: any) => ({
                        ...inv,
                        match_id: inv.match_id,
                        target_id: inv.investor_id || inv.target_id,
                        seller_id: inv.buyer_id || inv.seller_id,
                        reg_name: inv.reg_name,
                        hq_country: inv.hq_country,
                        industry: inv.industry,
                        image: inv.image,
                        total_score: inv.total_score,
                        industry_score: inv.industry_score,
                        geography_score: inv.geography_score,
                        financial_score: inv.financial_score,
                        transaction_score: inv.transaction_score,
                        tier: inv.tier,
                        tier_label: inv.tier_label,
                        status: inv.status,
                    })),
                    best_score: item.best_score,
                    target_count: item.investor_count || item.target_count,
                }));
                setClusters(normalized);
            } else {
                setClusters(data.data || []);
            }

            setTotalPages(data.meta?.last_page || 1);
            setPage(pageNum);
        } catch (err) {
            console.error('Failed to load matches', err);
        } finally {
            setLoading(false);
        }
    }, [filters, viewMode]);

    const loadStats = async () => {
        try {
            const { data } = await api.get('/api/matchiq/stats');
            setStats(data);
        } catch { /* silently handle */ }
    };

    const loadFilters = async () => {
        try {
            const [countriesRes, industriesRes] = await Promise.all([
                api.get('/api/countries'),
                api.get('/api/industries'),
            ]);
            setCountries(countriesRes.data?.data || countriesRes.data || []);
            setIndustries(industriesRes.data?.data || industriesRes.data || []);
        } catch { /* silently handle */ }
    };

    useEffect(() => {
        loadFilters();
        loadStats();
    }, []);

    useEffect(() => {
        loadMatches(1);
    }, [loadMatches]);

    /* ─── Actions ─────────────────────────────────────────────────────── */

    const handleRescan = async () => {
        setRescanning(true);
        try {
            const weightsForApi = {
                industry: weights.industry / 100,
                geography: weights.geography / 100,
                financial: weights.financial / 100,
                transaction: weights.transaction / 100,
            };
            await api.post('/api/matchiq/rescan', { weights: weightsForApi });
            await Promise.all([loadMatches(1), loadStats()]);
        } catch (err) {
            console.error('Rescan failed', err);
        } finally {
            setRescanning(false);
        }
    };

    const handleTargetClick = async (matchId: number) => {
        setSelectedMatchId(matchId);
        setDetailLoading(true);
        try {
            const { data } = await api.get(`/api/matchiq/match/${matchId}`);
            setMatchDetail(data);
        } catch (err) {
            console.error('Failed to load match detail', err);
            setMatchDetail(null);
        } finally {
            setDetailLoading(false);
        }
    };

    const handleCloseDetail = () => {
        setSelectedMatchId(null);
        setMatchDetail(null);
    };

    const handleFiltersChange = (partial: Partial<EngineFilters>) => {
        setFilters(prev => ({ ...prev, ...partial }));
    };

    const handleDismiss = async (matchId: number) => {
        try {
            await api.post(`/api/matchiq/${matchId}/dismiss`);
            // Remove from clusters
            setClusters(prev => prev.map(cluster => ({
                ...cluster,
                targets: cluster.targets.filter(t => t.match_id !== matchId),
                target_count: cluster.targets.filter(t => t.match_id !== matchId).length,
            })).filter(c => c.targets.length > 0));
            // Clear detail if dismissed match was selected
            if (selectedMatchId === matchId) {
                handleCloseDetail();
            }
        } catch (err) {
            console.error('Failed to dismiss match', err);
        }
    };

    const handleApprove = async (matchId: number) => {
        try {
            await api.post(`/api/matchiq/${matchId}/approve`);
            // Update status in clusters
            setClusters(prev => prev.map(cluster => ({
                ...cluster,
                targets: cluster.targets.map(t =>
                    t.match_id === matchId ? { ...t, status: 'approved' } : t
                ),
            })));
        } catch (err) {
            console.error('Failed to approve match', err);
        }
    };

    const handleResize = (delta: number) => {
        setCenterWidth(prev => {
            const current = prev ?? 400;
            return Math.max(250, Math.min(800, current + delta));
        });
    };

    /* ─── (labels removed — no longer needed) ─── */

    /* ─── Render ──────────────────────────────────────────────────────── */

    return (
        <div style={{
            display: 'flex', flexDirection: 'column',
            height: 'calc(100vh - 64px)', overflow: 'hidden',
        }}>
            {/* Page Header — matches Prospects layout exactly */}
            <div className="flex flex-col md:flex-row items-center justify-between px-4 md:px-6 py-4 bg-white border-b gap-4" style={{ flexShrink: 0 }}>
                <div className="flex flex-col md:flex-row items-center gap-8 w-full md:w-auto">
                    <h1 className="text-base font-medium text-gray-900 w-full md:w-auto">MatchIQ</h1>

                    <div className="relative flex bg-gray-100 rounded-[6px] p-1">
                        {/* Sliding pill background */}
                        <div
                            className="absolute top-1 bottom-1 rounded-[5px] bg-white shadow-sm transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                            style={{
                                width: 'calc(50% - 4px)',
                                left: viewMode === 'investor' ? '4px' : 'calc(50%)',
                            }}
                        />
                        <button
                            onClick={() => { setViewMode('investor'); setSelectedMatchId(null); setMatchDetail(null); }}
                            className={`relative z-[1] flex-1 px-4 py-1.5 rounded-[5px] text-sm font-medium whitespace-nowrap transition-colors duration-300 ${
                                viewMode === 'investor' ? 'text-[#064771]' : 'text-gray-400 hover:text-gray-600'
                            }`}
                        >
                            Find Targets for Investors
                        </button>
                        <button
                            onClick={() => { setViewMode('target'); setSelectedMatchId(null); setMatchDetail(null); }}
                            className={`relative z-[1] flex-1 px-4 py-1.5 rounded-[5px] text-sm font-medium whitespace-nowrap transition-colors duration-300 ${
                                viewMode === 'target' ? 'text-[#064771]' : 'text-gray-400 hover:text-gray-600'
                            }`}
                        >
                            Find Investors for Targets
                        </button>
                    </div>
                </div>

                {/* Stats pills */}
                {stats && (
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        {[
                            { label: 'Best', value: stats.excellent },
                            { label: 'Strong', value: stats.strong },
                            { label: 'Good', value: stats.good },
                            { label: 'Fair', value: stats.fair },
                        ].map(s => (
                            <div key={s.label} style={{
                                padding: '6px 14px', borderRadius: 3,
                                background: '#f3f4f6', color: '#374151',
                                fontSize: 12, fontWeight: 500,
                                display: 'flex', alignItems: 'center', gap: 4,
                            }}>
                                {s.label}: {s.value}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 3-Panel Body */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {/* LEFT: Engine Controller */}
                <EngineController
                    weights={weights}
                    onWeightsChange={setWeights}
                    filters={filters}
                    onFiltersChange={handleFiltersChange}
                    onRescan={handleRescan}
                    rescanning={rescanning}
                    collapsed={engineCollapsed}
                    onToggleCollapse={() => setEngineCollapsed(!engineCollapsed)}
                    countries={countries}
                    industries={industries}
                />

                {/* CENTER: Clustered Match Results */}
                <div style={{
                    width: centerWidth ?? undefined,
                    flex: centerWidth ? 'none' : '2 1 0%',
                    display: 'flex', flexDirection: 'column',
                    overflow: 'hidden', minWidth: 250,
                }}>
                    {/* Center header */}
                    <div style={{
                        padding: '10px 20px', borderBottom: '1px solid #e5e7eb',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        background: 'white', flexShrink: 0,
                    }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>
                            Potential Matches ({clusters.length})
                        </span>
                        <button
                            onClick={() => loadMatches(page)}
                            title="Refresh matches"
                            style={{
                                width: 28, height: 28, border: '1px solid #e5e7eb',
                                borderRadius: 3, background: 'white', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#6b7280',
                            }}
                        >
                            <RefreshCw size={13} />
                        </button>
                    </div>

                    {/* Cards container */}
                    <div className="scrollbar-premium" style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
                        {loading ? (
                            <div style={{
                                display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center',
                                height: '100%', color: '#9ca3af',
                            }}>
                                <BrandSpinner size="sm" />
                                <span style={{ fontSize: 13, marginTop: 12 }}>Loading matches…</span>
                            </div>
                        ) : clusters.length === 0 ? (
                            <div style={{
                                display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center',
                                height: '100%', color: '#9ca3af',
                            }}>
                                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
                                    {t('matchIQ.noMatchesFound', 'No matches found')}
                                </div>
                                <div style={{ fontSize: 12 }}>
                                    Try adjusting your filters or running a new scan
                                </div>
                            </div>
                        ) : (
                            <>
                                {clusters.map((cluster, idx) => (
                                    <InvestorClusterCard
                                        key={cluster.investor?.id || idx}
                                        cluster={cluster}
                                        onTargetClick={handleTargetClick}
                                        selectedMatchId={selectedMatchId}
                                        countries={countries}
                                        onDismiss={handleDismiss}
                                        onApprove={handleApprove}
                                    />
                                ))}

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div style={{
                                        display: 'flex', justifyContent: 'center',
                                        gap: 8, padding: '16px 0',
                                    }}>
                                        <button
                                            onClick={() => loadMatches(Math.max(1, page - 1))}
                                            disabled={page <= 1}
                                            style={{
                                                padding: '6px 14px', fontSize: 12, fontWeight: 500,
                                                border: '1px solid #e5e7eb', borderRadius: 3,
                                                background: 'white', color: page <= 1 ? '#d1d5db' : '#374151',
                                                cursor: page <= 1 ? 'default' : 'pointer',
                                            }}
                                        >
                                            Previous
                                        </button>
                                        <span style={{ fontSize: 12, color: '#6b7280', display: 'flex', alignItems: 'center' }}>
                                            Page {page} of {totalPages}
                                        </span>
                                        <button
                                            onClick={() => loadMatches(Math.min(totalPages, page + 1))}
                                            disabled={page >= totalPages}
                                            style={{
                                                padding: '6px 14px', fontSize: 12, fontWeight: 500,
                                                border: '1px solid #e5e7eb', borderRadius: 3,
                                                background: 'white', color: page >= totalPages ? '#d1d5db' : '#374151',
                                                cursor: page >= totalPages ? 'default' : 'pointer',
                                            }}
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* RESIZE DIVIDER between center and right */}
                <ResizeDivider onResize={handleResize} />

                {/* RIGHT: Match Comparison Panel — ALWAYS visible */}
                <div style={{
                    flex: '3 1 0%',
                    minWidth: 300,
                    borderLeft: '0px', // divider handles the border
                    background: 'white', display: 'flex', flexDirection: 'column',
                    overflow: 'hidden',
                }}>
                    <MatchComparisonPanel
                        detail={matchDetail}
                        loading={detailLoading}
                        onClose={handleCloseDetail}
                        countries={countries}
                    />
                </div>
            </div>
        </div>
    );
};

export default MatchIQ;
