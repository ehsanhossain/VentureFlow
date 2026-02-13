/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../config/api';
import { getCachedCurrencies } from '../../../utils/referenceDataCache';
import { showAlert } from '../../../components/Alert';
import { Globe, User, Mail, Phone, ExternalLink } from 'lucide-react';
import { BrandSpinner } from '../../../components/BrandSpinner';
import { formatCurrency } from '../../../utils/formatters';
import { isBackendPropertyAllowed } from '../../../utils/permissionUtils';
import { AuthContext } from '../../../routes/AuthContext';
import { NotesSection, Note, parseActivityLogs } from '../../../components/NotesSection';
import introducedProjectsIcon from '../../../assets/icons/introduced-projects.svg';
import dealsPipelineIcon from '../../../assets/icons/deals-pipeline.svg';

const RestrictedField: React.FC<{ allowed: any, section: string | 'root', item: string, children: React.ReactNode }> = ({ allowed, section, item, children }) => {
  if (!isBackendPropertyAllowed(allowed, section, item)) return null;
  return <>{children}</>;
};

interface Contact {
  name: string;
  department: string;
  designation: string;
  phone: string;
  email: string;
  isPrimary: boolean;
}

interface Industry {
  id: number;
  name: string;
}

interface Country {
  id: number;
  name: string;
  flagSrc?: string;
  svg_icon_url?: string;
}

// Note interface is now imported from NotesSection

interface IntroducedProject {
  id: number;
  code: string;
  name: string;
  stage_code?: string;
  stage_name?: string;
  progress?: number;
}

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

const InvestorDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const [loading, setLoading] = useState(true);
  const [buyer, setBuyer] = useState<any>(null);
  const [allowedFields, setAllowedFields] = useState<any>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);

  // Auto-scroll is handled internally by NotesSection

  const fetchBuyer = async () => {
    try {
      const [response, currList] = await Promise.all([
        api.get(`/api/buyer/${id}`),
        getCachedCurrencies()
      ]);
      const data = response.data?.data || {};
      setBuyer(data);
      setAllowedFields(response.data?.meta?.allowed_fields || null);

      // Set currencies
      setCurrencies(currList);

      // Set notes from formatted_activity_logs
      if (data.formatted_activity_logs) {
        setNotes(parseActivityLogs(data.formatted_activity_logs, getCurrentUserName()));
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      showAlert({ type: "error", message: "Failed to fetch investor details" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchBuyer();
    }
  }, [id]);

  // Context menu click-outside handling is now in NotesSection

  const getCurrentUserName = () => {
    const userData = user as any;
    if (userData?.employee) {
      return `${userData.employee.first_name} ${userData.employee.last_name}`.trim();
    }
    return userData?.name || 'User';
  };

  // formatTimestamp is now handled by NotesSection

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <BrandSpinner size="lg" />
      </div>
    );
  }

  const overview = buyer?.company_overview || {};
  const parseJSON = (data: any, defaultValue: any = []) => {
    if (!data) return defaultValue;
    if (Array.isArray(data) || typeof data === 'object') return data;
    try {
      return JSON.parse(data);
    } catch {
      return defaultValue;
    }
  };

  const industries: Industry[] = parseJSON(overview.main_industry_operations).filter((i: any) => i && i.name);
  const targetCountries: Country[] = parseJSON(overview.target_countries).filter((c: any) => c && c.name);
  const contacts: Contact[] = parseJSON(overview.contacts);
  const investmentBudget = parseJSON(overview.investment_budget, null);
  const internalPICs: InternalPIC[] = parseJSON(overview.internal_pic);
  const financialAdvisors: FinancialAdvisor[] = parseJSON(overview.financial_advisor);

  // Get introduced projects from deals AND from overview, merged
  const introducedProjects: IntroducedProject[] = (() => {
    const fromDeals: IntroducedProject[] = buyer?.formatted_introduced_projects || [];
    const fromOverview: any[] = parseJSON(overview.introduced_projects);
    // Combine both sources, dedup by id
    const combined = [...fromDeals];
    const existingIds = new Set(fromDeals.map((p: any) => p.id));
    for (const proj of fromOverview) {
      if (existingIds.has(proj.id)) continue;
      // The overview stores items as { id, name: "CODE — Company Name" }
      // Parse the combined name to extract code and display name
      let code = proj.seller_id || proj.code || '';
      let name = proj.name || proj.reg_name || '';
      if (!code && name.includes('—')) {
        const parts = name.split('—');
        code = parts[0].trim();
        name = parts.slice(1).join('—').trim();
      }
      combined.push({
        id: proj.id || 0,
        code: code,
        name: name,
      });
      existingIds.add(proj.id);
    }
    return combined;
  })();

  const rank = overview.rank || 'N/A';
  const projectCode = buyer?.buyer_id || 'N/A';
  const companyName = overview.reg_name || 'Unknown Investor';
  const lastUpdated = buyer?.updated_at ? new Date(buyer.updated_at).toLocaleDateString() : new Date().toLocaleDateString();

  // Parse website from potential JSON array format
  const parseWebsiteUrl = (websiteData: any): string => {
    if (!websiteData || websiteData === 'N/A') return '';
    if (typeof websiteData === 'string') {
      if (websiteData.startsWith('[')) {
        try {
          const parsed = JSON.parse(websiteData);
          if (Array.isArray(parsed) && parsed[0]?.url) return parsed[0].url;
        } catch { return websiteData; }
      }
      return websiteData;
    }
    if (Array.isArray(websiteData) && websiteData[0]?.url) return websiteData[0].url;
    return '';
  };

  const website = parseWebsiteUrl(overview.website) || '';
  const parseMultiField = (val: any): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val.filter(Boolean);
    if (typeof val === 'string') {
      try { const p = JSON.parse(val); if (Array.isArray(p)) return p.filter(Boolean); } catch { /* ignored */ }
      return val ? [val] : [];
    }
    return [];
  };
  const purposeMNA = parseMultiField(overview.reason_ma);
  const investmentCondition = parseMultiField(overview.investment_condition);
  const projectDetails = overview.details || '';
  const investorProfileLink = overview.investor_profile_link || '';
  const hqCountryName = overview.hq_country?.name || 'N/A';
  const hqCountryFlag = overview.hq_country?.svg_icon_url || '';

  // Get deal pipeline info from deals
  const getDealPipelineInfo = () => {
    // Use formatted_introduced_projects which has correct side-specific names
    const projects = buyer?.formatted_introduced_projects;
    if (projects && projects.length > 0) {
      const latest = projects[projects.length - 1];
      return {
        stageName: latest.buyer_stage_name || latest.stage_name || latest.stage_code || 'Active',
        pairedCode: latest.code || '',
        pairedName: latest.name || '',
        pairedId: latest.id,
        pairedType: 'target' as const,
      };
    }
    // Fallback to deals array
    if (buyer?.deals && buyer.deals.length > 0) {
      const latestDeal = buyer.deals[buyer.deals.length - 1];
      return {
        stageName: latestDeal.buyer_stage_name || latestDeal.stage_name || latestDeal.stage_code || 'Active',
        pairedCode: latestDeal.seller?.seller_id || '',
        pairedName: latestDeal.seller?.company_overview?.reg_name || '',
        pairedId: latestDeal.seller?.id,
        pairedType: 'target' as const,
      };
    }
    return null;
  };

  // Get initials from name
  const getInitials = (name: string) => {
    if (!name) return 'NA';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Note add, delete, and context menu handlers are now in NotesSection

  // Get first internal PIC
  const getPrimaryPIC = () => {
    if (internalPICs && internalPICs.length > 0) {
      const pic = internalPICs[0];
      return pic.name || `${pic.first_name || ''} ${pic.last_name || ''}`.trim() || 'N/A';
    }
    // Fallback to employeeDetails if available
    if (overview.employee_details) {
      return `${overview.employee_details.first_name || ''} ${overview.employee_details.last_name || ''}`.trim() || 'N/A';
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
              onClick={() => navigate('/prospects?tab=investors')}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#064771] text-white rounded text-sm font-medium hover:bg-[#053a5c] transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5.57501 13.4297H11.1921C13.1329 13.4297 14.7085 11.8542 14.7085 9.91335C14.7085 7.97249 13.1329 6.39697 11.1921 6.39697H3.46289" stroke="white" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M5.08346 8.1666L3.29102 6.36276L5.08346 4.57031" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back
            </button>

            {/* Page Title */}
            <h1 className="text-2xl font-medium text-gray-900">Investor&apos;s Profile</h1>
          </div>

          {/* Edit Button - Secondary Style */}
          <button
            onClick={() => navigate(`/prospects/edit-investor/${id}`)}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-[#E5E7EB] rounded text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit Investor
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
                {/* Company Avatar - Primary Color */}
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
                    {purposeMNA.length > 1 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {purposeMNA.map((item, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-[3px] bg-[#f3f4f6] text-sm font-normal text-gray-600">{item}</span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm font-normal text-black">{purposeMNA[0] || 'N/A'}</span>
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

              {/* Industry (within Overview) */}
              {(() => {
                const companyIndustries: Industry[] = parseJSON(overview.company_industry).filter((i: any) => i && i.name);
                return companyIndustries.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    <span className="text-[11px] font-medium text-gray-400 uppercase">Industry</span>
                    <div className="flex flex-wrap gap-1.5">
                      {companyIndustries.map((ind, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 bg-[#F3F4F6] rounded text-sm font-medium text-gray-700"
                        >
                          {ind.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Addresses / Entities */}
              {(() => {
                const hqAddresses = parseJSON(overview.hq_address);
                return hqAddresses && hqAddresses.length > 0 ? (
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
                ) : null;
              })()}
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

          {/* Investment Strategy Section */}
          <section className="space-y-7">
            <h2 className="text-base font-medium text-gray-500 capitalize">Investment Strategy</h2>
            <div className="h-px bg-[#E5E7EB]" />

            <div className="flex flex-wrap items-start gap-x-24 gap-y-6">
              {/* Target Countries */}
              <RestrictedField allowed={allowedFields} section="targetPreference" item="target_countries">
                <div className="w-[400px] flex flex-col gap-3">
                  <span className="text-[11px] font-medium text-gray-400 uppercase">Target Countries</span>
                  <div className="flex flex-wrap gap-1.5">
                    {targetCountries.length > 0 ? targetCountries.map((country, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 h-7 px-1 bg-[#F3F4F6] rounded"
                      >
                        {(country.flagSrc || country.svg_icon_url) && (
                          <img src={country.flagSrc || country.svg_icon_url} alt="" className="w-4 h-4 rounded-full object-cover" />
                        )}
                        <span className="text-sm font-medium text-gray-700">{country.name}</span>
                      </div>
                    )) : (
                      <span className="text-sm font-medium text-black">N/A</span>
                    )}
                  </div>
                </div>
              </RestrictedField>

              {/* Investment Budget */}
              <RestrictedField allowed={allowedFields} section="companyOverview" item="investment_budget">
                <div className="flex flex-col gap-3">
                  <span className="text-[11px] font-medium text-gray-400 uppercase">Investment Budget</span>
                  <span className="text-sm font-medium text-gray-900">
                    {investmentBudget ? (
                      <>{formatCurrency(investmentBudget.min)} - {formatCurrency(investmentBudget.max)} <span className="text-sm font-medium text-gray-400 ml-1">{(() => { const found = currencies.find((c: any) => String(c.id) === String(investmentBudget.currency)); return found?.currency_code || investmentBudget.currency || ''; })()}</span></>
                    ) : 'Flexible'}
                  </span>
                </div>
              </RestrictedField>

              {/* Target Industries */}
              <RestrictedField allowed={allowedFields} section="companyOverview" item="main_industry_operations">
                <div className="w-[400px] flex flex-col gap-3">
                  <span className="text-[11px] font-medium text-gray-400 uppercase">Target Industries</span>
                  <div className="flex flex-wrap gap-1.5">
                    {industries.length > 0 ? industries.map((ind, idx) => (
                      <div
                        key={idx}
                        className="h-8 px-1 bg-[#F3F4F6] rounded flex items-center"
                      >
                        <span className="text-sm font-normal text-gray-700">{ind.name}</span>
                      </div>
                    )) : (
                      <span className="text-sm font-medium text-black">N/A</span>
                    )}
                  </div>
                </div>
              </RestrictedField>

              {/* Special Conditions */}
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
            </div>
          </section>

          {/* Key Personnel Section */}
          <section className="space-y-7">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-medium text-gray-500 capitalize">Key Personnel</h2>
              <span className="text-xs font-medium text-gray-400">{contacts.length} Contact(s)</span>
            </div>
            <div className="h-px bg-[#E5E7EB]" />

            <RestrictedField allowed={allowedFields} section="companyOverview" item="seller_contact_name">
              <div className="flex gap-4">
                {contacts.length > 0 ? contacts.map((contact, idx) => (
                  <div
                    key={idx}
                    className="flex-1 max-w-[403px] p-3 bg-[rgba(249,250,251,0.5)] border border-[#F3F4F6] rounded"
                  >
                    <div className="flex flex-col gap-4">
                      {/* Contact Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center">
                            <User className="w-5 h-5 text-gray-400" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-base font-medium text-gray-900">{contact.name}</span>
                            <span className="text-xs font-medium text-[#064771]">{contact.designation}</span>
                          </div>
                        </div>
                        {contact.isPrimary && (
                          <span className="px-2 py-1 bg-[#F7FAFF] border border-[#E8F6FF] rounded text-xs font-medium text-[#064771]">
                            Primary
                          </span>
                        )}
                      </div>

                      {/* Contact Details */}
                      <div className="pt-4 border-t border-[#F3F4F6] flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-xs font-normal text-gray-600">{contact.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-xs font-normal text-gray-600">{contact.phone}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-gray-400 italic text-sm py-4">No contact information available.</div>
                )}
              </div>
            </RestrictedField>
          </section>

          {/* Notes Section */}
          <NotesSection
            notes={notes}
            onNotesChange={setNotes}
            entityId={id!}
            entityType="buyer"
            currentUserName={getCurrentUserName()}
          />
        </div>

        {/* Right Column - Sidebar */}
        <div className="w-[287px] shrink-0 space-y-10">
          {/* 1. Open Investor Profile Button */}
          {investorProfileLink && (
            <a
              href={investorProfileLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between w-full p-2 bg-[#064771] rounded text-white hover:bg-[#053a5c] transition-colors"
            >
              <div className="flex items-center gap-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g clipPath="url(#clip0_inv_profile)">
                    <path d="M20.25 4.5H3.75C3.33579 4.5 3 4.83579 3 5.25V16.5C3 16.9142 3.33579 17.25 3.75 17.25H20.25C20.6642 17.25 21 16.9142 21 16.5V5.25C21 4.83579 20.6642 4.5 20.25 4.5Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M15 17.25L18 21" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M9 17.25L6 21" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12 4.5V2.25" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </g>
                  <defs>
                    <clipPath id="clip0_inv_profile">
                      <rect width="24" height="24" fill="white" />
                    </clipPath>
                  </defs>
                </svg>
                <span className="text-sm font-medium">Open Investor Profile</span>
              </div>
              <ExternalLink className="w-4 h-4" />
            </a>
          )}

          {/* 2. Introduced Projects (with icon) */}
          <div className="space-y-5">
            <h3 className="flex items-center gap-2 text-base font-medium text-gray-500 capitalize">
              <img src={introducedProjectsIcon} alt="" className="w-5 h-5" />
              {introducedProjects.length > 0 ? 'Introduced Projects' : 'Propose Targets'}
            </h3>
            <div className="space-y-3">
              {introducedProjects.length > 0 ? introducedProjects.map((project, idx) => (
                <div
                  key={project.id || idx}
                  className="flex items-center gap-3.5 cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors"
                  onClick={() => navigate(`/prospects/target/${project.id}`)}
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
                  No targets have been introduced yet.
                  <button
                    onClick={() => navigate('/prospects?tab=targets')}
                    className="block mt-2 text-[#064771] underline hover:no-underline"
                  >
                    Browse available targets →
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
                        onClick={() => navigate(`/prospects/${pipeInfo.pairedType}/${pipeInfo.pairedId}`)}
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

export default InvestorDetails;
