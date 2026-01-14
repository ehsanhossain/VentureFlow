import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, GripVertical, Save, RefreshCw } from 'lucide-react';
import api from '../../../config/api';
import { showAlert } from '../../../components/Alert';

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

    const fetchStages = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/pipeline-stages', {
                params: { type: activeTab }
            });
            setStages(response.data);
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

    return (
        <div className="bg-white flex flex-col h-[calc(100vh-64px)] overflow-hidden">
            <div className="flex-1 overflow-auto p-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-semibold font-poppins text-[#064771]">
                            {t('settings.pipeline.title', 'Pipeline Workflow Settings')}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1 font-poppins">
                            Configure the stages and progress for each deal pipeline type.
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    {/* Tabs */}
                    <div className="flex border-b border-gray-100 bg-gray-50/50">
                        <button
                            onClick={() => setActiveTab('buyer')}
                            className={`px-8 py-4 text-sm font-medium transition-all relative ${activeTab === 'buyer'
                                ? 'text-[#064771] bg-white'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Buyer Pipeline
                            {activeTab === 'buyer' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#064771]" />
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('seller')}
                            className={`px-8 py-4 text-sm font-medium transition-all relative ${activeTab === 'seller'
                                ? 'text-[#064771] bg-white'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Seller Pipeline
                            {activeTab === 'seller' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#064771]" />
                            )}
                        </button>
                    </div>

                    <div className="p-6">
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <RefreshCw className="w-8 h-8 text-[#064771] animate-spin" />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    <div className="col-span-1">Order</div>
                                    <div className="col-span-2">Code</div>
                                    <div className="col-span-6">Stage Name</div>
                                    <div className="col-span-2">Progress (%)</div>
                                    <div className="col-span-1 text-center">Action</div>
                                </div>

                                <div className="space-y-2">
                                    {stages.map((stage, index) => (
                                        <div
                                            key={index}
                                            className="grid grid-cols-12 gap-4 items-center bg-gray-50 p-3 rounded-lg border border-gray-100 group hover:border-[#064771]/30 transition-all shadow-sm"
                                        >
                                            <div className="col-span-1 flex items-center gap-2">
                                                <GripVertical className="w-4 h-4 text-gray-300 group-hover:text-gray-400 cursor-grab" />
                                                <span className="text-sm font-medium text-gray-400">{index + 1}</span>
                                            </div>
                                            <div className="col-span-2">
                                                <input
                                                    type="text"
                                                    value={stage.code}
                                                    onChange={(e) => handleStageChange(index, 'code', e.target.value.toUpperCase().slice(0, 2))}
                                                    placeholder="E.g. A"
                                                    className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-[#064771]/20 focus:border-[#064771] outline-none"
                                                />
                                            </div>
                                            <div className="col-span-6">
                                                <input
                                                    type="text"
                                                    value={stage.name}
                                                    onChange={(e) => handleStageChange(index, 'name', e.target.value)}
                                                    placeholder="Stage Name"
                                                    className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-[#064771]/20 focus:border-[#064771] outline-none"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <input
                                                    type="number"
                                                    value={stage.progress}
                                                    onChange={(e) => handleStageChange(index, 'progress', parseInt(e.target.value) || 0)}
                                                    min="0"
                                                    max="100"
                                                    className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-[#064771]/20 focus:border-[#064771] outline-none"
                                                />
                                            </div>
                                            <div className="col-span-1 flex justify-center">
                                                <button
                                                    onClick={() => handleRemoveStage(index)}
                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
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
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#064771] hover:bg-[#064771]/5 rounded-lg transition-all"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add New Stage
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                        <button
                            onClick={() => fetchStages()}
                            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
                        >
                            Reset Changes
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-[#064771] rounded-lg hover:bg-[#053a5c] transition-all shadow-md disabled:bg-gray-400"
                        >
                            {saving ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            {saving ? 'Saving...' : 'Save Pipeline'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PipelineSettings;
