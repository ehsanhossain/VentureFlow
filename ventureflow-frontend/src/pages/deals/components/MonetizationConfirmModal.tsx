import React, { useState } from 'react';
import { DollarSign, X, AlertTriangle, Check } from 'lucide-react';

interface MonetizationInfo {
    enabled: boolean;
    type: 'one_time' | 'monthly';
    deduct_from_success_fee: boolean;
    ticket_size_usd: number;
    fee_side: 'investor' | 'target';
    fee_tier: {
        id: number;
        min_amount: number;
        max_amount: number | null;
        success_fee_fixed: number | null;
        success_fee_rate: number | null;
    } | null;
    calculated_amount: number;
}

interface FeeConfirmation {
    fee_tier_id: number | null;
    fee_side: 'investor' | 'target';
    fee_type: 'one_time' | 'monthly' | 'success' | 'retainer';
    calculated_amount: number;
    final_amount: number;
    deducted_from_success: boolean;
}

interface MonetizationConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (feeConfirmation: FeeConfirmation) => void;
    dealName: string;
    stageName: string;
    monetization: MonetizationInfo;
}

const MonetizationConfirmModal: React.FC<MonetizationConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    dealName,
    stageName,
    monetization,
}) => {
    const [finalAmount, setFinalAmount] = useState<number>(monetization.calculated_amount);
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
            fee_type: monetization.type,
            calculated_amount: monetization.calculated_amount,
            final_amount: finalAmount,
            deducted_from_success: deductFromSuccess,
        });
    };

    const isEdited = finalAmount !== monetization.calculated_amount;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
            <div className="bg-white rounded-[3px] w-full max-w-md shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                            <DollarSign className="w-4 h-4 text-green-700" />
                        </div>
                        <h3 className="text-base font-semibold text-gray-900">Fee Confirmation</h3>
                    </div>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 transition-colors" title="Close">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-5">
                    {/* Deal Info */}
                    <div className="bg-gray-50 rounded-[3px] p-4">
                        <p className="text-sm text-gray-600">
                            Moving <span className="font-semibold text-gray-900">{dealName}</span> to{' '}
                            <span className="font-semibold text-[#064771]">{stageName}</span>
                        </p>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-[3px]">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        <span>Monetization starts at this stage</span>
                    </div>

                    {/* Fee Details */}
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Transaction Size</span>
                            <span className="font-medium text-gray-900">{formatCurrency(monetization.ticket_size_usd)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Fee Tier</span>
                            <span className="font-medium text-gray-900">{tierLabel}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Fee Rate</span>
                            <span className="font-medium text-gray-900">{feeMethodLabel}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Calculated Fee</span>
                            <span className="font-medium text-gray-900">{formatCurrency(monetization.calculated_amount)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Payment Type</span>
                            <span className="font-medium text-gray-900 capitalize">{monetization.type.replace('_', '-')}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Fee Side</span>
                            <span className="font-medium text-gray-900 capitalize">{monetization.fee_side}</span>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-100"></div>

                    {/* Editable Amount */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                            Final Amount (editable)
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                            <input
                                type="number"
                                value={finalAmount}
                                onChange={e => setFinalAmount(parseFloat(e.target.value) || 0)}
                                min="0"
                                step="0.01"
                                className="w-full pl-8 pr-4 py-2.5 bg-white border border-gray-200 rounded-[3px] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#064771]/10 focus:border-[#064771] transition-all"
                            />
                        </div>
                        {isEdited && (
                            <p className="mt-1 text-xs text-amber-600">
                                Modified from system-calculated {formatCurrency(monetization.calculated_amount)}
                            </p>
                        )}
                    </div>

                    {/* Deduct from success */}
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={deductFromSuccess}
                            onChange={e => setDeductFromSuccess(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-[#064771] focus:ring-[#064771]/20"
                        />
                        <span className="text-sm text-gray-700">Deduct from final success fee</span>
                    </label>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="flex items-center gap-2 px-5 py-2 bg-[#064771] hover:bg-[#053a5e] text-white rounded-[3px] text-sm font-medium transition-all shadow-sm active:scale-95"
                    >
                        <Check className="w-4 h-4" />
                        Confirm & Move
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MonetizationConfirmModal;
