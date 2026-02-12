import React from "react";

const Pagination = ({ totalPages, currentPage, onPageChange }: { totalPages: number, currentPage: number, onPageChange: (page: number) => void }) => {
  // Generate pages to be displayed
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  // Handle previous page click
  const handlePrevious = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  // Handle next page click
  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  // Handle page number click
  const handlePageClick = (page: number) => {
    onPageChange(page);
  };

  return (
    <div className="flex self-stretch justify-between items-center gap-[27px] ml-8 mr-8">
      {/* Previous Button */}
      <button
        className="flex justify-center items-center flex-col gap-[12.307692527770996px] py-[9.84615421295166px] px-[12.307692527770996px] bg-[#F9F8FA] border-solid border-[#838383] border-[0.6153846383094788px] rounded-[4.982090950012207px] w-[112px] h-[32px]"
        onClick={handlePrevious}
        disabled={currentPage === 1}
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
            d="M8.20676 13.5929C8.59775 13.9839 8.59775 14.6178 8.20676 15.0088C7.81577 15.3997 7.18185 15.3997 6.79087 15.0088L0.489483 8.70738C0.0988563 8.31675 0.0988563 7.68342 0.489483 7.2928L6.79086 0.991414C7.18185 0.600426 7.81577 0.600426 8.20676 0.991414C8.59775 1.3824 8.59775 2.01632 8.20676 2.40731L2.61398 8.00009L8.20676 13.5929Z"
            fill="#838383"
          />
        </svg>
        <span className="text-gray-500 font-medium">Previous</span>
      </button>

      {/* Page Numbers */}
      <div className="flex justify-start items-center flex-row gap-[29.538463592529297px]">
        <button className="flex justify-start items-center flex-row gap-[33.230770111083984px]">
          {pages.map((page) => (
            <button
              key={page}
              onClick={() => handlePageClick(page)}
              className={`text-center leading-[33.21394348144531px] ${page === currentPage ? 'text-[#0C5577] font-medium' : 'text-gray-900'}`}
            >
              {page}
            </button>
          ))}
        </button>
      </div>

      {/* Next Button */}
      <button
        className="flex justify-center items-center flex-col gap-[12.307692527770996px] py-[9.84615421295166px] px-[12.307692527770996px] bg-[#FBFDFF] border-solid border-[#BBCDDE] border-[0.6153846383094788px] rounded-[4.982090950012207px] w-[98px] h-[32px]"
        onClick={handleNext}
        disabled={currentPage === totalPages}
      >
        <div className="flex justify-start items-center flex-row gap-[12.307692527770996px]">
          <span className="text-[#0C5577] font-medium">Next</span>
          <svg
            width="10"
            height="16"
            viewBox="0 0 10 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M1.06668 2.40713C0.67569 2.01614 0.67569 1.38223 1.06668 0.991239C1.45767 0.600251 2.09158 0.600251 2.48257 0.991239L8.78395 7.29262C9.17458 7.68325 9.17458 8.31658 8.78395 8.7072L2.48257 15.0086C2.09158 15.3996 1.45767 15.3996 1.06668 15.0086C0.67569 14.6176 0.67569 13.9837 1.06668 13.5927L6.65946 7.99991L1.06668 2.40713Z"
              fill="#0C5577"
            />
          </svg>
        </div>
      </button>
    </div>
  );
};

export default Pagination;
