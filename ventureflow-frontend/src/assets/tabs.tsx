/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

import React from "react";

type Tab = {
  id: string;
  label: string;
  count?: number; 
  activeIcon: JSX.Element;
  inactiveIcon: JSX.Element;
};

type TabsProps = {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
};

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="flex w-full flex-wrap gap-y-2 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className="flex flex-col min-w-[150px] sm:min-w-0 sm:w-[198px] h-[41px] items-center justify-between pt-2.5 pb-0 px-0 relative bg-white"
        >
          <div className="flex items-center w-full">
            {/* Left Spacer */}
            <div className="w-6" />

            {/* Icon */}
            <div className="flex items-center justify-center mr-2">
              {activeTab === tab.id ? tab.activeIcon : tab.inactiveIcon}
            </div>

            {/* Label */}
            <div
              className={` ${
                activeTab === tab.id
                  ? "font-semibold text-[#064771]"
                  : "font-medium text-gray-500"
              } text-sm tracking-[0] leading-5 whitespace-nowrap`}
            >
              {tab.label}
            </div>

            {/* Count (optional) */}
            {typeof tab.count === "number" && tab.count > 0 && (
              <div
                className={`ml-2 inline-flex h-6 items-center justify-center px-2 py-0 ${
                  activeTab === tab.id
                    ? "bg-[#e4f7ff] text-[#064771] rounded-3xl"
                    : "text-gray-600"
                } font-medium text-sm`}
              >
                {tab.count}
              </div>
            )}

            {/* Right Spacer */}
            <div className="w-6" />
          </div>

          {/* Bottom border */}
          <div
            className={`relative self-stretch w-full h-0.5 ${
              activeTab === tab.id ? "bg-[#064771]" : "bg-gray-200"
            }`}
          />
        </button>
      ))}
    </div>
  );
};
