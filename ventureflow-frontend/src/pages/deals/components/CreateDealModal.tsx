import { useState, useEffect } from 'react';
import api from '../../../config/api';
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
        financial_advisor?: string | any[];
    };
}

interface Seller {
    id: number;
    company_overview?: {
        reg_name: string;
        financial_advisor?: string | any[];
    };
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
        internal_pic: [] as any[],
        target_close_date: '',
        stage_code: '',
    });

    const [selectedBuyer, setSelectedBuyer] = useState<Buyer | null>(null);
    const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);

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
            const filteredStages = stagesData.filter((s: any) => s.pipeline_type === defaultView);
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
            setUsers(employees.map((e: any) => ({
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
        api.get('/api/currencies').then(res => {
            setSystemCurrencies(Array.isArray(res.data) ? res.data : (res.data?.data || []));
        });
    }, []);

    const handleSelectBuyer = (buyer: Buyer) => {
        setSelectedBuyer(buyer);
        setFormData((prev) => ({ ...prev, buyer_id: buyer.id }));
        // Auto-generate deal name if seller is selected
        if (selectedSeller) {
            const buyerName = buyer.company_overview?.reg_name || 'Buyer';
            const sellerName = selectedSeller.company_overview?.reg_name || 'Seller';
            setFormData((prev) => ({ ...prev, name: `${buyerName} – ${sellerName}` }));
        }
    };

    const handleSelectSeller = (seller: Seller) => {
        setSelectedSeller(seller);
        setFormData((prev) => ({ ...prev, seller_id: seller.id }));
        // Auto-generate deal name
        if (selectedBuyer) {
            const buyerName = selectedBuyer.company_overview?.reg_name || 'Investor';
            const sellerName = seller.company_overview?.reg_name || 'Target';
            setFormData((prev) => ({
                ...prev,
                name: `${buyerName} – ${sellerName}`,
            }));
        }
    };

    const getFANames = (fa: any) => {
        try {
            const parsed = typeof fa === 'string' ? JSON.parse(fa) : fa;
            if (Array.isArray(parsed)) return parsed.map(f => f.name || f.reg_name).join(', ');
            return parsed?.name || parsed?.reg_name || 'None';
        } catch (e) { return 'None'; }
    };

    const handleSubmit = async () => {
        if (!formData.buyer_id || !formData.seller_id) {
            showAlert({ type: 'error', message: 'Please select both buyer and seller' });
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

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h2 className="text-xl font-semibold text-gray-900">Create New Deal</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
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
                                {s === 1
                                    ? (defaultView === 'seller' ? 'Select Target' : 'Select Investor')
                                    : s === 2
                                        ? (defaultView === 'seller' ? 'Select Investor' : 'Select Target')
                                        : 'Deal Details'}
                            </span>
                            {s < 3 && <div className="w-12 h-0.5 mx-4 bg-gray-200" />}
                        </div>
                    ))}
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[50vh]">
                    {step === 1 && (
                        <div>
                            <input
                                type="text"
                                placeholder="Search investors..."
                                value={searchBuyer}
                                onChange={(e) => setSearchBuyer(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {filteredBuyers.map((buyer) => (
                                    <button
                                        key={buyer.id}
                                        onClick={() => handleSelectBuyer(buyer)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors ${selectedBuyer?.id === buyer.id
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'hover:bg-gray-50'
                                            }`}
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
                        </div>
                    )}

                    {step === 2 && (
                        <div>
                            <input
                                type="text"
                                placeholder="Search targets..."
                                value={searchSeller}
                                onChange={(e) => setSearchSeller(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {filteredSellers.map((seller) => (
                                    <button
                                        key={seller.id}
                                        onClick={() => handleSelectSeller(seller)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors ${selectedSeller?.id === seller.id
                                            ? 'border-green-500 bg-green-50'
                                            : 'hover:bg-gray-50'
                                            }`}
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
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Deal Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g., Buyer Corp – Seller Inc"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ticket Size</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            value={formData.ticket_size}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, ticket_size: e.target.value }))}
                                            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Amount"
                                        />
                                        <select
                                            value={formData.estimated_ev_currency}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, estimated_ev_currency: e.target.value }))}
                                            className="w-24 px-2 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            {systemCurrencies.map(c => <option key={c.id} value={c.currency_code}>{c.currency_code}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
                                    <select
                                        value={formData.stage_code}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, stage_code: e.target.value }))}
                                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Possibility</label>
                                    <select
                                        value={formData.possibility}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, possibility: e.target.value }))}
                                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Internal PIC (Assigned Staff)</label>
                                <Dropdown
                                    countries={users}
                                    selected={formData.internal_pic}
                                    onSelect={(selected: any) => setFormData(prev => ({ ...prev, internal_pic: selected as any[] }))}
                                    multiSelect={true}
                                    placeholder="Select Staff"
                                />
                            </div>

                            {/* FA Info Section */}
                            <div className="bg-blue-50 p-4 rounded-lg space-y-2 text-xs text-blue-800 border border-blue-100">
                                <p className="font-semibold flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    Financial Advisor (FA) Information
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="opacity-70">Investor FA:</span>
                                        <p className="font-medium">{selectedBuyer ? getFANames(selectedBuyer.company_overview?.financial_advisor) : 'None'}</p>
                                    </div>
                                    <div>
                                        <span className="opacity-70">Target FA:</span>
                                        <p className="font-medium">{selectedSeller ? getFANames(selectedSeller.company_overview?.financial_advisor) : 'None'}</p>
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
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        {step === 1 ? 'Cancel' : 'Back'}
                    </button>
                    <button
                        onClick={() => {
                            if (step === 1 && !selectedBuyer) {
                                showAlert({ type: 'error', message: 'Please select a buyer' });
                                return;
                            }
                            if (step === 2 && !selectedSeller) {
                                showAlert({ type: 'error', message: 'Please select a seller' });
                                return;
                            }
                            if (step < 3) {
                                setStep(step + 1);
                            } else {
                                handleSubmit();
                            }
                        }}
                        disabled={loading}
                        className="px-6 py-2 bg-[#064771] text-white rounded-lg hover:bg-[#053a5c] transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Creating...' : step < 3 ? 'Next' : 'Create Deal'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateDealModal;

