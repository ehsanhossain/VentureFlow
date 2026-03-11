/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Download, Maximize2, Minimize2, Loader2 } from 'lucide-react';
import { formatFileSize, getFileIconSrc } from './driveUtils';
import { DriveFile } from './useProspectDrive';

interface DriveFilePreviewProps {
    file: DriveFile | null;
    previewUrl: string | null;
    loading?: boolean;
    onClose: () => void;
    onDownload: () => void;
}

/* ── MIME helpers ── */
const EXCEL_MIMES = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
];
const WORD_MIMES = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const DriveFilePreview: React.FC<DriveFilePreviewProps> = ({ file, previewUrl, loading, onClose, onDownload }) => {
    const { t } = useTranslation();
    const [fullscreen, setFullscreen] = React.useState(false);

    const mime = file?.mime_type || '';
    const isImage = mime.startsWith('image/');
    const isPdf = mime === 'application/pdf';
    const isVideo = mime.startsWith('video/');
    const isText = mime.startsWith('text/');
    const isExcel = EXCEL_MIMES.includes(mime);
    const isWord = WORD_MIMES.includes(mime);

    /* ── Text content state (white background instead of dark iframe) ── */
    const [textContent, setTextContent] = useState<string | null>(null);
    useEffect(() => {
        if (!isText || !previewUrl) { setTextContent(null); return; }
        fetch(previewUrl)
            .then(r => r.text())
            .then(setTextContent)
            .catch(() => setTextContent(null));
    }, [isText, previewUrl]);

    /* ── Excel state ── */
    const [excelHtml, setExcelHtml] = useState<string>('');
    const [sheetNames, setSheetNames] = useState<string[]>([]);
    const [activeSheet, setActiveSheet] = useState(0);
    const xlsxRef = useRef<any>(null); // lazy-loaded module
    const workbookRef = useRef<any>(null); // parsed workbook

    const renderSheet = useCallback((wb: any, idx: number, XLSX: any) => {
        const name = wb.SheetNames[idx];
        const ws = wb.Sheets[name];
        if (!ws) return;
        const html = XLSX.utils.sheet_to_html(ws, { id: 'excel-preview-table' });
        setExcelHtml(html);
        setActiveSheet(idx);
    }, []);

    useEffect(() => {
        if (!isExcel || !previewUrl) { setExcelHtml(''); setSheetNames([]); return; }
        let cancelled = false;
        (async () => {
            try {
                const XLSX = await import('xlsx');
                xlsxRef.current = XLSX;
                const resp = await fetch(previewUrl);
                const buf = await resp.arrayBuffer();
                const wb = XLSX.read(new Uint8Array(buf), { type: 'array' });
                workbookRef.current = wb;
                if (cancelled) return;
                setSheetNames(wb.SheetNames);
                renderSheet(wb, 0, XLSX);
            } catch {
                if (!cancelled) setExcelHtml('<p style="color:#666;padding:1rem;">Failed to load spreadsheet.</p>');
            }
        })();
        return () => { cancelled = true; };
    }, [isExcel, previewUrl, renderSheet]);

    /* ── Word (docx) state ── */
    const docxContainerRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!isWord || !previewUrl || !docxContainerRef.current) return;
        let cancelled = false;
        (async () => {
            try {
                const { renderAsync } = await import('docx-preview');
                const resp = await fetch(previewUrl);
                const blob = await resp.blob();
                if (cancelled || !docxContainerRef.current) return;
                docxContainerRef.current.innerHTML = '';
                await renderAsync(blob, docxContainerRef.current, undefined, {
                    className: 'docx-preview-wrapper',
                    inWrapper: true,
                    ignoreWidth: false,
                    ignoreHeight: false,
                });
            } catch {
                if (!cancelled && docxContainerRef.current)
                    docxContainerRef.current.innerHTML = '<p style="color:#666;padding:1rem;">Failed to load document.</p>';
            }
        })();
        return () => { cancelled = true; };
    }, [isWord, previewUrl]);

    const hasKnownPreview = isImage || isPdf || isVideo || isText || isExcel || isWord;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative bg-white rounded-lg shadow-2xl flex flex-col z-[101] transition-all duration-200 ${fullscreen ? 'w-full h-full m-0 rounded-none' : 'w-full max-w-5xl h-[90vh]'}`}>
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                        {file && <img src={getFileIconSrc(file.original_name)} alt="" className="w-7 h-7 shrink-0" draggable={false} />}
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{file?.original_name || 'Loading...'}</p>
                            {file && <p className="text-[11px] text-gray-400">{formatFileSize(file.size)} · v{file.current_version}</p>}
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button onClick={onDownload} className="p-1.5 hover:bg-gray-100 rounded transition-colors" title={t('flowdrive.filePreview.download')} aria-label={t('flowdrive.filePreview.download')}>
                            <Download className="w-4 h-4 text-gray-500" />
                        </button>
                        <button onClick={() => setFullscreen(!fullscreen)} className="p-1.5 hover:bg-gray-100 rounded transition-colors" title={t('flowdrive.filePreview.toggleFullscreen')} aria-label={t('flowdrive.filePreview.toggleFullscreen')}>
                            {fullscreen ? <Minimize2 className="w-4 h-4 text-gray-500" /> : <Maximize2 className="w-4 h-4 text-gray-500" />}
                        </button>
                        <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded transition-colors" aria-label="Close">
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Preview content */}
                <div className="flex-1 overflow-auto bg-gray-50 flex flex-col">
                    {loading && (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 className="w-8 h-8 text-[#064771] animate-spin" />
                                <p className="text-sm text-gray-500">Loading preview...</p>
                            </div>
                        </div>
                    )}

                    {/* ── Image ── */}
                    {!loading && previewUrl && isImage && (
                        <div className="flex-1 flex items-center justify-center p-4">
                            <img
                                src={previewUrl}
                                alt={file?.original_name || ''}
                                className="max-w-full max-h-full object-contain rounded"
                                style={{ imageRendering: 'auto' }}
                            />
                        </div>
                    )}

                    {/* ── PDF ── */}
                    {!loading && previewUrl && isPdf && (
                        <iframe
                            src={previewUrl}
                            title={file?.original_name || ''}
                            className="flex-1 w-full border-0"
                        />
                    )}

                    {/* ── Video ── */}
                    {!loading && previewUrl && isVideo && (
                        <div className="flex-1 flex items-center justify-center p-4">
                            <video src={previewUrl} controls className="max-w-full max-h-full rounded">
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    )}

                    {/* ── Text — white background, dark monospace text ── */}
                    {!loading && previewUrl && isText && (
                        <div className="flex-1 overflow-auto p-6 bg-white">
                            <pre className="whitespace-pre-wrap break-words font-mono text-sm text-gray-800 leading-relaxed">
                                {textContent ?? 'Loading…'}
                            </pre>
                        </div>
                    )}

                    {/* ── Excel spreadsheet ── */}
                    {!loading && previewUrl && isExcel && (
                        <div className="flex-1 flex flex-col overflow-hidden">
                            {/* Sheet content */}
                            <div
                                className="flex-1 overflow-auto p-2 excel-preview-container"
                                dangerouslySetInnerHTML={{ __html: excelHtml }}
                            />
                            {/* Sheet tabs */}
                            {sheetNames.length > 1 && (
                                <div className="shrink-0 flex items-center gap-0.5 px-2 py-1.5 border-t border-gray-200 bg-gray-100 overflow-x-auto">
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

                    {/* ── Word (docx) ── */}
                    {!loading && previewUrl && isWord && (
                        <div className="flex-1 overflow-auto bg-gray-100 p-4">
                            <div
                                ref={docxContainerRef}
                                className="docx-preview-root bg-white mx-auto shadow-sm rounded"
                                style={{ maxWidth: 816 }} /* A4 page width */
                            />
                        </div>
                    )}

                    {/* ── Fallback: download only ── */}
                    {!loading && !hasKnownPreview && file && (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <img src={getFileIconSrc(file.original_name)} alt="" className="w-16 h-16 mx-auto mb-4" draggable={false} />
                                <p className="text-sm text-gray-500 mb-3">{t('flowdrive.filePreview.noPreview')}</p>
                                <button
                                    onClick={onDownload}
                                    className="flex items-center gap-1.5 mx-auto px-4 py-2 bg-[#064771] text-white rounded text-sm font-medium hover:bg-[#053a5c] transition-colors"
                                >
                                    <Download className="w-4 h-4" /> {t('flowdrive.filePreview.downloadFile')}
                                </button>
                            </div>
                        </div>
                    )}
                    {!loading && !previewUrl && hasKnownPreview && file && (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <img src={getFileIconSrc(file.original_name)} alt="" className="w-16 h-16 mx-auto mb-4" draggable={false} />
                                <p className="text-sm text-gray-500 mb-3">{t('flowdrive.filePreview.noPreview')}</p>
                                <button
                                    onClick={onDownload}
                                    className="flex items-center gap-1.5 mx-auto px-4 py-2 bg-[#064771] text-white rounded text-sm font-medium hover:bg-[#053a5c] transition-colors"
                                >
                                    <Download className="w-4 h-4" /> {t('flowdrive.filePreview.downloadFile')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Excel table styling */}
            <style>{`
                .excel-preview-container table {
                    border-collapse: collapse;
                    width: 100%;
                    font-size: 13px;
                    background: white;
                    border-radius: 4px;
                    overflow: hidden;
                }
                .excel-preview-container th,
                .excel-preview-container td {
                    border: 1px solid #e5e7eb;
                    padding: 6px 10px;
                    text-align: left;
                    white-space: nowrap;
                    max-width: 300px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .excel-preview-container th {
                    background: #f3f4f6;
                    font-weight: 600;
                    color: #374151;
                    position: sticky;
                    top: 0;
                    z-index: 1;
                }
                .excel-preview-container tr:nth-child(even) td {
                    background: #f9fafb;
                }
                .excel-preview-container tr:hover td {
                    background: #eef2ff;
                }
                /* docx-preview styling */
                .docx-preview-root .docx-wrapper {
                    background: white !important;
                    padding: 20px 30px !important;
                }
                .docx-preview-root .docx-wrapper > section {
                    box-shadow: none !important;
                    margin-bottom: 0 !important;
                }
            `}</style>
        </div>
    );
};

export default DriveFilePreview;
