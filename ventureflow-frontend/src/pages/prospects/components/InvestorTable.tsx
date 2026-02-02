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

export interface InvestorRowData {
    id: number;
    projectCode: string;
    companyName: string;
    originCountry: { name: string; flag: string };
    targetCountries: { name: string; flag: string }[];
    targetIndustries: string[];
    pipelineStatus: string;
    budget: any;
    investmentCondition: string;
    purposeMNA: string;
    internalPIC: string[];
    financialAdvisor: string[];
    introducedProjects: string[];
    investorProfile: string;
    isPinned?: boolean;
    website?: string;
    email?: string;
    phone?: string;
    rank?: string;
    primaryContact?: string;
    sourceCurrencyRate?: number;
    channel?: string;
}

interface InvestorTableProps {
    data: InvestorRowData[];
    isLoading: boolean;
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

export const InvestorTable: React.FC<InvestorTableProps> = ({
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

    // Pipeline stages for investor pipeline
    const [pipelineStages, setPipelineStages] = useState<{ code: string; name: string; order_index: number }[]>([]);

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
            const response = await api.delete('/api/buyers', {
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

    const columns: Column<InvestorRowData>[] = useMemo(() => [
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
            width: 150,
            sortable: true,
            sticky: 'left'
        },
        {
            id: 'rank',
            header: 'Rank',
            accessor: (row) => (
                <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-medium ring-4 ${row.rank === 'A' ? 'bg-emerald-50 text-emerald-700 ring-emerald-50/50' :
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
            width: 200,
            sortable: true,
        },
        {
            id: 'originCountry',
            header: 'Origin Country',
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
            width: 140,
            sortable: true,
        },
        {
            id: 'website',
            header: 'Website',
            accessor: (row) => (
                <a href={row.website?.startsWith('http') ? row.website : `https://${row.website}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm block truncate">
                    {row.website?.replace(/^https?:\/\//, '') || 'N/A'}
                </a>
            ),
            width: 160,
        },
        {
            id: 'targetIndustries',
            header: 'Target Industries',
            accessor: (row) => (
                <div className="flex flex-wrap gap-1">
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
            ),
            width: 200,
        },
        {
            id: 'targetCountries',
            header: 'Target Countries',
            accessor: (row) => (
                row.targetCountries?.length ? (
                    <div className="flex items-center gap-1.5">
                        <div className="flex -space-x-1.5 overflow-hidden">
                            {row.targetCountries.slice(0, 3).map((c, i) => (
                                <img key={i} src={c.flag} className="w-5 h-5 rounded-full border border-white object-cover shadow-sm" alt="" />
                            ))}
                        </div>
                        <span className="text-[12px] font-medium text-slate-600 truncate">
                            {row.targetCountries[0].name}
                            {row.targetCountries.length > 1 && ` +${row.targetCountries.length - 1}`}
                        </span>
                    </div>
                ) : <span className="text-[11px] font-medium text-slate-300">N/A</span>
            ),
            width: 200,
        },
        {
            id: 'purposeMNA',
            header: 'Purpose of M&A',
            accessor: 'purposeMNA',
            width: 150,
        },
        {
            id: 'budget',
            header: 'Budget',
            accessor: (row) => (
                <div className="flex flex-col gap-0.5">
                    <span className="text-[13px] font-semibold text-slate-700">
                        {getBudgetDisplay(row.budget, row.sourceCurrencyRate)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                        {row.budget?.currency || 'USD'}
                    </span>
                </div>
            ),
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
            width: 120,
        },
        {
            id: 'primaryContact',
            header: 'Primary Contact',
            accessor: 'primaryContact',
            width: 150,
        },
        {
            id: 'internalPIC',
            header: 'Internal PIC',
            accessor: (row) => row.internalPIC?.join(', ') || 'N/A',
            width: 150,
        }
    ], [pipelineStages, selectedCurrency]);

    const filteredColumns = useMemo(() =>
        columns.filter(col => visibleColumns.includes(col.id)),
        [columns, visibleColumns]
    );

    const ActionsColumn = (row: InvestorRowData) => (
        <div className="flex items-center justify-end px-2">
            <button
                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-all"
                onClick={(e) => { e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, rowId: row.id }); }}
            >
                <MoreVertical className="w-4 h-4" />
            </button>
        </div>
    );

    return (
        <div className="w-full h-full flex flex-col min-h-0 relative">
            <DataTable
                data={data}
                columns={filteredColumns}
                isLoading={isLoading}
                onRowClick={(row) => {
                    // Trigger menu instead of navigation per user request
                    const target = document.querySelector(`[data-row-id="${row.id}"]`) as HTMLElement;
                    const rect = target?.getBoundingClientRect();
                    setContextMenu({
                        x: rect ? rect.right - 100 : window.innerWidth / 2,
                        y: rect ? rect.top + 20 : window.innerHeight / 2,
                        rowId: row.id
                    });
                }}
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
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Prospect Actions</p>
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
                            onClick={() => { navigate(`/prospects/investor/${contextMenu.rowId}`); setContextMenu(null); }}
                        >
                            <Eye className="w-4 h-4 text-slate-400" />
                            View Full Profile
                        </button>
                        {!isRestricted && (
                            <button
                                className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-3 transition-colors"
                                onClick={() => { navigate(`/prospects/edit-investor/${contextMenu.rowId}`); setContextMenu(null); }}
                            >
                                <Zap className="w-4 h-4 text-slate-400" />
                                Edit & Enrich
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
                                Delete Prospect
                            </button>
                        )}
                    </div>
                </>
            )}

            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title={`Delete ${selectedIds.size} Prospect${selectedIds.size > 1 ? 's' : ''}`}
                itemType="investors"
                selectedIds={Array.from(selectedIds) as number[]}
            />
        </div>
    );
};
