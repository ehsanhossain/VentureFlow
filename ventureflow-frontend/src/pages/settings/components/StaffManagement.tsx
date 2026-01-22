import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Edit2, Trash2, Eye, Shield, ShieldCheck, Mail, Phone, Square, CheckSquare, MinusSquare, ChevronUp, ChevronDown } from 'lucide-react';
import api from '../../../config/api';
import { showAlert } from '../../../components/Alert';
import { useNavigate } from 'react-router-dom';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../../components/table/table";

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
    const navigate = useNavigate();
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [columnWidths, setColumnWidths] = useState({
        name: 250,
        employeeId: 140,
        email: 220,
        phone: 150,
        role: 150,
    });
    const [resizing, setResizing] = useState<string | null>(null);

    const baseURL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        fetchStaff();
    }, []);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (resizing) {
                setColumnWidths(prev => ({
                    ...prev,
                    [resizing]: Math.max(100, e.clientX - (document.querySelector(`[data-column="${resizing}"]`) as HTMLElement)?.getBoundingClientRect().left || 0)
                }));
            }
        };
        const handleMouseUp = () => setResizing(null);

        if (resizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [resizing]);

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

    const handleDelete = async (ids: number[]) => {
        if (!window.confirm(`Are you sure you want to delete ${ids.length} staff member(s)? This action cannot be undone.`)) {
            return;
        }

        try {
            await api.delete('/api/employees', { data: { ids } });
            showAlert({ type: 'success', message: 'Staff member(s) deleted successfully' });
            setSelectedIds([]);
            fetchStaff();
        } catch (error) {
            console.error('Failed to delete staff:', error);
            showAlert({ type: 'error', message: 'Failed to delete staff member(s)' });
        }
    };

    const handleSort = (column: string) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    const toggleSelectMode = () => {
        setIsSelectMode(!isSelectMode);
        if (isSelectMode) {
            setSelectedIds([]);
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredStaff.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredStaff.map(s => s.id));
        }
    };

    const toggleSelect = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const getRoleBadge = (staffMember: StaffMember) => {
        const role = staffMember.user?.roles?.[0]?.name || 'Staff';
        const isAdmin = role === 'System Admin';

        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${isAdmin
                ? 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border border-amber-200'
                : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                {isAdmin ? <ShieldCheck className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                {role}
            </span>
        );
    };

    const filteredStaff = staff
        .filter(s =>
            s.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.employee_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.work_email?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => {
            if (!sortColumn) return 0;
            let aVal = '', bVal = '';
            switch (sortColumn) {
                case 'name': aVal = `${a.first_name} ${a.last_name}`; bVal = `${b.first_name} ${b.last_name}`; break;
                case 'employeeId': aVal = a.employee_id || ''; bVal = b.employee_id || ''; break;
                case 'email': aVal = a.work_email || ''; bVal = b.work_email || ''; break;
                case 'role': aVal = a.user?.roles?.[0]?.name || ''; bVal = b.user?.roles?.[0]?.name || ''; break;
            }
            return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        });

    const SortIcon = ({ column }: { column: string }) => {
        if (sortColumn !== column) return <ChevronUp className="w-3.5 h-3.5 text-gray-300" />;
        return sortDirection === 'asc'
            ? <ChevronUp className="w-3.5 h-3.5 text-[#064771]" />
            : <ChevronDown className="w-3.5 h-3.5 text-[#064771]" />;
    };

    const ResizeHandle = ({ column }: { column: string }) => (
        <div
            className={`
                absolute right-0 top-0 h-full w-[4px] cursor-col-resize 
                select-none z-20 group/handle transition-all duration-200
                hover:w-[6px]
            `}
            onMouseDown={() => setResizing(column)}
        >
            <div className="absolute right-0 top-0 h-full w-[1px] bg-gray-200 transition-all" />
            <div className="absolute right-[-1px] top-1/2 -translate-y-1/2 h-8 w-[3px] bg-[#064771] rounded-full opacity-0 group-hover/handle:opacity-100 transition-all shadow-[0_0_10px_rgba(6,71,113,0.3)]" />
        </div>
    );

    return (
        <div className="h-full overflow-y-auto p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#064771] to-[#0a5c8f] rounded-xl flex items-center justify-center shadow-lg">
                            <Users className="w-5 h-5 text-white" />
                        </div>
                        Staff Management
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Manage user accounts and access roles</p>
                </div>
                <button
                    onClick={() => navigate('/settings/staff/create')}
                    className="flex items-center gap-2 bg-[#064771] hover:bg-[#053a5e] text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-lg active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    Add Staff
                </button>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name, ID, or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#064771]/20 focus:border-[#064771] transition-all shadow-sm"
                    />
                </div>
                {selectedIds.length > 0 && (
                    <button
                        onClick={() => handleDelete(selectedIds)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-all"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete ({selectedIds.length})
                    </button>
                )}
                {isSelectMode && (
                    <button
                        onClick={toggleSelectMode}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-all"
                    >
                        Exit Selection
                    </button>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                    <div className="text-2xl font-bold text-gray-900">{staff.length}</div>
                    <div className="text-xs text-gray-500 font-medium">Total Staff</div>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100 p-4">
                    <div className="text-2xl font-bold text-amber-800">
                        {staff.filter(s => s.user?.roles?.[0]?.name === 'System Admin').length}
                    </div>
                    <div className="text-xs text-amber-600 font-medium">Administrators</div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-4">
                    <div className="text-2xl font-bold text-blue-800">
                        {staff.filter(s => s.user?.roles?.[0]?.name !== 'System Admin').length}
                    </div>
                    <div className="text-xs text-blue-600 font-medium">Staff Members</div>
                </div>
            </div>

            {/* Premium Table */}
            <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative group/table">
                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#064771]"></div>
                        </div>
                    ) : filteredStaff.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                            <Users className="w-12 h-12 mb-3 opacity-50" />
                            <p className="font-medium">No staff members found</p>
                            <p className="text-sm">Try adjusting your search or add a new staff member</p>
                        </div>
                    ) : (
                        <Table className="min-w-full table-fixed border-separate border-spacing-0">
                            <TableHeader>
                                <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 border-b border-gray-100">
                                    <TableHead className="w-[60px] text-center sticky left-0 bg-gray-50/50 z-40 border-r border-gray-100">
                                        <button
                                            onClick={() => {
                                                if (!isSelectMode) {
                                                    toggleSelectMode();
                                                } else {
                                                    toggleSelectAll();
                                                }
                                            }}
                                            className="p-1.5 hover:bg-gray-200 rounded-lg transition-all focus:outline-none active:scale-90"
                                        >
                                            {!isSelectMode ? (
                                                <Square className="w-5 h-5 text-gray-300" />
                                            ) : selectedIds.length === 0 ? (
                                                <Square className="w-5 h-5 text-gray-300" />
                                            ) : selectedIds.length === filteredStaff.length ? (
                                                <CheckSquare className="w-5 h-5 text-[#064771]" />
                                            ) : (
                                                <MinusSquare className="w-5 h-5 text-[#064771]" />
                                            )}
                                        </button>
                                    </TableHead>

                                    <TableHead
                                        data-column="name"
                                        style={{ width: columnWidths.name }}
                                        className="relative p-0 border-r border-gray-100 transition-colors hover:bg-gray-100/50"
                                    >
                                        <div
                                            className="flex items-center gap-2 cursor-pointer select-none px-4 py-3 h-full"
                                            onClick={() => handleSort('name')}
                                        >
                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Staff Member</span>
                                            <SortIcon column="name" />
                                        </div>
                                        <ResizeHandle column="name" />
                                    </TableHead>

                                    <TableHead
                                        data-column="employeeId"
                                        style={{ width: columnWidths.employeeId }}
                                        className="relative p-0 border-r border-gray-100 transition-colors hover:bg-gray-100/50"
                                    >
                                        <div
                                            className="flex items-center gap-2 cursor-pointer select-none px-4 py-3 h-full"
                                            onClick={() => handleSort('employeeId')}
                                        >
                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Employee ID</span>
                                            <SortIcon column="employeeId" />
                                        </div>
                                        <ResizeHandle column="employeeId" />
                                    </TableHead>

                                    <TableHead
                                        data-column="email"
                                        style={{ width: columnWidths.email }}
                                        className="relative p-0 border-r border-gray-100 transition-colors hover:bg-gray-100/50"
                                    >
                                        <div
                                            className="flex items-center gap-2 cursor-pointer select-none px-4 py-3 h-full"
                                            onClick={() => handleSort('email')}
                                        >
                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</span>
                                            <SortIcon column="email" />
                                        </div>
                                        <ResizeHandle column="email" />
                                    </TableHead>

                                    <TableHead
                                        data-column="role"
                                        style={{ width: columnWidths.role }}
                                        className="relative p-0 border-r border-gray-100 transition-colors hover:bg-gray-100/50"
                                    >
                                        <div
                                            className="flex items-center gap-2 cursor-pointer select-none px-4 py-3 h-full"
                                            onClick={() => handleSort('role')}
                                        >
                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Role</span>
                                            <SortIcon column="role" />
                                        </div>
                                        <ResizeHandle column="role" />
                                    </TableHead>

                                    <TableHead className="text-right w-[120px] pr-6 sticky right-0 bg-gray-50/50 z-40 border-l border-gray-100">
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</span>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {filteredStaff.map((member) => (
                                    <TableRow
                                        key={member.id}
                                        className={`group hover:bg-blue-50/30 transition-colors ${selectedIds.includes(member.id) ? 'bg-blue-50/50' : ''
                                            }`}
                                    >
                                        <TableCell className="text-center sticky left-0 bg-white group-hover:bg-blue-50/30 z-30 border-r border-gray-100">
                                            {isSelectMode && (
                                                <button
                                                    onClick={() => toggleSelect(member.id)}
                                                    className="p-1.5 hover:bg-gray-200 rounded-lg transition-all focus:outline-none"
                                                >
                                                    {selectedIds.includes(member.id) ? (
                                                        <CheckSquare className="w-5 h-5 text-[#064771]" />
                                                    ) : (
                                                        <Square className="w-5 h-5 text-gray-300" />
                                                    )}
                                                </button>
                                            )}
                                        </TableCell>

                                        <TableCell className="px-4 py-3 border-r border-gray-100">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={member.image
                                                        ? `${baseURL}/storage/${member.image}`
                                                        : `https://ui-avatars.com/api/?name=${encodeURIComponent(`${member.first_name} ${member.last_name}`)}&background=064771&color=fff`
                                                    }
                                                    alt=""
                                                    className="w-10 h-10 rounded-xl object-cover ring-2 ring-white shadow-sm"
                                                />
                                                <div>
                                                    <div className="font-bold text-gray-900">{member.first_name} {member.last_name}</div>
                                                    <div className="text-xs text-gray-500">{member.designation?.title || 'No designation'}</div>
                                                </div>
                                            </div>
                                        </TableCell>

                                        <TableCell className="px-4 py-3 border-r border-gray-100">
                                            <span className="font-mono text-sm font-medium text-[#064771] bg-blue-50 px-2 py-1 rounded">
                                                {member.employee_id}
                                            </span>
                                        </TableCell>

                                        <TableCell className="px-4 py-3 border-r border-gray-100">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                                                    {member.work_email || '-'}
                                                </div>
                                                {member.contact_number && (
                                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                                                        {member.contact_number}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>

                                        <TableCell className="px-4 py-3 border-r border-gray-100">
                                            {getRoleBadge(member)}
                                        </TableCell>

                                        <TableCell className="px-4 py-3 text-right sticky right-0 bg-white group-hover:bg-blue-50/30 z-30 border-l border-gray-100">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => navigate(`/employee/details/${member.id}`)}
                                                    className="p-2 hover:bg-blue-100 rounded-lg text-gray-400 hover:text-[#064771] transition-colors"
                                                    title="View Profile"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/settings/staff/edit/${member.id}`)}
                                                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-700 transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete([member.id])}
                                                    className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StaffManagement;
