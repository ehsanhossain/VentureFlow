/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, X, AlertTriangle, Folder, File } from 'lucide-react';

interface DriveDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    itemName: string;
    itemType: 'file' | 'folder';
    /** For bulk delete: number of items being deleted */
    bulkCount?: number;
}

const DriveDeleteModal: React.FC<DriveDeleteModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    itemName,
    itemType,
    bulkCount,
}) => {
    const { t } = useTranslation();
    const [deleting, setDeleting] = useState(false);

    if (!isOpen) return null;

    const isBulk = bulkCount !== undefined && bulkCount > 1;

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await onConfirm();
        } finally {
            setDeleting(false);
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center"
                style={{ fontFamily: 'Inter, sans-serif' }}
                onClick={onClose}
            >
                {/* Modal */}
                <div
                    className="bg-white rounded-[3px] border border-gray-100 w-[420px] max-w-[90vw] animate-in fade-in zoom-in-95 duration-150"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            <Trash2 className="w-5 h-5 text-gray-700" />
                            <span className="text-base font-medium text-gray-700">
                                {isBulk
                                    ? t('flowdrive.deleteModal.titleBulk', 'Delete {{count}} Items', { count: bulkCount })
                                    : itemType === 'folder'
                                        ? t('flowdrive.deleteModal.titleFolder', 'Delete Folder')
                                        : t('flowdrive.deleteModal.titleFile', 'Delete File')
                                }
                            </span>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-6 h-6 flex items-center justify-center rounded-[3px] hover:bg-gray-100 transition-colors"
                            aria-label="Close"
                        >
                            <X className="w-4 h-4 text-gray-400" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="px-5 py-5 flex flex-col gap-5">
                        {/* Danger banner */}
                        <div className="bg-[#940F24] rounded-[3px] p-3 flex items-start gap-2.5">
                            <AlertTriangle className="w-5 h-5 text-white shrink-0 mt-0.5" />
                            <div className="flex flex-col gap-1">
                                <span className="text-white text-sm font-semibold">
                                    {t('flowdrive.deleteModal.dangerZone', 'Danger Zone')}
                                </span>
                                <span className="text-[#FAB8B8] text-xs leading-relaxed">
                                    {isBulk
                                        ? t('flowdrive.deleteModal.bulkWarning', 'You are about to permanently delete {{count}} selected items. This action is permanent and cannot be undone.', { count: bulkCount })
                                        : itemType === 'folder'
                                            ? t('flowdrive.deleteModal.folderWarning', 'You are about to permanently delete the folder and all its contents. This action is permanent and cannot be undone.')
                                            : t('flowdrive.deleteModal.fileWarning', 'You are about to permanently delete this file. This action is permanent and cannot be undone.')
                                    }
                                </span>
                            </div>
                        </div>

                        {/* Item info — show the item being deleted */}
                        {!isBulk && (
                            <div className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 rounded-[3px] border border-gray-100">
                                {itemType === 'folder'
                                    ? <Folder className="w-5 h-5 text-[#064771] fill-[#064771]/10 shrink-0" />
                                    : <File className="w-5 h-5 text-gray-500 shrink-0" />
                                }
                                <span className="text-sm font-medium text-gray-800 truncate">{itemName}</span>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 px-4 py-3 border-t border-gray-50">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-600 rounded-[3px] hover:bg-gray-100 transition-colors"
                        >
                            {t('flowdrive.deleteModal.cancel', 'Cancel')}
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="flex items-center gap-2 px-5 py-2 bg-[#940F24] text-white rounded-[3px] text-sm font-medium transition-all hover:bg-[#7A0C1E] disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {deleting ? (
                                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 14 14" fill="none">
                                    <circle cx="7" cy="7" r="6" stroke="white" strokeWidth="2" strokeDasharray="20 10" />
                                </svg>
                            ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                            )}
                            {deleting
                                ? t('flowdrive.deleteModal.deleting', 'Deleting...')
                                : t('flowdrive.deleteModal.confirmDelete', 'Confirm Delete')
                            }
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default DriveDeleteModal;
