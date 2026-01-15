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
import { Tooltip } from '../../../components/Tooltip';
import { formatCompactBudget, formatFullBudget } from '../../../utils/formatters';
import {
    MoreVertical,
    Filter,
    ArrowUpDown,
    CheckSquare,
    Square,
    Bookmark,
    Eye,
    Zap,
    ArrowUp,
    ArrowDown,
    ListFilter
} from 'lucide-react';

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
}

interface InvestorTableProps {
    data: InvestorRowData[];
    isLoading?: boolean;
    onTogglePin: (id: number) => void;
    onOpenFilter?: () => void;
    visibleColumns: string[];
    selectedCurrency?: { code: string, symbol: string, rate: number };
}

type SortKey = keyof InvestorRowData;
type SortDirection = 'asc' | 'desc' | null;

export const InvestorTable: React.FC<InvestorTableProps> = ({
    data,
    isLoading,
    onTogglePin,
    onOpenFilter,
    visibleColumns,
    selectedCurrency
}) => {
    const navigate = useNavigate();
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'projectCode', direction: null });
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, rowId: number } | null>(null);
    const contextMenuRef = useRef<HTMLDivElement>(null);

    // Column resizing state
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
        projectCode: 150,
        companyName: 240,
        hq: 140,
        targetCountries: 180,
        targetIndustries: 180,
        pipelineStatus: 140,
        budget: 160,
        companyType: 140,
        website: 200,
        email: 200,
        phone: 150,
        employeeCount: 130,
        yearFounded: 120,
    });

    const isResizing = useRef<string | null>(null);
    const startX = useRef<number>(0);
    const startWidth = useRef<number>(0);

    const handleMouseDown = (e: React.MouseEvent, column: string) => {
        e.preventDefault();
        isResizing.current = column;
        startX.current = e.pageX;
        startWidth.current = columnWidths[column] || 150;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isResizing.current) return;
        const diff = e.pageX - startX.current;
        const newWidth = Math.max(80, startWidth.current + diff);
        setColumnWidths(prev => ({ ...prev, [isResizing.current!]: newWidth }));
    };

    const handleMouseUp = () => {
        isResizing.current = null;
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };

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
        if (sortConfig.key !== column || !sortConfig.direction) return <ArrowUpDown className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />;
        return sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-[#064771]" /> : <ArrowDown className="w-3 h-3 text-[#064771]" />;
    };

    const getBudgetDisplay = (budget: any) => {
        return formatCompactBudget(budget, selectedCurrency?.symbol || '$');
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
            <div className="absolute right-0 top-0 h-full w-[1px] bg-gray-200 group-hover/handle:bg-[#064771] group-hover/handle:w-[2px] transition-all" />

            {/* The grab handle pill (visible on hover) */}
            <div className="absolute right-[-1px] top-1/2 -translate-y-1/2 h-8 w-[3px] bg-[#064771] rounded-full opacity-0 group-hover/handle:opacity-100 transition-all shadow-[0_0_10px_rgba(6,71,113,0.3)]" />
        </div>
    );

    return (
        <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative group/table">
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                <Table className="min-w-full table-fixed border-separate border-spacing-0">
                    <TableHeader>
                        <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 border-b border-gray-100">
                            <TableHead className="w-[60px] text-center sticky left-0 bg-gray-50/50 z-40 border-r border-gray-100">
                                <button
                                    onClick={toggleSelectMode}
                                    className="p-1.5 hover:bg-gray-200 rounded-lg transition-all focus:outline-none active:scale-90"
                                >
                                    {isSelectMode ? (
                                        <CheckSquare className="w-5 h-5 text-[#064771]" />
                                    ) : (
                                        <Square className="w-5 h-5 text-gray-300" />
                                    )}
                                </button>
                            </TableHead>

                            {isVisible('projectCode') && (
                                <TableHead
                                    style={{ width: columnWidths.projectCode }}
                                    className="relative group p-0 border-r border-gray-100 transition-colors hover:bg-gray-100/50"
                                >
                                    <div
                                        className="flex items-center gap-2 cursor-pointer select-none px-4 py-3 h-full"
                                        onClick={() => handleSort('projectCode')}
                                    >
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Code</span>
                                        <SortIcon column="projectCode" />
                                    </div>
                                    <ResizeHandle column="projectCode" />
                                </TableHead>
                            )}

                            {isVisible('companyName') && (
                                <TableHead
                                    style={{ width: columnWidths.companyName }}
                                    className="relative p-0 border-r border-gray-100 transition-colors hover:bg-gray-100/50"
                                >
                                    <div
                                        className="flex items-center gap-2 cursor-pointer group select-none px-4 py-3 h-full"
                                        onClick={() => handleSort('companyName')}
                                    >
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Company</span>
                                        <SortIcon column="companyName" />
                                    </div>
                                    <ResizeHandle column="companyName" />
                                </TableHead>
                            )}

                            {isVisible('hq') && (
                                <TableHead
                                    style={{ width: columnWidths.hq }}
                                    className="relative p-0 border-r border-gray-100 transition-colors hover:bg-gray-100/50"
                                >
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider px-4 py-3 block h-full">HQ</span>
                                    <ResizeHandle column="hq" />
                                </TableHead>
                            )}

                            {isVisible('targetCountries') && (
                                <TableHead
                                    style={{ width: columnWidths.targetCountries }}
                                    className="relative p-0 border-r border-gray-100 transition-colors hover:bg-gray-100/50"
                                >
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider px-4 py-3 block h-full">Target Countries</span>
                                    <ResizeHandle column="targetCountries" />
                                </TableHead>
                            )}

                            {isVisible('targetIndustries') && (
                                <TableHead
                                    style={{ width: columnWidths.targetIndustries }}
                                    className="relative p-0 border-r border-gray-100 transition-colors hover:bg-gray-100/50"
                                >
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider px-4 py-3 block h-full">Target Industries</span>
                                    <ResizeHandle column="targetIndustries" />
                                </TableHead>
                            )}

                            {isVisible('companyType') && (
                                <TableHead style={{ width: columnWidths.companyType }} className="relative p-0 border-r border-gray-100 transition-colors hover:bg-gray-100/50">
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider px-4 py-3 block h-full">Type</span>
                                    <ResizeHandle column="companyType" />
                                </TableHead>
                            )}
                            {isVisible('website') && (
                                <TableHead style={{ width: columnWidths.website }} className="relative p-0 border-r border-gray-100 transition-colors hover:bg-gray-100/50">
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider px-4 py-3 block h-full">Website</span>
                                    <ResizeHandle column="website" />
                                </TableHead>
                            )}

                            {isVisible('pipelineStatus') && (
                                <TableHead
                                    style={{ width: columnWidths.pipelineStatus }}
                                    className="relative p-0 border-r border-gray-100 transition-colors hover:bg-gray-100/50"
                                >
                                    <div
                                        className="flex items-center gap-2 cursor-pointer group select-none px-4 py-3 h-full"
                                        onClick={() => handleSort('pipelineStatus')}
                                    >
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pipeline</span>
                                        <SortIcon column="pipelineStatus" />
                                    </div>
                                    <ResizeHandle column="pipelineStatus" />
                                </TableHead>
                            )}

                            {isVisible('budget') && (
                                <TableHead
                                    style={{ width: columnWidths.budget }}
                                    className="relative p-0 border-r border-gray-100 transition-colors hover:bg-gray-100/50"
                                >
                                    <div
                                        className="flex items-center gap-2 cursor-pointer group select-none px-4 py-3 h-full"
                                        onClick={() => handleSort('budget')}
                                    >
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Budget</span>
                                        <SortIcon column="budget" />
                                    </div>
                                    <ResizeHandle column="budget" />
                                </TableHead>
                            )}

                            <TableHead className="text-right w-[120px] pr-6 sticky right-0 bg-gray-50/50 z-40 border-l border-gray-100">
                                <div className="flex items-center justify-end gap-2">
                                    <button
                                        className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg text-gray-500 border border-gray-100 transition-all active:scale-95"
                                        onClick={onOpenFilter}
                                        title="Advanced Filters"
                                    >
                                        <Filter className="w-4 h-4" />
                                    </button>
                                    <button
                                        className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg text-gray-500 border border-gray-100 transition-all active:scale-95"
                                        title="General Sorting"
                                    >
                                        <ListFilter className="w-4 h-4 rotate-180" />
                                    </button>
                                </div>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={visibleColumns.length + 2} className="h-48 text-center text-gray-400">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#064771]"></div>
                                        <span className="text-sm font-medium">Loading investors...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : sortedData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={visibleColumns.length + 2} className="h-48 text-center text-gray-400">
                                    <p className="text-lg font-medium">No investors found</p>
                                    <p className="text-sm">Try adjusting your search or filters</p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            sortedData.map((row) => (
                                <TableRow
                                    key={row.id}
                                    onContextMenu={(e) => handleContextMenu(e, row.id)}
                                    onClick={() => navigate(`/buyer-portal/view/${row.id}`)}
                                    className={`
                                        group transition-all duration-200 border-l-[3px] border-b border-gray-100 cursor-pointer
                                        ${selectedIds.has(row.id) ? 'bg-blue-50/80 border-l-[#064771]' : 'hover:bg-gray-50 bg-white border-l-transparent hover:border-l-[#064771]'}
                                        ${row.isPinned ? 'bg-amber-50/30' : ''}
                                    `}
                                >
                                    <TableCell className="text-center sticky left-0 bg-inherit z-20 border-b border-gray-100" onClick={(e) => e.stopPropagation()}>
                                        {isSelectMode ? (
                                            <Checkbox
                                                checked={selectedIds.has(row.id)}
                                                onChange={(e) => handleSelectRow(row.id, e.target.checked)}
                                            />
                                        ) : (
                                            row.isPinned && <Bookmark className="w-4 h-4 text-amber-500 fill-amber-500 mx-auto" />
                                        )}
                                    </TableCell>

                                    {isVisible('projectCode') && (
                                        <TableCell className="font-semibold text-[#064771] border-b border-gray-100">
                                            <Tooltip content={row.projectCode}>
                                                <div className="flex items-center gap-2">
                                                    {row.projectCode}
                                                </div>
                                            </Tooltip>
                                        </TableCell>
                                    )}

                                    {isVisible('companyName') && (
                                        <TableCell className="text-gray-900 font-bold text-[14px] border-b border-gray-100">
                                            <Tooltip content={row.companyName}>
                                                <span className="truncate block">{row.companyName}</span>
                                            </Tooltip>
                                        </TableCell>
                                    )}

                                    {isVisible('hq') && (
                                        <TableCell className="border-b border-gray-100">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                {row.hq.flag ? (
                                                    <img src={row.hq.flag} alt={row.hq.name} className="w-5 h-5 rounded-full object-cover shadow-sm ring-1 ring-gray-100 shrink-0" />
                                                ) : (
                                                    <div className="w-5 h-5 rounded-full bg-gray-200 shrink-0" />
                                                )}
                                                <Tooltip content={row.hq.name}>
                                                    <span className="text-gray-700 text-sm font-medium truncate">{row.hq.name}</span>
                                                </Tooltip>
                                            </div>
                                        </TableCell>
                                    )}

                                    {isVisible('targetCountries') && (
                                        <TableCell className="border-b border-gray-100">
                                            {Array.isArray(row.targetCountries) && row.targetCountries.length > 0 ? (
                                                <Tooltip content={row.targetCountries.map(c => c.name).join(', ')}>
                                                    <div className="flex items-center gap-1.5 bg-gray-100/50 px-2.5 py-1 rounded-full border border-gray-200 w-fit max-w-full overflow-hidden">
                                                        <img src={row.targetCountries[0].flag || ""} alt={row.targetCountries[0].name} className="w-3.5 h-3.5 rounded-full shadow-sm shrink-0" />
                                                        <span className="text-gray-700 text-xs font-semibold truncate">{row.targetCountries[0].name}</span>
                                                        {row.targetCountries.length > 1 && (
                                                            <span className="text-[10px] font-bold text-gray-400 ml-0.5 shrink-0">
                                                                +{row.targetCountries.length - 1}
                                                            </span>
                                                        )}
                                                    </div>
                                                </Tooltip>
                                            ) : (
                                                <span className="text-gray-400 text-xs font-medium italic pl-2">Global</span>
                                            )}
                                        </TableCell>
                                    )}

                                    {isVisible('targetIndustries') && (
                                        <TableCell className="border-b border-gray-100">
                                            {Array.isArray(row.targetIndustries) && row.targetIndustries.length > 0 ? (
                                                <Tooltip content={row.targetIndustries.join(', ')}>
                                                    <div className="flex items-center gap-1.5 max-w-full">
                                                        <span className="text-gray-700 text-xs font-semibold bg-gray-100/80 px-2.5 py-1 rounded-full truncate">{row.targetIndustries[0]}</span>
                                                        {row.targetIndustries.length > 1 && (
                                                            <span className="text-[10px] font-bold text-[#064771] bg-blue-50 px-1.5 py-0.5 rounded-lg border border-blue-100 shrink-0">
                                                                +{row.targetIndustries.length - 1}
                                                            </span>
                                                        )}
                                                    </div>
                                                </Tooltip>
                                            ) : (
                                                <span className="text-gray-400 text-xs font-medium italic pl-2">N/A</span>
                                            )}
                                        </TableCell>
                                    )}

                                    {isVisible('companyType') && (
                                        <TableCell className="border-b border-gray-100">
                                            <Tooltip content={row.companyType}>
                                                <span className="text-gray-600 text-sm truncate block">{row.companyType || 'N/A'}</span>
                                            </Tooltip>
                                        </TableCell>
                                    )}

                                    {isVisible('website') && (
                                        <TableCell className="border-b border-gray-100">
                                            <Tooltip content={row.website}>
                                                <span className="text-blue-600 text-sm truncate block underline decoration-blue-200">{row.website || 'N/A'}</span>
                                            </Tooltip>
                                        </TableCell>
                                    )}

                                    {isVisible('pipelineStatus') && (
                                        <TableCell className="border-b border-gray-100">
                                            <span className={`
                                                px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm border whitespace-nowrap
                                                ${row.pipelineStatus === 'N/A' || row.pipelineStatus === 'Unknown' ? 'bg-gray-100 text-gray-500 border-gray-200' :
                                                    row.pipelineStatus === 'NDA' ? 'bg-blue-100 text-[#064771] border-blue-200' :
                                                        row.pipelineStatus === 'SOURCING' ? 'bg-[#064771] text-white border-[#064771]' :
                                                            'bg-green-100 text-green-700 border-green-200'}
                                            `}>
                                                {row.pipelineStatus}
                                            </span>
                                        </TableCell>
                                    )}

                                    {isVisible('budget') && (
                                        <TableCell className="font-bold text-gray-900 text-sm border-b border-gray-100">
                                            <Tooltip content={formatFullBudget(row.budget, selectedCurrency?.symbol)}>
                                                <span className="whitespace-nowrap">{getBudgetDisplay(row.budget)}</span>
                                            </Tooltip>
                                        </TableCell>
                                    )}

                                    <TableCell className="text-right pr-6 sticky right-0 bg-inherit z-20 border-l border-gray-100 border-b border-gray-100" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded-lg text-gray-400 hover:text-[#064771] transition-all"
                                            onClick={(e) => { e.stopPropagation(); handleContextMenu(e, row.id); }}
                                        >
                                            <MoreVertical className="w-4 h-4" />
                                        </button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <div
                    ref={contextMenuRef}
                    className="fixed bg-white rounded-xl shadow-2xl border border-gray-100 py-2 w-56 z-[100] animate-in fade-in zoom-in-95 duration-100 shadow-[#00000015]"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                >
                    <button
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700 flex items-center gap-3 transition-colors group"
                        onClick={() => { onTogglePin(contextMenu.rowId); setContextMenu(null); }}
                    >
                        <Bookmark className={`w-4 h-4 ${data.find(r => r.id === contextMenu.rowId)?.isPinned ? 'fill-amber-500 text-amber-500' : 'text-gray-400 group-hover:text-amber-500'}`} />
                        <span className="font-medium">{data.find(r => r.id === contextMenu.rowId)?.isPinned ? 'Unbookmark' : 'Bookmark (Pin)'}</span>
                    </button>
                    <button
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-[#064771] flex items-center gap-3 transition-colors group"
                        onClick={() => { navigate(`/buyer-portal/view/${contextMenu.rowId}`); setContextMenu(null); }}
                    >
                        <Eye className="w-4 h-4 text-gray-400 group-hover:text-[#064771]" />
                        <span className="font-medium">View Details</span>
                    </button>
                    <button
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-3 transition-colors group"
                        onClick={() => { navigate(`/buyer-portal/edit/${contextMenu.rowId}`); setContextMenu(null); }}
                    >
                        <Zap className="w-4 h-4 text-gray-400 group-hover:text-indigo-600" />
                        <span className="font-medium">Enrich Details</span>
                    </button>
                </div>
            )}
        </div>
    );
};
