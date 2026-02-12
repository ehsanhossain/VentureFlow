import React, { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "../../lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, leftIcon, rightIcon, error, ...props }, ref) => {
    const isDisabled = props.disabled;
    const isReadOnly = props.readOnly;

    const customBorder =
      (isDisabled || isReadOnly) && !error
        ? { border: "0.5px solid #CBD5E1" }
        : undefined;

    return (
      <div className="relative w-full">
        <input
          ref={ref}
          style={customBorder}
          className={cn(
            "w-full px-4 py-2 rounded-[3px] text-sm placeholder:text-gray-500 transition-all",
            "focus:outline-none",
            "",
            leftIcon && "pl-10",
            rightIcon && "pr-10",
            error
              ? "border border-red-500 focus:ring-1 focus:ring-red-500"
              : !isDisabled && !isReadOnly &&
              "border border-[#E2E8F0] focus:ring-1 focus:ring-[#064771] focus:border-[#064771]",
            (isDisabled || isReadOnly) && "bg-gray-200 text-gray-600",
            isDisabled && "cursor-not-allowed",
            isReadOnly && !isDisabled && "cursor-default focus:ring-0",
            className
          )}
          disabled={isDisabled}
          readOnly={isReadOnly}
          {...props}
        />
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 transform">
            {leftIcon}
          </div>
        )}
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 transform">
            {rightIcon}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
