import React, { useEffect, useState, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../config/api';
import { showAlert } from '../../../components/Alert';
import { Loader2, Globe, User, Mail, Phone, ExternalLink, Send, Trash2, X, FileText, Tag } from 'lucide-react';
import { isBackendPropertyAllowed } from '../../../utils/permissionUtils';
import { AuthContext } from '../../../routes/AuthContext';

const RestrictedField: React.FC<{ allowed: any, section: string | 'root', item: string, children: React.ReactNode }> = ({ allowed, section, item, children }) => {
    if (!isBackendPropertyAllowed(allowed, section, item)) return null;
    return <>{children}</>;
};

interface Note {
    id: number;
    author: string;
    avatar?: string | null;
    content: string;
    timestamp: string;
    isSystem?: boolean;
    isSelf?: boolean;
    isDeleted?: boolean;
    deletedBy?: string;
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

const TargetDetails: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const authContext = useContext(AuthContext);
    const user = authContext?.user;
    const [loading, setLoading] = useState(true);
    const [seller, setSeller] = useState<any>(null);
    const [allowedFields, setAllowedFields] = useState<any>(null);
    const [newNote, setNewNote] = useState('');
    const [notes, setNotes] = useState<Note[]>([]);
    const [submittingNote, setSubmittingNote] = useState(false);
    const notesContainerRef = useRef<HTMLDivElement>(null);

    // Context menu and delete modal states
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; noteId: number } | null>(null);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; noteId: number | null; noteAuthor: string }>({ isOpen: false, noteId: null, noteAuthor: '' });
    const [deletingNote, setDeletingNote] = useState(false);

    // Auto-scroll to bottom when notes change
    useEffect(() => {
        if (notesContainerRef.current) {
            notesContainerRef.current.scrollTop = notesContainerRef.current.scrollHeight;
        }
    }, [notes]);

    const fetchSeller = async () => {
        try {
            const response = await api.get(`/api/seller/${id}`);
            const data = response.data?.data || {};
            setSeller(data);
            setAllowedFields(response.data?.meta?.allowed_fields || null);

            // Load activity logs
            try {
                const logsResponse = await api.get(`/api/activity-logs?entity_id=${id}&entity_type=seller`);
                if (logsResponse.data?.data) {
                    const logs = [...logsResponse.data.data].reverse(); // Reverse: oldest first for chat
                    setNotes(logs.map((log: any) => ({
                        id: log.id,
                        author: log.user || 'System',
                        avatar: log.avatar || null,
                        content: log.content,
                        timestamp: formatTimestamp(log.timestamp || log.created_at),
                        isSystem: log.type === 'system',
                        isSelf: log.user === getCurrentUserName(),
                    })));
                }
            } catch {
                // Activity logs may not be available, continue
            }
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

    // Close context menu when clicking outside
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    const getCurrentUserName = () => {
        const userData = user as any;
        if (userData?.employee) {
            return `${userData.employee.first_name} ${userData.employee.last_name}`.trim();
        }
        return userData?.name || 'User';
    };

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

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

    const industries = parseJSON(overview.industry_ops).filter((i: any) => i && (i.name || typeof i === 'string'));
    const nicheTags = parseJSON(overview.niche_industry).filter((t: any) => t && (t.name || typeof t === 'string'));
    const internalPICs: InternalPIC[] = parseJSON(overview.internal_pic);
    const financialAdvisors: FinancialAdvisor[] = parseJSON(overview.financial_advisor);

    const rank = overview.company_rank || overview.rank || 'N/A';
    const projectCode = seller?.seller_id || 'N/A';
    const companyName = overview.reg_name || 'Unknown Target';
    const lastUpdated = seller?.updated_at ? new Date(seller.updated_at).toLocaleDateString() : new Date().toLocaleDateString();
    const website = overview.website || '';
    const reasonMA = overview.reason_ma || 'N/A';
    const projectDetails = overview.details || '';
    const teaserLink = overview.teaser_link || '';
    const hqCountryName = overview?.hq_country?.name || 'N/A';
    const hqCountryFlag = overview?.hq_country?.svg_icon_url || '';

    // Get deal pipeline stage from deals
    const getDealPipelineStage = () => {
        if (seller?.deals && seller.deals.length > 0) {
            const latestDeal = seller.deals[0];
            return latestDeal.stage_name || latestDeal.stage_code || 'Active';
        }
        return 'N/A';
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

    const handleAddNote = async () => {
        if (!newNote.trim()) return;

        setSubmittingNote(true);
        try {
            const response = await api.post('/api/activity-logs', {
                entity_id: id,
                entity_type: 'seller',
                content: newNote.trim(),
                type: 'comment',
            });

            if (response.data) {
                const newNoteData: Note = {
                    id: response.data.data?.id || Date.now(),
                    author: getCurrentUserName(),
                    avatar: null,
                    content: newNote.trim(),
                    timestamp: formatTimestamp(new Date().toISOString()),
                    isSystem: false,
                    isSelf: true,
                };
                setNotes([...notes, newNoteData]);
                setNewNote('');
                showAlert({ type: "success", message: "Note added successfully" });
            }
        } catch (err) {
            showAlert({ type: "error", message: "Failed to add note" });
        } finally {
            setSubmittingNote(false);
        }
    };

    // Handle right-click on note
    const handleNoteContextMenu = (e: React.MouseEvent, noteId: number) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, noteId });
    };

    // Open delete confirmation modal
    const openDeleteModal = (noteId: number, noteAuthor: string) => {
        setContextMenu(null);
        setDeleteModal({ isOpen: true, noteId, noteAuthor });
    };

    // Handle delete note
    const handleDeleteNote = async () => {
        if (!deleteModal.noteId) return;

        setDeletingNote(true);
        try {
            await api.delete(`/api/activity-logs/${deleteModal.noteId}`);

            // Mark note as deleted instead of removing
            setNotes(notes.map(note =>
                note.id === deleteModal.noteId
                    ? { ...note, isDeleted: true, deletedBy: getCurrentUserName() }
                    : note
            ));

            setDeleteModal({ isOpen: false, noteId: null, noteAuthor: '' });
            showAlert({ type: "success", message: "Note deleted successfully" });
        } catch (err) {
            showAlert({ type: "error", message: "Failed to delete note" });
        } finally {
            setDeletingNote(false);
        }
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
                            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#064771] text-white rounded text-sm font-semibold hover:bg-[#053a5c] transition-colors"
                        >
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5.57501 13.4297H11.1921C13.1329 13.4297 14.7085 11.8542 14.7085 9.91335C14.7085 7.97249 13.1329 6.39697 11.1921 6.39697H3.46289" stroke="white" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M5.08346 8.1666L3.29102 6.36276L5.08346 4.57031" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Back
                        </button>

                        {/* Page Title */}
                        <h1 className="text-2xl font-medium text-gray-900">Target's Profile</h1>
                    </div>

                    {/* Edit Button - Secondary Style */}
                    <button
                        onClick={() => navigate(`/prospects/edit-target/${id}`)}
                        className="flex items-center gap-2 px-3 py-2 bg-white border border-[#E5E7EB] rounded text-[#374151] text-sm font-medium hover:bg-gray-50 transition-colors"
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
                                    <span className="text-[13px] font-medium text-[#7D7D7D]">last Updated {lastUpdated}</span>
                                </div>
                            </div>

                            {/* Overview Stats Row */}
                            <div className="flex items-start gap-20">
                                <RestrictedField allowed={allowedFields} section="companyOverview" item="hq_country">
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-[11px] font-medium text-[#9CA3AF] uppercase">Origin Country</span>
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
                                        <span className="text-[11px] font-medium text-[#9CA3AF] uppercase">Reason for M&A</span>
                                        <span className="text-sm font-normal text-black">{reasonMA}</span>
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
                            {/* Industries */}
                            <RestrictedField allowed={allowedFields} section="companyOverview" item="industry_ops">
                                <div className="w-[400px] flex flex-col gap-3">
                                    <span className="text-[11px] font-medium text-[#9CA3AF] uppercase">Industries</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {industries.length > 0 ? industries.map((ind: any, idx: number) => (
                                            <div
                                                key={idx}
                                                className="h-8 px-2 bg-[#F3F4F6] rounded flex items-center gap-1.5"
                                            >
                                                <Tag className="w-3 h-3 text-[#064771]" />
                                                <span className="text-sm font-normal text-[#374151]">{ind.name || (typeof ind === 'string' ? ind : String(ind.id || JSON.stringify(ind)))}</span>
                                            </div>
                                        )) : (
                                            <span className="text-sm font-medium text-black">N/A</span>
                                        )}
                                    </div>
                                </div>
                            </RestrictedField>

                            {/* Niche Tags */}
                            <RestrictedField allowed={allowedFields} section="companyOverview" item="niche_industry">
                                <div className="flex flex-col gap-3">
                                    <span className="text-[11px] font-medium text-[#9CA3AF] uppercase">Niche / Tags</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {nicheTags.length > 0 ? nicheTags.map((tag: any, idx: number) => (
                                            <span key={idx} className="px-3 py-1 bg-blue-50 text-[#064771] rounded text-xs font-medium">
                                                {tag.name || (typeof tag === 'string' ? tag : String(tag.id || JSON.stringify(tag)))}
                                            </span>
                                        )) : (
                                            <span className="text-sm text-gray-400 italic">No tags</span>
                                        )}
                                    </div>
                                </div>
                            </RestrictedField>

                            {/* Expected Investment */}
                            <RestrictedField allowed={allowedFields} section="financialDetails" item="expected_investment_amount">
                                <div className="flex flex-col gap-3">
                                    <span className="text-[11px] font-medium text-[#9CA3AF] uppercase">Expected Investment</span>
                                    <span className="text-sm font-semibold text-black">
                                        {financial.expected_investment_amount
                                            ? (typeof financial.expected_investment_amount === 'object' && financial.expected_investment_amount.min !== undefined
                                                ? `${Number(financial.expected_investment_amount.min).toLocaleString()} - ${Number(financial.expected_investment_amount.max).toLocaleString()}`
                                                : String(financial.expected_investment_amount))
                                            : 'Flexible'}
                                        {financial.default_currency_code && <span className="text-sm font-medium text-gray-400 ml-1">{financial.default_currency_code}</span>}
                                    </span>
                                </div>
                            </RestrictedField>

                            {/* Sale Share Ratio */}
                            <RestrictedField allowed={allowedFields} section="financialDetails" item="maximum_investor_shareholding_percentage">
                                <div className="flex flex-col gap-3">
                                    <span className="text-[11px] font-medium text-[#9CA3AF] uppercase">Sale Share Ratio</span>
                                    <span className="text-sm font-semibold text-black">
                                        {financial.maximum_investor_shareholding_percentage ? `${financial.maximum_investor_shareholding_percentage}%` : 'Negotiable'}
                                    </span>
                                </div>
                            </RestrictedField>
                        </div>
                    </section>

                    {/* Key Personnel Section */}
                    <section className="space-y-7">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-medium text-gray-500 capitalize">Key Personnel</h2>
                            <span className="text-xs font-medium text-[#9CA3AF]">1 Contact(s)</span>
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
                                                    <User className="w-5 h-5 text-[#9CA3AF]" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-base font-medium text-[#111827]">{overview.seller_contact_name || 'N/A'}</span>
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
                                                <Mail className="w-3.5 h-3.5 text-[#9CA3AF]" />
                                                <span className="text-xs font-normal text-[#4B5563]">{overview.seller_email || 'N/A'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Phone className="w-3.5 h-3.5 text-[#9CA3AF]" />
                                                <span className="text-xs font-normal text-[#4B5563]">
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
                    <section className="border border-[#F3F4F6] rounded overflow-hidden">
                        {/* Notes Header */}
                        <div className="px-3 py-2 bg-[rgba(249,250,251,0.8)] border-b border-[#F3F4F6] flex items-center gap-3">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M15.75 17.25V20.625C15.75 21.2463 15.2463 21.75 14.625 21.75H4.875C4.25368 21.75 3.75 21.2463 3.75 20.625V7.875C3.75 7.25368 4.25368 6.75 4.875 6.75H6.75C7.26107 6.75 7.76219 6.7926 8.25 6.87444M15.75 17.25H19.125C19.7463 17.25 20.25 16.7463 20.25 16.125V11.25C20.25 6.79051 17.0066 3.08855 12.75 2.37444C12.2622 2.2926 11.7611 2.25 11.25 2.25H9.375C8.75368 2.25 8.25 2.75368 8.25 3.375V6.87444M20.25 13.5V11.625C20.25 9.76104 18.739 8.25 16.875 8.25H15.375C14.7537 8.25 14.25 7.74632 14.25 7.125V5.625C14.25 3.76104 12.739 2.25 10.875 2.25H9.75" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <h2 className="text-base font-medium text-gray-500 capitalize">Notes</h2>
                        </div>

                        {/* Notes Content - WhatsApp Style */}
                        <div
                            ref={notesContainerRef}
                            className="p-5 bg-[#F8FAFC] min-h-[200px] max-h-[400px] overflow-y-auto flex flex-col gap-4"
                            style={{ scrollbarWidth: 'thin', scrollbarColor: '#CBD5E1 transparent' }}
                        >
                            {notes.length > 0 ? notes.map((note) => (
                                <div
                                    key={note.id}
                                    className={`flex ${note.isSelf ? 'justify-end' : 'justify-start'}`}
                                    onContextMenu={(e) => !note.isDeleted && note.isSelf && handleNoteContextMenu(e, note.id)}
                                >
                                    <div className={`flex gap-2 max-w-[75%] ${note.isSelf ? 'flex-row-reverse' : ''}`}>
                                        {/* Avatar */}
                                        {!note.isDeleted && (
                                            note.isSystem ? (
                                                <img src="/system-avatar.png" className="w-8 h-8 rounded-full shrink-0 object-cover self-end" alt="System" />
                                            ) : note.avatar ? (
                                                <img src={note.avatar} className="w-8 h-8 rounded-full shrink-0 object-cover self-end" alt="" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-[#064771] flex items-center justify-center shrink-0 self-end">
                                                    <span className="text-white text-xs font-medium">{getInitials(note.author)}</span>
                                                </div>
                                            )
                                        )}

                                        {/* Message Bubble */}
                                        {note.isDeleted ? (
                                            <div className="px-3 py-2 bg-[#F3F4F6] rounded-lg border border-[#E5E7EB] italic">
                                                <span className="text-sm text-[#9CA3AF]">
                                                    <Trash2 className="w-3 h-3 inline mr-1" />
                                                    {note.deletedBy || note.author} deleted this message
                                                </span>
                                            </div>
                                        ) : (
                                            <div
                                                className={`relative flex flex-col gap-1 px-3 py-2 rounded-lg shadow-sm cursor-pointer transition-all hover:shadow-md ${note.isSelf
                                                    ? 'bg-[#064771] text-white rounded-br-none'
                                                    : note.isSystem
                                                        ? 'bg-gradient-to-r from-[#E0F2FE] to-[#F0F9FF] text-[#0C4A6E] rounded-bl-none border border-[#BAE6FD]'
                                                        : 'bg-white text-[#374151] rounded-bl-none border border-[#E5E7EB]'
                                                    }`}
                                            >
                                                {/* Author & System Badge */}
                                                <div className={`flex items-center gap-2 ${note.isSelf ? 'justify-end' : ''}`}>
                                                    <span className={`text-xs font-semibold ${note.isSelf ? 'text-white/90' : 'text-[#374151]'}`}>
                                                        {note.author}
                                                    </span>
                                                    {note.isSystem && (
                                                        <span className="px-1.5 py-0.5 bg-[#0EA5E9]/10 border border-[#0EA5E9]/20 rounded text-[9px] font-medium text-[#0369A1]">
                                                            System
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Message Content */}
                                                <p className={`text-sm leading-relaxed ${note.isSelf ? 'text-white' : ''}`}>
                                                    {note.content}
                                                </p>

                                                {/* Timestamp */}
                                                <span className={`text-[10px] self-end ${note.isSelf ? 'text-white/70' : 'text-[#9CA3AF]'}`}>
                                                    {note.timestamp}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center text-gray-400 italic py-8">
                                    No notes yet. Add a note to start the conversation.
                                </div>
                            )}
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
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleAddNote();
                                            }
                                        }}
                                    />
                                    <div className="flex justify-end">
                                        <button
                                            onClick={handleAddNote}
                                            disabled={submittingNote || !newNote.trim()}
                                            className="flex items-center gap-2 px-4 py-1.5 bg-[#064771] text-white rounded text-sm font-semibold hover:bg-[#053a5c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {submittingNote ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <>
                                                    Add
                                                    <Send className="w-5 h-5" />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Context Menu */}
                    {contextMenu && (
                        <div
                            className="fixed bg-white rounded-lg shadow-lg border border-[#E5E7EB] py-1 z-50 min-w-[140px]"
                            style={{ left: contextMenu.x, top: contextMenu.y }}
                        >
                            <button
                                onClick={() => {
                                    const note = notes.find(n => n.id === contextMenu.noteId);
                                    if (note) openDeleteModal(contextMenu.noteId, note.author);
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete Message
                            </button>
                        </div>
                    )}

                    {/* Delete Confirmation Modal */}
                    {deleteModal.isOpen && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg shadow-xl w-[400px] overflow-hidden">
                                {/* Modal Header */}
                                <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB]">
                                    <h3 className="text-lg font-semibold text-[#111827]">Delete Message</h3>
                                    <button
                                        onClick={() => setDeleteModal({ isOpen: false, noteId: null, noteAuthor: '' })}
                                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                                    >
                                        <X className="w-5 h-5 text-[#6B7280]" />
                                    </button>
                                </div>

                                {/* Modal Body */}
                                <div className="px-5 py-4">
                                    <p className="text-sm text-[#6B7280]">
                                        Are you sure you want to delete this message? This action cannot be undone.
                                    </p>
                                </div>

                                {/* Modal Footer */}
                                <div className="flex justify-end gap-3 px-5 py-4 bg-[#F9FAFB] border-t border-[#E5E7EB]">
                                    <button
                                        onClick={() => setDeleteModal({ isOpen: false, noteId: null, noteAuthor: '' })}
                                        className="px-4 py-2 text-sm font-medium text-[#374151] bg-white border border-[#D1D5DB] rounded-md hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDeleteNote}
                                        disabled={deletingNote}
                                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {deletingNote ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="w-4 h-4" />
                                        )}
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column - Sidebar */}
                <div className="w-[287px] shrink-0 space-y-10">
                    {/* Teaser Document Link */}
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

                    {/* Assigned PIC */}
                    <div className="space-y-3">
                        <h3 className="text-base font-medium text-gray-500 capitalize">Assigned PIC</h3>
                        <div className="flex items-center gap-3.5">
                            <div className="w-9 h-9 rounded-full bg-[#064771] flex items-center justify-center">
                                <span className="text-white text-sm font-normal">{getInitials(getPrimaryPIC())}</span>
                            </div>
                            <span className="text-base font-normal text-black">{getPrimaryPIC()}</span>
                        </div>
                    </div>

                    {/* Financial Advisor Role */}
                    <div className="space-y-3">
                        <h3 className="text-base font-medium text-gray-500 capitalize">Financial Advisor Role (Partner)</h3>
                        <div className="flex items-center gap-3.5">
                            <div className="w-9 h-9 rounded-full bg-[#064771] flex items-center justify-center">
                                <span className="text-white text-sm font-normal">{getInitials(getPrimaryAdvisor())}</span>
                            </div>
                            <span className="text-base font-normal text-black">{getPrimaryAdvisor()}</span>
                        </div>
                    </div>

                    {/* Deal Pipeline Stage */}
                    <div className="space-y-3">
                        <h3 className="text-base font-medium text-gray-500 capitalize">Deal Pipeline Stage</h3>
                        <span className="text-base font-normal text-black">{getDealPipelineStage()}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TargetDetails;
