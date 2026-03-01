/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { X, Factory, Globe, DollarSign, Handshake, Target, RefreshCw } from 'lucide-react';
import { ProspectsIcon } from '../../../assets/icons';
import BrandSpinner from '../../../components/BrandSpinner';

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
        investment_budget_usd: { min: number; max: number } | null;
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
        expected_investment_amount_usd: { min: number; max: number } | null;
        investment_condition: string | null;
        image: string | null;
        currency: string | null;
    };
}

interface MatchComparisonPanelProps {
    detail: MatchDetail | null;
    loading: boolean;
    onClose: () => void;
    countries: { id: number; country_name?: string; name?: string }[];
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

/** Format a number into human-readable with M/B suffix + raw brackets */
const fmtAmount = (n: number): string => {
    if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
    return String(Math.round(n));
};

const fmtRaw = (n: number): string => {
    return new Intl.NumberFormat('en-US').format(Math.round(n));
};

/** Display budget with USD + raw number + option to toggle source currency */
const BudgetDisplay: React.FC<{
    raw: any;
    usd: { min: number; max: number } | null;
    currency: string | null;
    label: string;
}> = ({ raw, usd, currency, label }) => {
    const [showSource, setShowSource] = useState(false);
    const cur = currency || 'USD';
    const isUsd = cur.toUpperCase() === 'USD';

    // Parse raw original values
    let origMin = 0, origMax = 0;
    if (raw) {
        try {
            const arr = typeof raw === 'string' ? JSON.parse(raw) : raw;
            if (typeof arr === 'object' && arr !== null) {
                origMin = Number(arr.min ?? arr[0] ?? 0);
                origMax = Number(arr.max ?? arr[1] ?? 0);
            }
        } catch { /* */ }
    }

    if (!usd && origMin === 0 && origMax === 0) return <span style={{ color: '#9ca3af' }}>—</span>;

    const usdMin = usd?.min ?? origMin;
    const usdMax = usd?.max ?? origMax;

    return (
        <div>
            <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.5 }}>
                USD {fmtAmount(usdMin)} – {fmtAmount(usdMax)}
                <span style={{ color: '#9ca3af', fontSize: 11 }}>
                    {' '}({fmtRaw(usdMin)} – {fmtRaw(usdMax)})
                </span>
            </div>
            {!isUsd && (
                <button
                    onClick={() => setShowSource(v => !v)}
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        marginTop: 3, padding: '2px 6px', borderRadius: 3,
                        border: '1px solid #e5e7eb', background: showSource ? '#f3f4f6' : 'white',
                        fontSize: 10, color: '#6b7280', cursor: 'pointer',
                    }}
                >
                    <RefreshCw size={9} />
                    {showSource ? 'Hide' : 'Show'} {cur}
                </button>
            )}
            {showSource && !isUsd && (
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 3 }}>
                    {cur} {fmtAmount(origMin)} – {fmtAmount(origMax)}
                    <span style={{ color: '#9ca3af' }}>
                        {' '}({fmtRaw(origMin)} – {fmtRaw(origMax)})
                    </span>
                </div>
            )}
        </div>
    );
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

/**
 * Sort countries: HQ match first, then regions containing HQ, then others alphabetically
 */
const sortCountriesByRelevance = (
    countries: CountryObj[],
    targetHqCountry: CountryObj | null
): CountryObj[] => {
    if (!countries || countries.length === 0 || !targetHqCountry) return countries || [];

    const hqId = targetHqCountry.id;
    const hqName = targetHqCountry.name?.toLowerCase() || '';

    return [...countries].sort((a, b) => {
        // Exact HQ match first
        const aIsHq = a.id === hqId ? 1 : 0;
        const bIsHq = b.id === hqId ? 1 : 0;
        if (aIsHq !== bIsHq) return bIsHq - aIsHq;

        // Regions (ASEAN, etc) before individual countries if they might contain HQ
        const aIsRegion = a.is_region ? 1 : 0;
        const bIsRegion = b.is_region ? 1 : 0;
        if (aIsRegion !== bIsRegion) return bIsRegion - aIsRegion;

        // Alphabetical
        return (a.name || '').localeCompare(b.name || '');
    });
};

/** Render multiple countries/regions with flags — sorted by relevance */
const CountryListWithFlags: React.FC<{ countries: CountryObj[]; targetHqCountry?: CountryObj | null }> = ({
    countries, targetHqCountry,
}) => {
    if (!countries || countries.length === 0) return <span style={{ color: '#9ca3af' }}>—</span>;
    const sorted = sortCountriesByRelevance(countries, targetHqCountry || null);
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {sorted.map((c, i) => (
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

const DIMENSIONS: { key: string; label: string; icon: React.ReactNode; color: string }[] = [
    { key: 'industry_score', label: 'Industry Fit', icon: <Factory size={14} />, color: BRAND },
    { key: 'transaction_score', label: 'Transaction Fit', icon: <Handshake size={14} />, color: BRAND },
    { key: 'geography_score', label: 'Geographic Fit', icon: <Globe size={14} />, color: BRAND },
    { key: 'financial_score', label: 'Financial Fit', icon: <DollarSign size={14} />, color: BRAND },
];

const ScoreBar: React.FC<{ label: string; score: number; icon: React.ReactNode; color: string }> = ({
    label, score, icon, color,
}) => {
    const pct = Math.round(score * 100);
    return (
        <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, color: '#374151' }}>
                    <span style={{ color }}>{icon}</span> {label}
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color }}>{pct}%</span>
            </div>
            <div style={{ height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                    height: '100%', width: `${pct}%`,
                    background: color, borderRadius: 3,
                    transition: 'width 0.4s ease',
                }} />
            </div>
        </div>
    );
};

/* ─── Data row helper ────────────────────────────────────────────────── */

const DataRow: React.FC<{
    leftLabel: string;
    leftContent: React.ReactNode;
    rightLabel: string;
    rightContent: React.ReactNode;
    noBorder?: boolean;
}> = ({ leftLabel, leftContent, rightLabel, rightContent, noBorder }) => (
    <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        borderBottom: noBorder ? 'none' : '1px solid #f3f4f6',
    }}>
        <div style={{ padding: '10px 14px', borderRight: '1px solid #f3f4f6' }}>
            <div style={{
                fontSize: 10, fontWeight: 600, color: '#9ca3af',
                textTransform: 'uppercase', marginBottom: 3,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{leftLabel}</div>
            <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.4 }}>{leftContent}</div>
        </div>
        <div style={{ padding: '10px 14px' }}>
            <div style={{
                fontSize: 10, fontWeight: 600, color: '#9ca3af',
                textTransform: 'uppercase', marginBottom: 3,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{rightLabel}</div>
            <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.4 }}>{rightContent}</div>
        </div>
    </div>
);

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
                flexDirection: 'column',
                color: '#9ca3af',
            }}>
                <BrandSpinner size="sm" />
                <div style={{ fontSize: 13, marginTop: 12 }}>Loading match details…</div>
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
                background: '#fafbfc', flexShrink: 0,
            }}>
                <div style={{ minWidth: 0, overflow: 'hidden' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: BRAND }}>Match Details</div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                        color: '#6b7280', flexShrink: 0,
                    }}
                >
                    <X size={14} />
                </button>
            </div>

            {/* Scrollable body */}
            <div className="scrollbar-premium" style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
                {/* Total Score */}
                <div style={{
                    textAlign: 'center', padding: 16, marginBottom: 16,
                    background: 'white', borderRadius: 3,
                    border: '1px solid #e5e7eb',
                }}>
                    <div style={{ fontSize: 36, fontWeight: 700, color: BRAND }}>
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
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
                        Score Breakdown
                    </div>
                    {DIMENSIONS.map(d => (
                        <ScoreBar
                            key={d.key}
                            label={d.label}
                            score={(match as any)[d.key] ?? 0}
                            icon={d.icon}
                            color={d.color}
                        />
                    ))}
                </div>

                {/* Side-by-side Comparison */}
                <div style={{
                    background: 'white', borderRadius: 3,
                    border: '1px solid #e5e7eb', overflow: 'hidden',
                }}>
                    {/* Comparison header */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #e5e7eb' }}>
                        <div style={{
                            padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 8,
                            borderRight: '1px solid #e5e7eb', background: '#f9fafb',
                            overflow: 'hidden',
                        }}>
                            <ProspectsIcon style={{ width: 16, height: 16, color: BRAND, flexShrink: 0 }} />
                            <div style={{ minWidth: 0, overflow: 'hidden' }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: BRAND }}>Investor</div>
                                <div style={{ fontSize: 11, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {investor.reg_name}
                                </div>
                            </div>
                        </div>
                        <div style={{
                            padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 8,
                            background: '#f9fafb', overflow: 'hidden',
                        }}>
                            <ProspectsIcon style={{ width: 16, height: 16, color: '#6b7280', flexShrink: 0 }} />
                            <div style={{ minWidth: 0, overflow: 'hidden' }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Target</div>
                                <div style={{ fontSize: 11, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {tgt.reg_name}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Data rows */}
                    <DataRow
                        leftLabel="Target Industry"
                        leftContent={parseMultiField(investor.target_industries)}
                        rightLabel="HQ Industry"
                        rightContent={parseMultiField(tgt.industry)}
                    />

                    <DataRow
                        leftLabel="Target Region"
                        leftContent={
                            <CountryListWithFlags
                                countries={investor.target_countries || []}
                                targetHqCountry={tgt.hq_country}
                            />
                        }
                        rightLabel="HQ Region"
                        rightContent={<CountryWithFlag country={tgt.hq_country} />}
                    />

                    <DataRow
                        leftLabel="Purpose of M&A"
                        leftContent={parseMultiField(investor.reason_ma)}
                        rightLabel="Purpose of M&A"
                        rightContent={parseMultiField(tgt.reason_ma)}
                    />

                    <DataRow
                        leftLabel="Structure"
                        leftContent={parseMultiField(investor.investment_condition)}
                        rightLabel="Structure"
                        rightContent={parseMultiField(tgt.investment_condition)}
                    />

                    <DataRow
                        leftLabel="Budget"
                        leftContent={
                            <BudgetDisplay
                                raw={investor.investment_budget}
                                usd={investor.investment_budget_usd}
                                currency={investor.currency}
                                label="Budget"
                            />
                        }
                        rightLabel="Ask"
                        rightContent={
                            <BudgetDisplay
                                raw={tgt.expected_investment_amount}
                                usd={tgt.expected_investment_amount_usd}
                                currency={tgt.currency}
                                label="Ask"
                            />
                        }
                        noBorder
                    />
                </div>
            </div>
        </div>
    );
};

export default MatchComparisonPanel;
