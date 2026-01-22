import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, Link as LinkIcon, User, Check, AlertCircle, Loader2 } from 'lucide-react';
import api from '../../../config/api';
import { showAlert } from '../../../components/Alert';
import { Input } from '../../../components/Input';
import Label from '../../../components/Label';
import { Dropdown, Country } from '../components/Dropdown';
import { IndustryDropdown, Industry } from '../components/IndustryDropdown';
import SelectPicker from '../../../components/SelectPicker';
import { CollapsibleSection } from '../../../components/CollapsibleSection';
import { ActivityLogChat } from '../../prospects/components/ActivityLogChat';
import { LogoUpload } from '../../../components/LogoUpload';

// Types
interface FormValues {
    // Identity
    projectCode: string; // dealroomId
    rank: 'A' | 'B' | 'C';
    companyName: string; // reg_name
    website: string;
    hqAddresses: { label: string; address: string }[]; // New HQ Address field

    // Investment Intent
    targetIndustries: Industry[]; // main_industry_operations
    purposeMNA: string; // reason_ma
    targetCountries: Country[]; // target_countries
    budgetMin: string;
    budgetMax: string;
    budgetCurrency: string;
    investmentCondition: string;

    // Contacts
    contacts: {
        name: string;
        department: string;
        designation: string;
        phone: string;
        email: string;
        isPrimary: boolean;
    }[];

    // Relationships
    introducedProjects: { id: number; name: string }[];
    investorProfileLink: string;

    // Internal Logic
    originCountry: ExtendedCountry | null; // For ID generation
    noPICNeeded: boolean;
    our_person_incharge: string;
    primaryContactParams?: string;
}

interface ExtendedCountry extends Country {
    alpha?: string;
}

// M&A Purpose Options
const MNA_PURPOSES = [
    { value: 'Strategic Expansion', label: 'Strategic Expansion' },
    { value: 'Market Entry', label: 'Market Entry' },
    { value: 'Talent Acquisition', label: 'Talent Acquisition' },
    { value: 'Diversification', label: 'Diversification' },
    { value: 'Technology Acquisition', label: 'Technology Acquisition' },
    { value: 'Financial Investment', label: 'Financial Investment' },
    { value: 'Other', label: 'Other' },
];

export const InvestorRegistration: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    const [countries, setCountries] = useState<ExtendedCountry[]>([]);
    const [industries, setIndustries] = useState<Industry[]>([]);
    const [isIdAvailable, setIsIdAvailable] = useState<boolean | null>(null);
    const [profileImage, setProfileImage] = useState<File | null>(null);
    const [initialProfileImage, setInitialProfileImage] = useState<string | undefined>(undefined);
    const [isCheckingId, setIsCheckingId] = useState(false);

    const { control, handleSubmit, setValue, register, formState: { errors, isSubmitting } } = useForm<FormValues>({
        defaultValues: {
            projectCode: 'XX-B-XXX',
            rank: 'B',
            budgetCurrency: 'USD',
            contacts: [{ name: '', department: '', designation: '', phone: '', email: '', isPrimary: true }],
            hqAddresses: [{ label: 'Headquarters', address: '' }],
            introducedProjects: [],
            noPICNeeded: false
        }
    });

    const { fields: contactFields, append: appendContact, remove: removeContact } = useFieldArray({
        control,
        name: 'contacts'
    });

    const { fields: addressFields, append: appendAddress, remove: removeAddress } = useFieldArray({
        control,
        name: 'hqAddresses'
    });

    const originCountry = useWatch({ control, name: 'originCountry' });

    // Fetch Countries
    useEffect(() => {
        const fetchCountries = async () => {
            try {
                const response = await api.get('/api/countries');
                const data = Array.isArray(response.data) ? response.data : (response.data?.data || []);
                setCountries(data.map((c: any) => ({
                    id: c.id,
                    name: c.name,
                    alpha: c.alpha_2_code,
                    flagSrc: c.svg_icon_url,
                    status: 'registered'
                })));
            } catch (error) {
                console.error('Failed to fetch countries', error);
            }
        };
        fetchCountries();
    }, []);

    // Fetch Industries
    useEffect(() => {
        const fetchIndustries = async () => {
            try {
                const response = await api.get('/api/industries');
                const data = Array.isArray(response.data) ? response.data : (response.data?.data || []);
                const formatted = data.map((industry: any) => ({
                    id: industry.id,
                    name: industry.name,
                    status: industry.status,
                    sub_industries: industry.sub_industries || [],
                }));
                setIndustries(formatted);
            } catch {
                console.error("Failed to fetch industries");
            }
        };
        fetchIndustries();
    }, []);

    // ID Generation Logic (only for new records)
    useEffect(() => {
        if (id || !originCountry?.alpha) return;

        const generateId = async () => {
            try {
                const response = await api.get(`/api/buyer/get-last-sequence?country=${originCountry.alpha}`);
                const nextSeq = (response.data.lastSequence || 0) + 1;
                const formatted = String(nextSeq).padStart(3, '0');
                setValue('projectCode', `${originCountry.alpha}-B-${formatted}`);
                setIsCheckingId(false);
                setIsIdAvailable(true);
            } catch (error) {
                console.error(error);
            }
        };

        generateId();
    }, [originCountry?.alpha, setValue, id]);

    // Check ID Availability
    const checkIdAvailability = async (code: string) => {
        if (!code || code === 'XX-B-XXX') return;
        setIsCheckingId(true);
        try {
            const response = await api.get(`/api/buyer/check-id?id=${code}${id ? `&exclude=${id}` : ''}`);
            setIsIdAvailable(response.data.available);
        } catch (error) {
            console.error(error);
            setIsIdAvailable(null);
        } finally {
            setIsCheckingId(false);
        }
    };

    const projectCodeValue = useWatch({ control, name: 'projectCode' });
    useEffect(() => {
        const timer = setTimeout(() => {
            if (projectCodeValue) {
                checkIdAvailability(projectCodeValue);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [projectCodeValue]);

    // Fetch details if in edit mode
    useEffect(() => {
        if (!id) return;
        const fetchBuyer = async () => {
            try {
                const response = await api.get(`/api/buyer/${id}`);
                const buyer = response.data?.data;
                if (buyer) {
                    const overview = buyer.company_overview || {};
                    setValue('companyName', overview.reg_name || '');
                    setValue('projectCode', overview.buyer_id || '');
                    setValue('rank', overview.rank || 'B');
                    setValue('website', overview.website || '');
                    setValue('purposeMNA', overview.reason_ma || '');
                    setValue('investmentCondition', overview.investment_condition || '');
                    setValue('investorProfileLink', overview.investor_profile_link || '');

                    if (buyer.image) {
                        const baseURL = import.meta.env.VITE_API_BASE_URL || '';
                        const isUrl = buyer.image.startsWith('http');
                        const imagePath = isUrl ? buyer.image : `${baseURL}/storage/${buyer.image.replace(/^\//, '')}`;
                        setInitialProfileImage(imagePath);
                    }

                    if (overview.hq_country) {
                        setValue('originCountry', {
                            id: overview.hq_country,
                            name: overview.country?.name || '',
                            alpha: overview.country?.alpha_2_code || '',
                            flagSrc: overview.country?.svg_icon_url || '',
                            status: 'registered'
                        });
                    }

                    try {
                        const addresses = typeof overview.hq_address === 'string' ? JSON.parse(overview.hq_address) : overview.hq_address;
                        if (addresses && Array.isArray(addresses)) {
                            setValue('hqAddresses', addresses);
                        } else if (overview.hq_address && !Array.isArray(addresses)) {
                            setValue('hqAddresses', [{ label: 'Headquarters', address: String(overview.hq_address) }]);
                        }
                    } catch (e) { }

                    try {
                        const budget = typeof overview.investment_budget === 'string' ? JSON.parse(overview.investment_budget) : overview.investment_budget;
                        if (budget) {
                            setValue('budgetMin', budget.min || '');
                            setValue('budgetMax', budget.max || '');
                            setValue('budgetCurrency', budget.currency || 'USD');
                        }
                    } catch (e) { }

                    try {
                        const targetIndustries = typeof overview.main_industry_operations === 'string' ? JSON.parse(overview.main_industry_operations) : overview.main_industry_operations;
                        setValue('targetIndustries', targetIndustries || []);
                    } catch (e) { }

                    try {
                        const targetCountries = typeof overview.target_countries === 'string' ? JSON.parse(overview.target_countries) : overview.target_countries;
                        setValue('targetCountries', targetCountries || []);
                    } catch (e) { }

                    try {
                        const contacts = typeof overview.contacts === 'string' ? JSON.parse(overview.contacts) : overview.contacts;
                        if (contacts && Array.isArray(contacts)) {
                            setValue('contacts', contacts);
                        }
                    } catch (e) { }
                }
            } catch (err) {
                showAlert({ type: "error", message: "Failed to load investor data" });
            }
        };
        fetchBuyer();
    }, [id, setValue]);

    const onSubmit = async (data: FormValues, isDraft: boolean = false) => {
        try {
            const payload = new FormData();

            if (id) {
                payload.append('buyer', id);
            }

            // Core Identity
            payload.append('reg_name', data.companyName);
            payload.append('hq_country', String(data.originCountry?.id));
            payload.append('buyer_id', data.projectCode);
            payload.append('website', data.website);
            payload.append('rank', data.rank);
            payload.append('status', isDraft ? 'Draft' : 'Active');
            payload.append('hq_address', JSON.stringify(data.hqAddresses));

            // Investment Intent
            payload.append('reason_ma', data.purposeMNA || '');
            payload.append('investment_budget', JSON.stringify({ min: data.budgetMin, max: data.budgetMax, currency: data.budgetCurrency }));
            payload.append('investment_condition', data.investmentCondition || '');

            payload.append('main_industry_operations', JSON.stringify(data.targetIndustries || []));
            payload.append('target_countries', JSON.stringify(data.targetCountries || []));

            // Fix Primary Contact logic before sending
            const sanitizedContacts = data.contacts.map((c, idx) => ({
                ...c,
                isPrimary: String(data.primaryContactParams) === String(idx)
            }));

            payload.append('contacts', JSON.stringify(sanitizedContacts));
            const primary = sanitizedContacts.find(c => c.isPrimary) || sanitizedContacts[0];
            if (primary) {
                payload.append('seller_contact_name', primary.name);
                payload.append('seller_email', primary.email);
                payload.append('seller_phone', primary.phone);
            }

            payload.append('investor_profile_link', data.investorProfileLink || '');
            if (profileImage) {
                payload.append('profile_picture', profileImage);
            }

            await api.post('/api/buyer/company-overviews', payload);

            showAlert({ type: 'success', message: `Investor ${isDraft ? 'draft ' : ''}saved successfully` });
            navigate('/prospects?tab=investors');
        } catch (error) {
            showAlert({ type: 'error', message: 'Failed to save investor' });
        }
    };

    return (
        <form onSubmit={handleSubmit((data) => onSubmit(data, false))} className="w-full max-w-5xl mx-auto pb-20">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">{id ? 'Edit Investor' : 'Investor Registration'}</h2>
                    <p className="text-sm text-gray-500">{id ? 'Update existing investor record' : 'Create a new investor record'}</p>
                </div>
                <div className="flex gap-3">
                    <button type="button" onClick={() => navigate('/prospects?tab=investors')} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                    <button type="button" onClick={handleSubmit(data => onSubmit(data, true))} disabled={isSubmitting} className="px-4 py-2 text-[#064771] bg-white border border-[#064771] rounded-lg hover:bg-gray-50">
                        Save as Draft
                    </button>
                    <button type="submit" disabled={isSubmitting || (isIdAvailable === false)} className="px-6 py-2 text-white bg-[#064771] rounded-lg hover:bg-[#053a5c]">
                        {isSubmitting ? 'Saving...' : id ? 'Update Investor' : 'Save Investor'}
                    </button>
                </div>
            </div>

            {/* SECTION 1: IDENTITY */}
            <CollapsibleSection title="Identity">
                <div className="mb-6 flex justify-center">
                    <LogoUpload
                        initialImage={initialProfileImage}
                        onImageSelect={(file) => setProfileImage(file)}
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Origin Country (Triggers ID) */}
                    <div>
                        <Label text="HQ Country (Triggers Project Code)" required />
                        <Controller
                            control={control}
                            name="originCountry"
                            render={({ field }) => (
                                <Dropdown
                                    countries={countries}
                                    selected={field.value}
                                    onSelect={(val) => field.onChange(val)}
                                />
                            )}
                        />
                    </div>

                    {/* Project Code (Read Only / Auto) */}
                    <div>
                        <Label text="Project Code" />
                        <div className="relative flex items-center">
                            <input
                                {...register('projectCode')}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-all ${isIdAvailable === false ? 'border-red-500 bg-red-50' : isIdAvailable === true ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}
                                placeholder="XX-B-XXX"
                            />
                            <div className="absolute right-3 flex items-center gap-2">
                                {isCheckingId && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                                {!isCheckingId && isIdAvailable === true && <Check className="w-5 h-5 text-green-500" />}
                                {!isCheckingId && isIdAvailable === false && <AlertCircle className="w-5 h-5 text-red-500" />}
                            </div>
                        </div>
                        {isIdAvailable === false && <p className="text-red-500 text-xs mt-1">This code is already in use.</p>}
                        {isIdAvailable === true && <p className="text-green-600 text-xs mt-1">Code is available.</p>}
                    </div>

                    {/* Rank */}
                    <div>
                        <Label text="Rank" required />
                        <Controller
                            control={control}
                            name="rank"
                            render={({ field }) => (
                                <SelectPicker
                                    options={[{ value: 'A', label: 'A - High Priority' }, { value: 'B', label: 'B - Standard' }, { value: 'C', label: 'C - Low Priority' }]}
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder="Select Rank"
                                />
                            )}
                        />
                    </div>

                    {/* Company Name */}
                    <div className="md:col-span-2">
                        <Label text="Company Name" required />
                        <Input
                            {...register('companyName', { required: true })}
                            placeholder="Enter company registered name"
                            className="w-full"
                        />
                        {errors.companyName && <span className="text-red-500 text-xs">Required</span>}
                    </div>

                    {/* Website */}
                    <div className="md:col-span-2">
                        <Label text="Website / LP URL" />
                        <div className="flex items-center">
                            <span className="inline-flex items-center px-3 py-2 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                                <LinkIcon className="h-4 w-4" />
                            </span>
                            <input
                                {...register('website')}
                                type="url"
                                placeholder="https://example.com"
                                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>
                    </div>

                    {/* HQ Addresses */}
                    <div className="md:col-span-2 space-y-3">
                        <div className="flex items-center justify-between">
                            <Label text="HQ Addresses" />
                            <button type="button" onClick={() => appendAddress({ label: 'Headquarters', address: '' })} className="text-sm text-[#064771] font-medium hover:underline flex items-center">
                                <Plus className="w-3 h-3 mr-1" /> Add Address
                            </button>
                        </div>
                        {addressFields.map((field, index) => (
                            <div key={field.id} className="flex flex-col md:flex-row gap-2 items-start">
                                <div className="flex-1 w-full md:w-1/3">
                                    <input
                                        {...register(`hqAddresses.${index}.label` as const)}
                                        placeholder="Label (e.g. Head Office)"
                                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>
                                <div className="flex-[2] w-full flex gap-2">
                                    <input
                                        {...register(`hqAddresses.${index}.address` as const)}
                                        placeholder="Full Address"
                                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                    />
                                    <button type="button" onClick={() => removeAddress(index)} className="p-2 text-red-500 hover:bg-red-50 rounded">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CollapsibleSection>

            {/* SECTION 2: INVESTMENT INTENT */}
            <CollapsibleSection title="Investment Intent">
                <div className="space-y-6">
                    {/* Target Industries */}
                    <div>
                        <Label text="Target Business & Industry" />
                        <Controller
                            control={control}
                            name="targetIndustries"
                            render={({ field }) => (
                                <IndustryDropdown
                                    industries={industries}
                                    selected={field.value || []}
                                    onSelect={(selected) => field.onChange(selected)}
                                    multiSelect={true}
                                />
                            )}
                        />
                    </div>

                    {/* Purpose */}
                    <div>
                        <Label text="Purpose of M&A" />
                        <Controller
                            control={control}
                            name="purposeMNA"
                            render={({ field }) => (
                                <SelectPicker
                                    options={MNA_PURPOSES}
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder="Select Purpose"
                                />
                            )}
                        />
                    </div>

                    {/* Notes / Audit Log System */}
                    <div>
                        <Label text="Notes & Audit Log" />
                        <ActivityLogChat entityId={id} entityType="buyer" />
                    </div>

                    {/* Target Countries */}
                    <div>
                        <Label text="Target Country & Area" />
                        <p className="text-xs text-gray-500 mb-2">Select primary target country (Multi-select enhancement pending)</p>
                        <Controller
                            control={control}
                            name="targetCountries"
                            render={({ field }) => (
                                <Dropdown
                                    countries={countries}
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    multiSelect
                                />
                            )}
                        />
                    </div>

                    {/* Budget & Condition */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label text="Investment Budget" />
                            <div className="flex gap-2">
                                <input {...register('budgetMin')} type="number" placeholder="Min" className="w-1/3 border px-2 py-1 rounded" />
                                <span className="self-center">-</span>
                                <input {...register('budgetMax')} type="number" placeholder="Max" className="w-1/3 border px-2 py-1 rounded" />
                                <select {...register('budgetCurrency')} className="w-1/4 border px-2 py-1 rounded bg-white">
                                    <option value="USD">USD</option>
                                    <option value="THB">THB</option>
                                    <option value="EUR">EUR</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <Label text="Investment Condition" />
                            <input {...register('investmentCondition')} className="w-full border px-3 py-2 rounded" placeholder="e.g. Majority stake only" />
                        </div>
                    </div>
                </div>
            </CollapsibleSection>

            {/* SECTION 3: CONTACTS */}
            <CollapsibleSection title="Contacts">
                <div className="space-y-4">
                    {contactFields.map((field, index) => (
                        <div key={field.id} className="p-4 border border-gray-100 rounded bg-gray-50 relative">
                            <div className="absolute right-2 top-2">
                                <button type="button" onClick={() => removeContact(index)} className="text-red-400 hover:text-red-600">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="col-span-1 md:col-span-2 lg:col-span-1">
                                    <Label text="Name" />
                                    <div className="flex items-center">
                                        <User className="w-4 h-4 text-gray-400 mr-2" />
                                        <input {...register(`contacts.${index}.name` as const)} placeholder="Contact Name" className="flex-1 border-b bg-transparent focus:outline-none focus:border-blue-500" />
                                    </div>
                                </div>
                                <div>
                                    <Label text="Designation" />
                                    <input {...register(`contacts.${index}.designation` as const)} placeholder="Position / Job Title" className="w-full border-b bg-transparent focus:outline-none" />
                                </div>
                                <div>
                                    <Label text="Department" />
                                    <input {...register(`contacts.${index}.department` as const)} placeholder="Dept." className="w-full border-b bg-transparent focus:outline-none" />
                                </div>
                                <div>
                                    <Label text="Phone" />
                                    <input {...register(`contacts.${index}.phone` as const)} placeholder="+1 234..." className="w-full border-b bg-transparent focus:outline-none" />
                                </div>
                                <div>
                                    <Label text="Email" />
                                    <input {...register(`contacts.${index}.email` as const)} placeholder="email@example.com" className="w-full border-b bg-transparent focus:outline-none" />
                                </div>

                                <div className="flex items-center mt-4">
                                    <input
                                        type="radio"
                                        value={index}
                                        {...register(`contacts.${index}.isPrimary` as const)}
                                        name="primaryContactParams"
                                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                    />
                                    <label className="ml-2 block text-sm text-gray-900">
                                        Primary Contact
                                    </label>
                                </div>
                            </div>
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={() => appendContact({ name: '', department: '', designation: '', phone: '', email: '', isPrimary: false })}
                        className="flex items-center text-[#064771] font-medium hover:underline"
                    >
                        <Plus className="w-4 h-4 mr-1" /> Add Contact
                    </button>
                </div>
            </CollapsibleSection>

            {/* SECTION 4: RELATIONSHIPS */}
            <CollapsibleSection title="Relationships & Documents">
                <div className="grid grid-cols-1 gap-6">
                    <div>
                        <Label text="Investor Profile Link (Teaser/Doc)" />
                        <div className="flex items-center">
                            <LinkIcon className="w-5 h-5 text-gray-400 mr-2" />
                            <input {...register('investorProfileLink')} placeholder="https://docs.google.com/..." className="w-full border px-3 py-2 rounded" />
                        </div>
                    </div>
                </div>
            </CollapsibleSection>
        </form>
    );
};

export default InvestorRegistration;
