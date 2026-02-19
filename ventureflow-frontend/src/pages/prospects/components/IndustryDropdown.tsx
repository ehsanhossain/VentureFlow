
import { useState, useRef, useEffect, useCallback } from 'react';
import { SearchIcon, CheckIcon, XIcon } from 'lucide-react';

export interface Industry {
    id: number;
    name: string;
    status?: string;
    sub_industries?: Industry[];
    [key: string]: unknown;
}

type DropdownProps = {
    industries: Industry[];
    selected?: Industry | Industry[] | null;
    onSelect: (industry: Industry | Industry[]) => void;
    multiSelect?: boolean;
    placeholder?: string;
};

export const IndustryDropdown = ({
    industries,
    selected,
    onSelect,
    multiSelect = false,
    placeholder,
}: DropdownProps): JSX.Element => {
    const [search, setSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [highlightIndex, setHighlightIndex] = useState(-1);
    const [selectedIndustries, setSelectedIndustries] = useState<Industry[]>(() => {
        if (Array.isArray(selected)) {
            return selected.filter((item): item is Industry => item !== null && item !== undefined);
        }
        return selected ? [selected] : [];
    });
    const dropdownRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (selected) {
            if (Array.isArray(selected)) {
                setSelectedIndustries(
                    selected.filter((item): item is Industry => item !== null && item !== undefined)
                );
            } else {
                setSelectedIndustries([selected]);
            }
        } else {
            setSelectedIndustries([]);
        }
    }, [selected]);

    const filteredIndustries = industries
        .filter(
            (industry): industry is Industry =>
                industry !== null && industry !== undefined && typeof industry.name === 'string'
        )
        .filter((industry) => industry.name.toLowerCase().includes(search.toLowerCase()));

    // Reset highlight when search changes or dropdown toggles
    useEffect(() => {
        setHighlightIndex(-1);
    }, [search, isOpen]);

    const handleSelect = (industry: Industry) => {
        if (multiSelect) {
            const exists = selectedIndustries.some((i) => i.id === industry.id);
            const newSelected = exists
                ? selectedIndustries.filter((i) => i.id !== industry.id)
                : [...selectedIndustries, industry];
            setSelectedIndustries(newSelected);
            onSelect(newSelected);
        } else {
            setSelectedIndustries([industry]);
            setIsOpen(false);
            onSelect(industry);
        }
    };

    // Scroll highlighted item into view
    const scrollToHighlighted = useCallback((index: number) => {
        if (!listRef.current) return;
        const items = listRef.current.querySelectorAll('[data-dropdown-item]');
        if (items[index]) {
            items[index].scrollIntoView({ block: 'nearest' });
        }
    }, []);

    // Keyboard navigation handler
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (!isOpen) {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsOpen(true);
            }
            return;
        }

        // Check if we have a "add new" option visible (no exact match + search has text)
        const hasAddNewOption = search.trim() && !filteredIndustries.some(i => i.name.toLowerCase() === search.toLowerCase().trim());
        const totalItems = filteredIndustries.length + (hasAddNewOption ? 1 : 0);

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
                if (highlightIndex >= 0 && highlightIndex < filteredIndustries.length) {
                    handleSelect(filteredIndustries[highlightIndex]);
                } else if (highlightIndex === filteredIndustries.length && hasAddNewOption) {
                    // Select the "add new" option
                    const newInd = { id: Date.now(), name: search.trim(), status: 'new' };
                    handleSelect(newInd);
                    setSearch('');
                } else if (search.trim() && hasAddNewOption) {
                    // Enter on search with no highlight — add new
                    const newInd = { id: Date.now(), name: search.trim(), status: 'new' };
                    handleSelect(newInd);
                    setSearch('');
                }
                break;
            case 'Escape':
                e.preventDefault();
                setIsOpen(false);
                break;
        }
    }, [isOpen, highlightIndex, filteredIndustries, search, scrollToHighlighted]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const isSelected = (industry: Industry) => selectedIndustries.some((i) => i.id === industry.id);

    return (
        <div className="relative w-full" ref={dropdownRef} onKeyDown={handleKeyDown}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen ? "true" : "false"}
                className="flex w-full min-h-[44px] items-center gap-2 px-4 py-2 rounded-[3px] border border-gray-300 bg-white focus:outline-none flex-wrap overflow-hidden"
            >
                {selectedIndustries.length > 0 ? (
                    multiSelect ? (
                        <div className="flex flex-wrap gap-2 items-center overflow-hidden">
                            {selectedIndustries.map((industry) => (
                                <span
                                    key={industry.id.toString()}
                                    className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-900 max-w-full truncate"
                                >
                                    <span className="truncate">{industry.name}</span>
                                    <XIcon
                                        className="w-3 h-3 ml-1 cursor-pointer shrink-0"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSelect(industry);
                                        }}
                                    />
                                </span>
                            ))}
                        </div>
                    ) : (
                        <span className="text-sm text-gray-900 truncate">{selectedIndustries[0]?.name}</span>
                    )
                ) : (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        {placeholder || (multiSelect ? 'Select industries' : 'Select an industry')}
                    </div>

                )}
                <svg
                    className={`w-4 h-4 ml-auto text-gray-400 transform transition-transform ${isOpen ? 'rotate-180' : 'rotate-0'
                        }`}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute z-50 mt-1 w-full max-h-[80vh] rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex flex-col w-full p-3 gap-3">
                        <div className="relative w-full">
                            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => { e.stopPropagation(); handleKeyDown(e); }}
                                className="w-full h-10 pl-10 pr-3 py-2 rounded-[3px] border border-gray-200 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#064771]/10 focus:border-[#064771] transition-all"
                                placeholder="Search or type to add industry..."
                                autoFocus
                            />
                        </div>

                        <div ref={listRef} className="flex flex-col w-full max-h-60 overflow-y-auto overflow-x-hidden scrollbar-premium">
                            {filteredIndustries.length > 0 ? (
                                filteredIndustries.map((industry, index) => (
                                    <button
                                        key={industry.id.toString()}
                                        type="button"
                                        data-dropdown-item
                                        onClick={() => handleSelect(industry)}
                                        onMouseEnter={() => setHighlightIndex(index)}
                                        className={`flex items-center w-full justify-start gap-3 py-2.5 px-3 rounded-lg transition-colors group min-w-0 ${highlightIndex === index ? 'bg-blue-50' : 'hover:bg-gray-50'
                                            }`}
                                    >
                                        {multiSelect && (
                                            <div
                                                className={`w-5 h-5 shrink-0 flex items-center justify-center border rounded-md transition-all ${isSelected(industry)
                                                    ? 'bg-[#064771] border-[#064771] text-white'
                                                    : 'border-gray-300 group-hover:border-[#064771]'
                                                    }`}
                                            >
                                                {isSelected(industry) && <CheckIcon className="w-3.5 h-3.5" />}
                                            </div>
                                        )}
                                        <span className={`text-sm truncate min-w-0 ${isSelected(industry) ? 'text-[#064771] font-medium' : 'text-gray-600'}`}>
                                            {industry.name}
                                        </span>
                                    </button>
                                ))
                            ) : search.trim() ? (
                                <button
                                    type="button"
                                    data-dropdown-item
                                    onClick={() => {
                                        const newInd = { id: Date.now(), name: search.trim(), status: 'new' };
                                        handleSelect(newInd);
                                        setSearch('');
                                    }}
                                    onMouseEnter={() => setHighlightIndex(filteredIndustries.length)}
                                    className={`flex items-center w-full justify-start gap-3 py-3 px-3 rounded-lg border border-dashed border-[#064771]/30 text-[#064771] transition-all ${highlightIndex === filteredIndustries.length ? 'bg-[#F1FBFF]' : 'hover:bg-[#F1FBFF]'
                                        }`}
                                >
                                    <PlusIcon className="w-4 h-4" />
                                    <span className="text-sm font-medium">Add &quot;{search}&quot; as new industry</span>
                                </button>
                            ) : (
                                <div className="py-8 text-center text-gray-400 text-sm">
                                    Start typing to find industries
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const PlusIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);
