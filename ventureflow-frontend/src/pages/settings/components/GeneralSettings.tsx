/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback, useContext, useRef, useMemo } from 'react';
import LanguageSelect from '../../../components/dashboard/LanguageSelect';
import { useTranslation } from 'react-i18next';
import api from '../../../config/api';
import { showAlert } from '../../../components/Alert';
import { useGeneralSettings } from '../../../context/GeneralSettingsContext';
import { AuthContext } from '../../../routes/AuthContext';
import Holidays from 'date-holidays';
import { Search, ChevronDown } from 'lucide-react';
import { VFDropdown } from '../../../components/VFDropdown';

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

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Build the supported country list from date-holidays once */
const buildCountryList = (): { code: string; name: string }[] => {
    try {
        const hd = new Holidays();
        const countries = hd.getCountries();
        return Object.entries(countries)
            .map(([code, name]) => ({ code, name: String(name) }))
            .sort((a, b) => a.name.localeCompare(b.name));
    } catch {
        return [];
    }
};

const SUPPORTED_COUNTRIES = buildCountryList();

const GeneralSettings: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { refreshSettings: refreshGlobalSettings } = useGeneralSettings();
    const auth = useContext(AuthContext);
    const isReadOnly = auth?.isPartner === true;
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
    const [language, setLanguage] = useState(i18n.language || 'en');
    const [calendarCountry, setCalendarCountry] = useState('US');
    const [weekendDays, setWeekendDays] = useState<number[]>([0, 6]);

    // Country dropdown state
    const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
    const [countrySearch, setCountrySearch] = useState('');
    const countryDropdownRef = useRef<HTMLDivElement>(null);
    const countrySearchRef = useRef<HTMLInputElement>(null);

    // Track initial values for dirty checking
    const [initialSettings, setInitialSettings] = useState({
        defaultCurrency: 'USD',
        timezone: '(GMT+07:00) Bangkok, Hanoi, Jakarta',
        dateFormat: 'DD/MM/YYYY',
        language: i18n.language || 'en',
        calendarCountry: 'US',
        weekendDays: [0, 6] as number[],
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
            if (settings.language) {
                setLanguage(settings.language);
                // Sync i18next with saved language from backend
                if (i18n.language !== settings.language) {
                    i18n.changeLanguage(settings.language);
                }
            }
            if (settings.calendar_country) setCalendarCountry(settings.calendar_country);
            if (settings.weekend_days) {
                try {
                    const parsed = typeof settings.weekend_days === 'string'
                        ? JSON.parse(settings.weekend_days)
                        : settings.weekend_days;
                    if (Array.isArray(parsed)) setWeekendDays(parsed);
                } catch { /* use default */ }
            }

            const currentLang = settings.language || i18n.language || 'en';
            const savedCountry = settings.calendar_country || 'US';
            let savedWeekendDays: number[] = [0, 6];
            try {
                const w = typeof settings.weekend_days === 'string'
                    ? JSON.parse(settings.weekend_days)
                    : settings.weekend_days;
                if (Array.isArray(w)) savedWeekendDays = w;
            } catch { /* use default */ }

            setInitialSettings({
                defaultCurrency: settings.default_currency || 'USD',
                timezone: settings.timezone || '(GMT+07:00) Bangkok, Hanoi, Jakarta',
                dateFormat: settings.date_format || 'DD/MM/YYYY',
                language: currentLang,
                calendarCountry: savedCountry,
                weekendDays: savedWeekendDays,
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
                language: language,
                calendar_country: calendarCountry,
                weekend_days: JSON.stringify(weekendDays),
            });

            // Apply language change via i18next
            if (i18n.language !== language) {
                i18n.changeLanguage(language);
            }

            setInitialSettings({
                defaultCurrency,
                timezone,
                dateFormat,
                language,
                calendarCountry,
                weekendDays,
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
        setLanguage(initialSettings.language);
        setCalendarCountry(initialSettings.calendarCountry);
        setWeekendDays(initialSettings.weekendDays);
        // Revert i18next language as well
        if (i18n.language !== initialSettings.language) {
            i18n.changeLanguage(initialSettings.language);
        }
    };

    // Callback for when language is changed via the LanguageSelect dropdown
    const handleLanguageChange = useCallback((langCode: string) => {
        setLanguage(langCode);
        // Apply the language immediately for preview, but it's only "saved" when Save is clicked
        i18n.changeLanguage(langCode);
    }, [i18n]);

    // Toggle a weekend day on/off
    const toggleWeekendDay = useCallback((dayNum: number) => {
        setWeekendDays(prev =>
            prev.includes(dayNum) ? prev.filter(d => d !== dayNum) : [...prev, dayNum]
        );
    }, []);

    // Filtered country list for search
    const filteredCountries = useMemo(() => {
        if (!countrySearch.trim()) return SUPPORTED_COUNTRIES;
        const q = countrySearch.toLowerCase();
        return SUPPORTED_COUNTRIES.filter(
            c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
        );
    }, [countrySearch]);

    // Close country dropdown on outside click
    useEffect(() => {
        if (!countryDropdownOpen) return;
        const handleClick = (e: MouseEvent) => {
            if (countryDropdownRef.current && !countryDropdownRef.current.contains(e.target as Node)) {
                setCountryDropdownOpen(false);
                setCountrySearch('');
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [countryDropdownOpen]);

    // Focus search when dropdown opens
    useEffect(() => {
        if (countryDropdownOpen && countrySearchRef.current) {
            countrySearchRef.current.focus();
        }
    }, [countryDropdownOpen]);

    // Resolve selected country name
    const selectedCountryName = SUPPORTED_COUNTRIES.find(c => c.code === calendarCountry)?.name || calendarCountry;

    // Flag SVG path helper
    const getFlagSrc = (code: string) => {
        try {
            return new URL(`../../../assets/flags/${code.toLowerCase()}.svg`, import.meta.url).href;
        } catch {
            return '';
        }
    };

    const isDirty =
        defaultCurrency !== initialSettings.defaultCurrency ||
        timezone !== initialSettings.timezone ||
        dateFormat !== initialSettings.dateFormat ||
        language !== initialSettings.language ||
        calendarCountry !== initialSettings.calendarCountry ||
        JSON.stringify(weekendDays.sort()) !== JSON.stringify(initialSettings.weekendDays.sort());

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

            <div className="flex-1 overflow-auto px-8 pb-8 scrollbar-premium">
                <div className="space-y-6 max-w-4xl">
                    {/* Regional & Localization */}
                    <div className="bg-white rounded-[3px] border border-gray-200 p-8 shadow-sm">
                        <h3 className="text-lg font-medium mb-6 text-gray-900">Regional & Localization</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">{t('settings.general.languagePreference', 'Primary Language')}</label>
                                <LanguageSelect onLanguageChange={handleLanguageChange} />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="default-currency" className="text-sm font-medium text-gray-700">Default Currency</label>
                                <VFDropdown
                                    options={isLoadingCurrencies
                                        ? [{ value: '', label: 'Loading currencies...' }]
                                        : currencies.length > 0
                                            ? currencies.map(curr => ({ value: curr.currency_code, label: `${curr.currency_code} - ${curr.currency_name}` }))
                                            : [{ value: '', label: 'Register a currency first' }]
                                    }
                                    value={defaultCurrency}
                                    onChange={val => setDefaultCurrency(val as string)}
                                    searchable={true}
                                    placeholder="Select Currency"
                                    disabled={isReadOnly || isLoadingCurrencies || isLoadingSettings}
                                />
                                {!isLoadingCurrencies && currencies.length === 0 && (
                                    <p className="text-[11px] text-amber-600 mt-1">Please register a currency in Currency Settings first.</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="preferred-timezone" className="text-sm font-medium text-gray-700">{t('settings.general.timezoneLabel', 'Preferred Timezone')}</label>
                                <VFDropdown
                                    options={timezones.map(tz => ({ value: tz, label: tz }))}
                                    value={timezone}
                                    onChange={val => setTimezone(val as string)}
                                    searchable={true}
                                    placeholder="Select Timezone"
                                    disabled={isReadOnly || isLoadingSettings}
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="date-format" className="text-sm font-medium text-gray-700">{t('settings.general.dateFormatLabel', 'Date Format')}</label>
                                <VFDropdown
                                    options={dateFormats.map(fmt => ({ value: fmt, label: fmt }))}
                                    value={dateFormat}
                                    onChange={val => setDateFormat(val as string)}
                                    searchable={false}
                                    placeholder="Select Date Format"
                                    disabled={isReadOnly || isLoadingSettings}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Calendar & Working Days */}
                    <div className="bg-white rounded-[3px] border border-gray-200 p-8 shadow-sm">
                        <h3 className="text-lg font-medium mb-2 text-gray-900">Calendar & Working Days</h3>
                        <p className="text-xs text-gray-500 mb-6">Controls holiday recognition and working-day calculations across all calendars.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Country Selector */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Calendar Country</label>
                                <div ref={countryDropdownRef} className="relative">
                                    <button
                                        type="button"
                                        onClick={() => { setCountryDropdownOpen(!countryDropdownOpen); setCountrySearch(''); }}
                                        disabled={isReadOnly || isLoadingSettings}
                                        className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 border border-gray-200 rounded-[3px] text-sm focus:outline-none focus:border-[#064771] transition-all cursor-pointer hover:border-gray-300"
                                    >
                                        <span className="flex items-center gap-2">
                                            <img
                                                src={getFlagSrc(calendarCountry)}
                                                alt=""
                                                className="w-5 h-3.5 object-cover rounded-[1px]"
                                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                            />
                                            <span className="text-gray-900">{selectedCountryName}</span>
                                            <span className="text-gray-400 text-xs">({calendarCountry})</span>
                                        </span>
                                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${countryDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {countryDropdownOpen && (
                                        <div className="absolute z-[100] mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                                            {/* Search */}
                                            <div className="p-2 border-b border-gray-100">
                                                <div className="relative">
                                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                                    <input
                                                        ref={countrySearchRef}
                                                        type="text"
                                                        value={countrySearch}
                                                        onChange={(e) => setCountrySearch(e.target.value)}
                                                        placeholder="Search countries..."
                                                        className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#064771]"
                                                    />
                                                </div>
                                            </div>
                                            {/* Country List */}
                                            <div className="max-h-52 overflow-auto scrollbar-premium">
                                                {filteredCountries.length === 0 ? (
                                                    <div className="px-4 py-3 text-sm text-gray-400">No countries found</div>
                                                ) : (
                                                    filteredCountries.map(c => (
                                                        <button
                                                            key={c.code}
                                                            type="button"
                                                            onClick={() => {
                                                                setCalendarCountry(c.code);
                                                                setCountryDropdownOpen(false);
                                                                setCountrySearch('');
                                                            }}
                                                            className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm text-left hover:bg-[#E1F7FF] transition-colors ${calendarCountry === c.code ? 'bg-[#E1F7FF] text-[#064771] font-medium' : 'text-gray-700'
                                                                }`}
                                                        >
                                                            <img
                                                                src={getFlagSrc(c.code)}
                                                                alt=""
                                                                className="w-5 h-3.5 object-cover rounded-[1px] shrink-0"
                                                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                            />
                                                            <span className="truncate">{c.name}</span>
                                                            <span className="text-gray-400 text-xs shrink-0">({c.code})</span>
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <p className="text-[11px] text-gray-400 mt-1">Determines public holidays shown in calendars.</p>
                            </div>

                            {/* Weekend Days Toggles */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Weekend Days</label>
                                <div className="flex gap-1.5 flex-wrap">
                                    {DAY_LABELS.map((label, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => toggleWeekendDay(idx)}
                                            disabled={isReadOnly || isLoadingSettings}
                                            className={`px-3.5 py-2 rounded-full text-sm font-medium transition-all border ${weekendDays.includes(idx)
                                                    ? 'bg-[#064771] text-white border-[#064771] shadow-sm'
                                                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[11px] text-gray-400 mt-1">Selected days are treated as non-working days.</p>
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
                                    role="switch"
                                    aria-checked={systemNotifications ? "true" : "false"}
                                    aria-label="Toggle system notifications"
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
                                    role="switch"
                                    aria-checked={browserNotifications ? "true" : "false"}
                                    aria-label="Toggle browser notifications"
                                    className={`w-12 h-6 rounded-full relative transition-colors ${browserNotifications ? 'bg-[#064771]' : 'bg-gray-200'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${browserNotifications ? 'right-1' : 'left-1'}`}></div>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons — hidden for partners */}
                    {!isReadOnly && (
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
                    )}
                </div>
            </div>
        </div>
    );
};

export default GeneralSettings;
