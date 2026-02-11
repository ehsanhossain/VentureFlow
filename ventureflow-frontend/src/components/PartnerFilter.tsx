import React, { useState, useRef } from 'react';

// Define the shape of the filter state
export interface FilterState {
  registered: string;
  country: string;
  structure: string;
  status: string;
}

// Define the props for the PartnerFilter component
interface PartnerFilterProps {
  onApplyFilters: (filters: FilterState) => void;
  onClearFilters: () => void;
  initialState?: FilterState;
}

export const PartnerFilter: React.FC<PartnerFilterProps> = ({
  onApplyFilters,
  onClearFilters,
  initialState
}) => {
  // Default initial state if none is provided
  const defaultInitialState: FilterState = {
    registered: '',
    country: '',
    structure: '',
    status: '',
  };

  // State management
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
  const [filters, setFilters] = useState<FilterState>(initialState || defaultInitialState);
  const filterButtonRef = useRef<HTMLDivElement>(null);

  // Calculate modal position
  React.useEffect(() => {
    if (isModalOpen && filterButtonRef.current) {
      const rect = filterButtonRef.current.getBoundingClientRect();
      const modalWidth = 782; // Width of the modal
      const viewportWidth = window.innerWidth;

      // Calculate left position - align modal to the right edge of the button
      let leftPosition = rect.right + window.scrollX - modalWidth;

      // If modal would go off the right edge, align it to the right edge with some padding
      if (leftPosition + modalWidth > viewportWidth - 20) {
        leftPosition = viewportWidth - modalWidth - 20;
      }

      // If modal would go off the left edge, align it to the left edge with some padding
      if (leftPosition < 20) {
        leftPosition = 20;
      }

      setModalPosition({
        top: rect.bottom + window.scrollY + 8,
        left: leftPosition,
      });
    }
  }, [isModalOpen]);

  // Filter field configuration
  const filterFields = [
    {
      id: "registered" as keyof FilterState,
      label: "Registered Within",
      placeholder: "Select",
      hasIcon: false,
      iconPosition: "left",
      options: [
        { value: "7days", label: "Last 7 days" },
        { value: "30days", label: "Last 30 days" },
        { value: "90days", label: "Last 90 days" },
      ],
    },
    {
      id: "country" as keyof FilterState,
      label: "Partner's HQ/Origin Country",
      placeholder: "Select Related Country",
      hasIcon: true,
      iconPosition: "right",
      options: [
        { value: "us", label: "United States" },
        { value: "uk", label: "United Kingdom" },
        { value: "ca", label: "Canada" },
      ],
    },
    {
      id: "structure" as keyof FilterState,
      label: "Structure",
      placeholder: "e.g., Percentage / Success Based",
      hasIcon: true,
      iconPosition: "right",
      options: [
        { value: "percentage", label: "Percentage" },
        { value: "success", label: "Success Based" },
        { value: "hybrid", label: "Hybrid" },
      ],
    },
    {
      id: "status" as keyof FilterState,
      label: "Status",
      placeholder: "Select Status",
      hasIcon: true,
      iconPosition: "right",
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
        { value: "pending", label: "Pending" },
      ],
    },
  ];

  // Event handlers
  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleFilterChange = (field: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleClearFilter = () => {
    setFilters(defaultInitialState);
    onClearFilters();
  };

  const handleApplySearch = () => {
    onApplyFilters(filters);
    setIsModalOpen(false);
  };

  return (
    <>
      {/* Filter Button */}
      <div
        ref={filterButtonRef}
        className="flex justify-center items-center gap-2 py-2 px-3 bg-white border border-gray-500 rounded-md h-[35px] cursor-pointer"
        onClick={handleOpenModal}
      >
        <svg
          width="17"
          height="17"
          viewBox="0 0 17 17"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2.82902 3.53027H13.5037C13.6 3.53027 13.6942 3.55824 13.7749 3.61078C13.8556 3.66331 13.9193 3.73815 13.9582 3.8262C13.9972 3.91425 14.0097 4.01172 13.9943 4.10676C13.9789 4.2018 13.9362 4.29033 13.8715 4.36157L9.78657 8.85495C9.70341 8.94643 9.65733 9.06562 9.65733 9.18925V12.707C9.65733 12.7888 9.63713 12.8694 9.59852 12.9415C9.55991 13.0137 9.5041 13.0752 9.43602 13.1205L7.44808 14.4458C7.37323 14.4957 7.28624 14.5244 7.19639 14.5287C7.10655 14.5331 7.0172 14.5129 6.93789 14.4705C6.85858 14.4281 6.79228 14.3649 6.74605 14.2877C6.69983 14.2105 6.67541 14.1223 6.67541 14.0323V9.18925C6.67541 9.06562 6.62933 8.94643 6.54617 8.85495L2.46128 4.36157C2.39651 4.29033 2.35383 4.2018 2.33843 4.10676C2.32303 4.01172 2.33557 3.91425 2.37452 3.8262C2.41347 3.73815 2.47716 3.66331 2.55784 3.61078C2.63853 3.55824 2.73274 3.53027 2.82902 3.53027Z"
            stroke="#30313D"
            strokeWidth="1.49096"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-gray-800 text-sm font-medium font-poppins">
          Filter
        </span>
      </div>

      {/* Filter Modal */}
      {isModalOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
            onClick={handleCloseModal}
          />

          {/* Modal */}
          <div
            className="fixed z-[101] animate-in fade-in-0 zoom-in-95 duration-200"
            style={{
              top: modalPosition.top,
              left: modalPosition.left,
            }}
          >
            <div className="w-[782px] rounded-[20px] border-0 shadow-2xl bg-white">
              <div className="flex flex-col w-full items-start gap-10 p-10">
                {/* Header */}
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3.5">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46 22,3" />
                    </svg>
                    <h2 className="font-medium text-[#30313d] text-3xl leading-[35.7px] font-['SF_Pro_Display-Medium',Helvetica]">
                      Filter
                    </h2>
                  </div>
                  <button
                    className="w-[30px] h-[30px] rounded-[15px] border-2 border-solid border-[#30313d] p-0 hover:bg-gray-100 transition-colors cursor-pointer flex items-center justify-center bg-white"
                    onClick={handleCloseModal}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Filter Content */}
                <div className="flex flex-col items-start gap-12 w-full">
                  <div className="flex flex-col items-center gap-[35px] w-full">
                    {/* First row */}
                    <div className="flex items-start gap-[53px] w-full">
                      {/* Registered Within */}
                      <div className="flex-col w-[300px] h-[70px] flex items-start justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-[#30313d] text-base leading-[19.3px] font-['Poppins',Helvetica]">
                            {filterFields[0].label}
                          </span>
                        </div>

                        <div className="flex items-center relative">
                          <div className="flex w-[52px] h-10 items-center justify-center bg-[#bde9f9] rounded-[36px] border-[0.5px] border-solid border-[#005d7f] z-10">
                            <img
                              className="w-[17px]"
                              alt="Calendar icon"
                              src="/frame-1000001074.svg"
                            />
                          </div>
                          <div className="relative">
                            <select
                              value={filters.registered}
                              onChange={(e) => handleFilterChange('registered', e.target.value)}
                              className="w-[283px] h-10 pl-[47px] pr-5 py-2 -ml-[34px] bg-white rounded-[0px_53px_53px_0px] border-[0.5px] border-solid border-slate-300 text-[#8a8a8a] text-sm font-normal font-['Poppins',Helvetica] appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#005d7f] focus:border-[#005d7f]"
                            >
                              <option value="">{filterFields[0].placeholder}</option>
                              {filterFields[0].options.map((option) => (
                                <option key={option.value} value={option.value} className="text-[#30313d]">
                                  {option.label}
                                </option>
                              ))}
                            </select>
                            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Partner's HQ/Origin Country */}
                      <div className="flex flex-col h-[70px] items-start justify-between flex-1">
                        <div className="flex items-center gap-1.5 w-full">
                          <span className="font-medium text-[#30313d] text-base leading-[19.3px] font-['Poppins',Helvetica]">
                            {filterFields[1].label}
                          </span>
                          <div className="w-[18px] h-[18px] flex items-center justify-center">
                            <svg className="w-[16.67px] h-[16.67px] text-gray-400 hover:text-gray-600 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10" />
                              <path d="M9,9h0a3,3,0,0,1,5.12,2.12h0A3,3,0,0,1,9,15" />
                              <circle cx="12" cy="17.02" r=".01" />
                            </svg>
                          </div>
                        </div>

                        <div className="relative w-full">
                          <select
                            value={filters.country}
                            onChange={(e) => handleFilterChange('country', e.target.value)}
                            className="w-full h-10 px-5 py-[13px] bg-white rounded-[5px] border-[0.5px] border-solid border-slate-300 text-[#8a8a8a] text-sm font-normal font-['Poppins',Helvetica] appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#005d7f] focus:border-[#005d7f] pl-[50px]"
                          >
                            <option value="">{filterFields[1].placeholder}</option>
                            {filterFields[1].options.map((option) => (
                              <option key={option.value} value={option.value} className="text-[#30313d]">
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                            <img
                              className="w-[26px] h-[26px]"
                              alt="Globe icon"
                              src="/web.png"
                            />
                          </div>
                          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Second row */}
                    <div className="flex items-center justify-between w-full">
                      {/* Structure */}
                      <div className="flex flex-col w-[301px] h-[70px] items-start justify-between">
                        <div className="flex items-center gap-1.5 w-full">
                          <span className="font-medium text-[#30313d] text-base leading-[19.3px] font-['Poppins',Helvetica]">
                            {filterFields[2].label}
                          </span>
                          <div className="w-[18px] h-[18px] flex items-center justify-center">
                            <svg className="w-[16.67px] h-[16.67px] text-gray-400 hover:text-gray-600 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10" />
                              <path d="M9,9h0a3,3,0,0,1,5.12,2.12h0A3,3,0,0,1,9,15" />
                              <circle cx="12" cy="17.02" r=".01" />
                            </svg>
                          </div>
                        </div>

                        <div className="relative">
                          <select
                            value={filters.structure}
                            onChange={(e) => handleFilterChange('structure', e.target.value)}
                            className="w-[301px] h-10 px-5 py-[13px] bg-white rounded-[5px] border-[0.5px] border-solid border-slate-300 text-[#8a8a8a] text-sm font-normal font-['Poppins',Helvetica] appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#005d7f] focus:border-[#005d7f]"
                          >
                            <option value="">{filterFields[2].placeholder}</option>
                            {filterFields[2].options.map((option) => (
                              <option key={option.value} value={option.value} className="text-[#30313d]">
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="flex flex-col w-[301px] h-[70px] items-start justify-between">
                        <div className="flex items-center gap-1.5 w-full">
                          <span className="font-medium text-[#30313d] text-base leading-[19.3px] font-['Poppins',Helvetica]">
                            {filterFields[3].label}
                          </span>
                          <div className="w-[18px] h-[18px] flex items-center justify-center">
                            <svg className="w-[16.67px] h-[16.67px] text-gray-400 hover:text-gray-600 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10" />
                              <path d="M9,9h0a3,3,0,0,1,5.12,2.12h0A3,3,0,0,1,9,15" />
                              <circle cx="12" cy="17.02" r=".01" />
                            </svg>
                          </div>
                        </div>

                        <div className="relative">
                          <select
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            className="w-[301px] h-10 px-5 py-[13px] bg-white rounded-[5px] border-[0.5px] border-solid border-slate-300 text-[#8a8a8a] text-sm font-normal font-['Poppins',Helvetica] appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#005d7f] focus:border-[#005d7f]"
                          >
                            <option value="">{filterFields[3].placeholder}</option>
                            {filterFields[3].options.map((option) => (
                              <option key={option.value} value={option.value} className="text-[#30313d]">
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-4 w-full">
                    <button
                      className="h-[34px] px-3 py-[5.03px] bg-[#f1faff] rounded-[49.82px] border-[0.77px] border-solid border-[#0c5577] text-[#0c5577] font-normal text-base font-['Poppins',Helvetica] hover:bg-[#e6f4ff] transition-colors cursor-pointer flex items-center"
                      onClick={handleClearFilter}
                    >
                      <img
                        className="w-[12.22px] h-[15px] mr-1.5"
                        alt="Clear icon"
                        src="/group-1261158170.png"
                      />
                      Clear Filter
                    </button>
                    <button
                      className="h-[34.49px] px-3 py-[5.03px] bg-[#064771] rounded-[49.82px] text-white font-medium text-base font-['Poppins',Helvetica] hover:bg-[#053a5a] transition-colors cursor-pointer flex items-center"
                      onClick={handleApplySearch}
                    >
                      Apply & Search
                      <svg className="w-2 h-3.5 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};