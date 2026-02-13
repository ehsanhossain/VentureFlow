/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../config/api';
import { getCachedCurrencies } from '../../../utils/referenceDataCache';
import { showAlert } from '../../../components/Alert';
import { Globe, User, Mail, Phone, ExternalLink, FileText } from 'lucide-react';
import { BrandSpinner } from '../../../components/BrandSpinner';
import { isBackendPropertyAllowed } from '../../../utils/permissionUtils';
import { AuthContext } from '../../../routes/AuthContext';
import { NotesSection, Note, parseActivityLogs } from '../../../components/NotesSection';
import introducedProjectsIcon from '../../../assets/icons/introduced-projects.svg';
import dealsPipelineIcon from '../../../assets/icons/deals-pipeline.svg';

const RestrictedField: React.FC<{ allowed: any, section: string | 'root', item: string, children: React.ReactNode }> = ({ allowed, section, item, children }) => {
    if (!isBackendPropertyAllowed(allowed, section, item)) return null;
    return <>{children}</>;
};

interface InternalPIC {
    id: number;
    name: string;
    first_name?: string;
    last_name?: string;
}

interface FinancialAdvisor {
    id: number;
    name: string;
    reg_name?: string;
}

const TargetDetails: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const authContext = useContext(AuthContext);
    const user = authContext?.user;
    const [loading, setLoading] = useState(true);
    const [seller, setSeller] = useState<any>(null);
    const [allowedFields, setAllowedFields] = useState<any>(null);
    const [notes, setNotes] = useState<Note[]>([]);
    const [currencies, setCurrencies] = useState<{ id: number; currency_code: string }[]>([]);

    const fetchSeller = async () => {
        try {
            const [response, currList] = await Promise.all([
                api.get(`/api/seller/${id}`),
                getCachedCurrencies()
            ]);
            const data = response.data?.data || {};
            setSeller(data);
            setAllowedFields(response.data?.meta?.allowed_fields || null);

            // Set currencies
            setCurrencies(currList);

            // Load activity logs
            try {
                const logsResponse = await api.get(`/api/activity-logs?entity_id=${id}&entity_type=seller`);
                if (logsResponse.data?.data) {
                    setNotes(parseActivityLogs(logsResponse.data.data, getCurrentUserName()));
                }
            } catch {
                // Activity logs may not be available, continue
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (err) {
            showAlert({ type: "error", message: "Failed to fetch target details" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchSeller();
        }
    }, [id]);

    const getCurrentUserName = () => {
        const userData = user as any;
        if (userData?.employee) {
            return `${userData.employee.first_name} ${userData.employee.last_name}`.trim();
        }
        return userData?.name || 'User';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <BrandSpinner size="lg" />
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

    const industries = parseJSON(overview.industry_ops).filter((i: any) => i && (i.name || typeof i === 'string'));
    const internalPICs: InternalPIC[] = parseJSON(overview.internal_pic);
    const financialAdvisors: FinancialAdvisor[] = parseJSON(overview.financial_advisor);
    const introducedProjects = parseJSON(overview.introduced_projects).map((proj: any) => {
        let code = proj.seller_id || proj.buyer_id || proj.code || '';
        let name = proj.name || proj.reg_name || '';
        // Parse combined "CODE — Company Name" format
        if (!code && name.includes('—')) {
            const parts = name.split('—');
            code = parts[0].trim();
            name = parts.slice(1).join('—').trim();
        }
        return { id: proj.id || 0, code, name };
    });

    const rank = overview.company_rank || overview.rank || 'N/A';
    const projectCode = seller?.seller_id || 'N/A';
    const companyName = overview.reg_name || 'Unknown Target';
    const lastUpdated = seller?.updated_at ? new Date(seller.updated_at).toLocaleDateString() : new Date().toLocaleDateString();
    const website = overview.website || '';
    const parseMultiField = (val: any): string[] => {
        if (!val) return [];
        if (Array.isArray(val)) return val.filter(Boolean);
        if (typeof val === 'string') {
            try { const p = JSON.parse(val); if (Array.isArray(p)) return p.filter(Boolean); } catch { /* ignored */ }
            return val ? [val] : [];
        }
        return [];
    };
    const purposeMA = parseMultiField(overview.reason_ma || overview.reason_for_mna);
    const projectDetails = overview.details || '';
    const teaserLink = overview.teaser_link || '';
    const hqCountryName = overview?.hq_country?.name || 'N/A';
    const hqCountryFlag = overview?.hq_country?.svg_icon_url || '';

    // Addresses / Entities
    const hqAddresses = parseJSON(overview.hq_address);

    // Financial fields
    const investmentCondition = parseMultiField(financial.investment_condition);
    const defaultCurrencyCode = (() => {
        const currId = financial.default_currency;
        if (!currId) return '';
        // Try matching by ID first
        const foundById = currencies.find((c: any) => String(c.id) === String(currId));
        if (foundById) return foundById.currency_code || '';
        // Try matching by currency_code (in case it was stored as a code string e.g. "USD")
        const foundByCode = currencies.find((c: any) => c.currency_code === currId);
        if (foundByCode) return foundByCode.currency_code || '';
        // If it looks like a short code itself, use it directly
        if (typeof currId === 'string' && currId.length <= 5 && /^[A-Z]+$/.test(currId)) return currId;
        return '';
    })();

    // EBITDA
    const getEbitdaDisplay = () => {
        const ebitda = financial.ebitda_value || financial.ttm_profit;
        if (!ebitda) return 'N/A';
        if (typeof ebitda === 'object' && ebitda.min !== undefined) {
            const min = Number(ebitda.min).toLocaleString();
            const max = ebitda.max ? Number(ebitda.max).toLocaleString() : '';
            return max ? `${min} - ${max}` : min;
        }
        return String(ebitda);
    };

    // Desired Investment
    const getDesiredInvestmentDisplay = () => {
        const amount = financial.expected_investment_amount;
        if (!amount) return 'Flexible';
        if (typeof amount === 'object' && amount.min !== undefined) {
            const min = Number(amount.min).toLocaleString();
            const max = amount.max ? Number(amount.max).toLocaleString() : '';
            return max ? `${min} - ${max}` : min;
        }
        return String(amount);
    };

    // Get deal pipeline stage from deals (or formatted_introduced_projects)
    const getDealPipelineInfo = () => {
        // First try formatted_introduced_projects which has correct side-specific names
        const projects = seller?.formatted_introduced_projects;
        if (projects && projects.length > 0) {
            const latest = projects[projects.length - 1];
            return {
                stageName: latest.seller_stage_name || latest.stage_code || 'Active',
                pairedCode: latest.code || '',
                pairedName: latest.name || '',
                pairedId: latest.id,
                pairedType: 'investor' as const,
            };
        }
        // Fallback to deals array
        if (seller?.deals && seller.deals.length > 0) {
            const latestDeal = seller.deals[seller.deals.length - 1];
            return {
                stageName: latestDeal.seller_stage_name || latestDeal.stage_code || 'Active',
                pairedCode: latestDeal.buyer?.buyer_id || '',
                pairedName: latestDeal.buyer?.company_overview?.reg_name || '',
                pairedId: latestDeal.buyer?.id,
                pairedType: 'investor' as const,
            };
        }
        return null;
    };

    // Get initials from name
    const getInitials = (name: string) => {
        if (!name || name === 'N/A') return 'NA';
        const parts = name.split(' ').filter(Boolean);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    // Get first internal PIC
    const getPrimaryPIC = () => {
        if (internalPICs && internalPICs.length > 0) {
            const pic = internalPICs[0];
            return pic.name || `${pic.first_name || ''} ${pic.last_name || ''}`.trim() || 'N/A';
        }
        if (overview.incharge_name) {
            const names = parseJSON(overview.incharge_name);
            if (Array.isArray(names) && names.length > 0) {
                return names[0]?.name || names[0] || 'N/A';
            }
        }
        return 'N/A';
    };

    // Get first financial advisor
    const getPrimaryAdvisor = () => {
        if (financialAdvisors && financialAdvisors.length > 0) {
            const advisor = financialAdvisors[0];
            return advisor.name || advisor.reg_name || 'N/A';
        }
        return 'N/A';
    };

    return (
        <div className="flex flex-col w-full min-h-screen bg-white" style={{ fontFamily: 'Inter, sans-serif' }}>
            {/* Header Bar */}
            <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-5 py-2.5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* Back Button */}
                        <button
                            onClick={() => navigate('/prospects?tab=targets')}
                            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#064771] text-white rounded text-sm font-medium hover:bg-[#053a5c] transition-colors"
                        >
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5.57501 13.4297H11.1921C13.1329 13.4297 14.7085 11.8542 14.7085 9.91335C14.7085 7.97249 13.1329 6.39697 11.1921 6.39697H3.46289" stroke="white" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M5.08346 8.1666L3.29102 6.36276L5.08346 4.57031" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Back
                        </button>

                        {/* Page Title */}
                        <h1 className="text-2xl font-medium text-gray-900">Target&apos;s Profile</h1>
                    </div>

                    {/* Edit Button - Secondary Style */}
                    <button
                        onClick={() => navigate(`/prospects/edit-target/${id}`)}
                        className="flex items-center gap-2 px-3 py-2 bg-white border border-[#E5E7EB] rounded text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        Edit Target
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

                        {/* Company Header */}
                        <div className="space-y-7">
                            <div className="flex items-center gap-3">
                                {/* Company Avatar */}
                                <div className="w-[52px] h-[52px] rounded-full bg-[#064771] flex items-center justify-center text-white text-xl font-medium">
                                    {getInitials(companyName)}
                                </div>

                                <div className="flex flex-col justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl font-medium text-black capitalize">{companyName}</span>
                                        <span className="px-2 py-1 bg-[#F7FAFF] border border-[#E8F6FF] rounded text-[#064771] text-base font-medium">
                                            {projectCode}
                                        </span>
                                    </div>
                                    <span className="text-[13px] font-medium text-gray-500">last Updated {lastUpdated}</span>
                                </div>
                            </div>

                            {/* Overview Stats Row */}
                            <div className="flex items-start gap-20">
                                <RestrictedField allowed={allowedFields} section="companyOverview" item="hq_country">
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-[11px] font-medium text-gray-400 uppercase">Origin Country</span>
                                        <div className="flex items-center gap-2">
                                            {hqCountryFlag && (
                                                <img src={hqCountryFlag} alt="" className="w-5 h-5 rounded-full object-cover" />
                                            )}
                                            <span className="text-sm font-medium text-gray-900">{hqCountryName}</span>
                                        </div>
                                    </div>
                                </RestrictedField>

                                <RestrictedField allowed={allowedFields} section="companyOverview" item="reason_ma">
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-[11px] font-medium text-gray-400 uppercase">Purpose of M&A</span>
                                        {purposeMA.length > 1 ? (
                                            <div className="flex flex-wrap gap-1.5">
                                                {purposeMA.map((item, i) => (
                                                    <span key={i} className="px-2.5 py-1 rounded-[3px] bg-[#f3f4f6] text-sm font-normal text-gray-600">{item}</span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-sm font-normal text-black">{purposeMA[0] || 'N/A'}</span>
                                        )}
                                    </div>
                                </RestrictedField>

                                <RestrictedField allowed={allowedFields} section="companyOverview" item="website">
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-[11px] font-medium text-gray-400 uppercase">Website</span>
                                        {website ? (
                                            <a
                                                href={website.startsWith('http') ? website : `https://${website}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 text-sm font-medium text-[#064771] underline hover:no-underline"
                                            >
                                                <Globe className="w-3.5 h-3.5" />
                                                {website.replace('https://', '').replace('http://', '').replace('www.', '')}
                                            </a>
                                        ) : (
                                            <span className="text-sm text-gray-400">Not specified</span>
                                        )}
                                    </div>
                                </RestrictedField>

                                <div className="flex flex-col gap-1.5">
                                    <span className="text-[11px] font-medium text-gray-400 uppercase">Rank</span>
                                    <span className="text-sm font-normal text-black">{rank}</span>
                                </div>
                            </div>

                            {/* Industry in Overview */}
                            <RestrictedField allowed={allowedFields} section="companyOverview" item="industry_ops">
                                <div className="flex flex-col gap-3">
                                    <span className="text-[11px] font-medium text-gray-400 uppercase">Industry</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {industries.length > 0 ? industries.map((ind: any, idx: number) => (
                                            <div
                                                key={idx}
                                                className="h-8 px-3 bg-[#F3F4F6] rounded flex items-center"
                                            >
                                                <span className="text-sm font-normal text-gray-700">{ind.name || (typeof ind === 'string' ? ind : String(ind.id || JSON.stringify(ind)))}</span>
                                            </div>
                                        )) : (
                                            <span className="text-sm font-medium text-black">N/A</span>
                                        )}
                                    </div>
                                </div>
                            </RestrictedField>

                            {/* Addresses / Entities in Overview */}
                            {hqAddresses && hqAddresses.length > 0 && (
                                <div className="flex flex-col gap-3">
                                    <span className="text-[11px] font-medium text-gray-400 uppercase">Addresses / Entities</span>
                                    <div className="flex flex-col gap-2">
                                        {hqAddresses.map((addr: any, idx: number) => (
                                            <div key={idx} className="flex flex-col gap-0.5">
                                                {addr.label && <span className="text-xs font-medium text-gray-500">{addr.label}</span>}
                                                <span className="text-sm text-gray-700">{addr.address || (typeof addr === 'string' ? addr : 'N/A')}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Project Details Section */}
                    {projectDetails && (
                        <section className="space-y-7">
                            <h2 className="text-base font-medium text-gray-500 capitalize">Project Details</h2>
                            <div className="h-px bg-[#E5E7EB]" />
                            <RestrictedField allowed={allowedFields} section="companyOverview" item="details">
                                <p className="text-sm text-gray-600 leading-relaxed bg-[#F9FAFB] p-4 rounded border border-[#F3F4F6] whitespace-pre-wrap">
                                    {projectDetails}
                                </p>
                            </RestrictedField>
                        </section>
                    )}

                    {/* Classification & Financial Section */}
                    <section className="space-y-7">
                        <h2 className="text-base font-medium text-gray-500 capitalize">Classification & Financial</h2>
                        <div className="h-px bg-[#E5E7EB]" />

                        <div className="flex flex-wrap items-start gap-x-24 gap-y-6">
                            {/* Investment Condition */}
                            <div className="flex flex-col gap-3">
                                <span className="text-[11px] font-medium text-gray-400 uppercase">Investment Condition</span>
                                {investmentCondition.length > 1 ? (
                                    <div className="flex flex-wrap gap-1.5">
                                        {investmentCondition.map((item, i) => (
                                            <span key={i} className="px-2.5 py-1 rounded-[3px] bg-[#f3f4f6] text-sm font-normal text-gray-600">{item}</span>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-sm font-medium text-black">{investmentCondition[0] || 'N/A'}</span>
                                )}
                            </div>


                            {/* Desired Investment */}
                            <RestrictedField allowed={allowedFields} section="financialDetails" item="expected_investment_amount">
                                <div className="flex flex-col gap-3">
                                    <span className="text-[11px] font-medium text-gray-400 uppercase">Desired Investment</span>
                                    <span className="text-sm font-medium text-gray-900">
                                        {getDesiredInvestmentDisplay()}
                                        {defaultCurrencyCode && <span className="text-sm font-medium text-gray-400 ml-1">{defaultCurrencyCode}</span>}
                                    </span>
                                </div>
                            </RestrictedField>

                            {/* EBITDA */}
                            <div className="flex flex-col gap-3">
                                <span className="text-[11px] font-medium text-gray-400 uppercase">EBITDA</span>
                                <span className="text-sm font-medium text-gray-900">
                                    {getEbitdaDisplay()}
                                    {defaultCurrencyCode && getEbitdaDisplay() !== 'N/A' && <span className="text-sm font-medium text-gray-400 ml-1">{defaultCurrencyCode}</span>}
                                </span>
                            </div>

                        </div>
                    </section>

                    {/* Key Personnel Section */}
                    <section className="space-y-7">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-medium text-gray-500 capitalize">Key Personnel</h2>
                            <span className="text-xs font-medium text-gray-400">1 Contact(s)</span>
                        </div>
                        <div className="h-px bg-[#E5E7EB]" />

                        <RestrictedField allowed={allowedFields} section="companyOverview" item="seller_contact_name">
                            <div className="flex gap-4">
                                <div className="flex-1 max-w-[403px] p-3 bg-[rgba(249,250,251,0.5)] border border-[#F3F4F6] rounded">
                                    <div className="flex flex-col gap-4">
                                        {/* Contact Header */}
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center">
                                                    <User className="w-5 h-5 text-gray-400" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-base font-medium text-gray-900">{overview.seller_contact_name || 'N/A'}</span>
                                                    <span className="text-xs font-medium text-[#064771]">{overview.seller_designation || 'Representative'}</span>
                                                </div>
                                            </div>
                                            <span className="px-2 py-1 bg-[#F7FAFF] border border-[#E8F6FF] rounded text-xs font-medium text-[#064771]">
                                                Primary
                                            </span>
                                        </div>

                                        {/* Contact Details */}
                                        <div className="pt-4 border-t border-[#F3F4F6] flex flex-col gap-3">
                                            <div className="flex items-center gap-2">
                                                <Mail className="w-3.5 h-3.5 text-gray-400" />
                                                <span className="text-xs font-normal text-gray-600">{overview.seller_email || 'N/A'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Phone className="w-3.5 h-3.5 text-gray-400" />
                                                <span className="text-xs font-normal text-gray-600">
                                                    {Array.isArray(overview.seller_phone)
                                                        ? (overview.seller_phone.find((p: any) => p.isPrimary)?.phone || overview.seller_phone[0]?.phone || 'N/A')
                                                        : (overview.seller_phone || 'N/A')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </RestrictedField>
                    </section>

                    {/* Notes Section */}
                    <NotesSection
                        notes={notes}
                        onNotesChange={setNotes}
                        entityId={id!}
                        entityType="seller"
                        currentUserName={getCurrentUserName()}
                    />
                </div>

                {/* Right Column - Sidebar */}
                <div className="w-[287px] shrink-0 space-y-10">
                    {/* 1. Teaser Document Link */}
                    <div className="space-y-5">
                        <h3 className="text-base font-medium text-gray-500 capitalize">Documents & Links</h3>
                        {teaserLink ? (
                            <a
                                href={teaserLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between w-full p-3 bg-[#064771] rounded text-white hover:bg-[#053a5c] transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <FileText className="w-5 h-5" />
                                    <span className="text-sm font-medium">Teaser Document</span>
                                </div>
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        ) : (
                            <div className="py-8 text-center border-2 border-dashed border-gray-200 rounded">
                                <span className="text-xs text-gray-400">No teaser uploaded</span>
                            </div>
                        )}
                    </div>

                    {/* 2. Introduced Projects (with icon) */}
                    <div className="space-y-5">
                        <h3 className="flex items-center gap-2 text-base font-medium text-gray-500 capitalize">
                            <img src={introducedProjectsIcon} alt="" className="w-5 h-5" />
                            {introducedProjects && introducedProjects.length > 0 ? 'Introduced Projects' : 'Propose Investors'}
                        </h3>
                        <div className="space-y-3">
                            {introducedProjects && introducedProjects.length > 0 ? introducedProjects.map((project: any, idx: number) => (
                                <div
                                    key={project.id || idx}
                                    className="flex items-center gap-3.5 cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors"
                                    onClick={() => navigate(`/prospects/investor/${project.id}`)}
                                >
                                    <span className="px-2 py-1 bg-[#F7FAFF] border border-[#E8F6FF] rounded text-base font-medium text-[#064771]">
                                        {project.code}
                                    </span>
                                    <span className="flex-1 text-base font-medium text-[#064771] truncate">
                                        {project.name}
                                    </span>
                                </div>
                            )) : (
                                <div className="text-sm text-gray-400 italic">
                                    No investors have been introduced yet.
                                    <button
                                        onClick={() => navigate('/prospects?tab=investors')}
                                        className="block mt-2 text-[#064771] underline hover:no-underline"
                                    >
                                        Browse available investors →
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 3. Deal Pipeline Stage (with icon) */}
                    {(() => {
                        const pipeInfo = getDealPipelineInfo();
                        return (
                            <div className="space-y-3">
                                <h3 className="flex items-center gap-2 text-base font-medium text-gray-500 capitalize">
                                    <img src={dealsPipelineIcon} alt="" className="w-5 h-5" />
                                    Deal Pipeline Stage
                                </h3>
                                {pipeInfo ? (
                                    <>
                                        <span className="text-base font-semibold text-black">{pipeInfo.stageName}</span>
                                        {pipeInfo.pairedId && (
                                            <div
                                                className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors"
                                                onClick={() => navigate(`/prospects/investor/${pipeInfo.pairedId}`)}
                                            >
                                                <ExternalLink className="w-4 h-4 text-[#064771]" />
                                                <span className="px-2 py-1 bg-[#F7FAFF] border border-[#E8F6FF] rounded text-sm font-medium text-[#064771]">
                                                    {pipeInfo.pairedCode}
                                                </span>
                                                <span className="text-sm font-medium text-[#064771] truncate">
                                                    {pipeInfo.pairedName}
                                                </span>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <span className="text-base font-normal text-black">N/A</span>
                                )}
                            </div>
                        );
                    })()}

                    {/* 4. Assigned PIC (show all) */}
                    <div className="space-y-3">
                        <h3 className="text-base font-medium text-gray-500 capitalize">Assigned PIC</h3>
                        <div className="space-y-2.5">
                            {internalPICs && internalPICs.length > 0 ? internalPICs.map((pic, idx) => {
                                const picName = pic.name || `${pic.first_name || ''} ${pic.last_name || ''}`.trim() || 'N/A';
                                return (
                                    <div key={pic.id || idx} className="flex items-center gap-3.5">
                                        <div className="w-9 h-9 rounded-full bg-[#064771] flex items-center justify-center">
                                            <span className="text-white text-sm font-normal">{getInitials(picName)}</span>
                                        </div>
                                        <span className="text-base font-normal text-black">{picName}</span>
                                    </div>
                                );
                            }) : (
                                <div className="flex items-center gap-3.5">
                                    <div className="w-9 h-9 rounded-full bg-[#064771] flex items-center justify-center">
                                        <span className="text-white text-sm font-normal">{getInitials(getPrimaryPIC())}</span>
                                    </div>
                                    <span className="text-base font-normal text-black">{getPrimaryPIC()}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 5. Financial Advisor Role (show all) */}
                    <div className="space-y-3">
                        <h3 className="text-base font-medium text-gray-500 capitalize">Financial Advisor Role (Partner)</h3>
                        <div className="space-y-2.5">
                            {financialAdvisors && financialAdvisors.length > 0 ? financialAdvisors.map((advisor, idx) => {
                                const advisorName = advisor.name || advisor.reg_name || 'N/A';
                                return (
                                    <div key={advisor.id || idx} className="flex items-center gap-3.5">
                                        <div className="w-9 h-9 rounded-full bg-[#064771] flex items-center justify-center">
                                            <span className="text-white text-sm font-normal">{getInitials(advisorName)}</span>
                                        </div>
                                        <span className="text-base font-normal text-black">{advisorName}</span>
                                    </div>
                                );
                            }) : (
                                <div className="flex items-center gap-3.5">
                                    <div className="w-9 h-9 rounded-full bg-[#064771] flex items-center justify-center">
                                        <span className="text-white text-sm font-normal">{getInitials(getPrimaryAdvisor())}</span>
                                    </div>
                                    <span className="text-base font-normal text-black">{getPrimaryAdvisor()}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TargetDetails;
