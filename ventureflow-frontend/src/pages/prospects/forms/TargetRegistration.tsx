/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useForm, Controller, useWatch, useFieldArray } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, Loader2, Link as LinkIcon, Plus, Trash2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../../config/api';
import { getCachedCountries, getCachedCurrencies, getCachedIndustries } from '../../../utils/referenceDataCache';
import { showAlert } from '../../../components/Alert';
import { Dropdown, Country } from '../components/Dropdown';
import { IndustryDropdown, Industry as IndustryType } from '../components/IndustryDropdown';
import SelectPicker from '../../../components/SelectPicker';
import MultiSelectPicker from '../../../components/MultiSelectPicker';
import { LogoUpload } from '../../../components/LogoUpload';
import NumericInput from '../../../components/NumericInput';

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
    projectCode: string;
    originCountry: ExtendedCountry | null;
    status: string;
    rank: 'A' | 'B' | 'C' | '';
    internal_pic: any[];
    financialAdvisor: any[];
    companyName: string;

    // Classification
    targetIndustries: IndustryType[];
    nicheTags: string;

    // Deal Summary
    projectDetails: string;
    reasonForMA: string[];

    desiredInvestmentMin: string;
    desiredInvestmentMax: string;
    desiredInvestmentCurrency: string;
    investmentCondition: string[];

    ebitdaMin: string;
    ebitdaMax: string;
    ebitdaTimes: string;
    ebitdaDetails: string;

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
    hqAddresses: { label: string; address: string }[];
    teaserLink: string;
    introducedProjects: Country[];
    channel: string;
}

const REASONS_MA = [
    { value: "Owner's Retirement", label: "Owner's Retirement" },
    { value: 'Business Succession', label: 'Business Succession' },
    { value: 'Full Exit', label: 'Full Exit' },
    { value: 'Partial Exit', label: 'Partial Exit' },
    { value: 'Capital Raising', label: 'Capital Raising' },
    { value: 'Strategic Partnership', label: 'Strategic Partnership' },
    { value: 'Growth Acceleration', label: 'Growth Acceleration' },
    { value: 'Debt Restructuring', label: 'Debt Restructuring' },
    { value: 'Risk Mitigation', label: 'Risk Mitigation' },
    { value: 'Non-Core Divestment', label: 'Non-Core Divestment' },
    { value: 'Market Expansion', label: 'Market Expansion' },
    { value: 'Technology Integration', label: 'Technology Integration' },
    { value: 'Cross-Border Expansion', label: 'Cross-Border Expansion' },
];

const INVESTMENT_CONDITIONS = [
    { value: 'Minority (<50%)', label: 'Minority (<50%)' },
    { value: 'Significant minority (25–49%)', label: 'Significant minority (25–49%)' },
    { value: 'Joint control (51/49)', label: 'Joint control (51/49)' },
    { value: 'Majority (51–99%)', label: 'Majority (51–99%)' },
    { value: 'Full acquisition (100%)', label: 'Full acquisition (100%)' },
    { value: 'Flexible', label: 'Flexible' },
];

const CHANNEL_OPTIONS = [
    { id: 1, name: 'TCF' },
    { id: 2, name: 'Partner' },
    { id: 3, name: 'Website' },
    { id: 4, name: 'Social Media' },
];

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

export const TargetRegistration: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { t } = useTranslation();

    const [countries, setCountries] = useState<ExtendedCountry[]>([]);
    const [industries, setIndustries] = useState<Industry[]>([]);
    const [currencies, setCurrencies] = useState<{ id: number; currency_code: string }[]>([]);
    const [staffList, setStaffList] = useState<any[]>([]);
    const [partnerList, setPartnerList] = useState<any[]>([]);
    const [investorList, setInvestorList] = useState<any[]>([]); // registered buyers for Introduced Projects

    const [profileImage, setProfileImage] = useState<File | null>(null);
    const [initialProfileImage, setInitialProfileImage] = useState<string | undefined>(undefined);

    const [isIdAvailable, setIsIdAvailable] = useState<boolean | null>(null);
    const [isCheckingId, setIsCheckingId] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(!!id); // true if in edit mode

    // Section navigation
    const [activeSection, setActiveSection] = useState(0);
    const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
    const setSectionRef = useCallback((index: number) => (el: HTMLDivElement | null) => {
        sectionRefs.current[index] = el;
    }, []);

    const sections = [
        { key: 'identity', label: t('prospects.registration.identity') },
        { key: 'companyProfile', label: t('prospects.registration.companyProfile') },
        { key: 'dealContext', label: t('prospects.registration.dealContext') },
        { key: 'contacts', label: t('prospects.registration.contacts') },
        { key: 'documents', label: t('prospects.registration.documentsRelationships') },
    ];

    // Track active section on scroll
    useEffect(() => {
        const observers: IntersectionObserver[] = [];
        sectionRefs.current.forEach((ref, idx) => {
            if (!ref) return;
            const observer = new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting) setActiveSection(idx);
                },
                { rootMargin: '-120px 0px -60% 0px', threshold: 0 }
            );
            observer.observe(ref);
            observers.push(observer);
        });
        return () => observers.forEach(o => o.disconnect());
    }, [isLoadingData]);

    const scrollToSection = (index: number) => {
        const el = sectionRefs.current[index];
        if (el) {
            const y = el.getBoundingClientRect().top + window.scrollY - 110;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    };

    const { control, handleSubmit, setValue, register, formState: { errors, isSubmitting } } = useForm<FormValues>({
        defaultValues: {
            projectCode: '',
            rank: '',
            status: 'Active',
            desiredInvestmentCurrency: '',
            targetIndustries: [],
            internal_pic: [],
            financialAdvisor: [],
            introducedProjects: [],
            contacts: [{ name: '', designation: '', department: '', email: '', phone: '', isPrimary: true }],
            websiteLinks: [{ url: '' }],
            hqAddresses: [{ label: '', address: '' }],
            channel: '',
            primaryContactParams: "0",

            // Deal Context Defaults
            reasonForMA: [],
            investmentCondition: [],

            desiredInvestmentMin: '',
            desiredInvestmentMax: '',
            ebitdaMin: '',
            ebitdaMax: '',
            ebitdaTimes: '',
            ebitdaDetails: '',
            projectDetails: '',
        }
    });

    const { fields: contactFields, append: appendContact, remove: removeContact } = useFieldArray({ control, name: 'contacts' });
    const { fields: websiteFields, append: appendWebsite, remove: removeWebsite } = useFieldArray({ control, name: 'websiteLinks' });
    const { fields: addressFields, append: appendAddress, remove: removeAddress } = useFieldArray({ control, name: 'hqAddresses' });

    const originCountry = useWatch({ control, name: 'originCountry' });
    const projectCodeValue = useWatch({ control, name: 'projectCode' });
    const primaryContactParams = useWatch({ control, name: 'primaryContactParams' });
    const companyNameValue = useWatch({ control, name: 'companyName' });

    // "Project + Full Code" toggle
    const [projectNameMode, setProjectNameMode] = useState(false);

    const getProjectName = useCallback(() => {
        return projectCodeValue ? `Project ${projectCodeValue}` : 'Project';
    }, [projectCodeValue]);

    // When toggle turns ON → set company name
    useEffect(() => {
        if (projectNameMode) {
            setValue('companyName', getProjectName());
        }
    }, [projectNameMode, getProjectName, setValue]);

    // When project code changes while toggle is ON → update the name
    useEffect(() => {
        if (projectNameMode && projectCodeValue) {
            setValue('companyName', getProjectName());
        }
    }, [projectCodeValue, projectNameMode, getProjectName, setValue]);

    // Auto-detect projectNameMode on edit load (if companyName matches "Project XX-X-XXX")
    useEffect(() => {
        if (companyNameValue && /^Project [A-Z]{2}-[SB]-\d{3}$/i.test(companyNameValue) && !projectNameMode) {
            setProjectNameMode(true);
        }
        // Only run on initial load
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoadingData]);

    // Fetch Initial Data
    useEffect(() => {
        const fetchInit = async () => {
            try {
                const [countryData, indData, staffRes, partRes, currData] = await Promise.all([
                    getCachedCountries(),
                    getCachedIndustries(),
                    api.get('/api/employees/fetch'),
                    api.get('/api/partners/fetch'),
                    getCachedCurrencies()
                ]);

                setCurrencies(currData);

                setCountries(countryData.map((c: any) => ({
                    id: c.id,
                    name: c.name,
                    alpha: c.alpha_2_code,
                    flagSrc: c.svg_icon_url || c.flagSrc,
                    status: 'registered' as const,
                })));

                setIndustries(indData as any);

                const sData = Array.isArray(staffRes.data) ? staffRes.data : (staffRes.data?.data || []);
                setStaffList(sData.filter((s: any) => s.id).map((s: any) => ({
                    id: s.id,
                    name: s.full_name || s.name || `${s.first_name || ''} ${s.last_name || ''}`.trim(),
                    flagSrc: '',
                    status: 'registered'
                })));

                const pData = Array.isArray(partRes.data) ? partRes.data : (partRes.data?.data || []);
                const mappedPartners = pData.map((p: any) => ({
                    id: p.id,
                    name: p.reg_name || p.name,
                    flagSrc: '',
                    status: 'registered' as const
                }));
                setPartnerList([{ id: 'na', name: 'N/A', flagSrc: '', status: 'registered' as const }, ...mappedPartners]);

                // Fetch registered investors (buyers) for Introduced Projects dropdown
                const investorRes = await api.get('/api/buyer/fetch');
                const invData = Array.isArray(investorRes.data) ? investorRes.data : (investorRes.data?.data || []);
                setInvestorList(invData.map((b: any) => ({
                    id: b.id,
                    name: `${b.code} — ${b.name}`,
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
            setIsLoadingData(true);
            try {
                const response = await api.get(`/api/seller/${id}`);
                const seller = response.data?.data;
                const ov = seller.company_overview || seller.companyOverview || {};
                const fin = seller.financial_details || seller.financialDetails || {};

                setValue('projectCode', seller.seller_id);
                setValue('status', seller.status === '1' ? 'Active' : (seller.status === '2' ? 'Draft' : 'Active'));
                setValue('companyName', ov.reg_name || '');
                setValue('rank', ov.company_rank || 'B');
                setValue('channel', ov.channel || 'TCF');
                setValue('projectDetails', ov.details || '');
                const parseMulti = (val: any) => {
                    if (!val) return [];
                    if (Array.isArray(val)) return val;
                    try { const p = JSON.parse(val); if (Array.isArray(p)) return p; } catch { /* ignored */ }
                    return val ? [val] : [];
                };
                setValue('reasonForMA', parseMulti(ov.reason_ma || ov.reason_for_mna));
                setValue('teaserLink', ov.teaser_link || '');

                try {
                    const rawAddr = ov.hq_address;
                    let addrs: any[] = [];
                    if (rawAddr) {
                        addrs = typeof rawAddr === 'string' ? JSON.parse(rawAddr) : rawAddr;
                    }
                    if (addrs && Array.isArray(addrs) && addrs.length > 0) {
                        setValue('hqAddresses', addrs);
                    }
                } catch (e) { console.error("Address load error", e); }

                // Website Links Load
                try {
                    let links: any[] = [];
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
                        const formatted = intro.map((i: any) => ({
                            id: i.id || Date.now() + Math.random(),
                            name: i.name || '',
                            flagSrc: i.flagSrc || '',
                            status: i.status || 'registered' as const,
                        }));
                        setValue('introducedProjects', formatted);
                    }
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                } catch (e) { /* ignored */ }

                if (seller.image) {
                    const baseURL = import.meta.env.VITE_API_BASE_URL || '';
                    const isUrl = seller.image.startsWith('http');
                    const imagePath = isUrl ? seller.image : `${baseURL}/storage/${seller.image.replace(/^\//, '')}`;
                    setInitialProfileImage(imagePath);
                }

                const countryData = ov.hq_country;
                if (countryData) {
                    if (typeof countryData === 'object' && countryData.id) {
                        setValue('originCountry', {
                            id: countryData.id,
                            name: countryData.name || '',
                            alpha: countryData.alpha_2_code || '',
                            flagSrc: countryData.svg_icon_url || '',
                            status: 'registered'
                        });
                    } else if (typeof countryData === 'number' || typeof countryData === 'string') {
                        const c = countries.find(x => x.id == countryData);
                        if (c) setValue('originCountry', c);
                    }
                }

                try {
                    const ops = typeof ov.industry_ops === 'string' ? JSON.parse(ov.industry_ops) : ov.industry_ops;
                    if (Array.isArray(ops)) {
                        const sanitized = ops.map((op: any) => {
                            if (typeof op === 'object' && op !== null) return op;
                            const found = industries.find(i => i.name === op);
                            return found || { id: Date.now() + Math.random(), name: op };
                        });
                        setValue('targetIndustries', sanitized);
                    }
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                } catch (e) { /* ignored */ }

                const invAmount = typeof fin.expected_investment_amount === 'string' ? { min: fin.expected_investment_amount, max: '' } : (fin.expected_investment_amount || { min: '', max: '' });
                setValue('desiredInvestmentMin', invAmount.min || '');
                setValue('desiredInvestmentMax', invAmount.max || '');
                setValue('desiredInvestmentCurrency', fin.default_currency || '');

                const ebitdaVal = typeof fin.ebitda_value === 'string' ? { min: fin.ebitda_value, max: '' } : (fin.ebitda_value || { min: '', max: '' });
                setValue('ebitdaMin', ebitdaVal.min || fin.ttm_profit || '');

                // EBITDA Times — may be stored as number, string, or legacy JSON
                const rawTimes = fin.ebitda_times;
                if (rawTimes !== null && rawTimes !== undefined) {
                    if (typeof rawTimes === 'number' || (typeof rawTimes === 'string' && /^\d+(\.\d+)?$/.test(rawTimes))) {
                        setValue('ebitdaTimes', String(rawTimes));
                    }
                }
                setValue('ebitdaDetails', fin.ebitda_details || '');

                setValue('investmentCondition', parseMulti(fin.investment_condition));

                // Contacts Loading
                try {
                    const contactsRaw = ov.contacts || ov.seller_phone || ov.contact_persons;
                    let parsedContacts: any[] = [];
                    if (typeof contactsRaw === 'string') {
                        parsedContacts = JSON.parse(contactsRaw);
                    } else if (Array.isArray(contactsRaw)) {
                        parsedContacts = contactsRaw;
                    }
                    if (!parsedContacts || parsedContacts.length === 0) {
                        if (ov.seller_contact_name || ov.seller_email) {
                            parsedContacts.push({
                                name: ov.seller_contact_name || '',
                                designation: ov.seller_designation || '',
                                email: ov.seller_email || '',
                                phone: '',
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
                showAlert({ type: 'error', message: t('prospects.registration.failedToLoadTarget') });
            }
        };

        if (countries.length > 0 && industries.length > 0) fetchData().finally(() => setIsLoadingData(false));
        else if (!id) setIsLoadingData(false);
    }, [id, countries.length, industries.length, setValue]);


    const onSubmit = async (data: FormValues, isDraft: boolean = false) => {
        try {
            const overviewFormData = new FormData();
            if (id) overviewFormData.append('seller_id', id);

            overviewFormData.append('dealroomId', data.projectCode);
            overviewFormData.append('companyName', data.companyName);
            overviewFormData.append('hq_country', String(data.originCountry?.id));
            overviewFormData.append('companyRank', data.rank);
            overviewFormData.append('status', isDraft ? 'Draft' : 'Active');
            overviewFormData.append('details', data.projectDetails);
            overviewFormData.append('reason_for_mna', JSON.stringify(data.reasonForMA || []));
            overviewFormData.append('website_links', JSON.stringify(data.websiteLinks));
            overviewFormData.append('hq_address', JSON.stringify(data.hqAddresses));
            overviewFormData.append('websiteLink', data.websiteLinks[0]?.url || '');
            overviewFormData.append('teaser_link', data.teaserLink);

            if (profileImage) {
                overviewFormData.append('profilePicture', profileImage);
            }

            overviewFormData.append('broderIndustries', JSON.stringify(data.targetIndustries || []));

            const sanitizedContacts = data.contacts.map((c, idx) => ({
                ...c,
                isPrimary: String(data.primaryContactParams) === String(idx)
            }));
            const primaryContact = sanitizedContacts.find(c => c.isPrimary) || sanitizedContacts[0];

            overviewFormData.append('sellerSideContactPersonName', primaryContact?.name || '');
            overviewFormData.append('designationAndPosition', primaryContact?.designation || '');
            overviewFormData.append('emailAddress', primaryContact?.email || '');
            overviewFormData.append('contactPersons', JSON.stringify(sanitizedContacts));

            overviewFormData.append('internal_pic', JSON.stringify(data.internal_pic || []));
            overviewFormData.append('financial_advisor', JSON.stringify(data.financialAdvisor || []));
            overviewFormData.append('introduced_projects', JSON.stringify(data.introducedProjects || []));
            overviewFormData.append('channel', data.channel || '');
            overviewFormData.append('noPICNeeded', '0');

            const overviewRes = await api.post('/api/seller/company-overviews', overviewFormData);
            const savedSellerId = overviewRes.data.data;

            if (!savedSellerId) throw new Error("Failed to retrieve Saved Seller ID");

            const financePayload = {
                seller_id: savedSellerId,
                expected_investment_amount: {
                    min: data.desiredInvestmentMin,
                    max: data.desiredInvestmentMax
                },
                default_currency: data.desiredInvestmentCurrency,

                ebitda_value: {
                    min: data.ebitdaMin,
                    max: ''
                },
                ebitda_times: data.ebitdaTimes || null,
                ebitda_details: data.ebitdaDetails || null,
                investment_condition: JSON.stringify(data.investmentCondition || []),
                is_draft: isDraft ? '2' : '1'
            };
            await api.post('/api/seller/financial-details', financePayload);

            showAlert({ type: 'success', message: isDraft ? t('prospects.registration.targetDraftSaved') : t('prospects.registration.targetSavedSuccess') });
            navigate(`/prospects/target/${savedSellerId}`);

        } catch (error: any) {
            const errorMsg = error.response?.data?.message || t('prospects.registration.failedToSaveTarget');
            showAlert({ type: 'error', message: errorMsg });
            if (errorMsg.toLowerCase().includes('project code') || errorMsg.toLowerCase().includes('id')) {
                setIsIdAvailable(false);
            }
        }
    };

    /* ─── shared input styles ─── */
    const inputClass = "w-full h-11 px-3 py-2 bg-white rounded-[3px] border border-gray-300 text-sm font-normal  text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-300 transition-colors";

    if (isLoadingData) {
        return (
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
        );
    }

    return (
        <form onSubmit={handleSubmit(d => onSubmit(d, false))} className="w-full pb-24 ">
            {/* ═══ Sticky Section Tabs ═══ */}
            <div className="sticky top-0 z-40 bg-white border-b border-gray-200 mb-8">
                <div className="max-w-[1197px] mx-auto flex">
                    {sections.map((s, idx) => (
                        <button
                            key={s.key}
                            type="button"
                            onClick={() => scrollToSection(idx)}
                            className={`flex-1 py-3 text-sm font-medium text-center transition-colors border-b-2 ${activeSection === idx
                                ? 'text-[#064771] border-[#064771]'
                                : 'text-gray-400 border-transparent hover:text-gray-600 hover:border-gray-300'
                                }`}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-[1197px] mx-auto flex flex-col gap-12">

                {/* ═══════════════════════════════════════════════
                    SECTION 1: IDENTITY
                ═══════════════════════════════════════════════ */}
                <div ref={setSectionRef(0)} className="flex flex-col gap-10">
                    <SectionHeader title={t('prospects.registration.identity')} />

                    <div className="flex items-start gap-12">
                        {/* Company Avatar - LEFT side */}
                        <div className="flex flex-col items-center gap-3.5 shrink-0 w-36">
                            <LogoUpload
                                initialImage={initialProfileImage}
                                onImageSelect={(file) => setProfileImage(file)}
                            />
                        </div>

                        {/* Identity Fields - RIGHT side */}
                        <div className="flex-1 flex flex-col gap-10">
                            {/* Row: Origin Country + Project Code */}
                            <div className="flex gap-6">
                                <div className="flex-1">
                                    <FieldLabel text={t('prospects.registration.originCountry')} required />
                                    <Controller
                                        control={control}
                                        name="originCountry"
                                        rules={{ required: true }}
                                        render={({ field }) => (
                                            <Dropdown
                                                countries={countries}
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                placeholder={t('prospects.registration.selectOption')}
                                                searchPlaceholder={t('prospects.registration.searchCountry')}
                                            />
                                        )}
                                    />
                                    {errors.originCountry && <span className="text-red-500 text-xs mt-1">{t('prospects.registration.required')}</span>}
                                </div>
                                <div className="flex-1">
                                    <FieldLabel text={t('prospects.registration.projectCode')} required />
                                    <div className="relative flex items-center">
                                        <input
                                            {...register('projectCode')}
                                            className={`${inputClass} ${isIdAvailable === false ? 'border-red-500 bg-red-50' : isIdAvailable === true ? 'border-green-500 bg-green-50' : ''}`}
                                            placeholder={t('prospects.registration.projectCodePlaceholderTarget')}
                                        />
                                        <div className="absolute right-3 flex items-center gap-2">
                                            {isCheckingId && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                                            {!isCheckingId && isIdAvailable === true && <Check className="w-4 h-4 text-green-500" />}
                                            {!isCheckingId && isIdAvailable === false && <AlertCircle className="w-4 h-4 text-red-500" />}
                                        </div>
                                    </div>
                                    {isIdAvailable === false && <p className="text-red-500 text-xs mt-1">{t('prospects.registration.codeAlreadyInUse')}</p>}
                                </div>
                            </div>

                            {/* Row: Rank + Lead Channel */}
                            <div className="flex gap-6">
                                <div className="flex-1">
                                    <FieldLabel text={t('prospects.registration.rank')} />
                                    <Controller
                                        control={control}
                                        name="rank"
                                        render={({ field }) => (
                                            <SelectPicker
                                                options={[
                                                    { value: 'A', label: t('prospects.registration.rankA') },
                                                    { value: 'B', label: t('prospects.registration.rankB') },
                                                    { value: 'C', label: t('prospects.registration.rankC') }
                                                ]}
                                                value={field.value}
                                                onChange={field.onChange}
                                                placeholder={t('prospects.registration.selectRank')}
                                            />
                                        )}
                                    />
                                </div>
                                <div className="flex-1">
                                    <FieldLabel text={t('prospects.registration.leadChannel')} />
                                    <Controller
                                        control={control}
                                        name="channel"
                                        render={({ field }) => (
                                            <SelectPicker
                                                options={CHANNEL_OPTIONS.map(o => ({ value: o.name, label: o.name }))}
                                                value={field.value}
                                                onChange={field.onChange}
                                                placeholder={t('prospects.registration.leadChannelPlaceholder')}
                                            />
                                        )}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════
                    SECTION 2: COMPANY PROFILE
                ═══════════════════════════════════════════════ */}
                <div ref={setSectionRef(1)} className="flex flex-col gap-10">
                    <SectionHeader title={t('prospects.registration.companyProfile')} />

                    <div className="flex flex-col gap-8">
                        {/* Row: Company Name + Industry */}
                        <div className="flex gap-7">
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <FieldLabel text={t('prospects.registration.companyName')} required />
                                    <label className="flex items-center gap-2 cursor-pointer select-none" title={!originCountry ? 'Select an origin country first' : 'Use project code as company name'}>
                                        <span className="text-xs text-gray-500">Use as Project</span>
                                        <button
                                            type="button"
                                            role="switch"
                                            aria-checked={projectNameMode}
                                            disabled={!originCountry}
                                            onClick={() => {
                                                if (projectNameMode) {
                                                    // Turning OFF → clear the auto name so user can type
                                                    setProjectNameMode(false);
                                                    setValue('companyName', '');
                                                } else {
                                                    // Turning ON
                                                    setProjectNameMode(true);
                                                }
                                            }}
                                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${projectNameMode ? 'bg-[#064771]' : 'bg-gray-300'
                                                } ${!originCountry ? 'opacity-40 cursor-not-allowed' : ''}`}
                                        >
                                            <span
                                                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${projectNameMode ? 'translate-x-[18px]' : 'translate-x-[3px]'
                                                    }`}
                                            />
                                        </button>
                                    </label>
                                </div>
                                <input
                                    {...register('companyName', { required: true })}
                                    className={`${inputClass} ${projectNameMode ? 'bg-gray-50 text-gray-500' : ''}`}
                                    placeholder={t('prospects.registration.enterCompanyName')}
                                    readOnly={projectNameMode}
                                    onChange={(e) => {
                                        // If user types while toggle is ON, auto-turn it off
                                        if (projectNameMode) {
                                            setProjectNameMode(false);
                                        }
                                        register('companyName').onChange(e);
                                    }}
                                />
                                {errors.companyName && <span className="text-red-500 text-xs mt-1">{t('prospects.registration.required')}</span>}
                            </div>
                            <div className="flex-1">
                                <FieldLabel text={t('prospects.registration.industry')} required />
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
                                            placeholder={t('prospects.registration.selectFromIndustries')}
                                        />
                                    )}
                                />
                                {errors.targetIndustries && <span className="text-red-500 text-xs mt-1">{t('prospects.registration.required')}</span>}
                            </div>
                        </div>

                        {/* Website links */}
                        <div className="flex flex-col gap-3">
                            <div className="flex flex-col gap-2">
                                <FieldLabel text={t('prospects.registration.website')} />
                                {websiteFields.map((field, index) => (
                                    <div key={field.id} className="flex items-center">
                                        <div className="w-11 h-11 bg-gray-50 rounded-tl-[3px] rounded-bl-[3px] border-l border-t border-b border-gray-300 flex items-center justify-center">
                                            <LinkIcon className="w-5 h-5 text-gray-500" />
                                        </div>
                                        <input
                                            {...register(`websiteLinks.${index}.url` as const)}
                                            type="text"
                                            placeholder={t('prospects.registration.websitePlaceholder')}
                                            className="flex-1 h-11 px-3 py-2 bg-white rounded-tr-[3px] rounded-br-[3px] border border-gray-300 text-sm font-normal  text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-300"
                                        />
                                        {websiteFields.length > 1 && (
                                            <button type="button" onClick={() => removeWebsite(index)} className="ml-2 text-red-400 hover:text-red-600 transition-colors" title="Remove website link" aria-label="Remove website link">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={() => appendWebsite({ url: '' })}
                                className="flex items-center gap-2 text-[#064771] text-sm font-medium  hover:underline w-fit"
                            >
                                <Plus className="w-3 h-3" /> {t('prospects.registration.addAnotherLink')}
                            </button>
                        </div>

                        {/* Addresses / Entities */}
                        <div className="flex flex-col gap-3">
                            <div className="flex flex-col gap-2">
                                <FieldLabel text={t('prospects.registration.addressesEntities')} />
                                {addressFields.map((field, index) => (
                                    <div key={field.id} className="flex items-center gap-4">
                                        <input
                                            {...register(`hqAddresses.${index}.label` as const)}
                                            placeholder={t('prospects.registration.entityNamePlaceholder')}
                                            className={`w-1/3 h-11 px-3 py-2 bg-white rounded-[3px] border border-gray-300 text-sm font-normal  text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-300 transition-shadow`}
                                        />
                                        <div className="flex-1 flex items-center gap-2">
                                            <input
                                                {...register(`hqAddresses.${index}.address` as const)}
                                                placeholder={t('prospects.registration.fullAddressPlaceholder')}
                                                className={`flex-1 h-11 px-3 py-2 bg-white rounded-[3px] border border-gray-300 text-sm font-normal  text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-300 transition-shadow`}
                                            />
                                            {addressFields.length > 1 && (
                                                <button type="button" onClick={() => removeAddress(index)} className="text-red-400 hover:text-red-600 transition-colors" title="Remove address" aria-label="Remove address">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={() => appendAddress({ label: '', address: '' })}
                                className="flex items-center gap-2 text-[#064771] text-sm font-medium  hover:underline w-fit"
                            >
                                <Plus className="w-4 h-4" /> {t('prospects.registration.addAnotherAddress')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════
                    SECTION 3: DEAL CONTEXT
                ═══════════════════════════════════════════════ */}
                <div ref={setSectionRef(2)} className="flex flex-col gap-10">
                    <SectionHeader title={t('prospects.registration.dealContext')} />

                    <div className="flex flex-col gap-8">
                        {/* Row: Purpose of M&A + Investment Condition */}
                        <div className="flex gap-6">
                            <div className="flex-1">
                                <FieldLabel text={t('prospects.registration.purposeMA')} />
                                <Controller
                                    control={control}
                                    name="reasonForMA"
                                    render={({ field }) => (
                                        <MultiSelectPicker
                                            options={REASONS_MA}
                                            value={field.value || []}
                                            onChange={field.onChange}
                                            placeholder={t('prospects.registration.selectPurposeMA')}
                                        />
                                    )}
                                />
                            </div>
                            <div className="flex-1">
                                <FieldLabel text={t('prospects.registration.investmentCondition')} />
                                <Controller
                                    control={control}
                                    name="investmentCondition"
                                    render={({ field }) => (
                                        <MultiSelectPicker
                                            options={INVESTMENT_CONDITIONS}
                                            value={field.value || []}
                                            onChange={field.onChange}
                                            placeholder={t('prospects.registration.selectInvestmentCondition')}
                                        />
                                    )}
                                />
                            </div>
                        </div>

                        {/* Row: Desired Investment Range (full width) */}
                        <div>
                            <FieldLabel text={t('prospects.registration.desiredInvestmentRange')} />
                            <div className="flex gap-6">
                                <div className="flex-1">
                                    <Controller
                                        control={control}
                                        name="desiredInvestmentMin"
                                        render={({ field }) => (
                                            <NumericInput
                                                value={field.value}
                                                onChange={field.onChange}
                                                placeholder={t('prospects.registration.minPlaceholder')}
                                                className={`w-full ${inputClass}`}
                                            />
                                        )}
                                    />
                                </div>
                                <div className="flex-1 relative">
                                    <span className="absolute -left-3 top-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-400 text-base font-normal">—</span>
                                    <Controller
                                        control={control}
                                        name="desiredInvestmentMax"
                                        render={({ field }) => (
                                            <NumericInput
                                                value={field.value}
                                                onChange={field.onChange}
                                                placeholder={t('prospects.registration.maxPlaceholder')}
                                                className={`w-full ${inputClass}`}
                                            />
                                        )}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Row: EBITDA + EBITDA Times | Default Currency */}
                        <div className="flex gap-6">
                            <div className="flex-1">
                                <div className="flex gap-3">
                                    <div className="flex-[3]">
                                        <FieldLabel text={t('prospects.registration.ebitda')} />
                                        <Controller
                                            control={control}
                                            name="ebitdaMin"
                                            render={({ field }) => (
                                                <NumericInput
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    placeholder={t('prospects.registration.ebitdaPlaceholder')}
                                                    className={inputClass}
                                                />
                                            )}
                                        />
                                    </div>
                                    <div className="flex-[2]">
                                        <FieldLabel text="EBITDA Times" />
                                        <input
                                            type="number"
                                            step="any"
                                            min="0"
                                            {...register('ebitdaTimes')}
                                            className={inputClass}
                                            placeholder="e.g. 5"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1">
                                <FieldLabel text={t('prospects.registration.defaultCurrency')} />
                                <Controller
                                    control={control}
                                    name="desiredInvestmentCurrency"
                                    render={({ field }) => (
                                        <SelectPicker
                                            options={currencies.map(c => ({ value: c.currency_code, label: c.currency_code }))}
                                            value={field.value}
                                            onChange={field.onChange}
                                            placeholder={t('prospects.registration.selectDefaultCurrency')}
                                        />
                                    )}
                                />
                            </div>
                        </div>

                        {/* EBITDA Details */}
                        <div>
                            <FieldLabel text="EBITDA Details" />
                            <textarea
                                {...register('ebitdaDetails')}
                                className="w-full px-3 py-2 bg-white rounded-[3px] border border-gray-300 text-sm font-normal text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-300 min-h-[80px] resize-y"
                                placeholder="Enter EBITDA details, notes, or breakdown..."
                            />
                        </div>


                        {/* Project Details */}
                        <div>
                            <FieldLabel text={t('prospects.registration.projectDetails')} />
                            <textarea
                                {...register('projectDetails')}
                                className="w-full px-3 py-2 bg-white rounded-[3px] border border-gray-300 text-sm font-normal  text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-300 min-h-[100px] resize-y"
                                placeholder={t('prospects.registration.projectDetailsPlaceholder')}
                            />
                        </div>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════
                    SECTION 4: CONTACTS
                ═══════════════════════════════════════════════ */}
                <div ref={setSectionRef(3)} className="flex flex-col items-center gap-10">
                    <div className="self-stretch">
                        <SectionHeader title={t('prospects.registration.contacts')} />
                    </div>

                    {contactFields.map((field, index) => (
                        <div key={field.id} className="self-stretch px-5 py-4 bg-gray-50 rounded-[3px] border border-gray-300 flex flex-col gap-5">
                            <div className="flex flex-col gap-8">
                                {/* Row: Name + Designation + Department */}
                                <div className="flex gap-7">
                                    <div className="flex-1">
                                        <FieldLabel text={t('prospects.registration.name')} />
                                        <input
                                            {...register(`contacts.${index}.name` as const)}
                                            placeholder={t('prospects.registration.contactNamePlaceholder')}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <FieldLabel text={t('prospects.registration.designation')} />
                                        <input
                                            {...register(`contacts.${index}.designation` as const)}
                                            placeholder={t('prospects.registration.designationPlaceholder')}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <FieldLabel text={t('prospects.registration.department')} />
                                        <input
                                            {...register(`contacts.${index}.department` as const)}
                                            placeholder={t('prospects.registration.departmentPlaceholder')}
                                            className={inputClass}
                                        />
                                    </div>
                                </div>

                                {/* Row: Phone + Email + Toggle/Delete */}
                                <div className="flex items-end gap-7">
                                    <div className="flex-1">
                                        <FieldLabel text={t('prospects.registration.phone')} />
                                        <input
                                            {...register(`contacts.${index}.phone` as const)}
                                            placeholder={t('prospects.registration.phonePlaceholder')}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <FieldLabel text={t('prospects.registration.email')} />
                                        <input
                                            {...register(`contacts.${index}.email` as const)}
                                            placeholder={t('prospects.registration.emailPlaceholder')}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div className="flex-1 flex items-center gap-9 pb-2">
                                        {/* Primary Contact Toggle */}
                                        <label className={`flex items-center gap-3 cursor-pointer select-none ${String(primaryContactParams) === String(index) ? 'opacity-100' : 'opacity-75 hover:opacity-100'}`}>
                                            <div className="relative">
                                                <input
                                                    type="radio"
                                                    value={index}
                                                    {...register('primaryContactParams')}
                                                    className="sr-only peer"
                                                    disabled={String(primaryContactParams) === String(index)}
                                                />
                                                <div className={`w-[44px] h-[24px] rounded-full transition-all duration-300 ease-in-out ${String(primaryContactParams) === String(index) ? 'bg-[#064771] shadow-inner' : 'bg-gray-300'}`}>
                                                    <div className={`w-[20px] h-[20px] bg-white rounded-full absolute top-[2px] transition-all duration-300 ease-in-out shadow-md ${String(primaryContactParams) === String(index) ? 'left-[22px]' : 'left-[2px]'}`} />
                                                </div>
                                            </div>
                                            <span className={`text-sm  transition-colors ${String(primaryContactParams) === String(index) ? 'text-gray-900 font-medium' : 'text-gray-500 font-normal'}`}>
                                                {String(primaryContactParams) === String(index) ? t('prospects.registration.primaryContact') : t('prospects.registration.setAsPrimary')}
                                            </span>
                                        </label>

                                        {/* Delete Button Logic */}
                                        {contactFields.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeContact(index)}
                                                disabled={String(primaryContactParams) === String(index)}
                                                className={`flex items-center gap-2 transition-colors ${String(primaryContactParams) === String(index)
                                                    ? 'text-gray-400 cursor-not-allowed'
                                                    : 'text-gray-400 hover:text-red-500 cursor-pointer'
                                                    }`}
                                            >
                                                <Trash2 className="w-5 h-5" />
                                                <span className="text-sm font-normal ">{t('prospects.registration.delete')}</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={() => appendContact({ name: '', designation: '', department: '', email: '', phone: '', isPrimary: false })}
                        className="self-stretch flex items-center gap-3 text-sky-900 text-base font-medium "
                    >
                        <Plus className="w-4 h-4" /> {t('prospects.registration.addAnotherContact')}
                    </button>
                </div>

                {/* ═══════════════════════════════════════════════
                    SECTION 5: DOCUMENTS & RELATIONSHIPS
                ═══════════════════════════════════════════════ */}
                <div ref={setSectionRef(4)} className="flex flex-col gap-10">
                    <SectionHeader title={t('prospects.registration.documentsRelationships')} />

                    <div className="flex flex-col gap-8">
                        {/* Row: Assigned PIC + Financial Advisor */}
                        <div className="flex gap-8">
                            <div className="flex-1">
                                <FieldLabel text={t('prospects.registration.assignedPIC')} />
                                <Controller
                                    control={control}
                                    name="internal_pic"
                                    render={({ field }) => (
                                        <Dropdown
                                            countries={staffList}
                                            selected={field.value}
                                            onSelect={(selected) => field.onChange(selected)}
                                            multiSelect={true}
                                            placeholder={t('prospects.registration.selectInternalStaff')}
                                            searchPlaceholder={t('prospects.registration.searchStaffNames')}
                                        />
                                    )}
                                />
                            </div>
                            <div className="flex-1">
                                <FieldLabel text={t('prospects.registration.financialAdvisorRoles')} />
                                <Controller
                                    control={control}
                                    name="financialAdvisor"
                                    render={({ field }) => (
                                        <Dropdown
                                            countries={partnerList}
                                            selected={field.value}
                                            onSelect={(selected) => field.onChange(selected)}
                                            multiSelect={true}
                                            placeholder={t('prospects.registration.selectFinancialAdvisor')}
                                            searchPlaceholder={t('prospects.registration.searchPartnerNames')}
                                        />
                                    )}
                                />
                            </div>
                        </div>

                        {/* Teaser Profile Link */}
                        <div className="flex flex-col gap-3">
                            <FieldLabel text={t('prospects.registration.teaserProfile')} />
                            <div className="flex items-center">
                                <div className="px-4 py-3 bg-gray-50 rounded-tl-[3px] rounded-bl-[3px] border-l border-t border-b border-gray-300 flex items-center">
                                    <LinkIcon className="w-5 h-5 text-gray-500" />
                                </div>
                                <input
                                    {...register('teaserLink')}
                                    placeholder="https://tokyoconsultinggroup.3qcloud.jp/index.php/s/..."
                                    className="flex-1 h-11 px-3 py-2 bg-white rounded-tr-[3px] rounded-br-[3px] border border-gray-300 text-sm font-normal  text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-300 truncate"
                                />
                            </div>
                        </div>

                        {/* Introduced Projects */}
                        <div className="flex flex-col gap-3">
                            <FieldLabel text={t('prospects.registration.introducedProjects')} />
                            <Controller
                                control={control}
                                name="introducedProjects"
                                render={({ field }) => (
                                    <Dropdown
                                        countries={investorList}
                                        selected={field.value || []}
                                        onSelect={(val) => field.onChange(val)}
                                        multiSelect={true}
                                        placeholder={t('prospects.registration.selectFromInvestors')}
                                        searchPlaceholder={t('prospects.registration.searchByCodeOrName')}
                                        dropUp={true}
                                    />
                                )}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══ Sticky Bottom Footer ═══ */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 h-16 flex items-center justify-end gap-3 px-8 z-50">
                <button
                    type="button"
                    onClick={() => navigate('/prospects?tab=targets')}
                    className="h-9 px-5 bg-white rounded-[3px] border border-gray-300 text-gray-700 text-sm font-medium  hover:bg-gray-50 transition-colors"
                >
                    {t('prospects.registration.cancel')}
                </button>
                <button
                    type="button"
                    onClick={() => {
                        const data = control._formValues as FormValues;
                        onSubmit(data, true);
                    }}
                    disabled={isSubmitting}
                    className="h-9 px-5 bg-white rounded-[3px] border border-sky-950 text-sky-950 text-sm font-medium  hover:bg-sky-50 transition-colors"
                >
                    {t('prospects.registration.saveAsDraft')}
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting || (isIdAvailable === false)}
                    className="h-9 px-6 bg-sky-950 rounded-[3px] text-white text-sm font-medium  hover:bg-[#042d48] transition-colors disabled:opacity-50"
                >
                    {isSubmitting ? t('prospects.registration.saving') : id ? t('prospects.registration.updateTarget') : t('prospects.registration.saveTarget')}
                </button>
            </div>
        </form>
    );
};

export default TargetRegistration;
