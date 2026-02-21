/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

import React, { useState, useEffect, useCallback } from 'react';

interface NumericInputProps {
    value: string;
    onChange: (rawValue: string) => void;
    placeholder?: string;
    className?: string;
    style?: React.CSSProperties;
}

/**
 * A text input that displays numbers with comma separators (e.g., 34,000,000,000)
 * while keeping the underlying value as a plain numeric string.
 */
const NumericInput: React.FC<NumericInputProps> = ({
    value,
    onChange,
    placeholder,
    className,
    style,
}) => {
    const formatWithCommas = useCallback((raw: string): string => {
        if (!raw) return '';
        // Remove any existing commas
        const cleaned = raw.replace(/,/g, '');
        // Split into integer and decimal parts
        const parts = cleaned.split('.');
        // Add commas to integer part
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return parts.join('.');
    }, []);

    const [displayValue, setDisplayValue] = useState(() => formatWithCommas(value));

    // Sync display when external value changes (e.g., on load from API)
    useEffect(() => {
        setDisplayValue(formatWithCommas(value));
    }, [value, formatWithCommas]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value;
        // Strip commas to get raw value
        const raw = input.replace(/,/g, '');
        // Only allow digits and optional single decimal point
        if (raw === '' || /^\d*\.?\d*$/.test(raw)) {
            setDisplayValue(formatWithCommas(raw));
            onChange(raw);
        }
    };

    return (
        <input
            type="text"
            inputMode="decimal"
            value={displayValue}
            onChange={handleChange}
            placeholder={placeholder}
            className={className}
            style={style}
        />
    );
};

export default NumericInput;
