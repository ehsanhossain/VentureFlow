import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../../components/table/table';
import Checkbox from '../../../components/Checkbox';

import { formatCompactBudget, formatFullBudget } from '../../../utils/formatters';
import {
    MoreVertical,
    Square,
    Bookmark,
    ArrowUp,
    ArrowDown,
    ArrowUpDown,
    Trash2,
    Search,
    Eye,
    Zap
} from 'lucide-react';
import api from '../../../config/api';
import { showAlert } from '../../../components/Alert';
import DeleteConfirmationModal from '../../../components/DeleteConfirmationModal';

export interface TargetRowData {
    id: number;
    addedDate: string;
    projectCode: string;
    companyName: string;
    hq: { name: string; flag: string };
    industry: string[];
    industryMiddle: string;
    projectDetails: string;
    pipelineStatus: string;
    status: string;
    desiredInvestment: any;
    reasonForMA: string;
    saleShareRatio: string;
    rank: string;
    internalOwner: string;
    primaryContact: string;
    primaryEmail: string;
    primaryPhone: string;
    website: string;
    teaserLink: string;
    ebitda: any;
    isPinned?: boolean;
    sourceCurrencyRate?: number;
}

interface TargetTableProps {
    data: TargetRowData[];
    isLoading?: boolean;
    onTogglePin: (id: number) => void;
    visibleColumns: string[];
    selectedCurrency?: { id: number; code: string; symbol: string; rate: number; };
    onRefresh?: () => void;
}

type SortKey = keyof TargetRowData;
type SortDirection = 'asc' | 'desc' | null;

export const TargetTable: React.FC<TargetTableProps> = ({
    data,
    isLoading,
    onTogglePin,
    visibleColumns,
    selectedCurrency,
    onRefresh
}) => {
    const navigate = useNavigate();
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'projectCode', direction: null });
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, rowId: number } | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const contextMenuRef = useRef<HTMLDivElement>(null);

    // Pipeline stages for target (seller) pipeline
    const [pipelineStages, setPipelineStages] = useState<{ code: string; name: string; order_index: number }[]>([]);

    useEffect(() => {
        const fetchPipelineStages = async () => {
            try {
                const response = await api.get('/api/pipeline-stages', { params: { type: 'seller' } });
                const stages = Array.isArray(response.data) ? response.data : (response.data?.data || []);
                setPipelineStages(stages);
            } catch (error) {
                console.error('Failed to fetch pipeline stages:', error);
            }
        };
        fetchPipelineStages();
    }, []);

    const getStagePosition = (stageCode: string): { display: string; stageName: string } => {
        if (!Array.isArray(pipelineStages) || !pipelineStages.length || !stageCode || stageCode === 'N/A' || stageCode === 'Unknown') {
            return { display: stageCode || 'N/A', stageName: stageCode || 'N/A' };
        }

        const safeStageCode = String(stageCode);
        const totalStages = pipelineStages.length;
        const stageIndex = pipelineStages.findIndex(
            s => (s.code && String(s.code).toUpperCase() === safeStageCode.toUpperCase()) || (s.name && String(s.name).toUpperCase() === safeStageCode.toUpperCase())
        );

        if (stageIndex === -1) {
            return { display: stageCode, stageName: stageCode };
        }

        const stageName = pipelineStages[stageIndex].name;
        return {
            display: `Stage ${stageIndex + 1}/${totalStages}`,
            stageName: stageName
        };
    };

    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
        addedDate: 100,
        projectCode: 150,
        companyName: 200,
        hq: 120,
        industry: 150,
        industryMiddle: 150,
        projectDetails: 250,
        pipelineStatus: 120,
        status: 100,
        desiredInvestment: 160,
        reasonForMA: 150,
        saleShareRatio: 120,
        rank: 80,
        internalOwner: 150,
        primaryContact: 150,
        primaryEmail: 200,
        primaryPhone: 130,
        website: 150,
        teaserLink: 120,
        ebitda: 140,
    });

    const handleResizeStart = (e: React.MouseEvent, column: string) => {
        e.preventDefault();
        const startX = e.pageX;
        const startWidth = columnWidths[column];

        const handleMouseMove = (e: MouseEvent) => {
            const newWidth = Math.max(50, startWidth + (e.pageX - startX));
            setColumnWidths(prev => ({ ...prev, [column]: newWidth }));
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseDown = handleResizeStart;

    const toggleSelectMode = () => {
        setIsSelectMode(!isSelectMode);
        if (isSelectMode) setSelectedIds(new Set());
    };

    const handleSelectRow = (id: number, checked: boolean) => {
        const newSelected = new Set(selectedIds);
        if (checked) {
            newSelected.add(id);
        } else {
            newSelected.delete(id);
        }
        setSelectedIds(newSelected);
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const allIds = new Set(data.map(item => item.id));
            setSelectedIds(allIds);
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleDeleteSelected = () => {
        if (selectedIds.size === 0) return;
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        try {
            const response = await api.delete('/api/sellers', {
                data: { ids: Array.from(selectedIds) }
            });
            showAlert({ type: 'success', message: response.data.message });
            setSelectedIds(new Set());
            setIsDeleteModalOpen(false);
            if (onRefresh) onRefresh();
        } catch (error: any) {
            console.error("Delete failed", error);
            showAlert({ type: 'error', message: error.response?.data?.message || 'Failed to delete items' });
        }
    };

    const handleSort = (key: SortKey) => {
        let direction: SortDirection = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = null;
        }
        setSortConfig({ key, direction });
    };

    const sortedData = useMemo(() => {
        let result = [...data];

        result.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return 0;
        });

        if (sortConfig.direction) {
            result.sort((a, b) => {
                if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;

                const valA = a[sortConfig.key] ?? '';
                const valB = b[sortConfig.key] ?? '';

                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [data, sortConfig]);

    const handleContextMenu = (e: React.MouseEvent, id: number) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, rowId: id });
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
                setContextMenu(null);
            } else {
                setContextMenu(null);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const SortIcon = ({ column }: { column: SortKey }) => {
        if (sortConfig.key !== column || !sortConfig.direction) return <ArrowUpDown className="w-3 h-3 text-gray-300" />;
        return sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-[#064771]" /> : <ArrowDown className="w-3 h-3 text-[#064771]" />;
    };

    const getBudgetDisplay = (budget: any, sourceRate?: number) => {
        const targetRate = selectedCurrency?.rate || 1;
        const sRate = sourceRate || 1;
        const conversionRate = targetRate / sRate;
        return formatCompactBudget(budget, selectedCurrency?.symbol || '$', conversionRate);
    };

    const isVisible = (col: string) => visibleColumns.includes(col);

    const ResizeHandle = ({ column }: { column: string }) => (
        <div
            className={`absolute right-0 top-0 h-full w-[4px] cursor-col-resize select-none z-20 group/handle transition-all duration-200 hover:w-[6px]`}
            onMouseDown={(e) => handleMouseDown(e, column)}
        >
            <div className="absolute right-0 top-0 h-full w-[1px] bg-gray-200 transition-all" />
            <div className="absolute right-[-1px] top-1/2 -translate-y-1/2 h-8 w-[3px] bg-[#064771] rounded-full opacity-0 group-hover/handle:opacity-100 transition-all shadow-[0_0_10px_rgba(6,71,113,0.3)]" />
        </div>
    );

    return (
        <div className="w-full h-full bg-white flex flex-col min-h-0">
            <div className="flex-1 overflow-auto scrollbar-premium">
                <Table
                    containerClassName="overflow-visible min-w-full"
                    className="w-full table-fixed border-separate border-spacing-0"
                >
                    <TableHeader className="sticky top-0 z-40">
                        <TableRow className="bg-slate-50/80 backdrop-blur-sm border-b border-slate-200">
                            <TableHead className="w-[50px] text-center sticky left-0 bg-slate-50 z-50 p-2">
                                <button
                                    onClick={toggleSelectMode}
                                    className="p-1.5 hover:bg-slate-200 rounded-lg transition-all focus:outline-none active:scale-90"
                                >
                                    {isSelectMode ? (
                                        <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                                            <Checkbox
                                                checked={selectedIds.size === data.length && data.length > 0}
                                                onChange={(e) => handleSelectAll(e.target.checked)}
                                            />
                                        </div>
                                    ) : (
                                        <Square className="w-5 h-5 text-slate-300" />
                                    )}
                                </button>
                            </TableHead>

                            {Object.keys(columnWidths).map(colKey => (
                                isVisible(colKey) && (
                                    <TableHead
                                        key={colKey}
                                        style={{ width: columnWidths[colKey] }}
                                        className="relative p-0 border-b border-slate-100 h-11"
                                    >
                                        <div
                                            className="flex items-center gap-2 cursor-pointer px-4 select-none h-full hover:bg-slate-100/50 transition-colors"
                                            onClick={() => handleSort(colKey as SortKey)}
                                        >
                                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                                {colKey === 'hq' ? 'HQ' :
                                                    colKey === 'ebitda' ? 'EBITDA' :
                                                        colKey === 'projectCode' ? 'Project ID' :
                                                            colKey === 'companyName' ? 'Target Name' :
                                                                colKey === 'desiredInvestment' ? 'Value' :
                                                                    colKey.replace(/([A-Z])/g, ' $1').trim()}
                                            </span>
                                            <SortIcon column={colKey as SortKey} />
                                        </div>
                                        <ResizeHandle column={colKey} />
                                    </TableHead>
                                )
                            ))}

                            <TableHead className="w-[100px] sticky right-0 bg-slate-50 z-50 border-b border-slate-100 h-11">
                                <div className="flex items-center justify-end px-6 h-full">
                                    {selectedIds.size > 0 && (
                                        <button
                                            className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-all hover:scale-110"
                                            onClick={handleDeleteSelected}
                                            title="Delete Selected"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={20} className="h-64">
                                    <div className="flex flex-col items-center justify-center gap-3">
                                        <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                                        <p className="text-sm font-bold text-slate-400">Fetching targets...</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : sortedData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={20} className="h-64">
                                    <div className="flex flex-col items-center justify-center gap-2 opacity-40">
                                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                                            <Search className="w-8 h-8 text-slate-300" />
                                        </div>
                                        <p className="font-bold text-slate-900">No results found</p>
                                        <p className="text-sm text-slate-500">Try adjusting your filters or search</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            sortedData.map((row) => (
                                <TableRow
                                    key={row.id}
                                    onClick={() => navigate(`/prospects/target/${row.id}`)}
                                    onContextMenu={(e) => handleContextMenu(e, row.id)}
                                    className={`
                                        group transition-all duration-300 cursor-pointer border-b border-slate-50
                                        ${selectedIds.has(row.id) ? 'bg-blue-50/50' : 'hover:bg-slate-50/70'}
                                        ${row.isPinned ? 'bg-amber-50/20' : ''}
                                    `}
                                >
                                    <TableCell className="p-0 text-center sticky left-0 bg-inherit z-20" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center justify-center h-14">
                                            {isSelectMode ? (
                                                <Checkbox
                                                    checked={selectedIds.has(row.id)}
                                                    onChange={(e) => handleSelectRow(row.id, e.target.checked)}
                                                />
                                            ) : (
                                                <div className="w-5 h-5 flex items-center justify-center">
                                                    {row.isPinned && <Bookmark className="w-5 h-5 text-amber-500 fill-amber-500/10" />}
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>

                                    {isVisible('addedDate') && (
                                        <TableCell className="px-4 py-2">
                                            <span className="text-[12px] text-slate-500 font-medium">{row.addedDate}</span>
                                        </TableCell>
                                    )}

                                    {isVisible('projectCode') && (
                                        <TableCell className="px-4 py-2">
                                            <span className="text-[13px] font-extrabold text-[#064771] bg-blue-50/50 px-2 py-1 rounded-md border border-blue-100/50">
                                                {row.projectCode}
                                            </span>
                                        </TableCell>
                                    )}

                                    {isVisible('companyName') && (
                                        <TableCell className="px-4 py-2">
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[14px] font-bold text-slate-900 truncate tracking-tight">{row.companyName}</span>
                                            </div>
                                        </TableCell>
                                    )}

                                    {isVisible('hq') && (
                                        <TableCell className="px-4 py-2">
                                            <div className="flex items-center gap-2 cursor-help" title={row.hq?.name}>
                                                {row.hq?.flag ? (
                                                    <img src={row.hq.flag} className="w-5 h-5 rounded-full object-cover ring-2 ring-slate-100 shadow-sm" alt={row.hq.name} />
                                                ) : (
                                                    <div className="w-5 h-5 rounded-full bg-slate-100" />
                                                )}
                                                <span className="text-[13px] font-semibold text-slate-600 truncate">{row.hq?.name || 'N/A'}</span>
                                            </div>
                                        </TableCell>
                                    )}

                                    {isVisible('industry') && (
                                        <TableCell className="px-4 py-2">
                                            <span
                                                className="px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-bold text-slate-600 truncate max-w-[150px] inline-block cursor-help"
                                                title={Array.isArray(row.industry) ? row.industry.join(', ') : row.industry || ''}
                                            >
                                                {Array.isArray(row.industry) ? row.industry[0] : row.industry || 'N/A'}
                                            </span>
                                        </TableCell>
                                    )}

                                    {isVisible('industryMiddle') && (
                                        <TableCell className="px-4 py-2">
                                            <span className="text-[12px] text-slate-500 truncate block">{row.industryMiddle || 'N/A'}</span>
                                        </TableCell>
                                    )}

                                    {isVisible('projectDetails') && (
                                        <TableCell className="px-4 py-2">
                                            <span className="text-[12px] text-slate-500 truncate block max-w-[200px]" title={row.projectDetails}>
                                                {row.projectDetails || 'No details'}
                                            </span>
                                        </TableCell>
                                    )}

                                    {isVisible('pipelineStatus') && (
                                        <TableCell className="px-4 py-2">
                                            <div className="flex items-center gap-2" title={getStagePosition(row.pipelineStatus).stageName}>
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200" />
                                                <span className="text-[11px] font-black text-slate-700 uppercase tracking-tighter cursor-help">
                                                    {getStagePosition(row.pipelineStatus).display}
                                                </span>
                                            </div>
                                        </TableCell>
                                    )}

                                    {isVisible('status') && (
                                        <TableCell className="px-4 py-2">
                                            <span className="text-[12px] font-semibold text-slate-500 capitalize">{row.status}</span>
                                        </TableCell>
                                    )}

                                    {isVisible('desiredInvestment') && (
                                        <TableCell className="px-4 py-2">
                                            <div
                                                className="flex flex-col items-end pr-2 cursor-help"
                                                title={formatFullBudget(row.desiredInvestment, selectedCurrency?.symbol || '$', (selectedCurrency?.rate || 1) / (row.sourceCurrencyRate || 1))}
                                            >
                                                <span className="text-[14px] font-black text-slate-900 leading-tight">
                                                    {getBudgetDisplay(row.desiredInvestment, row.sourceCurrencyRate)}
                                                </span>
                                            </div>
                                        </TableCell>
                                    )}

                                    {isVisible('reasonForMA') && (
                                        <TableCell className="px-4 py-2">
                                            <span className="text-[12px] text-slate-500 truncate block">{row.reasonForMA || 'N/A'}</span>
                                        </TableCell>
                                    )}

                                    {isVisible('saleShareRatio') && (
                                        <TableCell className="px-4 py-2">
                                            <span className="text-[12px] font-bold text-slate-600">{row.saleShareRatio || 'N/A'}</span>
                                        </TableCell>
                                    )}

                                    {isVisible('rank') && (
                                        <TableCell className="px-4 py-2 text-center">
                                            <div className={`
                                                w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-black ring-4
                                                ${row.rank === 'A' ? 'bg-rose-50 text-rose-700 ring-rose-50/50' :
                                                    row.rank === 'B' ? 'bg-blue-50 text-blue-700 ring-blue-50/50' :
                                                        'bg-slate-100 text-slate-500 ring-slate-100/50'}
                                            `}>
                                                {row.rank || '-'}
                                            </div>
                                        </TableCell>
                                    )}

                                    {isVisible('internalOwner') && (
                                        <TableCell className="px-4 py-2">
                                            <span className="text-[12px] text-slate-600 font-medium">{row.internalOwner || 'Unassigned'}</span>
                                        </TableCell>
                                    )}

                                    {isVisible('primaryContact') && (
                                        <TableCell className="px-4 py-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[13px] font-medium text-slate-700 truncate">{row.primaryContact || 'No Contact'}</span>
                                            </div>
                                        </TableCell>
                                    )}

                                    {isVisible('primaryEmail') && (
                                        <TableCell className="px-4 py-2">
                                            <span className="text-[12px] text-slate-400 truncate block">{row.primaryEmail || 'N/A'}</span>
                                        </TableCell>
                                    )}

                                    {isVisible('primaryPhone') && (
                                        <TableCell className="px-4 py-2">
                                            <span className="text-[12px] text-slate-400 whitespace-nowrap">{row.primaryPhone || 'N/A'}</span>
                                        </TableCell>
                                    )}

                                    {isVisible('website') && (
                                        <TableCell className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                                            <a href={row.website?.startsWith('http') ? row.website : `https://${row.website}`} target="_blank" className="text-blue-600 hover:text-blue-700 hover:underline transition-all text-sm block truncate max-w-[150px]">
                                                {row.website?.replace(/^https?:\/\//, '') || 'Link'}
                                            </a>
                                        </TableCell>
                                    )}

                                    {isVisible('teaserLink') && (
                                        <TableCell className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                                            <a href={row.teaserLink} target="_blank" className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded inline-flex items-center gap-1 hover:bg-emerald-100 transition-colors">
                                                <Eye className="w-3 h-3" /> Teaser
                                            </a>
                                        </TableCell>
                                    )}

                                    {isVisible('ebitda') && (
                                        <TableCell className="px-4 py-2">
                                            <span
                                                className="text-[13px] font-bold text-slate-700 cursor-help"
                                                title={formatFullBudget(row.ebitda, selectedCurrency?.symbol || '$', (selectedCurrency?.rate || 1) / (row.sourceCurrencyRate || 1))}
                                            >
                                                {getBudgetDisplay(row.ebitda, row.sourceCurrencyRate)}
                                            </span>
                                        </TableCell>
                                    )}

                                    <TableCell className="sticky right-0 bg-inherit z-20" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center justify-end px-6">
                                            <button
                                                className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-200/50 text-slate-400 hover:text-slate-900 transition-all opacity-0 group-hover:opacity-100"
                                                onClick={(e) => { e.stopPropagation(); handleContextMenu(e, row.id); }}
                                            >
                                                <MoreVertical className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <>
                    <div className="fixed inset-0 z-[90]" onClick={() => setContextMenu(null)} />
                    <div
                        ref={contextMenuRef}
                        className="fixed bg-white rounded-2xl border border-slate-100 py-2 w-64 z-[100] animate-in fade-in zoom-in-95 duration-200 shadow-2xl overflow-hidden"
                        style={{ top: contextMenu.y, left: Math.min(contextMenu.x, window.innerWidth - 270) }}
                    >
                        <div className="px-4 py-2 mb-1 border-b border-slate-50">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target Actions</p>
                        </div>
                        <button
                            className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-amber-50 hover:text-amber-700 flex items-center gap-3 transition-colors font-semibold"
                            onClick={() => { onTogglePin(contextMenu.rowId); setContextMenu(null); }}
                        >
                            <Bookmark className={`w-4 h-4 ${data.find(r => r.id === contextMenu.rowId)?.isPinned ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`} />
                            {data.find(r => r.id === contextMenu.rowId)?.isPinned ? 'Unpin from Top' : 'Pin to Top'}
                        </button>
                        <button
                            className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-3 transition-colors font-semibold"
                            onClick={() => { navigate(`/prospects/target/${contextMenu.rowId}`); setContextMenu(null); }}
                        >
                            <Eye className="w-4 h-4 text-slate-400" />
                            View Detailed Profile
                        </button>
                        <button
                            className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-3 transition-colors font-semibold"
                            onClick={() => { navigate(`/prospects/edit-target/${contextMenu.rowId}`); setContextMenu(null); }}
                        >
                            <Zap className="w-4 h-4 text-slate-400" />
                            Edit Project Data
                        </button>
                        <div className="h-px bg-slate-50 my-1" />
                        <button
                            className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors font-bold"
                            onClick={() => {
                                setSelectedIds(new Set([contextMenu.rowId]));
                                setIsDeleteModalOpen(true);
                                setContextMenu(null);
                            }}
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete Target
                        </button>
                    </div>
                </>
            )}

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title={`Delete ${selectedIds.size} Target${selectedIds.size > 1 ? 's' : ''}`}
                itemType="targets"
                selectedIds={Array.from(selectedIds)}
            />
        </div>
    );
};
