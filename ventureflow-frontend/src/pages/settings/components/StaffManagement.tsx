/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, MoreVertical, Eye, Edit2, Trash2 } from 'lucide-react';
import globalAddButtonIcon from '../../../assets/icons/global-add-button.svg';
import api from '../../../config/api';
import { showAlert } from '../../../components/Alert';
import { useNavigate } from 'react-router-dom';
import DataTable, { DataTableColumn } from "../../../components/table/DataTable";
import DataTableSearch from "../../../components/table/DataTableSearch";

interface StaffMember {
    id: number;
    first_name: string;
    last_name: string;
    employee_id: string;
    work_email: string;
    contact_number?: string;
    joining_date?: string;
    image?: string;
    employee_status?: string;
    user?: {
        id: number;
        name: string;
        email: string;
        roles?: { name: string }[];
    };
    department?: { name: string };
    designation?: { title: string };
}

const StaffManagement: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
    const [openActionMenuId, setOpenActionMenuId] = useState<number | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({
        key: 'name',
        direction: 'asc'
    });

    const baseURL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        fetchStaff();
        const handleClick = () => setOpenActionMenuId(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    const fetchStaff = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/api/employees');
            setStaff(res.data.data || []);
        } catch (error) {
            console.error('Failed to fetch staff:', error);
            showAlert({ type: 'error', message: 'Failed to load staff members' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (ids: (string | number)[]) => {
        if (!window.confirm(`Are you sure you want to delete ${ids.length} staff member(s)? This action cannot be undone.`)) {
            return;
        }

        try {
            await api.delete('/api/employees', { data: { ids } });
            showAlert({ type: 'success', message: 'Staff member(s) deleted successfully' });
            setSelectedIds(new Set());
            fetchStaff();
        } catch (error) {
            console.error('Failed to delete staff:', error);
            showAlert({ type: 'error', message: 'Failed to delete staff member(s)' });
        }
    };

    const getRoleBadge = (staffMember: StaffMember) => {
        const role = staffMember.user?.roles?.[0]?.name || 'Staff';

        return (
            <span className="inline-flex items-center px-3 py-1 rounded-[3px] text-[11px] font-medium text-[#334155] bg-[#f1f5f9] border border-[#e2e8f0]">
                {role}
            </span>
        );
    };

    const filteredStaff = useMemo(() => {
        let result = staff.filter(s =>
            `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.employee_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.work_email?.toLowerCase().includes(searchQuery.toLowerCase())
        );

        if (sortConfig.key && sortConfig.direction) {
            result.sort((a, b) => {
                let aVal: any = '';
                let bVal: any = '';

                switch (sortConfig.key) {
                    case 'name':
                        aVal = `${a.first_name} ${a.last_name}`;
                        bVal = `${b.first_name} ${b.last_name}`;
                        break;
                    case 'employee_id':
                        aVal = a.employee_id || '';
                        bVal = b.employee_id || '';
                        break;
                    case 'work_email':
                        aVal = a.work_email || '';
                        bVal = b.work_email || '';
                        break;
                    case 'role':
                        aVal = a.user?.roles?.[0]?.name || '';
                        bVal = b.user?.roles?.[0]?.name || '';
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
    }, [staff, searchQuery, sortConfig]);

    const columns: DataTableColumn<StaffMember>[] = [
        {
            id: 'name',
            header: 'Staff Member',
            accessor: (row) => (
                <div className="flex items-center gap-3">
                    <img
                        src={row.image && row.image !== ''
                            ? (row.image.startsWith('http') ? row.image : `${baseURL}/api/files/${row.image}`)
                            : `https://ui-avatars.com/api/?name=${encodeURIComponent(`${row.first_name} ${row.last_name}`)}&background=064771&color=fff&rounded=true`
                        }
                        alt=""
                        className="w-8 h-8 rounded-full object-cover ring-1 ring-gray-100 shadow-sm"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(`${row.first_name} ${row.last_name}`)}&background=064771&color=fff&rounded=true`;
                        }}
                    />
                    <div className="overflow-hidden">
                        <div className="font-medium text-gray-900 truncate">{row.first_name} {row.last_name}</div>
                    </div>
                </div>
            ),
            width: 280,
            sortable: true,
            sticky: 'left'
        },
        {
            id: 'employee_id',
            header: 'Employee ID',
            accessor: (row) => (
                <span className="font-mono text-[11px] font-medium text-[#064771] bg-blue-50 px-2 py-0.5 rounded-[3px] border border-blue-100">
                    {row.employee_id}
                </span>
            ),
            width: 140,
            sortable: true
        },
        {
            id: 'work_email',
            header: 'Contact',
            accessor: (row) => (
                <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    <span className="truncate">{row.work_email || '-'}</span>
                </div>
            ),
            width: 240,
            sortable: true
        },
        {
            id: 'role',
            header: 'Role',
            accessor: (row) => getRoleBadge(row),
            width: 160,
            sortable: true
        }
    ];

    const actionsColumn = (row: StaffMember) => (
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
                        onClick={(e) => { e.stopPropagation(); navigate(`/settings/staff/view/${row.id}`); setOpenActionMenuId(null); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50/50 hover:text-[#064771] flex items-center gap-3 transition-colors"
                    >
                        <Eye className="w-4 h-4 text-gray-400" />
                        View Member
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/settings/staff/edit/${row.id}`); setOpenActionMenuId(null); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50/50 hover:text-[#064771] flex items-center gap-3 transition-colors"
                    >
                        <Edit2 className="w-4 h-4 text-gray-400" />
                        Edit Member
                    </button>
                    <div className="h-px bg-gray-50 my-1" />
                    <button
                        onClick={(e) => { e.stopPropagation(); handleDelete([row.id]); setOpenActionMenuId(null); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors font-medium"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete Member
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <div className="h-full flex flex-col bg-white overflow-hidden ">
            <div className="px-8 py-6">
                {/* Header & Search */}
                <div className="flex items-center justify-between gap-6">
                    <div className="flex items-center gap-8 flex-1">
                        <h1 className="text-2xl font-medium text-gray-900 whitespace-nowrap">
                            {t('settings.staffAndAccounts.title', 'Staff & Accounts')}
                        </h1>
                        <DataTableSearch
                            value={searchQuery}
                            onChange={setSearchQuery}
                            placeholder="Search staff members..."
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        {selectedIds.size > 0 && (
                            <button
                                onClick={() => handleDelete(Array.from(selectedIds))}
                                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 rounded-[3px] text-sm font-medium transition-all"
                            >
                                Delete Selected ({selectedIds.size})
                            </button>
                        )}
                        <button
                            onClick={() => navigate('/settings/staff/create')}
                            className="flex items-center gap-2 bg-[#064771] hover:bg-[#053a5e] text-white px-5 py-2 rounded-[3px] text-sm font-medium transition-all active:scale-95 border border-[#064771]"
                        >
                            <img src={globalAddButtonIcon} alt="" className="w-5 h-5" />
                            Add Staff
                        </button>
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 px-8 pb-8 overflow-hidden">
                <div className="h-full bg-white rounded-[3px] overflow-hidden">
                    <DataTable
                        data={filteredStaff}
                        columns={columns}
                        isLoading={isLoading}
                        emptyMessage="No staff members found"
                        getRowId={(row) => row.id}
                        selectable
                        selectedIds={selectedIds}
                        onSelectionChange={setSelectedIds}
                        sortConfig={sortConfig}
                        onSortChange={(key, direction) => setSortConfig({ key, direction })}
                        actionsColumn={actionsColumn}
                        actionsColumnWidth={60}
                        onRowClick={(row) => navigate(`/settings/staff/view/${row.id}`)}
                    />
                </div>
            </div>
        </div >
    );
};

export default StaffManagement;

