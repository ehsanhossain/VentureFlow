import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, Users, Target, Briefcase, Activity, ArrowUpRight, AlertTriangle,
  Plus, Clock, ChevronRight, RefreshCw, Globe, ArrowRight, Zap, Link2, Calendar
} from 'lucide-react';
import api from '../config/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, LineChart, Line, Legend
} from 'recharts';

// =============== TYPES ===============
interface DashboardData {
  stats: {
    active_deals: number;
    pipeline_value: number;
    deals_this_month: number;
    total_investors: number;
    total_targets: number;
    investors_this_month: number;
    targets_this_month: number;
    unmatched_investors: number;
    unmatched_targets: number;
    month_name: string;
  };
  deals_needing_action: DealAction[];
  buyer_pipeline: PipelineStage[];
  seller_pipeline: PipelineStage[];
  deal_flow_trend: MonthTrend[];
  geo_distribution: GeoItem[];
  activities: ActivityItem[];
  recent_investors: RecentItem[];
  recent_targets: RecentItem[];
}

interface DealAction {
  id: number;
  name: string;
  buyer_name: string | null;
  seller_name: string | null;
  stage_name: string;
  stage_code: string;
  progress: number;
  priority: string;
  urgency: string;
  days_since_update: number;
  target_close_date: string | null;
  pic_name: string;
  estimated_value: number | null;
  currency: string;
}

interface PipelineStage {
  code: string;
  name: string;
  order: number;
  progress: number;
  count: number;
  value: number;
}

interface MonthTrend {
  month: string;
  full_month: string;
  created: number;
  won: number;
  lost: number;
}

interface GeoItem {
  country_id: number;
  country_name: string;
  alpha_2_code: string;
  flag: string | null;
  investors: number;
  targets: number;
  total: number;
}

interface ActivityItem {
  id: number;
  type: string;
  entity_type: string;
  entity_name: string;
  content: string;
  user_name: string;
  link: string | null;
  time_ago: string;
}

interface RecentItem {
  id: number;
  name: string;
  code: string;
  country: string;
  flag: string | null;
  link: string;
}

// =============== HELPERS ===============
const formatCurrency = (value: number): string => {
  if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
};

const PIPELINE_COLORS = ['#064771', '#0a6e9e', '#2196F3', '#64B5F6', '#90CAF9', '#BBDEFB', '#0d8bc2', '#3aa8d8', '#1976D2', '#0D47A1'];

const getUrgencyBadge = (urgency: string) => {
  switch (urgency) {
    case 'overdue':
      return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'Overdue' };
    case 'stale':
      return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Stale' };
    default:
      return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', label: 'On Track' };
  }
};

const getActivityIcon = (entityType: string) => {
  switch (entityType) {
    case 'investor': return <Users className="w-3.5 h-3.5 text-[#064771]" />;
    case 'target': return <Target className="w-3.5 h-3.5 text-orange-600" />;
    case 'deal': return <Briefcase className="w-3.5 h-3.5 text-purple-600" />;
    default: return <Activity className="w-3.5 h-3.5 text-gray-500" />;
  }
};

// =============== COMPONENT ===============
const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pipelineView, setPipelineView] = useState<'buyer' | 'seller'>('buyer');

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/dashboard');
      setData(res.data);
    } catch (err) {
      console.error('Dashboard fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const activePipeline = useMemo(() => {
    if (!data) return [];
    return pipelineView === 'buyer' ? data.buyer_pipeline : data.seller_pipeline;
  }, [data, pipelineView]);

  const totalPipelineDeals = useMemo(() =>
    activePipeline.reduce((s, p) => s + p.count, 0), [activePipeline]);

  const geoBarData = useMemo(() => {
    if (!data) return [];
    return data.geo_distribution.slice(0, 10);
  }, [data]);

  if (loading || !data) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#064771]"></div>
      </div>
    );
  }

  const { stats } = data;

  return (
    <div className="flex flex-col w-full min-h-screen bg-white" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* ======= HEADER ======= */}
      <div className="sticky top-0 z-20 bg-white border-b border-[#E5E7EB] px-5 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-medium text-gray-900">Command Center</h1>
            <span className="text-[13px] font-medium text-[#9CA3AF]">{stats.month_name}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchDashboard}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#E5E7EB] rounded-[3px] text-[#374151] text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={() => navigate('/prospects?tab=investors&action=new')}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#064771] text-white rounded-[3px] text-sm font-medium hover:bg-[#053a5c] transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Prospect
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 py-5 space-y-0">

        {/* ======= ROW 1: DEALS NEEDING ACTION (full width) ======= */}
        <div className="border border-[#E5E7EB] rounded-t-[3px]">
          <div className="px-4 py-3 flex items-center justify-between border-b border-[#F3F4F6]">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h2 className="text-[13px] font-semibold text-gray-900 uppercase tracking-wide">Deals Requiring Action</h2>
              <span className="text-[11px] text-[#9CA3AF] font-medium ml-1">
                {data.deals_needing_action.length} deal{data.deals_needing_action.length !== 1 ? 's' : ''}
              </span>
            </div>
            <button
              onClick={() => navigate('/deal-pipeline')}
              className="text-[11px] text-[#064771] font-medium hover:underline flex items-center gap-0.5"
            >
              View Pipeline <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {data.deals_needing_action.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#F3F4F6]">
                    <th className="px-4 py-2 text-[11px] font-medium text-[#9CA3AF] uppercase">Deal</th>
                    <th className="px-4 py-2 text-[11px] font-medium text-[#9CA3AF] uppercase">Buyer → Seller</th>
                    <th className="px-4 py-2 text-[11px] font-medium text-[#9CA3AF] uppercase">Stage</th>
                    <th className="px-4 py-2 text-[11px] font-medium text-[#9CA3AF] uppercase">Value</th>
                    <th className="px-4 py-2 text-[11px] font-medium text-[#9CA3AF] uppercase">PIC</th>
                    <th className="px-4 py-2 text-[11px] font-medium text-[#9CA3AF] uppercase">Status</th>
                    <th className="px-4 py-2 text-[11px] font-medium text-[#9CA3AF] uppercase">Idle</th>
                  </tr>
                </thead>
                <tbody>
                  {data.deals_needing_action.map((deal) => {
                    const badge = getUrgencyBadge(deal.urgency);
                    return (
                      <tr
                        key={deal.id}
                        className="border-b border-[#F9FAFB] hover:bg-[#FAFBFC] cursor-pointer transition-colors"
                        onClick={() => navigate('/deal-pipeline')}
                      >
                        <td className="px-4 py-2.5">
                          <span className="text-sm font-medium text-[#1F2937]">{deal.name}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1.5 text-[12px] text-[#6B7280]">
                            <span className="font-medium text-[#374151]">{deal.buyer_name || '—'}</span>
                            <ArrowRight className="w-3 h-3 text-[#D1D5DB]" />
                            <span className="font-medium text-[#374151]">{deal.seller_name || '—'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-[12px] text-[#6B7280]">{deal.stage_name}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-[12px] font-medium text-[#1F2937]">
                            {deal.estimated_value ? formatCurrency(deal.estimated_value) : '—'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-[12px] text-[#6B7280]">{deal.pic_name}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`px-2 py-0.5 text-[11px] font-medium rounded-[2px] border ${badge.bg} ${badge.text} ${badge.border}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-[12px] text-[#9CA3AF]">{deal.days_since_update}d</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center">
              <Zap className="w-8 h-8 mx-auto mb-2 text-green-400" />
              <p className="text-sm text-[#6B7280]">All deals are on track!</p>
            </div>
          )}
        </div>

        {/* ======= ROW 2: KPI SUMMARY BAR (connected to top) ======= */}
        <div className="grid grid-cols-5 border border-t-0 border-[#E5E7EB] divide-x divide-[#E5E7EB]">
          {/* Pipeline Value */}
          <div className="p-3.5 cursor-pointer hover:bg-[#FAFBFC] transition-colors" onClick={() => navigate('/deal-pipeline')}>
            <p className="text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wide">Pipeline Value</p>
            <p className="text-lg font-semibold text-gray-900 mt-0.5">{formatCurrency(stats.pipeline_value)}</p>
            <p className="text-[11px] text-[#9CA3AF]">{stats.active_deals} active deal{stats.active_deals !== 1 ? 's' : ''}</p>
          </div>

          {/* Investors */}
          <div className="p-3.5 cursor-pointer hover:bg-[#FAFBFC] transition-colors" onClick={() => navigate('/prospects?tab=investors')}>
            <p className="text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wide">Investors</p>
            <p className="text-lg font-semibold text-gray-900 mt-0.5">{stats.total_investors}</p>
            {stats.investors_this_month > 0 && (
              <div className="flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3 text-green-600" />
                <span className="text-[11px] text-green-600 font-medium">+{stats.investors_this_month} this month</span>
              </div>
            )}
          </div>

          {/* Targets */}
          <div className="p-3.5 cursor-pointer hover:bg-[#FAFBFC] transition-colors" onClick={() => navigate('/prospects?tab=targets')}>
            <p className="text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wide">Targets</p>
            <p className="text-lg font-semibold text-gray-900 mt-0.5">{stats.total_targets}</p>
            {stats.targets_this_month > 0 && (
              <div className="flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3 text-green-600" />
                <span className="text-[11px] text-green-600 font-medium">+{stats.targets_this_month} this month</span>
              </div>
            )}
          </div>

          {/* Unmatched Investors */}
          <div className="p-3.5">
            <p className="text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wide">Unmatched Investors</p>
            <p className="text-lg font-semibold text-gray-900 mt-0.5">{stats.unmatched_investors}</p>
            <p className="text-[11px] text-[#9CA3AF]">seeking targets</p>
          </div>

          {/* Unmatched Targets */}
          <div className="p-3.5">
            <p className="text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wide">Unmatched Targets</p>
            <p className="text-lg font-semibold text-gray-900 mt-0.5">{stats.unmatched_targets}</p>
            <p className="text-[11px] text-[#9CA3AF]">seeking buyers</p>
          </div>
        </div>

        {/* ======= ROW 3: Pipeline Funnel + Deal Flow Trend ======= */}
        <div className="grid grid-cols-5 border border-t-0 border-[#E5E7EB] divide-x divide-[#E5E7EB]">
          {/* Pipeline Funnel (3 cols) */}
          <div className="col-span-3 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h2 className="text-[13px] font-semibold text-gray-900 uppercase tracking-wide">Pipeline Stages</h2>
                <span className="text-[11px] text-[#9CA3AF] font-medium">{totalPipelineDeals} deals</span>
              </div>
              <div className="flex border border-[#E5E7EB] rounded-[3px] overflow-hidden">
                <button
                  onClick={() => setPipelineView('buyer')}
                  className={`px-3 py-1 text-[11px] font-medium transition-colors ${pipelineView === 'buyer' ? 'bg-[#064771] text-white' : 'bg-white text-[#6B7280] hover:bg-gray-50'
                    }`}
                >
                  Investor Side
                </button>
                <button
                  onClick={() => setPipelineView('seller')}
                  className={`px-3 py-1 text-[11px] font-medium border-l border-[#E5E7EB] transition-colors ${pipelineView === 'seller' ? 'bg-[#064771] text-white' : 'bg-white text-[#6B7280] hover:bg-gray-50'
                    }`}
                >
                  Target Side
                </button>
              </div>
            </div>

            {activePipeline.length > 0 ? (
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activePipeline} layout="vertical" barSize={16}>
                    <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} stroke="#F3F4F6" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                    <YAxis
                      type="category" dataKey="name" axisLine={false} tickLine={false}
                      tick={{ fontSize: 11, fill: '#6B7280' }} width={90}
                    />
                    <Tooltip
                      contentStyle={{ border: '1px solid #E5E7EB', borderRadius: '3px', fontSize: '11px', backgroundColor: '#fff' }}
                      formatter={(v: number, _name: string, props: any) => [`${v} deals (${formatCurrency(props.payload.value)})`, '']}
                    />
                    <Bar dataKey="count" radius={[0, 2, 2, 0]}>
                      {activePipeline.map((_, i) => (
                        <Cell key={i} fill={PIPELINE_COLORS[i % PIPELINE_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[220px] flex items-center justify-center">
                <p className="text-sm text-[#9CA3AF]">No pipeline data available</p>
              </div>
            )}
          </div>

          {/* Deal Flow Trend (2 cols) */}
          <div className="col-span-2 p-4">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-[13px] font-semibold text-gray-900 uppercase tracking-wide">Deal Flow</h2>
              <span className="text-[11px] text-[#9CA3AF] font-medium">Last 6 Months</span>
            </div>

            {data.deal_flow_trend.length > 0 ? (
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.deal_flow_trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ border: '1px solid #E5E7EB', borderRadius: '3px', fontSize: '11px', backgroundColor: '#fff' }}
                    />
                    <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: '11px', color: '#6B7280' }} />
                    <Line type="monotone" dataKey="created" stroke="#064771" strokeWidth={2} dot={{ r: 3 }} name="Created" />
                    <Line type="monotone" dataKey="won" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} name="Won" />
                    <Line type="monotone" dataKey="lost" stroke="#dc2626" strokeWidth={2} dot={{ r: 3 }} name="Lost" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[220px] flex items-center justify-center">
                <p className="text-sm text-[#9CA3AF]">No trend data yet</p>
              </div>
            )}
          </div>
        </div>

        {/* ======= ROW 4: Geographic Distribution + Activity Feed ======= */}
        <div className="grid grid-cols-5 border border-t-0 border-[#E5E7EB] divide-x divide-[#E5E7EB]">
          {/* Geo Distribution (3 cols) */}
          <div className="col-span-3 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#064771]" />
                <h2 className="text-[13px] font-semibold text-gray-900 uppercase tracking-wide">Global Coverage</h2>
                <span className="text-[11px] text-[#9CA3AF] font-medium">{data.geo_distribution.length} countries</span>
              </div>
            </div>

            {geoBarData.length > 0 ? (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={geoBarData} barGap={0} barSize={10}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                    <XAxis dataKey="country_name" axisLine={false} tickLine={false}
                      tick={{ fontSize: 10, fill: '#9CA3AF' }}
                      interval={0}
                      angle={-30}
                      textAnchor="end"
                      height={50}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ border: '1px solid #E5E7EB', borderRadius: '3px', fontSize: '11px', backgroundColor: '#fff' }}
                    />
                    <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: '11px', color: '#6B7280' }} />
                    <Bar dataKey="investors" name="Investors" fill="#064771" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="targets" name="Targets" fill="#f97316" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center">
                <Globe className="w-10 h-10 text-[#D1D5DB] mb-2" />
                <p className="text-sm text-[#9CA3AF]">No geographic data available</p>
              </div>
            )}
          </div>

          {/* Activity Feed (2 cols) */}
          <div className="col-span-2 p-4 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-[13px] font-semibold text-gray-900 uppercase tracking-wide">Recent Activity</h2>
              <Clock className="w-3.5 h-3.5 text-[#9CA3AF]" />
            </div>

            {data.activities.length > 0 ? (
              <div className="flex-1 overflow-y-auto max-h-[230px] divide-y divide-[#F3F4F6]">
                {data.activities.map((act) => (
                  <div
                    key={act.id}
                    className={`flex gap-2.5 py-2 ${act.link ? 'cursor-pointer hover:bg-[#FAFBFC]' : ''} transition-colors`}
                    onClick={() => act.link && navigate(act.link)}
                  >
                    <div className="w-6 h-6 rounded-full bg-[#F3F4F6] flex items-center justify-center flex-shrink-0 mt-0.5">
                      {getActivityIcon(act.entity_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-[#374151] leading-[1.4]">
                        <span className="font-medium">{act.user_name}</span>
                        {' '}{act.content || `updated ${act.entity_name}`}
                      </p>
                      <p className="text-[10px] text-[#9CA3AF] mt-0.5">{act.time_ago}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-xs text-[#9CA3AF]">No recent activity</p>
              </div>
            )}
          </div>
        </div>

        {/* ======= ROW 5: Recent Investors + Recent Targets ======= */}
        <div className="grid grid-cols-2 border border-t-0 border-[#E5E7EB] rounded-b-[3px] divide-x divide-[#E5E7EB]">
          {/* Recent Investors */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-[#064771]" />
                <h2 className="text-[13px] font-semibold text-gray-900 uppercase tracking-wide">Recent Investors</h2>
              </div>
              <button
                onClick={() => navigate('/prospects?tab=investors')}
                className="text-[11px] text-[#064771] font-medium hover:underline flex items-center gap-0.5"
              >
                View all <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            {data.recent_investors.length > 0 ? (
              <div className="divide-y divide-[#F3F4F6]">
                {data.recent_investors.map((inv) => (
                  <div
                    key={inv.id}
                    onClick={() => navigate(inv.link)}
                    className="flex items-center justify-between py-2 hover:bg-[#FAFBFC] cursor-pointer transition-colors -mx-2 px-2 rounded-[2px]"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#064771] flex items-center justify-center text-white text-[10px] font-medium">
                        {inv.name?.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-[#1F2937]">{inv.name}</p>
                        <p className="text-[11px] text-[#9CA3AF]">{inv.code} · {inv.country}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-[#D1D5DB]" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-[#9CA3AF] text-center py-4">No investors yet</p>
            )}
          </div>

          {/* Recent Targets */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-orange-500" />
                <h2 className="text-[13px] font-semibold text-gray-900 uppercase tracking-wide">Recent Targets</h2>
              </div>
              <button
                onClick={() => navigate('/prospects?tab=targets')}
                className="text-[11px] text-[#064771] font-medium hover:underline flex items-center gap-0.5"
              >
                View all <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            {data.recent_targets.length > 0 ? (
              <div className="divide-y divide-[#F3F4F6]">
                {data.recent_targets.map((tgt) => (
                  <div
                    key={tgt.id}
                    onClick={() => navigate(tgt.link)}
                    className="flex items-center justify-between py-2 hover:bg-[#FAFBFC] cursor-pointer transition-colors -mx-2 px-2 rounded-[2px]"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-white text-[10px] font-medium">
                        {tgt.name?.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-[#1F2937]">{tgt.name}</p>
                        <p className="text-[11px] text-[#9CA3AF]">{tgt.code} · {tgt.country}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-[#D1D5DB]" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-[#9CA3AF] text-center py-4">No targets yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
