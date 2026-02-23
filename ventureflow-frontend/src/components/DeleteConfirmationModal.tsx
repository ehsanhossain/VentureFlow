/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

import React, { useState, useEffect } from 'react';
import { Trash2, X, Loader2, AlertTriangle } from 'lucide-react';
import { BrandSpinner } from './BrandSpinner';
import api from '../config/api';
import dealsPipelineIcon from '../assets/icons/deals-pipeline.svg';
import introducedProjectsIcon from '../assets/icons/introduced-projects.svg';
import logsDocumentIcon from '../assets/icons/logs-document.svg';
import impactAccountsIcon from '../assets/icons/impact-accounts.svg';

interface DeletionImpact {
    count: number;
    deals: number;
    active_deals: number;
    introduced_projects: number;
    activities: number;
}

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    itemType: 'investors' | 'targets';
    selectedIds: number[];
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    itemType,
    selectedIds
}) => {
    const [impact, setImpact] = useState<DeletionImpact | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [confirmText, setConfirmText] = useState('');

    useEffect(() => {
        if (isOpen && selectedIds.length > 0) {
            fetchImpact();
        } else {
            setImpact(null);
            setError(null);
            setConfirmText('');
        }
    }, [isOpen, selectedIds, itemType]);

    const fetchImpact = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const endpoint = itemType === 'investors' ? '/api/buyer/delete-analyze' : '/api/seller/delete-analyze';
            const response = await api.get(endpoint, { params: { ids: selectedIds } });
            setImpact(response.data);
        } catch (err: unknown) {
            console.error('Failed to fetch deletion impact', err);
            setError('Failed to analyze the impact of this deletion. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    const isCritical = impact && (impact.active_deals > 0);
    const canConfirm = confirmText.toLowerCase() === 'delete';

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(2px)',
            animation: 'fadeIn 200ms ease-out'
        }}>
            <div style={{
                background: '#fff',
                borderRadius: '3px',
                border: '1px solid #F3F4F6',
                width: '100%',
                maxWidth: '448px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                animation: 'zoomIn 200ms ease-out'
            }}>
                {/* ─── Header ─── */}
                <div style={{
                    padding: '16px',
                    background: '#fff',
                    borderBottom: '1px solid #F3F4F6',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Trash2 style={{ width: '20px', height: '20px', color: '#374151', strokeWidth: 1.5 }} />
                        <span style={{
                            color: '#374151',
                            fontSize: '16px',
                            fontFamily: 'Inter, sans-serif',
                            fontWeight: 500,
                            lineHeight: '24px',
                            letterSpacing: '-0.4px'
                        }}>{title}</span>
                    </div>
                    <button
                        onClick={onClose}
                        title="Close"
                        aria-label="Close"
                        style={{
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '3px',
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            padding: 0
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#F3F4F6')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                        <X style={{ width: '16px', height: '16px', color: '#9CA3AF' }} />
                    </button>
                </div>

                {/* ─── Body ─── */}
                <div style={{
                    padding: '0 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '28px',
                    marginTop: '28px'
                }}>
                    {isLoading ? (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '32px 0',
                            gap: '12px'
                        }}>
                            <BrandSpinner size="lg" />
                            <p style={{
                                fontSize: '14px',
                                color: '#6B7280',
                                fontFamily: 'Inter, sans-serif',
                                fontWeight: 500,
                                margin: 0
                            }}>Analyzing impacts...</p>
                        </div>
                    ) : error ? (
                        <div style={{
                            background: '#FEF2F2',
                            padding: '12px',
                            borderRadius: '3px',
                            display: 'flex',
                            gap: '8px',
                            color: '#991B1B'
                        }}>
                            <AlertTriangle style={{ width: '16px', height: '16px', flexShrink: 0, marginTop: '2px' }} />
                            <p style={{ fontSize: '14px', margin: 0, fontFamily: 'Inter, sans-serif' }}>{error}</p>
                        </div>
                    ) : impact ? (
                        <>
                            {/* ─── Alert Container ─── */}
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '22px'
                            }}>
                                {/* Danger Zone Banner */}
                                <div style={{
                                    background: '#940F24',
                                    borderRadius: '3px',
                                    padding: '8px',
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '8px',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        flex: 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '4px'
                                    }}>
                                        <p style={{
                                            color: '#fff',
                                            fontSize: '14px',
                                            fontFamily: 'Inter, sans-serif',
                                            fontWeight: 600,
                                            lineHeight: '20px',
                                            margin: 0
                                        }}>Danger Zone</p>
                                        <p style={{
                                            fontSize: '12px',
                                            fontFamily: 'Inter, sans-serif',
                                            lineHeight: '18px',
                                            margin: 0
                                        }}>
                                            <span style={{ color: '#FAB8B8', fontWeight: 400 }}>You are about to delete</span>
                                            <span style={{ color: '#fff', fontWeight: 400 }}> </span>
                                            <span style={{ color: '#fff', fontWeight: 600 }}>{impact.count} {itemType === 'investors' ? 'investor(s).' : 'target(s).'}</span>
                                            <span style={{ color: '#fff', fontWeight: 400 }}> </span>
                                            <span style={{ color: '#FAB8B8', fontWeight: 400 }}>This action is</span>
                                            <span style={{ color: '#fff', fontWeight: 400 }}> </span>
                                            <span style={{ color: '#fff', fontWeight: 600 }}>permanent</span>
                                            <span style={{ color: '#fff', fontWeight: 400 }}> </span>
                                            <span style={{ color: '#FAB8B8', fontWeight: 400 }}>and cannot be undone.</span>
                                        </p>
                                    </div>
                                </div>

                                {/* Associated Data Section */}
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '19px'
                                }}>
                                    {/* Section Header */}
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '10px'
                                    }}>
                                        <span style={{
                                            color: '#6B7280',
                                            fontSize: '14px',
                                            fontFamily: 'Inter, sans-serif',
                                            fontWeight: 500,
                                            textTransform: 'capitalize' as const
                                        }}>Associated Data Will Be Removed</span>
                                        <div style={{ height: '1px', background: '#E5E7EB' }} />
                                    </div>

                                    {/* Data Rows */}
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '12px'
                                    }}>
                                        {/* Deals Row */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px'
                                                }}>
                                                    <img
                                                        src={dealsPipelineIcon}
                                                        alt=""
                                                        style={{ width: '24px', height: '24px' }}
                                                    />
                                                    <span style={{
                                                        color: '#4B5563',
                                                        fontSize: '14px',
                                                        fontFamily: 'Inter, sans-serif',
                                                        fontWeight: 400,
                                                        lineHeight: '20px'
                                                    }}>Deals</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    {impact.active_deals > 0 && (
                                                        <span style={{
                                                            fontSize: '10px',
                                                            fontWeight: 500,
                                                            color: '#D97706',
                                                            background: '#FFFBEB',
                                                            padding: '1px 6px',
                                                            borderRadius: '2px'
                                                        }}>
                                                            {impact.active_deals} Active
                                                        </span>
                                                    )}
                                                    <span style={{
                                                        color: '#000',
                                                        fontSize: '14px',
                                                        fontFamily: 'Inter, sans-serif',
                                                        fontWeight: 400,
                                                        lineHeight: '20px'
                                                    }}>{impact.deals}</span>
                                                </div>
                                            </div>
                                            <div style={{ height: '1px', background: '#E5E7EB' }} />
                                        </div>

                                        {/* Introduced Projects Row */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px'
                                                }}>
                                                    <img
                                                        src={introducedProjectsIcon}
                                                        alt=""
                                                        style={{ width: '24px', height: '24px' }}
                                                    />
                                                    <span style={{
                                                        color: '#4B5563',
                                                        fontSize: '14px',
                                                        fontFamily: 'Inter, sans-serif',
                                                        fontWeight: 400,
                                                        lineHeight: '20px'
                                                    }}>Introduced Projects</span>
                                                </div>
                                                <span style={{
                                                    color: '#000',
                                                    fontSize: '14px',
                                                    fontFamily: 'Inter, sans-serif',
                                                    fontWeight: 400,
                                                    lineHeight: '20px'
                                                }}>{impact.introduced_projects}</span>
                                            </div>
                                            <div style={{ height: '1px', background: '#E5E7EB' }} />
                                        </div>


                                        {/* Logs Row */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px'
                                                }}>
                                                    <img
                                                        src={logsDocumentIcon}
                                                        alt=""
                                                        style={{ width: '24px', height: '24px' }}
                                                    />
                                                    <span style={{
                                                        color: '#4B5563',
                                                        fontSize: '14px',
                                                        fontFamily: 'Inter, sans-serif',
                                                        fontWeight: 400,
                                                        lineHeight: '20px'
                                                    }}>Logs</span>
                                                </div>
                                                <span style={{
                                                    color: '#000',
                                                    fontSize: '14px',
                                                    fontFamily: 'Inter, sans-serif',
                                                    fontWeight: 400,
                                                    lineHeight: '20px'
                                                }}>{impact.activities}</span>
                                            </div>
                                            <div style={{ height: '1px', background: '#E5E7EB' }} />
                                        </div>

                                        {/* Impact on other accounts Row */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px'
                                                }}>
                                                    <img
                                                        src={impactAccountsIcon}
                                                        alt=""
                                                        style={{ width: '24px', height: '24px' }}
                                                    />
                                                    <span style={{
                                                        color: '#4B5563',
                                                        fontSize: '14px',
                                                        fontFamily: 'Inter, sans-serif',
                                                        fontWeight: 400,
                                                        lineHeight: '20px'
                                                    }}>Impact on other accounts</span>
                                                </div>
                                                <span style={{
                                                    color: '#000',
                                                    fontSize: '14px',
                                                    fontFamily: 'Inter, sans-serif',
                                                    fontWeight: 400,
                                                    lineHeight: '20px'
                                                }}>All</span>
                                            </div>
                                            <div style={{ height: '1px', background: '#E5E7EB' }} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Critical Warning (if active deals exist) */}
                            {isCritical && (
                                <div style={{
                                    background: '#FEF2F2',
                                    border: '1px solid #FEE2E2',
                                    borderRadius: '3px',
                                    padding: '8px',
                                    display: 'flex',
                                    gap: '8px'
                                }}>
                                    <AlertTriangle style={{ width: '16px', height: '16px', flexShrink: 0, color: '#DC2626', marginTop: '2px' }} />
                                    <div>
                                        <p style={{ fontSize: '12px', fontWeight: 600, color: '#991B1B', margin: 0, fontFamily: 'Inter, sans-serif' }}>Critical Warning</p>
                                        <p style={{ fontSize: '11px', color: '#B91C1C', margin: '2px 0 0', fontFamily: 'Inter, sans-serif' }}>Some items have active deals. Deleting them will force-close these deals.</p>
                                    </div>
                                </div>
                            )}

                            {/* ─── Confirmation Section ─── */}
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px'
                            }}>
                                <span style={{
                                    color: '#000',
                                    fontSize: '14px',
                                    fontFamily: 'Inter, sans-serif',
                                    fontWeight: 400,
                                    textTransform: 'uppercase' as const,
                                    lineHeight: '19.33px'
                                }}>Type Delete to Confirm</span>
                                <input
                                    type="text"
                                    value={confirmText}
                                    onChange={(e) => setConfirmText(e.target.value)}
                                    placeholder="delete"
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        background: '#fff',
                                        borderRadius: '3px',
                                        border: '2px solid #940F24',
                                        outline: 'none',
                                        color: '#374151',
                                        fontSize: '16px',
                                        fontFamily: 'Inter, sans-serif',
                                        fontWeight: 400,
                                        lineHeight: '19.33px',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                        </>
                    ) : null}
                </div>

                {/* ─── Footer ─── */}
                <div style={{
                    height: '69px',
                    background: '#fff',
                    borderTop: '1px solid #F9FAFB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    padding: '0 24px',
                    gap: '12px',
                    marginTop: '28px'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            height: '36px',
                            padding: '0 16px',
                            borderRadius: '3px',
                            border: 'none',
                            background: 'transparent',
                            color: '#4B5563',
                            fontSize: '14px',
                            fontFamily: 'Inter, sans-serif',
                            fontWeight: 500,
                            lineHeight: '20px',
                            cursor: 'pointer',
                            transition: 'background 150ms'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#F3F4F6')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={!canConfirm || isLoading}
                        style={{
                            height: '36px',
                            padding: '0 20px',
                            borderRadius: '3px',
                            border: 'none',
                            background: canConfirm ? '#940F24' : '#D1D5DB',
                            color: canConfirm ? '#fff' : '#9CA3AF',
                            fontSize: '14px',
                            fontFamily: 'Inter, sans-serif',
                            fontWeight: 500,
                            lineHeight: '20px',
                            cursor: canConfirm ? 'pointer' : 'not-allowed',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'background 150ms'
                        }}
                        onMouseEnter={(e) => {
                            if (canConfirm) e.currentTarget.style.background = '#7A0C1E';
                        }}
                        onMouseLeave={(e) => {
                            if (canConfirm) e.currentTarget.style.background = '#940F24';
                        }}
                    >
                        {isLoading ? (
                            <Loader2 style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} />
                        ) : (
                            <Trash2 style={{ width: '14px', height: '14px' }} />
                        )}
                        Confirm Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmationModal;
