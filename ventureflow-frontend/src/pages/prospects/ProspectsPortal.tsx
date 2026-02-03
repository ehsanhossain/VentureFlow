import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../../routes/AuthContext';
import api from '../../config/api';
import { InvestorTable, InvestorRowData } from './components/InvestorTable';
import { TargetTable, TargetRowData } from './components/TargetTable';
import {
    Search,
    Plus,
    ChevronDown,
    X,
    Filter,
    RotateCcw,
    Settings2,
    Check,
    DollarSign,
    Layout,
    Download,
    Upload,
    AlertCircle,
    FileSpreadsheet,
    Zap
} from 'lucide-react';
import { showAlert } from '../../components/Alert';
import { isFieldAllowed } from '../../utils/permissionUtils';

interface Country {
    id: number;
    name: string;
    flagSrc: string;
}

interface Currency {
    id: number;
    code: string;
    sign: string;
    exchange_rate: string;
}

const ALL_INVESTOR_COLUMNS = [
    { id: 'projectCode', label: 'Project Code' },
    { id: 'rank', label: 'Rank' },
    { id: 'companyName', label: 'Company Name' },
    { id: 'originCountry', label: 'Origin Country' },
    { id: 'website', label: 'Website' },
    { id: 'targetIndustries', label: 'Target Business & Industry' },
    { id: 'targetCountries', label: 'Where the investor wants to invest?' },
    { id: 'purposeMNA', label: 'Purpose of M&A' },
    { id: 'budget', label: 'Investment Budget' },
    { id: 'investmentCondition', label: 'Investment Condition' },
    { id: 'internalPIC', label: 'Internal PIC' },
    { id: 'financialAdvisor', label: 'Financial Advisor' },
    { id: 'investorProfile', label: 'Investor Profile' },
    { id: 'introducedProjects', label: 'Introduced Projects' },
    { id: 'primaryContact', label: 'Primary Contact' },
    { id: 'email', label: 'Email' },
    { id: 'phone', label: 'Phone' },
    { id: 'channel', label: 'Channel' },
    { id: 'pipelineStatus', label: 'Pipeline Status' },
];

const DEFAULT_INVESTOR_COLUMNS = ['projectCode', 'rank', 'companyName', 'primaryContact', 'hq', 'targetCountries', 'targetIndustries', 'pipelineStatus', 'budget'];

const ALL_TARGET_COLUMNS = [
    { id: 'projectCode', label: 'Project Code' },
    { id: 'rank', label: 'Rank' },
    { id: 'companyName', label: 'Company Name' },
    { id: 'originCountry', label: 'HQ Country' },
    { id: 'status', label: 'Status' },
    { id: 'industry', label: 'Target Business & Industry' },
    { id: 'projectDetails', label: 'Project Details' },
    { id: 'reasonForMA', label: 'Purpose of M&A' },
    { id: 'saleShareRatio', label: 'Planned Ratio Sale' },
    { id: 'desiredInvestment', label: 'Desired Investment' },
    { id: 'ebitda', label: 'EBITDA' },
    { id: 'internalPIC', label: 'Assigned PIC' },
    { id: 'financialAdvisor', label: 'Financial Advisor' },
    { id: 'website', label: 'Website' },
    { id: 'teaserLink', label: 'Teaser Profile' },
    { id: 'introducedProjects', label: 'Introduced Projects' },
    { id: 'primaryContact', label: 'Primary Contact' },
    { id: 'primaryEmail', label: 'Email' },
    { id: 'primaryPhone', label: 'Phone' },
    { id: 'channel', label: 'Channel' },
    { id: 'pipelineStatus', label: 'Pipeline Status' },
    { id: 'addedDate', label: 'Added Date' },
];

const DEFAULT_TARGET_COLUMNS = ['projectCode', 'hq', 'industry', 'desiredInvestment', 'reasonForMA', 'saleShareRatio', 'rank', 'status'];



const ProspectsPortal: React.FC = () => {
    const navigate = useNavigate();
    const auth = useContext(AuthContext);
    const isPartner = auth?.isPartner;
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
    const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
        const saved = localStorage.getItem(`prospects_columns_${activeTab}`);
        return saved ? JSON.parse(saved) : (activeTab === 'investors' ? DEFAULT_INVESTOR_COLUMNS : DEFAULT_TARGET_COLUMNS);
    });

    // Update visible columns when tab changes
    useEffect(() => {
        const saved = localStorage.getItem(`prospects_columns_${activeTab}`);
        setVisibleColumns(saved ? JSON.parse(saved) : (activeTab === 'investors' ? DEFAULT_INVESTOR_COLUMNS : DEFAULT_TARGET_COLUMNS));
    }, [activeTab]);

    useEffect(() => {
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

            const [buyerRes, sellerRes] = await Promise.all([
                api.get('/api/buyer', {
                    params: {
                        search: searchQuery,
                        ...filters,
                        page: activeTab === 'investors' ? pagination.currentPage : undefined, // Only paginate active tab fetch effectively
                        per_page: pagination.itemsPerPage
                    }
                }),
                api.get('/api/seller', {
                    params: {
                        search: searchQuery,
                        ...filters,
                        page: activeTab === 'targets' ? pagination.currentPage : undefined,
                        per_page: pagination.itemsPerPage
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
                    const hqCountryId = overview.hq_country;
                    const hqCountry = countries.find(c => String(c.id) === String(hqCountryId));

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
                        pipelineStatus: b.deals && b.deals.length > 0 ? b.deals[b.deals.length - 1].stage_name : (b.pipeline_status || b.current_stage || "N/A"),
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
                        sourceCurrencyRate: sourceRate
                    };
                });
                setInvestors(mappedInvestors);
            } else {
                const mappedTargets: TargetRowData[] = sellerDataRaw.map((s: any) => {
                    const ov = s.company_overview || {};
                    const fin = s.financial_details || {};
                    const hqCountry = countries.find(c => String(c.id) === String(ov.hq_country));

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
                        pipelineStatus: s.deals && s.deals.length > 0 ? s.deals[s.deals.length - 1].stage_name : (ov.status || "N/A"),
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
                        sourceCurrencyRate: sourceRate
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
    const [filters, setFilters] = useState({
        status: '',
        country: '',
        industry: '',
    });

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
            if (isToolsOpen && toolsDropdownRef.current && !toolsDropdownRef.current.contains(event.target as Node)) {
                setIsToolsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isFilterOpen, isToolsOpen, isCreateOpen]);

    // Fetch Initial Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [countryRes, currencyRes] = await Promise.all([
                    api.get('/api/countries'),
                    api.get('/api/currencies')
                ]);

                if (countryRes.data) {
                    const dataArray = Array.isArray(countryRes.data) ? countryRes.data : (countryRes.data.data || []);
                    setCountries(dataArray.map((c: any) => ({
                        id: c.id,
                        name: c.name,
                        flagSrc: c.svg_icon_url
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
                    const usd = currData.find((c: any) => c.currency_code === 'USD');
                    if (usd) {
                        setSelectedCurrency({
                            id: usd.id,
                            code: usd.currency_code,
                            symbol: usd.currency_sign,
                            rate: parseFloat(usd.exchange_rate || '1')
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
            } catch (error) {
                console.error("Failed to fetch initial data", error);
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
    }, [activeTab, searchQuery, countries, investorPinnedIds, targetPinnedIds, filters, pagination.currentPage, pagination.itemsPerPage]);

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
        setVisibleColumns(prev => prev.includes(columnId) ? prev.filter(c => c !== columnId) : [...prev, columnId]);
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
                "nicheTags",
                "projectDetails",
                "reasonForMA",
                "plannedSaleShareRatio",
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
                "SaaS, AI", "Generative AI", "Selling core business unit", "Exit",
                "100", "500000", "2000000", "EUR", "100000", "200000",
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

            {/* Filter Side Drawer */}
            {isFilterOpen && (
                <>
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300" onClick={() => setIsFilterOpen(false)} />
                    <div ref={filterDrawerRef} className="fixed right-0 top-0 h-full w-[380px] bg-white border-l border-gray-100 z-50 flex flex-col animate-in slide-in-from-right duration-300 shadow-2xl">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-50">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded bg-[#F1FBFF] text-[#064771] flex items-center justify-center">
                                    <Filter className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-medium text-gray-900">Advanced Filters</h2>
                                    <p className="text-xs text-gray-500 mt-0.5 font-medium">Refine your prospects list</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsFilterOpen(false)}
                                className="p-2.5 hover:bg-gray-100 rounded transition-all duration-200 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2.5 ml-1">Status</label>
                                    <div className="relative group">
                                        <select
                                            className="w-full h-12 px-4 bg-gray-50/50 border border-gray-200 rounded text-sm font-medium focus:outline-none focus:ring-4 focus:ring-[#064771]/5 focus:border-[#064771] appearance-none transition-all cursor-pointer group-hover:border-gray-300"
                                            value={filters.status}
                                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                        >
                                            <option value="">All Statuses</option>
                                            <option value="Active">Active</option>
                                            <option value="In Progress">In Progress</option>
                                            <option value="Interested">Interested</option>
                                            <option value="NDA">NDA</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-gray-600 transition-colors">
                                            <ChevronDown className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2.5 ml-1">HQ Country</label>
                                    <div className="relative group">
                                        <select
                                            className="w-full h-12 px-4 bg-gray-50/50 border border-gray-200 rounded-[3px] text-sm font-medium focus:outline-none focus:ring-4 focus:ring-[#064771]/5 focus:border-[#064771] appearance-none transition-all cursor-pointer group-hover:border-gray-300"
                                            value={filters.country}
                                            onChange={(e) => setFilters({ ...filters, country: e.target.value })}
                                        >
                                            <option value="">All Countries</option>
                                            {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-gray-600 transition-colors">
                                            <ChevronDown className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex flex-col gap-3">
                            <button
                                className="w-full py-4 bg-[#064771] text-white rounded-[3px] font-medium hover:bg-[#053a5c] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
                                onClick={() => setIsFilterOpen(false)}
                            >
                                Apply Filters
                            </button>
                            <button
                                className="w-full py-4 bg-white border border-gray-200 text-gray-600 rounded-[3px] font-medium flex items-center justify-center gap-2 hover:bg-gray-50 hover:text-gray-900 active:scale-[0.98] transition-all duration-200"
                                onClick={() => setFilters({ status: '', country: '', industry: '' })}
                            >
                                <RotateCcw className="w-4 h-4" />
                                Reset Filters
                            </button>
                        </div>
                    </div>
                </>
            )}

            <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50 font-poppins overflow-hidden">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-center justify-between px-4 md:px-6 py-4 bg-white border-b gap-4">
                    <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
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

                        <div className="relative group w-full md:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#064771] transition-colors" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder={`Search for ${activeTab}...`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-10 py-2 bg-white border border-gray-200 rounded-[3px] text-sm focus:outline-none focus:ring-2 focus:ring-[#064771] transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        {!isPartner && (
                            <button
                                onClick={() => navigate('/prospects/drafts')}
                                className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-600 px-4 py-2 rounded-[3px] border border-gray-200 text-sm font-medium transition-all active:scale-95"
                            >
                                <Zap className="w-4 h-4 text-orange-400" />
                                <span>Drafts</span>
                                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-orange-100 px-1 text-[10px] font-bold text-orange-600">
                                    0
                                </span>
                            </button>
                        )}

                        <div className="relative" ref={toolsDropdownRef}>
                            <button
                                onClick={() => setIsToolsOpen(!isToolsOpen)}
                                className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-[3px] border border-gray-200 text-sm font-medium transition-all active:scale-95"
                            >
                                <Settings2 className="w-4 h-4 text-gray-400" />
                                Tools
                            </button>
                            {isToolsOpen && (
                                <div className="absolute right-0 mt-2 w-64 bg-white rounded-[3px] border border-gray-100 p-4 z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-right shadow-2xl">
                                    <div className="space-y-4">
                                        <div className="pb-3 border-b border-gray-50">
                                            <div className="flex items-center gap-2 mb-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                <DollarSign className="w-3 h-3" /> Currency
                                            </div>
                                            <select
                                                className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-[3px] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#064771]/10 focus:border-[#064771]"
                                                value={selectedCurrency?.id}
                                                onChange={(e) => {
                                                    const curr = currencies.find(c => c.id === Number(e.target.value));
                                                    if (curr) setSelectedCurrency({ id: curr.id, code: curr.code, symbol: curr.sign, rate: parseFloat(curr.exchange_rate) });
                                                }}
                                            >
                                                {currencies.map(c => <option key={c.id} value={c.id}>{c.code} ({c.sign})</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                <Layout className="w-3 h-3" /> Visible Columns
                                            </div>
                                            <div className="space-y-1 max-h-56 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-100">
                                                {(activeTab === 'investors' ? ALL_INVESTOR_COLUMNS : ALL_TARGET_COLUMNS).map(col => (
                                                    <button
                                                        key={col.id}
                                                        onClick={() => toggleColumn(col.id)}
                                                        className={`flex items-center justify-between w-full px-3 py-2 text-xs rounded-[3px] transition-all ${visibleColumns.includes(col.id)
                                                            ? 'bg-blue-50/50 text-blue-700 font-medium'
                                                            : 'text-gray-500 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        <span>{col.label}</span>
                                                        {visibleColumns.includes(col.id) && <Check className="w-3 h-3" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

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
