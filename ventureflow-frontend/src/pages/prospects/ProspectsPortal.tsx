import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
    FileSpreadsheet
} from 'lucide-react';

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
    { id: 'companyName', label: 'Company Name' },
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

const DEFAULT_INVESTOR_COLUMNS = ['projectCode', 'companyName', 'hq', 'targetCountries', 'targetIndustries', 'pipelineStatus', 'budget'];

const ALL_TARGET_COLUMNS = [
    { id: 'projectCode', label: 'Project Code' },
    { id: 'companyName', label: 'Company Name' },
    { id: 'hq', label: 'HQ Country' },
    { id: 'industry', label: 'Industry' },
    { id: 'pipelineStatus', label: 'Pipeline' },
    { id: 'desiredInvestment', label: 'Desired Investment' },
    { id: 'ebitda', label: 'EBIRTDA' },
];

const DEFAULT_TARGET_COLUMNS = ['projectCode', 'companyName', 'hq', 'industry', 'pipelineStatus', 'desiredInvestment', 'ebitda'];

const ProspectsPortal: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'investors' | 'targets'>('investors');
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
                    const currData = Array.isArray(currencyRes.data) ? currencyRes.data : (currencyRes.data.data || []);
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
                            code: currData[0].currency_code,
                            symbol: currData[0].currency_sign,
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
        let isMounted = true;
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [buyerRes, sellerRes] = await Promise.all([
                    api.get('/api/buyer', { params: { search: searchQuery, ...filters } }),
                    api.get('/api/seller', { params: { search: searchQuery } })
                ]);

                if (!isMounted) return;

                const buyerData = Array.isArray(buyerRes.data?.data) ? buyerRes.data.data : [];
                const sellerDataRaw = Array.isArray(sellerRes.data?.data) ? sellerRes.data.data : [];

                setCounts({
                    investors: buyerRes.data?.meta?.total || 0,
                    targets: sellerRes.data?.meta?.total || 0
                });

                if (activeTab === 'investors') {
                    const mappedInvestors: InvestorRowData[] = buyerData.map((b: any) => {
                        const hqCountryId = b.company_overview?.hq_country;
                        const hqCountry = countries.find(c => String(c.id) === String(hqCountryId));

                        const industries = Array.isArray(b.company_overview?.main_industry_operations)
                            ? b.company_overview.main_industry_operations.map((i: any) => i?.name || "Unknown")
                            : [];

                        const targetCountriesData = Array.isArray(b.target_countries)
                            ? b.target_countries.map((tc: any) => {
                                const id = (tc && typeof tc === 'object') ? tc.id : tc;
                                const c = countries.find(co => String(co.id) === String(id));
                                return c ? { name: c.name, flag: c.flagSrc } : null;
                            }).filter(Boolean)
                            : [];

                        return {
                            id: b.id,
                            projectCode: b.buyer_id || "N/A",
                            companyName: b.company_overview?.reg_name || "Unknown Company",
                            hq: {
                                name: hqCountry?.name || "Unknown",
                                flag: hqCountry?.flagSrc || ""
                            },
                            targetCountries: targetCountriesData as { name: string; flag: string }[],
                            targetIndustries: industries,
                            pipelineStatus: b.pipeline_status || b.current_stage || "N/A",
                            budget: b.financial_details?.investment_budget,
                            isPinned: pinnedIds.includes(b.id),
                            companyType: b.company_overview?.company_type,
                            website: b.company_overview?.website,
                            email: b.company_overview?.email,
                            phone: b.company_overview?.phone,
                            employeeCount: b.company_overview?.emp_count,
                            yearFounded: b.company_overview?.year_founded
                        };
                    });
                    setInvestors(mappedInvestors);
                } else {
                    const mappedTargets: TargetRowData[] = sellerDataRaw.map((s: any) => {
                        const hqCountryId = s.company_overview?.hq_country;
                        const hqCountry = countries.find(c => String(c.id) === String(hqCountryId));

                        const industryList = Array.isArray(s.company_overview?.industry_ops)
                            ? s.company_overview.industry_ops.map((i: any) => i?.name || "Unknown")
                            : [];

                        return {
                            id: s.id,
                            projectCode: s.seller_id || "N/A",
                            companyName: s.company_overview?.reg_name || "Unknown Company",
                            hq: {
                                name: hqCountry?.name || "Unknown",
                                flag: hqCountry?.flagSrc || ""
                            },
                            industry: industryList,
                            pipelineStatus: s.company_overview?.status || "N/A",
                            desiredInvestment: s.financial_details?.expected_investment_amount,
                            ebitda: s.financial_details?.ebitda_value,
                            isPinned: pinnedIds.includes(s.id),
                        };
                    });
                    setTargets(mappedTargets);
                }
            } catch (error) {
                console.error("Failed to fetch data", error);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        if (countries.length > 0) fetchData();
        return () => { isMounted = false; };
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
        <div className="flex flex-col w-full min-h-screen bg-gray-50/50 font-poppins overflow-x-hidden relative">
            {/* Import Modal */}
            {isImportModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100">
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#064771] flex items-center justify-center">
                                        <Upload className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">Import Data</h2>
                                        <p className="text-sm text-gray-500">Bulk upload your {activeTab} list</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsImportModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                                    <X className="w-6 h-6 text-gray-400" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="p-6 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50 flex flex-col items-center justify-center gap-4 group hover:border-[#064771]/30 transition-all cursor-pointer">
                                    <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 group-hover:text-[#064771] transition-colors">
                                        <FileSpreadsheet className="w-8 h-8" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-semibold text-gray-900">Click to upload or drag and drop</p>
                                        <p className="text-xs text-gray-500 mt-1">CSV files only, max 10MB</p>
                                    </div>
                                </div>

                                <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#064771]">
                                            <Download className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-[#064771]">Download Template</p>
                                            <p className="text-[10px] text-blue-600 font-medium tracking-wide border-b border-blue-200 w-fit">Get the format right</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => downloadCsvTemplate(activeTab === 'investors' ? 'investor' : 'target')}
                                        className="px-4 py-2 bg-[#064771] text-white text-xs font-bold rounded-xl shadow-lg shadow-[#064771]/20 transform active:scale-95 transition-all"
                                    >
                                        Download
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
                            <button onClick={() => setIsImportModalOpen(false)} className="flex-1 py-3 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors">Cancel</button>
                            <button className="flex-1 py-3 bg-[#064771] text-white rounded-2xl text-sm font-bold shadow-lg shadow-[#064771]/10 transform active:scale-95 transition-all">Start Import</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Filter Side Drawer */}
            {isFilterOpen && (
                <>
                    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity" onClick={() => setIsFilterOpen(false)} />
                    <div ref={filterDrawerRef} className="fixed right-0 top-0 h-full w-[400px] bg-white shadow-2xl z-50 p-6 animate-in slide-in-from-right duration-300">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#064771] flex items-center justify-center">
                                    <Filter className="w-5 h-5" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">Advanced Filters</h2>
                            </div>
                            <button onClick={() => setIsFilterOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                                <select
                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#064771]/10 focus:border-[#064771]"
                                    value={filters.status}
                                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                >
                                    <option value="">All Statuses</option>
                                    <option value="Active">Active</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Interested">Interested</option>
                                    <option value="NDA">NDA</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">HQ Country</label>
                                <select
                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#064771]/10 focus:border-[#064771]"
                                    value={filters.country}
                                    onChange={(e) => setFilters({ ...filters, country: e.target.value })}
                                >
                                    <option value="">All Countries</option>
                                    {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="pt-6 border-t border-gray-100 flex flex-col gap-3">
                                <button className="w-full py-3 bg-[#064771] text-white rounded-xl font-bold shadow-lg shadow-[#064771]/20 hover:bg-[#053a5c] transition-all" onClick={() => setIsFilterOpen(false)}>Apply Filters</button>
                                <button className="w-full py-3 bg-gray-50 text-gray-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-100 transition-all" onClick={() => setFilters({ status: '', country: '', industry: '' })}>
                                    <RotateCcw className="w-4 h-4" /> Reset Filters
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            <div className="px-6 py-6 w-full">
                <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h1 className="text-3xl font-bold text-gray-900">Prospects</h1>
                            <div className="flex bg-gray-100 rounded-lg p-1 ml-4 shadow-inner">
                                <button onClick={() => setActiveTab('investors')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${activeTab === 'investors' ? 'bg-white text-[#064771] shadow-sm transform scale-105' : 'text-gray-500 hover:text-gray-900'}`}>
                                    Investors <span className={`ml-1 ${activeTab === 'investors' ? 'text-[#064771]/60' : 'text-gray-400'}`}>({counts.investors})</span>
                                </button>
                                <button onClick={() => setActiveTab('targets')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${activeTab === 'targets' ? 'bg-white text-[#064771] shadow-sm transform scale-105' : 'text-gray-500 hover:text-gray-900'}`}>
                                    Targets <span className={`ml-1 ${activeTab === 'targets' ? 'text-[#064771]/60' : 'text-gray-400'}`}>({counts.targets})</span>
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
                                    className="pl-9 pr-16 py-2 border border-gray-200 rounded-lg text-sm w-[280px] focus:outline-none focus:ring-2 focus:ring-[#064771]/10 focus:border-[#064771] transition-all bg-white"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-white px-2 py-1 rounded-md border border-gray-200 font-medium text-gray-500 shadow-sm text-[11px] select-none pointer-events-none">
                                    <span className="text-sm font-light scale-110 translate-y-[0.5px]">⌘</span>
                                    <span className="font-semibold text-gray-400">F</span>
                                </div>
                            </div>

                            <div className="relative" ref={toolsDropdownRef}>
                                <button
                                    onClick={() => setIsToolsOpen(!isToolsOpen)}
                                    className="flex items-center gap-2 bg-[#E6F1F9] hover:bg-[#D9EAF7] text-[#064771] px-4 py-2 rounded-lg text-sm font-bold transition-all border border-[#064771]/10 shadow-sm hover:shadow-md active:scale-95"
                                >
                                    <Settings2 className="w-4 h-4" />
                                    Tools
                                </button>
                                {isToolsOpen && (
                                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 p-4 z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                                        <div className="space-y-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                                    <DollarSign className="w-3 h-3" /> Currency
                                                </div>
                                                <select
                                                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
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
                                                            className="flex items-center justify-between w-full p-2 text-xs rounded-lg hover:bg-gray-50 transition-colors"
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
                                <button onClick={() => setIsCreateOpen(!isCreateOpen)} className="flex items-center gap-2 bg-white text-gray-900 border border-gray-200 px-4 py-2 rounded-lg text-sm font-bold transition-all hover:bg-gray-50 hover:border-gray-300 shadow-sm active:scale-95">
                                    <Plus className="w-4 h-4 text-gray-500" /> Create <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isCreateOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {isCreateOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-right overflow-hidden">
                                        <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#064771] flex items-center gap-3 transition-colors" onClick={() => navigate('/buyer-portal/create')}>
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

                    <div className="w-full transition-all duration-500">
                        {activeTab === 'investors' ? (
                            <InvestorTable
                                data={investors}
                                isLoading={isLoading}
                                onTogglePin={handleTogglePin}
                                onOpenFilter={() => setIsFilterOpen(true)}
                                visibleColumns={visibleColumns}
                                selectedCurrency={selectedCurrency || undefined}
                            />
                        ) : (
                            <TargetTable
                                data={targets}
                                isLoading={isLoading}
                                onTogglePin={handleTogglePin}
                                onOpenFilter={() => setIsFilterOpen(true)}
                                visibleColumns={visibleColumns}
                                selectedCurrency={selectedCurrency || undefined}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProspectsPortal;
