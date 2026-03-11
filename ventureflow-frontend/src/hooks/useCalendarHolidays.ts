/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

import { useMemo, useCallback } from 'react';
import Holidays from 'date-holidays';
import { useGeneralSettings } from '../context/GeneralSettingsContext';

export interface HolidayInfo {
    date: string; // YYYY-MM-DD
    name: string;
    type: string; // 'public' | 'bank' | 'school' | 'optional' | 'observance'
}

/**
 * Hook that provides holiday information for one or more years
 * based on the calendar_country setting.
 *
 * Uses the `date-holidays` npm package (client-side, 225+ countries).
 * Pass a single year or an array of years to pre-load.
 */
export function useCalendarHolidays(year?: number | number[]) {
    const { settings } = useGeneralSettings();
    const countryCode = settings.calendar_country || 'US';
    const currentYear = new Date().getFullYear();
    const resolvedYears = useMemo(() => {
        if (!year) return [currentYear];
        const arr = Array.isArray(year) ? year : [year];
        // Deduplicate
        return [...new Set(arr)];
    }, [year, currentYear]);

    const holidayMap = useMemo(() => {
        const map = new Map<string, HolidayInfo>();
        try {
            const hd = new Holidays(countryCode);
            for (const y of resolvedYears) {
                const holidays = hd.getHolidays(y);
                if (holidays) {
                    for (const h of holidays) {
                        // Only include public and bank holidays (skip observance, school, optional)
                        if (h.type === 'public' || h.type === 'bank') {
                            // h.date is "YYYY-MM-DD HH:mm:ss" — extract just the date part
                            const dateStr = h.date.substring(0, 10);
                            map.set(dateStr, {
                                date: dateStr,
                                name: h.name,
                                type: h.type,
                            });
                        }
                    }
                }
            }
        } catch {
            // Silently handle — country not supported
        }
        return map;
    }, [countryCode, resolvedYears]);

    const isHoliday = useCallback(
        (date: Date | string): boolean => {
            const key = typeof date === 'string' ? date : toISODate(date);
            return holidayMap.has(key);
        },
        [holidayMap]
    );

    const getHolidayName = useCallback(
        (date: Date | string): string | undefined => {
            const key = typeof date === 'string' ? date : toISODate(date);
            return holidayMap.get(key)?.name;
        },
        [holidayMap]
    );

    const isWeekend = useCallback(
        (date: Date): boolean => {
            const day = date.getDay(); // 0=Sun, 6=Sat
            return (settings.weekend_days || [0, 6]).includes(day);
        },
        [settings.weekend_days]
    );

    const isNonWorkingDay = useCallback(
        (date: Date): boolean => {
            return isWeekend(date) || isHoliday(date);
        },
        [isWeekend, isHoliday]
    );

    /** Count working days between start and end (inclusive) */
    const countWorkingDays = useCallback(
        (start: Date, end: Date): number => {
            let count = 0;
            const current = new Date(start);
            while (current <= end) {
                if (!isNonWorkingDay(current)) {
                    count++;
                }
                current.setDate(current.getDate() + 1);
            }
            return count;
        },
        [isNonWorkingDay]
    );

    return {
        holidays: holidayMap,
        isHoliday,
        getHolidayName,
        isWeekend,
        isNonWorkingDay,
        countWorkingDays,
        countryCode,
    };
}

/** Convert Date to YYYY-MM-DD */
function toISODate(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export default useCalendarHolidays;
