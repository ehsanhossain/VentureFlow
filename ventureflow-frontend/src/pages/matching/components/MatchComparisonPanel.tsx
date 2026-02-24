/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

import React from 'react';
import { X, Factory, Globe, DollarSign, Handshake, Target } from 'lucide-react';
import { ProspectsIcon } from '../../../assets/icons';

/* ─── Types ───────────────────────────────────────────────────────────── */

/* eslint-disable @typescript-eslint/no-explicit-any */

interface CountryObj {
    id: number;
    name: string;
    flag: string;
    is_region: boolean;
}

export interface MatchDetail {
    match: {
        id: number;
        total_score: number;
        industry_score: number;
        geography_score: number;
        financial_score: number;
        transaction_score: number;
        tier: string;
        tier_label: string;
        status: string;
    };
    investor: {
        id: number;
        buyer_id: string;
        reg_name: string;
        hq_country: CountryObj | null;
        industry: any;
        target_industries: any;
        target_countries: CountryObj[];
        investment_budget: any;
        investment_condition: string | null;
        reason_ma: string | null;
        image: string | null;
        currency: string | null;
    };
    target: {
        id: number;
        seller_id: string;
        reg_name: string;
        hq_country: CountryObj | null;
        industry: any;
        reason_ma: string | null;
        expected_investment_amount: any;
        investment_condition: string | null;
        image: string | null;
        currency: string | null;
    };
}

interface MatchComparisonPanelProps {
    detail: MatchDetail | null;
    loading: boolean;
    onClose: () => void;
    countries: { id: number; country_name: string }[];
}

/* ─── Constants ───────────────────────────────────────────────────────── */

const BRAND = '#064771';

/* ─── Helpers ─────────────────────────────────────────────────────────── */

const parseMultiField = (val: any): string => {
    if (!val) return '—';
    if (typeof val === 'string') {
        try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) {
                return parsed.map((v: any) => typeof v === 'object' ? (v.name || v.label || JSON.stringify(v)) : String(v)).join(', ') || '—';
            }
            return String(val);
        } catch {
            return val;
        }
    }
    if (Array.isArray(val)) {
        return val.map((v: any) => typeof v === 'object' ? (v.name || v.label || v.country_name || JSON.stringify(v)) : String(v)).join(', ') || '—';
    }
    return String(val);
};

const parseBudget = (val: any, currency: string | null): string => {
    if (!val) return '—';
    try {
        const arr = typeof val === 'string' ? JSON.parse(val) : val;
        if (typeof arr === 'object' && arr !== null) {
            const min = arr.min ?? arr[0] ?? 0;
            const max = arr.max ?? arr[1] ?? 0;
            const cur = currency || 'USD';
            const fmt = (n: number) => n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(0)}K` : String(n);
            return `${cur} ${fmt(Number(min))} – ${fmt(Number(max))}`;
        }
    } catch { /* */ }
    return String(val);
};

/** Render a country with its flag inline */
const CountryWithFlag: React.FC<{ country: CountryObj | null }> = ({ country }) => {
    if (!country) return <span style={{ color: '#9ca3af' }}>—</span>;
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {country.flag && (
                <img
                    src={country.flag}
                    alt=""
                    style={{ width: 16, height: 16, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                />
            )}
            <span>{country.name}</span>
        </span>
    );
};

/** Render multiple countries/regions with flags */
const CountryListWithFlags: React.FC<{ countries: CountryObj[] }> = ({ countries }) => {
    if (!countries || countries.length === 0) return <span style={{ color: '#9ca3af' }}>—</span>;
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {countries.map((c, i) => (
                <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                    {c.flag && (
                        <img
                            src={c.flag}
                            alt=""
                            style={{ width: 14, height: 14, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                        />
                    )}
                    <span>{c.name}</span>
                </span>
            ))}
        </div>
    );
};

/* ─── Dimension Score Bar ─────────────────────────────────────────────── */

const DIMENSIONS: { key: string; label: string; icon: React.ReactNode }[] = [
    { key: 'industry_score', label: 'Industry Fit', icon: <Factory size={14} /> },
    { key: 'transaction_score', label: 'Transaction Fit', icon: <Handshake size={14} /> },
    { key: 'geography_score', label: 'Geographic Fit', icon: <Globe size={14} /> },
    { key: 'financial_score', label: 'Financial Fit', icon: <DollarSign size={14} /> },
];

const ScoreBar: React.FC<{ label: string; score: number; icon: React.ReactNode }> = ({
    label, score, icon,
}) => {
    const pct = Math.round(score * 100);
    return (
        <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, color: '#374151' }}>
                    <span style={{ color: BRAND }}>{icon}</span> {label}
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: BRAND }}>{pct}%</span>
            </div>
            <div style={{ height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                    height: '100%', width: `${pct}%`,
                    background: BRAND, borderRadius: 3,
                    transition: 'width 0.4s ease',
                }} />
            </div>
        </div>
    );
};

/* ─── Main Component ──────────────────────────────────────────────────── */

const MatchComparisonPanel: React.FC<MatchComparisonPanelProps> = ({
    detail, loading, onClose,
}) => {

    if (!detail && !loading) {
        return (
            <div style={{
                width: '100%', height: '100%', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', color: '#9ca3af', padding: 24,
            }}>
                <Target size={40} strokeWidth={1} style={{ marginBottom: 12 }} />
                <div style={{ fontSize: 14, fontWeight: 500 }}>Select a target to compare</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Click on a target from the match results</div>
            </div>
        );
    }

    if (loading) {
        return (
            <div style={{
                width: '100%', height: '100%', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                color: '#9ca3af',
            }}>
                <div style={{ fontSize: 13 }}>Loading match details…</div>
            </div>
        );
    }

    if (!detail) return null;

    const { match, investor, target: tgt } = detail;

    return (
        <div style={{
            width: '100%', height: '100%', display: 'flex',
            flexDirection: 'column', overflow: 'hidden',
        }}>
            {/* Header */}
            <div style={{
                padding: '14px 16px', borderBottom: '1px solid #e5e7eb',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: '#fafbfc',
            }}>
                <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: BRAND }}>Match Details</div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                        {match.tier_label} · {match.total_score}% overall
                    </div>
                </div>
                <button
                    onClick={onClose}
                    title="Close comparison panel"
                    style={{
                        width: 28, height: 28, border: '1px solid #e5e7eb',
                        borderRadius: 3, background: 'white', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#6b7280',
                    }}
                >
                    <X size={14} />
                </button>
            </div>

            {/* Scrollable body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
                {/* Total Score */}
                <div style={{
                    textAlign: 'center', padding: 16, marginBottom: 16,
                    background: 'white', borderRadius: 3,
                    border: '1px solid #e5e7eb',
                }}>
                    <div style={{ fontSize: 36, fontWeight: 800, color: BRAND }}>
                        {match.total_score}%
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: BRAND, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        {match.tier_label}
                    </div>
                </div>

                {/* Dimension Scores */}
                <div style={{
                    background: 'white', borderRadius: 3,
                    border: '1px solid #e5e7eb', padding: 16, marginBottom: 16,
                }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
                        Score Breakdown
                    </div>
                    {DIMENSIONS.map(d => (
                        <ScoreBar
                            key={d.key}
                            label={d.label}
                            score={(match as any)[d.key] ?? 0}
                            icon={d.icon}
                        />
                    ))}
                </div>

                {/* Side-by-side Comparison */}
                <div style={{
                    background: 'white', borderRadius: 3,
                    border: '1px solid #e5e7eb', overflow: 'hidden',
                }}>
                    {/* Comparison header — using ProspectsIcon for both */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #e5e7eb' }}>
                        <div style={{
                            padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 8,
                            borderRight: '1px solid #e5e7eb', background: '#f9fafb',
                        }}>
                            <ProspectsIcon style={{ width: 16, height: 16, color: BRAND }} />
                            <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: BRAND }}>Investor</div>
                                <div style={{ fontSize: 11, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {investor.reg_name}
                                </div>
                            </div>
                        </div>
                        <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 8, background: '#f9fafb' }}>
                            <ProspectsIcon style={{ width: 16, height: 16, color: '#6b7280' }} />
                            <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Target</div>
                                <div style={{ fontSize: 11, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {tgt.reg_name}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- Data rows --- */}

                    {/* Row 1: Target Industry (investor) | HQ Industry (target) */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #f3f4f6' }}>
                        <div style={{ padding: '10px 14px', borderRight: '1px solid #f3f4f6' }}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 3 }}>Target Industry</div>
                            <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.4 }}>{parseMultiField(investor.target_industries)}</div>
                        </div>
                        <div style={{ padding: '10px 14px' }}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 3 }}>HQ Industry</div>
                            <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.4 }}>{parseMultiField(tgt.industry)}</div>
                        </div>
                    </div>

                    {/* Row 2: Target Region (investor) | HQ Region (target) — with flags */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #f3f4f6' }}>
                        <div style={{ padding: '10px 14px', borderRight: '1px solid #f3f4f6' }}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 3 }}>Target Region</div>
                            <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.4 }}>
                                <CountryListWithFlags countries={investor.target_countries || []} />
                            </div>
                        </div>
                        <div style={{ padding: '10px 14px' }}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 3 }}>HQ Region</div>
                            <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.4 }}>
                                <CountryWithFlag country={tgt.hq_country} />
                            </div>
                        </div>
                    </div>

                    {/* Row 3: Purpose of M&A */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #f3f4f6' }}>
                        <div style={{ padding: '10px 14px', borderRight: '1px solid #f3f4f6' }}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 3 }}>Purpose of M&A</div>
                            <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.4 }}>{parseMultiField(investor.reason_ma)}</div>
                        </div>
                        <div style={{ padding: '10px 14px' }}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 3 }}>Purpose of M&A</div>
                            <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.4 }}>{parseMultiField(tgt.reason_ma)}</div>
                        </div>
                    </div>

                    {/* Row 4: Structure */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #f3f4f6' }}>
                        <div style={{ padding: '10px 14px', borderRight: '1px solid #f3f4f6' }}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 3 }}>Structure</div>
                            <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.4 }}>{parseMultiField(investor.investment_condition)}</div>
                        </div>
                        <div style={{ padding: '10px 14px' }}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 3 }}>Structure</div>
                            <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.4 }}>{parseMultiField(tgt.investment_condition)}</div>
                        </div>
                    </div>

                    {/* Row 5: Budget / Ask */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                        <div style={{ padding: '10px 14px', borderRight: '1px solid #f3f4f6' }}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 3 }}>Budget</div>
                            <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.4 }}>{parseBudget(investor.investment_budget, investor.currency)}</div>
                        </div>
                        <div style={{ padding: '10px 14px' }}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 3 }}>Ask</div>
                            <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.4 }}>{parseBudget(tgt.expected_investment_amount, tgt.currency)}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MatchComparisonPanel;
