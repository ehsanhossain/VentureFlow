import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../../routes/AuthContext';
import api from '../../config/api';
import { InvestorTable, InvestorRowData } from './components/InvestorTable';
import { TargetTable, TargetRowData } from './components/TargetTable';
import {
    Plus,
    ChevronDown,
    X,
    Filter,
    RotateCcw,
    Settings2,
    DollarSign,
    Download,
    Upload,
    AlertCircle,
    FileSpreadsheet,
    Eye,
    EyeOff,
    Columns
} from 'lucide-react';
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
    { id: 'projectCode', label: 'Project Code' },
    { id: 'rank', label: 'Rank' },
    { id: 'companyName', label: 'Company Name' },
    { id: 'companyIndustry', label: 'Industry' },
    { id: 'originCountry', label: 'Origin Country' },
    { id: 'website', label: 'Website' },
    { id: 'targetIndustries', label: 'Target Industry' },
    { id: 'targetCountries', label: 'Target Countries' },
    { id: 'purposeMNA', label: 'Purpose of M&A' },
    { id: 'budget', label: 'Budget' },
    { id: 'investmentCondition', label: 'Condition' },
    { id: 'primaryContact', label: 'Contact' },
    { id: 'internalPIC', label: 'Assigned PIC' },
    { id: 'financialAdvisor', label: 'Partner FA' },
    { id: 'investorProfileLink', label: 'Investor Profile' },
    { id: 'pipelineStatus', label: 'Pipeline' },
];

const DEFAULT_INVESTOR_COLUMNS = ['projectCode', 'rank', 'companyName', 'primaryContact', 'originCountry', 'targetCountries', 'targetIndustries', 'pipelineStatus', 'budget'];

const ALL_TARGET_COLUMNS = [
    { id: 'projectCode', label: 'Project Code' },
    { id: 'rank', label: 'Rank' },
    { id: 'companyName', label: 'Company Name' },
    { id: 'originCountry', label: 'Origin Country' },
    { id: 'website', label: 'Website' },
    { id: 'industry', label: 'Industry' },
    { id: 'reasonForMA', label: 'Purpose of M&A' },
    { id: 'saleShareRatio', label: 'Sale Ratio' },
    { id: 'investmentCondition', label: 'Condition' },
    { id: 'desiredInvestment', label: 'Desired Investment' },
    { id: 'ebitda', label: 'EBITDA' },
    { id: 'internalPIC', label: 'Assigned PIC' },
    { id: 'financialAdvisor', label: 'Partner FA' },
    { id: 'primaryContact', label: 'Contact' },
    { id: 'teaserLink', label: 'Teaser' },
    { id: 'pipelineStatus', label: 'Pipeline' },
];

const DEFAULT_TARGET_COLUMNS = ['projectCode', 'companyName', 'originCountry', 'industry', 'desiredInvestment', 'reasonForMA', 'saleShareRatio', 'rank', 'pipelineStatus'];



const ProspectsPortal: React.FC = () => {
    const navigate = useNavigate();
    const auth = useContext(AuthContext);
    const isPartner = auth?.isPartner;
    const { settings: globalSettings } = useGeneralSettings();
    const [searchParams, setSearchParams] = useSearchParams();
    const initialTab = (searchParams.get('tab') as 'investors' | 'targets') || 'investors';
    const [activeTab, setActiveTab] = useState<'investors' | 'targets'>(initialTab);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
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

    const [countries, setCountries] = useState<Country[]>([]);
    const [currencies, setCurrencies] = useState<Currency[]>([]);
    const [counts, setCounts] = useState({ investors: 0, targets: 0 });
    const [investorPinnedIds, setInvestorPinnedIds] = useState<number[]>(() => {
        const saved = localStorage.getItem('prospects_pinned_ids_investors');
        return saved ? JSON.parse(saved) : [];
    });

    const [targetPinnedIds, setTargetPinnedIds] = useState<number[]>(() => {
        const saved = localStorage.getItem('prospects_pinned_ids_targets');
        return saved ? JSON.parse(saved) : [];
    });

    const [serverAllowedFields, setServerAllowedFields] = useState<any>(null);

    // Tools & Selection States
    const getValidColumns = (tab: 'investors' | 'targets'): string[] => {
        const allCols = tab === 'investors' ? ALL_INVESTOR_COLUMNS : ALL_TARGET_COLUMNS;
        const validIds = new Set(allCols.map(c => c.id));
        const defaults = tab === 'investors' ? DEFAULT_INVESTOR_COLUMNS : DEFAULT_TARGET_COLUMNS;
        const saved = localStorage.getItem(`prospects_columns_${tab}`);
        if (!saved) return [...defaults];
        try {
            const parsed: string[] = JSON.parse(saved);
            const filtered = parsed.filter(id => validIds.has(id));
            return filtered.length > 0 ? filtered : [...defaults];
        } catch {
            return [...defaults];
        }
    };

    const [visibleColumns, setVisibleColumns] = useState<string[]>(() => getValidColumns(activeTab));

    // Track which tab the current visibleColumns belong to, to prevent saving cross-tab
    const columnsTabRef = useRef<'investors' | 'targets'>(activeTab);

    // When activeTab changes, load the correct columns for the new tab
    useEffect(() => {
        const newCols = getValidColumns(activeTab);
        columnsTabRef.current = activeTab;
        setVisibleColumns(newCols);
    }, [activeTab]);

    // Persist columns to localStorage — only when the columns actually belong to the current tab
    useEffect(() => {
        // Guard: don't persist if visibleColumns hasn't caught up with the tab switch yet
        if (columnsTabRef.current !== activeTab) return;
        localStorage.setItem(`prospects_columns_${activeTab}`, JSON.stringify(visibleColumns));
    }, [visibleColumns, activeTab]);

    const [selectedCurrency, setSelectedCurrency] = useState<{ id: number; code: string; symbol: string; rate: number } | null>(null);

    // Dropdown and UI States
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isToolsOpen, setIsToolsOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importType, setImportType] = useState<'investors' | 'targets'>('investors');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
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

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
        }
    };


    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer.files?.[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Fetch currencies first if not already loaded fully (we need them for rate conversion)
            let currentCurrencies = currencies;
            if (currencies.length <= 10) {
                const currencyRes = await api.get('/api/currencies', { params: { per_page: 1000 } });
                const currDataRaw = Array.isArray(currencyRes.data) ? currencyRes.data : (currencyRes.data.data || []);
                currentCurrencies = currDataRaw.map((c: any) => ({
                    id: c.id,
                    code: c.currency_code,
                    sign: c.currency_sign,
                    exchange_rate: c.exchange_rate
                }));
                setCurrencies(currentCurrencies);
            }

            // Build clean filter params (only non-empty values)
            const filterParams: Record<string, any> = {};
            if (filters.country) filterParams.country = filters.country;
            if (filters.broader_industries?.length > 0) filterParams.broader_industries = filters.broader_industries;
            if (filters.priority_industries?.length > 0) filterParams.priority_industries = filters.priority_industries;
            if (filters.registered_after) filterParams.registered_after = filters.registered_after;
            if (filters.registered_before) filterParams.registered_before = filters.registered_before;
            if (filters.pipeline_stage) filterParams.pipeline_stage = filters.pipeline_stage;
            if (filters.target_countries?.length > 0) filterParams.target_countries = filters.target_countries;
            if (filters.expected_investment_amount?.min || filters.expected_investment_amount?.max) {
                filterParams.expected_investment_amount = {};
                if (filters.expected_investment_amount.min) filterParams.expected_investment_amount.min = filters.expected_investment_amount.min;
                if (filters.expected_investment_amount.max) filterParams.expected_investment_amount.max = filters.expected_investment_amount.max;
            }

            const [buyerRes, sellerRes] = await Promise.all([
                api.get('/api/buyer', {
                    params: {
                        search: searchQuery,
                        ...filterParams,
                        page: activeTab === 'investors' ? pagination.currentPage : undefined,
                        per_page: itemsPerPageRef.current
                    }
                }),
                api.get('/api/seller', {
                    params: {
                        search: searchQuery,
                        ...filterParams,
                        page: activeTab === 'targets' ? pagination.currentPage : undefined,
                        per_page: itemsPerPageRef.current
                    }
                })
            ]);

            const buyerData = Array.isArray(buyerRes.data?.data) ? buyerRes.data.data : [];
            const sellerDataRaw = Array.isArray(sellerRes.data?.data) ? sellerRes.data.data : [];

            // Update Counts (total items in DB independent of page if possible, otherwise use meta.total)
            setCounts({
                investors: buyerRes.data?.meta?.total ?? 0,
                targets: sellerRes.data?.meta?.total ?? 0
            });

            // Update Pagination from Active Tab Meta
            const activeMeta = activeTab === 'investors' ? buyerRes.data?.meta : sellerRes.data?.meta;
            if (activeMeta) {
                setPagination(prev => {
                    if (prev.currentPage === activeMeta.current_page &&
                        prev.totalPages === activeMeta.last_page &&
                        prev.totalItems === activeMeta.total &&
                        prev.itemsPerPage === activeMeta.per_page) {
                        return prev;
                    }
                    return {
                        ...prev,
                        currentPage: activeMeta.current_page,
                        totalPages: activeMeta.last_page,
                        totalItems: activeMeta.total,
                        itemsPerPage: activeMeta.per_page
                    };
                });
            }

            // Set allowed fields based on active tab
            const meta = activeTab === 'investors' ? buyerRes.data?.meta : sellerRes.data?.meta;
            setServerAllowedFields(meta?.allowed_fields || null);

            if (activeTab === 'investors') {
                const mappedInvestors: InvestorRowData[] = buyerData.map((b: any) => {
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
                        try { contactsRaw = JSON.parse(contactsRaw); } catch (e) { contactsRaw = []; }
                    }

                    const primaryContactObj = Array.isArray(contactsRaw)
                        ? (contactsRaw.find((c: any) => c.isPrimary) || contactsRaw[0])
                        : null;

                    const primaryContactName = primaryContactObj?.name || overview.seller_contact_name || "N/A";

                    // Determine Source Currency Rate
                    const defaultCurrencyId = b.financial_details?.default_currency;
                    const sourceCurrencyVal = currentCurrencies.find(c => String(c.id) === String(defaultCurrencyId));
                    const sourceRate = sourceCurrencyVal ? parseFloat(sourceCurrencyVal.exchange_rate) : 1;


                    // Parse Helper
                    const parseArray = (data: any, key: string = 'name') => {
                        try {
                            const parsed = typeof data === 'string' ? JSON.parse(data) : data;
                            if (Array.isArray(parsed)) return parsed.map(i => i?.[key] || i).filter(Boolean);
                            return [];
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
                        investmentCondition: overview.investment_condition || "",
                        purposeMNA: overview.reason_ma || "",
                        internalPIC: internalPICs,
                        financialAdvisor: finAdvisors,
                        introducedProjects: introProjects,
                        investorProfile: overview.investor_profile_link || "",
                        isPinned: b.pinned || investorPinnedIds.includes(b.id),
                        website: overview.website,
                        email: overview.email,
                        phone: overview.phone,
                        channel: overview.channel,
                        sourceCurrencyRate: sourceRate,
                        companyIndustry: parseArray(overview.company_industry, 'name'),
                    };
                });
                setInvestors(mappedInvestors);
            } else {
                const mappedTargets: TargetRowData[] = sellerDataRaw.map((s: any) => {
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
                    } catch (e) { }

                    const defaultCurrencyId = fin.default_currency;
                    const sourceCurrencyVal = currentCurrencies.find(c => String(c.id) === String(defaultCurrencyId));
                    const sourceRate = sourceCurrencyVal ? parseFloat(sourceCurrencyVal.exchange_rate) : 1;

                    // Internal Owner (PIC)


                    // Parse Helper
                    const parseArray = (data: any, key: string = 'name') => {
                        try {
                            const parsed = typeof data === 'string' ? JSON.parse(data) : data;
                            if (Array.isArray(parsed)) return parsed.map(i => i?.[key] || i).filter(Boolean);
                            return [];
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
                        reasonForMA: ov.reason_ma || "",
                        saleShareRatio: fin.maximum_investor_shareholding_percentage || "",
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
                        channel: ov.channel,
                        isPinned: s.pinned || targetPinnedIds.includes(s.id),
                        sourceCurrencyRate: sourceRate,
                        investmentCondition: fin.investment_condition || '',
                    };
                });
                setTargets(mappedTargets);
            }
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setIsLoading(false);
        }
    };

    const startImport = async () => {
        if (!selectedFile) {
            showAlert({ type: 'error', message: 'Please select a file first' });
            return;
        }

        const formData = new FormData();
        formData.append('excel_file', selectedFile);

        try {
            const endpoint = importType === 'investors'
                ? '/api/import/buyers-company-overview'
                : '/api/import/sellers-company-overview';

            const response = await api.post(endpoint, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            showAlert({ type: 'success', message: response.data.message });
            setIsImportModalOpen(false);
            setSelectedFile(null);
            fetchData();
        } catch (error: any) {
            showAlert({
                type: 'error',
                message: error.response?.data?.message || 'Failed to import data'
            });
        }
    };

    const createDropdownRef = useRef<HTMLDivElement>(null);
    const filterDrawerRef = useRef<HTMLDivElement>(null);
    const toolsDropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Advanced Filters State
    const [filterOriginCountry, setFilterOriginCountry] = useState<DropdownCountry | null>(null);
    const [filterIndustry, setFilterIndustry] = useState<DropdownIndustry[]>([]);
    const [filterTargetIndustry, setFilterTargetIndustry] = useState<DropdownIndustry[]>([]);
    const [filterTargetCountries, setFilterTargetCountries] = useState<DropdownCountry[]>([]);
    const [pipelineStageFilter, setPipelineStageFilter] = useState('');
    const [filterDateFrom, setFilterDateFrom] = useState<Date | null>(null);
    const [filterDateTo, setFilterDateTo] = useState<Date | null>(null);
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [filterBudgetMin, setFilterBudgetMin] = useState('');
    const [filterBudgetMax, setFilterBudgetMax] = useState('');
    const [budgetRange, setBudgetRange] = useState({ min: 0, max: 100000000 });

    // Reference data for filters
    const [filterIndustries, setFilterIndustries] = useState<DropdownIndustry[]>([]);
    const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([]);
    const [draftCounts, setDraftCounts] = useState({ investors: 0, targets: 0 });

    // Build a unified filters object for the API (keeps backward compat with fetchData spread)
    const filters = React.useMemo(() => {
        const f: Record<string, any> = {};
        if (filterOriginCountry) f.country = filterOriginCountry.id;
        if (filterIndustry.length > 0) f.broader_industries = filterIndustry.map(i => i.id);
        if (filterTargetIndustry.length > 0) f.priority_industries = filterTargetIndustry.map(i => i.id);
        if (filterDateFrom) {
            const d = filterDateFrom;
            f.registered_after = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }
        if (filterDateTo) {
            const d = filterDateTo;
            f.registered_before = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }
        if (pipelineStageFilter) f.pipeline_stage = pipelineStageFilter;
        if (filterTargetCountries.length > 0) f.target_countries = filterTargetCountries.map(c => c.id);
        if (filterBudgetMin || filterBudgetMax) {
            f.expected_investment_amount = {};
            if (filterBudgetMin) f.expected_investment_amount.min = filterBudgetMin;
            if (filterBudgetMax) f.expected_investment_amount.max = filterBudgetMax;
        }
        return f;
    }, [filterOriginCountry, filterIndustry, filterTargetIndustry, filterDateFrom, filterDateTo, pipelineStageFilter, filterTargetCountries, filterBudgetMin, filterBudgetMax]);

    const activeFilterCount = [
        filterOriginCountry,
        filterIndustry.length > 0,
        filterTargetIndustry.length > 0,
        filterTargetCountries.length > 0,
        pipelineStageFilter,
        filterDateFrom || filterDateTo,
        filterBudgetMin || filterBudgetMax,
    ].filter(Boolean).length;

    // Persist preferences
    useEffect(() => {
        localStorage.setItem('prospects_pinned_ids_investors', JSON.stringify(investorPinnedIds));
    }, [investorPinnedIds]);

    useEffect(() => {
        localStorage.setItem('prospects_pinned_ids_targets', JSON.stringify(targetPinnedIds));
    }, [targetPinnedIds]);

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
                const [countryRes, currencyRes, industryRes, stagesRes, draftBuyerRes, draftSellerRes] = await Promise.all([
                    api.get('/api/countries'),
                    api.get('/api/currencies'),
                    api.get('/api/industries'),
                    api.get('/api/pipeline-stages'),
                    api.get('/api/buyer', { params: { status: 'Draft', per_page: 1 } }),
                    api.get('/api/seller', { params: { status: 'Draft', per_page: 1 } }),
                ]);

                if (countryRes.data) {
                    const dataArray = Array.isArray(countryRes.data) ? countryRes.data : (countryRes.data.data || []);
                    setCountries(dataArray.map((c: any) => ({
                        id: c.id,
                        name: c.name,
                        flagSrc: c.svg_icon_url,
                        status: c.status || 'registered'
                    })));
                }

                if (currencyRes.data) {
                    const currDataRaw = Array.isArray(currencyRes.data) ? currencyRes.data : (currencyRes.data.data || []);
                    const currData = currDataRaw.map((c: any) => ({
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
                const indData = Array.isArray(industryRes.data) ? industryRes.data : (industryRes.data?.data || []);
                setFilterIndustries(indData.map((i: any) => ({ id: i.id, name: i.name, sub_industries: i.sub_industries || [] })));

                // Pipeline Stages
                const stagesData = Array.isArray(stagesRes.data) ? stagesRes.data : (stagesRes.data?.data || []);
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
                const budgetRangeRes = await api.get('/api/buyer/budget-range');
                if (budgetRangeRes.data) {
                    setBudgetRange({
                        min: budgetRangeRes.data.min ?? 0,
                        max: budgetRangeRes.data.max ?? 100000000,
                    });
                }
            } catch (e) {
                console.warn("Budget range not available, using defaults");
            }
        };
        fetchData();
    }, []);

    // Reset pagination when tab or filters change
    useEffect(() => {
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    }, [activeTab, searchQuery, filters]);

    // Fetch Investors/Targets
    useEffect(() => {
        if (countries.length > 0) fetchData();
        // Note: pagination.itemsPerPage intentionally excluded to prevent resize-triggered refetch loops
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, searchQuery, countries, investorPinnedIds, targetPinnedIds, filters, pagination.currentPage]);

    const handleTogglePin = async (id: number) => {
        try {
            const isInvestor = activeTab === 'investors';
            const tab = isInvestor ? 'buyer' : 'seller';
            await api.post(`/api/${tab}/${id}/pinned`);

            if (isInvestor) {
                setInvestorPinnedIds(prev =>
                    prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
                );
            } else {
                setTargetPinnedIds(prev =>
                    prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
                );
            }
        } catch (error) {
            showAlert({ type: 'error', message: 'Failed to update pinned status' });
        }
    };

    const toggleColumn = (columnId: string) => {
        setVisibleColumns(prev => {
            const next = prev.includes(columnId)
                ? prev.filter(c => c !== columnId)
                : [...prev, columnId];
            // Immediately persist to localStorage for the current tab
            localStorage.setItem(`prospects_columns_${activeTab}`, JSON.stringify(next));
            return next;
        });
    };

    const downloadCsvTemplate = (type: 'investor' | 'target') => {
        let headers: string[] = [];
        let rowExample: string[] = [];

        if (type === 'investor') {
            headers = [
                "projectCode",
                "rank",
                "companyName",
                "originCountry",
                "websiteLinks",
                "hqAddresses",
                "targetIndustries",
                "targetCountries",
                "purposeMNA",
                "budgetMin",
                "budgetMax",
                "budgetCurrency",
                "investmentCondition",
                "internal_pic",
                "financialAdvisor",
                "investorProfileLink",
                "contacts"
            ];
            rowExample = [
                "AB-B-001", "B", "Acme Invest Corp", "United States", "https://acme.com",
                "New York, NY", "Tech, Finance", "Japan, Singapore", "Market Expansion",
                "1000000", "5000000", "USD", "Minority Share", "John Doe", "Consultant A",
                "https://profile.com/acme", "[{\"name\":\"Alice\",\"email\":\"alice@acme.com\"}]"
            ];
        } else {
            headers = [
                "projectCode",
                "rank",
                "companyName",
                "originCountry",
                "status",
                "targetIndustries",
                "projectDetails",
                "reasonForMA",
                "plannedSaleShareRatio",
                "investmentCondition",
                "desiredInvestmentMin",
                "desiredInvestmentMax",
                "desiredInvestmentCurrency",
                "ebitdaMin",
                "ebitdaMax",
                "internal_pic",
                "financialAdvisor",
                "websiteLinks",
                "teaserLink"
            ];
            rowExample = [
                "XX-S-001", "A", "Global Tech Sellers", "Germany", "Active",
                "SaaS, AI", "Selling core business unit", "Exit",
                "100", "Minority Share", "500000", "2000000", "EUR", "100000", "200000",
                "Jane Smith", "Advisor B", "https://techsellers.com", "https://doc.com/teaser"
            ];
        }

        // CSV Escape Helper
        const escapeCsv = (val: string) => {
            if (!val) return "";
            if (val.includes(",") || val.includes("\"") || val.includes("\n")) {
                return `"${val.replace(/"/g, '""')}"`;
            }
            return val;
        };

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rowExample.map(escapeCsv).join(",");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${type}_import_template.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    const effectiveVisibleColumns = visibleColumns.filter(col =>
        isFieldAllowed(col, serverAllowedFields, activeTab)
    );

    return (
        <>
            {/* Import Modal */}
            {isImportModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 max-w-lg w-full transform transition-all animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-medium text-gray-900">Import Data</h3>
                            <button onClick={() => setIsImportModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="flex bg-gray-100 p-1 rounded-xl">
                                <button
                                    onClick={() => setImportType('investors')}
                                    className={`flex-1 py-2 text-xs font-medium rounded-[3px] transition-all ${importType === 'investors' ? 'bg-white text-[#064771] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Investors
                                </button>
                                <button
                                    onClick={() => setImportType('targets')}
                                    className={`flex-1 py-2 text-xs font-medium rounded-[3px] transition-all ${importType === 'targets' ? 'bg-white text-[#064771] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Targets
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div
                                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                    onDrop={handleDrop}
                                    onClick={() => document.getElementById('csv-upload')?.click()}
                                    className={`relative group cursor-pointer border-2 border-dashed rounded-[3px] p-8 transition-all duration-300 flex flex-col items-center gap-4 ${selectedFile ? 'border-green-400 bg-green-50/30' : 'border-gray-200 hover:border-[#064771] hover:bg-gray-50'
                                        }`}
                                >
                                    <input
                                        id="csv-upload"
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept=".csv,.xlsx,.xls"
                                        onChange={handleFileSelect}
                                    />
                                    <div className={`w-16 h-16 rounded-full bg-white border border-gray-100 flex items-center justify-center transition-colors ${selectedFile ? 'text-[#064771]' : 'text-gray-400 group-hover:text-[#064771]'
                                        }`}>
                                        <FileSpreadsheet className="w-8 h-8" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-medium text-gray-900">
                                            {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : 'CSV, XLSX files only, max 10MB'}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-4 bg-amber-50 rounded-[3px] border border-amber-100">
                                        <div className="flex gap-3">
                                            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium text-amber-900">Important Note</p>
                                                <p className="text-xs text-amber-700 leading-relaxed">
                                                    Please download and use our template to ensure your data is correctly formatted.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                downloadCsvTemplate(importType === 'investors' ? 'investor' : 'target');
                                            }}
                                            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-white border border-gray-200 rounded-[3px] text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
                                        >
                                            <Download className="w-4 h-4" />
                                            Download Template
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                startImport();
                                            }}
                                            disabled={!selectedFile}
                                            className="flex-1 py-3 px-4 bg-[#064771] text-white rounded-[3px] text-sm font-medium hover:bg-[#053a5c] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Start Import
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-8 pt-4 border-t border-gray-100 flex gap-3">
                            <button onClick={() => setIsImportModalOpen(false)} className="flex-1 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Filter Side Drawer — matches Tools flyover design */}
            {isFilterOpen && (
                <>
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] transition-opacity duration-300" onClick={() => setIsFilterOpen(false)} />
                    <div ref={filterDrawerRef} className="fixed right-0 top-0 h-full w-[440px] bg-white border-l border-gray-100 z-[201] flex flex-col animate-in slide-in-from-right duration-300 shadow-2xl overflow-x-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-base font-medium text-gray-900 font-['Inter']">Filters</h2>
                            <button
                                onClick={() => setIsFilterOpen(false)}
                                className="p-1.5 hover:bg-gray-100 rounded-[3px] transition-all duration-200 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto overflow-x-hidden">
                            {/* Origin Country */}
                            <div className="px-6 pt-5 pb-4 border-b border-gray-100">
                                <label className="block mb-1.5 text-[13px] font-medium text-gray-700 font-['Inter']">
                                    Origin Country
                                </label>
                                <Dropdown
                                    countries={countries as DropdownCountry[]}
                                    selected={filterOriginCountry as DropdownCountry | null}
                                    onSelect={((c: DropdownCountry | DropdownCountry[]) => {
                                        if (Array.isArray(c)) {
                                            setFilterOriginCountry(c[0] || null);
                                        } else {
                                            setFilterOriginCountry(filterOriginCountry?.id === c.id ? null : c);
                                        }
                                    }) as any}
                                    placeholder="Select Country"
                                />
                            </div>

                            {/* Industry (investor's own industry) */}
                            <div className="px-6 pt-4 pb-4 border-b border-gray-100">
                                <label className="block mb-1.5 text-[13px] font-medium text-gray-700 font-['Inter']">
                                    Industry
                                </label>
                                <IndustryDropdown
                                    industries={filterIndustries}
                                    selected={filterIndustry}
                                    onSelect={(val) => setFilterIndustry(Array.isArray(val) ? val : [val])}
                                    multiSelect={true}
                                    placeholder="Select Industries"
                                />
                            </div>

                            {/* Target Business & Industry (Investors only) */}
                            {activeTab === 'investors' && (
                                <div className="px-6 pt-4 pb-4 border-b border-gray-100">
                                    <label className="block mb-1.5 text-[13px] font-medium text-gray-700 font-['Inter']">
                                        Target Business & Industry
                                    </label>
                                    <IndustryDropdown
                                        industries={filterIndustries}
                                        selected={filterTargetIndustry}
                                        onSelect={(val) => setFilterTargetIndustry(Array.isArray(val) ? val : [val])}
                                        multiSelect={true}
                                        placeholder="Select Target Industries"
                                    />
                                </div>
                            )}

                            {/* Interested Country (Investors only) */}
                            {activeTab === 'investors' && (
                                <div className="px-6 pt-4 pb-4 border-b border-gray-100">
                                    <label className="block mb-1.5 text-[13px] font-medium text-gray-700 font-['Inter']">
                                        Interested Country
                                    </label>
                                    <Dropdown
                                        countries={countries as DropdownCountry[]}
                                        selected={filterTargetCountries as DropdownCountry[]}
                                        onSelect={((c: DropdownCountry | DropdownCountry[]) => {
                                            if (Array.isArray(c)) {
                                                setFilterTargetCountries(c as Country[]);
                                            } else {
                                                const exists = filterTargetCountries.some(tc => tc.id === c.id);
                                                setFilterTargetCountries(
                                                    exists
                                                        ? filterTargetCountries.filter(tc => tc.id !== c.id)
                                                        : [...filterTargetCountries, c as Country]
                                                );
                                            }
                                        }) as any}
                                        multiSelect
                                        placeholder="Select Countries"
                                    />
                                </div>
                            )}

                            {/* Pipeline Stage */}
                            <div className="px-6 pt-4 pb-4 border-b border-gray-100">
                                <label className="block mb-1.5 text-[13px] font-medium text-gray-700 font-['Inter']">
                                    Pipeline Stage
                                </label>
                                <div className="relative">
                                    <select
                                        className="w-full h-10 px-3 py-2 bg-white rounded-[3px] border border-gray-300 text-sm font-normal font-['Inter'] text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-300 appearance-none cursor-pointer transition-colors"
                                        value={pipelineStageFilter}
                                        onChange={(e) => setPipelineStageFilter(e.target.value)}
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
                            <div className="px-6 pt-4 pb-4 border-b border-gray-100">
                                <label className="block mb-1.5 text-[13px] font-medium text-gray-700 font-['Inter']">
                                    Registered between
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                                    className="w-full h-10 px-3 py-2 bg-white rounded-[3px] border border-gray-300 text-sm font-normal font-['Inter'] text-left flex items-center justify-between hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-300 transition-colors cursor-pointer"
                                >
                                    <span className={filterDateFrom || filterDateTo ? 'text-gray-900' : 'text-gray-400'}>
                                        {filterDateFrom && filterDateTo
                                            ? `${filterDateFrom.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} – ${filterDateTo.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`
                                            : filterDateFrom
                                                ? `From ${filterDateFrom.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`
                                                : 'Select date range'}
                                    </span>
                                    <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                                </button>
                                {isDatePickerOpen && (
                                    <div className="mt-2 ventureflow-date-range">
                                        <DateRange
                                            ranges={[{
                                                startDate: filterDateFrom || new Date(),
                                                endDate: filterDateTo || new Date(),
                                                key: 'selection'
                                            }]}
                                            onChange={(item: any) => {
                                                setFilterDateFrom(item.selection.startDate);
                                                setFilterDateTo(item.selection.endDate);
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

                            {/* Investment Budget (Investors only) */}
                            {activeTab === 'investors' && (
                                <div className="px-6 pt-4 pb-4 overflow-hidden">
                                    <label className="block mb-1.5 text-[13px] font-medium text-gray-700 font-['Inter']">
                                        Investment Budget
                                    </label>
                                    <div className="flex items-center gap-2 w-full">
                                        <input
                                            type="number"
                                            placeholder="Min"
                                            className="flex-1 min-w-0 h-10 px-3 py-2 bg-white rounded-[3px] border border-gray-300 text-sm font-normal font-['Inter'] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-300 transition-colors"
                                            value={filterBudgetMin}
                                            onChange={(e) => setFilterBudgetMin(e.target.value)}
                                        />
                                        <span className="text-gray-400 text-sm font-normal flex-shrink-0">–</span>
                                        <input
                                            type="number"
                                            placeholder="Max"
                                            className="flex-1 min-w-0 h-10 px-3 py-2 bg-white rounded-[3px] border border-gray-300 text-sm font-normal font-['Inter'] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-300 transition-colors"
                                            value={filterBudgetMax}
                                            onChange={(e) => setFilterBudgetMax(e.target.value)}
                                        />
                                    </div>
                                    <div className="mt-4">
                                        <BudgetRangeSlider
                                            globalMin={budgetRange.min}
                                            globalMax={budgetRange.max}
                                            currentMin={filterBudgetMin}
                                            currentMax={filterBudgetMax}
                                            onMinChange={setFilterBudgetMin}
                                            onMaxChange={setFilterBudgetMax}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-gray-100">
                            <button
                                onClick={() => {
                                    setFilterOriginCountry(null);
                                    setFilterIndustry([]);
                                    setFilterTargetIndustry([]);
                                    setFilterTargetCountries([]);
                                    setPipelineStageFilter('');
                                    setFilterDateFrom(null);
                                    setFilterDateTo(null);
                                    setIsDatePickerOpen(false);
                                    setFilterBudgetMin('');
                                    setFilterBudgetMax('');
                                }}
                                className="w-full py-2.5 bg-white border border-gray-200 text-gray-600 rounded-[3px] text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-50 hover:text-gray-900 active:scale-[0.98] transition-all duration-200"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Reset All Filters
                            </button>
                        </div>
                    </div>
                </>
            )}

            <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50 font-poppins overflow-hidden">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-center justify-between px-4 md:px-6 py-4 bg-white border-b gap-4">
                    <div className="flex flex-col md:flex-row items-center gap-8 w-full md:w-auto">
                        <h1 className="text-xl md:text-2xl font-medium text-gray-900 w-full md:w-auto">Prospects</h1>

                        <div className="flex bg-gray-100 rounded-[3px] p-1">
                            <button
                                onClick={() => {
                                    setActiveTab('investors');
                                    setSearchParams({ tab: 'investors' });
                                }}
                                className={`px-4 py-1.5 rounded-[3px] text-xs font-medium transition-all duration-200 ${activeTab === 'investors'
                                    ? 'bg-white text-[#064771] shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Investors <span className={`ml-1 text-[10px] opacity-60`}>({counts.investors})</span>
                            </button>
                            <button
                                onClick={() => {
                                    setActiveTab('targets');
                                    setSearchParams({ tab: 'targets' });
                                }}
                                className={`px-4 py-1.5 rounded-[3px] text-xs font-medium transition-all duration-200 ${activeTab === 'targets'
                                    ? 'bg-white text-[#064771] shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Targets <span className={`ml-1 text-[10px] opacity-60`}>({counts.targets})</span>
                            </button>
                        </div>

                        <DataTableSearch
                            value={searchQuery}
                            onChange={setSearchQuery}
                            placeholder={`Search for ${activeTab}...`}
                            className="w-full md:w-72"
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        {!isPartner && (
                            <button
                                onClick={() => navigate('/prospects/drafts')}
                                className="flex items-center gap-1 bg-white hover:bg-gray-50 text-gray-600 px-4 py-2 rounded-[3px] border border-gray-200 text-sm font-medium transition-all active:scale-95"
                            >
                                Drafts{(draftCounts.investors + draftCounts.targets) > 0 && (
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
                            <Filter className="w-4 h-4" />
                            <span>Filter</span>
                            {activeFilterCount > 0 && (
                                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#064771] px-1 text-[10px] font-bold text-white">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>

                        <div ref={toolsDropdownRef}>
                            <button
                                onClick={() => setIsToolsOpen(!isToolsOpen)}
                                className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-[3px] border border-gray-200 text-sm font-medium transition-all active:scale-95"
                            >
                                <Settings2 className="w-4 h-4 text-gray-400" />
                                Tools
                            </button>
                        </div>

                        {/* Tools Flyover Drawer - Right Side */}
                        {isToolsOpen && (
                            <>
                                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] transition-opacity duration-300" onClick={() => setIsToolsOpen(false)} />
                                <div className="fixed right-0 top-0 h-full w-[380px] bg-white border-l border-gray-100 z-[201] flex flex-col animate-in slide-in-from-right duration-300 shadow-2xl">
                                    {/* Header */}
                                    <div className="flex items-center justify-between p-6 border-b border-gray-100">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-[3px] bg-[#F1FBFF] text-[#064771] flex items-center justify-center">
                                                <Settings2 className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h2 className="text-lg font-medium text-gray-900">Table Settings</h2>
                                                <p className="text-xs text-gray-500 mt-0.5 font-medium">Customize your view</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setIsToolsOpen(false)}
                                            className="p-2 hover:bg-gray-100 rounded-[3px] transition-all duration-200 text-gray-400 hover:text-gray-600"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 overflow-y-auto">
                                        {/* Currency Section */}
                                        <div className="p-6 border-b border-gray-50">
                                            <div className="flex items-center gap-2.5 mb-4">
                                                <DollarSign className="w-4 h-4 text-[#064771]" />
                                                <span className="text-sm font-medium text-gray-700">Display Currency</span>
                                            </div>
                                            <div className="relative">
                                                <select
                                                    className="w-full h-11 px-4 pr-10 bg-gray-50/80 border border-gray-200 rounded-[3px] text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#064771]/10 focus:border-[#064771] appearance-none cursor-pointer hover:border-gray-300 transition-all"
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
                                        <div className="p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2.5">
                                                    <Columns className="w-4 h-4 text-[#064771]" />
                                                    <span className="text-sm font-medium text-gray-700">Visible Columns</span>
                                                </div>
                                                <span className="text-[11px] font-medium text-gray-400">
                                                    {visibleColumns.length} of {(activeTab === 'investors' ? ALL_INVESTOR_COLUMNS : ALL_TARGET_COLUMNS).filter(col => isFieldAllowed(col.id, serverAllowedFields, activeTab)).length} active
                                                </span>
                                            </div>
                                            <div className="space-y-1">
                                                {(activeTab === 'investors' ? ALL_INVESTOR_COLUMNS : ALL_TARGET_COLUMNS)
                                                    .filter(col => isFieldAllowed(col.id, serverAllowedFields, activeTab))
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
                                                                        : <EyeOff className="w-4 h-4 text-gray-300 group-hover:text-gray-400" />
                                                                    }
                                                                    <span className={`text-sm ${isActive ? 'font-medium' : 'font-normal'}`}>
                                                                        {col.label}
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

                                    {/* Footer */}
                                    <div className="p-4 border-t border-gray-100">
                                        <button
                                            onClick={() => {
                                                const defaults = activeTab === 'investors' ? [...DEFAULT_INVESTOR_COLUMNS] : [...DEFAULT_TARGET_COLUMNS];
                                                setVisibleColumns(defaults);
                                                localStorage.setItem(`prospects_columns_${activeTab}`, JSON.stringify(defaults));
                                            }}
                                            className="w-full py-2.5 bg-white border border-gray-200 text-gray-600 rounded-[3px] text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-50 hover:text-gray-900 active:scale-[0.98] transition-all duration-200"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5" />
                                            Reset to Default
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
                                    <Plus className="w-4 h-4" />
                                    <span>Create</span>
                                    <ChevronDown className={`w-4 h-4 opacity-50 transition-transform duration-200 ${isCreateOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {isCreateOpen && (
                                    <div className="absolute right-0 mt-2 w-60 bg-white rounded-[3px] border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-right overflow-hidden shadow-2xl border border-gray-100">
                                        <button className="w-full text-left px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#064771] flex items-center gap-3 transition-colors font-medium" onClick={() => navigate('/prospects/add-investor')}>
                                            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-sm" />
                                            Add Investor
                                        </button>
                                        <button className="w-full text-left px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#064771] flex items-center gap-3 transition-colors font-medium" onClick={() => navigate('/prospects/add-target')}>
                                            <div className="w-2 h-2 rounded-full bg-orange-500 shadow-sm" />
                                            Add Target
                                        </button>
                                        <div className="h-px bg-gray-50 my-1.5 mx-3" />
                                        <button className="w-full text-left px-5 py-3 text-sm text-gray-600 font-medium hover:bg-gray-50 flex items-center gap-3 transition-colors" onClick={() => { setImportType('investors'); setIsImportModalOpen(true); setIsCreateOpen(false); }}>
                                            <Upload className="w-4 h-4 text-gray-400" /> Import Investors
                                        </button>
                                        <button className="w-full text-left px-5 py-3 text-sm text-gray-600 font-medium hover:bg-gray-50 flex items-center gap-3 transition-colors" onClick={() => { setImportType('targets'); setIsImportModalOpen(true); setIsCreateOpen(false); }}>
                                            <Upload className="w-4 h-4 text-gray-400" /> Import Targets
                                        </button>
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
                                onTogglePin={handleTogglePin}
                                visibleColumns={effectiveVisibleColumns}
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
                                onTogglePin={handleTogglePin}
                                visibleColumns={effectiveVisibleColumns}
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
