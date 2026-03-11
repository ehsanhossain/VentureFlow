/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useContext, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Globe, Building2, KeyRound, PowerOff, Power,
    Loader, Camera, FolderClosed, FileText, Plus, Trash2,
    Star, Eye, EyeOff, Users,
} from 'lucide-react';
import { BrandSpinner } from '../../../components/BrandSpinner';
import api from '../../../config/api';
import { showAlert } from '../../../components/Alert';
import { AuthContext } from '../../../routes/AuthContext';
import ImageCropperModal from '../../../components/ImageCropperModal';
import cloudflowBrandIcon from '../../../assets/icons/cloudflow-brand.svg';


// ── Types ──

interface PartnerAccount {
    id: number;
    name: string;
    email: string;
    is_active?: boolean;
    created_at?: string;
    pivot?: {
        is_primary?: boolean;
        label?: string;
    };
}

interface Partner {
    id: number;
    partner_id: string;
    status: string;
    image?: string;
    partner_image?: string;
    created_at?: string;
    updated_at?: string;
    users_count?: number;
    user?: {
        id: number;
        name: string;
        email: string;
        created_at?: string;
        is_active?: boolean;
    };
    users?: PartnerAccount[];
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

// ── Component ──

const PartnerDetails: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const authCtx = useContext(AuthContext);
    const currentRole = authCtx?.role;


    const [partner, setPartner] = useState<Partner | null>(null);
    const [loading, setLoading] = useState(true);

    // Admin action state
    const [newPassword, setNewPassword] = useState('');
    const [showPwForm, setShowPwForm] = useState(false);
    const [pwSaving, setPwSaving] = useState(false);

    // CloudFlow Drive stats
    const [driveStats, setDriveStats] = useState<{ folder_count: number; file_count: number } | null>(null);



    // Avatar upload
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [cropSrc, setCropSrc] = useState<string | null>(null);

    // Add Account form state
    const [showAddAccount, setShowAddAccount] = useState(false);
    const [newAccount, setNewAccount] = useState({ name: '', email: '', password: '', label: '' });
    const [addAccountSaving, setAddAccountSaving] = useState(false);
    const [showNewAccountPw, setShowNewAccountPw] = useState(false);

    // Inline password reset per-account
    const [resetPwUserId, setResetPwUserId] = useState<number | null>(null);
    const [resetPwValue, setResetPwValue] = useState('');
    const [resetPwSaving, setResetPwSaving] = useState(false);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => setCropSrc(reader.result as string);
        reader.readAsDataURL(file);
        if (avatarInputRef.current) avatarInputRef.current.value = '';
    };

    const handleCropComplete = async (blob: Blob) => {
        if (!id) return;
        setCropSrc(null);
        setAvatarUploading(true);
        try {
            const fd = new FormData();
            fd.append('image', blob, 'avatar.jpg');
            const res = await api.post(`/api/partners/${id}/avatar`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setPartner((prev) => prev ? { ...prev, image: res.data.image_path } : prev);
            showAlert({ type: 'success', message: 'Avatar updated.' });
        } catch {
            showAlert({ type: 'error', message: 'Failed to upload avatar.' });
        } finally {
            setAvatarUploading(false);
        }
    };

    const getAvatarUrl = () => {
        const img = partner?.partner_image || partner?.image;
        if (img) {
            return img.startsWith('http') ? img : `/api/files/${img}`;
        }
        return '';
    };

    useEffect(() => {
        if (id) {
            fetchPartner(id);
        }
    }, [id]);

    const fetchPartner = async (partnerId: string) => {
        setLoading(true);
        try {
            const res = await api.get(`/api/partners/${partnerId}`);
            const data = res.data.data || res.data;
            setPartner(data);

            // Fetch drive stats (non-blocking)
            try {
                const statsRes = await api.get(`/api/drive/partner/${partnerId}/stats`);
                setDriveStats(statsRes.data);
            } catch {
                // Drive stats are optional — fail silently
            }


        } catch (error) {
            console.error('Failed to fetch partner:', error);
            showAlert({ type: 'error', message: 'Failed to load partner details' });
        } finally {
            setLoading(false);
        }
    };

    // ── Admin Password Reset (primary user) ──
    const handleResetPassword = async () => {
        if (!partner?.user?.id) return;
        if (newPassword.length < 8) {
            showAlert({ type: 'error', message: 'Password must be at least 8 characters.' });
            return;
        }
        setPwSaving(true);
        try {
            await api.post(`/api/admin/users/${partner.user.id}/reset-password`, {
                password: newPassword,
                password_confirmation: newPassword,
            });
            showAlert({ type: 'success', message: `Password reset for ${partner.user.name}.` });
            setNewPassword('');
            setShowPwForm(false);
        } catch (err) {
            const e = err as { response?: { data?: { message?: string } } };
            showAlert({ type: 'error', message: e.response?.data?.message || 'Failed to reset password.' });
        } finally {
            setPwSaving(false);
        }
    };



    // ── Multi-Account Actions ──
    const handleAddAccount = async () => {
        if (!id) return;
        if (!newAccount.name || !newAccount.email || newAccount.password.length < 8) {
            showAlert({ type: 'error', message: 'Please fill all required fields. Password min 8 chars.' });
            return;
        }
        setAddAccountSaving(true);
        try {
            await api.post(`/api/partners/${id}/accounts`, newAccount);
            showAlert({ type: 'success', message: 'Account added successfully.' });
            setNewAccount({ name: '', email: '', password: '', label: '' });
            setShowAddAccount(false);
            fetchPartner(id); // Refresh
        } catch (err) {
            const e = err as { response?: { data?: { error?: any } } };
            const msg = typeof e.response?.data?.error === 'string'
                ? e.response.data.error
                : 'Failed to add account.';
            showAlert({ type: 'error', message: msg });
        } finally {
            setAddAccountSaving(false);
        }
    };

    const handleRemoveAccount = async (userId: number) => {
        if (!id) return;
        if (!window.confirm('Are you sure you want to remove this account? This cannot be undone.')) return;
        try {
            await api.delete(`/api/partners/${id}/accounts/${userId}`);
            showAlert({ type: 'success', message: 'Account removed.' });
            fetchPartner(id);
        } catch (err) {
            const e = err as { response?: { data?: { error?: string } } };
            showAlert({ type: 'error', message: e.response?.data?.error || 'Failed to remove account.' });
        }
    };

    const handleSetPrimary = async (userId: number) => {
        if (!id) return;
        try {
            await api.put(`/api/partners/${id}/accounts/${userId}/primary`);
            showAlert({ type: 'success', message: 'Primary account updated.' });
            fetchPartner(id);
        } catch {
            showAlert({ type: 'error', message: 'Failed to update primary account.' });
        }
    };

    const handleResetAccountPassword = async (userId: number) => {
        if (resetPwValue.length < 8) {
            showAlert({ type: 'error', message: 'Password must be at least 8 characters.' });
            return;
        }
        setResetPwSaving(true);
        try {
            await api.post(`/api/admin/users/${userId}/reset-password`, {
                password: resetPwValue,
                password_confirmation: resetPwValue,
            });
            showAlert({ type: 'success', message: 'Password reset successfully.' });
            setResetPwUserId(null);
            setResetPwValue('');
        } catch {
            showAlert({ type: 'error', message: 'Failed to reset password.' });
        } finally {
            setResetPwSaving(false);
        }
    };

    const handleToggleAccountActive = async (userId: number, currentlyActive: boolean) => {
        if (!id) return;
        try {
            await api.patch(`/api/admin/users/${userId}/status`, { is_active: !currentlyActive });
            showAlert({ type: 'success', message: `Account ${!currentlyActive ? 'activated' : 'deactivated'}.` });
            fetchPartner(id);
        } catch {
            showAlert({ type: 'error', message: 'Failed to update account status.' });
        }
    };

    // ── Loading / Not Found ──

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
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

    // ── Derived Data ──

    const overview = partner.partner_overview;
    const structure = partner.partnership_structure;
    const partnerName = partner.user?.name || overview?.reg_name || 'Unknown Partner';
    const lastUpdated = partner.updated_at
        ? new Date(partner.updated_at).toLocaleDateString()
        : new Date().toLocaleDateString();

    const accounts: PartnerAccount[] = partner.users || [];
    const accountsCount = partner.users_count ?? accounts.length;

    const getInitials = (name: string) => {
        if (!name) return 'NA';
        const parts = name.split(' ').filter(Boolean);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
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
        <>
            <div className="flex flex-col w-full min-h-screen bg-white" style={{ fontFamily: 'Inter, sans-serif' }}>
                {/* Header Bar */}
                <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-5 py-2.5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {/* Back Button */}
                            <button
                                onClick={() => navigate('/settings/partners')}
                                className="flex items-center gap-1.5 px-4 py-1.5 bg-[#064771] text-white rounded-[3px] text-sm font-semibold hover:bg-[#053a5c] transition-colors"
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
                            className="flex items-center gap-2 px-3 py-2 bg-white border border-[#E5E7EB] rounded-[3px] text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
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
                                    {/* Partner Avatar — click to upload */}
                                    <div
                                        className="relative group cursor-pointer w-[52px] h-[52px] shrink-0"
                                        onClick={() => avatarInputRef.current?.click()}
                                        title="Click to change photo"
                                    >
                                        <input
                                            ref={avatarInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleAvatarChange}
                                        />
                                        {getAvatarUrl() ? (
                                            <img
                                                src={getAvatarUrl()}
                                                alt={partnerName}
                                                className="w-[52px] h-[52px] rounded-full object-cover ring-1 ring-gray-100"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                }}
                                            />
                                        ) : null}
                                        <div className={`w-[52px] h-[52px] rounded-full bg-[#064771] flex items-center justify-center text-white text-xl font-medium ${getAvatarUrl() ? 'hidden' : ''}`}>
                                            {getInitials(partnerName)}
                                        </div>
                                        {/* Upload overlay */}
                                        <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            {avatarUploading
                                                ? <Loader className="w-4 h-4 text-white animate-spin" />
                                                : <Camera className="w-4 h-4 text-white" />
                                            }
                                        </div>
                                    </div>

                                    <div className="flex flex-col justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl font-medium text-black capitalize">{partnerName}</span>
                                            <span className="px-2 py-1 bg-[#F7FAFF] border border-[#E8F6FF] rounded-[3px] text-[#064771] text-base font-medium">
                                                {partner.partner_id}
                                            </span>
                                        </div>
                                        <span className="text-[13px] font-medium text-gray-500">last Updated {lastUpdated}</span>
                                    </div>
                                </div>

                                {/* Overview Stats Row */}
                                <div className="flex items-start gap-20">
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-[11px] font-medium text-gray-400 uppercase">Origin Country</span>
                                        <div className="flex items-center gap-2">
                                            {overview?.country?.svg_icon_url && (
                                                <img src={overview.country.svg_icon_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                                            )}
                                            <span className="text-sm font-medium text-gray-900">{overview?.country?.name || 'N/A'}</span>
                                        </div>
                                    </div>

                                    {overview?.company_type && (
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-[11px] font-medium text-gray-400 uppercase">Company Type</span>
                                            <span className="text-sm font-normal text-black">{overview.company_type}</span>
                                        </div>
                                    )}

                                    {overview?.year_founded && (
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-[11px] font-medium text-gray-400 uppercase">Year Founded</span>
                                            <span className="text-sm font-normal text-black">{overview.year_founded}</span>
                                        </div>
                                    )}

                                    {website && (
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-[11px] font-medium text-gray-400 uppercase">Website</span>
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
                                        <span className="text-[11px] font-medium text-gray-400 uppercase">Niche Industries</span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {overview.niche_industry.map((ind: any, idx: number) => (
                                                <span
                                                    key={idx}
                                                    className="px-3 py-1.5 bg-[#F3F4F6] rounded-[3px] text-sm font-medium text-gray-700"
                                                >
                                                    {typeof ind === 'string' ? ind : ind.name || ind}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Partner Details Section */}
                        <section className="space-y-7">
                            <h2 className="text-base font-medium text-gray-500 capitalize">Partner Details</h2>
                            <div className="h-px bg-[#E5E7EB]" />
                            <p className="text-sm text-gray-600 leading-relaxed bg-[#F9FAFB] p-5 rounded-[3px] border border-[#F3F4F6] whitespace-pre-wrap min-h-[80px]">
                                {overview?.details || 'No details available.'}
                            </p>
                        </section>

                        {/* Partnership Structure Section */}
                        {structure && (structure.partnership_structure || structure.retainer_fee || structure.success_fee_percentage || structure.contract_duration) && (
                            <section className="space-y-7">
                                <h2 className="text-base font-medium text-gray-500 capitalize">Partnership Structure</h2>
                                <div className="h-px bg-[#E5E7EB]" />

                                <div className="flex flex-wrap items-start gap-x-24 gap-y-6">
                                    {structure.partnership_structure && (
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-[11px] font-medium text-gray-400 uppercase">Partnership Type</span>
                                            <span className="text-sm font-normal text-black">{structure.partnership_structure}</span>
                                        </div>
                                    )}
                                    {structure.retainer_fee && (
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-[11px] font-medium text-gray-400 uppercase">Retainer Fee</span>
                                            <span className="text-sm font-semibold text-black">{structure.retainer_fee}</span>
                                        </div>
                                    )}
                                    {structure.success_fee_percentage && (
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-[11px] font-medium text-gray-400 uppercase">Success Fee</span>
                                            <span className="text-sm font-semibold text-black">{structure.success_fee_percentage}%</span>
                                        </div>
                                    )}
                                    {structure.minimum_success_fee && (
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-[11px] font-medium text-gray-400 uppercase">Minimum Success Fee</span>
                                            <span className="text-sm font-semibold text-black">{structure.minimum_success_fee}</span>
                                        </div>
                                    )}
                                    {structure.contract_duration && (
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-[11px] font-medium text-gray-400 uppercase">Contract Duration</span>
                                            <span className="text-sm font-normal text-black">{structure.contract_duration}</span>
                                        </div>
                                    )}
                                    {structure.payment_terms && (
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-[11px] font-medium text-gray-400 uppercase">Payment Terms</span>
                                            <span className="text-sm font-normal text-black">{structure.payment_terms}</span>
                                        </div>
                                    )}
                                    {structure.territory_scope && (
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-[11px] font-medium text-gray-400 uppercase">Territory Scope</span>
                                            <span className="text-sm font-normal text-black">{structure.territory_scope}</span>
                                        </div>
                                    )}
                                    {structure.exclusivity !== undefined && (
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-[11px] font-medium text-gray-400 uppercase">Exclusivity</span>
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

                        {/* Login Accounts Section — Admin only */}
                        {currentRole === 'System Admin' && (
                            <section className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="flex items-center gap-2 text-base font-medium text-gray-500 capitalize">
                                        <Users className="w-4 h-4" />
                                        Login Accounts
                                        <span className="ml-1 px-2 py-0.5 bg-[#F7FAFF] border border-[#E8F6FF] rounded-full text-xs font-medium text-[#064771]">
                                            {accountsCount}
                                        </span>
                                    </h2>
                                    <button
                                        onClick={() => setShowAddAccount(!showAddAccount)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#064771] border border-[#064771]/20 rounded-[3px] hover:bg-[#064771]/5 transition-colors"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        Add Account
                                    </button>
                                </div>
                                <div className="h-px bg-[#E5E7EB]" />

                                {/* Add Account Form */}
                                {showAddAccount && (
                                    <div className="p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-[3px] space-y-3">
                                        <h4 className="text-sm font-medium text-gray-700">New Login Account</h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            <input
                                                type="text"
                                                placeholder="Full Name *"
                                                value={newAccount.name}
                                                onChange={(e) => setNewAccount(prev => ({ ...prev, name: e.target.value }))}
                                                className="h-9 px-3 border border-gray-200 rounded-[3px] text-sm outline-none focus:border-[#064771] focus:ring-1 focus:ring-[#064771]/20"
                                            />
                                            <input
                                                type="email"
                                                placeholder="Email Address *"
                                                value={newAccount.email}
                                                onChange={(e) => setNewAccount(prev => ({ ...prev, email: e.target.value }))}
                                                className="h-9 px-3 border border-gray-200 rounded-[3px] text-sm outline-none focus:border-[#064771] focus:ring-1 focus:ring-[#064771]/20"
                                            />
                                            <div className="relative">
                                                <input
                                                    type={showNewAccountPw ? 'text' : 'password'}
                                                    placeholder="Password (min 8) *"
                                                    value={newAccount.password}
                                                    onChange={(e) => setNewAccount(prev => ({ ...prev, password: e.target.value }))}
                                                    className="w-full h-9 px-3 pr-9 border border-gray-200 rounded-[3px] text-sm outline-none focus:border-[#064771] focus:ring-1 focus:ring-[#064771]/20"
                                                />
                                                <button
                                                    type="button"
                                                    title={showNewAccountPw ? 'Hide password' : 'Show password'}
                                                    onClick={() => setShowNewAccountPw(!showNewAccountPw)}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                >
                                                    {showNewAccountPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Label (e.g. CEO Login)"
                                                value={newAccount.label}
                                                onChange={(e) => setNewAccount(prev => ({ ...prev, label: e.target.value }))}
                                                className="h-9 px-3 border border-gray-200 rounded-[3px] text-sm outline-none focus:border-[#064771] focus:ring-1 focus:ring-[#064771]/20"
                                            />
                                        </div>
                                        <div className="flex gap-2 pt-1">
                                            <button
                                                onClick={handleAddAccount}
                                                disabled={addAccountSaving}
                                                className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white rounded-[3px] transition-colors"
                                                style={{ backgroundColor: addAccountSaving ? '#9ab3c7' : '#064771' }}
                                            >
                                                {addAccountSaving && <Loader className="w-3 h-3 animate-spin" />}
                                                {addAccountSaving ? 'Adding…' : 'Add Account'}
                                            </button>
                                            <button
                                                onClick={() => { setShowAddAccount(false); setNewAccount({ name: '', email: '', password: '', label: '' }); }}
                                                className="px-3 py-1.5 text-sm text-gray-500 border border-gray-200 rounded-[3px] hover:bg-gray-50 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Accounts List */}
                                <div className="space-y-3">
                                    {accounts.length > 0 ? accounts.map((acct) => {
                                        const isPrimary = acct.pivot?.is_primary;
                                        const isActive = acct.is_active !== false;
                                        return (
                                            <div
                                                key={acct.id}
                                                className={`flex items-center gap-4 p-3 rounded-[3px] border transition-colors ${isPrimary
                                                    ? 'bg-[#F7FAFF] border-[#E8F6FF]'
                                                    : 'bg-[rgba(249,250,251,0.5)] border-[#F3F4F6]'
                                                    } ${!isActive ? 'opacity-60' : ''}`}
                                            >
                                                {/* Avatar */}
                                                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isPrimary ? 'bg-[#064771]' : 'bg-gray-400'}`}>
                                                    <span className="text-white text-sm font-medium">{getInitials(acct.name)}</span>
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium text-gray-900 truncate">{acct.name}</span>
                                                        {isPrimary && (
                                                            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-[#064771]/10 text-[#064771] text-[10px] font-medium rounded">
                                                                <Star className="w-2.5 h-2.5" /> Primary
                                                            </span>
                                                        )}
                                                        {acct.pivot?.label && (
                                                            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-medium rounded">
                                                                {acct.pivot.label}
                                                            </span>
                                                        )}
                                                        {!isActive && (
                                                            <span className="px-1.5 py-0.5 bg-rose-50 text-rose-600 text-[10px] font-medium rounded border border-rose-100">
                                                                Disabled
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-gray-400 truncate block">{acct.email}</span>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    {!isPrimary && (
                                                        <button
                                                            onClick={() => handleSetPrimary(acct.id)}
                                                            title="Set as primary account"
                                                            className="p-1.5 rounded hover:bg-[#064771]/10 text-gray-400 hover:text-[#064771] transition-colors"
                                                        >
                                                            <Star className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => { setResetPwUserId(resetPwUserId === acct.id ? null : acct.id); setResetPwValue(''); }}
                                                        title="Reset password"
                                                        className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                                                    >
                                                        <KeyRound className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleAccountActive(acct.id, isActive)}
                                                        title={isActive ? 'Deactivate' : 'Activate'}
                                                        className={`p-1.5 rounded transition-colors ${isActive
                                                            ? 'hover:bg-red-50 text-gray-400 hover:text-red-500'
                                                            : 'hover:bg-emerald-50 text-gray-400 hover:text-emerald-600'
                                                            }`}
                                                    >
                                                        {isActive ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                                                    </button>
                                                    {!isPrimary && (
                                                        <button
                                                            onClick={() => handleRemoveAccount(acct.id)}
                                                            title="Remove account"
                                                            className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    }) : (
                                        <div className="text-sm text-gray-400 italic py-2">No linked accounts found.</div>
                                    )}

                                    {/* Inline Password Reset */}
                                    {resetPwUserId && (
                                        <div className="flex items-center gap-2 pl-12">
                                            <input
                                                type="password"
                                                placeholder="New password (min 8)"
                                                value={resetPwValue}
                                                onChange={(e) => setResetPwValue(e.target.value)}
                                                className="h-8 w-48 px-3 border border-gray-200 rounded-[3px] text-sm outline-none focus:border-[#064771] focus:ring-1 focus:ring-[#064771]/20"
                                            />
                                            <button
                                                onClick={() => handleResetAccountPassword(resetPwUserId)}
                                                disabled={resetPwSaving}
                                                className="h-8 px-3 text-xs font-medium text-white rounded-[3px] transition-colors"
                                                style={{ backgroundColor: resetPwSaving ? '#9ab3c7' : '#064771' }}
                                            >
                                                {resetPwSaving ? 'Saving…' : 'Reset'}
                                            </button>
                                            <button
                                                onClick={() => { setResetPwUserId(null); setResetPwValue(''); }}
                                                className="h-8 px-2 text-xs text-gray-500 hover:text-gray-700"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}


                    </div>

                    {/* Right Column - Sidebar */}
                    <div className="w-[287px] shrink-0 space-y-10">


                        {/* CloudFlow Drive Card */}
                        <div
                            className="flex items-center gap-3 p-3 rounded-[3px] border border-gray-200 cursor-pointer hover:bg-[#f7faff] hover:border-[#c4dff0] transition-all group"
                            onClick={() => navigate(`/drive/partner/${id}`)}
                        >
                            <img src={cloudflowBrandIcon} alt="" className="w-7 h-7 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <span className="block text-sm font-semibold text-gray-800">CloudFlow Drive</span>
                                {driveStats ? (
                                    (driveStats.folder_count > 0 || driveStats.file_count > 0) ? (
                                        <div className="flex items-center gap-3 mt-0.5">
                                            {driveStats.folder_count > 0 && (
                                                <span className="flex items-center gap-1 text-[11px] text-gray-400">
                                                    <FolderClosed className="w-3 h-3" />
                                                    {driveStats.folder_count} {driveStats.folder_count === 1 ? 'Folder' : 'Folders'}
                                                </span>
                                            )}
                                            {driveStats.file_count > 0 && (
                                                <span className="flex items-center gap-1 text-[11px] text-gray-400">
                                                    <FileText className="w-3 h-3" />
                                                    {driveStats.file_count} {driveStats.file_count === 1 ? 'File' : 'Files'}
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="block text-[11px] text-gray-400">Empty</span>
                                    )
                                ) : (
                                    <span className="block text-[11px] text-gray-400">Manage files &amp; documents</span>
                                )}
                            </div>
                            <svg className="w-4 h-4 text-gray-300 group-hover:text-[#064771] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                        </div>

                        {/* Partner ID */}
                        <div className="space-y-3">
                            <h3 className="text-base font-medium text-gray-500 capitalize">Partner ID</h3>
                            <span className="inline-flex px-3 py-1.5 bg-[#F7FAFF] border border-[#E8F6FF] rounded-[3px] text-base font-medium text-[#064771]" style={{ fontFamily: 'Inter, sans-serif' }}>
                                {partner.partner_id}
                            </span>
                        </div>

                        {/* Account Count */}
                        <div className="space-y-3">
                            <h3 className="text-base font-medium text-gray-500 capitalize">Login Accounts</h3>
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-[#064771]" />
                                <span className="text-base font-medium text-black">{accountsCount} {accountsCount === 1 ? 'Account' : 'Accounts'}</span>
                            </div>
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

                        {/* Admin Actions — only visible to System Admin */}
                        {currentRole === 'System Admin' && partner.user?.id && (
                            <div className="space-y-3 pt-2 border-t border-gray-100">
                                <h3 className="text-base font-medium text-gray-500 capitalize">Admin Actions</h3>

                                {/* Reset Password (legacy primary) */}
                                {!showPwForm ? (
                                    <button
                                        onClick={() => setShowPwForm(true)}
                                        className="w-full flex items-center gap-2 px-3 py-2 rounded-[3px] border border-gray-200 text-sm text-gray-700 hover:border-[#064771] hover:text-[#064771] transition-colors"
                                    >
                                        <KeyRound className="w-4 h-4" />
                                        Reset Primary Password
                                    </button>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        <input
                                            type="password"
                                            placeholder="New password (min 8)"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="h-9 px-3 border border-gray-200 rounded-[3px] text-sm outline-none focus:border-[#064771] focus:ring-1 focus:ring-[#064771]/20"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleResetPassword}
                                                disabled={pwSaving}
                                                className="flex-1 h-8 text-xs font-medium text-white rounded-[3px] flex items-center justify-center gap-1.5 transition-colors"
                                                style={{ backgroundColor: pwSaving ? '#9ab3c7' : '#064771' }}
                                            >
                                                {pwSaving && <Loader className="w-3 h-3 animate-spin" />}
                                                {pwSaving ? 'Saving…' : 'Set Password'}
                                            </button>
                                            <button
                                                onClick={() => { setShowPwForm(false); setNewPassword(''); }}
                                                className="h-8 px-3 text-xs text-gray-500 border border-gray-200 rounded-[3px] hover:bg-gray-50 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Delete Partner */}
                                <button
                                    onClick={async () => {
                                        if (!window.confirm('Are you sure you want to delete this partner? This action cannot be undone.')) return;
                                        try {
                                            await api.delete('/api/partners', { data: { ids: [partner.id] } });
                                            showAlert({ type: 'success', message: 'Partner deleted successfully.' });
                                            navigate('/settings/partners');
                                        } catch {
                                            showAlert({ type: 'error', message: 'Failed to delete partner.' });
                                        }
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-[3px] border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete Partner
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Image Cropper Modal */}
            {cropSrc && (
                <ImageCropperModal
                    imageSrc={cropSrc}
                    onCropComplete={handleCropComplete}
                    onClose={() => setCropSrc(null)}
                    aspect={1}
                />
            )}
        </>
    );
};

export default PartnerDetails;
