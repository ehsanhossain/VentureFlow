/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 *
 * MyProfile — role-aware profile page for Staff and System Admin users.
 * Partners use /settings/profile (PartnerProfile) instead.
 */

import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../routes/AuthContext';
import api from '../../config/api';
import { showAlert } from '../../components/Alert';
import { User, Mail, Shield, Key, CheckCircle, Loader } from 'lucide-react';

interface Employee {
    id: number;
    first_name: string;
    last_name: string;
    designation?: { designation_name?: string };
    department?: { name?: string };
    image?: string;
}

const MyProfile: React.FC = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('AuthContext missing');
    const { user, role } = context;

    const [employee, setEmployee] = useState<Employee | null>(null);
    const [loading, setLoading] = useState(true);

    // Change password state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [saving, setSaving] = useState(false);
    const [pwChanged, setPwChanged] = useState(false);

    const baseURL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        api.get('/api/user')
            .then((res) => {
                setEmployee(res.data.employee || null);
            })
            .catch(() => setEmployee(null))
            .finally(() => setLoading(false));
    }, []);

    const avatarUrl = employee?.image
        ? `${baseURL}/storage/${employee.image}`
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=064771&color=fff&size=128`;

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
            setPwChanged(true);
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
            <div className="flex items-center justify-center h-64">
                <Loader className="animate-spin text-[#064771]" size={32} />
            </div>
        );
    }

    const displayName = employee
        ? `${employee.first_name} ${employee.last_name}`
        : user?.name || 'User';

    const designation = employee?.designation?.designation_name;
    const department = employee?.department?.name;

    const roleLabel = role === 'System Admin' ? 'System Administrator' : role || 'Staff';
    const roleBadgeColor = role === 'System Admin' ? 'bg-blue-100 text-blue-800' : 'bg-indigo-100 text-indigo-700';

    return (
        <div
            className="min-h-screen bg-[#F8F8F8] py-10 px-4"
            style={{ fontFamily: 'Inter, sans-serif' }}
        >
            <div className="max-w-2xl mx-auto flex flex-col gap-6">

                {/* Profile Card */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    {/* Banner */}
                    <div className="h-28 bg-gradient-to-r from-[#064771] to-[#0a6aac]" />

                    <div className="px-6 pb-6 -mt-12 flex flex-col gap-3">
                        {/* Avatar */}
                        <div className="flex items-end justify-between">
                            <img
                                src={avatarUrl}
                                alt={displayName}
                                className="w-24 h-24 rounded-full border-4 border-white object-cover shadow"
                            />
                            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${roleBadgeColor}`}>
                                {roleLabel}
                            </span>
                        </div>

                        {/* Name + meta */}
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">{displayName}</h1>
                            {designation && (
                                <p className="text-sm text-gray-500 mt-0.5">{designation}</p>
                            )}
                            {department && (
                                <p className="text-xs text-gray-400">{department}</p>
                            )}
                        </div>

                        {/* Info rows */}
                        <div className="mt-2 flex flex-col gap-2">
                            {user?.email && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Mail size={15} className="text-[#064771]" />
                                    {user.email}
                                </div>
                            )}
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <User size={15} className="text-[#064771]" />
                                {user?.name}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Shield size={15} className="text-[#064771]" />
                                {roleLabel}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Change Password Card */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-5">
                        <Key size={18} className="text-[#064771]" />
                        <h2 className="text-base font-semibold text-gray-800">Change Password</h2>
                    </div>

                    {pwChanged ? (
                        <div className="flex items-center gap-3 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                            <CheckCircle size={20} />
                            <p className="text-sm font-medium">Password changed successfully.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
                            {[
                                { label: 'Current Password', value: currentPassword, onChange: setCurrentPassword },
                                { label: 'New Password', value: newPassword, onChange: setNewPassword },
                                { label: 'Confirm New Password', value: confirmPassword, onChange: setConfirmPassword },
                            ].map(({ label, value, onChange }) => (
                                <div key={label} className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-gray-700">{label}</label>
                                    <input
                                        type="password"
                                        required
                                        value={value}
                                        onChange={(e) => onChange(e.target.value)}
                                        className="h-10 px-3 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#064771] focus:ring-2 focus:ring-[#064771]/10 transition"
                                        style={{ fontFamily: 'inherit' }}
                                    />
                                </div>
                            ))}

                            <button
                                type="submit"
                                disabled={saving}
                                className="self-start h-10 px-6 rounded-lg text-sm font-medium text-white flex items-center gap-2 transition"
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
                    )}
                </div>

            </div>
        </div>
    );
};

export default MyProfile;
