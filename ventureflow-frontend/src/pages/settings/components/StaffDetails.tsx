/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Mail, Phone, Shield, ShieldCheck, User } from 'lucide-react';
import { BrandSpinner } from '../../../components/BrandSpinner';
import api from '../../../config/api';
import { showAlert } from '../../../components/Alert';

interface StaffMember {
    id: number;
    first_name: string;
    last_name: string;
    employee_id: string;
    gender?: string;
    nationality?: number;
    employee_status?: string;
    joining_date?: string;
    dob?: string;
    work_email?: string;
    contact_number?: string;
    image?: string;
    created_at?: string;
    updated_at?: string;
    user?: {
        id: number;
        name: string;
        email: string;
        created_at?: string;
        roles?: { name: string }[];
    };
    country?: { name: string; svg_icon_url?: string };
    company_data?: { name: string };
    department_data?: { name: string };
    branch_data?: { name: string };
    team_data?: { name: string };
    designation_data?: { title: string };
}

const StaffDetails: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [staff, setStaff] = useState<StaffMember | null>(null);
    const [loading, setLoading] = useState(true);

    const baseURL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        if (id) {
            fetchStaff(id);
        }
    }, [id]);

    const fetchStaff = async (staffId: string) => {
        setLoading(true);
        try {
            const res = await api.get(`/api/employees/${staffId}`);
            setStaff(res.data);
        } catch (error) {
            console.error('Failed to fetch staff:', error);
            showAlert({ type: 'error', message: 'Failed to load staff member' });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <BrandSpinner size="lg" />
            </div>
        );
    }

    if (!staff) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500">
                <p>Staff member not found</p>
                <button
                    onClick={() => navigate('/settings/staff')}
                    className="mt-4 text-[#064771] hover:underline"
                >
                    Back to Staff List
                </button>
            </div>
        );
    }

    const fullName = `${staff.first_name} ${staff.last_name}`;
    const role = staff.user?.roles?.[0]?.name || 'Staff';
    const isAdmin = role === 'System Admin';
    const lastUpdated = staff.updated_at
        ? new Date(staff.updated_at).toLocaleDateString()
        : new Date().toLocaleDateString();

    const getInitials = (name: string) => {
        if (!name) return 'NA';
        const parts = name.split(' ').filter(Boolean);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const getAvatarUrl = () => {
        if (staff.image) {
            return staff.image.startsWith('http')
                ? staff.image
                : `${baseURL}/storage/${staff.image}`;
        }
        return '';
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'Not set';
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="flex flex-col w-full min-h-screen bg-white" style={{ fontFamily: 'Inter, sans-serif' }}>
            {/* Header Bar */}
            <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-5 py-2.5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* Back Button */}
                        <button
                            onClick={() => navigate('/settings/staff')}
                            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#064771] text-white rounded text-sm font-semibold hover:bg-[#053a5c] transition-colors"
                        >
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5.57501 13.4297H11.1921C13.1329 13.4297 14.7085 11.8542 14.7085 9.91335C14.7085 7.97249 13.1329 6.39697 11.1921 6.39697H3.46289" stroke="white" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M5.08346 8.1666L3.29102 6.36276L5.08346 4.57031" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Back
                        </button>

                        {/* Page Title */}
                        <h1 className="text-2xl font-medium text-gray-900">Staff Profile</h1>
                    </div>

                    {/* Edit Button - Secondary Style */}
                    <button
                        onClick={() => navigate(`/settings/staff/edit/${id}`)}
                        className="flex items-center gap-2 px-3 py-2 bg-white border border-[#E5E7EB] rounded text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        Edit Staff
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
                            {/* Staff Header */}
                            <div className="flex items-center gap-3">
                                {/* Staff Avatar */}
                                {getAvatarUrl() ? (
                                    <img
                                        src={getAvatarUrl()}
                                        alt={fullName}
                                        className="w-[52px] h-[52px] rounded-full object-cover ring-1 ring-gray-100"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                        }}
                                    />
                                ) : null}
                                <div className={`w-[52px] h-[52px] rounded-full bg-[#064771] flex items-center justify-center text-white text-xl font-medium ${getAvatarUrl() ? 'hidden' : ''}`}>
                                    {getInitials(fullName)}
                                </div>

                                <div className="flex flex-col justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl font-medium text-black capitalize">{fullName}</span>
                                        <span className="px-2 py-1 bg-[#F7FAFF] border border-[#E8F6FF] rounded text-[#064771] text-base font-medium">
                                            {staff.employee_id}
                                        </span>
                                    </div>
                                    <span className="text-[13px] font-medium text-gray-500">last Updated {lastUpdated}</span>
                                </div>
                            </div>

                            {/* Overview Stats Row */}
                            <div className="flex items-start gap-20">
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-[11px] font-medium text-gray-400 uppercase">Nationality</span>
                                    <div className="flex items-center gap-2">
                                        {staff.country?.svg_icon_url && (
                                            <img src={staff.country.svg_icon_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                                        )}
                                        <span className="text-sm font-medium text-gray-900">{staff.country?.name || 'N/A'}</span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <span className="text-[11px] font-medium text-gray-400 uppercase">Gender</span>
                                    <span className="text-sm font-normal text-black">{staff.gender || 'N/A'}</span>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <span className="text-[11px] font-medium text-gray-400 uppercase">Department</span>
                                    <span className="text-sm font-normal text-black">{staff.department_data?.name || 'N/A'}</span>
                                </div>

                                {staff.designation_data?.title && (
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-[11px] font-medium text-gray-400 uppercase">Designation</span>
                                        <span className="text-sm font-normal text-black">{staff.designation_data.title}</span>
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
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center">
                                            <Mail className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-medium text-gray-400">Work Email</span>
                                            <span className="text-base font-medium text-gray-900">{staff.work_email || 'Not set'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Number Card */}
                            <div className="flex-1 max-w-[403px] p-3 bg-[rgba(249,250,251,0.5)] border border-[#F3F4F6] rounded">
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center">
                                            <Phone className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-medium text-gray-400">Contact Number</span>
                                            <span className="text-base font-medium text-gray-900">{staff.contact_number || 'Not set'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* System Access Section */}
                    <section className="space-y-7">
                        <h2 className="text-base font-medium text-gray-500 capitalize">System Access</h2>
                        <div className="h-px bg-[#E5E7EB]" />

                        <div className="flex flex-wrap items-start gap-x-24 gap-y-6">
                            <div className="flex flex-col gap-1.5">
                                <span className="text-[11px] font-medium text-gray-400 uppercase">Login Email</span>
                                <span className="text-sm font-medium text-gray-900">{staff.user?.email || 'Not set'}</span>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <span className="text-[11px] font-medium text-gray-400 uppercase">Account Created</span>
                                <span className="text-sm font-normal text-black">{formatDate(staff.user?.created_at)}</span>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <span className="text-[11px] font-medium text-gray-400 uppercase">Account Status</span>
                                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-medium w-fit ${staff.employee_status === 'active'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                                    }`}>
                                    {(staff.employee_status || 'Active').toUpperCase()}
                                </span>
                            </div>
                        </div>
                    </section>

                    {/* Organization Section */}
                    {(staff.company_data?.name || staff.branch_data?.name || staff.team_data?.name) && (
                        <section className="space-y-7">
                            <h2 className="text-base font-medium text-gray-500 capitalize">Organization</h2>
                            <div className="h-px bg-[#E5E7EB]" />

                            <div className="flex flex-wrap items-start gap-x-24 gap-y-6">
                                {staff.company_data?.name && (
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-[11px] font-medium text-gray-400 uppercase">Company</span>
                                        <span className="text-sm font-normal text-black">{staff.company_data.name}</span>
                                    </div>
                                )}
                                {staff.branch_data?.name && (
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-[11px] font-medium text-gray-400 uppercase">Branch</span>
                                        <span className="text-sm font-normal text-black">{staff.branch_data.name}</span>
                                    </div>
                                )}
                                {staff.team_data?.name && (
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-[11px] font-medium text-gray-400 uppercase">Team</span>
                                        <span className="text-sm font-normal text-black">{staff.team_data.name}</span>
                                    </div>
                                )}
                            </div>
                        </section>
                    )}
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
                                <span className="text-base font-normal text-black">{role}</span>
                                <span className="text-xs text-gray-400">
                                    {isAdmin ? 'Full system access' : 'Standard access'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Employee ID */}
                    <div className="space-y-3">
                        <h3 className="text-base font-medium text-gray-500 capitalize">Employee ID</h3>
                        <span className="inline-flex px-3 py-1.5 bg-[#F7FAFF] border border-[#E8F6FF] rounded text-base font-medium text-[#064771] font-mono">
                            {staff.employee_id}
                        </span>
                    </div>

                    {/* Status */}
                    <div className="space-y-3">
                        <h3 className="text-base font-medium text-gray-500 capitalize">Account Status</h3>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${staff.employee_status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : staff.employee_status === 'inactive'
                                ? 'bg-red-50 text-red-600 border border-red-100'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${staff.employee_status === 'inactive' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                            {(staff.employee_status || 'Active').charAt(0).toUpperCase() + (staff.employee_status || 'active').slice(1)}
                        </span>
                    </div>

                    {/* Joined Date */}
                    <div className="space-y-3">
                        <h3 className="text-base font-medium text-gray-500 capitalize">Member Since</h3>
                        <span className="text-base font-normal text-black">
                            {formatDate(staff.joining_date || staff.user?.created_at)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StaffDetails;
