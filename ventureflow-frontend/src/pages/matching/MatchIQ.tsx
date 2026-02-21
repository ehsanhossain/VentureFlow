/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../config/api';
import { getCachedCountries, getCachedIndustries } from '../../utils/referenceDataCache';
import { showAlert } from '../../components/Alert';
import { BrandSpinner } from '../../components/BrandSpinner';
import MatchCard from './components/MatchCard';
import MatchFilters from './components/MatchFilters';
import MatchStatsBar from './components/MatchStatsBar';
import { RefreshCw } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────
export interface MatchData {
    id: number;
    buyer_id: number;
    seller_id: number;
    total_score: number;
    industry_score: number;
    geography_score: number;
    financial_score: number;
    profile_score: number;
    timeline_score: number;
    ownership_score: number;
    status: string;
    computed_at: string;
    buyer?: {
        id: number;
        company_overview?: {
            reg_name: string;
            hq_country: string;
            company_industry: any;
            industry_ops: any;
            target_countries: any;
        };
    };
    seller?: {
        id: number;
        company_overview?: {
            reg_name: string;
            hq_country: string;
            industry_ops: any;
            niche_industry: any;
            op_countries: any;
        };
    };
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

export interface FilterCountry {
    id: number;
    name: string;
    flagSrc: string;
    status: 'registered' | 'unregistered';
}

export interface FilterIndustry {
    id: number;
    name: string;
    sub_industries?: FilterIndustry[];
}

// ─── Main Component ─────────────────────────────────────────────────────
const MatchIQ: React.FC = () => {
    const navigate = useNavigate();
    const [matches, setMatches] = useState<MatchData[]>([]);
    const [stats, setStats] = useState<MatchStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [rescanning, setRescanning] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [countries, setCountries] = useState<FilterCountry[]>([]);
    const [industries, setIndustries] = useState<FilterIndustry[]>([]);
    const [filters, setFilters] = useState<MatchFiltersState>({
        min_score: 60,
        industry_ids: [],
        country_ids: [],
        buyer_id: '',
        seller_id: '',
    });

    // ─── Fetch Matches ──────────────────────────────────────────────────
    const fetchMatches = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, any> = { page, per_page: 15 };
            if (filters.min_score) params.min_score = filters.min_score;
            if (filters.industry_ids.length > 0) params.industry_ids = filters.industry_ids;
            if (filters.country_ids.length > 0) params.country_ids = filters.country_ids;
            if (filters.buyer_id) params.buyer_id = filters.buyer_id;
            if (filters.seller_id) params.seller_id = filters.seller_id;

            const response = await api.get('/api/matchiq', { params });
            setMatches(response.data.data);
            setTotalPages(response.data.meta.last_page);
            setTotal(response.data.meta.total);
        } catch (err) {
            console.error('Failed to fetch matches:', err);
        } finally {
            setLoading(false);
        }
    }, [page, filters]);

    const fetchStats = useCallback(async () => {
        try {
            const response = await api.get('/api/matchiq/stats');
            setStats(response.data);
        } catch (err) {
            console.error('Failed to fetch match stats:', err);
        }
    }, []);

    useEffect(() => {
        fetchMatches();
        fetchStats();
    }, [fetchMatches, fetchStats]);

    // ─── Load Reference Data (Countries & Industries) ───────────────────
    useEffect(() => {
        const loadRefData = async () => {
            try {
                const [countryData, industryData] = await Promise.all([
                    getCachedCountries(),
                    getCachedIndustries(),
                ]);
                if (countryData) {
                    setCountries(countryData.map((c: any) => ({
                        id: c.id,
                        name: c.name,
                        flagSrc: c.svg_icon_url || c.flagSrc || '',
                        status: c.status || 'registered',
                    })));
                }
                if (industryData) {
                    setIndustries(industryData.map((i: any) => ({
                        id: i.id,
                        name: i.name,
                        sub_industries: i.sub_industries || [],
                    })));
                }
            } catch (err) {
                console.error('Failed to load reference data:', err);
            }
        };
        loadRefData();
    }, []);

    // ─── Run Scan ────────────────────────────────────────────────────────
    const handleRescan = async () => {
        setRescanning(true);
        try {
            const res = await api.post('/api/matchiq/rescan');
            const count = res.data?.count ?? 0;
            await Promise.all([fetchMatches(), fetchStats()]);

            if (count > 0) {
                showAlert({ type: 'success', message: `Scan complete — ${count} match${count !== 1 ? 'es' : ''} computed.` });
            } else {
                showAlert({ type: 'info', message: 'Scan complete — no new matches found.' });
            }
        } catch (err) {
            console.error('Scan failed:', err);
            showAlert({ type: 'error', message: 'Scan failed. Please try again.' });
        } finally {
            setRescanning(false);
        }
    };

    // ─── Actions ────────────────────────────────────────────────────────
    const handleDismiss = async (id: number) => {
        try {
            await api.post(`/api/matchiq/${id}/dismiss`);
            setMatches(prev => prev.filter(m => m.id !== id));
            fetchStats();
            showAlert({ type: 'success', message: 'Match dismissed.' });
        } catch (err) {
            console.error('Dismiss failed:', err);
            showAlert({ type: 'error', message: 'Failed to dismiss match.' });
        }
    };

    const handleCreateDeal = async (id: number) => {
        try {
            const response = await api.post(`/api/matchiq/${id}/create-deal`);
            const dealId = response.data.deal_id;
            showAlert({ type: 'success', message: 'Deal created successfully!' });
            navigate(`/deal-pipeline`);
            return dealId;
        } catch (err) {
            console.error('Create deal failed:', err);
            showAlert({ type: 'error', message: 'Failed to create deal.' });
        }
    };

    const handleViewInvestor = (buyerId: number) => {
        navigate(`/prospects/investor/${buyerId}`);
    };

    const handleViewTarget = (sellerId: number) => {
        navigate(`/prospects/target/${sellerId}`);
    };

    const handleFilterChange = (newFilters: Partial<MatchFiltersState>) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
        setPage(1);
    };

    // ─── Render ─────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col h-screen bg-white overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 md:px-6 py-4 bg-white border-b">
                <h1 className="text-base font-medium text-gray-900">MatchIQ</h1>
                <button
                    onClick={handleRescan}
                    disabled={rescanning}
                    title="Run scan"
                    style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '8px 16px', borderRadius: '3px',
                        border: '1px solid #d1d5db', background: '#fff',
                        fontSize: '13px', fontWeight: 500, color: '#374151',
                        cursor: rescanning ? 'not-allowed' : 'pointer',
                        opacity: rescanning ? 0.6 : 1,
                        transition: 'all 0.15s',
                    }}
                >
                    <RefreshCw size={14} className={rescanning ? 'spin-animation' : ''} />
                    {rescanning ? 'Scanning…' : 'Run Scan'}
                </button>
            </div>

            {/* Stats Bar */}
            {stats && <div style={{ padding: '12px 24px 0' }}><MatchStatsBar stats={stats} /></div>}

            {/* Content: Filters + Results */}
            <div style={{ display: 'flex', gap: '24px', padding: '16px 24px', flex: 1, overflow: 'auto' }}>
                {/* Filters Sidebar */}
                <div style={{ width: '280px', flexShrink: 0 }}>
                    <MatchFilters
                        filters={filters}
                        onChange={handleFilterChange}
                        countries={countries}
                        industries={industries}
                    />
                </div>

                {/* Match Results */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    {loading ? (
                        <div style={{
                            display: 'flex', justifyContent: 'center', alignItems: 'center',
                            padding: '80px 0'
                        }}>
                            <BrandSpinner />
                        </div>
                    ) : matches.length === 0 ? (
                        <div style={{
                            display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                            flex: 1, minHeight: 'calc(100vh - 300px)', color: '#9ca3af', textAlign: 'center'
                        }}>
                            <img
                                src="/images/no-records-found.png"
                                alt="No matches found"
                                style={{ width: 144, height: 'auto', marginBottom: 16, opacity: 0.85 }}
                                draggable={false}
                            />
                            <p style={{ fontSize: '15px', fontWeight: 500, color: '#374151' }}>No matches found</p>
                            <p style={{ fontSize: '13px', marginTop: '4px', maxWidth: 320 }}>
                                Try lowering the minimum score or click "Run Scan" to compute fresh matches
                            </p>
                        </div>
                    ) : (
                        <>
                            <div style={{
                                fontSize: '12px', color: '#9ca3af', marginBottom: '12px',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                            }}>
                                <span>Showing {matches.length} of {total} matches</span>
                                {stats && (
                                    <span>Average score: <strong style={{ color: '#064771' }}>{stats.avg_score}%</strong></span>
                                )}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {matches.map(match => (
                                    <MatchCard
                                        key={match.id}
                                        match={match}
                                        onDismiss={handleDismiss}
                                        onCreateDeal={handleCreateDeal}
                                        onViewInvestor={handleViewInvestor}
                                        onViewTarget={handleViewTarget}
                                    />
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div style={{
                                    display: 'flex', justifyContent: 'center', gap: '8px',
                                    marginTop: '24px'
                                }}>
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        title="Previous page"
                                        style={{
                                            padding: '6px 14px', borderRadius: '3px',
                                            border: '1px solid #e5e7eb', background: '#fff',
                                            fontSize: '13px', cursor: page === 1 ? 'not-allowed' : 'pointer',
                                            opacity: page === 1 ? 0.5 : 1,
                                        }}
                                    >
                                        ← Prev
                                    </button>
                                    <span style={{
                                        padding: '6px 12px', fontSize: '13px', color: '#6b7280',
                                        display: 'flex', alignItems: 'center'
                                    }}>
                                        Page {page} of {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        title="Next page"
                                        style={{
                                            padding: '6px 14px', borderRadius: '3px',
                                            border: '1px solid #e5e7eb', background: '#fff',
                                            fontSize: '13px', cursor: page === totalPages ? 'not-allowed' : 'pointer',
                                            opacity: page === totalPages ? 0.5 : 1,
                                        }}
                                    >
                                        Next →
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Spinning animation for rescan button */}
            <style>{`
        .spin-animation {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
};

export default MatchIQ;
