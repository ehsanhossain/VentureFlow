/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 *
 * VFDropdown — Unified dropdown component (design system)
 *
 * Variants:
 *   - Single select (default)
 *   - Multi-select (multiSelect)
 *   - Searchable / non-searchable (searchable, default: true)
 *   - Clearable (clearable)
 *   - With images (avatar photos, country flags)
 *   - With icons per option
 *   - With status badges ("Registered")
 *   - With "All" reset option (showAllOption)
 *   - Drop-up (dropUp)
 */

import { useState, useRef, useEffect, forwardRef, useCallback, type ReactNode } from 'react';
import type { ForwardedRef, HTMLAttributes } from 'react';
import { SearchIcon, CheckIcon, XIcon } from 'lucide-react';

/* ─── Types ─── */

export interface VFDropdownOption {
    value: string;
    label: string;
    image?: string;        // avatar photo URL or flag SVG URL
    icon?: ReactNode;      // custom JSX icon element
    status?: string;       // e.g. "registered" — shown as badge
    disabled?: boolean;
}

type VFDropdownCoreProps = {
    options: VFDropdownOption[];
    value?: string | string[] | null;
    onChange: (value: string | string[] | null) => void;
    placeholder?: string;
    searchPlaceholder?: string;

    // Variants
    multiSelect?: boolean;
    searchable?: boolean;
    clearable?: boolean;
    disabled?: boolean;
    dropUp?: boolean;

    // Advanced
    showAllOption?: string;        // e.g. "All Countries" — adds a reset row at top
    showStatusBadge?: boolean;     // show status badges on items
};

type VFDropdownProps = VFDropdownCoreProps & Omit<HTMLAttributes<HTMLDivElement>, 'onChange'>;

/* ─── Helpers ─── */

const BRAND_COLOR = '#064771';

const getInitials = (name: string): string =>
    (name || '?').split(' ').map(w => w[0]).filter(Boolean).join('').toUpperCase().slice(0, 2);

/* ─── Avatar Renderer ─── */

const OptionAvatar = ({ option, size = 'md' }: { option: VFDropdownOption; size?: 'sm' | 'md' }) => {
    const dim = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6';
    const textSize = size === 'sm' ? 'text-[8px]' : 'text-[10px]';

    if (option.icon) {
        return <span className={`${dim} shrink-0 flex items-center justify-center`}>{option.icon}</span>;
    }

    if (option.image) {
        return (
            <>
                <img
                    src={option.image}
                    alt={option.label}
                    className={`${dim} rounded-full shrink-0 object-cover`}
                    onError={(e) => {
                        const target = e.currentTarget;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                    }}
                />
                <div
                    className={`${dim} rounded-full shrink-0 items-center justify-center text-white ${textSize} font-bold`}
                    style={{ display: 'none', backgroundColor: BRAND_COLOR }}
                >
                    {getInitials(option.label)}
                </div>
            </>
        );
    }

    // No image, no icon — do NOT render avatar at all (for plain text options)
    return null;
};

/* ─── Component ─── */

export const VFDropdown = forwardRef<HTMLDivElement, VFDropdownProps>(
    (
        {
            options,
            value,
            onChange,
            placeholder = 'Select option',
            searchPlaceholder = 'Search...',
            multiSelect = false,
            searchable = true,
            clearable = false,
            disabled = false,
            dropUp = false,
            showAllOption,
            showStatusBadge = false,
            className,
            ...rest
        },
        ref: ForwardedRef<HTMLDivElement>
    ): JSX.Element => {

        /* ─── Derive selected option(s) from value ─── */
        const getSelectedOptions = useCallback((): VFDropdownOption[] => {
            if (value === null || value === undefined) return [];
            if (Array.isArray(value)) {
                return value
                    .map(v => options.find(o => o.value === v))
                    .filter((o): o is VFDropdownOption => !!o);
            }
            const found = options.find(o => o.value === value);
            return found ? [found] : [];
        }, [value, options]);

        const [search, setSearch] = useState('');
        const [isOpen, setIsOpen] = useState(false);
        const [highlightIndex, setHighlightIndex] = useState(-1);
        const [selectedOptions, setSelectedOptions] = useState<VFDropdownOption[]>(getSelectedOptions);

        const dropdownRef = useRef<HTMLDivElement | null>(null);
        const listRef = useRef<HTMLDivElement>(null);
        const searchInputRef = useRef<HTMLInputElement>(null);

        const setRefs = (node: HTMLDivElement | null) => {
            dropdownRef.current = node;
            if (typeof ref === 'function') {
                ref(node);
            } else if (ref) {
                (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
            }
        };

        // Sync selected when value or options change externally
        useEffect(() => {
            setSelectedOptions(getSelectedOptions());
        }, [value, options, getSelectedOptions]);

        /* ─── Filtering ─── */
        const filteredOptions = (options || []).filter(opt =>
            opt && (opt.label || '').toLowerCase().includes(search.toLowerCase())
        );

        // How many items are there? (with showAllOption it's +1)
        const allOptionOffset = showAllOption ? 1 : 0;
        const totalItems = filteredOptions.length + allOptionOffset;

        // Reset highlight when search changes or dropdown toggles
        useEffect(() => {
            setHighlightIndex(-1);
        }, [search, isOpen]);

        // Auto-focus search input when dropdown opens
        useEffect(() => {
            if (isOpen && searchable && searchInputRef.current) {
                searchInputRef.current.focus();
            }
        }, [isOpen, searchable]);

        /* ─── Selection handlers ─── */
        const handleSelect = (opt: VFDropdownOption) => {
            if (opt.disabled) return;

            if (multiSelect) {
                const exists = selectedOptions.some(s => s.value === opt.value);
                const newSelected = exists
                    ? selectedOptions.filter(s => s.value !== opt.value)
                    : [...selectedOptions, opt];
                setSelectedOptions(newSelected);
                onChange(newSelected.map(s => s.value));
            } else {
                setSelectedOptions([opt]);
                setIsOpen(false);
                onChange(opt.value);
            }
        };

        const handleSelectAll = () => {
            setSelectedOptions([]);
            setIsOpen(false);
            onChange(multiSelect ? [] : null);
        };

        const handleClear = (e: React.MouseEvent) => {
            e.stopPropagation();
            setSelectedOptions([]);
            onChange(multiSelect ? [] : null);
        };

        const handleRemoveChip = (e: React.MouseEvent, opt: VFDropdownOption) => {
            e.stopPropagation();
            const newSelected = selectedOptions.filter(s => s.value !== opt.value);
            setSelectedOptions(newSelected);
            onChange(newSelected.map(s => s.value));
        };

        /* ─── Keyboard navigation ─── */
        const scrollToHighlighted = useCallback((index: number) => {
            if (!listRef.current) return;
            const items = listRef.current.querySelectorAll('[data-dropdown-item]');
            if (items[index]) {
                items[index].scrollIntoView({ block: 'nearest' });
            }
        }, []);

        const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
            if (!isOpen) {
                if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setIsOpen(true);
                }
                return;
            }

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setHighlightIndex(prev => {
                        const next = prev < totalItems - 1 ? prev + 1 : 0;
                        scrollToHighlighted(next);
                        return next;
                    });
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setHighlightIndex(prev => {
                        const next = prev > 0 ? prev - 1 : totalItems - 1;
                        scrollToHighlighted(next);
                        return next;
                    });
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (showAllOption && highlightIndex === 0) {
                        handleSelectAll();
                    } else {
                        const optIdx = highlightIndex - allOptionOffset;
                        if (optIdx >= 0 && optIdx < filteredOptions.length) {
                            handleSelect(filteredOptions[optIdx]);
                        }
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    setIsOpen(false);
                    break;
            }
        }, [isOpen, highlightIndex, filteredOptions, totalItems, allOptionOffset, scrollToHighlighted]);

        /* ─── Click outside ─── */
        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                    setIsOpen(false);
                }
            };
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }, []);

        /* ─── Predicates ─── */
        const isSelected = (opt: VFDropdownOption) =>
            selectedOptions.some(s => s.value === opt.value);

        /* ─── Render ─── */
        return (
            <div
                className={['relative w-full', className].filter(Boolean).join(' ')}
                ref={setRefs}
                onKeyDown={handleKeyDown}
                {...rest}
            >
                {/* ─── Trigger Button ─── */}
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    aria-expanded={isOpen ? 'true' : 'false'}
                    className={`flex w-full min-h-[44px] items-center gap-2 px-3 py-2 rounded-[3px] border border-gray-300 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-colors ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''}`}
                >
                    {selectedOptions.length > 0 ? (
                        multiSelect ? (
                            <div className="flex flex-wrap gap-2 items-center overflow-hidden">
                                {selectedOptions.map(opt => (
                                    <span
                                        key={opt.value}
                                        className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium max-w-full truncate border border-blue-100"
                                    >
                                        <OptionAvatar option={opt} size="sm" />
                                        <span className="truncate">{opt.label}</span>
                                        <XIcon
                                            className="w-3 h-3 ml-1 cursor-pointer shrink-0 hover:text-blue-900"
                                            onClick={(e) => handleRemoveChip(e, opt)}
                                        />
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
                                <OptionAvatar option={selectedOptions[0]} />
                                <span className="text-sm text-gray-900 truncate">
                                    {selectedOptions[0].label}
                                </span>
                            </div>
                        )
                    ) : (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            {placeholder}
                        </div>
                    )}

                    {/* Clear button */}
                    {clearable && selectedOptions.length > 0 && !disabled && (
                        <XIcon
                            className="w-4 h-4 text-gray-400 hover:text-gray-600 shrink-0 cursor-pointer"
                            onClick={handleClear}
                        />
                    )}

                    {/* Chevron */}
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

                {/* ─── Dropdown Panel ─── */}
                {isOpen && (
                    <div className={`absolute z-[999] w-full max-h-[250px] rounded-md border border-gray-200 bg-white shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 ${dropUp ? 'bottom-full mb-1' : 'mt-1'}`}>
                        <div className="flex flex-col w-full items-start gap-2 p-2">

                            {/* Search bar */}
                            {searchable && (
                                <div className="relative w-full px-1">
                                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        ref={searchInputRef}
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        onKeyDown={(e) => { e.stopPropagation(); handleKeyDown(e); }}
                                        className="w-full h-9 pl-9 pr-3 py-1.5 rounded-md border border-gray-200 bg-gray-50 text-sm focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                                        placeholder={searchPlaceholder}
                                    />
                                </div>
                            )}

                            {/* Options list */}
                            <div ref={listRef} className="flex flex-col w-full max-h-48 overflow-y-auto scrollbar-premium">

                                {/* "All" reset option */}
                                {showAllOption && (
                                    <>
                                        <button
                                            data-dropdown-item
                                            className={`flex items-center justify-between w-full px-2 py-2 rounded-md transition text-left text-sm font-medium text-[#064771] ${highlightIndex === 0 ? 'bg-blue-50' : 'hover:bg-gray-100'}`}
                                            onClick={handleSelectAll}
                                            onMouseEnter={() => setHighlightIndex(0)}
                                        >
                                            {showAllOption}
                                        </button>
                                        <div className="w-full h-px bg-gray-100 my-1" />
                                    </>
                                )}

                                {/* Option rows */}
                                {filteredOptions.map((opt, index) => {
                                    const itemIndex = index + allOptionOffset;
                                    const selected = isSelected(opt);
                                    return (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            data-dropdown-item
                                            disabled={opt.disabled}
                                            onClick={() => handleSelect(opt)}
                                            onMouseEnter={() => setHighlightIndex(itemIndex)}
                                            className={`flex items-center w-full justify-between gap-3 py-2 px-2 rounded-md transition ${opt.disabled ? 'opacity-40 cursor-not-allowed' : ''} ${highlightIndex === itemIndex ? 'bg-blue-50' : 'hover:bg-gray-100'}`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                <OptionAvatar option={opt} />
                                                <span className="text-sm text-gray-900 truncate">
                                                    {opt.label}
                                                </span>
                                            </div>

                                            {/* Status badge */}
                                            {showStatusBadge && opt.status === 'registered' && (
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#e8f4ff] text-[#064771] rounded-full border border-[#064771] text-[10px] shrink-0">
                                                    Registered
                                                </div>
                                            )}

                                            {/* Multi-select checkbox */}
                                            {multiSelect && (
                                                <div
                                                    className={`w-5 h-5 shrink-0 flex items-center justify-center border rounded ${selected
                                                        ? 'bg-[#064771] border-[#064771] text-white'
                                                        : 'border-gray-400'
                                                        }`}
                                                >
                                                    {selected && <CheckIcon className="w-4 h-4" />}
                                                </div>
                                            )}

                                            {/* Single-select checkmark (subtle) */}
                                            {!multiSelect && selected && !showStatusBadge && (
                                                <CheckIcon className="w-4 h-4 text-[#064771] shrink-0" />
                                            )}
                                        </button>
                                    );
                                })}

                                {/* Empty state */}
                                {filteredOptions.length === 0 && (
                                    <div className="px-3 py-4 text-center text-sm text-gray-400">
                                        No results found
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }
);

VFDropdown.displayName = 'VFDropdown';
