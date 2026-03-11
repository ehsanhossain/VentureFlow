/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Folder, ChevronRight, ChevronDown, X, Home } from 'lucide-react';
import { DriveFolder } from './useProspectDrive';
import api from '../../../config/api';

interface DriveMoveModalProps {
    open: boolean;
    onClose: () => void;
    onMove: (targetFolderId: string | null) => void;
    excludeFolderIds: string[];
    currentFolderId: string | null;
    driveType: 'investor' | 'target';
    prospectId: string;
}

interface TreeNode {
    id: string;
    name: string;
    parent_id: string | null;
    children: TreeNode[];
}

const DriveMoveModal: React.FC<DriveMoveModalProps> = ({
    open, onClose, onMove,
    excludeFolderIds, currentFolderId,
    driveType, prospectId,
}) => {
    const { t } = useTranslation();
    const [allFolders, setAllFolders] = useState<DriveFolder[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    // Fetch the full folder tree when modal opens
    useEffect(() => {
        if (!open) return;
        setLoading(true);
        setSelectedId(null);
        api.get(`/api/drive/${driveType}/${prospectId}/folder-tree`)
            .then(res => {
                setAllFolders(res.data.folders ?? []);
                const folderList: DriveFolder[] = res.data.folders ?? [];
                const ids = new Set<string>(folderList.map(f => f.id));
                setExpanded(ids);
            })
            .catch(err => console.error('Failed to load folder tree', err))
            .finally(() => setLoading(false));
    }, [open, driveType, prospectId]);

    // Build nested tree from flat list
    const tree = useMemo(() => {
        const map = new Map<string | null, TreeNode[]>();
        for (const f of allFolders) {
            const parent = f.parent_id ?? null;
            if (!map.has(parent)) map.set(parent, []);
            map.get(parent)!.push({ id: f.id, name: f.name, parent_id: f.parent_id, children: [] });
        }
        const buildChildren = (parentId: string | null): TreeNode[] => {
            const nodes = map.get(parentId) ?? [];
            for (const n of nodes) {
                n.children = buildChildren(n.id);
            }
            return nodes.sort((a, b) => a.name.localeCompare(b.name));
        };
        return buildChildren(null);
    }, [allFolders]);

    const toggleExpand = useCallback((id: string) => {
        setExpanded(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    }, []);

    const isDisabled = useCallback((id: string) => {
        return excludeFolderIds.includes(id) || id === currentFolderId;
    }, [excludeFolderIds, currentFolderId]);

    // Recursive folder node renderer
    const renderNode = (node: TreeNode, depth: number = 0): React.ReactNode => {
        const disabled = isDisabled(node.id);
        const isSelected = selectedId === node.id;
        const hasChildren = node.children.length > 0;
        const isExpanded = expanded.has(node.id);

        return (
            <div key={node.id}>
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => { if (!disabled) setSelectedId(node.id); }}
                    className={`w-full flex items-center gap-1.5 px-2 py-1.5 text-left text-sm rounded-[3px] transition-colors ${disabled ? 'opacity-40 cursor-not-allowed' :
                        isSelected ? 'bg-[#064771] text-white' : 'hover:bg-gray-100 text-gray-800'
                        }`}
                    style={{ paddingLeft: `${8 + depth * 20}px` }}
                >
                    {/* Expand/collapse toggle */}
                    {hasChildren ? (
                        <span
                            onClick={(e) => { e.stopPropagation(); toggleExpand(node.id); }}
                            className={`shrink-0 w-4 h-4 flex items-center justify-center cursor-pointer ${isSelected ? 'text-white/80' : 'text-gray-400'}`}
                        >
                            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        </span>
                    ) : (
                        <span className="shrink-0 w-4" />
                    )}
                    <Folder className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-[#064771]'}`} />
                    <span className="truncate">{node.name}</span>
                    {disabled && node.id === currentFolderId && (
                        <span className={`ml-auto text-[10px] italic ${isSelected ? 'text-white/60' : 'text-gray-400'}`}>
                            (current)
                        </span>
                    )}
                    {disabled && excludeFolderIds.includes(node.id) && node.id !== currentFolderId && (
                        <span className={`ml-auto text-[10px] italic ${isSelected ? 'text-white/60' : 'text-gray-400'}`}>
                            (moving)
                        </span>
                    )}
                </button>
                {hasChildren && isExpanded && (
                    <div>{node.children.map(child => renderNode(child, depth + 1))}</div>
                )}
            </div>
        );
    };

    if (!open) return null;

    const isRootSelected = selectedId === null;
    const isRootDisabled = currentFolderId === null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white rounded-[3px] border border-[#E5E7EB] shadow-xl w-full max-w-md mx-4 flex flex-col max-h-[70vh] animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E5E7EB]">
                    <h3 className="text-sm font-semibold text-gray-900 tracking-[-0.24px]">
                        {t('flowdrive.move.title', 'Move to…')}
                    </h3>
                    <button onClick={onClose} className="p-1 rounded-[3px] hover:bg-gray-100 transition-colors">
                        <X className="w-4 h-4 text-gray-500" />
                    </button>
                </div>

                {/* Body — folder tree */}
                <div className="flex-1 overflow-auto px-3 py-2 min-h-[200px]">
                    {loading ? (
                        <div className="flex items-center justify-center h-32">
                            <div className="animate-spin w-5 h-5 border-2 border-[#064771] border-t-transparent rounded-full" />
                        </div>
                    ) : (
                        <div className="flex flex-col gap-0.5">
                            {/* Root option */}
                            <button
                                type="button"
                                disabled={isRootDisabled}
                                onClick={() => { if (!isRootDisabled) setSelectedId(null); }}
                                className={`w-full flex items-center gap-1.5 px-2 py-1.5 text-left text-sm rounded-[3px] transition-colors ${isRootDisabled ? 'opacity-40 cursor-not-allowed' :
                                    isRootSelected ? 'bg-[#064771] text-white' : 'hover:bg-gray-100 text-gray-800'
                                    }`}
                            >
                                <Home className={`w-4 h-4 shrink-0 ${isRootSelected ? 'text-white' : 'text-[#064771]'}`} />
                                <span className="font-medium">{t('flowdrive.move.root', 'CloudFlow (root)')}</span>
                                {isRootDisabled && (
                                    <span className="ml-auto text-[10px] italic text-gray-400">(current)</span>
                                )}
                            </button>

                            {/* Separator */}
                            <div className="h-px bg-[#E5E7EB] my-1" />

                            {/* Folder tree */}
                            {tree.length === 0 ? (
                                <p className="text-xs text-gray-400 text-center py-6">
                                    {t('flowdrive.move.noFolders', 'No folders available')}
                                </p>
                            ) : (
                                tree.map(node => renderNode(node, 0))
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[#E5E7EB]">
                    <button
                        onClick={onClose}
                        className="px-4 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-[3px] hover:bg-gray-50 transition-colors"
                    >
                        {t('flowdrive.move.cancel', 'Cancel')}
                    </button>
                    <button
                        onClick={() => onMove(selectedId)}
                        disabled={loading}
                        className="px-4 py-1.5 text-xs font-medium text-white bg-[#064771] rounded-[3px] hover:bg-[#053a5c] transition-colors disabled:opacity-50"
                    >
                        {t('flowdrive.move.moveHere', 'Move here')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DriveMoveModal;
