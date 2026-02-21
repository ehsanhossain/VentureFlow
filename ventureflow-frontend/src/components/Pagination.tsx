/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

import React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const pages: number[] = [];
  const maxPagesToShow = 5; // Limit number of page buttons to show

  // Calculate the range of pages to display (e.g., [1, 2, 3, ..., 10])
  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

  // Adjust if we are near the beginning or the end
  if (endPage - startPage < maxPagesToShow - 1) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-between mt-4 px-6">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center justify-center gap-2 w-[112px] h-[32px] px-[12.308px] py-[9.846px] rounded-[48px] border-[0.615px] bg-[#F9F8FA] border-[#BBCDDE] disabled:border-[#838383] disabled:opacity-50 "
      >
        <svg
          width="9"
          height="16"
          viewBox="0 0 9 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M8.20676 13.5931C8.59775 13.9841 8.59775 14.618 8.20676 15.009C7.81577 15.4 7.18185 15.4 6.79087 15.009L0.489483 8.70762C0.0988563 8.317 0.0988563 7.68367 0.489483 7.29304L6.79086 0.991658C7.18185 0.60067 7.81577 0.60067 8.20676 0.991658C8.59775 1.38265 8.59775 2.01656 8.20676 2.40755L2.61398 8.00033L8.20676 13.5931Z"
            fill={currentPage === 1 ? "#838383" : "#0C5577"}
          />
        </svg>
        <span
          className={currentPage === 1 ? "text-gray-500" : "text-[#0C5577]"}
        >
          Previous
        </span>
      </button>

      <div className="flex space-x-2">
        {startPage > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className="px-3 py-1 border rounded"
            >
              1
            </button>
            <span className="px-3 py-1">...</span>
          </>
        )}

        {pages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-1 rounded-[4.982px] border-none ${
              page === currentPage ? "bg-[#0C5577] text-white" : ""
            }`}
          >
            {page}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            <span className="px-3 py-1">...</span>
            <button
              onClick={() => onPageChange(totalPages)}
              className="px-3 py-1 border rounded border-none"
            >
              {totalPages}
            </button>
          </>
        )}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center justify-center gap-2 w-[112px] h-[32px] px-[12.308px] py-[9.846px] rounded-[48px] border-[0.615px] bg-[#F9F8FA] border-[#BBCDDE] disabled:border-[#838383] disabled:opacity-50 "
      >
        <span
          className={
            currentPage === totalPages ? "text-gray-500" : "text-[#0C5577]"
          }
        >
          Next
        </span>
        <svg
          width="9"
          height="16"
          viewBox="0 0 9 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={
            currentPage === totalPages ? "fill-[#838383]" : "fill-[#0C5577]"
          }
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M0.79324 2.40755C0.402246 2.01656 0.402246 1.38265 0.79324 0.991658C1.18423 0.60067 1.81815 0.60067 2.20914 0.991658L8.51052 7.29304C8.90115 7.68367 8.90115 8.317 8.51052 8.70762L2.20914 15.009C1.81815 15.4 1.18423 15.4 0.79324 15.009C0.402246 14.618 0.402246 13.9841 0.79324 13.5931L6.38602 8.00033L0.79324 2.40755Z"
          />
        </svg>
      </button>
    </div>
  );
};

export default Pagination;
