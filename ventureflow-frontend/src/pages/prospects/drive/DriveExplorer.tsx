/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Folder, FolderPlus, FolderInput, MoreVertical,
    Edit3, MessageSquare, History,
    Eye, X, Check, CheckSquare, Square, Plus,
} from 'lucide-react';
import cancelSelectionIcon from '../../../assets/icons/cloudflow/cancel-selection.svg';
import deleteIcon from '../../../assets/icons/cloudflow/delete.svg';
import downloadIcon from '../../../assets/icons/cloudflow/download.svg';
import gridViewIcon from '../../../assets/icons/cloudflow/grid-view.svg';
import listViewIcon from '../../../assets/icons/cloudflow/list-view.svg';
import shareIcon from '../../../assets/icons/cloudflow/share.svg';
import uploadIcon from '../../../assets/icons/cloudflow/upload.svg';
import emptyFolderImg from '../../../assets/icons/cloudflow/empty-folder-hq.png';
import BackButton from '../../../components/BackButton';
import { BrandSpinner } from '../../../components/BrandSpinner';
import { showAlert } from '../../../components/Alert';
import { useProspectDrive, DriveFile, DriveFolder } from './useProspectDrive';
import { formatFileSize, timeAgo, isPreviewable, getFileIconSrc } from './driveUtils';
import DriveUploadModal from './DriveUploadModal';
import DriveShareModal from './DriveShareModal';
import DriveCommentPanel from './DriveCommentPanel';
import DriveVersionHistory from './DriveVersionHistory';
import DriveFilePreview from './DriveFilePreview';
import DriveDeleteModal from './DriveDeleteModal';
import DriveMoveModal from './DriveMoveModal';
import { useMarqueeSelection } from './useMarqueeSelection';
import api from '../../../config/api';
import DataTableSearch from '../../../components/table/DataTableSearch';
import cloudflowIcon from '../../../assets/icons/cloudflow.svg';
import { useDriveBreadcrumbs } from '../../../context/DriveBreadcrumbContext';

type ViewMode = 'grid' | 'list';

const DriveExplorer: React.FC = () => {
    const { t } = useTranslation();
    const { type, id: prospectId } = useParams<{ type: string; id: string }>();
    const navigate = useNavigate();
    const driveType = (type === 'target' ? 'target' : 'investor') as 'investor' | 'target';

    const {
        folders, files, breadcrumbs, loading, uploadAggregate,
        fetchRoot, fetchFolder, searchAll,
        createFolder, renameFolder, deleteFolder,
        renameFile, deleteFile, downloadFile, fetchPreviewBlob,
        uploadFiles, clearUploads,
        replaceFile, bulkDelete, bulkDownload, bulkMove,
    } = useProspectDrive(driveType, prospectId || '');

    const { setDriveBreadcrumbs, setOnNavigateFolder, clearDriveBreadcrumbs, setProspectInfo } = useDriveBreadcrumbs();

    // Current folder
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [searchQuery, setSearchQuery] = useState('');

    // "+ New" dropdown
    const [newMenuOpen, setNewMenuOpen] = useState(false);
    const newMenuRef = useRef<HTMLDivElement>(null);

    // Modals & panels
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [shareTarget, setShareTarget] = useState<{ fileId?: string; folderId?: string } | null>(null);
    const [commentFileId, setCommentFileId] = useState<string | null>(null);
    const [versionFileId, setVersionFileId] = useState<string | null>(null);
    const [previewFile, setPreviewFile] = useState<DriveFile | null>(null);
    const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);

    /** Open file preview — fetches blob via authenticated API */
    const handleOpenPreview = async (file: DriveFile) => {
        setPreviewFile(file);
        setPreviewLoading(true);
        try {
            const blobUrl = await fetchPreviewBlob(file.id);
            setPreviewBlobUrl(blobUrl);
        } catch {
            setPreviewBlobUrl(null);
        } finally {
            setPreviewLoading(false);
        }
    };

    // Inline editing
    const [renamingItem, setRenamingItem] = useState<{ id: string; type: 'file' | 'folder'; name: string; ext?: string } | null>(null);
    const [newFolderMode, setNewFolderMode] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const renameInputRef = useRef<HTMLInputElement>(null);
    const newFolderInputRef = useRef<HTMLInputElement>(null);

    // Context menu
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: any; itemType: 'file' | 'folder' } | null>(null);

    // Multi-select
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
    const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set());

    // Delete modal
    const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string; type: 'file' | 'folder'; name: string; bulk?: number } | null>(null);

    // Move modal
    const [moveModalOpen, setMoveModalOpen] = useState(false);
    const [moveTarget, setMoveTarget] = useState<{ fileIds: string[]; folderIds: string[] } | null>(null);

    // Prospect info for header badge
    const [prospectCode, setProspectCode] = useState<string>('');

    // Global search state
    const [globalSearchFolders, setGlobalSearchFolders] = useState<DriveFolder[]>([]);
    const [globalSearchFiles, setGlobalSearchFiles] = useState<DriveFile[]>([]);
    const [isGlobalSearchActive, setIsGlobalSearchActive] = useState(false);
    const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Marquee (click-and-drag) selection
    const marqueeContainerRef = useRef<HTMLDivElement>(null);
    const { isSelecting, marqueeStyle, handleMouseDown: handleMarqueeMouseDown } = useMarqueeSelection({
        containerRef: marqueeContainerRef,
        onSelectionChange: (fileIds, folderIds) => {
            setSelectedFiles(fileIds);
            setSelectedFolders(folderIds);
        },
        enabled: viewMode === 'grid',
    });

    // Load drive contents
    useEffect(() => {
        if (prospectId) {
            if (currentFolderId) {
                fetchFolder(currentFolderId);
            } else {
                fetchRoot();
            }
        }
    }, [prospectId, currentFolderId, fetchRoot, fetchFolder]);

    // Fetch prospect project code for header
    useEffect(() => {
        if (!prospectId) return;
        const endpoint = driveType === 'target' ? `/api/seller/${prospectId}` : `/api/buyer/${prospectId}`;
        api.get(endpoint)
            .then(res => {
                const d = res.data?.data || res.data;
                const code = d?.project_code || d?.projectCode || '';
                setProspectCode(code || prospectId);
                // Publish prospect info to context for Header breadcrumbs
                setProspectInfo({ type: driveType, code: code || prospectId, id: prospectId });
            })
            .catch(() => {
                // If API fails, prospectId might BE the code (e.g., JP-B-435)
                // Use it directly so breadcrumbs still work
                const isLikelyCode = /[A-Za-z]/.test(prospectId);
                if (isLikelyCode) {
                    setProspectCode(prospectId);
                    setProspectInfo({ type: driveType, code: prospectId, id: prospectId });
                }
            });
    }, [prospectId, driveType, setProspectInfo]);

    // Focus rename input
    useEffect(() => {
        if (renamingItem && renameInputRef.current) renameInputRef.current.focus();
    }, [renamingItem]);

    useEffect(() => {
        if (newFolderMode && newFolderInputRef.current) newFolderInputRef.current.focus();
    }, [newFolderMode]);

    // Close context menu on click outside
    useEffect(() => {
        const handler = () => setContextMenu(null);
        if (contextMenu) document.addEventListener('click', handler);
        return () => document.removeEventListener('click', handler);
    }, [contextMenu]);

    // Close "+ New" dropdown on click outside
    useEffect(() => {
        if (!newMenuOpen) return;
        const handler = (e: MouseEvent) => {
            if (newMenuRef.current && !newMenuRef.current.contains(e.target as Node)) {
                setNewMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [newMenuOpen]);

    /* ── Publish breadcrumbs to global header context ── */
    useEffect(() => {
        setDriveBreadcrumbs(breadcrumbs);
    }, [breadcrumbs, setDriveBreadcrumbs]);

    /* ── Cleanup on unmount ── */
    useEffect(() => {
        return () => clearDriveBreadcrumbs();
    }, [clearDriveBreadcrumbs]);

    /* ── Navigation ── */
    const navigateToFolder = useCallback((folderId: string | null) => {
        setCurrentFolderId(folderId);
        setSearchQuery('');
        setSelectedFiles(new Set());
        setSelectedFolders(new Set());
    }, []);

    /* Register navigateToFolder so Header breadcrumbs are clickable */
    useEffect(() => {
        setOnNavigateFolder(navigateToFolder);
    }, [navigateToFolder, setOnNavigateFolder]);

    const goToParentFolder = useCallback(() => {
        // If we are inside a subfolder (breadcrumbs has Root + at least one folder),
        // navigate to the parent folder
        const nonRootCrumbs = breadcrumbs.filter(bc => bc.name !== 'Root');
        if (nonRootCrumbs.length > 0) {
            // Go to the parent: second-to-last breadcrumb
            if (breadcrumbs.length >= 2) {
                navigateToFolder(breadcrumbs[breadcrumbs.length - 2].id);
            } else {
                // Only Root exists, navigate to root
                navigateToFolder(null);
            }
        } else {
            // At drive root — go back to investor/target page
            navigate(type === 'target' ? `/prospects/target/${prospectId}` : `/prospects/investor/${prospectId}`);
        }
    }, [breadcrumbs, navigateToFolder, navigate, type, prospectId]);

    /* ── Selection helpers ── */
    const totalSelected = selectedFiles.size + selectedFolders.size;

    const toggleFileSelect = useCallback((id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setSelectedFiles(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }, []);

    const toggleFolderSelect = useCallback((id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setSelectedFolders(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }, []);

    /* ── Display items — global search results vs local folder ── */
    const displayFolders = isGlobalSearchActive ? globalSearchFolders : folders;
    const displayFiles = isGlobalSearchActive ? globalSearchFiles : files;

    const selectAll = useCallback(() => {
        setSelectedFiles(new Set(displayFiles.map(f => f.id)));
        setSelectedFolders(new Set(displayFolders.map(f => f.id)));
    }, [displayFiles, displayFolders]);

    const clearSelection = useCallback(() => {
        setSelectedFiles(new Set());
        setSelectedFolders(new Set());
    }, []);

    /* ── Bulk actions ── */
    const handleBulkDelete = () => {
        setDeleteModal({ open: true, id: '', type: 'file', name: '', bulk: totalSelected });
    };

    const confirmBulkDelete = async () => {
        try {
            await bulkDelete(Array.from(selectedFiles), Array.from(selectedFolders));
            showAlert({ type: 'success', message: t('flowdrive.alerts.deletedSuccess') });
            clearSelection();
            currentFolderId ? fetchFolder(currentFolderId) : fetchRoot();
        } catch (err: any) {
            showAlert({ type: 'error', message: err?.response?.data?.message || t('flowdrive.alerts.deleteFailed') });
        }
        setDeleteModal(null);
    };

    const handleBulkDownload = async () => {
        try {
            await bulkDownload(Array.from(selectedFiles));
            clearSelection();
        } catch (err: any) {
            showAlert({ type: 'error', message: err?.response?.data?.message || t('flowdrive.alerts.downloadFailed', 'Download failed') });
        }
    };

    const handleMoveOpen = (fileIds: string[], folderIds: string[]) => {
        setMoveTarget({ fileIds, folderIds });
        setMoveModalOpen(true);
    };

    const handleMoveConfirm = async (targetFolderId: string | null) => {
        if (!moveTarget) return;
        try {
            await bulkMove(moveTarget.fileIds, moveTarget.folderIds, targetFolderId);
            showAlert({ type: 'success', message: t('flowdrive.alerts.movedSuccess', 'Moved successfully') });
            clearSelection();
            currentFolderId ? fetchFolder(currentFolderId) : fetchRoot();
        } catch (err: any) {
            showAlert({ type: 'error', message: err?.response?.data?.message || t('flowdrive.alerts.moveFailed', 'Move failed') });
        }
        setMoveModalOpen(false);
        setMoveTarget(null);
    };

    /* ── Debounced global search ── */
    useEffect(() => {
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

        const query = searchQuery.trim();
        if (!query) {
            setIsGlobalSearchActive(false);
            setGlobalSearchFolders([]);
            setGlobalSearchFiles([]);
            return;
        }

        searchDebounceRef.current = setTimeout(async () => {
            const results = await searchAll(query);
            setGlobalSearchFolders(results.folders);
            setGlobalSearchFiles(results.files);
            setIsGlobalSearchActive(true);
        }, 300);

        return () => {
            if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        };
    }, [searchQuery, searchAll]);

    /* ── Folder creation ── */
    const handleCreateFolder = async () => {
        const name = newFolderName.trim();
        if (!name) { setNewFolderMode(false); return; }
        try {
            await createFolder(name, currentFolderId);
            showAlert({ type: 'success', message: t('flowdrive.alerts.folderCreated') });
            setNewFolderMode(false);
            setNewFolderName('');
            currentFolderId ? fetchFolder(currentFolderId) : fetchRoot();
        } catch (err: any) {
            showAlert({ type: 'error', message: err?.response?.data?.message || t('flowdrive.alerts.folderCreateFailed') });
        }
    };

    /* ── Rename (optimistic — closes instantly) ── */
    const handleRename = async () => {
        if (!renamingItem) return;
        let name = renamingItem.name.trim();
        if (!name) { setRenamingItem(null); return; }

        // For files, always re-append the original extension
        if (renamingItem.type === 'file' && renamingItem.ext) {
            // Strip any extension the user might have typed
            const dotIdx = name.lastIndexOf('.');
            if (dotIdx > 0) name = name.substring(0, dotIdx);
            name = name + '.' + renamingItem.ext;
        }

        // Close the input immediately for instant feedback
        const item = { ...renamingItem };
        setRenamingItem(null);

        try {
            if (item.type === 'folder') {
                await renameFolder(item.id, name);
            } else {
                await renameFile(item.id, name);
            }
            showAlert({ type: 'success', message: t('flowdrive.alerts.renamedSuccess') });
            currentFolderId ? fetchFolder(currentFolderId) : fetchRoot();
        } catch (err: any) {
            showAlert({ type: 'error', message: err?.response?.data?.message || t('flowdrive.alerts.renameFailed') });
            // Revert on failure
            currentFolderId ? fetchFolder(currentFolderId) : fetchRoot();
        }
    };

    /* ── Delete (single item — opens modal) ── */
    const handleDelete = (itemId: string, itemType: 'file' | 'folder', itemName?: string) => {
        const name = itemName || (itemType === 'folder' ? 'Folder' : 'File');
        setDeleteModal({ open: true, id: itemId, type: itemType, name });
    };

    const confirmSingleDelete = async () => {
        if (!deleteModal) return;
        try {
            if (deleteModal.type === 'folder') {
                await deleteFolder(deleteModal.id);
            } else {
                await deleteFile(deleteModal.id);
            }
            showAlert({ type: 'success', message: t('flowdrive.alerts.deletedSuccess') });
            currentFolderId ? fetchFolder(currentFolderId) : fetchRoot();
        } catch (err: any) {
            showAlert({ type: 'error', message: err?.response?.data?.message || t('flowdrive.alerts.deleteFailed') });
        }
        setDeleteModal(null);
    };

    /* ── Upload ── */
    const handleUpload = async (fileList: File[]) => {
        await uploadFiles(fileList, currentFolderId);
        // Refresh after all done
        setTimeout(() => {
            currentFolderId ? fetchFolder(currentFolderId) : fetchRoot();
        }, 500);
    };

    /* ── Replace file (version) ── */
    const handleReplaceFile = async (fileId: string) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;
            try {
                await replaceFile(fileId, file);
                showAlert({ type: 'success', message: t('flowdrive.alerts.newVersionUploaded') });
                currentFolderId ? fetchFolder(currentFolderId) : fetchRoot();
            } catch (err: any) {
                showAlert({ type: 'error', message: err?.response?.data?.message || t('flowdrive.alerts.replaceFailed') });
            }
        };
        input.click();
    };


    /* ── Context menu actions ── */
    const renderContextMenu = () => {
        if (!contextMenu) return null;
        const { x, y, item, itemType } = contextMenu;
        return (
            <>
                <div className="fixed inset-0 z-[90]" onClick={() => setContextMenu(null)} />
                <div
                    className="fixed z-[100] w-40 p-2 bg-white rounded-[3px] border border-[#E5E7EB] overflow-hidden backdrop-blur-[2px] flex flex-col items-start animate-in fade-in zoom-in-95 duration-150"
                    style={{
                        top: Math.min(y, window.innerHeight - 320),
                        left: Math.min(x, window.innerWidth - 180),
                        boxShadow: '0px 1px 4px rgba(0,0,0,0.06), 0px 2px 8px rgba(0,0,0,0.04)'
                    }}
                >
                    <div className="w-full flex flex-col gap-1.5">
                        {/* Preview */}
                        {itemType === 'file' && isPreviewable(item.mime_type) && (
                            <button onClick={() => { handleOpenPreview(item); setContextMenu(null); }}
                                className="w-full text-left px-1.5 py-1 flex items-center gap-2 hover:bg-gray-50 rounded-[3px] transition-colors">
                                <Eye className="w-[18px] h-[18px] shrink-0 text-gray-500" />
                                <span className="flex-1 text-left text-xs font-normal text-black leading-[18px] tracking-[-0.24px] truncate">{t('flowdrive.contextMenu.preview')}</span>
                            </button>
                        )}
                        {/* Download */}
                        {itemType === 'file' && (
                            <button onClick={() => { downloadFile(item.id, item.original_name); setContextMenu(null); }}
                                className="w-full text-left px-1.5 py-1 flex items-center gap-2 hover:bg-gray-50 rounded-[3px] transition-colors">
                                <img src={downloadIcon} alt="" className="w-[18px] h-[18px] shrink-0" />
                                <span className="flex-1 text-left text-xs font-normal text-black leading-[18px] tracking-[-0.24px] truncate">{t('flowdrive.contextMenu.download')}</span>
                            </button>
                        )}
                        {/* Rename */}
                        <button onClick={() => {
                            if (itemType === 'file') {
                                const fullName = item.original_name || '';
                                const dotIdx = fullName.lastIndexOf('.');
                                const baseName = dotIdx > 0 ? fullName.substring(0, dotIdx) : fullName;
                                const ext = dotIdx > 0 ? fullName.substring(dotIdx + 1) : '';
                                setRenamingItem({ id: item.id, type: itemType, name: baseName, ext });
                            } else {
                                setRenamingItem({ id: item.id, type: itemType, name: item.name });
                            }
                            setContextMenu(null);
                        }}
                            className="w-full text-left px-1.5 py-1 flex items-center gap-2 hover:bg-gray-50 rounded-[3px] transition-colors">
                            <Edit3 className="w-[18px] h-[18px] shrink-0 text-gray-500" />
                            <span className="flex-1 text-left text-xs font-normal text-black leading-[18px] tracking-[-0.24px] truncate">{t('flowdrive.contextMenu.rename')}</span>
                        </button>
                        {/* File-only actions */}
                        {itemType === 'file' && (
                            <>
                                <button onClick={() => { handleReplaceFile(item.id); setContextMenu(null); }}
                                    className="w-full text-left px-1.5 py-1 flex items-center gap-2 hover:bg-gray-50 rounded-[3px] transition-colors">
                                    <History className="w-[18px] h-[18px] shrink-0 text-gray-500" />
                                    <span className="flex-1 text-left text-xs font-normal text-black leading-[18px] tracking-[-0.24px] truncate">{t('flowdrive.contextMenu.uploadNewVersion')}</span>
                                </button>
                                <button onClick={() => { setVersionFileId(item.id); setContextMenu(null); }}
                                    className="w-full text-left px-1.5 py-1 flex items-center gap-2 hover:bg-gray-50 rounded-[3px] transition-colors">
                                    <History className="w-[18px] h-[18px] shrink-0 text-gray-500" />
                                    <span className="flex-1 text-left text-xs font-normal text-black leading-[18px] tracking-[-0.24px] truncate">{t('flowdrive.contextMenu.versionHistory')}</span>
                                </button>
                                <button onClick={() => { setCommentFileId(item.id); setContextMenu(null); }}
                                    className="w-full text-left px-1.5 py-1 flex items-center gap-2 hover:bg-gray-50 rounded-[3px] transition-colors">
                                    <MessageSquare className="w-[18px] h-[18px] shrink-0 text-gray-500" />
                                    <span className="flex-1 text-left text-xs font-normal text-black leading-[18px] tracking-[-0.24px] truncate">{t('flowdrive.contextMenu.comments')}</span>
                                </button>
                            </>
                        )}
                        {/* Share */}
                        <button onClick={() => {
                            setShareTarget(itemType === 'file' ? { fileId: item.id } : { folderId: item.id });
                            setShareModalOpen(true);
                            setContextMenu(null);
                        }}
                            className="w-full text-left px-1.5 py-1 flex items-center gap-2 hover:bg-gray-50 rounded-[3px] transition-colors">
                            <img src={shareIcon} alt="" className="w-[18px] h-[18px] shrink-0" />
                            <span className="flex-1 text-left text-xs font-normal text-black leading-[18px] tracking-[-0.24px] truncate">{t('flowdrive.contextMenu.share')}</span>
                        </button>
                        {/* Move to */}
                        <button onClick={() => {
                            const fIds = itemType === 'file' ? [item.id] : [];
                            const dIds = itemType === 'folder' ? [item.id] : [];
                            handleMoveOpen(fIds, dIds);
                            setContextMenu(null);
                        }}
                            className="w-full text-left px-1.5 py-1 flex items-center gap-2 hover:bg-gray-50 rounded-[3px] transition-colors">
                            <FolderInput className="w-[18px] h-[18px] shrink-0 text-gray-500" />
                            <span className="flex-1 text-left text-xs font-normal text-black leading-[18px] tracking-[-0.24px] truncate">{t('flowdrive.contextMenu.moveTo', 'Move to')}</span>
                        </button>
                        {/* Separator */}
                        <div className="w-full h-0 border-t border-[#E5E7EB] my-0.5" />
                        {/* Delete */}
                        <button onClick={() => { handleDelete(item.id, itemType, itemType === 'file' ? item.original_name : item.name); setContextMenu(null); }}
                            className="w-full text-left px-1.5 py-1 flex items-center gap-2 hover:bg-red-50 rounded-[3px] transition-colors">
                            <img src={deleteIcon} alt="" className="w-[18px] h-[18px] shrink-0" />
                            <span className="flex-1 text-left text-xs font-normal text-[#940F24] leading-[18px] tracking-[-0.24px] truncate">{t('flowdrive.contextMenu.delete')}</span>
                        </button>
                    </div>
                </div>
            </>
        );
    };

    /* ── Loading state ── */
    if (loading && folders.length === 0 && files.length === 0) {
        return (
            <div className="flex items-center justify-center h-screen">
                <BrandSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50 overflow-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>
            {/* Single Navbar */}
            <div className="flex items-center justify-between px-4 md:px-6 py-3 bg-white border-b gap-3">
                {/* Left: Back + Icon + Title + Breadcrumbs */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <BackButton onClick={goToParentFolder} label={t('flowdrive.back')} />

                    <img src={cloudflowIcon} alt="" className="w-6 h-6 shrink-0" />
                    <h1 className="text-base font-semibold text-gray-900 shrink-0">CloudFlow</h1>

                    {prospectCode && (
                        <button
                            onClick={() => navigate(`/prospects/${driveType}/${prospectId}`)}
                            className="text-[13px] font-medium text-[#064771] bg-[#EDF8FF] px-2.5 py-1 rounded-[3px] tracking-tight shrink-0 hover:bg-[#DCF0FF] transition-colors cursor-pointer"
                            title={t('flowdrive.viewProfile', 'View profile')}
                        >
                            {prospectCode}
                        </button>
                    )}

                    {/* Breadcrumbs are now displayed in the global Header via DriveBreadcrumbContext */}
                </div>

                {/* Right: Search + View toggle + New */}
                <div className="flex items-center gap-3 shrink-0">
                    <DataTableSearch
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder={t('flowdrive.searchFiles')}
                        className="w-56"
                    />

                    {/* View toggle — when grid active show list icon (to switch), vice versa */}
                    <button
                        onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                        className="p-2 bg-white border border-gray-200 rounded-[3px] hover:bg-gray-50 transition-colors"
                        title={viewMode === 'grid' ? t('flowdrive.listView') : t('flowdrive.gridView')}
                    >
                        <img src={viewMode === 'grid' ? listViewIcon : gridViewIcon} alt="" className="w-6 h-6" />
                    </button>

                    {/* + New dropdown */}
                    <div className="relative" ref={newMenuRef}>
                        <button
                            onClick={() => setNewMenuOpen(v => !v)}
                            className="flex items-center gap-1.5 bg-[#064771] text-white px-4 py-2 rounded-[3px] text-sm font-medium transition-all hover:bg-[#053a5c] active:scale-95"
                        >
                            <Plus className="w-4 h-4" /> New
                        </button>
                        {newMenuOpen && (
                            <div className="absolute right-0 top-full mt-1.5 w-44 bg-white rounded-[3px] border border-gray-200 py-1.5 z-[100] shadow-lg animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                                <button
                                    onClick={() => { setNewFolderMode(true); setNewFolderName(''); setNewMenuOpen(false); }}
                                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors"
                                >
                                    <FolderPlus className="w-5 h-5 text-[#064771]" /> {t('flowdrive.newFolder')}
                                </button>
                                <button
                                    onClick={() => { setUploadModalOpen(true); setNewMenuOpen(false); }}
                                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors"
                                >
                                    <img src={uploadIcon} alt="" className="w-5 h-5" /> {t('flowdrive.upload')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Global search indicator */}
            {isGlobalSearchActive && (
                <div className="flex items-center justify-between px-4 md:px-6 pt-3">
                    <span className="text-sm text-gray-500">
                        {t('flowdrive.searchResultsFor', { query: searchQuery })} — {displayFolders.length + displayFiles.length} {t('flowdrive.items')}
                    </span>
                    <button
                        onClick={() => { setSearchQuery(''); }}
                        className="text-sm text-[#064771] hover:underline font-medium"
                    >
                        {t('flowdrive.clearSearch', 'Clear search')}
                    </button>
                </div>
            )}

            {/* Consolidated upload progress bar */}
            {uploadAggregate.totalFiles > 0 && (
                <div className="border-b border-gray-100 bg-gray-50 px-5 py-2">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-gray-600">
                            {uploadAggregate.status === 'uploading'
                                ? t('flowdrive.uploadModal.uploadingOf', { done: uploadAggregate.completedFiles, total: uploadAggregate.totalFiles })
                                : uploadAggregate.status === 'complete'
                                    ? t('flowdrive.uploadModal.allUploaded', { count: uploadAggregate.totalFiles })
                                    : uploadAggregate.status === 'error'
                                        ? t('flowdrive.uploadModal.uploadErrors', { errors: uploadAggregate.errorFiles, total: uploadAggregate.totalFiles })
                                        : ''
                            }
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">{uploadAggregate.overallPercent}%</span>
                            {uploadAggregate.status !== 'uploading' && (
                                <button onClick={clearUploads} className="text-xs text-gray-400 hover:text-gray-600">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-300 ${uploadAggregate.status === 'error' ? 'bg-red-500' : uploadAggregate.status === 'complete' ? 'bg-green-500' : 'bg-[#064771]'}`}
                            style={{ width: `${uploadAggregate.overallPercent}%` }}
                        />
                    </div>
                    {uploadAggregate.status === 'complete' && (
                        <div className="flex items-center gap-1 mt-1">
                            <Check className="w-3.5 h-3.5 text-green-500" />
                            <span className="text-xs text-green-600">{t('flowdrive.uploadModal.uploadComplete')}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Main Content Area — matches Prospects padding/layout */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <div ref={marqueeContainerRef} onMouseDown={handleMarqueeMouseDown} className="flex-1 flex flex-col overflow-auto scrollbar-premium relative">
                    {/* Floating bulk action bar */}
                    {totalSelected > 0 && (
                        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-2.5 bg-[#f1f5f9] border border-gray-300 rounded-[3px] shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <button onClick={clearSelection} className="p-0.5 hover:bg-white/60 rounded-[3px] transition-colors" title="Cancel selection">
                                <img src={cancelSelectionIcon} alt="Cancel" className="w-6 h-6" />
                            </button>
                            <span className="text-sm font-medium text-gray-700">{t('flowdrive.bulkBar.selected', '{{count}} selected', { count: totalSelected })}</span>
                            {selectedFiles.size > 0 && (
                                <button onClick={handleBulkDownload} className="p-1.5 hover:bg-white/60 rounded-[3px] transition-colors" title={t('flowdrive.bulkBar.download', 'Download')}>
                                    <img src={downloadIcon} alt="Download" className="w-6 h-6" />
                                </button>
                            )}
                            <button onClick={handleBulkDelete} className="p-1.5 hover:bg-white/60 rounded-[3px] transition-colors" title={t('flowdrive.bulkBar.delete', 'Delete')}>
                                <img src={deleteIcon} alt="Delete" className="w-6 h-6" />
                            </button>
                            <button onClick={() => handleMoveOpen(Array.from(selectedFiles), Array.from(selectedFolders))}
                                className="p-1.5 hover:bg-white/60 rounded-[3px] transition-colors" title={t('flowdrive.bulkBar.move', 'Move')}>
                                <FolderInput className="w-6 h-6 text-gray-500" />
                            </button>
                            <button onClick={() => {
                                const allFiles = Array.from(selectedFiles);
                                const allFolders = Array.from(selectedFolders);
                                if (allFiles.length > 0) {
                                    setShareTarget({ fileId: allFiles[0] });
                                } else if (allFolders.length > 0) {
                                    setShareTarget({ folderId: allFolders[0] });
                                }
                                setShareModalOpen(true);
                            }} className="p-1.5 hover:bg-white/60 rounded-[3px] transition-colors" title={t('flowdrive.contextMenu.share', 'Share')}>
                                <img src={shareIcon} alt="Share" className="w-6 h-6" />
                            </button>
                            <button className="p-1.5 hover:bg-white/60 rounded-[3px] transition-colors" title="More options">
                                <MoreVertical className="w-6 h-6 text-gray-500" />
                            </button>
                        </div>
                    )}

                    {/* Content area with padding */}
                    <div className="flex-1 flex flex-col p-4 md:p-6">
                        {/* New folder inline form */}
                        {newFolderMode && (
                            <div className="flex items-center gap-2 mb-4 bg-blue-50 border border-blue-100 rounded-[3px] p-2.5 max-w-sm">
                                <FolderPlus className="w-5 h-5 text-[#064771]" />
                                <input
                                    ref={newFolderInputRef}
                                    type="text"
                                    value={newFolderName}
                                    onChange={e => setNewFolderName(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') handleCreateFolder(); if (e.key === 'Escape') setNewFolderMode(false); }}
                                    placeholder={t('flowdrive.folderName')}
                                    className="flex-1 h-8 px-2 bg-white border border-gray-200 rounded-[3px] text-sm focus:outline-none focus:ring-1 focus:ring-[#064771]"
                                />
                                <button onClick={handleCreateFolder} className="px-2.5 py-1 bg-[#064771] text-white rounded-[3px] text-xs font-medium hover:bg-[#053a5c]">{t('flowdrive.create')}</button>
                                <button onClick={() => setNewFolderMode(false)} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                            </div>
                        )}

                        {/* Empty state */}
                        {displayFolders.length === 0 && displayFiles.length === 0 && !loading && (
                            <div className="flex flex-col items-center justify-center flex-1 min-h-[60vh] text-center">
                                <img src={emptyFolderImg} alt="Empty folder" className="w-36 h-auto mb-2" draggable={false} />
                                <h3 className="text-lg font-medium text-gray-700 mb-1">
                                    {searchQuery ? t('flowdrive.noResultsFound') : t('flowdrive.driveIsEmpty')}
                                </h3>
                                <p className="text-sm text-gray-400 mb-4">
                                    {searchQuery ? t('flowdrive.tryDifferentSearch') : t('flowdrive.getStarted')}
                                </p>
                                {!searchQuery && (
                                    <button
                                        onClick={() => setUploadModalOpen(true)}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-[#064771] text-white rounded-[3px] text-sm font-medium hover:bg-[#053a5c] transition-colors"
                                    >
                                        <img src={uploadIcon} alt="" className="w-5 h-5 brightness-0 invert" /> {t('flowdrive.uploadFiles')}
                                    </button>
                                )}
                            </div>
                        )}

                        {/* ── GRID VIEW ── */}
                        {viewMode === 'grid' && (displayFolders.length > 0 || displayFiles.length > 0) && (
                            <>
                                {/* Folders */}
                                {displayFolders.length > 0 && (
                                    <div className="mb-6">
                                        <div className="mb-4 space-y-2">
                                            <h3 className="text-sm font-medium text-gray-500">{t('flowdrive.folders')}</h3>
                                            <div className="h-px bg-[#E5E7EB]" />
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                                            {displayFolders.map(folder => (
                                                <div
                                                    key={folder.id}
                                                    data-drive-item={folder.id}
                                                    data-drive-item-type="folder"
                                                    className={`group relative bg-white rounded-[3px] p-3 hover:shadow-sm transition-all cursor-pointer ${selectedFolders.has(folder.id) ? 'border-[3px] border-[#064771]' : 'border border-gray-200 hover:border-[#064771]/30'}`}
                                                    onClick={() => toggleFolderSelect(folder.id)}
                                                    onDoubleClick={() => navigateToFolder(folder.id)}
                                                    onContextMenu={e => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, item: folder, itemType: 'folder' }); }}
                                                >
                                                    <div className="flex items-center gap-2.5 mb-1.5 min-w-0">
                                                        <Folder className="w-8 h-8 text-[#064771] fill-[#064771]/10 shrink-0" />
                                                        {renamingItem?.id === folder.id ? (
                                                            <input
                                                                ref={renameInputRef}
                                                                value={renamingItem.name}
                                                                onChange={e => setRenamingItem({ ...renamingItem, name: e.target.value })}
                                                                onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setRenamingItem(null); }}
                                                                onBlur={handleRename}
                                                                onClick={e => e.stopPropagation()}
                                                                className="flex-1 text-sm font-medium text-gray-800 border border-[#064771] rounded-[3px] px-1.5 py-0.5 focus:outline-none max-w-full min-w-0"
                                                            />
                                                        ) : (
                                                            <span className="text-sm font-medium text-gray-800 truncate">{folder.name}</span>
                                                        )}
                                                    </div>
                                                    <span className="text-[11px] text-gray-400">{(folder.files_count || 0) + (folder.children_count || 0)} items</span>
                                                    <button
                                                        onClick={e => { e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, item: folder, itemType: 'folder' }); }}
                                                        className="absolute top-2 right-2 p-1 rounded-[3px] opacity-0 group-hover:opacity-100 hover:bg-gray-100 transition-all"
                                                        aria-label="Folder actions"
                                                    >
                                                        <MoreVertical className="w-4 h-4 text-gray-400" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Files */}
                                {displayFiles.length > 0 && (
                                    <div>
                                        <div className="mb-4 space-y-2">
                                            <h3 className="text-sm font-medium text-gray-500">{t('flowdrive.files')}</h3>
                                            <div className="h-px bg-[#E5E7EB]" />
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                                            {displayFiles.map(file => {
                                                return (
                                                    <div
                                                        key={file.id}
                                                        data-drive-item={file.id}
                                                        data-drive-item-type="file"
                                                        className={`group relative bg-white rounded-[3px] p-3 hover:shadow-sm transition-all cursor-pointer ${selectedFiles.has(file.id) ? 'border-[3px] border-[#064771]' : 'border border-gray-200 hover:border-[#064771]/30'}`}
                                                        onClick={() => toggleFileSelect(file.id)}
                                                        onDoubleClick={() => isPreviewable(file.mime_type) ? handleOpenPreview(file) : downloadFile(file.id, file.original_name)}
                                                        onContextMenu={e => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, item: file, itemType: 'file' }); }}
                                                    >
                                                        <div className="flex items-center gap-2.5 mb-1.5 min-w-0">
                                                            <img src={getFileIconSrc(file.original_name)} alt="" className="w-8 h-8 shrink-0" draggable={false} />
                                                            {renamingItem?.id === file.id ? (
                                                                <span className="flex items-center gap-0 min-w-0">
                                                                    <input
                                                                        ref={renameInputRef}
                                                                        value={renamingItem.name}
                                                                        onChange={e => setRenamingItem({ ...renamingItem, name: e.target.value })}
                                                                        onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setRenamingItem(null); }}
                                                                        onBlur={handleRename}
                                                                        onClick={e => e.stopPropagation()}
                                                                        className="flex-1 text-sm font-medium text-gray-800 border border-[#064771] rounded-[3px] px-1.5 py-0.5 focus:outline-none max-w-full min-w-0"
                                                                    />
                                                                    {renamingItem.ext && <span className="text-sm text-gray-400 shrink-0">.{renamingItem.ext}</span>}
                                                                </span>
                                                            ) : (
                                                                <span className="text-sm font-medium text-gray-800 truncate" title={file.original_name}>{file.original_name}</span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[11px] text-gray-400">{formatFileSize(file.size)}</span>
                                                            <span className="text-[11px] text-gray-400">{timeAgo(file.updated_at)}</span>
                                                        </div>
                                                        <button
                                                            onClick={e => { e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, item: file, itemType: 'file' }); }}
                                                            className="absolute top-2 right-2 p-1 rounded-[3px] opacity-0 group-hover:opacity-100 hover:bg-gray-100 transition-all"
                                                            aria-label="File actions"
                                                        >
                                                            <MoreVertical className="w-4 h-4 text-gray-400" />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {/* ── LIST VIEW ── (matches Prospects DataTable styling, no drag handles) */}
                        {viewMode === 'list' && (displayFolders.length > 0 || displayFiles.length > 0) && (
                            <div className="w-full bg-white rounded-[3px] overflow-hidden border border-gray-200">
                                <div className="overflow-auto scrollbar-premium">
                                    <table className="w-full table-fixed border-collapse">
                                        <thead className="sticky top-0 z-30 bg-[#f1f5f9] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                                            <tr className="h-12">
                                                <th className="px-2 py-2 border-b border-[#cbd5e1] bg-[#f1f5f9] text-center" style={{ width: 40 }}>
                                                    <button onClick={() => totalSelected === displayFiles.length + displayFolders.length ? clearSelection() : selectAll()} className="p-0.5" aria-label="Select all">
                                                        {totalSelected === displayFiles.length + displayFolders.length && totalSelected > 0 ? <CheckSquare className="w-4 h-4 text-[#064771]" /> : <Square className="w-4 h-4 text-gray-400" />}
                                                    </button>
                                                </th>
                                                <th className="px-4 py-2 text-left border-b border-[#cbd5e1] bg-[#f1f5f9]" style={{ width: '42%' }}>
                                                    <span className="text-[11px] font-medium text-gray-600 uppercase tracking-wide">{t('flowdrive.name')}</span>
                                                </th>
                                                <th className="px-4 py-2 text-left border-b border-[#cbd5e1] bg-[#f1f5f9]" style={{ width: '15%' }}>
                                                    <span className="text-[11px] font-medium text-gray-600 uppercase tracking-wide">{t('flowdrive.size')}</span>
                                                </th>
                                                <th className="px-4 py-2 text-left border-b border-[#cbd5e1] bg-[#f1f5f9]" style={{ width: '18%' }}>
                                                    <span className="text-[11px] font-medium text-gray-600 uppercase tracking-wide">{t('flowdrive.modified')}</span>
                                                </th>
                                                <th className="px-4 py-2 text-left border-b border-[#cbd5e1] bg-[#f1f5f9]" style={{ width: '18%' }}>
                                                    <span className="text-[11px] font-medium text-gray-600 uppercase tracking-wide">{t('flowdrive.uploadedBy')}</span>
                                                </th>
                                                <th className="sticky right-0 bg-[#f1f5f9] z-30 border-b border-[#cbd5e1] shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.15)]" style={{ width: 60 }}>
                                                    <div className="flex items-center justify-end px-4 h-full min-h-[48px]" />
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {displayFolders.map(folder => (
                                                <tr
                                                    key={folder.id}
                                                    className={`group h-14 transition-colors duration-150 cursor-pointer border-b border-[#f1f5f9] ${selectedFolders.has(folder.id) ? 'bg-[#EDF8FF]' : 'hover:bg-[#f8fafc]'}`}
                                                    onClick={() => toggleFolderSelect(folder.id)}
                                                    onDoubleClick={() => navigateToFolder(folder.id)}
                                                    onContextMenu={e => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, item: folder, itemType: 'folder' }); }}
                                                >
                                                    <td className="px-2 py-3 border-b border-[#f1f5f9] align-middle text-center" style={{ width: 40 }} onClick={e => e.stopPropagation()}>
                                                        <button onClick={(e) => toggleFolderSelect(folder.id, e)} className="p-0.5" aria-label="Select folder">
                                                            {selectedFolders.has(folder.id) ? <CheckSquare className="w-4 h-4 text-[#064771]" /> : <Square className="w-4 h-4 text-gray-400" />}
                                                        </button>
                                                    </td>
                                                    <td className="px-4 py-3 text-[13.5px] text-gray-600 border-b border-[#f1f5f9] align-middle overflow-hidden whitespace-nowrap text-ellipsis">
                                                        <div className="w-full h-full flex items-center overflow-hidden whitespace-nowrap text-ellipsis">
                                                            <div className="flex items-center gap-2.5">
                                                                <Folder className="w-5 h-5 text-[#064771] fill-[#064771]/10 shrink-0" />
                                                                {renamingItem?.id === folder.id ? (
                                                                    <input
                                                                        ref={renameInputRef}
                                                                        value={renamingItem.name}
                                                                        onChange={e => setRenamingItem({ ...renamingItem, name: e.target.value })}
                                                                        onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setRenamingItem(null); }}
                                                                        onBlur={handleRename}
                                                                        onClick={e => e.stopPropagation()}
                                                                        className="text-[14px] font-normal text-gray-900 border border-[#064771] rounded px-1.5 py-0.5 focus:outline-none"
                                                                    />
                                                                ) : (
                                                                    <span className="text-[14px] font-normal text-gray-900 truncate tracking-tight">{folder.name}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-[13px] font-normal text-gray-600 border-b border-[#f1f5f9] align-middle">{folder.files_count} {t('flowdrive.items')}</td>
                                                    <td className="px-4 py-3 text-[13px] font-normal text-gray-600 border-b border-[#f1f5f9] align-middle">{timeAgo(folder.updated_at)}</td>
                                                    <td className="px-4 py-3 text-[13px] font-normal text-gray-400 border-b border-[#f1f5f9] align-middle">—</td>
                                                    <td
                                                        className="sticky right-0 z-10 border-b border-[#f1f5f9] shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.15)] bg-white group-hover:bg-[#f8fafc]"
                                                        style={{ width: 60 }}
                                                        onClick={e => e.stopPropagation()}
                                                    >
                                                        <div className="flex items-center justify-end px-4">
                                                            <button
                                                                onClick={e => { e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, item: folder, itemType: 'folder' }); }}
                                                                className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-all"
                                                                aria-label="Folder actions"
                                                            >
                                                                <MoreVertical className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {displayFiles.map(file => {
                                                return (
                                                    <tr
                                                        key={file.id}
                                                        className={`group h-14 transition-colors duration-150 cursor-pointer border-b border-[#f1f5f9] ${selectedFiles.has(file.id) ? 'bg-[#EDF8FF]' : 'hover:bg-[#f8fafc]'}`}
                                                        onClick={() => toggleFileSelect(file.id)}
                                                        onDoubleClick={() => isPreviewable(file.mime_type) ? handleOpenPreview(file) : downloadFile(file.id, file.original_name)}
                                                        onContextMenu={e => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, item: file, itemType: 'file' }); }}
                                                    >
                                                        <td className="px-2 py-3 border-b border-[#f1f5f9] align-middle text-center" style={{ width: 40 }} onClick={e => e.stopPropagation()}>
                                                            <button onClick={(e) => toggleFileSelect(file.id, e)} className="p-0.5" aria-label="Select file">
                                                                {selectedFiles.has(file.id) ? <CheckSquare className="w-4 h-4 text-[#064771]" /> : <Square className="w-4 h-4 text-gray-400" />}
                                                            </button>
                                                        </td>
                                                        <td className="px-4 py-3 text-[13.5px] text-gray-600 border-b border-[#f1f5f9] align-middle overflow-hidden whitespace-nowrap text-ellipsis">
                                                            <div className="w-full h-full flex items-center overflow-hidden whitespace-nowrap text-ellipsis">
                                                                <div className="flex items-center gap-2.5">
                                                                    <img src={getFileIconSrc(file.original_name)} alt="" className="w-5 h-5 shrink-0" draggable={false} />
                                                                    {renamingItem?.id === file.id ? (
                                                                        <span className="flex items-center gap-0 min-w-0">
                                                                            <input
                                                                                ref={renameInputRef}
                                                                                value={renamingItem.name}
                                                                                onChange={e => setRenamingItem({ ...renamingItem, name: e.target.value })}
                                                                                onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setRenamingItem(null); }}
                                                                                onBlur={handleRename}
                                                                                onClick={e => e.stopPropagation()}
                                                                                className="text-[14px] font-normal text-gray-900 border border-[#064771] rounded px-1.5 py-0.5 focus:outline-none min-w-0"
                                                                            />
                                                                            {renamingItem.ext && <span className="text-[14px] text-gray-400 shrink-0">.{renamingItem.ext}</span>}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-[14px] font-normal text-gray-900 truncate tracking-tight" title={file.original_name}>{file.original_name}</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-[13px] font-normal text-gray-600 border-b border-[#f1f5f9] align-middle">{formatFileSize(file.size)}</td>
                                                        <td className="px-4 py-3 text-[13px] font-normal text-gray-600 border-b border-[#f1f5f9] align-middle">{timeAgo(file.updated_at)}</td>
                                                        <td className="px-4 py-3 text-[13px] font-normal text-gray-600 border-b border-[#f1f5f9] align-middle overflow-hidden whitespace-nowrap text-ellipsis">{file.uploaded_by_name}</td>
                                                        <td
                                                            className="sticky right-0 z-10 border-b border-[#f1f5f9] shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.15)] bg-white group-hover:bg-[#f8fafc]"
                                                            style={{ width: 60 }}
                                                            onClick={e => e.stopPropagation()}
                                                        >
                                                            <div className="flex items-center justify-end px-4">
                                                                <button
                                                                    onClick={e => { e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, item: file, itemType: 'file' }); }}
                                                                    className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-all"
                                                                    aria-label="File actions"
                                                                >
                                                                    <MoreVertical className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Marquee selection overlay — rendered INSIDE the
                        scrollable container so it shares the same coordinate
                        system as the item cards (container-content-space) */}
                        {isSelecting && marqueeStyle && (
                            <div
                                className="absolute border-2 border-[#064771]/50 bg-[#064771]/[0.08] pointer-events-none z-[50] rounded-[3px]"
                                style={{ top: marqueeStyle.top, left: marqueeStyle.left, width: marqueeStyle.width, height: marqueeStyle.height }}
                            />
                        )}
                    </div>{/* end content padding */}
                </div>{/* end scrollable container */}

                {/* Context menu */}
                {renderContextMenu()}

                {/* Modals & panels */}
                {uploadModalOpen && (
                    <DriveUploadModal
                        onClose={() => { setUploadModalOpen(false); clearUploads(); }}
                        onUpload={handleUpload}
                        uploadAggregate={uploadAggregate}
                    />
                )}
                {shareModalOpen && shareTarget && (
                    <DriveShareModal
                        fileId={shareTarget.fileId}
                        folderId={shareTarget.folderId}
                        onClose={() => { setShareModalOpen(false); setShareTarget(null); }}
                        type={driveType}
                        prospectId={prospectId || ''}
                    />
                )}
                {commentFileId && (
                    <DriveCommentPanel
                        fileId={commentFileId}
                        onClose={() => setCommentFileId(null)}
                    />
                )}
                {versionFileId && (
                    <DriveVersionHistory
                        fileId={versionFileId}
                        onClose={() => setVersionFileId(null)}
                        onReplace={() => handleReplaceFile(versionFileId)}
                    />
                )}
                {(previewFile || previewLoading) && (
                    <DriveFilePreview
                        file={previewFile}
                        previewUrl={previewBlobUrl}
                        loading={previewLoading}
                        onClose={() => { setPreviewFile(null); if (previewBlobUrl) { URL.revokeObjectURL(previewBlobUrl); setPreviewBlobUrl(null); } }}
                        onDownload={() => previewFile && downloadFile(previewFile.id, previewFile.original_name)}
                    />
                )}
                {deleteModal && (
                    <DriveDeleteModal
                        isOpen={deleteModal.open}
                        onClose={() => setDeleteModal(null)}
                        onConfirm={deleteModal.bulk ? confirmBulkDelete : confirmSingleDelete}
                        itemName={deleteModal.name}
                        itemType={deleteModal.type}
                        bulkCount={deleteModal.bulk}
                    />
                )}
                <DriveMoveModal
                    open={moveModalOpen}
                    onClose={() => { setMoveModalOpen(false); setMoveTarget(null); }}
                    onMove={handleMoveConfirm}
                    excludeFolderIds={moveTarget?.folderIds ?? []}
                    currentFolderId={currentFolderId}
                    driveType={driveType}
                    prospectId={prospectId || ''}
                />
            </div>
        </div >
    );
};

export default DriveExplorer;
