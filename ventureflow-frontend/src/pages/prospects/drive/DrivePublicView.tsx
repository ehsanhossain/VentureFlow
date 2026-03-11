/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
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

/* ── MIME helpers ── */
const EXCEL_MIMES = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
];
const WORD_MIMES = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

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

/** Check if a mime type supports full-viewport inline preview */
function isInlinePreviewable(mime?: string): boolean {
    if (!mime) return false;
    return (
        mime.startsWith('image/') ||
        mime === 'application/pdf' ||
        mime.startsWith('video/') ||
        mime.startsWith('text/') ||
        EXCEL_MIMES.includes(mime) ||
        WORD_MIMES.includes(mime)
    );
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

    // Generic preview state
    const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
    const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);

    // Text content state
    const [textContent, setTextContent] = useState<string | null>(null);

    // Excel state
    const [excelHtml, setExcelHtml] = useState<string>('');
    const [sheetNames, setSheetNames] = useState<string[]>([]);
    const [activeSheet, setActiveSheet] = useState(0);
    const xlsxRef = useRef<any>(null);
    const workbookRef = useRef<any>(null);

    // Word state
    const docxContainerRef = useRef<HTMLDivElement>(null);

    const renderSheet = useCallback((wb: any, idx: number, XLSX: any) => {
        const name = wb.SheetNames[idx];
        const ws = wb.Sheets[name];
        if (!ws) return;
        setExcelHtml(XLSX.utils.sheet_to_html(ws, { id: 'excel-preview-table' }));
        setActiveSheet(idx);
    }, []);

    // Auth-aware: if user is logged in, try to resolve and redirect
    useEffect(() => {
        if (auth?.loading) return;
        if (!token) { setError(t('flowdrive.publicView.invalidShareLink')); setLoading(false); return; }

        if (auth?.user) {
            api.get(`/api/drive/shared/${token}/resolve`)
                .then(res => {
                    const d = res.data;
                    const prospectType = d.prospect_type === 'App\\Models\\Target' || d.prospect_type === 'target' ? 'target' : 'investor';
                    // Use project code if available, fall back to numeric ID
                    const prospectIdentifier = d.prospect_code || d.prospect_id;
                    // Build query params to navigate directly to the shared file/folder
                    const params = new URLSearchParams();
                    if (d.folder_id) params.set('folder', d.folder_id);
                    if (d.file_id) params.set('file', d.file_id);
                    const qs = params.toString();
                    navigate(`/drive/${prospectType}/${prospectIdentifier}${qs ? `?${qs}` : ''}`, { replace: true });
                })
                .catch(() => { fetchSharedPublic(); });
        } else {
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
                if (normalized.type === 'file' && normalized.is_previewable && normalized.preview_url) {
                    loadPreview(normalized);
                }
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || t('flowdrive.publicView.linkNoLongerAvailable'));
        } finally {
            setLoading(false);
        }
    };

    const loadPreview = async (sharedItem: SharedItem) => {
        if (!sharedItem.preview_url) return;
        setPreviewLoading(true);
        try {
            const mime = sharedItem.mime_type || '';

            // For Excel/Word, load blob for specialized rendering
            if (EXCEL_MIMES.includes(mime) || WORD_MIMES.includes(mime)) {
                const res = await axios.get(sharedItem.preview_url, { responseType: 'blob' });
                const blob = new Blob([res.data], { type: res.headers['content-type'] || mime });
                setPreviewBlob(blob);

                if (EXCEL_MIMES.includes(mime)) {
                    const XLSX = await import('xlsx');
                    xlsxRef.current = XLSX;
                    const buf = await blob.arrayBuffer();
                    const wb = XLSX.read(new Uint8Array(buf), { type: 'array' });
                    workbookRef.current = wb;
                    setSheetNames(wb.SheetNames);
                    renderSheet(wb, 0, XLSX);
                }

                if (WORD_MIMES.includes(mime)) {
                    // Will be rendered in useEffect when container is ready
                    setPreviewBlobUrl('docx-ready');
                }
            } else if (mime.startsWith('text/')) {
                // Text: fetch as string
                const res = await axios.get(sharedItem.preview_url, { responseType: 'text' });
                setTextContent(res.data);
                setPreviewBlobUrl('text-ready');
            } else {
                // Images, PDFs, Videos: blob URL
                const res = await axios.get(sharedItem.preview_url, { responseType: 'blob' });
                const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/octet-stream' });
                setPreviewBlobUrl(URL.createObjectURL(blob));
            }
        } catch {
            setPreviewBlobUrl(null);
        } finally {
            setPreviewLoading(false);
        }
    };

    // Render Word doc when container and blob are ready
    useEffect(() => {
        if (!previewBlob || !item?.mime_type || !WORD_MIMES.includes(item.mime_type)) return;
        if (!docxContainerRef.current) return;
        let cancelled = false;
        (async () => {
            try {
                const { renderAsync } = await import('docx-preview');
                if (cancelled || !docxContainerRef.current) return;
                docxContainerRef.current.innerHTML = '';
                await renderAsync(previewBlob, docxContainerRef.current, undefined, {
                    className: 'docx-preview-wrapper',
                    inWrapper: true,
                    ignoreWidth: false,
                    ignoreHeight: false,
                });
            } catch { /* silently fail */ }
        })();
        return () => { cancelled = true; };
    }, [previewBlob, item?.mime_type, previewLoading]);

    const handlePasswordSubmit = async () => {
        setVerifying(true);
        setPasswordError(null);
        try {
            const res = await axios.post(`${apiBase}/api/drive/shared/${token}/verify`, { password });
            const normalized = normalizeSharedResponse(res.data);
            setItem(normalized);
            setNeedsPassword(false);
            document.title = normalized.name + ' — CloudFlow';
            if (normalized.type === 'file' && normalized.is_previewable && normalized.preview_url) {
                loadPreview(normalized);
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
            if (previewBlobUrl && previewBlobUrl.startsWith('blob:')) URL.revokeObjectURL(previewBlobUrl);
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

    const mime = item.mime_type || '';
    const showPreview = item.type === 'file' && isInlinePreviewable(mime);
    const isImage = mime.startsWith('image/');
    const isPdf = mime === 'application/pdf';
    const isVideo = mime.startsWith('video/');
    const isText = mime.startsWith('text/');
    const isExcel = EXCEL_MIMES.includes(mime);
    const isWord = WORD_MIMES.includes(mime);

    return (
        <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
            {/* ── Top header bar ── */}
            <div className="shrink-0 bg-white border-b border-gray-200 px-4 py-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                    {item.type === 'folder' ? (
                        <Folder className="w-6 h-6 text-[#064771] fill-[#064771]/10 shrink-0" />
                    ) : (
                        <img src={getFileIconSrc(item.name || '')} alt="" className="w-6 h-6 shrink-0" draggable={false} />
                    )}
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate" title={item.name}>{item.name}</p>
                        {item.size != null && item.size > 0 && (
                            <p className="text-[11px] text-gray-400">{formatFileSize(item.size)}</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {item.type === 'file' && item.allow_download && (
                        <button
                            onClick={handleDownload}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#064771] text-white rounded-[3px] text-xs font-medium hover:bg-[#053a5c] transition-colors"
                        >
                            <Download className="w-3.5 h-3.5" /> {t('flowdrive.publicView.download')}
                        </button>
                    )}
                    {item.type === 'file' && !item.allow_download && (
                        <span className="text-[11px] text-gray-400 italic px-2">{t('flowdrive.publicView.viewOnly', 'View only')}</span>
                    )}
                    <span className="text-[10px] text-gray-300 border-l border-gray-200 pl-2 hidden sm:block">{t('flowdrive.publicView.sharedVia')}</span>
                </div>
            </div>

            {/* ── Content area ── */}
            {showPreview ? (
                /* ── Previewable file — fills remaining viewport ── */
                <div className="flex-1 flex flex-col overflow-hidden">
                    {previewLoading && (
                        <div className="flex-1 flex flex-col items-center justify-center gap-3">
                            <Loader2 className="w-8 h-8 text-[#064771] animate-spin" />
                            <p className="text-sm text-gray-500">Loading preview...</p>
                        </div>
                    )}

                    {/* Image */}
                    {!previewLoading && previewBlobUrl && isImage && (
                        <div className="flex-1 flex items-center justify-center bg-gray-100 p-4 overflow-auto">
                            <img
                                src={previewBlobUrl}
                                alt={item.name}
                                className="max-w-full max-h-full object-contain"
                                style={{ imageRendering: 'auto' }}
                            />
                        </div>
                    )}

                    {/* PDF — full remaining viewport */}
                    {!previewLoading && previewBlobUrl && isPdf && (
                        <iframe
                            src={previewBlobUrl}
                            title={item.name}
                            className="flex-1 w-full border-0"
                        />
                    )}

                    {/* Video */}
                    {!previewLoading && previewBlobUrl && isVideo && (
                        <div className="flex-1 flex items-center justify-center bg-black">
                            <video src={previewBlobUrl} controls className="max-w-full max-h-full">
                                Your browser does not support video playback.
                            </video>
                        </div>
                    )}

                    {/* Text */}
                    {!previewLoading && isText && textContent !== null && (
                        <div className="flex-1 overflow-auto bg-white">
                            <div className="max-w-4xl mx-auto p-6">
                                <pre className="whitespace-pre-wrap break-words font-mono text-sm text-gray-800 leading-relaxed">
                                    {textContent}
                                </pre>
                            </div>
                        </div>
                    )}

                    {/* Excel */}
                    {!previewLoading && isExcel && excelHtml && (
                        <div className="flex-1 flex flex-col overflow-hidden bg-white">
                            <div
                                className="flex-1 overflow-auto p-2 excel-public-container"
                                dangerouslySetInnerHTML={{ __html: excelHtml }}
                            />
                            {sheetNames.length > 1 && (
                                <div className="shrink-0 flex items-center gap-0.5 px-3 py-1.5 border-t border-gray-200 bg-gray-50 overflow-x-auto">
                                    {sheetNames.map((name, idx) => (
                                        <button
                                            key={name}
                                            onClick={() => xlsxRef.current && workbookRef.current && renderSheet(workbookRef.current, idx, xlsxRef.current)}
                                            className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                                                idx === activeSheet
                                                    ? 'bg-white text-[#064771] shadow-sm border border-gray-200'
                                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                                            }`}
                                        >
                                            {name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Word document */}
                    {!previewLoading && isWord && (
                        <div className="flex-1 overflow-auto bg-gray-100 p-4">
                            <div
                                ref={docxContainerRef}
                                className="docx-public-root bg-white mx-auto shadow-sm rounded"
                                style={{ maxWidth: 816 }}
                            />
                        </div>
                    )}

                    {/* Preview failed */}
                    {!previewLoading && !previewBlobUrl && !excelHtml && textContent === null && !isWord && (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <img src={getFileIconSrc(item.name || '')} alt="" className="w-14 h-14 mx-auto mb-3" draggable={false} />
                                <p className="text-sm text-gray-400">Preview unavailable</p>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                /* ── Non-previewable file / Folder — centered card layout ── */
                <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
                    <div className="bg-white rounded-[3px] shadow-sm p-8 w-full max-w-lg text-center">
                        {item.type === 'folder' ? (
                            <Folder className="w-14 h-14 text-[#064771] fill-[#064771]/10 mx-auto mb-4" />
                        ) : (
                            <img src={getFileIconSrc(item.name || '')} alt="" className="w-14 h-14 mx-auto mb-4" draggable={false} />
                        )}

                        <h2 className="text-lg font-medium text-gray-900 mb-1 truncate" title={item.name}>
                            {item.name}
                        </h2>
                        {item.size != null && item.size > 0 && (
                            <p className="text-sm text-gray-400 mb-4">{formatFileSize(item.size)}</p>
                        )}

                        {item.type === 'file' && item.allow_download && (
                            <button
                                onClick={handleDownload}
                                className="flex items-center gap-2 mx-auto px-5 py-2 bg-[#064771] text-white rounded-[3px] text-sm font-medium hover:bg-[#053a5c] transition-colors"
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
                                        className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#064771] text-white rounded-[3px] text-sm font-medium hover:bg-[#053a5c] transition-colors"
                                    >
                                        <Download className="w-4 h-4" /> {t('flowdrive.publicView.downloadAll')}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Shared styles */}
            <style>{`
                .excel-public-container table {
                    border-collapse: collapse;
                    width: 100%;
                    font-size: 13px;
                    background: white;
                }
                .excel-public-container th,
                .excel-public-container td {
                    border: 1px solid #e5e7eb;
                    padding: 6px 10px;
                    text-align: left;
                    white-space: nowrap;
                    max-width: 300px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .excel-public-container th {
                    background: #f3f4f6;
                    font-weight: 600;
                    color: #374151;
                    position: sticky;
                    top: 0;
                    z-index: 1;
                }
                .excel-public-container tr:nth-child(even) td {
                    background: #f9fafb;
                }
                .excel-public-container tr:hover td {
                    background: #eef2ff;
                }
                .docx-public-root .docx-wrapper {
                    background: white !important;
                    padding: 20px 30px !important;
                }
                .docx-public-root .docx-wrapper > section {
                    box-shadow: none !important;
                    margin-bottom: 0 !important;
                }
            `}</style>
        </div>
    );
};

export default DrivePublicView;
