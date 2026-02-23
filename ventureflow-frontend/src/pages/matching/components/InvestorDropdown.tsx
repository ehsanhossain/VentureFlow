/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { SearchIcon } from 'lucide-react';
import api from '../../../config/api';

export interface InvestorOption {
    id: number;
    project_code: string;
    reg_name: string;
}

interface InvestorDropdownProps {
    selected: InvestorOption | null;
    onSelect: (investor: InvestorOption | null) => void;
    placeholder?: string;
}

export const InvestorDropdown = ({
    selected,
    onSelect,
    placeholder = 'Select an investor',
}: InvestorDropdownProps): JSX.Element => {
    const [search, setSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [results, setResults] = useState<InvestorOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [highlightIndex, setHighlightIndex] = useState(-1);

    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    // Close when clicking outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Focus search input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
            // Load first page immediately on open
            fetchInvestors('');
        } else {
            setSearch('');
            setResults([]);
            setHighlightIndex(-1);
        }
    }, [isOpen]);

    const fetchInvestors = useCallback(async (q: string) => {
        setLoading(true);
        try {
            const res = await api.get('/api/buyer', {
                params: { search: q, per_page: 20, page: 1 },
            });
            const raw = res.data?.data ?? [];
            setResults(raw.map((inv: any) => ({
                id: inv.id,
                project_code: inv.buyer_id ?? '',
                reg_name: inv.company_overview?.reg_name ?? inv.buyer_id ?? `#${inv.id}`,
            })));
        } catch {
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Debounced search
    useEffect(() => {
        if (!isOpen) return;
        const t = setTimeout(() => fetchInvestors(search), 280);
        return () => clearTimeout(t);
    }, [search, isOpen, fetchInvestors]);

    const handleSelect = (inv: InvestorOption) => {
        onSelect(inv);
        setIsOpen(false);
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect(null);
    };

    // Keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (!isOpen) {
            if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
                e.preventDefault();
                setIsOpen(true);
            }
            return;
        }
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightIndex(prev => {
                    const next = prev < results.length - 1 ? prev + 1 : 0;
                    scrollToItem(next);
                    return next;
                });
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightIndex(prev => {
                    const next = prev > 0 ? prev - 1 : results.length - 1;
                    scrollToItem(next);
                    return next;
                });
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightIndex >= 0 && results[highlightIndex]) {
                    handleSelect(results[highlightIndex]);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setIsOpen(false);
                break;
        }
    }, [isOpen, highlightIndex, results]);

    const scrollToItem = (index: number) => {
        if (!listRef.current) return;
        const items = listRef.current.querySelectorAll('[data-investor-item]');
        items[index]?.scrollIntoView({ block: 'nearest' });
    };

    return (
        <div className="relative w-full" ref={dropdownRef} onKeyDown={handleKeyDown}>
            {/* Trigger button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen ? 'true' : 'false'}
                className="flex w-full min-h-[44px] items-center gap-2 px-4 py-2 rounded-[3px] border border-gray-300 bg-white focus:outline-none overflow-hidden"
            >
                {selected ? (
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-sm text-gray-900 truncate flex-1">{selected.reg_name}</span>
                        <span className="text-xs text-gray-400 shrink-0">{selected.project_code}</span>
                        {/* Clear ✕ */}
                        <span
                            role="button"
                            tabIndex={0}
                            aria-label="Clear selection"
                            onClick={handleClear}
                            onKeyDown={e => e.key === 'Enter' && handleClear(e as any)}
                            className="ml-1 shrink-0 text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                            ✕
                        </span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-sm text-gray-400 flex-1">
                        {placeholder}
                    </div>
                )}
                <svg
                    className={`w-4 h-4 ml-auto text-gray-400 transform transition-transform shrink-0 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown panel */}
            {isOpen && (
                <div className="absolute z-50 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200" style={{ maxHeight: '320px' }}>
                    <div className="flex flex-col w-full p-3 gap-3">
                        {/* Search input */}
                        <div className="relative w-full">
                            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                ref={inputRef}
                                value={search}
                                onChange={e => { setSearch(e.target.value); setHighlightIndex(-1); }}
                                onKeyDown={e => { e.stopPropagation(); handleKeyDown(e); }}
                                className="w-full h-10 pl-10 pr-3 py-2 rounded-[3px] border border-gray-200 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#064771]/10 focus:border-[#064771] transition-all"
                                placeholder="Search investors…"
                                autoComplete="off"
                            />
                        </div>

                        {/* Results list */}
                        <div ref={listRef} className="flex flex-col w-full max-h-52 overflow-y-auto overflow-x-hidden scrollbar-premium">
                            {loading ? (
                                <div className="py-6 text-center text-gray-400 text-sm">Loading…</div>
                            ) : results.length > 0 ? (
                                results.map((inv, idx) => (
                                    <button
                                        key={inv.id}
                                        type="button"
                                        data-investor-item
                                        onClick={() => handleSelect(inv)}
                                        onMouseEnter={() => setHighlightIndex(idx)}
                                        className={`flex items-center w-full justify-start gap-3 py-2.5 px-3 rounded-lg transition-colors text-left ${highlightIndex === idx ? 'bg-blue-50' : 'hover:bg-gray-50'} ${selected?.id === inv.id ? 'text-[#064771] font-medium' : 'text-gray-700'}`}
                                    >
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-sm truncate">{inv.reg_name}</span>
                                            <span className="text-xs text-gray-400">{inv.project_code}</span>
                                        </div>
                                        {selected?.id === inv.id && (
                                            <span className="ml-auto text-[#064771] text-xs shrink-0">✓</span>
                                        )}
                                    </button>
                                ))
                            ) : (
                                <div className="py-8 text-center text-gray-400 text-sm">
                                    {search ? 'No investors found' : 'No registered investors'}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
