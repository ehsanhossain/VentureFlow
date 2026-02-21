/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

import React, { useState, useEffect, useRef } from "react";

interface ActionButtonProps {
  onExport?: () => void;
  onDelete?: () => void;
  onOpen?: () => void;
  onClose?: () => void;
  buttonText?: string;
  exportText?: string;
  deleteText?: string;
  customStyles?: {
    container?: string;
    initialButton?: string;
    openedButtonContainer?: string;
    closeButton?: string;
    dropdownToggleButton?: string;
    dropdownMenu?: string;
    dropdownExportButton?: string;
    dropdownDeleteButton?: string;
  };
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  onExport,
  onDelete,
  onOpen,
  onClose,
  buttonText = "Actions",
  exportText = "Export",
  deleteText = "Delete",
  customStyles = {}
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleOpenClick = () => {

    setIsOpen(true);
    setShowDropdown(false); // Ensure dropdown is not shown initially when opening
    if (onOpen) {
      onOpen();
    }
  };

  const handleDropdownToggle = () => {

    setShowDropdown(!showDropdown);
  };

  const handleCloseClick = () => {
   
    setIsOpen(false);
    setShowDropdown(false);
    if (onClose) {
      onClose();
    }
  };

  const handleExportClick = () => {

    const wasOpen = isOpen; // Capture current open state
    if (onExport) {
      onExport();
    }
    setShowDropdown(false);
    setIsOpen(false);
    if (onClose && wasOpen) { // Call onClose if it was open before this action
        onClose();
    }
  };

  const handleDeleteClick = () => {
  
    const wasOpen = isOpen; // Capture current open state
    if (onDelete) {
      onDelete();
    }
    setShowDropdown(false);
    setIsOpen(false);
    if (onClose && wasOpen) { // Call onClose if it was open before this action
        onClose();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        // If a click happens outside the component's container
        if (showDropdown) {
          // Only close the dropdown if it's currently shown.
          // Do not change the isOpen state here, allowing the main "opened"
          // state (with close button and actions toggle) to persist.
          setShowDropdown(false);
        }
      }
    };

    // Add event listener when the component mounts (or showDropdown changes)
    document.addEventListener("mousedown", handleClickOutside);
    
    // Clean up event listener when the component unmounts (or showDropdown changes)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [containerRef, showDropdown]); // Dependencies for the effect

  return (
    <div
      className={`relative inline-block ${customStyles.container || ''}`}
      ref={containerRef}
    >
      {!isOpen && (
        <button
          onClick={handleOpenClick}
          className={`h-[34px] px-[9px] py-[7px] bg-[#bdeafa] rounded border border-solid border-[#064771] hover:bg-[#a5e0f5] flex items-center gap-2 ${customStyles.initialButton || ''}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="21"
            height="21"
            viewBox="0 0 21 21"
            fill="none"
          >
            <path
              d="M19.7735 4.33537V6.76572C19.7735 8.79098 18.9634 9.60109 16.938 9.60109H14.5076C12.4823 9.60109 11.6721 8.79098 11.6721 6.76572V4.33537C11.6721 2.3101 12.4823 1.5 14.5076 1.5H16.938C18.9634 1.5 19.7735 2.3101 19.7735 4.33537Z"
              fill="#BDEAFA"
              stroke="#064771"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M9.87298 14.2338V16.6641C9.87298 18.6894 9.06285 19.4995 7.0375 19.4995H4.60709C2.58174 19.4995 1.77161 18.6894 1.77161 16.6641V14.2338C1.77161 12.2085 2.58174 11.3984 4.60709 11.3984H7.0375C9.06285 11.3984 9.87298 12.2085 9.87298 14.2338Z"
              fill="#BDEAFA"
              stroke="#064771"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M15.6154 9.60071V11.959C15.6154 14.3804 14.6523 15.3435 12.2308 15.3435H9.87244V14.2363C9.87244 12.2111 9.0623 11.401 7.037 11.401H5.92981V9.04264C5.92981 6.62134 6.89297 5.6582 9.31435 5.6582H11.6727V6.76536C11.6727 8.79061 12.4829 9.60071 14.5082 9.60071H15.6154Z"
              fill="#BDEAFA"
              stroke="#064771"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="font-medium text-[#064771] text-sm ">{buttonText}</span>
        </button>
      )}

      {isOpen && (
        <div className={`flex items-center ${customStyles.openedButtonContainer || ''}`}>
          {!showDropdown && (
            <button
              onClick={handleCloseClick}
              className={`w-[34px] h-[34px] p-[7px] bg-white rounded-l border-y border-l border-solid border-[#064771] flex items-center justify-center hover:bg-gray-100 ${customStyles.closeButton || ''}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="21"
                height="21"
                viewBox="0 0 21 21"
                fill="none"
              >
                <path
                  d="M8.22461 13.0471L13.3186 7.95312"
                  stroke="#292D32"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M13.3186 13.0471L8.22461 7.95312"
                  stroke="#292D32"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M8.07161 19.5H13.4716C17.9716 19.5 19.7716 17.7 19.7716 13.2V7.8C19.7716 3.3 17.9716 1.5 13.4716 1.5H8.07161C3.57161 1.5 1.77161 3.3 1.77161 7.8V13.2C1.77161 17.7 3.57161 19.5 8.07161 19.5Z"
                  stroke="#292D32"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}

          <button
            onClick={handleDropdownToggle}
            className={`w-[115px] h-[35px] px-[9px] py-[7px] bg-[#064771] text-white hover:bg-[#053a5a] flex items-center justify-between border-solid border-[#064771] ${customStyles.dropdownToggleButton || ''} ${
              showDropdown
                ? 'rounded border' // Fully rounded when dropdown is shown
                : !showDropdown && isOpen ? 'rounded-r border-t border-r border-b' : 'rounded border' // Adjust based on whether close button is shown or not
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 21 21" fill="none">
              <path d="M19.7735 4.33537V6.76572C19.7735 8.79098 18.9634 9.60109 16.938 9.60109H14.5076C12.4823 9.60109 11.6721 8.79098 11.6721 6.76572V4.33537C11.6721 2.3101 12.4823 1.5 14.5076 1.5H16.938C18.9634 1.5 19.7735 2.3101 19.7735 4.33537Z" fill="#BDEAFA" stroke="#064771" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9.87298 14.2338V16.6641C9.87298 18.6894 9.06285 19.4995 7.0375 19.4995H4.60709C2.58174 19.4995 1.77161 18.6894 1.77161 16.6641V14.2338C1.77161 12.2085 2.58174 11.3984 4.60709 11.3984H7.0375C9.06285 11.3984 9.87298 12.2085 9.87298 14.2338Z" fill="#BDEAFA" stroke="#064771" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15.6154 9.60071V11.959C15.6154 14.3804 14.6523 15.3435 12.2308 15.3435H9.87244V14.2363C9.87244 12.2111 9.0623 11.401 7.037 11.401H5.92981V9.04264C5.92981 6.62134 6.89297 5.6582 9.31435 5.6582H11.6727V6.76536C11.6727 8.79061 12.4829 9.60071 14.5082 9.60071H15.6154Z" fill="white" stroke="#064771" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="font-semibold text-sm ">{buttonText}</span>
            <svg
              width="12"
              height="6"
              viewBox="0 0 12 6"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={`transform transition-transform ${
                showDropdown ? "rotate-180" : ""
              }`}
            >
              <path
                d="M1 1L6 5L11 1"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      )}

      {showDropdown && isOpen && ( // Dropdown menu is shown only if isOpen and showDropdown are true
        <div
          className={`absolute top-[40px] left-1/2 transform -translate-x-1/2 w-[120px] bg-white rounded-[5px] shadow-[0px_1px_2px_-1px_rgba(16,24,40,0.1),0px_1px_3px_0px_rgba(16,24,40,0.1)] py-2.5 px-4 z-10 ${customStyles.dropdownMenu || ''}`}
        >
          <div className="flex flex-col gap-4">
            {onExport && (
              <button
                onClick={handleExportClick}
                className={`flex items-center gap-2 hover:bg-gray-50 w-full justify-center py-1 ${customStyles.dropdownExportButton || ''}`}
              >
                <span className="font-medium text-gray-900 text-base">
                  {exportText}
                </span>
              </button>
            )}
            {onDelete && (
              <button
                onClick={handleDeleteClick}
                className={`flex items-center gap-2 hover:bg-gray-50 w-full justify-center py-1 ${customStyles.dropdownDeleteButton || ''}`}
              >
                <span className="font-medium text-[#eb1c41] text-base">
                  {deleteText}
                </span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};