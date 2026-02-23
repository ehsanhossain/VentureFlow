/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

import React, { useState, useEffect } from 'react';
import api from '../../../config/api';
import { showAlert } from '../../../components/Alert';
import { BrandSpinner } from '../../../components/BrandSpinner';

// Icon imports
import logsDocumentIcon from '../../../assets/icons/logs-document.svg';
import impactAccountsIcon from '../../../assets/icons/impact-accounts.svg';
import dealsPipelineIcon from '../../../assets/icons/deals-pipeline.svg';

interface DealDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDeleted: () => void;
    dealId: number;
    dealName: string;
}

interface DealImpact {
    activity_logs: number;
    stage_history: number;
    fees: number;
}

const DealDeleteModal: React.FC<DealDeleteModalProps> = ({
    isOpen,
    onClose,
    onDeleted,
    dealId,
    dealName,
}) => {
    const [impact, setImpact] = useState<DealImpact | null>(null);
    const [loading, setLoading] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (isOpen && dealId) {
            setLoading(true);
            setConfirmText('');
            api.get(`/api/deals/${dealId}/delete-analyze`)
                .then((res) => setImpact(res.data.impact))
                .catch(() => showAlert({ type: 'error', message: 'Failed to analyze deletion impact' }))
                .finally(() => setLoading(false));
        }
    }, [isOpen, dealId]);

    if (!isOpen) return null;

    const canConfirm = confirmText.toLowerCase() === 'delete';

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await api.delete(`/api/deals/${dealId}`);
            showAlert({ type: 'success', message: 'Deal deleted successfully' });
            onDeleted();
            onClose();
        } catch {
            showAlert({ type: 'error', message: 'Failed to delete deal' });
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 100,
            }}
        >
            {/* Modal Container */}
            <div
                style={{
                    paddingTop: '1px',
                    paddingBottom: '1px',
                    background: 'white',
                    overflow: 'hidden',
                    borderRadius: '3px',
                    outline: '1px #F3F4F6 solid',
                    outlineOffset: '-1px',
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                    gap: '10px',
                    display: 'inline-flex',
                }}
            >
                <div
                    style={{
                        width: '448px',
                        flexDirection: 'column',
                        justifyContent: 'flex-start',
                        alignItems: 'center',
                        gap: '28px',
                        display: 'inline-flex',
                    }}
                >
                    {/* Header */}
                    <div
                        style={{
                            alignSelf: 'stretch',
                            padding: '16px',
                            background: 'white',
                            borderBottom: '1px #F3F4F6 solid',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            display: 'inline-flex',
                        }}
                    >
                        <div style={{ justifyContent: 'flex-start', alignItems: 'center', gap: '8px', display: 'flex' }}>
                            {/* Trash Icon */}
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12.2837 7.5L11.9952 15M8.00481 15M16.0231 4.82548C16.3081 4.86851 16.592 4.91455 16.875 4.96358M16.0231 4.82548L15.1333 16.3938C15.058 17.3707 14.2435 18.125 13.2637 18.125H6.73633C5.75656 18.125 4.94197 17.3707 4.86683 16.3938L3.97695 4.82548M16.0231 4.82548C15.0677 4.68121 14.1012 4.57072 13.125 4.49527M3.125 4.96358C3.40798 4.91455 3.6920 4.86851 3.97695 4.82548M3.97695 4.82548C4.93231 4.68121 5.89874 4.57072 6.875 4.49527M13.125 4.49527V3.73183C13.125 2.74903 12.3661 1.92852 11.3838 1.89711C10.9244 1.88241 10.4631 1.875 10 1.875C9.53695 1.875 9.07564 1.88241 8.61618 1.89711C7.63388 1.92852 6.875 2.74903 6.875 3.73183V4.49527M13.125 4.49527C12.0938 4.41559 11.0517 4.375 10 4.375C8.94835 4.375 7.90617 4.41559 6.875 4.49527"
                                    stroke="#374151" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span
                                style={{
                                    color: '#374151',
                                    fontSize: '16px',
                                    fontFamily: 'Inter, sans-serif',
                                    fontWeight: 500,
                                    lineHeight: '24px',
                                }}
                            >
                                Delete Deal
                            </span>
                        </div>
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            title="Close"
                            aria-label="Close"
                            style={{
                                width: '24px',
                                height: '24px',
                                position: 'relative',
                                borderRadius: '3px',
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: 0,
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#F3F4F6')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M4 4L12 12M4 12L12 4" stroke="#9CA3AF" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>

                    {/* Body Content */}
                    <div
                        style={{
                            alignSelf: 'stretch',
                            paddingLeft: '20px',
                            paddingRight: '20px',
                            flexDirection: 'column',
                            justifyContent: 'flex-start',
                            alignItems: 'flex-start',
                            gap: '28px',
                            display: 'flex',
                        }}
                    >
                        {loading ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 0', gap: '12px', width: '100%' }}>
                                <BrandSpinner size="lg" />
                                <p style={{ fontSize: '14px', color: '#6B7280', fontFamily: 'Inter, sans-serif', fontWeight: 500, margin: 0 }}>Analyzing impacts...</p>
                            </div>
                        ) : impact ? (
                            <div style={{ alignSelf: 'stretch', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center', gap: '22px', display: 'flex' }}>
                                {/* Danger Zone Banner */}
                                <div
                                    style={{
                                        alignSelf: 'stretch',
                                        padding: '8px',
                                        background: '#940F24',
                                        overflow: 'hidden',
                                        borderRadius: '3px',
                                        justifyContent: 'flex-start',
                                        alignItems: 'flex-start',
                                        gap: '8px',
                                        display: 'inline-flex',
                                    }}
                                >
                                    <div style={{ flex: '1 1 0', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: '4px', display: 'inline-flex' }}>
                                        <div style={{ alignSelf: 'stretch', color: 'white', fontSize: '14px', fontFamily: 'Inter, sans-serif', fontWeight: 600, lineHeight: '20px' }}>
                                            Danger Zone
                                        </div>
                                        <div style={{ alignSelf: 'stretch' }}>
                                            <span style={{ color: '#FAB8B8', fontSize: '12px', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>You are about to permanently delete the deal</span>
                                            <span style={{ color: 'white', fontSize: '12px', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}> </span>
                                            <span style={{ color: 'white', fontSize: '12px', fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>{dealName}.</span>
                                            <span style={{ color: 'white', fontSize: '12px', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}> </span>
                                            <span style={{ color: '#FAB8B8', fontSize: '12px', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>This action is</span>
                                            <span style={{ color: 'white', fontSize: '12px', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}> </span>
                                            <span style={{ color: 'white', fontSize: '12px', fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>permanent</span>
                                            <span style={{ color: 'white', fontSize: '12px', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}> </span>
                                            <span style={{ color: '#FAB8B8', fontSize: '12px', fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>and cannot be undone.</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Associated Data Section */}
                                <div style={{ alignSelf: 'stretch', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: '19px', display: 'flex' }}>
                                    {/* Section Header */}
                                    <div style={{ alignSelf: 'stretch', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: '10px', display: 'flex' }}>
                                        <span style={{ color: '#6B7280', fontSize: '14px', fontFamily: 'Inter, sans-serif', fontWeight: 500, textTransform: 'capitalize' as const }}>
                                            associated data will be removed
                                        </span>
                                    </div>

                                    {/* Data Rows */}
                                    <div style={{ alignSelf: 'stretch', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: '12px', display: 'flex' }}>
                                        {/* Activity Logs Row */}
                                        <div style={{ alignSelf: 'stretch', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: '6px', display: 'flex' }}>
                                            <div style={{ alignSelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', display: 'inline-flex' }}>
                                                <div style={{ justifyContent: 'flex-start', alignItems: 'center', gap: '8px', display: 'flex' }}>
                                                    <img src={logsDocumentIcon} alt="" style={{ width: '24px', height: '24px' }} />
                                                    <span style={{ color: '#4B5563', fontSize: '14px', fontFamily: 'Inter, sans-serif', fontWeight: 400, lineHeight: '20px' }}>Activity Logs</span>
                                                </div>
                                                <span style={{ color: 'black', fontSize: '14px', fontFamily: 'Inter, sans-serif', fontWeight: 400, lineHeight: '20px' }}>{impact.activity_logs}</span>
                                            </div>
                                            <div style={{ alignSelf: 'stretch', height: '0px', outline: '1px #E5E7EB solid', outlineOffset: '-0.5px' }} />
                                        </div>

                                        {/* Stage History Row */}
                                        <div style={{ alignSelf: 'stretch', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: '6px', display: 'flex' }}>
                                            <div style={{ alignSelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', display: 'inline-flex' }}>
                                                <div style={{ justifyContent: 'flex-start', alignItems: 'center', gap: '8px', display: 'flex' }}>
                                                    <img src={dealsPipelineIcon} alt="" style={{ width: '24px', height: '24px' }} />
                                                    <span style={{ color: '#4B5563', fontSize: '14px', fontFamily: 'Inter, sans-serif', fontWeight: 400, lineHeight: '20px' }}>Stage History</span>
                                                </div>
                                                <span style={{ color: 'black', fontSize: '14px', fontFamily: 'Inter, sans-serif', fontWeight: 400, lineHeight: '20px' }}>{impact.stage_history}</span>
                                            </div>
                                            <div style={{ alignSelf: 'stretch', height: '0px', outline: '1px #E5E7EB solid', outlineOffset: '-0.5px' }} />
                                        </div>

                                        {/* Fees Row */}
                                        <div style={{ alignSelf: 'stretch', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: '6px', display: 'flex' }}>
                                            <div style={{ alignSelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', display: 'inline-flex' }}>
                                                <div style={{ justifyContent: 'flex-start', alignItems: 'center', gap: '8px', display: 'flex' }}>
                                                    <img src={impactAccountsIcon} alt="" style={{ width: '24px', height: '24px' }} />
                                                    <span style={{ color: '#4B5563', fontSize: '14px', fontFamily: 'Inter, sans-serif', fontWeight: 400, lineHeight: '20px' }}>Fees / Payments</span>
                                                </div>
                                                <span style={{ color: 'black', fontSize: '14px', fontFamily: 'Inter, sans-serif', fontWeight: 400, lineHeight: '20px' }}>{impact.fees}</span>
                                            </div>
                                            <div style={{ alignSelf: 'stretch', height: '0px', outline: '1px #E5E7EB solid', outlineOffset: '-0.5px' }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        {/* Type Delete to Confirm */}
                        {!loading && impact && (
                            <div style={{ alignSelf: 'stretch', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: '12px', display: 'flex' }}>
                                <div style={{ alignSelf: 'stretch', color: 'black', fontSize: '14px', fontFamily: 'Inter, sans-serif', fontWeight: 400, textTransform: 'uppercase' as const, lineHeight: '19.33px' }}>
                                    Type Delete to Confirm
                                </div>
                                <input
                                    type="text"
                                    value={confirmText}
                                    onChange={(e) => setConfirmText(e.target.value)}
                                    placeholder="delete"
                                    style={{
                                        alignSelf: 'stretch',
                                        paddingLeft: '12px',
                                        paddingRight: '12px',
                                        paddingTop: '8px',
                                        paddingBottom: '8px',
                                        background: 'white',
                                        borderRadius: '3px',
                                        outline: '2px #940F24 solid',
                                        outlineOffset: '-2px',
                                        border: 'none',
                                        color: '#111827',
                                        fontSize: '16px',
                                        fontFamily: 'Inter, sans-serif',
                                        fontWeight: 400,
                                        lineHeight: '19.33px',
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div
                        style={{
                            alignSelf: 'stretch',
                            height: '69px',
                            position: 'relative',
                            background: 'white',
                            borderTop: '1px #F9FAFB solid',
                        }}
                    >
                        {/* Cancel */}
                        <button
                            onClick={onClose}
                            style={{
                                position: 'absolute',
                                left: '170.8px',
                                top: '17px',
                                height: '36px',
                                paddingLeft: '16px',
                                paddingRight: '16px',
                                borderRadius: '3px',
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                textAlign: 'center',
                                color: '#4B5563',
                                fontSize: '14px',
                                fontFamily: 'Inter, sans-serif',
                                fontWeight: 500,
                                lineHeight: '20px',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#F3F4F6')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                            Cancel
                        </button>

                        {/* Confirm Delete */}
                        <button
                            onClick={handleDelete}
                            disabled={!canConfirm || deleting || loading}
                            style={{
                                position: 'absolute',
                                right: '16px',
                                top: '17px',
                                height: '36px',
                                paddingLeft: '20px',
                                paddingRight: '20px',
                                background: canConfirm && !deleting ? '#940F24' : '#D1919C',
                                borderRadius: '3px',
                                border: 'none',
                                cursor: canConfirm && !deleting ? 'pointer' : 'not-allowed',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                opacity: canConfirm && !deleting ? 1 : 0.6,
                                transition: 'background 150ms ease',
                            }}
                            onMouseEnter={(e) => { if (canConfirm && !deleting) e.currentTarget.style.background = '#7A0C1E'; }}
                            onMouseLeave={(e) => { if (canConfirm && !deleting) e.currentTarget.style.background = '#940F24'; }}
                        >
                            {deleting ? (
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ animation: 'spin 1s linear infinite' }}>
                                    <circle cx="7" cy="7" r="6" stroke="white" strokeWidth="2" strokeDasharray="20 10" />
                                </svg>
                            ) : (
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M8.61 4.67L8.43 10.5M5.57 10.5L5.39 4.67M11.09 3.04C11.29 3.07 11.49 3.1 11.69 3.14M11.09 3.04L10.46 11.33C10.41 11.94 9.91 12.41 9.3 12.41H4.7C4.09 12.41 3.59 11.94 3.54 11.33L2.91 3.04M11.09 3.04C10.43 2.95 9.77 2.88 9.1 2.83M2.31 3.14C2.51 3.1 2.71 3.07 2.91 3.04M2.91 3.04C3.57 2.95 4.23 2.88 4.9 2.83M9.1 2.83V2.32C9.1 1.7 8.62 1.19 8 1.17C7.67 1.16 7.34 1.15 7 1.15C6.66 1.15 6.33 1.16 6 1.17C5.38 1.19 4.9 1.7 4.9 2.32V2.83M9.1 2.83C8.43 2.78 7.72 2.75 7 2.75C6.28 2.75 5.57 2.78 4.9 2.83"
                                        stroke="white" strokeWidth="1.17" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            )}
                            <span
                                style={{
                                    textAlign: 'center',
                                    color: 'white',
                                    fontSize: '14px',
                                    fontFamily: 'Inter, sans-serif',
                                    fontWeight: 500,
                                    lineHeight: '20px',
                                }}
                            >
                                {deleting ? 'Deleting...' : 'Confirm Delete'}
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DealDeleteModal;
