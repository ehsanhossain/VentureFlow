import React, { useEffect, useState, useContext } from 'react';
import Breadcrumb from '../../../assets/breadcrumb';
import MaleIcon from '../icons/MaleIcon';
import FemaleIcon from '../icons/FemaleIcon';
import Select from '../components/Select';
import { PlusSquareIcon } from 'lucide-react';
import { Input } from '../../../components/Input';
import { useForm, Controller } from 'react-hook-form';
import SelectPicker from '../../../components/SelectPicker';
import DatePicker from '../../../components/DatePicker';
import api from '../../../config/api';
import axios from 'axios';
import { showAlert } from '../../../components/Alert';
import { RadioGroup, RadioOption } from '../../../components/RadioGroup';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Country, Dropdown } from '../components/Dropdown';
import { AuthContext } from '../../../routes/AuthContext';
type Option = {
  label: string;
  value: string;
  image?: string;
};

const genderOptions = [
  { value: 'male', label: 'Male', icon: <MaleIcon /> },
  { value: 'female', label: 'Female', icon: <FemaleIcon /> },
];

type FormValues = {
  // Common Fields
  loginEmail: string;
  password: string;
  profilePicture: FileList;
  nationality: Country | null; // Used for both (Employee Nationality / Partner HQ Country)

  // Employee Fields
  firstName: string;
  lastName: string;
  gender: string;
  employeeID: string;
  employeeStatus: string;
  joiningDate: Date | null;
  dobDate: Date | null;
  workEmail: string;
  contact: string;
  role: string;
  company: Option | null;
  department: Option | null;
  branch: Option | null;
  team: Option | null;
  designation: Option | null;

  // Partner Fields
  regName: string;
  partnerID: string;
};

const empStatusOptions = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
];

const CreateEmployee: React.FC = () => {
  const [accountType, setAccountType] = useState<'employee' | 'partner'>('employee');

  const [designationOptions, setDesignationOptions] = useState<Option[]>([]);

  const [companyOptions, setCompanyOptions] = useState<Option[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<Option[]>([]);
  const [branchOptions, setBranchOptions] = useState<Option[]>([]);
  const [teamOptions, setTeamOptions] = useState<Option[]>([]);

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const { data } = await api.get('/api/companies');


        const options: Option[] = data.data.map((company: { id: number | string; name: string }) => ({
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

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const { data } = await api.get('/api/departments');


        const options: Option[] = data.data.map(
          (department: { id: number | string; name: string }) => ({
            label: department.name,
            value: String(department.id),
          }));

        setDepartmentOptions(options);
      } catch {
        showAlert({ type: "error", message: "Failed to fetch departments" });

        setDepartmentOptions([]);
      }
    };

    fetchDepartments();
  }, []);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const { data } = await api.get('/api/branches');


        const options: Option[] = data.data.map((branch: { id: number | string; name: string }) => ({
          label: branch.name,
          value: String(branch.id),
        }));

        setBranchOptions(options);
      } catch {
        showAlert({ type: "error", message: "Failed to fetch branches" });

        setBranchOptions([]);
      }
    };

    fetchBranches();
  }, []);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const { data } = await api.get('/api/teams');

        const options: Option[] = data.data.map((team: { id: number | string; name: string }) => ({
          label: team.name,
          value: String(team.id),
        }));

        setTeamOptions(options);
      } catch {
        showAlert({ type: "error", message: "Failed to fetch teams" });

        setTeamOptions([]);
      }
    };

    fetchTeams();
  }, []);

  useEffect(() => {
    const fetchDesignations = async () => {
      try {
        const { data } = await api.get('/api/designations');


        const options: Option[] = data.data.map(
          (designation: { id: number | string; title: string }) => ({
            label: designation.title,
            value: String(designation.id),
          }));

        setDesignationOptions(options);
      } catch {
        showAlert({ type: "error", message: "Failed to fetch designations" });

        setDesignationOptions([]);
      }
    };

    fetchDesignations();
  }, []);

  const [roleOptions, setRoleOptions] = useState<RadioOption[]>([]);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await api.get('/api/roles');
        const roles = response.data.data;

        const formattedRoles: RadioOption[] = roles.map((role: { name: string }) => ({
          id: role.name,
          label: formatLabel(role.name),
        }));

        setRoleOptions(formattedRoles);
      } catch {
        showAlert({ type: "error", message: "Failed to fetch roles" });
      }
    };

    fetchRoles();
  }, []);

  const formatLabel = (name: string): string => {
    return name.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  };

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
            is_region?: boolean;
          }) => ({
            id: country.id,
            name: country.name,
            flagSrc: country.svg_icon_url,
            status: 'unregistered',
            alpha: country.alpha_2_code,
            is_region: country.is_region || false,
          }));

        setCountries(formatted);
      } catch {
        showAlert({ type: "error", message: "Failed to fetch countries" });
      }
    };

    fetchCountries();
  }, []);



  type FileInfo = {
    label: string;
    value: string;
  };

  const fileInfo: FileInfo[] = [
    {
      label: 'Acceptable file types:',
      value: 'JPEG & PNG',
    },
    {
      label: 'Maximum file Size:',
      value: '1 MB',
    },
  ];

  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|png)$/)) {
      alert('Only JPEG and PNG files are allowed!');
      return;
    }

    if (file.size > 1048576) {
      alert('File size must be less than 1MB!');
      return;
    }

    setValue('profilePicture', event.target.files!);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const {
    control,
    handleSubmit,
    register,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();

  const { id: paramId } = useParams();
  const location = useLocation();
  const context = useContext(AuthContext);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentUser = context?.user as any;
  const isProfilePage = location.pathname === '/profile';

  // If on profile page, use the logged-in user's employee or partner ID, otherwise use param ID
  const id = isProfilePage ? (currentUser?.employee?.id || currentUser?.partner?.id) : paramId;
  const canEditRole = currentUser?.role === 'System Admin' && !isProfilePage;

  useEffect(() => {
    if (isProfilePage && currentUser?.partner && !currentUser?.employee) {
      setAccountType('partner');
    }
  }, [isProfilePage, currentUser]);

  interface EmployeeData {
    first_name: string;
    last_name: string;
    gender: string;
    employee_id: string;
    employee_status: string;
    work_email: string;
    contact_number: string;
    role: string;
    company: { id: number | string };
    department: { id: number | string };
    branch: { id: number | string };
    team: { id: number | string };
    designation: { id: number | string };
    nationality: number | string;
    joining_date: string;
    dob: string;
    user: { email: string };
    is_partner?: boolean;
    reg_name?: string;
    partner_id?: string;
  }

  const [employeeData, setemployeeData] = useState<EmployeeData | null>(null);

  const breadcrumbLinks = [
    { label: 'Home', url: '/', isCurrentPage: false },
    { label: 'System Set-up', url: '#', isCurrentPage: false },
    { label: 'All Employees', url: '/employee', isCurrentPage: false },
    {
      label: id ? 'Update Employee' : 'Create Employee',
      url: '',
      isCurrentPage: true,
    },
  ];

  useEffect(() => {
    if (!id) return;
    const fetchemployeeData = async () => {
      try {
        const response = await api.get(`/api/employees/${id}`);
        setemployeeData(response.data);

      } catch {
        showAlert({ type: "error", message: "Failed to fetch company data" });
      }
    };

    fetchemployeeData();
  }, [id]);

  useEffect(() => {
    if (!employeeData) return;

    setValue('firstName', employeeData?.first_name || '');
    setValue('lastName', employeeData?.last_name || '');
    setValue('gender', employeeData?.gender || '');
    setValue('employeeID', employeeData?.employee_id || '');
    setValue('employeeStatus', employeeData?.employee_status || '');
    setValue('workEmail', employeeData?.work_email || '');
    setValue('contact', employeeData?.contact_number || '');
    setValue('role', employeeData?.role || '');
    // If it's a partner, set partner fields
    if (employeeData.is_partner) {
      setAccountType('partner');
      setValue('regName', employeeData.reg_name || '');
      setValue('partnerID', employeeData.partner_id || '');
    }

    if (employeeData && companyOptions.length > 0 && employeeData.company) {
      const selectedCompany = companyOptions.find(
        (opt) => opt.value === String(employeeData.company.id)
      );

      setValue('company', selectedCompany || null);
    }

    if (employeeData && departmentOptions.length > 0) {
      const selectedDepartment = departmentOptions.find(
        (opt) => opt.value === String(employeeData.department.id)
      );
      setValue('department', selectedDepartment || null);
    }

    if (employeeData && branchOptions.length > 0) {
      const selectedBranch = branchOptions.find(
        (opt) => opt.value === String(employeeData.branch.id)
      );
      setValue('branch', selectedBranch || null);
    }
    if (employeeData && teamOptions.length > 0) {
      const selectedTeam = teamOptions.find((opt) => opt.value === String(employeeData.team.id));
      setValue('team', selectedTeam || null);
    }

    if (employeeData && designationOptions.length > 0) {
      const selectedDesignation = designationOptions.find(
        (opt) => opt.value === String(employeeData.designation.id)
      );
      setValue('designation', selectedDesignation || null);
    }

    const nationality = countries.find((c) => String(c.id) === String(employeeData?.nationality));
    setValue('nationality', nationality ?? null);

    if (employeeData.joining_date) {
      const parsedJoining = new Date(employeeData?.joining_date);
      setValue('joiningDate', !isNaN(parsedJoining.getTime()) ? parsedJoining : null);
    } else {
      setValue('joiningDate', null);
    }

    if (employeeData?.dob) {
      const parsedDOB = new Date(employeeData?.dob);
      setValue('dobDate', !isNaN(parsedDOB.getTime()) ? parsedDOB : null);
    } else {
      setValue('dobDate', null);
    }
    setValue('loginEmail', employeeData?.user?.email || '');
  }, [
    employeeData,
    countries,
    setValue,
    companyOptions,
    departmentOptions,
    branchOptions,
    teamOptions,
    designationOptions,
  ]);

  const onSubmit = async (data: FormValues) => {
    try {

      const formData = new FormData();

      if (id) {
        formData.append('id', id);
      }

      formData.append('type', accountType);

      if (accountType === 'employee') {
        formData.append('first_name', data.firstName);
        formData.append('last_name', data.lastName);
        formData.append('gender', data.gender);
        formData.append('employee_id', data.employeeID);
        formData.append(
          'nationality',
          data.nationality && data.nationality.id ? String(data.nationality.id) : ''
        );
        formData.append('employee_status', data.employeeStatus);
        formData.append('joining_date', data.joiningDate?.toISOString().split('T')[0] || '');
        formData.append('dob', data.dobDate?.toISOString().split('T')[0] || '');
        formData.append('work_email', data.workEmail);
        formData.append('contact_number', data.contact);
        formData.append('company', data.company?.value || '');
        formData.append('department', data.department?.value || '');
        formData.append('branch', data.branch?.value || '');
        formData.append('team', data.team?.value || '');
        formData.append('designation', data.designation?.value || '');
        formData.append('role', data.role);
        formData.append('login_email', data.loginEmail || '');
        formData.append('password', data.password || '');
      } else {
        // Partner Data
        formData.append('reg_name', data.regName);
        formData.append('partner_id', data.partnerID);
        formData.append('hq_country', data.nationality ? String(data.nationality.id) : '');
        formData.append('login_email', data.loginEmail || '');
        formData.append('password', data.password || '');
      }

      const file = data.profilePicture?.[0];
      if (file) {
        formData.append('image', file);
      }

      const res = await api.post('/api/employees', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      showAlert({ type: 'success', message: res.data.message });

      navigate('/employee');
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const { response } = error;

        if (response?.status === 422 && response.data.errors) {
          const validationErrors = response.data.errors;
          const errorMessages = Object.values(validationErrors).flat().join('\n');

          showAlert({
            type: 'error',
            message: errorMessages,
          });
        } else {
          showAlert({
            type: 'error',
            message: response?.data?.message || 'Something went wrong.',
          });
        }
      } else {
        showAlert({ type: 'error', message: 'An unexpected error occurred.' });
      }
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col flex-shrink-0 justify-center items-start gap-4 w-full md:w-[682px]">
          <div className="flex items-center self-stretch text-gray-900 text-right text-[1.75rem] font-medium leading-[normal] pt-10 md:pt-[40px] pl-[25px]">
            {id ? 'Update User' : `Create ${accountType === 'employee' ? 'Employee' : 'Partner'}`}
          </div>
          <div className="flex items-center self-stretch pl-[25px]">
            <div className="flex flex-col md:flex-row items-center gap-2.5 w-full md:w-[447px]">
              <button
                type="button"
                className="flex flex-col flex-shrink-0 justify-center items-center gap-1 py-1 px-3 rounded bg-[#064771]"
                onClick={() => navigate('/employee')}
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
            {!id && (
              <div className="flex items-center gap-2 ml-auto pr-6">
                <span className={`text-sm font-medium ${accountType === 'employee' ? 'text-[#064771]' : 'text-gray-500'}`}>Employee</span>
                <div
                  className={`w-12 h-6 flex items-center bg-gray-300 rounded-full p-1 cursor-pointer transition-colors duration-300 ${accountType === 'partner' ? 'bg-[#064771]' : 'bg-gray-300'
                    }`}
                  onClick={() => setAccountType(prev => prev === 'employee' ? 'partner' : 'employee')}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${accountType === 'partner' ? 'translate-x-6' : ''
                      }`}
                  />
                </div>
                <span className={`text-sm font-medium ${accountType === 'partner' ? 'text-[#064771]' : 'text-gray-500'}`}>Partner</span>
              </div>
            )}
          </div>

          <div className="flex self-stretch justify-start items-center flex-row gap-[26px] pt-[55px] pl-[40px]">
            <div className="bg-white flex flex-row justify-center w-full">
              <div className="w-[190px] justify-center gap-[15px] left-[20px] flex flex-col items-center relative">
                <input
                  type="file"
                  ref={(e) => {
                    register('profilePicture');
                    fileInputRef.current = e;
                  }}
                  onChange={handleFileChange}
                  accept="image/jpeg,image/png"
                  className="hidden"
                />

                <div
                  className="w-[150px] h-[150px] rounded-[75px] border-[1.05px] border-dashed border-[#064771] bg-white cursor-pointer overflow-hidden flex items-center justify-center"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Profile preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-[86.01px] gap-[10.49px] flex flex-col items-center">
                      <PlusSquareIcon className="w-[30.98px] h-[30.98px] text-[#064771]" />
                      <p className="font-medium text-gray-500 text-[11.3px] text-center tracking-[0] leading-[12.1px]">
                        Upload Profile Picture
                      </p>
                    </div>
                  )}
                </div>

                <div className="gap-[11px] self-stretch w-full flex flex-col items-center">
                  {fileInfo.map((info, index) => (
                    <div
                      key={index}
                      className="relative self-stretch font-normal text-center leading-normal"
                    >
                      <span className="font-normal text-gray-500 tracking-[0] text-xs">
                        {info.label} <br />
                      </span>
                      <span className="font-semibold text-gray-900 tracking-[-0.02px] text-xs">
                        {info.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-center items-center w-full px-6 md:px-[25px]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="2"
                height="280"
                viewBox="0 0 2 280"
                fill="none"
              >
                <path d="M1 0V280" stroke="#CBD5E1" />
              </svg>
            </div>
            <div className="flex justify-start items-start flex-col gap-9 w-[1042px]">
              {accountType === 'partner' ? (
                <>
                  {/* Partner Fields */}
                  <div className="flex self-stretch justify-start items-center flex-row gap-[44px]">
                    <div className="flex flex-col gap-5 w-full md:w-[386px]">
                      <div className="flex justify-start items-center flex-row gap-1.5">
                        <span className="text-[#EC1D42] font-sf font-semibold leading-[19.28569984436035px]">
                          *
                        </span>
                        <span className="text-gray-900 font-medium leading-[19.28569984436035px] ">
                          Registered Name
                        </span>
                      </div>
                      <Input
                        {...register('regName', {
                          required: accountType === 'partner' ? 'Registered Name is required' : false,
                        })}
                        placeholder="Organization Name"
                        error={!!errors.regName}
                      />
                      {errors.regName && (
                        <span className="text-sm text-red-500 mt-[-5px]">
                          {errors.regName.message}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-3.5 w-[386px]">
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-1">
                          <span className="text-red-600 font-semibold leading-5">*</span>
                          <span className="text-gray-900 font-medium leading-5 ">
                            Partner ID
                          </span>
                        </div>
                      </div>
                      <Input
                        {...register('partnerID', {
                          required: accountType === 'partner' ? 'Partner ID is required' : false,
                        })}
                        placeholder="Partner ID"
                        error={!!errors.partnerID}
                      />
                      {errors.partnerID && (
                        <span className="text-sm text-red-500 mt-[-5px]">
                          {errors.partnerID.message}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex self-stretch justify-start items-center flex-row gap-[44px]">
                    <div className="flex flex-col gap-3.5 w-full md:w-[386px]">
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-1">
                          <span className="text-red-600 font-semibold leading-5">*</span>
                          <span className="text-gray-900 font-medium leading-5 ">
                            HQ Country
                          </span>
                        </div>
                      </div>
                      <Controller
                        name="nationality"
                        control={control}
                        rules={{ required: accountType === 'partner' ? 'HQ Country is required' : false }}
                        render={({ field }) => (
                          <div className="w-full">
                            <Dropdown
                              {...field}
                              countries={countries}
                              selected={field.value}
                              onSelect={field.onChange}
                              placeholder="Select HQ Country"
                            />
                          </div>
                        )}
                      />
                      {errors.nationality && (
                        <span className="text-sm text-red-500 mt-[-5px]">
                          Country is required
                        </span>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Employee Fields */}
                  <div className="flex self-stretch justify-start items-center flex-row gap-[44px]">
                    <div className="flex flex-col gap-5 w-full md:w-[386px]">
                      <div className="flex justify-start items-center flex-row gap-1.5">
                        <span className="text-[#EC1D42] font-sf font-semibold leading-[19.28569984436035px]">
                          *
                        </span>
                        <span className="text-gray-900 font-medium leading-[19.28569984436035px] ">
                          First Name
                        </span>
                      </div>
                      <Input
                        {...register('firstName', {
                          required: 'First Name is required',
                        })}
                        placeholder="Please write your first name"
                        error={!!errors.firstName}
                      />
                      {errors.firstName && (
                        <span className="text-sm text-red-500 mt-[-5px]">
                          {errors.firstName.message}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-start items-start flex-col gap-3.5 w-[386px]">
                      <div className="flex self-stretch justify-start items-center flex-row gap-1.5">
                        <div className="flex justify-start items-center flex-row gap-[3px]">
                          <span className="text-[#EC1D42] font-semibold leading-[19.28569984436035px]">
                            *
                          </span>
                          <span className="text-gray-900 font-medium leading-[19.28569984436035px] ">
                            Last Name
                          </span>
                        </div>
                        <div className="flex justify-center items-center w-4 h-4"></div>
                      </div>
                      <Input
                        {...register('lastName', {
                          required: 'Last Name is required',
                        })}
                        placeholder="Please write your last name"
                        error={!!errors.lastName}
                      />
                      {errors.lastName && (
                        <span className="text-sm text-red-500 mt-[-5px]">
                          {errors.lastName.message}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-[19px] w-[182px]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#EC1D42] font-medium leading-[19.2857px]">
                          *
                        </span>
                        <span className="text-gray-900 font-medium leading-[19.2857px] ">
                          Gender
                        </span>
                      </div>

                      <Controller
                        name="gender"
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                          <Select
                            options={genderOptions}
                            selected={field.value}
                            onChange={field.onChange}
                          />
                        )}
                      />

                      {errors.gender && (
                        <span className="text-sm text-red-500 mt-[-5px]">
                          Gender is required
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex self-stretch justify-start items-center flex-row gap-[44px]">
                    <div className="flex flex-col gap-3.5 w-[386px]">
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-1">
                          <span className="text-red-600 font-semibold leading-5">*</span>
                          <span className="text-gray-900 font-medium leading-5 ">
                            Employee ID
                          </span>
                        </div>
                      </div>
                      <Input
                        {...register('employeeID', {
                          required: 'Employee ID is required',
                        })}
                        placeholder="Please Write Employee ID"
                        error={!!errors.employeeID}
                      />
                      {errors.employeeID && (
                        <span className="text-sm text-red-500 mt-[-5px]">
                          {errors.employeeID.message}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-3.5 w-full md:w-[386px]">
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-1">
                          <span className="text-red-600 font-semibold leading-5">*</span>
                          <span className="text-gray-900 font-medium leading-5 ">
                            Nationality
                          </span>
                        </div>
                      </div>
                      <Controller
                        name="nationality"
                        control={control}
                        render={({ field }) => (
                          <div className="w-full">
                            <Dropdown
                              {...field}
                              countries={countries.filter(c => !c.is_region)}
                              selected={field.value}
                              onSelect={field.onChange}
                            />
                          </div>
                        )}
                      />
                    </div>

                    <Controller
                      name="employeeStatus"
                      control={control}
                      rules={{ required: 'Employee status is required' }}
                      render={({ field }) => (
                        <div className="flex flex-col gap-4 w-[182px]">
                          <div className="flex items-center gap-1.5">
                            <span className="text-red-600 font-semibold ">*</span>
                            <span className="text-gray-900 font-medium ">
                              Employee Status
                            </span>
                          </div>
                          <Select
                            options={empStatusOptions}
                            selected={field.value}
                            onChange={field.onChange}
                          />
                        </div>
                      )}
                    />
                  </div>
                  <div className="flex justify-start items-center flex-row gap-[44px]">
                    <div className="flex justify-start items-center flex-row gap-5">
                      <div className="flex flex-col gap-4 w-[183px]">
                        <div className="flex items-center gap-1.5">
                          <span className="text-red-600 font-semibold"> *</span>
                          <span className="text-gray-900 font-medium ">Joining Date</span>
                        </div>
                        <div className="relative">
                          <Controller
                            control={control}
                            name="joiningDate"
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
                      <div className="flex flex-col gap-4 w-[183px]">
                        <div className="flex items-center gap-1.5">
                          <span className="text-red-600 font-semibold"> *</span>
                          <span className="text-gray-900 font-medium ">DOB</span>
                        </div>
                        <div className="relative">
                          <Controller
                            control={control}
                            name="dobDate"
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
                    </div>
                    <div className="flex flex-col gap-3.5 w-[386px]">
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-1">
                          <span className="text-red-600 font-semibold">*</span>
                          <span className="text-gray-900 font-medium ">Work Email</span>
                        </div>
                      </div>
                      <Input
                        {...register('workEmail', {
                          required: 'Work Email is required',
                        })}
                        leftIcon={
                          <svg
                            width="20"
                            height="18"
                            viewBox="0 0 20 18"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M2.45148 2.70909C1.81896 3.29642 1.39535 4.24941 1.39535 5.74435V12.256C1.39535 13.7509 1.81896 14.7039 2.45148 15.2912C3.09335 15.8872 4.06044 16.2095 5.34884 16.2095H14.6512C15.9395 16.2095 16.9066 15.8872 17.5486 15.2912C18.181 14.7039 18.6047 13.7509 18.6047 12.256V5.74435C18.6047 4.24941 18.181 3.29642 17.5486 2.70909C16.9066 2.11306 15.9395 1.79086 14.6512 1.79086H5.34884C4.06044 1.79086 3.09335 2.11306 2.45148 2.70909ZM1.50201 1.68658C2.48805 0.770977 3.84654 0.395508 5.34884 0.395508H14.6512C16.1535 0.395508 17.512 0.770977 18.498 1.68658C19.4934 2.61088 20 3.98346 20 5.74435V12.256C20 14.0169 19.4934 15.3895 18.498 16.3137C17.512 17.2294 16.1535 17.6048 14.6512 17.6048H5.34884C3.84654 17.6048 2.48805 17.2294 1.50201 16.3137C0.506623 15.3895 0 14.0169 0 12.256V5.74435C0 3.98346 0.506623 2.61088 1.50201 1.68658Z"
                              fill="#838383"
                            />
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M16.8489 4.63734C17.0845 4.94223 17.0283 5.38039 16.7235 5.61598L11.5634 9.60323C10.6421 10.315 9.35639 10.315 8.43509 9.60323L3.27503 5.61598C2.97013 5.38039 2.91395 4.94223 3.14955 4.63734C3.38515 4.33243 3.8233 4.27626 4.1282 4.51186L9.28821 8.49905C9.707 8.82268 10.2915 8.82268 10.7102 8.49905L15.8703 4.51186C16.1752 4.27626 16.6133 4.33243 16.8489 4.63734Z"
                              fill="#838383"
                            />
                          </svg>
                        }
                        placeholder="Enter your email"
                        error={!!errors.workEmail}
                      />
                      {errors.workEmail && (
                        <span className="text-sm text-red-500 mt-[-5px]">
                          {errors.workEmail.message}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-start items-start flex-col gap-[19px] w-[182px]">
                      <div className="flex justify-start items-center flex-row gap-1.5">
                        <span className="text-[#EC1D42] font-sf font-semibold leading-[19.2857px]">
                          *
                        </span>
                        <span className="text-gray-900 font-medium leading-[19.2857px] ">
                          Contact Number
                        </span>
                      </div>
                      <Input
                        {...register('contact', {
                          required: 'Contact Number is required',
                        })}
                        placeholder="e.g., +66 081 091 87"
                        error={!!errors.contact}
                      />
                      {errors.contact && (
                        <span className="text-sm text-red-500 mt-[-5px]">
                          {errors.contact.message}
                        </span>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex self-stretch justify-start items-start flex-col gap-[43px] pt-[50px] pl-[40px] pb-[40px]">
          <p className="self-stretch text-black text-lg font-medium leading-5">
            Company Details & User Role
          </p>
          <div className="flex flex-col items-start gap-8 w-full">
            <div className="flex flex-col items-start gap-8 w-full">
              <div className="flex flex-row items-center gap-16 w-full">
                <div className="flex flex-col gap-3.5 w-[386px]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#EC1D42] font-semibold leading-[19.29px]">
                      *
                    </span>
                    <span className="text-gray-900 font-medium leading-[19.29px]">
                      Company
                    </span>
                  </div>

                  <Controller
                    control={control}
                    name="company"
                    render={({ field }) => (
                      <SelectPicker
                        options={companyOptions}
                        value={field.value?.value || null}
                        onChange={(val: string | null) => {
                          const selected = companyOptions.find((opt) => opt.value === val);
                          field.onChange(selected || null);
                        }}
                        searchable
                        placeholder="Select Company"
                      />
                    )}
                  />

                  {errors.company && (
                    <p className="text-red-500 text-sm mt-1">{errors.company.message}</p>
                  )}
                </div>
                <div
                  className="flex justify-start items-start flex-col gap-3.5 w-[386px]"
                  style={{ width: '386px' }}
                >
                  <div className="flex justify-start items-center flex-row gap-1.5">
                    <span className="text-[#EC1D42] font-['SF_Pro_Display'] font-semibold leading-[19.28569984436035px]">
                      *
                    </span>
                    <span className="text-gray-900 font-medium text-sm ">
                      Department
                    </span>
                  </div>
                  <Controller
                    control={control}
                    name="department"
                    render={({ field }) => (
                      <SelectPicker
                        options={departmentOptions}
                        value={field.value?.value || null}
                        onChange={(val: string | null) => {
                          const selected = departmentOptions.find((opt) => opt.value === val);
                          field.onChange(selected || null);
                        }}
                        searchable
                        placeholder="Select Department"
                      />
                    )}
                  />
                </div>
                <div
                  className="flex justify-start items-start flex-col gap-3.5 w-[386px]"
                  style={{ width: '386px' }}
                >
                  <div className="flex justify-start items-center flex-row gap-1.5">
                    <span className="text-[#EC1D42] font-semibold leading-[19.28569984436035px]">
                      *
                    </span>
                    <span className="text-gray-900 font-medium text-sm ">
                      Select Branch
                    </span>
                  </div>
                  <Controller
                    control={control}
                    name="branch"
                    render={({ field }) => (
                      <SelectPicker
                        options={branchOptions}
                        value={field.value?.value || null}
                        onChange={(val: string | null) => {
                          const selected = branchOptions.find((opt) => opt.value === val);
                          field.onChange(selected || null);
                        }}
                        searchable
                        placeholder="Select Branch"
                      />
                    )}
                  />
                </div>
              </div>
              <div className="flex justify-start items-center flex-row gap-[64px]">
                <div
                  className="flex justify-start items-start flex-col gap-3.5 w-[386px]"
                  style={{ width: '386px' }}
                >
                  <div className="flex justify-start items-center flex-row gap-1.5">
                    <span className="text-[#EC1D42] font-['SF_Pro_Display'] font-semibold leading-[19.28569984436035px]">
                      *
                    </span>
                    <span className="text-gray-900 font-medium leading-[19.29px] ">
                      Select Team
                    </span>
                  </div>
                  <div className="relative w-full">
                    <Controller
                      control={control}
                      name="team"
                      render={({ field }) => (
                        <SelectPicker
                          options={teamOptions}
                          value={field.value?.value || null}
                          onChange={(val: string | null) => {
                            const selected = teamOptions.find((opt) => opt.value === val);
                            field.onChange(selected || null);
                          }}
                          searchable
                          placeholder="Select Team"
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-3.5 w-[386px]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-red-600 font-semibold ">*</span>
                    <span className="text-gray-900 font-medium ">Designation</span>
                  </div>
                  <div className="relative w-full">
                    <Controller
                      control={control}
                      name="designation"
                      render={({ field }) => (
                        <SelectPicker
                          options={designationOptions}
                          value={field.value?.value || null}
                          onChange={(val: string | null) => {
                            const selected = designationOptions.find((opt) => opt.value === val);
                            field.onChange(selected || null);
                          }}
                          searchable
                          placeholder="Select Designation"
                        />
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white flex w-full">
              <div className="bg-white w-full max-w-[1110px]">
                <p className="self-stretch text-black text-lg font-medium leading-5 pb-10">
                  User login and Permission
                </p>
                <div className="flex flex-col items-start gap-6 w-full">
                  <div className="flex flex-col sm:flex-row items-start gap-6 sm:gap-10 w-full">
                    <div className="flex flex-col w-full sm:w-[386px] gap-2">
                      <label className="inline-flex items-center gap-1.5">
                        <span className="font-medium text-[#eb1c41] text-base">*</span>
                        <span className="font-medium text-gray-900 text-base ">
                          System Login ID
                        </span>
                      </label>
                      <div className="relative w-full">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                          <svg
                            className="h-5 w-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <Input
                          {...register('loginEmail', {
                            required: 'Login Email is required',
                          })}
                          leftIcon={
                            <svg
                              width="20"
                              height="18"
                              viewBox="0 0 20 18"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M2.45148 2.70909C1.81896 3.29642 1.39535 4.24941 1.39535 5.74435V12.256C1.39535 13.7509 1.81896 14.7039 2.45148 15.2912C3.09335 15.8872 4.06044 16.2095 5.34884 16.2095H14.6512C15.9395 16.2095 16.9066 15.8872 17.5486 15.2912C18.181 14.7039 18.6047 13.7509 18.6047 12.256V5.74435C18.6047 4.24941 18.181 3.29642 17.5486 2.70909C16.9066 2.11306 15.9395 1.79086 14.6512 1.79086H5.34884C4.06044 1.79086 3.09335 2.11306 2.45148 2.70909ZM1.50201 1.68658C2.48805 0.770977 3.84654 0.395508 5.34884 0.395508H14.6512C16.1535 0.395508 17.512 0.770977 18.498 1.68658C19.4934 2.61088 20 3.98346 20 5.74435V12.256C20 14.0169 19.4934 15.3895 18.498 16.3137C17.512 17.2294 16.1535 17.6048 14.6512 17.6048H5.34884C3.84654 17.6048 2.48805 17.2294 1.50201 16.3137C0.506623 15.3895 0 14.0169 0 12.256V5.74435C0 3.98346 0.506623 2.61088 1.50201 1.68658Z"
                                fill="#838383"
                              />
                              <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M16.8489 4.63734C17.0845 4.94223 17.0283 5.38039 16.7235 5.61598L11.5634 9.60323C10.6421 10.315 9.35639 10.315 8.43509 9.60323L3.27503 5.61598C2.97013 5.38039 2.91395 4.94223 3.14955 4.63734C3.38515 4.33243 3.8233 4.27626 4.1282 4.51186L9.28821 8.49905C9.707 8.82268 10.2915 8.82268 10.7102 8.49905L15.8703 4.51186C16.1752 4.27626 16.6133 4.33243 16.8489 4.63734Z"
                                fill="#838383"
                              />
                            </svg>
                          }
                          placeholder="Enter your login email"
                          error={!!errors.loginEmail}
                        />
                        {errors.loginEmail && (
                          <span className="text-sm text-red-500 mt-[-5px]">
                            {errors.loginEmail.message}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col w-full sm:w-[414px] gap-2">
                      <label className="inline-flex items-center gap-1.5">
                        <span className="font-medium text-[#eb1c41] text-base">*</span>
                        <span className="font-medium text-gray-900 text-base ">
                          Password
                        </span>
                      </label>
                      <div className="relative w-full">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                          <svg
                            className="h-5 w-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            />
                          </svg>
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          {...register(
                            'password',
                            id
                              ? {}
                              : {
                                required: 'Password is required',
                                minLength: {
                                  value: 6,
                                  message: 'Password must be at least 6 characters long',
                                },
                              }
                          )}
                          className="h-10 w-full pl-12 pr-10 bg-white rounded-md border border-gray-300 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          placeholder="••••••••••"
                        />

                        {errors.password && (
                          <span className="text-sm text-red-500 mt-[-5px]">
                            {errors.password.message}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                          {showPassword ? (
                            <svg
                              className="h-5 w-5 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="h-5 w-5 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {canEditRole && (
                    <div className="flex flex-col w-full sm:w-[459px] gap-4">
                      <label className="inline-flex items-center gap-1.5">
                        <span className="font-medium text-[#eb1c41] text-base">*</span>
                        <span className="font-medium text-gray-900 text-base ">
                          System-wide Permission
                        </span>
                      </label>
                      <Controller
                        name="role"
                        control={control}
                        rules={{ required: 'Role is required' }}
                        render={({ field }) => (
                          <RadioGroup
                            options={roleOptions}
                            value={field.value}
                            onChange={field.onChange}
                          />
                        )}
                      />

                      {errors.role && (
                        <p className="text-red-500 text-sm mt-1">{errors.role.message}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex self-stretch justify-between items-end flex-row gap-[631px]">
              <div className="fixed right-0 bottom-5 pr-[45px] flex items-center gap-5 h-[34px] z-50">
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-2 py-1.5 bg-red-100 border border-red-600 rounded-full"
                  onClick={() => navigate('/employee')}
                >
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 19 19"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      cx="9.1937"
                      cy="9.24546"
                      r="8.58443"
                      stroke="#DF272A"
                      strokeWidth="1.22635"
                    />
                    <path
                      d="M12.6768 6.48633L6.43359 12.7296M12.8719 12.9247L6.53023 6.58296"
                      stroke="#DF272A"
                      strokeWidth="1.53293"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="text-red-600 text-center font-medium ">Cancel</span>
                </button>

                <button
                  type="submit"
                  className="flex justify-center items-center py-[5px] px-2 bg-[#064771] rounded-full w-[98px] h-[34px] disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="animate-spin border-4 border-white border-t-transparent rounded-full w-5 h-5"></span>
                  ) : (
                    <>
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M9.84214 0.802246C8.02302 0.802246 6.24476 1.34168 4.73222 2.35232C3.21969 3.36297 2.04081 4.79944 1.34466 6.48008C0.648516 8.16072 0.466373 10.0101 0.821265 11.7942C1.17616 13.5784 2.05214 15.2172 3.33845 16.5035C4.62476 17.7898 6.26362 18.6658 8.04778 19.0207C9.83194 19.3756 11.6813 19.1935 13.3619 18.4973C15.0426 17.8012 16.479 16.6223 17.4897 15.1098C18.5003 13.5972 19.0397 11.819 19.0397 9.99985C19.0371 7.5613 18.0672 5.22339 16.3429 3.49907C14.6186 1.77476 12.2807 0.804884 9.84214 0.802246ZM9.84214 17.6645C8.32621 17.6645 6.84432 17.215 5.58388 16.3728C4.32343 15.5306 3.34103 14.3335 2.76091 12.933C2.18079 11.5325 2.029 9.99135 2.32474 8.50455C2.62049 7.01775 3.35048 5.65203 4.4224 4.58011C5.49432 3.50819 6.86004 2.7782 8.34684 2.48245C9.83364 2.18671 11.3747 2.3385 12.7753 2.91862C14.1758 3.49874 15.3729 4.48114 16.2151 5.74159C17.0573 7.00204 17.5068 8.48392 17.5068 9.99985C17.5046 12.032 16.6963 13.9802 15.2594 15.4171C13.8225 16.854 11.8743 17.6623 9.84214 17.6645ZM13.6745 9.99985C13.6745 10.2031 13.5937 10.3981 13.45 10.5418C13.3062 10.6856 13.1113 10.7663 12.908 10.7663H10.6086V13.0657C10.6086 13.269 10.5279 13.464 10.3841 13.6077C10.2404 13.7514 10.0454 13.8322 9.84214 13.8322C9.63886 13.8322 9.4439 13.7514 9.30017 13.6077C9.15642 13.464 9.07567 13.269 9.07567 13.0657V10.7663H6.77627C6.57299 10.7663 6.37804 10.6856 6.2343 10.5418C6.09056 10.3981 6.0098 10.2031 6.0098 9.99985C6.0098 9.79657 6.09056 9.60162 6.2343 9.45788C6.37804 9.31414 6.57299 9.23338 6.77627 9.23338H9.07567V6.93398C9.07567 6.7307 9.15642 6.53575 9.30017 6.39201C9.4439 6.24827 9.63886 6.16751 9.84214 6.16751C10.0454 6.16751 10.2404 6.24827 10.3841 6.39201C10.5279 6.53575 10.6086 6.7307 10.6086 6.93398V9.23338H12.908C13.1113 9.23338 13.3062 9.31414 13.45 9.45788C13.5937 9.60162 13.6745 9.79657 13.6745 9.99985Z"
                          fill="white"
                        />
                      </svg>
                      <span className="text-white text-center font-medium ml-[4px]">
                        {id ? 'Update' : 'Create'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateEmployee;
