import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import api from '../config/api';

interface GeneralSettings {
    default_currency: string;
    timezone: string;
    date_format: string;
}

interface GeneralSettingsContextType {
    settings: GeneralSettings;
    isLoading: boolean;
    refreshSettings: () => Promise<void>;
}

const defaultSettings: GeneralSettings = {
    default_currency: 'USD',
    timezone: '(GMT+07:00) Bangkok, Hanoi, Jakarta',
    date_format: 'DD/MM/YYYY',
};

const GeneralSettingsContext = createContext<GeneralSettingsContextType>({
    settings: defaultSettings,
    isLoading: true,
    refreshSettings: async () => { },
});

export const useGeneralSettings = () => useContext(GeneralSettingsContext);

export const GeneralSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<GeneralSettings>(defaultSettings);
    const [isLoading, setIsLoading] = useState(true);

    const refreshSettings = useCallback(async () => {
        try {
            const res = await api.get('/api/general-settings');
            setSettings({
                default_currency: res.data.default_currency || 'USD',
                timezone: res.data.timezone || defaultSettings.timezone,
                date_format: res.data.date_format || defaultSettings.date_format,
            });
        } catch (error) {
            console.error('Failed to load general settings:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshSettings();
    }, [refreshSettings]);

    return (
        <GeneralSettingsContext.Provider value={{ settings, isLoading, refreshSettings }}>
            {children}
        </GeneralSettingsContext.Provider>
    );
};

export default GeneralSettingsContext;
