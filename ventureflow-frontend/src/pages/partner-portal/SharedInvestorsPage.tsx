/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Search, Users, ChevronLeft, ChevronRight, Building2, Globe, MapPin, DollarSign, Briefcase } from 'lucide-react';
import api from '../../config/api';
import { showAlert } from '../../components/Alert';
import { BrandSpinner } from '../../components/BrandSpinner';

interface SharedInvestor {
    id: number;
    buyer_id?: string;
    company_overview_id?: number;
    financial_detail_id?: number;
    target_preference_id?: number;
    companyOverview?: any;
    financialDetails?: any;
    targetPreferences?: any;
}

const SharedInvestorsPage: React.FC = () => {
    const [investors, setInvestors] = useState<SharedInvestor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchInvestors();
    }, [currentPage, searchQuery]);

    const fetchInvestors = async () => {
        setIsLoading(true);
        try {
            const params: any = { page: currentPage };
            if (searchQuery) params.search = searchQuery;
            const res = await api.get('/api/partner-portal/investors', { params });
            const data = res.data;
            setInvestors(data.data || []);
            setTotalPages(data.last_page || 1);
        } catch (error) {
            console.error('Failed to fetch shared investors:', error);
            showAlert({ type: 'error', message: 'Failed to load shared investors' });
        } finally {
            setIsLoading(false);
        }
    };

    const getDisplayName = (inv: SharedInvestor): string => {
        return inv.companyOverview?.reg_name || inv.buyer_id || `Investor #${inv.id}`;
    };

    const getCountryName = (inv: SharedInvestor): string | null => {
        const co = inv.companyOverview;
        if (!co) return null;
        return co.hqCountry?.name || co.hq_country_name || null;
    };

    return (
        <div className="h-full flex flex-col bg-[#F8F9FB] p-6 md:p-8">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 bg-[#064771]/10 rounded-xl">
                        <Users className="w-6 h-6 text-[#064771]" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">Shared Investors</h1>
                        <p className="text-sm text-gray-500">Investors shared with your partnership</p>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name or ID..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#064771]/20 focus:border-[#064771] transition-all"
                    />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto scrollbar-premium">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <BrandSpinner size="lg" />
                    </div>
                ) : investors.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <Users className="w-16 h-16 mb-4 opacity-30" />
                        <p className="text-lg font-medium">No shared investors found</p>
                        <p className="text-sm mt-1">Investors shared by the admin will appear here</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {investors.map((inv) => {
                            const name = getDisplayName(inv);
                            const country = getCountryName(inv);
                            const co = inv.companyOverview;
                            const tp = inv.targetPreferences;

                            return (
                                <div
                                    key={inv.id}
                                    className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-[#064771]/20 transition-all duration-200"
                                >
                                    {/* Header */}
                                    <div className="flex items-start gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-lg bg-[#064771] flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                                            {name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-semibold text-gray-900 truncate">{name}</h3>
                                            {inv.buyer_id && (
                                                <span className="inline-block mt-1 text-[10px] font-mono bg-blue-50 text-[#064771] px-1.5 py-0.5 rounded border border-blue-100">
                                                    {inv.buyer_id}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div className="space-y-2 text-xs text-gray-600">
                                        {country && (
                                            <div className="flex items-center gap-2">
                                                <Globe className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                                <span className="truncate">{country}</span>
                                            </div>
                                        )}
                                        {co?.hq_address && (
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                                <span className="truncate">{co.hq_address}</span>
                                            </div>
                                        )}
                                        {co?.website && (
                                            <div className="flex items-center gap-2">
                                                <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                                <a href={co.website.startsWith('http') ? co.website : `https://${co.website}`} target="_blank" rel="noopener noreferrer" className="truncate text-[#064771] hover:underline">
                                                    {co.website}
                                                </a>
                                            </div>
                                        )}
                                        {tp?.investment_budget && (
                                            <div className="flex items-center gap-2">
                                                <DollarSign className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                                <span className="truncate">{tp.investment_budget}</span>
                                            </div>
                                        )}
                                        {tp?.purpose_of_ma && (
                                            <div className="flex items-center gap-2">
                                                <Briefcase className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                                <span className="truncate">{tp.purpose_of_ma}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-6">
                    <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage <= 1}
                        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-gray-600 px-3">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage >= totalPages}
                        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default SharedInvestorsPage;
