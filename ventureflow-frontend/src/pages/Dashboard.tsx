import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, Users, Target, Briefcase, Handshake, Activity, ArrowUpRight,
  Plus, Clock, ChevronRight, RefreshCw
} from 'lucide-react';
import api from '../config/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Cell, PieChart, Pie
} from 'recharts';

// Types
interface DashboardStats {
  active_deals: number;
  pipeline_value: number;
  deals_this_month: number;
  won_deals_this_month: number;
  total_investors: number;
  investors_this_month: number;
  total_targets: number;
  targets_this_month: number;
  total_partners: number;
  partners_this_month: number;
  month_name: string;
}

interface PipelineStage {
  code: string;
  name: string;
  order: number;
  count: number;
  value: number;
}

interface ActivityItem {
  id: number;
  type: string;
  entity_type: string;
  entity_name: string;
  entity_id: number | null;
  content: string;
  user_name: string;
  link: string | null;
  time_ago: string;
}

interface RecentItem {
  id: number;
  type: string;
  name: string;
  code: string;
  country: string;
  country_flag: string | null;
  status: string;
  created_at: string;
  link: string;
}

// Format currency
const formatCurrency = (value: number): string => {
  if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
};

// Chart colors
const CHART_COLORS = ['#064771', '#0a5a8a', '#2196F3', '#64B5F6', '#90CAF9', '#BBDEFB'];
const PIE_COLORS = ['#064771', '#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#E91E63'];

// KPI Card Component
const KPICard: React.FC<{
  title: string;
  value: string | number;
  subValue?: string;
  icon: React.ReactNode;
  trend?: { value: number; label: string };
  color: string;
  onClick?: () => void;
}> = ({ title, value, subValue, icon, trend, color, onClick }) => (
  <div
    className={`bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-all ${onClick ? 'cursor-pointer' : ''}`}
    onClick={onClick}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
        {subValue && <p className="text-xs text-slate-400 mt-0.5">{subValue}</p>}
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            <ArrowUpRight className="w-3 h-3 text-green-500" />
            <span className="text-xs text-green-600 font-medium">+{trend.value}</span>
            <span className="text-xs text-slate-400">{trend.label}</span>
          </div>
        )}
      </div>
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${color}`}>
        {icon}
      </div>
    </div>
  </div>
);

// Activity Icon
const getActivityIcon = (entityType: string) => {
  switch (entityType) {
    case 'investor': return <Users className="w-4 h-4 text-blue-600" />;
    case 'target': return <Target className="w-4 h-4 text-orange-600" />;
    case 'deal': return <Briefcase className="w-4 h-4 text-purple-600" />;
    default: return <Activity className="w-4 h-4 text-slate-500" />;
  }
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [buyerPipeline, setBuyerPipeline] = useState<PipelineStage[]>([]);
  const [sellerPipeline, setSellerPipeline] = useState<PipelineStage[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [recentInvestors, setRecentInvestors] = useState<RecentItem[]>([]);
  const [recentTargets, setRecentTargets] = useState<RecentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pipelineType, setPipelineType] = useState<'buyer' | 'seller'>('buyer');

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, buyerPipelineRes, sellerPipelineRes, activityRes, recentRes] = await Promise.all([
        api.get('/api/dashboard/stats'),
        api.get('/api/dashboard/pipeline?type=buyer'),
        api.get('/api/dashboard/pipeline?type=seller'),
        api.get('/api/dashboard/activity?limit=8'),
        api.get('/api/dashboard/recent?limit=5'),
      ]);

      setStats(statsRes.data);
      setBuyerPipeline(Array.isArray(buyerPipelineRes.data) ? buyerPipelineRes.data : []);
      setSellerPipeline(Array.isArray(sellerPipelineRes.data) ? sellerPipelineRes.data : []);
      setActivities(Array.isArray(activityRes.data) ? activityRes.data : []);
      setRecentInvestors(recentRes.data?.investors || []);
      setRecentTargets(recentRes.data?.targets || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const currentPipeline = pipelineType === 'buyer' ? buyerPipeline : sellerPipeline;
  const totalDealsInPipeline = currentPipeline.reduce((sum, s) => sum + s.count, 0);

  // Prepare pie chart data
  const pieData = currentPipeline.filter(s => s.count > 0).map((stage, idx) => ({
    name: stage.name,
    value: stage.count,
    fill: PIE_COLORS[idx % PIE_COLORS.length],
  }));

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#f8fafc]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#064771]"></div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-[#f8fafc]">
      <div className="p-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">Dashboard</h1>
            <p className="text-sm text-slate-500 mt-0.5">{stats?.month_name} Overview</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchDashboardData}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={() => navigate('/prospects?tab=investors&action=new')}
              className="flex items-center gap-2 px-4 py-2 bg-[#064771] text-white rounded-lg hover:bg-[#053a5c] transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              New Investor
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KPICard
            title="Pipeline Value"
            value={formatCurrency(stats?.pipeline_value || 0)}
            subValue={`${stats?.active_deals || 0} active deals`}
            icon={<TrendingUp className="w-5 h-5 text-white" />}
            color="bg-gradient-to-br from-[#064771] to-[#0a5a8a]"
            onClick={() => navigate('/deal-pipeline')}
          />
          <KPICard
            title="Investors"
            value={stats?.total_investors || 0}
            icon={<Users className="w-5 h-5 text-white" />}
            trend={{ value: stats?.investors_this_month || 0, label: 'this month' }}
            color="bg-gradient-to-br from-blue-500 to-blue-600"
            onClick={() => navigate('/prospects?tab=investors')}
          />
          <KPICard
            title="Targets"
            value={stats?.total_targets || 0}
            icon={<Target className="w-5 h-5 text-white" />}
            trend={{ value: stats?.targets_this_month || 0, label: 'this month' }}
            color="bg-gradient-to-br from-orange-500 to-orange-600"
            onClick={() => navigate('/prospects?tab=targets')}
          />
          <KPICard
            title="Partners"
            value={stats?.total_partners || 0}
            icon={<Handshake className="w-5 h-5 text-white" />}
            trend={{ value: stats?.partners_this_month || 0, label: 'this month' }}
            color="bg-gradient-to-br from-green-500 to-green-600"
            onClick={() => navigate('/management/partners')}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pipeline Chart - Takes 2 columns */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Deal Pipeline</h2>
                <p className="text-sm text-slate-500">{totalDealsInPipeline} deals across stages</p>
              </div>
              <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setPipelineType('buyer')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${pipelineType === 'buyer' ? 'bg-white text-[#064771] shadow-sm' : 'text-slate-500'
                    }`}
                >
                  Investors
                </button>
                <button
                  onClick={() => setPipelineType('seller')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${pipelineType === 'seller' ? 'bg-white text-[#064771] shadow-sm' : 'text-slate-500'
                    }`}
                >
                  Targets
                </button>
              </div>
            </div>

            {currentPipeline.length > 0 ? (
              <div className="flex gap-4">
                {/* Bar Chart */}
                <div className="flex-1 h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={currentPipeline} layout="vertical" barSize={24}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        width={100}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                        formatter={(value: number) => [`${value} deals`, 'Count']}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {currentPipeline.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Pie Chart */}
                {pieData.length > 0 && (
                  <div className="w-[180px] h-[280px] flex flex-col items-center justify-center">
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`pie-cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <p className="text-center text-sm text-slate-500 mt-2">Stage Distribution</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <Briefcase className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  <p>No deals in pipeline</p>
                  <button
                    onClick={() => navigate('/deal-pipeline')}
                    className="mt-2 text-sm text-[#064771] hover:underline"
                  >
                    Create your first deal
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Activity Feed */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800">Recent Activity</h2>
              <Clock className="w-4 h-4 text-slate-400" />
            </div>

            {activities.length > 0 ? (
              <div className="space-y-3 max-h-[320px] overflow-y-auto">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className={`flex gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors ${activity.link ? 'cursor-pointer' : ''}`}
                    onClick={() => activity.link && navigate(activity.link)}
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                      {getActivityIcon(activity.entity_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 line-clamp-2">
                        <span className="font-medium">{activity.user_name}</span>
                        {' '}{activity.content || `updated ${activity.entity_name}`}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{activity.time_ago}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <Activity className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm">No recent activity</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Registrations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Recent Investors */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800">Recent Investors</h2>
              <button
                onClick={() => navigate('/prospects?tab=investors')}
                className="text-sm text-[#064771] hover:underline flex items-center gap-1"
              >
                View all <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {recentInvestors.length > 0 ? (
              <div className="space-y-2">
                {recentInvestors.map((investor) => (
                  <div
                    key={investor.id}
                    onClick={() => navigate(investor.link)}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                        <Users className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700">{investor.name}</p>
                        <p className="text-xs text-slate-400">{investor.code} • {investor.country}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-8">No investors yet</p>
            )}
          </div>

          {/* Recent Targets */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800">Recent Targets</h2>
              <button
                onClick={() => navigate('/prospects?tab=targets')}
                className="text-sm text-[#064771] hover:underline flex items-center gap-1"
              >
                View all <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {recentTargets.length > 0 ? (
              <div className="space-y-2">
                {recentTargets.map((target) => (
                  <div
                    key={target.id}
                    onClick={() => navigate(target.link)}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center">
                        <Target className="w-4 h-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700">{target.name}</p>
                        <p className="text-xs text-slate-400">{target.code} • {target.country}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-8">No targets yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
