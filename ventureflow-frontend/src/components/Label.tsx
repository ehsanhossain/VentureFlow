import React from 'react';

interface LabelProps {
  text: string;
  required?: boolean;
}

const Label: React.FC<LabelProps> = ({ text, required = false }) => {
  return (
    <div className="flex items-center pt-7">
      {required && (
        <span className="text-[#EC1D42] text-base font-sf-pro-display font-medium leading-[19.29px] mr-1">
          *
        </span>
      )}
      <span className="text-gray-900 text-base font-medium leading-[19.29px]">
        {text}
      </span>
    </div>
  );
};

export default Label;
