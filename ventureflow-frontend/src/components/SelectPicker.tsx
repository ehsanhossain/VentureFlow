/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

import React, { useState, useEffect, useRef, useCallback } from "react";

interface Option {
  label: string;
  value: string;
  image?: string;
}

interface SelectPickerProps {
  options: Option[];
  value?: string | null | undefined;
  placeholder?: string;
  icon?: React.ReactNode;
  searchable?: boolean;
  onChange: (value: string | null) => void;
}

const SelectPicker: React.FC<SelectPickerProps> = ({
  options,
  value,
  placeholder = "Select an option",
  icon,
  searchable = true,
  onChange,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-focus search input when dropdown opens
  useEffect(() => {
    if (isDropdownOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isDropdownOpen]);

  // Reset highlight when search changes or dropdown toggles
  useEffect(() => {
    setHighlightIndex(-1);
  }, [searchTerm, isDropdownOpen]);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = options.filter(
    (option) =>
      option.label &&
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (option: Option) => {
    onChange(option.value);
    setIsDropdownOpen(false);
    setSearchTerm("");
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
    if (!isDropdownOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsDropdownOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightIndex(prev => {
          const next = prev < filteredOptions.length - 1 ? prev + 1 : 0;
          scrollToHighlighted(next);
          return next;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightIndex(prev => {
          const next = prev > 0 ? prev - 1 : filteredOptions.length - 1;
          scrollToHighlighted(next);
          return next;
        });
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightIndex >= 0 && highlightIndex < filteredOptions.length) {
          handleSelect(filteredOptions[highlightIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsDropdownOpen(false);
        break;
    }
  }, [isDropdownOpen, highlightIndex, filteredOptions, scrollToHighlighted]);

  return (
    <div className="relative w-full" ref={containerRef} onKeyDown={handleKeyDown}>
      <div
        onClick={() => setIsDropdownOpen((prev) => !prev)}
        className="h-11 relative cursor-pointer"
        role="combobox"
        aria-expanded={isDropdownOpen ? "true" : "false"}
        aria-haspopup="listbox"
        aria-controls="select-picker-listbox"
        tabIndex={0}
        title={placeholder}
        aria-label={placeholder}
        aria-activedescendant={selectedOption ? `option-${selectedOption.value}` : undefined}
      >
        {icon && (
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
            {icon}
          </div>
        )}

        <div
          className={`w-full h-full flex items-center ${icon ? "pl-10 pr-10" : "px-3"
            } border border-gray-300 rounded-[3px] bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-colors`}
        >
          {selectedOption?.image && (
            <img
              src={selectedOption.image}
              alt="Selected"
              className="w-5 h-5 rounded-full mr-2 object-cover"
            />
          )}
          <span className={`truncate text-sm ${selectedOption ? 'text-gray-900' : 'text-gray-500'}`}>
            {selectedOption?.label || placeholder}
          </span>
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? "transform rotate-180" : ""
                }`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
      </div>

      {isDropdownOpen && (
        <div
          className="absolute top-full mt-1 w-full border border-gray-200 rounded-[3px] bg-white z-50 shadow-xl max-h-60 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
          id="select-picker-listbox"
        >
          <div className="p-3.5">
            {searchable && (
              <div className="flex items-center border border-[#828282] rounded px-3 py-2 mb-3">
                <svg
                  className="w-5 h-5 text-gray-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  ref={searchRef}
                  className="ml-2 w-full bg-transparent outline-none text-sm"
                  placeholder="Search here"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => { e.stopPropagation(); handleKeyDown(e); }}
                  aria-label="Search options"
                  title="Search options"
                />
              </div>
            )}
            <div ref={listRef} role="listbox" aria-label={placeholder} className="overflow-y-auto max-h-[180px] scrollbar-premium">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option, index) => (
                  <div
                    key={option.value}
                    id={`option-${option.value}`}
                    data-dropdown-item
                    className={`flex items-center gap-2 px-4 py-2 cursor-pointer transition ${highlightIndex === index
                      ? "bg-blue-50"
                      : value === option.value
                        ? "bg-gray-100"
                        : "hover:bg-gray-100"
                      }`}
                    role="option"
                    aria-selected={value === option.value ? "true" : "false"}
                    onClick={() => handleSelect(option)}
                    onMouseEnter={() => setHighlightIndex(index)}
                  >
                    {option.image && (
                      <img
                        src={option.image}
                        alt={option.label}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                    )}
                    <span className="text-sm text-black truncate">
                      {option.label}
                    </span>
                  </div>
                ))
              ) : (
                <div className="px-4 py-2 text-sm text-gray-500">No results found</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectPicker;