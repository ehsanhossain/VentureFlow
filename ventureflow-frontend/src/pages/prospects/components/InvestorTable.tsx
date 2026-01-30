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
    Search,
    Square,
    Bookmark,
    Eye,
    Zap,
    Trash2,
    ArrowUpDown,
    ArrowUp,
    ArrowDown
} from 'lucide-react';
import api from '../../../config/api';
import { showAlert } from '../../../components/Alert';
import DeleteConfirmationModal from '../../../components/DeleteConfirmationModal';

export interface InvestorRowData {
    id: number;
    projectCode: string;
    companyName: string;
    hq: { name: string; flag: string };
    targetCountries: { name: string; flag: string }[];
    targetIndustries: string[];
    pipelineStatus: string;
    budget: any;
    isPinned?: boolean;
    companyType?: string;
    website?: string;
    email?: string;
    phone?: string;
    employeeCount?: string;
    yearFounded?: string;
    rank?: string;
    primaryContact?: string;
    sourceCurrencyRate?: number; // Exchange rate of the investor's default currency relative to base
}

interface InvestorTableProps {
    data: InvestorRowData[];
    isLoading: boolean;
    onTogglePin: (id: number) => void;
    visibleColumns: string[];
    selectedCurrency?: { id: number; code: string; symbol: string; rate: number; };
    onRefresh: () => void;
    isRestricted?: boolean;
}

type SortKey = keyof InvestorRowData;
type SortDirection = 'asc' | 'desc' | null;

export const InvestorTable: React.FC<InvestorTableProps> = ({
    data,
    isLoading,
    onTogglePin,
    visibleColumns,
    selectedCurrency,
    onRefresh,
    isRestricted = false
}) => {
    const navigate = useNavigate();
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'projectCode', direction: null });
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, rowId: number } | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const contextMenuRef = useRef<HTMLDivElement>(null);

    // Pipeline stages for investor pipeline
    const [pipelineStages, setPipelineStages] = useState<{ code: string; name: string; order_index: number }[]>([]);

    // Fetch pipeline stages for investor (buyer) pipeline
    useEffect(() => {
        const fetchPipelineStages = async () => {
            try {
                const response = await api.get('/api/pipeline-stages', { params: { type: 'buyer' } });
                const stages = Array.isArray(response.data) ? response.data : (response.data?.data || []);
                setPipelineStages(stages);
            } catch (error) {
                console.error('Failed to fetch pipeline stages:', error);
            }
        };
        fetchPipelineStages();
    }, []);

    // Helper function to get stage position as "Stage X/Y"
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

    // Column resizing state
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
        projectCode: 150,
        rank: 80,
        companyName: 200,
        primaryContact: 150,
        hq: 120,
        targetCountries: 200,
        targetIndustries: 200,
        pipelineStatus: 120,
        budget: 150,
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
        if (isSelectMode) {
            setSelectedIds(new Set());
        }
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
            setSelectedIds(new Set(data.map(d => d.id)));
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
            const response = await api.delete('/api/buyers', {
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
        setSortConfig(prev => {
            if (prev.key === key) {
                if (prev.direction === 'asc') return { key, direction: 'desc' };
                if (prev.direction === 'desc') return { key, direction: null };
                return { key, direction: 'asc' };
            }
            return { key, direction: 'asc' };
        });
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
            className={`
                absolute right-0 top-0 h-full w-[4px] cursor-col-resize 
                select-none z-20 group/handle transition-all duration-200
                hover:w-[6px]
            `}
            onMouseDown={(e) => handleMouseDown(e, column)}
        >
            {/* The persistent separator line */}
            <div className="absolute right-0 top-0 h-full w-[1px] bg-gray-200 transition-all" />

            {/* The grab handle pill (visible on hover) */}
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
                    <TableHeader className="sticky top-0 z-20">
                        <TableRow className="bg-slate-50/80 backdrop-blur-sm border-b border-slate-200">
                            {!isRestricted && (
                                <TableHead className="w-[50px] text-center sticky left-0 bg-slate-50 z-30 p-2">
                                    <button
                                        onClick={toggleSelectMode}
                                        className="p-1.5 hover:bg-slate-200 rounded-[3px] transition-all focus:outline-none active:scale-90"
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
                            )}

                            {isVisible('projectCode') && (
                                <TableHead style={{ width: columnWidths.projectCode }} className="relative p-0 border-b border-slate-100 h-11">
                                    <div className="flex items-center gap-2 cursor-pointer px-4 select-none h-full hover:bg-slate-100/50 transition-colors" onClick={() => handleSort('projectCode')}>
                                        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Project ID</span>
                                        <SortIcon column="projectCode" />
                                    </div>
                                    <ResizeHandle column="projectCode" />
                                </TableHead>
                            )}

                            {isVisible('rank') && (
                                <TableHead style={{ width: columnWidths.rank }} className="relative p-0 border-b border-slate-100 h-11">
                                    <div className="flex items-center gap-2 cursor-pointer px-4 select-none h-full hover:bg-slate-100/50 transition-colors" onClick={() => handleSort('rank')}>
                                        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Rank</span>
                                        <SortIcon column="rank" />
                                    </div>
                                    <ResizeHandle column="rank" />
                                </TableHead>
                            )}

                            {isVisible('companyName') && (
                                <TableHead style={{ width: columnWidths.companyName }} className="relative p-0 border-b border-slate-100 h-11">
                                    <div className="flex items-center gap-2 cursor-pointer px-4 select-none h-full hover:bg-slate-100/50 transition-colors" onClick={() => handleSort('companyName')}>
                                        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Investor Name</span>
                                        <SortIcon column="companyName" />
                                    </div>
                                    <ResizeHandle column="companyName" />
                                </TableHead>
                            )}

                            {isVisible('primaryContact') && (
                                <TableHead style={{ width: columnWidths.primaryContact }} className="relative p-0 border-b border-slate-100 h-11">
                                    <div className="flex items-center h-full px-4">
                                        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Contact</span>
                                    </div>
                                    <ResizeHandle column="primaryContact" />
                                </TableHead>
                            )}

                            {isVisible('hq') && (
                                <TableHead style={{ width: columnWidths.hq }} className="relative p-0 border-b border-slate-100 h-11">
                                    <div className="flex items-center h-full px-4 text-[11px] font-medium text-slate-500 uppercase tracking-wider">HQ</div>
                                    <ResizeHandle column="hq" />
                                </TableHead>
                            )}

                            {isVisible('targetCountries') && (
                                <TableHead style={{ width: columnWidths.targetCountries }} className="relative p-0 border-b border-slate-100 h-11">
                                    <div className="flex items-center h-full px-4 text-[11px] font-medium text-slate-500 uppercase tracking-wider">Target Geo</div>
                                    <ResizeHandle column="targetCountries" />
                                </TableHead>
                            )}

                            {isVisible('targetIndustries') && (
                                <TableHead style={{ width: columnWidths.targetIndustries }} className="relative p-0 border-b border-slate-100 h-11">
                                    <div className="flex items-center h-full px-4 text-[11px] font-medium text-slate-500 uppercase tracking-wider">Target Industry</div>
                                    <ResizeHandle column="targetIndustries" />
                                </TableHead>
                            )}

                            {isVisible('companyType') && (
                                <TableHead style={{ width: columnWidths.companyType }} className="relative p-0 border-b border-slate-100 h-11">
                                    <div className="flex items-center h-full px-4 text-[11px] font-medium text-slate-500 uppercase tracking-wider">Type</div>
                                    <ResizeHandle column="companyType" />
                                </TableHead>
                            )}

                            {isVisible('website') && (
                                <TableHead style={{ width: columnWidths.website }} className="relative p-0 border-b border-slate-100 h-11">
                                    <div className="flex items-center h-full px-4 text-[11px] font-medium text-slate-500 uppercase tracking-wider">Website</div>
                                    <ResizeHandle column="website" />
                                </TableHead>
                            )}

                            {isVisible('pipelineStatus') && (
                                <TableHead style={{ width: columnWidths.pipelineStatus }} className="relative p-0 border-b border-slate-100 h-11">
                                    <div className="flex items-center gap-2 cursor-pointer px-4 select-none h-full hover:bg-slate-100/50 transition-colors" onClick={() => handleSort('pipelineStatus')}>
                                        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Pipeline</span>
                                        <SortIcon column="pipelineStatus" />
                                    </div>
                                    <ResizeHandle column="pipelineStatus" />
                                </TableHead>
                            )}

                            {isVisible('budget') && (
                                <TableHead style={{ width: columnWidths.budget }} className="relative p-0 border-b border-slate-100 h-11">
                                    <div className="flex items-center gap-2 cursor-pointer px-4 select-none h-full hover:bg-slate-100/50 transition-colors" onClick={() => handleSort('budget')}>
                                        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Budget</span>
                                        <SortIcon column="budget" />
                                    </div>
                                    <ResizeHandle column="budget" />
                                </TableHead>
                            )}

                            <TableHead className="w-[100px] sticky right-0 bg-slate-50 z-30 border-b border-slate-100 h-11">
                                <div className="flex items-center justify-end px-6 h-full">
                                    {selectedIds.size > 0 && !isRestricted && (
                                        <button
                                            className="p-1.5 hover:bg-red-50 rounded-[3px] text-red-500 transition-all hover:scale-110"
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
                                        <p className="text-sm font-medium text-slate-400">Fetching investors...</p>
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
                                        <p className="font-medium text-slate-900">No results found</p>
                                        <p className="text-sm text-slate-500">Try adjusting your filters or search</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            sortedData.map((row) => (
                                <TableRow
                                    key={row.id}
                                    onClick={() => navigate(`/prospects/investor/${row.id}`)}
                                    onContextMenu={(e) => handleContextMenu(e, row.id)}
                                    className={`
                                        group transition-all duration-300 cursor-pointer border-b border-slate-50
                                        ${selectedIds.has(row.id) ? 'bg-blue-50/50' : 'hover:bg-slate-50/70'}
                                        ${row.isPinned ? 'bg-amber-50/20' : ''}
                                    `}
                                >
                                    {!isRestricted && (
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
                                    )}

                                    {isVisible('projectCode') && (
                                        <TableCell className="px-4 py-2">
                                            <span className="text-[13px] font-medium text-[#064771] bg-blue-50/50 px-2 py-1 rounded-md border border-blue-100/50">
                                                {row.projectCode}
                                            </span>
                                        </TableCell>
                                    )}

                                    {isVisible('rank') && (
                                        <TableCell className="px-4 py-2 text-center">
                                            <div className={`
                                                w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-medium ring-4
                                                ${row.rank === 'A' ? 'bg-emerald-50 text-emerald-700 ring-emerald-50/50' :
                                                    row.rank === 'B' ? 'bg-blue-50 text-blue-700 ring-blue-50/50' :
                                                        'bg-slate-100 text-slate-500 ring-slate-100/50'}
                                            `}>
                                                {row.rank || '-'}
                                            </div>
                                        </TableCell>
                                    )}

                                    {isVisible('companyName') && (
                                        <TableCell className="px-4 py-2">
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[14px] font-medium text-slate-900 truncate tracking-tight">{row.companyName}</span>
                                            </div>
                                        </TableCell>
                                    )}

                                    {isVisible('primaryContact') && (
                                        <TableCell className="px-4 py-2">
                                            <div className="flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                                                <span className="text-[13px] font-medium text-slate-700 truncate">{row.primaryContact || 'No Contact'}</span>
                                            </div>
                                        </TableCell>
                                    )}

                                    {isVisible('hq') && (
                                        <TableCell className="px-4 py-2">
                                            <div className="flex items-center gap-2 cursor-help" title={row.hq.name}>
                                                {row.hq.flag ? (
                                                    <img src={row.hq.flag} className="w-5 h-5 rounded-full object-cover ring-2 ring-slate-100 shadow-sm" alt={row.hq.name} />
                                                ) : (
                                                    <div className="w-5 h-5 rounded-full bg-slate-100" />
                                                )}
                                                <span className="text-[13px] font-medium text-slate-600 truncate">{row.hq.name}</span>
                                            </div>
                                        </TableCell>
                                    )}

                                    {isVisible('targetCountries') && (
                                        <TableCell className="px-4 py-2">
                                            {row.targetCountries?.length ? (
                                                <div
                                                    className="flex items-center gap-1.5 cursor-help"
                                                    title={row.targetCountries.map(c => c.name).join(', ')}
                                                >
                                                    <div className="flex -space-x-1.5 overflow-hidden">
                                                        {row.targetCountries.slice(0, 3).map((c, i) => (
                                                            <img key={i} src={c.flag} className="w-5 h-5 rounded-full border border-white object-cover shadow-sm" alt={c.name} />
                                                        ))}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-[12px] font-medium text-slate-600 truncate max-w-[80px]">
                                                            {row.targetCountries[0].name}
                                                        </span>
                                                        {row.targetCountries.length > 1 && (
                                                            <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-1 py-0.5 rounded">
                                                                +{row.targetCountries.length - 1}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-[11px] font-medium text-slate-300 italic uppercase">Global</span>
                                            )}
                                        </TableCell>
                                    )}

                                    {isVisible('targetIndustries') && (
                                        <TableCell className="px-4 py-2">
                                            <div
                                                className="flex flex-wrap gap-1 cursor-help"
                                                title={row.targetIndustries?.join(', ')}
                                            >
                                                {row.targetIndustries?.length ? (
                                                    <>
                                                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-medium text-slate-600 truncate max-w-[120px]">
                                                            {row.targetIndustries[0]}
                                                        </span>
                                                        {row.targetIndustries.length > 1 && (
                                                            <span className="px-1.5 py-0.5 rounded-md bg-blue-50 text-[10px] font-medium text-blue-600">
                                                                +{row.targetIndustries.length - 1}
                                                            </span>
                                                        )}
                                                    </>
                                                ) : <span className="text-[11px] font-medium text-slate-300">N/A</span>}
                                            </div>
                                        </TableCell>
                                    )}

                                    {isVisible('companyType') && (
                                        <TableCell className="px-4 py-2">
                                            <span className="text-[13px] font-medium text-slate-500">{row.companyType || 'N/A'}</span>
                                        </TableCell>
                                    )}

                                    {isVisible('website') && (
                                        <TableCell className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                                            <a href={row.website?.startsWith('http') ? row.website : `https://${row.website}`} target="_blank" className="text-blue-600 hover:text-blue-700 hover:underline transition-all text-sm block truncate max-w-[150px]">
                                                {row.website?.replace(/^https?:\/\//, '') || 'N/A'}
                                            </a>
                                        </TableCell>
                                    )}

                                    {isVisible('pipelineStatus') && (
                                        <TableCell className="px-4 py-2">
                                            <div className="flex items-center gap-2" title={getStagePosition(row.pipelineStatus).stageName}>
                                                <div className="w-2 h-2 rounded-full bg-blue-500 shadow-sm shadow-blue-200" />
                                                <span className="text-[11px] font-medium text-slate-700 uppercase tracking-tighter cursor-help">
                                                    {getStagePosition(row.pipelineStatus).display}
                                                </span>
                                            </div>
                                        </TableCell>
                                    )}

                                    {isVisible('budget') && (
                                        <TableCell className="px-4 py-2">
                                            <div
                                                className="flex flex-col items-end pr-2 cursor-help"
                                                title={formatFullBudget(row.budget, selectedCurrency?.symbol || '$', (selectedCurrency?.rate || 1) / (row.sourceCurrencyRate || 1))}
                                            >
                                                <span className="text-[14px] font-medium text-slate-900 leading-tight">
                                                    {getBudgetDisplay(row.budget, row.sourceCurrencyRate)}
                                                </span>
                                            </div>
                                        </TableCell>
                                    )}

                                    <TableCell className="sticky right-0 bg-inherit z-20" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center justify-end px-6">
                                            <button
                                                className="w-9 h-9 flex items-center justify-center rounded-[3px] hover:bg-slate-200/50 text-slate-400 hover:text-slate-900 transition-all opacity-0 group-hover:opacity-100"
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
                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Prospect Actions</p>
                        </div>
                        <button
                            className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-amber-50 hover:text-amber-700 flex items-center gap-3 transition-colors font-medium"
                            onClick={() => { onTogglePin(contextMenu.rowId); setContextMenu(null); }}
                        >
                            <Bookmark className={`w-4 h-4 ${data.find(r => r.id === contextMenu.rowId)?.isPinned ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`} />
                            {data.find(r => r.id === contextMenu.rowId)?.isPinned ? 'Unpin from Top' : 'Pin to Top'}
                        </button>
                        <button
                            className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-3 transition-colors font-medium"
                            onClick={() => { navigate(`/prospects/investor/${contextMenu.rowId}`); setContextMenu(null); }}
                        >
                            <Eye className="w-4 h-4 text-slate-400" />
                            View Full Profile
                        </button>
                        {!isRestricted && (
                            <button
                                className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-3 transition-colors font-medium"
                                onClick={() => { navigate(`/prospects/edit-investor/${contextMenu.rowId}`); setContextMenu(null); }}
                            >
                                <Zap className="w-4 h-4 text-slate-400" />
                                Edit & Enrich
                            </button>
                        )}
                        <div className="h-px bg-slate-50 my-1" />
                        {!isRestricted && (
                            <button
                                className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors font-medium"
                                onClick={() => {
                                    setSelectedIds(new Set([contextMenu.rowId]));
                                    setIsDeleteModalOpen(true);
                                    setContextMenu(null);
                                }}
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete Prospect
                            </button>
                        )}
                    </div>
                </>
            )}

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title={`Delete ${selectedIds.size} Prospect${selectedIds.size > 1 ? 's' : ''}`}
                itemType="investors"
                selectedIds={Array.from(selectedIds)}
            />
        </div>
    );
};
