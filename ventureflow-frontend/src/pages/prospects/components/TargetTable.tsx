import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable, { Column } from '../../../components/table/DataTable';
import { formatCompactBudget } from '../../../utils/formatters';
import {
    MoreVertical,
    Bookmark,
    Eye,
    Zap,
    Trash2,
} from 'lucide-react';
import api from '../../../config/api';
import { showAlert } from '../../../components/Alert';
import DeleteConfirmationModal from '../../../components/DeleteConfirmationModal';

export interface TargetRowData {
    id: number;
    addedDate: string;
    projectCode: string;
    companyName: string;
    originCountry: { name: string; flag: string };
    industry: string[];
    projectDetails: string;
    pipelineStatus: string;
    status: string;
    desiredInvestment: any;
    reasonForMA: string;
    saleShareRatio: string;
    rank: string;
    internalPIC: string[];
    primaryContact: string;
    primaryEmail: string;
    primaryPhone: string;
    website: string;
    teaserLink: string;
    ebitda: any;
    financialAdvisor: string[];
    introducedProjects: string[];
    isPinned?: boolean;
    sourceCurrencyRate?: number;
    channel?: string;
}

interface TargetTableProps {
    data: TargetRowData[];
    isLoading?: boolean;
    onTogglePin: (id: number) => void;
    visibleColumns: string[];
    selectedCurrency?: { id: number; code: string; symbol: string; rate: number; };
    onRefresh: () => void;
    isRestricted?: boolean;
    pagination?: {
        currentPage: number;
        totalPages: number;
        onPageChange: (page: number) => void;
        totalItems?: number;
        itemsPerPage?: number;
    };
}

export const TargetTable: React.FC<TargetTableProps> = ({
    data,
    isLoading,
    onTogglePin,
    visibleColumns,
    selectedCurrency,
    onRefresh,
    isRestricted = false,
    pagination
}) => {
    const navigate = useNavigate();
    const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, rowId: number } | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const contextMenuRef = useRef<HTMLDivElement>(null);

    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({
        key: 'projectCode',
        direction: 'asc'
    });

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
        if (stageIndex === -1) return { display: stageCode, stageName: stageCode };
        const stageName = pipelineStages[stageIndex].name;
        return { display: `Stage ${stageIndex + 1}/${totalStages}`, stageName: stageName };
    };

    const getBudgetDisplay = (budget: any, sourceRate?: number) => {
        const targetRate = selectedCurrency?.rate || 1;
        const sRate = sourceRate || 1;
        const conversionRate = targetRate / sRate;
        return formatCompactBudget(budget, selectedCurrency?.symbol || '$', conversionRate);
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
            showAlert({ type: 'error', message: error.response?.data?.message || 'Failed to delete items' });
        }
    };

    const columns: Column<TargetRowData>[] = useMemo(() => [
        {
            id: 'projectCode',
            header: 'Project Code',
            accessor: (row) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onTogglePin(row.id);
                        }}
                        className={`p-1 rounded transition-all duration-200 ${row.isPinned
                            ? "text-orange-500 bg-orange-50 hover:bg-orange-100"
                            : "text-slate-300 hover:text-slate-500 hover:bg-slate-50"}`}
                    >
                        <Bookmark className={`w-3.5 h-3.5 ${row.isPinned ? "fill-current" : ""}`} />
                    </button>
                    <span className="text-[13px] font-medium text-[#064771] bg-blue-50/50 px-2 py-1 rounded-md border border-blue-100/50">
                        {row.projectCode}
                    </span>
                </div>
            ),
            textAccessor: (row) => row.projectCode,
            width: 150,
            sortable: true,
            sticky: 'left'
        },
        {
            id: 'rank',
            header: 'Rank',
            accessor: (row) => (
                <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-medium ring-4 ${row.rank === 'A' ? 'bg-rose-50 text-rose-700 ring-rose-50/50' :
                    row.rank === 'B' ? 'bg-blue-50 text-blue-700 ring-blue-50/50' :
                        'bg-slate-100 text-slate-500 ring-slate-100/50'
                    }`}>
                    {row.rank || '-'}
                </div>
            ),
            width: 80,
            sortable: true,
        },
        {
            id: 'companyName',
            header: 'Company Name',
            accessor: (row) => (
                <div className="flex flex-col min-w-0">
                    <span className="text-[14px] font-medium text-slate-900 truncate tracking-tight">{row.companyName}</span>
                </div>
            ),
            textAccessor: (row) => row.companyName,
            width: 200,
            sortable: true,
        },
        {
            id: 'originCountry',
            header: 'HQ Country',
            accessor: (row) => (
                <div className="flex items-center gap-2">
                    {row.originCountry?.flag ? (
                        <img src={row.originCountry.flag} className="w-5 h-5 rounded-full object-cover ring-2 ring-slate-100 shadow-sm" alt="" />
                    ) : (
                        <div className="w-5 h-5 rounded-full bg-slate-100" />
                    )}
                    <span className="text-[13px] font-medium text-slate-600 truncate">{row.originCountry?.name || 'N/A'}</span>
                </div>
            ),
            textAccessor: (row) => row.originCountry?.name || '',
            width: 140,
            sortable: true,
        },
        {
            id: 'status',
            header: 'Status',
            accessor: (row) => <span className="text-[12px] font-medium text-slate-500 capitalize">{row.status}</span>,
            textAccessor: (row) => row.status,
            width: 100,
        },
        {
            id: 'industry',
            header: 'Industry',
            accessor: (row) => (
                <div className="flex flex-wrap gap-1">
                    {row.industry?.length ? (
                        <>
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-medium text-slate-600 truncate max-w-[120px]">
                                {row.industry[0]}
                            </span>
                            {row.industry.length > 1 && (
                                <span className="px-1.5 py-0.5 rounded-md bg-blue-50 text-[10px] font-medium text-blue-600">
                                    +{row.industry.length - 1}
                                </span>
                            )}
                        </>
                    ) : <span className="text-[11px] font-medium text-slate-300">N/A</span>}
                </div>
            ),
            textAccessor: (row) => row.industry?.join(', ') || '',
            width: 180,
        },
        {
            id: 'desiredInvestment',
            header: 'Desired Investment',
            accessor: (row) => (
                <div className="flex flex-col gap-0.5 items-end">
                    <span className="text-[13px] font-semibold text-slate-700">
                        {getBudgetDisplay(row.desiredInvestment, row.sourceCurrencyRate)}
                    </span>
                </div>
            ),
            textAccessor: (row) => formatCompactBudget(row.desiredInvestment, '$', 1),
            width: 160,
        },
        {
            id: 'ebitda',
            header: 'EBITDA',
            accessor: (row) => (
                <span className="text-[13px] font-medium text-slate-700">
                    {getBudgetDisplay(row.ebitda, row.sourceCurrencyRate)}
                </span>
            ),
            textAccessor: (row) => formatCompactBudget(row.ebitda, '$', 1),
            width: 140,
        },
        {
            id: 'saleShareRatio',
            header: 'Planned Ratio Sale',
            accessor: (row) => <span className="text-[12px] font-medium text-slate-600">{row.saleShareRatio || 'N/A'}</span>,
            textAccessor: (row) => row.saleShareRatio || '',
            width: 120,
        },
        {
            id: 'reasonForMA',
            header: 'Purpose of M&A',
            accessor: 'reasonForMA',
            width: 150,
        },
        {
            id: 'pipelineStatus',
            header: 'Pipeline Status',
            accessor: (row) => (
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 shadow-sm shadow-blue-200" />
                    <span className="text-[11px] font-medium text-slate-700 uppercase tracking-tighter">
                        {getStagePosition(row.pipelineStatus).display}
                    </span>
                </div>
            ),
            textAccessor: (row) => getStagePosition(row.pipelineStatus).display,
            width: 120,
        },
        {
            id: 'internalPIC',
            header: 'Assigned PIC',
            accessor: (row) => row.internalPIC?.join(', ') || 'Unassigned',
            width: 150,
        },
        {
            id: 'teaserLink',
            header: 'Teaser Profile',
            accessor: (row) => (
                row.teaserLink ? (
                    <a href={row.teaserLink} target="_blank" rel="noreferrer" className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded inline-flex items-center gap-1 hover:bg-emerald-100 transition-colors">
                        <Eye className="w-3 h-3" /> Teaser
                    </a>
                ) : <span className="text-[11px] text-slate-300">N/A</span>
            ),
            textAccessor: (row) => row.teaserLink || '',
            width: 120,
        },
        {
            id: 'addedDate',
            header: 'Added Date',
            accessor: (row) => <span className="text-[12px] text-slate-500 font-medium">{row.addedDate}</span>,
            textAccessor: (row) => row.addedDate || '',
            width: 100,
        }
    ], [pipelineStages, selectedCurrency]);

    const filteredColumns = useMemo(() =>
        columns.filter(col => visibleColumns.includes(col.id)),
        [columns, visibleColumns]
    );

    const ActionsColumn = (row: TargetRowData) => (
        <div className="flex items-center justify-end px-2">
            <button
                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-all"
                onClick={(e) => { e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, rowId: row.id }); }}
            >
                <MoreVertical className="w-4 h-4" />
            </button>
        </div>
    );

    const sortedData = useMemo(() => {
        if (!sortConfig.key || !sortConfig.direction) return data;

        return [...data].sort((a: any, b: any) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];

            if (aValue === bValue) return 0;
            if (aValue === null || aValue === undefined) return 1;
            if (bValue === null || bValue === undefined) return -1;

            const direction = sortConfig.direction === 'asc' ? 1 : -1;

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return aValue.localeCompare(bValue) * direction;
            }
            return (aValue > bValue ? 1 : -1) * direction;
        });
    }, [data, sortConfig]);

    return (
        <div className="w-full h-full flex flex-col min-h-0 relative">
            {/* Bulk Action Bar */}
            {selectedIds.size > 0 && !isRestricted && (
                <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-medium">
                                {selectedIds.size}
                            </div>
                            <span className="text-sm font-medium text-slate-700">
                                {selectedIds.size === 1 ? 'target' : 'targets'} selected
                            </span>
                        </div>
                        <button
                            onClick={() => setSelectedIds(new Set())}
                            className="text-xs text-slate-500 hover:text-slate-700 underline transition-colors"
                        >
                            Clear selection
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsDeleteModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-[3px] text-sm font-medium transition-all active:scale-95"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete Selected
                        </button>
                    </div>
                </div>
            )}
            <DataTable
                data={sortedData}
                columns={filteredColumns}
                isLoading={isLoading}
                onRowClick={(row) => navigate(`/prospects/target/${row.id}`)}
                onRowContextMenu={(e, row) => {
                    e.preventDefault();
                    setContextMenu({ x: e.clientX, y: e.clientY, rowId: row.id });
                }}
                selectable={!isRestricted}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                getRowId={(row) => row.id}
                actionsColumn={ActionsColumn}
                actionsColumnWidth={60}
                sortConfig={sortConfig}
                onSortChange={(key, direction) => setSortConfig({ key, direction })}
                pagination={pagination}
                className="flex-1 min-h-0"
                containerClassName="h-full flex flex-col"
            />

            {/* Context Menu */}
            {contextMenu && (
                <>
                    <div className="fixed inset-0 z-[90]" onClick={() => setContextMenu(null)} />
                    <div
                        ref={contextMenuRef}
                        className="fixed bg-white rounded-xl border border-slate-100 py-1.5 w-64 z-[100] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                        style={{ top: Math.min(contextMenu.y, window.innerHeight - 250), left: Math.min(contextMenu.x, window.innerWidth - 270) }}
                    >
                        <div className="px-4 py-2 border-b border-slate-50 mb-1">
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Target Actions</p>
                        </div>
                        <button
                            className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-amber-50 hover:text-amber-700 flex items-center gap-3 transition-colors"
                            onClick={() => { onTogglePin(contextMenu.rowId); setContextMenu(null); }}
                        >
                            <Bookmark className={`w-4 h-4 ${data.find(r => r.id === contextMenu.rowId)?.isPinned ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`} />
                            {data.find(r => r.id === contextMenu.rowId)?.isPinned ? 'Unpin from Top' : 'Pin to Top'}
                        </button>
                        <button
                            className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-3 transition-colors"
                            onClick={() => { navigate(`/prospects/target/${contextMenu.rowId}`); setContextMenu(null); }}
                        >
                            <Eye className="w-4 h-4 text-slate-400" />
                            View Full Profile
                        </button>
                        {!isRestricted && (
                            <button
                                className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-3 transition-colors"
                                onClick={() => { navigate(`/prospects/edit-target/${contextMenu.rowId}`); setContextMenu(null); }}
                            >
                                <Zap className="w-4 h-4 text-slate-400" />
                                Edit Project
                            </button>
                        )}
                        <div className="h-px bg-slate-50 my-1" />
                        {!isRestricted && (
                            <button
                                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors font-medium"
                                onClick={() => {
                                    setSelectedIds(new Set([contextMenu.rowId]));
                                    setIsDeleteModalOpen(true);
                                    setContextMenu(null);
                                }}
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete Target
                            </button>
                        )}
                    </div>
                </>
            )}

            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title={`Delete ${selectedIds.size} Target${selectedIds.size > 1 ? 's' : ''}`}
                itemType="targets"
                selectedIds={Array.from(selectedIds) as number[]}
            />
        </div>
    );
};
