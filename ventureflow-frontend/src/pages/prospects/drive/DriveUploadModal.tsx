/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, X, AlertCircle, Check } from 'lucide-react';
import { formatFileSize, MAX_FILE_SIZE, getFileIconSrc } from './driveUtils';
import { UploadAggregate } from './useProspectDrive';

interface DriveUploadModalProps {
    onClose: () => void;
    onUpload: (files: File[]) => Promise<void>;
    uploadAggregate: UploadAggregate;
}

const DriveUploadModal: React.FC<DriveUploadModalProps> = ({ onClose, onUpload, uploadAggregate }) => {
    const { t } = useTranslation();
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [dragActive, setDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);

    /** Add files, filtering out duplicates (same name+size) and zero-byte files */
    const addFiles = useCallback((newFiles: File[]) => {
        setSelectedFiles(prev => {
            const filtered = newFiles.filter(nf => {
                if (nf.size === 0) return false; // skip zero-byte
                return !prev.some(p => p.name === nf.name && p.size === nf.size);
            });
            return [...prev, ...filtered];
        });
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);
        addFiles(Array.from(e.dataTransfer.files));
    }, [addFiles]);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            addFiles(Array.from(e.target.files));
        }
    }, [addFiles]);

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) return;
        const oversized = selectedFiles.filter(f => f.size > MAX_FILE_SIZE);
        if (oversized.length > 0) {
            alert(`${t('flowdrive.uploadModal.overSizeError')} ${oversized.map(f => f.name).join(', ')}`);
            return;
        }
        setUploading(true);
        await onUpload(selectedFiles);
        setSelectedFiles([]);
        setUploading(false);
    };

    const agg = uploadAggregate;
    const allDone = agg.status === 'complete' || agg.status === 'error';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto z-[101]">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">{t('flowdrive.uploadModal.title')}</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded transition-colors" aria-label="Close">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Dropzone */}
                <div className="p-5">
                    <div
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive ? 'border-[#064771] bg-blue-50/50' : 'border-gray-200 hover:border-gray-300'}`}
                        onDragOver={e => { e.preventDefault(); setDragActive(true); }}
                        onDragLeave={() => setDragActive(false)}
                        onDrop={handleDrop}
                    >
                        <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-600 mb-1">{t('flowdrive.uploadModal.dragDrop')}</p>
                        <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#064771] text-white rounded text-sm font-medium hover:bg-[#053a5c] cursor-pointer transition-colors">
                            <Upload className="w-4 h-4" /> {t('flowdrive.uploadModal.browseFiles')}
                            <input type="file" multiple className="hidden" onChange={handleFileSelect} />
                        </label>
                        <p className="text-xs text-gray-400 mt-2">{t('flowdrive.uploadModal.maxFileSize')}</p>
                    </div>

                    {/* Selected files */}
                    {selectedFiles.length > 0 && (
                        <div className="mt-4 space-y-2">
                            <h4 className="text-xs font-medium text-gray-500 uppercase">{t('flowdrive.uploadModal.selectedFiles')}</h4>
                            {selectedFiles.map((file, i) => {
                                return (
                                    <div key={`${file.name}-${i}`} className="flex items-center gap-2.5 p-2 bg-gray-50 rounded border border-gray-100">
                                        <img src={getFileIconSrc(file.name)} alt="" className="w-7 h-7 shrink-0" draggable={false} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-gray-800 truncate">{file.name}</p>
                                            <p className="text-[11px] text-gray-400">{formatFileSize(file.size)}</p>
                                        </div>
                                        {file.size > MAX_FILE_SIZE && (
                                            <span className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> {t('flowdrive.uploadModal.tooLarge')}</span>
                                        )}
                                        <button onClick={() => removeFile(i)} className="p-1 hover:bg-gray-200 rounded" aria-label="Remove file">
                                            <X className="w-3.5 h-3.5 text-gray-400" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Consolidated upload progress — single bar */}
                    {agg.totalFiles > 0 && (
                        <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">
                                    {agg.status === 'uploading'
                                        ? t('flowdrive.uploadModal.uploadingOf', { done: agg.completedFiles, total: agg.totalFiles })
                                        : agg.status === 'complete'
                                            ? t('flowdrive.uploadModal.allUploaded', { count: agg.totalFiles })
                                            : agg.status === 'error'
                                                ? t('flowdrive.uploadModal.uploadErrors', { errors: agg.errorFiles, total: agg.totalFiles })
                                                : ''
                                    }
                                </span>
                                <span className="text-xs font-medium text-gray-500">{agg.overallPercent}%</span>
                            </div>
                            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-300 ${agg.status === 'error' ? 'bg-red-500' : agg.status === 'complete' ? 'bg-green-500' : 'bg-[#064771]'}`}
                                    style={{ width: `${agg.overallPercent}%` }}
                                />
                            </div>
                            {agg.status === 'complete' && (
                                <div className="flex items-center gap-1.5 mt-2">
                                    <Check className="w-4 h-4 text-green-500" />
                                    <span className="text-xs text-green-600">{t('flowdrive.uploadModal.uploadComplete')}</span>
                                </div>
                            )}
                            {agg.errorFiles > 0 && (
                                <div className="flex items-center gap-1.5 mt-2">
                                    <AlertCircle className="w-4 h-4 text-red-500" />
                                    <span className="text-xs text-red-600">{agg.errors[0]}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-gray-200 bg-gray-50">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors">
                        {allDone ? t('flowdrive.uploadModal.done') : t('flowdrive.uploadModal.cancel')}
                    </button>
                    {!allDone && (
                        <button
                            onClick={handleUpload}
                            disabled={selectedFiles.length === 0 || uploading}
                            className="px-4 py-2 text-sm font-medium text-white bg-[#064771] rounded hover:bg-[#053a5c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {uploading ? t('flowdrive.uploadModal.uploading') : t('flowdrive.uploadModal.uploadCount', { count: selectedFiles.length })}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DriveUploadModal;
