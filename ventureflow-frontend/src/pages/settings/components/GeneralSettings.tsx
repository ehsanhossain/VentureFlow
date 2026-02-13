/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import LanguageSelect from '../../../components/dashboard/LanguageSelect';
import { useTranslation } from 'react-i18next';
import api from '../../../config/api';
import { showAlert } from '../../../components/Alert';
import { useGeneralSettings } from '../../../context/GeneralSettingsContext';

interface Currency {
    id: string | number;
    currency_name: string;
    currency_code: string;
}

const timezones = [
    "(GMT-12:00) International Date Line West",
    "(GMT-11:00) Midway Island, Samoa",
    "(GMT-10:00) Hawaii",
    "(GMT-09:00) Alaska",
    "(GMT-08:00) Pacific Time (US & Canada)",
    "(GMT-07:00) Mountain Time (US & Canada)",
    "(GMT-06:00) Central Time (US & Canada)",
    "(GMT-05:00) Eastern Time (US & Canada)",
    "(GMT-04:00) Atlantic Time (Canada)",
    "(GMT-03:30) Newfoundland",
    "(GMT-03:00) Brazil, Buenos Aires, Georgetown",
    "(GMT-02:00) Mid-Atlantic",
    "(GMT-01:00) Azores, Cape Verde Islands",
    "(GMT+00:00) Western Europe Time, London, Lisbon, Casablanca",
    "(GMT+01:00) Brussels, Copenhagen, Madrid, Paris",
    "(GMT+02:00) Kaliningrad, South Africa",
    "(GMT+03:00) Baghdad, Riyadh, Moscow, St. Petersburg",
    "(GMT+03:30) Tehran",
    "(GMT+04:00) Abu Dhabi, Muscat, Baku, Tbilisi",
    "(GMT+04:30) Kabul",
    "(GMT+05:00) Ekaterinburg, Islamabad, Karachi, Tashkent",
    "(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi",
    "(GMT+05:45) Kathmandu",
    "(GMT+06:00) Almaty, Astana, Dhaka",
    "(GMT+06:30) Yangon (Rangoon)",
    "(GMT+07:00) Bangkok, Hanoi, Jakarta",
    "(GMT+08:00) Beijing, Perth, Singapore, Hong Kong",
    "(GMT+09:00) Tokyo, Osaka, Sapporo, Seoul, Yakutsk",
    "(GMT+09:30) Adelaide, Darwin",
    "(GMT+10:00) Eastern Australia, Guam, Vladivostok",
    "(GMT+11:00) Magadan, Solomon Islands, New Caledonia",
    "(GMT+12:00) Auckland, Wellington, Fiji, Kamchatka"
];

const dateFormats = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY/MM/DD'];

const GeneralSettings: React.FC = () => {
    const { t } = useTranslation();
    const { refreshSettings: refreshGlobalSettings } = useGeneralSettings();
    const [currencies, setCurrencies] = useState<Currency[]>([]);
    const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(true);
    const [systemNotifications, setSystemNotifications] = useState(true);
    const [browserNotifications, setBrowserNotifications] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingSettings, setIsLoadingSettings] = useState(true);

    // Settings state
    const [defaultCurrency, setDefaultCurrency] = useState('USD');
    const [timezone, setTimezone] = useState('(GMT+07:00) Bangkok, Hanoi, Jakarta');
    const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');

    // Track initial values for dirty checking
    const [initialSettings, setInitialSettings] = useState({
        defaultCurrency: 'USD',
        timezone: '(GMT+07:00) Bangkok, Hanoi, Jakarta',
        dateFormat: 'DD/MM/YYYY',
    });

    useEffect(() => {
        fetchCurrencies();
        fetchSettings();
        if ("Notification" in window && Notification.permission === "granted") {
            setBrowserNotifications(true);
        }
    }, []);

    const fetchCurrencies = async () => {
        try {
            setIsLoadingCurrencies(true);
            const response = await api.get('/api/currencies');
            setCurrencies(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch currencies:', error);
        } finally {
            setIsLoadingCurrencies(false);
        }
    };

    const fetchSettings = async () => {
        try {
            setIsLoadingSettings(true);
            const response = await api.get('/api/general-settings');
            const settings = response.data;

            if (settings.default_currency) setDefaultCurrency(settings.default_currency);
            if (settings.timezone) setTimezone(settings.timezone);
            if (settings.date_format) setDateFormat(settings.date_format);

            setInitialSettings({
                defaultCurrency: settings.default_currency || 'USD',
                timezone: settings.timezone || '(GMT+07:00) Bangkok, Hanoi, Jakarta',
                dateFormat: settings.date_format || 'DD/MM/YYYY',
            });
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setIsLoadingSettings(false);
        }
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            await api.post('/api/general-settings', {
                default_currency: defaultCurrency,
                timezone: timezone,
                date_format: dateFormat,
            });

            setInitialSettings({
                defaultCurrency,
                timezone,
                dateFormat,
            });

            showAlert({ type: 'success', message: 'Settings saved successfully' });

            // Refresh the global settings context so all components pick up the change
            await refreshGlobalSettings();
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Failed to save settings';
            showAlert({ type: 'error', message: msg });
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setDefaultCurrency(initialSettings.defaultCurrency);
        setTimezone(initialSettings.timezone);
        setDateFormat(initialSettings.dateFormat);
    };

    const isDirty =
        defaultCurrency !== initialSettings.defaultCurrency ||
        timezone !== initialSettings.timezone ||
        dateFormat !== initialSettings.dateFormat;

    const handleBrowserNotificationToggle = async () => {
        if (!("Notification" in window)) {
            showAlert({ type: 'warning', message: 'This browser does not support desktop notifications' });
            return;
        }

        if (Notification.permission === "granted") {
            setBrowserNotifications(!browserNotifications);
        } else if (Notification.permission !== "denied") {
            const permission = await Notification.requestPermission();
            if (permission === "granted") {
                setBrowserNotifications(true);
                showAlert({ type: 'success', message: 'Browser notifications enabled' });
            }
        } else {
            showAlert({ type: 'error', message: 'Notification permission has been denied. Please enable it in your browser settings.' });
        }
    };

    return (
        <div className="h-full flex flex-col bg-[#f9fafb] overflow-hidden ">
            <div className="px-8 py-6">
                <h1 className="text-2xl font-medium text-gray-900 whitespace-nowrap">
                    {t('settings.general.title', 'General')}
                </h1>
            </div>

            <div className="flex-1 overflow-auto px-8 pb-8">
                <div className="space-y-6 max-w-4xl">
                    {/* Regional & Localization */}
                    <div className="bg-white rounded-[3px] border border-gray-200 p-8 shadow-sm">
                        <h3 className="text-lg font-medium mb-6 text-gray-900">Regional & Localization</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">{t('settings.general.languagePreference', 'Primary Language')}</label>
                                <LanguageSelect />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Default Currency</label>
                                <select
                                    value={defaultCurrency}
                                    onChange={(e) => setDefaultCurrency(e.target.value)}
                                    disabled={isLoadingCurrencies || isLoadingSettings}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-[3px] text-sm focus:outline-none focus:border-[#064771] transition-all cursor-pointer"
                                >
                                    {isLoadingCurrencies ? (
                                        <option>Loading currencies...</option>
                                    ) : currencies.length > 0 ? (
                                        currencies.map(curr => (
                                            <option key={curr.id} value={curr.currency_code}>
                                                {curr.currency_code} - {curr.currency_name}
                                            </option>
                                        ))
                                    ) : (
                                        <option value="">Register a currency first</option>
                                    )}
                                </select>
                                {!isLoadingCurrencies && currencies.length === 0 && (
                                    <p className="text-[11px] text-amber-600 mt-1">Please register a currency in Currency Settings first.</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">{t('settings.general.timezoneLabel', 'Preferred Timezone')}</label>
                                <select
                                    value={timezone}
                                    onChange={(e) => setTimezone(e.target.value)}
                                    disabled={isLoadingSettings}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-[3px] text-sm focus:outline-none focus:border-[#064771] transition-all cursor-pointer"
                                >
                                    {timezones.map((tz, idx) => (
                                        <option key={idx} value={tz}>{tz}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">{t('settings.general.dateFormatLabel', 'Date Format')}</label>
                                <select
                                    value={dateFormat}
                                    onChange={(e) => setDateFormat(e.target.value)}
                                    disabled={isLoadingSettings}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-[3px] text-sm focus:outline-none focus:border-[#064771] transition-all cursor-pointer"
                                >
                                    {dateFormats.map((fmt) => (
                                        <option key={fmt} value={fmt}>{fmt}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Notifications */}
                    <div className="bg-white rounded-[3px] border border-gray-200 p-8 shadow-sm">
                        <h3 className="text-lg font-medium mb-6 text-gray-900">{t('settings.general.notificationsLabel', 'System Notifications')}</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between py-2 border-b border-gray-50">
                                <div>
                                    <p className="text-sm font-medium text-gray-700">System Notifications</p>
                                </div>
                                <button
                                    onClick={() => setSystemNotifications(!systemNotifications)}
                                    className={`w-12 h-6 rounded-full relative transition-colors ${systemNotifications ? 'bg-[#064771]' : 'bg-gray-200'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${systemNotifications ? 'right-1' : 'left-1'}`}></div>
                                </button>
                            </div>
                            <div className="flex items-center justify-between py-2">
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Browser Notifications</p>
                                </div>
                                <button
                                    onClick={handleBrowserNotificationToggle}
                                    className={`w-12 h-6 rounded-full relative transition-colors ${browserNotifications ? 'bg-[#064771]' : 'bg-gray-200'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${browserNotifications ? 'right-1' : 'left-1'}`}></div>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                        <button
                            onClick={handleCancel}
                            disabled={!isDirty}
                            className={`px-6 py-2 text-sm font-medium transition-all ${isDirty ? 'text-gray-500 hover:text-gray-700' : 'text-gray-400 cursor-not-allowed'}`}
                        >
                            {t('common.cancel', 'Cancel')}
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving || !isDirty}
                            className={`flex items-center gap-2 bg-[#064771] hover:bg-[#053a5e] text-white px-8 py-2.5 rounded-[3px] text-sm font-medium transition-all shadow-sm active:scale-95 ${(!isDirty || isSaving) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isSaving ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Saving...
                                </>
                            ) : (
                                t('common.saveChanges', 'Save Changes')
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GeneralSettings;
