import { useState, useEffect } from 'react';
import api from '../../../config/api';
import { getCachedCurrencies } from '../../../utils/referenceDataCache';
import { showAlert } from '../../../components/Alert';
import { Dropdown } from '../../prospects/components/Dropdown';

interface CreateDealModalProps {
    onClose: () => void;
    onCreated: () => void;
    defaultView?: 'buyer' | 'seller';
}

interface Buyer {
    id: number;
    company_overview?: {
        reg_name: string;
        financial_advisor?: string | Record<string, string>[];
    };
}

interface Seller {
    id: number;
    company_overview?: {
        reg_name: string;
        financial_advisor?: string | Record<string, string>[];
    };
    financial_details?: {
        expected_investment_amount?: { min?: string; max?: string } | string;
        default_currency?: string;
    } | null;
}

interface User {
    id: number;
    name: string;
    flagSrc: string;
    status: 'registered' | 'unregistered';
}

const CreateDealModal = ({ onClose, onCreated, defaultView = 'buyer' }: CreateDealModalProps) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [buyers, setBuyers] = useState<Buyer[]>([]);
    const [sellers, setSellers] = useState<Seller[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [stages, setStages] = useState<{ code: string; name: string }[]>([]);
    const [searchBuyer, setSearchBuyer] = useState('');
    const [searchSeller, setSearchSeller] = useState('');

    const [formData, setFormData] = useState({
        buyer_id: 0,
        seller_id: 0,
        name: '',
        ticket_size: '',
        estimated_ev_currency: 'USD',
        priority: 'medium',
        possibility: 'Medium',
        internal_pic: [] as User[],
        target_close_date: '',
        stage_code: '',
    });

    const [selectedBuyer, setSelectedBuyer] = useState<Buyer | null>(null);
    const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);

    // TBD flags for 1-sided deals
    const [buyerTBD, setBuyerTBD] = useState(false);
    const [sellerTBD, setSellerTBD] = useState(false);

    // Track if ticket size was manually edited
    const [ticketSizeManuallyEdited, setTicketSizeManuallyEdited] = useState(false);

    useEffect(() => {
        fetchBuyers();
        fetchSellers();
        fetchUsers();
        fetchStages();
    }, []);

    const fetchStages = async () => {
        try {
            const response = await api.get('/api/pipeline-stages', {
                params: { type: defaultView }
            });
            const stagesData = response.data || [];
            // Backend filters by type, but ensuring client-side match as well
            const filteredStages = stagesData.filter((s: { pipeline_type: string }) => s.pipeline_type === defaultView);
            setStages(filteredStages);

            if (filteredStages.length > 0) {
                setFormData(prev => ({ ...prev, stage_code: filteredStages[0].code }));
            }

        } catch {
            console.error('Failed to fetch stages');
        }
    };

    const fetchBuyers = async () => {
        try {
            const response = await api.get('/api/buyer');
            setBuyers(response.data.data || []);
        } catch {
            console.error('Failed to fetch buyers');
        }
    };

    const fetchSellers = async () => {
        try {
            const response = await api.get('/api/seller');
            setSellers(response.data.data || []);
        } catch {
            console.error('Failed to fetch sellers');
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await api.get('/api/employees/fetch');
            const employees = response.data || [];
            setUsers(employees.map((e: { id: number; first_name?: string; last_name?: string; name?: string; full_name?: string }) => ({
                id: e.id,
                name: e.first_name && e.last_name ? `${e.first_name} ${e.last_name}` : (e.first_name || e.last_name || e.name || e.full_name || 'Unknown'),
                flagSrc: '',
                status: 'registered'
            })));
        } catch {
            console.error('Failed to fetch users');
        }
    };

    const [systemCurrencies, setSystemCurrencies] = useState<{ id: number; currency_code: string }[]>([]);
    useEffect(() => {
        getCachedCurrencies().then(data => {
            setSystemCurrencies(data);
        });
    }, []);

    /** Extract the high (max) value from seller's expected_investment_amount */
    const getSellerInvestmentMax = (seller: Seller): string => {
        const fin = seller.financial_details;
        if (!fin || !fin.expected_investment_amount) return '';
        const amount = fin.expected_investment_amount;
        if (typeof amount === 'string') {
            try {
                const parsed = JSON.parse(amount);
                return parsed?.max || parsed?.min || amount;
            } catch {
                return amount;
            }
        }
        if (typeof amount === 'object') {
            return amount.max || amount.min || '';
        }
        return '';
    };

    const handleSelectBuyer = (buyer: Buyer) => {
        setSelectedBuyer(buyer);
        setBuyerTBD(false);
        setFormData((prev) => ({ ...prev, buyer_id: buyer.id }));
        // Auto-generate deal name
        const buyerName = buyer.company_overview?.reg_name || 'Buyer';
        if (selectedSeller) {
            const sellerName = selectedSeller.company_overview?.reg_name || 'Seller';
            setFormData((prev) => ({ ...prev, name: `${buyerName} – ${sellerName}` }));
        } else if (sellerTBD) {
            setFormData((prev) => ({ ...prev, name: `${buyerName} – TBD` }));
        }
    };

    const handleSelectSeller = (seller: Seller) => {
        setSelectedSeller(seller);
        setSellerTBD(false);
        setFormData((prev) => ({ ...prev, seller_id: seller.id }));

        // Auto-grab ticket size from seller's investment range (high value)
        if (!ticketSizeManuallyEdited) {
            const maxVal = getSellerInvestmentMax(seller);
            if (maxVal) {
                setFormData((prev) => ({ ...prev, ticket_size: maxVal }));
            }
            // Also grab currency if available
            if (seller.financial_details?.default_currency) {
                setFormData((prev) => ({ ...prev, estimated_ev_currency: seller.financial_details!.default_currency! }));
            }
        }

        // Auto-generate deal name
        const sellerName = seller.company_overview?.reg_name || 'Target';
        if (selectedBuyer) {
            const buyerName = selectedBuyer.company_overview?.reg_name || 'Investor';
            setFormData((prev) => ({
                ...prev,
                name: `${buyerName} – ${sellerName}`,
            }));
        } else if (buyerTBD) {
            setFormData((prev) => ({ ...prev, name: `TBD – ${sellerName}` }));
        }
    };

    const handleSkipBuyer = () => {
        setBuyerTBD(true);
        setSelectedBuyer(null);
        setFormData((prev) => ({ ...prev, buyer_id: 0 }));
        // Auto-name with TBD if seller exists
        if (selectedSeller) {
            const sellerName = selectedSeller.company_overview?.reg_name || 'Target';
            setFormData((prev) => ({ ...prev, name: `TBD – ${sellerName}` }));
        }
    };

    const handleSkipSeller = () => {
        setSellerTBD(true);
        setSelectedSeller(null);
        setFormData((prev) => ({ ...prev, seller_id: 0 }));
        // Auto-name with TBD if buyer exists
        if (selectedBuyer) {
            const buyerName = selectedBuyer.company_overview?.reg_name || 'Investor';
            setFormData((prev) => ({ ...prev, name: `${buyerName} – TBD` }));
        }
    };

    const getFANames = (fa: string | Record<string, string>[] | undefined) => {
        try {
            const parsed = typeof fa === 'string' ? JSON.parse(fa) : fa;
            if (Array.isArray(parsed)) return parsed.map((f: Record<string, string>) => f.name || f.reg_name).join(', ');
            return parsed?.name || parsed?.reg_name || 'None';
        } catch { return 'None'; }
    };

    const handleSubmit = async () => {
        // Allow 1-sided: at least one party required
        if (!formData.buyer_id && !formData.seller_id) {
            showAlert({ type: 'error', message: 'Please select at least one party (buyer or seller)' });
            return;
        }
        if (!formData.name) {
            showAlert({ type: 'error', message: 'Please enter a deal name' });
            return;
        }

        setLoading(true);
        try {
            await api.post('/api/deals', {
                ...formData,
                buyer_id: formData.buyer_id || null,
                seller_id: formData.seller_id || null,
                pipeline_type: defaultView,
            });
            showAlert({ type: 'success', message: 'Deal created successfully!' });
            onCreated();
        } catch {
            showAlert({ type: 'error', message: 'Failed to create deal' });
        } finally {
            setLoading(false);
        }
    };

    const filteredBuyers = buyers.filter((b) =>
        b.company_overview?.reg_name?.toLowerCase().includes(searchBuyer.toLowerCase())
    );

    const filteredSellers = sellers.filter((s) =>
        s.company_overview?.reg_name?.toLowerCase().includes(searchSeller.toLowerCase())
    );

    // Determine step labels based on defaultView
    const step1Label = defaultView === 'seller' ? 'Select Target' : 'Select Investor';
    const step2Label = defaultView === 'seller' ? 'Select Investor' : 'Select Target';

    // Determine whether step 1 deals with buyers or sellers
    const step1IsBuyer = defaultView === 'buyer';

    // Can proceed from step 1: selected or TBD
    const canProceedStep1 = step1IsBuyer
        ? (!!selectedBuyer || buyerTBD)
        : (!!selectedSeller || sellerTBD);

    // Can proceed from step 2: selected or TBD (but at least ONE party must be real)
    const canProceedStep2 = step1IsBuyer
        ? (!!selectedSeller || sellerTBD)
        : (!!selectedBuyer || buyerTBD);

    const hasAtLeastOneParty = !!selectedBuyer || !!selectedSeller;

    // Shared input/component style with 3px border-radius
    const inputClass = "w-full px-4 py-2 border border-gray-300 rounded-[3px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm";
    const selectClass = "w-full px-4 py-2 border border-gray-300 rounded-[3px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm";
    const buttonItemClass = (isSelected: boolean, accentColor: string) =>
        `w-full flex items-center gap-3 px-4 py-3 rounded-[3px] border transition-colors ${isSelected
            ? `border-${accentColor}-500 bg-${accentColor}-50`
            : 'hover:bg-gray-50'
        }`;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-[3px] shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h2 className="text-lg font-medium text-gray-900">Create New Deal</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-[3px] transition-colors" title="Close modal" aria-label="Close modal">
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Steps Indicator */}
                <div className="flex items-center px-6 py-4 border-b bg-gray-50">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= s ? 'bg-[#064771] text-white' : 'bg-gray-200 text-gray-500'
                                    }`}
                            >
                                {s}
                            </div>
                            <span className={`ml-2 text-sm ${step >= s ? 'text-gray-900' : 'text-gray-500'}`}>
                                {s === 1 ? step1Label : s === 2 ? step2Label : 'Deal Details'}
                            </span>
                            {s < 3 && <div className="w-12 h-0.5 mx-4 bg-gray-200" />}
                        </div>
                    ))}
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[50vh]">
                    {/* ===== STEP 1 ===== */}
                    {step === 1 && (
                        <div>
                            {step1IsBuyer ? (
                                /* Step 1 is Select Investor (Buyer) */
                                <>
                                    <input
                                        type="text"
                                        placeholder="Search investors..."
                                        value={searchBuyer}
                                        onChange={(e) => setSearchBuyer(e.target.value)}
                                        className={`${inputClass} mb-4`}
                                    />
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {filteredBuyers.map((buyer) => (
                                            <button
                                                key={buyer.id}
                                                onClick={() => handleSelectBuyer(buyer)}
                                                className={buttonItemClass(selectedBuyer?.id === buyer.id, 'blue')}
                                                style={selectedBuyer?.id === buyer.id ? { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' } : {}}
                                            >
                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-[#064771] font-semibold">
                                                    {buyer.company_overview?.reg_name?.charAt(0) || 'B'}
                                                </div>
                                                <span className="text-sm font-medium text-gray-900">
                                                    {buyer.company_overview?.reg_name || `Buyer #${buyer.id}`}
                                                </span>
                                            </button>
                                        ))}
                                        {filteredBuyers.length === 0 && (
                                            <p className="text-center text-gray-500 py-4">No investors found</p>
                                        )}
                                    </div>
                                    {/* Skip option */}
                                    <button
                                        onClick={handleSkipBuyer}
                                        className={`mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-[3px] border-2 border-dashed transition-colors ${buyerTBD
                                            ? 'border-amber-400 bg-amber-50 text-amber-700'
                                            : 'border-gray-300 text-gray-500 hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700'
                                            }`}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                        <span className="text-sm font-medium">Skip for now (Investor TBD)</span>
                                    </button>
                                    {buyerTBD && (
                                        <p className="mt-2 text-xs text-amber-600 text-center">
                                            Deal will be created as a <strong>Seller Mandate</strong> — you can assign an investor later.
                                        </p>
                                    )}
                                </>
                            ) : (
                                /* Step 1 is Select Target (Seller) */
                                <>
                                    <input
                                        type="text"
                                        placeholder="Search targets..."
                                        value={searchSeller}
                                        onChange={(e) => setSearchSeller(e.target.value)}
                                        className={`${inputClass} mb-4`}
                                    />
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {filteredSellers.map((seller) => (
                                            <button
                                                key={seller.id}
                                                onClick={() => handleSelectSeller(seller)}
                                                className={buttonItemClass(selectedSeller?.id === seller.id, 'green')}
                                                style={selectedSeller?.id === seller.id ? { borderColor: '#22C55E', backgroundColor: '#F0FDF4' } : {}}
                                            >
                                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-semibold">
                                                    {seller.company_overview?.reg_name?.charAt(0) || 'S'}
                                                </div>
                                                <span className="text-sm font-medium text-gray-900">
                                                    {seller.company_overview?.reg_name || `Seller #${seller.id}`}
                                                </span>
                                            </button>
                                        ))}
                                        {filteredSellers.length === 0 && (
                                            <p className="text-center text-gray-500 py-4">No targets found</p>
                                        )}
                                    </div>
                                    {/* Skip option */}
                                    <button
                                        onClick={handleSkipSeller}
                                        className={`mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-[3px] border-2 border-dashed transition-colors ${sellerTBD
                                            ? 'border-amber-400 bg-amber-50 text-amber-700'
                                            : 'border-gray-300 text-gray-500 hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700'
                                            }`}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                        <span className="text-sm font-medium">Skip for now (Target TBD)</span>
                                    </button>
                                    {sellerTBD && (
                                        <p className="mt-2 text-xs text-amber-600 text-center">
                                            Deal will be created as a <strong>Buyer Mandate</strong> — you can assign a target later.
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* ===== STEP 2 ===== */}
                    {step === 2 && (
                        <div>
                            {step1IsBuyer ? (
                                /* Step 2 is Select Target (Seller) */
                                <>
                                    <input
                                        type="text"
                                        placeholder="Search targets..."
                                        value={searchSeller}
                                        onChange={(e) => setSearchSeller(e.target.value)}
                                        className={`${inputClass} mb-4`}
                                    />
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {filteredSellers.map((seller) => (
                                            <button
                                                key={seller.id}
                                                onClick={() => handleSelectSeller(seller)}
                                                className={buttonItemClass(selectedSeller?.id === seller.id, 'green')}
                                                style={selectedSeller?.id === seller.id ? { borderColor: '#22C55E', backgroundColor: '#F0FDF4' } : {}}
                                            >
                                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-semibold">
                                                    {seller.company_overview?.reg_name?.charAt(0) || 'S'}
                                                </div>
                                                <span className="text-sm font-medium text-gray-900">
                                                    {seller.company_overview?.reg_name || `Seller #${seller.id}`}
                                                </span>
                                            </button>
                                        ))}
                                        {filteredSellers.length === 0 && (
                                            <p className="text-center text-gray-500 py-4">No targets found</p>
                                        )}
                                    </div>
                                    {/* Skip option */}
                                    <button
                                        onClick={handleSkipSeller}
                                        className={`mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-[3px] border-2 border-dashed transition-colors ${sellerTBD
                                            ? 'border-amber-400 bg-amber-50 text-amber-700'
                                            : 'border-gray-300 text-gray-500 hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700'
                                            }`}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                        <span className="text-sm font-medium">Skip for now (Target TBD)</span>
                                    </button>
                                    {sellerTBD && (
                                        <p className="mt-2 text-xs text-amber-600 text-center">
                                            Deal will be created as a <strong>Buyer Mandate</strong> — you can assign a target later.
                                        </p>
                                    )}
                                </>
                            ) : (
                                /* Step 2 is Select Investor (Buyer) */
                                <>
                                    <input
                                        type="text"
                                        placeholder="Search investors..."
                                        value={searchBuyer}
                                        onChange={(e) => setSearchBuyer(e.target.value)}
                                        className={`${inputClass} mb-4`}
                                    />
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {filteredBuyers.map((buyer) => (
                                            <button
                                                key={buyer.id}
                                                onClick={() => handleSelectBuyer(buyer)}
                                                className={buttonItemClass(selectedBuyer?.id === buyer.id, 'blue')}
                                                style={selectedBuyer?.id === buyer.id ? { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' } : {}}
                                            >
                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-[#064771] font-semibold">
                                                    {buyer.company_overview?.reg_name?.charAt(0) || 'B'}
                                                </div>
                                                <span className="text-sm font-medium text-gray-900">
                                                    {buyer.company_overview?.reg_name || `Buyer #${buyer.id}`}
                                                </span>
                                            </button>
                                        ))}
                                        {filteredBuyers.length === 0 && (
                                            <p className="text-center text-gray-500 py-4">No investors found</p>
                                        )}
                                    </div>
                                    {/* Skip option */}
                                    <button
                                        onClick={handleSkipBuyer}
                                        className={`mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-[3px] border-2 border-dashed transition-colors ${buyerTBD
                                            ? 'border-amber-400 bg-amber-50 text-amber-700'
                                            : 'border-gray-300 text-gray-500 hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700'
                                            }`}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                        <span className="text-sm font-medium">Skip for now (Investor TBD)</span>
                                    </button>
                                    {buyerTBD && (
                                        <p className="mt-2 text-xs text-amber-600 text-center">
                                            Deal will be created as a <strong>Seller Mandate</strong> — you can assign an investor later.
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* ===== STEP 3: Deal Details ===== */}
                    {step === 3 && (
                        <div className="space-y-4">
                            {/* Mandate indicator */}
                            {(buyerTBD || sellerTBD) && (
                                <div className="flex items-center gap-2 px-3 py-2 rounded-[3px] bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>
                                        Creating as <strong>{buyerTBD ? 'Seller Mandate' : 'Buyer Mandate'}</strong> — {buyerTBD ? 'Investor' : 'Target'} is TBD and can be assigned later.
                                    </span>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Deal Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                                    className={inputClass}
                                    placeholder="e.g., Buyer Corp – Seller Inc"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Transaction Size
                                        {selectedSeller && !ticketSizeManuallyEdited && formData.ticket_size && (
                                            <span className="ml-1 text-xs text-green-600 font-normal">(auto-filled from target)</span>
                                        )}
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            value={formData.ticket_size}
                                            onChange={(e) => {
                                                setTicketSizeManuallyEdited(true);
                                                setFormData((prev) => ({ ...prev, ticket_size: e.target.value }));
                                            }}
                                            className={`flex-1 px-4 py-2 border border-gray-300 rounded-[3px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm`}
                                            placeholder="Amount"
                                        />
                                        <select
                                            id="deal-currency"
                                            aria-label="Currency"
                                            value={formData.estimated_ev_currency}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, estimated_ev_currency: e.target.value }))}
                                            className="w-24 px-2 py-2 border border-gray-300 rounded-[3px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        >
                                            {systemCurrencies.map(c => <option key={c.id} value={c.currency_code}>{c.currency_code}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="deal-stage" className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
                                    <select
                                        id="deal-stage"
                                        value={formData.stage_code}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, stage_code: e.target.value }))}
                                        className={selectClass}
                                    >
                                        {stages.map((stage) => (
                                            <option key={stage.code} value={stage.code}>
                                                {stage.code} - {stage.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="deal-probability" className="block text-sm font-medium text-gray-700 mb-1">Probability</label>
                                    <select
                                        id="deal-probability"
                                        value={formData.possibility}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, possibility: e.target.value }))}
                                        className={selectClass}
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Target Close Date</label>
                                    <input
                                        type="date"
                                        value={formData.target_close_date}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, target_close_date: e.target.value }))}
                                        className={inputClass}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Internal PIC (Assigned Staff)</label>
                                <Dropdown
                                    countries={users}
                                    selected={formData.internal_pic}
                                    onSelect={(selected) => setFormData(prev => ({ ...prev, internal_pic: (Array.isArray(selected) ? selected : [selected]) as User[] }))}
                                    multiSelect={true}
                                    placeholder="Select Staff"
                                />
                            </div>

                            {/* FA Info Section */}
                            <div className="bg-blue-50 p-4 rounded-[3px] space-y-2 text-xs text-blue-800 border border-blue-100">
                                <p className="font-semibold flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    Financial Advisor (FA) Information
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="opacity-70">Investor FA:</span>
                                        <p className="font-medium">{selectedBuyer ? getFANames(selectedBuyer.company_overview?.financial_advisor) : (buyerTBD ? 'TBD' : 'None')}</p>
                                    </div>
                                    <div>
                                        <span className="opacity-70">Target FA:</span>
                                        <p className="font-medium">{selectedSeller ? getFANames(selectedSeller.company_overview?.financial_advisor) : (sellerTBD ? 'TBD' : 'None')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
                    <button
                        onClick={() => (step > 1 ? setStep(step - 1) : onClose())}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-[3px] transition-colors"
                    >
                        {step === 1 ? 'Cancel' : 'Back'}
                    </button>
                    <button
                        onClick={() => {
                            if (step === 1 && !canProceedStep1) {
                                showAlert({ type: 'error', message: `Please select ${step1IsBuyer ? 'an investor' : 'a target'} or skip for now` });
                                return;
                            }
                            if (step === 2 && !canProceedStep2) {
                                showAlert({ type: 'error', message: `Please select ${step1IsBuyer ? 'a target' : 'an investor'} or skip for now` });
                                return;
                            }
                            if (step === 2 && !hasAtLeastOneParty) {
                                showAlert({ type: 'error', message: 'At least one party (buyer or seller) must be selected. You cannot skip both.' });
                                return;
                            }
                            if (step < 3) {
                                setStep(step + 1);
                            } else {
                                handleSubmit();
                            }
                        }}
                        disabled={loading}
                        className="px-6 py-2 bg-[#064771] text-white rounded-[3px] hover:bg-[#053a5c] transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Creating...' : step < 3 ? 'Next' : 'Create Deal'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateDealModal;

