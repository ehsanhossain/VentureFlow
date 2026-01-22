import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
    FileSpreadsheet,
    AlertCircle
} from 'lucide-react';
import { showAlert } from '../../components/Alert';

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
    { id: 'primaryContact', label: 'Primary Contact' },
    { id: 'hq', label: 'HQ Country' },
    { id: 'targetCountries', label: 'Target Countries' },
    { id: 'targetIndustries', label: 'Target Industries' },
    { id: 'pipelineStatus', label: 'Pipeline Status' },
    { id: 'budget', label: 'Budget' },
    { id: 'companyType', label: 'Company Type' },
    { id: 'website', label: 'Website' },
    { id: 'email', label: 'Email' },
    { id: 'phone', label: 'Phone' },
    { id: 'employeeCount', label: 'Employees' },
    { id: 'yearFounded', label: 'Founded' },
];

const DEFAULT_INVESTOR_COLUMNS = ['projectCode', 'rank', 'companyName', 'primaryContact', 'hq', 'targetCountries', 'targetIndustries', 'pipelineStatus', 'budget'];

const ALL_TARGET_COLUMNS = [
    { id: 'addedDate', label: 'Added Date' },
    { id: 'projectCode', label: 'Project Code' },
    { id: 'hq', label: 'HQ Country' },
    { id: 'industry', label: 'Industry (Major)' },
    { id: 'industryMiddle', label: 'Industry (Middle)' },
    { id: 'projectDetails', label: 'Project Details' },
    { id: 'desiredInvestment', label: 'Desired Investment' },
    { id: 'reasonForMA', label: 'Reason for M&A' },
    { id: 'saleShareRatio', label: 'Sale Share Ratio' },
    { id: 'rank', label: 'Rank' },
    { id: 'status', label: 'Status' },
    { id: 'pipelineStatus', label: 'Pipeline' },
    { id: 'internalOwner', label: 'Person In-Charge' },
    { id: 'companyName', label: 'Company Name' },
    { id: 'primaryContact', label: 'Primary Contact' },
    { id: 'primaryEmail', label: 'Email' },
    { id: 'primaryPhone', label: 'Phone' },
    { id: 'website', label: 'Website' },
    { id: 'teaserLink', label: 'Teaser Link' },
];

const DEFAULT_TARGET_COLUMNS = ['projectCode', 'hq', 'industry', 'desiredInvestment', 'reasonForMA', 'saleShareRatio', 'rank', 'status'];

const ProspectsPortal: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const initialTab = (searchParams.get('tab') as 'investors' | 'targets') || 'investors';
    const [activeTab, setActiveTab] = useState<'investors' | 'targets'>(initialTab);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [investors, setInvestors] = useState<InvestorRowData[]>([]);
    const [targets, setTargets] = useState<TargetRowData[]>([]);
    const [countries, setCountries] = useState<Country[]>([]);
    const [currencies, setCurrencies] = useState<Currency[]>([]);
    const [counts, setCounts] = useState({ investors: 0, targets: 0 });
    const [pinnedIds, setPinnedIds] = useState<number[]>(() => {
        const saved = localStorage.getItem('prospects_pinned_ids');
        return saved ? JSON.parse(saved) : [];
    });

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
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
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
                api.get('/api/buyer', { params: { search: searchQuery, ...filters } }),
                api.get('/api/seller', { params: { search: searchQuery } })
            ]);

            const buyerData = Array.isArray(buyerRes.data?.data) ? buyerRes.data.data : [];
            const sellerDataRaw = Array.isArray(sellerRes.data?.data) ? sellerRes.data.data : [];

            setCounts({
                investors: buyerRes.data?.meta?.total ?? buyerData.length,
                targets: sellerRes.data?.meta?.total ?? sellerDataRaw.length
            });

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

                    return {
                        id: b.id,
                        projectCode: b.buyer_id || "N/A",
                        rank: overview.rank || '',
                        companyName: overview.reg_name || "Unknown Company",
                        primaryContact: primaryContactName,
                        hq: {
                            name: hqCountry?.name || "Unknown",
                            flag: hqCountry?.flagSrc || ""
                        },
                        targetCountries: targetCountriesData as { name: string; flag: string }[],
                        targetIndustries: indMap,
                        pipelineStatus: b.deals && b.deals.length > 0 ? b.deals[b.deals.length - 1].stage_name : (b.pipeline_status || b.current_stage || "N/A"),
                        budget: overview.investment_budget,
                        isPinned: pinnedIds.includes(b.id),
                        companyType: overview.company_type,
                        website: overview.website,
                        email: overview.email,
                        phone: overview.phone,
                        employeeCount: overview.emp_count,
                        yearFounded: overview.year_founded,
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
                    let picName = "N/A";
                    try {
                        const pic = typeof ov.incharge_name === 'string' ? JSON.parse(ov.incharge_name) : ov.incharge_name;
                        if (Array.isArray(pic) && pic.length > 0) picName = pic[0]?.name || "N/A";
                        else if (pic) picName = pic.name || "N/A";
                    } catch (e) { }

                    return {
                        id: s.id,
                        addedDate: s.created_at ? new Date(s.created_at).toLocaleDateString() : "N/A",
                        projectCode: s.seller_id || "N/A",
                        companyName: ov.reg_name || "Unknown Company",
                        hq: {
                            name: hqCountry?.name || "Unknown",
                            flag: hqCountry?.flagSrc || ""
                        },
                        industry: [indMajor], // Keeping array format for table compatibility
                        industryMiddle: indMiddle,
                        projectDetails: ov.details || "",
                        pipelineStatus: s.deals && s.deals.length > 0 ? s.deals[s.deals.length - 1].stage_name : (ov.status || "N/A"), // Fallback to status if no deal? Or display both. User requested "Pipeline" and "Status".
                        status: ov.status || "N/A",
                        desiredInvestment: fin.expected_investment_amount, // String display
                        reasonForMA: ov.reason_ma || "",
                        saleShareRatio: fin.maximum_investor_shareholding_percentage || "",
                        rank: ov.company_rank || "",
                        internalOwner: picName,
                        primaryContact: ov.seller_contact_name || "N/A",
                        primaryEmail: ov.seller_email || "N/A",
                        primaryPhone: (() => {
                            try {
                                if (ov.seller_phone) {
                                    if (typeof ov.seller_phone === 'string' && ov.seller_phone.startsWith('[')) {
                                        const parsed = JSON.parse(ov.seller_phone);
                                        return parsed[0]?.phone || "N/A";
                                    }
                                    return ov.seller_phone;
                                }
                                return "N/A";
                            } catch { return "N/A"; }
                        })(),
                        website: ov.website || "",
                        teaserLink: ov.teaser_link || "", // Check if this field exists in backend, otherwise might need another source
                        ebitda: fin.ebitda_value,
                        isPinned: pinnedIds.includes(s.id),
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
            const endpoint = activeTab === 'investors'
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
        localStorage.setItem('prospects_pinned_ids', JSON.stringify(pinnedIds));
    }, [pinnedIds]);

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

    // Fetch Investors/Targets
    useEffect(() => {
        if (countries.length > 0) fetchData();
    }, [activeTab, searchQuery, countries, pinnedIds, filters]);

    const handleTogglePin = (id: number) => {
        setPinnedIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
    };

    const toggleColumn = (columnId: string) => {
        setVisibleColumns(prev => prev.includes(columnId) ? prev.filter(c => c !== columnId) : [...prev, columnId]);
    };

    const downloadCsvTemplate = (type: 'investor' | 'target') => {
        let headers = [];
        if (type === 'investor') {
            headers = [
                "Project Code",
                "Rank",
                "Company Name",
                "Target Business & Industry",
                "Purpose of M&A",
                "Target county and area",
                "Investment budget",
                "Investment Condition",
                "URL (website)",
                "Investor's Profile Download Link"
            ];
        } else {
            headers = ["Project Code", "Company Name", "Industry", "HQ Country", "Revenue", "EBITDA"];
        }

        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${type}_import_template.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex flex-col w-full h-[calc(100vh-64px)] bg-gray-50/50 font-poppins overflow-hidden relative">
            {/* Import Modal */}
            {isImportModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded border border-gray-100 w-full max-w-lg overflow-hidden shadow-2xl">
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded bg-blue-50 text-[#064771] flex items-center justify-center">
                                        <Upload className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">Import Data</h2>
                                        <p className="text-sm text-gray-500">Bulk upload your {activeTab} list</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsImportModalOpen(false)} className="p-2 hover:bg-gray-100 rounded transition-colors">
                                    <X className="w-6 h-6 text-gray-400" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div
                                    className={`p-10 border-2 border-dashed rounded flex flex-col items-center justify-center gap-4 group transition-all cursor-pointer ${selectedFile
                                        ? 'border-[#064771] bg-[#064771]/5'
                                        : 'border-gray-200 bg-gray-50/50 hover:border-[#064771]/30'
                                        }`}
                                    onDragOver={handleDragOver}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input
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
                                        <p className="text-sm font-semibold text-gray-900">
                                            {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : 'CSV, XLSX files only, max 10MB'}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-4 bg-amber-50 rounded border border-amber-100">
                                        <div className="flex gap-3">
                                            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                                            <div className="space-y-1">
                                                <p className="text-sm font-semibold text-amber-900">Important Note</p>
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
                                                downloadCsvTemplate(activeTab === 'investors' ? 'investor' : 'target');
                                            }}
                                            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-white border border-gray-200 rounded text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
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
                                            className="flex-1 py-3 px-4 bg-[#064771] text-white rounded text-sm font-semibold hover:bg-[#053a5c] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Start Import
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
                            <button onClick={() => setIsImportModalOpen(false)} className="flex-1 py-3 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors">Cancel</button>
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
                                    <h2 className="text-xl font-bold text-gray-900">Advanced Filters</h2>
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
                                    <label className="block text-sm font-bold text-gray-700 mb-2.5 ml-1">Status</label>
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
                                            <option value="Draft">Drafts</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-gray-600 transition-colors">
                                            <ChevronDown className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2.5 ml-1">HQ Country</label>
                                    <div className="relative group">
                                        <select
                                            className="w-full h-12 px-4 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-[#064771]/5 focus:border-[#064771] appearance-none transition-all cursor-pointer group-hover:border-gray-300"
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
                                className="w-full py-4 bg-[#064771] text-white rounded font-bold hover:bg-[#053a5c] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
                                onClick={() => setIsFilterOpen(false)}
                            >
                                Apply Filters
                            </button>
                            <button
                                className="w-full py-4 bg-white border border-gray-200 text-gray-600 rounded font-bold flex items-center justify-center gap-2 hover:bg-gray-50 hover:text-gray-900 active:scale-[0.98] transition-all duration-200"
                                onClick={() => setFilters({ status: '', country: '', industry: '' })}
                            >
                                <RotateCcw className="w-4 h-4" />
                                Reset Filters
                            </button>
                        </div>
                    </div>
                </>
            )}

            <div className="px-6 py-4 w-full flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="flex flex-col gap-4 h-full">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h1 className="text-3xl font-bold text-gray-900">Prospects</h1>
                            <div className="flex bg-gray-200/50 rounded p-1.5 ml-4">
                                <button
                                    onClick={() => {
                                        setActiveTab('investors');
                                        setSearchParams({ tab: 'investors' });
                                    }}
                                    className={`px-6 py-2.5 rounded text-sm font-bold transition-all duration-200 ${activeTab === 'investors' ? 'bg-white text-[#064771]' : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'}`}
                                >
                                    Investors <span className={`ml-1.5 text-xs ${activeTab === 'investors' ? 'text-[#064771]/50' : 'text-gray-400'}`}>({counts.investors})</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setActiveTab('targets');
                                        setSearchParams({ tab: 'targets' });
                                    }}
                                    className={`px-6 py-2.5 rounded text-sm font-bold transition-all duration-200 ${activeTab === 'targets' ? 'bg-white text-[#064771]' : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'}`}
                                >
                                    Targets <span className={`ml-1.5 text-xs ${activeTab === 'targets' ? 'text-[#064771]/50' : 'text-gray-400'}`}>({counts.targets})</span>
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#064771] transition-colors" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Search prospects here"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 pr-16 py-2 bg-gray-50 border border-gray-200 rounded text-sm w-[280px] focus:outline-none focus:ring-2 focus:ring-[#064771]/10 focus:border-[#064771] hover:border-gray-300 transition-all font-medium"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-1 px-1.5 py-0.5 rounded border border-gray-200 bg-white text-[10px] font-medium text-gray-400 select-none pointer-events-none">
                                    <span className="text-xs">⌘</span> F
                                </div>
                            </div>

                            <button
                                onClick={() => setFilters(prev => ({ ...prev, status: prev.status === 'Draft' ? '' : 'Draft' }))}
                                className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-bold transition-all border ${filters.status === 'Draft'
                                    ? 'bg-[#064771] text-white border-[#064771]'
                                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                <span className={`w-2 h-2 rounded-full ${filters.status === 'Draft' ? 'bg-orange-400 animate-pulse' : 'bg-gray-300'}`} />
                                Drafts
                            </button>

                            <div className="relative" ref={toolsDropdownRef}>
                                <button
                                    onClick={() => setIsToolsOpen(!isToolsOpen)}
                                    className="flex items-center gap-2 bg-[#E6F1F9] hover:bg-[#D9EAF7] text-[#064771] px-4 py-2 rounded text-sm font-bold transition-all border border-[#064771]/10 active:scale-95"
                                >
                                    <Settings2 className="w-4 h-4" />
                                    Tools
                                </button>
                                {isToolsOpen && (
                                    <div className="absolute right-0 mt-2 w-64 bg-white rounded border border-gray-100 p-4 z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-right shadow-2xl">
                                        <div className="space-y-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                                    <DollarSign className="w-3 h-3" /> Currency
                                                </div>
                                                <select
                                                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded text-xs"
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
                                                <div className="flex items-center gap-2 mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                                    <Layout className="w-3 h-3" /> Columns
                                                </div>
                                                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                                                    {(activeTab === 'investors' ? ALL_INVESTOR_COLUMNS : ALL_TARGET_COLUMNS).map(col => (
                                                        <button
                                                            key={col.id}
                                                            onClick={() => toggleColumn(col.id)}
                                                            className="flex items-center justify-between w-full p-2 text-xs rounded hover:bg-gray-50 transition-colors"
                                                        >
                                                            <span className={visibleColumns.includes(col.id) ? 'text-gray-900 font-medium' : 'text-gray-400'}>{col.label}</span>
                                                            {visibleColumns.includes(col.id) && <Check className="w-3 h-3 text-[#064771]" />}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="relative" ref={createDropdownRef}>
                                <button onClick={() => setIsCreateOpen(!isCreateOpen)} className="flex items-center gap-2 bg-white text-gray-900 border border-gray-200 px-4 py-2 rounded text-sm font-bold transition-all hover:bg-gray-50 hover:border-gray-300 active:scale-95">
                                    <Plus className="w-4 h-4 text-gray-500" /> Create <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isCreateOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {isCreateOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-right overflow-hidden shadow-2xl">
                                        <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#064771] flex items-center gap-3 transition-colors" onClick={() => navigate('/prospects/add-investor')}>
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Add Investor
                                        </button>
                                        <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#064771] flex items-center gap-3 transition-colors" onClick={() => navigate('/seller-portal/add')}>
                                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500" /> Add Target
                                        </button>
                                        <div className="h-px bg-gray-100 my-1 mx-2" />
                                        <button className="w-full text-left px-4 py-2.5 text-sm text-[#064771] font-bold hover:bg-blue-50 flex items-center gap-3 transition-colors" onClick={() => { setIsImportModalOpen(true); setIsCreateOpen(false); }}>
                                            <Upload className="w-4 h-4" /> Import Data
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="w-full flex-1 min-h-0 transition-all duration-500">
                        {activeTab === 'investors' ? (
                            <InvestorTable
                                data={investors}
                                isLoading={isLoading}
                                onTogglePin={handleTogglePin}
                                onOpenFilter={() => setIsFilterOpen(true)}
                                visibleColumns={visibleColumns}
                                selectedCurrency={selectedCurrency || undefined}
                                onRefresh={fetchData}
                            />
                        ) : (
                            <TargetTable
                                data={targets}
                                isLoading={isLoading}
                                onTogglePin={handleTogglePin}
                                onOpenFilter={() => setIsFilterOpen(true)}
                                visibleColumns={visibleColumns}
                                selectedCurrency={selectedCurrency || undefined}
                                onRefresh={fetchData}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProspectsPortal;
