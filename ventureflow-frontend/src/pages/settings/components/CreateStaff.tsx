/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, AlertCircle, Loader2, Eye, EyeOff, RefreshCw, Shield, ShieldCheck, ArrowLeft } from 'lucide-react';
import api from '../../../config/api';
import { showAlert } from '../../../components/Alert';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { BrandSpinner } from '../../../components/BrandSpinner';
import { LogoUpload } from '../../../components/LogoUpload';
import { Country, Dropdown } from '../../prospects/components/Dropdown';

// Types
interface FormValues {
    firstName: string;
    lastName: string;
    gender: string;
    employeeId: string;
    nationality: Country | null;
    contactNumber: string;
    workEmail: string;
    loginEmail: string;
    password: string;
    role: 'Staff' | 'System Admin';
}

/* ─── tiny reusable label ─── */
const FieldLabel: React.FC<{ text: string; required?: boolean }> = ({ text, required }) => (
    <label className="flex items-center gap-1 mb-2 text-base font-medium text-gray-900  leading-5">
        {required && <span className="text-rose-600 text-base font-medium">*</span>}
        {text}
    </label>
);

/* ─── section header with divider ─── */
const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
    <div className="flex flex-col gap-3 mb-5">
        <h3 className="text-base font-medium text-black  capitalize">{title}</h3>
        <div className="w-full h-px bg-gray-200" />
    </div>
);

const CreateStaff: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    const [countries, setCountries] = useState<Country[]>([]);
    const [isIdAvailable, setIsIdAvailable] = useState<boolean | null>(null);
    const [isCheckingId, setIsCheckingId] = useState(false);
    const [profileImage, setProfileImage] = useState<File | null>(null);
    const [initialProfileImage, setInitialProfileImage] = useState<string | undefined>(undefined);
    const [isLoadingData, setIsLoadingData] = useState(!!id);
    const [showPassword, setShowPassword] = useState(false);
    const [emailError, setEmailError] = useState<string | null>(null);

    const baseURL = import.meta.env.VITE_API_BASE_URL;

    const { control, handleSubmit, setValue, register, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
        defaultValues: {
            firstName: '',
            lastName: '',
            gender: '',
            employeeId: '',
            nationality: null,
            contactNumber: '',
            workEmail: '',
            loginEmail: '',
            password: '',
            role: 'Staff',
        },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const watchedRole = watch('role');
    const watchedWorkEmail = watch('workEmail');

    // Auto-sync login email with work email when creating new
    useEffect(() => {
        if (!id) {
            setValue('loginEmail', watchedWorkEmail);
        }
    }, [watchedWorkEmail, id, setValue]);

    // Fetch countries
    useEffect(() => {
        const fetchCountries = async () => {
            try {
                const response = await api.get('/api/countries');
                const data = Array.isArray(response.data) ? response.data : (response.data?.data || []);
                setCountries(data.map((c: any) => ({
                    id: c.id,
                    name: c.name,
                    flagSrc: c.svg_icon_url,
                    status: 'registered' as const,
                    is_region: c.is_region || false,
                })));
            } catch (error) {
                console.error('Failed to fetch countries:', error);
            }
        };
        fetchCountries();
    }, []);

    // Generate ID & password for new staff
    useEffect(() => {
        if (!id) {
            generateId();
            generatePassword();
        }
    }, [id]);

    // Fetch staff data for editing
    useEffect(() => {
        if (id) {
            fetchStaff();
        }
    }, [id]);

    const generateId = () => {
        const prefix = 'VF';
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
        setValue('employeeId', `${prefix}${timestamp}${random}`);
        setIsIdAvailable(null);
    };

    const generatePassword = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
        let password = '';
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setValue('password', password);
    };

    // Check ID Availability
    const checkIdAvailability = async (code: string) => {
        if (!code || code.length < 3) {
            setIsIdAvailable(null);
            return;
        }
        setIsCheckingId(true);
        try {
            const res = await api.get(`/api/employees?search=${encodeURIComponent(code)}`);
            const employees = res.data?.data || [];
            const exists = employees.some((emp: any) =>
                emp.employee_id?.toLowerCase() === code.toLowerCase() &&
                (!id || emp.id?.toString() !== id)
            );
            setIsIdAvailable(!exists);
        } catch {
            setIsIdAvailable(null);
        } finally {
            setIsCheckingId(false);
        }
    };

    const fetchStaff = async () => {
        setIsLoadingData(true);
        try {
            const res = await api.get(`/api/employees/${id}`);
            const staff = res.data;

            setValue('firstName', staff.first_name || '');
            setValue('lastName', staff.last_name || '');
            setValue('gender', staff.gender || '');
            setValue('employeeId', staff.employee_id || '');
            setValue('contactNumber', staff.contact_number || '');
            setValue('workEmail', staff.work_email || '');
            setValue('loginEmail', staff.user?.email || staff.work_email || '');
            setValue('role', staff.user?.roles?.[0]?.name || 'Staff');

            // Set nationality
            if (staff.nationality) {
                const nationalityId = parseInt(staff.nationality);
                if (!isNaN(nationalityId)) {
                    const country = countries.find(c => c.id === nationalityId);
                    if (country) {
                        setValue('nationality', country);
                    }
                }
            }

            // Set profile image
            if (staff.image) {
                setInitialProfileImage(`${baseURL}/storage/${staff.image}`);
            }
        } catch (error) {
            console.error('Failed to fetch staff member:', error);
            showAlert({ type: 'error', message: 'Failed to load staff member' });
        } finally {
            setIsLoadingData(false);
        }
    };

    const onSubmit = async (data: FormValues) => {
        try {
            const submitData = new FormData();
            submitData.append('first_name', data.firstName);
            submitData.append('last_name', data.lastName);
            submitData.append('gender', data.gender);
            submitData.append('employee_id', data.employeeId);
            submitData.append('nationality', data.nationality?.id?.toString() || '');
            submitData.append('work_email', data.workEmail);
            submitData.append('contact_number', data.contactNumber);
            submitData.append('login_email', data.loginEmail || data.workEmail);
            submitData.append('role', data.role);
            submitData.append('type', 'employee');

            if (data.password) {
                submitData.append('password', data.password);
            }

            if (id) {
                submitData.append('id', id);
            }

            if (profileImage) {
                submitData.append('image', profileImage);
            }

            await api.post('/api/employees', submitData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            showAlert({
                type: 'success',
                message: id ? 'Staff member updated successfully' : 'Staff member created successfully'
            });

            navigate('/settings/staff');
        } catch (error: any) {
            console.error('Failed to save staff:', error);
            const msg = error.response?.data?.message || error.response?.data?.error || 'Failed to save staff member';
            const validationErrors = error.response?.data?.errors;

            // Check if this is a duplicate email error
            const emailErrors = validationErrors?.login_email || validationErrors?.work_email || validationErrors?.email;
            if (emailErrors) {
                const emailMsg = Array.isArray(emailErrors) ? emailErrors[0] : String(emailErrors);
                setEmailError(emailMsg);
                showAlert({ type: 'error', message: emailMsg });
            } else if (msg.toLowerCase().includes('email') || msg.toLowerCase().includes('already')) {
                setEmailError(msg);
                showAlert({ type: 'error', message: msg });
            } else if (validationErrors) {
                const firstError = Object.values(validationErrors).flat()[0];
                showAlert({ type: 'error', message: String(firstError) });
            } else {
                showAlert({ type: 'error', message: msg });
            }
        }
    };

    /* ─── shared input style ─── */
    const inputClass = "w-full h-11 px-3 py-2 bg-white rounded-[3px] border border-gray-300 text-sm font-normal  text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-300 transition-colors";

    if (isLoadingData) {
        return (
            <div className="flex flex-col h-full min-h-screen bg-white ">
                <div className="flex items-center gap-4 px-4 md:px-6 py-4 bg-white border-b">
                    <button
                        type="button"
                        className="flex items-center gap-2 px-4 py-2 rounded-[3px] bg-[#064771] hover:bg-[#053a5c] text-white text-sm font-medium transition-all active:scale-95"
                        onClick={() => navigate('/settings/staff')}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back</span>
                    </button>
                    <h1 className="text-xl md:text-2xl font-medium text-gray-900">
                        {id ? 'Edit Staff Member' : 'Create Staff Member'}
                    </h1>
                </div>
                <div className="flex-1 overflow-auto p-4 md:p-6 scrollbar-premium">
                    <div className="w-full pb-24 ">
                        <div className="max-w-[1197px] mx-auto flex flex-col gap-12 animate-pulse">
                            <div className="flex gap-8 items-start">
                                <div className="w-28 h-28 bg-gray-200 rounded-full" />
                                <div className="flex-1 flex flex-col gap-6">
                                    <div className="flex gap-6">
                                        <div className="flex-1 h-11 bg-gray-200 rounded" />
                                        <div className="flex-1 h-11 bg-gray-200 rounded" />
                                    </div>
                                    <div className="flex gap-6">
                                        <div className="flex-1 h-11 bg-gray-200 rounded" />
                                        <div className="flex-1 h-11 bg-gray-200 rounded" />
                                    </div>
                                </div>
                            </div>
                            <div className="h-px bg-gray-200" />
                            <div className="flex flex-col gap-6">
                                <div className="h-6 w-40 bg-gray-200 rounded" />
                                <div className="flex gap-6">
                                    <div className="flex-1 h-11 bg-gray-200 rounded" />
                                    <div className="flex-1 h-11 bg-gray-200 rounded" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full min-h-screen bg-white ">
            {/* Header */}
            <div className="flex items-center gap-4 px-4 md:px-6 py-4 bg-white border-b">
                <button
                    type="button"
                    className="flex items-center gap-2 px-4 py-2 rounded-[3px] bg-[#064771] hover:bg-[#053a5c] text-white text-sm font-medium transition-all active:scale-95"
                    onClick={() => navigate('/settings/staff')}
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                </button>
                <h1 className="text-xl md:text-2xl font-medium text-gray-900">
                    {id ? 'Edit Staff Member' : 'Create Staff Member'}
                </h1>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto p-4 md:p-6">
                <form onSubmit={handleSubmit(onSubmit)} className="w-full pb-24 ">
                    <div className="max-w-[1197px] mx-auto flex flex-col gap-12">

                        {/* ═══════════════════════════════════════════════
                    SECTION 1: PERSONAL INFORMATION
                ═══════════════════════════════════════════════ */}
                        <div className="flex flex-col gap-10">
                            <SectionHeader title="Personal Information" />

                            <div className="flex items-start gap-12">
                                {/* Profile Photo - LEFT side */}
                                <div className="flex flex-col items-center gap-3.5 shrink-0 w-36">
                                    <LogoUpload
                                        initialImage={initialProfileImage}
                                        onImageSelect={(file) => setProfileImage(file)}
                                    />
                                </div>

                                {/* Personal Fields - RIGHT side */}
                                <div className="flex-1 flex flex-col gap-10">
                                    {/* Row: First Name + Last Name */}
                                    <div className="flex gap-6">
                                        <div className="flex-1">
                                            <FieldLabel text="First Name" required />
                                            <input
                                                {...register('firstName', { required: true })}
                                                className={inputClass}
                                                placeholder="Enter first name"
                                            />
                                            {errors.firstName && <span className="text-red-500 text-xs mt-1">Required</span>}
                                        </div>
                                        <div className="flex-1">
                                            <FieldLabel text="Last Name" required />
                                            <input
                                                {...register('lastName', { required: true })}
                                                className={inputClass}
                                                placeholder="Enter last name"
                                            />
                                            {errors.lastName && <span className="text-red-500 text-xs mt-1">Required</span>}
                                        </div>
                                    </div>

                                    {/* Row: Employee ID + Gender */}
                                    <div className="flex gap-6">
                                        <div className="flex-1">
                                            <FieldLabel text="Employee ID" required />
                                            <div className="relative flex items-center gap-2">
                                                <div className="relative flex-1">
                                                    <input
                                                        {...register('employeeId', { required: true })}
                                                        className={`${inputClass} font-mono ${isIdAvailable === false ? 'border-red-500 bg-red-50' : isIdAvailable === true ? 'border-green-500 bg-green-50' : ''}`}
                                                        placeholder="VF123456"
                                                        onBlur={(e) => checkIdAvailability(e.target.value)}
                                                    />
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                                        {isCheckingId && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                                                        {!isCheckingId && isIdAvailable === true && <Check className="w-4 h-4 text-green-500" />}
                                                        {!isCheckingId && isIdAvailable === false && <AlertCircle className="w-4 h-4 text-red-500" />}
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={generateId}
                                                    className="h-11 w-11 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-[3px] border border-gray-300 transition-colors shrink-0"
                                                    title="Generate ID"
                                                >
                                                    <RefreshCw className="w-4 h-4 text-gray-600" />
                                                </button>
                                            </div>
                                            {isIdAvailable === false && <p className="text-red-500 text-xs mt-1">This ID is already in use.</p>}
                                        </div>
                                        <div className="flex-1">
                                            <FieldLabel text="Gender" />
                                            <Controller
                                                control={control}
                                                name="gender"
                                                render={({ field }) => (
                                                    <select
                                                        value={field.value}
                                                        onChange={field.onChange}
                                                        aria-label="Gender"
                                                        className={inputClass + ' bg-white'}
                                                    >
                                                        <option value="">Select</option>
                                                        <option value="Male">Male</option>
                                                        <option value="Female">Female</option>
                                                        <option value="Other">Other</option>
                                                    </select>
                                                )}
                                            />
                                        </div>
                                    </div>

                                    {/* Row: Nationality + Contact Number */}
                                    <div className="flex gap-6">
                                        <div className="flex-1">
                                            <FieldLabel text="Nationality" />
                                            <Controller
                                                control={control}
                                                name="nationality"
                                                render={({ field }) => (
                                                    <Dropdown
                                                        countries={countries.filter(c => !c.is_region)}
                                                        selected={field.value}
                                                        onSelect={(val) => field.onChange(val)}
                                                        placeholder="Select nationality"
                                                    />
                                                )}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <FieldLabel text="Contact Number" />
                                            <input
                                                {...register('contactNumber')}
                                                className={inputClass}
                                                placeholder="e.g., +66 081 091 87"
                                            />
                                        </div>
                                    </div>

                                    {/* Row: Work Email */}
                                    <div className="flex gap-6">
                                        <div className="flex-1">
                                            <FieldLabel text="Work Email" required />
                                            <input
                                                {...register('workEmail', { required: true })}
                                                type="email"
                                                className={`${inputClass} ${emailError ? 'border-red-500 bg-red-50' : ''}`}
                                                placeholder="name@company.com"
                                                onChange={(e) => {
                                                    register('workEmail').onChange(e);
                                                    if (emailError) setEmailError(null);
                                                }}
                                            />
                                            {errors.workEmail && !emailError && <span className="text-red-500 text-xs mt-1">Required</span>}
                                            {emailError && <span className="text-red-500 text-xs mt-1">{emailError}</span>}
                                        </div>
                                        <div className="flex-1" /> {/* Empty spacer for alignment */}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ═══════════════════════════════════════════════
                    SECTION 2: LOGIN & ACCESS
                ═══════════════════════════════════════════════ */}
                        <div className="flex flex-col gap-10">
                            <SectionHeader title="Login & Access" />

                            <div className="flex flex-col gap-8">
                                {/* Row: Login Email + Password */}
                                <div className="flex gap-6">
                                    <div className="flex-1">
                                        <FieldLabel text="System Login Email" required />
                                        <input
                                            {...register('loginEmail', { required: true })}
                                            type="email"
                                            className={`${inputClass} ${emailError ? 'border-red-500 bg-red-50' : ''}`}
                                            placeholder="employee's email to login"
                                            onChange={(e) => {
                                                register('loginEmail').onChange(e);
                                                if (emailError) setEmailError(null);
                                            }}
                                        />
                                        {errors.loginEmail && !emailError && <span className="text-red-500 text-xs mt-1">Required</span>}
                                        {emailError && <span className="text-red-500 text-xs mt-1">{emailError}</span>}
                                    </div>
                                    <div className="flex-1">
                                        <FieldLabel text="Password" required={!id} />
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <input
                                                    {...register('password', { required: !id, minLength: 6 })}
                                                    type={showPassword ? 'text' : 'password'}
                                                    className={`${inputClass} pr-12 font-mono`}
                                                    placeholder={id ? 'Leave empty to keep current' : '••••••••••••'}
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
                                                className="h-11 w-11 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-[3px] border border-gray-300 transition-colors shrink-0"
                                                title="Generate Password"
                                            >
                                                <RefreshCw className="w-4 h-4 text-gray-600" />
                                            </button>
                                        </div>
                                        {errors.password && <span className="text-red-500 text-xs mt-1">Min 6 characters</span>}
                                    </div>
                                </div>

                                {/* Role Selection */}
                                <div>
                                    <FieldLabel text="System-wide Permission" required />
                                    <div className="flex flex-wrap gap-3 mt-1">
                                        <Controller
                                            control={control}
                                            name="role"
                                            render={({ field }) => (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => field.onChange('Staff')}
                                                        className={`flex items-center gap-2 h-11 px-5 rounded-[3px] border-2 transition-all text-sm font-medium ${field.value === 'Staff'
                                                            ? 'border-[#064771] bg-[#E6F4FF] text-[#064771]'
                                                            : 'border-gray-300 text-gray-500 hover:border-gray-400'
                                                            }`}
                                                    >
                                                        {field.value === 'Staff' && <Check className="w-4 h-4" />}
                                                        <Shield className="w-4 h-4" />
                                                        Staff
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => field.onChange('System Admin')}
                                                        className={`flex items-center gap-2 h-11 px-5 rounded-[3px] border-2 transition-all text-sm font-medium ${field.value === 'System Admin'
                                                            ? 'border-amber-400 bg-amber-50 text-amber-700'
                                                            : 'border-gray-300 text-gray-500 hover:border-gray-400'
                                                            }`}
                                                    >
                                                        {field.value === 'System Admin' && <Check className="w-4 h-4" />}
                                                        <ShieldCheck className="w-4 h-4" />
                                                        System Admin
                                                    </button>
                                                </>
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ═══ Sticky Bottom Footer ═══ */}
                    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 h-16 flex items-center justify-end gap-3 px-8 z-50">
                        <button
                            type="button"
                            onClick={() => navigate('/settings/staff')}
                            className="h-9 px-5 bg-white rounded-[3px] border border-gray-300 text-gray-700 text-sm font-medium  hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || (isIdAvailable === false)}
                            className="h-9 px-6 bg-sky-950 rounded-[3px] text-white text-sm font-medium  hover:bg-[#042d48] transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? 'Saving...' : id ? 'Update Staff' : 'Create Staff'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateStaff;
