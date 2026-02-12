import React, { useState } from "react";

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

  const selectedOption = options.find((opt) => opt.value === selected);

  return (
    <div className="relative w-[182px] ">

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
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
          className="ml-2"
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
        <ul className="absolute w-full mt-1 bg-[#FAFAFA] border border-[#CBD5E1] rounded-[5px] shadow-lg overflow-hidden z-10">
          {options.map((option) => (
            <li
              key={option.value}
              className="px-5 py-2 text-gray-700 text-sm hover:bg-[#DAE7EC] transition-all cursor-pointer flex items-center gap-2"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
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
