/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

import React from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, Search, SlidersHorizontal } from 'lucide-react';

/* ─── Types ───────────────────────────────────────────────────────────── */

export interface MatchWeights {
    industry: number;
    geography: number;
    financial: number;
    transaction: number;
}

export interface EngineFilters {
    minScore: number;
    tier: string;
    industry: string;
    country: string;
}

interface EngineControllerProps {
    weights: MatchWeights;
    onWeightsChange: (weights: MatchWeights) => void;
    filters: EngineFilters;
    onFiltersChange: (filters: Partial<EngineFilters>) => void;
    onRescan: () => void;
    rescanning: boolean;
    collapsed: boolean;
    onToggleCollapse: () => void;
    countries: { id: number; country_name: string }[];
    industries: { id: number; name: string }[];
}

const DEFAULT_WEIGHTS: MatchWeights = {
    industry: 30,
    geography: 25,
    financial: 25,
    transaction: 20,
};

/* ─── Helpers ─────────────────────────────────────────────────────────── */

const BRAND = '#064771';

const DIMENSION_META: { key: keyof MatchWeights; label: string }[] = [
    { key: 'industry', label: 'Industry Fit' },
    { key: 'transaction', label: 'Transaction Fit' },
    { key: 'geography', label: 'Geographic Fit' },
    { key: 'financial', label: 'Financial Fit' },
];

const TIER_OPTIONS = [
    { value: 'all', label: 'All Tiers' },
    { value: 'excellent', label: 'Best Fit ≥90' },
    { value: 'strong', label: 'Strong Fit ≥80' },
    { value: 'good', label: 'Good Fit ≥70' },
    { value: 'fair', label: 'Fair ≥60' },
];

/* ─── Component ──────────────────────────────────────────────────────── */

const EngineController: React.FC<EngineControllerProps> = ({
    weights, onWeightsChange, filters, onFiltersChange,
    onRescan, rescanning, collapsed, onToggleCollapse,
    countries, industries,
}) => {

    const handleSliderChange = (key: keyof MatchWeights, newValue: number) => {
        const clamped = Math.max(0, Math.min(100, newValue));
        const oldValue = weights[key];
        const delta = clamped - oldValue;

        if (delta === 0) return;

        const otherKeys = DIMENSION_META.map(d => d.key).filter(k => k !== key);
        const otherSum = otherKeys.reduce((s, k) => s + weights[k], 0);

        const updated = { ...weights, [key]: clamped };

        if (otherSum > 0) {
            otherKeys.forEach(k => {
                updated[k] = Math.max(0, Math.round(weights[k] - (delta * (weights[k] / otherSum))));
            });
        } else {
            const share = Math.round((100 - clamped) / otherKeys.length);
            otherKeys.forEach(k => { updated[k] = share; });
        }

        const sum = Object.values(updated).reduce((a, b) => a + b, 0);
        if (sum !== 100) {
            const diff = 100 - sum;
            const adjustKey = otherKeys.find(k => updated[k] + diff >= 0) || otherKeys[0];
            updated[adjustKey] += diff;
        }

        onWeightsChange(updated);
    };

    const resetWeights = () => onWeightsChange({ ...DEFAULT_WEIGHTS });

    /* ─── Collapsed state ─── */
    if (collapsed) {
        return (
            <div style={{
                width: 40, minHeight: '100%', background: '#fafbfc',
                borderRight: '1px solid #e5e7eb', display: 'flex',
                flexDirection: 'column', alignItems: 'center', paddingTop: 16,
                transition: 'width 0.25s ease',
            }}>
                <button
                    onClick={onToggleCollapse}
                    title="Expand Match Engine"
                    style={{
                        width: 32, height: 32, border: '1px solid #e5e7eb',
                        borderRadius: 3, background: 'white', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#6b7280',
                    }}
                >
                    <ChevronRight size={16} />
                </button>
                <div style={{
                    writingMode: 'vertical-rl', transform: 'rotate(180deg)',
                    marginTop: 20, fontSize: 11, fontWeight: 600,
                    color: '#9ca3af', letterSpacing: '0.1em', textTransform: 'uppercase',
                }}>
                    Match Engine
                </div>
            </div>
        );
    }

    /* ─── Expanded panel ─── */
    return (
        <div style={{
            width: 280, minHeight: '100%', background: '#fafbfc',
            borderRight: '1px solid #e5e7eb', display: 'flex',
            flexDirection: 'column', overflowY: 'auto',
            transition: 'width 0.25s ease',
        }}>
            {/* Header */}
            <div style={{
                padding: '14px 16px', borderBottom: '1px solid #e5e7eb',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <SlidersHorizontal size={16} color={BRAND} />
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Match Engine</span>
                </div>
                <button
                    onClick={onToggleCollapse}
                    title="Collapse"
                    style={{
                        width: 28, height: 28, border: '1px solid #e5e7eb',
                        borderRadius: 3, background: 'white', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#6b7280',
                    }}
                >
                    <ChevronLeft size={14} />
                </button>
            </div>

            {/* Dimension Sliders */}
            <div style={{ padding: '16px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
                    Weight Distribution
                </div>

                {DIMENSION_META.map(dim => (
                    <div key={dim.key} style={{ marginBottom: 18 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>{dim.label}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: BRAND }}>{weights[dim.key]}%</span>
                        </div>
                        <div style={{ position: 'relative', height: 24, display: 'flex', alignItems: 'center' }}>
                            <div style={{
                                position: 'absolute', left: 0, right: 0, height: 6,
                                background: '#e5e7eb', borderRadius: 3,
                            }} />
                            <div style={{
                                position: 'absolute', left: 0, height: 6,
                                width: `${weights[dim.key]}%`, background: BRAND,
                                borderRadius: 3, transition: 'width 0.15s ease',
                            }} />
                            <input
                                type="range" min={0} max={100} value={weights[dim.key]}
                                onChange={e => handleSliderChange(dim.key, parseInt(e.target.value))}
                                style={{
                                    position: 'absolute', left: 0, right: 0, height: 24,
                                    opacity: 0, cursor: 'pointer', zIndex: 2,
                                }}
                                title={`${dim.label}: ${weights[dim.key]}%`}
                            />
                            <div style={{
                                position: 'absolute', left: `calc(${weights[dim.key]}% - 8px)`,
                                width: 16, height: 16, borderRadius: '50%',
                                background: 'white', border: `2px solid ${BRAND}`,
                                boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                                pointerEvents: 'none', transition: 'left 0.15s ease',
                            }} />
                        </div>
                    </div>
                ))}

                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <button
                        onClick={resetWeights}
                        style={{
                            flex: 1, padding: '8px 0', fontSize: 12, fontWeight: 600,
                            border: '1px solid #e5e7eb', borderRadius: 3,
                            background: 'white', color: '#6b7280', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                        }}
                    >
                        <RotateCcw size={12} /> Reset
                    </button>
                    <button
                        onClick={onRescan}
                        disabled={rescanning}
                        style={{
                            flex: 1, padding: '8px 0', fontSize: 12, fontWeight: 600,
                            border: 'none', borderRadius: 3,
                            background: rescanning ? '#9ca3af' : BRAND,
                            color: 'white', cursor: rescanning ? 'default' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                        }}
                    >
                        <Search size={12} /> {rescanning ? 'Scanning…' : 'Run Scan'}
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div style={{ padding: '0 16px 16px', borderTop: '1px solid #e5e7eb', paddingTop: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
                    Filters
                </div>

                {/* Tier Filter */}
                <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 12, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 4 }}>
                        Tier
                    </label>
                    <select
                        value={filters.tier}
                        onChange={e => onFiltersChange({ tier: e.target.value })}
                        title="Filter by tier"
                        style={{
                            width: '100%', padding: '7px 10px', fontSize: 12,
                            border: '1px solid #e5e7eb', borderRadius: 3,
                            background: 'white', color: '#374151',
                        }}
                    >
                        {TIER_OPTIONS.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                </div>

                {/* Industry Filter */}
                <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 12, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 4 }}>
                        Industry
                    </label>
                    <select
                        value={filters.industry}
                        onChange={e => onFiltersChange({ industry: e.target.value })}
                        title="Filter by industry"
                        style={{
                            width: '100%', padding: '7px 10px', fontSize: 12,
                            border: '1px solid #e5e7eb', borderRadius: 3,
                            background: 'white', color: '#374151',
                        }}
                    >
                        <option value="">All Industries</option>
                        {industries.map(i => (
                            <option key={i.id} value={String(i.id)}>{i.name}</option>
                        ))}
                    </select>
                </div>

                {/* Country Filter */}
                <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 12, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 4 }}>
                        Country
                    </label>
                    <select
                        value={filters.country}
                        onChange={e => onFiltersChange({ country: e.target.value })}
                        title="Filter by country"
                        style={{
                            width: '100%', padding: '7px 10px', fontSize: 12,
                            border: '1px solid #e5e7eb', borderRadius: 3,
                            background: 'white', color: '#374151',
                        }}
                    >
                        <option value="">All Countries</option>
                        {countries.map(c => (
                            <option key={c.id} value={String(c.id)}>{c.country_name}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
};

export default EngineController;
