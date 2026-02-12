import React from "react";

export interface RadioOption {
  id: string;
  label: string;
}

interface RadioGroupProps {
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  options,
  value,
  onChange,
  className = "",
}) => {
  const getOptionStyles = (isSelected: boolean) => {
    return `h-8 pl-[5px] pr-3 py-[7px] rounded-2xl border border-solid flex items-center ${
      isSelected
        ? "bg-[#0c5577] border-[#0c5577]"
        : "border-[#0c5577] text-[#0c5577]"
    }`;
  };

  return (
    <div className={`flex gap-[13px] ${className}`}>
      {options.map((option) => {
        const isSelected = option.id === value;

        return (
          <button
            type="button"
            key={option.id}
            onClick={() => onChange(option.id)}
            className={getOptionStyles(isSelected)}
          >
            <div
              className={`w-6 h-6 rounded-[61px] border border-solid mr-1.5 relative ${
                isSelected
                  ? "bg-white border-white"
                  : "bg-gray-100 border-[#0c5577]"
              }`}
            >
              {isSelected && (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="absolute left-1 top-1"
                >
                  <path
                    d="M13.3332 4L5.99984 11.3333L2.6665 8"
                    stroke="#0c5577"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <span
              className={` text-sm tracking-[0.10px] leading-5 ${
                isSelected ? "text-white font-semibold" : "font-normal"
              }`}
            >
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
