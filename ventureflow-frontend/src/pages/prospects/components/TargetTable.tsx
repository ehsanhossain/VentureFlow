/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable, { Column } from '../../../components/table/DataTable';
import { formatCompactBudget, formatFullBudget } from '../../../utils/formatters';
import CellTooltip from '../../../components/table/CellTooltip';
import {
    MoreVertical,
    Copy,
    Zap,
    Trash2,
    Plus,
    Download
} from 'lucide-react';
import { ProfileViewIcon, WebsiteIcon, PinnedIcon, UnpinnedIcon } from '../../../components/table/TableIcons';
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
    reasonForMA: string[];
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
    investmentCondition?: string[];
}

/* Helper to parse multi-select fields which may be stored as string, JSON string, or array */
const parseMultiField = (val: any): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val.filter(Boolean);
    if (typeof val === 'string') {
        try { const p = JSON.parse(val); if (Array.isArray(p)) return p.filter(Boolean); } catch { /* ignored */ }
        return val ? [val] : [];
    }
    return [];
};

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
    const [bulkMenuOpen, setBulkMenuOpen] = useState(false);
    const contextMenuRef = useRef<HTMLDivElement>(null);
    const bulkMenuRef = useRef<HTMLDivElement>(null);

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

    const getFullBudgetDisplay = (budget: any, sourceRate?: number) => {
        const targetRate = selectedCurrency?.rate || 1;
        const sRate = sourceRate || 1;
        const conversionRate = targetRate / sRate;
        return formatFullBudget(budget, selectedCurrency?.symbol || '$', conversionRate);
    };

    const parseWebsiteUrl = (website: any): string => {
        if (!website) return '';
        if (Array.isArray(website)) {
            if (website.length > 0 && website[0]?.url) return website[0].url;
            return '';
        }
        if (typeof website === 'string') {
            try {
                if (website.trim().startsWith('[')) {
                    const parsed = JSON.parse(website);
                    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].url) return parsed[0].url;
                }
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (e) { /* plain string URL */ }
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

    const handleExportCSV = () => {
        const selectedRows = data.filter(r => selectedIds.has(r.id));
        if (!selectedRows.length) return;
        const headers = ['Project Code', 'Company Name', 'Origin Country', 'Industry', 'Project Details', 'Pipeline Status', 'Status', 'Desired Investment', 'Reason for M&A', 'Rank', 'Internal PIC', 'Primary Contact', 'Primary Email', 'Primary Phone', 'Website', 'Teaser Link', 'EBITDA', 'Financial Advisor', 'Introduced Projects', 'Channel', 'Investment Condition'];
        const rows = selectedRows.map(r => [
            r.projectCode || '',
            r.companyName || '',
            r.originCountry?.name || '',
            (r.industry || []).join('; '),
            r.projectDetails || '',
            r.pipelineStatus || '',
            r.status || '',
            typeof r.desiredInvestment === 'object' ? JSON.stringify(r.desiredInvestment) : (r.desiredInvestment || ''),
            parseMultiField(r.reasonForMA).join('; '),
            r.rank || '',
            (r.internalPIC || []).join('; '),
            r.primaryContact || '',
            r.primaryEmail || '',
            r.primaryPhone || '',
            r.website || '',
            r.teaserLink || '',
            typeof r.ebitda === 'object' ? JSON.stringify(r.ebitda) : (r.ebitda || ''),
            (r.financialAdvisor || []).join('; '),
            (r.introducedProjects || []).join('; '),
            r.channel || '',
            parseMultiField(r.investmentCondition).join('; ')
        ]);
        const csvContent = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `targets_export_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        setBulkMenuOpen(false);
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
                        className="p-1 rounded transition-all duration-200 hover:bg-gray-50"
                        aria-label={row.isPinned ? 'Unpin target' : 'Pin target'}
                    >
                        {row.isPinned ? <PinnedIcon className="w-5 h-5" /> : <UnpinnedIcon className="w-5 h-5" />}
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
                            <WebsiteIcon className="w-3.5 h-3.5" /> Visit
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
            id: 'industry',
            header: 'Industry',
            accessor: (row) => (
                <CellTooltip
                    enabled={!!row.industry && row.industry.length > 1}
                    content={<ul className="list-disc pl-4 space-y-0.5">{row.industry?.map((item, i) => <li key={i}>{item}</li>)}</ul>}
                >
                    <div className="flex flex-wrap gap-1">
                        {row.industry?.length ? (
                            <>
                                <span className="px-2 py-0.5 rounded-[3px] bg-[#f3f4f6] text-[13px] font-normal text-gray-600 truncate max-w-[120px]">
                                    {row.industry[0]}
                                </span>
                                {row.industry.length > 1 && (
                                    <span className="px-1.5 py-0.5 rounded-[3px] bg-[#EDF8FF] text-[13px] font-normal text-[#064771]">
                                        +{row.industry.length - 1}
                                    </span>
                                )}
                            </>
                        ) : <span className="text-[13px] font-normal text-gray-400">N/A</span>}
                    </div>
                </CellTooltip>
            ),
            textAccessor: (row) => row.industry?.join(', ') || '',
            width: 180,
        },
        {
            id: 'desiredInvestment',
            header: 'Desired Investment',
            accessor: (row) => {
                const compact = getBudgetDisplay(row.desiredInvestment, row.sourceCurrencyRate);
                const full = getFullBudgetDisplay(row.desiredInvestment, row.sourceCurrencyRate);
                const showTooltip = compact !== 'N/A' && compact !== 'Flexible' && compact !== full;
                return (
                    <CellTooltip enabled={showTooltip} content={<span className="font-medium">{full}</span>}>
                        <div className="flex flex-col gap-0.5 items-end">
                            <span className="text-[13px] font-normal text-gray-700">{compact}</span>
                        </div>
                    </CellTooltip>
                );
            },
            textAccessor: (row) => formatCompactBudget(row.desiredInvestment, '$', 1),
            width: 160,
        },
        {
            id: 'ebitda',
            header: 'EBITDA',
            accessor: (row) => {
                const compact = getBudgetDisplay(row.ebitda, row.sourceCurrencyRate);
                const full = getFullBudgetDisplay(row.ebitda, row.sourceCurrencyRate);
                const showTooltip = compact !== 'N/A' && compact !== 'Flexible' && compact !== full;
                return (
                    <CellTooltip enabled={showTooltip} content={<span className="font-medium">{full}</span>}>
                        <span className="text-[13px] font-normal text-gray-700">{compact}</span>
                    </CellTooltip>
                );
            },
            textAccessor: (row) => formatCompactBudget(row.ebitda, '$', 1),
            width: 140,
        },
        {
            id: 'investmentCondition',
            header: 'Condition',
            accessor: (row) => {
                const items = parseMultiField(row.investmentCondition);
                if (!items.length) return <span className="text-[13px] font-normal text-gray-400">N/A</span>;
                if (items.length === 1) return <span className="text-[13px] text-gray-600">{items[0]}</span>;
                return (
                    <CellTooltip
                        enabled={items.length > 1}
                        content={<ul className="list-disc pl-4 space-y-0.5">{items.map((item, i) => <li key={i}>{item}</li>)}</ul>}
                    >
                        <div className="flex flex-wrap gap-1">
                            <span className="px-2 py-0.5 rounded-[3px] bg-[#f3f4f6] text-[13px] font-normal text-gray-600 truncate max-w-[120px]">{items[0]}</span>
                            <span className="px-1.5 py-0.5 rounded-[3px] bg-[#EDF8FF] text-[13px] font-normal text-[#064771]">+{items.length - 1}</span>
                        </div>
                    </CellTooltip>
                );
            },
            textAccessor: (row) => parseMultiField(row.investmentCondition).join(', '),
            width: 160,
        },
        {
            id: 'reasonForMA',
            header: 'Purpose of M&A',
            accessor: (row) => {
                const items = parseMultiField(row.reasonForMA);
                if (!items.length) return <span className="text-[13px] font-normal text-gray-400">N/A</span>;
                if (items.length === 1) return <span className="text-[13px] text-gray-600">{items[0]}</span>;
                return (
                    <CellTooltip
                        enabled={items.length > 1}
                        content={<ul className="list-disc pl-4 space-y-0.5">{items.map((item, i) => <li key={i}>{item}</li>)}</ul>}
                    >
                        <div className="flex flex-wrap gap-1">
                            <span className="px-2 py-0.5 rounded-[3px] bg-[#f3f4f6] text-[13px] font-normal text-gray-600 truncate max-w-[120px]">{items[0]}</span>
                            <span className="px-1.5 py-0.5 rounded-[3px] bg-[#EDF8FF] text-[13px] font-normal text-[#064771]">+{items.length - 1}</span>
                        </div>
                    </CellTooltip>
                );
            },
            textAccessor: (row) => parseMultiField(row.reasonForMA).join(', '),
            width: 170,
        },
        {
            id: 'pipelineStatus',
            header: 'Pipeline',
            accessor: (row) => {
                const stageInfo = getStagePosition(row.pipelineStatus);
                const showTooltip = stageInfo.stageName !== 'N/A';
                return (
                    <CellTooltip enabled={showTooltip} content={<span className="font-medium">{stageInfo.stageName}</span>}>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-[3px] bg-[#f3f4f6] text-[13px] font-normal text-gray-600 uppercase tracking-tighter">
                            {stageInfo.display}
                        </span>
                    </CellTooltip>
                );
            },
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
            id: 'financialAdvisor',
            header: 'Partner FA',
            accessor: (row) => (
                <span className="text-[13px] font-normal text-gray-700">{row.financialAdvisor?.length ? row.financialAdvisor[0] : 'N/A'}</span>
            ),
            textAccessor: (row) => row.financialAdvisor?.[0] || '',
            width: 150,
        },
        {
            id: 'primaryContact',
            header: 'Contact',
            accessor: (row) => (
                <span className="text-[13px] font-normal text-gray-700">{row.primaryContact || 'N/A'}</span>
            ),
            textAccessor: (row) => row.primaryContact || '',
            width: 140,
        },
        {
            id: 'teaserLink',
            header: 'Teaser',
            accessor: (row) => (
                row.teaserLink ? (
                    <a href={row.teaserLink} target="_blank" rel="noreferrer" className="text-[13px] font-normal text-gray-600 bg-[#f3f4f6] px-2 py-0.5 rounded-[3px] inline-flex items-center gap-1 hover:bg-gray-200 transition-colors">
                        <ProfileViewIcon className="w-3.5 h-3.5" /> View
                    </a>
                ) : <span className="text-[13px] text-gray-400">N/A</span>
            ),
            textAccessor: (row) => row.teaserLink || '',
            width: 120,
        },

    ], [pipelineStages, selectedCurrency]);

    const filteredColumns = useMemo(() =>
        columns.filter(col => visibleColumns.includes(col.id)),
        [columns, visibleColumns]
    );

    const ActionsColumn = (row: TargetRowData) => (
        <div className="flex items-center justify-end px-2">
            <button
                className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-all"
                onClick={(e) => { e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, rowId: row.id }); }}
                aria-label="More actions"
            >
                <MoreVertical className="w-4 h-4" />
            </button>
        </div>
    );

    const sortedData = useMemo(() => {
        const sorted = [...data];

        // Apply active sort to all items
        if (sortConfig.key && sortConfig.direction) {
            sorted.sort((a: any, b: any) => {
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
        }

        // Separate pinned and unpinned, preserving sort order within each group
        const pinned = sorted.filter(row => row.isPinned);
        const unpinned = sorted.filter(row => !row.isPinned);

        return [...pinned, ...unpinned];
    }, [data, sortConfig]);

    return (
        <div className="w-full h-full flex flex-col min-h-0 relative">
            {/* Bulk action bar removed — actions now in column header 3-dot menu */}
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
                actionsColumnHeader={selectedIds.size > 0 && !isRestricted ? (
                    <div className="relative" ref={bulkMenuRef}>
                        <button
                            onClick={() => setBulkMenuOpen(!bulkMenuOpen)}
                            className="p-1.5 rounded-[3px] hover:bg-gray-200 transition-all"
                            aria-label="Bulk actions menu"
                        >
                            <MoreVertical className="w-4 h-4 text-gray-600" />
                        </button>
                        {bulkMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-[90]" onClick={() => setBulkMenuOpen(false)} />
                                <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-[3px] border border-gray-200 py-1.5 z-[100] shadow-lg animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                                    <div className="px-3 py-1.5 border-b border-gray-100 mb-1">
                                        <p className="text-[11px] font-medium text-gray-400">{selectedIds.size} selected</p>
                                    </div>
                                    <button
                                        onClick={() => { setIsDeleteModalOpen(true); setBulkMenuOpen(false); }}
                                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete
                                    </button>
                                    <button
                                        onClick={handleExportCSV}
                                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors"
                                    >
                                        <Download className="w-4 h-4" />
                                        Export CSV
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ) : undefined}
                actionsColumnWidth={60}
                sortConfig={sortConfig}
                onSortChange={(key, direction) => setSortConfig({ key, direction })}
                pagination={pagination}
                emptyAction={!isRestricted && (
                    <button
                        onClick={() => navigate('/prospects/add-target')}
                        className="flex items-center gap-2 px-4 py-2 bg-[#064771] text-white rounded-[3px] text-sm font-medium hover:bg-[#053a5c] transition-all active:scale-95 shadow-sm shadow-[#064771]/10"
                    >
                        <Plus className="w-4 h-4" />
                        Add New Target
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
                            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Target Actions</p>
                        </div>
                        <button
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-amber-50 hover:text-amber-700 flex items-center gap-3 transition-colors"
                            onClick={() => { onTogglePin(contextMenu.rowId); setContextMenu(null); }}
                        >
                            {data.find(r => r.id === contextMenu.rowId)?.isPinned ? <PinnedIcon className="w-5 h-5" /> : <UnpinnedIcon className="w-5 h-5" />}
                            {data.find(r => r.id === contextMenu.rowId)?.isPinned ? 'Unpin from Top' : 'Pin to Top'}
                        </button>
                        <button
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-3 transition-colors"
                            onClick={() => { navigate(`/prospects/target/${contextMenu.rowId}`); setContextMenu(null); }}
                        >
                            <ProfileViewIcon className="w-4 h-4 opacity-50" />
                            View Full Profile
                        </button>
                        {!isRestricted && (
                            <button
                                className="w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-3 transition-colors"
                                onClick={() => { navigate(`/prospects/edit-target/${contextMenu.rowId}`); setContextMenu(null); }}
                            >
                                <Zap className="w-4 h-4 text-gray-400" />
                                Edit Project
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
