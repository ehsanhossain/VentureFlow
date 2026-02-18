import React, { useState } from 'react';
import { DollarSign, X, AlertTriangle, Check, Calendar } from 'lucide-react';

interface StageFeeInfo {
    enabled: boolean;
    mode: 'stage_fee';
    payment_name: string;
    amount: number;
    type: 'one_time' | 'monthly';
    deduct_from_success_fee: boolean;
    ticket_size_usd: number;
    fee_side: 'investor' | 'target';
    source_currency?: string;
    original_ticket_size?: number;
}

export interface StageFeeConfirmation {
    fee_side: 'investor' | 'target';
    fee_type: 'one_time' | 'monthly';
    calculated_amount: number;
    final_amount: number;
    deducted_from_success: boolean;
    payment_name: string;
}

interface MonetizationConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (feeConfirmation: StageFeeConfirmation) => void;
    dealName: string;
    stageName: string;
    monetization: StageFeeInfo;
}

const MonetizationConfirmModal: React.FC<MonetizationConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    dealName,
    stageName,
    monetization,
}) => {
    const [amountStr, setAmountStr] = useState<string>(String(monetization.amount));
    const [deductFromSuccess, setDeductFromSuccess] = useState<boolean>(monetization.deduct_from_success_fee);

    if (!isOpen) return null;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    const finalAmount = amountStr === '' ? 0 : parseFloat(amountStr) || 0;
    const isMonthly = monetization.type === 'monthly';
    const isEdited = finalAmount !== monetization.amount;

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        // Allow empty, or valid number patterns (digits, one dot, decimals)
        if (val === '' || /^\d*\.?\d*$/.test(val)) {
            setAmountStr(val);
        }
    };

    const handleAmountBlur = () => {
        // On blur, set to 0 if empty
        if (amountStr === '' || amountStr === '.') {
            setAmountStr('0');
        }
    };

    const handleConfirm = () => {
        onConfirm({
            fee_side: monetization.fee_side,
            fee_type: monetization.type,
            calculated_amount: monetization.amount,
            final_amount: finalAmount,
            deducted_from_success: deductFromSuccess,
            payment_name: monetization.payment_name,
        });
    };

    const font = 'Inter, sans-serif';

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
                    padding: '16px 24px',
                    borderBottom: '1px solid #F3F4F6',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: '#DCFCE7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <DollarSign style={{ width: '16px', height: '16px', color: '#15803D' }} />
                        </div>
                        <span style={{
                            color: '#374151',
                            fontSize: '16px',
                            fontFamily: font,
                            fontWeight: 600,
                            lineHeight: '24px',
                            letterSpacing: '-0.4px'
                        }}>
                            {isMonthly ? 'Monthly Fee Confirmation' : 'Stage Fee Confirmation'}
                        </span>
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
                <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Deal Info */}
                    <div style={{
                        background: '#F9FAFB',
                        borderRadius: '3px',
                        padding: '14px 16px'
                    }}>
                        <p style={{ margin: 0, fontSize: '14px', fontFamily: font, color: '#4B5563' }}>
                            Moving <span style={{ fontWeight: 600, color: '#111827' }}>{dealName}</span> to{' '}
                            <span style={{ fontWeight: 600, color: '#064771' }}>{stageName}</span>
                        </p>
                    </div>

                    {/* Notice */}
                    {isMonthly ? (
                        <div style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '10px',
                            background: '#FFFBEB',
                            padding: '12px 14px',
                            borderRadius: '3px'
                        }}>
                            <Calendar style={{ width: '16px', height: '16px', flexShrink: 0, marginTop: '2px', color: '#B45309' }} />
                            <div>
                                <p style={{ margin: 0, fontSize: '14px', fontFamily: font, fontWeight: 500, color: '#B45309' }}>
                                    Monthly payment starts this month
                                </p>
                                <p style={{ margin: '4px 0 0', fontSize: '12px', fontFamily: font, color: '#D97706' }}>
                                    {formatCurrency(monetization.amount)}/month will be charged until the deal is successfully closed.
                                    {monetization.deduct_from_success_fee && ' This amount will be deducted from the final success fee.'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: '#FFFBEB',
                            padding: '10px 14px',
                            borderRadius: '3px'
                        }}>
                            <AlertTriangle style={{ width: '16px', height: '16px', flexShrink: 0, color: '#B45309' }} />
                            <span style={{ fontSize: '14px', fontFamily: font, color: '#B45309' }}>
                                A one-time fee applies at this stage
                            </span>
                        </div>
                    )}

                    {/* Fee Details */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {monetization.payment_name && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '14px', fontFamily: font, color: '#6B7280' }}>Payment Name</span>
                                <span style={{ fontSize: '14px', fontFamily: font, fontWeight: 500, color: '#111827' }}>{monetization.payment_name}</span>
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '14px', fontFamily: font, color: '#6B7280' }}>Fee Amount</span>
                            <span style={{ fontSize: '14px', fontFamily: font, fontWeight: 500, color: '#111827' }}>
                                {formatCurrency(monetization.amount)}{isMonthly ? ' / month' : ''}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '14px', fontFamily: font, color: '#6B7280' }}>Transaction Size</span>
                            <span style={{ fontSize: '14px', fontFamily: font, fontWeight: 500, color: '#111827' }}>{formatCurrency(monetization.ticket_size_usd)}</span>
                        </div>
                        {monetization.source_currency && monetization.source_currency !== 'USD' && monetization.original_ticket_size ? (
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <span style={{ fontSize: '11px', fontFamily: font, color: '#9CA3AF', fontStyle: 'italic' }}>
                                    Converted from {new Intl.NumberFormat('en-US', { style: 'decimal', maximumFractionDigits: 0 }).format(monetization.original_ticket_size)} {monetization.source_currency}
                                </span>
                            </div>
                        ) : null}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '14px', fontFamily: font, color: '#6B7280' }}>Payment Type</span>
                            <span style={{ fontSize: '14px', fontFamily: font, fontWeight: 500, color: '#111827' }}>{isMonthly ? 'Monthly' : 'One-time'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '14px', fontFamily: font, color: '#6B7280' }}>Fee Side</span>
                            <span style={{ fontSize: '14px', fontFamily: font, fontWeight: 500, color: '#111827', textTransform: 'capitalize' }}>{monetization.fee_side}</span>
                        </div>
                    </div>

                    {/* Divider */}
                    <div style={{ height: '1px', background: '#F3F4F6' }} />

                    {/* Editable Amount */}
                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: '12px',
                            fontFamily: font,
                            fontWeight: 500,
                            color: '#6B7280',
                            marginBottom: '6px'
                        }}>
                            {isMonthly ? 'Monthly Amount (editable)' : 'Final Amount (editable)'}
                        </label>
                        <div style={{ position: 'relative' }}>
                            <span style={{
                                position: 'absolute',
                                left: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                fontSize: '14px',
                                fontFamily: font,
                                color: '#9CA3AF'
                            }}>$</span>
                            <input
                                type="text"
                                inputMode="decimal"
                                value={amountStr}
                                onChange={handleAmountChange}
                                onBlur={handleAmountBlur}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    paddingLeft: '28px',
                                    paddingRight: isMonthly ? '90px' : '12px',
                                    background: '#fff',
                                    border: '1px solid #E5E7EB',
                                    borderRadius: '3px',
                                    fontSize: '14px',
                                    fontFamily: font,
                                    fontWeight: 500,
                                    color: '#111827',
                                    textAlign: 'right',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                    transition: 'border-color 150ms, box-shadow 150ms'
                                }}
                                onFocus={(e) => {
                                    e.currentTarget.style.borderColor = '#064771';
                                    e.currentTarget.style.boxShadow = '0 0 0 2px rgba(6, 71, 113, 0.1)';
                                }}
                                onBlurCapture={(e) => {
                                    e.currentTarget.style.borderColor = '#E5E7EB';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            />
                            {isMonthly && (
                                <span style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    fontSize: '12px',
                                    fontFamily: font,
                                    color: '#9CA3AF'
                                }}>USD / month</span>
                            )}
                        </div>
                        {isEdited && (
                            <p style={{
                                margin: '4px 0 0',
                                fontSize: '12px',
                                fontFamily: font,
                                color: '#D97706'
                            }}>
                                Modified from configured {formatCurrency(monetization.amount)}
                            </p>
                        )}
                    </div>

                    {/* Deduct from success */}
                    <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer'
                    }}>
                        <input
                            type="checkbox"
                            checked={deductFromSuccess}
                            onChange={e => setDeductFromSuccess(e.target.checked)}
                            style={{ width: '16px', height: '16px', accentColor: '#064771' }}
                        />
                        <span style={{ fontSize: '14px', fontFamily: font, color: '#374151' }}>Deduct from final success fee</span>
                    </label>
                </div>

                {/* ─── Footer ─── */}
                <div style={{
                    padding: '16px 24px',
                    borderTop: '1px solid #F3F4F6',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    gap: '12px'
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
                            fontFamily: font,
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'background 150ms'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#F3F4F6')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        style={{
                            height: '36px',
                            padding: '0 20px',
                            borderRadius: '3px',
                            border: 'none',
                            background: '#064771',
                            color: '#fff',
                            fontSize: '14px',
                            fontFamily: font,
                            fontWeight: 500,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'background 150ms'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#053a5e')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = '#064771')}
                    >
                        <Check style={{ width: '14px', height: '14px' }} />
                        {isMonthly ? 'Start Monthly Payment' : 'Confirm & Move'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MonetizationConfirmModal;
