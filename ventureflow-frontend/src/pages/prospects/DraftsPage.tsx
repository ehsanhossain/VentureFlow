/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../config/api';
import { getCachedCountries, getCachedCurrencies } from '../../utils/referenceDataCache';
import { InvestorTable, InvestorRowData } from './components/InvestorTable';
import { TargetTable, TargetRowData } from './components/TargetTable';
import DataTableSearch from '../../components/table/DataTableSearch';
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

const DEFAULT_INVESTOR_COLUMNS = ['projectCode', 'rank', 'companyName', 'primaryContact', 'originCountry', 'targetCountries', 'targetIndustries', 'budget'];
const DEFAULT_TARGET_COLUMNS = ['projectCode', 'companyName', 'originCountry', 'industry', 'desiredInvestment', 'reasonForMA', 'rank'];

/* Helper to parse multi-select fields */
const parseMultiField = (val: any): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val.filter(Boolean);
    if (typeof val === 'string') {
        try { const p = JSON.parse(val); if (Array.isArray(p)) return p.filter(Boolean); } catch { /* ignored */ }
        return val ? [val] : [];
    }
    return [];
};

const DraftsPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const initialTab = (searchParams.get('tab') as 'investors' | 'targets') || 'investors';
    const [activeTab, setActiveTab] = useState<'investors' | 'targets'>(initialTab);

    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [countries, setCountries] = useState<Country[]>([]);
    const [currencies, setCurrencies] = useState<Currency[]>([]);

    const [investorData, setInvestorData] = useState<InvestorRowData[]>([]);
    const [targetData, setTargetData] = useState<TargetRowData[]>([]);
    const [counts, setCounts] = useState({ investors: 0, targets: 0 });
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 20
    });

    // Dynamic row calculation — identical to ProspectsPortal
    const tableContainerRef = useRef<HTMLDivElement>(null);
    const itemsPerPageRef = useRef(pagination.itemsPerPage);
    const lastCalculatedRows = useRef<number>(pagination.itemsPerPage);
    const resizeTimeoutRef = useRef<any>();

    useEffect(() => {
        const calculateRows = () => {
            if (!tableContainerRef.current) return;
            const containerHeight = tableContainerRef.current.offsetHeight;
            const overhead = 48 + 48 + 40;
            const availableHeight = containerHeight - overhead;
            const rows = Math.max(5, Math.floor(availableHeight / 56));

            if (rows > 0 && rows !== lastCalculatedRows.current) {
                lastCalculatedRows.current = rows;
                itemsPerPageRef.current = rows;
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
            }, 150);
        };

        const timer = setTimeout(calculateRows, 300);
        const resizeObserver = new ResizeObserver(handleResize);
        if (tableContainerRef.current) resizeObserver.observe(tableContainerRef.current);

        return () => {
            clearTimeout(timer);
            if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
            resizeObserver.disconnect();
        };
    }, []);

    const handleTabChange = (tab: 'investors' | 'targets') => {
        setActiveTab(tab);
        setSearchParams({ tab });
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Fetch currencies
            let currentCurrencies = currencies;
            if (currencies.length <= 10) {
                const currDataRaw = await getCachedCurrencies();
                currentCurrencies = currDataRaw.map((c: any) => ({
                    id: c.id,
                    code: c.currency_code,
                    sign: c.currency_sign,
                    exchange_rate: c.exchange_rate
                }));
                setCurrencies(currentCurrencies);
            }

            // Fetch countries
            let currentCountries = countries;
            if (countries.length === 0) {
                const countryDataRaw = await getCachedCountries();
                currentCountries = countryDataRaw.map((c: any) => ({
                    id: c.id,
                    name: c.name,
                    flagSrc: c.svg_icon_url || ''
                }));
                setCountries(currentCountries);
            }

            // Fetch drafts with status=Draft
            const [buyerRes, sellerRes] = await Promise.all([
                api.get('/api/buyer', {
                    params: {
                        search: searchQuery,
                        status: 'Draft',
                        page: activeTab === 'investors' ? pagination.currentPage : undefined,
                        per_page: itemsPerPageRef.current
                    }
                }),
                api.get('/api/seller', {
                    params: {
                        search: searchQuery,
                        status: 'Draft',
                        page: activeTab === 'targets' ? pagination.currentPage : undefined,
                        per_page: itemsPerPageRef.current
                    }
                })
            ]);

            const buyerData = Array.isArray(buyerRes.data?.data) ? buyerRes.data.data : [];
            const sellerDataRaw = Array.isArray(sellerRes.data?.data) ? sellerRes.data.data : [];

            setCounts({
                investors: buyerRes.data?.meta?.total ?? 0,
                targets: sellerRes.data?.meta?.total ?? 0
            });

            // Update pagination from active tab meta
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

            // Transform investor data
            const mappedInvestors: InvestorRowData[] = buyerData.map((b: any) => {
                const overview = b.company_overview || {};
                const hqCountryRaw = overview.hq_country;
                let hqCountry: { name: string; flagSrc: string } | undefined;

                if (hqCountryRaw && typeof hqCountryRaw === 'object' && hqCountryRaw.id) {
                    hqCountry = { name: hqCountryRaw.name || 'Unknown', flagSrc: hqCountryRaw.svg_icon_url || '' };
                } else if (hqCountryRaw) {
                    const found = currentCountries.find(c => String(c.id) === String(hqCountryRaw));
                    hqCountry = found ? { name: found.name, flagSrc: found.flagSrc } : undefined;
                }

                const indMap = Array.isArray(overview.main_industry_operations)
                    ? overview.main_industry_operations.map((i: any) => i?.name || "Unknown") : [];

                let targetCountriesRaw = overview.target_countries;
                if (typeof targetCountriesRaw === 'string') {
                    try { targetCountriesRaw = JSON.parse(targetCountriesRaw); } catch { targetCountriesRaw = []; }
                } else if (!targetCountriesRaw && b.target_preferences?.target_countries) {
                    targetCountriesRaw = b.target_preferences.target_countries;
                }

                const targetCountriesData = Array.isArray(targetCountriesRaw)
                    ? targetCountriesRaw.map((tc: any) => {
                        const cid = (tc && typeof tc === 'object') ? tc.id : tc;
                        const co = currentCountries.find(con => String(con.id) === String(cid));
                        return co ? { name: co.name, flag: co.flagSrc } : { name: tc?.name || 'Unknown', flag: '' };
                    }) : [];

                const parseArray = (data: any, key: string = 'name') => {
                    try {
                        const parsed = typeof data === 'string' ? JSON.parse(data) : data;
                        if (Array.isArray(parsed)) return parsed.map(i => i?.[key] || i).filter(Boolean);
                        return [];
                    } catch { return []; }
                };

                const contactsRaw = overview.contact_name || overview.contacts;
                let parsedContacts: any[] = [];
                if (typeof contactsRaw === 'string') {
                    try { parsedContacts = JSON.parse(contactsRaw); } catch { parsedContacts = []; }
                } else if (Array.isArray(contactsRaw)) {
                    parsedContacts = contactsRaw;
                }
                const primaryContactObj = parsedContacts.length > 0
                    ? (parsedContacts.find((c: any) => c.isPrimary) || parsedContacts[0]) : null;
                const primaryContactName = primaryContactObj?.name || overview.buyer_contact_name || "N/A";

                return {
                    id: b.id,
                    projectCode: b.buyer_id || "N/A",
                    rank: overview.rank || '',
                    companyName: overview.reg_name || "Unknown Company",
                    primaryContact: primaryContactName,
                    originCountry: { name: hqCountry?.name || "Unknown", flag: hqCountry?.flagSrc || "" },
                    targetCountries: targetCountriesData as { name: string; flag: string }[],
                    targetIndustries: indMap,
                    pipelineStatus: 'N/A',
                    budget: overview.investment_budget,
                    investmentCondition: overview.investment_condition || "",
                    purposeMNA: overview.reason_ma || "",
                    internalPIC: parseArray(overview.internal_pic, 'name'),
                    financialAdvisor: parseArray(overview.financial_advisor, 'name'),
                    introducedProjects: parseArray(overview.introduced_projects, 'name'),
                    investorProfile: overview.investor_profile_link || "",
                    isPinned: false,
                    website: overview.website,
                    email: overview.email,
                    companyIndustry: indMap,
                };
            });

            // Transform target data
            const mappedTargets: TargetRowData[] = sellerDataRaw.map((s: any) => {
                const ov = s.company_overview || {};
                const fin = s.financial_details || {};

                const hqCountryRaw = ov.hq_country;
                let hqCountry: { name: string; flagSrc: string } | undefined;

                if (hqCountryRaw && typeof hqCountryRaw === 'object' && hqCountryRaw.id) {
                    hqCountry = { name: hqCountryRaw.name || 'Unknown', flagSrc: hqCountryRaw.svg_icon_url || '' };
                } else if (hqCountryRaw) {
                    const found = currentCountries.find(c => String(c.id) === String(hqCountryRaw));
                    hqCountry = found ? { name: found.name, flagSrc: found.flagSrc } : undefined;
                }

                let indMajor = "N/A";
                try {
                    const ops = typeof ov.industry_ops === 'string' ? JSON.parse(ov.industry_ops) : ov.industry_ops;
                    if (Array.isArray(ops) && ops.length > 0) indMajor = ops[0]?.name || "N/A";
                } catch { /* ignored */ }

                const defaultCurrencyId = fin.default_currency;
                const sourceCurrencyVal = currentCurrencies.find(c => c.code === defaultCurrencyId || String(c.id) === String(defaultCurrencyId));
                const currCode = sourceCurrencyVal?.code || '';

                let desiredInv = 'Flexible';
                const amount = fin.expected_investment_amount;
                if (amount) {
                    if (typeof amount === 'object' && amount.min !== undefined) {
                        const min = Number(amount.min).toLocaleString();
                        const max = amount.max ? Number(amount.max).toLocaleString() : '';
                        desiredInv = max ? `${min} - ${max}` : min;
                    } else {
                        desiredInv = String(amount);
                    }
                    if (currCode) desiredInv = `${currCode} ${desiredInv}`;
                }

                let ebitdaDisplay = 'N/A';
                const ebitda = fin.ebitda_value || fin.ttm_profit;
                if (ebitda) {
                    if (typeof ebitda === 'object' && ebitda.min !== undefined) {
                        const min = Number(ebitda.min).toLocaleString();
                        const max = ebitda.max ? Number(ebitda.max).toLocaleString() : '';
                        ebitdaDisplay = max ? `${min} - ${max}` : min;
                    } else {
                        ebitdaDisplay = String(ebitda);
                    }
                    if (currCode) ebitdaDisplay = `${currCode} ${ebitdaDisplay}`;
                }

                const parseArray = (data: any, key: string = 'name') => {
                    try {
                        const parsed = typeof data === 'string' ? JSON.parse(data) : data;
                        if (Array.isArray(parsed)) return parsed.map(i => i?.[key] || i).filter(Boolean);
                        return [];
                    } catch { return []; }
                };

                const contactsRaw = ov.contacts || ov.contact_name;
                let parsedContacts: any[] = [];
                if (typeof contactsRaw === 'string') {
                    try { parsedContacts = JSON.parse(contactsRaw); } catch { parsedContacts = []; }
                } else if (Array.isArray(contactsRaw)) {
                    parsedContacts = contactsRaw;
                }
                const primaryContactObj = parsedContacts.length > 0
                    ? (parsedContacts.find((c: any) => c.isPrimary) || parsedContacts[0]) : null;
                const primaryContactName = primaryContactObj?.name || ov.seller_contact_name || "N/A";

                return {
                    id: s.id,
                    projectCode: s.seller_id || "N/A",
                    rank: ov.rank || '',
                    companyName: ov.reg_name || "Unknown Company",
                    originCountry: { name: hqCountry?.name || "Unknown", flag: hqCountry?.flagSrc || "" },
                    industry: indMajor,
                    reasonForMA: parseMultiField(ov.reason_ma || ov.reason_for_mna),
                    investmentCondition: parseMultiField(fin.investment_condition),
                    desiredInvestment: desiredInv,
                    ebitda: ebitdaDisplay,
                    ebitdaTimes: fin.ebitda_times || null,
                    primaryContact: primaryContactName,
                    internalPIC: parseArray(ov.internal_pic, 'name'),
                    financialAdvisor: parseArray(ov.financial_advisor, 'name'),
                    teaserLink: '',
                    pipelineStatus: 'N/A',
                    isPinned: false,
                    website: ov.website,
                };
            });

            setInvestorData(mappedInvestors);
            setTargetData(mappedTargets);

        } catch (err: any) {
            console.error('Error fetching drafts:', err);
            showAlert({ type: 'error', message: 'Failed to load draft data' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [searchQuery, activeTab, pagination.currentPage]);

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50 overflow-hidden">
            {/* Header — identical layout to ProspectsPortal */}
            <div className="flex flex-col md:flex-row items-center justify-between px-4 md:px-6 py-4 bg-white border-b gap-4">
                <div className="flex flex-col md:flex-row items-center gap-8 w-full md:w-auto">
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        {/* Back Button — same style as InvestorDetails / TargetDetails */}
                        <button
                            onClick={() => navigate('/prospects')}
                            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#064771] text-white rounded text-sm font-medium hover:bg-[#053a5c] transition-colors"
                        >
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5.57501 13.4297H11.1921C13.1329 13.4297 14.7085 11.8542 14.7085 9.91335C14.7085 7.97249 13.1329 6.39697 11.1921 6.39697H3.46289" stroke="white" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M5.08346 8.1666L3.29102 6.36276L5.08346 4.57031" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Back
                        </button>
                        <h1 className="text-sm font-medium text-gray-900">Drafts</h1>
                    </div>

                    {/* Tab Switcher — same design as ProspectsPortal with sliding pill */}
                    <div className="relative flex bg-gray-100 rounded-[6px] p-1" style={{ minWidth: '260px' }}>
                        {/* Sliding pill background */}
                        <div
                            className="absolute top-1 bottom-1 rounded-[5px] bg-white shadow-sm transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                            style={{
                                width: 'calc(50% - 4px)',
                                left: activeTab === 'investors' ? '4px' : 'calc(50%)',
                            }}
                        />
                        <button
                            onClick={() => handleTabChange('investors')}
                            className={`relative z-[1] flex-1 px-4 py-1.5 rounded-[5px] text-sm font-medium transition-colors duration-300 ${activeTab === 'investors'
                                ? 'text-[#064771]'
                                : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            Investors <span className="ml-1 opacity-60">({counts.investors})</span>
                        </button>
                        <button
                            onClick={() => handleTabChange('targets')}
                            className={`relative z-[1] flex-1 px-4 py-1.5 rounded-[5px] text-sm font-medium transition-colors duration-300 ${activeTab === 'targets'
                                ? 'text-[#064771]'
                                : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            Targets <span className="ml-1 opacity-60">({counts.targets})</span>
                        </button>
                    </div>

                    {/* Search — same position as ProspectsPortal */}
                    <DataTableSearch
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder={`Search for ${activeTab}...`}
                        className="w-full md:w-72"
                    />
                </div>
            </div>

            {/* Main Content Area — identical structure to ProspectsPortal */}
            <div
                ref={tableContainerRef}
                className="flex-1 flex flex-col overflow-hidden relative"
            >
                <div className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden">
                    {activeTab === 'investors' ? (
                        <InvestorTable
                            data={investorData}
                            isLoading={isLoading}
                            onTogglePin={() => { }}
                            visibleColumns={DEFAULT_INVESTOR_COLUMNS}
                            onRefresh={fetchData}
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
                            data={targetData}
                            isLoading={isLoading}
                            onTogglePin={() => { }}
                            visibleColumns={DEFAULT_TARGET_COLUMNS}
                            onRefresh={fetchData}
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
    );
};

export default DraftsPage;
