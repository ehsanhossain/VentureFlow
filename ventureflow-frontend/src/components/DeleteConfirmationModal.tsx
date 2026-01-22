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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Trash2 className="w-5 h-5 text-red-600" />
                        {title}
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-8 gap-3">
                            <Loader2 className="w-8 h-8 text-[#064771] animate-spin" />
                            <p className="text-sm text-gray-500 font-medium">Analyzing impacts...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 p-4 rounded-lg flex gap-3 text-red-700">
                            <AlertTriangle className="w-5 h-5 shrink-0" />
                            <p className="text-sm">{error}</p>
                        </div>
                    ) : impact ? (
                        <div className="space-y-6">
                            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                                <p className="text-sm text-amber-800 font-medium leading-relaxed">
                                    You are about to delete <span className="font-bold underline">{impact.count}</span> {itemType === 'investors' ? 'investor(s)' : 'target(s)'}.
                                    This action is <span className="font-bold">permanent</span> and cannot be undone.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Associated Data to be Removed</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className={`p-3 rounded-lg border flex flex-col gap-1 ${impact.deals > 0 ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Handshake className="w-4 h-4" />
                                            <span className="text-xs font-bold">Deals</span>
                                        </div>
                                        <span className={`text-xl font-black ${impact.deals > 0 ? 'text-red-700' : 'text-gray-400'}`}>{impact.deals}</span>
                                        {impact.active_deals > 0 && (
                                            <span className="text-[10px] font-bold text-red-600 uppercase tracking-tighter">
                                                {impact.active_deals} Active
                                            </span>
                                        )}
                                    </div>
                                    <div className={`p-3 rounded-lg border flex flex-col gap-1 ${impact.files > 0 ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100'}`}>
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <FileText className="w-4 h-4" />
                                            <span className="text-xs font-bold">Files</span>
                                        </div>
                                        <span className={`text-xl font-black ${impact.files > 0 ? 'text-blue-700' : 'text-gray-400'}`}>{impact.files}</span>
                                    </div>
                                    <div className={`p-3 rounded-lg border flex flex-col gap-1 ${impact.activities > 0 ? 'bg-indigo-50 border-indigo-100' : 'bg-gray-50 border-gray-100'}`}>
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Activity className="w-4 h-4" />
                                            <span className="text-xs font-bold">Logs</span>
                                        </div>
                                        <span className={`text-xl font-black ${impact.activities > 0 ? 'text-indigo-700' : 'text-gray-400'}`}>{impact.activities}</span>
                                    </div>
                                    <div className="p-3 bg-gray-50 border-gray-100 rounded-lg border flex flex-col gap-1">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Info className="w-4 h-4" />
                                            <span className="text-xs font-bold">Profile Info</span>
                                        </div>
                                        <span className="text-xl font-black text-gray-700">All</span>
                                    </div>
                                </div>
                            </div>

                            {isCritical && (
                                <div className="bg-red-600 text-white p-4 rounded-lg flex gap-3 shadow-lg animate-pulse">
                                    <AlertTriangle className="w-6 h-6 shrink-0" />
                                    <div>
                                        <p className="text-sm font-bold">Critical Warning</p>
                                        <p className="text-xs opacity-90">Some items have active deals. Deleting them will force-close these deals.</p>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase">Type <span className="text-red-600 font-bold">DELETE</span> to confirm</label>
                                <input
                                    type="text"
                                    value={confirmText}
                                    onChange={(e) => setConfirmText(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all font-bold placeholder:font-normal placeholder:text-gray-300"
                                    placeholder="Confirm deletion"
                                />
                            </div>
                        </div>
                    ) : null}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-lg transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={!canConfirm || isLoading}
                        className={`
                            px-6 py-2 rounded-lg text-sm font-bold text-white shadow-lg transition-all active:scale-95 flex items-center gap-2
                            ${canConfirm ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 'bg-gray-300 cursor-not-allowed'}
                        `}
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        Confirm Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmationModal;
