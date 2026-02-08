
import React, { useState, useEffect } from 'react';
import { useForm, Controller, useWatch, useFieldArray } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, Loader2, Link as LinkIcon, User, Plus, Trash2 } from 'lucide-react';
import api from '../../../config/api';
import { showAlert } from '../../../components/Alert';
import { Input } from '../../../components/Input';
import Label from '../../../components/Label';
import { Dropdown, Country } from '../components/Dropdown';
import { IndustryDropdown, Industry as IndustryType } from '../components/IndustryDropdown';
import SelectPicker from '../../../components/SelectPicker';
import { CollapsibleSection } from '../../../components/CollapsibleSection';
import { LogoUpload } from '../../../components/LogoUpload';
import { AlertCircle } from 'lucide-react';


interface ExtendedCountry extends Country {
    alpha?: string;
}

interface Industry {
    id: number;
    name: string;
    status?: string;
    sub_industries?: Industry[];
    [key: string]: unknown;
}

interface FormValues {
    // Identity
    projectCode: string; // dealroomId
    originCountry: ExtendedCountry | null;
    status: string;
    rank: 'A' | 'B' | 'C';
    internal_pic: any[];
    financialAdvisor: any[];
    companyName: string;

    // Classification
    targetIndustries: IndustryType[]; // Multi-select industries like investor side
    nicheTags: string; // comma separated or chips (simplified to string for now)

    // Deal Summary
    projectDetails: string;
    reasonForMA: string;
    plannedSaleShareRatio: string;
    desiredInvestmentMin: string;
    desiredInvestmentMax: string;
    desiredInvestmentCurrency: string;

    ebitdaMin: string;
    ebitdaMax: string;


    // Contacts
    contacts: {
        name: string;
        designation: string;
        department?: string;
        email: string;
        phone: string;
        isPrimary: boolean;
    }[];
    primaryContactParams?: string;

    // Links
    websiteLinks: { url: string }[];
    teaserLink: string;
    introducedProjects: { id: number; name: string }[];
    channel: string;
}

const REASONS_MA = [
    { value: 'Market Expansion', label: 'Market Expansion' },
    { value: 'Succession/Exit', label: 'Succession/Exit' },
    { value: 'Strategic Partnership', label: 'Strategic Partnership' },
    { value: 'Financial Restructuring', label: 'Financial Restructuring' },
    { value: 'Other', label: 'Other' }
];

const RATIO_OPTIONS = [
    { value: 'Minority (<50%)', label: 'Minority (<50%)' },
    { value: 'Majority (>50%)', label: 'Majority (>50%)' },
    { value: '100% Sale', label: '100% Sale' },
    { value: 'Negotiable', label: 'Negotiable' },
];

const CHANNEL_OPTIONS = [
    { id: 1, name: 'TCF' },
    { id: 2, name: 'Partner' },
    { id: 3, name: 'Website' },
    { id: 4, name: 'Social Media' },
];

export const TargetRegistration: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // This is the PK (id), not projectCode

    const [countries, setCountries] = useState<ExtendedCountry[]>([]);
    const [industries, setIndustries] = useState<Industry[]>([]);
    const [currencies, setCurrencies] = useState<{ id: number; currency_code: string }[]>([]);
    const [staffList, setStaffList] = useState<any[]>([]);
    const [partnerList, setPartnerList] = useState<any[]>([]);

    const [profileImage, setProfileImage] = useState<File | null>(null);
    const [initialProfileImage, setInitialProfileImage] = useState<string | undefined>(undefined);

    const [isIdAvailable, setIsIdAvailable] = useState<boolean | null>(null);
    const [isCheckingId, setIsCheckingId] = useState(false);

    const { control, handleSubmit, setValue, register, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
        defaultValues: {
            projectCode: 'XX-S-XXX',
            rank: 'B',
            status: 'Active',
            desiredInvestmentCurrency: 'USD',
            targetIndustries: [],
            internal_pic: [],
            financialAdvisor: [],
            introducedProjects: [],
            contacts: [{ name: '', designation: '', department: '', email: '', phone: '', isPrimary: true }],
            websiteLinks: [{ url: '' }],
            channel: 'TCF'
        }
    });

    const { fields: contactFields, append: appendContact, remove: removeContact } = useFieldArray({
        control,
        name: 'contacts'
    });

    const { fields: websiteFields, append: appendWebsite, remove: removeWebsite } = useFieldArray({
        control,
        name: 'websiteLinks'
    });

    const { fields: introProjectFields, append: appendIntroProject, remove: removeIntroProject } = useFieldArray({
        control,
        name: 'introducedProjects'
    });

    const originCountry = useWatch({ control, name: 'originCountry' });
    const projectCodeValue = useWatch({ control, name: 'projectCode' });

    // Fetch Initial Data (Countries, Industries, Staff, Partners)
    useEffect(() => {
        const fetchInit = async () => {
            try {
                const [countryRes, indRes, staffRes, partRes, currencyRes] = await Promise.all([
                    api.get('/api/countries'),
                    api.get('/api/industries'),
                    api.get('/api/employees/fetch'),
                    api.get('/api/partners/fetch'),
                    api.get('/api/currencies')
                ]);

                // Currencies
                const currData = Array.isArray(currencyRes.data) ? currencyRes.data : (currencyRes.data?.data || []);
                setCurrencies(currData);

                // Countries
                const cData = Array.isArray(countryRes.data) ? countryRes.data : (countryRes.data?.data || []);
                setCountries(cData.map((c: any) => ({
                    id: c.id,
                    name: c.name,
                    alpha: c.alpha_2_code,
                    flagSrc: c.svg_icon_url,
                    status: 'registered' as const,
                })));

                // Industries
                const iData = Array.isArray(indRes.data) ? indRes.data : (indRes.data?.data || []);
                setIndustries(iData);

                // Staff
                const sData = Array.isArray(staffRes.data) ? staffRes.data : (staffRes.data?.data || []);
                setStaffList(sData.map((s: any) => ({
                    id: s.id,
                    name: s.full_name || s.name,
                    flagSrc: '',
                    status: 'registered'
                })));

                // Partners
                const pData = Array.isArray(partRes.data) ? partRes.data : (partRes.data?.data || []);
                setPartnerList(pData.map((p: any) => ({
                    id: p.id,
                    name: p.reg_name || p.name,
                    flagSrc: '',
                    status: 'registered'
                })));

            } catch (e) {
                console.error("Failed to load init data", e);
            }
        };
        fetchInit();
    }, []);

    // ID Generation (New Only)
    useEffect(() => {
        if (id || !originCountry?.alpha) return;

        const generateId = async () => {
            try {
                const response = await api.get(`/api/seller/get-last-sequence?country=${originCountry.alpha}`);
                const nextSeq = (response.data.lastSequence || 0) + 1;
                const formatted = String(nextSeq).padStart(3, '0');
                setValue('projectCode', `${originCountry.alpha}-S-${formatted}`);
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
        if (!code || code.includes('XX-S-XXX') || !code.includes('-S-')) return;
        setIsCheckingId(true);
        try {
            const response = await api.get(`/api/seller/check-id?id=${code}${id ? `&exclude=${id}` : ''}`);
            setIsIdAvailable(response.data.available);
        } catch (error) {
            console.error(error);
            setIsIdAvailable(null);
        } finally {
            setIsCheckingId(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (projectCodeValue && projectCodeValue !== 'XX-S-XXX') {
                checkIdAvailability(projectCodeValue);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [projectCodeValue]);

    // Fetch existing data for Edit
    useEffect(() => {
        if (!id) return;
        const fetchData = async () => {
            try {
                const response = await api.get(`/api/seller/${id}`);
                const seller = response.data?.data;
                const ov = seller.companyOverview || {};
                const fin = seller.financialDetails || {};

                setValue('projectCode', seller.seller_id);
                setValue('status', seller.status === '1' ? 'Active' : (seller.status === '2' ? 'Draft' : 'Active'));
                setValue('companyName', ov.reg_name || '');
                setValue('rank', ov.company_rank || 'B');
                setValue('channel', ov.channel || 'TCF');
                setValue('projectDetails', ov.details || '');
                setValue('reasonForMA', ov.reason_ma || '');
                setValue('teaserLink', ov.teaser_link || '');

                // Website Links Load
                try {
                    let links = [];
                    if (ov.website_links) {
                        links = typeof ov.website_links === 'string' ? JSON.parse(ov.website_links) : ov.website_links;
                    }

                    if ((!links || links.length === 0) && ov.website) {
                        links = [{ url: ov.website }];
                    }

                    if (links && links.length > 0) {
                        setValue('websiteLinks', links);
                    }
                } catch (e) { console.error("Website links load error", e); }

                try {
                    const iPico = typeof ov.internal_pic === 'string' ? JSON.parse(ov.internal_pic) : ov.internal_pic;
                    setValue('internal_pic', Array.isArray(iPico) ? iPico : []);

                    const fAdv = typeof ov.financial_advisor === 'string' ? JSON.parse(ov.financial_advisor) : ov.financial_advisor;
                    setValue('financialAdvisor', Array.isArray(fAdv) ? fAdv : []);

                    const intro = typeof ov.introduced_projects === 'string' ? JSON.parse(ov.introduced_projects) : ov.introduced_projects;
                    if (intro && Array.isArray(intro)) {
                        const formatted = intro.map((i: any) => typeof i === 'string' ? { name: i } : i);
                        setValue('introducedProjects', formatted);
                    }
                } catch (e) { }

                if (seller.image) {
                    const baseURL = import.meta.env.VITE_API_BASE_URL || '';
                    const isUrl = seller.image.startsWith('http');
                    const imagePath = isUrl ? seller.image : `${baseURL}/storage/${seller.image.replace(/^\//, '')}`;
                    setInitialProfileImage(imagePath);
                }

                // hqCountry relation is loaded by backend and serialized as 'hq_country' object
                // When relation is loaded: hq_country is the country object
                const countryData = ov.hq_country;
                if (countryData) {
                    // If it's a loaded relationship (object with name, id, etc.)
                    if (typeof countryData === 'object' && countryData.id) {
                        setValue('originCountry', {
                            id: countryData.id,
                            name: countryData.name || '',
                            alpha: countryData.alpha_2_code || '',
                            flagSrc: countryData.svg_icon_url || '',
                            status: 'registered'
                        });
                    } else if (typeof countryData === 'number' || typeof countryData === 'string') {
                        // If it's just the ID (relation not loaded), look it up in countries list
                        const c = countries.find(x => x.id == countryData);
                        if (c) setValue('originCountry', c);
                    }
                }

                try {
                    const ops = typeof ov.industry_ops === 'string' ? JSON.parse(ov.industry_ops) : ov.industry_ops;
                    if (Array.isArray(ops)) {
                        const sanitized = ops.map(op => {
                            if (typeof op === 'object' && op !== null) return op;
                            const found = industries.find(i => i.name === op);
                            return found || { id: Date.now() + Math.random(), name: op };
                        });
                        setValue('targetIndustries', sanitized);
                    }
                } catch (e) { }

                const invAmount = typeof fin.expected_investment_amount === 'string' ? { min: fin.expected_investment_amount, max: '' } : (fin.expected_investment_amount || { min: '', max: '' });
                setValue('desiredInvestmentMin', invAmount.min || '');
                setValue('desiredInvestmentMax', invAmount.max || '');
                setValue('desiredInvestmentCurrency', fin.default_currency || 'USD');

                const ebitdaVal = typeof fin.ebitda_value === 'string' ? { min: fin.ebitda_value, max: '' } : (fin.ebitda_value || { min: '', max: '' });
                setValue('ebitdaMin', ebitdaVal.min || fin.ttm_profit || '');
                setValue('plannedSaleShareRatio', fin.maximum_investor_shareholding_percentage || '');

                // Contacts Loading
                try {
                    const contactsRaw = ov.contacts || ov.contact_persons;
                    let parsedContacts: any[] = [];

                    if (typeof contactsRaw === 'string') {
                        parsedContacts = JSON.parse(contactsRaw);
                    } else if (Array.isArray(contactsRaw)) {
                        parsedContacts = contactsRaw;
                    }

                    // Fallback to legacy fields if no contacts list
                    if (!parsedContacts || parsedContacts.length === 0) {
                        if (ov.seller_contact_name || ov.seller_email) {
                            parsedContacts.push({
                                name: ov.seller_contact_name || '',
                                designation: ov.seller_designation || '',
                                email: ov.seller_email || '',
                                phone: ov.seller_phone || '',
                                isPrimary: true
                            });
                        }
                    }

                    if (parsedContacts.length > 0) {
                        setValue('contacts', parsedContacts);
                        const primaryIndex = parsedContacts.findIndex((c: any) => c.isPrimary);
                        if (primaryIndex !== -1) {
                            setValue('primaryContactParams' as any, String(primaryIndex));
                        }
                    }
                } catch (e) { console.error("Contact load error", e); }


            } catch (err) {
                console.error(err);
                showAlert({ type: 'error', message: 'Failed to load Target data' });
            }
        };

        if (countries.length > 0 && industries.length > 0) fetchData();
    }, [id, countries.length, industries.length, setValue]);


    const onSubmit = async (data: FormValues, isDraft: boolean) => {
        try {
            // STEP 1: Company Overview (Core)
            const overviewFormData = new FormData();
            if (id) overviewFormData.append('seller_id', id); // Logic uses seller_id as PK

            overviewFormData.append('dealroomId', data.projectCode);
            overviewFormData.append('companyName', data.companyName);
            overviewFormData.append('hq_country', String(data.originCountry?.id));
            overviewFormData.append('companyRank', data.rank);
            overviewFormData.append('status', isDraft ? 'Draft' : 'Active');
            overviewFormData.append('details', data.projectDetails);
            overviewFormData.append('reason_for_mna', data.reasonForMA);
            overviewFormData.append('website_links', JSON.stringify(data.websiteLinks));
            overviewFormData.append('websiteLink', data.websiteLinks[0]?.url || '');
            overviewFormData.append('teaser_link', data.teaserLink);

            if (profileImage) {
                overviewFormData.append('profilePicture', profileImage);
            }

            // Industry Mapping: Send selected industries
            overviewFormData.append('broderIndustries', JSON.stringify(data.targetIndustries || []));

            // Contact
            // Contact
            const sanitizedContacts = data.contacts.map((c, idx) => ({
                ...c,
                isPrimary: String(data.primaryContactParams) === String(idx)
            }));
            const primaryContact = sanitizedContacts.find(c => c.isPrimary) || sanitizedContacts[0];

            overviewFormData.append('sellerSideContactPersonName', primaryContact?.name || '');
            overviewFormData.append('designationAndPosition', primaryContact?.designation || '');
            overviewFormData.append('emailAddress', primaryContact?.email || '');
            overviewFormData.append('contactPersons', JSON.stringify(sanitizedContacts));


            // PIC and Advisors
            overviewFormData.append('internal_pic', JSON.stringify(data.internal_pic || []));
            overviewFormData.append('financial_advisor', JSON.stringify(data.financialAdvisor || []));
            overviewFormData.append('introduced_projects', JSON.stringify(data.introducedProjects || []));
            overviewFormData.append('channel', data.channel || '');

            // Flags (Defaulting to false/empty for now to match minimal intake)
            overviewFormData.append('noPICNeeded', '0');

            const overviewRes = await api.post('/api/seller/company-overviews', overviewFormData);
            const savedSellerId = overviewRes.data.data; // The backend returns ID

            if (!savedSellerId) throw new Error("Failed to retrieve Saved Seller ID");

            // STEP 2: Financial Details
            const financePayload = {
                seller_id: savedSellerId,
                expected_investment_amount: {
                    min: data.desiredInvestmentMin,
                    max: data.desiredInvestmentMax
                },
                default_currency: data.desiredInvestmentCurrency,
                maximum_investor_shareholding_percentage: data.plannedSaleShareRatio,
                ebitda_value: {
                    min: data.ebitdaMin,
                    max: ''
                },
                is_draft: isDraft ? '2' : '1' // 1: Active, 2: Draft
            };
            await api.post('/api/seller/financial-details', financePayload);

            showAlert({ type: 'success', message: `Target ${isDraft ? 'draft' : ''} saved successfully` });
            navigate(`/prospects/target/${savedSellerId}`);

        } catch (error: any) {
            const errorMsg = error.response?.data?.message || 'Failed to save Target';
            showAlert({ type: 'error', message: errorMsg });

            if (errorMsg.toLowerCase().includes('project code') || errorMsg.toLowerCase().includes('id')) {
                setIsIdAvailable(false);
            }
        }
    };

    return (
        <form onSubmit={handleSubmit(d => onSubmit(d, false))} className="w-full pb-24 font-sans text-gray-900">


            {/* SECTION A: IDENTITY */}
            <CollapsibleSection title="Identity" defaultOpen={true}>
                <div className="mb-6 flex justify-center">
                    <LogoUpload
                        initialImage={initialProfileImage}
                        onImageSelect={(file) => setProfileImage(file)}
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <Label text="Origin Country" required />
                        <Controller
                            control={control}
                            name="originCountry"
                            rules={{ required: true }}
                            render={({ field }) => (
                                <Dropdown
                                    countries={countries}
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    placeholder="Select country"
                                    searchPlaceholder="Search country..."
                                />
                            )}
                        />
                        {errors.originCountry && <span className="text-red-500 text-xs">Required</span>}
                    </div>

                    <div>
                        <Label text="Project Code" />
                        <div className="relative flex items-center">
                            <input
                                {...register('projectCode')}
                                className={`w-full px-4 py-2 border rounded-[3px] focus:ring-2 focus:ring-orange-200 transition-all ${isIdAvailable === false ? 'border-red-500 bg-red-50' : isIdAvailable === true ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}
                                placeholder="XX-S-XXX"
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



                    <div>
                        <Label text="Rank" />
                        <Controller
                            control={control}
                            name="rank"
                            render={({ field }) => (
                                <SelectPicker
                                    options={[{ value: 'A', label: 'A - High Priority' }, { value: 'B', label: 'B - Standard' }, { value: 'C', label: 'C - Low' }]}
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

                    <div className="md:col-span-2">
                        <Label text="Company Name" required />
                        <Input {...register('companyName', { required: true })} placeholder="Registered Company Entity Name" className="rounded-[3px]" />
                        {errors.companyName && <span className="text-red-500 text-xs">Required</span>}
                    </div>
                </div>
            </CollapsibleSection>

            {/* SECTION 2: COMPANY PROFILE */}
            <CollapsibleSection title="Company Profile">
                <div className="space-y-4">
                    <div>
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
                                            className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-orange-200 focus:border-orange-400 sm:text-sm"
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
                            className="flex items-center text-[#ECA234] font-medium hover:underline text-sm mt-2"
                        >
                            <Plus className="w-3 h-3 mr-1" /> Add Link
                        </button>
                    </div>

                    <div>
                        <Label text="Project Details" />
                        <textarea
                            {...register('projectDetails')}
                            className="w-full border border-gray-300 rounded-[3px] p-3 min-h-[100px] focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none"
                            placeholder="Brief description of the deal..."
                        />
                    </div>
                </div>
            </CollapsibleSection>

            {/* SECTION 3: CLASSIFICATION */}
            <CollapsibleSection title="Classification">
                <div className="space-y-6">
                    {/* Target Industries - Multi-select with checkboxes like Investor side */}
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
                        {errors.targetIndustries && <span className="text-red-500 text-xs">At least one industry is required</span>}
                    </div>
                </div>
            </CollapsibleSection>

            {/* SECTION 4: DEAL CONTEXT */}
            <CollapsibleSection title="Deal Context">
                <div className="space-y-4">


                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <Label text="Reason for M&A" required />
                            <Controller
                                control={control}
                                name="reasonForMA"
                                rules={{ required: true }}
                                render={({ field }) => (
                                    <SelectPicker
                                        options={REASONS_MA}
                                        value={field.value}
                                        onChange={field.onChange}
                                    />
                                )}
                            />
                        </div>
                        <div>
                            <Label text="Planned Sale Share Ratio" required />
                            <Controller
                                control={control}
                                name="plannedSaleShareRatio"
                                rules={{ required: true }}
                                render={({ field }) => (
                                    <SelectPicker
                                        options={RATIO_OPTIONS}
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder="Select Ratio"
                                    />
                                )}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-3"><Label text="Desired Investment Range" required /></div>
                        <Input {...register('desiredInvestmentMin')} type="number" placeholder="Min Amount" />
                        <Input {...register('desiredInvestmentMax')} type="number" placeholder="Max Amount" />
                        <div>
                            <Label text="Currency" />
                            <select {...register('desiredInvestmentCurrency')} className="w-full border border-gray-300 rounded-[3px] px-3 py-2 bg-white">
                                {currencies.map(c => (
                                    <option key={c.id} value={c.currency_code}>{c.currency_code}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                            <div className="md:col-span-3"><Label text="EBITDA / TTM Profit" /></div>
                            <div className="md:col-span-2">
                                <Input {...register('ebitdaMin')} type="number" placeholder="Value" />
                            </div>
                            <div>
                                <Label text="Currency" />
                                <div className="flex items-center text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-[3px] border border-gray-200">
                                    {watch('desiredInvestmentCurrency') || 'USD'}
                                </div>
                            </div>
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
                        onClick={() => appendContact({ name: '', designation: '', department: '', email: '', phone: '', isPrimary: false })}
                        className="flex items-center text-[#ECA234] font-medium hover:underline"
                    >
                        <Plus className="w-4 h-4 mr-1" /> Add Contact
                    </button>
                </div>
            </CollapsibleSection>

            {/* SECTION 6: DOCUMENTS & RELATIONSHIPS */}
            <CollapsibleSection title="Documents & Relationships">
                <div className="grid grid-cols-1 gap-6">


                    <div>
                        <Label text="Teaser Profile" />
                        <div className="flex items-center">
                            <LinkIcon className="w-5 h-5 text-gray-400 mr-2" />
                            <input {...register('teaserLink')} placeholder="https://docs.google.com/..." className="w-full border px-3 py-2 rounded" />
                        </div>
                    </div>

                    <div>
                        <Label text="Assigned PIC" />
                        <Controller
                            control={control}
                            name="internal_pic"
                            render={({ field }) => (
                                <Dropdown
                                    countries={staffList}
                                    selected={field.value}
                                    onSelect={(selected) => field.onChange(selected)}
                                    multiSelect={true}
                                    placeholder="Select Internal Staff"
                                    searchPlaceholder="Search staff names..."
                                />
                            )}
                        />
                    </div>

                    <div>
                        <Label text="Financial Advisor Roles" />
                        <Controller
                            control={control}
                            name="financialAdvisor"
                            render={({ field }) => (
                                <Dropdown
                                    countries={partnerList}
                                    selected={field.value}
                                    onSelect={(selected) => field.onChange(selected)}
                                    multiSelect={true}
                                    placeholder="Select Financial Advisor"
                                    searchPlaceholder="Search partner names..."
                                />
                            )}
                        />
                    </div>

                    <div>
                        <Label text="Introduced Projects" />
                        <div className="space-y-3">
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
                                className="flex items-center text-[#ECA234] font-medium hover:underline text-sm"
                            >
                                <Plus className="w-3 h-3 mr-1" /> Add Project
                            </button>
                        </div>
                    </div>
                </div>
            </CollapsibleSection>

            {/* Sticky Bottom Buttons */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex justify-end gap-3 z-50">
                <button type="button" onClick={() => navigate('/prospects?tab=targets')} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-[3px] text-sm font-medium hover:bg-gray-50 transition-all">Cancel</button>
                <button type="button" onClick={handleSubmit(d => onSubmit(d, true))} disabled={isSubmitting} className="px-4 py-2 text-[#053a5c] bg-white border border-[#053a5c] rounded-[3px] text-sm font-medium hover:bg-gray-50 transition-all">
                    Save as Draft
                </button>
                <button type="submit" disabled={isSubmitting || (isIdAvailable === false)} className="px-6 py-2 text-white bg-[#053a5c] rounded-[3px] text-sm font-medium hover:bg-[#042d48] transition-all">
                    {isSubmitting ? 'Saving...' : 'Save Target'}
                </button>
            </div>
        </form>
    );
};

export default TargetRegistration;
