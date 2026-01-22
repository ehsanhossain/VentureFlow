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

import { formatCompactBudget } from '../../../utils/formatters';
import {
    MoreVertical,
    Filter,
    ArrowUpDown,
    Square,
    Bookmark,
    ArrowUp,
    ArrowDown,
    ListFilter,
    Trash2
} from 'lucide-react';
import api from '../../../config/api';
import { showAlert } from '../../../components/Alert';

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
    onOpenFilter?: () => void;
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
    onOpenFilter,
    visibleColumns,
    selectedCurrency,
    onRefresh
}) => {
    const navigate = useNavigate();
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'projectCode', direction: null });
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, rowId: number } | null>(null);
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

    const handleDeleteSelected = async () => {
        if (selectedIds.size === 0) return;

        if (window.confirm(`Are you sure you want to delete ${selectedIds.size} items? This action cannot be undone.`)) {
            try {
                const response = await api.delete('/sellers', {
                    data: { ids: Array.from(selectedIds) }
                });
                showAlert({ type: 'success', message: response.data.message });
                setSelectedIds(new Set());
                if (onRefresh) onRefresh();
            } catch (error: any) {
                console.error("Delete failed", error);
                showAlert({ type: 'error', message: error.response?.data?.message || 'Failed to delete items' });
            }
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
        <div className="w-full h-full bg-white rounded border border-gray-100 overflow-hidden relative group/table flex flex-col">
            <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-gray-300/40 hover:scrollbar-thumb-gray-300/60 scrollbar-track-transparent transition-colors">
                <Table
                    containerClassName="overflow-visible"
                    className="min-w-full min-h-full table-fixed border-separate border-spacing-0"
                >
                    <TableHeader>
                        <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 border-b border-gray-100">
                            <TableHead className="w-[60px] text-center sticky left-0 bg-gray-50/50 z-40 border-r border-gray-100">
                                <button
                                    onClick={toggleSelectMode}
                                    className="p-1.5 hover:bg-gray-200 rounded transition-all focus:outline-none active:scale-90"
                                >
                                    {isSelectMode ? (
                                        <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                                            <Checkbox
                                                checked={selectedIds.size === data.length && data.length > 0}
                                                onChange={(e) => handleSelectAll(e.target.checked)}
                                            />
                                        </div>
                                    ) : (
                                        <Square className="w-5 h-5 text-gray-300" />
                                    )}
                                </button>
                            </TableHead>

                            {Object.keys(columnWidths).map(colKey => (
                                isVisible(colKey) && (
                                    <TableHead
                                        key={colKey}
                                        style={{ width: columnWidths[colKey as keyof typeof columnWidths] }}
                                        className="relative group p-0 border-r border-gray-100 transition-colors hover:bg-gray-100/50"
                                    >
                                        <div
                                            className="flex items-center gap-2 cursor-pointer select-none px-4 py-3 h-full"
                                            onClick={() => handleSort(colKey as SortKey)}
                                        >
                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                {colKey === 'hq' ? 'HQ' :
                                                    colKey === 'ebitda' ? 'EBITDA' :
                                                        colKey.replace(/([A-Z])/g, ' $1').trim()}
                                            </span>
                                            <SortIcon column={colKey as SortKey} />
                                        </div>
                                        <ResizeHandle column={colKey} />
                                    </TableHead>
                                )
                            ))}

                            <TableHead className="text-right w-[120px] pr-6 sticky right-0 bg-gray-50/50 z-40 border-l border-gray-100">
                                <div className="flex items-center justify-end gap-2">
                                    {selectedIds.size > 0 ? (
                                        <button onClick={handleDeleteSelected} className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-600 rounded">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    ) : (
                                        <>
                                            <button onClick={onOpenFilter} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:bg-gray-100 rounded">
                                                <Filter className="w-4 h-4" />
                                            </button>
                                            <button className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded text-gray-500 border border-gray-100 transition-all active:scale-95" title="General Sorting">
                                                <ListFilter className="w-4 h-4 rotate-180" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={100} className="text-center h-24">Loading...</TableCell></TableRow>
                        ) : sortedData.length === 0 ? (
                            <TableRow><TableCell colSpan={100} className="text-center h-24">No Data</TableCell></TableRow>
                        ) : (
                            sortedData.map((row) => (
                                <TableRow
                                    key={row.id}
                                    onContextMenu={(e) => handleContextMenu(e, row.id)}
                                    onClick={() => navigate(`/seller-portal/view/${row.id}`)}
                                    className={`group border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${selectedIds.has(row.id) ? 'bg-blue-50' : ''} ${row.isPinned ? 'bg-amber-50/30' : ''}`}
                                >
                                    <TableCell className="text-center sticky left-0 bg-inherit z-20 border-r border-gray-100">
                                        {isSelectMode ? (
                                            <Checkbox checked={selectedIds.has(row.id)} onChange={(e) => handleSelectRow(row.id, e.target.checked)} />
                                        ) : (
                                            row.isPinned && <Bookmark className="w-4 h-4 text-amber-500 fill-amber-500 mx-auto" />
                                        )}
                                    </TableCell>

                                    {isVisible('addedDate') && <TableCell className="text-gray-600 text-xs">{row.addedDate}</TableCell>}
                                    {isVisible('projectCode') && <TableCell className="font-semibold text-[#064771]">{row.projectCode}</TableCell>}
                                    {isVisible('companyName') && <TableCell className="font-bold text-gray-900">{row.companyName}</TableCell>}
                                    {isVisible('hq') && <TableCell><div className="flex items-center gap-2">{row.hq?.flag && <img src={row.hq.flag} className="w-4 h-4 rounded-full" />} {row.hq?.name || 'N/A'}</div></TableCell>}
                                    {isVisible('industry') && <TableCell className="text-xs">{Array.isArray(row.industry) && row.industry[0] ? row.industry[0] : 'N/A'}</TableCell>}
                                    {isVisible('industryMiddle') && <TableCell className="text-xs">{row.industryMiddle}</TableCell>}
                                    {isVisible('projectDetails') && <TableCell><div className="truncate max-w-[200px]" title={row.projectDetails}>{row.projectDetails}</div></TableCell>}
                                    {isVisible('pipelineStatus') && <TableCell><span className="px-2 py-0.5 rounded bg-green-50 text-green-700 text-xs border border-green-200">{getStagePosition(row.pipelineStatus).display}</span></TableCell>}
                                    {isVisible('status') && <TableCell><span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs">{row.status}</span></TableCell>}
                                    {isVisible('desiredInvestment') && <TableCell className="font-bold">{getBudgetDisplay(row.desiredInvestment, row.sourceCurrencyRate)}</TableCell>}
                                    {isVisible('reasonForMA') && <TableCell className="text-xs">{row.reasonForMA}</TableCell>}
                                    {isVisible('saleShareRatio') && <TableCell className="text-xs">{row.saleShareRatio}</TableCell>}
                                    {isVisible('rank') && <TableCell><span className={`px-2 py-0.5 rounded text-xs font-bold ${row.rank === 'A' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>{row.rank}</span></TableCell>}
                                    {isVisible('internalOwner') && <TableCell className="text-xs">{row.internalOwner}</TableCell>}
                                    {isVisible('primaryContact') && <TableCell className="text-sm font-medium">{row.primaryContact}</TableCell>}
                                    {isVisible('primaryEmail') && <TableCell className="text-xs text-gray-500">{row.primaryEmail}</TableCell>}
                                    {isVisible('primaryPhone') && <TableCell className="text-xs text-gray-500">{row.primaryPhone}</TableCell>}
                                    {isVisible('website') && <TableCell><a href={row.website} target="_blank" className="text-blue-500 hover:underline text-xs" onClick={(e) => e.stopPropagation()}>Link</a></TableCell>}
                                    {isVisible('teaserLink') && <TableCell><a href={row.teaserLink} target="_blank" className="text-blue-500 hover:underline text-xs" onClick={(e) => e.stopPropagation()}>Link</a></TableCell>}
                                    {isVisible('ebitda') && <TableCell className="text-xs">{getBudgetDisplay(row.ebitda, row.sourceCurrencyRate)}</TableCell>}

                                    <TableCell className="text-right px-4 sticky right-0 bg-inherit z-20 border-l border-gray-100">
                                        <button onClick={(e) => { e.stopPropagation(); handleContextMenu(e, row.id); }} className="p-1 hover:bg-gray-200 rounded">
                                            <MoreVertical className="w-4 h-4 text-gray-400" />
                                        </button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
            {contextMenu && (<div ref={contextMenuRef} className="fixed bg-white border shadow-xl z-50 rounded w-48 py-1" style={{ top: contextMenu.y, left: contextMenu.x }}>
                <button onClick={() => { onTogglePin(contextMenu.rowId); setContextMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm">Toggle Pin</button>
                <button onClick={() => { navigate(`/seller-portal/view/${contextMenu.rowId}`); setContextMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm">View Details</button>
                <button onClick={() => { navigate(`/seller-portal/edit/${contextMenu.rowId}`); setContextMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm">Edit</button>
            </div>)}
        </div>
    );
};
