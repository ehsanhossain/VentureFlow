/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, Link as LinkIcon, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../../config/api';
import { getCachedCountries, getCachedCurrencies, getCachedIndustries } from '../../../utils/referenceDataCache';
import { showAlert } from '../../../components/Alert';
import { Dropdown, Country } from '../components/Dropdown';
import { IndustryDropdown, Industry } from '../components/IndustryDropdown';
import SelectPicker from '../../../components/SelectPicker';
import MultiSelectPicker from '../../../components/MultiSelectPicker';
import { LogoUpload } from '../../../components/LogoUpload';
import NumericInput from '../../../components/NumericInput';
import UnsavedChangesModal from '../../../components/UnsavedChangesModal';

// Types
interface FormValues {
    // Identity
    projectCode: string; // dealroomId
    rank: 'A' | 'B' | 'C' | '';
    companyName: string; // reg_name
    websiteLinks: { url: string }[];
    hqAddresses: { label: string; address: string }[];

    // Investment Intent
    targetIndustries: Industry[]; // main_industry_operations
    purposeMNA: string[]; // reason_ma
    targetCountries: Country[]; // target_countries
    budgetMin: string;
    budgetMax: string;
    budgetCurrency: string;
    investmentCondition: string[];
    projectDetails: string;

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
    introducedProjects: Country[];
    investorProfileLink: string;

    // Internal Logic
    originCountry: ExtendedCountry | null;
    noPICNeeded: boolean;
    internal_pic: any[];
    financialAdvisor: any[];
    primaryContactParams?: string;
    channel: string;
    companyIndustry: Industry[];
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

export const InvestorRegistration: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { t } = useTranslation();

    const [countries, setCountries] = useState<ExtendedCountry[]>([]);
    const [industries, setIndustries] = useState<Industry[]>([]);
    const [currencies, setCurrencies] = useState<{ id: number; currency_code: string }[]>([]);
    const [isIdAvailable, setIsIdAvailable] = useState<boolean | null>(null);
    const [profileImage, setProfileImage] = useState<File | null>(null);
    const [initialProfileImage, setInitialProfileImage] = useState<string | undefined>(undefined);
    const [isCheckingId, setIsCheckingId] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(!!id); // true if in edit mode
    const [staffList, setStaffList] = useState<any[]>([]);
    const [partnerList, setPartnerList] = useState<any[]>([]);
    const [targetList, setTargetList] = useState<any[]>([]); // registered sellers for Introduced Projects



    const { control, handleSubmit, setValue, register, formState: { errors, isSubmitting, isDirty } } = useForm<FormValues>({
        defaultValues: {
            projectCode: '',
            rank: '',
            budgetCurrency: '',
            websiteLinks: [{ url: '' }],
            contacts: [{ name: '', department: '', designation: '', phone: '', email: '', isPrimary: true }],
            hqAddresses: [{ label: '', address: '' }],
            introducedProjects: [],
            noPICNeeded: false,
            internal_pic: [],
            financialAdvisor: [],
            channel: '',
            companyIndustry: [],
            primaryContactParams: "0",
            projectDetails: '',
        }
    });

    const { fields: contactFields, append: appendContact, remove: removeContact } = useFieldArray({ control, name: "contacts" });
    const { fields: websiteFields, append: appendWebsite, remove: removeWebsite } = useFieldArray({ control, name: "websiteLinks" });
    const { fields: addressFields, append: appendAddress, remove: removeAddress } = useFieldArray({ control, name: 'hqAddresses' });

    const originCountry = useWatch({ control, name: 'originCountry' });
    const primaryContactParams = useWatch({ control, name: 'primaryContactParams' });
    const companyNameValue = useWatch({ control, name: 'companyName' });
    const projectCodeValue = useWatch({ control, name: 'projectCode' });

    // "Project + Full Code" toggle
    const [projectNameMode, setProjectNameMode] = useState(false);

    // ─── Unsaved Changes Protection ───
    const [showUnsavedModal, setShowUnsavedModal] = useState(false);
    const [isSavingDraft, setIsSavingDraft] = useState(false);
    const hasInteractedRef = useRef(false);
    const isSubmittingRef = useRef(false);

    // Track any user interaction with form
    const markInteracted = useCallback(() => {
        if (!hasInteractedRef.current) hasInteractedRef.current = true;
    }, []);

    const hasUnsavedChanges = isDirty || hasInteractedRef.current;

    // Intercept browser back/forward button
    useEffect(() => {
        if (!hasUnsavedChanges || isSubmittingRef.current) return;

        const handlePopState = () => {
            // Push state back to prevent leaving
            window.history.pushState(null, '', window.location.href);
            setShowUnsavedModal(true);
        };

        // Push an extra entry so back button triggers popstate instead of leaving
        window.history.pushState(null, '', window.location.href);
        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [hasUnsavedChanges]);

    // Prevent browser tab close / refresh with unsaved changes
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges && !isSubmittingRef.current) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges]);

    // Escape key handler
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && hasUnsavedChanges && !showUnsavedModal) {
                e.preventDefault();
                setShowUnsavedModal(true);
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [hasUnsavedChanges, showUnsavedModal]);

    const handleUnsavedStay = () => {
        setShowUnsavedModal(false);
    };

    const handleUnsavedDiscard = () => {
        setShowUnsavedModal(false);
        hasInteractedRef.current = false;
        isSubmittingRef.current = true;
        navigate('/prospects?tab=investors');
    };

    const handleUnsavedSaveDraft = async () => {
        setIsSavingDraft(true);
        try {
            const data = control._formValues as FormValues;
            isSubmittingRef.current = true;
            await onSubmit(data, true);
        } catch {
            setIsSavingDraft(false);
            isSubmittingRef.current = false;
        }
    };

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

    // Fetch Countries
    useEffect(() => {
        const fetchCountries = async () => {
            try {
                const data = await getCachedCountries();
                setCountries(data.map((c: any) => ({
                    id: c.id,
                    name: c.name,
                    alpha: c.alpha_2_code,
                    flagSrc: c.svg_icon_url || c.flagSrc,
                    status: 'registered',
                    is_region: c.is_region || false,
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
                const [indData, curData, staffRes, partRes] = await Promise.all([
                    getCachedIndustries(),
                    getCachedCurrencies(),
                    api.get('/api/employees/fetch'),
                    api.get('/api/partners/fetch')
                ]);

                setIndustries(indData.map((industry: any) => ({
                    id: industry.id,
                    name: industry.name,
                    status: industry.status,
                    sub_industries: industry.sub_industries || [],
                })));

                setCurrencies(curData);

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

                // Fetch registered targets (sellers) for Introduced Projects dropdown
                const targetRes = await api.get('/api/seller/fetch');
                const tData = Array.isArray(targetRes.data) ? targetRes.data : (targetRes.data?.data || []);
                setTargetList(tData.map((t: any) => ({
                    id: t.id,
                    name: `${t.code} — ${t.name}`,
                    flagSrc: '',
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
        if (id || !originCountry) return;
        // If countries haven't loaded yet, alpha might be missing — resolve it from countries list
        const alpha = originCountry.alpha
            || countries.find(c => c.id === originCountry.id)?.alpha
            || '';
        if (!alpha) return;

        const generateId = async () => {
            try {
                const response = await api.get(`/api/buyer/get-last-sequence?country=${alpha}`);
                const nextSeq = (response.data.lastSequence || 0) + 1;
                const formatted = String(nextSeq).padStart(3, '0');
                setValue('projectCode', `${alpha}-B-${formatted}`);
                setIsCheckingId(false);
                setIsIdAvailable(true);
            } catch (error) {
                console.error(error);
            }
        };

        generateId();
    }, [originCountry?.id, originCountry?.alpha, countries.length, setValue, id]);

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
            setIsLoadingData(true);
            try {
                const response = await api.get(`/api/buyer/${id}`);
                const buyer = response.data?.data;
                if (buyer) {
                    const overview = buyer.company_overview || {};
                    setValue('companyName', overview.reg_name || '');
                    setValue('projectCode', buyer.buyer_id || '');
                    setValue('rank', overview.rank || 'B');
                    setValue('channel', overview.channel || 'TCF');
                    // Restore status: backend stores 1=Active, 2=Draft
                    const statusVal = buyer.status === '2' || buyer.status === 2 ? 'Draft' : 'Active';
                    setValue('status', statusVal);

                    try {
                        let links: any[] = [];
                        if (Array.isArray(overview.website)) {
                            links = overview.website;
                        } else if (typeof overview.website === 'string') {
                            if (overview.website.startsWith('[')) {
                                links = JSON.parse(overview.website);
                            } else if (overview.website) {
                                links = [{ url: overview.website }];
                            }
                        }
                        setValue('websiteLinks', links.length > 0 ? links : [{ url: '' }]);
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    } catch (e) {
                        if (overview.website) {
                            setValue('websiteLinks', [{ url: String(overview.website) }]);
                        } else {
                            setValue('websiteLinks', [{ url: '' }]);
                        }
                    }

                    const parsePurpose = (val: any) => {
                        if (!val) return [];
                        if (Array.isArray(val)) return val;
                        try { const p = JSON.parse(val); if (Array.isArray(p)) return p; } catch { /* ignored */ }
                        return val ? [val] : [];
                    };
                    setValue('purposeMNA', parsePurpose(overview.reason_ma));
                    const parseCondition = (val: any) => {
                        if (!val) return [];
                        if (Array.isArray(val)) return val;
                        try { const p = JSON.parse(val); if (Array.isArray(p)) return p; } catch { /* ignored */ }
                        return val ? [val] : [];
                    };
                    setValue('investmentCondition', parseCondition(overview.investment_condition));
                    setValue('projectDetails', overview.details || '');
                    setValue('investorProfileLink', overview.investor_profile_link || '');

                    try {
                        const iPico = typeof overview.internal_pic === 'string' ? JSON.parse(overview.internal_pic) : overview.internal_pic;
                        setValue('internal_pic', Array.isArray(iPico) ? iPico : []);
                        const fAdv = typeof overview.financial_advisor === 'string' ? JSON.parse(overview.financial_advisor) : overview.financial_advisor;
                        setValue('financialAdvisor', Array.isArray(fAdv) ? fAdv : []);
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    } catch (e) { /* ignored */ }

                    if (buyer.image) {
                        const baseURL = import.meta.env.VITE_API_BASE_URL || '';
                        const isUrl = buyer.image.startsWith('http');
                        const imagePath = isUrl ? buyer.image : `${baseURL}/storage/${buyer.image.replace(/^\//, '')}`;
                        setInitialProfileImage(imagePath);
                    }

                    const countryData = overview.hq_country;
                    if (countryData) {
                        if (typeof countryData === 'object' && countryData.id) {
                            // Full object from the API (hqCountry relationship loaded)
                            setValue('originCountry', {
                                id: countryData.id,
                                name: countryData.name || '',
                                alpha: countryData.alpha_2_code || '',
                                flagSrc: countryData.svg_icon_url || '',
                                status: 'registered'
                            });
                        } else if (typeof countryData === 'number' || typeof countryData === 'string') {
                            // Only an ID — look up in the countries list already loaded
                            const numId = Number(countryData);
                            const found = countries.find(c => c.id === numId);
                            setValue('originCountry', {
                                id: numId,
                                name: found?.name || '',
                                alpha: found?.alpha || '',
                                flagSrc: found?.flagSrc || '',
                                status: 'registered'
                            });
                        }
                    }

                    try {
                        const addresses = typeof overview.hq_address === 'string' ? JSON.parse(overview.hq_address) : overview.hq_address;
                        if (addresses && Array.isArray(addresses)) {
                            setValue('hqAddresses', addresses);
                        } else if (overview.hq_address && !Array.isArray(addresses)) {
                            setValue('hqAddresses', [{ label: 'Headquarters', address: String(overview.hq_address) }]);
                        }
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    } catch (e) { /* ignored */ }

                    try {
                        const budget = typeof overview.investment_budget === 'string' ? JSON.parse(overview.investment_budget) : overview.investment_budget;
                        if (budget) {
                            setValue('budgetMin', budget.min || '');
                            setValue('budgetMax', budget.max || '');
                            setValue('budgetCurrency', budget.currency || '');
                        }
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    } catch (e) { /* ignored */ }

                    try {
                        const intro = typeof overview.introduced_projects === 'string' ? JSON.parse(overview.introduced_projects) : overview.introduced_projects;
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
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    } catch (e) { /* ignored */ }

                    try {
                        const companyIndustryRaw = typeof overview.company_industry === 'string' ? JSON.parse(overview.company_industry) : overview.company_industry;
                        if (Array.isArray(companyIndustryRaw)) {
                            const sanitized = companyIndustryRaw.map((op: any) => {
                                if (typeof op === 'object' && op !== null) return op;
                                const found = industries.find(i => i.name === op);
                                return found || { id: Date.now() + Math.random(), name: op };
                            });
                            setValue('companyIndustry', sanitized);
                        }
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    } catch (e) { /* ignored */ }

                    try {
                        const targetCountries = typeof overview.target_countries === 'string' ? JSON.parse(overview.target_countries) : overview.target_countries;
                        setValue('targetCountries', targetCountries || []);
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    } catch (e) { /* ignored */ }

                    try {
                        const contacts = typeof overview.contacts === 'string' ? JSON.parse(overview.contacts) : overview.contacts;
                        if (contacts && Array.isArray(contacts)) {
                            setValue('contacts', contacts);
                            const primaryIndex = contacts.findIndex((c: any) => c.isPrimary);
                            if (primaryIndex !== -1) {
                                setValue('primaryContactParams' as any, String(primaryIndex));
                            }
                        }
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    } catch (e) { /* ignored */ }
                    // ignored
                }
            } catch (err) {
                console.error('Failed to load investor data:', err);
                showAlert({ type: "error", message: "Failed to load investor data" });
            }
        };
        if (countries.length > 0 && industries.length > 0) fetchBuyer().finally(() => setIsLoadingData(false));
        else if (!id) setIsLoadingData(false);
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
            payload.append('reason_ma', JSON.stringify(data.purposeMNA || []));
            payload.append('investment_budget', JSON.stringify({ min: data.budgetMin, max: data.budgetMax, currency: data.budgetCurrency }));
            payload.append('investment_condition', JSON.stringify(data.investmentCondition || []));
            payload.append('details', data.projectDetails || '');
            payload.append('internal_pic', JSON.stringify(data.internal_pic || []));
            payload.append('financial_advisor', JSON.stringify(data.financialAdvisor || []));
            payload.append('introduced_projects', JSON.stringify(data.introducedProjects || []));
            payload.append('channel', data.channel || '');
            payload.append('main_industry_operations', JSON.stringify(data.targetIndustries || []));
            payload.append('target_countries', JSON.stringify(data.targetCountries || []));
            payload.append('company_industry', JSON.stringify(data.companyIndustry || []));

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
            const savedId = response.data?.data || id;

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

    /* ─── shared input style ─── */
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
        <form onSubmit={handleSubmit((data) => { isSubmittingRef.current = true; onSubmit(data, false); })} onChange={markInteracted} className="w-full pb-24 ">


            <div className="max-w-[1197px] mx-auto flex flex-col gap-12">

                {/* ═══════════════════════════════════════════════
                    SECTION 1: IDENTITY
                ═══════════════════════════════════════════════ */}
                <div className="flex flex-col gap-10">
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
                                        render={({ field }) => (
                                            <Dropdown
                                                countries={countries.filter(c => !c.is_region)}
                                                selected={field.value}
                                                onSelect={(val) => field.onChange(val)}
                                                placeholder={t('prospects.registration.selectOption')}
                                            />
                                        )}
                                    />
                                </div>
                                <div className="flex-1">
                                    <FieldLabel text={t('prospects.registration.projectCode')} required />
                                    <div className="relative flex items-center">
                                        <input
                                            {...register('projectCode')}
                                            className={`${inputClass} ${isIdAvailable === false ? 'border-red-500 bg-red-50' : isIdAvailable === true ? 'border-green-500 bg-green-50' : ''}`}
                                            placeholder={t('prospects.registration.projectCodePlaceholder')}
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
                <div className="flex flex-col gap-10">
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
                                                    setProjectNameMode(false);
                                                    setValue('companyName', '');
                                                } else {
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
                                    name="companyIndustry"
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
                                            className="w-1/3 h-11 px-3 py-2 bg-white rounded-[3px] border border-gray-300 text-sm font-normal  text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-300 transition-shadow"
                                        />
                                        <div className="flex-1 flex items-center gap-2">
                                            <input
                                                {...register(`hqAddresses.${index}.address` as const)}
                                                placeholder={t('prospects.registration.fullAddressPlaceholder')}
                                                className="flex-1 h-11 px-3 py-2 bg-white rounded-[3px] border border-gray-300 text-sm font-normal  text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-300 transition-shadow"
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
                                <Plus className="w-3 h-3" /> {t('prospects.registration.addAnotherAddress')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════
                    SECTION 3: DEAL CONTEXT
                ═══════════════════════════════════════════════ */}
                <div className="flex flex-col gap-10">
                    <SectionHeader title={t('prospects.registration.dealContext')} />

                    <div className="flex flex-col gap-8">
                        {/* Row: Target Business & Industry + Interested Country */}
                        <div className="flex gap-6">
                            <div className="flex-1">
                                <FieldLabel text={t('prospects.registration.targetBusinessIndustry')} required />
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
                                {errors.targetIndustries && <span className="text-red-500 text-xs mt-1">{t('prospects.registration.required')}</span>}
                            </div>
                            <div className="flex-1">
                                <FieldLabel text={t('prospects.registration.interestedCountry')} />
                                <Controller
                                    control={control}
                                    name="targetCountries"
                                    render={({ field }) => (
                                        <Dropdown
                                            countries={countries}
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            multiSelect
                                            placeholder={t('prospects.registration.selectCountries')}
                                        />
                                    )}
                                />
                            </div>
                        </div>

                        {/* Row: Purpose of M&A + Investment Condition */}
                        <div className="flex gap-6">
                            <div className="flex-1">
                                <FieldLabel text={t('prospects.registration.purposeMA')} />
                                <Controller
                                    control={control}
                                    name="purposeMNA"
                                    render={({ field }) => (
                                        <MultiSelectPicker
                                            options={MNA_PURPOSES}
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

                        {/* Row: Investment Budget + Default Currency */}
                        <div className="flex gap-6">
                            <div className="flex-1">
                                <FieldLabel text={t('prospects.registration.investmentBudget')} />
                                <div className="flex items-center gap-2">
                                    <Controller
                                        control={control}
                                        name="budgetMin"
                                        render={({ field }) => (
                                            <NumericInput
                                                value={field.value}
                                                onChange={field.onChange}
                                                placeholder={t('prospects.registration.minPlaceholder')}
                                                className={`flex-1 ${inputClass}`}
                                            />
                                        )}
                                    />
                                    <span className="text-black text-base font-normal">-</span>
                                    <Controller
                                        control={control}
                                        name="budgetMax"
                                        render={({ field }) => (
                                            <NumericInput
                                                value={field.value}
                                                onChange={field.onChange}
                                                placeholder={t('prospects.registration.maxPlaceholder')}
                                                className={`flex-1 ${inputClass}`}
                                            />
                                        )}
                                    />
                                </div>
                            </div>
                            <div className="flex-1">
                                <FieldLabel text={t('prospects.registration.defaultCurrency')} />
                                <Controller
                                    control={control}
                                    name="budgetCurrency"
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
                <div className="flex flex-col items-center gap-10">
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
                        onClick={() => appendContact({ name: '', department: '', designation: '', phone: '', email: '', isPrimary: false })}
                        className="self-stretch flex items-center gap-3 text-sky-900 text-base font-medium "
                    >
                        <Plus className="w-4 h-4" /> {t('prospects.registration.addAnotherContact')}
                    </button>
                </div>

                {/* ═══════════════════════════════════════════════
                    SECTION 5: DOCUMENTS & RELATIONSHIPS
                ═══════════════════════════════════════════════ */}
                <div className="flex flex-col gap-10">
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
                                            onSelect={(val) => field.onChange(val)}
                                            multiSelect={true}
                                            placeholder={t('prospects.registration.selectInternalStaff')}
                                            searchPlaceholder={t('prospects.registration.searchStaffNames')}
                                        />
                                    )}
                                />
                            </div>
                            <div className="flex-1">
                                <FieldLabel text={t('prospects.registration.financialAdvisorRole')} />
                                <Controller
                                    control={control}
                                    name="financialAdvisor"
                                    render={({ field }) => (
                                        <Dropdown
                                            countries={partnerList}
                                            selected={field.value}
                                            onSelect={(val) => field.onChange(val)}
                                            multiSelect={true}
                                            placeholder={t('prospects.registration.selectFinancialAdvisor')}
                                            searchPlaceholder={t('prospects.registration.searchPartnerNames')}
                                        />
                                    )}
                                />
                            </div>
                        </div>

                        {/* Investor Profile Link */}
                        <div className="flex flex-col gap-3">
                            <FieldLabel text={t('prospects.registration.investorProfile')} />
                            <div className="flex items-center">
                                <div className="px-4 py-3 bg-gray-50 rounded-tl-[3px] rounded-bl-[3px] border-l border-t border-b border-gray-300 flex items-center">
                                    <LinkIcon className="w-5 h-5 text-gray-500" />
                                </div>
                                <input
                                    {...register('investorProfileLink')}
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
                                        countries={targetList}
                                        selected={field.value || []}
                                        onSelect={(val) => field.onChange(val)}
                                        multiSelect={true}
                                        placeholder={t('prospects.registration.selectFromTargets')}
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
                    onClick={() => {
                        if (hasUnsavedChanges) {
                            setShowUnsavedModal(true);
                        } else {
                            navigate('/prospects?tab=investors');
                        }
                    }}
                    className="h-9 px-5 bg-white rounded-[3px] border border-gray-300 text-gray-700 text-sm font-medium  hover:bg-gray-50 transition-colors"
                >
                    {t('prospects.registration.cancel')}
                </button>
                <button
                    type="button"
                    onClick={() => {
                        isSubmittingRef.current = true;
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
                    {isSubmitting ? t('prospects.registration.saving') : id ? t('prospects.registration.updateInvestor') : t('prospects.registration.saveInvestor')}
                </button>
            </div>

            {/* Unsaved Changes Modal */}
            <UnsavedChangesModal
                isOpen={showUnsavedModal}
                onStay={handleUnsavedStay}
                onDiscard={handleUnsavedDiscard}
                onSaveDraft={handleUnsavedSaveDraft}
                isSaving={isSavingDraft}
            />
        </form>
    );
};

export default InvestorRegistration;
