/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface UnsavedChangesModalProps {
    isOpen: boolean;
    onStay: () => void;
    onDiscard: () => void;
    onSaveDraft?: () => void;
    isSaving?: boolean;
}

const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({
    isOpen,
    onStay,
    onDiscard,
    onSaveDraft,
    isSaving = false,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onStay} />

            {/* Modal */}
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6 animate-in fade-in zoom-in-95 duration-150">
                {/* Icon */}
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-amber-50">
                    <AlertTriangle className="w-6 h-6 text-amber-500" />
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                    Unsaved Changes
                </h3>

                {/* Description */}
                <p className="text-sm text-gray-500 text-center mb-6">
                    You have unsaved changes. What would you like to do?
                </p>

                {/* Buttons */}
                <div className="flex flex-col gap-2">
                    {onSaveDraft && (
                        <button
                            onClick={onSaveDraft}
                            disabled={isSaving}
                            className="w-full px-4 py-2.5 bg-[#064771] text-white text-sm font-medium rounded-[3px] hover:bg-[#053a5e] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving ? 'Saving...' : 'Save as Draft'}
                        </button>
                    )}
                    <button
                        onClick={onDiscard}
                        className="w-full px-4 py-2.5 bg-white text-red-600 text-sm font-medium rounded-[3px] border border-red-200 hover:bg-red-50 transition-all active:scale-[0.98]"
                    >
                        Discard Changes
                    </button>
                    <button
                        onClick={onStay}
                        className="w-full px-4 py-2.5 bg-white text-gray-700 text-sm font-medium rounded-[3px] border border-gray-200 hover:bg-gray-50 transition-all active:scale-[0.98]"
                    >
                        Stay on Page
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UnsavedChangesModal;
