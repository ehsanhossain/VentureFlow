import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Mail, Globe, Building2, Edit2, Loader2 } from 'lucide-react';
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
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-[#064771]" />
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
                return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };



    return (
        <div className="min-h-screen bg-[#F8F9FB] font-inter">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-10">
                <div className="flex items-center justify-between max-w-6xl mx-auto">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/settings/partners')}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <div>
                            <h1 className="text-xl font-medium text-gray-900">Partner Details</h1>
                            <p className="text-sm text-gray-500">View partner information and partnership structure</p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate(`/settings/partners/edit/${id}`)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#064771] text-white rounded-lg hover:bg-[#053a5c] transition-all text-sm font-medium"
                    >
                        <Edit2 className="w-4 h-4" />
                        Edit Partner
                    </button>
                </div>
            </div>

            <div className="max-w-6xl mx-auto p-6">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    {/* Profile Header */}
                    <div className="bg-gradient-to-r from-[#064771] to-[#0a6da8] p-8">
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                            <div className="w-28 h-28 rounded-full bg-white/20 flex items-center justify-center ring-4 ring-white/20 shadow-xl">
                                <span className="text-3xl font-bold text-white">
                                    {partnerName.substring(0, 2).toUpperCase()}
                                </span>
                            </div>
                            <div className="text-center md:text-left">
                                <h2 className="text-2xl font-semibold text-white">{partnerName}</h2>
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-2">
                                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white border border-white/30 uppercase">
                                        {partner.partner_id}
                                    </span>
                                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(partner.status)}`}>
                                        {(partner.status || 'Active').toUpperCase()}
                                    </span>
                                    {structure?.partnership_structure && (
                                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white/90">
                                            {structure.partnership_structure}
                                        </span>
                                    )}
                                </div>
                                {overview?.country?.name && (
                                    <div className="flex items-center justify-center md:justify-start gap-2 mt-3">
                                        {overview.country.svg_icon_url && (
                                            <img src={overview.country.svg_icon_url} alt="" className="w-5 h-4 object-cover rounded-sm" />
                                        )}
                                        <span className="text-sm text-white/80">{overview.country.name}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Registration Information */}
                            <div className="space-y-6">
                                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">
                                    Registration Information
                                </h3>
                                <div className="space-y-4">
                                    <InfoRow
                                        icon={<Building2 className="w-4 h-4" />}
                                        label="Partner Name"
                                        value={partnerName}
                                    />
                                    <InfoRow
                                        icon={<Mail className="w-4 h-4" />}
                                        label="Email Address"
                                        value={partner.user?.email}
                                    />
                                    <InfoRow
                                        icon={<Globe className="w-4 h-4" />}
                                        label="Country"
                                        value={overview?.country?.name || overview?.hq_country?.toString()}
                                    />
                                    <InfoRow
                                        label="Partner ID"
                                        value={partner.partner_id}
                                    />
                                </div>
                            </div>

                            {/* Account Information */}
                            <div className="space-y-6">
                                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">
                                    Account Status
                                </h3>
                                <div className="space-y-4">
                                    <InfoRow
                                        label="Status"
                                        value={partner.status?.toUpperCase()}
                                    />
                                    <InfoRow
                                        label="Account Created"
                                        value={formatDate(partner.created_at)}
                                    />
                                    <InfoRow
                                        label="Last Updated"
                                        value={formatDate(partner.updated_at)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface InfoRowProps {
    icon?: React.ReactNode;
    label: string;
    value?: string | null;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value }) => (
    <div className="flex items-start gap-3">
        {icon && (
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 flex-shrink-0">
                {icon}
            </div>
        )}
        <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 mb-0.5">{label}</p>
            <p className="text-sm font-medium text-gray-900 truncate">{value || 'Not set'}</p>
        </div>
    </div>
);

export default PartnerDetails;
