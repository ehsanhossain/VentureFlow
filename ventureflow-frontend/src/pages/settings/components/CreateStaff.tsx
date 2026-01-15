import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Upload, Camera, X, RefreshCw, Eye, EyeOff, Shield, ShieldCheck, Check, Mail, User } from 'lucide-react';
import api from '../../../config/api';
import { showAlert } from '../../../components/Alert';

interface Country {
    id: number;
    name: string;
    alpha_2_code: string;
    svg_icon_url?: string;
}

const CreateStaff: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = Boolean(id);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [countries, setCountries] = useState<Country[]>([]);

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        gender: '',
        employee_id: '',
        nationality: '',
        work_email: '',
        contact_number: '',
        login_email: '',
        password: '',
        role: 'Staff',
    });

    const baseURL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        fetchCountries();
        if (isEditing && id) {
            fetchStaffMember(id);
        } else {
            generateEmployeeId();
            generatePassword();
        }
    }, [id, isEditing]);

    const fetchCountries = async () => {
        try {
            const res = await api.get('/api/countries');
            setCountries(res.data || []);
        } catch (error) {
            console.error('Failed to fetch countries:', error);
        }
    };

    const fetchStaffMember = async (staffId: string) => {
        setIsFetching(true);
        try {
            const res = await api.get(`/api/employees/${staffId}`);
            const staff = res.data;
            setFormData({
                first_name: staff.first_name || '',
                last_name: staff.last_name || '',
                gender: staff.gender || '',
                employee_id: staff.employee_id || '',
                nationality: staff.nationality?.toString() || '',
                work_email: staff.work_email || '',
                contact_number: staff.contact_number || '',
                login_email: staff.user?.email || staff.work_email || '',
                password: '',
                role: staff.user?.roles?.[0]?.name || 'Staff',
            });
            if (staff.image) {
                setAvatarPreview(`${baseURL}/storage/${staff.image}`);
            }
        } catch (error) {
            console.error('Failed to fetch staff member:', error);
            showAlert({ type: 'error', message: 'Failed to load staff member' });
        } finally {
            setIsFetching(false);
        }
    };

    const generatePassword = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
        let password = '';
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setFormData(prev => ({ ...prev, password }));
    };

    const generateEmployeeId = () => {
        const prefix = 'VF';
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
        setFormData(prev => ({ ...prev, employee_id: `${prefix}${timestamp}${random}` }));
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 1024 * 1024) {
                showAlert({ type: 'error', message: 'File size must be less than 1MB' });
                return;
            }
            if (!['image/jpeg', 'image/png'].includes(file.type)) {
                showAlert({ type: 'error', message: 'Only JPEG and PNG files are allowed' });
                return;
            }
            setAvatarFile(file);
            const reader = new FileReader();
            reader.onload = (event) => {
                setAvatarPreview(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeAvatar = () => {
        setAvatarPreview(null);
        setAvatarFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const submitData = new FormData();
            submitData.append('first_name', formData.first_name);
            submitData.append('last_name', formData.last_name);
            submitData.append('gender', formData.gender);
            submitData.append('employee_id', formData.employee_id);
            submitData.append('nationality', formData.nationality);
            submitData.append('work_email', formData.work_email);
            submitData.append('contact_number', formData.contact_number);
            submitData.append('login_email', formData.login_email || formData.work_email);
            submitData.append('role', formData.role);
            submitData.append('type', 'employee');

            if (formData.password) {
                submitData.append('password', formData.password);
            }

            if (isEditing && id) {
                submitData.append('id', id);
            }

            if (avatarFile) {
                submitData.append('image', avatarFile);
            }

            await api.post('/api/employees', submitData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            showAlert({
                type: 'success',
                message: isEditing ? 'Staff member updated successfully' : 'Staff member created successfully'
            });

            navigate('/settings/staff');
        } catch (error: any) {
            console.error('Failed to save staff:', error);
            showAlert({
                type: 'error',
                message: error.response?.data?.message || error.response?.data?.error || 'Failed to save staff member'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (field: string, value: string) => {
        setFormData(prev => {
            const newData = { ...prev, [field]: value };
            // Sync login_email with work_email if not editing
            if (field === 'work_email' && !isEditing) {
                newData.login_email = value;
            }
            return newData;
        });
    };

    if (isFetching) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#064771]"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8F9FB]">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 px-6 py-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/settings/staff')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">
                            {isEditing ? 'Edit Staff Member' : 'Create New Staff Member'}
                        </h1>
                        <p className="text-sm text-gray-500">
                            {isEditing ? 'Update staff information and access settings' : 'Add a new team member to your organization'}
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="max-w-6xl mx-auto p-6">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 md:p-8">
                        <div className="flex flex-col lg:flex-row gap-8">
                            {/* Avatar Section */}
                            <div className="flex flex-col items-center gap-4 lg:w-[180px] flex-shrink-0">
                                <div
                                    onClick={handleAvatarClick}
                                    className="relative w-32 h-32 rounded-full border-2 border-dashed border-[#064771]/30 bg-[#F0F8FF] flex items-center justify-center cursor-pointer hover:border-[#064771]/60 hover:bg-[#E6F4FF] transition-all group"
                                >
                                    {avatarPreview ? (
                                        <>
                                            <img
                                                src={avatarPreview}
                                                alt="Avatar"
                                                className="w-full h-full rounded-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Camera className="w-6 h-6 text-white" />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); removeAvatar(); }}
                                                className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center text-[#064771]">
                                            <User className="w-10 h-10 mb-1 opacity-50" />
                                            <span className="text-xs font-medium">Upload Profile</span>
                                            <span className="text-xs font-medium">Picture</span>
                                        </div>
                                    )}
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <div className="text-center text-xs text-gray-400">
                                    <p>Acceptable file</p>
                                    <p>types: <span className="text-[#064771] font-medium">JPEG & PNG</span></p>
                                    <p>Maximum</p>
                                    <p>file Size: <span className="text-[#064771] font-medium">1 MB</span></p>
                                </div>
                            </div>

                            {/* Form Fields */}
                            <div className="flex-1 space-y-6">
                                {/* Personal Information */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            <span className="text-red-500">*</span> First Name
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.first_name}
                                            onChange={(e) => handleChange('first_name', e.target.value)}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#064771]/20 focus:border-[#064771] transition-all"
                                            placeholder="Enter first name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            <span className="text-red-500">*</span> Last Name
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.last_name}
                                            onChange={(e) => handleChange('last_name', e.target.value)}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#064771]/20 focus:border-[#064771] transition-all"
                                            placeholder="Enter last name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Gender</label>
                                        <select
                                            value={formData.gender}
                                            onChange={(e) => handleChange('gender', e.target.value)}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#064771]/20 focus:border-[#064771] transition-all bg-white"
                                        >
                                            <option value="">Select</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            <span className="text-red-500">*</span> Employee ID
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                required
                                                value={formData.employee_id}
                                                onChange={(e) => handleChange('employee_id', e.target.value)}
                                                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#064771]/20 focus:border-[#064771] transition-all"
                                                placeholder="VF123456"
                                            />
                                            <button
                                                type="button"
                                                onClick={generateEmployeeId}
                                                className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                                title="Generate ID"
                                            >
                                                <RefreshCw className="w-4 h-4 text-gray-600" />
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Nationality</label>
                                        <select
                                            value={formData.nationality}
                                            onChange={(e) => handleChange('nationality', e.target.value)}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#064771]/20 focus:border-[#064771] transition-all bg-white"
                                        >
                                            <option value="">Select Nationality</option>
                                            {countries.map(country => (
                                                <option key={country.id} value={country.id}>
                                                    {country.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact Number</label>
                                        <input
                                            type="text"
                                            value={formData.contact_number}
                                            onChange={(e) => handleChange('contact_number', e.target.value)}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#064771]/20 focus:border-[#064771] transition-all"
                                            placeholder="e.g., +66 081 091 87"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            <span className="text-red-500">*</span> Work Email
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="email"
                                                required
                                                value={formData.work_email}
                                                onChange={(e) => handleChange('work_email', e.target.value)}
                                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#064771]/20 focus:border-[#064771] transition-all"
                                                placeholder="name@company.com"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* User Login & Permission Section */}
                                <div className="pt-4 border-t border-gray-100">
                                    <h3 className="text-sm font-bold text-gray-900 mb-4">User Login & Permission</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                <span className="text-red-500">*</span> System Login ID
                                            </label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input
                                                    type="email"
                                                    required
                                                    value={formData.login_email}
                                                    onChange={(e) => handleChange('login_email', e.target.value)}
                                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#064771]/20 focus:border-[#064771] transition-all"
                                                    placeholder="employee's email to login"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                <span className="text-red-500">*</span> Password
                                            </label>
                                            <div className="relative flex gap-2">
                                                <div className="relative flex-1">
                                                    <input
                                                        type={showPassword ? 'text' : 'password'}
                                                        required={!isEditing}
                                                        value={formData.password}
                                                        onChange={(e) => handleChange('password', e.target.value)}
                                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#064771]/20 focus:border-[#064771] transition-all pr-12"
                                                        placeholder={isEditing ? 'Leave empty to keep current' : '••••••••••••'}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                    >
                                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={generatePassword}
                                                    className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                                    title="Generate Password"
                                                >
                                                    <RefreshCw className="w-4 h-4 text-gray-600" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Role Selection */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-3">
                                            <span className="text-red-500">*</span> System-wide Permission
                                        </label>
                                        <div className="flex flex-wrap gap-3">
                                            <button
                                                type="button"
                                                onClick={() => handleChange('role', 'Staff')}
                                                className={`flex items-center gap-2 px-4 py-2.5 rounded-full border-2 transition-all ${formData.role === 'Staff'
                                                        ? 'border-[#064771] bg-[#E6F4FF] text-[#064771]'
                                                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                                    }`}
                                            >
                                                {formData.role === 'Staff' && <Check className="w-4 h-4" />}
                                                <Shield className="w-4 h-4" />
                                                <span className="text-sm font-medium">Staff</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleChange('role', 'System Admin')}
                                                className={`flex items-center gap-2 px-4 py-2.5 rounded-full border-2 transition-all ${formData.role === 'System Admin'
                                                        ? 'border-amber-400 bg-amber-50 text-amber-700'
                                                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                                    }`}
                                            >
                                                {formData.role === 'System Admin' && <Check className="w-4 h-4" />}
                                                <ShieldCheck className="w-4 h-4" />
                                                <span className="text-sm font-medium">System Admin</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="px-6 md:px-8 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/settings/staff')}
                            className="flex items-center gap-2 px-5 py-2.5 text-red-600 font-medium rounded-full border border-red-200 hover:bg-red-50 transition-colors"
                        >
                            <X className="w-4 h-4" />
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex items-center gap-2 px-5 py-2.5 bg-[#064771] hover:bg-[#053a5e] text-white font-medium rounded-full transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Check className="w-4 h-4" />
                            )}
                            {isEditing ? 'Update' : 'Create'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default CreateStaff;
