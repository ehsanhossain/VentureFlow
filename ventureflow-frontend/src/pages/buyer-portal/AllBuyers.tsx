import React, { useState, useEffect, useRef } from 'react';
import Pagination from '../../components/Pagination';
import { Pinned } from '../../components/Pinned';
import api from '../../config/api';
import { useNavigate } from 'react-router-dom';
import { ActionButton } from '../../components/ActionButton';
import { SearchInput } from '../../components/SearchInput';
import { showAlert } from '../../components/Alert';
import SelectPicker from '../../components/SelectPicker';
import { Controller, useForm } from 'react-hook-form';
import { Input } from '../../components/Input';
import { Country, Dropdown } from './components/Dropdown';
import { Industry, IndustryDropdown } from './components/IndustryDropdown';
import DatePicker from '../../components/DatePicker';

const baseURL = import.meta.env.VITE_API_BASE_URL;

const statusOptions = [
  { value: 'Active', label: 'Active' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Deal Closed', label: 'Deal Closed' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Interested', label: 'Interested' },
  { value: 'On Hold', label: 'On Hold' },
  { value: 'Not Interested', label: 'Not Interested' },
  { value: 'Canceled', label: 'Canceled' },
  { value: 'In-Active', label: 'In-Active' },
  { value: 'Drafts', label: 'Drafts' },
];

const sourceOptions = [
  { value: '1', label: 'Partner' },
  { value: '0', label: 'TCG' },
];

const dealStructureOptions = [
  { value: '1', label: 'Merger' },
  { value: '0', label: 'Acquisition' },
];

export interface FilterState {
  registered: string;
  country: string;
  structure: string;
  status: string;
  broderIndustries: Industry[];
  priorityIndustries: Industry[];
}

interface FormValues {
  RegisterWithin: Date | null;
  expectedTransectionTimeline: Date | null;
  HQCountry: Country | null;
  TargetCountry: Country | null;
  source: string;
  dealStructure: string;
  currency: string;
  annualRevenue: string;
  partnershipStructure: string;
  status: string;
  broderIndustries: Industry[];
  priorityIndustries: Industry[];
  acquisitionPreference: {
    min?: number;
    max?: number;
  };
  investmentAmount: {
    min?: number;
    max?: number;
  };
  ebitdaRequirments: {
    min?: number;
    max?: number;
  };
  showOnlyPinned: boolean;
  isMinority: boolean;
  isMajority: boolean;
  isNegotiable: boolean;
}
//p1 End

interface BuyerEmployee {
  id: number;
  name: string;
  image?: string;
  first_name?: string;
  last_name?: string;
}

interface Buyer {
  id: number;
  pinned: number;
  image: string | null;
  updated_at: string;
  buyer_id?: string;
  company_overview: {
    hq_country: string;
    status: string;
    incharge_name: string;
    reg_name: string;
    details: string;
    main_industry_operations: { name: string }[];
    niche_industry: { name: string }[];
    website: string;
    email: string;
    seller_contact_name: string;
    phone: string;
  };
  target_preference?: {
    target_countries: string | { name: string; flagSrc: string }[];
    emp_count_range: string;
  };
  financial_details?: {
    expected_ebitda: string;
    valuation: string;
    shareholding: string;
    investment_budget: string;
    growth_rate_yoy: string;
    ma_structure: string;
  };
  partnership_details?: {
    referral_bonus_criteria: string;
  };
}

interface Meta {
  current_page: number;
  from: number;
  last_page: number;
  links: { url: string | null; label: string; active: boolean }[];
  path: string;
  per_page: number;
  to: number;
  total: number;
}

type AllBuyersProps = {
  onApplyFilters: () => void;
  onClearFilters: () => void;
};

const AllBuyers = ({
  onClearFilters,
}: AllBuyersProps): JSX.Element => {
  localStorage.removeItem('buyer_id');

  //p2 start

  const {
    control,
    register,
    watch,
    reset,
    handleSubmit,
  } = useForm<FormValues>({
    defaultValues: {
      RegisterWithin: null,
      expectedTransectionTimeline: null,
      HQCountry: null,
      TargetCountry: null,
      partnershipStructure: '',
      status: '',
      source: '',
      dealStructure: '',
      currency: '',
      annualRevenue: '',
      broderIndustries: [],
      priorityIndustries: [],
      showOnlyPinned: false,
      isMinority: false,
      isMajority: false,
      isNegotiable: false,
    } as Partial<FormValues>,
  });

  const [industries, setIndustries] = useState<Industry[]>([]);
  const [subIndustries, setSubIndustries] = useState<Industry[]>([]);


  useEffect(() => {
    const fetchIndustries = async () => {
      try {
        const response = await api.get('/api/industries');
        const formatted = response.data.map((industry: { id: number; name: string; status: string; sub_industries?: { id: number; name: string }[] }) => ({
          id: industry.id,
          name: industry.name,
          status: industry.status,
          sub_industries: industry.sub_industries || [],
        }));
        setIndustries(formatted);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        showAlert({ type: "error", message: "Failed to fetch industries" });
      }
    };

    fetchIndustries();
  }, []);

  const selectedIndustries = watch('broderIndustries');

  useEffect(() => {
    if (!selectedIndustries || selectedIndustries.length === 0) {
      setSubIndustries([]);
      return;
    }

    const selectedIds = selectedIndustries.map((ind) => ind.id);
    const subs = industries
      .filter((ind) => selectedIds.includes(ind.id))
      .flatMap((ind) => ind.sub_industries || []);

    const formattedSubs = subs.map((sub: { id: number; name: string; status?: string }) => ({
      id: sub.id,
      name: sub.name,
      status: sub.status || 'Active',
    }));

    setSubIndustries(formattedSubs);
  }, [selectedIndustries, industries]);


  const [currencyOptions, setCurrencyOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const response = await api.get('/api/currencies');
        const currencies = Array.isArray(response.data.data) ? response.data.data : response.data;
        const formatted = currencies.map((currency: { id: number; currency_name: string }) => ({
          value: String(currency.id),
          label: currency.currency_name,
        }));
        setCurrencyOptions(formatted);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        showAlert({ type: "error", message: "Error fetching currencies" });
      }
    };
    fetchCurrencies();
  }, []);

  const [isComponentOpen, setIsComponentOpen] = useState(false);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, unknown>>({});

  const fetchBuyers = async (page = 1, query = '', filters = {}) => {
    try {
      setLoading(true);
      const params = {
        page,
        search: query,
        ...filters,
      };

     

      const response = await api.get('/api/buyer', { params });
      setBuyers(response.data.data);
      setMeta(response.data.meta);
      setTotalPages(response.data.meta.last_page);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      showAlert({ type: "error", message: "Failed to fetch buyers" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeFilters]);

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchBuyers(currentPage, searchQuery, activeFilters);
    }, 500);

    return () => clearTimeout(delay);
  }, [currentPage, searchQuery, activeFilters]);

  const contentRef = useRef<HTMLDivElement>(null);

  const [isOverflowing, setIsOverflowing] = useState(false);

  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const checkOverflow = () => {
      const el = contentRef.current;
      if (el) {
        const isOver = el.scrollHeight > el.clientHeight;
        setIsOverflowing(isOver);
      }
    };
    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, []);
  const [countries, setCountries] = useState<Country[]>([]);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await api.get('/api/countries');
        const formatted = response.data.map((country: { id: number; name: string; svg_icon_url: string; alpha_2_code: string }) => ({
          id: country.id,
          name: country.name,
          flagSrc: country.svg_icon_url,
          status: 'unregistered',
          alpha: country.alpha_2_code,
        }));

        setCountries(formatted);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        // setError('Failed to load countries.'); 
        showAlert({ type: "error", message: "Failed to load countries" });
      } finally {
        setLoading(false);
      }
    };

    fetchCountries();
  }, []);


  const getCountryById = (id: string | number) => countries.find((c) => c.id === id);


  const handlePinnedToggle = async (buyerId: number) => {
    try {
      await api.post(`/api/buyer/${buyerId}/pinned`);
      fetchBuyers(currentPage, searchQuery, activeFilters);
      showAlert({
        type: 'success',
        message: 'Pinned status updated successfully',
      });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      showAlert({ type: "error", message: "Failed to update pinned status" });
    }
  };

  const [employees, setEmployees] = useState<BuyerEmployee[]>([]);
  useEffect(() => {
    api
      .get('/api/employees/fetch')
      .then((res) => {
        setEmployees(res.data);
      })
      .catch((_) => showAlert({ type: "error", message: "Failed to fetch employees" }));
  }, []);

  const getEmployeeById = (id: number) => employees.find((e) => e.id === id);





  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
  const filterButtonRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isModalOpen && filterButtonRef.current) {
      const rect = filterButtonRef.current.getBoundingClientRect();
      const modalWidth = 782;
      const viewportWidth = window.innerWidth;
      let leftPosition = rect.right + window.scrollX - modalWidth;

      if (leftPosition + modalWidth > viewportWidth - 20) {
        leftPosition = viewportWidth - modalWidth - 20;
      }

      if (leftPosition < 20) {
        leftPosition = 20;
      }

      setModalPosition({
        top: rect.bottom + window.scrollY - 300,
        left: leftPosition,
      });
    }
  }, [isModalOpen]);

  const filterFields = [
    {
      id: 'registered' as keyof FilterState,
      label: 'Registered Within ',
      placeholder: 'Select',
      hasIcon: false,
      iconPosition: 'left',
      options: [
        { value: '7days', label: 'Last 7 days' },
        { value: '30days', label: 'Last 30 days' },
        { value: '90days', label: 'Last 90 days' },
      ],
    },
    {
      id: 'country' as keyof FilterState,
      label: "Partner's HQ/Origin Country",
      placeholder: 'Select Related Country',
      hasIcon: true,
      iconPosition: 'right',
      options: [
        { value: 'us', label: 'United States' },
        { value: 'uk', label: 'United Kingdom' },
        { value: 'ca', label: 'Canada' },
      ],
    },
    {
      id: 'structure' as keyof FilterState,
      label: 'Structure',
      placeholder: 'e.g., Percentage / Success Based',
      hasIcon: true,
      iconPosition: 'right',
      options: [
        { value: 'percentage', label: 'Percentage' },
        { value: 'success', label: 'Success Based' },
        { value: 'hybrid', label: 'Hybrid' },
      ],
    },
    {
      id: 'status' as keyof FilterState,
      label: 'Status',
      placeholder: 'Select Status',
      hasIcon: true,
      iconPosition: 'right',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'pending', label: 'Pending' },
      ],
    },
  ];

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };



  const handleClearFilter = () => {
    reset();
    setActiveFilters({});
    if (onClearFilters) onClearFilters();
  };

  const handleApplySearch = (formValues: FormValues) => {
    let registeredAfter = '';
    if (formValues.RegisterWithin) {
      const date = new Date(formValues.RegisterWithin);
      date.setHours(date.getHours() + 6);
      registeredAfter = date.toISOString().split('T')[0];
    }

    const appliedFilters: Record<string, unknown> = {
      country: formValues.HQCountry ?? '',
      target_country: formValues.TargetCountry ?? '',
      registered_after: registeredAfter,
      structure: formValues.partnershipStructure ?? '',
      status: formValues.status ?? '',
      source: formValues.source ?? '',
      currency: formValues.currency ?? [],
      annual_revenue: formValues.annualRevenue ?? '',
      acquisition_preference: formValues.acquisitionPreference ?? {},
      expected_investment_amount: formValues.investmentAmount ?? {},
      deal_structure: formValues.dealStructure ?? '',
      ebitda_requirements: formValues.ebitdaRequirments ?? {},
      is_minority: formValues.isMinority ? '1' : '',
      is_majority: formValues.isMajority ? '1' : '',
      is_negotiable: formValues.isNegotiable ? '1' : '',
      show_only_pinned: isComponentOpen ? '1' : '',
    };

    if (formValues.broderIndustries?.length) {
      appliedFilters.broader_industries = formValues.broderIndustries.map((item) => item.id);
    }

    if (formValues.priorityIndustries?.length) {
      appliedFilters.priority_industries = formValues.priorityIndustries.map((item) => item.id);
    }

    Object.keys(appliedFilters).forEach((key) => {
      const value = appliedFilters[key];
      if (
        value === '' ||
        value === null ||
        (Array.isArray(value) && value.length === 0) ||
        (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0)
      ) {
        delete appliedFilters[key];
      }
    });

    setActiveFilters(appliedFilters);
    setIsModalOpen(false);
  };

  const [selectedBuyerIds, setSelectedBuyerIds] = useState<Set<string | number>>(
    new Set()
  );

  const handleExportData = () => {
   
    alert('Exporting data... (Parent function)');
  };

  const handleDeleteData = async (selectedIdsArray: (string | number)[]) => {
  

    if (!selectedIdsArray || selectedIdsArray.length === 0) {
    
      alert('Please select items to delete.');
      return false;
    }

    const confirmMessage =
      selectedIdsArray.length > 1
        ? `Are you sure you want to delete these ${selectedIdsArray.length} items?`
        : 'Are you sure you want to delete this item?';

    if (window.confirm(confirmMessage)) {
      try {
      
        await api.delete(`/api/buyers`, {
          data: { ids: selectedIdsArray },
        });

      
        showAlert({
          type: 'success',
          message: `${selectedIdsArray.length} item(s) deleted successfully!`,
        });
        fetchBuyers();
        return true;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        showAlert({ type: "error", message: "Failed to delete items" });
        showAlert({
          type: 'error',
          message: 'Failed to delete items. Please try again.',
        });
        return false;
      }
    } else {
     
      return false;
    }
  };

  const handleBulkDeleteClick = async () => {
    const idsToDeleteArray = Array.from(selectedBuyerIds);

    if (idsToDeleteArray.length === 0) {
      alert('Please select buyers to delete.');
      return;
    }

    const success = await handleDeleteData(idsToDeleteArray);

    if (success) {
      setSelectedBuyerIds(new Set());
      
    }
  };

  const handleComponentOpen = () => {
    setIsComponentOpen(true);
  };

  const handleComponentClose = () => {
    setIsComponentOpen(false);
    setSelectedBuyerIds(new Set());
  };

  const handleCheckboxChange = (buyerId: number | string) => {
    setSelectedBuyerIds((prevSelectedIds) => {
      const newSelectedIds = new Set(prevSelectedIds);
      if (newSelectedIds.has(buyerId)) {
        newSelectedIds.delete(buyerId);
      } else {
        newSelectedIds.add(buyerId);
      }
    
      return newSelectedIds;
    });
  };

  return (
    <div className="flex flex-col p-4 w-full font-poppins">
      <div className="flex justify-between items-center py-[25px] px-[20px]">
        <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search Here" />

        <div className="flex justify-start items-center gap-4">
          <span className="text-sm leading-5 font-poppins text-center">
            <span className="text-gray-500">Showing</span>
            <span className="text-gray-800 font-poppins mx-1">{buyers?.length}</span>
            <span className="text-gray-500">of</span>
            <span className="text-gray-800 font-poppins mx-1">{meta?.total}</span>
            <span className="text-gray-500">Cases</span>
          </span>
          <div className="flex items-center gap-4 h-8">
            <div className="flex items-center gap-4 h-8">
              <div className="flex items-center gap-4 h-9">
                <ActionButton
                  onExport={handleExportData}
                  onDelete={handleBulkDeleteClick}
                  onOpen={handleComponentOpen}
                  onClose={handleComponentClose}
                />
              </div>
              <div className="flex justify-center items-center gap-2 py-2 px-3 bg-white border border-gray-500 rounded-md h-[35px]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="17"
                  height="17"
                  viewBox="0 0 17 17"
                  fill="none"
                >
                  <path
                    d="M4.57812 8.5H12.5299"
                    stroke="#30313D"
                    strokeWidth="1.49096"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M2.09375 5.51758H15.0154"
                    stroke="#30313D"
                    strokeWidth="1.49096"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M7.0625 11.4814H10.0444"
                    stroke="#30313D"
                    strokeWidth="1.49096"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-gray-800 text-sm font-medium font-poppins">Sort By</span>
              </div>

              <button>
                <div
                  className="flex justify-center items-center gap-2 py-2 px-3 bg-white border border-gray-500 rounded-md h-[35px] cursor-pointer"
                  ref={filterButtonRef}
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
                  <span className="text-gray-800 text-sm font-medium font-poppins">Filter</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {isModalOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/30 backdrop-blur-md z-40"
              onClick={handleCloseModal}
            />

            <div
              className="fixed z-50 animate-in fade-in-0 zoom-in-95 duration-200"
              style={{
                top: modalPosition.top,
                left: modalPosition.left,
                width: '782px',
              }}
            >
              <div
                className="w-[782px] rounded-[20px] border-0 shadow-2xl bg-white overflow-y-auto"
                style={{
                  maxHeight: '80vh',
                }}
              >
                <div className="flex flex-col w-full items-start gap-6 p-6">
                  <div className="flex items-center justify-between w-full sticky top-0 bg-white z-10 px-6 py-4 ">
                    <div className="flex items-center gap-3.5">
                      <svg
                        className="w-7 h-7"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        style={{ transform: 'scaleX(-1)' }} // flips horizontally
                      >
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
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="flex flex-col items-start gap-6 w-full">
                    <div className="flex flex-col items-center gap-[35px] w-full">
                      <div className="flex items-start gap-[53px] w-full">
                        <div className="flex-col w-[300px] h-[70px] flex items-start justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-[#30313d] text-base leading-[19.3px] font-['Poppins',Helvetica]">
                              {filterFields[0].label}
                            </span>
                          </div>

                          <Controller
                            control={control}
                            name="RegisterWithin"
                            render={({ field }) => (
                              <DatePicker
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Select date"
                                icon={
                                  <svg
                                    width="18"
                                    height="16"
                                    viewBox="0 0 18 16"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M12.3897 6.70475C9.77323 6.70475 7.64355 8.77865 7.64355 11.3281C7.64355 13.863 9.77323 15.9257 12.3897 15.9257C15.0062 15.9257 17.1359 13.8518 17.1359 11.3023C17.1359 8.76742 15.0062 6.70475 12.3897 6.70475ZM12.3897 14.6047C10.5204 14.6047 8.99961 13.1345 8.99961 11.3281C8.99961 9.50715 10.5204 8.0257 12.3897 8.0257C14.2591 8.0257 15.7799 9.49592 15.7799 11.3023C15.7799 13.1233 14.2591 14.6047 12.3897 14.6047ZM13.5471 11.4958C13.8122 11.7541 13.8122 12.1715 13.5471 12.4298C13.4149 12.5586 13.2413 12.6233 13.0678 12.6233C12.8942 12.6233 12.7206 12.5586 12.5884 12.4298L11.9104 11.7693C11.7829 11.6451 11.7117 11.4774 11.7117 11.3023V9.98137C11.7117 9.61679 12.0148 9.3209 12.3897 9.3209C12.7647 9.3209 13.0678 9.61679 13.0678 9.98137V11.0289L13.5471 11.4958ZM17.1359 4.69756V6.01851C17.1359 6.3831 16.8329 6.67899 16.4579 6.67899C16.083 6.67899 15.7799 6.3831 15.7799 6.01851V4.69756C15.7799 3.60513 14.8673 2.71613 13.7458 2.71613H4.25342C3.13196 2.71613 2.21934 3.60513 2.21934 4.69756V5.35804H8.32158C8.69585 5.35804 8.99961 5.65393 8.99961 6.01851C8.99961 6.3831 8.69585 6.67899 8.32158 6.67899H2.21934V12.6233C2.21934 13.7157 3.13196 14.6047 4.25342 14.6047H6.96552C7.33979 14.6047 7.64355 14.9006 7.64355 15.2652C7.64355 15.6298 7.33979 15.9257 6.96552 15.9257H4.25342C2.3841 15.9257 0.863281 14.4442 0.863281 12.6233V4.69756C0.863281 2.87662 2.3841 1.39517 4.25342 1.39517H4.93144V0.734696C4.93144 0.370112 5.2352 0.0742188 5.60947 0.0742188C5.98374 0.0742188 6.2875 0.370112 6.2875 0.734696V1.39517H11.7117V0.734696C11.7117 0.370112 12.0148 0.0742188 12.3897 0.0742188C12.7647 0.0742188 13.0678 0.370112 13.0678 0.734696V1.39517H13.7458C15.6151 1.39517 17.1359 2.87662 17.1359 4.69756Z"
                                      fill="#005E80"
                                    />
                                  </svg>
                                }
                              />
                            )}
                          />
                        </div>

                        <div className="flex-col w-[300px] h-[70px] flex items-start justify-between ml-[70px] ">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-[#30313d] text-base leading-[19.3px] font-['Poppins',Helvetica]">
                              Expected Transectoion Timeline
                            </span>
                          </div>

                          <Controller
                            control={control}
                            name="expectedTransectionTimeline"
                            render={({ field }) => (
                              <DatePicker
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Select date"
                                icon={
                                  <svg
                                    width="18"
                                    height="16"
                                    viewBox="0 0 18 16"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M12.3897 6.70475C9.77323 6.70475 7.64355 8.77865 7.64355 11.3281C7.64355 13.863 9.77323 15.9257 12.3897 15.9257C15.0062 15.9257 17.1359 13.8518 17.1359 11.3023C17.1359 8.76742 15.0062 6.70475 12.3897 6.70475ZM12.3897 14.6047C10.5204 14.6047 8.99961 13.1345 8.99961 11.3281C8.99961 9.50715 10.5204 8.0257 12.3897 8.0257C14.2591 8.0257 15.7799 9.49592 15.7799 11.3023C15.7799 13.1233 14.2591 14.6047 12.3897 14.6047ZM13.5471 11.4958C13.8122 11.7541 13.8122 12.1715 13.5471 12.4298C13.4149 12.5586 13.2413 12.6233 13.0678 12.6233C12.8942 12.6233 12.7206 12.5586 12.5884 12.4298L11.9104 11.7693C11.7829 11.6451 11.7117 11.4774 11.7117 11.3023V9.98137C11.7117 9.61679 12.0148 9.3209 12.3897 9.3209C12.7647 9.3209 13.0678 9.61679 13.0678 9.98137V11.0289L13.5471 11.4958ZM17.1359 4.69756V6.01851C17.1359 6.3831 16.8329 6.67899 16.4579 6.67899C16.083 6.67899 15.7799 6.3831 15.7799 6.01851V4.69756C15.7799 3.60513 14.8673 2.71613 13.7458 2.71613H4.25342C3.13196 2.71613 2.21934 3.60513 2.21934 4.69756V5.35804H8.32158C8.69585 5.35804 8.99961 5.65393 8.99961 6.01851C8.99961 6.3831 8.69585 6.67899 8.32158 6.67899H2.21934V12.6233C2.21934 13.7157 3.13196 14.6047 4.25342 14.6047H6.96552C7.33979 14.6047 7.64355 14.9006 7.64355 15.2652C7.64355 15.6298 7.33979 15.9257 6.96552 15.9257H4.25342C2.3841 15.9257 0.863281 14.4442 0.863281 12.6233V4.69756C0.863281 2.87662 2.3841 1.39517 4.25342 1.39517H4.93144V0.734696C4.93144 0.370112 5.2352 0.0742188 5.60947 0.0742188C5.98374 0.0742188 6.2875 0.370112 6.2875 0.734696V1.39517H11.7117V0.734696C11.7117 0.370112 12.0148 0.0742188 12.3897 0.0742188C12.7647 0.0742188 13.0678 0.370112 13.0678 0.734696V1.39517H13.7458C15.6151 1.39517 17.1359 2.87662 17.1359 4.69756Z"
                                      fill="#005E80"
                                    />
                                  </svg>
                                }
                              />
                            )}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between w-full">
                        <div className="flex flex-col w-[301px] h-[70px] items-start justify-between">
                          <div className="flex items-center gap-1.5 w-full">
                            <span className="font-medium text-[#30313d] text-base leading-[19.3px] font-['Poppins',Helvetica]">
                              Broder Industry Operations
                            </span>
                            <div className="w-[18px] h-[18px] flex items-center justify-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16.67"
                                height="16.67"
                                viewBox="0 0 18 18"
                                fill="none"
                                className="text-gray-400 hover:text-gray-600 cursor-help"
                              >
                                <path
                                  d="M9.0013 0.666626C7.35313 0.666626 5.74196 1.15537 4.37155 2.07105C3.00114 2.98672 1.93304 4.28821 1.30231 5.81093C0.671579 7.33365 0.506552 9.0092 0.828095 10.6257C1.14964 12.2422 1.94331 13.7271 3.10875 14.8925C4.27419 16.058 5.75904 16.8516 7.37555 17.1732C8.99206 17.4947 10.6676 17.3297 12.1903 16.699C13.713 16.0682 15.0145 15.0001 15.9302 13.6297C16.8459 12.2593 17.3346 10.6481 17.3346 8.99996C17.3322 6.79055 16.4535 4.67233 14.8912 3.11004C13.3289 1.54776 11.2107 0.669016 9.0013 0.666626ZM9.0013 15.9444C7.62782 15.9444 6.28519 15.5371 5.14318 14.7741C4.00117 14.011 3.11108 12.9264 2.58548 11.6575C2.05987 10.3885 1.92234 8.99225 2.1903 7.64516C2.45825 6.29807 3.11964 5.06069 4.09084 4.08949C5.06204 3.1183 6.29942 2.4569 7.64651 2.18895C8.9936 1.921 10.3899 2.05852 11.6588 2.58413C12.9278 3.10974 14.0123 3.99982 14.7754 5.14183C15.5385 6.28384 15.9457 7.62648 15.9457 8.99996C15.9437 10.8411 15.2114 12.6063 13.9095 13.9082C12.6076 15.2101 10.8425 15.9424 9.0013 15.9444Z"
                                  fill="#064771"
                                />
                                <path
                                  d="M9.00217 7.61194H8.30773C8.12355 7.61194 7.94691 7.6851 7.81668 7.81534C7.68645 7.94557 7.61328 8.1222 7.61328 8.30638C7.61328 8.49056 7.68645 8.6672 7.81668 8.79743C7.94691 8.92766 8.12355 9.00083 8.30773 9.00083H9.00217V13.1675C9.00217 13.3517 9.07533 13.5283 9.20557 13.6585C9.3358 13.7888 9.51244 13.8619 9.69661 13.8619C9.88079 13.8619 10.0574 13.7888 10.1877 13.6585C10.3179 13.5283 10.3911 13.3517 10.3911 13.1675V9.00083C10.3911 8.63247 10.2447 8.2792 9.98426 8.01873C9.72379 7.75827 9.37053 7.61194 9.00217 7.61194Z"
                                  fill="#064771"
                                />
                                <path
                                  d="M9.0026 6.22066C9.5779 6.22066 10.0443 5.75429 10.0443 5.179C10.0443 4.6037 9.5779 4.13733 9.0026 4.13733C8.42731 4.13733 7.96094 4.6037 7.96094 5.179C7.96094 5.75429 8.42731 6.22066 9.0026 6.22066Z"
                                  fill="#064771"
                                />
                              </svg>
                            </div>
                          </div>

                          <Controller
                            name="broderIndustries"
                            control={control}
                            render={({ field, fieldState }) => (
                              <div className="w-full">
                                <IndustryDropdown
                                  industries={industries}
                                  multiSelect
                                  selected={field.value}
                                  onSelect={field.onChange}
                                />
                                {fieldState.error && (
                                  <p className="text-red-500 text-sm mt-1">
                                    {fieldState.error.message}
                                  </p>
                                )}
                              </div>
                            )}
                          />
                        </div>

                        <div className="flex flex-col w-[301px] h-[70px] items-start justify-between">
                          <div className="flex items-center gap-1.5 w-full">
                            <span className="font-medium text-[#30313d] text-base leading-[19.3px] font-['Poppins',Helvetica]">
                              Niche / Priority Industry
                            </span>
                            <div className="w-[18px] h-[18px] flex items-center justify-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16.67"
                                height="16.67"
                                viewBox="0 0 18 18"
                                fill="none"
                                className="text-gray-400 hover:text-gray-600 cursor-help"
                              >
                                <path
                                  d="M9.0013 0.666626C7.35313 0.666626 5.74196 1.15537 4.37155 2.07105C3.00114 2.98672 1.93304 4.28821 1.30231 5.81093C0.671579 7.33365 0.506552 9.0092 0.828095 10.6257C1.14964 12.2422 1.94331 13.7271 3.10875 14.8925C4.27419 16.058 5.75904 16.8516 7.37555 17.1732C8.99206 17.4947 10.6676 17.3297 12.1903 16.699C13.713 16.0682 15.0145 15.0001 15.9302 13.6297C16.8459 12.2593 17.3346 10.6481 17.3346 8.99996C17.3322 6.79055 16.4535 4.67233 14.8912 3.11004C13.3289 1.54776 11.2107 0.669016 9.0013 0.666626ZM9.0013 15.9444C7.62782 15.9444 6.28519 15.5371 5.14318 14.7741C4.00117 14.011 3.11108 12.9264 2.58548 11.6575C2.05987 10.3885 1.92234 8.99225 2.1903 7.64516C2.45825 6.29807 3.11964 5.06069 4.09084 4.08949C5.06204 3.1183 6.29942 2.4569 7.64651 2.18895C8.9936 1.921 10.3899 2.05852 11.6588 2.58413C12.9278 3.10974 14.0123 3.99982 14.7754 5.14183C15.5385 6.28384 15.9457 7.62648 15.9457 8.99996C15.9437 10.8411 15.2114 12.6063 13.9095 13.9082C12.6076 15.2101 10.8425 15.9424 9.0013 15.9444Z"
                                  fill="#064771"
                                />
                                <path
                                  d="M9.00217 7.61194H8.30773C8.12355 7.61194 7.94691 7.6851 7.81668 7.81534C7.68645 7.94557 7.61328 8.1222 7.61328 8.30638C7.61328 8.49056 7.68645 8.6672 7.81668 8.79743C7.94691 8.92766 8.12355 9.00083 8.30773 9.00083H9.00217V13.1675C9.00217 13.3517 9.07533 13.5283 9.20557 13.6585C9.3358 13.7888 9.51244 13.8619 9.69661 13.8619C9.88079 13.8619 10.0574 13.7888 10.1877 13.6585C10.3179 13.5283 10.3911 13.3517 10.3911 13.1675V9.00083C10.3911 8.63247 10.2447 8.2792 9.98426 8.01873C9.72379 7.75827 9.37053 7.61194 9.00217 7.61194Z"
                                  fill="#064771"
                                />
                                <path
                                  d="M9.0026 6.22066C9.5779 6.22066 10.0443 5.75429 10.0443 5.179C10.0443 4.6037 9.5779 4.13733 9.0026 4.13733C8.42731 4.13733 7.96094 4.6037 7.96094 5.179C7.96094 5.75429 8.42731 6.22066 9.0026 6.22066Z"
                                  fill="#064771"
                                />
                              </svg>
                            </div>
                          </div>

                          <Controller
                            name="priorityIndustries"
                            control={control}
                            render={({ field }) => (
                              <IndustryDropdown
                                industries={subIndustries}
                                multiSelect
                                selected={field.value}
                                onSelect={field.onChange}
                              />
                            )}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between w-full">
                        <div className="flex flex-col h-[70px] items-start justify-between flex-1">
                          <div className="flex items-center gap-1.5 w-full">
                            <span className="font-medium text-[#30313d] text-base leading-[19.3px] font-['Poppins',Helvetica]">
                              Buyer&apos;s HQ/Origin Country
                            </span>
                            <div className="w-[18px] h-[18px] flex items-center justify-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16.67"
                                height="16.67"
                                viewBox="0 0 18 18"
                                fill="none"
                                className="text-gray-400 hover:text-gray-600 cursor-help"
                              >
                                <path
                                  d="M9.0013 0.666626C7.35313 0.666626 5.74196 1.15537 4.37155 2.07105C3.00114 2.98672 1.93304 4.28821 1.30231 5.81093C0.671579 7.33365 0.506552 9.0092 0.828095 10.6257C1.14964 12.2422 1.94331 13.7271 3.10875 14.8925C4.27419 16.058 5.75904 16.8516 7.37555 17.1732C8.99206 17.4947 10.6676 17.3297 12.1903 16.699C13.713 16.0682 15.0145 15.0001 15.9302 13.6297C16.8459 12.2593 17.3346 10.6481 17.3346 8.99996C17.3322 6.79055 16.4535 4.67233 14.8912 3.11004C13.3289 1.54776 11.2107 0.669016 9.0013 0.666626ZM9.0013 15.9444C7.62782 15.9444 6.28519 15.5371 5.14318 14.7741C4.00117 14.011 3.11108 12.9264 2.58548 11.6575C2.05987 10.3885 1.92234 8.99225 2.1903 7.64516C2.45825 6.29807 3.11964 5.06069 4.09084 4.08949C5.06204 3.1183 6.29942 2.4569 7.64651 2.18895C8.9936 1.921 10.3899 2.05852 11.6588 2.58413C12.9278 3.10974 14.0123 3.99982 14.7754 5.14183C15.5385 6.28384 15.9457 7.62648 15.9457 8.99996C15.9437 10.8411 15.2114 12.6063 13.9095 13.9082C12.6076 15.2101 10.8425 15.9424 9.0013 15.9444Z"
                                  fill="#064771"
                                />
                                <path
                                  d="M9.00217 7.61194H8.30773C8.12355 7.61194 7.94691 7.6851 7.81668 7.81534C7.68645 7.94557 7.61328 8.1222 7.61328 8.30638C7.61328 8.49056 7.68645 8.6672 7.81668 8.79743C7.94691 8.92766 8.12355 9.00083 8.30773 9.00083H9.00217V13.1675C9.00217 13.3517 9.07533 13.5283 9.20557 13.6585C9.3358 13.7888 9.51244 13.8619 9.69661 13.8619C9.88079 13.8619 10.0574 13.7888 10.1877 13.6585C10.3179 13.5283 10.3911 13.3517 10.3911 13.1675V9.00083C10.3911 8.63247 10.2447 8.2792 9.98426 8.01873C9.72379 7.75827 9.37053 7.61194 9.00217 7.61194Z"
                                  fill="#064771"
                                />
                                <path
                                  d="M9.0026 6.22066C9.5779 6.22066 10.0443 5.75429 10.0443 5.179C10.0443 4.6037 9.5779 4.13733 9.0026 4.13733C8.42731 4.13733 7.96094 4.6037 7.96094 5.179C7.96094 5.75429 8.42731 6.22066 9.0026 6.22066Z"
                                  fill="#064771"
                                />
                              </svg>
                            </div>
                          </div>

                          <Controller
                            name="HQCountry"
                            control={control}
                            render={({ field }) => (
                              <div className="w-[300px]">
                                <Dropdown
                                  {...field}
                                  countries={countries}
                                  selected={field.value}
                                  onSelect={field.onChange}
                                />
                              </div>
                            )}
                          />
                        </div>

                        <div className="flex flex-col h-[70px] items-start justify-between flex-1 ml-[125px]">
                          <div className="flex items-center gap-1.5 w-full">
                            <span className="font-medium text-[#30313d] text-base leading-[19.3px] font-['Poppins',Helvetica]">
                              Buyer&apos;s Targeted Countries
                            </span>
                            <div className="w-[18px] h-[18px] flex items-center justify-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16.67"
                                height="16.67"
                                viewBox="0 0 18 18"
                                fill="none"
                                className="text-gray-400 hover:text-gray-600 cursor-help"
                              >
                                <path
                                  d="M9.0013 0.666626C7.35313 0.666626 5.74196 1.15537 4.37155 2.07105C3.00114 2.98672 1.93304 4.28821 1.30231 5.81093C0.671579 7.33365 0.506552 9.0092 0.828095 10.6257C1.14964 12.2422 1.94331 13.7271 3.10875 14.8925C4.27419 16.058 5.75904 16.8516 7.37555 17.1732C8.99206 17.4947 10.6676 17.3297 12.1903 16.699C13.713 16.0682 15.0145 15.0001 15.9302 13.6297C16.8459 12.2593 17.3346 10.6481 17.3346 8.99996C17.3322 6.79055 16.4535 4.67233 14.8912 3.11004C13.3289 1.54776 11.2107 0.669016 9.0013 0.666626ZM9.0013 15.9444C7.62782 15.9444 6.28519 15.5371 5.14318 14.7741C4.00117 14.011 3.11108 12.9264 2.58548 11.6575C2.05987 10.3885 1.92234 8.99225 2.1903 7.64516C2.45825 6.29807 3.11964 5.06069 4.09084 4.08949C5.06204 3.1183 6.29942 2.4569 7.64651 2.18895C8.9936 1.921 10.3899 2.05852 11.6588 2.58413C12.9278 3.10974 14.0123 3.99982 14.7754 5.14183C15.5385 6.28384 15.9457 7.62648 15.9457 8.99996C15.9437 10.8411 15.2114 12.6063 13.9095 13.9082C12.6076 15.2101 10.8425 15.9424 9.0013 15.9444Z"
                                  fill="#064771"
                                />
                                <path
                                  d="M9.00217 7.61194H8.30773C8.12355 7.61194 7.94691 7.6851 7.81668 7.81534C7.68645 7.94557 7.61328 8.1222 7.61328 8.30638C7.61328 8.49056 7.68645 8.6672 7.81668 8.79743C7.94691 8.92766 8.12355 9.00083 8.30773 9.00083H9.00217V13.1675C9.00217 13.3517 9.07533 13.5283 9.20557 13.6585C9.3358 13.7888 9.51244 13.8619 9.69661 13.8619C9.88079 13.8619 10.0574 13.7888 10.1877 13.6585C10.3179 13.5283 10.3911 13.3517 10.3911 13.1675V9.00083C10.3911 8.63247 10.2447 8.2792 9.98426 8.01873C9.72379 7.75827 9.37053 7.61194 9.00217 7.61194Z"
                                  fill="#064771"
                                />
                                <path
                                  d="M9.0026 6.22066C9.5779 6.22066 10.0443 5.75429 10.0443 5.179C10.0443 4.6037 9.5779 4.13733 9.0026 4.13733C8.42731 4.13733 7.96094 4.6037 7.96094 5.179C7.96094 5.75429 8.42731 6.22066 9.0026 6.22066Z"
                                  fill="#064771"
                                />
                              </svg>
                            </div>
                          </div>

                          <Controller
                            name="TargetCountry"
                            control={control}
                            render={({ field }) => (
                              <div className="w-[300px]">
                                <Dropdown
                                  {...field}
                                  countries={countries}
                                  selected={field.value}
                                  onSelect={field.onChange}
                                />
                              </div>
                            )}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between w-full">
                        <div className="flex flex-col w-[301px] h-[70px] items-start justify-between">
                          <div className="flex flex-col w-full gap-2">
                            <div className="flex items-center gap-1.5 w-full">
                              <span className="font-medium text-[#30313d] text-base leading-[19.3px] font-['Poppins',Helvetica]">
                                Expected EBITDA Requirments
                              </span>

                              <div className="w-[18px] h-[18px] flex items-center justify-center">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="16.67"
                                  height="16.67"
                                  viewBox="0 0 18 18"
                                  fill="none"
                                  className="text-gray-400 hover:text-gray-600 cursor-help"
                                >
                                  <path
                                    d="M9.0013 0.666626C7.35313 0.666626 5.74196 1.15537 4.37155 2.07105C3.00114 2.98672 1.93304 4.28821 1.30231 5.81093C0.671579 7.33365 0.506552 9.0092 0.828095 10.6257C1.14964 12.2422 1.94331 13.7271 3.10875 14.8925C4.27419 16.058 5.75904 16.8516 7.37555 17.1732C8.99206 17.4947 10.6676 17.3297 12.1903 16.699C13.713 16.0682 15.0145 15.0001 15.9302 13.6297C16.8459 12.2593 17.3346 10.6481 17.3346 8.99996C17.3322 6.79055 16.4535 4.67233 14.8912 3.11004C13.3289 1.54776 11.2107 0.669016 9.0013 0.666626ZM9.0013 15.9444C7.62782 15.9444 6.28519 15.5371 5.14318 14.7741C4.00117 14.011 3.11108 12.9264 2.58548 11.6575C2.05987 10.3885 1.92234 8.99225 2.1903 7.64516C2.45825 6.29807 3.11964 5.06069 4.09084 4.08949C5.06204 3.1183 6.29942 2.4569 7.64651 2.18895C8.9936 1.921 10.3899 2.05852 11.6588 2.58413C12.9278 3.10974 14.0123 3.99982 14.7754 5.14183C15.5385 6.28384 15.9457 7.62648 15.9457 8.99996C15.9437 10.8411 15.2114 12.6063 13.9095 13.9082C12.6076 15.2101 10.8425 15.9424 9.0013 15.9444Z"
                                    fill="#064771"
                                  />
                                  <path
                                    d="M9.00217 7.61194H8.30773C8.12355 7.61194 7.94691 7.6851 7.81668 7.81534C7.68645 7.94557 7.61328 8.1222 7.61328 8.30638C7.61328 8.49056 7.68645 8.6672 7.81668 8.79743C7.94691 8.92766 8.12355 9.00083 8.30773 9.00083H9.00217V13.1675C9.00217 13.3517 9.07533 13.5283 9.20557 13.6585C9.3358 13.7888 9.51244 13.8619 9.69661 13.8619C9.88079 13.8619 10.0574 13.7888 10.1877 13.6585C10.3179 13.5283 10.3911 13.3517 10.3911 13.1675V9.00083C10.3911 8.63247 10.2447 8.2792 9.98426 8.01873C9.72379 7.75827 9.37053 7.61194 9.00217 7.61194Z"
                                    fill="#064771"
                                  />
                                  <path
                                    d="M9.0026 6.22066C9.5779 6.22066 10.0443 5.75429 10.0443 5.179C10.0443 4.6037 9.5779 4.13733 9.0026 4.13733C8.42731 4.13733 7.96094 4.6037 7.96094 5.179C7.96094 5.75429 8.42731 6.22066 9.0026 6.22066Z"
                                    fill="#064771"
                                  />
                                </svg>
                              </div>
                            </div>

                            <div className="flex gap-[13px]">
                              <div className="w-[200px]">
                                <Input
                                  placeholder="Min eg., 5x"
                                  {...register('ebitdaRequirments.min')}
                                />
                              </div>
                              <span className="text-[#30313D] leading-5 mt-2">-</span>
                              <div className="w-[200px]">
                                <Input
                                  placeholder="Max eg., 20x"
                                  {...register('ebitdaRequirments.max')}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between w-full">
                        <div className="flex flex-col items-start gap-[23px] w-[155px] mt-[20px]">
                          <p className="self-stretch text-[#54575C] text-xs font-medium leading-[19.29px] ml-[140px] mt-[-40px]">
                            Or
                          </p>

                          <div className="flex flex-col items-start gap-[18px] w-[122px]">
                            <div className="flex items-center gap-[17px]">
                              <input
                                type="checkbox"
                                {...register('isMinority')}
                                className="peer w-[24px] h-[24px] rounded-[4px] border-2 border-[#D1D5DB] appearance-none bg-white checked:bg-[#064771] checked:border-transparent focus:outline-none relative
    after:content-[''] after:absolute
    checked:after:content-[''] checked:after:block checked:after:w-[7px] checked:after:h-[14px] checked:after:border-solid checked:after:border-white checked:after:border-b-[3px] checked:after:border-r-[3px] checked:after:transform checked:after:rotate-45 checked:after:top-1/2 checked:after:left-1/2 checked:after:-translate-x-1/2 checked:after:-translate-y-1/2"
                              />
                              <span className="text-[#30313D] text-sm font-medium leading-[19.29px]">
                                Minority
                              </span>

                              <input
                                type="checkbox"
                                {...register('isMajority')}
                                className="peer w-[24px] h-[24px] rounded-[4px] border-2 border-[#D1D5DB] appearance-none bg-white checked:bg-[#064771] checked:border-transparent focus:outline-none relative
    after:content-[''] after:absolute
    checked:after:content-[''] checked:after:block checked:after:w-[7px] checked:after:h-[14px] checked:after:border-solid checked:after:border-white checked:after:border-b-[3px] checked:after:border-r-[3px] checked:after:transform checked:after:rotate-45 checked:after:top-1/2 checked:after:left-1/2 checked:after:-translate-x-1/2 checked:after:-translate-y-1/2 ml-[80px]"
                              />
                              <span className="text-[#30313D] text-sm font-medium leading-[19.29px]">
                                Majority
                              </span>
                            </div>

                            <div className="flex items-center gap-[17px]">
                              <input
                                type="checkbox"
                                {...register('isNegotiable')}
                                className="peer w-[24px] h-[24px] rounded-[4px] border-2 border-[#D1D5DB] appearance-none bg-white checked:bg-[#064771] checked:border-transparent focus:outline-none relative
    after:content-[''] after:absolute
    checked:after:content-[''] checked:after:block checked:after:w-[7px] checked:after:h-[14px] checked:after:border-solid checked:after:border-white checked:after:border-b-[3px] checked:after:border-r-[3px] checked:after:transform checked:after:rotate-45 checked:after:top-1/2 checked:after:left-1/2 checked:after:-translate-x-1/2 checked:after:-translate-y-1/2"
                              />
                              <span className="text-[#30313D] text-sm font-medium leading-[19.29px]">
                                Negotiable
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col w-[301px] h-[70px] items-start justify-between">
                          <div className="flex items-center gap-1.5 w-full">
                            <span className="font-medium text-[#30313d] text-base leading-[19.3px] font-['Poppins',Helvetica]">
                              Source
                            </span>
                            <div className="w-[18px] h-[18px] flex items-center justify-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16.67"
                                height="16.67"
                                viewBox="0 0 18 18"
                                fill="none"
                                className="text-gray-400 hover:text-gray-600 cursor-help"
                              >
                                <path
                                  d="M9.0013 0.666626C7.35313 0.666626 5.74196 1.15537 4.37155 2.07105C3.00114 2.98672 1.93304 4.28821 1.30231 5.81093C0.671579 7.33365 0.506552 9.0092 0.828095 10.6257C1.14964 12.2422 1.94331 13.7271 3.10875 14.8925C4.27419 16.058 5.75904 16.8516 7.37555 17.1732C8.99206 17.4947 10.6676 17.3297 12.1903 16.699C13.713 16.0682 15.0145 15.0001 15.9302 13.6297C16.8459 12.2593 17.3346 10.6481 17.3346 8.99996C17.3322 6.79055 16.4535 4.67233 14.8912 3.11004C13.3289 1.54776 11.2107 0.669016 9.0013 0.666626ZM9.0013 15.9444C7.62782 15.9444 6.28519 15.5371 5.14318 14.7741C4.00117 14.011 3.11108 12.9264 2.58548 11.6575C2.05987 10.3885 1.92234 8.99225 2.1903 7.64516C2.45825 6.29807 3.11964 5.06069 4.09084 4.08949C5.06204 3.1183 6.29942 2.4569 7.64651 2.18895C8.9936 1.921 10.3899 2.05852 11.6588 2.58413C12.9278 3.10974 14.0123 3.99982 14.7754 5.14183C15.5385 6.28384 15.9457 7.62648 15.9457 8.99996C15.9437 10.8411 15.2114 12.6063 13.9095 13.9082C12.6076 15.2101 10.8425 15.9424 9.0013 15.9444Z"
                                  fill="#064771"
                                />
                                <path
                                  d="M9.00217 7.61194H8.30773C8.12355 7.61194 7.94691 7.6851 7.81668 7.81534C7.68645 7.94557 7.61328 8.1222 7.61328 8.30638C7.61328 8.49056 7.68645 8.6672 7.81668 8.79743C7.94691 8.92766 8.12355 9.00083 8.30773 9.00083H9.00217V13.1675C9.00217 13.3517 9.07533 13.5283 9.20557 13.6585C9.3358 13.7888 9.51244 13.8619 9.69661 13.8619C9.88079 13.8619 10.0574 13.7888 10.1877 13.6585C10.3179 13.5283 10.3911 13.3517 10.3911 13.1675V9.00083C10.3911 8.63247 10.2447 8.2792 9.98426 8.01873C9.72379 7.75827 9.37053 7.61194 9.00217 7.61194Z"
                                  fill="#064771"
                                />
                                <path
                                  d="M9.0026 6.22066C9.5779 6.22066 10.0443 5.75429 10.0443 5.179C10.0443 4.6037 9.5779 4.13733 9.0026 4.13733C8.42731 4.13733 7.96094 4.6037 7.96094 5.179C7.96094 5.75429 8.42731 6.22066 9.0026 6.22066Z"
                                  fill="#064771"
                                />
                              </svg>
                            </div>
                          </div>

                          <Controller
                            control={control}
                            name="source"
                            render={({ field }) => (
                              <SelectPicker
                                options={sourceOptions}
                                value={field.value}
                                onChange={field.onChange}
                                searchable={false}
                                placeholder="Partner / TCG"
                              />
                            )}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between w-full">
                        <div className="flex flex-col w-[301px] h-[70px] items-start justify-between">
                          <div className="flex items-center gap-1.5 w-full">
                            <span className="font-medium text-[#30313d] text-base leading-[19.3px] font-['Poppins',Helvetica]">
                              {filterFields[3].label}
                            </span>
                            <div className="w-[18px] h-[18px] flex items-center justify-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16.67"
                                height="16.67"
                                viewBox="0 0 18 18"
                                fill="none"
                                className="text-gray-400 hover:text-gray-600 cursor-help"
                              >
                                <path
                                  d="M9.0013 0.666626C7.35313 0.666626 5.74196 1.15537 4.37155 2.07105C3.00114 2.98672 1.93304 4.28821 1.30231 5.81093C0.671579 7.33365 0.506552 9.0092 0.828095 10.6257C1.14964 12.2422 1.94331 13.7271 3.10875 14.8925C4.27419 16.058 5.75904 16.8516 7.37555 17.1732C8.99206 17.4947 10.6676 17.3297 12.1903 16.699C13.713 16.0682 15.0145 15.0001 15.9302 13.6297C16.8459 12.2593 17.3346 10.6481 17.3346 8.99996C17.3322 6.79055 16.4535 4.67233 14.8912 3.11004C13.3289 1.54776 11.2107 0.669016 9.0013 0.666626ZM9.0013 15.9444C7.62782 15.9444 6.28519 15.5371 5.14318 14.7741C4.00117 14.011 3.11108 12.9264 2.58548 11.6575C2.05987 10.3885 1.92234 8.99225 2.1903 7.64516C2.45825 6.29807 3.11964 5.06069 4.09084 4.08949C5.06204 3.1183 6.29942 2.4569 7.64651 2.18895C8.9936 1.921 10.3899 2.05852 11.6588 2.58413C12.9278 3.10974 14.0123 3.99982 14.7754 5.14183C15.5385 6.28384 15.9457 7.62648 15.9457 8.99996C15.9437 10.8411 15.2114 12.6063 13.9095 13.9082C12.6076 15.2101 10.8425 15.9424 9.0013 15.9444Z"
                                  fill="#064771"
                                />
                                <path
                                  d="M9.00217 7.61194H8.30773C8.12355 7.61194 7.94691 7.6851 7.81668 7.81534C7.68645 7.94557 7.61328 8.1222 7.61328 8.30638C7.61328 8.49056 7.68645 8.6672 7.81668 8.79743C7.94691 8.92766 8.12355 9.00083 8.30773 9.00083H9.00217V13.1675C9.00217 13.3517 9.07533 13.5283 9.20557 13.6585C9.3358 13.7888 9.51244 13.8619 9.69661 13.8619C9.88079 13.8619 10.0574 13.7888 10.1877 13.6585C10.3179 13.5283 10.3911 13.3517 10.3911 13.1675V9.00083C10.3911 8.63247 10.2447 8.2792 9.98426 8.01873C9.72379 7.75827 9.37053 7.61194 9.00217 7.61194Z"
                                  fill="#064771"
                                />
                                <path
                                  d="M9.0026 6.22066C9.5779 6.22066 10.0443 5.75429 10.0443 5.179C10.0443 4.6037 9.5779 4.13733 9.0026 4.13733C8.42731 4.13733 7.96094 4.6037 7.96094 5.179C7.96094 5.75429 8.42731 6.22066 9.0026 6.22066Z"
                                  fill="#064771"
                                />
                              </svg>
                            </div>
                          </div>

                          <Controller
                            control={control}
                            name="status"
                            render={({ field }) => (
                              <SelectPicker
                                options={statusOptions}
                                value={field.value}
                                onChange={field.onChange}
                                searchable={false}
                                placeholder="Select Status"
                              />
                            )}
                          />
                        </div>

                        <div className="flex flex-col w-[301px] h-[70px] items-start justify-between">
                          <div className="flex flex-col w-full gap-2">
                            <div className="flex items-center gap-1.5 w-full">
                              <span className="font-medium text-[#30313d] text-base leading-[19.3px] font-['Poppins',Helvetica]">
                                Investment Amount Range
                              </span>
                            </div>

                            <div className="flex gap-[13px]">
                              <div className="w-[200px]">
                                <Input
                                  placeholder="Minimum"
                                  {...register('investmentAmount.min', {
                                    valueAsNumber: true, // Convert input to number
                                  })}
                                />
                              </div>
                              <span className="text-[#30313D] leading-5 mt-2">-</span>
                              <div className="w-[200px]">
                                <Input
                                  placeholder="Maximum"
                                  {...register('investmentAmount.max', {
                                    valueAsNumber: true, // Convert input to number
                                  })}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between w-full">
                        <div className="flex flex-col w-[301px] h-[70px] items-start justify-between">
                          <div className="flex items-center gap-1.5 w-full">
                            <span className="font-medium text-[#30313d] text-base leading-[19.3px] font-['Poppins',Helvetica]">
                              Currency
                            </span>
                            <div className="w-[18px] h-[18px] flex items-center justify-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16.67"
                                height="16.67"
                                viewBox="0 0 18 18"
                                fill="none"
                                className="text-gray-400 hover:text-gray-600 cursor-help"
                              >
                                <path
                                  d="M9.0013 0.666626C7.35313 0.666626 5.74196 1.15537 4.37155 2.07105C3.00114 2.98672 1.93304 4.28821 1.30231 5.81093C0.671579 7.33365 0.506552 9.0092 0.828095 10.6257C1.14964 12.2422 1.94331 13.7271 3.10875 14.8925C4.27419 16.058 5.75904 16.8516 7.37555 17.1732C8.99206 17.4947 10.6676 17.3297 12.1903 16.699C13.713 16.0682 15.0145 15.0001 15.9302 13.6297C16.8459 12.2593 17.3346 10.6481 17.3346 8.99996C17.3322 6.79055 16.4535 4.67233 14.8912 3.11004C13.3289 1.54776 11.2107 0.669016 9.0013 0.666626ZM9.0013 15.9444C7.62782 15.9444 6.28519 15.5371 5.14318 14.7741C4.00117 14.011 3.11108 12.9264 2.58548 11.6575C2.05987 10.3885 1.92234 8.99225 2.1903 7.64516C2.45825 6.29807 3.11964 5.06069 4.09084 4.08949C5.06204 3.1183 6.29942 2.4569 7.64651 2.18895C8.9936 1.921 10.3899 2.05852 11.6588 2.58413C12.9278 3.10974 14.0123 3.99982 14.7754 5.14183C15.5385 6.28384 15.9457 7.62648 15.9457 8.99996C15.9437 10.8411 15.2114 12.6063 13.9095 13.9082C12.6076 15.2101 10.8425 15.9424 9.0013 15.9444Z"
                                  fill="#064771"
                                />
                                <path
                                  d="M9.00217 7.61194H8.30773C8.12355 7.61194 7.94691 7.6851 7.81668 7.81534C7.68645 7.94557 7.61328 8.1222 7.61328 8.30638C7.61328 8.49056 7.68645 8.6672 7.81668 8.79743C7.94691 8.92766 8.12355 9.00083 8.30773 9.00083H9.00217V13.1675C9.00217 13.3517 9.07533 13.5283 9.20557 13.6585C9.3358 13.7888 9.51244 13.8619 9.69661 13.8619C9.88079 13.8619 10.0574 13.7888 10.1877 13.6585C10.3179 13.5283 10.3911 13.3517 10.3911 13.1675V9.00083C10.3911 8.63247 10.2447 8.2792 9.98426 8.01873C9.72379 7.75827 9.37053 7.61194 9.00217 7.61194Z"
                                  fill="#064771"
                                />
                                <path
                                  d="M9.0026 6.22066C9.5779 6.22066 10.0443 5.75429 10.0443 5.179C10.0443 4.6037 9.5779 4.13733 9.0026 4.13733C8.42731 4.13733 7.96094 4.6037 7.96094 5.179C7.96094 5.75429 8.42731 6.22066 9.0026 6.22066Z"
                                  fill="#064771"
                                />
                              </svg>
                            </div>
                          </div>

                          <Controller
                            control={control}
                            name="currency"
                            render={({ field }) => (
                              <SelectPicker
                                options={currencyOptions}
                                value={field.value}
                                onChange={field.onChange}
                                searchable={false}
                                placeholder="Select Currency"
                              />
                            )}
                          />
                        </div>

                        <div className="flex flex-col w-[301px] h-[70px] items-start justify-between">
                          <div className="flex items-center gap-1.5 w-full">
                            <span className="font-medium text-[#30313d] text-base leading-[19.3px] font-['Poppins',Helvetica]">
                              M&A Structure
                            </span>
                            <div className="w-[18px] h-[18px] flex items-center justify-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16.67"
                                height="16.67"
                                viewBox="0 0 18 18"
                                fill="none"
                                className="text-gray-400 hover:text-gray-600 cursor-help"
                              >
                                <path
                                  d="M9.0013 0.666626C7.35313 0.666626 5.74196 1.15537 4.37155 2.07105C3.00114 2.98672 1.93304 4.28821 1.30231 5.81093C0.671579 7.33365 0.506552 9.0092 0.828095 10.6257C1.14964 12.2422 1.94331 13.7271 3.10875 14.8925C4.27419 16.058 5.75904 16.8516 7.37555 17.1732C8.99206 17.4947 10.6676 17.3297 12.1903 16.699C13.713 16.0682 15.0145 15.0001 15.9302 13.6297C16.8459 12.2593 17.3346 10.6481 17.3346 8.99996C17.3322 6.79055 16.4535 4.67233 14.8912 3.11004C13.3289 1.54776 11.2107 0.669016 9.0013 0.666626ZM9.0013 15.9444C7.62782 15.9444 6.28519 15.5371 5.14318 14.7741C4.00117 14.011 3.11108 12.9264 2.58548 11.6575C2.05987 10.3885 1.92234 8.99225 2.1903 7.64516C2.45825 6.29807 3.11964 5.06069 4.09084 4.08949C5.06204 3.1183 6.29942 2.4569 7.64651 2.18895C8.9936 1.921 10.3899 2.05852 11.6588 2.58413C12.9278 3.10974 14.0123 3.99982 14.7754 5.14183C15.5385 6.28384 15.9457 7.62648 15.9457 8.99996C15.9437 10.8411 15.2114 12.6063 13.9095 13.9082C12.6076 15.2101 10.8425 15.9424 9.0013 15.9444Z"
                                  fill="#064771"
                                />
                                <path
                                  d="M9.00217 7.61194H8.30773C8.12355 7.61194 7.94691 7.6851 7.81668 7.81534C7.68645 7.94557 7.61328 8.1222 7.61328 8.30638C7.61328 8.49056 7.68645 8.6672 7.81668 8.79743C7.94691 8.92766 8.12355 9.00083 8.30773 9.00083H9.00217V13.1675C9.00217 13.3517 9.07533 13.5283 9.20557 13.6585C9.3358 13.7888 9.51244 13.8619 9.69661 13.8619C9.88079 13.8619 10.0574 13.7888 10.1877 13.6585C10.3179 13.5283 10.3911 13.3517 10.3911 13.1675V9.00083C10.3911 8.63247 10.2447 8.2792 9.98426 8.01873C9.72379 7.75827 9.37053 7.61194 9.00217 7.61194Z"
                                  fill="#064771"
                                />
                                <path
                                  d="M9.0026 6.22066C9.5779 6.22066 10.0443 5.75429 10.0443 5.179C10.0443 4.6037 9.5779 4.13733 9.0026 4.13733C8.42731 4.13733 7.96094 4.6037 7.96094 5.179C7.96094 5.75429 8.42731 6.22066 9.0026 6.22066Z"
                                  fill="#064771"
                                />
                              </svg>
                            </div>
                          </div>

                          <Controller
                            control={control}
                            name="dealStructure"
                            render={({ field }) => (
                              <SelectPicker
                                options={dealStructureOptions}
                                value={field.value}
                                onChange={field.onChange}
                                searchable={false}
                                placeholder="Merger / Acquisition"
                              />
                            )}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-4 w-full sticky bottom-0 bg-white z-10 px-6 py-4 ">
                      <div className="flex items-center space-x-3 mr-auto">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            {...register('showOnlyPinned')}
                            checked={isComponentOpen}
                            onChange={() => setIsComponentOpen((prev) => !prev)}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#3181b6] rounded-full peer dark:bg-gray-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#064771]"></div>
                        </label>
                        <span className="text-sm font-medium text-[#064771]">Show Only Pinned</span>
                      </div>

                      <button
                        className="h-[34px] px-3 py-[5.03px] bg-[#f1faff] rounded-[49.82px] border-[0.77px] border-solid border-[#0c5577] text-[#0c5577] font-normal text-base font-['Poppins',Helvetica] hover:bg-[#e6f4ff] transition-colors cursor-pointer flex items-center"
                        onClick={handleClearFilter}
                      >
                        {' '}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="16"
                          viewBox="0 0 14 16"
                          fill="none"
                        >
                          <path
                            d="M8.86451 3.50036L11.2947 4.97838L12.4032 3.15929C12.8083 2.49134 12.5951 1.61022 11.9271 1.20518C11.2592 0.80015 10.3781 1.01331 9.97302 1.68126L8.86451 3.50036Z"
                            stroke="#0C5577"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M7.47864 5.98067L9.72409 7.34502C11.0316 8.14087 11.4295 9.7468 10.7971 11.0259L9.34038 13.9961C8.87139 14.9554 7.73445 15.2894 6.8249 14.728L2.25584 11.9496C1.33918 11.3954 1.1189 10.2371 1.75132 9.37729L3.71964 6.7197C4.57234 5.56856 6.17116 5.18482 7.47864 5.98067Z"
                            stroke="#0C5577"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M8.2345 3.09766L11.876 5.31511L10.3977 7.74275L6.7562 5.5253L8.2345 3.09766Z"
                            stroke="#0C5577"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M5.70947 11.418L4.53701 13.3437"
                            stroke="#0C5577"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M7.52832 12.5273L6.35585 14.453"
                            stroke="#0C5577"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M3.89062 10.3105L2.71816 12.2362"
                            stroke="#0C5577"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span className="cursor-pointer pl-1">Clear Filter</span>
                      </button>
                      <button
                        className="h-[34.49px] px-3 py-[5.03px] bg-[#064771] rounded-[49.82px] text-white font-medium text-base font-['Poppins',Helvetica] hover:bg-[#053a5a] transition-colors cursor-pointer flex items-center"
                        onClick={handleSubmit(handleApplySearch)}
                      >
                        <span className="p-2">Apply & Search</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="9"
                          height="15"
                          viewBox="0 0 9 15"
                          fill="none"
                        >
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M0.782523 2.39433C0.405826 2.0195 0.405826 1.4118 0.782523 1.03698C1.15922 0.662154 1.76997 0.662154 2.14667 1.03698L8.21774 7.07781C8.59409 7.45229 8.59409 8.05943 8.21774 8.43391L2.14667 14.4747C1.76997 14.8496 1.15922 14.8496 0.782523 14.4747C0.405826 14.0999 0.405826 13.4922 0.782523 13.1174L6.17089 7.75586L0.782523 2.39433Z"
                            fill="white"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <table className="w-full table-fixed border-separate">
        <tbody>
          {loading
            ? Array.from({ length: 5 }).map((_, index) => (
                <tr key={index} className="animate-pulse">
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-300 rounded w-full"></div>
                    </div>
                  </td>
                </tr>
              ))
            : buyers.map((buyer) => {
                const countryData = getCountryById(parseInt(buyer.company_overview?.hq_country));
                const targetCountriesRaw = buyer?.target_preference?.target_countries;
                const targetCountries =
                  typeof targetCountriesRaw === 'string'
                    ? JSON.parse(targetCountriesRaw)
                    : targetCountriesRaw;

                const status = buyer.company_overview?.status ?? 'N/A';

                const statusColors: Record<string, string> = {
                  Active: 'bg-green-700',
                  Completed: 'bg-green-700',
                  'Deal Closed': 'bg-[#064771]',
                  'In Progress': 'bg-cyan-900',
                  Interested: 'bg-orange-500',
                  'On Hold': 'bg-yellow-400',
                  Canceled: 'bg-red-600',
                  'Not Interested': 'bg-red-500',
                  'In-Active': 'bg-gray-500',
                  Drafts: 'bg-yellow-800',
                  'N/A': 'bg-blue-800',
                };

                const pillColor = statusColors[status] || 'bg-blue-800';

                const employeeData = getEmployeeById(
                  parseInt(buyer.company_overview?.incharge_name)
                );
                const isSelected = selectedBuyerIds.has(buyer.id);
                return (
                  <tr key={buyer.id}>
                    <td className="w-full p-6">
                      <div
                        className={`w-full h-auto md:h-[400px] flex flex-col justify-center items-center gap-[10px] rounded-[10px] border ${
                          isSelected
                            ? 'border-[#064771] bg-[#F5FBFF]'
                            : buyer.pinned === 1
                              ? 'border-[#E5E7EB] bg-[#F5FBFF]'
                              : 'border-[#E5E7EB] bg-[#FFFFFF]'
                        }`}
                        {...(isComponentOpen
                          ? {
                              role: 'checkbox',
                              tabIndex: 0,
                              'aria-checked': isSelected,
                              onClick: (e) => {
                                if (
                                  e.target instanceof HTMLElement &&
                                  e.target.tagName.toLowerCase() === 'input'
                                ) {
                                  return;
                                }
                                handleCheckboxChange(buyer.id);
                              },
                              onKeyDown: (e) => {
                                if (e.key === ' ' || e.key === 'Enter') {
                                  e.preventDefault();
                                  handleCheckboxChange(buyer.id);
                                }
                              },
                              style: { cursor: 'pointer' },
                            }
                          : {})}
                      >
                        {isComponentOpen && (
                          <div className="self-start pl-4 pt-4">
                            <input
                              type="checkbox"
                              className="h-5 w-5 border-gray-300 rounded focus:ring-blue-500 accent-blue-600"
                              checked={isSelected}
                              onChange={() => handleCheckboxChange(buyer.id)}
                              style={{ accentColor: '#064771' }}
                            />
                          </div>
                        )}
                        <div className="w-full px-[30px] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-4">
                          <div className="flex flex-col md:flex-row items-start gap-4 w-full md:w-auto">
                            <div
                              className="flex justify-start items-start flex-col gap-[37px] w-[615px]"
                              style={{ width: '615px' }}
                            >
                              <div className="flex self-stretch justify-start items-center flex-row gap-[18px]">
                                {buyer.image ? (
                                  <img
                                    className="rounded-[72.5px] w-[145px] h-[145px]"
                                    src={`${
                                      import.meta.env.VITE_API_BASE_URL
                                    }/storage/${buyer.image}`}
                                    style={{
                                      objectFit: 'cover',
                                      width: '145px',
                                    }}
                                    alt="Buyer"
                                  />
                                ) : (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="145"
                                    height="145"
                                    viewBox="0 0 145 145"
                                    fill="none"
                                  >
                                    <rect
                                      x="1"
                                      y="1"
                                      width="143"
                                      height="143"
                                      rx="71.5"
                                      fill="#F1FBFF"
                                    />
                                    <rect
                                      x="1"
                                      y="1"
                                      width="143"
                                      height="143"
                                      rx="71.5"
                                      stroke="#064771"
                                      strokeWidth="2"
                                    />
                                    <path
                                      fillRule="evenodd"
                                      clipRule="evenodd"
                                      d="M45.7273 42.5C44.2211 42.5 43 43.7211 43 45.2273C43 46.7335 44.2211 47.9545 45.7273 47.9545H49.0524L58.773 86.837C55.9075 88.1098 53.9091 90.9805 53.9091 94.3182C53.9091 98.837 57.5722 102.5 62.0909 102.5C66.6096 102.5 70.2727 98.837 70.2727 94.3182C70.2727 93.362 70.1085 92.444 69.8072 91.5909H81.6474C81.346 92.444 81.1818 93.362 81.1818 94.3182C81.1818 98.837 84.8448 102.5 89.3636 102.5C93.8825 102.5 97.5455 98.837 97.5455 94.3182C97.5455 89.7994 93.8825 86.1364 89.3636 86.1364H64.2203L62.8567 80.6818H89.3636C94.9933 80.6818 98.3688 77.1252 100.242 73.1979C102.072 69.3601 102.71 64.7734 102.932 61.4373C103.241 56.7913 99.4008 53.4091 95.1485 53.4091H56.0385L54.3441 46.6316C53.7371 44.2034 51.5553 42.5 49.0524 42.5H45.7273ZM89.3636 75.2273H61.493L57.4021 58.8636H95.1485C96.6569 58.8636 97.5626 59.973 97.4893 61.0749C97.282 64.1878 96.7016 67.9504 95.3189 70.8497C93.9787 73.6594 92.1457 75.2273 89.3636 75.2273ZM89.3636 97.0285C87.8666 97.0285 86.6533 95.8152 86.6533 94.3182C86.6533 92.8212 87.8666 91.6078 89.3636 91.6078C90.8606 91.6078 92.074 92.8212 92.074 94.3182C92.074 95.8152 90.8606 97.0285 89.3636 97.0285ZM59.3805 94.3182C59.3805 95.8152 60.594 97.0285 62.0909 97.0285C63.5879 97.0285 64.8014 95.8152 64.8014 94.3182C64.8014 92.8212 63.5879 91.6078 62.0909 91.6078C60.594 91.6078 59.3805 92.8212 59.3805 94.3182Z"
                                      fill="#064771"
                                    />
                                  </svg>
                                )}

                                <div
                                  className="flex justify-start items-start flex-col gap-[18px] w-[475px]"
                                  style={{ width: '475px' }}
                                >
                                  <div className="flex self-stretch justify-start items-start flex-col gap-1.5">
                                    <div className="flex self-stretch justify-start items-center flex-row gap-[15px]">
                                      <span className="text-[rgba(0,0,0,0.88)] text-2xl font-semibold leading-8 truncate overflow-hidden whitespace-nowrap max-w-[300px] block">
                                        {buyer.company_overview?.reg_name ?? 'N/A'}
                                      </span>

                                      <Pinned
                                        initialState={!!buyer.pinned}
                                        onChange={() => handlePinnedToggle(buyer.id)}
                                      />
                                    </div>
                                    <div className="flex justify-start items-center flex-row gap-2.5">
                                      <span className="text-[#838383] text-sm font-medium leading-[18.860000610351562px]">
                                        Buyer’s Business Overview
                                      </span>
                                      <div className="w-[2px] h-[24px] bg-[#94989C]"></div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[#838383] text-sm font-medium leading-[18.86px] inline">
                                          Last Release
                                        </span>
                                        <span className="text-[#30313D] text-sm leading-[18.86px] inline">
                                          {buyer?.updated_at
                                            ? new Date(buyer.updated_at).toLocaleString('en-US', {
                                                month: 'long',
                                                year: 'numeric',
                                              })
                                            : 'N/A'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-sm leading-5">
                                    <div className="text-sm text-gray-900">
                                      <div
                                        ref={contentRef}
                                        className={`transition-all duration-300 ${
                                          expanded ? '' : 'line-clamp-2'
                                        } overflow-hidden`}
                                      >
                                        <div
                                          dangerouslySetInnerHTML={{
                                            __html: buyer.company_overview?.details || 'N/A',
                                          }}
                                        />
                                      </div>

                                      {isOverflowing && !expanded && (
                                        <span
                                          className="text-[#053a5c] font-semibold cursor-pointer"
                                          onClick={() => setExpanded(true)}
                                        >
                                          See More
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div
                                className="flex justify-start items-start flex-col gap-[27px] w-[446px]"
                                style={{ width: '446px' }}
                              >
                                <div className="flex self-stretch justify-start items-center flex-row gap-3.5">
                                  <div className="flex justify-start items-start flex-row gap-5">
                                    <div
                                      className="flex justify-between items-start flex-col gap-2.5 w-[126px] h-[40px]"
                                      style={{ width: '126px' }}
                                    >
                                      <span className="text-[#838383] text-sm text-center font-medium leading-[18.860000610351562px]">
                                        Established in
                                      </span>
                                      <div className="flex self-stretch justify-start items-center flex-row gap-1.5">
                                        {countryData ? (
                                          <>
                                            <div className="flex items-center gap-2 max-w-[140px]">
                                              <img
                                                className="w-[20px] h-[20px] rounded-full shrink-0"
                                                alt={`${countryData.name} flag`}
                                                src={countryData.flagSrc}
                                              />
                                              <span className="font-poppins text-sm truncate">
                                                {countryData.name}
                                              </span>
                                            </div>
                                          </>
                                        ) : (
                                          <span className="text-[#A0A0A0] italic">N/A</span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="w-[2px] h-[40px] bg-[#94989C]"></div>
                                  </div>
                                  <div className="flex justify-start items-start flex-row gap-5">
                                    <div className="flex flex-col justify-between items-start gap-2.5 w-[126px] h-[40px]">
                                      <span className="text-[#838383] text-sm font-medium leading-[18.860000610351562px]">
                                        Preferred Country
                                      </span>
                                      <div className="flex self-stretch justify-start items-center flex-row gap-1.5">
                                        {Array.isArray(targetCountries) &&
                                        targetCountries.length > 0 ? (
                                          targetCountries.length === 1 ? (
                                            <div className="flex items-center gap-2 max-w-[140px]">
                                              <img
                                                className="w-[20px] h-[20px] rounded-full shrink-0"
                                                alt={`${targetCountries[0].name} flag`}
                                                src={targetCountries[0].flagSrc}
                                              />
                                              <span className="font-poppins text-sm truncate">
                                                {targetCountries[0].name}
                                              </span>
                                            </div>
                                          ) : (
                                            <div className="flex items-center gap-1">
                                              <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="18"
                                                height="19"
                                                viewBox="0 0 18 19"
                                                fill="none"
                                              >
                                                <path
                                                  d="M8.97487 0.500035C7.98269 0.501756 6.99767 0.667961 6.05986 0.991887C6.02093 1.00192 5.98313 1.01591 5.94705 1.03363C3.82726 1.79802 2.07134 3.3298 1.02633 5.32623C-0.0186909 7.32266 -0.276765 9.63848 0.303109 11.816C0.882982 13.9935 2.25861 15.8742 4.15812 17.0865C6.05762 18.2988 8.34279 18.7545 10.562 18.3634C12.7812 17.9723 14.7729 16.763 16.1436 14.9744C17.5143 13.1858 18.1641 10.948 17.9647 8.70349C17.7652 6.45894 16.7311 4.37086 15.0665 2.85193C13.402 1.333 11.2283 0.493743 8.97487 0.500035ZM1.07817 9.52484C1.07998 7.93312 1.56277 6.3791 2.46323 5.06656C3.36368 3.75402 4.63977 2.74424 6.12416 2.16962L7.64033 3.4173C7.70476 3.47013 7.7567 3.53658 7.79239 3.61187C7.82809 3.68716 7.84666 3.76943 7.84677 3.85275V5.41404C7.63803 5.28806 7.4043 5.20917 7.16192 5.18287C6.91953 5.15656 6.67432 5.18348 6.44341 5.26175L4.49067 5.91492C4.15425 6.02723 3.86163 6.24241 3.65414 6.53006C3.44665 6.81771 3.3348 7.16328 3.33437 7.51795V8.082C3.33447 8.45946 3.46078 8.82604 3.69319 9.12346C3.9256 9.42087 4.25078 9.63204 4.61702 9.72339L6.71867 10.248C6.80679 10.2692 6.88851 10.3113 6.95689 10.3708C7.02528 10.4303 7.07832 10.5054 7.11152 10.5897C7.14473 10.6741 7.15711 10.7652 7.14764 10.8553C7.13817 10.9454 7.10711 11.032 7.0571 11.1076L5.87823 12.8764C5.69192 13.1528 5.5918 13.4783 5.59057 13.8116V16.6454C4.24259 16.006 3.10332 14.9978 2.30472 13.7376C1.50611 12.4774 1.08084 11.0168 1.07817 9.52484ZM6.67467 17.0775C6.70375 17.0078 6.7187 16.933 6.71867 16.8575V13.8116C6.71853 13.7 6.75151 13.5909 6.81343 13.498L7.99229 11.7303C8.14264 11.5046 8.23655 11.2461 8.26612 10.9765C8.29568 10.707 8.26003 10.4343 8.16216 10.1814C8.0643 9.92849 7.9071 9.70282 7.70379 9.52338C7.50048 9.34394 7.25702 9.21599 6.99393 9.15031L4.89002 8.62236C4.76869 8.5921 4.66085 8.52238 4.58346 8.42416C4.50606 8.32594 4.4635 8.20479 4.46247 8.07974V7.51569C4.46232 7.39717 4.49952 7.2816 4.56877 7.18542C4.63803 7.08923 4.73582 7.0173 4.84828 6.97985L6.79989 6.33006C6.89934 6.29689 7.00607 6.29209 7.10809 6.3162C7.21012 6.34031 7.3034 6.39238 7.37748 6.46656L8.01147 7.10168C8.09022 7.18063 8.19061 7.23447 8.29995 7.25639C8.40929 7.27831 8.52267 7.26733 8.62577 7.22483C8.72887 7.18234 8.81705 7.11023 8.87919 7.01764C8.94133 6.92504 8.97462 6.8161 8.97487 6.70459V3.85275C8.97481 3.60296 8.91945 3.35628 8.81276 3.13041C8.70607 2.90455 8.5507 2.70511 8.3578 2.54641L7.42937 1.78269C8.9695 1.47296 10.5671 1.63114 12.0166 2.23687C13.4661 2.8426 14.7012 3.86818 15.563 5.18165L12.5171 5.94425C12.1502 6.03495 11.8243 6.24584 11.5912 6.54332C11.3581 6.84079 11.2314 7.20773 11.2311 7.58564V8.2625C11.2298 8.57704 11.3168 8.88564 11.4821 9.15325C11.6474 9.42086 11.8844 9.63675 12.1663 9.77641L12.9898 10.187C13.1046 10.2445 13.1963 10.3395 13.2499 10.4562C13.3034 10.5729 13.3155 10.7044 13.2842 10.8289L12.5318 13.8432C12.4607 14.1267 12.4643 14.4238 12.5422 14.7055C12.6201 14.9873 12.7696 15.244 12.9762 15.4508L13.5064 15.981C12.5269 16.673 11.4019 17.1315 10.2177 17.3214C9.03345 17.5113 7.82148 17.4286 6.67467 17.0775ZM14.383 15.2635L13.7738 14.6543C13.705 14.5854 13.6552 14.4998 13.6293 14.4059C13.6034 14.312 13.6023 14.2129 13.626 14.1185L14.3796 11.1042C14.4745 10.7306 14.4384 10.3359 14.2772 9.98577C14.116 9.63569 13.8396 9.35153 13.494 9.18077L12.6705 8.76901C12.5768 8.72204 12.498 8.64986 12.443 8.56059C12.388 8.47132 12.359 8.36848 12.3592 8.26362V7.58676C12.359 7.46075 12.4009 7.3383 12.4784 7.23893C12.5559 7.13956 12.6645 7.069 12.7867 7.03851L16.1282 6.20371C16.833 7.70446 17.0438 9.39008 16.7302 11.0182C16.4166 12.6463 15.5948 14.133 14.383 15.2646V15.2635Z"
                                                  fill="black"
                                                />
                                              </svg>
                                              <span className="text-[#30313D] font-semibold leading-[22px]">
                                                Multiple
                                              </span>
                                            </div>
                                          )
                                        ) : (
                                          <span className="text-[#A0A0A0] italic">N/A</span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="w-[2px] h-[40px] bg-[#94989C]"></div>
                                  </div>
                                  <div className="flex justify-between items-start flex-col gap-2.5 w-[126px] h-[40px]">
                                    <span className="text-[#838383] text-sm font-medium leading-[18.860000610351562px]">
                                      EXpected EBITDA
                                    </span>

                                    <p className="self-stretch text-[#30313D] font-semibold leading-[22px] break-words">
                                      {(() => {
                                        try {
                                          const raw = buyer.financial_details?.expected_ebitda;
                                          if (!raw) return 'N/A';
                                          const { min, max } = JSON.parse(raw);
                                          let text = '';
                                          if (!min && !max) return 'N/A';
                                          if (min && !max) text = `${min}`;
                                          else if (!min && max) text = `${max}`;
                                          else text = `${min} - ${max}`;

                                          return text.length > 40
                                            ? `${text.slice(0, 20)}...${text.slice(-10)}`
                                            : text;
                                        } catch {
                                          return 'N/A';
                                        }
                                      })()}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex self-stretch justify-start items-center flex-row gap-3.5">
                                  <div className="flex justify-start items-center flex-row gap-5">
                                    <div className="flex justify-between items-start flex-col gap-2.5 w-[126px] h-[40px]">
                                      <span className="text-[#838383] text-sm text-center font-medium leading-[18.860000610351562px]">
                                        Valuation Budget
                                      </span>
                                      <div className="flex self-stretch justify-start items-center flex-row gap-1.5">
                                        <span className="leading-[22px]">
                                          {(() => {
                                            try {
                                              const rawValuation =
                                                buyer.financial_details?.valuation;
                                              if (!rawValuation) return 'N/A';

                                              const { min, max } = JSON.parse(rawValuation);
                                              return (
                                                <>
                                                  <span className="text-[#30313D] font-semibold">
                                                    {min ?? 'N/A'}
                                                  </span>
                                                  <span className="text-[#838383] mx-1">-</span>
                                                  <span className="text-[#30313D] font-semibold">
                                                    {max ?? 'N/A'}
                                                  </span>
                                                </>
                                              );
                                            } catch {
                                              return 'N/A';
                                            }
                                          })()}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="w-[2px] h-[40px] bg-[#94989C]"></div>
                                  </div>
                                  <div className="flex justify-start items-center flex-row gap-5">
                                    <div className="flex justify-between items-start flex-col gap-2.5 w-[126px] h-[40px]">
                                      <span className="text-[#838383] text-sm font-medium leading-3">
                                        Holding %
                                      </span>
                                      <p className="self-stretch text-[#30313D] font-semibold leading-[15px]">
                                        {(() => {
                                          const shareholdingStr =
                                            buyer.financial_details?.shareholding;
                                          if (!shareholdingStr) return 'N/A';
                                          try {
                                            const { min, max } = JSON.parse(shareholdingStr);
                                            return min && max ? `${min}% - ${max}%` : 'N/A';
                                          } catch {
                                            return 'N/A';
                                          }
                                        })()}
                                      </p>
                                    </div>
                                    <div className="w-[2px] h-[40px] bg-[#94989C]"></div>
                                  </div>
                                  <div className="flex flex-col justify-between items-start gap-1 min-w-[126px] h-10 whitespace-nowrap">
                                    <span className="text-gray-500 text-sm font-medium leading-6">
                                      Investment Range
                                    </span>
                                    <span className="leading-[22px]">
                                      {(() => {
                                        try {
                                          const rawInvestment =
                                            buyer.financial_details?.investment_budget;
                                          if (!rawInvestment) return 'N/A';

                                          const { min, max } = JSON.parse(rawInvestment);
                                          return (
                                            <>
                                              <span className="text-[#30313D] font-semibold">
                                                {min ?? 'N/A'}
                                              </span>
                                              <span className="text-[#838383] mx-1">-</span>
                                              <span className="text-[#30313D] font-semibold">
                                                {max ?? 'N/A'}
                                              </span>
                                            </>
                                          );
                                        } catch {
                                          return 'N/A';
                                        }
                                      })()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col md:flex-row items-start gap-4 w-full md:w-auto">
                            <div className="flex flex-col justify-end items-end gap-20 w-auto">
                              <div className="flex justify-start items-center flex-row gap-7">
                                <div className="flex justify-start items-center flex-row gap-5">
                                  <div className="flex justify-between items-end flex-col gap-2.5 w-[132px] h-[40px]">
                                    <span className="text-[#838383] text-sm font-medium leading-[18.860000610351562px]">
                                      Buyer ID
                                    </span>
                                    <div className="flex justify-between items-center gap-2 w-auto">
                                      <span className="text-[#064771] text-sm font-semibold whitespace-nowrap">
                                        {buyer.buyer_id ? buyer.buyer_id : 'N/A'}
                                      </span>
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="10"
                                        height="10"
                                        viewBox="0 0 10 10"
                                        fill="none"
                                      >
                                        <path
                                          d="M9 6.71429V1M9 1H3.28571M9 1L1 9"
                                          stroke="#064771"
                                          strokeWidth="1.5"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        />
                                      </svg>
                                    </div>
                                  </div>
                                  <div
                                    style={{
                                      width: '2px',
                                      height: '44px',
                                      backgroundColor: '#94989C',
                                    }}
                                  ></div>
                                </div>
                                <div className="flex justify-start items-center flex-row gap-5">
                                  <div className="flex justify-between items-end flex-col gap-2.5 w-[110px] h-[42px]">
                                    <span className="text-[#838383] text-sm font-medium leading-[18.860000610351562px]">
                                      Status
                                    </span>
                                    <div
                                      className={`flex items-center gap-2 py-1 px-3 rounded-full ${pillColor} max-w-[150px] whitespace-nowrap`}
                                      title={status}
                                    >
                                      <span className="w-2 h-2 rounded-full bg-white"></span>
                                      <span className="text-white text-xs font-medium leading-[1.4] truncate">
                                        {status}
                                      </span>
                                    </div>
                                  </div>

                                  <svg
                                    width="2"
                                    height="44"
                                    viewBox="0 0 2 44"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M1 1V43"
                                      stroke="#94989C"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                </div>
                                <div className="flex justify-between items-center flex-row gap-2.5 w-[220px] h-[40px]">
                                  <div className="flex flex-col items-end gap-2 w-[125px] h-[37px] whitespace-nowrap">
                                    <span className="text-gray-500 text-sm text-right font-medium leading-5">
                                      Latest Updated
                                    </span>
                                    <span className="text-gray-900 text-sm text-right leading-6 tracking-tight">
                                      {buyer?.updated_at
                                        ? new Date(buyer.updated_at)
                                            .toLocaleString('en-US', {
                                              month: '2-digit',
                                              day: '2-digit',
                                              year: 'numeric',
                                              hour: '2-digit',
                                              minute: '2-digit',
                                              hour12: true,
                                            })
                                            .replace(',', ' •')
                                        : 'N/A'}
                                    </span>
                                  </div>
                                  <div className="flex justify-start items-start flex-col gap-2.5 w-[82px] p-3">
                                    <button
                                      className="flex justify-start items-end flex-row gap-[7.678032875061035px] w-[84px] h-[25px] p-0 bg-transparent border-0"
                                      onClick={() => {
                                        navigate(`/buyer-portal/edit/${buyer.id}`);
                                      }}
                                    >
                                      <div className="flex flex-1 justify-center items-center flex-row gap-[6.102563858032227px] py-[3.8390164375305176px] px-[4.935878753662109px] bg-[#064771] rounded-[38.00399398803711px] h-[26px]">
                                        <svg
                                          width="13"
                                          height="13"
                                          viewBox="0 0 13 13"
                                          fill="none"
                                          xmlns="http://www.w3.org/2000/svg"
                                          className="inline-block"
                                        >
                                          <path
                                            d="M1.70913 6.16696C2.08091 3.64046 4.43043 1.89371 6.95693 2.2655C7.81892 2.39234 8.62753 2.76014 9.28962 3.32654L8.6936 3.92255C8.49384 4.12237 8.49389 4.44631 8.69372 4.64607C8.78963 4.74195 8.9197 4.79584 9.05532 4.79586H11.4015C11.6841 4.79586 11.9131 4.56682 11.9131 4.28427V1.93803C11.9131 1.65548 11.684 1.42648 11.4014 1.42653C11.2658 1.42655 11.1357 1.48044 11.0398 1.57632L10.3747 2.2414C7.83842 -0.019459 3.94955 0.203809 1.6887 2.74009C0.887737 3.63861 0.367962 4.75236 0.19376 5.94338C0.125077 6.36562 0.41168 6.76359 0.833899 6.83228C0.871933 6.83846 0.910352 6.8418 0.94889 6.84228C1.33518 6.83811 1.65944 6.55006 1.70913 6.16696Z"
                                            fill="white"
                                          />
                                          <path
                                            d="M11.6244 6.84668C11.2381 6.85085 10.9138 7.13889 10.8641 7.522C10.4923 10.0485 8.14282 11.7952 5.61632 11.4235C4.75433 11.2966 3.94572 10.9288 3.28364 10.3624L3.87965 9.76643C4.07942 9.56662 4.07937 9.24267 3.87953 9.04291C3.78363 8.94703 3.65355 8.89314 3.51794 8.89312H1.17175C0.889204 8.89312 0.660156 9.12217 0.660156 9.40472V11.7509C0.660228 12.0335 0.889324 12.2625 1.17187 12.2624C1.30749 12.2624 1.43757 12.2085 1.53347 12.1127L2.19855 11.4476C4.73423 13.7087 8.62281 13.4861 10.8839 10.9504C11.6853 10.0517 12.2053 8.93756 12.3795 7.74611C12.4485 7.32391 12.1621 6.92575 11.74 6.85678C11.7017 6.85052 11.6631 6.84714 11.6244 6.84668Z"
                                            fill="white"
                                          />
                                        </svg>
                                        <span className="text-white text-xs font-medium leading-normal inline-block">
                                          Update
                                        </span>
                                      </div>
                                    </button>

                                    <button
                                      className="flex justify-start items-end flex-row gap-[7.678032875061035px] w-[84px] h-[25px]"
                                      style={{ width: '84px' }}
                                      onClick={() => {
                                        navigate(`/buyer-portal/view/${buyer.id}`);
                                      }}
                                    >
                                      <div className="flex flex-1 justify-center items-center flex-row gap-[6.102563858032227px] py-[3.8390164375305176px] px-[4.935878753662109px] bg-[#FFFFFF] border-solid border-[#064771] border-[0.38141024112701416px] rounded-[38.00399398803711px] h-[26px]">
                                        <svg
                                          width="15"
                                          height="12"
                                          viewBox="0 0 15 12"
                                          fill="none"
                                          xmlns="http://www.w3.org/2000/svg"
                                        >
                                          <path
                                            d="M13.7293 4.3039C12.8423 2.85927 10.8246 0.435547 7.28335 0.435547C3.74213 0.435547 1.72445 2.85927 0.837429 4.3039C0.563217 4.74742 0.417969 5.25855 0.417969 5.77998C0.417969 6.30142 0.563217 6.81255 0.837429 7.25607C1.72445 8.7007 3.74213 11.1244 7.28335 11.1244C10.8246 11.1244 12.8423 8.7007 13.7293 7.25607C14.0035 6.81255 14.1487 6.30142 14.1487 5.77998C14.1487 5.25855 14.0035 4.74742 13.7293 4.3039ZM12.7542 6.65729C11.9924 7.89603 10.2681 9.98061 7.28335 9.98061C4.29859 9.98061 2.5743 7.89603 1.81252 6.65729C1.64961 6.39366 1.56332 6.08988 1.56332 5.77998C1.56332 5.47009 1.64961 5.16631 1.81252 4.90268C2.5743 3.66394 4.29859 1.57935 7.28335 1.57935C10.2681 1.57935 11.9924 3.66165 12.7542 4.90268C12.9171 5.16631 13.0034 5.47009 13.0034 5.77998C13.0034 6.08988 12.9171 6.39366 12.7542 6.65729Z"
                                            fill="#064771"
                                          />
                                          <path
                                            d="M7.2853 2.9209C6.71974 2.9209 6.16688 3.08861 5.69664 3.40281C5.22639 3.71702 4.85988 4.16362 4.64345 4.68613C4.42702 5.20863 4.37039 5.78359 4.48073 6.33828C4.59106 6.89297 4.86341 7.40249 5.26332 7.8024C5.66323 8.20231 6.17274 8.47465 6.72744 8.58499C7.28213 8.69532 7.85708 8.6387 8.37959 8.42227C8.9021 8.20584 9.34869 7.83932 9.6629 7.36908C9.97711 6.89883 10.1448 6.34597 10.1448 5.78042C10.1439 5.0223 9.84235 4.2955 9.30628 3.75943C8.77021 3.22337 8.04341 2.92181 7.2853 2.9209ZM7.2853 7.49613C6.94596 7.49613 6.61425 7.3955 6.3321 7.20698C6.04996 7.01845 5.83005 6.75049 5.70019 6.43699C5.57033 6.12348 5.53636 5.77851 5.60256 5.4457C5.66876 5.11288 5.83216 4.80717 6.07211 4.56723C6.31206 4.32728 6.61777 4.16387 6.95058 4.09767C7.2834 4.03147 7.62837 4.06545 7.94187 4.19531C8.25538 4.32516 8.52334 4.54507 8.71186 4.82722C8.90039 5.10937 9.00101 5.44108 9.00101 5.78042C9.00101 6.23545 8.82025 6.67185 8.49849 6.99361C8.17673 7.31536 7.74033 7.49613 7.2853 7.49613Z"
                                            fill="#064771"
                                          />
                                        </svg>
                                        <span className="text-[#064771] text-xs font-medium leading-[22px]">
                                          Details
                                        </span>
                                      </div>
                                    </button>
                                  </div>
                                </div>
                              </div>
                              <div className="flex self-stretch justify-start items-end flex-col gap-[18px]">
                                <div className="flex justify-start items-center flex-row gap-[18px]">
                                  <div className="flex justify-start items-center flex-row gap-5">
                                    <div className="flex flex-col items-end gap-2.5 w-[132px] h-[45px]">
                                      <span className="text-[#838383] text-sm font-medium leading-[18.86px] text-right">
                                        Preferred Industry
                                      </span>
                                      <span className="text-[#30313D] text-sm font-semibold leading-[15px] text-right">
                                        <span
                                          className="max-w-[120px] block truncate"
                                          title={
                                            buyer.company_overview?.main_industry_operations
                                              ?.length > 0
                                              ? buyer.company_overview.main_industry_operations
                                                  .map((i: { name: string }) => i.name)
                                                  .join(', ')
                                              : 'N/A'
                                          }
                                        >
                                          {buyer.company_overview?.main_industry_operations
                                            ?.length > 0
                                            ? buyer.company_overview.main_industry_operations
                                                .map((i: { name: string }) => i.name)
                                                .join(', ')
                                            : 'N/A'}
                                        </span>
                                      </span>
                                    </div>
                                    <div
                                      style={{
                                        width: '2px',
                                        height: '42px',
                                        backgroundColor: '#94989C',
                                      }}
                                    ></div>
                                  </div>
                                  <div className="flex justify-end items-end flex-row gap-5 whitespace-nowrap">
                                    <div className="flex flex-col items-end gap-2.5 w-[110px] h-[50px]">
                                      <span className="text-[#838383] text-sm font-medium leading-[18.86px] text-right">
                                        Preferred Niche
                                      </span>

                                      <span
                                        className="text-[#30313D] font-semibold leading-[22px] max-w-[120px] block truncate"
                                        title={
                                          buyer.company_overview?.niche_industry?.length
                                            ? buyer.company_overview.niche_industry
                                                .map((item: { name: string }) => item.name)
                                                .join(', ')
                                            : 'N/A'
                                        }
                                      >
                                        {buyer.company_overview?.niche_industry?.length
                                          ? buyer.company_overview.niche_industry
                                              .map((item: { name: string }) => item.name)
                                              .join(', ')
                                          : 'N/A'}
                                      </span>
                                    </div>
                                    <div className="w-[2px] h-[44px] bg-[#94989C]"></div>
                                  </div>
                                  <div className="flex flex-col items-end gap-2.5 w-[220px] h-[30px] text-right">
                                    <span className="text-gray-500 text-sm font-medium leading-[18.86px]">
                                      Buyer’s Website
                                    </span>
                                    <div className="w-full max-w-[140px]">
                                      <a
                                        href={buyer.company_overview?.website || '#'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[#064771] text-sm font-medium leading-[22px] underline truncate overflow-hidden whitespace-nowrap block"
                                        title={buyer.company_overview?.website ?? 'N/A'}
                                      >
                                        {buyer.company_overview?.website || 'N/A'}
                                      </a>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex self-stretch justify-start items-center flex-row gap-[21px]">
                                  <div className="flex justify-end items-center gap-5 whitespace-nowrap">
                                    <div className="flex flex-col items-end gap-2.5 w-[55px]">
                                      <span className="text-gray-500 text-sm font-medium leading-[18.86px] text-right">
                                        YOY Growth Pref.
                                      </span>
                                      <span className="text-gray-900 font-semibold leading-[22px] text-right">
                                        {buyer.financial_details?.growth_rate_yoy ?? 'N/A'}
                                      </span>
                                    </div>
                                    <div className="w-px h-10 bg-gray-400"></div>
                                  </div>
                                  <div className="flex justify-end items-center gap-5">
                                    <div className="flex flex-col items-end gap-2 w-[132px]">
                                      <p className="text-sm font-medium text-gray-500 text-right">
                                        TCF PIC
                                      </p>

                                      <div className="flex items-center gap-2">
                                        {employeeData ? (
                                          <div className="flex w-full pl-2 pr-0 justify-end">
                                            <div className="flex items-center bg-white border border-gray-300 rounded-full w-[140px] min-w-0 h-[36px] px-0">
                                              <div className="flex items-center h-full pl-1 pr-2 w-full">
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden bg-gray-100 border border-gray-200 mr-2">
                                                  {'image' in (employeeData || {}) &&
                                                  employeeData?.image &&
                                                  employeeData.image.length > 0 ? (
                                                    <img
                                                      className="rounded-full w-8 h-8 object-cover"
                                                      src={`${baseURL}/storage/${employeeData.image}`}
                                                      alt={`${employeeData.first_name || ''} ${employeeData.last_name || ''}`}
                                                    />
                                                  ) : (
                                                    (() => {
                                                      const firstName = employeeData?.first_name || '';
                                                      const lastName = employeeData?.last_name || '';
                                                      const firstInitial =
                                                        firstName.trim().split(' ')[0]?.[0] || '';
                                                      const lastInitial =
                                                        lastName.trim().split(' ')[0]?.[0] || '';
                                                      const initials = `${firstInitial}${lastInitial}`;
                                                      return (
                                                        <svg
                                                          width="32"
                                                          height="32"
                                                          viewBox="0 0 145 145"
                                                          fill="none"
                                                          xmlns="http://www.w3.org/2000/svg"
                                                          className="rounded-full w-8 h-8 object-cover"
                                                        >
                                                          <rect
                                                            x="1"
                                                            y="1"
                                                            width="143"
                                                            height="143"
                                                            rx="71.5"
                                                            fill="#F1FBFF"
                                                          />
                                                          <rect
                                                            x="1"
                                                            y="1"
                                                            width="143"
                                                            height="143"
                                                            rx="71.5"
                                                            stroke="#064771"
                                                            strokeWidth="2"
                                                          />
                                                          <text
                                                            x="50%"
                                                            y="55%"
                                                            textAnchor="middle"
                                                            fill="#064771"
                                                            fontSize="44"
                                                            fontWeight="bold"
                                                            dy=".3em"
                                                            fontFamily="Poppins, Arial, sans-serif"
                                                          >
                                                            {initials || '?'}
                                                          </text>
                                                        </svg>
                                                      );
                                                    })()
                                                  )}
                                                </div>
                                                <p
                                                  className="text-blue-800 text-xs font-semibold truncate max-w-[70px]"
                                                  title={`${employeeData?.first_name || ''} ${employeeData?.last_name || ''}`}
                                                >
                                                  {employeeData?.first_name || ''}
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                        ) : (
                                          <p className="text-gray-400 text-sm italic text-right w-full pl-2 pr-0">
                                            Unknown
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="w-px h-10 bg-gray-400"></div>
                                  </div>
                                  <div className="flex justify-end items-center gap-5">
                                    <div className="flex flex-col items-end gap-2 w-[110px]">
                                      <span className="text-gray-500 text-sm font-medium leading-5">
                                        Seller’s PIC
                                      </span>
                                      {buyer.company_overview?.seller_contact_name ? (
                                        <div className="flex items-center bg-white border border-gray-300 rounded-full w-[120px]">
                                          <div className="flex items-center gap-1 py-1.5 pr-4 pl-1 w-[110px] h-[32px]">
                                            <div className="w-10 h-6 bg-[#1B96AA] border border-[#36E4FF] rounded-full flex items-center justify-center">
                                              <span className="text-white text-sm font-medium">
                                                B
                                              </span>
                                            </div>
                                            <p className="text-blue-800 text-sm font-semibold truncate">
                                              {buyer.company_overview.seller_contact_name}
                                            </p>
                                          </div>
                                        </div>
                                      ) : (
                                        <p className="text-gray-400 text-sm italic">N/A</p>
                                      )}
                                    </div>
                                    <div className="w-px h-10 bg-gray-400"></div>
                                  </div>

                                  <div className="flex justify-center items-end flex-col gap-2.5 w-[220px]">
                                    <div className="flex justify-start items-center flex-row gap-2.5">
                                      <span className="text-gray-500 text-sm font-medium leading-[18.86px] text-right">
                                        Contact Emails
                                      </span>
                                      <button
                                        className="hover:opacity-80 transition-opacity"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          const email = buyer.company_overview.email;
                                          navigator.clipboard
                                            .writeText(email)
                                            .then(() => {
                                              showAlert({
                                                type: 'success',
                                                message: 'Email copied to clipboard',
                                              });
                                            })
                                            .catch((_) => {
                                              showAlert({ type: "error", message: "Failed to copy email" });
                                            });
                                        }}
                                        title="Copy contact email"
                                      >
                                        <svg
                                          width="12"
                                          height="15"
                                          viewBox="0 0 12 15"
                                          fill="none"
                                          xmlns="http://www.w3.org/2000/svg"
                                        >
                                          <path
                                            d="M11.5269 2.62667L10.2517 1.30956C10.0951 1.14874 9.90791 1.02082 9.7012 0.93328C9.49449 0.845746 9.27238 0.800367 9.0479 0.799805H6.41536C5.77205 0.800617 5.14868 1.02319 4.65033 1.43001C4.15198 1.83682 3.80912 2.40301 3.67953 3.03314H3.6237C2.88357 3.03402 2.17402 3.32843 1.65067 3.85178C1.12732 4.37512 0.832918 5.08468 0.832031 5.8248V11.4081C0.832918 12.1483 1.12732 12.8578 1.65067 13.3812C2.17402 13.9045 2.88357 14.1989 3.6237 14.1998H6.9737C7.71382 14.1989 8.42338 13.9045 8.94672 13.3812C9.47007 12.8578 9.76447 12.1483 9.76536 11.4081V11.3523C10.3955 11.2227 10.9617 10.8799 11.3685 10.3815C11.7753 9.88315 11.9979 9.25978 11.9987 8.61647V3.79247C11.9995 3.3572 11.8302 2.93884 11.5269 2.62667ZM6.9737 13.0831H3.6237C3.17946 13.0831 2.75342 12.9067 2.43929 12.5925C2.12517 12.2784 1.9487 11.8524 1.9487 11.4081V5.8248C1.9487 5.38057 2.12517 4.95452 2.43929 4.6404C2.75342 4.32628 3.17946 4.1498 3.6237 4.1498V8.61647C3.62458 9.35659 3.91899 10.0661 4.44234 10.5895C4.96568 11.1128 5.67524 11.4072 6.41536 11.4081H8.6487C8.6487 11.8524 8.47222 12.2784 8.1581 12.5925C7.84398 12.9067 7.41793 13.0831 6.9737 13.0831ZM9.20703 10.2915H6.41536C5.97113 10.2915 5.54508 10.115 5.23096 9.80087C4.91684 9.48675 4.74036 9.06071 4.74036 8.61647V3.59147C4.74036 3.14723 4.91684 2.72119 5.23096 2.40707C5.54508 2.09294 5.97113 1.91647 6.41536 1.91647H8.6487V3.03314C8.6487 3.3293 8.76634 3.61332 8.97576 3.82274C9.18517 4.03215 9.4692 4.1498 9.76536 4.1498H10.882V8.61647C10.882 9.06071 10.7056 9.48675 10.3914 9.80087C10.0773 10.115 9.65127 10.2915 9.20703 10.2915Z"
                                            fill="#4F4F4F"
                                          />
                                        </svg>
                                      </button>
                                    </div>
                                    <div className="flex justify-end items-center gap-1.5 w-[155px] whitespace-nowrap text-right">
                                      <svg
                                        width="15"
                                        height="13"
                                        viewBox="0 0 15 13"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                      >
                                        <path
                                          d="M11.875 0.200195H3.125C2.2965 0.201061 1.50222 0.488676 0.916387 0.999952C0.330551 1.51123 0.000992411 2.20442 0 2.92747L0 9.47292C0.000992411 10.196 0.330551 10.8892 0.916387 11.4004C1.50222 11.9117 2.2965 12.1993 3.125 12.2002H11.875C12.7035 12.1993 13.4978 11.9117 14.0836 11.4004C14.6695 10.8892 14.999 10.196 15 9.47292V2.92747C14.999 2.20442 14.6695 1.51123 14.0836 0.999952C13.4978 0.488676 12.7035 0.201061 11.875 0.200195ZM3.125 1.2911H11.875C12.2492 1.29175 12.6147 1.39011 12.9243 1.57354C13.234 1.75697 13.4737 2.01708 13.6125 2.32038L8.82625 6.49801C8.47402 6.80418 7.99714 6.97609 7.5 6.97609C7.00287 6.97609 6.52598 6.80418 6.17375 6.49801L1.3875 2.32038C1.52634 2.01708 1.76601 1.75697 2.07565 1.57354C2.3853 1.39011 2.75076 1.29175 3.125 1.2911ZM11.875 11.1093H3.125C2.62772 11.1093 2.15081 10.9369 1.79917 10.63C1.44754 10.3231 1.25 9.90691 1.25 9.47292V3.74565L5.29 7.26929C5.87664 7.77997 6.67141 8.06676 7.5 8.06676C8.32859 8.06676 9.12336 7.77997 9.71 7.26929L13.75 3.74565V9.47292C13.75 9.90691 13.5525 10.3231 13.2008 10.63C12.8492 10.9369 12.3723 11.1093 11.875 11.1093Z"
                                          fill="#064771"
                                        />
                                      </svg>
                                      <span className="text-[#064771] text-sm font-medium leading-[22px] truncate">
                                        {buyer.company_overview?.email ?? 'N/A'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex self-stretch justify-start items-center flex-row gap-[18px]">
                                  <div className="flex justify-start items-center gap-5">
                                    <div className="flex flex-col justify-between items-end gap-2.5 w-[55px] h-10 whitespace-nowrap text-right">
                                      <span className="text-[#838383] text-sm font-medium leading-[18.86px]">
                                        FTE Preferance
                                      </span>
                                      <span className="text-[#30313D] font-semibold leading-[22px]">
                                        {buyer.target_preference?.emp_count_range?.trim() || 'N/A'}
                                      </span>
                                    </div>
                                    <div className="w-px h-10 bg-[#94989C]"></div>
                                  </div>
                                  <div className="flex justify-start items-center gap-5">
                                    <div className="flex flex-col items-end gap-2.5 w-[132px] h-10 whitespace-nowrap text-right">
                                      <span className="text-[#838383] text-sm font-medium leading-[18.86px]">
                                        M&A Method
                                      </span>
                                      <span className="text-[#30313D] font-semibold leading-[22px]">
                                        {buyer.financial_details?.ma_structure ?? 'N/A'}
                                      </span>
                                    </div>
                                    <div className="w-px h-10 bg-[#94989C]"></div>
                                  </div>
                                  <div className="flex justify-start items-center gap-5">
                                    <div className="flex flex-col justify-between items-end w-[110px] h-10">
                                      <span className="text-[#838383] text-sm font-medium leading-[18.86px] text-right">
                                        Partner Referral
                                      </span>
                                      <div className="flex justify-end items-center gap-[7px] w-full">
                                        <span className="text-[rgba(0,0,0,0.88)] leading-[22px] text-right">
                                          {buyer.partnership_details?.referral_bonus_criteria ??
                                            'N/A'}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="w-px h-10 bg-[#94989C]"></div>
                                  </div>
                                  <div className="flex justify-center items-end flex-col gap-2.5 w-[220px] ml-[10px]">
                                    <div className="flex justify-start items-center flex-row gap-2.5">
                                      <span className="text-gray-500 text-sm font-medium leading-[18.86px] text-right">
                                        Contact
                                      </span>
                                      <button
                                        className="hover:opacity-80 transition-opacity"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          const phone = buyer.company_overview.phone;
                                          navigator.clipboard
                                            .writeText(phone)
                                            .then(() => {
                                              showAlert({
                                                type: 'success',
                                                message: 'Phone number copied to clipboard',
                                              });
                                            })
                                            .catch((_) => {
                                              showAlert({ type: "error", message: "Failed to copy phone number" });
                                            });
                                        }}
                                        title="Copy contact phone number"
                                      >
                                        <svg
                                          width="12"
                                          height="15"
                                          viewBox="0 0 12 15"
                                          fill="none"
                                          xmlns="http://www.w3.org/2000/svg"
                                        >
                                          <path
                                            d="M11.5269 2.62667L10.2517 1.30956C10.0951 1.14874 9.90791 1.02082 9.7012 0.93328C9.49449 0.845746 9.27238 0.800367 9.0479 0.799805H6.41536C5.77205 0.800617 5.14868 1.02319 4.65033 1.43001C4.15198 1.83682 3.80912 2.40301 3.67953 3.03314H3.6237C2.88357 3.03402 2.17402 3.32843 1.65067 3.85178C1.12732 4.37512 0.832918 5.08468 0.832031 5.8248V11.4081C0.832918 12.1483 1.12732 12.8578 1.65067 13.3812C2.17402 13.9045 2.88357 14.1989 3.6237 14.1998H6.9737C7.71382 14.1989 8.42338 13.9045 8.94672 13.3812C9.47007 12.8578 9.76447 12.1483 9.76536 11.4081V11.3523C10.3955 11.2227 10.9617 10.8799 11.3685 10.3815C11.7753 9.88315 11.9979 9.25978 11.9987 8.61647V3.79247C11.9995 3.3572 11.8302 2.93884 11.5269 2.62667ZM6.9737 13.0831H3.6237C3.17946 13.0831 2.75342 12.9067 2.43929 12.5925C2.12517 12.2784 1.9487 11.8524 1.9487 11.4081V5.8248C1.9487 5.38057 2.12517 4.95452 2.43929 4.6404C2.75342 4.32628 3.17946 4.1498 3.6237 4.1498V8.61647C3.62458 9.35659 3.91899 10.0661 4.44234 10.5895C4.96568 11.1128 5.67524 11.4072 6.41536 11.4081H8.6487C8.6487 11.8524 8.47222 12.2784 8.1581 12.5925C7.84398 12.9067 7.41793 13.0831 6.9737 13.0831ZM9.20703 10.2915H6.41536C5.97113 10.2915 5.54508 10.115 5.23096 9.80087C4.91684 9.48675 4.74036 9.06071 4.74036 8.61647V3.59147C4.74036 3.14723 4.91684 2.72119 5.23096 2.40707C5.54508 2.09294 5.97113 1.91647 6.41536 1.91647H8.6487V3.03314C8.6487 3.3293 8.76634 3.61332 8.97576 3.82274C9.18517 4.03215 9.4692 4.1498 9.76536 4.1498H10.882V8.61647C10.882 9.06071 10.7056 9.48675 10.3914 9.80087C10.0773 10.115 9.65127 10.2915 9.20703 10.2915Z"
                                            fill="#4F4F4F"
                                          />
                                        </svg>
                                      </button>
                                    </div>
                                    <div className="flex justify-end items-center gap-1.5 w-[155px] whitespace-nowrap text-right">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="17"
                                        height="17"
                                        viewBox="0 0 17 17"
                                        fill="none"
                                      >
                                        <path
                                          d="M9.10327 1.36903C9.10327 1.19192 9.17727 1.02208 9.30899 0.896845C9.44071 0.771615 9.61936 0.701262 9.80564 0.701262C11.6678 0.703206 13.4531 1.40736 14.7698 2.65924C16.0866 3.91112 16.8272 5.60848 16.8293 7.3789C16.8293 7.556 16.7553 7.72585 16.6235 7.85108C16.4918 7.97631 16.3132 8.04666 16.1269 8.04666C15.9406 8.04666 15.762 7.97631 15.6303 7.85108C15.4985 7.72585 15.4245 7.556 15.4245 7.3789C15.4229 5.96257 14.8303 4.60471 13.777 3.60321C12.7236 2.60172 11.2953 2.03838 9.80564 2.03679C9.61936 2.03679 9.44071 1.96644 9.30899 1.84121C9.17727 1.71598 9.10327 1.54613 9.10327 1.36903ZM9.80564 4.70784C10.5507 4.70784 11.2653 4.98926 11.7922 5.49018C12.3191 5.9911 12.6151 6.67049 12.6151 7.3789C12.6151 7.556 12.6891 7.72585 12.8208 7.85108C12.9525 7.97631 13.1312 8.04666 13.3175 8.04666C13.5037 8.04666 13.6824 7.97631 13.8141 7.85108C13.9458 7.72585 14.0198 7.556 14.0198 7.3789C14.0187 6.31661 13.5743 5.29814 12.7843 4.54699C11.9942 3.79584 10.923 3.37338 9.80564 3.37232C9.61936 3.37232 9.44071 3.44267 9.30899 3.5679C9.17727 3.69313 9.10327 3.86298 9.10327 4.04008C9.10327 4.21718 9.17727 4.38703 9.30899 4.51226C9.44071 4.63749 9.61936 4.70784 9.80564 4.70784ZM16.1922 11.879C16.5992 12.267 16.8278 12.7927 16.8278 13.3407C16.8278 13.8887 16.5992 14.4144 16.1922 14.8024L15.5531 15.5029C9.80072 20.7388 -4.19738 7.43365 1.22487 1.94731L2.03258 1.27954C2.4412 0.903379 2.98915 0.695285 3.55791 0.700283C4.12666 0.705282 4.67048 0.922971 5.07171 1.30626C5.09348 1.32696 6.39496 2.93426 6.39496 2.93426C6.78114 3.31998 6.99612 3.83236 6.9952 4.36488C6.99429 4.89741 6.77755 5.40911 6.39004 5.79363L5.57671 6.76589C6.02682 7.80567 6.68859 8.75065 7.52402 9.54652C8.35944 10.3424 9.35204 10.9735 10.4448 11.4035L11.4737 10.6256C11.8782 10.2574 12.4164 10.0516 12.9763 10.0509C13.5363 10.0501 14.075 10.2545 14.4806 10.6216C14.4806 10.6216 16.1705 11.8583 16.1922 11.879ZM15.2258 12.8499C15.2258 12.8499 13.545 11.6205 13.5232 11.5998C13.3785 11.4634 13.183 11.3869 12.9793 11.3869C12.7755 11.3869 12.58 11.4634 12.4353 11.5998C12.4163 11.6185 10.9997 12.6916 10.9997 12.6916C10.9042 12.7639 10.7906 12.8112 10.67 12.829C10.5494 12.8468 10.4261 12.8344 10.312 12.7931C8.8964 12.292 7.61057 11.5075 6.54164 10.4927C5.47271 9.47796 4.64566 8.25663 4.1165 6.91146C4.06958 6.80159 4.05428 6.68181 4.07218 6.56445C4.09008 6.44709 4.14053 6.33638 4.21834 6.2437C4.21834 6.2437 5.34704 4.89615 5.366 4.87879C5.50947 4.74122 5.58997 4.55534 5.58997 4.36161C5.58997 4.16788 5.50947 3.98199 5.366 3.84442C5.34423 3.82439 4.05118 2.2251 4.05118 2.2251C3.90431 2.0999 3.71264 2.03285 3.51545 2.03769C3.31825 2.04253 3.13048 2.1189 2.99061 2.25114L2.18289 2.9189C-1.77984 7.44901 10.3507 18.3422 14.5262 14.5907L15.1661 13.8896C15.316 13.7575 15.4061 13.5752 15.4172 13.3812C15.4284 13.1872 15.3597 12.9967 15.2258 12.8499Z"
                                          fill="#064771"
                                        />
                                      </svg>
                                      <span className="text-[#064771] text-sm font-medium leading-[22px] truncate">
                                        {buyer.company_overview?.phone ?? 'N/A'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}

          {!loading && buyers.length === 0 && (
            <tr>
              <td className="px-6 py-4 text-center text-gray-500" colSpan={1}>
                No buyers to show.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => setCurrentPage(page)}
      />
    </div>
  );
};

export default AllBuyers;

