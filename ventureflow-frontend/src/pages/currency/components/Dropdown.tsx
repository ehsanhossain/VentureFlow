/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect, useCallback } from "react";
import { SearchIcon } from "lucide-react";

export interface Country {
  id: number;
  name: string;
  flagSrc: string;
  status: "registered" | "unregistered";
  alpha_2_code?: string;
}

type DropdownProps = {
  countries: Country[];
  selected?: Country | Country[] | null;
  onSelect?: (country: Country) => void;
  onSelectMultiple?: (countries: Country[]) => void;
  placeholder?: string;
  isMulti?: boolean;
};

export const Dropdown = ({
  countries,
  selected,
  onSelect,
  onSelectMultiple,
  placeholder,
  isMulti = false,
}: DropdownProps): JSX.Element => {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [selectedCountries, setSelectedCountries] = useState<Country[]>(
    Array.isArray(selected) ? selected : selected ? [selected] : []
  );
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSelectedCountries(Array.isArray(selected) ? selected : selected ? [selected] : []);
  }, [selected]);

  const filteredCountries = countries.filter((country) =>
    country.name.toLowerCase().includes(search.toLowerCase())
  );

  // "All Countries" is index 0, then countries start at index 1
  const totalItems = filteredCountries.length + 1; // +1 for "All Countries"

  // Reset highlight when search changes or dropdown toggles
  useEffect(() => {
    setHighlightIndex(-1);
  }, [search, isOpen]);

  // Auto-focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (country: Country | 'all') => {
    if (country === 'all') {
      setSelectedCountries([]);
      setIsOpen(false);
      if (isMulti) {
        onSelectMultiple?.([]);
      } else {
        onSelect?.(null as any);
      }
      return;
    }

    if (isMulti) {
      const isAlreadySelected = selectedCountries.some(c => c.id === country.id);
      let newSelection: Country[];
      if (isAlreadySelected) {
        newSelection = selectedCountries.filter(c => c.id !== country.id);
      } else {
        newSelection = [...selectedCountries, country];
      }
      setSelectedCountries(newSelection);
      onSelectMultiple?.(newSelection);
    } else {
      setSelectedCountries([country]);
      setIsOpen(false);
      onSelect?.(country);
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
        if (highlightIndex === 0) {
          handleSelect('all');
        } else if (highlightIndex > 0 && highlightIndex <= filteredCountries.length) {
          handleSelect(filteredCountries[highlightIndex - 1]); // -1 because index 0 is "All Countries"
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  }, [isOpen, highlightIndex, filteredCountries, totalItems, scrollToHighlighted]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative w-full max-w-md mx-auto" ref={dropdownRef} onKeyDown={handleKeyDown}>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen ? "true" : "false"}
        aria-haspopup="listbox"
        className="flex w-full h-10 items-center gap-2 px-4 sm:px-5 py-2 rounded-[3px] border border-gray-300 bg-white focus:outline-none"
      >
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap max-w-[calc(100%-24px)]">
            {selectedCountries.length > 0 ? (
              isMulti ? (
                selectedCountries.map(c => (
                  <div key={c.id} className="flex items-center gap-1 bg-blue-50 text-[#064771] px-2 py-0.5 rounded text-xs border border-blue-200">
                    <img src={c.flagSrc} alt="" className="w-3 h-3 rounded-full object-cover" />
                    <span>{c.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(c);
                      }}
                      className="hover:text-red-500 ml-1"
                    >
                      ×
                    </button>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-3">
                  <img
                    className="w-6 h-6 sm:w-[26px] sm:h-[26px] rounded-full object-cover"
                    alt="Selected country flag"
                    src={selectedCountries[0].flagSrc}
                  />
                  <span className="text-sm text-gray-900 font-normal truncate">
                    {selectedCountries[0].name}
                  </span>
                </div>
              )
            ) : (
              <span className="text-sm text-gray-400 font-normal">
                {placeholder || 'Select Country'}
              </span>
            )}
          </div>
          <svg
            className={`w-4 h-4 text-gray-400 shrink-0 transform transition-transform ${isOpen ? "rotate-180" : "rotate-0"
              }`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full max-h-[80vh] rounded-[3px] border border-t-0 border-gray-300 bg-white overflow-hidden shadow-lg">
          <div className="flex flex-col w-full items-start gap-4 px-4 py-3">

            <div className="relative w-full">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                ref={searchInputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => { e.stopPropagation(); handleKeyDown(e); }}
                className="w-full h-9 pl-10 pr-3 py-2 rounded-[3px] border border-[#828282] text-sm placeholder:text-gray-500 focus:outline-none"
                placeholder="Search Here"
              />
            </div>


            <div ref={listRef} className="w-full max-h-[60vh] overflow-y-auto pr-1.5 scrollbar-premium">
              <div className="flex flex-col w-full items-start gap-1">
                <button
                  data-dropdown-item
                  className={`flex items-center justify-between w-full px-3 py-2 rounded-[3px] transition text-left text-sm font-medium text-[#064771] ${highlightIndex === 0 ? 'bg-blue-50' : 'hover:bg-gray-100'
                    }`}
                  onClick={() => handleSelect('all')}
                  onMouseEnter={() => setHighlightIndex(0)}
                >
                  All Countries
                </button>
                <div className="w-full h-px bg-gray-100 my-1" />
                {filteredCountries.map((country, index) => {
                  const itemIndex = index + 1; // +1 because "All Countries" is at index 0
                  const isSelected = selectedCountries.some(c => c.id === country.id);
                  return (
                    <button
                      key={country.id.toString()}
                      data-dropdown-item
                      className={`flex items-center justify-between w-full px-3 py-2 rounded-[3px] transition text-left ${highlightIndex === itemIndex ? 'bg-blue-50' : isSelected ? 'bg-blue-50' : 'hover:bg-gray-100'
                        }`}
                      onClick={() => handleSelect(country)}
                      onMouseEnter={() => setHighlightIndex(itemIndex)}
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          className="w-5 h-5 rounded-full object-cover"
                          alt={`${country.name} flag`}
                          src={country.flagSrc}
                        />
                        <span className={`text-sm ${isSelected ? 'text-[#064771] font-medium' : 'text-gray-900'}`}>
                          {country.name}
                        </span>
                      </div>

                      {isMulti && isSelected && (
                        <div className="w-4 h-4 flex items-center justify-center bg-[#064771] rounded text-white text-[10px]">
                          ✓
                        </div>
                      )}

                      {!isMulti && country.status === "registered" && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#e8f4ff] text-[#064771] rounded-full border border-[#064771] text-[10px]">
                          Registered
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
