/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

/* ─────────────── Flowdrive  –  Utility functions ─────────────── */

/* ── File-type icon imports ── */
import iconImage from '../../../assets/file-icons/image.svg';
import iconVideo from '../../../assets/file-icons/video.svg';
import iconSound from '../../../assets/file-icons/Sound.svg';
import iconDoc from '../../../assets/file-icons/doc.svg';
import iconDocx from '../../../assets/file-icons/docx.svg';
import iconXls from '../../../assets/file-icons/xls.svg';
import iconXlsm from '../../../assets/file-icons/xlsm.svg';
import iconCsv from '../../../assets/file-icons/csv.svg';
import iconPptx from '../../../assets/file-icons/pptx.svg';
import iconPdf from '../../../assets/file-icons/pdf.svg';
import iconTxt from '../../../assets/file-icons/txt.svg';
import iconHtml from '../../../assets/file-icons/html.svg';
import iconCode from '../../../assets/file-icons/code.svg';
import iconZip from '../../../assets/file-icons/zip.svg';
import iconAi from '../../../assets/file-icons/ai.svg';
import iconPsd from '../../../assets/file-icons/psd.svg';
import iconEps from '../../../assets/file-icons/eps.svg';
import iconFile from '../../../assets/file-icons/file.svg';

/**
 * Maps a file extension (lowercase, no dot) to its icon asset URL.
 * Returns the generic `file.svg` fallback for unrecognised extensions.
 */
const FILE_ICON_MAP: Record<string, string> = {
    /* Images */
    png: iconImage, jpg: iconImage, jpeg: iconImage, gif: iconImage,
    webp: iconImage, bmp: iconImage, tif: iconImage, tiff: iconImage,
    svg: iconImage, heic: iconImage,
    /* Video */
    mp4: iconVideo, mov: iconVideo, avi: iconVideo, mkv: iconVideo, webm: iconVideo,
    /* Audio */
    mp3: iconSound, wav: iconSound, ogg: iconSound, m4a: iconSound, flac: iconSound,
    /* Word */
    doc: iconDoc, docx: iconDocx,
    /* Spreadsheet */
    xls: iconXls, xlsx: iconXls, xlsm: iconXlsm, csv: iconCsv,
    /* Presentation */
    ppt: iconPptx, pptx: iconPptx,
    /* PDF */
    pdf: iconPdf,
    /* Text / Code */
    txt: iconTxt, md: iconTxt, rtf: iconTxt, log: iconTxt,
    html: iconHtml, htm: iconHtml,
    js: iconCode, ts: iconCode, jsx: iconCode, tsx: iconCode, json: iconCode,
    css: iconCode, scss: iconCode, py: iconCode, java: iconCode, cpp: iconCode,
    c: iconCode, rb: iconCode, php: iconCode, xml: iconCode, yaml: iconCode,
    yml: iconCode, sh: iconCode, sql: iconCode,
    /* Archives */
    zip: iconZip, rar: iconZip, '7z': iconZip, tar: iconZip, gz: iconZip,
    /* Design tools */
    ai: iconAi, psd: iconPsd, eps: iconEps,
};

/** Return the resolved asset URL for a given filename's file-type icon */
export function getFileIconSrc(filename: string): string {
    const ext = getExtension(filename);
    return FILE_ICON_MAP[ext] ?? iconFile;
}

/** Human-readable file-size string */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/** Relative human-readable timestamp */
export function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** CSS colour for a file extension badge */
export function extensionColor(ext: string): { bg: string; text: string } {
    const map: Record<string, { bg: string; text: string }> = {
        pdf: { bg: '#FEE2E2', text: '#991B1B' },
        doc: { bg: '#DBEAFE', text: '#1E3A8A' },
        docx: { bg: '#DBEAFE', text: '#1E3A8A' },
        xls: { bg: '#D1FAE5', text: '#065F46' },
        xlsx: { bg: '#D1FAE5', text: '#065F46' },
        ppt: { bg: '#FFEDD5', text: '#9A3412' },
        pptx: { bg: '#FFEDD5', text: '#9A3412' },
        png: { bg: '#E0E7FF', text: '#3730A3' },
        jpg: { bg: '#E0E7FF', text: '#3730A3' },
        jpeg: { bg: '#E0E7FF', text: '#3730A3' },
        gif: { bg: '#E0E7FF', text: '#3730A3' },
        svg: { bg: '#E0E7FF', text: '#3730A3' },
        mp4: { bg: '#FEF3C7', text: '#92400E' },
        zip: { bg: '#F3F4F6', text: '#374151' },
        rar: { bg: '#F3F4F6', text: '#374151' },
        csv: { bg: '#D1FAE5', text: '#065F46' },
        txt: { bg: '#F3F4F6', text: '#374151' },
    };
    return map[ext.toLowerCase()] ?? { bg: '#F3F4F6', text: '#374151' };
}

/** Get extension from filename */
export function getExtension(filename: string): string {
    const dot = filename.lastIndexOf('.');
    return dot === -1 ? '' : filename.slice(dot + 1).toLowerCase();
}

/** Whether a file type can be previewed in-browser */
export function isPreviewable(mime: string): boolean {
    return (
        mime.startsWith('image/') ||
        mime === 'application/pdf' ||
        mime.startsWith('video/') ||
        mime.startsWith('text/')
    );
}

/** Chunk size for large uploads (2 MB) */
export const CHUNK_SIZE = 2 * 1024 * 1024;

/** Max file size – 200 MB */
export const MAX_FILE_SIZE = 200 * 1024 * 1024;
