/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

import React from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, Search, SlidersHorizontal, AlertTriangle } from 'lucide-react';
import { VFDropdown } from '../../../components/VFDropdown';

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
    countries: { id: number; country_name?: string; name?: string }[];
    industries: { id: number; name?: string; label?: string }[];
}

const DEFAULT_WEIGHTS: MatchWeights = {
    industry: 30,
    geography: 25,
    financial: 25,
    transaction: 20,
};

/* ─── Constants ───────────────────────────────────────────────────────── */

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

    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    const isValid = totalWeight === 100;

    const handleSliderChange = (key: keyof MatchWeights, newValue: number) => {
        const clamped = Math.max(0, Math.min(100, newValue));
        onWeightsChange({ ...weights, [key]: clamped });
    };

    const resetWeights = () => onWeightsChange({ ...DEFAULT_WEIGHTS });

    /* ─── Collapsed state ─── */
    if (collapsed) {
        return (
            <div style={{
                width: 40, minHeight: '100%', background: '#fafbfc',
                borderRight: '1px solid #e5e7eb', display: 'flex',
                flexDirection: 'column', alignItems: 'center', paddingTop: 16,
                transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                overflow: 'hidden', flexShrink: 0,
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
        <div className="scrollbar-premium" style={{
            width: 280, minHeight: '100%', background: '#fafbfc',
            borderRight: '1px solid #e5e7eb', display: 'flex',
            flexDirection: 'column', overflowY: 'auto', overflowX: 'hidden',
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            flexShrink: 0,
        }}>
            {/* Header */}
            <div style={{
                padding: '14px 16px', borderBottom: '1px solid #e5e7eb',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <SlidersHorizontal size={16} color={BRAND} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>Match Engine</span>
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

            {/* Dimension Sliders — all use BRAND color */}
            <div style={{ padding: '16px' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
                    Weight Distribution
                </div>

                {DIMENSION_META.map(dim => (
                    <div key={dim.key} style={{ marginBottom: 18 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>{dim.label}</span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: BRAND }}>{weights[dim.key]}%</span>
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

                {/* Total indicator */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 12px', marginBottom: 12,
                    borderRadius: 3,
                    background: isValid ? '#ecfdf5' : '#fef2f2',
                    border: `1px solid ${isValid ? '#a7f3d0' : '#fecaca'}`,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {!isValid && <AlertTriangle size={13} color="#dc2626" />}
                        <span style={{
                            fontSize: 12, fontWeight: 600,
                            color: isValid ? '#059669' : '#dc2626',
                        }}>
                            Total: {totalWeight}%
                        </span>
                    </div>
                    <span style={{
                        fontSize: 11, fontWeight: 500,
                        color: isValid ? '#059669' : '#dc2626',
                    }}>
                        {isValid ? '✓ Ready' : `${totalWeight > 100 ? 'Over' : 'Under'} by ${Math.abs(100 - totalWeight)}%`}
                    </span>
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <button
                        onClick={resetWeights}
                        style={{
                            flex: 1, padding: '8px 0', fontSize: 12, fontWeight: 500,
                            border: '1px solid #e5e7eb', borderRadius: 3,
                            background: 'white', color: '#6b7280', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                        }}
                    >
                        <RotateCcw size={12} /> Reset
                    </button>
                    <button
                        onClick={onRescan}
                        disabled={rescanning || !isValid}
                        title={!isValid ? 'Weights must total 100% to scan' : ''}
                        style={{
                            flex: 1, padding: '8px 0', fontSize: 12, fontWeight: 500,
                            border: 'none', borderRadius: 3,
                            background: (rescanning || !isValid) ? '#9ca3af' : BRAND,
                            color: 'white',
                            cursor: (rescanning || !isValid) ? 'default' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                            opacity: !isValid ? 0.6 : 1,
                        }}
                    >
                        <Search size={12} /> {rescanning ? 'Scanning…' : 'Run Scan'}
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div style={{ padding: '0 16px 16px', borderTop: '1px solid #e5e7eb', paddingTop: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
                    Filters
                </div>

                {/* Tier Filter */}
                <div style={{ marginBottom: 12 }}>
                    <label className="text-[13px] font-medium text-gray-700" style={{ display: 'block', marginBottom: 4 }}>
                        Tier
                    </label>
                    <VFDropdown
                        options={TIER_OPTIONS}
                        value={filters.tier}
                        onChange={val => onFiltersChange({ tier: val as string })}
                        searchable={false}
                        placeholder="All Tiers"
                    />
                </div>

                {/* Industry Filter */}
                <div style={{ marginBottom: 12 }}>
                    <label className="text-[13px] font-medium text-gray-700" style={{ display: 'block', marginBottom: 4 }}>
                        Industry
                    </label>
                    <VFDropdown
                        options={[{ value: '', label: 'All Industries' }, ...industries.map(i => ({ value: String(i.id), label: i.name || i.label || `Industry #${i.id}` }))]}
                        value={filters.industry}
                        onChange={val => onFiltersChange({ industry: (val as string) || '' })}
                        searchable={false}
                        placeholder="All Industries"
                    />
                </div>

                {/* Country Filter */}
                <div style={{ marginBottom: 12 }}>
                    <label className="text-[13px] font-medium text-gray-700" style={{ display: 'block', marginBottom: 4 }}>
                        Country
                    </label>
                    <VFDropdown
                        options={[{ value: '', label: 'All Countries' }, ...countries.map(c => ({ value: String(c.id), label: c.name || c.country_name || `Country #${c.id}` }))]}
                        value={filters.country}
                        onChange={val => onFiltersChange({ country: (val as string) || '' })}
                        searchable={false}
                        placeholder="All Countries"
                    />
                </div>
            </div>
        </div>
    );
};

export default EngineController;
