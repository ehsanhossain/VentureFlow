/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Download, Lock, Folder, AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';
import api from '../../../config/api';
import { AuthContext } from '../../../routes/AuthContext';
import { formatFileSize, getFileIconSrc } from './driveUtils';

/**
 * Public share view — accessible without authentication.
 * Auth-aware: logged-in users are redirected to the file/folder inside the app.
 * External users see a standalone page with inline preview and optional download.
 */

// Normalize API base for public (unauthenticated) axios calls
const rawBase = import.meta.env.VITE_API_BASE_URL || '';
const apiBase = rawBase === '/' ? '' : rawBase;

interface SharedFile {
    id: string;
    name: string;
    mime_type: string;
    size: number;
    is_previewable: boolean;
    preview_url: string;
    download_url: string;
}

interface SharedItem {
    type: 'file' | 'folder';
    name: string;
    size?: number;
    mime_type?: string;
    is_previewable?: boolean;
    preview_url?: string;
    download_url?: string;
    allow_download: boolean;
    files?: { id: string; original_name: string; size: number; mime_type: string }[];
}

/** Normalize the nested API response into a flat SharedItem */
function normalizeSharedResponse(data: any): SharedItem {
    if (data.type === 'file' && data.file) {
        const f: SharedFile = data.file;
        return {
            type: 'file',
            name: f.name || 'File',
            size: f.size,
            mime_type: f.mime_type,
            is_previewable: f.is_previewable,
            preview_url: f.preview_url,
            download_url: f.download_url,
            allow_download: data.allow_download !== false,
        };
    }
    if (data.type === 'folder' && data.folder) {
        return {
            type: 'folder',
            name: data.folder.name || 'Folder',
            allow_download: data.allow_download !== false,
            files: (data.files || []).map((f: any) => ({
                id: f.id, original_name: f.original_name, size: f.size, mime_type: f.mime_type,
            })),
        };
    }
    return { ...data, allow_download: data.allow_download !== false } as SharedItem;
}

/** Check if a mime type is previewable inline */
function isInlinePreviewable(mime?: string): boolean {
    if (!mime) return false;
    return mime.startsWith('image/') || mime === 'application/pdf' || mime.startsWith('video/');
}

const DrivePublicView: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const auth = useContext(AuthContext);
    const token = window.location.pathname.split('/shared/')[1]?.split('/')[0] || '';

    const [item, setItem] = useState<SharedItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [needsPassword, setNeedsPassword] = useState(false);
    const [sharedName, setSharedName] = useState<string>('');
    const [password, setPassword] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [passwordError, setPasswordError] = useState<string | null>(null);

    // Inline preview state
    const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);

    // Auth-aware: if user is logged in, try to resolve and redirect
    useEffect(() => {
        if (auth?.loading) return; // Wait for auth check to finish
        if (!token) { setError(t('flowdrive.publicView.invalidShareLink')); setLoading(false); return; }

        if (auth?.user) {
            // Logged-in → try to resolve the share to an in-app location
            api.get(`/api/drive/shared/${token}/resolve`)
                .then(res => {
                    const d = res.data;
                    const prospectType = d.prospect_type === 'App\\Models\\Target' || d.prospect_type === 'target' ? 'target' : 'investor';
                    // Navigate to the drive explorer with the correct folder
                    navigate(`/drive/${prospectType}/${d.prospect_id}`, { replace: true });
                })
                .catch(() => {
                    // Resolve failed — fall back to public view
                    fetchSharedPublic();
                });
        } else {
            // Not logged in — show public view
            fetchSharedPublic();
        }
    }, [auth?.loading, auth?.user, token]);

    const fetchSharedPublic = async () => {
        try {
            const res = await axios.get(`${apiBase}/api/drive/shared/${token}`);
            if (res.data.requires_password) {
                setNeedsPassword(true);
                if (res.data.name) setSharedName(res.data.name);
            } else {
                const normalized = normalizeSharedResponse(res.data);
                setItem(normalized);
                document.title = normalized.name + ' — CloudFlow';
                // Auto-load preview if file is previewable
                if (normalized.type === 'file' && normalized.is_previewable && normalized.preview_url) {
                    loadPreview(normalized.preview_url);
                }
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || t('flowdrive.publicView.linkNoLongerAvailable'));
        } finally {
            setLoading(false);
        }
    };

    const loadPreview = async (previewUrl: string) => {
        setPreviewLoading(true);
        try {
            const res = await axios.get(previewUrl, { responseType: 'blob' });
            const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/octet-stream' });
            setPreviewBlobUrl(URL.createObjectURL(blob));
        } catch {
            setPreviewBlobUrl(null);
        } finally {
            setPreviewLoading(false);
        }
    };

    const handlePasswordSubmit = async () => {
        setVerifying(true);
        setPasswordError(null);
        try {
            const res = await axios.post(`${apiBase}/api/drive/shared/${token}/verify`, { password });
            const normalized = normalizeSharedResponse(res.data);
            setItem(normalized);
            setNeedsPassword(false);
            document.title = normalized.name + ' — CloudFlow';
            // Auto-load preview after password success
            if (normalized.type === 'file' && normalized.is_previewable && normalized.preview_url) {
                loadPreview(normalized.preview_url);
            }
        } catch (err: any) {
            setPasswordError(err?.response?.data?.message || t('flowdrive.publicView.incorrectPassword'));
        } finally {
            setVerifying(false);
        }
    };

    const handleDownload = () => {
        window.open(`${apiBase}/api/drive/shared/${token}/download`, '_blank');
    };

    // Clean up blob URL on unmount
    useEffect(() => {
        return () => {
            if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
        };
    }, [previewBlobUrl]);

    /* ── Render states ── */

    if (loading || auth?.loading) {
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
                <div className="bg-white rounded-[3px] shadow-lg p-8 w-full max-w-sm">
                    <div className="text-center mb-6">
                        <Lock className="w-10 h-10 text-[#064771] mx-auto mb-3" />
                        <h2 className="text-lg font-medium text-gray-900">{t('flowdrive.publicView.passwordRequired')}</h2>
                        {sharedName && (
                            <p className="text-sm text-gray-500 mt-1.5 truncate max-w-[280px] mx-auto" title={sharedName}>
                                {sharedName}
                            </p>
                        )}
                        <p className="text-sm text-gray-400 mt-1">{t('flowdrive.publicView.enterPasswordPrompt')}</p>
                    </div>
                    <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handlePasswordSubmit(); }}
                        placeholder={t('flowdrive.publicView.enterPassword')}
                        className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-[3px] text-sm mb-3 focus:outline-none focus:ring-1 focus:ring-[#064771]"
                        autoFocus
                    />
                    {passwordError && <p className="text-xs text-red-500 mb-2">{passwordError}</p>}
                    <button
                        onClick={handlePasswordSubmit}
                        disabled={!password || verifying}
                        className="w-full px-4 py-2.5 bg-[#064771] text-white rounded-[3px] text-sm font-medium hover:bg-[#053a5c] disabled:opacity-50 transition-colors"
                    >
                        {verifying ? t('flowdrive.publicView.verifying') : t('flowdrive.publicView.access')}
                    </button>
                </div>
            </div>
        );
    }

    if (!item) return null;

    const showPreview = item.type === 'file' && isInlinePreviewable(item.mime_type);
    const isImage = item.mime_type?.startsWith('image/');
    const isPdf = item.mime_type === 'application/pdf';
    const isVideo = item.mime_type?.startsWith('video/');

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
            <div className="bg-white rounded-[3px] shadow-lg w-full max-w-2xl overflow-hidden">
                {/* Inline preview area */}
                {showPreview && (
                    <div className="bg-gray-100 flex items-center justify-center" style={{ minHeight: 300, maxHeight: '60vh' }}>
                        {previewLoading && (
                            <div className="flex flex-col items-center gap-3 py-12">
                                <Loader2 className="w-8 h-8 text-[#064771] animate-spin" />
                                <p className="text-sm text-gray-500">Loading preview...</p>
                            </div>
                        )}
                        {!previewLoading && previewBlobUrl && isImage && (
                            <img
                                src={previewBlobUrl}
                                alt={item.name}
                                className="max-w-full max-h-[60vh] object-contain"
                                style={{ imageRendering: 'auto' }}
                            />
                        )}
                        {!previewLoading && previewBlobUrl && isPdf && (
                            <iframe
                                src={previewBlobUrl}
                                title={item.name}
                                className="w-full border-0"
                                style={{ height: '60vh' }}
                            />
                        )}
                        {!previewLoading && previewBlobUrl && isVideo && (
                            <video
                                src={previewBlobUrl}
                                controls
                                className="max-w-full max-h-[60vh]"
                            >
                                Your browser does not support video playback.
                            </video>
                        )}
                        {!previewLoading && !previewBlobUrl && (
                            <div className="text-center py-12">
                                <img src={getFileIconSrc(item.name || '')} alt="" className="w-14 h-14 mx-auto mb-3" draggable={false} />
                                <p className="text-sm text-gray-400">Preview unavailable</p>
                            </div>
                        )}
                    </div>
                )}

                {/* File/folder info */}
                <div className="p-6">
                    <div className="text-center">
                        {/* Icon — only show when there's no inline preview */}
                        {!showPreview && (
                            <>
                                {item.type === 'folder' ? (
                                    <Folder className="w-14 h-14 text-[#064771] fill-[#064771]/10 mx-auto mb-3" />
                                ) : (
                                    <img src={getFileIconSrc(item.name || '')} alt="" className="w-14 h-14 mx-auto mb-3" draggable={false} />
                                )}
                            </>
                        )}

                        <h2 className="text-lg font-medium text-gray-900 mb-1 truncate max-w-[500px] mx-auto" title={item.name}>
                            {item.name}
                        </h2>
                        {item.size != null && item.size > 0 && (
                            <p className="text-sm text-gray-400 mb-4">{formatFileSize(item.size)}</p>
                        )}

                        {/* Single file download */}
                        {item.type === 'file' && item.allow_download && (
                            <button
                                onClick={handleDownload}
                                className="flex items-center gap-2 mx-auto px-6 py-2.5 bg-[#064771] text-white rounded-[3px] text-sm font-medium hover:bg-[#053a5c] transition-colors"
                            >
                                <Download className="w-4 h-4" /> {t('flowdrive.publicView.download')}
                            </button>
                        )}

                        {item.type === 'file' && !item.allow_download && (
                            <p className="text-xs text-gray-400 italic">{t('flowdrive.publicView.viewOnly', 'View only — download disabled')}</p>
                        )}

                        {/* Folder listing */}
                        {item.type === 'folder' && item.files && (
                            <div className="mt-4 text-left">
                                <p className="text-xs font-medium text-gray-500 uppercase mb-2">{item.files.length} files</p>
                                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                                    {item.files.map(f => (
                                        <div key={f.id} className="flex items-center gap-2.5 p-2 rounded-[3px] border border-gray-100 hover:bg-gray-50">
                                            <img src={getFileIconSrc(f.original_name)} alt="" className="w-6 h-6 shrink-0" draggable={false} />
                                            <span className="text-sm text-gray-700 truncate flex-1">{f.original_name}</span>
                                            <span className="text-[11px] text-gray-400">{formatFileSize(f.size)}</span>
                                        </div>
                                    ))}
                                </div>
                                {item.allow_download && (
                                    <button
                                        onClick={handleDownload}
                                        className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#064771] text-white rounded-[3px] text-sm font-medium hover:bg-[#053a5c] transition-colors"
                                    >
                                        <Download className="w-4 h-4" /> {t('flowdrive.publicView.downloadAll')}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Branding footer */}
                <div className="px-6 pb-6">
                    <div className="pt-4 border-t border-gray-100 text-center">
                        <p className="text-[11px] text-gray-400">{t('flowdrive.publicView.sharedVia')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DrivePublicView;
