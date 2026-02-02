
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
import { ActivityLogChat } from '../components/ActivityLogChat';
import { LogoUpload } from '../../../components/LogoUpload';

// Types
interface FormValues {
    // Identity
    projectCode: string; // dealroomId
    rank: 'A' | 'B' | 'C';
    companyName: string; // reg_name
    websiteLinks: { url: string }[];
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
    internal_pic: any[];
    financialAdvisor: any[];
    primaryContactParams?: string;
    channel: string;
}

interface ExtendedCountry extends Country {
    alpha?: string;
}

const MNA_PURPOSES = [
    { value: 'Strategic Expansion', label: 'Strategic Expansion' },
    { value: 'Market Entry', label: 'Market Entry' },
    { value: 'Talent Acquisition', label: 'Talent Acquisition' },
    { value: 'Diversification', label: 'Diversification' },
    { value: 'Technology Acquisition', label: 'Technology Acquisition' },
    { value: 'Financial Investment', label: 'Financial Investment' },
    { value: 'Other', label: 'Other' },
];

const CHANNEL_OPTIONS = [
    { id: 1, name: 'TCF' },
    { id: 2, name: 'Partner' },
    { id: 3, name: 'Website' },
    { id: 4, name: 'Social Media' },
];

export const InvestorRegistration: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    const [countries, setCountries] = useState<ExtendedCountry[]>([]);
    const [industries, setIndustries] = useState<Industry[]>([]);
    const [currencies, setCurrencies] = useState<{ id: number; currency_code: string }[]>([]);
    const [isIdAvailable, setIsIdAvailable] = useState<boolean | null>(null);
    const [profileImage, setProfileImage] = useState<File | null>(null);
    const [initialProfileImage, setInitialProfileImage] = useState<string | undefined>(undefined);
    const [isCheckingId, setIsCheckingId] = useState(false);
    const [staffList, setStaffList] = useState<any[]>([]);
    const [partnerList, setPartnerList] = useState<any[]>([]);

    const { control, handleSubmit, setValue, register, formState: { errors, isSubmitting } } = useForm<FormValues>({
        defaultValues: {
            projectCode: 'XX-B-XXX',
            rank: 'B',
            budgetCurrency: 'USD',
            websiteLinks: [{ url: '' }],
            contacts: [{ name: '', department: '', designation: '', phone: '', email: '', isPrimary: true }],
            hqAddresses: [{ label: 'Headquarters', address: '' }],
            introducedProjects: [],
            noPICNeeded: false,
            internal_pic: [],
            financialAdvisor: [],
            channel: 'TCF'
        }
    });

    const { fields: contactFields, append: appendContact, remove: removeContact } = useFieldArray({
        control,
        name: "contacts"
    });

    const { fields: websiteFields, append: appendWebsite, remove: removeWebsite } = useFieldArray({
        control,
        name: "websiteLinks"
    });


    const { fields: addressFields, append: appendAddress, remove: removeAddress } = useFieldArray({
        control,
        name: 'hqAddresses'
    });

    const { fields: introProjectFields, append: appendIntroProject, remove: removeIntroProject } = useFieldArray({
        control,
        name: 'introducedProjects'
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

    // Fetch Currencies, Industries, Staff, and Partners
    useEffect(() => {
        const fetchInit = async () => {
            try {
                const [indRes, curRes, staffRes, partRes] = await Promise.all([
                    api.get('/api/industries'),
                    api.get('/api/currencies'),
                    api.get('/api/employees/fetch'),
                    api.get('/api/partners/fetch')
                ]);

                const iData = Array.isArray(indRes.data) ? indRes.data : (indRes.data?.data || []);
                setIndustries(iData.map((industry: any) => ({
                    id: industry.id,
                    name: industry.name,
                    status: industry.status,
                    sub_industries: industry.sub_industries || [],
                })));

                const cData = Array.isArray(curRes.data) ? curRes.data : (curRes.data?.data || []);
                setCurrencies(cData);

                const sData = Array.isArray(staffRes.data) ? staffRes.data : (staffRes.data?.data || []);
                setStaffList(sData.map((s: any) => ({
                    id: s.id,
                    name: s.full_name || s.name,
                    flagSrc: '', // No flag for staff
                    status: 'registered'
                })));

                const pData = Array.isArray(partRes.data) ? partRes.data : (partRes.data?.data || []);
                setPartnerList(pData.map((p: any) => ({
                    id: p.id,
                    name: p.reg_name || p.name,
                    flagSrc: '', // No flag for partners
                    status: 'registered'
                })));
            } catch {
                console.error("Failed to fetch industries, currencies, staff or partners");
            }
        };
        fetchInit();
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
                    setValue('channel', overview.channel || 'TCF');


                    try {
                        const links = overview.website ? JSON.parse(overview.website) : [];
                        if (Array.isArray(links) && links.length > 0) {
                            setValue('websiteLinks', links);
                        } else if (overview.website && !overview.website.startsWith('[')) {
                            // Handle legacy string data
                            setValue('websiteLinks', [{ url: overview.website }]);
                        } else {
                            setValue('websiteLinks', [{ url: '' }]);
                        }
                    } catch (e) {
                        // Fallback for simple string if parse fails
                        if (overview.website) setValue('websiteLinks', [{ url: overview.website }]);
                    }

                    setValue('purposeMNA', overview.reason_ma || '');
                    setValue('investmentCondition', overview.investment_condition || '');
                    setValue('investorProfileLink', overview.investor_profile_link || '');

                    try {
                        const iPico = typeof overview.internal_pic === 'string' ? JSON.parse(overview.internal_pic) : overview.internal_pic;
                        setValue('internal_pic', Array.isArray(iPico) ? iPico : []);

                        const fAdv = typeof overview.financial_advisor === 'string' ? JSON.parse(overview.financial_advisor) : overview.financial_advisor;
                        setValue('financialAdvisor', Array.isArray(fAdv) ? fAdv : []);
                    } catch (e) { }

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
                        const intro = typeof overview.introduced_projects === 'string' ? JSON.parse(overview.introduced_projects) : overview.introduced_projects;
                        if (intro && Array.isArray(intro)) {
                            // Correct mapping if items are strings
                            const formatted = intro.map((i: any) => typeof i === 'string' ? { name: i } : i);
                            setValue('introducedProjects', formatted);
                        }
                    } catch (e) { }

                    try {
                        const targetIndustriesRaw = typeof overview.main_industry_operations === 'string' ? JSON.parse(overview.main_industry_operations) : overview.main_industry_operations;
                        if (Array.isArray(targetIndustriesRaw)) {
                            const sanitized = targetIndustriesRaw.map(op => {
                                if (typeof op === 'object' && op !== null) return op;
                                const found = industries.find(i => i.name === op);
                                return found || { id: Date.now() + Math.random(), name: op };
                            });
                            setValue('targetIndustries', sanitized);
                        } else {
                            setValue('targetIndustries', []);
                        }
                    } catch (e) { }

                    try {
                        const targetCountries = typeof overview.target_countries === 'string' ? JSON.parse(overview.target_countries) : overview.target_countries;
                        setValue('targetCountries', targetCountries || []);
                    } catch (e) { }

                    try {
                        const contacts = typeof overview.contacts === 'string' ? JSON.parse(overview.contacts) : overview.contacts;
                        if (contacts && Array.isArray(contacts)) {
                            setValue('contacts', contacts);

                            // Set primary contact index for the radio button
                            const primaryIndex = contacts.findIndex((c: any) => c.isPrimary);
                            if (primaryIndex !== -1) {
                                setValue('primaryContactParams' as any, String(primaryIndex));
                            }
                        }
                    } catch (e) { }
                }
            } catch (err) {
                showAlert({ type: "error", message: "Failed to load investor data" });
            }
        };
        if (countries.length > 0 && industries.length > 0) fetchBuyer();
    }, [id, setValue, countries.length, industries.length]);

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

            payload.append('website', JSON.stringify(data.websiteLinks));
            payload.append('rank', data.rank);
            payload.append('status', isDraft ? 'Draft' : 'Active');
            payload.append('hq_address', JSON.stringify(data.hqAddresses));

            // Investment Intent
            payload.append('reason_ma', data.purposeMNA || '');
            payload.append('investment_budget', JSON.stringify({ min: data.budgetMin, max: data.budgetMax, currency: data.budgetCurrency }));
            payload.append('investment_condition', data.investmentCondition || '');
            payload.append('internal_pic', JSON.stringify(data.internal_pic || []));
            payload.append('financial_advisor', JSON.stringify(data.financialAdvisor || []));
            payload.append('introduced_projects', JSON.stringify(data.introducedProjects || []));
            payload.append('channel', data.channel || '');

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

            const response = await api.post('/api/buyer/company-overviews', payload);
            const savedId = response.data?.data?.id || id;

            showAlert({ type: 'success', message: `Investor ${isDraft ? 'draft ' : ''}saved successfully` });

            if (savedId) {
                navigate(`/prospects/investor/${savedId}`);
            } else {
                navigate('/prospects?tab=investors');
            }
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || 'Failed to save investor';
            showAlert({ type: 'error', message: errorMsg });

            if (errorMsg.toLowerCase().includes('project code') || errorMsg.toLowerCase().includes('id')) {
                setIsIdAvailable(false);
            }
        }
    };

    return (
        <form onSubmit={handleSubmit((data) => onSubmit(data, false))} className="w-full pb-20">

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
                        <Label text="Origin Country" required />
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
                                className={`w-full px-4 py-2 border rounded-[3px] focus:ring-2 focus:ring-blue-500 transition-all ${isIdAvailable === false ? 'border-red-500 bg-red-50' : isIdAvailable === true ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}
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
                        <Label text="Rank" />
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

                    {/* Channel */}
                    <div>
                        <Label text="Channel" required />
                        <Controller
                            control={control}
                            name="channel"
                            rules={{ required: true }}
                            render={({ field }) => (
                                <select
                                    className="w-full min-h-10 px-3 py-2 rounded border border-gray-300 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-colors text-sm"
                                    value={field.value}
                                    onChange={(e) => field.onChange(e.target.value)}
                                >
                                    {CHANNEL_OPTIONS.map(opt => (
                                        <option key={opt.id} value={opt.name}>{opt.name}</option>
                                    ))}
                                </select>
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

                    {/* HQ Addresses - Moved to Company Profile */}



                </div>
            </CollapsibleSection>

            {/* SECTION 2: COMPANY PROFILE (Moved from Identity) */}
            <CollapsibleSection title="Company Profile">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Website */}
                    <div className="md:col-span-2">
                        <Label text="Website" />
                        <div className="space-y-2">
                            {websiteFields.map((field, index) => (
                                <div key={field.id} className="flex items-center gap-2">
                                    <div className="flex-1 flex items-center">
                                        <span className="inline-flex items-center px-3 py-2 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                                            <LinkIcon className="h-4 w-4" />
                                        </span>
                                        <input
                                            {...register(`websiteLinks.${index}.url` as const)}
                                            type="text"
                                            placeholder="https://example.com"
                                            className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-[3px] border border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        />
                                    </div>
                                    <button type="button" onClick={() => removeWebsite(index)} className="text-red-400 hover:text-red-600">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={() => appendWebsite({ url: '' })}
                            className="flex items-center text-[#064771] font-medium hover:underline text-sm mt-2"
                        >
                            <Plus className="w-3 h-3 mr-1" /> Add Link
                        </button>
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
                                        className="w-full px-3 py-2 border border-gray-300 rounded-[3px] focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>
                                <div className="flex-[2] w-full flex gap-2">
                                    <input
                                        {...register(`hqAddresses.${index}.address` as const)}
                                        placeholder="Full Address"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-[3px] focus:ring-1 focus:ring-blue-500 focus:outline-none"
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

            {/* SECTION 3: CLASSIFICATION */}
            <CollapsibleSection title="Classification">
                <div className="space-y-6">
                    {/* Target Industries */}
                    <div>
                        <Label text="Target Business & Industry" required />
                        <Controller
                            control={control}
                            name="targetIndustries"
                            rules={{ required: true }}
                            render={({ field }) => (
                                <IndustryDropdown
                                    industries={industries}
                                    selected={field.value || []}
                                    onSelect={(selected) => field.onChange(selected)}
                                    multiSelect={true}
                                />
                            )}
                        />
                        {errors.targetIndustries && <span className="text-red-500 text-xs">Required</span>}
                    </div>

                    {/* Purpose */}


                    {/* Notes / Audit Log System */}
                    <div>
                        <Label text="Notes & Audit Log" />
                        <ActivityLogChat entityId={id} entityType="buyer" />
                    </div>

                    {/* Target Countries */}
                    <div>
                        <Label text="Where the investor wants to invest?" />
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

                </div>
            </CollapsibleSection>

            {/* SECTION 4: DEAL CONTEXT */}
            <CollapsibleSection title="Deal Context">
                <div className="space-y-6">
                    {/* Purpose Moved Here */}
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
                    {/* Budget & Condition */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label text="Investment Budget" />
                            <div className="flex gap-2">
                                <input {...register('budgetMin')} type="number" placeholder="Min" className="w-1/3 border px-2 py-1 rounded-[3px]" />
                                <span className="self-center">-</span>
                                <input {...register('budgetMax')} type="number" placeholder="Max" className="w-1/3 border px-2 py-1 rounded-[3px]" />
                                <select {...register('budgetCurrency')} className="w-1/4 border px-2 py-1 rounded-[3px] bg-white">
                                    {currencies.map(c => (
                                        <option key={c.id} value={c.currency_code}>{c.currency_code}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div>
                            <Label text="Investment Condition" />
                            <input {...register('investmentCondition')} className="w-full border px-3 py-2 rounded-[3px]" placeholder="e.g. Majority stake only" />
                        </div>
                    </div>
                </div>
            </CollapsibleSection>

            {/* SECTION 5: CONTACTS */}
            <CollapsibleSection title="Contacts">
                <div className="space-y-4">
                    {contactFields.map((field, index) => (
                        <div key={field.id} className="p-4 border border-gray-100 rounded-[3px] bg-gray-50 relative">
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

            {/* SECTION 6: DOCUMENTS & RELATIONSHIPS */}
            <CollapsibleSection title="Documents & Relationships">
                <div className="grid grid-cols-1 gap-6">
                    <div>
                        <Label text="Investor Profile" />
                        <div className="flex items-center">
                            <LinkIcon className="w-5 h-5 text-gray-400 mr-2" />
                            <input {...register('investorProfileLink')} placeholder="https://docs.google.com/..." className="w-full border px-3 py-2 rounded-[3px]" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <Label text="Assigned PIC" />
                            <Controller
                                control={control}
                                name="internal_pic"
                                render={({ field }) => (
                                    <Dropdown
                                        countries={staffList}
                                        selected={field.value}
                                        onSelect={(val) => field.onChange(val)}
                                        multiSelect={true}
                                        placeholder="Select Internal Staff"
                                        searchPlaceholder="Search staff names..."
                                    />
                                )}
                            />
                        </div>

                        {/* Introduced Projects */}
                        <div className="md:col-span-2 space-y-3">
                            <Label text="Introduced Projects" />
                            {introProjectFields.map((field, index) => (
                                <div key={field.id} className="flex gap-2 items-center">
                                    <input
                                        {...register(`introducedProjects.${index}.name` as const)}
                                        placeholder="Project Name / Code"
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-[3px] focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                    />
                                    <button type="button" onClick={() => removeIntroProject(index)} className="p-2 text-red-500 hover:bg-red-50 rounded">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => appendIntroProject({ id: Date.now(), name: '' })}
                                className="flex items-center text-[#064771] font-medium hover:underline text-sm"
                            >
                                <Plus className="w-3 h-3 mr-1" /> Add Project
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <Label text="Financial Advisor Role (Partner)" />
                            <Controller
                                control={control}
                                name="financialAdvisor"
                                render={({ field }) => (
                                    <Dropdown
                                        countries={partnerList}
                                        selected={field.value}
                                        onSelect={(val) => field.onChange(val)}
                                        multiSelect={true}
                                        placeholder="Select Financial Advisor"
                                        searchPlaceholder="Search partner names..."
                                    />
                                )}
                            />
                        </div>
                    </div>
                </div>
            </CollapsibleSection>

            {/* Sticky Bottom Buttons */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex justify-end gap-3 z-50">
                <button type="button" onClick={() => navigate('/prospects?tab=investors')} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-[3px] text-sm font-medium hover:bg-gray-50 transition-all">Cancel</button>
                <button type="button" onClick={handleSubmit(data => onSubmit(data, true))} disabled={isSubmitting} className="px-4 py-2 text-[#053a5c] bg-white border border-[#053a5c] rounded-[3px] text-sm font-medium hover:bg-gray-50 transition-all">
                    Save as Draft
                </button>
                <button type="submit" disabled={isSubmitting || (isIdAvailable === false)} className="px-6 py-2 text-white bg-[#053a5c] rounded-[3px] text-sm font-medium hover:bg-[#042d48] transition-all">
                    {isSubmitting ? 'Saving...' : id ? 'Update Investor' : 'Save Investor'}
                </button>
            </div>
        </form >
    );
};

export default InvestorRegistration;
