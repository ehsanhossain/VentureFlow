/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, X, XCircle, Search, UserPlus, Building2, Check } from 'lucide-react';
import api from '../../../config/api';
import { showAlert } from '../../../components/Alert';

interface GateErrorDetail {
    message: string;
    action_type: 'assign_buyer' | 'assign_seller' | 'assign_both' | 'edit_deal';
    missing_fields: string[];
    stage_name?: string;
}

interface ProspectOption {
    id: number;
    code: string;
    name: string;
}

interface GateBlockedModalProps {
    isOpen: boolean;
    onClose: () => void;
    stageName: string;
    errors: string[];
    errorDetails?: GateErrorDetail[];
    dealId?: number;
    pipelineType?: 'buyer' | 'seller';
    stageCode?: string;
    onResolved?: () => void;
}

const GateBlockedModal: React.FC<GateBlockedModalProps> = ({
    isOpen,
    onClose,
    stageName,
    errors,
    errorDetails,
    dealId,
    pipelineType,
    stageCode,
    onResolved,
}) => {
    const [buyerSearch, setBuyerSearch] = useState('');
    const [sellerSearch, setSellerSearch] = useState('');
    const [allBuyers, setAllBuyers] = useState<ProspectOption[]>([]);
    const [allSellers, setAllSellers] = useState<ProspectOption[]>([]);
    const [selectedBuyer, setSelectedBuyer] = useState<ProspectOption | null>(null);
    const [selectedSeller, setSelectedSeller] = useState<ProspectOption | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showBuyerDropdown, setShowBuyerDropdown] = useState(false);
    const [showSellerDropdown, setShowSellerDropdown] = useState(false);
    const buyerRef = useRef<HTMLDivElement>(null);
    const sellerRef = useRef<HTMLDivElement>(null);

    // Determine what actions are needed
    const needsBuyer = errorDetails?.some(e =>
        e.action_type === 'assign_buyer' || e.action_type === 'assign_both'
    ) ?? false;
    const needsSeller = errorDetails?.some(e =>
        e.action_type === 'assign_seller' || e.action_type === 'assign_both'
    ) ?? false;
    const hasAssignAction = needsBuyer || needsSeller;

    // Load all buyers/sellers once when needed
    useEffect(() => {
        if (needsBuyer && allBuyers.length === 0) {
            api.get('/api/buyer/fetch')
                .then(res => setAllBuyers(res.data?.data || []))
                .catch(() => setAllBuyers([]));
        }
    }, [needsBuyer]);

    useEffect(() => {
        if (needsSeller && allSellers.length === 0) {
            api.get('/api/seller/fetch')
                .then(res => setAllSellers(res.data?.data || []))
                .catch(() => setAllSellers([]));
        }
    }, [needsSeller]);

    // Client-side filter
    const filteredBuyers = buyerSearch.length >= 1
        ? allBuyers.filter(b => b.name.toLowerCase().includes(buyerSearch.toLowerCase()) || b.code?.toLowerCase().includes(buyerSearch.toLowerCase()))
        : allBuyers;

    const filteredSellers = sellerSearch.length >= 1
        ? allSellers.filter(s => s.name.toLowerCase().includes(sellerSearch.toLowerCase()) || s.code?.toLowerCase().includes(sellerSearch.toLowerCase()))
        : allSellers;

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (buyerRef.current && !buyerRef.current.contains(e.target as Node)) {
                setShowBuyerDropdown(false);
            }
            if (sellerRef.current && !sellerRef.current.contains(e.target as Node)) {
                setShowSellerDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAssignAndMove = async () => {
        if (!dealId) return;
        setIsSubmitting(true);
        try {
            // Assign buyer/seller to the deal
            const updatePayload: any = {};
            if (selectedBuyer) updatePayload.buyer_id = selectedBuyer.id;
            if (selectedSeller) updatePayload.seller_id = selectedSeller.id;

            if (Object.keys(updatePayload).length > 0) {
                await api.patch(`/api/deals/${dealId}`, updatePayload);
            }

            // Try to move the deal to the target stage
            if (stageCode) {
                await api.patch(`/api/deals/${dealId}/stage`, {
                    stage_code: stageCode,
                    pipeline_type: pipelineType,
                });
                showAlert({ type: 'success', message: `Assigned & moved to ${stageName}` });
            } else {
                showAlert({ type: 'success', message: 'Parties assigned successfully' });
            }

            onResolved?.();
        } catch (error: any) {
            const gateErrors = error?.response?.data?.gate_errors;
            if (gateErrors && Array.isArray(gateErrors)) {
                showAlert({ type: 'error', message: gateErrors[0] || 'Additional gate conditions not met.' });
            } else {
                const msg = error?.response?.data?.message || 'Failed to assign. Please try again.';
                showAlert({ type: 'error', message: msg });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const canSubmit = () => {
        if (needsBuyer && !selectedBuyer) return false;
        if (needsSeller && !selectedSeller) return false;
        return true;
    };

    if (!isOpen || errors.length === 0) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
            <div className="bg-white rounded-[3px] w-full max-w-lg shadow-2xl" style={{ fontFamily: 'Inter, sans-serif' }}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                            <ShieldAlert className="w-4 h-4 text-amber-700" />
                        </div>
                        <h3 className="text-base font-semibold text-gray-900">Action Required</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Close"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4">
                    <p className="text-sm text-gray-600">
                        To move this deal to <span className="font-semibold text-[#064771]">{stageName}</span>, the following conditions must be met:
                    </p>

                    {/* Error list */}
                    <div className="space-y-2">
                        {errors.map((error, index) => (
                            <div
                                key={index}
                                className="flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-[3px]"
                            >
                                <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                <span className="text-sm text-red-800">{error}</span>
                            </div>
                        ))}
                    </div>

                    {/* Actionable section — Assign buyer/seller inline */}
                    {hasAssignAction && (
                        <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                            <p className="text-sm font-medium text-gray-700">
                                Resolve & continue — assign the missing parties below:
                            </p>

                            {/* Buyer / Investor search */}
                            {needsBuyer && (
                                <div ref={buyerRef} className="relative">
                                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                                        <UserPlus className="w-3.5 h-3.5 inline mr-1" />
                                        Select Investor (Buyer)
                                    </label>
                                    {selectedBuyer ? (
                                        <div className="flex items-center gap-2 px-3 py-2.5 bg-blue-50 border border-blue-200 rounded-[3px]">
                                            <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                                                {selectedBuyer.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className="text-sm font-medium text-[#064771] block truncate">{selectedBuyer.name}</span>
                                                {selectedBuyer.code && <span className="text-[10px] text-gray-400">{selectedBuyer.code}</span>}
                                            </div>
                                            <Check className="w-4 h-4 text-[#064771]" />
                                            <button
                                                onClick={() => setSelectedBuyer(null)}
                                                className="text-gray-400 hover:text-gray-600 ml-1"
                                                title="Remove selection"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input
                                                    type="text"
                                                    value={buyerSearch}
                                                    onChange={(e) => {
                                                        setBuyerSearch(e.target.value);
                                                        setShowBuyerDropdown(true);
                                                    }}
                                                    onFocus={() => setShowBuyerDropdown(true)}
                                                    placeholder="Search investors..."
                                                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-[3px] focus:outline-none focus:border-[#064771] focus:ring-1 focus:ring-[#064771]/20 transition-colors"
                                                />
                                            </div>
                                            {showBuyerDropdown && filteredBuyers.length > 0 && (
                                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-[3px] shadow-lg max-h-40 overflow-y-auto scrollbar-premium">
                                                    {filteredBuyers.slice(0, 10).map((p) => (
                                                        <button
                                                            key={p.id}
                                                            onClick={() => {
                                                                setSelectedBuyer(p);
                                                                setBuyerSearch('');
                                                                setShowBuyerDropdown(false);
                                                            }}
                                                            className="flex items-center gap-2.5 w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors"
                                                        >
                                                            <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                                                                {p.name.substring(0, 2).toUpperCase()}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <span className="text-sm text-gray-800 block truncate">{p.name}</span>
                                                                {p.code && <span className="text-[10px] text-gray-400">{p.code}</span>}
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                            {showBuyerDropdown && allBuyers.length > 0 && filteredBuyers.length === 0 && (
                                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-[3px] shadow-lg p-3 text-xs text-gray-400 text-center">
                                                    No investors found
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Seller / Target search */}
                            {needsSeller && (
                                <div ref={sellerRef} className="relative">
                                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                                        <Building2 className="w-3.5 h-3.5 inline mr-1" />
                                        Select Target (Seller)
                                    </label>
                                    {selectedSeller ? (
                                        <div className="flex items-center gap-2 px-3 py-2.5 bg-blue-50 border border-blue-200 rounded-[3px]">
                                            <div className="w-7 h-7 rounded-full bg-[#064771] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                                                {selectedSeller.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className="text-sm font-medium text-[#064771] block truncate">{selectedSeller.name}</span>
                                                {selectedSeller.code && <span className="text-[10px] text-gray-400">{selectedSeller.code}</span>}
                                            </div>
                                            <Check className="w-4 h-4 text-[#064771]" />
                                            <button
                                                onClick={() => setSelectedSeller(null)}
                                                className="text-gray-400 hover:text-gray-600 ml-1"
                                                title="Remove selection"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input
                                                    type="text"
                                                    value={sellerSearch}
                                                    onChange={(e) => {
                                                        setSellerSearch(e.target.value);
                                                        setShowSellerDropdown(true);
                                                    }}
                                                    onFocus={() => setShowSellerDropdown(true)}
                                                    placeholder="Search targets..."
                                                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-[3px] focus:outline-none focus:border-[#064771] focus:ring-1 focus:ring-[#064771]/20 transition-colors"
                                                />
                                            </div>
                                            {showSellerDropdown && filteredSellers.length > 0 && (
                                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-[3px] shadow-lg max-h-40 overflow-y-auto scrollbar-premium">
                                                    {filteredSellers.slice(0, 10).map((p) => (
                                                        <button
                                                            key={p.id}
                                                            onClick={() => {
                                                                setSelectedSeller(p);
                                                                setSellerSearch('');
                                                                setShowSellerDropdown(false);
                                                            }}
                                                            className="flex items-center gap-2.5 w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors"
                                                        >
                                                            <div className="w-6 h-6 rounded-full bg-[#064771] flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                                                                {p.name.substring(0, 2).toUpperCase()}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <span className="text-sm text-gray-800 block truncate">{p.name}</span>
                                                                {p.code && <span className="text-[10px] text-gray-400">{p.code}</span>}
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                            {showSellerDropdown && allSellers.length > 0 && filteredSellers.length === 0 && (
                                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-[3px] shadow-lg p-3 text-xs text-gray-400 text-center">
                                                    No targets found
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {!hasAssignAction && (
                        <p className="text-xs text-gray-500 mt-3">
                            Please resolve the above requirements and try again.
                        </p>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
                    >
                        Cancel
                    </button>
                    {hasAssignAction ? (
                        <button
                            onClick={handleAssignAndMove}
                            disabled={!canSubmit() || isSubmitting}
                            className={`px-5 py-2 rounded-[3px] text-sm font-medium transition-all shadow-sm active:scale-95 ${canSubmit() && !isSubmitting
                                ? 'bg-[#064771] hover:bg-[#053a5e] text-white'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            {isSubmitting ? 'Assigning...' : `Assign & Move to ${stageName}`}
                        </button>
                    ) : (
                        <button
                            onClick={onClose}
                            className="px-5 py-2 bg-[#064771] hover:bg-[#053a5e] text-white rounded-[3px] text-sm font-medium transition-all shadow-sm active:scale-95"
                        >
                            Got it
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GateBlockedModal;
