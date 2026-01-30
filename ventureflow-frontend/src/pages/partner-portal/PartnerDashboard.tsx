import React, { useState, useEffect, useContext } from 'react';
import { Users, Target, ArrowRight, TrendingUp, Briefcase, Clock, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../config/api';
import { AuthContext } from '../../routes/AuthContext';

const PartnerDashboard: React.FC = () => {
    const [stats, setStats] = useState({
        shared_investors: 0,
        shared_targets: 0
    });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const auth = useContext(AuthContext);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await api.get('/api/partner-portal/stats');
            setStats(res.data);
        } catch (error) {
            console.error('Failed to fetch partner stats', error);
        } finally {
            setLoading(false);
        }
    };

    const totalProspects = stats.shared_investors + stats.shared_targets;

    return (
        <div className="p-8 bg-gradient-to-br from-[#F8F9FB] to-white min-h-full">
            {/* Welcome Section */}
            <div className="mb-10">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#064771] to-[#0a6fb1] flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                        {auth?.user?.name?.charAt(0).toUpperCase() || 'P'}
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-[#064771] font-raleway">
                            Welcome back, {auth?.user?.name?.split(' ')[0] || 'Partner'}!
                        </h1>
                        <p className="text-gray-500">Here's an overview of your shared opportunities</p>
                    </div>
                </div>
            </div>

            {/* Stats Overview Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Total Shared */}
                <div className="bg-gradient-to-br from-[#064771] to-[#0a6fb1] p-6 rounded-2xl text-white shadow-xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm font-medium">Total Shared Prospects</p>
                            <h2 className="text-4xl font-bold mt-2">
                                {loading ? '...' : totalProspects}
                            </h2>
                        </div>
                        <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                            <Briefcase className="w-8 h-8" />
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/20 flex items-center gap-2 text-sm text-blue-100">
                        <TrendingUp className="w-4 h-4" />
                        <span>Investors + Targets</span>
                    </div>
                </div>

                {/* Investors Count */}
                <div
                    onClick={() => navigate('/partner-portal/investors')}
                    className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all cursor-pointer group hover:border-[#064771]/20"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Shared Investors</p>
                            <h2 className="text-3xl font-bold text-gray-900 mt-2">
                                {loading ? '...' : stats.shared_investors}
                            </h2>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-[#064771] group-hover:scale-105 transition-all">
                            <Users className="w-6 h-6 text-[#064771] group-hover:text-white" />
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
                        <span className="text-gray-400">Click to view list</span>
                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#064771] group-hover:translate-x-1 transition-all" />
                    </div>
                </div>

                {/* Targets Count */}
                <div
                    onClick={() => navigate('/partner-portal/targets')}
                    className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all cursor-pointer group hover:border-[#064771]/20"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Shared Targets</p>
                            <h2 className="text-3xl font-bold text-gray-900 mt-2">
                                {loading ? '...' : stats.shared_targets}
                            </h2>
                        </div>
                        <div className="p-3 bg-green-50 rounded-xl group-hover:bg-green-600 group-hover:scale-105 transition-all">
                            <Target className="w-6 h-6 text-green-600 group-hover:text-white" />
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
                        <span className="text-gray-400">Click to view list</span>
                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
                    </div>
                </div>
            </div>

            {/* Quick Actions & Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Quick Actions */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                        <h3 className="font-bold text-gray-900">Quick Actions</h3>
                    </div>
                    <div className="p-4 space-y-2">
                        <button
                            onClick={() => navigate('/partner-portal/investors')}
                            className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-blue-50 transition-colors group text-left"
                        >
                            <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-[#064771] transition-colors">
                                <Users className="w-5 h-5 text-[#064771] group-hover:text-white" />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-gray-900">Browse Investors</p>
                                <p className="text-xs text-gray-500">View shared investor profiles</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#064771] group-hover:translate-x-1 transition-all" />
                        </button>
                        <button
                            onClick={() => navigate('/partner-portal/targets')}
                            className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-green-50 transition-colors group text-left"
                        >
                            <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-600 transition-colors">
                                <Target className="w-5 h-5 text-green-600 group-hover:text-white" />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-gray-900">Browse Targets</p>
                                <p className="text-xs text-gray-500">View shared target profiles</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
                        </button>
                        <button
                            onClick={() => navigate('/partner-portal/settings')}
                            className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-gray-100 transition-colors group text-left"
                        >
                            <div className="p-2 bg-gray-200 rounded-lg group-hover:bg-gray-600 transition-colors">
                                <Shield className="w-5 h-5 text-gray-600 group-hover:text-white" />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-gray-900">Account Settings</p>
                                <p className="text-xs text-gray-500">Update your password</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
                        </button>
                    </div>
                </div>

                {/* Information Panel */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                        <h3 className="font-bold text-gray-900">Partner Information</h3>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex items-center gap-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                <Clock className="w-5 h-5 text-[#064771]" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">Access Status</p>
                                <p className="text-xs text-gray-500">Your account is active and connected</p>
                            </div>
                            <span className="ml-auto px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                                Active
                            </span>
                        </div>

                        <div className="text-sm text-gray-500 space-y-2 p-4">
                            <p>
                                As a registered partner, you have access to view shared investor and target profiles
                                that have been made available by the VentureFlow team.
                            </p>
                            <p>
                                <strong>Note:</strong> Some information fields may be restricted based on the sharing
                                settings configured by the administrator.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PartnerDashboard;
