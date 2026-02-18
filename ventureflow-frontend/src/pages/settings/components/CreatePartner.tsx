/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, AlertCircle, Loader2, Eye, EyeOff, RefreshCw, ArrowLeft, Copy, CheckCircle } from 'lucide-react';
import api from '../../../config/api';
import { showAlert } from '../../../components/Alert';
import { Country, Dropdown } from '../../prospects/components/Dropdown';

interface ExtendedCountry extends Country {
    alpha_2_code?: string;
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

const CreatePartner: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = Boolean(id);

    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(isEditing);
    const [showPassword, setShowPassword] = useState(false);
    const [countries, setCountries] = useState<ExtendedCountry[]>([]);
    const [selectedCountry, setSelectedCountry] = useState<ExtendedCountry | null>(null);

    // ID Generation State
    const [isCheckingId, setIsCheckingId] = useState(false);
    const [isIdAvailable, setIsIdAvailable] = useState<boolean | null>(null);

    // Success Modal State
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string; partnerId: string } | null>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        partner_id: 'XX-P-XXX',
    });

    useEffect(() => {
        fetchCountries();
        if (isEditing && id) {
            fetchPartner(id);
        } else {
            generatePassword();
        }
    }, [id, isEditing]);

    // Generate Partner ID when country changes
    useEffect(() => {
        if (isEditing || !selectedCountry?.alpha_2_code) return;
        generatePartnerId(selectedCountry.alpha_2_code);
    }, [selectedCountry?.alpha_2_code, isEditing]);

    // Check ID availability when partner_id changes
    useEffect(() => {
        if (!formData.partner_id || formData.partner_id === 'XX-P-XXX') return;
        const timer = setTimeout(() => {
            checkIdAvailability(formData.partner_id);
        }, 500);
        return () => clearTimeout(timer);
    }, [formData.partner_id]);

    const fetchCountries = async () => {
        try {
            const res = await api.get('/api/countries');
            const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
            const formatted = data.map((c: any) => ({
                id: c.id,
                name: c.name,
                flagSrc: c.svg_icon_url,
                status: 'registered' as const,
                alpha_2_code: c.alpha_2_code
            }));
            setCountries(formatted);
        } catch (error) {
            console.error('Failed to fetch countries:', error);
        }
    };

    const fetchPartner = async (partnerId: string) => {
        setIsFetching(true);
        try {
            const res = await api.get(`/api/partners/${partnerId}`);
            const partner = res.data.data || res.data;
            const user = partner.user;
            const overview = partner.partner_overview;

            setFormData({
                name: user?.name || overview?.reg_name || '',
                email: user?.email || '',
                password: '',
                partner_id: partner.partner_id || '',
            });

            // Find and set the country
            if (overview?.hq_country) {
                const country = countries.find(c => c.id === overview.hq_country);
                if (country) setSelectedCountry(country);
            }
        } catch (error) {
            console.error('Failed to fetch partner:', error);
            showAlert({ type: 'error', message: 'Failed to load partner details' });
        } finally {
            setIsFetching(false);
        }
    };

    const generatePartnerId = async (countryCode: string) => {
        try {
            const response = await api.get(`/api/partner/get-last-sequence?country=${countryCode}`);
            const nextSeq = (response.data.lastSequence || 0) + 1;
            const formatted = String(nextSeq).padStart(3, '0');
            const newId = `${countryCode}-P-${formatted}`;
            setFormData(prev => ({ ...prev, partner_id: newId }));
        } catch (error) {
            console.error('Failed to generate partner ID:', error);
        }
    };

    const checkIdAvailability = async (code: string) => {
        if (!code || code === 'XX-P-XXX') return;
        setIsCheckingId(true);
        try {
            const response = await api.get(`/api/partner/check-id?id=${code}${id ? `&exclude=${id}` : ''}`);
            setIsIdAvailable(response.data.available);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            // If endpoint doesn't exist, assume available
            setIsIdAvailable(true);
        } finally {
            setIsCheckingId(false);
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

    const handleCopy = async (field: 'email' | 'password' | 'both') => {
        if (!createdCredentials) return;

        let textToCopy = '';
        if (field === 'email') {
            textToCopy = createdCredentials.email;
        } else if (field === 'password') {
            textToCopy = createdCredentials.password;
        } else {
            textToCopy = `Email: ${createdCredentials.email}\nPassword: ${createdCredentials.password}\nPartner ID: ${createdCredentials.partnerId}`;
        }

        try {
            await navigator.clipboard.writeText(textToCopy);
            setCopiedField(field);
            setTimeout(() => setCopiedField(null), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const countryCode = selectedCountry?.alpha_2_code || '';

            const payload: any = {
                name: formData.name,
                email: formData.email,
                country: countryCode,
            };

            if (formData.password) {
                payload.password = formData.password;
            }

            let responseData;
            if (isEditing && id) {
                const res = await api.put(`/api/partners/${id}`, payload);
                responseData = res.data;
                showAlert({
                    type: 'success',
                    message: 'Partner updated successfully'
                });
                navigate('/settings/partners');
            } else {
                const res = await api.post('/api/partners', payload);
                responseData = res.data;

                // Show success modal with credentials
                setCreatedCredentials({
                    email: formData.email,
                    password: formData.password,
                    partnerId: responseData.data?.partner_id || formData.partner_id
                });
                setShowSuccessModal(true);
            }
        } catch (error: any) {
            console.error('Failed to save partner:', error);
            const errMsg = error.response?.data?.errors
                ? Object.values(error.response.data.errors).flat()[0]
                : error.response?.data?.message || error.response?.data?.error?.email?.[0] || 'Failed to save partner';
            showAlert({ type: 'error', message: errMsg as string });
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleCountrySelect = (country: Country | Country[]) => {
        const single = Array.isArray(country) ? country[0] : country;
        if (single) setSelectedCountry(single as ExtendedCountry);
    };

    /* ─── shared input style ─── */
    const inputClass = "w-full h-11 px-3 py-2 bg-white rounded-[3px] border border-gray-300 text-sm font-normal  text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-300 transition-colors";

    if (isFetching) {
        return (
            <div className="flex flex-col h-full min-h-screen bg-white ">
                <div className="flex items-center gap-4 px-4 md:px-6 py-4 bg-white border-b">
                    <button
                        type="button"
                        className="flex items-center gap-2 px-4 py-2 rounded-[3px] bg-[#064771] hover:bg-[#053a5c] text-white text-sm font-medium transition-all active:scale-95"
                        onClick={() => navigate('/settings/partners')}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back</span>
                    </button>
                    <h1 className="text-xl md:text-2xl font-medium text-gray-900">
                        {isEditing ? 'Edit Partner' : 'Create Partner'}
                    </h1>
                </div>
                <div className="flex-1 overflow-auto p-4 md:p-6 scrollbar-premium">
                    <div className="w-full pb-24 ">
                        <div className="max-w-[1197px] mx-auto flex flex-col gap-12 animate-pulse">
                            <div className="flex flex-col gap-6">
                                <div className="h-6 w-48 bg-gray-200 rounded" />
                                <div className="h-px bg-gray-200" />
                                <div className="flex gap-6">
                                    <div className="flex-1 h-11 bg-gray-200 rounded" />
                                    <div className="flex-1 h-11 bg-gray-200 rounded" />
                                </div>
                                <div className="flex gap-6">
                                    <div className="flex-1 h-11 bg-gray-200 rounded" />
                                    <div className="flex-1 h-11 bg-gray-200 rounded" />
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
                    onClick={() => navigate('/settings/partners')}
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                </button>
                <h1 className="text-xl md:text-2xl font-medium text-gray-900">
                    {isEditing ? 'Edit Partner' : 'Create Partner'}
                </h1>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto p-4 md:p-6">
                <form onSubmit={handleSubmit} className="w-full pb-24 ">
                    <div className="max-w-[1197px] mx-auto flex flex-col gap-12">

                        {/* ═══ Section 1: Partner Information ═══ */}
                        <div>
                            <SectionHeader title="Partner Information" />
                            <div className="flex flex-col gap-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                                    {/* Partner Name */}
                                    <div>
                                        <FieldLabel text="Partner Name" required />
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => handleChange('name', e.target.value)}
                                            className={inputClass}
                                            placeholder="Enter partner name"
                                        />
                                    </div>

                                    {/* Origin Country */}
                                    <div>
                                        <FieldLabel text="Origin Country" required />
                                        <Dropdown
                                            countries={countries}
                                            selected={selectedCountry}
                                            onSelect={((val: Country | Country[]) => handleCountrySelect(val)) as any}
                                            placeholder="Select Country"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                                    {/* Partner ID */}
                                    <div>
                                        <FieldLabel text="Partner ID" />
                                        <div className="relative flex items-center">
                                            <input
                                                type="text"
                                                value={formData.partner_id}
                                                onChange={(e) => handleChange('partner_id', e.target.value.toUpperCase())}
                                                readOnly={isEditing}
                                                className={`${inputClass} font-mono pr-10 ${isIdAvailable === false
                                                    ? 'border-red-400 bg-red-50'
                                                    : isIdAvailable === true
                                                        ? 'border-green-400 bg-green-50'
                                                        : ''
                                                    } ${isEditing ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
                                                placeholder="XX-P-XXX"
                                            />
                                            <div className="absolute right-3 flex items-center gap-2">
                                                {isCheckingId && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                                                {!isCheckingId && isIdAvailable === true && <Check className="w-5 h-5 text-green-500" />}
                                                {!isCheckingId && isIdAvailable === false && <AlertCircle className="w-5 h-5 text-red-500" />}
                                            </div>
                                        </div>
                                        {isIdAvailable === false && <p className="text-red-500 text-xs mt-1">This ID is already in use.</p>}
                                        {isIdAvailable === true && <p className="text-green-600 text-xs mt-1">ID is available.</p>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ═══ Section 2: Login & Access ═══ */}
                        <div>
                            <SectionHeader title="Login & Access" />
                            <div className="flex flex-col gap-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                                    {/* Email */}
                                    <div>
                                        <FieldLabel text="Email Address" required />
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => handleChange('email', e.target.value)}
                                            className={inputClass}
                                            placeholder="partner@example.com"
                                        />
                                    </div>

                                    {/* Password */}
                                    <div>
                                        <FieldLabel text="Password" required={!isEditing} />
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    required={!isEditing}
                                                    value={formData.password}
                                                    onChange={(e) => handleChange('password', e.target.value)}
                                                    className={`${inputClass} font-mono pr-10`}
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
                                                className="h-11 px-3 bg-gray-100 hover:bg-gray-200 rounded-[3px] transition-colors border border-gray-300"
                                                title="Generate Password"
                                            >
                                                <RefreshCw className="w-4 h-4 text-gray-600" />
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">Auto-generated secure password</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ═══ Sticky Bottom Footer ═══ */}
                    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 h-16 flex items-center justify-end gap-3 px-8 z-50">
                        <button
                            type="button"
                            onClick={() => navigate('/settings/partners')}
                            className="h-9 px-5 bg-white rounded-[3px] border border-gray-300 text-gray-700 text-sm font-medium  hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || (isIdAvailable === false)}
                            className="h-9 px-6 bg-sky-950 rounded-[3px] text-white text-sm font-medium  hover:bg-[#042d48] transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {isEditing ? 'Update Partner' : 'Create Partner'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Success Modal with Copy Credentials */}
            {showSuccessModal && createdCredentials && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100]">
                    <div className="bg-white rounded-[3px] p-6 max-w-md w-full mx-4 shadow-xl">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <h2 className="text-lg font-medium text-gray-900">Partner Created Successfully!</h2>
                            <p className="text-sm text-gray-500 mt-1">Save the credentials below before closing</p>
                        </div>

                        <div className="space-y-4">
                            {/* Partner ID */}
                            <div className="bg-gray-50 rounded-[3px] p-4 border border-gray-200">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Partner ID</label>
                                <div className="flex items-center justify-between">
                                    <span className="font-mono text-sm text-gray-900">{createdCredentials.partnerId}</span>
                                </div>
                            </div>

                            {/* Email */}
                            <div className="bg-gray-50 rounded-[3px] p-4 border border-gray-200">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                                <div className="flex items-center justify-between">
                                    <span className="font-mono text-sm text-gray-900">{createdCredentials.email}</span>
                                    <button
                                        onClick={() => handleCopy('email')}
                                        className="p-1.5 hover:bg-gray-200 rounded-[3px] transition-colors"
                                        title="Copy Email"
                                    >
                                        {copiedField === 'email' ? (
                                            <Check className="w-4 h-4 text-green-600" />
                                        ) : (
                                            <Copy className="w-4 h-4 text-gray-500" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Password */}
                            <div className="bg-gray-50 rounded-[3px] p-4 border border-gray-200">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Password</label>
                                <div className="flex items-center justify-between">
                                    <span className="font-mono text-sm text-gray-900">{createdCredentials.password}</span>
                                    <button
                                        onClick={() => handleCopy('password')}
                                        className="p-1.5 hover:bg-gray-200 rounded-[3px] transition-colors"
                                        title="Copy Password"
                                    >
                                        {copiedField === 'password' ? (
                                            <Check className="w-4 h-4 text-green-600" />
                                        ) : (
                                            <Copy className="w-4 h-4 text-gray-500" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Copy All Button */}
                            <button
                                onClick={() => handleCopy('both')}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#064771] hover:bg-[#053a5c] text-white text-sm font-medium rounded-[3px] transition-all"
                            >
                                {copiedField === 'both' ? (
                                    <>
                                        <Check className="w-4 h-4" />
                                        Copied All Credentials!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4" />
                                        Copy All Credentials
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="mt-6 pt-4 border-t border-gray-100">
                            <button
                                onClick={() => {
                                    setShowSuccessModal(false);
                                    navigate('/settings/partners');
                                }}
                                className="w-full px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-[3px] transition-colors border border-gray-200"
                            >
                                Close & Go to Partners
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreatePartner;
