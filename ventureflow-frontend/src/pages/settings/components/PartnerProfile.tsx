import React, { useContext, useEffect, useState } from 'react';
import { ArrowLeft, Save, Loader2, User } from 'lucide-react';
import { BrandSpinner } from '../../../components/BrandSpinner';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../../routes/AuthContext';
import api from '../../../config/api';
import { showAlert } from '../../../components/Alert';
import { useTranslation } from 'react-i18next';

interface PartnerData {
    id: number;
    partner_id: string;
    company_name: string;
    company_address: string;
    contact_person: string;
    contact_email: string;
    contact_phone: string;
    status: string;
    image: string | null;
}

const PartnerProfile: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const auth = useContext(AuthContext);
    const user = auth?.user;
    const [partner, setPartner] = useState<PartnerData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const baseURL = import.meta.env.VITE_API_BASE_URL;

    // Form state
    const [formData, setFormData] = useState({
        company_name: '',
        company_address: '',
        contact_person: '',
        contact_email: '',
        contact_phone: '',
    });

    // Get partner ID from user context
    const partnerId = (user as any)?.partner_id || (user as any)?.partner?.id;

    useEffect(() => {
        const fetchPartner = async () => {
            if (!partnerId) {
                setLoading(false);
                return;
            }

            try {
                const response = await api.get(`/api/partners/${partnerId}`);
                const data = response.data.data || response.data;
                setPartner(data);
                setFormData({
                    company_name: data.company_name || '',
                    company_address: data.company_address || '',
                    contact_person: data.contact_person || '',
                    contact_email: data.contact_email || '',
                    contact_phone: data.contact_phone || '',
                });
                if (data.image) {
                    setImagePreview(`${baseURL}/storage/${data.image}`);
                }
            } catch (error) {
                console.error('Failed to fetch partner data', error);
                showAlert({ type: 'error', message: t('profile.fetchError', 'Failed to load profile data') });
            } finally {
                setLoading(false);
            }
        };

        fetchPartner();
    }, [partnerId, baseURL, t]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!partnerId) return;

        setSaving(true);
        try {
            const data = new FormData();
            data.append('company_name', formData.company_name);
            data.append('company_address', formData.company_address);
            data.append('contact_person', formData.contact_person);
            data.append('contact_email', formData.contact_email);
            data.append('contact_phone', formData.contact_phone);
            data.append('_method', 'PUT');

            if (imageFile) {
                data.append('image', imageFile);
            }

            await api.post(`/api/partners/${partnerId}`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            showAlert({ type: 'success', message: t('profile.updateSuccess', 'Profile updated successfully') });
        } catch (error) {
            console.error('Failed to update partner', error);
            showAlert({ type: 'error', message: t('profile.updateError', 'Failed to update profile') });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="flex items-center gap-3">
                    <BrandSpinner size="lg" />
                    <span className="text-gray-600">{t('common.loading', 'Loading...')}</span>
                </div>
            </div>
        );
    }

    if (!partner) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                    <User className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500">{t('profile.notFound', 'Profile not found')}</p>
                <button
                    onClick={() => navigate('/')}
                    className="px-4 py-2 bg-[#064771] text-white rounded-lg hover:bg-[#053a5c] transition-colors"
                >
                    {t('common.goBack', 'Go Back')}
                </button>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto p-6 md:p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">{t('profile.myProfile', 'My Profile')}</h1>
                        <p className="text-sm text-gray-500">Partner ID: {partner.partner_id}</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="max-w-3xl space-y-8">
                {/* Profile Image */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">{t('profile.profileImage', 'Profile Image')}</h3>
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full bg-gray-100 overflow-hidden border-4 border-white shadow-lg">
                                {imagePreview ? (
                                    <img
                                        src={imagePreview}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-[#064771] text-white text-2xl font-semibold">
                                        {formData.company_name?.substring(0, 2).toUpperCase() || 'PA'}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex-1">
                            <label className="block">
                                <span className="sr-only">Choose profile photo</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="block w-full text-sm text-gray-500
                                        file:mr-4 file:py-2 file:px-4
                                        file:rounded-lg file:border-0
                                        file:text-sm file:font-medium
                                        file:bg-[#064771] file:text-white
                                        hover:file:bg-[#053a5c]
                                        file:cursor-pointer file:transition-colors"
                                />
                            </label>
                            <p className="mt-2 text-xs text-gray-500">JPG, PNG or GIF (max 2MB)</p>
                        </div>
                    </div>
                </div>

                {/* Company Details */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">{t('profile.companyDetails', 'Company Details')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                {t('profile.companyName', 'Company Name')}
                            </label>
                            <input
                                type="text"
                                name="company_name"
                                value={formData.company_name}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#064771]/20 focus:border-[#064771] transition-all"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                {t('profile.companyAddress', 'Company Address')}
                            </label>
                            <textarea
                                name="company_address"
                                value={formData.company_address}
                                onChange={handleInputChange}
                                rows={3}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#064771]/20 focus:border-[#064771] transition-all resize-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Contact Information */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">{t('profile.contactInfo', 'Contact Information')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                {t('profile.contactPerson', 'Contact Person')}
                            </label>
                            <input
                                type="text"
                                name="contact_person"
                                value={formData.contact_person}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#064771]/20 focus:border-[#064771] transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                {t('profile.contactEmail', 'Contact Email')}
                            </label>
                            <input
                                type="email"
                                name="contact_email"
                                value={formData.contact_email}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#064771]/20 focus:border-[#064771] transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                {t('profile.contactPhone', 'Contact Phone')}
                            </label>
                            <input
                                type="tel"
                                name="contact_phone"
                                value={formData.contact_phone}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#064771]/20 focus:border-[#064771] transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                        {t('common.cancel', 'Cancel')}
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-2.5 bg-[#064771] text-white rounded-lg hover:bg-[#053a5c] transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {t('common.saving', 'Saving...')}
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                {t('common.saveChanges', 'Save Changes')}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PartnerProfile;
