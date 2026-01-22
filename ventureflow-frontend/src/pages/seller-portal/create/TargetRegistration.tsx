import React, { useState, useEffect } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, Loader2, Link as LinkIcon, User } from 'lucide-react';
import api from '../../../config/api';
import { showAlert } from '../../../components/Alert';
import { Input } from '../../../components/Input';
import Label from '../../../components/Label';
import { Dropdown, Country } from '../../investor-portal/components/Dropdown';
import SelectPicker from '../../../components/SelectPicker';
import { CollapsibleSection } from '../../../components/CollapsibleSection';
import { ActivityLogChat } from '../../prospects/components/ActivityLogChat';
import { LogoUpload } from '../../../components/LogoUpload';


interface ExtendedCountry extends Country {
    alpha?: string;
}

interface Industry {
    id: number;
    name: string;
    sub_industries?: Industry[];
}

interface FormValues {
    // Identity
    projectCode: string; // dealroomId
    originCountry: ExtendedCountry | null;
    status: string;
    rank: 'A' | 'B' | 'C';
    internalOwner: string; // Our Person In-charge
    companyName: string;

    // Classification
    industryMajor: { id: number; name: string } | null;
    industryMiddle: { id: number; name: string } | null;
    nicheTags: string; // comma separated or chips (simplified to string for now)

    // Deal Summary
    projectDetails: string;
    reasonForMA: string;
    plannedSaleShareRatio: string;
    desiredInvestmentMin: string;
    desiredInvestmentMax: string;
    desiredInvestmentCurrency: string;

    // Contact (Primary)
    primaryContactName: string;
    primaryContactDesignation: string;
    primaryContactEmail: string;
    primaryContactPhone: string;

    // Links
    websiteUrl: string;
    teaserLink: string;
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

export const TargetRegistration: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // This is the PK (id), not projectCode

    const [countries, setCountries] = useState<ExtendedCountry[]>([]);
    const [industries, setIndustries] = useState<Industry[]>([]);
    const [users, setUsers] = useState<{ id: number; name: string }[]>([]);

    // Derived state for Middle Industry
    const [availableMiddleIndustries, setAvailableMiddleIndustries] = useState<Industry[]>([]);
    const [profileImage, setProfileImage] = useState<File | null>(null);
    const [initialProfileImage, setInitialProfileImage] = useState<string | undefined>(undefined);

    const [isIdAvailable, setIsIdAvailable] = useState<boolean | null>(null);
    const [isCheckingId, setIsCheckingId] = useState(false);

    const { control, handleSubmit, setValue, register, formState: { errors, isSubmitting } } = useForm<FormValues>({
        defaultValues: {
            projectCode: 'XX-S-XXX',
            rank: 'B',
            status: 'Active',
            desiredInvestmentCurrency: 'USD',
            nicheTags: ''
        }
    });

    const originCountry = useWatch({ control, name: 'originCountry' });
    const selectedMajorIndustry = useWatch({ control, name: 'industryMajor' });
    const projectCodeValue = useWatch({ control, name: 'projectCode' });

    // Fetch Initial Data (Countries, Industries, Users)
    useEffect(() => {
        const fetchInit = async () => {
            try {
                const [countryRes, indRes, userRes] = await Promise.all([
                    api.get('/api/countries'),
                    api.get('/api/industries'),
                    api.get('/api/employees/fetch') // Assuming this endpoint for "Our Person In Charge"
                ]);

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

                // Users
                const uData = Array.isArray(userRes.data) ? userRes.data : (userRes.data?.data || []);
                setUsers(uData.map((u: any) => ({ id: u.id, name: u.name || u.first_name + ' ' + u.last_name })));

            } catch (e) {
                console.error("Failed to load init data", e);
            }
        };
        fetchInit();
    }, []);

    // Industry Logic
    useEffect(() => {
        if (selectedMajorIndustry && industries.length > 0) {
            const major = industries.find(i => i.id === selectedMajorIndustry.id);
            setAvailableMiddleIndustries(major?.sub_industries || []);
        } else {
            setAvailableMiddleIndustries([]);
        }
    }, [selectedMajorIndustry, industries]);

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
                setValue('status', seller.status === '1' ? 'Active' : (seller.status === '2' ? 'Draft' : 'Active')); // Mapping status
                setValue('companyName', ov.reg_name || '');
                setValue('rank', ov.company_rank || 'B');
                setValue('projectDetails', ov.details || '');
                setValue('reasonForMA', ov.reason_ma || '');
                setValue('websiteUrl', ov.website || '');
                setValue('teaserLink', ov.teaser_link || '');

                if (seller.image) {
                    const baseURL = import.meta.env.VITE_API_BASE_URL || '';
                    const isUrl = seller.image.startsWith('http');
                    const imagePath = isUrl ? seller.image : `${baseURL}/storage/${seller.image.replace(/^\//, '')}`;
                    setInitialProfileImage(imagePath);
                }

                // Address/Country
                if (ov.hq_country) {
                    // Find country
                    // Need to wait for countries to load really, but... helper logic:
                }

                // Map complex fields
                try {
                    const hqId = ov.hq_country;
                    if (hqId) {
                        const c = countries.find(x => x.id == hqId);
                        if (c) setValue('originCountry', c);
                        else {
                            // Fallback if countries not loaded yet?
                            // We can rely on react-hook-form keeping values if we set them late
                        }
                    }
                } catch (e) { }

                try {
                    // Industry Mapping
                    // Backend stores array industry_ops
                    const ops = typeof ov.industry_ops === 'string' ? JSON.parse(ov.industry_ops) : ov.industry_ops;
                    if (Array.isArray(ops) && ops.length > 0) {
                        // Assuming first one is "Major" if we have to pick one
                        const first = ops[0];
                        if (first) {
                            setValue('industryMajor', { id: first.id, name: first.name });
                            // We can't easily know the "Middle" unless we search sub industries.
                            // For now, let's leave middle empty or try to find it.
                        }
                    }
                } catch (e) { }

                // Financials
                setValue('desiredInvestmentMin', fin.expected_investment_amount || ''); // Fallback as it's a string in current backend
                setValue('desiredInvestmentCurrency', fin.default_currency || 'USD');
                setValue('plannedSaleShareRatio', fin.maximum_investor_shareholding_percentage || '');

                // Contact
                setValue('primaryContactName', ov.seller_contact_name || '');
                setValue('primaryContactDesignation', ov.seller_designation || '');
                setValue('primaryContactEmail', ov.seller_email || '');
                // Phone is JSON sometimes
                try {
                    const ph = typeof ov.seller_phone === 'string' ? JSON.parse(ov.seller_phone) : ov.seller_phone;
                    if (Array.isArray(ph)) setValue('primaryContactPhone', ph[0]?.phone || '');
                    else setValue('primaryContactPhone', String(ph || ''));
                } catch (e) { setValue('primaryContactPhone', ov.seller_phone || ''); }

                // Internal Owner
                try {
                    const pic = typeof ov.incharge_name === 'string' ? JSON.parse(ov.incharge_name) : ov.incharge_name;
                    // It might be an array or object
                    if (Array.isArray(pic) && pic.length > 0) setValue('internalOwner', pic[0].id); // or name? Form expects ID string probably for select
                    else setValue('internalOwner', pic?.id || '');
                } catch (e) { }

            } catch (err) {
                console.error(err);
                showAlert({ type: 'error', message: 'Failed to load Target data' });
            }
        };
        // Trigger only when dependencies ready to avoid overwriting with nulls if lists empty
        if (countries.length > 0 && industries.length > 0) fetchData();
    }, [id, countries.length, industries.length, setValue]);


    const onSubmit = async (data: FormValues, isDraft: boolean) => {
        try {
            // STEP 1: Company Overview (Core)
            const overviewFormData = new FormData();
            if (id) overviewFormData.append('seller_id', id); // Logic uses seller_id as PK

            overviewFormData.append('dealroomId', data.projectCode);
            overviewFormData.append('companyName', data.companyName);
            overviewFormData.append('originCountry', JSON.stringify(data.originCountry));
            overviewFormData.append('hq_country', String(data.originCountry?.id)); // Redundant but safe
            overviewFormData.append('companyRank', data.rank);
            overviewFormData.append('status', isDraft ? 'Draft' : 'Active');
            overviewFormData.append('details', data.projectDetails);
            overviewFormData.append('reason_for_mna', data.reasonForMA);
            overviewFormData.append('websiteLink', data.websiteUrl);
            overviewFormData.append('teaser_link', data.teaserLink);

            if (profileImage) {
                overviewFormData.append('profilePicture', profileImage);
            }

            // Industry Mapping: Send as array [Major, Middle]
            const indArray = [];
            if (data.industryMajor) indArray.push(data.industryMajor);
            if (data.industryMiddle) indArray.push(data.industryMiddle);
            overviewFormData.append('broderIndustries', JSON.stringify(indArray)); // Keeping backend name 'broderIndustries' (sic)

            // Contact
            overviewFormData.append('sellerSideContactPersonName', data.primaryContactName);
            overviewFormData.append('designationAndPosition', data.primaryContactDesignation);
            overviewFormData.append('emailAddress', data.primaryContactEmail);
            overviewFormData.append('contactPersons', JSON.stringify([{ phone: data.primaryContactPhone, isPrimary: true }]));

            // Internal Owner
            if (data.internalOwner) {
                const ownerObj = users.find(u => String(u.id) === String(data.internalOwner));
                if (ownerObj) overviewFormData.append('our_person_incharge', JSON.stringify([ownerObj]));
            }

            // Flags (Defaulting to false/empty for now to match minimal intake)
            overviewFormData.append('noPICNeeded', '0');

            const overviewRes = await api.post('/api/seller/company-overviews', overviewFormData);
            const savedSellerId = overviewRes.data.data; // The backend returns ID

            if (!savedSellerId) throw new Error("Failed to retrieve Saved Seller ID");

            // STEP 2: Financial Details
            const financePayload = {
                seller_id: savedSellerId,
                expected_investment_amount: data.desiredInvestmentMin + (data.desiredInvestmentMax ? ` - ${data.desiredInvestmentMax}` : ''), // Combining min-max to string
                default_currency: data.desiredInvestmentCurrency,
                maximum_investor_shareholding_percentage: data.plannedSaleShareRatio,
                is_draft: isDraft ? '2' : '1' // 1: Active, 2: Draft
            };
            await api.post('/api/seller/financial-details', financePayload);

            showAlert({ type: 'success', message: `Target ${isDraft ? 'draft' : ''} saved successfully` });
            navigate('/prospects?tab=targets');

        } catch (error) {
            console.error(error);
            showAlert({ type: 'error', message: 'Failed to save Target' });
        }
    };

    return (
        <form onSubmit={handleSubmit(d => onSubmit(d, false))} className="w-full max-w-4xl mx-auto pb-24 font-sans text-gray-900">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">{id ? 'Edit Target' : 'Target Registration'}</h2>
                    <p className="text-sm text-gray-500">Minimal intake form for new targets</p>
                </div>
                <div className="flex gap-3">
                    <button type="button" onClick={() => navigate('/prospects?tab=targets')} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                    <button type="button" onClick={handleSubmit(d => onSubmit(d, true))} disabled={isSubmitting} className="px-4 py-2 text-[#ECA234] bg-white border border-[#ECA234] rounded-lg hover:bg-orange-50">
                        Save Draft
                    </button>
                    <button type="submit" disabled={isSubmitting || (isIdAvailable === false)} className="px-6 py-2 text-white bg-[#ECA234] rounded-lg hover:bg-[#d8922b]">
                        {isSubmitting ? 'Saving...' : 'Save Target'}
                    </button>
                </div>
            </div>

            {/* SECTION A: SYSTEM & IDENTITY */}
            <CollapsibleSection title="System & Identity" defaultOpen={true}>
                <div className="mb-6 flex justify-center">
                    <LogoUpload
                        initialImage={initialProfileImage}
                        onImageSelect={(file) => setProfileImage(file)}
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <Label text="HQ Country (Triggers Project Code)" required />
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
                                className={`w-full px-4 py-2 border rounded-lg ${isIdAvailable === false ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                            />
                            <div className="absolute right-3">
                                {isCheckingId && <Loader2 className="animate-spin w-4" />}
                                {isIdAvailable === true && <Check className="text-green-500 w-4" />}
                            </div>
                        </div>
                    </div>

                    <div>
                        <Label text="Internal Owner (PIC)" required />
                        <Controller
                            control={control}
                            name="internalOwner"
                            rules={{ required: true }}
                            render={({ field }) => (
                                <SelectPicker
                                    options={users.map(u => ({ value: String(u.id), label: u.name }))}
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder="Select Person In-Charge"
                                />
                            )}
                        />
                        {errors.internalOwner && <span className="text-red-500 text-xs">Required</span>}
                    </div>

                    <div>
                        <Label text="Rank" required />
                        <Controller
                            control={control}
                            name="rank"
                            render={({ field }) => (
                                <SelectPicker
                                    options={[{ value: 'A', label: 'A - High Priority' }, { value: 'B', label: 'B - Standard' }, { value: 'C', label: 'C - Low' }]}
                                    value={field.value}
                                    onChange={field.onChange}
                                />
                            )}
                        />
                    </div>

                    <div className="md:col-span-2">
                        <Label text="Company Name (Optional at intake, required for active)" />
                        <Input {...register('companyName')} placeholder="Registered Company Entity Name" />
                    </div>
                </div>
            </CollapsibleSection>

            {/* SECTION B: CLASSIFICATION */}
            <CollapsibleSection title="Classification">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <Label text="Industry (Major)" required />
                        <Controller
                            control={control}
                            name="industryMajor"
                            rules={{ required: true }}
                            render={({ field }) => (
                                <Dropdown
                                    countries={industries.map(i => ({ id: i.id, name: i.name, flagSrc: '', status: 'registered' as const }))} // Reuse Dropdown generic interface
                                    selected={field.value ? { ...field.value, flagSrc: '', status: 'registered' as const } : null}
                                    onSelect={(val) => field.onChange(val)}
                                    placeholder="Select industry"
                                    searchPlaceholder="Search industry..."
                                />
                            )}
                        />
                        {errors.industryMajor && <span className="text-red-500 text-xs">Required</span>}
                    </div>

                    <div>
                        <Label text="Industry (Middle)" />
                        <Controller
                            control={control}
                            name="industryMiddle"
                            render={({ field }) => (
                                <Dropdown
                                    countries={availableMiddleIndustries.map(i => ({ id: i.id, name: i.name, flagSrc: '', status: 'registered' as const }))}
                                    selected={field.value ? { ...field.value, flagSrc: '', status: 'registered' as const } : null}
                                    onSelect={field.onChange}
                                    disabled={!selectedMajorIndustry}
                                    placeholder="Select sub-industry"
                                    searchPlaceholder="Search sub-industry..."
                                />
                            )}
                        />
                    </div>
                </div>
            </CollapsibleSection>

            {/* SECTION C: DEAL SUMMARY */}
            <CollapsibleSection title="Deal Summary">
                <div className="space-y-4">
                    <div>
                        <Label text="Project Details (Teaser)" required />
                        <textarea
                            {...register('projectDetails', { required: true })}
                            className="w-full border border-gray-300 rounded-lg p-3 min-h-[100px] focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none"
                            placeholder="Brief description of the deal..."
                        />
                        {errors.projectDetails && <span className="text-red-500 text-xs">Required</span>}
                    </div>

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
                        <select {...register('desiredInvestmentCurrency')} className="border border-gray-300 rounded-lg px-3 py-2 bg-white">
                            <option value="USD">USD</option>
                            <option value="THB">THB</option>
                            <option value="EUR">EUR</option>
                            <option value="JPY">JPY</option>
                        </select>
                    </div>
                </div>
            </CollapsibleSection>

            {/* SECTION D: PRIMARY CONTACT */}
            <CollapsibleSection title="Primary Contact">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label text="Contact Name" required />
                        <Input {...register('primaryContactName', { required: true })} leftIcon={<User className="w-4 h-4" />} />
                        {errors.primaryContactName && <span className="text-red-500 text-xs">Required</span>}
                    </div>
                    <div>
                        <Label text="Designation" />
                        <Input {...register('primaryContactDesignation')} placeholder="CEO, Director..." />
                    </div>
                    <div>
                        <Label text="Email" required />
                        <Input {...register('primaryContactEmail', { required: true })} type="email" />
                        {errors.primaryContactEmail && <span className="text-red-500 text-xs">Required</span>}
                    </div>
                    <div>
                        <Label text="Phone" required />
                        <Input {...register('primaryContactPhone', { required: true })} placeholder="+1 234..." />
                        {errors.primaryContactPhone && <span className="text-red-500 text-xs">Required</span>}
                    </div>
                </div>
            </CollapsibleSection>

            {/* SECTION E: LINKS & AUDIT */}
            <CollapsibleSection title="Links & Notes">
                <div className="space-y-4">
                    <div>
                        <Label text="Website URL" />
                        <div className="flex items-center">
                            <span className="p-2 bg-gray-100 border border-r-0 rounded-l border-gray-300"><LinkIcon className="w-4 h-4 text-gray-500" /></span>
                            <input {...register('websiteUrl')} className="w-full border border-gray-300 rounded-r px-3 py-2 outline-none focus:border-orange-400" placeholder="https://" />
                        </div>
                    </div>

                    <div>
                        <Label text="Teaser / Data Room Link" />
                        <Input {...register('teaserLink')} placeholder="Link to folder..." />
                    </div>

                    <div className="pt-4 border-t border-gray-100 mt-4">
                        <Label text="Audit & Activity Log" />
                        {id && <ActivityLogChat entityId={id} entityType="seller" />}
                        {!id && <p className="text-sm text-gray-400 italic">Audit log available after saving.</p>}
                    </div>
                </div>
            </CollapsibleSection>

        </form>
    );
};

export default TargetRegistration;
