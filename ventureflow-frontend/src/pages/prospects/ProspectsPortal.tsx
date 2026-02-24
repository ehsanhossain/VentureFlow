/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../../routes/AuthContext';
import api from '../../config/api';
import { getCachedCountries, getCachedCurrencies, getCachedIndustries, getCachedPipelineStages } from '../../utils/referenceDataCache';
import { InvestorTable, InvestorRowData } from './components/InvestorTable';
import { TargetTable, TargetRowData } from './components/TargetTable';
import ImportWizard from './components/ImportWizard';
import {
    ChevronDown,
    X,
    RotateCcw,
    Eye,
    EyeOff
} from 'lucide-react';
import draftDocumentIcon from '../../assets/icons/prospects/draft-document.svg';
import filterIcon from '../../assets/icons/prospects/filter.svg';
import toolsIcon from '../../assets/icons/prospects/tools.svg';
import addInvestorIcon from '../../assets/icons/prospects/addinvestor.svg';
import addTargetIcon from '../../assets/icons/prospects/addtarget.svg';
import importProspectsIcon from '../../assets/icons/prospects/import-prospects.svg';
import globalAddButtonIcon from '../../assets/icons/global-add-button.svg';
import DataTableSearch from '../../components/table/DataTableSearch';
import { Dropdown, Country as DropdownCountry } from './components/Dropdown';
import { IndustryDropdown, Industry as DropdownIndustry } from './components/IndustryDropdown';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { Calendar } from 'lucide-react';
import { showAlert } from '../../components/Alert';
import { isFieldAllowed } from '../../utils/permissionUtils';
import { BudgetRangeSlider } from './components/BudgetRangeSlider';
import { useGeneralSettings } from '../../context/GeneralSettingsContext';


interface Country {
    id: number;
    name: string;
    flagSrc: string;
    status: "registered" | "unregistered";
}

interface Currency {
    id: number;
    code: string;
    sign: string;
    exchange_rate: string;
}



interface PipelineStage {
    id: number;
    code: string;
    name: string;
    type: string;
}

const ALL_INVESTOR_COLUMNS = [
    { id: 'projectCode', labelKey: 'prospects.table.projectCode' },
    { id: 'rank', labelKey: 'prospects.table.rank' },
    { id: 'companyName', labelKey: 'prospects.table.companyName' },
    { id: 'originCountry', labelKey: 'prospects.table.originCountry' },
    { id: 'companyIndustry', labelKey: 'prospects.table.industry' },
    { id: 'targetCountries', labelKey: 'prospects.table.targetCountries' },
    { id: 'targetIndustries', labelKey: 'prospects.table.targetIndustry' },
    { id: 'purposeMNA', labelKey: 'prospects.table.purposeMA' },
    { id: 'investmentCondition', labelKey: 'prospects.table.condition' },
    { id: 'budget', labelKey: 'prospects.table.budget' },
    { id: 'investorProfileLink', labelKey: 'prospects.table.investorProfile' },
    { id: 'pipelineStatus', labelKey: 'prospects.table.pipeline' },
    { id: 'website', labelKey: 'prospects.table.website' },
    { id: 'primaryContact', labelKey: 'prospects.table.contact' },
    { id: 'internalPIC', labelKey: 'prospects.table.assignedPIC' },
    { id: 'financialAdvisor', labelKey: 'prospects.table.partnerFA' },
];

// System default VISIBLE columns
const DEFAULT_INVESTOR_COLUMNS = [
    'projectCode', 'rank', 'companyName', 'originCountry',
    'companyIndustry', 'targetCountries', 'targetIndustries',
    'purposeMNA', 'investmentCondition', 'budget', 'investorProfileLink',
];

// System default column ORDER — ALL columns, canonical position (visible + hidden)
const DEFAULT_INVESTOR_ORDER = [
    'projectCode', 'rank', 'companyName', 'originCountry',
    'companyIndustry', 'targetCountries', 'targetIndustries',
    'purposeMNA', 'investmentCondition', 'budget', 'investorProfileLink',
    // Hidden by default
    'pipelineStatus', 'website', 'primaryContact', 'internalPIC', 'financialAdvisor',
];

const ALL_TARGET_COLUMNS = [
    { id: 'projectCode', labelKey: 'prospects.table.projectCode' },
    { id: 'rank', labelKey: 'prospects.table.rank' },
    { id: 'companyName', labelKey: 'prospects.table.companyName' },
    { id: 'originCountry', labelKey: 'prospects.table.originCountry' },
    { id: 'industry', labelKey: 'prospects.table.industry' },
    { id: 'reasonForMA', labelKey: 'prospects.table.purposeMA' },
    { id: 'investmentCondition', labelKey: 'prospects.table.condition' },
    { id: 'desiredInvestment', labelKey: 'prospects.table.desiredInvestment' },
    { id: 'teaserLink', labelKey: 'prospects.table.teaser' },
    { id: 'ebitda', labelKey: 'prospects.table.ebitda' },
    { id: 'ebitdaTimes', labelKey: 'EBITDA Times' },
    { id: 'pipelineStatus', labelKey: 'prospects.table.pipeline' },
    { id: 'website', labelKey: 'prospects.table.website' },
    { id: 'primaryContact', labelKey: 'prospects.table.contact' },
    { id: 'internalPIC', labelKey: 'prospects.table.assignedPIC' },
    { id: 'financialAdvisor', labelKey: 'prospects.table.partnerFA' },
];

// System default VISIBLE columns
const DEFAULT_TARGET_COLUMNS = [
    'projectCode', 'rank', 'companyName', 'originCountry',
    'industry', 'reasonForMA', 'investmentCondition',
    'desiredInvestment', 'teaserLink',
];

// System default column ORDER — ALL columns, canonical position (visible + hidden)
const DEFAULT_TARGET_ORDER = [
    'projectCode', 'rank', 'companyName', 'originCountry',
    'industry', 'reasonForMA', 'investmentCondition',
    'desiredInvestment', 'teaserLink',
    // Hidden by default
    'ebitda', 'ebitdaTimes', 'pipelineStatus', 'website', 'primaryContact',
    'internalPIC', 'financialAdvisor',
];

/* Helper to parse multi-select fields which may be stored as string, JSON string, or array */
const parseMultiField = (val: any): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val.filter(Boolean);
    if (typeof val === 'string') {
        try { const p = JSON.parse(val); if (Array.isArray(p)) return p.filter(Boolean); } catch { /* ignored */ }
        return val ? [val] : [];
    }
    return [];
};

const ProspectsPortal: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const auth = useContext(AuthContext);
    const isPartner = auth?.isPartner;
    const { settings: globalSettings } = useGeneralSettings();
    const [searchParams, setSearchParams] = useSearchParams();
    const initialTab = (searchParams.get('tab') as 'investors' | 'targets') || 'investors';
    const [activeTab, setActiveTab] = useState<'investors' | 'targets'>(initialTab);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
    const [investors, setInvestors] = useState<InvestorRowData[]>([]);
    const [targets, setTargets] = useState<TargetRowData[]>([]);

    // Pagination State
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 20
    });

    // Ref to track itemsPerPage for API calls without causing refetch loops
    const itemsPerPageRef = useRef(pagination.itemsPerPage);

    // AbortController to cancel stale fetch requests and prevent pagination flickering
    const fetchAbortRef = useRef<AbortController | null>(null);

    const [countries, setCountries] = useState<Country[]>([]);
    const [currencies, setCurrencies] = useState<Currency[]>([]);
    const [counts, setCounts] = useState({ investors: 0, targets: 0 });


    const [serverAllowedFields, setServerAllowedFields] = useState<any>(null);

    // ============ COLUMN PREFERENCE SYSTEM ============
    const userId = auth?.user?.id;

    // Helpers for localStorage cache keyed by userId + tableType
    const getCacheKey = (tab: string) => `colprefs_${userId}_${tab}`;

    const loadCachedPrefs = (tab: 'investors' | 'targets') => {
        if (!userId) return null;
        try {
            const raw = localStorage.getItem(getCacheKey(tab));
            if (!raw) return null;
            return JSON.parse(raw) as {
                visible_columns: string[];
                column_order: string[];
                updated_at: string;
            };
        } catch { return null; }
    };

    const saveCachePrefs = (tab: string, data: { visible_columns: string[]; column_order: string[]; updated_at: string }) => {
        if (!userId) return;
        localStorage.setItem(getCacheKey(tab), JSON.stringify(data));
    };

    const clearCachePrefs = (tab: string) => {
        if (!userId) return;
        localStorage.removeItem(getCacheKey(tab));
    };

    // Reconcile saved column_order with current ALL_* definitions
    // (adds new columns that didn't exist when pref was saved)
    const reconcileOrder = (savedOrder: string[], tab: 'investors' | 'targets'): string[] => {
        const allCols = tab === 'investors' ? ALL_INVESTOR_COLUMNS : ALL_TARGET_COLUMNS;
        const allIds = allCols.map(c => c.id);
        const savedSet = new Set(savedOrder);
        // Keep saved order, filter out any that no longer exist
        const validSaved = savedOrder.filter(id => allIds.includes(id));
        // Append any new columns not in saved
        const missing = allIds.filter(id => !savedSet.has(id));
        return [...validSaved, ...missing];
    };

    const reconcileVisible = (savedVisible: string[], allOrder: string[]): string[] => {
        const orderSet = new Set(allOrder);
        return savedVisible.filter(id => orderSet.has(id));
    };

    const getDefaultVisible = (tab: 'investors' | 'targets') =>
        tab === 'investors' ? [...DEFAULT_INVESTOR_COLUMNS] : [...DEFAULT_TARGET_COLUMNS];

    const getDefaultOrder = (tab: 'investors' | 'targets') =>
        tab === 'investors' ? [...DEFAULT_INVESTOR_ORDER] : [...DEFAULT_TARGET_ORDER];

    // Initial state from cache or defaults
    const initPrefs = (tab: 'investors' | 'targets') => {
        const cached = loadCachedPrefs(tab);
        if (cached) {
            const order = reconcileOrder(cached.column_order, tab);
            const visible = reconcileVisible(cached.visible_columns, order);
            return { visible, order };
        }
        return { visible: getDefaultVisible(tab), order: getDefaultOrder(tab) };
    };

    const initialPrefs = initPrefs(activeTab);
    const [visibleColumns, setVisibleColumns] = useState<string[]>(initialPrefs.visible);
    const [columnOrder, setColumnOrder] = useState<string[]>(initialPrefs.order);

    // Track which tab the current columns belong to
    const columnsTabRef = useRef<'investors' | 'targets'>(activeTab);

    // Debounced save to API
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingSaveRef = useRef<{ visible: string[]; order: string[]; tab: string } | null>(null);
    const suppressSaveRef = useRef(false); // Prevents save during programmatic resets

    const flushSave = () => {
        if (saveTimerRef.current) {
            clearTimeout(saveTimerRef.current);
            saveTimerRef.current = null;
        }
        const pending = pendingSaveRef.current;
        if (pending) {
            pendingSaveRef.current = null;
            api.put(`/api/user/table-preferences/${pending.tab === 'investors' ? 'investor' : 'target'}`, {
                visible_columns: pending.visible,
                column_order: pending.order,
            }).then((res) => {
                if (res.data?.updated_at) {
                    saveCachePrefs(pending.tab, {
                        visible_columns: pending.visible,
                        column_order: pending.order,
                        updated_at: res.data.updated_at,
                    });
                }
            }).catch(() => { /* silent — cache already written optimistically */ });
        }
    };

    const cancelPendingSave = () => {
        if (saveTimerRef.current) {
            clearTimeout(saveTimerRef.current);
            saveTimerRef.current = null;
        }
        pendingSaveRef.current = null;
    };

    const scheduleSave = (visible: string[], order: string[], tab: string) => {
        // Optimistic cache write
        saveCachePrefs(tab, {
            visible_columns: visible,
            column_order: order,
            updated_at: new Date().toISOString(),
        });
        pendingSaveRef.current = { visible, order, tab };
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(flushSave, 1000);
    };

    // Flush on unmount
    useEffect(() => {
        return () => { flushSave(); };
    }, []);

    // Load preferences from API on mount + reconcile with cache
    useEffect(() => {
        if (!userId) return;
        const loadForTab = async (tab: 'investors' | 'targets') => {
            const tableType = tab === 'investors' ? 'investor' : 'target';
            try {
                const res = await api.get(`/api/user/table-preferences/${tableType}`);
                if (res.data && res.data.column_order) {
                    // User has saved preferences on the server
                    const order = reconcileOrder(res.data.column_order, tab);
                    const visible = reconcileVisible(res.data.visible_columns, order);
                    // Reconcile with local cache: server wins if newer
                    const cached = loadCachedPrefs(tab);
                    if (!cached || !cached.updated_at || res.data.updated_at >= cached.updated_at) {
                        saveCachePrefs(tab, {
                            visible_columns: visible,
                            column_order: order,
                            updated_at: res.data.updated_at,
                        });
                        if (tab === activeTab) {
                            suppressSaveRef.current = true;
                            setVisibleColumns(visible);
                            setColumnOrder(order);
                        }
                    }
                } else {
                    // No saved prefs on server — clear any stale cache so code defaults take effect
                    clearCachePrefs(tab);
                    if (tab === activeTab) {
                        suppressSaveRef.current = true;
                        setVisibleColumns(getDefaultVisible(tab));
                        setColumnOrder(getDefaultOrder(tab));
                    }
                }
            } catch {
                // API failed — keep using cache/defaults
            }
        };
        loadForTab('investors');
        loadForTab('targets');
    }, [userId]);

    // When activeTab changes, load the correct prefs for the new tab
    useEffect(() => {
        cancelPendingSave(); // Cancel any pending save for the old tab
        columnsTabRef.current = activeTab;
        const prefs = initPrefs(activeTab);
        suppressSaveRef.current = true;
        setVisibleColumns(prefs.visible);
        setColumnOrder(prefs.order);
    }, [activeTab]);

    // Schedule save whenever visible columns or order change (skip programmatic resets)
    const isInitialRender = useRef(true);
    useEffect(() => {
        if (isInitialRender.current) {
            isInitialRender.current = false;
            return;
        }
        if (suppressSaveRef.current) {
            suppressSaveRef.current = false;
            return;
        }
        if (columnsTabRef.current !== activeTab) return;
        scheduleSave(visibleColumns, columnOrder, activeTab);
    }, [visibleColumns, columnOrder]);

    // Keyboard shortcuts: Ctrl+1 = Investors, Ctrl+2 = Targets
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === '1') {
                e.preventDefault();
                setActiveTab('investors');
            } else if (e.ctrlKey && e.key === '2') {
                e.preventDefault();
                setActiveTab('targets');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const [selectedCurrency, setSelectedCurrency] = useState<{ id: number; code: string; symbol: string; rate: number } | null>(null);

    // Dropdown and UI States
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isToolsOpen, setIsToolsOpen] = useState(false);
    const [isImportWizardOpen, setIsImportWizardOpen] = useState(false);
    const [importWizardType, setImportWizardType] = useState<'investors' | 'targets'>('investors');
    const tableContainerRef = useRef<HTMLDivElement>(null);

    // Auto-calculate vertical row limit
    const lastCalculatedRows = useRef<number>(pagination.itemsPerPage);
    const resizeTimeoutRef = useRef<any>();

    useEffect(() => {
        const calculateRows = () => {
            if (!tableContainerRef.current) return;

            // Get actual height without padding
            const containerHeight = tableContainerRef.current.offsetHeight;

            // Precise overhead:
            // Table Header: 48px
            // Pagination Footer (px-4 py-2.5): ~48px
            // Container Padding: ~40px
            const overhead = 48 + 48 + 40;
            const availableHeight = containerHeight - overhead;
            const rows = Math.max(5, Math.floor(availableHeight / 56));

            if (rows > 0 && rows !== lastCalculatedRows.current) {
                lastCalculatedRows.current = rows;
                itemsPerPageRef.current = rows; // Keep ref in sync
                setPagination(prev => {
                    if (prev.itemsPerPage === rows) return prev;
                    return { ...prev, itemsPerPage: rows };
                });
            }
        };

        const handleResize = () => {
            if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
            resizeTimeoutRef.current = setTimeout(() => {
                window.requestAnimationFrame(calculateRows);
            }, 150); // Debounce resize events
        };

        // Initial trigger
        const timer = setTimeout(calculateRows, 300);

        const resizeObserver = new ResizeObserver(handleResize);
        if (tableContainerRef.current) resizeObserver.observe(tableContainerRef.current);

        return () => {
            clearTimeout(timer);
            if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
            resizeObserver.disconnect();
        };
    }, []); // Stability: dependency-free to prevent logic loops



    const fetchData = async (signal?: AbortSignal) => {
        setIsLoading(true);
        try {
            // Use debouncedSearch for the actual API call to avoid hammering on every keystroke
            const searchTerm = debouncedSearch;
            // Use currencies already loaded during initial fetch
            const currentCurrencies = currencies;

            // The `filters` memo object already contains only non-empty values,
            // so we can spread it directly into params. No need to cherry-pick fields.
            const commonParams = {
                search: searchTerm,
                ...filters,
                ...(selectedCurrency?.code ? { display_currency: selectedCurrency.code } : {}),
            };

            const activeApiEndpoint = activeTab === 'investors' ? '/api/buyer' : '/api/seller';
            const inactiveApiEndpoint = activeTab === 'investors' ? '/api/seller' : '/api/buyer';

            const [activeRes, inactiveCountRes] = await Promise.all([
                api.get(activeApiEndpoint, {
                    params: {
                        ...commonParams,
                        page: pagination.currentPage,
                        per_page: itemsPerPageRef.current
                    },
                    signal
                }),
                // Lightweight count-only request for the inactive tab — no filters from active tab
                api.get(inactiveApiEndpoint, {
                    params: {
                        search: searchTerm,
                        per_page: 1
                    },
                    signal
                })
            ]);

            const activeData = Array.isArray(activeRes.data?.data) ? activeRes.data.data : [];
            const activeTotal = activeRes.data?.meta?.total ?? 0;
            const inactiveTotal = inactiveCountRes.data?.meta?.total ?? 0;

            // Update Counts
            setCounts({
                investors: activeTab === 'investors' ? activeTotal : inactiveTotal,
                targets: activeTab === 'targets' ? activeTotal : inactiveTotal
            });

            // Update Pagination from Active Tab Meta
            const activeMeta = activeRes.data?.meta;
            if (activeMeta) {
                setPagination(prev => {
                    if (prev.totalPages === activeMeta.last_page &&
                        prev.totalItems === activeMeta.total &&
                        prev.itemsPerPage === activeMeta.per_page) {
                        return prev;
                    }
                    // Only update metadata — do NOT overwrite currentPage from server
                    // to prevent stale responses from reverting the page number
                    return {
                        ...prev,
                        totalPages: activeMeta.last_page,
                        totalItems: activeMeta.total,
                        itemsPerPage: activeMeta.per_page
                    };
                });
            }

            // Set allowed fields based on active tab
            setServerAllowedFields(activeMeta?.allowed_fields || null);

            if (activeTab === 'investors') {
                const mappedInvestors: InvestorRowData[] = activeData.map((b: any) => {
                    const overview = b.company_overview || {};
                    // hq_country can be: object (loaded relation), or number/string (ID)
                    const hqCountryRaw = overview.hq_country;
                    let hqCountry: { name: string; flagSrc: string } | undefined;

                    if (hqCountryRaw && typeof hqCountryRaw === 'object' && hqCountryRaw.id) {
                        // Loaded relation - use it directly
                        hqCountry = {
                            name: hqCountryRaw.name || 'Unknown',
                            flagSrc: hqCountryRaw.svg_icon_url || ''
                        };
                    } else if (hqCountryRaw) {
                        // Just an ID - look up in countries list
                        const found = countries.find(c => String(c.id) === String(hqCountryRaw));
                        hqCountry = found ? { name: found.name, flagSrc: found.flagSrc } : undefined;
                    }

                    const indMap = Array.isArray(overview.main_industry_operations)
                        ? overview.main_industry_operations.map((i: any) => i?.name || "Unknown")
                        : [];

                    // Parse Target Countries
                    let targetCountriesRaw = overview.target_countries;
                    if (typeof targetCountriesRaw === 'string') {
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        try { targetCountriesRaw = JSON.parse(targetCountriesRaw); } catch (e) { targetCountriesRaw = []; }
                    } else if (!targetCountriesRaw && b.target_preferences?.target_countries) {
                        targetCountriesRaw = b.target_preferences.target_countries;
                    }

                    const targetCountriesData = Array.isArray(targetCountriesRaw)
                        ? targetCountriesRaw.map((tc: any) => {
                            const cid = (tc && typeof tc === 'object') ? tc.id : tc;
                            const co = countries.find(con => String(con.id) === String(cid));
                            return co ? { name: co.name, flag: co.flagSrc } : null;
                        }).filter(Boolean)
                        : [];

                    // Parse Contacts for Primary Contact
                    let contactsRaw = overview.contacts;
                    if (typeof contactsRaw === 'string') {
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        try { contactsRaw = JSON.parse(contactsRaw); } catch (e) { contactsRaw = []; }
                    }

                    const primaryContactObj = Array.isArray(contactsRaw)
                        ? (contactsRaw.find((c: any) => c.isPrimary) || contactsRaw[0])
                        : null;

                    const primaryContactName = primaryContactObj?.name || overview.seller_contact_name || "N/A";

                    // Determine Source Currency Rate
                    // Investors store currency inside investment_budget JSON, NOT in financial_details.default_currency
                    const budgetObj = typeof overview.investment_budget === 'string'
                        ? (() => { try { return JSON.parse(overview.investment_budget); } catch { return null; } })()
                        : overview.investment_budget;
                    const defaultCurrencyId = budgetObj?.currency || b.financial_details?.default_currency;
                    const sourceCurrencyVal = currentCurrencies.find(c => c.code === defaultCurrencyId || String(c.id) === String(defaultCurrencyId));
                    const sourceRate = sourceCurrencyVal ? parseFloat(sourceCurrencyVal.exchange_rate) : 1;


                    // Parse Helper
                    const parseArray = (data: any, key: string = 'name') => {
                        try {
                            const parsed = typeof data === 'string' ? JSON.parse(data) : data;
                            if (Array.isArray(parsed)) return parsed.map(i => i?.[key] || i).filter(Boolean);
                            return [];
                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        } catch (e) { return []; }
                    };

                    const internalPICs = parseArray(overview.internal_pic, 'name');
                    const finAdvisors = parseArray(overview.financial_advisor, 'name');
                    const introProjects = parseArray(overview.introduced_projects, 'name');

                    return {
                        id: b.id,
                        projectCode: b.buyer_id || "N/A",
                        rank: overview.rank || '',
                        companyName: overview.reg_name || "Unknown Company",
                        primaryContact: primaryContactName,
                        originCountry: {
                            name: hqCountry?.name || "Unknown",
                            flag: hqCountry?.flagSrc || ""
                        },
                        targetCountries: targetCountriesData as { name: string; flag: string }[],
                        targetIndustries: indMap,
                        pipelineStatus: b.deals && b.deals.length > 0 ? b.deals[b.deals.length - 1].stage_code : "N/A",
                        budget: overview.investment_budget,
                        investmentCondition: parseMultiField(overview.investment_condition),
                        purposeMNA: parseMultiField(overview.reason_ma),
                        internalPIC: internalPICs,
                        financialAdvisor: finAdvisors,
                        introducedProjects: introProjects,
                        investorProfile: overview.investor_profile_link || "",
                        isPinned: !!b.pinned,
                        website: overview.website,
                        email: overview.email,
                        phone: overview.phone,
                        channel: overview.channel,
                        sourceCurrencyRate: sourceRate,
                        companyIndustry: parseArray(overview.company_industry, 'name'),
                        createdAt: b.created_at,
                    };
                });
                // Sort: newest (within 7 days) first, then rest in existing order
                const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
                mappedInvestors.sort((a, b) => {
                    const aIsNew = a.createdAt ? new Date(a.createdAt).getTime() > sevenDaysAgo : false;
                    const bIsNew = b.createdAt ? new Date(b.createdAt).getTime() > sevenDaysAgo : false;
                    if (aIsNew && !bIsNew) return -1;
                    if (!aIsNew && bIsNew) return 1;
                    if (aIsNew && bIsNew) return new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime();
                    return 0;
                });
                setInvestors(mappedInvestors);
            } else {
                const mappedTargets: TargetRowData[] = activeData.map((s: any) => {
                    const ov = s.company_overview || {};
                    const fin = s.financial_details || {};
                    // hq_country can be: object (loaded relation), or number/string (ID)
                    const hqCountryRaw = ov.hq_country;
                    let hqCountry: { name: string; flagSrc: string } | undefined;

                    if (hqCountryRaw && typeof hqCountryRaw === 'object' && hqCountryRaw.id) {
                        // Loaded relation - use it directly
                        hqCountry = {
                            name: hqCountryRaw.name || 'Unknown',
                            flagSrc: hqCountryRaw.svg_icon_url || ''
                        };
                    } else if (hqCountryRaw) {
                        // Just an ID - look up in countries list
                        const found = countries.find(c => String(c.id) === String(hqCountryRaw));
                        hqCountry = found ? { name: found.name, flagSrc: found.flagSrc } : undefined;
                    }

                    // Industry Parsing (Major & Middle)
                    let indMajor = "N/A";
                    let indMiddle = "N/A";
                    try {
                        const ops = typeof ov.industry_ops === 'string' ? JSON.parse(ov.industry_ops) : ov.industry_ops;
                        if (Array.isArray(ops) && ops.length > 0) {
                            indMajor = ops[0]?.name || "N/A";
                            if (ops.length > 1) indMiddle = ops[1]?.name || "N/A";
                        }
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    } catch (e) { /* ignored */ }

                    const defaultCurrencyId = fin.default_currency;
                    const sourceCurrencyVal = currentCurrencies.find(c => c.code === defaultCurrencyId || String(c.id) === String(defaultCurrencyId));
                    const sourceRate = sourceCurrencyVal ? parseFloat(sourceCurrencyVal.exchange_rate) : 1;

                    // Internal Owner (PIC)


                    // Parse Helper
                    const parseArray = (data: any, key: string = 'name') => {
                        try {
                            const parsed = typeof data === 'string' ? JSON.parse(data) : data;
                            if (Array.isArray(parsed)) return parsed.map(i => i?.[key] || i).filter(Boolean);
                            return [];
                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        } catch (e) { return []; }
                    };

                    const internalPICs = parseArray(ov.internal_pic || ov.incharge_name, 'name'); // Handle legacy incharge_name
                    const finAdvisors = parseArray(ov.financial_advisor, 'name');
                    const introProjects = parseArray(ov.introduced_projects, 'name');

                    return {
                        id: s.id,
                        addedDate: s.created_at ? new Date(s.created_at).toLocaleDateString() : "N/A",
                        projectCode: s.seller_id || "N/A",
                        companyName: ov.reg_name || "Unknown Company",
                        originCountry: {
                            name: hqCountry?.name || "Unknown",
                            flag: hqCountry?.flagSrc || ""
                        },
                        industry: [indMajor, indMiddle].filter(i => i !== "N/A"),
                        projectDetails: ov.details || "",
                        pipelineStatus: s.deals && s.deals.length > 0 ? s.deals[s.deals.length - 1].stage_code : "N/A",
                        status: ov.status || "N/A",
                        desiredInvestment: fin.expected_investment_amount,
                        reasonForMA: parseMultiField(ov.reason_ma || ov.reason_for_mna),
                        rank: ov.company_rank || ov.rank || '',
                        internalPIC: internalPICs,
                        financialAdvisor: finAdvisors,
                        introducedProjects: introProjects,
                        primaryContact: ov.seller_contact_name || "N/A",
                        primaryEmail: ov.seller_email || "N/A",
                        primaryPhone: (() => {
                            try {
                                let phoneVal = ov.seller_phone;
                                if (!phoneVal) return "N/A";

                                // If it's a string, try to parse it if it looks like JSON
                                if (typeof phoneVal === 'string') {
                                    if (phoneVal.trim().startsWith('[')) {
                                        try {
                                            const parsed = JSON.parse(phoneVal);
                                            phoneVal = parsed;
                                        } catch {
                                            return phoneVal; // Return original string if parse fails
                                        }
                                    } else {
                                        return phoneVal; // It's just a simple string
                                    }
                                }

                                // If we have an array (either from original or parsed)
                                if (Array.isArray(phoneVal)) {
                                    const firstItem = phoneVal[0];
                                    if (typeof firstItem === 'object' && firstItem !== null) {
                                        return firstItem.phone || "N/A";
                                    }
                                    return String(firstItem || "N/A");
                                }

                                // If it's a single object
                                if (typeof phoneVal === 'object' && phoneVal !== null) {
                                    return (phoneVal as any).phone || "N/A";
                                }

                                return String(phoneVal);
                            } catch { return "N/A"; }
                        })(),
                        website: ov.website || "",
                        teaserLink: ov.teaser_link || "",
                        ebitda: fin.ttm_profit,
                        ebitdaTimes: fin.ebitda_times || null,
                        channel: ov.channel,
                        isPinned: !!s.pinned,
                        sourceCurrencyRate: sourceRate,
                        investmentCondition: parseMultiField(fin.investment_condition),
                        createdAt: s.created_at,
                    };
                });
                // Sort: newest (within 7 days) first, then rest in existing order
                const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
                mappedTargets.sort((a, b) => {
                    const aIsNew = a.createdAt ? new Date(a.createdAt).getTime() > sevenDaysAgo : false;
                    const bIsNew = b.createdAt ? new Date(b.createdAt).getTime() > sevenDaysAgo : false;
                    if (aIsNew && !bIsNew) return -1;
                    if (!aIsNew && bIsNew) return 1;
                    if (aIsNew && bIsNew) return new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime();
                    return 0;
                });
                setTargets(mappedTargets);
            }
        } catch (error: any) {
            // Silently ignore aborted requests (new fetch superseded this one)
            // CRITICAL: Do NOT modify loading state for aborted requests — the replacement
            // fetch is still running, so setting isLoading=false here would cause a
            // "No Data Found" flash before the new data arrives.
            if (error?.name === 'AbortError' || error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') return;
            console.error("Failed to fetch data", error);
        } finally {
            // Only update loading state if the request was NOT aborted.
            // Check if the signal was aborted — if so, a newer fetch is in progress.
            if (!signal?.aborted) {
                setIsLoading(false);
                setHasLoadedOnce(true);
            }
        }
    };



    const createDropdownRef = useRef<HTMLDivElement>(null);
    const filterDrawerRef = useRef<HTMLDivElement>(null);
    const toolsDropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // ─── Per-Tab Independent Filter State ───
    // Each tab keeps its own filters that persist when switching between tabs.

    interface TabFilters {
        originCountries: DropdownCountry[];          // multi-select
        industry: DropdownIndustry[];
        targetIndustry: DropdownIndustry[];          // investors only
        targetCountries: DropdownCountry[];           // investors only
        pipelineStage: string;
        dateFrom: Date | null;
        dateTo: Date | null;
        budgetMin: string;                            // investors: investment budget; targets: desired investment
        budgetMax: string;
        rank: string;
        purposeMA: string;                            // both tabs
        investmentCondition: string;                  // both tabs
        ebitdaMin: string;                            // targets only
        ebitdaMax: string;                            // targets only
        ebitdaTimes: string;                          // targets only
    }

    const emptyFilters: TabFilters = {
        originCountries: [],
        industry: [],
        targetIndustry: [],
        targetCountries: [],
        pipelineStage: '',
        dateFrom: null,
        dateTo: null,
        budgetMin: '',
        budgetMax: '',
        rank: '',
        purposeMA: '',
        investmentCondition: '',
        ebitdaMin: '',
        ebitdaMax: '',
        ebitdaTimes: '',
    };

    const [investorFilters, setInvestorFilters] = useState<TabFilters>({ ...emptyFilters });
    const [targetFilters, setTargetFilters] = useState<TabFilters>({ ...emptyFilters });

    // Convenience: get/set for the currently active tab's filters
    const currentFilters = activeTab === 'investors' ? investorFilters : targetFilters;
    const setCurrentFilters = activeTab === 'investors' ? setInvestorFilters : setTargetFilters;
    const updateFilter = <K extends keyof TabFilters>(key: K, value: TabFilters[K]) => {
        setCurrentFilters(prev => ({ ...prev, [key]: value }));
    };

    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [budgetRange, setBudgetRange] = useState({ min: 0, max: 100000000 });
    const [sellerInvestmentRange, setSellerInvestmentRange] = useState({ min: 0, max: 100000000 });
    const [sellerEbitdaRange, setSellerEbitdaRange] = useState({ min: 0, max: 100000000 });

    // Reference data for filters
    const [filterIndustries, setFilterIndustries] = useState<DropdownIndustry[]>([]);
    const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([]);
    const [draftCounts, setDraftCounts] = useState({ investors: 0, targets: 0 });

    // Build a unified filters object for the API (uses current tab's filters)
    const filters = React.useMemo(() => {
        const f: Record<string, any> = {};
        const cf = currentFilters;
        if (cf.originCountries.length > 0) f.country = cf.originCountries.map(c => c.id);
        if (cf.industry.length > 0) f.broader_industries = cf.industry.map(i => i.id);
        if (cf.targetIndustry.length > 0) f.priority_industries = cf.targetIndustry.map(i => i.id);
        if (cf.dateFrom) {
            const d = cf.dateFrom;
            f.registered_after = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }
        if (cf.dateTo) {
            const d = cf.dateTo;
            f.registered_before = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }
        if (cf.pipelineStage) f.pipeline_stage = cf.pipelineStage;
        if (cf.targetCountries.length > 0) f.target_countries = cf.targetCountries.map(c => c.id);
        if (cf.budgetMin || cf.budgetMax) {
            f.expected_investment_amount = {};
            if (cf.budgetMin) f.expected_investment_amount.min = cf.budgetMin;
            if (cf.budgetMax) f.expected_investment_amount.max = cf.budgetMax;
        }
        if (cf.rank) f.rank = cf.rank;
        if (cf.purposeMA) f.reason_ma = cf.purposeMA;
        if (cf.investmentCondition) f.investment_condition = cf.investmentCondition;
        // Target-only filters
        if (activeTab === 'targets') {
            if (cf.ebitdaMin || cf.ebitdaMax) {
                f.ebitda = {};
                if (cf.ebitdaMin) f.ebitda.min = cf.ebitdaMin;
                if (cf.ebitdaMax) f.ebitda.max = cf.ebitdaMax;
            }
            if (cf.ebitdaTimes) f.ebitda_times = cf.ebitdaTimes;
        }
        return f;
    }, [currentFilters, activeTab]);

    const activeFilterCount = [
        currentFilters.originCountries.length > 0,
        currentFilters.industry.length > 0,
        currentFilters.targetIndustry.length > 0,
        currentFilters.targetCountries.length > 0,
        currentFilters.pipelineStage,
        currentFilters.dateFrom || currentFilters.dateTo,
        currentFilters.budgetMin || currentFilters.budgetMax,
        currentFilters.rank,
        currentFilters.purposeMA,
        currentFilters.investmentCondition,
        currentFilters.ebitdaMin || currentFilters.ebitdaMax,
        currentFilters.ebitdaTimes,
    ].filter(Boolean).length;



    // Shortcut Ctrl+F to focus search
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Click outside handlers
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (createDropdownRef.current && !createDropdownRef.current.contains(event.target as Node)) {
                setIsCreateOpen(false);
            }
            if (isFilterOpen && filterDrawerRef.current && !filterDrawerRef.current.contains(event.target as Node)) {
                setIsFilterOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isFilterOpen, isCreateOpen]);

    // Fetch Initial Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [countryData, currencyData, industryData, stagesData, draftBuyerRes, draftSellerRes] = await Promise.all([
                    getCachedCountries(),
                    getCachedCurrencies(),
                    getCachedIndustries(),
                    getCachedPipelineStages(),
                    api.get('/api/buyer', { params: { status: 'Draft', per_page: 1 } }),
                    api.get('/api/seller', { params: { status: 'Draft', per_page: 1 } }),
                ]);

                if (countryData) {
                    setCountries(countryData.map((c: any) => ({
                        id: c.id,
                        name: c.name,
                        flagSrc: c.svg_icon_url || c.flagSrc,
                        status: c.status || 'registered'
                    })));
                }

                if (currencyData) {
                    const currData = currencyData.map((c: any) => ({
                        id: c.id,
                        code: c.currency_code,
                        sign: c.currency_sign,
                        exchange_rate: c.exchange_rate
                    }));
                    setCurrencies(currData);
                    // Default to the global default currency from General Settings
                    const defaultCurrCode = globalSettings.default_currency || 'USD';
                    const defaultMatch = currData.find((c: any) => c.code === defaultCurrCode);
                    if (defaultMatch) {
                        setSelectedCurrency({
                            id: defaultMatch.id,
                            code: defaultMatch.code,
                            symbol: defaultMatch.sign,
                            rate: parseFloat(defaultMatch.exchange_rate || '1')
                        });
                    } else if (currData.length > 0) {
                        setSelectedCurrency({
                            id: currData[0].id,
                            code: currData[0].code,
                            symbol: currData[0].sign,
                            rate: parseFloat(currData[0].exchange_rate || '1')
                        });
                    }
                }

                // Industries
                setFilterIndustries(industryData.map((i: any) => ({ id: i.id, name: i.name, sub_industries: i.sub_industries || [] })));

                // Pipeline Stages
                setPipelineStages(stagesData.map((s: any) => ({
                    id: s.id,
                    code: s.code || s.stage_code || '',
                    name: s.name || s.stage_name || '',
                    type: s.pipeline_type || s.type || ''
                })));

                // Draft counts
                setDraftCounts({
                    investors: draftBuyerRes.data?.meta?.total ?? 0,
                    targets: draftSellerRes.data?.meta?.total ?? 0,
                });
            } catch (error) {
                console.error("Failed to fetch initial data", error);
            }

            // Budget range for slider — fetched separately so failures don't block page
            try {
                const [budgetRangeRes, investmentRangeRes, ebitdaRangeRes] = await Promise.all([
                    api.get('/api/investor/budget-range'),
                    api.get('/api/target/investment-range'),
                    api.get('/api/target/ebitda-range'),
                ]);
                if (budgetRangeRes.data) {
                    setBudgetRange({
                        min: budgetRangeRes.data.min ?? 0,
                        max: budgetRangeRes.data.max ?? 100000000,
                    });
                }
                if (investmentRangeRes.data) {
                    setSellerInvestmentRange({
                        min: investmentRangeRes.data.min ?? 0,
                        max: investmentRangeRes.data.max ?? 100000000,
                    });
                }
                if (ebitdaRangeRes.data) {
                    setSellerEbitdaRange({
                        min: ebitdaRangeRes.data.min ?? 0,
                        max: ebitdaRangeRes.data.max ?? 100000000,
                    });
                }
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (e) {
                console.warn("Budget range not available, using defaults");
            }
        };
        fetchData();
    }, []);

    // Debounce search input — only fire API call 400ms after user stops typing
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Reset pagination when tab or filters change
    useEffect(() => {
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    }, [activeTab, debouncedSearch, filters]);

    // Keyboard shortcut: Alt+T = Toggle tab
    // Note: Ctrl+T is browser-protected (opens new tab) and cannot be overridden.
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.altKey && !e.ctrlKey && !e.shiftKey && !e.metaKey && (e.key === 't' || e.key === 'T')) {
                e.preventDefault();
                setActiveTab(prev => {
                    const next = prev === 'investors' ? 'targets' : 'investors';
                    setSearchParams({ tab: next });
                    return next;
                });
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [setSearchParams]);

    // Fetch Investors/Targets
    useEffect(() => {
        // Cancel any in-flight request before starting a new one
        if (fetchAbortRef.current) fetchAbortRef.current.abort();
        const controller = new AbortController();
        fetchAbortRef.current = controller;
        if (countries.length > 0) fetchData(controller.signal);
        return () => { controller.abort(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, debouncedSearch, countries, filters, pagination.currentPage]);

    const handleTogglePin = async (id: number) => {
        try {
            const isInvestor = activeTab === 'investors';
            const endpoint = isInvestor ? 'investor' : 'seller';
            await api.post(`/api/${endpoint}/${id}/pinned`);

            // Immediately flip isPinned on the local data so UI reacts instantly
            if (isInvestor) {
                setInvestors(prev => prev.map(row =>
                    row.id === id ? { ...row, isPinned: !row.isPinned } : row
                ));
            } else {
                setTargets(prev => prev.map(row =>
                    row.id === id ? { ...row, isPinned: !row.isPinned } : row
                ));
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            showAlert({ type: 'error', message: t('common.error') });
        }
    };

    const toggleColumn = (columnId: string) => {
        setVisibleColumns(prev => {
            if (prev.includes(columnId)) {
                // Turn off — just filter out
                return prev.filter(c => c !== columnId);
            } else {
                // Turn on — insert at the column's position in columnOrder
                const orderIndex = columnOrder.indexOf(columnId);
                const newVisible = [...prev];
                // Find the right insertion point to maintain columnOrder sequence
                let insertAt = newVisible.length;
                for (let i = 0; i < newVisible.length; i++) {
                    if (columnOrder.indexOf(newVisible[i]) > orderIndex) {
                        insertAt = i;
                        break;
                    }
                }
                newVisible.splice(insertAt, 0, columnId);
                return newVisible;
            }
        });
    };




    const effectiveVisibleColumns = visibleColumns.filter(col =>
        isFieldAllowed(col, serverAllowedFields, activeTab)
    );

    return (
        <>
            {/* Import Wizard */}
            <ImportWizard
                isOpen={isImportWizardOpen}
                onClose={() => { setIsImportWizardOpen(false); fetchData(); }}
                initialType={importWizardType}
            />

            {/* Filter Side Drawer — matches Tools flyover design */}
            {isFilterOpen && (
                <>
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] transition-opacity duration-300" onClick={() => setIsFilterOpen(false)} />
                    <div ref={filterDrawerRef} className="fixed right-0 top-0 h-full w-[440px] bg-white border-l border-gray-100 z-[201] flex flex-col animate-in slide-in-from-right duration-300 shadow-2xl overflow-x-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-base font-medium text-gray-900 ">{t('prospects.portal.filters', 'Filters')}</h2>
                            <button
                                onClick={() => setIsFilterOpen(false)}
                                className="p-1.5 hover:bg-gray-100 rounded-[3px] transition-all duration-200 text-gray-400 hover:text-gray-600"
                                title="Close filters" aria-label="Close filters"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-premium">
                            {/* Origin Country (multi-select) */}
                            <div className={`px-6 pt-5 pb-4 border-b border-gray-100 transition-all duration-200 ${currentFilters.originCountries.length > 0 ? 'border-l-2 border-l-[#064771] bg-sky-50/30' : ''}`}>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-[13px] font-medium text-gray-700">
                                        {t('prospects.table.originCountry')}
                                    </label>
                                    {currentFilters.originCountries.length > 0 && (
                                        <button type="button" onClick={() => updateFilter('originCountries', [])} className="p-0.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors" title="Clear country filter">
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                                <Dropdown
                                    countries={countries as DropdownCountry[]}
                                    selected={currentFilters.originCountries as DropdownCountry[]}
                                    onSelect={((c: DropdownCountry | DropdownCountry[]) => {
                                        if (Array.isArray(c)) {
                                            updateFilter('originCountries', c as Country[]);
                                        } else {
                                            const exists = currentFilters.originCountries.some(oc => oc.id === c.id);
                                            updateFilter('originCountries',
                                                exists
                                                    ? currentFilters.originCountries.filter(oc => oc.id !== c.id)
                                                    : [...currentFilters.originCountries, c as Country]
                                            );
                                        }
                                    }) as any}
                                    multiSelect
                                    placeholder={t('prospects.portal.filterByCountry')}
                                />
                            </div>

                            {/* Industry */}
                            <div className={`px-6 pt-4 pb-4 border-b border-gray-100 transition-all duration-200 ${currentFilters.industry.length > 0 ? 'border-l-2 border-l-[#064771] bg-sky-50/30' : ''}`}>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-[13px] font-medium text-gray-700">
                                        {t('prospects.table.industry')}
                                    </label>
                                    {currentFilters.industry.length > 0 && (
                                        <button type="button" onClick={() => updateFilter('industry', [])} className="p-0.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors" title="Clear industry filter">
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                                <IndustryDropdown
                                    industries={filterIndustries}
                                    selected={currentFilters.industry}
                                    onSelect={(val) => updateFilter('industry', Array.isArray(val) ? val : [val])}
                                    multiSelect={true}
                                    placeholder={t('prospects.portal.filterByIndustry')}
                                />
                            </div>

                            {/* Target Business & Industry (Investors only) */}
                            {activeTab === 'investors' && (
                                <div className={`px-6 pt-4 pb-4 border-b border-gray-100 transition-all duration-200 ${currentFilters.targetIndustry.length > 0 ? 'border-l-2 border-l-[#064771] bg-sky-50/30' : ''}`}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="text-[13px] font-medium text-gray-700">
                                            {t('prospects.table.targetIndustries')}
                                        </label>
                                        {currentFilters.targetIndustry.length > 0 && (
                                            <button type="button" onClick={() => updateFilter('targetIndustry', [])} className="p-0.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors" title="Clear target industry filter">
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                    <IndustryDropdown
                                        industries={filterIndustries}
                                        selected={currentFilters.targetIndustry}
                                        onSelect={(val) => updateFilter('targetIndustry', Array.isArray(val) ? val : [val])}
                                        multiSelect={true}
                                        placeholder={t('prospects.portal.filterByIndustry')}
                                    />
                                </div>
                            )}

                            {/* Interested Country (Investors only) */}
                            {activeTab === 'investors' && (
                                <div className={`px-6 pt-4 pb-4 border-b border-gray-100 transition-all duration-200 ${currentFilters.targetCountries.length > 0 ? 'border-l-2 border-l-[#064771] bg-sky-50/30' : ''}`}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="text-[13px] font-medium text-gray-700">
                                            {t('prospects.table.targetCountries')}
                                        </label>
                                        {currentFilters.targetCountries.length > 0 && (
                                            <button type="button" onClick={() => updateFilter('targetCountries', [])} className="p-0.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors" title="Clear target countries filter">
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                    <Dropdown
                                        countries={countries as DropdownCountry[]}
                                        selected={currentFilters.targetCountries as DropdownCountry[]}
                                        onSelect={((c: DropdownCountry | DropdownCountry[]) => {
                                            if (Array.isArray(c)) {
                                                updateFilter('targetCountries', c as Country[]);
                                            } else {
                                                const exists = currentFilters.targetCountries.some(tc => tc.id === c.id);
                                                updateFilter('targetCountries',
                                                    exists
                                                        ? currentFilters.targetCountries.filter(tc => tc.id !== c.id)
                                                        : [...currentFilters.targetCountries, c as Country]
                                                );
                                            }
                                        }) as any}
                                        multiSelect
                                        placeholder={t('prospects.portal.filterByCountry')}
                                    />
                                </div>
                            )}

                            {/* Rank (both tabs) */}
                            <div className={`px-6 pt-4 pb-4 border-b border-gray-100 transition-all duration-200 ${currentFilters.rank ? 'border-l-2 border-l-[#064771] bg-sky-50/30' : ''}`}>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label htmlFor="rank-filter" className="text-[13px] font-medium text-gray-700">
                                        {t('prospects.table.rank')}
                                    </label>
                                    {currentFilters.rank && (
                                        <button type="button" onClick={() => updateFilter('rank', '')} className="p-0.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors" title="Clear rank filter">
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                                <div className="relative">
                                    <select
                                        id="rank-filter"
                                        aria-label="Rank"
                                        className={`w-full h-10 px-3 py-2 bg-white rounded-[3px] border text-sm font-normal text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-300 appearance-none cursor-pointer transition-colors ${currentFilters.rank ? 'border-[#064771]/40' : 'border-gray-300'}`}
                                        value={currentFilters.rank}
                                        onChange={(e) => updateFilter('rank', e.target.value)}
                                    >
                                        <option value="">All Ranks</option>
                                        <option value="A">A</option>
                                        <option value="B">B</option>
                                        <option value="C">C</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Purpose of M&A (both tabs — different options per type) */}
                            <div className={`px-6 pt-4 pb-4 border-b border-gray-100 transition-all duration-200 ${currentFilters.purposeMA ? 'border-l-2 border-l-[#064771] bg-sky-50/30' : ''}`}>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label htmlFor="purpose-ma-filter" className="text-[13px] font-medium text-gray-700">
                                        {t('prospects.table.purposeMA')}
                                    </label>
                                    {currentFilters.purposeMA && (
                                        <button type="button" onClick={() => updateFilter('purposeMA', '')} className="p-0.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors" title="Clear purpose filter">
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                                <div className="relative">
                                    <select
                                        id="purpose-ma-filter"
                                        aria-label="Purpose of M&A"
                                        className={`w-full h-10 px-3 py-2 bg-white rounded-[3px] border text-sm font-normal text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-300 appearance-none cursor-pointer transition-colors ${currentFilters.purposeMA ? 'border-[#064771]/40' : 'border-gray-300'}`}
                                        value={currentFilters.purposeMA}
                                        onChange={(e) => updateFilter('purposeMA', e.target.value)}
                                    >
                                        <option value="">All</option>
                                        {activeTab === 'investors' ? (
                                            <>
                                                <option value="Strategic Expansion">Strategic Expansion</option>
                                                <option value="Market Entry">Market Entry</option>
                                                <option value="Talent Acquisition">Talent Acquisition</option>
                                                <option value="Diversification">Diversification</option>
                                                <option value="Technology Acquisition">Technology Acquisition</option>
                                                <option value="Financial Investment">Financial Investment</option>
                                                <option value="Other">Other</option>
                                            </>
                                        ) : (
                                            <>
                                                <option value="Owner's Retirement">Owner's Retirement</option>
                                                <option value="Business Succession">Business Succession</option>
                                                <option value="Full Exit">Full Exit</option>
                                                <option value="Partial Exit">Partial Exit</option>
                                                <option value="Capital Raising">Capital Raising</option>
                                                <option value="Strategic Partnership">Strategic Partnership</option>
                                                <option value="Growth Acceleration">Growth Acceleration</option>
                                                <option value="Debt Restructuring">Debt Restructuring</option>
                                                <option value="Risk Mitigation">Risk Mitigation</option>
                                                <option value="Non-Core Divestment">Non-Core Divestment</option>
                                                <option value="Market Expansion">Market Expansion</option>
                                                <option value="Technology Integration">Technology Integration</option>
                                                <option value="Cross-Border Expansion">Cross-Border Expansion</option>
                                            </>
                                        )}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Condition (both tabs) */}
                            <div className={`px-6 pt-4 pb-4 border-b border-gray-100 transition-all duration-200 ${currentFilters.investmentCondition ? 'border-l-2 border-l-[#064771] bg-sky-50/30' : ''}`}>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label htmlFor="condition-filter" className="text-[13px] font-medium text-gray-700">
                                        {t('prospects.table.condition')}
                                    </label>
                                    {currentFilters.investmentCondition && (
                                        <button type="button" onClick={() => updateFilter('investmentCondition', '')} className="p-0.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors" title="Clear condition filter">
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                                <div className="relative">
                                    <select
                                        id="condition-filter"
                                        aria-label="Investment Condition"
                                        className={`w-full h-10 px-3 py-2 bg-white rounded-[3px] border text-sm font-normal text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-300 appearance-none cursor-pointer transition-colors ${currentFilters.investmentCondition ? 'border-[#064771]/40' : 'border-gray-300'}`}
                                        value={currentFilters.investmentCondition}
                                        onChange={(e) => updateFilter('investmentCondition', e.target.value)}
                                    >
                                        <option value="">All</option>
                                        <option value="Minority (<50%)">Minority (&lt;50%)</option>
                                        <option value="Significant minority (25–49%)">Significant minority (25–49%)</option>
                                        <option value="Joint control (51/49)">Joint control (51/49)</option>
                                        <option value="Majority (51–99%)">Majority (51–99%)</option>
                                        <option value="Full acquisition (100%)">Full acquisition (100%)</option>
                                        <option value="Flexible">Flexible</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Pipeline Stage (both tabs) */}
                            <div className={`px-6 pt-4 pb-4 border-b border-gray-100 transition-all duration-200 ${currentFilters.pipelineStage ? 'border-l-2 border-l-[#064771] bg-sky-50/30' : ''}`}>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label htmlFor="pipeline-stage-filter" className="text-[13px] font-medium text-gray-700">
                                        {t('prospects.details.dealPipelineStage')}
                                    </label>
                                    {currentFilters.pipelineStage && (
                                        <button type="button" onClick={() => updateFilter('pipelineStage', '')} className="p-0.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors" title="Clear pipeline stage filter">
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                                <div className="relative">
                                    <select
                                        id="pipeline-stage-filter"
                                        aria-label="Pipeline Stage"
                                        className={`w-full h-10 px-3 py-2 bg-white rounded-[3px] border text-sm font-normal text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-300 appearance-none cursor-pointer transition-colors ${currentFilters.pipelineStage ? 'border-[#064771]/40' : 'border-gray-300'}`}
                                        value={currentFilters.pipelineStage}
                                        onChange={(e) => updateFilter('pipelineStage', e.target.value)}
                                    >
                                        <option value="">All Stages</option>
                                        {pipelineStages
                                            .filter(s => activeTab === 'investors' ? s.type === 'buyer' : s.type === 'seller')
                                            .map(s => <option key={s.id} value={s.code}>{s.name}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Registration Date (Range) */}
                            <div className={`px-6 pt-4 pb-4 border-b border-gray-100 transition-all duration-200 ${(currentFilters.dateFrom || currentFilters.dateTo) ? 'border-l-2 border-l-[#064771] bg-sky-50/30' : ''}`}>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-[13px] font-medium text-gray-700">
                                        Registered between
                                    </label>
                                    {(currentFilters.dateFrom || currentFilters.dateTo) && (
                                        <button type="button" onClick={() => { updateFilter('dateFrom', null); updateFilter('dateTo', null); setIsDatePickerOpen(false); }} className="p-0.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors" title="Clear date filter">
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                                    className="w-full h-10 px-3 py-2 bg-white rounded-[3px] border border-gray-300 text-sm font-normal  text-left flex items-center justify-between hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-300 transition-colors cursor-pointer"
                                >
                                    <span className={currentFilters.dateFrom || currentFilters.dateTo ? 'text-gray-900' : 'text-gray-400'}>
                                        {currentFilters.dateFrom && currentFilters.dateTo
                                            ? `${currentFilters.dateFrom.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} – ${currentFilters.dateTo.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`
                                            : currentFilters.dateFrom
                                                ? `From ${currentFilters.dateFrom.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`
                                                : 'Select date range'}
                                    </span>
                                    <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                                </button>
                                {isDatePickerOpen && (
                                    <div className="mt-2 ventureflow-date-range">
                                        <DateRange
                                            ranges={[{
                                                startDate: currentFilters.dateFrom || new Date(),
                                                endDate: currentFilters.dateTo || new Date(),
                                                key: 'selection'
                                            }]}
                                            onChange={(item: any) => {
                                                updateFilter('dateFrom', item.selection.startDate);
                                                updateFilter('dateTo', item.selection.endDate);
                                            }}
                                            moveRangeOnFirstSelection={false}
                                            months={1}
                                            direction="horizontal"
                                            rangeColors={['#064771']}
                                            color="#064771"
                                            showDateDisplay={false}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Investment Budget / Desired Investment (both tabs) */}
                            <div className={`px-6 pt-4 pb-4 border-b border-gray-100 overflow-hidden transition-all duration-200 ${(currentFilters.budgetMin || currentFilters.budgetMax) ? 'border-l-2 border-l-[#064771] bg-sky-50/30' : ''}`}>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-[13px] font-medium text-gray-700">
                                        {activeTab === 'investors' ? t('prospects.table.investmentBudget') : t('prospects.table.desiredInvestment', 'Desired Investment')}
                                        {selectedCurrency?.code && <span className="text-gray-400 font-normal ml-1">({selectedCurrency.code})</span>}
                                    </label>
                                    {(currentFilters.budgetMin || currentFilters.budgetMax) && (
                                        <button type="button" onClick={() => { updateFilter('budgetMin', ''); updateFilter('budgetMax', ''); }} className="p-0.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors" title="Clear budget filter">
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 w-full">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        className="flex-1 min-w-0 h-10 px-3 py-2 bg-white rounded-[3px] border border-gray-300 text-sm font-normal  text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-300 transition-colors"
                                        value={currentFilters.budgetMin}
                                        onChange={(e) => updateFilter('budgetMin', e.target.value)}
                                    />
                                    <span className="text-gray-400 text-sm font-normal flex-shrink-0">–</span>
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        className="flex-1 min-w-0 h-10 px-3 py-2 bg-white rounded-[3px] border border-gray-300 text-sm font-normal  text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-300 transition-colors"
                                        value={currentFilters.budgetMax}
                                        onChange={(e) => updateFilter('budgetMax', e.target.value)}
                                    />
                                </div>
                                {activeTab === 'investors' && (
                                    <div className="mt-4">
                                        <BudgetRangeSlider
                                            globalMin={budgetRange.min}
                                            globalMax={budgetRange.max}
                                            currentMin={currentFilters.budgetMin}
                                            currentMax={currentFilters.budgetMax}
                                            onMinChange={(v) => updateFilter('budgetMin', v)}
                                            onMaxChange={(v) => updateFilter('budgetMax', v)}
                                        />
                                    </div>
                                )}
                                {/* Range helper text */}
                                {(() => {
                                    const range = activeTab === 'investors' ? budgetRange : sellerInvestmentRange;
                                    const fmt = (v: number) => v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(0)}K` : String(v);
                                    return (
                                        <p className="mt-1.5 text-[11px] text-gray-400">
                                            Range: {fmt(range.min)} – {fmt(range.max)}
                                        </p>
                                    );
                                })()}
                            </div>

                            {/* EBITDA Value (Targets only) */}
                            {activeTab === 'targets' && (
                                <div className={`px-6 pt-4 pb-4 border-b border-gray-100 transition-all duration-200 ${(currentFilters.ebitdaMin || currentFilters.ebitdaMax) ? 'border-l-2 border-l-[#064771] bg-sky-50/30' : ''}`}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="text-[13px] font-medium text-gray-700">
                                            {t('prospects.table.ebitda', 'EBITDA Value')}
                                            {selectedCurrency?.code && <span className="text-gray-400 font-normal ml-1">({selectedCurrency.code})</span>}
                                        </label>
                                        {(currentFilters.ebitdaMin || currentFilters.ebitdaMax) && (
                                            <button type="button" onClick={() => { updateFilter('ebitdaMin', ''); updateFilter('ebitdaMax', ''); }} className="p-0.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors" title="Clear EBITDA filter">
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 w-full">
                                        <input
                                            type="number"
                                            placeholder="Min"
                                            className="flex-1 min-w-0 h-10 px-3 py-2 bg-white rounded-[3px] border border-gray-300 text-sm font-normal  text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-300 transition-colors"
                                            value={currentFilters.ebitdaMin}
                                            onChange={(e) => updateFilter('ebitdaMin', e.target.value)}
                                        />
                                        <span className="text-gray-400 text-sm font-normal flex-shrink-0">–</span>
                                        <input
                                            type="number"
                                            placeholder="Max"
                                            className="flex-1 min-w-0 h-10 px-3 py-2 bg-white rounded-[3px] border border-gray-300 text-sm font-normal  text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-300 transition-colors"
                                            value={currentFilters.ebitdaMax}
                                            onChange={(e) => updateFilter('ebitdaMax', e.target.value)}
                                        />
                                    </div>
                                    {/* Range helper text */}
                                    <p className="mt-1.5 text-[11px] text-gray-400">
                                        Range: {sellerEbitdaRange.min >= 1e6 ? `${(sellerEbitdaRange.min / 1e6).toFixed(1)}M` : sellerEbitdaRange.min >= 1e3 ? `${(sellerEbitdaRange.min / 1e3).toFixed(0)}K` : sellerEbitdaRange.min} – {sellerEbitdaRange.max >= 1e6 ? `${(sellerEbitdaRange.max / 1e6).toFixed(1)}M` : sellerEbitdaRange.max >= 1e3 ? `${(sellerEbitdaRange.max / 1e3).toFixed(0)}K` : sellerEbitdaRange.max}
                                    </p>
                                </div>
                            )}

                            {/* EBITDA Times (Targets only) */}
                            {activeTab === 'targets' && (
                                <div className={`px-6 pt-4 pb-4 border-b border-gray-100 transition-all duration-200 ${currentFilters.ebitdaTimes ? 'border-l-2 border-l-[#064771] bg-sky-50/30' : ''}`}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label htmlFor="ebitda-times-filter" className="text-[13px] font-medium text-gray-700">
                                            EBITDA Times
                                        </label>
                                        {currentFilters.ebitdaTimes && (
                                            <button type="button" onClick={() => updateFilter('ebitdaTimes', '')} className="p-0.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors" title="Clear EBITDA times filter">
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <input
                                            id="ebitda-times-filter"
                                            type="number"
                                            step="0.1"
                                            placeholder="e.g. 5"
                                            className="w-full h-10 px-3 py-2 bg-white rounded-[3px] border border-gray-300 text-sm font-normal  text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-300 transition-colors"
                                            value={currentFilters.ebitdaTimes}
                                            onChange={(e) => updateFilter('ebitdaTimes', e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-gray-100">
                            <button
                                onClick={() => {
                                    setCurrentFilters({ ...emptyFilters });
                                    setIsDatePickerOpen(false);
                                }}
                                className="w-full py-2.5 bg-white border border-gray-200 text-gray-600 rounded-[3px] text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-50 hover:text-gray-900 active:scale-[0.98] transition-all duration-200"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                {t('prospects.portal.clearAllFilters')}
                            </button>
                        </div>
                    </div>
                </>
            )}

            <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50 overflow-hidden">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-center justify-between px-4 md:px-6 py-4 bg-white border-b gap-4">
                    <div className="flex flex-col md:flex-row items-center gap-8 w-full md:w-auto">
                        <h1 className="text-base font-medium text-gray-900 w-full md:w-auto">{t('prospects.title')}</h1>

                        <div className="relative flex bg-gray-100 rounded-[6px] p-1">
                            {/* Sliding pill background */}
                            <div
                                className="absolute top-1 bottom-1 rounded-[5px] bg-white shadow-sm transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                                style={{
                                    width: 'calc(50% - 4px)',
                                    left: activeTab === 'investors' ? '4px' : 'calc(50%)',
                                }}
                            />
                            <button
                                onClick={() => {
                                    setActiveTab('investors');
                                    setSearchParams({ tab: 'investors' });
                                }}
                                className={`relative z-[1] flex-1 px-4 py-1.5 rounded-[5px] text-sm font-medium whitespace-nowrap transition-colors duration-300 ${activeTab === 'investors'
                                    ? 'text-[#064771]'
                                    : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                {t('prospects.portal.tabInvestors')} <span className="ml-1 opacity-60">({counts.investors})</span>
                            </button>
                            <button
                                onClick={() => {
                                    setActiveTab('targets');
                                    setSearchParams({ tab: 'targets' });
                                }}
                                className={`relative z-[1] flex-1 px-4 py-1.5 rounded-[5px] text-sm font-medium whitespace-nowrap transition-colors duration-300 ${activeTab === 'targets'
                                    ? 'text-[#064771]'
                                    : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                {t('prospects.portal.tabTargets')} <span className="ml-1 opacity-60">({counts.targets})</span>
                            </button>
                        </div>

                        <DataTableSearch
                            value={searchQuery}
                            onChange={setSearchQuery}
                            placeholder={activeTab === 'investors' ? t('prospects.searchInvestors') : t('prospects.searchTargets')}
                            className="w-full md:w-72"
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        {!isPartner && (
                            <button
                                onClick={() => navigate('/prospects/drafts')}
                                className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-600 px-4 py-2 rounded-[3px] border border-gray-200 text-sm font-medium transition-all active:scale-95"
                            >
                                <img src={draftDocumentIcon} alt="" className="w-[18px] h-[18px] shrink-0" />
                                {t('prospects.drafts')}{(draftCounts.investors + draftCounts.targets) > 0 && (
                                    <span className="text-gray-400 ml-0.5">({draftCounts.investors + draftCounts.targets})</span>
                                )}
                            </button>
                        )}

                        {/* Filter Button */}
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-[3px] border text-sm font-medium transition-all active:scale-95 ${activeFilterCount > 0
                                ? 'bg-[#F1FBFF] border-[#064771]/20 text-[#064771] hover:bg-[#E8F6FF]'
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <img src={filterIcon} alt="" className="w-[18px] h-[18px] shrink-0" />
                            <span>{t('prospects.portal.filters', 'Filter')}</span>
                            {activeFilterCount > 0 && (
                                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#064771] px-1 text-[10px] font-medium text-white">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>

                        <div ref={toolsDropdownRef}>
                            <button
                                onClick={() => setIsToolsOpen(!isToolsOpen)}
                                className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-[3px] border border-gray-200 text-sm font-medium transition-all active:scale-95"
                            >
                                <img src={toolsIcon} alt="" className="w-[18px] h-[18px] shrink-0" />
                                {t('prospects.portal.tools', 'Tools')}
                            </button>
                        </div>

                        {/* Tools Flyover Drawer - Right Side */}
                        {isToolsOpen && (
                            <>
                                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] transition-opacity duration-300" onClick={() => setIsToolsOpen(false)} />
                                <div className="fixed right-0 top-0 h-full w-[440px] bg-white border-l border-gray-100 z-[201] flex flex-col animate-in slide-in-from-right duration-300 shadow-2xl overflow-x-hidden">
                                    {/* Header — matches Filters */}
                                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                                        <h2 className="text-base font-medium text-gray-900">{t('prospects.portal.tools', 'Tools')}</h2>
                                        <button
                                            onClick={() => setIsToolsOpen(false)}
                                            className="p-1.5 hover:bg-gray-100 rounded-[3px] transition-all duration-200 text-gray-400 hover:text-gray-600"
                                            title="Close tools" aria-label="Close tools"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-premium">
                                        {/* Currency Section */}
                                        <div className="px-6 pt-5 pb-4 border-b border-gray-100">
                                            <label htmlFor="display-currency-select" className="block mb-1.5 text-[13px] font-medium text-gray-700">
                                                {t('prospects.portal.displayCurrency', 'Display Currency')}
                                            </label>
                                            <div className="relative">
                                                <select
                                                    id="display-currency-select"
                                                    aria-label="Display Currency"
                                                    className="w-full h-10 px-3 py-2 bg-white rounded-[3px] border border-gray-300 text-sm font-normal text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-300 appearance-none cursor-pointer transition-colors"
                                                    value={selectedCurrency?.id}
                                                    onChange={(e) => {
                                                        const curr = currencies.find(c => c.id === Number(e.target.value));
                                                        if (curr) setSelectedCurrency({ id: curr.id, code: curr.code, symbol: curr.sign, rate: parseFloat(curr.exchange_rate) });
                                                    }}
                                                >
                                                    {currencies.map(c => <option key={c.id} value={c.id}>{c.sign}  {c.code}</option>)}
                                                </select>
                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                            </div>
                                        </div>

                                        {/* Visible Columns Section */}
                                        <div className="px-6 pt-5 pb-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <label className="text-[13px] font-medium text-gray-700">
                                                    {t('prospects.customizeColumns')}
                                                </label>
                                                <span className="text-[11px] font-medium text-gray-400">
                                                    {visibleColumns.length} / {(activeTab === 'investors' ? ALL_INVESTOR_COLUMNS : ALL_TARGET_COLUMNS).filter(col => isFieldAllowed(col.id, serverAllowedFields, activeTab)).length}
                                                </span>
                                            </div>
                                            <div className="space-y-1">
                                                {/* Iterate in columnOrder sequence so toggle list matches table header */}
                                                {columnOrder
                                                    .map(colId => (activeTab === 'investors' ? ALL_INVESTOR_COLUMNS : ALL_TARGET_COLUMNS).find(c => c.id === colId))
                                                    .filter((col): col is { id: string; labelKey: string } => !!col && isFieldAllowed(col.id, serverAllowedFields, activeTab))
                                                    .map(col => {
                                                        const isActive = visibleColumns.includes(col.id);
                                                        return (
                                                            <button
                                                                key={col.id}
                                                                onClick={() => toggleColumn(col.id)}
                                                                className={`flex items-center justify-between w-full px-4 py-3 rounded-[3px] transition-all duration-200 group ${isActive
                                                                    ? 'bg-[#F1FBFF] text-[#064771]'
                                                                    : 'text-gray-500 hover:bg-gray-50'
                                                                    }`}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    {isActive
                                                                        ? <Eye className="w-4 h-4 text-[#064771]" />
                                                                        : <EyeOff className="w-4 h-4 text-gray-400 group-hover:text-gray-400" />
                                                                    }
                                                                    <span className={`text-sm ${isActive ? 'font-medium' : 'font-normal'}`}>
                                                                        {t(col.labelKey)}
                                                                    </span>
                                                                </div>
                                                                {/* Toggle Switch */}
                                                                <div className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${isActive ? 'bg-[#064771]' : 'bg-gray-200'
                                                                    }`}>
                                                                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${isActive ? 'translate-x-[18px]' : 'translate-x-0.5'
                                                                        }`} />
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer — matches Filter's Reset style */}
                                    <div className="px-6 py-4 border-t border-gray-100">
                                        <button
                                            onClick={() => {
                                                // Cancel any pending debounced save
                                                cancelPendingSave();
                                                // Reset to system defaults
                                                const defaultVisible = getDefaultVisible(activeTab);
                                                const defaultOrder = getDefaultOrder(activeTab);
                                                setVisibleColumns(defaultVisible);
                                                setColumnOrder(defaultOrder);
                                                // Clear local cache
                                                clearCachePrefs(activeTab);
                                                // Delete server preference
                                                const tableType = activeTab === 'investors' ? 'investor' : 'target';
                                                api.delete(`/api/user/table-preferences/${tableType}`).catch(() => { });
                                            }}
                                            className="w-full py-2.5 bg-white border border-gray-200 text-gray-600 rounded-[3px] text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-50 hover:text-gray-900 active:scale-[0.98] transition-all duration-200"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5" />
                                            {t('prospects.resetColumns')}
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}

                        {!isPartner && (
                            <div className="relative" ref={createDropdownRef}>
                                <button
                                    onClick={() => setIsCreateOpen(!isCreateOpen)}
                                    className="flex items-center gap-2 bg-[#064771] text-white px-5 py-2 rounded-[3px] text-sm font-medium transition-all hover:bg-[#053a5c] active:scale-95"
                                >
                                    <img src={globalAddButtonIcon} alt="" className="w-5 h-5" />
                                    <span>{t('common.create', 'Create')}</span>
                                    <ChevronDown className={`w-4 h-4 opacity-50 transition-transform duration-200 ${isCreateOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {isCreateOpen && (
                                    <div className="absolute right-0 mt-2 bg-white rounded-[3px] border border-gray-200 p-2.5 z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-right overflow-hidden shadow-sm" style={{ minWidth: '195px' }}>
                                        <div className="flex flex-col gap-1.5">
                                            <button
                                                className="w-full text-left px-2.5 py-2.5 flex items-center gap-3 rounded hover:bg-gray-50 transition-colors"
                                                onClick={() => { navigate('/prospects/add-investor'); setIsCreateOpen(false); }}
                                            >
                                                <img src={addInvestorIcon} alt="" className="w-[18px] h-[18px] shrink-0" />
                                                <span className="text-black text-xs font-normal leading-[18px] truncate">{t('prospects.createInvestor', 'Add Investor')}</span>
                                            </button>
                                            <button
                                                className="w-full text-left px-2.5 py-2.5 flex items-center gap-3 rounded hover:bg-gray-50 transition-colors"
                                                onClick={() => { navigate('/prospects/add-target'); setIsCreateOpen(false); }}
                                            >
                                                <img src={addTargetIcon} alt="" className="w-[18px] h-[18px] shrink-0" />
                                                <span className="text-black text-xs font-normal leading-[18px] truncate">{t('prospects.createTarget', 'Add Target')}</span>
                                            </button>
                                            <div className="w-full h-px bg-gray-100 my-0.5" />
                                            <button
                                                className="w-full text-left px-2.5 py-2.5 flex items-center gap-3 rounded hover:bg-gray-50 transition-colors"
                                                onClick={() => { setImportWizardType('investors'); setIsImportWizardOpen(true); setIsCreateOpen(false); }}
                                            >
                                                <img src={importProspectsIcon} alt="" className="w-[18px] h-[18px] shrink-0" />
                                                <span className="text-black text-xs font-normal leading-[18px] truncate">{t('prospects.portal.importProspects', 'Import Prospects')}</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content Area */}
                <div
                    ref={tableContainerRef}
                    className="flex-1 flex flex-col overflow-hidden relative"
                >
                    <div className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden">
                        {activeTab === 'investors' ? (
                            <InvestorTable
                                data={investors}
                                isLoading={isLoading}
                                hasLoadedOnce={hasLoadedOnce}
                                onTogglePin={handleTogglePin}
                                visibleColumns={effectiveVisibleColumns}
                                columnOrder={columnOrder}
                                onColumnOrderChange={setColumnOrder}
                                selectedCurrency={selectedCurrency || undefined}
                                onRefresh={fetchData}
                                isRestricted={!!serverAllowedFields}
                                pagination={{
                                    currentPage: pagination.currentPage,
                                    totalPages: pagination.totalPages,
                                    totalItems: pagination.totalItems,
                                    itemsPerPage: pagination.itemsPerPage,
                                    onPageChange: (page: number) => setPagination(prev => ({ ...prev, currentPage: page }))
                                }}
                            />
                        ) : (
                            <TargetTable
                                data={targets}
                                isLoading={isLoading}
                                hasLoadedOnce={hasLoadedOnce}
                                onTogglePin={handleTogglePin}
                                visibleColumns={effectiveVisibleColumns}
                                columnOrder={columnOrder}
                                onColumnOrderChange={setColumnOrder}
                                selectedCurrency={selectedCurrency || undefined}
                                onRefresh={fetchData}
                                isRestricted={!!serverAllowedFields}
                                pagination={{
                                    currentPage: pagination.currentPage,
                                    totalPages: pagination.totalPages,
                                    totalItems: pagination.totalItems,
                                    itemsPerPage: pagination.itemsPerPage,
                                    onPageChange: (page: number) => setPagination(prev => ({ ...prev, currentPage: page }))
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default ProspectsPortal;
