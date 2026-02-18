import React, { useState, useEffect } from 'react';

interface SelectPickerProps {
  options: string[];
  placeholder?: string;
  onSelect: (selectedOption: string) => void;
  icon?: React.ReactNode;
  searchable?: boolean;
}

const SelectPicker: React.FC<SelectPickerProps> = ({
  options,
  placeholder = 'Select an option',
  onSelect,
  icon,
  searchable = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Persist selected option in sessionStorage
  useEffect(() => {
    const storedOption = sessionStorage.getItem('selectedOption');
    if (storedOption) {
      setSelectedOption(storedOption);
    }
  }, []);

  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (option: string) => {
    setSelectedOption(option);
    sessionStorage.setItem('selectedOption', option); // Store the selected option in sessionStorage
    setSearchTerm('');
    setIsOpen(false);
    onSelect(option);
  };

  return (
    <div className="relative w-full">
      <div
        className="flex justify-between items-center bg-white border border-gray-300 rounded-md h-[40px] cursor-pointer px-4 w-full"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          {icon && <div className="w-6 h-6">{icon}</div>}
          <span className="text-sm font-medium text-gray-600">{selectedOption || placeholder}</span>
        </div>
        <svg
          className={`transform ${isOpen ? 'rotate-180' : 'rotate-0'} transition-transform`}
          width="15"
          height="8"
          viewBox="0 0 15 8"
          fill="none"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M13.2666 0.514866C13.6632 0.161711 14.3061 0.161711 14.7026 0.514866C15.0991 0.86802 15.0991 1.4406 14.7026 1.79375L8.31186 7.48538C7.91569 7.83821 7.27338 7.83821 6.87722 7.48538L0.486477 1.79375C0.0899438 1.4406 0.0899439 0.868019 0.486477 0.514865C0.88301 0.161711 1.52592 0.161711 1.92245 0.514865L7.59454 5.56646L13.2666 0.514866Z"
            fill="#30313D"
          />
        </svg>
      </div>

      {isOpen && (
        <div
          className="absolute left-0 w-full mt-1 bg-white border border-gray-300 shadow-lg rounded-md max-h-40 overflow-y-auto z-50 scrollbar-premium"
        >
          {searchable && (
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="w-full px-4 py-2 border-b border-gray-300 focus:outline-none"
            />
          )}
          <ul className="max-h-40 overflow-y-auto scrollbar-premium">
            {filteredOptions.map((option, index) => (
              <li
                key={index}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleSelect(option)}
              >
                {option}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SelectPicker;
