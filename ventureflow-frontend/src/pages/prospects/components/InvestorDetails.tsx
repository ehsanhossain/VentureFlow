import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../config/api';
import { showAlert } from '../../../components/Alert';
import { Loader2, Globe, User, Mail, Phone, ExternalLink, FileText, Send } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';
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

interface Note {
  id: number;
  author: string;
  avatar?: string;
  content: string;
  timestamp: string;
  isSystem?: boolean;
  isSelf?: boolean;
}

const InvestorDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [buyer, setBuyer] = useState<any>(null);
  const [allowedFields, setAllowedFields] = useState<any>(null);
  const [newNote, setNewNote] = useState('');

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
  const purposeMNA = overview.reason_ma || 'N/A';
  const investmentCondition = overview.investment_condition || 'N/A';
  const investorProfileLink = overview.investor_profile_link || '';
  const hqCountryName = overview.hq_country?.name || 'N/A';
  const hqCountryFlag = overview.hq_country?.svg_icon_url || '';

  // Mock introduced projects (this would come from API in production)
  const introducedProjects = [
    { code: 'TH-S-202', name: 'Siam Automotive And...' },
    { code: 'JP-S-202', name: 'Company Name' },
    { code: 'JP-S-203', name: 'Company Name' },
    { code: 'JP-S-204', name: 'Company Name' },
  ];

  // Mock notes data (this would come from API in production)
  const notes: Note[] = [
    {
      id: 1,
      author: 'Ventureflow',
      content: `New Investor profile registered: ${companyName}`,
      timestamp: 'Feb 6, 1:30 PM',
      isSystem: true
    }
  ];

  // Get initials from name
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      // TODO: Implement API call to save note
      showAlert({ type: "success", message: "Note added successfully" });
      setNewNote('');
    }
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
              className="flex items-center gap-1.5 px-4 py-1 bg-[#064771] text-white rounded text-sm font-semibold hover:bg-[#053a5c] transition-colors"
            >
              <svg width="12" height="8" viewBox="0 0 12 8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H1M4 7L1 4L4 1" />
              </svg>
              Back
            </button>

            {/* Page Title */}
            <h1 className="text-2xl font-medium text-gray-900">Investor's Profile</h1>
          </div>

          {/* Edit Button */}
          <button
            onClick={() => navigate(`/prospects/edit-investor/${id}`)}
            className="flex items-center gap-2 px-3 py-2 bg-[#F9F9F9] border border-[#064771] rounded text-[#064771] text-sm font-normal hover:bg-gray-100 transition-colors"
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

            {/* Company Header */}
            <div className="space-y-7">
              <div className="flex items-center gap-3">
                {/* Company Avatar */}
                <div className="w-[52px] h-[52px] rounded-full bg-[#004831] flex items-center justify-center text-white text-xl font-medium">
                  {getInitials(companyName)}
                </div>

                <div className="flex flex-col justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-medium text-black capitalize">{companyName}</span>
                    <span className="px-2 py-1 bg-[#F7FAFF] border border-[#E8F6FF] rounded text-[#064771] text-base font-medium">
                      {projectCode}
                    </span>
                  </div>
                  <span className="text-[13px] font-medium text-[#7D7D7D]">last Updated {lastUpdated}</span>
                </div>
              </div>

              {/* Overview Stats Row */}
              <div className="flex items-start gap-20">
                <RestrictedField allowed={allowedFields} section="companyOverview" item="hq_country">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-medium text-[#9CA3AF] uppercase">HQ Country</span>
                    <div className="flex items-center gap-2">
                      {hqCountryFlag && (
                        <img src={hqCountryFlag} alt="" className="w-3 h-3 rounded-full object-cover" />
                      )}
                      <span className="text-sm font-medium text-[#1F2937]">{hqCountryName}</span>
                    </div>
                  </div>
                </RestrictedField>

                <RestrictedField allowed={allowedFields} section="companyOverview" item="reason_ma">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-medium text-[#9CA3AF] uppercase">Purpose of M&A</span>
                    <span className="text-sm font-normal text-black">{purposeMNA}</span>
                  </div>
                </RestrictedField>

                <RestrictedField allowed={allowedFields} section="companyOverview" item="website">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-medium text-[#9CA3AF] uppercase">Website</span>
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
                  <span className="text-[11px] font-medium text-[#9CA3AF] uppercase">Rank</span>
                  <span className="text-sm font-normal text-black">{rank}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Investment Strategy Section */}
          <section className="space-y-7">
            <h2 className="text-base font-medium text-gray-500 capitalize">Investment Strategy</h2>

            <div className="flex flex-wrap items-start gap-x-24 gap-y-6">
              {/* Target Countries */}
              <RestrictedField allowed={allowedFields} section="targetPreference" item="target_countries">
                <div className="w-[400px] flex flex-col gap-3">
                  <span className="text-[11px] font-medium text-[#9CA3AF] uppercase">Target Countries</span>
                  <div className="flex flex-wrap gap-1.5">
                    {targetCountries.length > 0 ? targetCountries.map((country, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 h-7 px-1 bg-[#F3F4F6] rounded"
                      >
                        {country.flagSrc && (
                          <img src={country.flagSrc} alt="" className="w-4 h-4 rounded-full object-cover" />
                        )}
                        <span className="text-sm font-medium text-[#374151]">{country.name}</span>
                      </div>
                    )) : (
                      <span className="text-sm text-gray-400">Global / Flexible</span>
                    )}
                  </div>
                </div>
              </RestrictedField>

              {/* Investment Budget */}
              <RestrictedField allowed={allowedFields} section="companyOverview" item="investment_budget">
                <div className="flex flex-col gap-3">
                  <span className="text-[11px] font-medium text-[#9CA3AF] uppercase">Investment Budget</span>
                  <span className="text-sm font-semibold text-black">
                    {investmentBudget ? (
                      <>{formatCurrency(investmentBudget.min)} - {formatCurrency(investmentBudget.max)} {investmentBudget.currency}</>
                    ) : 'Flexible'}
                  </span>
                </div>
              </RestrictedField>

              {/* Target Industries */}
              <RestrictedField allowed={allowedFields} section="companyOverview" item="main_industry_operations">
                <div className="w-[400px] flex flex-col gap-3">
                  <span className="text-[11px] font-medium text-[#9CA3AF] uppercase">Target Industries</span>
                  <div className="flex flex-wrap gap-1.5">
                    {industries.length > 0 ? industries.map((ind, idx) => (
                      <div
                        key={idx}
                        className="h-8 px-1 bg-[#F3F4F6] rounded flex items-center"
                      >
                        <span className="text-sm font-normal text-[#374151]">{ind.name}</span>
                      </div>
                    )) : (
                      <span className="text-sm text-gray-400">Open to all</span>
                    )}
                  </div>
                </div>
              </RestrictedField>

              {/* Special Conditions */}
              <div className="flex flex-col gap-3">
                <span className="text-[11px] font-medium text-[#9CA3AF] uppercase">Special Conditions</span>
                <span className="text-sm font-medium text-black">{investmentCondition}</span>
              </div>
            </div>
          </section>

          {/* Key Personnel Section */}
          <section className="space-y-7">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-medium text-gray-500 capitalize">Key Personnel</h2>
              <span className="text-xs font-medium text-[#9CA3AF]">{contacts.length} Contact(s)</span>
            </div>

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
                            <User className="w-5 h-5 text-[#9CA3AF]" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-base font-medium text-[#111827]">{contact.name}</span>
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
                          <Mail className="w-3.5 h-3.5 text-[#9CA3AF]" />
                          <span className="text-xs font-normal text-[#4B5563]">{contact.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-[#9CA3AF]" />
                          <span className="text-xs font-normal text-[#4B5563]">{contact.phone}</span>
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
          <section className="border border-[#F3F4F6] rounded overflow-hidden">
            {/* Notes Header */}
            <div className="px-3 py-2 bg-[rgba(249,250,251,0.8)] border-b border-[#F3F4F6] flex items-center gap-3">
              <FileText className="w-6 h-6 text-[#6B7280]" />
              <h2 className="text-base font-medium text-gray-500 capitalize">Notes</h2>
            </div>

            {/* Notes Content */}
            <div className="p-5 bg-white min-h-[300px] space-y-10">
              {notes.map((note) => (
                <div key={note.id} className={`flex gap-4 ${note.isSelf ? 'flex-row-reverse' : ''}`}>
                  {/* Avatar */}
                  {note.isSystem ? (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0A9FFF] to-[#54B0F8] shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#064771] flex items-center justify-center shrink-0">
                      <span className="text-white text-sm font-normal">{getInitials(note.author)}</span>
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 flex flex-col gap-4">
                    <div className={`flex items-center justify-between ${note.isSelf ? 'flex-row-reverse' : ''}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-black">{note.author}</span>
                        {note.isSystem && (
                          <span className="px-1.5 py-0.5 bg-[#F7FAFF] border border-[#E8F6FF] rounded text-[9px] font-medium text-[#064771]">
                            System
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-normal text-[#9D9D9D]">{note.timestamp}</span>
                    </div>
                    <p className={`text-xs font-normal text-[#6B7280] leading-relaxed ${note.isSelf ? 'text-right' : ''}`}>
                      {note.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Notes Input */}
            <div className="p-3 bg-[rgba(249,250,251,0.5)] border-t border-[#E5E7EB]">
              <div className="p-4 bg-white border border-[#E2E8F0] rounded">
                <div className="flex flex-col gap-4">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Write a comment or note..."
                    className="w-full h-12 resize-none text-base text-[#475569] placeholder-[#475569] focus:outline-none"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleAddNote}
                      className="flex items-center gap-2 px-4 py-1.5 bg-[#064771] text-white rounded text-sm font-semibold hover:bg-[#053a5c] transition-colors"
                    >
                      Add
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column - Sidebar */}
        <div className="w-[287px] shrink-0 space-y-10">
          {/* Open Investor Profile Button */}
          {investorProfileLink && (
            <a
              href={investorProfileLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between w-full p-2 bg-[#064771] rounded text-white hover:bg-[#053a5c] transition-colors"
            >
              <div className="flex items-center gap-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="4.5" width="18" height="12.75" rx="1" />
                  <path d="M15 17.25V21M9 17.25V21" />
                </svg>
                <span className="text-sm font-medium">Open Investor Profile</span>
              </div>
              <ExternalLink className="w-4 h-4" />
            </a>
          )}

          {/* Introduced Projects */}
          <div className="space-y-5">
            <h3 className="text-base font-medium text-gray-500 capitalize">Introduced Projects</h3>
            <div className="space-y-3">
              {introducedProjects.map((project, idx) => (
                <div key={idx} className="flex items-center gap-3.5">
                  <span className="px-2 py-1 bg-[#F7FAFF] border border-[#E8F6FF] rounded text-base font-medium text-[#064771]">
                    {project.code}
                  </span>
                  <span className="flex-1 text-base font-medium text-[#064771] truncate">
                    {project.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Assigned PIC */}
          <div className="space-y-3">
            <h3 className="text-base font-medium text-gray-500 capitalize">Assigned PIC</h3>
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-full bg-[#064771] flex items-center justify-center">
                <span className="text-white text-sm font-normal">CH</span>
              </div>
              <span className="text-base font-normal text-black">Rattaphum Champ</span>
            </div>
          </div>

          {/* Financial Advisor Role */}
          <div className="space-y-3">
            <h3 className="text-base font-medium text-gray-500 capitalize">Financial Advisor Role (Partner)</h3>
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-full bg-[#064771] flex items-center justify-center">
                <span className="text-white text-sm font-normal">LC</span>
              </div>
              <span className="text-base font-normal text-black">LCH Singapore</span>
            </div>
          </div>

          {/* Deal Pipeline Stage */}
          <div className="space-y-3">
            <h3 className="text-base font-medium text-gray-500 capitalize">Deal Pipeline Stage</h3>
            <span className="text-base font-normal text-black">N/A</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestorDetails;
