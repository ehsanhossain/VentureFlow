import React, { useState, useEffect, useRef } from 'react';
import Pagination from '../../components/Pagination';
import 'react-datepicker/dist/react-datepicker.css';
import Breadcrumb from '../../assets/breadcrumb';
import { useNavigate } from 'react-router-dom';
import ArrowIcon from '../../assets/svg/ArrowIcon';
import { useForm, Controller } from 'react-hook-form';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/table/table';
import api from '../../config/api';
import { ActionButton } from '../../components/ActionButton';
import clsx from 'clsx';
import { showAlert } from '../../components/Alert';
import { SearchInput } from '../../components/SearchInput';
import { Country, Dropdown } from './components/Dropdown';
import DatePicker from '../../components/DatePicker';
import SelectPicker from '../../components/SelectPicker';
import SortDropdown from './components/SortDropdown';

const statusOptions = [
  { value: '1', label: 'Active' },
  { value: '0', label: 'In-Active' },
];

const partnershipStructureOptions = [
  { label: 'Percentage', value: 'Percentage' },
  { label: 'Success Based', value: 'Success Based' },
];

const breadcrumbLinks = [
  { label: 'Home', url: '/', isCurrentPage: false },
  { label: 'Partner Management', url: '', isCurrentPage: true },
];

export interface FilterState {
  registered: string;
  country: string;
  structure: string;
  status: string;
}

interface FormValues {
  RegisterWithin: Date | null;
  PartnerHQCountry: string; // Storing ID as string
  partnershipStructure: string;
  status: string;
}

type SortState = {
  sortBy: string;
  sortDirection: 'asc' | 'desc';
};

interface Partner {
  id: number;
  partner_name: string;
  country: string;
  structure: string;
  contact_person: string;
  shared_sellers_count?: number;
  shared_buyers_count?: number;
  status: boolean;
  partner_image?: string;
  status_label?: string;
  partner_overview?: {
    reg_name?: string;
    hq_country?: string;
    our_contact_person?: string;
  };
  partnership_structure?: {
    status?: number | string;
    partnership_structure?: string;
  };
  sellers_count?: number;
  buyers_count?: number;
}

interface Meta {
  total: number;
  last_page: number;
  current_page: number;
}

interface Employee {
  id: number;
  name: string;
  first_name?: string;
  last_name?: string;
  image?: string;
}

export const PartnerPortal: React.FC = () => {
  localStorage.removeItem('partner_id');
  const { control, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      RegisterWithin: null,
      PartnerHQCountry: '',
      partnershipStructure: '',
      status: '',
    } as Partial<FormValues>,
  });

  const defaultInitialState: FilterState = {
    registered: '',
    country: '',
    structure: '',
    status: '',
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
  const [filters, setFilters] = useState<FilterState>(defaultInitialState);
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
        top: rect.bottom + window.scrollY + 8,
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
    setFilters(defaultInitialState);
  };

  const handleApplySearch = (formValues: FormValues) => {
    let registeredAfter = '';
    if (formValues.RegisterWithin) {
      const date = new Date(formValues.RegisterWithin);

      date.setHours(date.getHours() + 6);

      registeredAfter = date.toISOString().split('T')[0];
    }

    const appliedFilters: Record<string, string> = {
      country: formValues.PartnerHQCountry ?? '',
      registered_after: registeredAfter,
      structure: formValues.partnershipStructure ?? '',
      status: formValues.status ?? '',
    };

    setFilters(appliedFilters as unknown as FilterState); // Casting for now as FilterState keys might not match exactly
    setCurrentPage(1);
    setIsModalOpen(false);
  };

  const [sortConfig, setSortConfig] = useState<SortState>({
    sortBy: 'partner-name',
    sortDirection: 'asc',
  });

  const handleSortChange = (newSortBy: string, newSortDirection: 'asc' | 'desc') => {
    setSortConfig({
      sortBy: newSortBy,
      sortDirection: newSortDirection,
    });
  };

  const tableHeaders = [
    'Partner Name',
    'Status ',
    'Country',
    'Structure',
    'Contact Person',
    'Shared Sellers',
    'Shared Buyers',
    'Quick Actions',
  ];

  const navigate = useNavigate();

  const [partners, setPartners] = useState<Partner[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);

  const baseURL = import.meta.env.VITE_API_BASE_URL;

  const fetchPartners = async (
    page = 1,
    filters: Record<string, string | number> = {},
    sortBy?: string,
    sortDirection?: string
  ) => {
    try {
      setLoading(true);

      const params: Record<string, string | number> = { page, ...filters };

      if (sortBy && sortDirection) {
        params.sort_by = sortBy;
        params.sort_direction = sortDirection;
      }

      const response = await api.get('/api/partner', { params });
      const partnersData = response.data.data;



      setPartners(partnersData);
      setMeta(response.data.meta);
      setTotalPages(response.data.meta.last_page);
    } catch {
      showAlert({ type: "error", message: "Failed to fetch partners" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters, sortConfig.sortBy, sortConfig.sortDirection]);

  useEffect(() => {
    const delay = setTimeout(() => {
      const getBackendSortField = (frontendSortId: string): string => {
        const sortFieldMap: Record<string, string> = {
          'partner-name': 'partner_name',
          status: 'status',
          country: 'country',
          structure: 'structure',
          'contact-person': 'contact_person',
          'shared-sellers': 'shared_sellers_count',
          'shared-buyers': 'shared_buyers_count',
        };
        return sortFieldMap[frontendSortId] || 'created_at';
      };

      const backendSortField = getBackendSortField(sortConfig.sortBy);

      const queryParams = {
        search: searchQuery,
        ...filters,
      };

      fetchPartners(currentPage, queryParams, backendSortField, sortConfig.sortDirection);
    }, 500);

    return () => clearTimeout(delay);
  }, [currentPage, searchQuery, filters, sortConfig.sortBy, sortConfig.sortDirection]);

  const [countries, setCountries] = useState<Country[]>([]);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await api.get('/api/countries');
        const formatted = response.data.map(
          (country: {
            id: number;
            name: string;
            svg_icon_url: string;
            alpha_2_code: string;
          }) => ({
          id: country.id,
          name: country.name,
          flagSrc: country.svg_icon_url,
          status: 'unregistered',
          alpha: country.alpha_2_code,
        }));

        setCountries(formatted);
      } catch {
        showAlert({ type: "error", message: "Failed to fetch countries" });
      } finally {
        setLoading(false);
      }
    };

    fetchCountries();
  }, []);

  const getCountryById = (id: number) => countries.find((c) => c.id === id);

  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    api
      .get('/api/employees/fetch')
      .then((res) => {
        setEmployees(res.data);
      })
      .catch(() => showAlert({ type: "error", message: "Failed to fetch employees" }));
  }, []);

  const getEmployeeById = (id: number) => employees.find((e) => e.id === id);

  const handleDelete = async (id: number | string) => {
    const confirmed = window.confirm('Are you sure you want to delete this partner?');
    if (!confirmed) return;

    try {
      await api.delete(`/api/partners`, { data: { ids: [id] } });
      fetchPartners();
      showAlert({
        type: 'success',
        message: 'Partner deleted successfully!',
      });
    } catch {
      showAlert({
        type: 'error',
        message: 'Failed to delete partner. Please try again.',
      });
    }
  };

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
   
        await api.delete(`/api/partners`, {
          data: { ids: selectedIdsArray },
        });

      
        showAlert({
          type: 'success',
          message: `${selectedIdsArray.length} item(s) deleted successfully!`,
        });
        fetchPartners();
        return true;
      } catch {
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

  const [isComponentOpen, setIsComponentOpen] = useState(false);
  const handleComponentOpen = () => {
    setIsComponentOpen(true);
  };

  const [selectedPartnerIds, setSelectedPartnerIds] = useState<Set<number>>(new Set());

  const handleBulkDeleteClick = async () => {
    const idsToDeleteArray = Array.from(selectedPartnerIds);

    if (idsToDeleteArray.length === 0) {
      alert('Please select partners to delete.');
      return;
    }

    const success = await handleDeleteData(idsToDeleteArray);

    if (success) {
      setSelectedPartnerIds(new Set());
    
    }
  };

  const handleComponentClose = () => {
    setIsComponentOpen(false);
    setSelectedPartnerIds(new Set());
  };

  const handleCheckboxChange = (partnerId: number) => {
    setSelectedPartnerIds((prevSelectedIds) => {
      const newSelectedIds = new Set(prevSelectedIds);
      if (newSelectedIds.has(partnerId)) {
        newSelectedIds.delete(partnerId);
      } else {
        newSelectedIds.add(partnerId);
      }
    
      return newSelectedIds;
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center flex-row gap-[464px] px-[25px] pt-[35px]">
        <div className="flex flex-col gap-4 w-[789px] pl-[25px] ">
          <div className="flex w-full justify-start items-center gap-3">
            <span className="text-black text-2xl font-medium font-poppins">Partner Portal</span>
          </div>
          <div className="flex self-stretch justify-start items-center flex-row">
            <div className="flex flex-col md:flex-row items-center gap-2.5 w-full md:w-[447px]">
              <button
                className="flex flex-col flex-shrink-0 justify-center items-center gap-1 py-1 px-3 rounded bg-[#064771]"
                onClick={() => navigate(-1)}
              >
                <div className="flex items-center gap-1">
                  <svg
                    width={14}
                    height={11}
                    viewBox="0 0 14 11"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M3.66681 9.85943H9.28387C11.2247 9.85943 12.8003 8.2839 12.8003 6.34304C12.8003 4.40217 11.2247 2.82666 9.28387 2.82666H1.55469"
                      stroke="white"
                      strokeWidth="1.56031"
                      strokeMiterlimit={10}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M3.17526 4.59629L1.38281 2.79245L3.17526 1"
                      stroke="white"
                      strokeWidth="1.56031"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="text-white text-[.8125rem] font-semibold">Back</span>
                </div>
              </button>
              <div className="flex items-start w-full">
                <Breadcrumb links={breadcrumbLinks} />
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-start items-center flex-row gap-2.5">
          <button
            className="flex justify-start items-end gap-3 h-[34px]"
            onClick={() => navigate('/partner-portal/create')}
          >
            <div className="flex items-center gap-1.5 py-1.5 px-3 bg-[#064771] rounded-full h-[34px] w-auto whitespace-nowrap">
              <svg
                className="w-5 h-5"
                viewBox="0 0 19 19"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9.37729 0.556641C7.55818 0.556641 5.77992 1.09607 4.26738 2.10672C2.75484 3.11736 1.57596 4.55383 0.879817 6.23447C0.183673 7.91512 0.00152946 9.76445 0.356421 11.5486C0.711313 13.3328 1.5873 14.9716 2.87361 16.2579C4.15991 17.5442 5.79877 18.4202 7.58293 18.7751C9.36709 19.13 11.2164 18.9479 12.8971 18.2517C14.5777 17.5556 16.0142 16.3767 17.0248 14.8642C18.0355 13.3516 18.5749 11.5734 18.5749 9.75424C18.5723 7.3157 17.6024 4.97778 15.8781 3.25347C14.1538 1.52916 11.8158 0.559278 9.37729 0.556641ZM9.37729 17.4189C7.86137 17.4189 6.37948 16.9694 5.11903 16.1272C3.85858 15.285 2.87618 14.0879 2.29606 12.6874C1.71594 11.2869 1.56416 9.74574 1.8599 8.25894C2.15564 6.77214 2.88563 5.40643 3.95756 4.3345C5.02948 3.26258 6.39519 2.53259 7.88199 2.23685C9.36879 1.94111 10.9099 2.09289 12.3104 2.67301C13.711 3.25313 14.908 4.23553 15.7502 5.49598C16.5924 6.75643 17.042 8.23832 17.042 9.75424C17.0397 11.7864 16.2315 13.7346 14.7946 15.1715C13.3576 16.6084 11.4094 17.4167 9.37729 17.4189ZM13.2096 9.75424C13.2096 9.95752 13.1289 10.1525 12.9851 10.2962C12.8414 10.44 12.6464 10.5207 12.4432 10.5207H10.1438V12.8201C10.1438 13.0234 10.063 13.2183 9.91927 13.3621C9.77553 13.5058 9.58057 13.5866 9.37729 13.5866C9.17402 13.5866 8.97906 13.5058 8.83532 13.3621C8.69158 13.2183 8.61083 13.0234 8.61083 12.8201V10.5207H6.31143C6.10815 10.5207 5.91319 10.44 5.76945 10.2962C5.62571 10.1525 5.54496 9.95752 5.54496 9.75424C5.54496 9.55096 5.62571 9.35601 5.76945 9.21227C5.91319 9.06853 6.10815 8.98778 6.31143 8.98778H8.61083V6.68838C8.61083 6.4851 8.69158 6.29014 8.83532 6.1464C8.97906 6.00266 9.17402 5.92191 9.37729 5.92191C9.58057 5.92191 9.77553 6.00266 9.91927 6.1464C10.063 6.29014 10.1438 6.4851 10.1438 6.68838V8.98778H12.4432C12.6464 8.98778 12.8414 9.06853 12.9851 9.21227C13.1289 9.35601 13.2096 9.55096 13.2096 9.75424Z"
                  fill="white"
                />
              </svg>
              <span className="text-white text-sm font-medium font-poppins">Create a Partner</span>
            </div>
          </button>

          <div className="flex justify-start items-end gap-2.5 h-[34px]">
            <div className="flex items-center gap-1 py-1.5 px-3 bg-[#F1FBFF] border border-[#064771] rounded-full h-[34px] w-auto whitespace-nowrap">
              <svg
                className="w-5 h-5"
                viewBox="0 0 19 19"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2.07422 5.25391C2.07422 4.20381 2.07422 3.67876 2.27858 3.27767C2.45835 2.92487 2.74518 2.63803 3.09798 2.45827C3.49907 2.25391 4.02412 2.25391 5.07422 2.25391C6.12432 2.25391 6.64937 2.25391 7.05045 2.45827C7.40325 2.63803 7.69009 2.92487 7.86986 3.27767C8.07422 3.67876 8.07422 4.20381 8.07422 5.25391V14.2539C8.07422 15.304 8.07422 15.8291 7.86986 16.2302C7.69009 16.583 7.40325 16.8698 7.05045 17.0495C6.64937 17.2539 6.12432 17.2539 5.07422 17.2539C4.02412 17.2539 3.49907 17.2539 3.09798 17.0495C2.74518 16.8698 2.45835 16.583 2.27858 16.2302C2.07422 15.8291 2.07422 15.304 2.07422 14.2539V5.25391Z"
                  stroke="#064771"
                  strokeWidth="1.3125"
                />
                <path
                  d="M5.82422 15.0044H4.32422"
                  stroke="#064771"
                  strokeWidth="1.3125"
                  strokeLinecap="round"
                />
                <path
                  d="M10.5595 4.4516L8.95292 6.05817C8.51934 6.49172 8.30259 6.70849 8.18837 6.98415C8.07422 7.25981 8.07422 7.56637 8.07422 8.17949V15.4222L14.8021 8.69428C15.5447 7.95171 15.9159 7.58045 16.055 7.15233C16.1774 6.77575 16.1774 6.3701 16.055 5.99352C15.9159 5.5654 15.5447 5.19413 14.8021 4.4516C14.0596 3.70907 13.6883 3.33781 13.2602 3.19871C12.8836 3.07634 12.478 3.07634 12.1013 3.19871C11.6732 3.33781 11.302 3.70907 10.5595 4.4516Z"
                  stroke="#064771"
                  strokeWidth="1.3125"
                />
                <path
                  d="M5.07422 17.2539H14.0742C15.1243 17.2539 15.6494 17.2539 16.0505 17.0495C16.4033 16.8698 16.6901 16.583 16.8698 16.2302C17.0742 15.8291 17.0742 15.304 17.0742 14.2539C17.0742 13.2038 17.0742 12.6788 16.8698 12.2777C16.6901 11.9249 16.4033 11.6381 16.0505 11.4583C15.6494 11.2539 15.1243 11.2539 14.0742 11.2539H12.1992"
                  stroke="#064771"
                  strokeWidth="1.3125"
                />
              </svg>
              <span className="text-[#064771] text-sm font-medium font-poppins">
                Batch Register
              </span>
            </div>
          </div>

          <div className="flex justify-start items-end gap-2.5 h-[34px]">
            <div className="flex items-center gap-1 py-1.5 px-2 bg-[#F1FBFF] border border-[#0C5577] rounded-full h-[34px] w-auto whitespace-nowrap">
              <svg
                className="w-5 h-5"
                viewBox="0 0 21 22"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15.7378 15.7041C18.47 12.9719 18.47 8.53691 15.7378 5.80465C13.0055 3.07239 8.57052 3.07239 5.83826 5.80465C3.106 8.53691 3.106 12.9719 5.83826 15.7041"
                  stroke="#0C5577"
                  strokeWidth="1.4"
                  strokeMiterlimit="10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M10.7889 11.744L10.7889 19.8615"
                  stroke="#0C5577"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M8.39823 18.2627L10.789 20.6534L13.1797 18.2627"
                  stroke="#0C5577"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-[#0C5577] text-sm font-medium font-poppins">Export</span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-start items-start flex-col relative pt-5">
        <div className="flex flex-col items-center gap-1.5 pt-2.5 bg-white w-[225px] h-[41px]">
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="18"
              viewBox="0 0 22 18"
              fill="none"
            >
              <path
                d="M19.2239 8.73909L21.6157 6.96792L19.5482 0L8.90606 0.341074L7.88081 1.93317L4.23609 1.05652L0.386719 9.00359L2.14014 10.5128L1.21436 11.9455C0.921963 12.398 0.823282 12.9373 0.936517 13.464C1.04971 13.9907 1.3613 14.4418 1.81379 14.7342C2.14396 14.9476 2.5204 15.0578 2.90443 15.0578C3.00552 15.0578 3.10706 15.0498 3.20848 15.0344C3.33689 15.491 3.62505 15.9046 4.05382 16.1816C4.39141 16.3998 4.77038 16.504 5.14525 16.504C5.2465 16.504 5.3473 16.4954 5.44702 16.4805C5.57962 16.9548 5.87657 17.3595 6.29381 17.6291C6.63145 17.8473 7.01038 17.9514 7.38524 17.9514C8.04753 17.9514 8.69709 17.6262 9.08248 17.0297L9.35755 16.6039L10.9685 17.6719L10.9752 17.6764C11.3054 17.8897 11.6818 18 12.0659 18C12.2081 18 12.3514 17.9849 12.4938 17.9543C13.0205 17.8411 13.4716 17.5295 13.764 17.077C13.9698 16.7586 14.074 16.4033 14.0851 16.0494C14.1883 16.0433 14.2918 16.0296 14.3948 16.0074C14.9216 15.8942 15.3727 15.5826 15.6651 15.1301C15.8668 14.818 15.9762 14.4645 15.9875 14.1024C16.0903 14.0963 16.1933 14.0826 16.2958 14.0605C16.8226 13.9473 17.2737 13.6358 17.5661 13.1833C17.7721 12.8645 17.8763 12.5088 17.8872 12.1545C18.508 12.1185 19.1045 11.7976 19.467 11.2364C19.7594 10.7838 19.8581 10.2446 19.745 9.71783C19.6644 9.34317 19.4836 9.00682 19.2239 8.73909ZM9.6669 1.68435L18.5378 1.40008L20.0329 6.43902L18.0444 7.9115L10.4403 2.96041L8.28184 6.23644L8.27852 6.24154C8.08389 6.54256 7.68079 6.62917 7.37977 6.43475C7.07875 6.24025 6.99209 5.83706 7.18717 5.53513L9.6669 1.68435ZM3.45439 13.3929C3.25977 13.694 2.85658 13.7806 2.55568 13.5861C2.40986 13.4919 2.30944 13.3465 2.27295 13.1768C2.2365 13.007 2.26826 12.8333 2.36255 12.6874L3.72962 10.5717C3.85389 10.3795 4.06311 10.2747 4.2766 10.2747C4.39738 10.2747 4.51958 10.3083 4.62837 10.3785C4.7742 10.4728 4.87458 10.6181 4.91107 10.7879C4.94756 10.9576 4.91575 11.1314 4.82155 11.2772L3.45439 13.3929ZM5.69443 14.8404C5.4998 15.1414 5.09666 15.228 4.79568 15.0335C4.49466 14.839 4.408 14.4358 4.60254 14.1348L5.96966 12.0191C6.09392 11.8268 6.30314 11.7221 6.51664 11.7221C6.63742 11.7221 6.75961 11.7556 6.86841 11.826C7.16943 12.0205 7.25608 12.4237 7.06158 12.7247L5.69443 14.8404ZM9.30149 14.1721L7.93438 16.2878C7.73987 16.5889 7.33669 16.6754 7.03571 16.481C6.88988 16.3867 6.78946 16.2414 6.75302 16.0716C6.71653 15.9019 6.74829 15.7281 6.84253 15.5822L8.20965 13.4665C8.30389 13.3207 8.44922 13.2203 8.61897 13.1838C8.66487 13.174 8.71102 13.1691 8.75679 13.1691C8.88056 13.1691 9.00188 13.2046 9.10827 13.2734C9.40934 13.4679 9.49599 13.871 9.30149 14.1721ZM18.3189 10.4943C18.2247 10.6402 18.0794 10.7406 17.9096 10.777C17.7399 10.8136 17.566 10.7817 17.4203 10.6875L16.9667 10.3945L16.9667 10.3944L14.8509 9.0273L14.109 10.1754L14.5626 10.4686L16.2248 11.5426C16.3706 11.6369 16.471 11.7822 16.5075 11.9519C16.544 12.1217 16.5122 12.2955 16.418 12.4413C16.3238 12.5871 16.1784 12.6876 16.0087 12.7241C15.8389 12.7605 15.6651 12.7287 15.5193 12.6345L13.4035 11.2674L12.6617 12.4155L14.3238 13.4895C14.6248 13.684 14.7115 14.0871 14.517 14.3882C14.4227 14.534 14.2774 14.6345 14.1077 14.6709C13.9379 14.7074 13.7641 14.6756 13.6183 14.5814L11.8123 13.4145L11.0704 14.5626L12.4228 15.4364C12.7238 15.631 12.8105 16.0341 12.616 16.3352C12.5217 16.481 12.3764 16.5814 12.2067 16.6179C12.038 16.6542 11.8654 16.623 11.7201 16.5301L10.0997 15.4559L10.4498 14.914C11.0533 13.9799 10.7845 12.7289 9.85034 12.1253C9.42124 11.8481 8.92534 11.7554 8.45598 11.8262C8.32769 11.3692 8.03944 10.9552 7.61039 10.6779C7.18158 10.4008 6.68609 10.3081 6.21702 10.3787C6.08438 9.90449 5.78747 9.49998 5.37035 9.23047C4.59831 8.73151 3.60992 8.82928 2.94929 9.40561L2.07542 8.65347L4.98674 2.64309L7.09707 3.15064L6.03865 4.79419C5.43508 5.72831 5.70396 6.97933 6.63808 7.5829C7.57124 8.18594 8.82077 7.91805 9.42509 6.98617L10.834 4.84784L18.126 9.59568C18.2718 9.68992 18.3722 9.83525 18.4087 10.005C18.445 10.1747 18.4132 10.3485 18.3189 10.4943Z"
                fill="#064771"
              />
            </svg>
            <span className="text-[#064771] text-center leading-5 font-poppins">All Partners</span>
            <div className="flex flex-col">
              <div className="flex items-center gap-2 px-2 bg-[#E4F8FF] rounded-3xl h-[24px]">
                <div className="flex items-center gap-0.5">
                  <span className="text-[#064771] text-sm font-medium leading-5 font-poppins">
                    {meta?.total}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="w-full bg-[#064771] h-[2px]"></div>
        </div>
        <div className="absolute left-[225px] top-10 w-[calc(100%-225px)] h-0 transform rotate-0 pt-5">
          <svg
            className="w-full h-[2px]"
            viewBox="0 0 1150 2"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            <path d="M1150 1.00012L0 1" stroke="#E5E7EB" strokeWidth="2" />
          </svg>
        </div>
      </div>
      <div className="flex justify-between items-center py-[25px] px-[25px]">
        <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search Here" />

        <div className="flex justify-start items-center gap-4">
          <span className="text-sm leading-5 font-poppins text-center">
            <span className="text-gray-500">Showing</span>
            <span className="text-gray-800 font-poppins mx-1">{partners?.length}</span>
            <span className="text-gray-500">of</span>
            <span className="text-gray-800 font-poppins mx-1">{meta?.total}</span>
            <span className="text-gray-500">Cases</span>
          </span>

          <div className="flex items-center gap-4 h-8">
            <ActionButton
              onExport={handleExportData}
              onDelete={handleBulkDeleteClick}
              onOpen={handleComponentOpen}
              onClose={handleComponentClose}
            />

            <SortDropdown
              currentSort={sortConfig.sortBy}
              currentSortDirection={sortConfig.sortDirection}
              onSortChange={handleSortChange}
            />

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
              }}
            >
              <div className="w-[782px] rounded-[20px] border-0 shadow-2xl bg-white">
                <div className="flex flex-col w-full items-start gap-10 p-10">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3.5">
                      <svg
                        className="w-7 h-7"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        style={{ transform: 'scaleX(-1)' }}
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

                  <div className="flex flex-col items-start gap-12 w-full">
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

                        <div className="flex flex-col h-[70px] items-start justify-between flex-1">
                          <div className="flex items-center gap-1.5 w-full">
                            <span className="font-medium text-[#30313d] text-base leading-[19.3px] font-['Poppins',Helvetica]">
                              {filterFields[1].label}
                            </span>
                            <div className="w-[18px] h-[18px] flex items-center justify-center">
                              <svg
                                className="w-[16.67px] h-[16.67px] text-gray-400 hover:text-gray-600 cursor-help"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <circle cx="12" cy="12" r="10" />
                                <path d="M9,9h0a3,3,0,0,1,5.12,2.12h0A3,3,0,0,1,9,15" />
                                <circle cx="12" cy="17.02" r=".01" />
                              </svg>
                            </div>
                          </div>

                          <Controller
                            name="PartnerHQCountry"
                            control={control}
                            render={({ field }) => (
                              <div className="w-full">
                                <Dropdown
                                  {...field}
                                  countries={countries}
                                  selected={countries.find((c) => String(c.id) === field.value)}
                                  onSelect={(val) => {
                                    const country = Array.isArray(val) ? val[0] : val;
                                    if (country) field.onChange(String(country.id));
                                  }}
                                />
                              </div>
                            )}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between w-full">
                        <div className="flex flex-col w-[301px] h-[70px] items-start justify-between">
                          <div className="flex items-center gap-1.5 w-full">
                            <span className="font-medium text-[#30313d] text-base leading-[19.3px] font-['Poppins',Helvetica]">
                              {filterFields[2].label}
                            </span>
                            <div className="w-[18px] h-[18px] flex items-center justify-center">
                              <svg
                                className="w-[16.67px] h-[16.67px] text-gray-400 hover:text-gray-600 cursor-help"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <circle cx="12" cy="12" r="10" />
                                <path d="M9,9h0a3,3,0,0,1,5.12,2.12h0A3,3,0,0,1,9,15" />
                                <circle cx="12" cy="17.02" r=".01" />
                              </svg>
                            </div>
                          </div>

                          <Controller
                            name="partnershipStructure"
                            control={control}
                            render={({ field, fieldState }) => (
                              <div className="w-full">
                                <SelectPicker
                                  options={partnershipStructureOptions}
                                  value={field.value}
                                  onChange={field.onChange}
                                  searchable={false}
                                  placeholder="e.g.. Percentage / Success Based"
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

                        <div className="flex flex-col w-[351px] h-[70px] items-start justify-between ">
                          <div className="flex items-center gap-1.5 w-full">
                            <span className="font-medium text-[#30313d] text-base leading-[19.3px] font-['Poppins',Helvetica]">
                              {filterFields[3].label}
                            </span>
                            <div className="w-[18px] h-[18px] flex items-center justify-center">
                              <svg
                                className="w-[16.67px] h-[16.67px] text-gray-400 hover:text-gray-600 cursor-help"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <circle cx="12" cy="12" r="10" />
                                <path d="M9,9h0a3,3,0,0,1,5.12,2.12h0A3,3,0,0,1,9,15" />
                                <circle cx="12" cy="17.02" r=".01" />
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
                                placeholder="e.g., Select current status of prospect"
                              />
                            )}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-4 w-full">
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
      <section className="flex flex-col gap-3.5 w-full px-8 mt-[15px]">
        <div className="w-full">
          <Table className="w-full border-separate border-spacing-y-[10px]">
            <TableHeader>
              <TableRow className="rounded-lg">
                {tableHeaders.map((header, idx) => {
                  const alignmentClass = idx === 0 ? 'text-left' : 'text-center';

                  return (
                    <TableHead
                      key={idx}
                      className={`cursor-pointer py-[10px] px-6 font-semibold text-[#727272] text-sm border-t border-b ${alignmentClass} ${
                        idx === 0 ? 'border-l first:rounded-l-lg' : ''
                      } ${
                        idx === tableHeaders.length - 1 ? 'border-r last:rounded-r-lg' : ''
                      } bg-[#F9F9F9] whitespace-nowrap hover:bg-[#d1d1d1] transition-colors`}
                    >
                      <div
                        className={`flex items-center gap-2 ${
                          alignmentClass === 'text-left' ? 'justify-start' : 'justify-center'
                        }`}
                      >
                        {header}
                        {idx !== tableHeaders.length - 1 && <ArrowIcon />}
                      </div>
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index} className="animate-pulse">
                    {tableHeaders.map((_, i) => (
                      <TableCell key={i} className="py-[10px] px-6 bg-white">
                        <div className="h-4 rounded bg-blue-900/10 w-full"></div>
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : partners?.length > 0 ? (
                partners.map((partner, index) => {
                  const countryData = getCountryById(
                    parseInt(partner.partner_overview?.hq_country || '0')
                  );
                  const employeeData = getEmployeeById(
                    parseInt(partner.partner_overview?.our_contact_person || '0')
                  );
                  const isSelected = selectedPartnerIds.has(partner.id);
                  return (
                    <TableRow key={partner.id || index}>
                      <TableCell
                        className={clsx(
                          'py-[10px] px-6 font-semibold text-[#30313D] text-sm text-left font-poppins border-t border-b border-l rounded-l-lg truncate whitespace-nowrap',
                          {
                            'border-[#064771] bg-[#F5FBFF]': isSelected,
                            'border-[#E4E4E4] bg-white': !isSelected,
                          }
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {isComponentOpen && (
                            <input
                              type="checkbox"
                              className="h-5 w-5 text-[#064771] border-gray-300 rounded focus:ring-blue-500 shrink-0"
                              checked={isSelected}
                              onChange={() => handleCheckboxChange(partner.id)}
                            />
                          )}
                          <span>{partner.partner_overview?.reg_name ?? '-'}</span>
                        </div>
                      </TableCell>

                      <TableCell
                        className={clsx(
                          'py-[10px] px-6 text-center text-[#30313D] text-sm border-t border-b truncate whitespace-nowrap',
                          {
                            'border-[#064771] bg-[#F5FBFF]': isSelected,
                            'border-[#E4E4E4] bg-white': !isSelected,
                          }
                        )}
                      >
                        <div
                          className={`inline-flex items-center gap-2 py-1 px-3 rounded-[36px] ${
                            Number(partner.partnership_structure?.status) === 1
                              ? 'bg-[#1A941F]'
                              : 'bg-[#DC2626]'
                          }`}
                        >
                          <svg
                            width="8"
                            height="9"
                            viewBox="0 0 8 9"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M8 4.5C8 6.70914 6.20914 8.5 4 8.5C1.79086 8.5 0 6.70914 0 4.5C0 2.29086 1.79086 0.5 4 0.5C6.20914 0.5 8 2.29086 8 4.5Z"
                              fill="white"
                            />
                          </svg>
                          <span className="text-white text-xs font-medium leading-[1.4] font-poppins">
                            {' '}
                            {Number(partner.partnership_structure?.status) === 1
                              ? 'Active'
                              : 'Inactive'}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell
                        className={clsx(
                          'py-[10px] px-6 text-center font-medium text-[#30313D] text-sm border-t border-b truncate whitespace-nowrap',
                          {
                            'border-[#064771] bg-[#F5FBFF]': isSelected,
                            'border-[#E4E4E4] bg-white': !isSelected,
                          }
                        )}
                      >
                        <div className="flex items-center justify-center gap-3">
                          {countryData ? (
                            <>
                              <img
                                className="w-[26px] h-[26px] rounded-full"
                                alt={`${countryData.name} flag`}
                                src={countryData.flagSrc}
                              />
                              <span className="font-poppins">{countryData.name}</span>
                            </>
                          ) : (
                            <span className="text-[#A0A0A0] italic">Unknown</span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell
                        className={clsx(
                          'py-[5px] text-sm font-semibold text-center text-[#30313D] font-poppins border-t border-b',
                          {
                            'border-[#064771] bg-[#F5FBFF]': isSelected,
                            'border-[#E4E4E4] bg-white': !isSelected,
                          }
                        )}
                      >
                        {partner.partnership_structure?.partnership_structure}
                      </TableCell>
                      <TableCell
                        className={clsx(
                          'py-[10px] px-6 text-center font-medium text-[#30313D] text-sm border-t border-b truncate whitespace-nowrap',
                          {
                            'border-[#064771] bg-[#F5FBFF]': isSelected,
                            'border-[#E4E4E4] bg-white': !isSelected,
                          }
                        )}
                      >
                        {employeeData ? (
                          <div className="flex items-center gap-2 justify-center overflow-hidden whitespace-nowrap">
                            <img
                              src={
                                employeeData.image
                                  ? `${baseURL}/storage/${employeeData.image}`
                                  : `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(
                                      `${employeeData.first_name || 'U'} ${
                                        employeeData.last_name || 'N'
                                      }`
                                    )}`
                              }
                              alt={`${employeeData.first_name} ${employeeData.last_name}`}
                              className="w-[26px] h-[26px] rounded-full object-cover shrink-0"
                            />
                            <span className="truncate font-poppins">
                              {employeeData.first_name} {employeeData.last_name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[#A0A0A0] italic">Unknown</span>
                        )}
                      </TableCell>

                      <TableCell
                        className={clsx(
                          'py-[5px] text-sm font-semibold text-center text-[#064771] font-poppins border-t border-b',
                          {
                            'border-[#064771] bg-[#F5FBFF]': isSelected,
                            'border-[#E4E4E4] bg-white': !isSelected,
                          }
                        )}
                      >
                        {partner.sellers_count ?? 'N/A'}
                      </TableCell>

                      <TableCell
                        className={clsx(
                          'py-[5px] text-sm font-semibold text-center text-[#064771] font-poppins border-t border-b',
                          {
                            'border-[#064771] bg-[#F5FBFF]': isSelected,
                            'border-[#E4E4E4] bg-white': !isSelected,
                          }
                        )}
                      >
                        {partner.buyers_count ?? 'N/A'}
                      </TableCell>

                      <TableCell
                        className={clsx(
                          'py-2 px-6 text-center border-t border-b border-r rounded-r-lg whitespace-nowrap',
                          {
                            'border-[#064771] bg-[#F5FBFF]': isSelected,
                            'border-[#E4E4E4] bg-white': !isSelected,
                          }
                        )}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            className="flex items-center justify-center w-[35px] h-[35px] rounded-full p-1 border border-red-600"
                            onClick={() => handleDelete(partner.id)}
                          >
                            <svg
                              width="17"
                              height="21"
                              viewBox="0 0 17 21"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M2.14867 5.73529V17.3824C2.14867 18.5519 3.09677 19.5 4.26631 19.5H12.7369C13.9065 19.5 14.8545 18.5519 14.8545 17.3824V5.73529M2.14867 5.73529H1.08984M2.14867 5.73529H4.26631M14.8545 5.73529H15.9134M14.8545 5.73529H12.7369M4.26631 5.73529V3.61765C4.26631 2.4481 5.21442 1.5 6.38396 1.5H10.6193C11.7888 1.5 12.7369 2.4481 12.7369 3.61765V5.73529M4.26631 5.73529H12.7369M6.38396 9.97059V15.2647M10.6193 9.97059V15.2647"
                                stroke="#DF272A"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>

                          <button
                            type="button"
                            className="flex items-center justify-center w-[35px] h-[35px] rounded-full bg-white border border-[#064771]"
                            onClick={() => navigate(`/partner-portal/edit/${partner.id}`)}
                          >
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M13.523 2.477C14.1087 1.89127 14.9085 1.56445 15.7375 1.56445C16.5665 1.56445 17.3663 1.89127 17.952 2.477L19.523 4.048C20.1087 4.63373 20.4355 5.43352 20.4355 6.2625C20.4355 7.09148 20.1087 7.89127 19.523 8.477L8.52305 19.477L4.00005 20.000L4.52305 15.477L13.523 2.477Z"
                                stroke="#064771"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M11.5 4.5L17.5 10.5"
                                stroke="#064771"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>

                          <button
                            type="button"
                            className="flex items-center justify-center w-[35px] h-[35px] rounded-full bg-white border border-[#064771]"
                            onClick={() => navigate(`/partner-portal/view/${partner.id}`)}
                          >
                            <svg
                              width="20"
                              height="17"
                              viewBox="0 0 20 17"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M19.1961 6.29048C17.9193 4.12804 15.0149 0.5 9.91751 0.5C4.8201 0.5 1.91577 4.12804 0.638947 6.29048C0.244234 6.95437 0.0351563 7.71947 0.0351562 8.5C0.0351562 9.28053 0.244234 10.0456 0.638947 10.7095C1.91577 12.872 4.8201 16.5 9.91751 16.5C15.0149 16.5 17.9193 12.872 19.1961 10.7095C19.5908 10.0456 19.7999 9.28053 19.7999 8.5C19.7999 7.71947 19.5908 6.95437 19.1961 6.29048ZM17.7925 9.81322C16.6959 11.6675 14.2139 14.7879 9.91751 14.7879C5.6211 14.7879 3.13908 11.6675 2.04254 9.81322C1.80804 9.41861 1.68382 8.96388 1.68382 8.5C1.68382 8.03612 1.80804 7.58140 2.04254 7.18678C3.13908 5.33253 5.62110 2.21215 9.91751 2.21215C14.2139 2.21215 16.6959 5.32911 17.7925 7.18678C18.0270 7.58140 18.1512 8.03612 18.1512 8.5C18.1512 8.96388 18.0270 9.41861 17.7925 9.81322Z"
                                fill="#064771"
                              />
                              <path
                                d="M9.91889 4.26465C9.08123 4.26465 8.26238 4.51304 7.56589 4.97842C6.86940 5.44380 6.32655 6.10527 6.00599 6.87917C5.68543 7.65306 5.60156 8.50464 5.76498 9.32621C5.92840 10.1478 6.33177 10.9024 6.92408 11.4947C7.51640 12.0871 8.27106 12.4904 9.09262 12.6539C9.91419 12.8173 10.7658 12.7334 11.5397 12.4128C12.3136 12.0923 12.9750 11.5494 13.4404 10.8529C13.9058 10.1565 14.1542 9.33760 14.1542 8.49994C14.1528 7.37708 13.7062 6.30060 12.9122 5.50662C12.1182 4.71264 11.0417 4.26599 9.91889 4.26465ZM9.91889 11.0411C9.41629 11.0411 8.92498 10.8921 8.50709 10.6129C8.08919 10.3336 7.76348 9.93675 7.57115 9.47241C7.37881 9.00807 7.32849 8.49712 7.42654 8.00418C7.52459 7.51124 7.76662 7.05845 8.12201 6.70306C8.47740 6.34767 8.93019 6.10565 9.42313 6.00759C9.91607 5.90954 10.4270 5.95987 10.8914 6.15220C11.3557 6.34454 11.7526 6.67025 12.0318 7.08814C12.3110 7.50603 12.4601 7.99734 12.4601 8.49994C12.4601 9.17390 12.1923 9.82026 11.7158 10.2968C11.2392 10.7734 10.5929 11.0411 9.91889 11.0411Z"
                                fill="#064771"
                              />
                            </svg>
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={tableHeaders.length}
                    className="py-4 px-6 bg-white text-center text-sm text-gray-500"
                  >
                    No partners found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => setCurrentPage(page)}
      />
    </div>
  );
};

export default PartnerPortal;

