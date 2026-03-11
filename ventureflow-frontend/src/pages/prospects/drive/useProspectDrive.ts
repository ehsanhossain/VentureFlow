/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback, useMemo } from 'react';
import api from '../../../config/api';
import { CHUNK_SIZE } from './driveUtils';

/* ───── Types ───── */
export interface DriveFolder {
    id: string;
    name: string;
    parent_id: string | null;
    files_count: number;
    children_count: number;
    created_at: string;
    updated_at: string;
}

export interface DriveFile {
    id: string;
    folder_id: string | null;
    original_name: string;
    mime_type: string;
    size: number;
    uploaded_by_name: string;
    current_version: number;
    created_at: string;
    updated_at: string;
}

export interface DriveComment {
    id: string;
    content: string;
    user_name: string;
    created_at: string;
}

export interface DriveVersion {
    id: string;
    version_number: number;
    original_name: string;
    size: number;
    uploaded_by_name: string;
    created_at: string;
}

export interface DriveShareLink {
    id: string;
    share_token: string;
    has_password: boolean;
    expires_at: string | null;
    max_access_count: number | null;
    access_count: number;
    created_at: string;
    url?: string;
}

export interface UploadAggregate {
    totalFiles: number;
    completedFiles: number;
    errorFiles: number;
    uploadingFiles: number;
    overallPercent: number;
    status: 'idle' | 'uploading' | 'complete' | 'error';
    errors: string[];
}

export interface UploadProgress {
    fileName: string;
    percent: number;
    status: 'uploading' | 'complete' | 'error';
    error?: string;
}

/* ───── Hook ───── */

/** Normalize file objects from backend — flatten uploader relationship */
function normalizeFile(raw: any): DriveFile {
    return {
        ...raw,
        uploaded_by_name: raw.uploaded_by_name || raw.uploader?.name || '—',
    };
}
function normalizeFiles(rawFiles: any[]): DriveFile[] {
    return (rawFiles ?? []).map(normalizeFile);
}

export function useProspectDrive(type: 'investor' | 'target', prospectId: string) {
    const [folders, setFolders] = useState<DriveFolder[]>([]);
    const [files, setFiles] = useState<DriveFile[]>([]);
    const [breadcrumbs, setBreadcrumbs] = useState<{ id: string | null; name: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploads, setUploads] = useState<UploadProgress[]>([]);

    const prefix = `/api/drive/${type}/${prospectId}`;

    /* ── Aggregate progress for consolidated UI bar ── */
    const uploadAggregate = useMemo<UploadAggregate>(() => {
        if (uploads.length === 0) return { totalFiles: 0, completedFiles: 0, errorFiles: 0, uploadingFiles: 0, overallPercent: 0, status: 'idle', errors: [] };
        const completed = uploads.filter(u => u.status === 'complete').length;
        const errors = uploads.filter(u => u.status === 'error');
        const uploading = uploads.filter(u => u.status === 'uploading').length;
        const totalPercent = uploads.reduce((sum, u) => sum + u.percent, 0);
        const overall = Math.round(totalPercent / uploads.length);
        const status: UploadAggregate['status'] = uploading > 0 ? 'uploading' : errors.length > 0 ? 'error' : completed === uploads.length ? 'complete' : 'idle';
        return { totalFiles: uploads.length, completedFiles: completed, errorFiles: errors.length, uploadingFiles: uploading, overallPercent: overall, status, errors: errors.map(e => e.error || 'Upload failed') };
    }, [uploads]);

    /* ── Listing ── */
    const fetchRoot = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(`${prefix}`);
            setFolders(res.data.folders ?? []);
            setFiles(normalizeFiles(res.data.files));
            setBreadcrumbs([{ id: null, name: 'Root' }]);
        } catch (err) {
            console.error('Flowdrive fetchRoot error', err);
        } finally {
            setLoading(false);
        }
    }, [prefix]);

    const fetchFolder = useCallback(async (folderId: string) => {
        setLoading(true);
        try {
            const res = await api.get(`${prefix}/folder/${folderId}`);
            setFolders(res.data.subfolders ?? []);
            setFiles(normalizeFiles(res.data.files));
            // Prepend Root to breadcrumbs coming from backend
            const apiBreadcrumbs = res.data.breadcrumbs ?? [];
            setBreadcrumbs([{ id: null, name: 'Root' }, ...apiBreadcrumbs]);
        } catch (err) {
            console.error('Flowdrive fetchFolder error', err);
        } finally {
            setLoading(false);
        }
    }, [prefix]);

    /* ── Global search across all files/folders ── */
    const searchAll = useCallback(async (query: string): Promise<{ folders: DriveFolder[]; files: DriveFile[] }> => {
        if (!query.trim()) return { folders: [], files: [] };
        try {
            const res = await api.get(`${prefix}/search`, { params: { q: query.trim() } });
            return {
                folders: res.data.folders ?? [],
                files: normalizeFiles(res.data.files),
            };
        } catch (err) {
            console.error('Flowdrive search error', err);
            return { folders: [], files: [] };
        }
    }, [prefix]);

    /* ── Folder CRUD ── */
    const createFolder = useCallback(async (name: string, parentId: string | null) => {
        const res = await api.post(`${prefix}/folder`, { name, parent_id: parentId });
        return res.data;
    }, [prefix]);

    const renameFolder = useCallback(async (folderId: string, name: string) => {
        await api.put(`/api/drive/folder/${folderId}`, { name });
    }, []);

    const deleteFolder = useCallback(async (folderId: string) => {
        await api.delete(`/api/drive/folder/${folderId}`);
    }, []);

    /* ── File operations ── */
    const renameFile = useCallback(async (fileId: string, name: string) => {
        await api.put(`/api/drive/file/${fileId}`, { name });
    }, []);

    const deleteFile = useCallback(async (fileId: string) => {
        await api.delete(`/api/drive/file/${fileId}`);
    }, []);

    const downloadFile = useCallback(async (fileId: string, fileName?: string) => {
        try {
            const res = await api.get(`/api/drive/file/${fileId}/download`, { responseType: 'blob' });
            const blob = new Blob([res.data]);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            // Use Content-Disposition filename if available, otherwise fallback
            const disposition = res.headers['content-disposition'];
            let downloadName = fileName || 'download';
            if (disposition) {
                const match = disposition.match(/filename[^;=\n]*=(['"]?)([^'"\n;]*?)\1(;|$)/i);
                if (match?.[2]) downloadName = decodeURIComponent(match[2]);
            }
            a.download = downloadName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Flowdrive download error', err);
        }
    }, []);

    const fetchPreviewBlob = useCallback(async (fileId: string): Promise<string> => {
        const res = await api.get(`/api/drive/file/${fileId}/preview`, { responseType: 'blob' });
        const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/octet-stream' });
        return URL.createObjectURL(blob);
    }, []);

    /* ── Upload (standard for small files, chunked for large) ── */
    const uploadFiles = useCallback(async (fileList: File[], folderId: string | null) => {
        // Clear stale uploads from previous sessions
        const newUploads: UploadProgress[] = fileList.map(f => ({
            fileName: f.name,
            percent: 0,
            status: 'uploading' as const,
        }));
        setUploads(newUploads);

        for (let i = 0; i < fileList.length; i++) {
            const file = fileList[i];
            try {
                if (file.size <= CHUNK_SIZE) {
                    // Standard upload
                    const fd = new FormData();
                    fd.append('files[]', file);
                    if (folderId) fd.append('folder_id', folderId);
                    await api.post(`${prefix}/upload`, fd, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                        onUploadProgress: (ev) => {
                            const pct = ev.total ? Math.round((ev.loaded / ev.total) * 100) : 0;
                            setUploads(prev => prev.map(u => u.fileName === file.name ? { ...u, percent: pct } : u));
                        },
                    });
                } else {
                    // Chunked upload
                    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
                    const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

                    for (let c = 0; c < totalChunks; c++) {
                        const start = c * CHUNK_SIZE;
                        const end = Math.min(start + CHUNK_SIZE, file.size);
                        const chunk = file.slice(start, end);

                        const fd = new FormData();
                        fd.append('chunk', chunk);
                        fd.append('upload_id', uploadId);
                        fd.append('chunk_index', String(c));
                        fd.append('total_chunks', String(totalChunks));
                        fd.append('original_name', file.name);
                        if (folderId) fd.append('folder_id', folderId);

                        await api.post(`${prefix}/upload-chunk`, fd, {
                            headers: { 'Content-Type': 'multipart/form-data' },
                        });

                        const pct = Math.round(((c + 1) / totalChunks) * 95);
                        setUploads(prev => prev.map(u => u.fileName === file.name ? { ...u, percent: pct } : u));
                    }

                    // Complete chunked upload
                    await api.post(`${prefix}/upload-complete`, {
                        upload_id: uploadId,
                        original_name: file.name,
                        mime_type: file.type,
                        folder_id: folderId,
                        total_chunks: totalChunks,
                    });
                }

                setUploads(prev => prev.map(u => u.fileName === file.name ? { ...u, percent: 100, status: 'complete' } : u));
            } catch (err: any) {
                setUploads(prev =>
                    prev.map(u =>
                        u.fileName === file.name
                            ? { ...u, status: 'error', error: err?.response?.data?.message || 'Upload failed' }
                            : u
                    )
                );
            }
        }
    }, [prefix]);

    const clearUploads = useCallback(() => setUploads([]), []);

    /* ── Replace file (new version) ── */
    const replaceFile = useCallback(async (fileId: string, file: File) => {
        const fd = new FormData();
        fd.append('file', file);
        await api.post(`/api/drive/file/${fileId}/replace`, fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    }, []);

    /* ── Version history ── */
    const fetchVersions = useCallback(async (fileId: string): Promise<DriveVersion[]> => {
        const res = await api.get(`/api/drive/file/${fileId}/versions`);
        return res.data.versions ?? [];
    }, []);

    const downloadVersion = useCallback(async (fileId: string, versionId: string, fileName?: string) => {
        try {
            const res = await api.get(`/api/drive/file/${fileId}/versions/${versionId}/download`, { responseType: 'blob' });
            const blob = new Blob([res.data]);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const disposition = res.headers['content-disposition'];
            let downloadName = fileName || 'download';
            if (disposition) {
                const match = disposition.match(/filename[^;=\n]*=(['"]?)([^'"\n;]*?)\1(;|$)/i);
                if (match?.[2]) downloadName = decodeURIComponent(match[2]);
            }
            a.download = downloadName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Flowdrive version download error', err);
        }
    }, []);

    /* ── Comments ── */
    const fetchComments = useCallback(async (fileId: string): Promise<DriveComment[]> => {
        const res = await api.get(`/api/drive/file/${fileId}/comments`);
        return res.data.comments ?? [];
    }, []);

    const addComment = useCallback(async (fileId: string, body: string) => {
        await api.post(`/api/drive/file/${fileId}/comment`, { content: body });
    }, []);

    const deleteComment = useCallback(async (commentId: string) => {
        await api.delete(`/api/drive/comment/${commentId}`);
    }, []);

    /* ── Sharing ── */
    const createShare = useCallback(async (opts: {
        file_id?: string;
        folder_id?: string;
        password?: string;
        expires_at?: string;
        max_access_count?: number;
        allow_download?: boolean;
    }): Promise<DriveShareLink> => {
        const res = await api.post('/api/drive/share', opts);
        // Backend returns { share: { id, share_token, ... }, share_url: "..." }
        const share = res.data.share || res.data;
        return { ...share, url: res.data.share_url || '' };
    }, []);

    const revokeShare = useCallback(async (shareId: string) => {
        await api.delete(`/api/drive/share/${shareId}`);
    }, []);

    const listShares = useCallback(async (fileId: string): Promise<DriveShareLink[]> => {
        const res = await api.get(`/api/drive/file/${fileId}/shares`);
        // Backend returns shares array directly or under .shares key
        const shares = Array.isArray(res.data) ? res.data : (res.data.shares ?? []);
        return shares.map((s: any) => ({ ...s, url: s.share_url || `${window.location.origin}/shared/${s.share_token}` }));
    }, []);

    /* ── Bulk operations ── */
    const bulkDelete = useCallback(async (fileIds: string[], folderIds: string[]) => {
        const promises: Promise<void>[] = [];
        for (const fid of folderIds) {
            promises.push(api.delete(`/api/drive/folder/${fid}`));
        }
        for (const fid of fileIds) {
            promises.push(api.delete(`/api/drive/file/${fid}`));
        }
        await Promise.allSettled(promises);
    }, []);

    const bulkMove = useCallback(async (
        fileIds: string[], folderIds: string[], targetFolderId: string | null
    ) => {
        await api.post(`${prefix}/move`, {
            file_ids: fileIds,
            folder_ids: folderIds,
            target_folder_id: targetFolderId,
        });
    }, [prefix]);

    const fetchFolderTree = useCallback(async (): Promise<DriveFolder[]> => {
        const res = await api.get(`${prefix}/folder-tree`);
        return res.data.folders ?? [];
    }, [prefix]);

    const bulkDownload = useCallback(async (fileIds: string[]) => {
        try {
            const res = await api.post(`${prefix}/bulk-download`, { file_ids: fileIds }, { responseType: 'blob' });
            const blob = new Blob([res.data], { type: 'application/zip' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `flowdrive-${Date.now()}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Flowdrive bulk download error', err);
            throw err;
        }
    }, [prefix]);

    return {
        folders, files, breadcrumbs, loading, uploads, uploadAggregate,
        fetchRoot, fetchFolder, searchAll,
        createFolder, renameFolder, deleteFolder,
        renameFile, deleteFile, downloadFile, fetchPreviewBlob,
        uploadFiles, clearUploads,
        replaceFile, fetchVersions, downloadVersion,
        fetchComments, addComment, deleteComment,
        createShare, revokeShare, listShares,
        bulkDelete, bulkDownload, bulkMove, fetchFolderTree,
    };
}
