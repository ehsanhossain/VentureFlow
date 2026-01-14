import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, ArrowUp, ArrowDown } from 'lucide-react';

interface SortOption {
  id: string;
  label: string;
  description?: string;
}

interface SortDropdownProps {
  onSortChange: (sortBy: string, sortDirection: 'asc' | 'desc') => void;
  currentSort: string;
  currentSortDirection: 'asc' | 'desc';
}

const SortDropdown: React.FC<SortDropdownProps> = ({
  onSortChange,
  currentSort,
  currentSortDirection,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const sortOptions: SortOption[] = [
    {
      id: 'partner-name',
      label: 'Partner Name',
      description: 'PwC, Deloitte, KPMG',
    },
    {
      id: 'status',
      label: 'Status',
      description: 'Active/Inactive',
    },
    {
      id: 'country',
      label: 'Country',
      description: 'Türkiye, Singapore, US',
    },
    {
      id: 'structure',
      label: 'Structure',
      description: 'Success Fee shown',
    },
    {
      id: 'contact-person',
      label: 'Contact Person',
      description: 'Primary contact',
    },
    {
      id: 'shared-sellers',
      label: 'Number of Shared Sellers',
      description: 'Seller count',
    },
    {
      id: 'shared-buyers',
      label: 'Number of Shared Buyers',
      description: 'Buyer count',
    },
  ];

  const getCurrentSortLabel = () => {
    const option = sortOptions.find((opt) => opt.id === currentSort);
    return option ? option.label : 'Sort By';
  };

  const handleOptionClick = (optionId: string) => {
    if (optionId === currentSort) {
      onSortChange(optionId, currentSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(optionId, 'asc');
    }
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-center items-center gap-2 py-2 px-3 bg-white border border-gray-500 rounded-md h-[35px]"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="17"
          height="17"
          viewBox="0 0 17 17"
          fill="none"
        >
          <path
            d="M4.57812 8.5H12.5299"
            stroke="#30313D"
            strokeWidth="1.49096"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M2.09375 5.51953H15.0154"
            stroke="#30313D"
            strokeWidth="1.49096"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M7.0625 11.4824H10.0444"
            stroke="#30313D"
            strokeWidth="1.49096"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-gray-800 text-sm font-medium font-poppins">
          {getCurrentSortLabel()}
        </span>

        {currentSort &&
          (currentSortDirection === 'asc' ? (
            <ArrowUp className="w-4 h-4 text-gray-600" />
          ) : (
            <ArrowDown className="w-4 h-4 text-gray-600" />
          ))}
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="py-2">
            <div className="px-3 py-2 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700">Sort Options</h3>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {sortOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleOptionClick(option.id)}
                  className={`w-full px-3 py-2.5 text-left hover:bg-gray-50 transition-colors duration-150 flex items-center justify-between group ${
                    currentSort === option.id ? 'bg-blue-50 text-[#053a5c]' : 'text-gray-700'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium truncate">{option.label}</span>
                    {option.description && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{option.description}</p>
                    )}
                  </div>

                  {currentSort === option.id && (
                    <div className="flex items-center gap-2">
                      {currentSortDirection === 'asc' ? (
                        <ArrowUp className="w-4 h-4 text-[#064771] flex-shrink-0" />
                      ) : (
                        <ArrowDown className="w-4 h-4 text-[#064771] flex-shrink-0" />
                      )}
                      <Check className="w-4 h-4 text-[#064771] flex-shrink-0" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SortDropdown;

