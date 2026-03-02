/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Target, TrendingUp, ArrowRight } from 'lucide-react';
import api from '../../config/api';
import { BrandSpinner } from '../../components/BrandSpinner';

const PartnerDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<{ shared_investors: number; shared_targets: number } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/api/partner-portal/stats');
                setStats(res.data);
            } catch (error) {
                console.error('Failed to fetch partner stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <BrandSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="h-full p-6 md:p-8 bg-[#F8F9FB] overflow-y-auto scrollbar-premium">
            {/* Welcome */}
            <div className="mb-8">
                <h1 className="text-2xl font-semibold text-gray-900">Partner Dashboard</h1>
                <p className="text-sm text-gray-500 mt-1">Overview of your shared data and partnership status</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {/* Shared Investors */}
                <div
                    onClick={() => navigate('/partner-portal/investors')}
                    className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-[#064771]/20 transition-all duration-200 cursor-pointer group"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-[#064771]/10 rounded-xl group-hover:bg-[#064771]/15 transition-colors">
                            <Users className="w-6 h-6 text-[#064771]" />
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-[#064771] group-hover:translate-x-1 transition-all" />
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-gray-900">{stats?.shared_investors ?? 0}</p>
                        <p className="text-sm text-gray-500 mt-1">Shared Investors</p>
                    </div>
                </div>

                {/* Shared Targets */}
                <div
                    onClick={() => navigate('/partner-portal/targets')}
                    className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-emerald-200 transition-all duration-200 cursor-pointer group"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-emerald-50 rounded-xl group-hover:bg-emerald-100 transition-colors">
                            <Target className="w-6 h-6 text-emerald-600" />
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-gray-900">{stats?.shared_targets ?? 0}</p>
                        <p className="text-sm text-gray-500 mt-1">Shared Targets</p>
                    </div>
                </div>

                {/* Partnership Status */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-amber-50 rounded-xl">
                            <TrendingUp className="w-6 h-6 text-amber-600" />
                        </div>
                    </div>
                    <div>
                        <p className="text-lg font-semibold text-green-600">Active</p>
                        <p className="text-sm text-gray-500 mt-1">Partnership Status</p>
                    </div>
                </div>
            </div>

            {/* Info Box */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">About Your Partnership</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                    Your partnership gives you access to shared investor and target data as configured by the
                    VentureFlow admin. The data you see is filtered based on the sharing settings configured
                    for your partnership. Contact the admin for any changes to access levels.
                </p>
            </div>
        </div>
    );
};

export default PartnerDashboard;
