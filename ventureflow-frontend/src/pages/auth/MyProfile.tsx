/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 *
 * MyProfile — role-aware profile page for Staff and System Admin users.
 * Matches the StaffDetails layout with sidebar and sections.
 */

import React, { useContext, useEffect, useState, useRef } from 'react';
import { AuthContext } from '../../routes/AuthContext';
import api from '../../config/api';
import { showAlert } from '../../components/Alert';
import ImageCropperModal from '../../components/ImageCropperModal';
import {
    Mail, Phone, Shield, ShieldCheck, Key, Loader, Camera,
} from 'lucide-react';

interface Employee {
    id: number;
    first_name: string;
    last_name: string;
    employee_id?: string;
    gender?: string;
    work_email?: string;
    contact_number?: string;
    employee_status?: string;
    joining_date?: string;
    image?: string;
    nationality?: string;
    designation?: { designation_name?: string };
    designation_data?: { title?: string };
    department?: { name?: string };
    department_data?: { name?: string };
    company_data?: { name?: string };
    branch_data?: { name?: string };
    team_data?: { name?: string };
    country?: { name?: string; svg_icon_url?: string };
    user?: {
        id: number;
        email: string;
        created_at?: string;
    };
}

const MyProfile: React.FC = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('AuthContext missing');
    const { user, role } = context;

    const [employee, setEmployee] = useState<Employee | null>(null);
    const [loading, setLoading] = useState(true);

    // Change password
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [saving, setSaving] = useState(false);

    // Avatar
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [cropSrc, setCropSrc] = useState<string | null>(null);

    const baseURL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        api.get('/api/user')
            .then((res) => {
                setEmployee(res.data.employee || null);
            })
            .catch(() => setEmployee(null))
            .finally(() => setLoading(false));
    }, []);

    // ── Avatar handlers ──
    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => setCropSrc(reader.result as string);
        reader.readAsDataURL(file);
        if (avatarInputRef.current) avatarInputRef.current.value = '';
    };

    const handleCropComplete = async (blob: Blob) => {
        if (!employee?.id) return;
        setCropSrc(null);
        setAvatarUploading(true);
        try {
            const fd = new FormData();
            fd.append('image', blob, 'avatar.jpg');
            const res = await api.post(`/api/employees/${employee.id}/avatar`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setEmployee((prev) => prev ? { ...prev, image: res.data.image_path } : prev);
            showAlert({ type: 'success', message: 'Profile picture updated.' });
        } catch {
            showAlert({ type: 'error', message: 'Failed to upload profile picture.' });
        } finally {
            setAvatarUploading(false);
        }
    };

    const getAvatarUrl = () => {
        if (employee?.image) return `${baseURL}/api/files/${employee.image}`;
        return null;
    };

    const getInitials = (name: string) => {
        const parts = name.trim().split(/\s+/);
        return (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    // ── Password handler ──
    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            showAlert({ type: 'error', message: 'New passwords do not match.' });
            return;
        }
        if (newPassword.length < 8) {
            showAlert({ type: 'error', message: 'Password must be at least 8 characters.' });
            return;
        }
        setSaving(true);
        try {
            await api.post('/api/user/change-password', {
                current_password: currentPassword,
                password: newPassword,
                password_confirmation: confirmPassword,
            });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            showAlert({ type: 'success', message: 'Password changed successfully.' });
        } catch (err) {
            const e = err as { response?: { data?: { message?: string } } };
            showAlert({ type: 'error', message: e.response?.data?.message || 'Failed to change password.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-white">
                <Loader className="animate-spin text-[#064771]" size={32} />
            </div>
        );
    }

    const displayName = employee
        ? `${employee.first_name} ${employee.last_name}`
        : user?.name || 'User';

    const isAdmin = role === 'System Admin';
    const roleLabel = isAdmin ? 'System Admin' : role || 'Staff';
    const lastUpdated = employee?.user?.created_at
        ? formatDate(employee.user.created_at)
        : 'N/A';

    const inputClass = "w-full h-10 px-3 border border-gray-200 rounded-[3px] text-sm outline-none focus:border-[#064771] focus:ring-2 focus:ring-[#064771]/10 transition";

    return (
        <>
            <div className="flex flex-col w-full min-h-screen bg-white" style={{ fontFamily: 'Inter, sans-serif' }}>
                {/* Header Bar */}
                <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-5 py-2.5">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-medium text-gray-900">My Profile</h1>
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
                                {/* Profile Header */}
                                <div className="flex items-center gap-3">
                                    {/* Avatar — click to upload */}
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
                                                src={getAvatarUrl()!}
                                                alt={displayName}
                                                className="w-[52px] h-[52px] rounded-full object-cover ring-1 ring-gray-100"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                                }}
                                            />
                                        ) : null}
                                        <div className={`w-[52px] h-[52px] rounded-full bg-[#064771] flex items-center justify-center text-white text-xl font-medium ${getAvatarUrl() ? 'hidden' : ''}`}>
                                            {getInitials(displayName)}
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
                                            <span className="text-2xl font-medium text-black capitalize">{displayName}</span>
                                            {employee?.employee_id && (
                                                <span className="px-2 py-1 bg-[#F7FAFF] border border-[#E8F6FF] rounded text-[#064771] text-base font-medium">
                                                    {employee.employee_id}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[13px] font-medium text-gray-500">Member since {lastUpdated}</span>
                                    </div>
                                </div>

                                {/* Overview Stats Row */}
                                <div className="flex items-start gap-20">
                                    {employee?.country?.name && (
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-[11px] font-medium text-gray-400 uppercase">Nationality</span>
                                            <div className="flex items-center gap-2">
                                                {employee.country.svg_icon_url && (
                                                    <img src={employee.country.svg_icon_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                                                )}
                                                <span className="text-sm font-medium text-gray-900">{employee.country.name}</span>
                                            </div>
                                        </div>
                                    )}
                                    {employee?.gender && (
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-[11px] font-medium text-gray-400 uppercase">Gender</span>
                                            <span className="text-sm font-normal text-black">{employee.gender}</span>
                                        </div>
                                    )}
                                    {(employee?.department_data?.name || employee?.department?.name) && (
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-[11px] font-medium text-gray-400 uppercase">Department</span>
                                            <span className="text-sm font-normal text-black">{employee?.department_data?.name || employee?.department?.name}</span>
                                        </div>
                                    )}
                                    {(employee?.designation_data?.title || employee?.designation?.designation_name) && (
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-[11px] font-medium text-gray-400 uppercase">Designation</span>
                                            <span className="text-sm font-normal text-black">{employee?.designation_data?.title || employee?.designation?.designation_name}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Contact Information Section */}
                        <section className="space-y-7">
                            <h2 className="text-base font-medium text-gray-500 capitalize">Contact Information</h2>
                            <div className="h-px bg-[#E5E7EB]" />

                            <div className="flex gap-4">
                                {/* Work Email Card */}
                                <div className="flex-1 max-w-[403px] p-3 bg-[rgba(249,250,251,0.5)] border border-[#F3F4F6] rounded">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center">
                                            <Mail className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-medium text-gray-400">Work Email</span>
                                            <span className="text-base font-medium text-gray-900">{employee?.work_email || user?.email || 'Not set'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Contact Number Card */}
                                {employee?.contact_number && (
                                    <div className="flex-1 max-w-[403px] p-3 bg-[rgba(249,250,251,0.5)] border border-[#F3F4F6] rounded">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center">
                                                <Phone className="w-5 h-5 text-gray-400" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-medium text-gray-400">Contact Number</span>
                                                <span className="text-base font-medium text-gray-900">{employee.contact_number}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* System Access Section */}
                        <section className="space-y-7">
                            <h2 className="text-base font-medium text-gray-500 capitalize">System Access</h2>
                            <div className="h-px bg-[#E5E7EB]" />

                            <div className="flex flex-wrap items-start gap-x-24 gap-y-6">
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-[11px] font-medium text-gray-400 uppercase">Login Email</span>
                                    <span className="text-sm font-medium text-gray-900">{user?.email || 'Not set'}</span>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <span className="text-[11px] font-medium text-gray-400 uppercase">Account Created</span>
                                    <span className="text-sm font-normal text-black">{formatDate(employee?.user?.created_at)}</span>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <span className="text-[11px] font-medium text-gray-400 uppercase">Account Status</span>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium w-fit bg-emerald-50 text-emerald-700 border border-emerald-100`}>
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        ACTIVE
                                    </span>
                                </div>
                            </div>
                        </section>

                        {/* Organization Section */}
                        {(employee?.company_data?.name || employee?.branch_data?.name || employee?.team_data?.name) && (
                            <section className="space-y-7">
                                <h2 className="text-base font-medium text-gray-500 capitalize">Organization</h2>
                                <div className="h-px bg-[#E5E7EB]" />

                                <div className="flex flex-wrap items-start gap-x-24 gap-y-6">
                                    {employee?.company_data?.name && (
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-[11px] font-medium text-gray-400 uppercase">Company</span>
                                            <span className="text-sm font-normal text-black">{employee.company_data.name}</span>
                                        </div>
                                    )}
                                    {employee?.branch_data?.name && (
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-[11px] font-medium text-gray-400 uppercase">Branch</span>
                                            <span className="text-sm font-normal text-black">{employee.branch_data.name}</span>
                                        </div>
                                    )}
                                    {employee?.team_data?.name && (
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-[11px] font-medium text-gray-400 uppercase">Team</span>
                                            <span className="text-sm font-normal text-black">{employee.team_data.name}</span>
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}

                        {/* Change Password Section */}
                        <section className="space-y-7">
                            <h2 className="text-base font-medium text-gray-500 capitalize">Change Password</h2>
                            <div className="h-px bg-[#E5E7EB]" />

                            <form onSubmit={handleChangePassword} className="max-w-md space-y-4">
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-gray-700">Current Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className={inputClass}
                                        style={{ fontFamily: 'inherit' }}
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-gray-700">New Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className={inputClass}
                                        style={{ fontFamily: 'inherit' }}
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-gray-700">Confirm New Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className={inputClass}
                                        style={{ fontFamily: 'inherit' }}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="h-9 px-5 rounded-[3px] text-sm font-medium text-white flex items-center gap-2 transition-colors"
                                    style={{
                                        backgroundColor: saving ? '#9ab3c7' : '#064771',
                                        cursor: saving ? 'not-allowed' : 'pointer',
                                        border: 'none',
                                    }}
                                >
                                    {saving && <Loader size={14} className="animate-spin" />}
                                    {saving ? 'Saving…' : 'Update Password'}
                                </button>
                            </form>
                        </section>
                    </div>

                    {/* Right Column - Sidebar */}
                    <div className="w-[287px] shrink-0 space-y-10">
                        {/* Permission Level */}
                        <div className="space-y-3">
                            <h3 className="text-base font-medium text-gray-500 capitalize">Permission Level</h3>
                            <div className="flex items-center gap-3.5">
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${isAdmin ? 'bg-amber-100' : 'bg-[#064771]'}`}>
                                    {isAdmin
                                        ? <ShieldCheck className="w-4 h-4 text-amber-700" />
                                        : <Shield className="w-4 h-4 text-white" />
                                    }
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-base font-normal text-black">{roleLabel}</span>
                                    <span className="text-xs text-gray-400">
                                        {isAdmin ? 'Full system access' : 'Standard access'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Employee ID */}
                        {employee?.employee_id && (
                            <div className="space-y-3">
                                <h3 className="text-base font-medium text-gray-500 capitalize">Employee ID</h3>
                                <span className="inline-flex px-3 py-1.5 bg-[#F7FAFF] border border-[#E8F6FF] rounded text-base font-medium text-[#064771] font-mono">
                                    {employee.employee_id}
                                </span>
                            </div>
                        )}

                        {/* Status */}
                        <div className="space-y-3">
                            <h3 className="text-base font-medium text-gray-500 capitalize">Account Status</h3>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Active
                            </span>
                        </div>

                        {/* Member Since */}
                        <div className="space-y-3">
                            <h3 className="text-base font-medium text-gray-500 capitalize">Member Since</h3>
                            <span className="text-base font-normal text-black">
                                {formatDate(employee?.joining_date || employee?.user?.created_at)}
                            </span>
                        </div>

                        {/* Security Info */}
                        <div className="space-y-3 pt-2 border-t border-gray-100">
                            <h3 className="text-base font-medium text-gray-500 capitalize">Security</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Key className="w-4 h-4 text-[#064771]" />
                                <span>Password can be changed from the left panel</span>
                            </div>
                        </div>
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

export default MyProfile;
