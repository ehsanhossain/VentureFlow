/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, MoreVertical, Eye, Edit2, Trash2, AlertTriangle, X, Briefcase, Users, Target } from 'lucide-react';
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

interface DeletionImpact {
    employee_id: number;
    employee_name: string;
    is_self: boolean;
    deals_as_pic: { id: number; name: string }[];
    deals_as_internal_pic: { id: number; name: string }[];
    investor_profiles: { id: number; name: string }[];
    target_profiles: { id: number; name: string }[];
}

interface ImpactCheckResult {
    impacts: DeletionImpact[];
    is_self_included: boolean;
    total_employees: number;
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

    // Deletion impact modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteImpactData, setDeleteImpactData] = useState<ImpactCheckResult | null>(null);
    const [deleteTargetIds, setDeleteTargetIds] = useState<(string | number)[]>([]);
    const [isCheckingImpact, setIsCheckingImpact] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const baseURL = ''; // deprecated — use getImageUrl

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

    /** Opens the deletion impact modal by fetching impact data first */
    const handleDeleteRequest = async (ids: (string | number)[]) => {
        setDeleteTargetIds(ids);
        setIsCheckingImpact(true);
        setShowDeleteModal(true);

        try {
            const res = await api.post('/api/employees/deletion-impact', { ids });
            setDeleteImpactData(res.data);

            // Block self-deletion immediately
            if (res.data.is_self_included) {
                showAlert({ type: 'error', message: 'You cannot delete your own account.' });
                setShowDeleteModal(false);
                return;
            }
        } catch (error: any) {
            console.error('Failed to check deletion impact:', error);
            showAlert({ type: 'error', message: 'Failed to check deletion impact' });
            setShowDeleteModal(false);
        } finally {
            setIsCheckingImpact(false);
        }
    };

    /** Confirms and executes the deletion */
    const confirmDelete = async () => {
        setIsDeleting(true);
        try {
            await api.delete('/api/employees', { data: { ids: deleteTargetIds } });
            showAlert({ type: 'success', message: 'Staff member(s) deleted successfully' });
            setSelectedIds(new Set());
            setShowDeleteModal(false);
            setDeleteImpactData(null);
            fetchStaff();
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Failed to delete staff member(s)';
            showAlert({ type: 'error', message: msg });
        } finally {
            setIsDeleting(false);
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
                        onClick={(e) => { e.stopPropagation(); handleDeleteRequest([row.id]); setOpenActionMenuId(null); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors font-medium"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete Member
                    </button>
                </div>
            )}
        </div>
    );

    /** Helper to count total impacts for a single employee */
    const getTotalImpactCount = (impact: DeletionImpact) =>
        impact.deals_as_pic.length +
        impact.deals_as_internal_pic.length +
        impact.investor_profiles.length +
        impact.target_profiles.length;

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
                                onClick={() => handleDeleteRequest(Array.from(selectedIds))}
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

            {/* ═══════ Deletion Impact Modal ═══════ */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-center gap-3 px-6 py-4 border-b bg-red-50">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <AlertTriangle className="w-5 h-5 text-red-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-base font-semibold text-gray-900">Confirm Deletion</h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {deleteTargetIds.length === 1
                                        ? 'This staff member will be permanently removed'
                                        : `${deleteTargetIds.length} staff members will be permanently removed`}
                                </p>
                            </div>
                            <button
                                onClick={() => { setShowDeleteModal(false); setDeleteImpactData(null); }}
                                className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
                                title="Close"
                            >
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="px-6 py-4 overflow-y-auto max-h-[55vh] scrollbar-premium">
                            {isCheckingImpact ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#064771] rounded-full animate-spin" />
                                        <p className="text-sm text-gray-500">Checking impact...</p>
                                    </div>
                                </div>
                            ) : deleteImpactData ? (
                                <div className="space-y-4">
                                    {deleteImpactData.impacts.map((impact) => {
                                        const totalImpact = getTotalImpactCount(impact);
                                        const allDeals = [...impact.deals_as_pic, ...impact.deals_as_internal_pic];
                                        // Deduplicate deals
                                        const uniqueDeals = allDeals.filter((d, i, arr) => arr.findIndex(x => x.id === d.id) === i);

                                        return (
                                            <div key={impact.employee_id} className="border border-gray-200 rounded-lg overflow-hidden">
                                                {/* Employee name header */}
                                                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                                                    <span className="font-medium text-gray-900 text-sm">{impact.employee_name}</span>
                                                    {totalImpact > 0 ? (
                                                        <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                                                            {totalImpact} reference{totalImpact !== 1 ? 's' : ''} will be updated
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full font-medium">
                                                            No references found
                                                        </span>
                                                    )}
                                                </div>

                                                {totalImpact > 0 && (
                                                    <div className="px-4 py-3 space-y-3 text-xs">
                                                        {/* Deals */}
                                                        {uniqueDeals.length > 0 && (
                                                            <div>
                                                                <div className="flex items-center gap-1.5 text-gray-600 font-medium mb-1.5">
                                                                    <Briefcase className="w-3.5 h-3.5" />
                                                                    Deals ({uniqueDeals.length})
                                                                </div>
                                                                <div className="flex flex-wrap gap-1.5">
                                                                    {uniqueDeals.map((d) => (
                                                                        <span key={d.id} className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-[3px]">
                                                                            {d.name || `Deal #${d.id}`}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Investor Profiles */}
                                                        {impact.investor_profiles.length > 0 && (
                                                            <div>
                                                                <div className="flex items-center gap-1.5 text-gray-600 font-medium mb-1.5">
                                                                    <Users className="w-3.5 h-3.5" />
                                                                    Investor Profiles ({impact.investor_profiles.length})
                                                                </div>
                                                                <div className="flex flex-wrap gap-1.5">
                                                                    {impact.investor_profiles.map((p) => (
                                                                        <span key={p.id} className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-[3px]">
                                                                            {p.name}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Target Profiles */}
                                                        {impact.target_profiles.length > 0 && (
                                                            <div>
                                                                <div className="flex items-center gap-1.5 text-gray-600 font-medium mb-1.5">
                                                                    <Target className="w-3.5 h-3.5" />
                                                                    Target Profiles ({impact.target_profiles.length})
                                                                </div>
                                                                <div className="flex flex-wrap gap-1.5">
                                                                    {impact.target_profiles.map((p) => (
                                                                        <span key={p.id} className="bg-green-50 text-green-700 border border-green-100 px-2 py-0.5 rounded-[3px]">
                                                                            {p.name}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {/* Safety notice */}
                                    <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                                        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-semibold mb-0.5">This action is irreversible</p>
                                            <p className="text-amber-700 leading-relaxed">
                                                The staff account and login will be permanently deleted.
                                                PIC assignments will be removed, but all other data
                                                (deals, chats, history, investor/target records) will remain intact.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
                            <button
                                onClick={() => { setShowDeleteModal(false); setDeleteImpactData(null); }}
                                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-[3px] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={isCheckingImpact || isDeleting}
                                className="px-5 py-2 bg-red-600 text-white text-sm font-medium rounded-[3px] hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {isDeleting ? (
                                    <>
                                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Delete {deleteTargetIds.length > 1 ? `${deleteTargetIds.length} Members` : 'Member'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default StaffManagement;
