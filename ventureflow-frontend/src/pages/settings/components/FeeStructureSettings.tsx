/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, GripVertical, Save } from 'lucide-react';
import api from '../../../config/api';
import { showAlert } from '../../../components/Alert';
import { BrandSpinner } from '../../../components/BrandSpinner';
import DataTableSearch from '../../../components/table/DataTableSearch';

/** Format a number with commas (1000000 → "1,000,000") */
const formatWithCommas = (value: number | string | null | undefined): string => {
    if (value === null || value === undefined || value === '') return '';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(num);
};

/** Strip commas and parse to number */
const parseFormattedNumber = (formatted: string): number | null => {
    const cleaned = formatted.replace(/,/g, '');
    if (cleaned === '' || cleaned === '-') return null;
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
};

/** Input that shows commas while viewing, raw number while editing */
const FormattedAmountInput: React.FC<{
    value: number | null | undefined;
    onChange: (value: number | null) => void;
    placeholder?: string;
    className?: string;
}> = ({ value, onChange, placeholder, className }) => {
    const [focused, setFocused] = useState(false);
    const [displayValue, setDisplayValue] = useState(() => formatWithCommas(value));

    // Sync display when value changes externally (not while user is typing)
    useEffect(() => {
        if (!focused) {
            setDisplayValue(formatWithCommas(value));
        }
    }, [value, focused]);

    const handleFocus = () => {
        setFocused(true);
        // Show raw number for easier editing
        if (value !== null && value !== undefined) {
            setDisplayValue(String(value));
        }
    };

    const handleBlur = () => {
        setFocused(false);
        const parsed = parseFormattedNumber(displayValue);
        onChange(parsed);
        setDisplayValue(formatWithCommas(parsed));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        // Allow only digits, dots, and commas while typing
        if (/^[\d.,]*$/.test(raw)) {
            setDisplayValue(raw);
        }
    };

    return (
        <input
            type="text"
            inputMode="decimal"
            value={displayValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            className={className}
        />
    );
};

interface FeeTier {
    id?: number;
    fee_type: 'investor' | 'target';
    min_amount: number;
    max_amount: number | null;
    success_fee_fixed: number | null;
    success_fee_rate: number | null;
    retainer_details: string | null;
    fee_constraints: string | null;
    order_index: number;
    is_active: boolean;
}

/** Derive the fee mode from a tier's data */
const getFeeMode = (tier: FeeTier): 'fixed' | 'percentage' => {
    if (tier.success_fee_rate != null && tier.success_fee_rate > 0) return 'percentage';
    return 'fixed';
};

const FeeStructureSettings: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'investor' | 'target'>('investor');
    const [tiers, setTiers] = useState<FeeTier[]>([]);
    const [feeModes, setFeeModes] = useState<Record<number, 'fixed' | 'percentage'>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchTiers = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/fee-tiers', {
                params: { type: activeTab }
            });
            const data: FeeTier[] = response.data;
            setTiers(data);
            // Derive fee modes from data
            const modes: Record<number, 'fixed' | 'percentage'> = {};
            data.forEach((t, i) => { modes[i] = getFeeMode(t); });
            setFeeModes(modes);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            showAlert({ type: 'error', message: 'Failed to fetch fee tiers' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTiers();
    }, [activeTab]);

    const handleAddTier = () => {
        const defaultMode: 'fixed' | 'percentage' = activeTab === 'investor' ? 'fixed' : 'percentage';
        const newTier: FeeTier = {
            fee_type: activeTab,
            min_amount: 0,
            max_amount: null,
            success_fee_fixed: defaultMode === 'fixed' ? 0 : null,
            success_fee_rate: defaultMode === 'percentage' ? 0 : null,
            retainer_details: null,
            fee_constraints: null,
            order_index: tiers.length,
            is_active: true
        };
        setTiers(prev => [...prev, newTier]);
        setFeeModes(prev => ({ ...prev, [tiers.length]: defaultMode }));
    };

    const handleRemoveTier = (index: number) => {
        const newTiers = [...tiers];
        newTiers.splice(index, 1);
        const reIndexed = newTiers.map((t, i) => ({ ...t, order_index: i }));
        setTiers(reIndexed);
        // Rebuild fee modes
        const modes: Record<number, 'fixed' | 'percentage'> = {};
        reIndexed.forEach((t, i) => { modes[i] = feeModes[i >= index ? i + 1 : i] ?? getFeeMode(t); });
        setFeeModes(modes);
    };

    const handleTierChange = (index: number, field: keyof FeeTier, value: any) => {
        const newTiers = [...tiers];
        newTiers[index] = { ...newTiers[index], [field]: value };
        setTiers(newTiers);
    };

    const handleFeeModeToggle = (index: number) => {
        const current = feeModes[index] ?? 'fixed';
        const next = current === 'fixed' ? 'percentage' : 'fixed';
        setFeeModes(prev => ({ ...prev, [index]: next }));

        // Transfer the value between fields
        const tier = tiers[index];
        const newTiers = [...tiers];
        if (next === 'percentage') {
            // switching to %
            newTiers[index] = { ...tier, success_fee_rate: tier.success_fee_fixed ?? 0, success_fee_fixed: null };
        } else {
            // switching to $
            newTiers[index] = { ...tier, success_fee_fixed: tier.success_fee_rate ?? 0, success_fee_rate: null };
        }
        setTiers(newTiers);
    };

    const handleSave = async () => {
        if (tiers.length === 0) {
            showAlert({ type: 'error', message: 'You must have at least one fee tier' });
            return;
        }

        const invalid = tiers.some(t => t.min_amount < 0);
        if (invalid) {
            showAlert({ type: 'error', message: 'All tiers must have a valid minimum amount' });
            return;
        }

        setSaving(true);
        try {
            const formattedTiers = tiers.map((tier, index) => ({
                min_amount: Number(tier.min_amount) || 0,
                max_amount: tier.max_amount ? Number(tier.max_amount) : null,
                success_fee_fixed: tier.success_fee_fixed != null ? Number(tier.success_fee_fixed) : null,
                success_fee_rate: tier.success_fee_rate != null ? Number(tier.success_fee_rate) : null,
                retainer_details: null,
                fee_constraints: null,
                order_index: index,
            }));

            await api.post('/api/fee-tiers/bulk', {
                type: activeTab,
                tiers: formattedTiers
            });
            showAlert({ type: 'success', message: 'Fee tiers updated successfully' });
            fetchTiers();
        } catch (error: any) {
            console.error('Failed to save fee tiers:', error);
            const errorMessage = error.response?.data?.message || 'Failed to save fee tiers';
            showAlert({ type: 'error', message: errorMessage });
        } finally {
            setSaving(false);
        }
    };

    const filteredTiers = useMemo(() => {
        if (!searchQuery) return tiers;
        const q = searchQuery.toLowerCase();
        return tiers.filter(t =>
            String(t.min_amount).includes(q) ||
            String(t.max_amount).includes(q)
        );
    }, [tiers, searchQuery]);

    /* ── shared styles ── */
    const inputClass =
        'w-full px-3 py-1.5 bg-white border border-gray-200 rounded-[3px] text-sm focus:outline-none focus:ring-2 focus:ring-[#064771]/10 focus:border-[#064771] transition-all';

    return (
        <div className="h-full flex flex-col bg-[#f9fafb] overflow-hidden ">
            {/* Header */}
            <div className="px-8 py-6">
                <div className="flex items-center justify-between gap-6">
                    <div className="flex items-center gap-8 flex-1">
                        <h1 className="text-2xl font-medium text-gray-900 whitespace-nowrap">
                            Fee Structure Settings
                        </h1>
                        <DataTableSearch
                            value={searchQuery}
                            onChange={setSearchQuery}
                            placeholder="Search tiers..."
                        />
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="px-8 border-b border-gray-100">
                <div className="flex space-x-8">
                    <button
                        onClick={() => setActiveTab('investor')}
                        className={`py-4 px-2 border-b-2 font-medium text-sm transition-all flex items-center gap-2 ${activeTab === 'investor'
                            ? 'border-[#064771] text-[#064771]'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Investor Fees
                    </button>
                    <button
                        onClick={() => setActiveTab('target')}
                        className={`py-4 px-2 border-b-2 font-medium text-sm transition-all flex items-center gap-2 ${activeTab === 'target'
                            ? 'border-[#064771] text-[#064771]'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Target Fees
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden flex flex-col mt-6">
                <div className="flex-1 px-8 pb-8 overflow-hidden">
                    <div className="h-full bg-white rounded-[3px] border border-gray-100 flex flex-col overflow-hidden">
                        {loading ? (
                            <div className="flex-1 flex items-center justify-center min-h-screen">
                                <BrandSpinner size="lg" />
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col overflow-hidden">
                                <div className="flex-1 overflow-y-auto p-6 scrollbar-premium">
                                    <div className="space-y-4">
                                        {/* Column Headers — unified for both tabs */}
                                        <div className="flex gap-4 px-4 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-gray-100/50">
                                            <div className="w-12">Order</div>
                                            <div className="flex-1">Minimum Transaction Amount</div>
                                            <div className="flex-1">Maximum Transaction Amount</div>
                                            <div className="w-56">Success Fee</div>
                                            <div className="w-[60px]"></div>
                                        </div>

                                        {/* Rows */}
                                        <div className="space-y-2">
                                            {filteredTiers.map((tier, index) => {
                                                const mode = feeModes[index] ?? 'fixed';
                                                const feeValue = mode === 'fixed'
                                                    ? (tier.success_fee_fixed ?? '')
                                                    : (tier.success_fee_rate ?? '');

                                                return (
                                                    <div
                                                        key={index}
                                                        className="flex gap-4 items-center bg-gray-50/50 p-3 rounded-[3px] border border-gray-100 transition-all hover:border-[#064771]/30"
                                                    >
                                                        {/* Order */}
                                                        <div className="w-12 flex items-center gap-2">
                                                            <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                                                            <span className="text-sm font-medium text-gray-400">{index + 1}</span>
                                                        </div>

                                                        {/* Minimum Transaction Amount */}
                                                        <div className="flex-1">
                                                            <FormattedAmountInput
                                                                value={tier.min_amount}
                                                                onChange={(v) => handleTierChange(index, 'min_amount', v ?? 0)}
                                                                placeholder="0"
                                                                className={inputClass}
                                                            />
                                                        </div>

                                                        {/* Maximum Transaction Amount */}
                                                        <div className="flex-1">
                                                            <FormattedAmountInput
                                                                value={tier.max_amount}
                                                                onChange={(v) => handleTierChange(index, 'max_amount', v)}
                                                                placeholder="No limit"
                                                                className={inputClass}
                                                            />
                                                        </div>

                                                        {/* Success Fee — with $ / % toggle */}
                                                        <div className="w-56 flex items-center gap-0">
                                                            {mode === 'fixed' ? (
                                                                <FormattedAmountInput
                                                                    value={tier.success_fee_fixed}
                                                                    onChange={(v) => handleTierChange(index, 'success_fee_fixed', v)}
                                                                    placeholder="0"
                                                                    className="flex-1 min-w-0 px-3 py-1.5 bg-white border border-gray-200 rounded-l-[3px] border-r-0 text-sm focus:outline-none focus:ring-2 focus:ring-[#064771]/10 focus:border-[#064771] transition-all"
                                                                />
                                                            ) : (
                                                                <input
                                                                    type="number"
                                                                    value={feeValue}
                                                                    onChange={(e) => {
                                                                        const v = e.target.value ? parseFloat(e.target.value) : null;
                                                                        handleTierChange(index, 'success_fee_rate', v);
                                                                    }}
                                                                    placeholder="0.0"
                                                                    min="0"
                                                                    max={100}
                                                                    step={0.1}
                                                                    className="flex-1 min-w-0 px-3 py-1.5 bg-white border border-gray-200 rounded-l-[3px] border-r-0 text-sm focus:outline-none focus:ring-2 focus:ring-[#064771]/10 focus:border-[#064771] transition-all"
                                                                />
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={() => handleFeeModeToggle(index)}
                                                                className="h-[34px] px-3 border border-gray-200 rounded-r-[3px] text-xs font-semibold transition-all select-none whitespace-nowrap bg-gray-50 text-gray-600 hover:bg-[#064771]/5 hover:text-[#064771] hover:border-[#064771]/30"
                                                                title={`Click to switch to ${mode === 'fixed' ? 'percentage' : 'fixed amount'}`}
                                                            >
                                                                {mode === 'fixed' ? 'USD $' : '%'}
                                                            </button>
                                                        </div>

                                                        {/* Delete */}
                                                        <div className="w-[60px] flex justify-center">
                                                            <button
                                                                onClick={() => handleRemoveTier(index)}
                                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-[3px] transition-all"
                                                                title="Remove Tier"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <button
                                            onClick={handleAddTier}
                                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#064771] hover:bg-[#064771]/5 border border-transparent hover:border-[#064771]/20 rounded-[3px] transition-all"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Add Fee Tier
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex justify-end items-center gap-4">
                                    <button
                                        onClick={() => fetchTiers()}
                                        className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                                    >
                                        Reset Changes
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-[#064771] hover:bg-[#053a5e] text-white rounded-[3px] text-sm font-medium transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {saving ? (
                                            <BrandSpinner size="sm" />
                                        ) : (
                                            <Save className="w-4 h-4" />
                                        )}
                                        {saving ? 'Saving...' : 'Save Fee Structure'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeeStructureSettings;
