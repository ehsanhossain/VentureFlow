import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, RefreshCw, User, Globe, Building2, ExternalLink } from 'lucide-react';
import api from '../../config/api';
import { INVESTOR_FIELDS, TARGET_FIELDS } from '../settings/components/PartnerSharingSettings';

interface Props {
    type: 'investor' | 'target';
}

const PartnerProspects: React.FC<Props> = ({ type }) => {
    const [data, setData] = useState<any[]>([]);
    const [columns, setColumns] = useState<{ key: string; label: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<any>({});

    const endpoint = type === 'investor' ? '/api/partner-portal/buyers' : '/api/partner-portal/sellers';
    const title = type === 'investor' ? 'Shared Investors' : 'Shared Targets';

    // Get all relevant field definitions for this type, excluding locked fields
    const fieldDefs = type === 'investor' ? INVESTOR_FIELDS : TARGET_FIELDS;
    const flatFields = fieldDefs.flatMap(cat => cat.fields).filter(f => !f.locked);

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [type, page]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get(endpoint, {
                params: { page, search }
            });
            const results = res.data.data;
            setData(results);
            setPagination(res.data);

            if (results.length > 0) {
                // Determine which columns to show based on what's actually in the returned data
                // Only show fields that exist in the result AND are in our field config
                const availableCols: { key: string; label: string }[] = [];

                flatFields.forEach(field => {
                    const value = getValue(results[0], field.key);
                    // Only add if value exists and is not null/undefined
                    if (value !== undefined && value !== null) {
                        availableCols.push({ key: field.key, label: field.label });
                    }
                });

                setColumns(availableCols);
            } else {
                setColumns([]);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Convert snake_case to camelCase
    const toCamelCase = (str: string) => {
        return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    };

    const getValue = (item: any, path: string) => {
        // Handle root level keys first
        if (path === 'buyer_id' || path === 'seller_id') return item[path];

        // Handle nested keys - convert snake_case path parts to camelCase for Laravel relationships
        const parts = path.split('.');
        let current = item;

        for (const part of parts) {
            if (!current) return undefined;

            // Try camelCase first (Laravel's default), then snake_case
            const camelKey = toCamelCase(part);
            if (current[camelKey] !== undefined) {
                current = current[camelKey];
            } else if (current[part] !== undefined) {
                current = current[part];
            } else {
                return undefined;
            }
        }

        return current;
    };

    const renderValue = (value: any, key: string) => {
        if (value === null || value === undefined || value === '') return <span className="text-gray-400">-</span>;

        // Handle specific fields
        if (key.includes('website') || key.includes('link')) {
            const url = String(value).startsWith('http') ? String(value) : `https://${value}`;
            return (
                <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    <span>View Link</span>
                    <ExternalLink className="w-2 h-2" />
                </a>
            );
        }

        if (key.includes('budget') || key.includes('amount')) {
            if (typeof value === 'object' && !Array.isArray(value)) {
                return `${value.min || 0} - ${value.max || '∞'} ${value.currency || 'USD'}`;
            }
            return String(value);
        }

        if (key.includes('country')) {
            if (Array.isArray(value)) {
                return value.map((c: any) => c.name || c).join(', ');
            }
            return value.name || value;
        }

        if (key.includes('industry') || key.includes('ops')) {
            if (Array.isArray(value)) {
                return (
                    <div className="flex flex-wrap gap-1">
                        {value.map((i: any, idx: number) => (
                            <span key={idx} className="px-2 py-0.5 bg-gray-100 rounded-full text-[10px] text-gray-600">
                                {i.name || i}
                            </span>
                        ))}
                    </div>
                );
            }
        }

        if (key.includes('contacts') || key.includes('pic') || key.includes('advisor')) {
            if (Array.isArray(value)) {
                return (
                    <div className="flex flex-col gap-1">
                        {value.slice(0, 2).map((c: any, idx: number) => (
                            <div key={idx} className="text-xs flex items-center gap-1">
                                <User className="w-3 h-3 text-gray-400" />
                                <span>{c.name || c.full_name || c}</span>
                            </div>
                        ))}
                        {value.length > 2 && <span className="text-[10px] text-gray-400">+{value.length - 2} more</span>}
                    </div>
                );
            }
        }

        if (key.includes('address')) {
            if (Array.isArray(value)) {
                return value.map((a: any) => a.address || a).join('; ');
            }
        }

        if (Array.isArray(value)) return value.join(', ');
        if (typeof value === 'object') return JSON.stringify(value);

        return String(value);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchData();
    };

    return (
        <div className="p-8 h-full flex flex-col bg-[#F8FAFC]">
            <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[#064771] font-raleway flex items-center gap-3">
                        {type === 'investor' ? <User className="w-8 h-8" /> : <Building2 className="w-8 h-8" />}
                        {title}
                    </h1>
                    <p className="text-gray-500 mt-1">Accessing {pagination.total || 0} shared {type} profiles</p>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <form onSubmit={handleSearch} className="relative flex-1 md:flex-none">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder={`Search ${type}s...`}
                            className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#064771] w-full md:w-80 text-sm shadow-sm transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </form>
                    <button
                        onClick={() => { setPage(1); fetchData(); }}
                        className="p-2.5 text-gray-500 hover:text-[#064771] bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden flex-1 flex flex-col">
                <div className="overflow-x-auto flex-1">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-[#F8FAFC]">
                            <tr>
                                {columns.map((col) => (
                                    <th key={col.key} className="px-6 py-5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap border-b border-gray-100">
                                        {col.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {loading && data.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length || 1} className="text-center py-24">
                                        <div className="flex flex-col items-center gap-3">
                                            <RefreshCw className="w-10 h-10 text-gray-200 animate-spin" />
                                            <p className="text-gray-400 font-medium">Fetching shared profiles...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length || 1} className="text-center py-24">
                                        <div className="flex flex-col items-center gap-3 opacity-40">
                                            {type === 'investor' ? <User className="w-16 h-16" /> : <Building2 className="w-16 h-16" />}
                                            <p className="text-xl font-bold text-gray-900">No {type}s shared yet</p>
                                            <p className="text-sm text-gray-500 max-w-xs mx-auto">Contact the administrator if you believe this is an error.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                data.map((item, idx) => (
                                    <tr key={item.id || idx} className="hover:bg-blue-50/30 transition-colors group">
                                        {columns.map(col => (
                                            <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                {renderValue(getValue(item, col.key), col.key)}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-8 py-5 border-t border-gray-100 bg-[#F8FAFC] flex justify-between items-center">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>
                            Page <span className="font-bold text-gray-900">{pagination.current_page || 1}</span> of <span className="font-bold text-gray-900">{pagination.last_page || 1}</span>
                        </span>
                        <div className="h-4 w-px bg-gray-300"></div>
                        <span>Total {pagination.total || 0} records</span>
                    </div>
                    <div className="flex gap-3">
                        <button
                            disabled={!pagination.prev_page_url}
                            onClick={() => setPage(p => p - 1)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 disabled:opacity-40 hover:bg-gray-50 hover:shadow-sm transition-all active:scale-95"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                        </button>
                        <button
                            disabled={!pagination.next_page_url}
                            onClick={() => setPage(p => p + 1)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 disabled:opacity-40 hover:bg-gray-50 hover:shadow-sm transition-all active:scale-95"
                        >
                            Next
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PartnerProspects;
