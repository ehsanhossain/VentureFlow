import React, { useState, useEffect, useMemo } from 'react';
import { Users, Plus, Edit2, Trash2, Eye, Share2, MoreVertical, Mail } from 'lucide-react';
import api from '../../../config/api';

import { showAlert } from '../../../components/Alert';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DataTable, { DataTableColumn } from "../../../components/table/DataTable";
import DataTableSearch from "../../../components/table/DataTableSearch";
import PartnerSharingSettings from './PartnerSharingSettings';

interface PartnerUser {
    id: number;
    partner_id: string;
    status: string;
    user?: {
        name: string;
        email: string;
        image?: string;
    };
    partner_overview?: {
        reg_name: string;
        hq_country: string;
    };
    partnership_structure?: {
        partnership_structure: string;
    };
}

const PartnerManagement: React.FC = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'list' | 'sharing'>('list');
    const [partners, setPartners] = useState<PartnerUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [openActionMenuId, setOpenActionMenuId] = useState<number | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({
        key: 'name',
        direction: 'asc'
    });

    const baseURL = import.meta.env.VITE_API_BASE_URL;

    // Close action menu when clicking outside
    useEffect(() => {
        const handleClick = () => setOpenActionMenuId(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);
    const navigate = useNavigate();

    // Form State


    useEffect(() => {
        if (activeTab === 'list') {
            fetchPartners();
        }
    }, [activeTab]);

    const fetchPartners = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/partners');
            setPartners(res.data.data || []);
        } catch (error) {
            console.error(error);
            showAlert({ type: 'error', message: t('settings.partners.fetchError') });
        } finally {
            setLoading(false);
        }
    };





    const handleDelete = async (id: number) => {
        if (!window.confirm(t('settings.partners.confirmDelete'))) return;

        try {
            await api.delete(`/api/partners`, { data: { ids: [id] } });
            showAlert({ type: 'success', message: t('settings.partners.deleteSuccess') });
            fetchPartners();
        } catch (error) {
            showAlert({ type: 'error', message: t('settings.partners.deleteError') });
        }
    };



    const filteredPartners = useMemo(() => {
        let result = partners.filter(p =>
        (p.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.partner_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()))
        );

        if (sortConfig.key && sortConfig.direction) {
            result.sort((a, b) => {
                let aVal: any = '';
                let bVal: any = '';

                switch (sortConfig.key) {
                    case 'name':
                        aVal = a.user?.name || a.partner_overview?.reg_name || '';
                        bVal = b.user?.name || b.partner_overview?.reg_name || '';
                        break;
                    case 'partner_id':
                        aVal = a.partner_id || '';
                        bVal = b.partner_id || '';
                        break;
                    case 'country':
                        aVal = a.partner_overview?.hq_country || '';
                        bVal = b.partner_overview?.hq_country || '';
                        break;
                    case 'status':
                        aVal = a.status || '';
                        bVal = b.status || '';
                        break;
                    default:
                        aVal = (a as any)[sortConfig.key] || '';
                        bVal = (b as any)[sortConfig.key] || '';
                }

                if (sortConfig.direction === 'asc') {
                    return aVal.toString().localeCompare(bVal.toString());
                } else {
                    return bVal.toString().localeCompare(aVal.toString());
                }
            });
        }

        return result;
    }, [partners, searchQuery, sortConfig]);

    const columns: DataTableColumn<PartnerUser>[] = [
        {
            id: 'name',
            header: t('settings.partners.table.partner'),
            accessor: (row) => (
                <div className="flex items-center gap-3">
                    <img
                        src={row.user?.image
                            ? (row.user.image.startsWith('http') ? row.user.image : `${baseURL}/storage/${row.user.image}`)
                            : `https://ui-avatars.com/api/?name=${encodeURIComponent(row.user?.name || row.partner_overview?.reg_name || 'Partner')}&background=064771&color=fff&rounded=true`
                        }
                        alt=""
                        className="w-8 h-8 rounded-full object-cover ring-1 ring-gray-100 shadow-sm"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(row.user?.name || row.partner_overview?.reg_name || 'Partner')}&background=064771&color=fff&rounded=true`;
                        }}
                    />
                    <div className="overflow-hidden">
                        <div className="text-sm font-medium text-gray-900 truncate">
                            {row.user?.name || row.partner_overview?.reg_name || t('common.unnamed')}
                        </div>
                    </div>
                </div>
            ),
            width: 250,
            sortable: true,
            sticky: 'left'
        },
        {
            id: 'partner_id',
            header: 'Partner Code',
            accessor: (row) => (
                <span className="font-mono text-[11px] font-medium text-[#064771] bg-blue-50/50 px-2 py-0.5 rounded border border-blue-100/50 uppercase">
                    {row.partner_id}
                </span>
            ),
            width: 140,
            sortable: true
        },
        {
            id: 'email',
            header: 'Contact Email',
            accessor: (row) => (
                <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    <span className="truncate">{row.user?.email || '-'}</span>
                </div>
            ),
            width: 220,
            sortable: true
        },
        {
            id: 'country',
            header: t('settings.partners.table.country'),
            accessor: (row) => (
                <div className="text-xs text-gray-900">{row.partner_overview?.hq_country || 'N/A'}</div>
            ),
            width: 150,
            sortable: true
        },
        {
            id: 'structure',
            header: t('settings.partners.table.structure'),
            accessor: (row) => (
                <div className="text-xs text-gray-600 italic truncate">
                    {row.partnership_structure?.partnership_structure || t('common.notSet')}
                </div>
            ),
            width: 180
        },
        {
            id: 'status',
            header: t('settings.partners.table.status'),
            accessor: (row) => (
                <span className={`px-2.5 py-0.5 inline-flex text-[10px] leading-5 font-medium rounded-full border ${row.status === 'active'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    : 'bg-rose-50 text-rose-700 border-rose-100'
                    }`}>
                    {(row.status || 'active').toUpperCase()}
                </span>
            ),
            width: 100,
            sortable: true
        }
    ];

    const actionsColumn = (row: PartnerUser) => (
        <div className="relative flex justify-end">
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setOpenActionMenuId(openActionMenuId === row.id ? null : row.id);
                }}
                className="p-1.5 hover:bg-gray-100 rounded-[3px] text-gray-400 hover:text-gray-700 transition-colors"
                title="Options"
            >
                <MoreVertical className="w-4 h-4" />
            </button>

            {openActionMenuId === row.id && (
                <div className="absolute right-0 mt-8 w-48 bg-white rounded-[3px] border border-gray-100 py-1 z-[70] shadow-xl animate-in fade-in zoom-in-95 duration-100 origin-top-right overflow-hidden">
                    <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/settings/partners/${row.id}`); setOpenActionMenuId(null); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50/50 hover:text-[#064771] flex items-center gap-3 transition-colors"
                    >
                        <Eye className="w-4 h-4 text-gray-400" />
                        {t('common.viewDetails')}
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/settings/partners/edit/${row.id}`); setOpenActionMenuId(null); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50/50 hover:text-[#064771] flex items-center gap-3 transition-colors"
                    >
                        <Edit2 className="w-4 h-4 text-gray-400" />
                        {t('common.edit')}
                    </button>
                    <div className="h-px bg-gray-50 my-1" />
                    <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(row.id); setOpenActionMenuId(null); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors font-medium"
                    >
                        <Trash2 className="w-4 h-4" />
                        {t('common.delete')}
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <div className="h-full flex flex-col bg-[#f9fafb] overflow-hidden ">
            {/* Header */}
            <div className="px-8 py-6">
                <div className="flex items-center justify-between gap-6">
                    <div className="flex items-center gap-8 flex-1">
                        <h1 className="text-2xl font-medium text-gray-900 whitespace-nowrap">
                            {t('settings.partners.title')}
                        </h1>
                        <DataTableSearch
                            value={searchQuery}
                            onChange={setSearchQuery}
                            placeholder={t('settings.partners.searchPlaceholder')}
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/settings/partners/create')}
                            className="flex items-center gap-2 bg-[#064771] hover:bg-[#053a5e] text-white px-5 py-2 rounded-[3px] text-sm font-medium transition-all shadow-sm active:scale-95"
                        >
                            <Plus className="w-4 h-4" />
                            {t('settings.partners.addPartner')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="px-8 border-b border-gray-100">
                <div className="flex space-x-8">
                    <button
                        onClick={() => setActiveTab('list')}
                        className={`py-4 px-2 border-b-2 font-medium text-sm transition-all flex items-center gap-2 ${activeTab === 'list'
                            ? 'border-[#064771] text-[#064771]'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <Users className="w-4 h-4" />
                        All Partners
                    </button>
                    <button
                        onClick={() => setActiveTab('sharing')}
                        className={`py-4 px-2 border-b-2 font-medium text-sm transition-all flex items-center gap-2 ${activeTab === 'sharing'
                            ? 'border-[#064771] text-[#064771]'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <Share2 className="w-4 h-4" />
                        Sharing Settings
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden flex flex-col mt-6">
                {activeTab === 'list' ? (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Table */}
                        <div className="flex-1 px-8 pb-8 overflow-hidden">
                            <div className="h-full bg-white rounded-[3px] border border-gray-100 overflow-hidden">
                                <DataTable
                                    data={filteredPartners}
                                    columns={columns}
                                    isLoading={loading}
                                    emptyMessage={t('settings.partners.noPartners')}
                                    getRowId={(row) => row.id}
                                    sortConfig={sortConfig}
                                    onSortChange={(key, direction) => setSortConfig({ key, direction })}
                                    actionsColumn={actionsColumn}
                                    actionsColumnWidth={60}
                                    onRowClick={(row) => navigate(`/settings/partners/${row.id}`)}
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-auto p-8">
                        <PartnerSharingSettings />
                    </div>
                )}
            </div>


            {/* Password Modal */}

        </div>
    );
};

export default PartnerManagement;

