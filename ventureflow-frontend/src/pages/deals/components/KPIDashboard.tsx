/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

interface KPIData {
    expected_transaction: number;
    active_deals: number;
    late_stage: number;
    avg_progress: number;
    velocity_score: number;
}

interface KPIDashboardProps {
    kpis: KPIData | null;
    loading: boolean;
}

const KPIDashboard = ({ kpis, loading }: KPIDashboardProps) => {
    const formatCurrency = (value: number) => {
        if (value >= 1000000000000000) {
            return `$${(value / 1000000000000000).toFixed(1)}Q`;
        }
        if (value >= 1000000000000) {
            return `$${(value / 1000000000000).toFixed(1)}T`;
        }
        if (value >= 1000000000) {
            return `$${(value / 1000000000).toFixed(1)}B`;
        }
        if (value >= 1000000) {
            return `$${(value / 1000000).toFixed(0)}M`;
        }
        if (value >= 1000) {
            return `$${(value / 1000).toFixed(0)}K`;
        }
        return `$${value}`;
    };

    const kpiCards = [
        {
            title: 'Expected Transaction',
            value: kpis ? formatCurrency(kpis.expected_transaction) : '$0',
            subtitle: '+0% this week',
            icon: (
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
        },
        {
            title: 'Velocity Score',
            value: kpis?.velocity_score?.toFixed(1) || '0',
            subtitle: 'Stage transitions/deal',
            icon: (
                <svg className="w-6 h-6 text-[#064771]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
            ),
        },
        {
            title: 'Active Deals',
            value: kpis?.active_deals?.toString() || '0',
            subtitle: 'Currently in pipeline',
            icon: (
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
            ),
        },
        {
            title: 'Late Stage',
            value: kpis?.late_stage?.toString() || '0',
            subtitle: 'LOI to Closing',
            icon: (
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
        },
        {
            title: 'Avg Progress',
            value: kpis ? `${kpis.avg_progress}%` : '0%',
            subtitle: 'Across active deals',
            icon: (
                <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
        },
    ];

    if (loading) {
        return (
            <div className="grid grid-cols-5 gap-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="bg-white rounded-[3px] border p-4 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                        <div className="h-8 bg-gray-200 rounded w-20 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-32"></div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {kpiCards.map((card, index) => (
                <div
                    key={index}
                    className="bg-white rounded-[3px] border p-4 hover:shadow-md transition-shadow cursor-pointer"
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-500">{card.title}</span>
                        {card.icon}
                    </div>
                    <div className="text-2xl font-medium text-gray-900 mb-1">{card.value}</div>
                    <div className="text-xs text-gray-400">{card.subtitle}</div>
                </div>
            ))}
        </div>
    );
};

export default KPIDashboard;

