import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mail, Globe, Building2, User } from 'lucide-react';
import { BrandSpinner } from '../../../components/BrandSpinner';
import api from '../../../config/api';
import { showAlert } from '../../../components/Alert';

interface Partner {
    id: number;
    partner_id: string;
    status: string;
    created_at?: string;
    updated_at?: string;
    user?: {
        id: number;
        name: string;
        email: string;
        created_at?: string;
    };
    partner_overview?: {
        reg_name: string;
        hq_country: number;
        company_type?: string;
        year_founded?: string;
        main_countries?: number[];
        niche_industry?: any[];
        current_employee_count?: string;
        our_contact_person?: number;
        company_email?: string;
        company_phone?: string;
        hq_address?: any;
        shareholder_name?: string[];
        contact_person_name?: string;
        contact_person_position?: string;
        contact_person_email?: string;
        contact_person_phone?: string[];
        website?: string;
        linkedin?: string;
        twitter?: string;
        facebook?: string;
        instagram?: string;
        youtube?: string;
        details?: string;
        country?: { name: string; svg_icon_url?: string };
    };
    partnership_structure?: {
        partnership_structure?: string;
        retainer_fee?: string;
        success_fee_percentage?: string;
        minimum_success_fee?: string;
        payment_terms?: string;
        contract_duration?: string;
        renewal_terms?: string;
        exclusivity?: boolean;
        territory_scope?: string;
    };
}

const PartnerDetails: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [partner, setPartner] = useState<Partner | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchPartner(id);
        }
    }, [id]);

    const fetchPartner = async (partnerId: string) => {
        setLoading(true);
        try {
            const res = await api.get(`/api/partners/${partnerId}`);
            setPartner(res.data.data || res.data);
        } catch (error) {
            console.error('Failed to fetch partner:', error);
            showAlert({ type: 'error', message: 'Failed to load partner details' });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <BrandSpinner size="lg" />
            </div>
        );
    }

    if (!partner) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500">
                <p>Partner not found</p>
                <button
                    onClick={() => navigate('/settings/partners')}
                    className="mt-4 text-[#064771] hover:underline"
                >
                    Back to Partner List
                </button>
            </div>
        );
    }

    const overview = partner.partner_overview;
    const structure = partner.partnership_structure;
    const partnerName = partner.user?.name || overview?.reg_name || 'Unknown Partner';
    const lastUpdated = partner.updated_at
        ? new Date(partner.updated_at).toLocaleDateString()
        : new Date().toLocaleDateString();

    const getInitials = (name: string) => {
        if (!name) return 'NA';
        const parts = name.split(' ').filter(Boolean);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'Not set';
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'active':
                return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'inactive':
            case 'suspended':
                return 'bg-rose-50 text-rose-700 border-rose-100';
            default:
                return 'bg-emerald-50 text-emerald-700 border-emerald-100';
        }
    };

    // Parse website URL
    const parseWebsite = (websiteData: any): string => {
        if (!websiteData) return '';
        if (typeof websiteData === 'string') return websiteData;
        if (Array.isArray(websiteData) && websiteData[0]?.url) return websiteData[0].url;
        return '';
    };

    const website = parseWebsite(overview?.website);

    return (
        <div className="flex flex-col w-full min-h-screen bg-white" style={{ fontFamily: 'Inter, sans-serif' }}>
            {/* Header Bar */}
            <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-5 py-2.5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* Back Button */}
                        <button
                            onClick={() => navigate('/settings/partners')}
                            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#064771] text-white rounded text-sm font-semibold hover:bg-[#053a5c] transition-colors"
                        >
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5.57501 13.4297H11.1921C13.1329 13.4297 14.7085 11.8542 14.7085 9.91335C14.7085 7.97249 13.1329 6.39697 11.1921 6.39697H3.46289" stroke="white" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M5.08346 8.1666L3.29102 6.36276L5.08346 4.57031" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Back
                        </button>

                        {/* Page Title */}
                        <h1 className="text-2xl font-medium text-gray-900">Partner Profile</h1>
                    </div>

                    {/* Edit Button - Secondary Style */}
                    <button
                        onClick={() => navigate(`/settings/partners/edit/${id}`)}
                        className="flex items-center gap-2 px-3 py-2 bg-white border border-[#E5E7EB] rounded text-[#374151] text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        Edit Partner
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex gap-16 px-9 py-6">
                {/* Left Column - Main Content */}
                <div className="flex-1 max-w-[844px] space-y-10">

                    {/* Overview Section */}
                    <section className="space-y-6">
                        <h2 className="text-base font-medium text-gray-500 capitalize">Overview</h2>
                        <div className="h-px bg-[#E5E7EB]" />

                        <div className="space-y-7">
                            {/* Partner Header */}
                            <div className="flex items-center gap-3">
                                {/* Partner Avatar */}
                                <div className="w-[52px] h-[52px] rounded-full bg-[#064771] flex items-center justify-center text-white text-xl font-medium">
                                    {getInitials(partnerName)}
                                </div>

                                <div className="flex flex-col justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl font-medium text-black capitalize">{partnerName}</span>
                                        <span className="px-2 py-1 bg-[#F7FAFF] border border-[#E8F6FF] rounded text-[#064771] text-base font-medium">
                                            {partner.partner_id}
                                        </span>
                                    </div>
                                    <span className="text-[13px] font-medium text-[#7D7D7D]">last Updated {lastUpdated}</span>
                                </div>
                            </div>

                            {/* Overview Stats Row */}
                            <div className="flex items-start gap-20">
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-[11px] font-medium text-[#9CA3AF] uppercase">Origin Country</span>
                                    <div className="flex items-center gap-2">
                                        {overview?.country?.svg_icon_url && (
                                            <img src={overview.country.svg_icon_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                                        )}
                                        <span className="text-sm font-medium text-[#1F2937]">{overview?.country?.name || 'N/A'}</span>
                                    </div>
                                </div>

                                {overview?.company_type && (
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-[11px] font-medium text-[#9CA3AF] uppercase">Company Type</span>
                                        <span className="text-sm font-normal text-black">{overview.company_type}</span>
                                    </div>
                                )}

                                {overview?.year_founded && (
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-[11px] font-medium text-[#9CA3AF] uppercase">Year Founded</span>
                                        <span className="text-sm font-normal text-black">{overview.year_founded}</span>
                                    </div>
                                )}

                                {website && (
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-[11px] font-medium text-[#9CA3AF] uppercase">Website</span>
                                        <a
                                            href={website.startsWith('http') ? website : `https://${website}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 text-sm font-medium text-[#064771] underline hover:no-underline"
                                        >
                                            <Globe className="w-3.5 h-3.5" />
                                            {website.replace('https://', '').replace('http://', '').replace('www.', '')}
                                        </a>
                                    </div>
                                )}
                            </div>

                            {/* Niche Industries */}
                            {overview?.niche_industry && overview.niche_industry.length > 0 && (
                                <div className="flex flex-col gap-3">
                                    <span className="text-[11px] font-medium text-[#9CA3AF] uppercase">Niche Industries</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {overview.niche_industry.map((ind: any, idx: number) => (
                                            <span
                                                key={idx}
                                                className="px-3 py-1.5 bg-[#F3F4F6] rounded text-sm font-medium text-[#374151]"
                                            >
                                                {typeof ind === 'string' ? ind : ind.name || ind}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Details Section */}
                    {overview?.details && (
                        <section className="space-y-7">
                            <h2 className="text-base font-medium text-gray-500 capitalize">Details</h2>
                            <div className="h-px bg-[#E5E7EB]" />
                            <p className="text-sm text-gray-600 leading-relaxed bg-[#F9FAFB] p-4 rounded border border-[#F3F4F6] whitespace-pre-wrap">
                                {overview.details}
                            </p>
                        </section>
                    )}

                    {/* Contact Information Section */}
                    <section className="space-y-7">
                        <h2 className="text-base font-medium text-gray-500 capitalize">Contact Information</h2>
                        <div className="h-px bg-[#E5E7EB]" />

                        <div className="flex gap-4">
                            {/* Email Card */}
                            <div className="flex-1 max-w-[403px] p-3 bg-[rgba(249,250,251,0.5)] border border-[#F3F4F6] rounded">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center">
                                        <Mail className="w-5 h-5 text-[#9CA3AF]" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-medium text-[#9CA3AF]">Email Address</span>
                                        <span className="text-base font-medium text-[#111827]">{partner.user?.email || 'Not set'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Person Card */}
                            {overview?.contact_person_name && (
                                <div className="flex-1 max-w-[403px] p-3 bg-[rgba(249,250,251,0.5)] border border-[#F3F4F6] rounded">
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center">
                                                    <User className="w-5 h-5 text-[#9CA3AF]" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-base font-medium text-[#111827]">{overview.contact_person_name}</span>
                                                    {overview.contact_person_position &&
                                                        <span className="text-xs font-medium text-[#064771]">{overview.contact_person_position}</span>
                                                    }
                                                </div>
                                            </div>
                                            <span className="px-2 py-1 bg-[#F7FAFF] border border-[#E8F6FF] rounded text-xs font-medium text-[#064771]">
                                                Contact Person
                                            </span>
                                        </div>
                                        {(overview.contact_person_email || overview.contact_person_phone) && (
                                            <div className="pt-4 border-t border-[#F3F4F6] flex flex-col gap-3">
                                                {overview.contact_person_email && (
                                                    <div className="flex items-center gap-2">
                                                        <Mail className="w-3.5 h-3.5 text-[#9CA3AF]" />
                                                        <span className="text-xs font-normal text-[#4B5563]">{overview.contact_person_email}</span>
                                                    </div>
                                                )}
                                                {overview.contact_person_phone && overview.contact_person_phone.length > 0 && (
                                                    <div className="flex items-center gap-2">
                                                        <svg className="w-3.5 h-3.5 text-[#9CA3AF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                                                        </svg>
                                                        <span className="text-xs font-normal text-[#4B5563]">
                                                            {Array.isArray(overview.contact_person_phone) ? overview.contact_person_phone.join(', ') : overview.contact_person_phone}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Partnership Structure Section */}
                    {structure && (structure.partnership_structure || structure.retainer_fee || structure.success_fee_percentage || structure.contract_duration) && (
                        <section className="space-y-7">
                            <h2 className="text-base font-medium text-gray-500 capitalize">Partnership Structure</h2>
                            <div className="h-px bg-[#E5E7EB]" />

                            <div className="flex flex-wrap items-start gap-x-24 gap-y-6">
                                {structure.partnership_structure && (
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-[11px] font-medium text-[#9CA3AF] uppercase">Partnership Type</span>
                                        <span className="text-sm font-normal text-black">{structure.partnership_structure}</span>
                                    </div>
                                )}
                                {structure.retainer_fee && (
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-[11px] font-medium text-[#9CA3AF] uppercase">Retainer Fee</span>
                                        <span className="text-sm font-semibold text-black">{structure.retainer_fee}</span>
                                    </div>
                                )}
                                {structure.success_fee_percentage && (
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-[11px] font-medium text-[#9CA3AF] uppercase">Success Fee</span>
                                        <span className="text-sm font-semibold text-black">{structure.success_fee_percentage}%</span>
                                    </div>
                                )}
                                {structure.minimum_success_fee && (
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-[11px] font-medium text-[#9CA3AF] uppercase">Minimum Success Fee</span>
                                        <span className="text-sm font-semibold text-black">{structure.minimum_success_fee}</span>
                                    </div>
                                )}
                                {structure.contract_duration && (
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-[11px] font-medium text-[#9CA3AF] uppercase">Contract Duration</span>
                                        <span className="text-sm font-normal text-black">{structure.contract_duration}</span>
                                    </div>
                                )}
                                {structure.payment_terms && (
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-[11px] font-medium text-[#9CA3AF] uppercase">Payment Terms</span>
                                        <span className="text-sm font-normal text-black">{structure.payment_terms}</span>
                                    </div>
                                )}
                                {structure.territory_scope && (
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-[11px] font-medium text-[#9CA3AF] uppercase">Territory Scope</span>
                                        <span className="text-sm font-normal text-black">{structure.territory_scope}</span>
                                    </div>
                                )}
                                {structure.exclusivity !== undefined && (
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-[11px] font-medium text-[#9CA3AF] uppercase">Exclusivity</span>
                                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-medium w-fit ${structure.exclusivity
                                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                : 'bg-gray-100 text-gray-600 border border-gray-200'
                                            }`}>
                                            {structure.exclusivity ? 'EXCLUSIVE' : 'NON-EXCLUSIVE'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </section>
                    )}
                </div>

                {/* Right Column - Sidebar */}
                <div className="w-[287px] shrink-0 space-y-10">
                    {/* Partner ID */}
                    <div className="space-y-3">
                        <h3 className="text-base font-medium text-gray-500 capitalize">Partner ID</h3>
                        <span className="inline-flex px-3 py-1.5 bg-[#F7FAFF] border border-[#E8F6FF] rounded text-base font-medium text-[#064771] font-mono">
                            {partner.partner_id}
                        </span>
                    </div>

                    {/* Account Status */}
                    <div className="space-y-3">
                        <h3 className="text-base font-medium text-gray-500 capitalize">Account Status</h3>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(partner.status)}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${partner.status?.toLowerCase() === 'active' ? 'bg-emerald-500' :
                                    ['inactive', 'suspended'].includes(partner.status?.toLowerCase()) ? 'bg-rose-500' : 'bg-emerald-500'
                                }`} />
                            {(partner.status || 'Active').charAt(0).toUpperCase() + (partner.status || 'active').slice(1)}
                        </span>
                    </div>

                    {/* Member Since */}
                    <div className="space-y-3">
                        <h3 className="text-base font-medium text-gray-500 capitalize">Member Since</h3>
                        <span className="text-base font-normal text-black">
                            {formatDate(partner.created_at || partner.user?.created_at)}
                        </span>
                    </div>

                    {/* Last Updated */}
                    <div className="space-y-3">
                        <h3 className="text-base font-medium text-gray-500 capitalize">Last Updated</h3>
                        <span className="text-base font-normal text-black">
                            {formatDate(partner.updated_at)}
                        </span>
                    </div>

                    {/* Shareholders */}
                    {overview?.shareholder_name && overview.shareholder_name.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-base font-medium text-gray-500 capitalize">Shareholders</h3>
                            <div className="space-y-2">
                                {overview.shareholder_name.map((name, idx) => (
                                    <div key={idx} className="flex items-center gap-3.5">
                                        <div className="w-9 h-9 rounded-full bg-[#064771] flex items-center justify-center">
                                            <span className="text-white text-sm font-normal">{getInitials(name)}</span>
                                        </div>
                                        <span className="text-base font-normal text-black">{name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Social Media Links */}
                    {(overview?.linkedin || overview?.twitter || overview?.facebook || overview?.instagram) && (
                        <div className="space-y-3">
                            <h3 className="text-base font-medium text-gray-500 capitalize">Social Media</h3>
                            <div className="flex flex-col gap-2">
                                {overview?.linkedin && (
                                    <a href={overview.linkedin} target="_blank" rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-sm text-[#064771] hover:underline">
                                        <Building2 className="w-4 h-4" /> LinkedIn
                                    </a>
                                )}
                                {overview?.twitter && (
                                    <a href={overview.twitter} target="_blank" rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-sm text-[#064771] hover:underline">
                                        <Globe className="w-4 h-4" /> Twitter
                                    </a>
                                )}
                                {overview?.facebook && (
                                    <a href={overview.facebook} target="_blank" rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-sm text-[#064771] hover:underline">
                                        <Globe className="w-4 h-4" /> Facebook
                                    </a>
                                )}
                                {overview?.instagram && (
                                    <a href={overview.instagram} target="_blank" rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-sm text-[#064771] hover:underline">
                                        <Globe className="w-4 h-4" /> Instagram
                                    </a>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PartnerDetails;
