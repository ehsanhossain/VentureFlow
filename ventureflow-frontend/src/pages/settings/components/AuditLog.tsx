import React, { useState, useEffect, useMemo, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { History, Filter, Calendar, User, Search, ChevronDown, LogIn, LogOut, Key, UserPlus, Trash2, RefreshCw, X } from 'lucide-react';
import api from '../../../config/api';
import { showAlert } from '../../../components/Alert';
import { AuthContext } from '../../../routes/AuthContext';
import { useNavigate } from 'react-router-dom';
import DataTable, { DataTableColumn } from '../../../components/table/DataTable';

interface AuditLogEntry {
    id: number;
    user_id: number | null;
    user_type: 'staff' | 'partner' | 'admin' | null;
    action: string;
    entity_type: string | null;
    entity_id: number | null;
    entity_name: string | null;
    description: string | null;
    ip_address: string | null;
    user_agent: string | null;
    performed_at: string;
    user?: {
        id: number;
        name: string;
        email: string;
    };
}

interface PaginationMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

const AuditLog: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const auth = useContext(AuthContext);
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState<PaginationMeta>({
        current_page: 1,
        last_page: 1,
        per_page: 25,
        total: 0
    });

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [userType, setUserType] = useState<string>('');
    const [actionFilter, setActionFilter] = useState<string>('');
    const [showFilters, setShowFilters] = useState(false);

    // Check if user is admin
    const isAdmin = auth?.role === 'System Admin';

    useEffect(() => {
        if (!isAdmin) {
            showAlert({ type: 'error', message: 'Access denied. Admin privileges required.' });
            navigate('/settings/general');
            return;
        }
        fetchLogs();
    }, [pagination.current_page, startDate, endDate, userType, actionFilter]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('page', pagination.current_page.toString());
            params.append('per_page', '25');

            if (startDate) params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);
            if (userType) params.append('user_type', userType);
            if (actionFilter) params.append('action', actionFilter);
            if (searchQuery) params.append('search', searchQuery);

            const res = await api.get(`/api/audit-logs?${params.toString()}`);
            setLogs(res.data.data || []);
            setPagination({
                current_page: res.data.current_page || 1,
                last_page: res.data.last_page || 1,
                per_page: res.data.per_page || 25,
                total: res.data.total || 0
            });
        } catch (error) {
            console.error('Failed to fetch audit logs:', error);
            showAlert({ type: 'error', message: 'Failed to load audit logs' });
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        setPagination(prev => ({ ...prev, current_page: 1 }));
        fetchLogs();
    };

    const clearFilters = () => {
        setSearchQuery('');
        setStartDate('');
        setEndDate('');
        setUserType('');
        setActionFilter('');
        setPagination(prev => ({ ...prev, current_page: 1 }));
    };

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'login':
                return <LogIn className="w-4 h-4 text-emerald-500" />;
            case 'logout':
                return <LogOut className="w-4 h-4 text-orange-500" />;
            case 'password_change':
                return <Key className="w-4 h-4 text-blue-500" />;
            case 'register':
            case 'create':
                return <UserPlus className="w-4 h-4 text-violet-500" />;
            case 'delete':
                return <Trash2 className="w-4 h-4 text-red-500" />;
            default:
                return <History className="w-4 h-4 text-gray-500" />;
        }
    };

    const getActionBadge = (action: string) => {
        const styles: Record<string, string> = {
            login: 'bg-emerald-50 text-emerald-700 border-emerald-100',
            logout: 'bg-orange-50 text-orange-700 border-orange-100',
            password_change: 'bg-blue-50 text-blue-700 border-blue-100',
            register: 'bg-violet-50 text-violet-700 border-violet-100',
            create: 'bg-violet-50 text-violet-700 border-violet-100',
            delete: 'bg-red-50 text-red-700 border-red-100',
            update: 'bg-amber-50 text-amber-700 border-amber-100',
        };

        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] text-[10px] font-medium border ${styles[action] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                {getActionIcon(action)}
                {action.replace(/_/g, ' ').toUpperCase()}
            </span>
        );
    };

    const getUserTypeBadge = (type: string | null) => {
        if (!type) return null;

        const styles: Record<string, string> = {
            admin: 'bg-amber-50 text-amber-700 border-amber-200',
            staff: 'bg-blue-50 text-blue-700 border-blue-200',
            partner: 'bg-purple-50 text-purple-700 border-purple-200',
        };

        return (
            <span className={`inline-flex px-2 py-0.5 rounded-[3px] text-[9px] font-medium uppercase border ${styles[type] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                {type}
            </span>
        );
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const columns: DataTableColumn<AuditLogEntry>[] = [
        {
            id: 'performed_at',
            header: 'Date & Time',
            accessor: (row) => (
                <div className="text-xs text-gray-600">
                    {formatDate(row.performed_at)}
                </div>
            ),
            width: 160
        },
        {
            id: 'user',
            header: 'User',
            accessor: (row) => (
                <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-gray-900 truncate">
                        {row.user?.name || 'System'}
                    </span>
                    <span className="text-[10px] text-gray-500 truncate">
                        {row.user?.email || '-'}
                    </span>
                </div>
            ),
            width: 200
        },
        {
            id: 'user_type',
            header: 'Type',
            accessor: (row) => getUserTypeBadge(row.user_type),
            width: 100
        },
        {
            id: 'action',
            header: 'Action',
            accessor: (row) => getActionBadge(row.action),
            width: 150
        },
        {
            id: 'description',
            header: 'Description',
            accessor: (row) => (
                <div className="text-xs text-gray-600 truncate" title={row.description || ''}>
                    {row.description || row.entity_name ? `${row.entity_type}: ${row.entity_name}` : '-'}
                </div>
            ),
            width: 250
        },
        {
            id: 'ip_address',
            header: 'IP Address',
            accessor: (row) => (
                <span className="text-xs font-mono text-gray-500">
                    {row.ip_address || '-'}
                </span>
            ),
            width: 120
        }
    ];

    const filteredLogs = useMemo(() => {
        if (!searchQuery) return logs;
        const query = searchQuery.toLowerCase();
        return logs.filter(log =>
            log.user?.name?.toLowerCase().includes(query) ||
            log.user?.email?.toLowerCase().includes(query) ||
            log.description?.toLowerCase().includes(query) ||
            log.entity_name?.toLowerCase().includes(query) ||
            log.action.toLowerCase().includes(query)
        );
    }, [logs, searchQuery]);

    if (!isAdmin) {
        return null;
    }

    return (
        <div className="h-full flex flex-col bg-[#f9fafb] overflow-hidden ">
            {/* Header */}
            <div className="px-8 py-6">
                <div className="flex items-center justify-between gap-6">
                    <div className="flex items-center gap-8 flex-1">
                        <h1 className="text-2xl font-medium text-gray-900 whitespace-nowrap">
                            {t('settings.auditLog.title', 'Audit Log')}
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-[3px] border text-sm font-medium transition-all ${showFilters
                                ? 'bg-[#064771] text-white border-[#064771]'
                                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            <Filter className="w-4 h-4" />
                            Filters
                            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                        </button>
                        <button
                            onClick={fetchLogs}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-[3px] text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
                <div className="px-8 pb-4">
                    <div className="bg-white rounded-[3px] border border-gray-100 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            {/* Search */}
                            <div className="lg:col-span-2">
                                <label className="block text-xs font-medium text-gray-500 mb-1.5">Search</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                        placeholder="Search by user, action, or description..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-[3px] text-sm focus:outline-none focus:ring-2 focus:ring-[#064771]/20 focus:border-[#064771]"
                                    />
                                </div>
                            </div>

                            {/* Date Range */}
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1.5">Start Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-[3px] text-sm focus:outline-none focus:ring-2 focus:ring-[#064771]/20 focus:border-[#064771]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1.5">End Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-[3px] text-sm focus:outline-none focus:ring-2 focus:ring-[#064771]/20 focus:border-[#064771]"
                                    />
                                </div>
                            </div>

                            {/* User Type */}
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1.5">User Type</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <select
                                        value={userType}
                                        onChange={(e) => setUserType(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-[3px] text-sm focus:outline-none focus:ring-2 focus:ring-[#064771]/20 focus:border-[#064771] bg-white appearance-none"
                                    >
                                        <option value="">All Users</option>
                                        <option value="admin">Admin</option>
                                        <option value="staff">Staff</option>
                                        <option value="partner">Partner</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Action Type Filter */}
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <label className="block text-xs font-medium text-gray-500 mb-2">Action Type</label>
                            <div className="flex flex-wrap gap-2">
                                {['', 'login', 'logout', 'password_change', 'register', 'create', 'update', 'delete'].map((action) => (
                                    <button
                                        key={action}
                                        onClick={() => setActionFilter(action)}
                                        className={`px-3 py-1.5 rounded-[3px] text-xs font-medium transition-all ${actionFilter === action
                                            ? 'bg-[#064771] text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        {action === '' ? 'All Actions' : action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Filter Actions */}
                        <div className="mt-4 flex items-center justify-between pt-4 border-t border-gray-100">
                            <button
                                onClick={clearFilters}
                                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
                            >
                                <X className="w-4 h-4" />
                                Clear all filters
                            </button>
                            <button
                                onClick={handleSearch}
                                className="flex items-center gap-2 px-4 py-2 bg-[#064771] text-white rounded-[3px] text-sm font-medium hover:bg-[#053a5c] transition-all"
                            >
                                <Search className="w-4 h-4" />
                                Apply Filters
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="flex-1 px-8 pb-8 overflow-hidden">
                <div className="h-full bg-white rounded-[3px] overflow-hidden">
                    <DataTable
                        data={filteredLogs}
                        columns={columns}
                        isLoading={loading}
                        emptyMessage="No audit logs found"
                        getRowId={(row) => row.id}
                    />
                </div>
            </div>

            {/* Pagination */}
            {pagination.total > 0 && (
                <div className="px-8 pb-6">
                    <div className="flex items-center justify-between bg-white rounded-[3px] px-6 py-4">
                        <span className="text-sm text-gray-500">
                            Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total} entries
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, current_page: prev.current_page - 1 }))}
                                disabled={pagination.current_page === 1}
                                className="px-3 py-1.5 rounded-[3px] border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <span className="px-3 py-1.5 bg-[#064771] text-white rounded-[3px] text-sm font-medium">
                                {pagination.current_page}
                            </span>
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, current_page: prev.current_page + 1 }))}
                                disabled={pagination.current_page === pagination.last_page}
                                className="px-3 py-1.5 rounded-[3px] border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuditLog;
