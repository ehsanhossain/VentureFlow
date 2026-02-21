/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

import React from "react";

interface TabProps {
  activeSvg: React.ReactNode;
  inactiveSvg: React.ReactNode;
  text: string;
  count?: number;
  isActive: boolean;
  onClick: () => void; // Handle tab click
}

const Tab: React.FC<TabProps> = ({
  activeSvg,
  inactiveSvg,
  text,
  count,
  isActive,
  onClick,
}) => {
  return (
    <div
      className={`flex flex-col justify-between items-center px-0 pt-[10px] min-w-[200px] h-[40px] cursor-pointer transition-all duration-300 ease-in-out ${
        isActive ? "bg-white" : "bg-transparent"
      } text-sm`}
      onClick={onClick}
    >
      <div className="flex items-center gap-1.5 pb-1">
        {isActive ? activeSvg : inactiveSvg}
        <div
          className={`text-center font-semibold leading-5 ${
            isActive ? "text-[#064771]" : "text-gray-500"
          }`}
        >
          {text}
        </div>
        {count !== undefined && (
          <div className="flex items-start">
            <div className="flex justify-center items-center px-1.5 h-6 rounded-full bg-[#e4f8ff]">
              <div className="text-[#064771] text-sm font-medium leading-5">
                {count}
              </div>
            </div>
          </div>
        )}
      </div>
      <div
        className={`w-full h-0.5 ${isActive ? "bg-[#064771]" : "bg-[#B0B3B8]"}`}
      />
    </div>
  );
};

export default Tab;
