/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

import { useState, useRef, useEffect } from 'react';
import { Calendar as RDRCalendar } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { Calendar as CalendarIcon } from 'lucide-react';

interface VFCalendarPickerProps {
    /** ISO date string (YYYY-MM-DD) or empty string */
    value: string;
    /** Called with ISO date string (YYYY-MM-DD) */
    onChange: (dateStr: string) => void;
    /** Placeholder text when no date is selected */
    placeholder?: string;
    /** Minimum selectable date (ISO string) */
    minDate?: string;
    /** Accessible title / aria-label */
    title?: string;
    /** Use compact variant for tight spaces (stage timeline rows) */
    compact?: boolean;
}

/** Format a YYYY-MM-DD string to a readable format like "09 Mar 2026" */
const formatDateDisplay = (isoStr: string): string => {
    if (!isoStr) return '';
    const d = new Date(isoStr + 'T00:00:00'); // Force local timezone
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const VFCalendarPicker = ({
    value,
    onChange,
    placeholder = 'Select date',
    minDate,
    title,
    compact = false,
}: VFCalendarPickerProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

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

    const selectedDate = value ? new Date(value + 'T00:00:00') : undefined;
    const minDateObj = minDate ? new Date(minDate + 'T00:00:00') : undefined;

    const handleSelect = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        onChange(`${year}-${month}-${day}`);
        setIsOpen(false);
    };

    return (
        <div ref={containerRef} className="relative">
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                title={title}
                aria-label={title || placeholder}
                className={`flex items-center justify-between gap-1.5 border border-gray-300 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-left ${compact
                        ? 'w-[130px] px-2 py-1.5 rounded-[3px] text-xs'
                        : 'w-full px-3 py-2 rounded-[3px] text-sm'
                    }`}
            >
                <span className={value ? 'text-gray-900' : 'text-gray-400'}>
                    {value ? formatDateDisplay(value) : placeholder}
                </span>
                <CalendarIcon className={`shrink-0 text-gray-400 ${compact ? 'w-3 h-3' : 'w-4 h-4'}`} />
            </button>

            {/* Calendar Dropdown */}
            {isOpen && (
                <div
                    className={`absolute z-[200] mt-1 shadow-lg ${compact ? 'ventureflow-date-range ventureflow-date-range-compact' : 'ventureflow-date-range'}`}
                    style={{ right: 0 }}
                >
                    <RDRCalendar
                        date={selectedDate || new Date()}
                        onChange={handleSelect}
                        minDate={minDateObj}
                        color="#064771"
                    />
                </div>
            )}
        </div>
    );
};

export default VFCalendarPicker;
