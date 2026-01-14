import { useState, useEffect } from 'react';
import api from '../../../config/api';
import { showAlert } from '../../../components/Alert';

interface CreateDealModalProps {
    onClose: () => void;
    onCreated: () => void;
    defaultView?: 'buyer' | 'seller';
}

interface Buyer {
    id: number;
    company_overview?: {
        reg_name: string;
    };
}

interface Seller {
    id: number;
    company_overview?: {
        reg_name: string;
    };
}

interface User {
    id: number;
    name: string;
}

const CreateDealModal = ({ onClose, onCreated, defaultView = 'buyer' }: CreateDealModalProps) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [buyers, setBuyers] = useState<Buyer[]>([]);
    const [sellers, setSellers] = useState<Seller[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [searchBuyer, setSearchBuyer] = useState('');
    const [searchSeller, setSearchSeller] = useState('');

    const [formData, setFormData] = useState({
        buyer_id: 0,
        seller_id: 0,
        name: '',
        industry: '',
        estimated_ev_value: '',
        estimated_ev_currency: 'USD',
        priority: 'medium',
        pic_user_id: '',
        target_close_date: '',
    });

    const [selectedBuyer, setSelectedBuyer] = useState<Buyer | null>(null);
    const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);

    useEffect(() => {
        fetchBuyers();
        fetchSellers();
        fetchUsers();
    }, []);

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
            setUsers(employees.map((e: { user_id: number; full_name: string }) => ({
                id: e.user_id,
                name: e.full_name,
            })).filter((u: User) => u.id));
        } catch {
            console.error('Failed to fetch users');
        }
    };

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
            const buyerName = selectedBuyer.company_overview?.reg_name || 'Buyer';
            const sellerName = seller.company_overview?.reg_name || 'Seller';
            setFormData((prev) => ({
                ...prev,
                name: `${buyerName} – ${sellerName}`,
                industry: '', // Could pull from seller
            }));
        }
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
                estimated_ev_value: formData.estimated_ev_value ? parseFloat(formData.estimated_ev_value) : null,
                pic_user_id: formData.pic_user_id ? parseInt(formData.pic_user_id) : null,
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
                                    ? (defaultView === 'seller' ? 'Select Seller' : 'Select Buyer')
                                    : s === 2
                                        ? (defaultView === 'seller' ? 'Select Buyer' : 'Select Seller')
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
                                placeholder="Search buyers..."
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
                                    <p className="text-center text-gray-500 py-4">No buyers found</p>
                                )}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div>
                            <input
                                type="text"
                                placeholder="Search sellers..."
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
                                    <p className="text-center text-gray-500 py-4">No sellers found</p>
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                                    <input
                                        type="text"
                                        value={formData.industry}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, industry: e.target.value }))}
                                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g., Technology"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Estimated EV</label>
                                    <input
                                        type="number"
                                        value={formData.estimated_ev_value}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, estimated_ev_value: e.target.value }))}
                                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g., 85000000"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                    <select
                                        value={formData.priority}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, priority: e.target.value }))}
                                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Person in Charge (PIC)</label>
                                <select
                                    value={formData.pic_user_id}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, pic_user_id: e.target.value }))}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select PIC...</option>
                                    {users.map((user) => (
                                        <option key={user.id} value={user.id}>
                                            {user.name}
                                        </option>
                                    ))}
                                </select>
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

