import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../config/api';
import { showAlert } from '../../../components/Alert';
import { Loader2, User, Globe, Wallet, MessageSquare, Tag, FileText } from 'lucide-react';

import Label from '../../../components/Label';
import { ActivityLogChat } from './ActivityLogChat';

const TargetDetails: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [seller, setSeller] = useState<any>(null);

    useEffect(() => {
        const fetchSeller = async () => {
            try {
                const response = await api.get(`/api/seller/${id}`);
                setSeller(response.data?.data || {});
            } catch (err) {
                showAlert({ type: "error", message: "Failed to fetch target details" });
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchSeller();
        }
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-[#064771]" />
            </div>
        );
    }

    const overview = seller?.company_overview || {};
    const financial = seller?.financial_details || {};

    const parseJSON = (data: any, defaultValue: any = []) => {
        if (!data) return defaultValue;
        if (Array.isArray(data) || typeof data === 'object') return data;
        try {
            return JSON.parse(data);
        } catch {
            return defaultValue;
        }
    };

    const industries = parseJSON(overview.industry_ops);
    const nicheTags = parseJSON(overview.niche_industry);

    const rank = overview.company_rank || overview.rank || 'N/A';
    const projectCode = seller?.seller_id || overview.seller_id || 'N/A';
    const companyName = overview.reg_name || 'N/A';
    const website = overview.website || 'N/A';
    const reasonMA = overview.reason_ma || 'N/A';
    const projectDetails = overview.details || 'No details provided.';
    const teaserLink = overview.teaser_link || '';
    const hqCountryName = overview?.hq_country?.name || 'N/A';

    return (
        <div className="flex flex-col w-full min-h-screen bg-white font-poppins">
            {/* Premium Sticky Header */}
            <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100 px-8 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/prospects?tab=targets')}
                            className="flex items-center gap-2 py-1.5 px-3 hover:bg-gray-100 rounded text-gray-500 hover:text-[#064771] transition-all group font-medium text-sm"
                            title="Return to prospects"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 12H5M12 19l-7-7 7-7" />
                            </svg>
                            Back
                        </button>
                        <div className="h-6 w-px bg-gray-200" />
                        <div className="flex flex-col">
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl font-bold text-gray-900">{companyName}</h1>
                                <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${rank === 'A' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                    rank === 'B' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                        'bg-slate-50 text-slate-600 border border-slate-100'
                                    }`}>
                                    Rank {rank}
                                </span>
                                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-gray-50 text-gray-500 border border-gray-100 uppercase tracking-wider">
                                    {projectCode}
                                </span>
                            </div>
                            <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                                <span>Target Details</span>
                                <span>•</span>
                                <span>Updated {seller?.updated_at ? new Date(seller.updated_at).toLocaleDateString() : new Date().toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(`/prospects/edit-target/${id}`)}
                            className="flex items-center gap-2 px-4 py-2 bg-[#064771] text-white rounded hover:bg-[#053a5c] transition-all text-sm font-semibold"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            Edit Target
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto w-full px-8 py-10 grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Main Content Area */}
                <div className="lg:col-span-8 space-y-12">
                    {/* Overview Section */}
                    <section>
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 p-1 border-b border-gray-50">Company Overview</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                            <div className="space-y-1.5">
                                <Label text="HQ Country" />
                                <div className="flex items-center gap-2 text-gray-900 font-medium">
                                    {hqCountryName}
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label text="Website" />
                                {website !== 'N/A' && website ? (
                                    <a href={website} target="_blank" rel="noopener noreferrer" className="text-[#064771] hover:underline font-medium flex items-center gap-1.5">
                                        <Globe className="w-4 h-4" /> {website.replace('https://', '').replace('http://', '')}
                                    </a>
                                ) : <span className="text-gray-400">Not specified</span>}
                            </div>
                            <div className="md:col-span-2 space-y-1.5">
                                <Label text="Project Details" />
                                <p className="text-gray-600 leading-relaxed text-sm bg-gray-50/50 p-4 rounded border border-gray-100 whitespace-pre-wrap">
                                    {projectDetails}
                                </p>
                            </div>
                            <div className="md:col-span-2 space-y-1.5">
                                <Label text="Reason for M&A" />
                                <p className="text-gray-600 leading-relaxed text-sm">
                                    {reasonMA}
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Classification & Strategy */}
                    <section>
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 p-1 border-b border-gray-50">Classification</h2>
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-1.5">
                                    <Label text="Industries" />
                                    <div className="flex flex-wrap gap-2">
                                        {industries.length > 0 ? industries.map((ind: any, idx: number) => (
                                            <span key={idx} className="px-3 py-1 bg-white border border-gray-200 rounded text-xs font-medium text-gray-700 flex items-center gap-1.5">
                                                <Tag className="w-3 h-3 text-[#064771]" />
                                                {ind.name || ind}
                                            </span>
                                        )) : <span className="text-gray-400 text-sm italic">Not classified</span>}
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label text="Niche / Tags" />
                                    <div className="flex flex-wrap gap-2">
                                        {nicheTags.length > 0 ? nicheTags.map((tag: any, idx: number) => (
                                            <span key={idx} className="px-3 py-1 bg-blue-50 text-[#064771] rounded text-xs font-medium">
                                                {tag.name || tag}
                                            </span>
                                        )) : <span className="text-gray-400 text-sm italic">No tags</span>}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border border-gray-100 p-6 rounded bg-gray-50/30">
                                <div className="space-y-1.5">
                                    <Label text="Expected Investment" />
                                    <div className="flex items-center gap-2.5 text-gray-900 font-bold text-lg">
                                        <div className="p-2 bg-white rounded border border-gray-100">
                                            <Wallet className="w-5 h-5 text-[#064771]" />
                                        </div>
                                        <span>
                                            {financial.expected_investment_amount || "Flexible"}
                                            {financial.default_currency && <span className="text-sm font-medium text-gray-400 ml-1">{financial.default_currency_code || ''}</span>}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label text="Sale Share Ratio" />
                                    <div className="text-gray-900 font-semibold mt-1">
                                        {financial.maximum_investor_shareholding_percentage ? `${financial.maximum_investor_shareholding_percentage}%` : "Negotiable"}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Contact Section */}
                    <section>
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 p-1 border-b border-gray-50">Primary Contact</h2>
                        <div className="p-5 rounded border bg-white border-[#064771]/20 ring-1 ring-[#064771]/5 max-w-md">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded bg-[#064771] text-white flex items-center justify-center">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-900">{overview.seller_contact_name || 'N/A'}</div>
                                        <div className="text-xs font-medium text-[#064771]">{overview.seller_designation || 'Representative'}</div>
                                    </div>
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-tighter bg-[#064771] text-white px-2 py-0.5 rounded">Primary</span>
                            </div>
                            <div className="space-y-2.5 pt-2 border-t border-gray-100">
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                    {overview.seller_email || 'N/A'}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                    {Array.isArray(overview.seller_phone)
                                        ? (overview.seller_phone.find((p: any) => p.isPrimary)?.phone || overview.seller_phone[0]?.phone || 'N/A')
                                        : (overview.seller_phone || 'N/A')}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Activity Log Section */}
                    <section className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                        <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-[#064771]" />
                                Activity Log & History
                            </h2>
                        </div>
                        <div className="p-0 h-[600px]">
                            <ActivityLogChat entityId={id} entityType="seller" />
                        </div>
                    </section>
                </div>

                {/* Sidebar / Metadata Area */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-gray-50/50 rounded p-8 border border-gray-100 space-y-6">
                        <h3 className="text-sm font-bold text-gray-900">Documents & Links</h3>
                        <div className="space-y-3">
                            {teaserLink ? (
                                <a
                                    href={teaserLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between p-4 bg-white rounded border border-gray-100 hover:border-[#064771] transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-50 rounded group-hover:bg-[#064771] transition-colors">
                                            <FileText className="w-4 h-4 text-[#064771] group-hover:text-white" />
                                        </div>
                                        <span className="text-sm font-semibold text-gray-700">Teaser Document</span>
                                    </div>
                                    <svg className="w-4 h-4 text-gray-300 group-hover:text-[#064771]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                </a>
                            ) : (
                                <div className="py-10 text-center border-2 border-dashed border-gray-200 rounded">
                                    <span className="text-xs text-gray-400">No teaser uploaded</span>
                                </div>
                            )}
                        </div>

                        <div className="pt-6 border-t border-gray-100 italic text-xs text-gray-400 leading-relaxed">
                            This record is managed internally by the VentureFlow Prospects team. Please contact the administrator for data corrections.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TargetDetails;
