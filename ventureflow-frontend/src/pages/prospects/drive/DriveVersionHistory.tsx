/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, History, Download, Upload } from 'lucide-react';
import api from '../../../config/api';
import { formatFileSize, timeAgo } from './driveUtils';
import { DriveVersion } from './useProspectDrive';

interface DriveVersionHistoryProps {
    fileId: string;
    onClose: () => void;
    onReplace: () => void;
}

const DriveVersionHistory: React.FC<DriveVersionHistoryProps> = ({ fileId, onClose, onReplace }) => {
    const { t } = useTranslation();
    const [versions, setVersions] = useState<DriveVersion[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVersions = async () => {
            try {
                const res = await api.get(`/api/drive/file/${fileId}/versions`);
                setVersions(res.data.versions ?? []);
            } catch {
                console.error('Failed to load versions');
            } finally {
                setLoading(false);
            }
        };
        fetchVersions();
    }, [fileId]);

    const handleDownloadVersion = (versionId: string) => {
        window.open(`${api.defaults.baseURL}/api/drive/file/${fileId}/versions/${versionId}/download`, '_blank');
    };

    return (
        <div className="fixed inset-0 z-[100] flex justify-end">
            <div className="fixed inset-0 bg-gray-900/30" onClick={onClose} />
            <div className="relative w-full max-w-sm bg-white shadow-xl flex flex-col z-[101] animate-in slide-in-from-right duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                    <h3 className="text-base font-medium text-gray-900 flex items-center gap-2">
                        <History className="w-4 h-4 text-[#064771]" /> {t('flowdrive.versionHistory.title')}
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded" aria-label="Close">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Versions list */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 scrollbar-premium">
                    {loading ? (
                        <div className="flex items-center justify-center py-8 text-sm text-gray-400">{t('flowdrive.versionHistory.loading')}</div>
                    ) : versions.length === 0 ? (
                        <div className="text-center py-12">
                            <History className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                            <p className="text-sm text-gray-400">{t('flowdrive.versionHistory.noVersions')}</p>
                        </div>
                    ) : (
                        versions.map((v, i) => (
                            <div key={v.id} className="flex items-center gap-3 p-3 rounded border border-gray-100 hover:bg-gray-50 transition-colors">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i === 0 ? 'bg-[#064771] text-white' : 'bg-gray-100 text-gray-500'}`}>
                                    v{v.version_number}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 truncate">{v.original_name}</p>
                                    <div className="flex items-center gap-2 text-[11px] text-gray-400">
                                        <span>{formatFileSize(v.size)}</span>
                                        <span>·</span>
                                        <span>{timeAgo(v.created_at)}</span>
                                    </div>
                                    <p className="text-[11px] text-gray-400">{v.uploaded_by_name}</p>
                                </div>
                                <button
                                    onClick={() => handleDownloadVersion(v.id)}
                                    className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                                    title={t('flowdrive.versionHistory.downloadVersion')}
                                    aria-label={t('flowdrive.versionHistory.downloadVersion')}
                                >
                                    <Download className="w-4 h-4 text-gray-400" />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Upload new version */}
                <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
                    <button
                        onClick={() => { onReplace(); onClose(); }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#064771] text-white rounded text-sm font-medium hover:bg-[#053a5c] transition-colors"
                    >
                        <Upload className="w-4 h-4" /> {t('flowdrive.versionHistory.uploadNewVersion')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DriveVersionHistory;
