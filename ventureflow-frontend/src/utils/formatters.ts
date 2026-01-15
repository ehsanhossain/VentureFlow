/**
 * Formats a number into a shorter string representation (K, M, B)
 */
export const formatCompactNumber = (number: number): string => {
    if (number === 0) return '0';
    if (!number) return 'N/A';

    const formatter = Intl.NumberFormat('en', { notation: 'compact' });
    return formatter.format(number);
};

/**
 * Formats a budget object or string into a compact range representation ($100K - $1M)
 */
export const formatCompactBudget = (budget: any, currencySymbol: string = '$'): string => {
    if (!budget) return 'N/A';
    if (typeof budget === 'string') return budget;

    try {
        const min = budget.min !== undefined ? budget.min : (budget.minimum !== undefined ? budget.minimum : undefined);
        const max = budget.max !== undefined ? budget.max : (budget.maximum !== undefined ? budget.maximum : undefined);
        const symbol = budget.symbol || currencySymbol;

        if (min !== undefined && max !== undefined) {
            return `${symbol}${formatCompactNumber(Number(min))} - ${symbol}${formatCompactNumber(Number(max))}`;
        } else if (min !== undefined) {
            return `From ${symbol}${formatCompactNumber(Number(min))}`;
        } else if (max !== undefined) {
            return `Up to ${symbol}${formatCompactNumber(Number(max))}`;
        }
    } catch (e) {
        return 'Invalid Format';
    }

    return 'N/A';
};

/**
 * Formats a budget object into a full numeric string for tooltips
 */
export const formatFullBudget = (budget: any, currencySymbol: string = '$'): string => {
    if (!budget) return 'N/A';
    if (typeof budget === 'string') return budget;

    try {
        const min = budget.min !== undefined ? budget.min : (budget.minimum !== undefined ? budget.minimum : undefined);
        const max = budget.max !== undefined ? budget.max : (budget.maximum !== undefined ? budget.maximum : undefined);
        const symbol = budget.symbol || currencySymbol;

        const fmt = (n: any) => Number(n).toLocaleString();

        if (min !== undefined && max !== undefined) {
            return `${symbol}${fmt(min)} - ${symbol}${fmt(max)}`;
        } else if (min !== undefined) {
            return `From ${symbol}${fmt(min)}`;
        } else if (max !== undefined) {
            return `Up to ${symbol}${fmt(max)}`;
        }
    } catch (e) {
        return 'Invalid Format';
    }
    return 'N/A';
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
