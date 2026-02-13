/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, GripVertical, Save } from 'lucide-react';
import api from '../../../config/api';
import { showAlert } from '../../../components/Alert';
import { BrandSpinner } from '../../../components/BrandSpinner';
import DataTableSearch from '../../../components/table/DataTableSearch';

interface PipelineStage {
    id?: number;
    pipeline_type: 'buyer' | 'seller';
    code: string;
    name: string;
    progress: number;
    order_index: number;
    is_active: boolean;
}

const PipelineSettings: React.FC = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'buyer' | 'seller'>('buyer');
    const [stages, setStages] = useState<PipelineStage[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

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
    }, [activeTab]);

    const handleAddStage = () => {
        const newStage: PipelineStage = {
            pipeline_type: activeTab,
            code: '',
            name: '',
            progress: 0,
            order_index: stages.length,
            is_active: true
        };
        setStages([...stages, newStage]);
    };

    const handleRemoveStage = (index: number) => {
        const newStages = [...stages];
        newStages.splice(index, 1);
        // Re-index
        const reIndexed = newStages.map((s, i) => ({ ...s, order_index: i }));
        setStages(reIndexed);
    };

    const handleStageChange = (index: number, field: keyof PipelineStage, value: any) => {
        const newStages = [...stages];
        newStages[index] = { ...newStages[index], [field]: value };
        setStages(newStages);
    };

    const handleSave = async () => {
        // Validation
        if (stages.length === 0) {
            showAlert({ type: 'error', message: 'You must have at least one stage' });
            return;
        }

        const invalid = stages.some(s => !s.code || !s.name);
        if (invalid) {
            showAlert({ type: 'error', message: 'All stages must have a code and name' });
            return;
        }

        // Check for duplicate codes
        const codes = stages.map(s => s.code);
        const hasDuplicates = codes.length !== new Set(codes).size;
        if (hasDuplicates) {
            showAlert({ type: 'error', message: 'Each stage must have a unique code' });
            return;
        }

        setSaving(true);
        try {
            // Format stages properly for the backend
            const formattedStages = stages.map((stage, index) => ({
                code: stage.code.toUpperCase(),
                name: stage.name,
                progress: Number(stage.progress) || 0,
                order_index: index,
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
                            <div className="flex-1 flex items-center justify-center">
                                <BrandSpinner size="lg" />
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col overflow-hidden">
                                <div className="flex-1 overflow-y-auto p-6">
                                    <div className="space-y-4">
                                        <div className="flex gap-4 px-4 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-gray-100/50">
                                            <div className="w-12">Order</div>
                                            <div className="w-24">Code</div>
                                            <div className="flex-1">Stage Name</div>
                                            <div className="w-28 text-center">Progress %</div>
                                            <div className="w-[60px]"></div>
                                        </div>

                                        <div className="space-y-2">
                                            {filteredStages.map((stage, index) => (
                                                <div
                                                    key={index}
                                                    className="flex gap-4 items-center bg-gray-50/50 p-3 rounded-[3px] border border-gray-100 transition-all hover:border-[#064771]/30"
                                                >
                                                    <div className="w-12 flex items-center gap-2">
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
                                            ))}
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
