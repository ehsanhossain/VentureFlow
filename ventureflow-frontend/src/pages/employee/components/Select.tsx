import React, { useState, useEffect, useRef, useCallback } from "react";

interface Option {
  value: string;
  label: string;
  icon?: JSX.Element;
}

interface SelectProps {
  options: Option[];
  selected: string | null;
  onChange: (value: string) => void;
}

const Select: React.FC<SelectProps> = ({ options, selected, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedOption = options.find((opt) => opt.value === selected);

  // Reset highlight when dropdown toggles
  useEffect(() => {
    if (isOpen) {
      // Pre-select the current value
      const idx = options.findIndex(opt => opt.value === selected);
      setHighlightIndex(idx >= 0 ? idx : -1);
    } else {
      setHighlightIndex(-1);
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
          const next = prev < options.length - 1 ? prev + 1 : 0;
          scrollToHighlighted(next);
          return next;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightIndex(prev => {
          const next = prev > 0 ? prev - 1 : options.length - 1;
          scrollToHighlighted(next);
          return next;
        });
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightIndex >= 0 && highlightIndex < options.length) {
          onChange(options[highlightIndex].value);
          setIsOpen(false);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  }, [isOpen, highlightIndex, options, scrollToHighlighted, onChange]);

  return (
    <div className="relative w-[182px]" ref={dropdownRef} onKeyDown={handleKeyDown}>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="w-full h-[42px] px-4 border border-gray-300 rounded-md bg-white text-gray-700 text-sm leading-5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:border-gray-400 flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          {selectedOption?.icon}
          <span>
            {selectedOption ? selectedOption.label : "Select an option"}
          </span>
        </div>

        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="15"
          height="8"
          viewBox="0 0 15 8"
          fill="none"
          className={`ml-2 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M13.2666 0.514866C13.6632 0.161711 14.3061 0.161711 14.7026 0.514866C15.0991 0.86802 15.0991 1.4406 14.7026 1.79375L8.31186 7.48538C7.91569 7.83821 7.27338 7.83821 6.87722 7.48538L0.486477 1.79375C0.0899438 1.4406 0.0899439 0.868019 0.486477 0.514865C0.88301 0.161711 1.52592 0.161711 1.92245 0.514865L7.59454 5.56646L13.2666 0.514866Z"
            fill="#30313D"
          />
        </svg>
      </button>

      {isOpen && (
        <ul ref={listRef} className="absolute w-full mt-1 bg-[#FAFAFA] border border-[#CBD5E1] rounded-[5px] shadow-lg overflow-hidden z-10">
          {options.map((option, index) => (
            <li
              key={option.value}
              data-dropdown-item
              className={`px-5 py-2 text-gray-700 text-sm transition-all cursor-pointer flex items-center gap-2 ${highlightIndex === index ? 'bg-[#DAE7EC]' : 'hover:bg-[#DAE7EC]'
                }`}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              onMouseEnter={() => setHighlightIndex(index)}
            >
              {option.icon}
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Select;
