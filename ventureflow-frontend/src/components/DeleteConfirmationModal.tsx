import React, { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, X, Loader2, Info, FileText, Activity, Handshake } from 'lucide-react';
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
    }, [isOpen, selectedIds]);

    const fetchImpact = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const endpoint = itemType === 'investors' ? '/api/buyer/delete-analyze' : '/api/seller/delete-analyze';
            const response = await api.get(endpoint, { params: { ids: selectedIds } });
            setImpact(response.data);
        } catch (err: any) {
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
            <div className="bg-white rounded-[3px] border border-slate-100 shadow-none w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
                    <h3 className="text-base font-medium text-slate-800 flex items-center gap-2 tracking-tight">
                        <Trash2 className="w-4 h-4 text-slate-500" />
                        {title}
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-[3px] transition-colors">
                        <X className="w-4 h-4 text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-8 gap-3">
                            <Loader2 className="w-8 h-8 text-[#064771] animate-spin" />
                            <p className="text-sm text-slate-500 font-medium">Analyzing impacts...</p>
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
                                <h4 className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">Associated Data to be Removed</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    {/* Deals */}
                                    <div className="p-3 rounded-[3px] border border-slate-200 bg-white flex flex-col gap-1 hover:border-slate-300 transition-colors">
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <Handshake className="w-3.5 h-3.5" />
                                            <span className="text-[11px] font-medium uppercase tracking-wide">Deals</span>
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <span className={`text-lg font-medium tracking-tight ${impact.deals > 0 ? 'text-slate-800' : 'text-slate-300'}`}>{impact.deals}</span>
                                            {impact.active_deals > 0 && (
                                                <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-[2px] tracking-tight">
                                                    {impact.active_deals} Active
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Files */}
                                    <div className="p-3 rounded-[3px] border border-slate-200 bg-white flex flex-col gap-1 hover:border-slate-300 transition-colors">
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <FileText className="w-3.5 h-3.5" />
                                            <span className="text-[11px] font-medium uppercase tracking-wide">Files</span>
                                        </div>
                                        <span className={`text-lg font-medium tracking-tight ${impact.files > 0 ? 'text-slate-800' : 'text-slate-300'}`}>{impact.files}</span>
                                    </div>

                                    {/* Logs */}
                                    <div className="p-3 rounded-[3px] border border-slate-200 bg-white flex flex-col gap-1 hover:border-slate-300 transition-colors">
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <Activity className="w-3.5 h-3.5" />
                                            <span className="text-[11px] font-medium uppercase tracking-wide">Logs</span>
                                        </div>
                                        <span className={`text-lg font-medium tracking-tight ${impact.activities > 0 ? 'text-slate-800' : 'text-slate-300'}`}>{impact.activities}</span>
                                    </div>

                                    {/* Profile Info */}
                                    <div className="p-3 rounded-[3px] border border-slate-200 bg-white flex flex-col gap-1 hover:border-slate-300 transition-colors">
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <Info className="w-3.5 h-3.5" />
                                            <span className="text-[11px] font-medium uppercase tracking-wide">Profile</span>
                                        </div>
                                        <span className="text-lg font-medium tracking-tight text-slate-800">All</span>
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
                                <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                                    Type <span className="text-slate-800">DELETE</span> to confirm
                                </label>
                                <input
                                    type="text"
                                    value={confirmText}
                                    onChange={(e) => setConfirmText(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-[3px] focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none transition-all font-medium text-sm placeholder:font-normal placeholder:text-slate-300 bg-slate-50 focus:bg-white"
                                    placeholder="delete"
                                />
                            </div>
                        </div>
                    ) : null}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-50 bg-white flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-[3px] transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={!canConfirm || isLoading}
                        className={`
                            px-5 py-2 rounded-[3px] text-sm font-medium text-white transition-all flex items-center gap-2
                            ${canConfirm ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-200 cursor-not-allowed text-slate-400'}
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
