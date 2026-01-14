import React from 'react';
import LanguageSelect from '../../../components/dashboard/LanguageSelect';
import { useTranslation } from 'react-i18next';

const GeneralSettings: React.FC = () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { t } = useTranslation();

    return (
        <div className="bg-white flex flex-col h-[calc(100vh-64px)] overflow-hidden">
            <div className="flex-1 overflow-auto p-8">
                <h2 className="text-2xl font-semibold mb-6 font-poppins text-[#064771]">{t('settings.general.title', 'General Settings')}</h2>

                <div className="space-y-6 max-w-2xl">
                    {/* Language Preference */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h3 className="text-lg font-medium mb-4 text-[#30313D] font-poppins">{t('settings.general.languagePreference', 'Language Preference')}</h3>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-600 font-poppins">{t('settings.general.selectLanguageLabel', 'Select interface language:')}</span>
                            <LanguageSelect />
                        </div>
                    </div>

                    {/* Interface Theme */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h3 className="text-lg font-medium mb-4 text-[#30313D] font-poppins">{t('settings.general.themeLabel', 'Interface Theme')}</h3>
                        <div className="flex gap-4">
                            {['Light', 'Dark', 'System'].map((theme) => (
                                <button
                                    key={theme}
                                    className={`px-6 py-2 rounded-full border text-sm font-medium transition-colors ${theme === 'Light'
                                            ? 'bg-[#064771] text-white border-[#064771]'
                                            : 'bg-white text-gray-600 border-gray-200 hover:border-[#064771]'
                                        }`}
                                >
                                    {t(`settings.general.theme${theme}`, theme)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Regional Settings */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-lg font-medium mb-4 text-[#30313D] font-poppins">{t('settings.general.timezoneLabel', 'Timezone')}</h3>
                                <select className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#064771]">
                                    <option>(GMT+07:00) Bangkok, Hanoi, Jakarta</option>
                                    <option>(GMT+09:00) Tokyo, Osaka, Sapporo</option>
                                    <option>(GMT+00:00) London, Casablanca</option>
                                </select>
                            </div>
                            <div>
                                <h3 className="text-lg font-medium mb-4 text-[#30313D] font-poppins">{t('settings.general.dateFormatLabel', 'Date Format')}</h3>
                                <select className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#064771]">
                                    <option>DD/MM/YYYY</option>
                                    <option>MM/DD/YYYY</option>
                                    <option>YYYY/MM/DD</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Notifications */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h3 className="text-lg font-medium mb-4 text-[#30313D] font-poppins">{t('settings.general.notificationsLabel', 'Notifications')}</h3>
                        <div className="flex items-center justify-between pointer-events-none opacity-60">
                            <span className="text-sm text-gray-600 font-poppins">{t('settings.general.emailNotifications', 'Enable Email Notifications')}</span>
                            <div className="w-12 h-6 bg-[#064771] rounded-full relative">
                                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-4 pt-4">
                        <button className="px-6 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors">
                            {t('common.cancel', 'Cancel')}
                        </button>
                        <button className="px-8 py-2 text-sm font-medium text-white bg-[#064771] rounded-full hover:bg-[#053a5c] transition-colors shadow-lg">
                            {t('common.saveChanges', 'Save Changes')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GeneralSettings;
