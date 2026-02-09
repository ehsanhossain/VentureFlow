import React, { useState, useEffect, useRef } from "react";

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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsDropdownOpen(prev => !prev);
    }
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <div
        onClick={() => setIsDropdownOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        className="h-11 relative cursor-pointer"
        role="combobox"
        aria-expanded={isDropdownOpen}
        aria-haspopup="listbox"
        tabIndex={0}
        aria-labelledby="select-label"
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
          className="absolute top-full mt-1 w-full border border-gray-200 rounded-[3px] bg-white z-50 shadow-xl max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100"
          role="listbox"
        >
          <div className="p-3.5">
            {searchable && (
              <div className="flex items-center border border-[#828282] rounded px-3 py-2 mb-3">
                <svg
                  className="w-5 h-5 text-[#828282]"
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
                  className="ml-2 w-full bg-transparent outline-none text-sm" // font-poppins is inherited
                  placeholder="Search here"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  role="searchbox"
                  aria-label="Search options"
                />
              </div>
            )}

            <div className="pt-1">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <div
                    key={option.value}
                    id={`option-${option.value}`}
                    className={`flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-gray-100 transition ${value === option.value ? "bg-gray-100" : ""
                      }`}
                    role="option"
                    aria-selected={value === option.value}
                    onClick={() => handleSelect(option)}
                  >
                    {option.image && (
                      <img
                        src={option.image}
                        alt={option.label}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                    )}
                    <span className="text-sm text-black truncate"> {/* font-poppins is inherited */}
                      {option.label}
                    </span>
                  </div>
                ))
              ) : (
                <div className="px-4 py-2 text-sm text-gray-500">No results found</div> // font-poppins is inherited
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectPicker;