/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

import React from 'react';

interface InputFieldProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  type?: string;
}

const InputField: React.FC<InputFieldProps> = ({ value, onChange, placeholder = '', icon, type = 'text' }) => {
  return (
    <div className="flex items-center gap-3 p-[10px_20px_10px_20px] bg-white border border-gray-300 rounded-md w-full sm:w-80 md:w-96 lg:w-[500px]">
      {icon && (
        <div className="flex justify-start items-center">
          {icon}
        </div>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-transparent text-gray-600 text-sm font-medium outline-none placeholder-gray-400 max-h-10 pl-2 pr-2"
      />
    </div>
  );
};

export default InputField;
