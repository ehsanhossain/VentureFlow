import React, { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, X, Loader2, Info, FileText, Activity, Handshake } from 'lucide-react';
import { BrandSpinner } from './BrandSpinner';
import api from '../config/api';

interface DeletionImpact {
    count: number;
    deals: number;
    active_deals: number;
    files: number;
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-[3px] border border-gray-100 shadow-none w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
                    <h3 className="text-base font-medium text-gray-700 flex items-center gap-2 tracking-tight">
                        <Trash2 className="w-4 h-4 text-gray-500" />
                        {title}
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-[3px] transition-colors" title="Close" aria-label="Close">
                        <X className="w-4 h-4 text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-8 gap-3">
                            <BrandSpinner size="lg" />
                            <p className="text-sm text-gray-500 font-medium">Analyzing impacts...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 p-4 rounded-[3px] flex gap-3 text-red-700">
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                            <p className="text-sm">{error}</p>
                        </div>
                    ) : impact ? (
                        <div className="space-y-6">
                            <div className="bg-amber-50 border border-amber-100 p-4 rounded-[3px]">
                                <p className="text-sm text-amber-900 font-normal leading-relaxed">
                                    You are about to delete <span className="font-medium text-amber-950">{impact.count}</span> {itemType === 'investors' ? 'investor(s)' : 'target(s)'}.
                                    This action is <span className="font-medium text-amber-950 decoration-amber-300 decoration-2">permanent</span> and cannot be undone.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-[11px] font-medium text-gray-400 uppercase tracking-widest">Associated Data to be Removed</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    {/* Deals */}
                                    <div className="p-3 rounded-[3px] border border-gray-200 bg-white flex flex-col gap-1 hover:border-gray-300 transition-colors">
                                        <div className="flex items-center gap-2 text-gray-500">
                                            <Handshake className="w-3.5 h-3.5" />
                                            <span className="text-[11px] font-medium uppercase tracking-wide">Deals</span>
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <span className={`text-lg font-medium tracking-tight ${impact.deals > 0 ? 'text-gray-700' : 'text-gray-400'}`}>{impact.deals}</span>
                                            {impact.active_deals > 0 && (
                                                <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-[2px] tracking-tight">
                                                    {impact.active_deals} Active
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Files */}
                                    <div className="p-3 rounded-[3px] border border-gray-200 bg-white flex flex-col gap-1 hover:border-gray-300 transition-colors">
                                        <div className="flex items-center gap-2 text-gray-500">
                                            <FileText className="w-3.5 h-3.5" />
                                            <span className="text-[11px] font-medium uppercase tracking-wide">Files</span>
                                        </div>
                                        <span className={`text-lg font-medium tracking-tight ${impact.files > 0 ? 'text-gray-700' : 'text-gray-400'}`}>{impact.files}</span>
                                    </div>

                                    {/* Logs */}
                                    <div className="p-3 rounded-[3px] border border-gray-200 bg-white flex flex-col gap-1 hover:border-gray-300 transition-colors">
                                        <div className="flex items-center gap-2 text-gray-500">
                                            <Activity className="w-3.5 h-3.5" />
                                            <span className="text-[11px] font-medium uppercase tracking-wide">Logs</span>
                                        </div>
                                        <span className={`text-lg font-medium tracking-tight ${impact.activities > 0 ? 'text-gray-700' : 'text-gray-400'}`}>{impact.activities}</span>
                                    </div>

                                    {/* Profile Info */}
                                    <div className="p-3 rounded-[3px] border border-gray-200 bg-white flex flex-col gap-1 hover:border-gray-300 transition-colors">
                                        <div className="flex items-center gap-2 text-gray-500">
                                            <Info className="w-3.5 h-3.5" />
                                            <span className="text-[11px] font-medium uppercase tracking-wide">Profile</span>
                                        </div>
                                        <span className="text-lg font-medium tracking-tight text-gray-700">All</span>
                                    </div>
                                </div>
                            </div>

                            {isCritical && (
                                <div className="bg-red-50 border border-red-100 text-red-900 p-4 rounded-[3px] flex gap-3">
                                    <AlertTriangle className="w-5 h-5 shrink-0 text-red-600" />
                                    <div>
                                        <p className="text-sm font-medium text-red-800">Critical Warning</p>
                                        <p className="text-xs text-red-700 mt-1">Some items have active deals. Deleting them will force-close these deals.</p>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2 pt-2">
                                <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wider block">
                                    Type <span className="text-gray-700">DELETE</span> to confirm
                                </label>
                                <input
                                    type="text"
                                    value={confirmText}
                                    onChange={(e) => setConfirmText(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-[3px] focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none transition-all font-medium text-sm placeholder:font-normal placeholder:text-gray-400 bg-gray-50 focus:bg-white"
                                    placeholder="delete"
                                />
                            </div>
                        </div>
                    ) : null}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-50 bg-white flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-[3px] transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={!canConfirm || isLoading}
                        className={`
                            px-5 py-2 rounded-[3px] text-sm font-medium text-white transition-all flex items-center gap-2
                            ${canConfirm ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-200 cursor-not-allowed text-gray-400'}
                        `}
                    >
                        {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        Confirm Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmationModal;
