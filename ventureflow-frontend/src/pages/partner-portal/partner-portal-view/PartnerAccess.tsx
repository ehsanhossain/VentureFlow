import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../config/api';
import { showAlert } from '../../../components/Alert';
import { Key, Mail, RefreshCw, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const PartnerAccess: React.FC = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        const fetchAccess = async () => {
            setLoading(true);
            try {
                const response = await api.get(`/api/partners/${id}`);
                const user = response.data?.data?.user;
                if (user) {
                    setEmail(user.email);
                }
            } catch {
                showAlert({ type: 'error', message: t('settings.partners.error.fetchAccessDetails') });
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchAccess();
    }, [id, t]);

    const handleUpdateEmail = async () => {
        setUpdating(true);
        try {
            await api.put(`/api/partners/${id}`, {
                name: email, // The backend update uses 'name' and 'email'
                email: email
            });
            showAlert({ type: 'success', message: t('settings.partners.success.emailUpdated') });
        } catch (error: any) {
            showAlert({ type: 'error', message: error.response?.data?.message || t('settings.partners.error.updateFailed') });
        } finally {
            setUpdating(false);
        }
    };

    const handleResetPassword = async () => {
        if (!window.confirm(t('settings.partners.confirmPasswordReset'))) return;

        // In a real app, this might send an email or generate a new one.
        // For now, let's just use the same update logic but maybe with a flag.
        showAlert({ type: 'info', message: t('settings.partners.passwordResetFeatureInfo') });
    };

    if (loading) return <div className="p-8 text-center text-gray-500 font-poppins">{t('settings.partners.loadingAccessDetails')}</div>;

    return (
        <div className="max-w-4xl mx-auto p-8 space-y-8 font-poppins">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-[#064771]" />
                    <h3 className="font-bold text-[#064771]">{t('settings.partners.loginCredentials')}</h3>
                </div>
                <div className="p-6 space-y-4">
                    <div className="space-y-1.5">
                        <label className="block text-sm font-bold text-gray-700">{t('settings.partners.emailAddress')}</label>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#064771] outline-none"
                            />
                            <button
                                onClick={handleUpdateEmail}
                                disabled={updating}
                                className="px-4 py-2 bg-[#064771] text-white rounded-lg hover:bg-[#053a5c] flex items-center gap-2 transition-colors font-bold"
                            >
                                <Save className="w-4 h-4" />
                                <span>{t('common.saveEmail')}</span>
                            </button>
                        </div>
                        <p className="text-xs text-gray-500">{t('settings.partners.loginIDUpdateHint')}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                    <Key className="w-5 h-5 text-[#064771]" />
                    <h3 className="font-bold text-[#064771]">{t('settings.partners.securityAndAccess')}</h3>
                </div>
                <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-100">
                        <div>
                            <h4 className="font-bold text-amber-900">{t('settings.partners.forcePasswordChange')}</h4>
                            <p className="text-sm text-amber-800">{t('settings.partners.forcePasswordChangeHint')}</p>
                        </div>
                        <button
                            onClick={handleResetPassword}
                            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex items-center gap-2 transition-colors font-bold whitespace-nowrap"
                        >
                            <RefreshCw className="w-4 h-4" />
                            <span>{t('settings.partners.triggerReset')}</span>
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-100">
                        <div>
                            <h4 className="font-bold text-blue-900">{t('settings.partners.partnerID')}</h4>
                            <p className="text-sm text-blue-800">{t('settings.partners.partnerIDHint')}</p>
                        </div>
                        <span className="bg-white px-4 py-2 rounded-lg border border-blue-200 font-mono font-bold text-[#064771]">
                            {t('settings.partners.managedByOriginCountry')}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PartnerAccess;
