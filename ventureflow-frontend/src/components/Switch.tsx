/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

interface SwitchProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked = false, onCheckedChange, className, ...props }, ref) => {
    const handleClick = () => {
      onCheckedChange?.(!checked);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onCheckedChange?.(!checked);
      }
    };

    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        ref={ref}
        className={cn(
          'relative inline-flex items-center shrink-0 h-[24px] w-[39px] rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-opacity-75',
          checked ? 'bg-[#064771] hover:bg-[#053a5a]' : 'bg-gray-200 hover:bg-gray-300',
          className
        )}
        {...props}
      >
        <span
          className={cn(
            'inline-block w-[20px] h-[20px] transform rounded-full bg-white transition-transform duration-200 ease-in-out shadow-sm hover:shadow-md',
            checked ? 'translate-x-[17px]' : 'translate-x-[2px]'
          )}
        />
      </button>
    );
  }
);

Switch.displayName = 'Switch';
