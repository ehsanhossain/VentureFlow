import React, { useState, useEffect } from 'react';
import { Trash2, X, AlertTriangle, Loader2 } from 'lucide-react';
import api from '../../../config/api';
import { showAlert } from '../../../components/Alert';

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

    const impactRows = impact
        ? [
            { label: 'Activity Logs', count: impact.activity_logs },
            { label: 'Stage History', count: impact.stage_history },
            { label: 'Fees / Payments', count: impact.fees },
        ]
        : [];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
            <div className="bg-white rounded-[3px] w-full max-w-md shadow-2xl" style={{ fontFamily: 'Inter, sans-serif' }}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                            <Trash2 className="w-4 h-4 text-red-700" />
                        </div>
                        <h3 className="text-base font-semibold text-gray-900">Delete Deal</h3>
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
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                        </div>
                    ) : (
                        <>
                            {/* Danger Zone Banner */}
                            <div
                                className="flex items-center justify-center gap-2 py-2 rounded-[3px] text-white text-sm font-semibold"
                                style={{ background: '#940F24' }}
                            >
                                <AlertTriangle className="w-4 h-4" />
                                Danger Zone
                            </div>

                            <p className="text-sm text-gray-600">
                                You are about to permanently delete the deal{' '}
                                <span className="font-semibold text-gray-900">{dealName}</span>.
                                This action cannot be undone.
                            </p>

                            {/* Impact Analysis */}
                            <div className="space-y-2">
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Associated Data</p>
                                {impactRows.map((row) => (
                                    <div key={row.label} className="flex justify-between text-sm py-1.5 px-3 bg-gray-50 rounded-[3px]">
                                        <span className="text-gray-600">{row.label}</span>
                                        <span className="font-medium text-gray-900">{row.count}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Type-to-confirm */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                    Type <span className="font-bold text-red-600">delete</span> to confirm
                                </label>
                                <input
                                    type="text"
                                    value={confirmText}
                                    onChange={(e) => setConfirmText(e.target.value)}
                                    placeholder="delete"
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-[3px] text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all"
                                />
                            </div>
                        </>
                    )}
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
                        onClick={handleDelete}
                        disabled={!canConfirm || deleting || loading}
                        className="flex items-center gap-2 px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-[3px] text-sm font-medium transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {deleting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Trash2 className="w-4 h-4" />
                        )}
                        {deleting ? 'Deleting...' : 'Delete Deal'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DealDeleteModal;
