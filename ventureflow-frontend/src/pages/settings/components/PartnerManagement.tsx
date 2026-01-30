import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Edit2, Trash2, Eye, RefreshCw } from 'lucide-react';
import api from '../../../config/api';
import { Dropdown, Country } from '../../currency/components/Dropdown';
import GeneratedPasswordModal from '../../../components/GeneratedPasswordModal';
import { showAlert } from '../../../components/Alert';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface PartnerUser {
    id: number;
    partner_id: string;
    status: string;
    user?: {
        name: string;
        email: string;
    };
    partner_overview?: {
        reg_name: string;
        hq_country: string;
    };
    partnership_structure?: {
        partnership_structure: string;
    };
}

import PartnerSharingSettings from './PartnerSharingSettings';
import { Share2 } from 'lucide-react';

const PartnerManagement: React.FC = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'list' | 'sharing'>('list');
    const [partners, setPartners] = useState<PartnerUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [generatedPassword, setGeneratedPassword] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [editingPartner, setEditingPartner] = useState<PartnerUser | null>(null);
    const navigate = useNavigate();

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        country: '',
    });
    const [countries, setCountries] = useState<Country[] & { alpha_2_code?: string }[]>([]);

    useEffect(() => {
        if (activeTab === 'list') {
            fetchPartners();
            fetchCountries();
        }
    }, [activeTab]);

    const fetchPartners = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/partners');
            setPartners(res.data.data);
        } catch (error) {
            console.error(error);
            showAlert({ type: 'error', message: t('settings.partners.fetchError') });
        } finally {
            setLoading(false);
        }
    };

    // ... (rest of the existing fetchCountries, generatePassword, handleCreateOrUpdate, handleDelete, handleEdit functions)

    const fetchCountries = async () => {
        try {
            const res = await api.get('/api/countries');
            const formatted = res.data.map((c: any) => ({
                id: c.id,
                name: c.name,
                flagSrc: c.svg_icon_url,
                status: 'registered',
                alpha_2_code: c.alpha_2_code
            }));
            setCountries(formatted);
        } catch (error) {
            console.error(error);
        }
    }

    const generatePassword = () => {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        let pass = "";
        for (let i = 0; i < 12; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return pass;
    };

    const handleCreateOrUpdate = async () => {
        if (!formData.name || !formData.email || (!editingPartner && !formData.country)) {
            showAlert({ type: 'error', message: t('settings.partners.fillAllFields') });
            return;
        }

        try {
            if (editingPartner) {
                await api.put(`/api/partners/${editingPartner.id}`, {
                    name: formData.name,
                    email: formData.email,
                });
                showAlert({ type: 'success', message: t('settings.partners.updateSuccess') });
                setIsAddModalOpen(false);
                setEditingPartner(null);
            } else {
                const password = generatePassword();
                await api.post('/api/partners', {
                    ...formData,
                    password
                });

                setGeneratedPassword(password);
                setIsAddModalOpen(false);
                setIsPasswordModalOpen(true);
            }

            setFormData({ name: '', email: '', country: '' });
            fetchPartners();
        } catch (error: any) {
            const msg = error.response?.data?.error || error.response?.data?.message || 'Action failed';
            let displayMsg = 'Action failed';

            if (typeof msg === 'string') {
                displayMsg = msg;
            } else if (typeof msg === 'object' && msg !== null) {
                // Handle Laravel validation object
                displayMsg = Object.values(msg).flat().join(', ');
            }

            showAlert({ type: 'error', message: displayMsg });
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm(t('settings.partners.confirmDelete'))) return;

        try {
            await api.delete(`/api/partners`, { data: { ids: [id] } });
            showAlert({ type: 'success', message: t('settings.partners.deleteSuccess') });
            fetchPartners();
        } catch (error) {
            showAlert({ type: 'error', message: t('settings.partners.deleteError') });
        }
    };

    const handleEdit = (partner: PartnerUser) => {
        setEditingPartner(partner);
        setFormData({
            name: partner.user?.name || partner.partner_overview?.reg_name || '',
            email: partner.user?.email || '',
            country: '', // Country shouldn't change for ID consistency
        });
        setIsAddModalOpen(true);
    };

    const filteredPartners = partners.filter(p =>
    (p.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.partner_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="bg-white flex flex-col h-[calc(100vh-64px)] overflow-hidden font-poppins">
            {/* Header */}
            <div className="flex justify-between items-center px-8 py-6 border-b border-gray-200 bg-white">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                        <Users className="w-8 h-8 text-[#064771]" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-[#064771]">{t('settings.partners.title')}</h1>
                        <p className="text-sm text-gray-500">{t('settings.partners.summary')}</p>
                    </div>
                </div>

            </div>

            {/* Tabs */}
            <div className="px-8 border-b border-gray-200 bg-white">
                <div className="flex space-x-8">
                    <button
                        onClick={() => setActiveTab('list')}
                        className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${activeTab === 'list'
                            ? 'border-[#064771] text-[#064771]'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <Users className="w-4 h-4" />
                        All Partners
                    </button>
                    <button
                        onClick={() => setActiveTab('sharing')}
                        className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${activeTab === 'sharing'
                            ? 'border-[#064771] text-[#064771]'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <Share2 className="w-4 h-4" />
                        Sharing Settings
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 w-full px-8 overflow-auto py-6 bg-gray-50/30">
                {activeTab === 'list' ? (
                    <>
                        <div className="flex justify-end items-center gap-4 mb-6">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder={t('settings.partners.searchPlaceholder')}
                                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#064771] w-64 text-sm"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={() => {
                                    setEditingPartner(null);
                                    setFormData({ name: '', email: '', country: '' });
                                    setIsAddModalOpen(true);
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-[#064771] text-white rounded-lg hover:bg-[#053a5c] transition-all shadow-sm font-medium"
                            >
                                <Plus className="w-5 h-5" />
                                <span>{t('settings.partners.addPartner')}</span>
                            </button>
                            <button
                                onClick={fetchPartners}
                                className="p-2 text-gray-400 hover:text-[#064771] hover:bg-blue-50 rounded-lg transition-colors"
                                title={t('common.refresh')}
                            >
                                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('settings.partners.table.partner')}</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('settings.partners.table.contactId')}</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('settings.partners.table.country')}</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('settings.partners.table.structure')}</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('settings.partners.table.status')}</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">{t('settings.partners.table.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {loading && partners.length === 0 ? (
                                        <tr><td colSpan={6} className="text-center py-12 text-gray-500">{t('common.loading')}</td></tr>
                                    ) : filteredPartners.length === 0 ? (
                                        <tr><td colSpan={6} className="text-center py-12 text-gray-500">{t('settings.partners.noPartners')}</td></tr>
                                    ) : (
                                        filteredPartners.map(partner => (
                                            <tr key={partner.id} className="hover:bg-gray-50/80 transition-colors group">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-br from-[#064771] to-[#0a6fb1] flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                                            {(partner.user?.name || partner.partner_overview?.reg_name || 'U').charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-bold text-gray-900">
                                                                {partner.user?.name || partner.partner_overview?.reg_name || t('common.unnamed')}
                                                            </div>
                                                            <div className="text-xs text-gray-500">{t('settings.partners.registeredPartner')}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{partner.user?.email || 'N/A'}</div>
                                                    <div className="mt-1 flex items-center">
                                                        <span className="bg-blue-50 text-[#064771] px-2 py-0.5 rounded text-[10px] font-mono font-bold border border-blue-100 uppercase">
                                                            {partner.partner_id}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{partner.partner_overview?.hq_country || 'N/A'}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-600 italic">
                                                        {partner.partnership_structure?.partnership_structure || t('common.notSet')}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${partner.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {(partner.status || 'active').toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => navigate(`/settings/partners/${partner.id}`)}
                                                            className="p-2 text-gray-400 hover:text-[#064771] hover:bg-blue-50 rounded-lg transition-colors"
                                                            title={t('common.viewDetails')}
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEdit(partner)}
                                                            className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                            title={t('common.edit')}
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(partner.id)}
                                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title={t('common.delete')}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : (
                    <PartnerSharingSettings />
                )}
            </div>

            {/* Add/Edit Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden scale-100 transform transition-all border border-gray-100">
                        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white">
                            <div>
                                <h3 className="text-xl font-bold text-[#064771]">
                                    {editingPartner ? t('settings.partners.updateTitle') : t('settings.partners.addTitle')}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    {editingPartner ? t('settings.partners.updateSummary') : t('settings.partners.addSummary')}
                                </p>
                            </div>
                            <button onClick={() => { setIsAddModalOpen(false); setEditingPartner(null); }} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                                <Plus className="w-6 h-6 rotate-45" />
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-1.5">
                                <label className="block text-sm font-bold text-gray-700">{t('settings.partners.form.businessName')}</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#064771]/20 focus:border-[#064771] transition-all"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder={t('settings.partners.form.businessNamePlaceholder')}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-sm font-bold text-gray-700">{t('settings.partners.form.email')}</label>
                                <input
                                    type="email"
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#064771]/20 focus:border-[#064771] transition-all"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    placeholder={t('settings.partners.form.emailPlaceholder')}
                                />
                            </div>
                            {!editingPartner && (
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-bold text-gray-700">{t('settings.partners.form.country')}</label>
                                    <Dropdown
                                        countries={countries}
                                        selected={countries.find(c => c.alpha_2_code === formData.country)}
                                        onSelect={(c: any) => setFormData({ ...formData, country: c.alpha_2_code || (c.name ? c.name.substring(0, 2).toUpperCase() : 'XX') })}
                                        placeholder={t('settings.partners.form.countryPlaceholder')}
                                    />
                                    <div className="mt-4 p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex gap-3">
                                        <div className="p-2 bg-white rounded-lg h-fit shadow-xs">
                                            <RefreshCw className="w-4 h-4 text-[#064771]" />
                                        </div>
                                        <p className="text-xs text-[#064771] leading-relaxed">
                                            {t('settings.partners.form.hint')}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="px-8 py-5 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
                            <button
                                onClick={() => { setIsAddModalOpen(false); setEditingPartner(null); }}
                                className="px-5 py-2.5 text-gray-600 font-bold hover:bg-white hover:shadow-sm rounded-xl transition"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={handleCreateOrUpdate}
                                className="px-6 py-2.5 bg-[#064771] text-white font-bold rounded-xl hover:bg-[#053a5c] transition-all shadow-md shadow-[#064771]/20"
                            >
                                {editingPartner ? t('settings.partners.updateButton') : t('settings.partners.createButton')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Password Modal */}
            {isPasswordModalOpen && (
                <GeneratedPasswordModal
                    generatedPassword={generatedPassword}
                    onClose={() => setIsPasswordModalOpen(false)}
                />
            )}
        </div>
    );
};

export default PartnerManagement;
