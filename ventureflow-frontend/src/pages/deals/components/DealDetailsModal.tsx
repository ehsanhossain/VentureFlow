/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

import React, { useEffect, useState } from 'react';
import { X, Building2, User, Calendar, DollarSign, Activity, FileText, MessageSquare, Clock, MapPin, Tag, Briefcase, TrendingUp } from 'lucide-react';
import api from '../../../config/api';
import { formatCompactNumber, getCurrencySymbol } from '../../../utils/formatters';

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
    progress_percent: number;
    estimated_ev_value?: number;
    estimated_ev_currency?: string;
    possibility?: string;
    priority?: string;
    pic?: UserObj;
    region?: string;
    target_close_date?: string;
    industry?: string;
    buyer_id?: number;
    buyer?: {
        company_overview?: {
            reg_name?: string;
            hq_country?: { name?: string };
        };
    };
    seller?: {
        company_overview?: {
            reg_name?: string;
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

                                {/* Entities */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white p-6 rounded-2xl border border-gray-200/60 shadow-sm relative overflow-hidden group hover:border-[#064771]/30 transition-colors">
                                        <div className="absolute top-0 left-0 w-1.5 h-full bg-[#064771]" />
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 bg-blue-50 rounded-xl transition-colors group-hover:bg-blue-100">
                                                <Building2 className="w-5 h-5 text-[#064771]" />
                                            </div>
                                            <h3 className="font-semibold text-gray-900 tracking-tight">The Buyer</h3>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-lg font-medium text-gray-900 leading-tight">{d!.buyer?.company_overview?.reg_name || 'N/A'}</p>
                                            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                                                <MapPin className="w-3.5 h-3.5" />
                                                {d!.buyer?.company_overview?.hq_country?.name || 'Location Not Specified'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white p-6 rounded-2xl border border-gray-200/60 shadow-sm relative overflow-hidden group hover:border-green-300 transition-colors">
                                        <div className="absolute top-0 left-0 w-1.5 h-full bg-green-500" />
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 bg-green-50 rounded-xl transition-colors group-hover:bg-green-100">
                                                <Briefcase className="w-5 h-5 text-green-600" />
                                            </div>
                                            <h3 className="font-semibold text-gray-900 tracking-tight">The Target</h3>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-lg font-medium text-gray-900 leading-tight">{d!.seller?.company_overview?.reg_name || 'N/A'}</p>
                                            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                                                <Tag className="w-3.5 h-3.5 text-green-500" />
                                                {d!.industry || 'General Industry'}
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
                                    {tab}
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
