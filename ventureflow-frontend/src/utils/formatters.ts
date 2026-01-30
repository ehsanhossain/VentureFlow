/**
 * Formats a number or string into a currency string with commas
 */
export const formatCurrency = (value: number | string): string => {
    if (value === 0 || value === '0') return '0';
    if (!value) return 'N/A';

    const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
    if (isNaN(num)) return String(value);

    return num.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
};

/**
 * Get currency symbol from code
 */
export const getCurrencySymbol = (code: string): string => {
    if (!code) return '$';
    const cleanCode = code.trim().toUpperCase();
    const symbols: Record<string, string> = {
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'JPY': '¥',
        'CNY': '¥',
        'THB': '฿',
        'SGD': 'S$',
        'MYR': 'RM',
        'IDR': 'Rp',
        'VND': '₫',
        'KRW': '₩',
        'INR': '₹',
        'AUD': 'A$',
        'HKD': 'HK$',
        'PHP': '₱',
        'BND': 'B$',
        'KHR': '៛',
        'LAK': '₭',
        'MMK': 'K',
    };
    return symbols[cleanCode] || code || '$';
};

/**
 * Formats a number into a shorter string representation (K, M, B)
 */
export const formatCompactNumber = (number: number): string => {
    if (number === 0) return '0';
    if (!number) return 'N/A';

    if (number >= 1000000000) {
        return `${(number / 1000000000).toFixed(1)}B`;
    }
    if (number >= 1000000) {
        return `${(number / 1000000).toFixed(1)}M`;
    }
    if (number >= 1000) {
        return `${(number / 1000).toFixed(1)}K`;
    }
    return number.toLocaleString();
};

/**
 * Formats a budget object or string into a compact range representation ($100K - $1M)
 * @param budget The budget object with min/max values
 * @param currencySymbol The currency symbol to display
 * @param exchangeRate Optional exchange rate for currency conversion (rate relative to base currency like USD)
 */
export const formatCompactBudget = (budget: any, currencySymbol: string = '$', exchangeRate?: number): string => {
    if (!budget) return 'N/A';
    if (typeof budget === 'string') {
        const rangeMatch = budget.match(/^([\d.,]+)\s*-\s*([\d.,]+)$/);
        if (rangeMatch) {
            budget = { min: rangeMatch[1].replace(/,/g, ''), max: rangeMatch[2].replace(/,/g, '') };
        } else if (!isNaN(Number(budget.replace(/,/g, '')))) {
            const val = Number(budget.replace(/,/g, ''));
            const converted = exchangeRate ? val * exchangeRate : val;
            return `${currencySymbol}${formatCompactNumber(converted)}`;
        } else {
            return budget;
        }
    }

    try {
        let min = budget.min !== undefined && budget.min !== '' ? budget.min : (budget.minimum !== undefined && budget.minimum !== '' ? budget.minimum : undefined);
        let max = budget.max !== undefined && budget.max !== '' ? budget.max : (budget.maximum !== undefined && budget.maximum !== '' ? budget.maximum : undefined);

        if (min === undefined && max === undefined) return 'Flexible';

        const symbol = currencySymbol;

        // Apply exchange rate conversion if provided
        if (exchangeRate && exchangeRate !== 1) {
            if (min !== undefined) min = Number(min) * exchangeRate;
            if (max !== undefined) max = Number(max) * exchangeRate;
        }

        if (min !== undefined && max !== undefined) {
            if (Number(min) === 0 && Number(max) === 0) return 'Flexible';
            if (Number(min) === Number(max)) return `${symbol}${formatCompactNumber(Number(min))}`;
            return `${symbol}${formatCompactNumber(Number(min))} - ${symbol}${formatCompactNumber(Number(max))}`;
        } else if (min !== undefined) {
            return `From ${symbol}${formatCompactNumber(Number(min))}`;
        } else if (max !== undefined) {
            return `Up to ${symbol}${formatCompactNumber(Number(max))}`;
        }
    } catch (e) {
        return 'Flexible';
    }

    return 'Flexible';
};

/**
 * Formats a budget object into a full numeric string for tooltips
 * @param budget The budget object with min/max values
 * @param currencySymbol The currency symbol to display
 * @param exchangeRate Optional exchange rate for currency conversion
 */
export const formatFullBudget = (budget: any, currencySymbol: string = '$', exchangeRate?: number): string => {
    if (!budget) return 'N/A';
    if (typeof budget === 'string') {
        const rangeMatch = budget.match(/^([\d.,]+)\s*-\s*([\d.,]+)$/);
        if (rangeMatch) {
            budget = { min: rangeMatch[1].replace(/,/g, ''), max: rangeMatch[2].replace(/,/g, '') };
        } else {
            return budget;
        }
    }

    try {
        let min = budget.min !== undefined && budget.min !== '' ? budget.min : (budget.minimum !== undefined && budget.minimum !== '' ? budget.minimum : undefined);
        let max = budget.max !== undefined && budget.max !== '' ? budget.max : (budget.maximum !== undefined && budget.maximum !== '' ? budget.maximum : undefined);

        if (min === undefined && max === undefined) return 'Flexible';

        const symbol = currencySymbol;

        // Apply exchange rate conversion if provided
        if (exchangeRate && exchangeRate !== 1) {
            if (min !== undefined) min = Number(min) * exchangeRate;
            if (max !== undefined) max = Number(max) * exchangeRate;
        }

        const fmt = (n: any) => Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 });

        if (min !== undefined && max !== undefined) {
            if (Number(min) === 0 && Number(max) === 0) return 'Flexible';
            return `${symbol}${fmt(min)} - ${symbol}${fmt(max)}`;
        } else if (min !== undefined) {
            return `From ${symbol}${fmt(min)}`;
        } else if (max !== undefined) {
            return `Up to ${symbol}${fmt(max)}`;
        }
    } catch (e) {
        return 'Flexible';
    }
    return 'Flexible';
};

/**
 * Basic currency conversion utility
 * In a real app, this would use live rates from an API or store
 */
export const convertCurrency = (amount: number, fromRate: number, toRate: number): number => {
    // Assuming rates are relative to a base currency (e.g. USD)
    // base_amount = amount / fromRate
    // target_amount = base_amount * toRate
    if (!fromRate || !toRate) return amount;
    return (amount / fromRate) * toRate;
};
