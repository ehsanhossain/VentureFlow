/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, GripVertical, Save, ChevronDown, ChevronRight, ShieldCheck, DollarSign } from 'lucide-react';
import api from '../../../config/api';
import { showAlert } from '../../../components/Alert';
import { BrandSpinner } from '../../../components/BrandSpinner';
import DataTableSearch from '../../../components/table/DataTableSearch';

/* ── Types ── */

interface GateRule {
    field: string;
    operator: string;
    value: any;
}

interface MonetizationConfig {
    enabled: boolean;
    type: 'one_time' | 'monthly';
    payment_name: string;
    amount: number | null;
    deduct_from_success_fee: boolean;
}

interface PipelineStage {
    id?: number;
    pipeline_type: 'buyer' | 'seller';
    code: string;
    name: string;
    progress: number;
    order_index: number;
    is_active: boolean;
    gate_rules: GateRule[] | null;
    monetization_config: MonetizationConfig | null;
}

/* ── Rule Field Definitions ── */

interface RuleFieldDef {
    key: string;
    label: string;
    operators: { value: string; label: string }[];
    valueType: 'boolean' | 'number' | 'select' | 'none';
    selectOptions?: { value: string; label: string }[];
}

const RULE_FIELDS: RuleFieldDef[] = [
    {
        key: 'both_parties',
        label: 'Both parties assigned',
        operators: [{ value: 'equals', label: 'is' }],
        valueType: 'boolean',
    },
    {
        key: 'has_buyer',
        label: 'Buyer (Investor) assigned',
        operators: [{ value: 'equals', label: 'is' }],
        valueType: 'boolean',
    },
    {
        key: 'has_seller',
        label: 'Seller (Target) assigned',
        operators: [{ value: 'equals', label: 'is' }],
        valueType: 'boolean',
    },
];

/* ── Default monetization config ── */
const DEFAULT_MONETIZATION: MonetizationConfig = {
    enabled: false,
    type: 'one_time',
    payment_name: '',
    amount: null,
    deduct_from_success_fee: false,
};

/* ── Components ── */

const RuleRow: React.FC<{
    rule: GateRule;
    onChange: (rule: GateRule) => void;
    onRemove: () => void;
}> = ({ rule, onChange, onRemove }) => {
    const fieldDef = RULE_FIELDS.find(f => f.key === rule.field);
    const operators = fieldDef?.operators ?? [];

    const handleFieldChange = (newField: string) => {
        const def = RULE_FIELDS.find(f => f.key === newField);
        const defaultOp = def?.operators[0]?.value ?? 'equals';
        let defaultVal: any = null;
        if (def?.valueType === 'boolean') defaultVal = true;
        else if (def?.valueType === 'number') defaultVal = 0;
        else if (def?.valueType === 'select') defaultVal = def.selectOptions?.[0]?.value ?? '';
        onChange({ field: newField, operator: defaultOp, value: defaultVal });
    };

    return (
        <div className="flex items-center gap-2 py-1.5">
            {/* Field */}
            <select
                value={rule.field}
                onChange={e => handleFieldChange(e.target.value)}
                className="flex-1 min-w-0 px-2.5 py-1.5 bg-white border border-gray-200 rounded-[3px] text-xs focus:outline-none focus:ring-2 focus:ring-[#064771]/10 focus:border-[#064771] transition-all"
                title="Select rule field"
            >
                <option value="">Select criteria...</option>
                {RULE_FIELDS.map(f => (
                    <option key={f.key} value={f.key}>{f.label}</option>
                ))}
            </select>

            {/* Operator */}
            {operators.length > 1 ? (
                <select
                    value={rule.operator}
                    onChange={e => onChange({ ...rule, operator: e.target.value })}
                    className="w-28 px-2.5 py-1.5 bg-white border border-gray-200 rounded-[3px] text-xs focus:outline-none focus:ring-2 focus:ring-[#064771]/10 focus:border-[#064771] transition-all"
                    title="Select operator"
                >
                    {operators.map(op => (
                        <option key={op.value} value={op.value}>{op.label}</option>
                    ))}
                </select>
            ) : (
                <span className="w-28 px-2.5 py-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-[3px] text-center">
                    {operators[0]?.label ?? '--'}
                </span>
            )}

            {/* Value */}
            {fieldDef?.valueType === 'number' && (
                <input
                    type="number"
                    value={rule.value ?? ''}
                    onChange={e => onChange({ ...rule, value: e.target.value ? parseFloat(e.target.value) : 0 })}
                    placeholder="0"
                    min="0"
                    className="w-32 px-2.5 py-1.5 bg-white border border-gray-200 rounded-[3px] text-xs focus:outline-none focus:ring-2 focus:ring-[#064771]/10 focus:border-[#064771] transition-all"
                />
            )}
            {fieldDef?.valueType === 'boolean' && (
                <select
                    value={rule.value ? 'true' : 'false'}
                    onChange={e => onChange({ ...rule, value: e.target.value === 'true' })}
                    className="w-32 px-2.5 py-1.5 bg-white border border-gray-200 rounded-[3px] text-xs focus:outline-none focus:ring-2 focus:ring-[#064771]/10 focus:border-[#064771] transition-all"
                    title="Select value"
                >
                    <option value="true">Required</option>
                    <option value="false">Not required</option>
                </select>
            )}
            {fieldDef?.valueType === 'select' && (
                <select
                    value={rule.value ?? ''}
                    onChange={e => onChange({ ...rule, value: e.target.value })}
                    className="w-32 px-2.5 py-1.5 bg-white border border-gray-200 rounded-[3px] text-xs focus:outline-none focus:ring-2 focus:ring-[#064771]/10 focus:border-[#064771] transition-all"
                    title="Select value"
                >
                    {fieldDef.selectOptions?.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            )}
            {fieldDef?.valueType === 'none' && (
                <span className="w-32 px-2.5 py-1.5 text-xs text-gray-400 italic">—</span>
            )}

            {/* Delete */}
            <button
                onClick={onRemove}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                title="Remove rule"
            >
                <Trash2 className="w-3.5 h-3.5" />
            </button>
        </div>
    );
};


/* ── Main Component ── */

const PipelineSettings: React.FC = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'buyer' | 'seller'>('buyer');
    const [stages, setStages] = useState<PipelineStage[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedStages, setExpandedStages] = useState<Record<number, boolean>>({});

    const fetchStages = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/pipeline-stages', {
                params: { type: activeTab }
            });
            setStages(response.data);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            showAlert({ type: 'error', message: 'Failed to fetch pipeline stages' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStages();
        setExpandedStages({});
    }, [activeTab]);

    const toggleExpanded = (index: number) => {
        setExpandedStages(prev => ({ ...prev, [index]: !prev[index] }));
    };

    const handleAddStage = () => {
        const newStage: PipelineStage = {
            pipeline_type: activeTab,
            code: '',
            name: '',
            progress: 0,
            order_index: stages.length,
            is_active: true,
            gate_rules: null,
            monetization_config: null,
        };
        setStages([...stages, newStage]);
    };

    const handleRemoveStage = (index: number) => {
        const newStages = [...stages];
        newStages.splice(index, 1);
        const reIndexed = newStages.map((s, i) => ({ ...s, order_index: i }));
        setStages(reIndexed);
    };

    const handleStageChange = (index: number, field: keyof PipelineStage, value: any) => {
        const newStages = [...stages];
        newStages[index] = { ...newStages[index], [field]: value };
        setStages(newStages);
    };

    /* ── Gate Rules helpers ── */
    const getGateRules = (index: number): GateRule[] => {
        return stages[index]?.gate_rules ?? [];
    };

    const setGateRules = (index: number, rules: GateRule[]) => {
        handleStageChange(index, 'gate_rules', rules.length > 0 ? rules : null);
    };

    const addGateRule = (index: number) => {
        const current = getGateRules(index);
        setGateRules(index, [...current, { field: '', operator: 'equals', value: null }]);
    };

    const updateGateRule = (stageIndex: number, ruleIndex: number, rule: GateRule) => {
        const current = [...getGateRules(stageIndex)];
        current[ruleIndex] = rule;
        setGateRules(stageIndex, current);
    };

    const removeGateRule = (stageIndex: number, ruleIndex: number) => {
        const current = [...getGateRules(stageIndex)];
        current.splice(ruleIndex, 1);
        setGateRules(stageIndex, current);
    };

    /* ── Monetization helpers ── */
    const getMonetization = (index: number): MonetizationConfig => {
        return stages[index]?.monetization_config ?? { ...DEFAULT_MONETIZATION };
    };

    const setMonetization = (index: number, config: MonetizationConfig) => {
        handleStageChange(index, 'monetization_config', config.enabled ? config : null);
    };

    const handleSave = async () => {
        if (stages.length === 0) {
            showAlert({ type: 'error', message: 'You must have at least one stage' });
            return;
        }

        const invalid = stages.some(s => !s.code || !s.name);
        if (invalid) {
            showAlert({ type: 'error', message: 'All stages must have a code and name' });
            return;
        }

        const codes = stages.map(s => s.code);
        const hasDuplicates = codes.length !== new Set(codes).size;
        if (hasDuplicates) {
            showAlert({ type: 'error', message: 'Each stage must have a unique code' });
            return;
        }

        setSaving(true);
        try {
            const formattedStages = stages.map((stage, index) => ({
                code: stage.code.toUpperCase(),
                name: stage.name,
                progress: Number(stage.progress) || 0,
                order_index: index,
                gate_rules: stage.gate_rules ?? null,
                monetization_config: stage.monetization_config ?? null,
            }));

            await api.post('/api/pipeline-stages/bulk', {
                type: activeTab,
                stages: formattedStages
            });
            showAlert({ type: 'success', message: 'Pipeline stages updated successfully' });
            fetchStages();
        } catch (error: any) {
            console.error('Failed to save pipeline stages:', error);
            const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to save pipeline stages';
            showAlert({ type: 'error', message: errorMessage });
        } finally {
            setSaving(false);
        }
    };

    const filteredStages = useMemo(() => {
        return stages.filter(s =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.code.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [stages, searchQuery]);

    return (
        <div className="h-full flex flex-col bg-[#f9fafb] overflow-hidden ">
            {/* Header */}
            <div className="px-8 py-6">
                <div className="flex items-center justify-between gap-6">
                    <div className="flex items-center gap-8 flex-1">
                        <h1 className="text-2xl font-medium text-gray-900 whitespace-nowrap">
                            {t('settings.pipeline.title', 'Pipeline Workflow Settings')}
                        </h1>
                        <DataTableSearch
                            value={searchQuery}
                            onChange={setSearchQuery}
                            placeholder="Search stages..."
                        />
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="px-8 border-b border-gray-100">
                <div className="flex space-x-8">
                    <button
                        onClick={() => setActiveTab('buyer')}
                        className={`py-4 px-2 border-b-2 font-medium text-sm transition-all flex items-center gap-2 ${activeTab === 'buyer'
                            ? 'border-[#064771] text-[#064771]'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Investor&apos;s Pipeline
                    </button>
                    <button
                        onClick={() => setActiveTab('seller')}
                        className={`py-4 px-2 border-b-2 font-medium text-sm transition-all flex items-center gap-2 ${activeTab === 'seller'
                            ? 'border-[#064771] text-[#064771]'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Target Pipeline
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
                                        {/* Column Headers */}
                                        <div className="flex gap-4 px-4 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-gray-100/50">
                                            <div className="w-16">Order</div>
                                            <div className="w-24">Code</div>
                                            <div className="flex-1">Stage Name</div>
                                            <div className="w-28 text-center">Progress %</div>
                                            <div className="w-20 text-center">Config</div>
                                            <div className="w-[60px]"></div>
                                        </div>

                                        {/* Rows */}
                                        <div className="space-y-2">
                                            {filteredStages.map((stage, index) => {
                                                const isExpanded = expandedStages[index] ?? false;
                                                const ruleCount = (stage.gate_rules ?? []).length;
                                                const hasMonetization = stage.monetization_config?.enabled === true;

                                                return (
                                                    <div key={index} className="rounded-[3px] border border-gray-100 transition-all hover:border-[#064771]/30 overflow-hidden">
                                                        {/* Main row */}
                                                        <div className="flex gap-4 items-center bg-gray-50/50 p-3">
                                                            <div className="w-16 flex items-center gap-2">
                                                                <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                                                                <span className="text-sm font-medium text-gray-400">{index + 1}</span>
                                                            </div>
                                                            <div className="w-24">
                                                                <input
                                                                    type="text"
                                                                    value={stage.code}
                                                                    onChange={(e) => handleStageChange(index, 'code', e.target.value.toUpperCase().slice(0, 5))}
                                                                    placeholder="Code"
                                                                    className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-[3px] text-sm focus:outline-none focus:ring-2 focus:ring-[#064771]/10 focus:border-[#064771] transition-all"
                                                                />
                                                            </div>
                                                            <div className="flex-1">
                                                                <input
                                                                    type="text"
                                                                    value={stage.name}
                                                                    onChange={(e) => handleStageChange(index, 'name', e.target.value)}
                                                                    placeholder="Stage Name"
                                                                    className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-[3px] text-sm focus:outline-none focus:ring-2 focus:ring-[#064771]/10 focus:border-[#064771] transition-all"
                                                                />
                                                            </div>
                                                            <div className="w-28">
                                                                <input
                                                                    type="number"
                                                                    value={stage.progress}
                                                                    onChange={(e) => handleStageChange(index, 'progress', parseInt(e.target.value) || 0)}
                                                                    min="0"
                                                                    max="100"
                                                                    className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-[3px] text-sm focus:outline-none focus:ring-2 focus:ring-[#064771]/10 focus:border-[#064771] transition-all text-center"
                                                                />
                                                            </div>
                                                            <div className="w-20 flex items-center justify-center gap-1">
                                                                <button
                                                                    onClick={() => toggleExpanded(index)}
                                                                    className={`flex items-center gap-1 px-2 py-1 rounded-[3px] text-xs font-medium transition-all ${(ruleCount > 0 || hasMonetization)
                                                                        ? 'bg-[#064771]/10 text-[#064771]'
                                                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                                        }`}
                                                                    title="Configure gate rules & monetization"
                                                                >
                                                                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                                                    {ruleCount > 0 && <ShieldCheck className="w-3.5 h-3.5" />}
                                                                    {hasMonetization && <DollarSign className="w-3.5 h-3.5" />}
                                                                    {ruleCount === 0 && !hasMonetization && <span>Rules</span>}
                                                                </button>
                                                            </div>
                                                            <div className="w-[60px] flex justify-center">
                                                                <button
                                                                    onClick={() => handleRemoveStage(index)}
                                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-[3px] transition-all"
                                                                    title="Remove Stage"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Expanded Config Panel */}
                                                        {isExpanded && (
                                                            <div className="border-t border-gray-100 bg-white px-6 py-4 space-y-5">
                                                                {/* Gate Rules Section */}
                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-3">
                                                                        <ShieldCheck className="w-4 h-4 text-[#064771]" />
                                                                        <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Gate Rules</h4>
                                                                        <span className="text-xs text-gray-400">
                                                                            ({ruleCount} rule{ruleCount !== 1 ? 's' : ''})
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-xs text-gray-400 mb-2">
                                                                        Define conditions that must be met before a deal can enter this stage. All rules must pass (AND logic).
                                                                    </p>

                                                                    <div className="space-y-0.5">
                                                                        {getGateRules(index).map((rule, rIdx) => (
                                                                            <RuleRow
                                                                                key={rIdx}
                                                                                rule={rule}
                                                                                onChange={(r) => updateGateRule(index, rIdx, r)}
                                                                                onRemove={() => removeGateRule(index, rIdx)}
                                                                            />
                                                                        ))}
                                                                    </div>

                                                                    <button
                                                                        onClick={() => addGateRule(index)}
                                                                        className="mt-2 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#064771] hover:bg-[#064771]/5 border border-transparent hover:border-[#064771]/20 rounded-[3px] transition-all"
                                                                    >
                                                                        <Plus className="w-3.5 h-3.5" />
                                                                        Add Rule
                                                                    </button>
                                                                </div>

                                                                {/* Divider */}
                                                                <div className="border-t border-gray-100"></div>

                                                                {/* Monetization Section */}
                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-3">
                                                                        <DollarSign className="w-4 h-4 text-green-600" />
                                                                        <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Monetization</h4>
                                                                    </div>

                                                                    {(() => {
                                                                        const mc = getMonetization(index);
                                                                        return (
                                                                            <div className="space-y-3">
                                                                                <label className="flex items-center gap-2 cursor-pointer">
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        checked={mc.enabled}
                                                                                        onChange={e => setMonetization(index, { ...mc, enabled: e.target.checked })}
                                                                                        className="w-4 h-4 rounded border-gray-300 text-[#064771] focus:ring-[#064771]/20"
                                                                                    />
                                                                                    <span className="text-sm text-gray-700">Enable monetization at this stage</span>
                                                                                </label>

                                                                                {mc.enabled && (
                                                                                    <div className="pl-6 space-y-3">
                                                                                        {/* Payment Name */}
                                                                                        <div className="flex items-center gap-4">
                                                                                            <label className="text-xs font-medium text-gray-500 w-28">Payment Name</label>
                                                                                            <input
                                                                                                type="text"
                                                                                                value={mc.payment_name || ''}
                                                                                                onChange={e => setMonetization(index, { ...mc, payment_name: e.target.value })}
                                                                                                placeholder="e.g. Advisory Fee, Retainer"
                                                                                                className="w-56 px-2.5 py-1.5 bg-white border border-gray-200 rounded-[3px] text-xs focus:outline-none focus:ring-2 focus:ring-[#064771]/10 focus:border-[#064771] transition-all"
                                                                                            />
                                                                                        </div>

                                                                                        {/* Amount (USD) — label changes for monthly */}
                                                                                        <div className="flex items-center gap-4">
                                                                                            <label className="text-xs font-medium text-gray-500 w-28">{mc.type === 'monthly' ? 'Amount (USD / mo)' : 'Amount (USD)'}</label>
                                                                                            <input
                                                                                                type="number"
                                                                                                value={mc.amount ?? ''}
                                                                                                onChange={e => setMonetization(index, { ...mc, amount: e.target.value ? parseFloat(e.target.value) : null })}
                                                                                                placeholder="0"
                                                                                                min="0"
                                                                                                className="w-40 px-2.5 py-1.5 bg-white border border-gray-200 rounded-[3px] text-xs focus:outline-none focus:ring-2 focus:ring-[#064771]/10 focus:border-[#064771] transition-all"
                                                                                            />
                                                                                            <span className="text-xs text-gray-400">{mc.type === 'monthly' ? 'USD / month' : 'USD'}</span>
                                                                                        </div>

                                                                                        {/* Payment Type */}
                                                                                        <div className="flex items-center gap-4">
                                                                                            <label className="text-xs font-medium text-gray-500 w-28">Payment Type</label>
                                                                                            <select
                                                                                                value={mc.type}
                                                                                                onChange={e => setMonetization(index, { ...mc, type: e.target.value as 'one_time' | 'monthly' })}
                                                                                                className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-[3px] text-xs focus:outline-none focus:ring-2 focus:ring-[#064771]/10 focus:border-[#064771] transition-all"
                                                                                                title="Payment type"
                                                                                            >
                                                                                                <option value="one_time">One-time</option>
                                                                                                <option value="monthly">Monthly</option>
                                                                                            </select>
                                                                                        </div>



                                                                                        {/* Deduct from success fee */}
                                                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                                                            <input
                                                                                                type="checkbox"
                                                                                                checked={mc.deduct_from_success_fee}
                                                                                                onChange={e => setMonetization(index, { ...mc, deduct_from_success_fee: e.target.checked })}
                                                                                                className="w-4 h-4 rounded border-gray-300 text-[#064771] focus:ring-[#064771]/20"
                                                                                            />
                                                                                            <span className="text-xs text-gray-700">Deduct from final success fee</span>
                                                                                        </label>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })()}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <button
                                            onClick={handleAddStage}
                                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#064771] hover:bg-[#064771]/5 border border-transparent hover:border-[#064771]/20 rounded-[3px] transition-all"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Add New Stage
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex justify-end items-center gap-4">
                                    <button
                                        onClick={() => fetchStages()}
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
                                        {saving ? 'Saving...' : 'Save Pipeline'}
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

export default PipelineSettings;
