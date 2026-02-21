/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { MatchData } from '../MatchIQ';
import {
    Factory, Globe, DollarSign, Building2, Clock, Users,
    ChevronDown, ChevronUp, X, Briefcase
} from 'lucide-react';

// ─── Tier helpers ──────────────────────────────────────────────────────
function getTier(score: number) {
    if (score >= 90) return { label: 'Excellent', color: '#059669', bg: '#d1fae5' };
    if (score >= 80) return { label: 'Strong', color: '#2563eb', bg: '#dbeafe' };
    if (score >= 70) return { label: 'Good', color: '#d97706', bg: '#fef3c7' };
    return { label: 'Fair', color: '#6b7280', bg: '#f3f4f6' };
}

// ─── Score bar ─────────────────────────────────────────────────────────
const ScoreBar: React.FC<{ label: string; score: number; icon: any; weight: string }> = (
    { label, score, icon: Icon, weight }
) => {
    const pct = Math.round(score * 100);
    const hue = pct >= 70 ? 142 : pct >= 50 ? 45 : 0;
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Icon size={13} style={{ color: '#9ca3af', flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color: '#6b7280', width: '72px', flexShrink: 0 }}>
                {label} <span style={{ color: '#c4c9d0', fontSize: '10px' }}>({weight})</span>
            </span>
            <div style={{
                flex: 1, height: '6px', background: '#f3f4f6',
                borderRadius: '3px', overflow: 'hidden'
            }}>
                <div style={{
                    width: `${pct}%`, height: '100%',
                    background: `hsl(${hue}, 60%, 50%)`,
                    borderRadius: '3px',
                    transition: 'width 0.3s ease',
                }} />
            </div>
            <span style={{ fontSize: '11px', color: '#374151', width: '32px', textAlign: 'right', fontWeight: 600 }}>
                {pct}%
            </span>
        </div>
    );
};

// ─── MatchCard ─────────────────────────────────────────────────────────
interface MatchCardProps {
    match: MatchData;
    onDismiss: (id: number) => void;
    onCreateDeal: (id: number) => void;
    onViewInvestor: (buyerId: number) => void;
    onViewTarget: (sellerId: number) => void;
}

const MatchCard: React.FC<MatchCardProps> = ({
    match, onDismiss, onCreateDeal, onViewInvestor, onViewTarget
}) => {
    const [expanded, setExpanded] = useState(false);
    const tier = getTier(match.total_score);

    const buyerName = match.buyer?.company_overview?.reg_name || `Investor #${match.buyer_id}`;
    const sellerName = match.seller?.company_overview?.reg_name || `Target #${match.seller_id}`;

    return (
        <div style={{
            background: '#fff', border: '1px solid #e5e7eb', borderRadius: '3px',
            padding: '16px 20px',
            transition: 'box-shadow 0.15s, border-color 0.15s',
            cursor: 'default',
        }}
            onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)';
                e.currentTarget.style.borderColor = '#d1d5db';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = '#e5e7eb';
            }}
        >
            {/* Top Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                {/* Left: Investor ↔ Target */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                    {/* Score circle */}
                    <div style={{
                        width: '48px', height: '48px', borderRadius: '50%',
                        background: tier.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        <span style={{
                            fontSize: '14px', fontWeight: 700, color: tier.color
                        }}>
                            {match.total_score}
                        </span>
                    </div>

                    {/* Names */}
                    <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span
                                onClick={() => onViewInvestor(match.buyer_id)}
                                title={`View ${buyerName}`}
                                style={{
                                    fontSize: '14px', fontWeight: 600, color: '#0a2540',
                                    cursor: 'pointer', textDecoration: 'none',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.color = '#064771')}
                                onMouseLeave={e => (e.currentTarget.style.color = '#0a2540')}
                            >
                                {buyerName}
                            </span>
                            <span style={{ fontSize: '12px', color: '#c4c9d0' }}>↔</span>
                            <span
                                onClick={() => onViewTarget(match.seller_id)}
                                title={`View ${sellerName}`}
                                style={{
                                    fontSize: '14px', fontWeight: 600, color: '#0a2540',
                                    cursor: 'pointer', textDecoration: 'none',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.color = '#064771')}
                                onMouseLeave={e => (e.currentTarget.style.color = '#0a2540')}
                            >
                                {sellerName}
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                            <span style={{
                                fontSize: '11px', fontWeight: 600, color: tier.color,
                                background: tier.bg, padding: '1px 8px', borderRadius: '3px',
                            }}>
                                {tier.label}
                            </span>
                            {match.buyer?.company_overview?.hq_country && (
                                <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                                    <Globe size={10} style={{ display: 'inline', marginRight: '3px' }} />
                                    {match.buyer.company_overview.hq_country}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <button
                        onClick={() => setExpanded(v => !v)}
                        title={expanded ? 'Collapse details' : 'Expand details'}
                        style={{
                            padding: '5px', borderRadius: '3px', border: '1px solid #e5e7eb',
                            background: 'transparent', cursor: 'pointer', display: 'flex',
                        }}
                    >
                        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    <button
                        onClick={() => onCreateDeal(match.id)}
                        title="Create deal from this match"
                        style={{
                            display: 'flex', alignItems: 'center', gap: '4px',
                            padding: '5px 10px', borderRadius: '3px',
                            border: '1px solid #064771', background: '#064771',
                            color: '#fff', fontSize: '12px', fontWeight: 500,
                            cursor: 'pointer', transition: 'opacity 0.15s',
                        }}
                    >
                        <Briefcase size={12} />
                        Deal
                    </button>
                    <button
                        onClick={() => onDismiss(match.id)}
                        title="Dismiss this match"
                        style={{
                            padding: '5px', borderRadius: '3px', border: '1px solid #fecaca',
                            background: '#fef2f2', cursor: 'pointer', display: 'flex',
                        }}
                    >
                        <X size={14} style={{ color: '#ef4444' }} />
                    </button>
                </div>
            </div>

            {/* Expanded: Score breakdown */}
            {expanded && (
                <div style={{
                    marginTop: '16px', paddingTop: '16px',
                    borderTop: '1px solid #f3f4f6',
                }}>
                    <div style={{ maxWidth: '480px' }}>
                        <ScoreBar label="Industry" score={match.industry_score} icon={Factory} weight="25%" />
                        <ScoreBar label="Geography" score={match.geography_score} icon={Globe} weight="20%" />
                        <ScoreBar label="Financial" score={match.financial_score} icon={DollarSign} weight="20%" />
                        <ScoreBar label="Profile" score={match.profile_score} icon={Building2} weight="15%" />
                        <ScoreBar label="Timeline" score={match.timeline_score} icon={Clock} weight="10%" />
                        <ScoreBar label="Ownership" score={match.ownership_score} icon={Users} weight="10%" />
                    </div>
                    <div style={{
                        marginTop: '10px', display: 'flex', gap: '12px', fontSize: '11px', color: '#9ca3af'
                    }}>
                        <span>Computed: {new Date(match.computed_at).toLocaleDateString()}</span>
                        <span>ID: #{match.id}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MatchCard;
