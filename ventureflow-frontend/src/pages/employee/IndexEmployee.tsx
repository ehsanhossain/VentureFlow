import React, { useState, useMemo, useRef, useEffect } from 'react';

import ArrowIcon from '../../assets/svg/ArrowIcon';
import Breadcrumb from '../../assets/breadcrumb';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/table/table';
import Pagination from '../../components/Pagination';
import api from '../../config/api';
import { useNavigate } from 'react-router-dom';
import { ActionButton } from '../../components/ActionButton';
import { showAlert } from '../../components/Alert';
import clsx from 'clsx';
import SelectPicker from '../../components/SelectPicker';
import { Controller, useForm } from 'react-hook-form';

import { Dropdown, Country } from './components/Dropdown';

type Option = {
  label: string;
  value: string;
  image?: string;
};

export interface FilterState {
  registered: string;
  country: string;
  structure: string;
  status: string;
  broderIndustries?: string[];
  priorityIndustries?: string[];
}

interface FormValues {
  HQCountry: string;
  company: Option | null;
  RegisterWithin?: string;
  partnershipStructure?: string;
  status?: string;
}

type IndexEmployeeProps = {
  onApplyFilters?: () => void;
  onClearFilters?: () => void;
  initialState?: FilterState;
};

interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  employee_id: string;
  branch?: { name: string };
  department?: { name: string };
  team?: { name: string };
  image?: string;
}



interface Meta {
  current_page?: number;
  from?: number;
  last_page?: number;
  path?: string;
  per_page?: number;
  to?: number;
  total?: number;
}

const IndexEmployee = ({
  onApplyFilters = () => { },
  onClearFilters = () => { },
  initialState,
}: IndexEmployeeProps): JSX.Element => {
  localStorage.removeItem('employee_id');

  const {
    control,
    handleSubmit,
    reset,
  } = useForm<FormValues>({
    defaultValues: {
      HQCountry: '',
      company: null,
    } as Partial<FormValues>,
  });

  const defaultInitialState: FilterState = {
    registered: '',
    country: '',
    structure: '',
    status: '',
    broderIndustries: [],
    priorityIndustries: [],
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
  const [, setFilters] = useState<FilterState>(initialState || defaultInitialState);
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
        top: rect.bottom + window.scrollY - 130,
        left: leftPosition,
      });
    }
  }, [isModalOpen]);

  // Filter fields configuration - currently unused
  // const filterFields = [
  //   {
  //     id: 'registered' as keyof FilterState,
  //     label: 'Registered Within ',
  //     placeholder: 'Select',
  //     hasIcon: false,
  //     iconPosition: 'left',
  //     options: [
  //       { value: '7days', label: 'Last 7 days' },
  //       { value: '30days', label: 'Last 30 days' },
  //       { value: '90days', label: 'Last 90 days' },
  //     ],
  //   },
  //   {
  //     id: 'country' as keyof FilterState,
  //     label: "Partner's HQ/Origin Country",
  //     placeholder: 'Select Related Country',
  //     hasIcon: true,
  //     iconPosition: 'right',
  //     options: [
  //       { value: 'us', label: 'United States' },
  //       { value: 'uk', label: 'United Kingdom' },
  //       { value: 'ca', label: 'Canada' },
  //     ],
  //   },
  //   {
  //     id: 'structure' as keyof FilterState,
  //     label: 'Structure',
  //     placeholder: 'e.g., Percentage / Success Based',
  //     hasIcon: true,
  //     iconPosition: 'right',
  //     options: [
  //       { value: 'percentage', label: 'Percentage' },
  //       { value: 'success', label: 'Success Based' },
  //       { value: 'hybrid', label: 'Hybrid' },
  //     ],
  //   },
  //   {
  //     id: 'status' as keyof FilterState,
  //     label: 'Status',
  //     placeholder: 'Select Status',
  //     hasIcon: true,
  //     iconPosition: 'right',
  //     options: [
  //       { value: 'active', label: 'Active' },
  //       { value: 'inactive', label: 'Inactive' },
  //       { value: 'pending', label: 'Pending' },
  //     ],
  //   },
  // ];

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleClearFilter = () => {
    reset();
    setFilters(defaultInitialState);
    onClearFilters();
  };

  const handleApplySearch = (formValues: FormValues) => {
    let registeredAfter = '';
    if (formValues.RegisterWithin) {
      const date = new Date(formValues.RegisterWithin);

      date.setHours(date.getHours() + 6);

      registeredAfter = date.toISOString().split('T')[0];
    }



    const appliedFilters: Record<string, string> = {
      country: formValues.HQCountry ?? '',
      registered_after: registeredAfter,
      structure: formValues.partnershipStructure ?? '',
      status: formValues.status ?? '',
    };

    setFilters(appliedFilters as unknown as FilterState);
    setCurrentPage(1);
    setIsModalOpen(false);
    onApplyFilters();
  };

  const tableHeaders = [
    "Employee's Name",
    'EMID',
    'Branch',
    'Department',
    'Team',
    'Case References',
  ];

  const teaserData = useMemo(
    () => [
      {
        img: 'https://placehold.co/30x30',
        name: 'Dibbo Datta',
        emid: '998',
        branch: 'Tokyo Consulting firm Thailand',
        department: 'Sales & Marketing',
        team: 'Japanese Team',
        cases: 'BN-S-675, SW-B-675, + 3 More',
      },
    ],
    []
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_sortConfig, setSortConfig] = useState<{
    key: keyof (typeof teaserData)[0];
    direction: 'asc' | 'desc';
  } | null>(null);

  const handleSort = (key: keyof (typeof teaserData)[0]) => {
    setSortConfig((prev) =>
      prev?.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' }
    );
  };

  const navigate = useNavigate();

  const breadcrumbLinks = [
    { label: 'Home', url: '/', isCurrentPage: false },
    { label: 'All Employees', url: '/employee', isCurrentPage: true },
  ];

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [meta, setMeta] = useState<Meta>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const [loading, setLoading] = useState(false);

  const fetchEmployees = async (page = 1, query = '') => {
    try {
      setLoading(true);
      const response = await api.get('/api/employees', {
        params: { page, search: query },
      });

      setEmployees(response.data.data);
      setTotalPages(response.data.meta.last_page);
      setMeta(response.data.meta);
    } catch {
      showAlert({ type: "error", message: "Failed to fetch employees" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchEmployees(currentPage, searchQuery);
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, currentPage]);

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

  const handleComponentOpen = () => {
    setIsComponentOpen(true);
  };

  const handleComponentClose = () => {
    setIsComponentOpen(false);
    setSelectedEmployeeIds(new Set());
  };

  const [isComponentOpen, setIsComponentOpen] = useState(false);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<string | number>>(new Set());

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

        await api.delete(`/api/employees`, {
          data: { ids: selectedIdsArray },
        });


        showAlert({
          type: 'success',
          message: `${selectedIdsArray.length} item(s) deleted successfully!`,
        });
        fetchEmployees(currentPage, searchQuery);
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
  const handleExportData = () => {

    alert('Exporting data... (Parent function)');
  };
  const handleBulkDeleteClick = async () => {
    const idsToDeleteArray = Array.from(selectedEmployeeIds);

    if (idsToDeleteArray.length === 0) {
      alert('Please select employee to delete.');
      return;
    }

    const success = await handleDeleteData(idsToDeleteArray);

    if (success) {
      setSelectedEmployeeIds(new Set());

    }
  };

  const handleCheckboxChange = (employeeId: string | number) => {
    setSelectedEmployeeIds((prevSelectedIds) => {
      const newSelectedIds = new Set(prevSelectedIds);
      if (newSelectedIds.has(employeeId)) {
        newSelectedIds.delete(employeeId);
      } else {
        newSelectedIds.add(employeeId);
      }
      return newSelectedIds;
    });
  };

  const [countries, setCountries] = useState<Country[]>([]);
  useEffect(() => {
    api
      .get('/api/countries')
      .then((res) => {
        setCountries(res.data);
      })
      .catch(() => showAlert({ type: "error", message: "Failed to fetch countries" }))
      .finally(() => setLoading(false));
  }, []);

  const [companyOptions, setCompanyOptions] = useState<Option[]>([]);
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const { data } = await api.get('/api/companies');


        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const options: Option[] = data.data.map((company: any) => ({
          label: company.name,
          value: String(company.id),
        }));

        setCompanyOptions(options);
      } catch {
        showAlert({ type: "error", message: "Failed to fetch companies" });

        setCompanyOptions([]);
      }
    };

    fetchCompanies();
  }, []);

  return (
    <div className="bg-white py-6">
      <div className="flex justify-between items-center flex-row gap-[464px] px-[25px] pt-[25px]">
        <div className="flex flex-col gap-4 w-[789px]">
          <div className="flex w-full justify-start items-center gap-3">
            <span className="text-black text-2xl font-medium font-poppins">All Employees</span>
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
                  <div className="text-white font-poppins text-[.8125rem] font-semibold leading-[1.1875rem]">
                    Back
                  </div>
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
            onClick={() => navigate('/employee/add')}
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
              <span className="text-white text-sm font-medium font-poppins">Add Employee</span>
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
              width="25"
              height="24"
              viewBox="0 0 25 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M19.25 12.75H23.75"
                stroke="#064771"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M21.5 10.5V15"
                stroke="#064771"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M10.625 15C13.7316 15 16.25 12.4816 16.25 9.375C16.25 6.2684 13.7316 3.75 10.625 3.75C7.5184 3.75 5 6.2684 5 9.375C5 12.4816 7.5184 15 10.625 15Z"
                stroke="#064771"
                strokeWidth="2"
                strokeMiterlimit="10"
              />
              <path
                d="M2.58203 18.7498C3.56766 17.5755 4.79846 16.6313 6.18797 15.9835C7.57747 15.3357 9.09198 15 10.6251 15C12.1582 15 13.6727 15.3357 15.0622 15.9835C16.4517 16.6314 17.6825 17.5756 18.6681 18.7499"
                stroke="#064771"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-[#064771] text-center leading-5 font-poppins">All Employees</span>
            <div className="flex flex-col">
              <div className="flex items-center gap-2 px-2 bg-[#E4F8FF] rounded-3xl h-[24px]">
                <div className="flex items-center gap-0.5">
                  <span className="text-[#064771] text-sm font-medium leading-5 font-poppins">
                    {meta.total}
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

      <div className="flex justify-between items-center py-[25px] px-[20px]">
        <div className="flex justify-between items-center gap-3 py-2 px-3 bg-white border border-gray-500 rounded-md w-[358px] h-[35px]">
          <div className="flex items-center gap-3">
            <svg
              width="21"
              height="21"
              viewBox="0 0 21 21"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9.93309 16.0908C13.5356 16.0908 16.456 13.1704 16.456 9.56786C16.456 5.96534 13.5356 3.04492 9.93309 3.04492C6.33057 3.04492 3.41016 5.96534 3.41016 9.56786C3.41016 13.1704 6.33057 16.0908 9.93309 16.0908Z"
                stroke="#838383"
                strokeWidth="1.49096"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M14.5469 14.1807L18.3209 17.9547"
                stroke="#838383"
                strokeWidth="1.49096"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <input
              ref={inputRef}
              type="text"
              placeholder="Search Here"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-gray-500 text-sm leading-normal font-poppins bg-transparent border-none outline-none"
            />
          </div>
          <div className="flex items-center gap-2 font-poppins">
            <div className="flex items-center gap-1">
              <div className="flex items-center justify-center bg-gray-200 rounded px-1 w-6 h-5">
                <span className="text-gray-500 text-[10px] font-bold">Ctrl</span>
              </div>
              <span className="text-gray-500 text-xs font-bold">/</span>
              <div className="flex items-center justify-center bg-gray-200 rounded px-1 w-5 h-5">
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 17 17"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M11.5324 3.52979H11.5324C11.9938 3.52979 12.4362 3.71305 12.7624 4.03926C13.0886 4.36547 13.2719 4.8079 13.2719 5.26923V5.26924C13.2719 5.73057 13.0886 6.173 12.7624 6.49921C12.4362 6.82542 11.9937 7.00868 11.5324 7.00868H9.79297V5.26924C9.79297 4.8079 9.97623 4.36547 10.3024 4.03926C10.6287 3.71305 11.0711 3.52979 11.5324 3.52979V3.52979Z"
                    stroke="#838383"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M6.8125 7.00879H5.07305C4.61172 7.00879 4.16928 6.82553 3.84307 6.49932C3.51686 6.17311 3.3336 5.73067 3.3336 5.26934V5.26934C3.3336 4.80801 3.51686 4.36557 3.84307 4.03936C4.16928 3.71315 4.61172 3.52989 5.07305 3.52989H5.07305C5.53438 3.52989 5.97682 3.71315 6.30303 4.03936C6.62924 4.36557 6.8125 4.80801 6.8125 5.26934V7.00879Z"
                    stroke="#838383"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9.79297 9.99072H11.5324C11.9937 9.99072 12.4362 10.174 12.7624 10.5002C13.0886 10.8264 13.2719 11.2688 13.2719 11.7302V11.7302C13.2719 12.1915 13.0886 12.6339 12.7624 12.9602C12.4362 13.2864 11.9938 13.4696 11.5324 13.4696H11.5324C11.0711 13.4696 10.6287 13.2864 10.3024 12.9601C9.97623 12.6339 9.79297 12.1915 9.79297 11.7302V9.99072Z"
                    stroke="#838383"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M5.07305 13.4692H5.07305C4.61172 13.4692 4.16928 13.286 3.84307 12.9598C3.51686 12.6336 3.3336 12.1911 3.3336 11.7298V11.7298C3.3336 11.2685 3.51686 10.826 3.84307 10.4998C4.16928 10.1736 4.61172 9.99034 5.07305 9.99034H6.8125V11.7298C6.8125 12.1911 6.62924 12.6336 6.30303 12.9598C5.97682 13.286 5.53438 13.4692 5.07305 13.4692V13.4692Z"
                    stroke="#838383"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9.79441 7.00879H6.8125V9.9907H9.79441V7.00879Z"
                    stroke="#838383"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
            <span className="text-gray-500 text-xs font-bold">+</span>
            <div className="flex items-center justify-center bg-gray-200 rounded px-1 w-5 h-5">
              <span className="text-gray-600 text-sm font-medium">F</span>
            </div>
          </div>
        </div>

        <div className="flex justify-start items-center gap-4">
          <span className="text-sm leading-5 font-poppins text-center">
            <span className="text-gray-500">Showing</span>
            <span className="text-gray-800 font-poppins mx-1">{employees?.length}</span>
            <span className="text-gray-500">of</span>
            <span className="text-gray-800 font-poppins mx-1">{meta?.total}</span>
            <span className="text-gray-500">Employees</span>
          </span>

          <div className="flex items-center gap-4 h-8">
            <div className="flex items-center gap-4 h-8">
              <ActionButton
                onExport={handleExportData}
                onDelete={handleBulkDeleteClick}
                onOpen={handleComponentOpen}
                onClose={handleComponentClose}
              />

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
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
              onClick={handleCloseModal}
            />

            <div
              className="fixed z-[101] animate-in fade-in-0 zoom-in-95 duration-200"
              style={{
                top: modalPosition.top,
                left: modalPosition.left,
              }}
            >
              <div className="w-[782px] rounded-[20px] border-0 shadow-2xl bg-white">
                <div className="flex flex-col w-full items-start gap-6 p-6">
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

                  <div className="flex flex-col items-start gap-6 w-full">
                    <div className="flex flex-col items-center gap-[35px] w-full">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex flex-col w-[301px] h-[70px] items-start justify-between">
                          <div className="flex items-center gap-1.5 w-full">
                            <span className="font-medium text-[#30313d] text-base leading-[19.3px] font-['Poppins',Helvetica]">
                              Company
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
                            name="company"
                            render={({ field }) => (
                              <SelectPicker
                                options={companyOptions}
                                value={field.value?.value || null}
                                onChange={(val) => {
                                  const selected = companyOptions.find((opt) => opt.value === val);
                                  field.onChange(selected || null);
                                }}
                                searchable
                                placeholder="Select Company"
                              />
                            )}
                          />
                        </div>

                        <div className="flex flex-col h-[70px] items-start justify-between flex-1 ml-[80px]">
                          <div className="flex items-center gap-1.5 w-full">
                            <span className="font-medium text-[#30313d] text-base leading-[19.3px] font-['Poppins',Helvetica]">
                              Nationality
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
                                  selected={
                                    countries.find(
                                      (c) => c.name === field.value || c.alpha === field.value
                                    ) || null
                                  }
                                  onSelect={(val) => field.onChange((val as Country)?.name || (val as Country)?.alpha)}
                                />
                              </div>
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

      <section className="flex flex-col gap-3.5 w-full px-6 py-4">
        <div className="w-full">
          <Table className="w-full border-separate border-spacing-y-[10px]">
            <TableHeader>
              <TableRow className="rounded-lg">
                {tableHeaders.map((header, idx) => {
                  const key = Object.keys(teaserData[0])[idx] as
                    | keyof (typeof teaserData)[0]
                    | undefined;

                  return (
                    <TableHead
                      key={idx}
                      onClick={() => key && handleSort(key)}
                      className={`cursor-pointer py-[10px] px-6 font-semibold text-[#727272] text-sm border-t border-b ${idx === 0 ? 'border-l first:rounded-l-lg' : ''
                        } ${idx === tableHeaders.length - 1 ? 'border-r last:rounded-r-lg' : ''
                        } bg-[#F9F9F9] text-center whitespace-nowrap hover:bg-[#d1d1d1] transition-colors`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        {header}
                        <ArrowIcon />
                      </div>
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`loading-${i}`} className="animate-pulse">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j} className="py-[10px] px-6 bg-white">
                        <div className="h-4 rounded bg-blue-900/10 w-full"></div>
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : employees.length > 0 ? (
                employees.map((employee, index) => {
                  const isSelected = selectedEmployeeIds.has(employee.id);

                  return (
                    <TableRow key={index}>
                      <TableCell
                        className={clsx(
                          'py-[10px] px-6 font-semibold text-[#30313D] text-sm border-t border-b border-l truncate whitespace-nowrap rounded-l-lg',
                          {
                            'border-[#064771] bg-[#F5FBFF]': isSelected,
                            'border-[#E4E4E4] bg-white': !isSelected,
                          }
                        )}
                      >
                        <div className="flex items-center gap-2 justify-start">
                          {isComponentOpen && (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleCheckboxChange(employee.id);
                              }}
                            />
                          )}
                          <img
                            src={
                              employee?.image
                                ? `${baseURL}/storage/${employee.image}`
                                : `https://ui-avatars.com/api/?name=${employee?.first_name ?? 'User'
                                }+${employee?.last_name ?? ''}&background=ccc&color=000&size=128`
                            }
                            alt={`${employee?.first_name ?? ''} ${employee?.last_name ?? ''}`}
                            className="w-[26px] h-[26px] rounded-full object-cover"
                          />

                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/employee/details/${employee.id}`);
                            }}
                            className="cursor-pointer"
                          >
                            {`${employee?.first_name ?? ''} ${employee?.last_name ?? ''}`}
                          </span>
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
                        {employee.employee_id}
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
                        {employee.branch?.name ?? ''}
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
                        {employee.department?.name ?? ''}
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
                        {employee.team?.name ?? ''}
                      </TableCell>

                      <TableCell
                        className={clsx(
                          'py-[10px] px-6 text-center last:rounded-r-lg text-[#064771] text-sm border-t border-b truncate whitespace-nowrap underline border-r',
                          {
                            'border-[#064771] bg-[#F5FBFF]': isSelected,
                            'border-[#E4E4E4] bg-white': !isSelected,
                          }
                        )}
                      ></TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-4 text-center text-sm text-gray-500">
                    No employees found.
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

export default IndexEmployee;
