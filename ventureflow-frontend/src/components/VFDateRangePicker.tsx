/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { useCalendarHolidays } from '../hooks/useCalendarHolidays';

interface VFDateRangePickerProps {
    /** ISO date string (YYYY-MM-DD) or empty string */
    startDate: string;
    /** ISO date string (YYYY-MM-DD) or empty string */
    endDate: string;
    /** Called with both ISO date strings */
    onRangeChange: (startDate: string, endDate: string) => void;
    /** Minimum selectable date (ISO string) */
    minDate?: string;
    /** Accessible title / aria-label */
    title?: string;
    /** Use compact variant for tight spaces */
    compact?: boolean;
    /** Show quick-duration shortcut buttons */
    showShortcuts?: boolean;
}

/** Convert YYYY-MM-DD to Date object in local timezone */
const toLocalDate = (iso: string): Date => new Date(iso + 'T00:00:00');

/** Convert Date to YYYY-MM-DD string */
const toISOStr = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/** Format a YYYY-MM-DD string to "09 Mar" short format */
const formatShort = (iso: string): string => {
    if (!iso) return '';
    const d = toLocalDate(iso);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
};

/** Count total calendar days between two ISO dates (inclusive) */
const countDays = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const s = toLocalDate(start);
    const e = toLocalDate(end);
    return Math.round((e.getTime() - s.getTime()) / 86400000) + 1;
};

/** Add N days to a Date and return new Date */
const addDays = (d: Date, n: number): Date => {
    const result = new Date(d);
    result.setDate(result.getDate() + n);
    return result;
};

const SHORTCUTS = [
    { label: '1 Week', days: 7 },
    { label: '2 Weeks', days: 14 },
    { label: '1 Month', days: 30 },
    { label: '3 Months', days: 90 },
    { label: '6 Months', days: 180 },
];

const VFDateRangePicker = ({
    startDate,
    endDate,
    onRangeChange,
    minDate,
    title,
    compact = false,
    showShortcuts = true,
}: VFDateRangePickerProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [shownDate, setShownDate] = useState<Date>(new Date());

    // Load holidays for both the current year and the displayed calendar year
    const holidayYears = useMemo(() => {
        const years = new Set<number>();
        years.add(new Date().getFullYear());
        years.add(shownDate.getFullYear());
        if (startDate) years.add(toLocalDate(startDate).getFullYear());
        return [...years];
    }, [startDate, shownDate]);

    const { isHoliday, getHolidayName, isWeekend, countWorkingDays } = useCalendarHolidays(holidayYears);

    // Close on outside click
    useEffect(() => {
        if (!isOpen) return;
        const handleClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [isOpen]);

    // Close on Escape
    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [isOpen]);

    const hasDates = !!(startDate && endDate);
    const minDateObj = useMemo(() => minDate ? toLocalDate(minDate) : undefined, [minDate]);

    // When no dates are selected, default to minDate (if set) so the visual
    // default never sits before the minimum, which causes broken pill rounding.
    const defaultDate = useMemo(() => {
        const today = new Date();
        if (minDateObj && today < minDateObj) return minDateObj;
        return today;
    }, [minDateObj]);

    // Memoize ranges so react-date-range doesn't reset the month view
    // on unrelated re-renders (e.g. when onShownDateChange fires).
    const ranges = useMemo(() => [{
        startDate: startDate ? toLocalDate(startDate) : defaultDate,
        endDate: endDate ? toLocalDate(endDate) : defaultDate,
        key: 'selection'
    }], [startDate, endDate, defaultDate]);

    const handleRangeChange = (item: any) => {
        const sel = item.selection;
        onRangeChange(toISOStr(sel.startDate), toISOStr(sel.endDate));
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onRangeChange('', '');
    };

    const handleShortcut = useCallback((days: number) => {
        const base = startDate ? toLocalDate(startDate) : new Date();
        const end = addDays(base, days - 1);
        onRangeChange(toISOStr(base), toISOStr(end));
    }, [startDate, onRangeChange]);

    // Figure out which shortcut is currently active
    const activeShortcut = useMemo(() => {
        if (!hasDates) return null;
        const total = countDays(startDate, endDate);
        return SHORTCUTS.find(s => s.days === total)?.days || null;
    }, [hasDates, startDate, endDate]);

    // Duration badge text
    const totalDays = hasDates ? countDays(startDate, endDate) : 0;
    const workingDays = hasDates
        ? countWorkingDays(toLocalDate(startDate), toLocalDate(endDate))
        : 0;

    // Display text
    const displayText = hasDates
        ? `${formatShort(startDate)} – ${formatShort(endDate)}`
        : 'Select date range';

    const durationBadge = hasDates
        ? `${totalDays}d${workingDays < totalDays ? ` (${workingDays}w)` : ''}`
        : '';

    // Custom day content renderer for weekend/holiday styling
    const dayContentRenderer = useCallback((day: Date) => {
        const dateStr = toISOStr(day);
        const weekend = isWeekend(day);
        const holiday = isHoliday(dateStr);
        const holidayName = holiday ? getHolidayName(dateStr) : undefined;

        const attrs: Record<string, string> = {};
        if (weekend) attrs['data-weekend'] = 'true';
        if (holiday) attrs['data-holiday'] = 'true';

        return (
            <span
                {...attrs}
                title={holidayName}
                style={{ position: 'relative', display: 'inline-block' }}
            >
                {day.getDate()}
            </span>
        );
    }, [isWeekend, isHoliday, getHolidayName]);

    return (
        <div ref={containerRef} className="relative">
            {/* Trigger Button */}
            <div className="flex items-center gap-1">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    title={title}
                    aria-label={title || 'Select date range'}
                    className={`flex items-center justify-between gap-1.5 border border-gray-300 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-left ${compact
                        ? 'px-2 py-1.5 rounded-[3px] text-xs'
                        : 'w-full px-3 py-2 rounded-[3px] text-sm'
                        }`}
                >
                    <span className={hasDates ? 'text-gray-900 whitespace-nowrap' : 'text-gray-400 whitespace-nowrap'}>
                        {displayText}
                    </span>
                    {durationBadge && (
                        <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[#E1F7FF] text-[#064771] text-[10px] font-semibold whitespace-nowrap">
                            {durationBadge}
                        </span>
                    )}
                    <CalendarIcon className={`shrink-0 text-gray-400 ${compact ? 'w-3 h-3' : 'w-4 h-4'}`} />
                </button>
                {hasDates && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="p-0.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
                        title="Clear dates"
                    >
                        <X className="w-3 h-3" />
                    </button>
                )}
            </div>

            {/* DateRange Calendar Dropdown */}
            {isOpen && (
                <div
                    className={`absolute z-[200] mt-1 shadow-lg ${compact ? 'ventureflow-date-range ventureflow-date-range-compact' : 'ventureflow-date-range'}`}
                    style={{ right: 0 }}
                >
                    <div className="flex">
                        {/* Quick-Duration Shortcut Panel */}
                        {showShortcuts && (
                            <div className="vf-date-shortcuts">
                                {SHORTCUTS.map(s => (
                                    <button
                                        key={s.days}
                                        type="button"
                                        className={activeShortcut === s.days ? 'active' : ''}
                                        onClick={() => handleShortcut(s.days)}
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Calendar */}
                        <DateRange
                            ranges={ranges}
                            onChange={handleRangeChange}
                            onShownDateChange={(date: Date) => setShownDate(date)}
                            moveRangeOnFirstSelection={false}
                            months={1}
                            direction="horizontal"
                            rangeColors={['#064771']}
                            color="#064771"
                            showDateDisplay={false}
                            minDate={minDateObj}
                            dayContentRenderer={dayContentRenderer}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default VFDateRangePicker;
