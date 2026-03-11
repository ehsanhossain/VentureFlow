/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Lock, Folder, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { formatFileSize, getFileIconSrc } from './driveUtils';

/**
 * Public share view — accessible without authentication.
 * Uses plain axios (not the auth-configured instance) for public endpoints.
 */

// Normalize API base: if it's just "/" (production), use "" to avoid "//api/..." double-slash
const rawBase = import.meta.env.VITE_API_BASE_URL || '';
const apiBase = rawBase === '/' ? '' : rawBase;

interface SharedItem {
    type: 'file' | 'folder';
    name: string;
    size?: number;
    mime_type?: string;
    files?: { id: string; original_name: string; size: number; mime_type: string }[];
}

/** Normalize the nested API response into a flat SharedItem */
function normalizeSharedResponse(data: any): SharedItem {
    if (data.type === 'file' && data.file) {
        return {
            type: 'file',
            name: data.file.name || data.file.original_name || 'File',
            size: data.file.size,
            mime_type: data.file.mime_type,
        };
    }
    if (data.type === 'folder' && data.folder) {
        return {
            type: 'folder',
            name: data.folder.name || 'Folder',
            files: (data.files || []).map((f: any) => ({ id: f.id, original_name: f.original_name, size: f.size, mime_type: f.mime_type })),
        };
    }
    // Fallback — if the response already has a flat shape
    return data as SharedItem;
}

const DrivePublicView: React.FC = () => {
    const { t } = useTranslation();
    const token = window.location.pathname.split('/shared/')[1]?.split('/')[0] || '';
    const [item, setItem] = useState<SharedItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [needsPassword, setNeedsPassword] = useState(false);
    const [password, setPassword] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [passwordError, setPasswordError] = useState<string | null>(null);

    useEffect(() => {
        const fetchShared = async () => {
            try {
                const res = await axios.get(`${apiBase}/api/drive/shared/${token}`);
                if (res.data.requires_password) {
                    setNeedsPassword(true);
                } else {
                    const normalized = normalizeSharedResponse(res.data);
                    setItem(normalized);
                    document.title = normalized.name + ' — CloudFlow';
                }
            } catch (err: any) {
                setError(err?.response?.data?.message || t('flowdrive.publicView.linkNoLongerAvailable'));
            } finally {
                setLoading(false);
            }
        };
        if (token) fetchShared();
        else { setError(t('flowdrive.publicView.invalidShareLink')); setLoading(false); }
    }, [token]);

    const handlePasswordSubmit = async () => {
        setVerifying(true);
        setPasswordError(null);
        try {
            const res = await axios.post(`${apiBase}/api/drive/shared/${token}/verify`, { password });
            const normalized = normalizeSharedResponse(res.data);
            setItem(normalized);
            setNeedsPassword(false);
            document.title = normalized.name + ' — CloudFlow';
        } catch (err: any) {
            setPasswordError(err?.response?.data?.message || t('flowdrive.publicView.incorrectPassword'));
        } finally {
            setVerifying(false);
        }
    };

    const handleDownload = () => {
        window.open(`${apiBase}/api/drive/shared/${token}/download`, '_blank');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin w-8 h-8 border-2 border-[#064771] border-t-transparent rounded-full" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="text-center max-w-sm">
                    <AlertCircle className="w-12 h-12 text-red-300 mx-auto mb-4" />
                    <h2 className="text-lg font-medium text-gray-700 mb-1">{t('flowdrive.publicView.linkUnavailable')}</h2>
                    <p className="text-sm text-gray-500">{error}</p>
                </div>
            </div>
        );
    }

    if (needsPassword) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-sm">
                    <div className="text-center mb-6">
                        <Lock className="w-10 h-10 text-[#064771] mx-auto mb-3" />
                        <h2 className="text-lg font-medium text-gray-900">{t('flowdrive.publicView.passwordRequired')}</h2>
                        <p className="text-sm text-gray-500 mt-1">{t('flowdrive.publicView.enterPasswordPrompt')}</p>
                    </div>
                    <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handlePasswordSubmit(); }}
                        placeholder={t('flowdrive.publicView.enterPassword')}
                        className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded text-sm mb-3 focus:outline-none focus:ring-1 focus:ring-[#064771]"
                        autoFocus
                    />
                    {passwordError && <p className="text-xs text-red-500 mb-2">{passwordError}</p>}
                    <button
                        onClick={handlePasswordSubmit}
                        disabled={!password || verifying}
                        className="w-full px-4 py-2.5 bg-[#064771] text-white rounded text-sm font-medium hover:bg-[#053a5c] disabled:opacity-50 transition-colors"
                    >
                        {verifying ? t('flowdrive.publicView.verifying') : t('flowdrive.publicView.access')}
                    </button>
                </div>
            </div>
        );
    }

    if (!item) return null;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
                <div className="text-center">
                    {/* Icon */}
                    {item.type === 'folder' ? (
                        <Folder className="w-14 h-14 text-[#064771] fill-[#064771]/10 mx-auto mb-3" />
                    ) : (
                        <img src={getFileIconSrc(item.name || '')} alt="" className="w-14 h-14 mx-auto mb-3" draggable={false} />
                    )}

                    <h2 className="text-lg font-medium text-gray-900 mb-1">{item.name}</h2>
                    {item.size && <p className="text-sm text-gray-400 mb-4">{formatFileSize(item.size)}</p>}

                    {/* Single file download */}
                    {item.type === 'file' && (
                        <button
                            onClick={handleDownload}
                            className="flex items-center gap-2 mx-auto px-6 py-2.5 bg-[#064771] text-white rounded text-sm font-medium hover:bg-[#053a5c] transition-colors"
                        >
                            <Download className="w-4 h-4" /> {t('flowdrive.publicView.download')}
                        </button>
                    )}

                    {/* Folder listing */}
                    {item.type === 'folder' && item.files && (
                        <div className="mt-4 text-left">
                            <p className="text-xs font-medium text-gray-500 uppercase mb-2">{item.files.length} files</p>
                            <div className="space-y-1.5 max-h-60 overflow-y-auto">
                                {item.files.map(f => {
                                    return (
                                        <div key={f.id} className="flex items-center gap-2.5 p-2 rounded border border-gray-100 hover:bg-gray-50">
                                            <img src={getFileIconSrc(f.original_name)} alt="" className="w-6 h-6 shrink-0" draggable={false} />
                                            <span className="text-sm text-gray-700 truncate flex-1">{f.original_name}</span>
                                            <span className="text-[11px] text-gray-400">{formatFileSize(f.size)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                            <button
                                onClick={handleDownload}
                                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#064771] text-white rounded text-sm font-medium hover:bg-[#053a5c] transition-colors"
                            >
                                <Download className="w-4 h-4" /> {t('flowdrive.publicView.downloadAll')}
                            </button>
                        </div>
                    )}
                </div>

                {/* Branding footer */}
                <div className="mt-8 pt-4 border-t border-gray-100 text-center">
                    <p className="text-[11px] text-gray-400">{t('flowdrive.publicView.sharedVia')}</p>
                </div>
            </div>
        </div>
    );
};

export default DrivePublicView;
