/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/prop-types */
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Users, Target, Briefcase, Activity, ArrowUpRight,
  Clock, ChevronRight, RefreshCw, Globe, Zap
} from 'lucide-react';
import globalAddButtonIcon from '../assets/icons/global-add-button.svg';
import { BrandSpinner } from '../components/BrandSpinner';
import api from '../config/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend
} from 'recharts';

// =============== TYPES ===============
interface DashboardData {
  stats: {
    active_deals: number;
    pipeline_value: number;
    tvc_expected_fees: number;
    deals_this_month: number;
    total_investors: number;
    total_targets: number;
    investors_this_month: number;
    targets_this_month: number;
    unmatched_investors: number;
    unmatched_targets: number;
    month_name: string;
  };
  deal_velocity_days: number;
  buyer_pipeline: PipelineStage[];
  seller_pipeline: PipelineStage[];
  deal_flow_trend: MonthTrend[];
  geo_distribution: GeoItem[];
  activities: ActivityItem[];
  recent_investors: RecentItem[];
  recent_targets: RecentItem[];
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
  if (value >= 1000000000000000) return `$${(value / 1000000000000000).toFixed(1)}Q`;
  if (value >= 1000000000000) return `$${(value / 1000000000000).toFixed(1)}T`;
  if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
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
  const { t } = useTranslation();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
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

  const geoBarData = useMemo(() => {
    if (!data) return [];
    return data.geo_distribution.slice(0, 10);
  }, [data]);

  if (loading || !data) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <BrandSpinner size="lg" />
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
            <h1 className="text-2xl font-medium text-gray-900">{t('dashboard.commandCenter')}</h1>
            <span className="text-[13px] font-medium text-gray-400">{stats.month_name}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchDashboard}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#E5E7EB] rounded-[3px] text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              {t('dashboard.refresh')}
            </button>
            <button
              onClick={() => navigate('/prospects?tab=investors&action=new')}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#064771] text-white rounded-[3px] text-sm font-medium hover:bg-[#053a5c] transition-colors"
            >
              <img src={globalAddButtonIcon} alt="" className="w-5 h-5" />
              {t('dashboard.newProspect')}
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 py-5 space-y-0">

        {/* ======= KPI SUMMARY BAR ======= */}
        <div className="grid grid-cols-6 border border-[#E5E7EB] rounded-t-[3px] divide-x divide-[#E5E7EB]">
          {/* Pipeline Value */}
          <div className="p-3.5 cursor-pointer hover:bg-[#FAFBFC] transition-colors" onClick={() => navigate('/deal-pipeline')}>
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">{t('dashboard.pipelineValue')}</p>
            <p className="text-lg font-semibold text-gray-900 mt-0.5">{formatCurrency(stats.pipeline_value)}</p>
            <p className="text-[11px] text-gray-400">{t('dashboard.activeDeals', { count: stats.active_deals })}</p>
          </div>

          {/* TVC Expected Fees */}
          <div className="p-3.5 cursor-pointer hover:bg-[#FAFBFC] transition-colors" onClick={() => navigate('/deal-pipeline')}>
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">TVC Expected Fees</p>
            <p className="text-lg font-semibold text-green-700 mt-0.5">{formatCurrency(stats.tvc_expected_fees)}</p>
            <p className="text-[11px] text-gray-400">From active deals</p>
          </div>

          {/* Investors */}
          <div className="p-3.5 cursor-pointer hover:bg-[#FAFBFC] transition-colors" onClick={() => navigate('/prospects?tab=investors')}>
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">{t('dashboard.investors')}</p>
            <p className="text-lg font-semibold text-gray-900 mt-0.5">{stats.total_investors}</p>
            {stats.investors_this_month > 0 && (
              <div className="flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3 text-green-600" />
                <span className="text-[11px] text-green-600 font-medium">{t('dashboard.thisMonth', { count: stats.investors_this_month })}</span>
              </div>
            )}
          </div>

          {/* Targets */}
          <div className="p-3.5 cursor-pointer hover:bg-[#FAFBFC] transition-colors" onClick={() => navigate('/prospects?tab=targets')}>
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">{t('dashboard.targets')}</p>
            <p className="text-lg font-semibold text-gray-900 mt-0.5">{stats.total_targets}</p>
            {stats.targets_this_month > 0 && (
              <div className="flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3 text-green-600" />
                <span className="text-[11px] text-green-600 font-medium">{t('dashboard.thisMonth', { count: stats.targets_this_month })}</span>
              </div>
            )}
          </div>

          {/* Unmatched Investors */}
          <div className="p-3.5">
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">{t('dashboard.unmatchedInvestors')}</p>
            <p className="text-lg font-semibold text-gray-900 mt-0.5">{stats.unmatched_investors}</p>
            <p className="text-[11px] text-gray-400">{t('dashboard.seekingTargets')}</p>
          </div>

          {/* Unmatched Targets */}
          <div className="p-3.5">
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">{t('dashboard.unmatchedTargets')}</p>
            <p className="text-lg font-semibold text-gray-900 mt-0.5">{stats.unmatched_targets}</p>
            <p className="text-[11px] text-gray-400">{t('dashboard.seekingBuyers')}</p>
          </div>
        </div>

        {/* ======= ROW 3: Pipeline Funnel + Deal Flow Trend ======= */}
        <div className="grid grid-cols-5 border border-t-0 border-[#E5E7EB] divide-x divide-[#E5E7EB]">
          {/* Deal Velocity (3 cols) */}
          <div className="col-span-3 p-4 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-purple-600" />
              <h2 className="text-[13px] font-semibold text-gray-900 uppercase tracking-wide">{t('dashboard.dealVelocity', 'Deal Velocity')}</h2>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 rounded-[3px] border border-gray-100 py-6 min-h-[220px]">
              <div className="flex items-end gap-1 mb-1">
                <p className="text-5xl font-bold text-gray-900">{data.deal_velocity_days}</p>
                <p className="text-lg font-medium text-gray-400 mb-1.5">{t('dashboard.days', 'days')}</p>
              </div>
              <p className="text-[13px] text-gray-500 font-medium">{t('dashboard.avgDaysPerStage', 'Average time spent per pipeline stage')}</p>
            </div>
          </div>

          {/* Deal Flow Trend (2 cols) */}
          <div className="col-span-2 p-4">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-[13px] font-semibold text-gray-900 uppercase tracking-wide">{t('dashboard.dealFlow')}</h2>
              <span className="text-[11px] text-gray-400 font-medium">{t('dashboard.lastSixMonths')}</span>
            </div>

            {data.deal_flow_trend.length > 0 ? (
              <div className="h-[220px]" style={{ minWidth: 0, minHeight: 220 }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  <LineChart data={data.deal_flow_trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ border: '1px solid #E5E7EB', borderRadius: '3px', fontSize: '11px', backgroundColor: '#fff' }}
                    />
                    <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: '11px', color: '#6B7280' }} />
                    <Line type="monotone" dataKey="created" stroke="#064771" strokeWidth={2} dot={{ r: 3 }} name={t('dashboard.created')} />
                    <Line type="monotone" dataKey="won" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} name={t('dashboard.won')} />
                    <Line type="monotone" dataKey="lost" stroke="#dc2626" strokeWidth={2} dot={{ r: 3 }} name={t('dashboard.lost')} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[220px] flex items-center justify-center">
                <p className="text-sm text-gray-400">{t('dashboard.noTrendData')}</p>
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
                <h2 className="text-[13px] font-semibold text-gray-900 uppercase tracking-wide">{t('dashboard.globalCoverage')}</h2>
                <span className="text-[11px] text-gray-400 font-medium">{t('dashboard.countries', { count: data.geo_distribution.length })}</span>
              </div>
            </div>

            {geoBarData.length > 0 ? (
              <div className="h-[200px]" style={{ minWidth: 0, minHeight: 200 }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
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
                    <Bar dataKey="investors" name={t('dashboard.investors')} fill="#064771" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="targets" name={t('dashboard.targets')} fill="#f97316" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center">
                <Globe className="w-10 h-10 text-gray-400 mb-2" />
                <p className="text-sm text-gray-400">{t('dashboard.noGeoData')}</p>
              </div>
            )}
          </div>

          {/* Activity Feed (2 cols) */}
          <div className="col-span-2 p-4 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-[13px] font-semibold text-gray-900 uppercase tracking-wide">{t('dashboard.recentActivity')}</h2>
              <Clock className="w-3.5 h-3.5 text-gray-400" />
            </div>

            {data.activities.length > 0 ? (
              <div className="flex-1 overflow-y-auto max-h-[230px] divide-y divide-[#F3F4F6] scrollbar-premium">
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
                      <p className="text-[12px] text-gray-700 leading-[1.4]">
                        <span className="font-medium">{act.user_name}</span>
                        {' '}{act.content || `updated ${act.entity_name}`}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{act.time_ago}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-xs text-gray-400">{t('dashboard.noRecentActivity')}</p>
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
                <h2 className="text-[13px] font-semibold text-gray-900 uppercase tracking-wide">{t('dashboard.recentInvestors')}</h2>
              </div>
              <button
                onClick={() => navigate('/prospects?tab=investors')}
                className="text-[11px] text-[#064771] font-medium hover:underline flex items-center gap-0.5"
              >
                {t('dashboard.viewAll')} <ChevronRight className="w-3 h-3" />
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
                        <p className="text-[13px] font-medium text-gray-900">{inv.name}</p>
                        <p className="text-[11px] text-gray-400">{inv.code} · {inv.country}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-gray-400 text-center py-4">{t('dashboard.noInvestorsYet')}</p>
            )}
          </div>

          {/* Recent Targets */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-orange-500" />
                <h2 className="text-[13px] font-semibold text-gray-900 uppercase tracking-wide">{t('dashboard.recentTargets')}</h2>
              </div>
              <button
                onClick={() => navigate('/prospects?tab=targets')}
                className="text-[11px] text-[#064771] font-medium hover:underline flex items-center gap-0.5"
              >
                {t('dashboard.viewAll')} <ChevronRight className="w-3 h-3" />
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
                        <p className="text-[13px] font-medium text-gray-900">{tgt.name}</p>
                        <p className="text-[11px] text-gray-400">{tgt.code} · {tgt.country}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-gray-400 text-center py-4">{t('dashboard.noTargetsYet')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
