/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

import React from "react";
import { useNavigate } from "react-router-dom";

type BreadcrumbProps = {
  links: { label: string; url: string; isCurrentPage?: boolean }[];
};

const Breadcrumb: React.FC<BreadcrumbProps> = ({ links }) => {
  const navigate = useNavigate();

  const handleNavigate = (url: string) => {
    navigate(url);
  };

  return (
    <div className="flex items-center gap-2.5 w-full">
      {links.map((link, index) => (
        <div key={index} className="flex items-start">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center">
              <div
                className={`flex items-start gap-1 text-sm font-semibold leading-5 ${
                  link.isCurrentPage
                    ? "text-gray-500"
                    : "text-[#064771] underline cursor-pointer"
                } whitespace-nowrap`}
                onClick={
                  !link.isCurrentPage
                    ? () => handleNavigate(link.url)
                    : undefined
                }
                role={!link.isCurrentPage ? "link" : undefined}
                tabIndex={!link.isCurrentPage ? 0 : undefined}
                onKeyDown={
                  !link.isCurrentPage
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ")
                          handleNavigate(link.url);
                      }
                    : undefined
                }
              >
                {link.label}
              </div>
              {!link.isCurrentPage && (
                <div className="flex flex-col justify-center w-5 h-5 text-gray-400 text-center  text-sm font-medium leading-5">
                  /
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Breadcrumb;
