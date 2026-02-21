/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { DollarSign, X, Check, TrendingUp, Minus, Plus, Receipt } from 'lucide-react';

interface PaymentHistoryItem {
    id: number;
    stage_code: string;
    fee_type: string;
    amount: number;
    date: string;
    month_label: string;
}

interface FinalSettlementInfo {
    enabled: boolean;
    mode: 'final_settlement';
    payment_name: string;
    ticket_size_usd: number;
    fee_side: 'investor' | 'target';
    fee_tier: {
        id: number;
        min_amount: number;
        max_amount: number | null;
        success_fee_fixed: number | null;
        success_fee_rate: number | null;
    } | null;
    success_fee: number;
    accumulated_payments: {
        total_received: number;
        months_count: number;
        history: PaymentHistoryItem[];
    };
    net_payout: number;
    deduct_from_success_fee: boolean;
}

export interface FinalSettlementConfirmation {
    fee_tier_id: number | null;
    fee_side: 'investor' | 'target';
    fee_type: 'success';
    success_fee: number;
    total_deductions: number;
    adjusted_months: number;
    final_amount: number;
    deducted_from_success: boolean;
    payment_name: string;
}

interface FinalSettlementModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (confirmation: FinalSettlementConfirmation) => void;
    dealName: string;
    stageName: string;
    monetization: FinalSettlementInfo;
}

const FinalSettlementModal: React.FC<FinalSettlementModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    dealName,
    stageName,
    monetization,
}) => {
    const payments = monetization.accumulated_payments;
    const [adjustedMonths, setAdjustedMonths] = useState<number>(payments.months_count);
    const [manualOverride, setManualOverride] = useState<boolean>(false);
    const [manualAmountStr, setManualAmountStr] = useState<string>(String(monetization.net_payout));

    if (!isOpen) return null;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    // Calculate adjusted deductions based on months count
    const avgMonthlyFee = payments.months_count > 0
        ? payments.total_received / payments.months_count
        : 0;
    const adjustedDeductions = adjustedMonths * avgMonthlyFee;
    const calculatedNetPayout = monetization.success_fee - adjustedDeductions;
    const manualFinalAmount = manualAmountStr === '' ? 0 : parseFloat(manualAmountStr) || 0;
    const displayNetPayout = manualOverride ? manualFinalAmount : calculatedNetPayout;

    const tierLabel = monetization.fee_tier
        ? `${formatCurrency(monetization.fee_tier.min_amount)} – ${monetization.fee_tier.max_amount ? formatCurrency(monetization.fee_tier.max_amount) : 'Above'}`
        : 'No matching tier';

    const feeMethodLabel = monetization.fee_tier?.success_fee_rate
        ? `${monetization.fee_tier.success_fee_rate}%`
        : monetization.fee_tier?.success_fee_fixed
            ? formatCurrency(monetization.fee_tier.success_fee_fixed) + ' (fixed)'
            : '—';

    const handleConfirm = () => {
        onConfirm({
            fee_tier_id: monetization.fee_tier?.id ?? null,
            fee_side: monetization.fee_side,
            fee_type: 'success',
            success_fee: monetization.success_fee,
            total_deductions: adjustedDeductions,
            adjusted_months: adjustedMonths,
            final_amount: displayNetPayout,
            deducted_from_success: monetization.deduct_from_success_fee,
            payment_name: monetization.payment_name || 'Final Settlement',
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
            <div className="bg-white rounded-[3px] w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-premium">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-emerald-700" />
                        </div>
                        <h3 className="text-base font-semibold text-gray-900">Final Settlement</h3>
                    </div>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 transition-colors" title="Close">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-5">
                    {/* Deal Info */}
                    <div className="bg-emerald-50 rounded-[3px] p-4">
                        <p className="text-sm text-gray-600">
                            Closing <span className="font-semibold text-gray-900">{dealName}</span> at{' '}
                            <span className="font-semibold text-emerald-700">{stageName}</span>
                        </p>
                        <p className="text-xs text-emerald-600 mt-1">🎉 Congratulations! This deal is reaching its final stage.</p>
                    </div>

                    {/* Success Fee Breakdown */}
                    <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <DollarSign className="w-3.5 h-3.5" />
                            Success Fee Calculation
                        </h4>
                        <div className="space-y-2.5 bg-gray-50 rounded-[3px] p-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Transaction Size</span>
                                <span className="font-medium text-gray-900">{formatCurrency(monetization.ticket_size_usd)}</span>
                            </div>
                            {monetization.fee_tier && (
                                <>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Fee Tier</span>
                                        <span className="font-medium text-gray-900">{tierLabel}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Fee Rate</span>
                                        <span className="font-medium text-gray-900">{feeMethodLabel}</span>
                                    </div>
                                </>
                            )}
                            <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                                <span className="text-gray-700 font-medium">Total Success Fee</span>
                                <span className="font-semibold text-gray-900 text-base">{formatCurrency(monetization.success_fee)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Fee Side</span>
                                <span className="font-medium text-gray-900 capitalize">{monetization.fee_side}</span>
                            </div>
                        </div>
                    </div>

                    {/* Accumulated Payments */}
                    {payments.months_count > 0 && (
                        <div>
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <Receipt className="w-3.5 h-3.5" />
                                Accumulated Payments Received
                            </h4>
                            <div className="bg-blue-50 rounded-[3px] p-4 space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-blue-700">Months of payments</span>
                                    <span className="font-semibold text-blue-900">{payments.months_count} month{payments.months_count !== 1 ? 's' : ''}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-blue-700">Total received</span>
                                    <span className="font-semibold text-blue-900">{formatCurrency(payments.total_received)}</span>
                                </div>

                                {/* Payment history */}
                                {payments.history.length > 0 && (
                                    <div className="mt-2 pt-2 border-t border-blue-100">
                                        <p className="text-xs text-blue-600 font-medium mb-2">Payment History</p>
                                        <div className="space-y-1 max-h-28 overflow-y-auto scrollbar-premium">
                                            {payments.history.map((p, i) => (
                                                <div key={i} className="flex justify-between text-xs text-blue-700/80">
                                                    <span>{p.month_label} (Stage {p.stage_code})</span>
                                                    <span>{formatCurrency(p.amount)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Adjust months */}
                                <div className="pt-2 border-t border-blue-100">
                                    <p className="text-xs text-blue-600 font-medium mb-2">Adjust months to deduct</p>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setAdjustedMonths(Math.max(0, adjustedMonths - 1))}
                                            className="w-8 h-8 rounded-[3px] bg-white border border-blue-200 flex items-center justify-center text-blue-700 hover:bg-blue-100 transition-colors"
                                            title="Remove month"
                                        >
                                            <Minus className="w-3.5 h-3.5" />
                                        </button>
                                        <span className="text-sm font-semibold text-blue-900 min-w-[80px] text-center">
                                            {adjustedMonths} month{adjustedMonths !== 1 ? 's' : ''}
                                        </span>
                                        <button
                                            onClick={() => setAdjustedMonths(adjustedMonths + 1)}
                                            className="w-8 h-8 rounded-[3px] bg-white border border-blue-200 flex items-center justify-center text-blue-700 hover:bg-blue-100 transition-colors"
                                            title="Add month"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    {adjustedMonths !== payments.months_count && (
                                        <p className="text-xs text-amber-600 mt-1.5">
                                            Adjusted from {payments.months_count} to {adjustedMonths} month{adjustedMonths !== 1 ? 's' : ''}
                                            (deduction: {formatCurrency(adjustedDeductions)})
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Divider */}
                    <div className="border-t border-gray-200"></div>

                    {/* Net Payout */}
                    <div className="bg-emerald-50 rounded-[3px] p-4 space-y-2.5">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Success Fee</span>
                            <span className="font-medium text-gray-900">{formatCurrency(monetization.success_fee)}</span>
                        </div>
                        {payments.months_count > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Less: Payments received ({adjustedMonths} mo)</span>
                                <span className="font-medium text-red-600">− {formatCurrency(adjustedDeductions)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-base pt-2 border-t border-emerald-200">
                            <span className="font-semibold text-gray-800">Final Payout</span>
                            <span className="font-bold text-emerald-700 text-lg">{formatCurrency(displayNetPayout)}</span>
                        </div>
                    </div>

                    {/* Manual override */}
                    <div>
                        <label className="flex items-center gap-2 cursor-pointer mb-2">
                            <input
                                type="checkbox"
                                checked={manualOverride}
                                onChange={e => {
                                    setManualOverride(e.target.checked);
                                    if (e.target.checked) setManualAmountStr(String(calculatedNetPayout));
                                }}
                                className="w-4 h-4 rounded border-gray-300 text-[#064771] focus:ring-[#064771]/20"
                            />
                            <span className="text-sm text-gray-700">Override final amount manually</span>
                        </label>
                        {manualOverride && (
                            <div style={{ position: 'relative' }}>
                                <span style={{
                                    position: 'absolute',
                                    left: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    fontSize: '14px',
                                    color: '#9CA3AF'
                                }}>$</span>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={manualAmountStr}
                                    onChange={e => {
                                        const val = e.target.value;
                                        if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
                                            setManualAmountStr(val);
                                        }
                                    }}
                                    onBlur={() => {
                                        if (manualAmountStr === '' || manualAmountStr === '.' || manualAmountStr === '-') {
                                            setManualAmountStr('0');
                                        }
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        paddingLeft: '28px',
                                        background: '#fff',
                                        border: '1px solid #E5E7EB',
                                        borderRadius: '3px',
                                        fontSize: '14px',
                                        fontWeight: 500,
                                        color: '#111827',
                                        textAlign: 'right',
                                        outline: 'none',
                                        boxSizing: 'border-box' as const,
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
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[3px] text-sm font-medium transition-all shadow-sm active:scale-95"
                    >
                        <Check className="w-4 h-4" />
                        Confirm Settlement
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FinalSettlementModal;
