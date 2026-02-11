import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Mail, Phone, Shield, ShieldCheck, Edit2 } from 'lucide-react';
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
            <div className="flex items-center justify-center h-full">
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

    const getAvatarUrl = () => {
        if (staff.image) {
            return staff.image.startsWith('http')
                ? staff.image
                : `${baseURL}/storage/${staff.image}`;
        }
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=064771&color=fff&size=200`;
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
        <div className="min-h-screen bg-[#F8F9FB] font-inter">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-10">
                <div className="flex items-center justify-between max-w-6xl mx-auto">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/settings/staff')}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <div>
                            <h1 className="text-xl font-medium text-gray-900">Staff Member Details</h1>
                            <p className="text-sm text-gray-500">View staff information and access settings</p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate(`/settings/staff/edit/${id}`)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#064771] text-white rounded-lg hover:bg-[#053a5c] transition-all text-sm font-medium"
                    >
                        <Edit2 className="w-4 h-4" />
                        Edit Member
                    </button>
                </div>
            </div>

            <div className="max-w-6xl mx-auto p-6">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    {/* Profile Header */}
                    <div className="bg-gradient-to-r from-[#064771] to-[#0a6da8] p-8">
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                            <img
                                src={getAvatarUrl()}
                                alt={fullName}
                                className="w-28 h-28 rounded-full object-cover ring-4 ring-white/20 shadow-xl"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=064771&color=fff&size=200`;
                                }}
                            />
                            <div className="text-center md:text-left">
                                <h2 className="text-2xl font-semibold text-white">{fullName}</h2>
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-2">
                                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white border border-white/30">
                                        {staff.employee_id}
                                    </span>
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${isAdmin
                                        ? 'bg-amber-400/20 text-amber-100 border border-amber-400/30'
                                        : 'bg-blue-400/20 text-blue-100 border border-blue-400/30'
                                        }`}>
                                        {isAdmin ? <ShieldCheck className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                                        {role}
                                    </span>
                                    {staff.designation_data?.title && (
                                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white/90">
                                            {staff.designation_data.title}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="p-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Personal Information */}
                            <div className="space-y-6">
                                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">
                                    Personal Information
                                </h3>
                                <div className="space-y-4">
                                    <InfoRow
                                        icon={<Mail className="w-4 h-4" />}
                                        label="Work Email"
                                        value={staff.work_email}
                                    />
                                    <InfoRow
                                        icon={<Phone className="w-4 h-4" />}
                                        label="Contact Number"
                                        value={staff.contact_number}
                                    />
                                    <InfoRow
                                        label="Nationality"
                                        value={staff.country?.name}
                                        flag={staff.country?.svg_icon_url}
                                    />
                                    <InfoRow
                                        label="Gender"
                                        value={staff.gender}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* System Access */}
                        <div className="mt-8 pt-8 border-t border-gray-100">
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                                System Access
                            </h3>
                            <div className="bg-gray-50 rounded-xl p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Login Email</p>
                                        <p className="text-sm font-medium text-gray-900">{staff.user?.email || 'Not set'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Account Created</p>
                                        <p className="text-sm font-medium text-gray-900">{formatDate(staff.user?.created_at)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Status</p>
                                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-medium ${staff.employee_status === 'active'
                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                            : 'bg-gray-100 text-gray-600 border border-gray-200'
                                            }`}>
                                            {(staff.employee_status || 'Active').toUpperCase()}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Permission Level</p>
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium ${isAdmin
                                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                                            }`}>
                                            {isAdmin ? <ShieldCheck className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                                            {role}
                                        </span>
                                    </div>
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
    flag?: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value, flag }) => (
    <div className="flex items-start gap-3">
        {icon && (
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 flex-shrink-0">
                {icon}
            </div>
        )}
        <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 mb-0.5">{label}</p>
            <div className="flex items-center gap-2">
                {flag && <img src={flag} alt="" className="w-4 h-3 object-cover rounded-sm" />}
                <p className="text-sm font-medium text-gray-900 truncate">{value || 'Not set'}</p>
            </div>
        </div>
    </div>
);

export default StaffDetails;
