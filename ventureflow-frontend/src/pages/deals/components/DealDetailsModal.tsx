/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

import React, { useEffect, useState } from 'react';
import { X, Building2, User, Calendar, DollarSign, Activity, FileText, MessageSquare, Clock, MapPin, Globe, Briefcase, TrendingUp } from 'lucide-react';
import api from '../../../config/api';
import { formatCompactNumber, getCurrencySymbol, formatCompactBudget } from '../../../utils/formatters';

interface DealDetailsModalProps {
    dealId: number;
    onClose: () => void;
    onUpdate?: () => void;
}

interface UserObj {
    name?: string;
    employee?: {
        first_name?: string;
        last_name?: string;
    };
}

interface ActivityLog {
    id: number;
    type: string;
    content: string;
    created_at: string;
    user?: UserObj;
}

interface DocumentItem {
    id: number;
    file_name: string;
    document_type?: string;
}

interface StageHistoryEntry {
    from_stage?: string;
    to_stage: string;
    changed_by?: UserObj;
    created_at?: string;
    changed_at?: string;
}

interface DealDetail {
    name: string;
    status: string;
    stage_code: string;
    updated_at: string;
    created_at?: string;
    progress_percent: number;
    estimated_ev_value?: number;
    estimated_ev_currency?: string;
    ticket_size?: number | string;
    possibility?: string;
    priority?: string;
    pic?: UserObj;
    region?: string;
    target_close_date?: string;
    industry?: string;
    deal_type?: string;
    investment_condition?: string;
    buyer_id?: number;
    seller_id?: number;
    ebitda_investor_value?: number;
    ebitda_investor_times?: number;
    ebitda_target_value?: number;
    ebitda_target_times?: number;
    buyer?: {
        buyer_id?: string;
        company_overview?: {
            reg_name?: string;
            hq_country?: { name?: string };
            investment_budget?: string | { min?: number | string; max?: number | string; currency?: string };
        };
        investment_critera?: {
            target_countries?: Array<{ id: number; name: string; svg_icon_url?: string }>;
        };
        target_preference?: {
            target_countries?: Array<number | { id: number; name: string; svg_icon_url?: string }>;
            target_industries?: Array<number | { id: number; name: string }>;
        };
    };
    seller?: {
        seller_id?: string;
        company_overview?: {
            reg_name?: string;
            hq_country?: { name?: string };
        };
        financial_details?: {
            desired_investment?: number | string | { min?: number | string; max?: number | string; currency?: string };
            maximum_investor_shareholding_percentage?: string;
            ebitda?: number;
        };
    };
    documents?: DocumentItem[];
    activity_logs?: ActivityLog[];
    stage_history?: StageHistoryEntry[];
}

const DealDetailsModal: React.FC<DealDetailsModalProps> = ({ dealId, onClose, onUpdate }) => {
    const [deal, setDeal] = useState<DealDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'details' | 'history' | 'comments'>('details');
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchDealDetails();
    }, [dealId]);

    // Mark comments as read when the Chats tab is opened
    useEffect(() => {
        if (activeTab === 'comments' && dealId) {
            api.post(`/api/deals/${dealId}/mark-comments-read`).catch(() => { /* silent */ });
        }
    }, [activeTab, dealId]);

    const fetchDealDetails = async () => {
        try {
            const response = await api.get(`/api/deals/${dealId}`);
            setDeal(response.data.deal);
            setError(null);
        } catch (error) {
            console.error('Failed to fetch deal details', error);
            setError('Failed to load deal information. The server might be experiencing issues.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setIsSubmitting(true);
        try {
            await api.post('/api/activity-logs', {
                entity_id: dealId,
                entity_type: 'deal',
                type: 'comment',
                content: newComment
            });
            setNewComment('');
            fetchDealDetails(); // Refresh to see new comment
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error('Failed to add comment', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getDisplayName = (userObj: UserObj | undefined) => {
        if (!userObj) return 'System';
        if (userObj.employee) {
            return `${userObj.employee.first_name || ''} ${userObj.employee.last_name || ''}`.trim() || userObj.name || 'User';
        }
        return userObj.name || 'User';
    };

    if (error) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
                <div className="relative bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl animate-in fade-in zoom-in-95">
                    <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <X className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-medium text-gray-900 mb-2">Error Occurred</h3>
                    <p className="text-gray-500 mb-6">{error}</p>
                    <button onClick={onClose} className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors">
                        Close Modal
                    </button>
                </div>
            </div>
        );
    }

    if (!deal && !isLoading) return null;

    // After the guard above, when isLoading is false, deal is guaranteed non-null.
    // Create a safely-typed reference for use in non-loading branches.
    const d = deal as DealDetail | null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 lg:p-8">
            <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="relative w-full max-w-5xl h-full sm:h-auto sm:max-h-[90vh] bg-white sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                {/* Header Section */}
                <div className="relative">
                    {/* Visual Decor */}
                    <div className={`absolute top-0 left-0 w-full h-1.5 ${d?.buyer_id ? 'bg-[#064771]' : 'bg-green-500'}`} />

                    <div className="flex items-start justify-between p-6 pb-4 border-b border-gray-100 bg-white">
                        <div className="flex-1 min-w-0 mr-4">
                            {isLoading ? (
                                <div className="space-y-2">
                                    <div className="h-8 w-64 bg-gray-100 rounded animate-pulse" />
                                    <div className="h-4 w-48 bg-gray-50 rounded animate-pulse" />
                                </div>
                            ) : (
                                <>
                                    <div className="flex flex-wrap items-center gap-3 mb-2">
                                        <h2 className="text-2xl font-medium text-gray-900 tracking-tight truncate">{d!.name}</h2>
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-widest ${d!.status === 'won' ? 'bg-green-100 text-green-700' :
                                            d!.status === 'lost' ? 'bg-red-100 text-red-700' :
                                                d!.status === 'on_hold' ? 'bg-orange-100 text-orange-700' :
                                                    'bg-blue-100 text-[#064771]'
                                            }`}>
                                            {d!.status}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${d!.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                                            <span className="font-semibold text-gray-700">Phase {d!.stage_code}</span>
                                        </div>
                                        <span className="flex items-center gap-1.5">
                                            <Clock className="w-4 h-4 text-gray-400" />
                                            Updated {new Date(d!.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <TrendingUp className="w-4 h-4 text-blue-500" />
                                            {d!.progress_percent}% Progress
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all group lg:mt-1"
                            title="Close modal"
                            aria-label="Close modal"
                        >
                            <X className="w-6 h-6 group-hover:scale-110 transition-transform" />
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row bg-gray-50/30">
                    <div className="flex-1 overflow-y-auto scrollbar-premium p-6 space-y-8">
                        {isLoading ? (
                            <div className="space-y-8">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="h-24 bg-gray-100 rounded-xl animate-pulse" />
                                    <div className="h-24 bg-gray-100 rounded-xl animate-pulse" />
                                </div>
                                <div className="h-40 bg-gray-100 rounded-xl animate-pulse" />
                            </div>
                        ) : (
                            <>
                                {/* KPIs */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm transition-hover hover:border-blue-200 group">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Expected Transaction</p>
                                            <DollarSign className="w-4 h-4 text-green-500 group-hover:scale-110 transition-transform" />
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-semibold text-gray-900 tracking-tight">
                                                {d!.estimated_ev_value
                                                    ? `${getCurrencySymbol(d!.estimated_ev_currency || 'USD')}${formatCompactNumber(d!.estimated_ev_value)}`
                                                    : 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm transition-hover hover:border-amber-200">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Confidence Score</p>
                                            <Activity className="w-4 h-4 text-amber-500" />
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-xl font-semibold ${d!.possibility === 'High' ? 'text-green-600' :
                                                d!.possibility === 'Medium' ? 'text-amber-600' :
                                                    'text-gray-600'
                                                }`}>
                                                {d!.possibility || 'Unknown'}
                                            </span>
                                            {d!.priority && (
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-tighter ${d!.priority === 'high' ? 'bg-red-50 text-red-600' :
                                                    d!.priority === 'medium' ? 'bg-amber-50 text-amber-600' :
                                                        'bg-green-50 text-green-600'
                                                    }`}>
                                                    {d!.priority}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Transaction Size & Stage Duration */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {(d!.ticket_size || d!.estimated_ev_value) && (
                                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Transaction Size</p>
                                                <DollarSign className="w-4 h-4 text-blue-500" />
                                            </div>
                                            <span className="text-2xl font-semibold text-gray-900 tracking-tight">
                                                {`${getCurrencySymbol(d!.estimated_ev_currency || 'USD')}${formatCompactNumber(Number(d!.ticket_size || d!.estimated_ev_value || 0))}`}
                                            </span>
                                        </div>
                                    )}
                                    {d!.created_at && (
                                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Time in Pipeline</p>
                                                <Clock className="w-4 h-4 text-purple-500" />
                                            </div>
                                            <span className="text-xl font-semibold text-gray-900">
                                                {(() => {
                                                    const days = Math.floor((Date.now() - new Date(d!.created_at!).getTime()) / (1000 * 60 * 60 * 24));
                                                    if (days < 1) return 'Today';
                                                    if (days === 1) return '1 day';
                                                    if (days < 30) return `${days} days`;
                                                    const months = Math.floor(days / 30);
                                                    return months === 1 ? '1 month' : `${months} months`;
                                                })()}
                                            </span>
                                            {d!.stage_history && d!.stage_history.length > 0 && (
                                                <p className="text-xs text-gray-400 mt-1">
                                                    In current stage: {(() => {
                                                        const latest = d!.stage_history![0];
                                                        const stageDate = latest.changed_at || latest.created_at;
                                                        if (!stageDate) return 'N/A';
                                                        const days = Math.floor((Date.now() - new Date(stageDate).getTime()) / (1000 * 60 * 60 * 24));
                                                        if (days < 1) return 'Today';
                                                        if (days === 1) return '1 day';
                                                        return `${days} days`;
                                                    })()}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Deal Type & Investment Condition */}
                                {(d!.deal_type || d!.investment_condition) && (
                                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Deal Structure</h3>
                                        <div className="flex items-center gap-4">
                                            {d!.deal_type && (
                                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-[#064771]">
                                                    {d!.deal_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                </span>
                                            )}
                                            {d!.investment_condition && (
                                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                                                    {d!.investment_condition}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* EBITDA Metrics */}
                                {(d!.ebitda_investor_value || d!.ebitda_target_value) && (
                                    <div className="bg-white/50 rounded-2xl border border-gray-100 p-6">
                                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">EBITDA Metrics</h3>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <label className="text-[10px] font-medium text-gray-400 uppercase block mb-1.5">Investor EBITDA</label>
                                                <span className="text-sm font-medium text-gray-900">
                                                    {d!.ebitda_investor_value ? `${getCurrencySymbol(d!.estimated_ev_currency || 'USD')}${formatCompactNumber(Number(d!.ebitda_investor_value))}` : 'N/A'}
                                                </span>
                                                {d!.ebitda_investor_times && (
                                                    <span className="ml-2 text-xs text-gray-500">{d!.ebitda_investor_times}x</span>
                                                )}
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-medium text-gray-400 uppercase block mb-1.5">Target EBITDA</label>
                                                <span className="text-sm font-medium text-gray-900">
                                                    {d!.ebitda_target_value ? `${getCurrencySymbol(d!.estimated_ev_currency || 'USD')}${formatCompactNumber(Number(d!.ebitda_target_value))}` : 'N/A'}
                                                </span>
                                                {d!.ebitda_target_times && (
                                                    <span className="ml-2 text-xs text-gray-500">{d!.ebitda_target_times}x</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Entities */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white p-6 rounded-2xl border border-gray-200/60 shadow-sm relative overflow-hidden group hover:border-[#064771]/30 transition-colors">
                                        <div className="absolute top-0 left-0 w-1.5 h-full bg-[#064771]" />
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 bg-blue-50 rounded-xl transition-colors group-hover:bg-blue-100">
                                                <Building2 className="w-5 h-5 text-[#064771]" />
                                            </div>
                                            <h3 className="font-semibold text-gray-900 tracking-tight">Investor Details</h3>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-lg font-medium text-gray-900 leading-tight">{d!.buyer?.company_overview?.reg_name || (d!.buyer_id ? 'To be declared' : 'Undefined')}</p>
                                            {d!.buyer?.buyer_id && (
                                                <p className="text-xs text-gray-400">{d!.buyer.buyer_id}</p>
                                            )}
                                            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                                                <MapPin className="w-3.5 h-3.5" />
                                                {d!.buyer?.company_overview?.hq_country?.name || 'Location Not Specified'}
                                            </div>
                                            {/* Budget Range */}
                                            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                                                <DollarSign className="w-3.5 h-3.5" />
                                                <span>Budget: </span>
                                                <span className="text-gray-900 font-semibold">
                                                    {d!.buyer?.company_overview?.investment_budget
                                                        ? formatCompactBudget(d!.buyer.company_overview.investment_budget as any, getCurrencySymbol('USD'))
                                                        : d!.ticket_size
                                                            ? `${getCurrencySymbol(d!.estimated_ev_currency || 'USD')}${formatCompactNumber(Number(d!.ticket_size))}`
                                                            : 'N/A'}
                                                </span>
                                            </div>
                                            {/* Target Countries */}
                                            {(() => {
                                                // Try investment_critera first (legacy), then target_preference (new eager load)
                                                const countries = d!.buyer?.investment_critera?.target_countries || d!.buyer?.target_preference?.target_countries || [];
                                                // Filter to only objects with name (skip raw IDs)
                                                const countriesWithNames = countries.filter((c): c is { id: number; name: string; svg_icon_url?: string } => typeof c === 'object' && 'name' in c);
                                                if (countriesWithNames.length === 0) return null;
                                                return (
                                                    <div className="flex items-start gap-2 text-xs text-gray-500 font-medium">
                                                        <Globe className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                                        <div className="flex flex-col gap-0.5">
                                                            {countriesWithNames.map((c, i) => (
                                                                <div key={i} className="flex items-center gap-1.5">
                                                                    {c.svg_icon_url ? (
                                                                        <img src={c.svg_icon_url} alt={c.name} className="w-4 h-3 object-cover rounded-sm" />
                                                                    ) : (
                                                                        <span className="text-[10px]">🏳️</span>
                                                                    )}
                                                                    <span className="text-gray-700">{c.name}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>

                                    <div className="bg-white p-6 rounded-2xl border border-gray-200/60 shadow-sm relative overflow-hidden group hover:border-green-300 transition-colors">
                                        <div className="absolute top-0 left-0 w-1.5 h-full bg-green-500" />
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 bg-green-50 rounded-xl transition-colors group-hover:bg-green-100">
                                                <Briefcase className="w-5 h-5 text-green-600" />
                                            </div>
                                            <h3 className="font-semibold text-gray-900 tracking-tight">Target Details</h3>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-lg font-medium text-gray-900 leading-tight">{d!.seller?.company_overview?.reg_name || (d!.seller_id ? 'To be declared' : 'Undefined')}</p>
                                            {d!.seller?.seller_id && (
                                                <p className="text-xs text-gray-400">{d!.seller.seller_id}</p>
                                            )}
                                            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                                                <MapPin className="w-3.5 h-3.5" />
                                                {d!.seller?.company_overview?.hq_country?.name || 'Location Not Specified'}
                                            </div>
                                            {/* Desired Investment */}
                                            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                                                <DollarSign className="w-3.5 h-3.5" />
                                                <span>Desired Investment: </span>
                                                <span className="text-gray-900 font-semibold">
                                                    {d!.seller?.financial_details?.desired_investment
                                                        ? formatCompactBudget(d!.seller.financial_details.desired_investment as any, getCurrencySymbol('USD'))
                                                        : 'N/A'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Detailed Metrics */}
                                <div className="bg-white/50 rounded-2xl border border-gray-100 p-6">
                                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">Strategic Metrics</h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                                        <div>
                                            <label className="text-[10px] font-medium text-gray-400 uppercase block mb-1.5">PIC</label>
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center border-2 border-white shadow-sm">
                                                    <span className="text-[10px] font-semibold text-[#064771]">{getDisplayName(d!.pic).substring(0, 1).toUpperCase()}</span>
                                                </div>
                                                <span className="text-sm font-medium text-gray-900">{getDisplayName(d!.pic)}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-medium text-gray-400 uppercase block mb-1.5">Region</label>
                                            <span className="text-sm font-medium text-gray-900">{d!.region || 'International'}</span>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-medium text-gray-400 uppercase block mb-1.5">Currency</label>
                                            <span className="text-sm font-medium text-gray-900 px-2 py-0.5 bg-gray-100 rounded-md">{d!.estimated_ev_currency || 'USD'}</span>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-medium text-gray-400 uppercase block mb-1.5">Close Est.</label>
                                            <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                                                <Calendar className="w-3.5 h-3.5 text-red-400" />
                                                {d!.target_close_date ? new Date(d!.target_close_date).toLocaleDateString() : 'TBD'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Sidebar - Interactive Content */}
                    <div className="w-full lg:w-[400px] border-l border-gray-100 bg-white flex flex-col h-full shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.02)]">
                        <div className="flex border-b border-gray-100 px-4">
                            {(['details', 'comments', 'history'] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`relative flex-1 py-4 text-[10px] font-semibold uppercase tracking-widest transition-all ${activeTab === tab ? 'text-[#064771]' : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                >
                                    {tab === 'comments' ? 'chats' : tab}
                                    {activeTab === tab && (
                                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#064771] animate-in slide-in-from-left-full duration-200" />
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/20 scrollbar-premium">
                            {activeTab === 'details' && (
                                <div className="space-y-6">
                                    <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                                        <h4 className="text-[10px] font-semibold text-gray-400 uppercase mb-4 tracking-widest flex items-center justify-between">
                                            Documents
                                            <span className="bg-blue-100 text-[#064771] px-1.5 py-0.5 rounded text-[8px]">{d?.documents?.length || 0}</span>
                                        </h4>
                                        {d?.documents && d.documents.length > 0 ? (
                                            <div className="space-y-3">
                                                {d.documents.map((doc: DocumentItem) => (
                                                    <div key={doc.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-transparent hover:border-gray-100 hover:bg-gray-50 transition-all cursor-pointer group">
                                                        <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                                                            <FileText className="w-4 h-4 text-[#064771]" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-medium text-gray-700 truncate">{doc.file_name}</p>
                                                            <p className="text-[9px] text-gray-400 uppercase font-semibold">{doc.document_type || 'General'}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="py-6 text-center border-2 border-dashed border-gray-100 rounded-xl">
                                                <p className="text-xs font-medium text-gray-400">No documents indexed</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'comments' && (
                                <div className="flex flex-col h-full">
                                    <div className="flex-1 space-y-6 mb-6">
                                        {d?.activity_logs?.filter((l: ActivityLog) => l.type === 'comment').length ? (
                                            d.activity_logs
                                                .filter((l: ActivityLog) => l.type === 'comment')
                                                .map((log: ActivityLog) => (
                                                    <div key={log.id} className="flex gap-4 group">
                                                        <div className="w-8 h-8 rounded-full bg-[#064771]/10 flex items-center justify-center flex-shrink-0 text-[#064771] font-semibold text-[10px] shadow-sm ring-2 ring-white">
                                                            {getDisplayName(log.user as UserObj | undefined).substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm relative group-hover:shadow-md transition-shadow">
                                                                <div className="flex justify-between items-center mb-1.5">
                                                                    <span className="text-[11px] font-semibold text-gray-900">{getDisplayName(log.user)}</span>
                                                                    <span className="text-[9px] font-medium text-gray-400">{new Date(log.created_at).toLocaleDateString()}</span>
                                                                </div>
                                                                <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{log.content}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                        ) : (
                                            <div className="text-center py-12">
                                                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                                    <MessageSquare className="w-6 h-6 text-gray-400" />
                                                </div>
                                                <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">No conversation yet</p>
                                            </div>
                                        )}
                                    </div>
                                    <form onSubmit={handleAddComment} className="mt-auto pt-6 border-t border-gray-100">
                                        <div className="relative">
                                            <textarea
                                                className="w-full p-4 pr-12 bg-white border border-gray-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-[#064771] resize-none shadow-sm placeholder:text-gray-400"
                                                rows={3}
                                                placeholder="Write a message..."
                                                value={newComment}
                                                onChange={(e) => setNewComment(e.target.value)}
                                            />
                                            <button
                                                type="submit"
                                                disabled={!newComment.trim() || isSubmitting}
                                                className="absolute bottom-3 right-3 p-2 bg-[#064771] text-white rounded-xl hover:bg-[#053a5c] disabled:opacity-30 disabled:grayscale transition-all shadow-lg hover:shadow-[#064771]/20 active:scale-95"
                                                title="Send comment"
                                                aria-label="Send comment"
                                            >
                                                <X className="w-4 h-4 rotate-45" />
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {activeTab === 'history' && (
                                <div className="space-y-6">
                                    {d?.stage_history && d.stage_history.length > 0 ? (
                                        <div className="relative pl-6 space-y-8 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-blue-500 before:to-transparent">
                                            {d.stage_history.map((history: StageHistoryEntry, idx: number) => (
                                                <div key={idx} className="relative">
                                                    <div className="absolute -left-[30px] top-1 w-4 h-4 rounded-full bg-white border-2 border-blue-500 shadow-sm" />
                                                    <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                                        <p className="text-xs font-medium text-gray-900">
                                                            Phase <span className="text-blue-600">{history.from_stage || '?'}</span> ➔ <span className="text-blue-600">{history.to_stage}</span>
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-50">
                                                            <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center">
                                                                <User className="w-2.5 h-2.5 text-gray-400" />
                                                            </div>
                                                            <span className="text-[10px] font-medium text-gray-500">{getDisplayName(history.changed_by)}</span>
                                                            <span className="ml-auto text-[9px] text-gray-400">{new Date(history.created_at || history.changed_at || Date.now()).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <Clock className="w-6 h-6 text-gray-200 mx-auto mb-2" />
                                            <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">No activity log</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DealDetailsModal;
