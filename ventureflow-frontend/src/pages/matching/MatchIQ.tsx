/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react';
import api from '../../config/api';
import EngineController, { MatchWeights, EngineFilters } from './components/EngineController';
import InvestorClusterCard, { ClusteredInvestor } from './components/InvestorClusterCard';
import MatchComparisonPanel, { MatchDetail } from './components/MatchComparisonPanel';
import { Loader2, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/* ─── Types ───────────────────────────────────────────────────────────── */

interface FilterCountry {
    id: number;
    country_name: string;
}

interface FilterIndustry {
    id: number;
    name: string;
}

interface MatchStats {
    total: number;
    excellent: number;
    strong: number;
    good: number;
    fair: number;
    avg_score: number;
}

/* ─── Constants ──────────────────────────────────────────────────────── */

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

/* ─── MatchIQ Page ───────────────────────────────────────────────────── */

const MatchIQ: React.FC = () => {
    const { t } = useTranslation();

    // Engine state
    const [weights, setWeights] = useState<MatchWeights>(DEFAULT_WEIGHTS);
    const [filters, setFilters] = useState<EngineFilters>(DEFAULT_FILTERS);

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
            };
            if (filters.tier !== 'all') params.tier = filters.tier;
            if (filters.industry) params.industry_ids = [filters.industry];
            if (filters.country) params.country_ids = [filters.country];
            if (filters.minScore > 30) params.min_score = filters.minScore;

            const { data } = await api.get('/api/matchiq', { params });
            setClusters(data.data || []);
            setTotalPages(data.meta?.last_page || 1);
            setPage(pageNum);
        } catch (err) {
            console.error('Failed to load matches', err);
        } finally {
            setLoading(false);
        }
    }, [filters]);

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

    /* ─── Render ──────────────────────────────────────────────────────── */

    return (
        <div style={{
            display: 'flex', flexDirection: 'column',
            height: 'calc(100vh - 64px)', overflow: 'hidden',
        }}>
            {/* Page Header */}
            <div style={{
                padding: '16px 24px', borderBottom: '1px solid #e5e7eb',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'white', flexShrink: 0,
            }}>
                <div>
                    <h1 style={{ fontSize: 20, fontWeight: 700, color: '#064771', margin: 0 }}>
                        {t('matchIQ.title', 'Match')}IQ
                    </h1>
                </div>

                {/* Stats pills */}
                {stats && (
                    <div style={{ display: 'flex', gap: 8 }}>
                        {[
                            { label: 'Best', value: stats.excellent },
                            { label: 'Strong', value: stats.strong },
                            { label: 'Good', value: stats.good },
                            { label: 'Fair', value: stats.fair },
                        ].map(s => (
                            <div key={s.label} style={{
                                padding: '6px 14px', borderRadius: 3,
                                background: '#e8f0f6', color: '#064771',
                                fontSize: 12, fontWeight: 600,
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
                    flex: 1, display: 'flex', flexDirection: 'column',
                    overflow: 'hidden', minWidth: 0,
                }}>
                    {/* Center header */}
                    <div style={{
                        padding: '10px 20px', borderBottom: '1px solid #e5e7eb',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        background: 'white', flexShrink: 0,
                    }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
                            {clusters.length} investor group{clusters.length !== 1 ? 's' : ''}
                        </span>
                        <button
                            onClick={() => loadMatches(page)}
                            title="Refresh matches"
                            style={{
                                width: 28, height: 28, border: '1px solid #e5e7eb',
                                borderRadius: 4, background: 'white', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#6b7280',
                            }}
                        >
                            <RefreshCw size={13} />
                        </button>
                    </div>

                    {/* Cards container */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
                        {loading ? (
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                height: '100%', color: '#9ca3af',
                            }}>
                                <Loader2 size={24} className="animate-spin" style={{ marginRight: 8 }} />
                                <span style={{ fontSize: 13 }}>Loading matches…</span>
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
                                                border: '1px solid #e5e7eb', borderRadius: 6,
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
                                                border: '1px solid #e5e7eb', borderRadius: 6,
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

                {/* RIGHT: Match Comparison Panel */}
                {(selectedMatchId || matchDetail) && (
                    <div style={{
                        width: 380, borderLeft: '1px solid #e5e7eb',
                        background: 'white', display: 'flex', flexDirection: 'column',
                        flexShrink: 0,
                    }}>
                        <MatchComparisonPanel
                            detail={matchDetail}
                            loading={detailLoading}
                            onClose={handleCloseDetail}
                            countries={countries}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default MatchIQ;
