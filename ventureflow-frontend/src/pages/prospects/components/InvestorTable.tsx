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
    Copy,
    Plus
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
    investmentCondition: string[];
    purposeMNA: string[];
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
    companyIndustry?: string[];
}

/* Helper to parse multi-select fields which may be stored as string, JSON string, or array */
const parseMultiField = (val: any): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val.filter(Boolean);
    if (typeof val === 'string') {
        try { const p = JSON.parse(val); if (Array.isArray(p)) return p.filter(Boolean); } catch { }
        return val ? [val] : [];
    }
    return [];
};

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

    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({
        key: 'projectCode',
        direction: 'asc'
    });

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
            return { display: 'N/A', stageName: 'N/A' };
        }
        const safeStageCode = String(stageCode);
        const totalStages = pipelineStages.length;
        const stageIndex = pipelineStages.findIndex(
            s => (s.code && String(s.code).toUpperCase() === safeStageCode.toUpperCase()) || (s.name && String(s.name).toUpperCase() === safeStageCode.toUpperCase())
        );
        if (stageIndex === -1) return { display: 'N/A', stageName: 'N/A' };
        const stageName = pipelineStages[stageIndex].name;
        return { display: `Stage ${stageIndex + 1}/${totalStages}`, stageName: stageName };
    };

    const getBudgetDisplay = (budget: any, sourceRate?: number) => {
        const targetRate = selectedCurrency?.rate || 1;
        const sRate = sourceRate || 1;
        const conversionRate = targetRate / sRate;
        return formatCompactBudget(budget, selectedCurrency?.symbol || '$', conversionRate);
    };

    const parseWebsiteUrl = (website: any): string => {
        if (!website) return '';

        // Handle array format (new backend format via model cast)
        if (Array.isArray(website)) {
            if (website.length > 0 && website[0]?.url) {
                return website[0].url;
            }
            return '';
        }

        // Handle string input
        if (typeof website === 'string') {
            try {
                // Handle JSON string format like [{"url":"..."}]
                if (website.trim().startsWith('[')) {
                    const parsed = JSON.parse(website);
                    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].url) {
                        return parsed[0].url;
                    }
                }
            } catch (e) {
                // If parse fails, assume it's a plain string URL
            }
            return website;
        }

        return '';
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        showAlert({ type: 'success', message: 'Website URL copied to clipboard' });
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
                            : "text-gray-400 hover:text-gray-500 hover:bg-gray-50"}`}
                    >
                        <Bookmark className={`w-3.5 h-3.5 ${row.isPinned ? "fill-current" : ""}`} />
                    </button>
                    <span className="text-[13px] font-normal text-[#064771] bg-[#EDF8FF] px-2 py-0.5 rounded-[3px]">
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
                <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-[3px] text-[13px] font-normal ${row.rank === 'A' ? 'bg-[#ECFDF5] text-[#065F46]' :
                    row.rank === 'B' ? 'bg-[#FEFCE8] text-[#854D0E]' :
                        row.rank === 'C' ? 'bg-[#FFF7ED] text-[#9A3412]' :
                            'bg-[#f3f4f6] text-gray-500'
                    }`}>
                    {row.rank || '-'}
                </span>
            ),
            width: 80,
            sortable: true,
        },
        {
            id: 'companyName',
            header: 'Company Name',
            accessor: (row) => (
                <div className="flex flex-col min-w-0">
                    <span className="text-[14px] font-normal text-gray-900 truncate tracking-tight">{row.companyName}</span>
                </div>
            ),
            textAccessor: (row) => row.companyName,
            width: 200,
            sortable: true,
        },
        {
            id: 'companyIndustry',
            header: 'Industry',
            accessor: (row) => (
                <div className="flex flex-wrap gap-1">
                    {row.companyIndustry?.length ? (
                        <>
                            <span className="px-2 py-0.5 rounded-[3px] bg-[#f3f4f6] text-[13px] font-normal text-gray-600 truncate max-w-[120px]">
                                {row.companyIndustry[0]}
                            </span>
                            {row.companyIndustry.length > 1 && (
                                <span className="px-1.5 py-0.5 rounded-[3px] bg-[#EDF8FF] text-[13px] font-normal text-[#064771]">
                                    +{row.companyIndustry.length - 1}
                                </span>
                            )}
                        </>
                    ) : <span className="text-[13px] font-normal text-gray-400">N/A</span>}
                </div>
            ),
            textAccessor: (row) => row.companyIndustry?.join(', ') || '',
            width: 200,
        },
        {
            id: 'originCountry',
            header: 'Origin Country',
            accessor: (row) => (
                <div className="flex items-center gap-2">
                    {row.originCountry?.flag ? (
                        <img src={row.originCountry.flag} className="w-5 h-5 rounded-full object-cover" alt="" />
                    ) : (
                        <div className="w-5 h-5 rounded-full bg-gray-100" />
                    )}
                    <span className="text-[13px] font-normal text-gray-600 truncate">{row.originCountry?.name || 'N/A'}</span>
                </div>
            ),
            textAccessor: (row) => row.originCountry?.name || '',
            width: 140,
            sortable: true,
        },
        {
            id: 'website',
            header: 'Website',
            accessor: (row) => {
                const url = parseWebsiteUrl(row.website);
                if (!url) return <span className="text-gray-400 text-sm">N/A</span>;

                const displayUrl = url.startsWith('http') ? url : `https://${url}`;

                return (
                    <div className="group flex items-center gap-1.5 max-w-full">
                        <a
                            href={displayUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 bg-[#f3f4f6] text-gray-600 hover:bg-gray-200 px-2 py-0.5 rounded-[3px] text-[13px] font-normal transition-colors"
                        >
                            <Eye className="w-3 h-3" /> View
                        </a>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                copyToClipboard(displayUrl);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded-[3px] hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all duration-200"
                            title="Copy URL"
                        >
                            <Copy className="w-3.5 h-3.5" />
                        </button>
                    </div>
                );
            },
            textAccessor: (row) => parseWebsiteUrl(row.website),
            width: 160,
        },
        {
            id: 'targetIndustries',
            header: 'Target Industry',
            accessor: (row) => (
                <div className="flex flex-wrap gap-1">
                    {row.targetIndustries?.length ? (
                        <>
                            <span className="px-2 py-0.5 rounded-[3px] bg-[#f3f4f6] text-[13px] font-normal text-gray-600 truncate max-w-[120px]">
                                {row.targetIndustries[0]}
                            </span>
                            {row.targetIndustries.length > 1 && (
                                <span className="px-1.5 py-0.5 rounded-[3px] bg-[#EDF8FF] text-[13px] font-normal text-[#064771]">
                                    +{row.targetIndustries.length - 1}
                                </span>
                            )}
                        </>
                    ) : <span className="text-[13px] font-normal text-gray-400">N/A</span>}
                </div>
            ),
            textAccessor: (row) => row.targetIndustries?.join(', ') || '',
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
                        <span className="text-[13px] font-normal text-gray-600 truncate">
                            {row.targetCountries[0].name}
                            {row.targetCountries.length > 1 && ` +${row.targetCountries.length - 1}`}
                        </span>
                    </div>
                ) : <span className="text-[13px] font-normal text-gray-400">N/A</span>
            ),
            textAccessor: (row) => row.targetCountries?.map(c => c.name).join(', ') || '',
            width: 200,
        },
        {
            id: 'purposeMNA',
            header: 'Purpose of M&A',
            accessor: (row) => {
                const items = parseMultiField(row.purposeMNA);
                if (!items.length) return <span className="text-[13px] font-normal text-gray-400">N/A</span>;
                if (items.length === 1) return <span className="text-[13px] text-gray-600">{items[0]}</span>;
                return (
                    <div className="flex flex-wrap gap-1">
                        <span className="px-2 py-0.5 rounded-[3px] bg-[#f3f4f6] text-[13px] font-normal text-gray-600 truncate max-w-[120px]">{items[0]}</span>
                        <span className="px-1.5 py-0.5 rounded-[3px] bg-[#EDF8FF] text-[13px] font-normal text-[#064771]">+{items.length - 1}</span>
                    </div>
                );
            },
            textAccessor: (row) => parseMultiField(row.purposeMNA).join(', '),
            width: 170,
        },
        {
            id: 'budget',
            header: 'Budget',
            accessor: (row) => (
                <div className="flex flex-col gap-0.5">
                    <span className="text-[13px] font-normal text-gray-700">
                        {getBudgetDisplay(row.budget, row.sourceCurrencyRate)}
                    </span>
                </div>
            ),
            textAccessor: (row) => formatCompactBudget(row.budget, '$', 1), // Approximate for sizing
            width: 150,
        },
        {
            id: 'pipelineStatus',
            header: 'Pipeline',
            accessor: (row) => {
                const stageInfo = getStagePosition(row.pipelineStatus);
                return (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-[3px] bg-[#f3f4f6] text-[13px] font-normal text-gray-600 uppercase tracking-tighter">
                        {stageInfo.display}
                    </span>
                );
            },
            textAccessor: (row) => getStagePosition(row.pipelineStatus).display,
            width: 120,
        },
        {
            id: 'primaryContact',
            header: 'Contact',
            accessor: 'primaryContact',
            width: 150,
        },
        {
            id: 'internalPIC',
            header: 'Assigned PIC',
            accessor: (row) => row.internalPIC?.join(', ') || 'N/A',
            width: 150,
        },
        {
            id: 'investmentCondition',
            header: 'Condition',
            accessor: (row) => {
                const items = parseMultiField(row.investmentCondition);
                if (!items.length) return <span className="text-[13px] font-normal text-gray-400">N/A</span>;
                if (items.length === 1) return <span className="text-[13px] text-gray-600">{items[0]}</span>;
                return (
                    <div className="flex flex-wrap gap-1">
                        <span className="px-2 py-0.5 rounded-[3px] bg-[#f3f4f6] text-[13px] font-normal text-gray-600 truncate max-w-[120px]">{items[0]}</span>
                        <span className="px-1.5 py-0.5 rounded-[3px] bg-[#EDF8FF] text-[13px] font-normal text-[#064771]">+{items.length - 1}</span>
                    </div>
                );
            },
            textAccessor: (row) => parseMultiField(row.investmentCondition).join(', '),
            width: 160,
        },
        {
            id: 'financialAdvisor',
            header: 'Partner FA',
            accessor: (row) => row.financialAdvisor?.join(', ') || 'N/A',
            width: 150,
        },
        {
            id: 'investorProfileLink',
            header: 'Investor Profile',
            accessor: (row) => (
                row.investorProfile ? (
                    <a href={row.investorProfile} target="_blank" rel="noreferrer" className="text-[13px] font-normal text-gray-600 bg-[#f3f4f6] px-2 py-0.5 rounded-[3px] inline-flex items-center gap-1 hover:bg-gray-200 transition-colors">
                        <Eye className="w-3 h-3" /> View
                    </a>
                ) : <span className="text-[13px] text-gray-400">N/A</span>
            ),
            textAccessor: (row) => row.investorProfile || '',
            width: 130,
        }
    ], [pipelineStages, selectedCurrency]);

    const filteredColumns = useMemo(() =>
        columns.filter(col => visibleColumns.includes(col.id)),
        [columns, visibleColumns]
    );

    const ActionsColumn = (row: InvestorRowData) => (
        <div className="flex items-center justify-end px-2">
            <button
                className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-all"
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
                <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-medium">
                                {selectedIds.size}
                            </div>
                            <span className="text-sm font-medium text-gray-700">
                                {selectedIds.size === 1 ? 'investor' : 'investors'} selected
                            </span>
                        </div>
                        <button
                            onClick={() => setSelectedIds(new Set())}
                            className="text-xs text-gray-500 hover:text-gray-700 underline transition-colors"
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
                onRowClick={(row) => navigate(`/prospects/investor/${row.id}`)}
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
                emptyAction={!isRestricted && (
                    <button
                        onClick={() => navigate('/prospects/add-investor')}
                        className="flex items-center gap-2 px-4 py-2 bg-[#064771] text-white rounded-[3px] text-sm font-medium hover:bg-[#053a5c] transition-all active:scale-95 shadow-sm shadow-[#064771]/10"
                    >
                        <Plus className="w-4 h-4" />
                        Add New Investor
                    </button>
                )}
                className="flex-1 min-h-0"
                containerClassName="h-full flex flex-col"
            />

            {/* Context Menu */}
            {contextMenu && (
                <>
                    <div className="fixed inset-0 z-[90]" onClick={() => setContextMenu(null)} />
                    <div
                        ref={contextMenuRef}
                        className="fixed bg-white rounded-xl border border-gray-100 py-1.5 w-64 z-[100] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                        style={{ top: Math.min(contextMenu.y, window.innerHeight - 250), left: Math.min(contextMenu.x, window.innerWidth - 270) }}
                    >
                        <div className="px-4 py-2 border-b border-gray-50 mb-1">
                            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Prospect Actions</p>
                        </div>
                        <button
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-amber-50 hover:text-amber-700 flex items-center gap-3 transition-colors"
                            onClick={() => { onTogglePin(contextMenu.rowId); setContextMenu(null); }}
                        >
                            <Bookmark className={`w-4 h-4 ${data.find(r => r.id === contextMenu.rowId)?.isPinned ? 'fill-amber-500 text-amber-500' : 'text-gray-400'}`} />
                            {data.find(r => r.id === contextMenu.rowId)?.isPinned ? 'Unpin from Top' : 'Pin to Top'}
                        </button>
                        <button
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-3 transition-colors"
                            onClick={() => { navigate(`/prospects/investor/${contextMenu.rowId}`); setContextMenu(null); }}
                        >
                            <Eye className="w-4 h-4 text-gray-400" />
                            View Full Profile
                        </button>
                        {!isRestricted && (
                            <button
                                className="w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-3 transition-colors"
                                onClick={() => { navigate(`/prospects/edit-investor/${contextMenu.rowId}`); setContextMenu(null); }}
                            >
                                <Zap className="w-4 h-4 text-gray-400" />
                                Edit & Enrich
                            </button>
                        )}
                        <div className="h-px bg-gray-50 my-1" />
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
