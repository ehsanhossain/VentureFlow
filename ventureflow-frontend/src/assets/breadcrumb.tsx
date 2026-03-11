/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

type BreadcrumbLink = {
  label: string;
  url: string;
  isCurrentPage?: boolean;
};

type BreadcrumbProps = {
  links: BreadcrumbLink[];
  /** Max visible links before middle items collapse into "..." (default: 3) */
  maxVisible?: number;
};

const BreadcrumbItem: React.FC<{
  link: BreadcrumbLink;
  showSeparator: boolean;
  onNavigate: (url: string) => void;
}> = ({ link, showSeparator, onNavigate }) => (
  <div className="flex items-start">
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center">
        <div
          className={`flex items-start gap-1 text-sm font-semibold leading-5 ${link.isCurrentPage
              ? "text-gray-500"
              : "text-[#064771] underline cursor-pointer"
            } whitespace-nowrap`}
          onClick={
            !link.isCurrentPage ? () => onNavigate(link.url) : undefined
          }
          role={!link.isCurrentPage ? "link" : undefined}
          tabIndex={!link.isCurrentPage ? 0 : undefined}
          onKeyDown={
            !link.isCurrentPage
              ? (e) => {
                if (e.key === "Enter" || e.key === " ")
                  onNavigate(link.url);
              }
              : undefined
          }
        >
          {link.label}
        </div>
        {showSeparator && (
          <div className="flex flex-col justify-center w-5 h-5 text-gray-400 text-center text-sm font-medium leading-5">
            /
          </div>
        )}
      </div>
    </div>
  </div>
);

const Breadcrumb: React.FC<BreadcrumbProps> = ({ links, maxVisible = 3 }) => {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleNavigate = (url: string) => {
    setIsDropdownOpen(false);
    navigate(url);
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  // No collapse needed
  if (links.length <= maxVisible) {
    return (
      <div className="flex items-center gap-2.5 w-full">
        {links.map((link, index) => (
          <BreadcrumbItem
            key={index}
            link={link}
            showSeparator={!link.isCurrentPage}
            onNavigate={handleNavigate}
          />
        ))}
      </div>
    );
  }

  // Collapse: show first link, "..." dropdown, then last 2 links
  const firstLink = links[0];
  const collapsedLinks = links.slice(1, links.length - 2);
  const lastLinks = links.slice(links.length - 2);

  return (
    <div className="flex items-center gap-2.5 w-full">
      {/* First link (Home) */}
      <BreadcrumbItem
        link={firstLink}
        showSeparator={true}
        onNavigate={handleNavigate}
      />

      {/* Ellipsis button with dropdown */}
      <div className="relative" ref={dropdownRef}>
        <div className="flex items-center">
          <button
            type="button"
            className="flex items-center text-sm font-semibold leading-5 text-[#064771] cursor-pointer hover:text-[#0a5d94] transition-colors"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            aria-label="Show collapsed breadcrumb items"
            aria-expanded={isDropdownOpen}
          >
            ...
          </button>
          <div className="flex flex-col justify-center w-5 h-5 text-gray-400 text-center text-sm font-medium leading-5">
            /
          </div>
        </div>

        {/* Dropdown */}
        {isDropdownOpen && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[160px] py-1">
            {collapsedLinks.map((link, index) => (
              <button
                key={index}
                type="button"
                className="w-full text-left px-4 py-2 text-sm font-semibold text-[#064771] hover:bg-[#F5FBFF] transition-colors cursor-pointer whitespace-nowrap"
                onClick={() => handleNavigate(link.url)}
              >
                {link.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Last links (parent + current page) */}
      {lastLinks.map((link, index) => (
        <BreadcrumbItem
          key={`last-${index}`}
          link={link}
          showSeparator={!link.isCurrentPage}
          onNavigate={handleNavigate}
        />
      ))}
    </div>
  );
};

export default Breadcrumb;
