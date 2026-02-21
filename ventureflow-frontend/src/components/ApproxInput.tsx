/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

import React, { useState, useEffect, useMemo, forwardRef, ChangeEvent } from "react";

interface ApproxInputProps {
  name?: string;
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  defaultOperator?: string;
  operators?: string[];
  placeholder?: string;
  inputClassName?: string;
  dropdownClassName?: string;
  dropdownButtonClassName?: string;
  dropdownItemClassName?: string;
  containerClassName?: string;
}

export const ApproxInput = forwardRef<HTMLInputElement, ApproxInputProps>(
  (
    {
      name,
      value: controlledValue,
      onChange: RHFOnChange,
      onBlur: RHFOnBlur,
      defaultOperator: propDefaultOperator = "=",
      operators: propOperators = ["=", ">", "<", "~"],
      placeholder = "e.g., 54%",
      inputClassName = "flex-1 h-[34px] border-0 outline-none text-gray-500 text-sm leading-5 focus:ring-0",
      dropdownClassName = "absolute top-full left-0 mt-1 w-[60px] bg-white border border-gray-200 rounded-[5px] shadow-lg z-10",
      dropdownButtonClassName = "flex items-center justify-between w-[60px] h-[34px] bg-[#064771] rounded px-3",
      dropdownItemClassName = "w-full text-center px-2 py-2 hover:bg-gray-50",
      containerClassName = "flex w-full h-10 items-center gap-2 bg-white rounded-[5px] border-[0.5px] border-solid border-gray-300 px-1",
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);

    const { derivedOperator, derivedInputValue } = useMemo(() => {
      const actualOperators = propOperators;
      const operatorToUseAsDefault =
        propDefaultOperator || actualOperators[0] || "=";

      if (typeof controlledValue === "string") {
        const foundOperator = actualOperators.find((o) =>
          controlledValue.startsWith(o)
        );

        if (foundOperator && controlledValue.length >= foundOperator.length) {
          return {
            derivedOperator: foundOperator,
            derivedInputValue: controlledValue.substring(foundOperator.length),
          };
        }
        return {
          derivedOperator: operatorToUseAsDefault,
          derivedInputValue: controlledValue,
        };
      }

      return {
        derivedOperator: operatorToUseAsDefault,
        derivedInputValue: "",
      };
    }, [controlledValue, propOperators, propDefaultOperator]);

    const [selectedOperator, setSelectedOperator] = useState(derivedOperator);
    const [inputValue, setInputValue] = useState(derivedInputValue);

    useEffect(() => {
      setSelectedOperator(derivedOperator);
      setInputValue(derivedInputValue);
    }, [derivedOperator, derivedInputValue]);

    const handleOperatorChange = (op: string) => {
      setSelectedOperator(op);
      setIsOpen(false);

      if (RHFOnChange) {
        RHFOnChange(`${op}${inputValue}`);
      }
    };

    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
      const newInputValue = event.target.value;
      setInputValue(newInputValue);

      if (RHFOnChange) {
        RHFOnChange(`${selectedOperator}${newInputValue}`);
      }
    };

    const toggleDropdown = () => setIsOpen(!isOpen);

    return (
      <div className={containerClassName}>
        <div className="relative">
          <button
            type="button"
            onClick={toggleDropdown}
            className={dropdownButtonClassName}
            aria-haspopup="true"
            aria-expanded={isOpen}
          >
            <span className="text-white text-[22px] leading-[27.5px]">
              {selectedOperator}
            </span>
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
              aria-hidden="true"
            >
              <path
                d="M1 3L5 7L9 3"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>

          {isOpen && (
            <div className={dropdownClassName} role="menu">
              {propOperators.map((op) => (
                <button
                  type="button"
                  key={op}
                  role="menuitem"
                  className={dropdownItemClassName}
                  onClick={() => handleOperatorChange(op)}
                >
                  <span className="text-[22px] text-[#064771]">{op}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <input
          type="text"
          name={name}
          ref={ref}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={RHFOnBlur}
          className={inputClassName}
          placeholder={placeholder}
        />
      </div>
    );
  }
);

ApproxInput.displayName = "ApproxInput";
