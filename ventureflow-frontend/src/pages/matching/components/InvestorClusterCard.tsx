/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

/* ─── Types ───────────────────────────────────────────────────────────── */

export interface ClusteredTarget {
    match_id: number;
    target_id: number;
    seller_id: string;
    reg_name: string;
    hq_country: string | number | null;
    industry: unknown;
    image: string | null;
    total_score: number;
    industry_score: number;
    geography_score: number;
    financial_score: number;
    transaction_score: number;
    tier: string;
    tier_label: string;
    status: string;
}

export interface ClusteredInvestor {
    investor: {
        id: number;
        buyer_id: string;
        reg_name: string;
        hq_country: string | number | null;
        industry: unknown;
        image: string | null;
    };
    targets: ClusteredTarget[];
    best_score: number;
    target_count: number;
}

interface InvestorClusterCardProps {
    cluster: ClusteredInvestor;
    onTargetClick: (matchId: number) => void;
    selectedMatchId: number | null;
    countries: { id: number; country_name: string }[];
}

/* ─── Constants ───────────────────────────────────────────────────────── */

const BRAND = '#064771';
const BRAND_LIGHT = '#e8f0f6';

const getCountryName = (hqCountry: string | number | null, countries: { id: number; country_name: string }[]): string => {
    if (!hqCountry) return '—';
    const id = typeof hqCountry === 'string' ? parseInt(hqCountry) : hqCountry;
    const found = countries.find(c => c.id === id);
    return found ? found.country_name : String(hqCountry);
};

/** Score badge: Best/Strong (≥80) = brand outlined, below = grey filled */
const ScoreBadge: React.FC<{ score: number; small?: boolean }> = ({ score, small }) => {
    const isHighTier = score >= 80;
    return (
        <div style={{
            padding: small ? '2px 8px' : '3px 10px',
            borderRadius: 3,
            fontSize: small ? 10 : 11,
            fontWeight: 700,
            background: isHighTier ? BRAND_LIGHT : '#f3f4f6',
            color: isHighTier ? BRAND : '#515b69',
            border: isHighTier ? `1px solid ${BRAND}` : '1px solid transparent',
            flexShrink: 0,
        }}>
            {score}%
        </div>
    );
};

/* ─── Component ──────────────────────────────────────────────────────── */

const InvestorClusterCard: React.FC<InvestorClusterCardProps> = ({
    cluster, onTargetClick, selectedMatchId, countries,
}) => {
    const [expanded, setExpanded] = useState(true);
    const { investor, targets, best_score } = cluster;

    return (
        <div style={{
            background: 'white', borderRadius: 3,
            border: '1px solid #e5e7eb', marginBottom: 12,
            overflow: 'hidden',
        }}>
            {/* Investor Header */}
            <button
                onClick={() => setExpanded(!expanded)}
                style={{
                    width: '100%', padding: '14px 16px',
                    display: 'flex', alignItems: 'center',
                    gap: 12, border: 'none', background: 'none',
                    cursor: 'pointer', textAlign: 'left',
                }}
            >
                {/* Round Avatar */}
                <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: BRAND, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: 14, fontWeight: 700,
                    flexShrink: 0, overflow: 'hidden',
                    backgroundImage: investor.image ? `url(${investor.image})` : undefined,
                    backgroundSize: 'cover', backgroundPosition: 'center',
                }}>
                    {!investor.image && (investor.reg_name?.[0] || '?')}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {investor.reg_name}
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                        {getCountryName(investor.hq_country, countries)} · {targets.length} target{targets.length !== 1 ? 's' : ''}
                    </div>
                </div>

                {/* Best Score Badge */}
                <ScoreBadge score={best_score} />

                {/* Expand/Collapse */}
                <div style={{ color: '#9ca3af', flexShrink: 0 }}>
                    {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
            </button>

            {/* Targets List */}
            {expanded && (
                <div style={{ borderTop: '1px solid #f3f4f6' }}>
                    {targets.map(target => {
                        const isSelected = selectedMatchId === target.match_id;

                        return (
                            <button
                                key={target.match_id}
                                onClick={() => onTargetClick(target.match_id)}
                                style={{
                                    width: '100%', padding: '10px 16px 10px 56px',
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    border: 'none', cursor: 'pointer',
                                    borderLeft: isSelected ? `3px solid ${BRAND}` : '3px solid transparent',
                                    background: isSelected ? BRAND_LIGHT : 'transparent',
                                    transition: 'all 0.15s ease',
                                    textAlign: 'left',
                                }}
                                onMouseEnter={e => {
                                    if (!isSelected) (e.currentTarget as HTMLElement).style.background = '#f9fafb';
                                }}
                                onMouseLeave={e => {
                                    if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent';
                                }}
                            >
                                {/* Target round avatar */}
                                <div style={{
                                    width: 28, height: 28, borderRadius: '50%',
                                    background: '#e5e7eb', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                    color: '#6b7280', fontSize: 11, fontWeight: 600,
                                    flexShrink: 0, overflow: 'hidden',
                                    backgroundImage: target.image ? `url(${target.image})` : undefined,
                                    backgroundSize: 'cover', backgroundPosition: 'center',
                                }}>
                                    {!target.image && (target.reg_name?.[0] || '?')}
                                </div>

                                {/* Target info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {target.reg_name}
                                    </div>
                                    <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 1 }}>
                                        {getCountryName(target.hq_country, countries)}
                                    </div>
                                </div>

                                {/* Score badge */}
                                <ScoreBadge score={target.total_score} small />
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default InvestorClusterCard;
