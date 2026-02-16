import React from 'react';
import { ShieldAlert, X, XCircle } from 'lucide-react';

interface GateBlockedModalProps {
    isOpen: boolean;
    onClose: () => void;
    stageName: string;
    errors: string[];
}

const GateBlockedModal: React.FC<GateBlockedModalProps> = ({
    isOpen,
    onClose,
    stageName,
    errors,
}) => {
    if (!isOpen || errors.length === 0) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
            <div className="bg-white rounded-[3px] w-full max-w-md shadow-2xl" style={{ fontFamily: 'Inter, sans-serif' }}>
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

                    <p className="text-xs text-gray-500 mt-3">
                        Please resolve the above requirements and try again.
                    </p>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-[#064771] hover:bg-[#053a5e] text-white rounded-[3px] text-sm font-medium transition-all shadow-sm active:scale-95"
                    >
                        Got it
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GateBlockedModal;
