import React from 'react';
import { MatchStats } from '../MatchIQ';
import { TrendingUp, Star, Zap, ThumbsUp, Minus } from 'lucide-react';

interface MatchStatsBarProps {
    stats: MatchStats;
}

const StatCard: React.FC<{
    label: string;
    value: number | string;
    icon: React.FC<any>;
    color: string;
    bg: string;
}> = ({ label, value, icon: Icon, color, bg }) => (
    <div style={{
        flex: 1, minWidth: '120px',
        background: '#fff', border: '1px solid #e5e7eb', borderRadius: '3px',
        padding: '12px 16px',
        display: 'flex', alignItems: 'center', gap: '10px',
    }}>
        <div style={{
            width: '32px', height: '32px', borderRadius: '3px',
            background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
            <Icon size={16} style={{ color }} />
        </div>
        <div>
            <div style={{ fontSize: '17px', fontWeight: 700, color: '#0a2540' }}>{value}</div>
            <div style={{ fontSize: '11px', color: '#9ca3af' }}>{label}</div>
        </div>
    </div>
);

const MatchStatsBar: React.FC<MatchStatsBarProps> = ({ stats }) => {
    return (
        <div style={{
            display: 'flex', gap: '12px', flexWrap: 'wrap',
        }}>
            <StatCard label="Total Matches" value={stats.total} icon={TrendingUp} color="#064771" bg="#e0f0ff" />
            <StatCard label="Excellent (90+)" value={stats.excellent} icon={Star} color="#059669" bg="#d1fae5" />
            <StatCard label="Strong (80-89)" value={stats.strong} icon={Zap} color="#2563eb" bg="#dbeafe" />
            <StatCard label="Good (70-79)" value={stats.good} icon={ThumbsUp} color="#d97706" bg="#fef3c7" />
            <StatCard label="Fair (60-69)" value={stats.fair} icon={Minus} color="#6b7280" bg="#f3f4f6" />
        </div>
    );
};

export default MatchStatsBar;
