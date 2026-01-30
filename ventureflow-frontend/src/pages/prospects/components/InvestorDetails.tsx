import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../config/api';
import { showAlert } from '../../../components/Alert';
import { Loader2, Link as LinkIcon, User, Globe, Wallet, MessageSquare } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';
import Label from '../../../components/Label';
import { ActivityLogChat } from '../../prospects/components/ActivityLogChat';
import { isBackendPropertyAllowed } from '../../../utils/permissionUtils';

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
}

const InvestorDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [buyer, setBuyer] = useState<any>(null);
  const [allowedFields, setAllowedFields] = useState<any>(null);

  useEffect(() => {
    const fetchBuyer = async () => {
      try {
        const response = await api.get(`/api/buyer/${id}`);
        setBuyer(response.data?.data || {});
        setAllowedFields(response.data?.meta?.allowed_fields || null);
      } catch (err) {
        showAlert({ type: "error", message: "Failed to fetch investor details" });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBuyer();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#064771]" />
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

  const industries: Industry[] = parseJSON(overview.main_industry_operations);
  const targetCountries: Country[] = parseJSON(overview.target_countries);
  const contacts: Contact[] = parseJSON(overview.contacts);
  const investmentBudget = parseJSON(overview.investment_budget, null);

  const rank = overview.rank || 'N/A';
  const projectCode = overview.buyer_id || 'N/A';
  const companyName = overview.reg_name || 'N/A';
  const website = overview.website || 'N/A';
  const purposeMNA = overview.reason_ma || 'N/A';
  const investmentCondition = overview.investment_condition || 'N/A';
  const investorProfileLink = overview.investor_profile_link || '';
  const hqCountryName = overview.hq_country?.name || 'N/A';

  return (
    <div className="flex flex-col w-full min-h-screen bg-white font-poppins">
      {/* Premium Sticky Header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100 px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/prospects?tab=investors')}
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
                <span>Investor Details</span>
                <span>•</span>
                <span>Updated {new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/prospects/edit-investor/${id}`)}
              className="flex items-center gap-2 px-4 py-2 bg-[#064771] text-white rounded hover:bg-[#053a5c] transition-all text-sm font-semibold"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit Investor
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-8 py-10 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-12">
          {/* Overview Section */}
          <section>
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 p-1 border-b border-gray-50">Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              <RestrictedField allowed={allowedFields} section="companyOverview" item="hq_country">
                <div className="space-y-1.5">
                  <Label text="HQ Country" />
                  <div className="flex items-center gap-2 text-gray-900 font-medium">
                    {hqCountryName}
                  </div>
                </div>
              </RestrictedField>
              <RestrictedField allowed={allowedFields} section="companyOverview" item="website">
                <div className="space-y-1.5">
                  <Label text="Website" />
                  {website !== 'N/A' ? (
                    <a href={website} target="_blank" rel="noopener noreferrer" className="text-[#064771] hover:underline font-medium flex items-center gap-1.5">
                      <Globe className="w-4 h-4" /> {website.replace('https://', '').replace('http://', '')}
                    </a>
                  ) : <span className="text-gray-400">Not specified</span>}
                </div>
              </RestrictedField>
              <RestrictedField allowed={allowedFields} section="companyOverview" item="reason_ma">
                <div className="md:col-span-2 space-y-1.5">
                  <Label text="Purpose of M&A" />
                  <p className="text-gray-600 leading-relaxed text-sm bg-gray-50/50 p-4 rounded border border-gray-100 whitespace-pre-wrap">
                    {purposeMNA || 'No purpose description provided.'}
                  </p>
                </div>
              </RestrictedField>
            </div>
          </section>

          {/* Investment Preferences */}
          <section>
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 p-1 border-b border-gray-50">Investment Strategy</h2>
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <RestrictedField allowed={allowedFields} section="companyOverview" item="main_industry_operations">
                  <div className="space-y-1.5">
                    <Label text="Target Industries" />
                    <div className="flex flex-wrap gap-2">
                      {industries.length > 0 ? industries.map((ind, idx) => (
                        <span key={idx} className="px-3 py-1 bg-white border border-gray-200 rounded text-xs font-medium text-gray-700">
                          {ind.name}
                        </span>
                      )) : <span className="text-gray-400 text-sm italic">Open to all industries</span>}
                    </div>
                  </div>
                </RestrictedField>
                <RestrictedField allowed={allowedFields} section="targetPreference" item="target_countries">
                  <div className="space-y-1.5">
                    <Label text="Target Countries" />
                    <div className="flex flex-wrap gap-2">
                      {targetCountries.length > 0 ? targetCountries.map((c, idx) => (
                        <div key={idx} className="flex items-center gap-2 px-3 py-1 bg-white border border-gray-200 rounded text-xs font-medium text-gray-700">
                          {c.flagSrc && <img src={c.flagSrc} alt="" className="w-3.5 h-3.5 rounded-full object-cover" />}
                          {c.name}
                        </div>
                      )) : <span className="text-gray-400 text-sm italic">Global / Flexible</span>}
                    </div>
                  </div>
                </RestrictedField>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border border-gray-100 p-6 rounded bg-gray-50/30">
                <RestrictedField allowed={allowedFields} section="companyOverview" item="investment_budget">
                  <div className="space-y-1.5">
                    <Label text="Investment Budget" />
                    <div className="flex items-center gap-2.5 text-gray-900 font-bold text-lg">
                      <div className="p-2 bg-white rounded border border-gray-100">
                        <Wallet className="w-5 h-5 text-[#064771]" />
                      </div>
                      {investmentBudget ? (
                        <span>
                          {formatCurrency(investmentBudget.min)} - {formatCurrency(investmentBudget.max)}
                          <span className="text-sm font-medium text-gray-400 ml-1">{investmentBudget.currency}</span>
                        </span>
                      ) : <span>Flexible</span>}
                    </div>
                  </div>
                </RestrictedField>
                <div className="space-y-1.5">
                  <Label text="Special Conditions" />
                  <div className="text-gray-600 text-sm mt-1 leading-relaxed">
                    {investmentCondition || "No specific conditions mentioned."}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Contacts Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest p-1 border-b border-gray-50 flex-1">Key Personnel</h2>
              <span className="text-xs font-medium text-gray-400 ml-4">{contacts.length} Contact(s)</span>
            </div>
            <RestrictedField allowed={allowedFields} section="companyOverview" item="seller_contact_name">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {contacts.length > 0 ? contacts.map((contact, idx) => (
                  <div key={idx} className={`p-5 rounded border transition-all ${contact.isPrimary ? 'bg-white border-[#064771]/20 ring-1 ring-[#064771]/5' : 'bg-gray-50/50 border-gray-100 hover:border-gray-200'
                    }`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded flex items-center justify-center ${contact.isPrimary ? 'bg-[#064771] text-white' : 'bg-white border border-gray-200 text-gray-400'
                          }`}>
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{contact.name}</div>
                          <div className="text-xs font-medium text-[#064771]">{contact.designation}</div>
                        </div>
                      </div>
                      {contact.isPrimary && (
                        <span className="text-[9px] font-black uppercase tracking-tighter bg-[#064771] text-white px-2 py-0.5 rounded">Primary</span>
                      )}
                    </div>
                    <div className="space-y-2.5 pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        {contact.email}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                        {contact.phone}
                      </div>
                    </div>
                  </div>
                )) : <div className="text-gray-400 italic text-sm py-4">No contact information available.</div>}
              </div>
            </RestrictedField>
          </section>

          {/* Activity Log Section */}
          <section className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm mt-8">
            <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#064771]" />
                Activity Log & History
              </h2>
            </div>
            <div className="p-0 h-[600px]">
              <ActivityLogChat entityId={id} entityType="buyer" />
            </div>
          </section>
        </div>

        {/* Sidebar / Metadata Area */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-gray-50/50 rounded p-8 border border-gray-100 space-y-6">
            <h3 className="text-sm font-bold text-gray-900">Documents & Links</h3>
            <div className="space-y-3">
              {investorProfileLink ? (
                <a
                  href={investorProfileLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 bg-white rounded border border-gray-100 hover:border-[#064771] transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded group-hover:bg-[#064771] transition-colors">
                      <LinkIcon className="w-4 h-4 text-[#064771] group-hover:text-white" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">Investor Profile</span>
                  </div>
                  <svg className="w-4 h-4 text-gray-300 group-hover:text-[#064771]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>
              ) : (
                <div className="py-10 text-center border-2 border-dashed border-gray-200 rounded">
                  <span className="text-xs text-gray-400">No documents uploaded</span>
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

export default InvestorDetails;
