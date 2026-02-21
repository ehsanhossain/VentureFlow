/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

import React, { useEffect, useState } from 'react';
import Breadcrumb from '../../../assets/breadcrumb';
import Frame from './svg/Frame_1000000921.svg';
import ArrowIcon from '../../../assets/svg/ArrowIcon';
import { useNavigate, useParams } from 'react-router-dom';
import Pagination from '../../../components/Pagination';
import clsx from 'clsx';
import MaleIcon from '../icons/MaleIcon';
import FemaleIcon from '../icons/FemaleIcon';
import { ActionButton } from '../../../components/ActionButton';
const baseURL = import.meta.env.VITE_API_BASE_URL;
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/table/table';
import { showAlert } from '../../../components/Alert';
import api from '../../../config/api';

// interface Country {
//   id: number;
//   name: string;
//   alpha_2_code: string;
//   alpha_3_code: string;
//   numeric_code: number;
// }

const EmployeeDetails: React.FC = () => {
  const [selectedButton, setSelectedButton] = useState<string>('employee');

  const handleClick = (buttonName: string) => {
    setSelectedButton(buttonName);
  };
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages] = useState(1);

  const tableHeaders = ["Company's Name", 'Prospect', 'Country', 'Dealroom ID', 'Status'];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<any>>(new Set());
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

  const handleComponentClose = () => {
    setIsComponentOpen(false);
    setSelectedEmployeeIds(new Set());
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [employee, setEmployee] = useState<any>(null);
  // const [country, setCountry] = useState<Country | null>(null);
  const { id } = useParams();

  const breadcrumbLinks = [
    { label: 'Home', url: '/', isCurrentPage: false },
    { label: 'System Set-up', url: '#', isCurrentPage: false },
    { label: 'All Employees', url: '/employee', isCurrentPage: false },
    {
      label: `${employee?.first_name ?? ''} ${employee?.last_name ?? ''}`,
      url: '',
      isCurrentPage: true,
    },
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [assignedProjects, setAssignedProjects] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;

    const fetchEmployee = async () => {
      try {
        const response = await api.get(`/api/employees/${id}`);
        const data = response.data;

        setEmployee(data);
        // setCountry(data.country);


        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        showAlert({ type: "error", message: "Failed to fetch employee" });
      }
    };

    fetchEmployee();
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const fetchProjects = async () => {
      try {
        const response = await api.get(`/api/employees/assigned-projects/${id}`);
        const data = response.data.data;

        setAssignedProjects(data);

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        showAlert({ type: "error", message: "Failed to fetch projects" });
      }
    };

    fetchProjects();
  }, [id]);

  const handleCheckboxChange = (employeeId: number | string) => {
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
  const [isComponentOpen, setIsComponentOpen] = useState(false);
  const handleComponentOpen = () => {
    setIsComponentOpen(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDeleteData = async (selectedIdsArray: any[]) => {


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

        await api.delete(`/api/employee`, {
          data: { ids: selectedIdsArray },
        });


        showAlert({
          type: 'success',
          message: `${selectedIdsArray.length} item(s) deleted successfully!`,
        });
        // fetchEmployees(); // Function not defined in this scope
        return true;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
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

  const navigate = useNavigate();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [countries, setCountries] = useState<any[]>([]);
  useEffect(() => {
    api
      .get('/api/countries')
      .then((res) => {
        setCountries(res.data);
      })
      .catch(() => showAlert({ type: "error", message: "Failed to fetch countries" }));
  }, []);

  const getCountryById = (id: number) => countries.find((c) => c.id === id);

  const countryData = getCountryById(parseInt(employee?.nationality));

  return (
    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-[13px] w-full ">
      <div className="flex flex-col flex-shrink-0 justify-center items-start gap-4 w-full md:w-[682px] pl-7 pt-7">
        <div className="flex items-center self-stretch text-gray-900 text-right text-[1.75rem] font-medium leading-[normal]">
          Employee Details
        </div>
        <div className="flex items-center self-stretch">
          <div className="flex flex-col md:flex-row items-center gap-2.5 w-full md:w-[447px]">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex flex-col flex-shrink-0 justify-center items-center gap-1 py-1 px-3 rounded bg-[#064771]"
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
            {selectedButton === 'projects' && (
              <div className="flex justify-center items-center flex-row gap-2 py-2 px-3 border-solid   rounded h-[34px]   absolute top-[150px] right-[120px]  ">
                <ActionButton
                  onExport={handleExportData}
                  onDelete={handleBulkDeleteClick}
                  onOpen={handleComponentOpen}
                  onClose={handleComponentClose}
                />
              </div>
            )}

            <div className="absolute top-15 right-7 mt-1">
              <button
                className="flex justify-center items-center flex-row gap-1.5 py-[5px] px-3 bg-[#064771] rounded-full w-[80px] h-[34px]"
                onClick={() => {
                  navigate(`/employee/edit/${employee?.id}`);
                }}
              >
                <svg
                  width="18"
                  height="16"
                  viewBox="0 0 18 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M3.36745 11.0658C2.92321 11.0658 2.56268 10.7224 2.56268 10.2993V5.70062C2.56268 5.27754 2.92321 4.93417 3.36745 4.93417C3.81168 4.93417 4.17224 4.5908 4.17224 4.16771C4.17224 3.74463 3.81168 3.40126 3.36745 3.40126H2.56268C1.6734 3.40126 0.953125 4.08724 0.953125 4.93417V11.0658C0.953125 11.9127 1.6734 12.5987 2.56268 12.5987H3.36745C3.81168 12.5987 4.17224 12.2553 4.17224 11.8322C4.17224 11.4092 3.81168 11.0658 3.36745 11.0658ZM15.4391 3.40126H9.80565C9.36141 3.40126 9.00088 3.74463 9.00088 4.16771C9.00088 4.5908 9.36141 4.93417 9.80565 4.93417H14.6343C15.0786 4.93417 15.4391 5.27754 15.4391 5.70062V10.2993C15.4391 10.7224 15.0786 11.0658 14.6343 11.0658H9.80565C9.36141 11.0658 9.00088 11.4092 9.00088 11.8322C9.00088 12.2553 9.36141 12.5987 9.80565 12.5987H15.4391C16.3284 12.5987 17.0486 11.9127 17.0486 11.0658V4.93417C17.0486 4.08724 16.3284 3.40126 15.4391 3.40126ZM9.00088 14.8981C9.00088 15.3211 8.64035 15.6645 8.19611 15.6645H4.977C4.53277 15.6645 4.17224 15.3211 4.17224 14.8981C4.17224 14.475 4.53277 14.1316 4.977 14.1316H5.78177V1.86836H4.977C4.53277 1.86836 4.17224 1.52498 4.17224 1.1019C4.17224 0.67882 4.53277 0.335449 4.977 0.335449H8.19611C8.64035 0.335449 9.00088 0.67882 9.00088 1.1019C9.00088 1.52498 8.64035 1.86836 8.19611 1.86836H7.39132V14.1316H8.19611C8.64035 14.1316 9.00088 14.475 9.00088 14.8981Z"
                    fill="white"
                  />
                </svg>

                <p className="text-white">Edit</p>
              </button>
            </div>
          </div>
        </div>

        <div className="w-full min-w-[1500px] mx-auto px-4 pt-5 ">
          <div className="flex flex-col md:flex-row bg-white border border-[#D1D1D1] rounded-[9.17px] overflow-hidden  justify-between w-[1440px] ">
            <div className="bg-[#F9FCFF] p-6 flex flex-col items-center w-[300px] flex-shrink-0 border-r border-[#D1D1D1] ">
              <img
                className="rounded-full w-34 h-34 object-cover"
                src={
                  employee?.image
                    ? `${baseURL}/storage/${employee.image}`
                    : "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='145' height='145' viewBox='0 0 145 145' fill='none'><rect x='1' y='1' width='143' height='143' rx='71.5' fill='%23F1FBFF'/><rect x='1' y='1' width='143' height='143' rx='71.5' stroke='%23064771' stroke-width='2'/><path d='M72.5001 73.2894C80.9906 73.2894 87.8954 66.3849 87.8954 57.8947C87.8954 49.4045 80.9906 42.5 72.5001 42.5C64.0095 42.5 57.1047 49.4045 57.1047 57.8947C57.1047 66.3849 64.0095 73.2894 72.5001 73.2894ZM72.5001 47.6316C78.1604 47.6316 82.7636 52.2346 82.7636 57.8947C82.7636 63.5548 78.1604 68.1578 72.5001 68.1578C66.8397 68.1578 62.2365 63.5548 62.2365 57.8947C62.2365 52.2346 66.8397 47.6316 72.5001 47.6316Z' fill='%23064771'/><path d='M95.593 99.9313C95.593 101.348 94.446 102.497 93.0271 102.497C91.6082 102.497 90.4612 101.348 90.4612 99.9313C90.4612 92.1852 85.5219 85.5886 78.635 83.0741L74.7426 88.9138L77.5471 99.1513C78.0167 100.86 76.5079 102.5 74.4655 102.5H70.5345C68.4921 102.5 66.9859 100.86 67.4529 99.1513L70.2574 88.9138L66.365 83.0741C59.4781 85.5886 54.5388 92.1852 54.5388 99.9338C54.5388 101.35 53.3892 102.5 51.9729 102.5C50.5565 102.5 49.407 101.35 49.407 99.9338C49.407 87.2024 59.768 76.8418 72.5 76.8418C85.2319 76.8418 95.593 87.1999 95.593 99.9313Z' fill='%23064771'/></svg>"
                }
                alt="profile"
              />

              <p className="text-gray-900 text-[22px] text-center font-semibold mt-5">
                {employee?.first_name} {employee?.last_name}
              </p>
              <p className="text-gray-500 text-[16px] mt-2 text-center">
                {employee?.designation?.title}
              </p>

              <button
                onClick={() => handleClick('employee')}
                className={`relative flex items-center ${selectedButton === 'employee' ? 'text-[#064771] underline' : 'text-gray-900'
                  } text-[16px] font-semibold mt-[160px]`}
              >
                <p>Employee Details</p>
                {selectedButton === 'employee' && (
                  <div className="absolute left-[210px] top-0 h-[20px] w-[8px] bg-[#064771]"></div>
                )}
              </button>

              <button
                onClick={() => handleClick('projects')}
                className={`relative flex items-center ${selectedButton === 'projects' ? 'text-[#064771] underline' : 'text-gray-900'
                  } text-[16px] font-semibold mt-8 mb-4`}
              >
                <p>Assigned Projects</p>
                {selectedButton === 'projects' && (
                  <div className="absolute left-[210px] top-0 h-[20px] w-[8px] bg-[#064771]"></div>
                )}
              </button>
            </div>

            {selectedButton === 'employee' && (
              <div className="flex">
                <div className="p-5  md:border-r border-[#D1D1D1] flex-[1_1_0%] min-w-0 md:px-6 md:py-8 mt-7  ml-[-1100px]">
                  <div className="flex items-center gap-1">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <g clipPath="url(#clip0_1_7304)">
                        <path
                          d="M10 0C15.5228 0 20 4.47715 20 10C20 15.5228 15.5228 20 10 20C4.47715 20 0 15.5228 0 10C0 4.47715 4.47715 0 10 0ZM10 1.25C5.16751 1.25 1.25 5.16751 1.25 10C1.25 14.8325 5.16751 18.75 10 18.75C14.8325 18.75 18.75 14.8325 18.75 10C18.75 5.16751 14.8325 1.25 10 1.25ZM10 12.8125C10.4832 12.8125 10.875 13.2043 10.875 13.6875C10.875 14.1707 10.4832 14.5625 10 14.5625C9.51675 14.5625 9.125 14.1707 9.125 13.6875C9.125 13.2043 9.51675 12.8125 10 12.8125ZM10 5.625C11.3807 5.625 12.5 6.74429 12.5 8.125C12.5 9.28973 11.7035 10.2684 10.6255 10.5461L10.625 11.25C10.625 11.5952 10.3452 11.875 10 11.875C9.65482 11.875 9.375 11.5952 9.375 11.25V10C9.375 9.65482 9.65482 9.375 10 9.375C10.6904 9.375 11.25 8.81536 11.25 8.125C11.25 7.43464 10.6904 6.875 10 6.875C9.30964 6.875 8.75 7.43464 8.75 8.125C8.75 8.47018 8.47018 8.75 8.125 8.75C7.77982 8.75 7.5 8.47018 7.5 8.125C7.5 6.74429 8.61929 5.625 10 5.625Z"
                          fill="black"
                        />
                      </g>
                      <defs>
                        <clipPath id="clip0_1_7304">
                          <rect width="20" height="20" fill="white" />
                        </clipPath>
                      </defs>
                    </svg>
                    <span className="text-gray-900 font-semibold tracking-[0.32px]">
                      Personal Information
                    </span>
                  </div>

                  <div className="w-full h-[2px] bg-gray-300 mt-2"></div>

                  <div className="mt-5 space-y-6">
                    <div className="flex items-center gap-[80px]">
                      <p className="text-gray-900">Employee ID</p>
                      <p className="text-gray-900 font-medium">{employee?.employee_id}</p>
                    </div>

                    <div className="flex items-center gap-[30px]">
                      <p className="text-gray-900">Nationality</p>

                      <div className="flex justify-start items-center flex-row gap-[8.67px] ml-[55px]">
                        {countryData?.svg_icon_url ? (
                          <img
                            src={countryData?.svg_icon_url}
                            alt="flag"
                            className="w-[26px] h-[26px] rounded-full bg-gray-200 text-gray-900 text-[10px] flex items-center justify-center"
                          />
                        ) : (
                          <span className="w-[26px] h-[26px] rounded-full bg-gray-200 text-gray-900 text-[10px] flex items-center justify-center">
                            n/a
                          </span>
                        )}
                        <span className="text-gray-900 text-sm font-semibold leading-[31.78px]">
                          {countryData?.name || 'N/A'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-[80px]">
                      <p className="text-gray-900">Date of Birth</p>
                      <div className="text-left">
                        <p className="text-gray-900 font-medium">
                          {employee?.dob ? new Date(employee.dob).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-[120px]">
                      <p className="text-gray-900">Gender</p>

                      <div className="flex items-center gap-2.5">
                        <span className="text-gray-900 font-medium">
                          {employee?.gender
                            ? employee.gender.charAt(0).toUpperCase() + employee.gender.slice(1)
                            : ''}
                        </span>
                        {employee?.gender === 'Male' ? <MaleIcon /> : <FemaleIcon />}
                      </div>
                    </div>

                    <div className="flex items-center gap-[80px]">
                      <p className="text-gray-900">Employment</p>
                      <p className="text-gray-900 font-medium">Permanent</p>
                    </div>

                    <div className="flex items-center gap-[65px]">
                      <p className="text-gray-900">Company Mail</p>

                      <div className="flex items-center gap-2.5">
                        <span className="text-[#0C5577] font-medium" title={employee?.work_email}>
                          {employee?.work_email && employee.work_email.length > 25
                            ? employee.work_email.slice(0, 25) + '...'
                            : employee?.work_email}
                        </span>

                        <button
                          onClick={() => {
                            if (employee?.work_email) {
                              navigator.clipboard.writeText(employee.work_email);
                              alert('Copied!');
                            }
                          }}
                          className="flex items-center justify-center p-2 rounded bg-transparent hover:bg-gray-100"
                          title="Click to copy"
                        >
                          <svg
                            width="14"
                            height="16"
                            viewBox="0 0 14 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M12.77 2.18133L11.2473 0.608667C11.0603 0.416644 10.8369 0.263893 10.5901 0.159374C10.3432 0.0548549 10.078 0.000670954 9.81 0L6.66667 0C5.89853 0.000969683 5.15421 0.266727 4.55917 0.752479C3.96412 1.23823 3.55473 1.91428 3.4 2.66667H3.33333C2.4496 2.66773 1.60237 3.01925 0.97748 3.64415C0.352588 4.26904 0.00105857 5.11627 0 6V12.6667C0.00105857 13.5504 0.352588 14.3976 0.97748 15.0225C1.60237 15.6474 2.4496 15.9989 3.33333 16H7.33333C8.21706 15.9989 9.0643 15.6474 9.68919 15.0225C10.3141 14.3976 10.6656 13.5504 10.6667 12.6667V12.6C11.4191 12.4453 12.0951 12.0359 12.5809 11.4408C13.0666 10.8458 13.3324 10.1015 13.3333 9.33333V3.57333C13.3343 3.05361 13.1322 2.55408 12.77 2.18133ZM7.33333 14.6667H3.33333C2.8029 14.6667 2.29419 14.456 1.91912 14.0809C1.54405 13.7058 1.33333 13.1971 1.33333 12.6667V6C1.33333 5.46957 1.54405 4.96086 1.91912 4.58579C2.29419 4.21071 2.8029 4 3.33333 4V9.33333C3.33439 10.2171 3.68592 11.0643 4.31081 11.6892C4.93571 12.3141 5.78294 12.6656 6.66667 12.6667H9.33333C9.33333 13.1971 9.12262 13.7058 8.74755 14.0809C8.37247 14.456 7.86377 14.6667 7.33333 14.6667ZM10 11.3333H6.66667C6.13623 11.3333 5.62753 11.1226 5.25245 10.7475C4.87738 10.3725 4.66667 9.86377 4.66667 9.33333V3.33333C4.66667 2.8029 4.87738 2.29419 5.25245 1.91912C5.62753 1.54405 6.13623 1.33333 6.66667 1.33333H9.33333V2.66667C9.33333 3.02029 9.47381 3.35943 9.72386 3.60948C9.97391 3.85952 10.313 4 10.6667 4H12V9.33333C12 9.86377 11.7893 10.3725 11.4142 10.7475C11.0391 11.1226 10.5304 11.3333 10 11.3333Z"
                              fill="#4F4F4F"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-[40px]">
                      <p className="text-gray-900">Contact Number</p>
                      <div className="flex items-center gap-2.5">
                        <span className="text-gray-900 font-medium">
                          {employee?.contact_number || 'N/A'}
                        </span>

                        <button
                          onClick={() => {
                            if (employee?.contact_number) {
                              navigator.clipboard.writeText(employee.contact_number);
                              alert(' copied!');
                            }
                          }}
                          className="flex items-center justify-center p-2 rounded bg-transparent hover:bg-gray-100"
                          title="Click to copy"
                        >
                          <svg
                            width="14"
                            height="16"
                            viewBox="0 0 14 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M12.77 2.18133L11.2473 0.608667C11.0603 0.416644 10.8369 0.263893 10.5901 0.159374C10.3432 0.0548549 10.078 0.000670954 9.81 0L6.66667 0C5.89853 0.000969683 5.15421 0.266727 4.55917 0.752479C3.96412 1.23823 3.55473 1.91428 3.4 2.66667H3.33333C2.4496 2.66773 1.60237 3.01925 0.97748 3.64415C0.352588 4.26904 0.00105857 5.11627 0 6V12.6667C0.00105857 13.5504 0.352588 14.3976 0.97748 15.0225C1.60237 15.6474 2.4496 15.9989 3.33333 16H7.33333C8.21706 15.9989 9.0643 15.6474 9.68919 15.0225C10.3141 14.3976 10.6656 13.5504 10.6667 12.6667V12.6C11.4191 12.4453 12.0951 12.0359 12.5809 11.4408C13.0666 10.8458 13.3324 10.1015 13.3333 9.33333V3.57333C13.3343 3.05361 13.1322 2.55408 12.77 2.18133ZM7.33333 14.6667H3.33333C2.8029 14.6667 2.29419 14.456 1.91912 14.0809C1.54405 13.7058 1.33333 13.1971 1.33333 12.6667V6C1.33333 5.46957 1.54405 4.96086 1.91912 4.58579C2.29419 4.21071 2.8029 4 3.33333 4V9.33333C3.33439 10.2171 3.68592 11.0643 4.31081 11.6892C4.93571 12.3141 5.78294 12.6656 6.66667 12.6667H9.33333C9.33333 13.1971 9.12262 13.7058 8.74755 14.0809C8.37247 14.456 7.86377 14.6667 7.33333 14.6667ZM10 11.3333H6.66667C6.13623 11.3333 5.62753 11.1226 5.25245 10.7475C4.87738 10.3725 4.66667 9.86377 4.66667 9.33333V3.33333C4.66667 2.8029 4.87738 2.29419 5.25245 1.91912C5.62753 1.54405 6.13623 1.33333 6.66667 1.33333H9.33333V2.66667C9.33333 3.02029 9.47381 3.35943 9.72386 3.60948C9.97391 3.85952 10.313 4 10.6667 4H12V9.33333C12 9.86377 11.7893 10.3725 11.4142 10.7475C11.0391 11.1226 10.5304 11.3333 10 11.3333Z"
                              fill="#4F4F4F"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-[90px]">
                      <p className="text-gray-900">User Role</p>

                      <div className="bg-[#0C5577] rounded-[36px] h-[32px] px-3 flex items-center gap-2">
                        <div className="w-[16px] h-[16px]" style={{ width: '16px' }}>
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M14.8667 11.1334L15.8 10.2001L13.3333 7.7334L9.46667 11.6001C9.13333 11.4001 8.73333 11.3334 8.33333 11.3334C7.06667 11.3334 6 12.4001 6 13.6667C6 14.9334 7.06667 16.0001 8.33333 16.0001C9.6 16.0001 10.6667 14.9334 10.6667 13.6667C10.6667 13.2667 10.5333 12.8667 10.4 12.5334L11.6667 11.2667L13.2 12.8001L14.1333 11.8667L12.6 10.3334L13.3333 9.60006L14.8667 11.1334ZM8.33333 14.6667C7.8 14.6667 7.33333 14.2001 7.33333 13.6667C7.33333 13.1334 7.8 12.6667 8.33333 12.6667C8.86667 12.6667 9.33333 13.1334 9.33333 13.6667C9.33333 14.2001 8.86667 14.6667 8.33333 14.6667Z"
                              fill="white"
                            />
                            <path
                              d="M1.33333 12.6667C1.33333 10.0667 3.4 8 6 8C7.33333 8 8.6 8.6 9.53333 9.6L10.5333 8.73333C9.93333 8.06667 9.26667 7.53333 8.46667 7.2C9.4 6.46667 10 5.26667 10 4C10 1.8 8.2 0 6 0C3.8 0 2 1.8 2 4C2 5.26667 2.6 6.46667 3.6 7.2C1.46667 8.13333 0 10.2 0 12.6667V16H5.33333V14.6667H1.33333V12.6667ZM3.33333 4C3.33333 2.53333 4.53333 1.33333 6 1.33333C7.46667 1.33333 8.66667 2.53333 8.66667 4C8.66667 5.46667 7.46667 6.66667 6 6.66667C4.53333 6.66667 3.33333 5.46667 3.33333 4Z"
                              fill="white"
                            />
                          </svg>
                        </div>

                        <span className="text-white text-sm font-medium">
                          {employee?.role
                            ? employee.role.charAt(0).toUpperCase() + employee.role.slice(1)
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-5 border-t md:border-t-0  min-w-0 md:px-6 md:py-2 mt-7 ml-5">
                  <div className="flex items-center gap-3">
                    <svg
                      width="21"
                      height="21"
                      viewBox="0 0 21 21"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12.6688 10.8754L8.02069 7.23663C7.31768 6.68633 6.33397 6.68548 5.63095 7.23663L0.982004 10.8746C0.358333 11.3634 0 12.0989 0 12.8906V20.4762H13.6508V12.8906C13.6508 12.098 13.2925 11.3634 12.6688 10.8754ZM11.9444 18.7698H1.70635V12.8906C1.70635 12.6261 1.82579 12.3813 2.03397 12.2183L6.68206 8.58123C6.76567 8.51468 6.88341 8.51554 6.96873 8.58123L11.6168 12.22C11.825 12.3821 11.9444 12.6278 11.9444 12.8915V18.7698ZM5.11905 12.7976H8.53175V16.2103H5.11905V12.7976ZM15.3571 11.0913H17.0635V12.7976H15.3571V11.0913ZM15.3571 14.504H17.0635V16.2103H15.3571V14.504ZM11.9444 4.26587H13.6508V5.97222H11.9444V4.26587ZM17.0635 5.97222H15.3571V4.26587H17.0635V5.97222ZM11.9444 7.67857H13.6508V9.38492H11.9444V7.67857ZM15.3571 7.67857H17.0635V9.38492H15.3571V7.67857ZM20.4762 2.55952V20.4762H15.3571V18.7698H18.7698V2.55952C18.7698 2.08857 18.3876 1.70635 17.9167 1.70635H11.0913C10.6203 1.70635 10.2381 2.08857 10.2381 2.55952V6.80663L8.53175 5.47141V2.55952C8.53175 2.54502 8.53175 2.52966 8.5326 2.51516C8.55649 1.12448 9.69462 0 11.0913 0H17.9167C19.3278 0 20.4762 1.14837 20.4762 2.55952Z"
                        fill="#30313D"
                      />
                    </svg>
                    <span className="text-gray-900 font-semibold tracking-[0.32px]">
                      Company Details
                    </span>
                  </div>

                  <div className="w-full h-[2px] bg-gray-300 mt-2"></div>

                  <div className=" mt-3 w-[400px]">
                    <p className="text-sm">
                      Company, Department, Team, and Branch are synced from the SCAD ecosystem. To
                      create a new entity within these categories, please add it to the master data.
                    </p>
                  </div>

                  <div className="mt-6 space-y-5">
                    <div className="flex items-center gap-4">
                      <div className="bg-gradient-to-br from-[#3A93B4] to-[#08395B] rounded-full w-10 h-10 flex items-center justify-center">
                        <div
                          className="flex justify-center items-center flex-col gap-5 py-[13.999999046325684px] px-0.5 rounded-[42px] w-[40px] h-[40px]"
                          style={{
                            background: 'linear-gradient(218deg, #3A93B4 0%, #08395B 100%)',
                            width: '40px',
                          }}
                        >
                          <svg
                            width="26"
                            height="18"
                            viewBox="0 0 26 18"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M11.4141 15.0048L13.4899 13.1126C13.4899 13.1126 13.8157 12.9505 14.2226 13.3574C14.6295 13.7643 25.7629 1.93945 25.7629 1.93945L15.7692 15.7806L15.3424 15.4961L13.5709 18.0003L11.4141 15.0081V15.0048Z"
                              fill="white"
                            />
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M8.75946 11.6337L11.5201 9.96977C11.5201 9.96977 11.9766 10.0459 12.2164 10.3948C12.4563 10.7422 22.4551 4.15576 22.4551 4.15576L13.2585 11.7429L12.6928 11.5031L10.1059 13.5905L8.75781 11.6337H8.75946Z"
                              fill="white"
                            />
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M4.60547 6.33034L9.09457 5.7994L9.37575 6.23605L16.4303 5.23535L10.0489 7.12759L9.48492 6.61154L5.6376 7.76938L4.60547 6.33034Z"
                              fill="white"
                            />
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M2.86719 4.15283L8.35037 4.45882L8.56539 4.91204L13.1786 5.23292L8.94252 5.55878L8.59682 5.23292L3.88608 5.55878L2.86719 4.15283Z"
                              fill="white"
                            />
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M6.48828 8.76731L10.2992 7.58135L10.5225 7.98493C10.5225 7.98493 17.8682 5.81317 19.5587 4.85547L11.419 9.01873L10.8533 8.56386L7.62296 10.3552L6.48828 8.76566V8.76731Z"
                              fill="white"
                            />
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M0.238281 0L2.38525 3.13112L7.68316 3.91019"
                              fill="white"
                            />
                          </svg>
                        </div>
                      </div>
                      <span className="text-gray-900 text-[22px] font-medium truncate whitespace-nowrap max-w-[350px] block">
                        {employee?.company?.name || 'N/A'}
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M14.6667 11.6364V10.9091C14.6667 8.90182 13.1733 7.27273 11.3333 7.27273H8.66667V4.36364C9.4 4.36364 10 3.70909 10 2.90909V1.45455C10 0.654545 9.4 0 8.66667 0H7.33333C6.6 0 6 0.654545 6 1.45455V2.90909C6 3.70909 6.6 4.36364 7.33333 4.36364V7.27273H4.66667C2.82667 7.27273 1.33333 8.90182 1.33333 10.9091V11.6364C0.6 11.6364 0 12.2909 0 13.0909V14.5455C0 15.3455 0.6 16 1.33333 16H2.66667C3.4 16 4 15.3455 4 14.5455V13.0909C4 12.2909 3.4 11.6364 2.66667 11.6364V10.9091C2.66667 9.70909 3.56667 8.72727 4.66667 8.72727H7.33333V11.6364C6.6 11.6364 6 12.2909 6 13.0909V14.5455C6 15.3455 6.6 16 7.33333 16H8.66667C9.4 16 10 15.3455 10 14.5455V13.0909C10 12.2909 9.4 11.6364 8.66667 11.6364V8.72727H11.3333C12.4333 8.72727 13.3333 9.70909 13.3333 10.9091V11.6364C12.6 11.6364 12 12.2909 12 13.0909V14.5455C12 15.3455 12.6 16 13.3333 16H14.6667C15.4 16 16 15.3455 16 14.5455V13.0909C16 12.2909 15.4 11.6364 14.6667 11.6364ZM7.33333 1.45455H8.66667V2.90909H7.33333V1.45455ZM2.66667 14.5455H1.33333V13.0909H2.66667V14.5455ZM8.66667 14.5455H7.33333V13.0909H8.66667V14.5455ZM14.6667 14.5455H13.3333V13.0909H14.6667V14.5455Z"
                            fill="#5F5F5F"
                          />
                        </svg>
                        <span>{employee?.branch?.name} Branch</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M7.65429 3.857L11.6181 3.11875C11.9941 3.84858 12.7899 4.36079 13.6941 4.36079C14.9519 4.3608 16 3.3697 16 2.18039C16 0.991065 14.9519 0 13.6941 0C12.5748 0 11.6216 0.78486 11.4252 1.79583L7.38824 2.54772C6.94269 1.66583 5.99391 1.06453 4.881 1.06453C3.33286 1.06453 2.10229 2.22814 2.10229 3.69201C2.10229 5.15589 3.33288 6.3195 4.881 6.3195C5.30084 6.3195 5.69725 6.23377 6.05217 6.07983L9.00379 8.87081C8.44083 9.44072 8.09643 10.2062 8.09643 11.049C8.09643 11.1419 8.10086 11.2338 8.10906 11.3246L4.01001 12.5786C3.59646 12.0799 2.95489 11.7551 2.24458 11.7551C1.02026 11.7551 0 12.7199 0 13.8776C0 15.0353 1.02026 16 2.24458 16C3.46893 16 4.4892 15.0353 4.4892 13.8776C4.4892 13.8628 4.48891 13.8481 4.4886 13.8335L8.52054 12.6C9.09638 13.5785 10.2006 14.2396 11.4706 14.2396C13.3363 14.2396 14.8448 12.8132 14.8448 11.049C14.8448 9.28485 13.3363 7.85848 11.4706 7.85848C11.0139 7.85848 10.5787 7.94415 10.1817 8.09911L7.14436 5.22709C7.43808 4.83827 7.62162 4.36867 7.65429 3.857ZM2.24458 14.7336C1.73769 14.7336 1.33934 14.3569 1.33934 13.8776C1.33934 13.3983 1.73769 13.0216 2.24458 13.0216C2.75157 13.0216 3.14985 13.3983 3.14985 13.8776C3.14985 14.3569 2.75155 14.7336 2.24458 14.7336ZM13.6941 1.28244C14.2259 1.28244 14.6438 1.67754 14.6438 2.18041C14.6438 2.68329 14.2259 3.07836 13.6941 3.07836C13.1623 3.07836 12.7444 2.68327 12.7444 2.18041C12.7444 1.67756 13.1623 1.28244 13.6941 1.28244ZM3.46099 3.69203C3.46099 2.95354 4.10003 2.34931 4.881 2.34931C5.66202 2.34931 6.30102 2.95354 6.30102 3.69203C6.30102 4.43052 5.66202 5.03476 4.881 5.03476C4.10005 5.03476 3.46099 4.43052 3.46099 3.69203ZM13.3849 11.049C13.3849 12.0363 12.5148 12.8591 11.4706 12.8591C10.4264 12.8591 9.55629 12.0363 9.55629 11.049C9.55629 10.0617 10.4264 9.23894 11.4706 9.23894C12.5148 9.23894 13.3849 10.0617 13.3849 11.049Z"
                            fill="#5F5F5F"
                          />
                        </svg>
                        <span>{employee?.department?.name} Department</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M9.00178 7.99965C9.00178 9.47026 10.2003 10.6662 11.6741 10.6662C13.1479 10.6662 14.3464 9.47026 14.3464 7.99965C14.3464 6.52905 13.1479 5.3331 11.6741 5.3331C10.2003 5.3331 9.00178 6.52905 9.00178 7.99965ZM11.6741 6.66638C12.411 6.66638 13.0102 7.26435 13.0102 7.99965C13.0102 8.73496 12.411 9.33293 11.6741 9.33293C10.9372 9.33293 10.3379 8.73496 10.3379 7.99965C10.3379 7.26435 10.9372 6.66638 11.6741 6.66638ZM7.99967 5.3331C9.47344 5.3331 10.672 4.13715 10.672 2.66655C10.672 1.19595 9.47344 0 7.99967 0C6.52589 0 5.32736 1.19595 5.32736 2.66655C5.32736 4.13715 6.52589 5.3331 7.99967 5.3331ZM7.99967 1.33328C8.73656 1.33328 9.33582 1.93125 9.33582 2.66655C9.33582 3.40185 8.73656 3.99983 7.99967 3.99983C7.26278 3.99983 6.66351 3.40185 6.66351 2.66655C6.66351 1.93125 7.26278 1.33328 7.99967 1.33328ZM4.32524 10.6662C5.79902 10.6662 6.99755 9.47026 6.99755 7.99965C6.99755 6.52905 5.79902 5.3331 4.32524 5.3331C2.85146 5.3331 1.65293 6.52905 1.65293 7.99965C1.65293 9.47026 2.85146 10.6662 4.32524 10.6662ZM4.32524 6.66638C5.06213 6.66638 5.6614 7.26435 5.6614 7.99965C5.6614 8.73496 5.06213 9.33293 4.32524 9.33293C3.58835 9.33293 2.98909 8.73496 2.98909 7.99965C2.98909 7.26435 3.58835 6.66638 4.32524 6.66638ZM15.9972 15.2727C16.0306 15.6393 15.7594 15.9633 15.3919 15.9966C15.3719 15.998 15.3512 15.9993 15.3311 15.9993C14.9891 15.9993 14.6978 15.7387 14.6664 15.3927C14.5929 14.58 14.174 13.8227 13.5166 13.3141C13.4999 13.3008 13.4452 13.3068 13.4098 13.3468L12.1798 14.7687C12.0536 14.9154 11.8558 15.028 11.6741 15C11.4817 15 11.2986 14.9174 11.1717 14.7734L9.92573 13.3561C9.89166 13.3168 9.83688 13.3094 9.81884 13.3241C9.16012 13.8401 8.75593 14.5747 8.68244 15.3933C8.65371 15.7107 8.40653 15.94 8.09921 15.9806C8.07984 15.984 8.06313 15.9953 8.04309 15.9973C8.02238 15.9986 8.00234 16 7.9823 16C7.97562 16 7.97027 15.9966 7.96426 15.9966C7.96159 15.9966 7.95958 15.998 7.95691 15.9973C7.94956 15.9973 7.94355 15.992 7.9362 15.9913C7.61485 15.9686 7.34695 15.7233 7.31756 15.3933C7.2434 14.5687 6.83521 13.8307 6.16847 13.3148C6.14909 13.3008 6.09498 13.3074 6.06157 13.3474L4.83164 14.7694C4.70471 14.9167 4.51898 15.002 4.32591 15.0007C4.1335 15.0007 3.95045 14.918 3.82352 14.7734L2.57755 13.3561C2.54281 13.3174 2.48803 13.3101 2.47066 13.3248C1.81127 13.8407 1.40708 14.5754 1.33359 15.394C1.30086 15.7607 0.980847 16.026 0.60806 15.998C0.240618 15.9646 -0.0306215 15.6407 0.00278238 15.274C0.108339 14.1027 0.707604 13.0101 1.64625 12.2748C2.23149 11.8175 3.08128 11.9068 3.58167 12.4768L4.32123 13.3181L5.04944 12.4761C5.54715 11.8995 6.39829 11.8048 6.98686 12.2615C7.39305 12.5755 7.73177 12.9594 7.99967 13.3848C8.26423 12.9654 8.59626 12.5868 8.99443 12.2748C9.57833 11.8182 10.4295 11.9062 10.9299 12.4775L11.6694 13.3181L12.3976 12.4761C12.8953 11.8995 13.7471 11.8062 14.3344 12.2608C15.2837 12.9954 15.889 14.0934 15.9959 15.2733L15.9972 15.2727Z"
                            fill="#5F5F5F"
                          />
                        </svg>
                        <span>{employee?.team?.name} Team</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center flex-row  mt-52  ">
                    <div
                      className="flex justify-start items-end flex-col  w-[125px]"
                      style={{ width: '125px', marginLeft: '104px' }}
                    >
                      <span className="text-gray-500 text-sm text-right leading-5">
                        Latest Synced
                      </span>
                      <p className="self-stretch text-gray-900 text-xs text-right leading-[24.000316619873047px] tracking-[-0.18px] text-nowrap">
                        {employee?.updated_at
                          ? new Date(employee.updated_at).toLocaleString('en-US', {
                            month: '2-digit',
                            day: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                          })
                          : 'N/A'}
                      </p>
                    </div>

                    <div
                      className="flex justify-center items-center flex-row  w-[82px] "
                      style={{ width: '82px', marginLeft: '10px' }}
                    >
                      <button>
                        <div
                          className="flex justify-start items-center flex-row  py-[7px] px-[9px] bg-[#064771] rounded-[3px] w-[82px] h-[30px] mt-2"
                          style={{ width: '82px' }}
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 14 14"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M1.73292 6.231C2.15524 3.36104 4.82416 1.37684 7.69411 1.79917C8.67328 1.94325 9.59182 2.36106 10.3439 3.00445L9.66687 3.68148C9.43995 3.90846 9.44 4.27644 9.667 4.50336C9.77594 4.61227 9.9237 4.67349 10.0778 4.67351H12.7429C13.0639 4.67351 13.3241 4.41333 13.3241 4.09237V1.42719C13.324 1.10623 13.0638 0.846097 12.7428 0.846151C12.5887 0.846179 12.441 0.90739 12.332 1.0163L11.5765 1.77179C8.69543 -0.796408 4.27791 -0.542789 1.70971 2.33828C0.799865 3.35894 0.209431 4.6241 0.0115481 5.97702C-0.0664719 6.45667 0.259092 6.90874 0.738708 6.98676C0.781913 6.99379 0.825554 6.99758 0.869331 6.99812C1.30814 6.99338 1.67647 6.66618 1.73292 6.231Z"
                              fill="white"
                            />
                            <path
                              d="M12.9938 7.00098C12.5549 7.00572 12.1866 7.33292 12.1302 7.7681C11.7078 10.6381 9.03893 12.6223 6.16897 12.2C5.1898 12.0559 4.27127 11.6381 3.51918 10.9947L4.19622 10.3176C4.42314 10.0907 4.42309 9.72268 4.19608 9.49576C4.08714 9.38685 3.93939 9.32564 3.78533 9.32561H1.12021C0.799247 9.32561 0.539062 9.5858 0.539062 9.90676V12.5719C0.539144 12.8929 0.799383 13.153 1.12034 13.153C1.27439 13.1529 1.42215 13.0917 1.53109 12.9828L2.28658 12.2273C5.16697 14.7958 9.58417 14.543 12.1527 11.6626C13.063 10.6417 13.6537 9.37609 13.8515 8.02267C13.9299 7.54308 13.6046 7.09079 13.1251 7.01245C13.0816 7.00534 13.0378 7.00149 12.9938 7.00098Z"
                              fill="white"
                            />
                          </svg>
                          <svg
                            width="47"
                            height="11"
                            viewBox="0 0 47 11"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M3.58215 1.4209V4.96875H5.72863C6.32108 4.96875 6.77909 4.8138 7.10266 4.50391C7.42622 4.19401 7.58801 3.75651 7.58801 3.19141C7.58801 2.63997 7.41939 2.20703 7.08215 1.89258C6.74491 1.57812 6.28006 1.4209 5.68762 1.4209H3.58215ZM3.58215 6.20605V10H2.0509V0.135742H5.87219C6.88391 0.135742 7.68599 0.40918 8.27844 0.956055C8.87088 1.49837 9.16711 2.22982 9.16711 3.15039C9.16711 3.82031 8.99621 4.4082 8.65441 4.91406C8.31717 5.41536 7.85005 5.76628 7.25305 5.9668L9.46105 10H7.69738L5.68762 6.20605H3.58215ZM14.4942 4.3877C14.1707 4.04134 13.7537 3.86816 13.2432 3.86816C12.7328 3.86816 12.309 4.04362 11.9718 4.39453C11.6345 4.74089 11.4477 5.18978 11.4112 5.74121H15.0069C14.9887 5.18522 14.8178 4.73405 14.4942 4.3877ZM15.0001 7.8877H16.4014C16.2966 8.5485 15.9594 9.08854 15.3897 9.50781C14.8201 9.92708 14.1251 10.1367 13.3048 10.1367C12.252 10.1367 11.4226 9.80632 10.8165 9.14551C10.2149 8.48014 9.91414 7.5778 9.91414 6.43848C9.91414 5.30827 10.2149 4.39909 10.8165 3.71094C11.4226 3.02279 12.2315 2.67871 13.2432 2.67871C14.2367 2.67871 15.0251 3.00456 15.6085 3.65625C16.1918 4.30339 16.4835 5.17383 16.4835 6.26758V6.77344H11.4044V6.8623C11.4044 7.49121 11.5798 7.99479 11.9307 8.37305C12.2817 8.7513 12.7511 8.94043 13.3389 8.94043C13.7537 8.94043 14.1091 8.84473 14.4054 8.65332C14.7016 8.46191 14.8998 8.20671 15.0001 7.8877ZM17.8526 10V3.97754H16.8614V2.82227H17.8526V2.11816C17.8526 1.41634 18.0235 0.899089 18.3653 0.566406C18.7071 0.233724 19.2426 0.0673828 19.9717 0.0673828C20.2679 0.0673828 20.5437 0.0901693 20.7989 0.135742V1.22949C20.653 1.20215 20.473 1.18848 20.2588 1.18848C19.6299 1.18848 19.3155 1.50749 19.3155 2.14551V2.82227H20.7715V3.97754H19.336V10H17.8526ZM21.7236 10V2.80859H23.1318V4.03223H23.166C23.2845 3.61296 23.4964 3.28483 23.8018 3.04785C24.1071 2.81087 24.4717 2.69238 24.8955 2.69238C25.0368 2.69238 25.2054 2.71061 25.4014 2.74707V4.12109C25.2692 4.06641 25.0482 4.03906 24.7383 4.03906C24.2643 4.03906 23.8883 4.18717 23.6104 4.4834C23.3369 4.77962 23.2002 5.18294 23.2002 5.69336V10H21.7236ZM30.0517 4.3877C29.7282 4.04134 29.3112 3.86816 28.8007 3.86816C28.2903 3.86816 27.8665 4.04362 27.5293 4.39453C27.192 4.74089 27.0052 5.18978 26.9687 5.74121H30.5644C30.5462 5.18522 30.3753 4.73405 30.0517 4.3877ZM30.5576 7.8877H31.9589C31.8541 8.5485 31.5169 9.08854 30.9472 9.50781C30.3776 9.92708 29.6826 10.1367 28.8623 10.1367C27.8095 10.1367 26.9801 9.80632 26.374 9.14551C25.7724 8.48014 25.4716 7.5778 25.4716 6.43848C25.4716 5.30827 25.7724 4.39909 26.374 3.71094C26.9801 3.02279 27.789 2.67871 28.8007 2.67871C29.7942 2.67871 30.5826 3.00456 31.166 3.65625C31.7493 4.30339 32.041 5.17383 32.041 6.26758V6.77344H26.9619V6.8623C26.9619 7.49121 27.1373 7.99479 27.4882 8.37305C27.8392 8.7513 28.3086 8.94043 28.8964 8.94043C29.3112 8.94043 29.6666 8.84473 29.9629 8.65332C30.2591 8.46191 30.4573 8.20671 30.5576 7.8877ZM32.8495 4.8457C32.8495 4.20312 33.1093 3.68132 33.6288 3.28027C34.1484 2.87923 34.8274 2.67871 35.6659 2.67871C36.4635 2.67871 37.1174 2.88151 37.6279 3.28711C38.1428 3.68815 38.4117 4.20996 38.4345 4.85254H37.0468C37.0103 4.52441 36.8668 4.26693 36.6161 4.08008C36.3655 3.89323 36.0351 3.7998 35.6249 3.7998C35.2239 3.7998 34.9003 3.88867 34.6542 4.06641C34.4127 4.24414 34.2919 4.47428 34.2919 4.75684C34.2919 5.19434 34.6588 5.50423 35.3925 5.68652L36.6025 5.9668C37.3271 6.13997 37.8398 6.37695 38.1405 6.67773C38.4459 6.97396 38.5986 7.38867 38.5986 7.92188C38.5986 8.57812 38.3206 9.11133 37.7646 9.52148C37.2131 9.93164 36.4954 10.1367 35.6112 10.1367C34.7682 10.1367 34.08 9.9362 33.5468 9.53516C33.0182 9.13411 32.7242 8.60091 32.665 7.93555H34.1279C34.1871 8.2819 34.3489 8.5485 34.6132 8.73535C34.8775 8.91764 35.233 9.00879 35.6796 9.00879C36.1217 9.00879 36.4703 8.92448 36.7255 8.75586C36.9853 8.58268 37.1152 8.35026 37.1152 8.05859C37.1152 7.82617 37.0377 7.6416 36.8827 7.50488C36.7278 7.36816 36.4635 7.25195 36.0898 7.15625L34.8046 6.8418C33.5012 6.52734 32.8495 5.86198 32.8495 4.8457ZM39.5917 10V0.135742H41.0546V4.01172H41.0888C41.2893 3.58789 41.5832 3.26204 41.9706 3.03418C42.358 2.80176 42.8228 2.68555 43.3651 2.68555C44.149 2.68555 44.7642 2.92708 45.2108 3.41016C45.662 3.89323 45.8876 4.54492 45.8876 5.36523V10H44.4042V5.65234C44.4042 5.11458 44.2697 4.69759 44.0009 4.40137C43.7365 4.10514 43.3469 3.95703 42.8319 3.95703C42.2896 3.95703 41.8589 4.13021 41.5399 4.47656C41.2255 4.81836 41.0682 5.27409 41.0682 5.84375V10H39.5917Z"
                              fill="white"
                            />
                          </svg>
                        </div>
                      </button>
                    </div>

                    <div className="ml-5 ">
                      <p className="self-stretch text-gray-500 text-[9.379307746887207px] font-medium leading-[26.953031539916992px] ">
                        Data Synced from
                      </p>

                      <div className="w-[72px] h-[18px] mt-[-6px] " style={{ width: '72px' }}>
                        <img src={Frame} alt="Synced Data" width={100} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedButton === 'projects' && (
              <div className=" py-[25px]  ">
                <div className="mb-5 ml-[-1100px] ">
                  <span className="text-gray-900 text-[22px] font-semibold leading-[25.674741744995117px]">
                    Concerned Projects
                  </span>
                </div>

                <div></div>
                <div className="  ml-[-1100px] mr-[10px] ">
                  <Table className="w-full border-separate border-spacing-y-[10px]">
                    <TableHeader>
                      <TableRow className="rounded-lg">
                        {tableHeaders.map((header, idx) => (
                          <TableHead
                            key={idx}
                            className={`cursor-pointer py-[10px] px-6 font-semibold text-gray-500 text-sm border-t border-b ${idx === 0 ? 'border-l first:rounded-l-lg' : ''
                              } ${idx === tableHeaders.length - 1 ? 'border-r last:rounded-r-lg' : ''
                              } bg-[#F9F9F9] text-center whitespace-nowrap hover:bg-[#d1d1d1] transition-colors`}
                          >
                            <div className="flex items-center justify-center gap-2">
                              {header}
                              <ArrowIcon />
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {assignedProjects.map((seller, index) => {
                        const isSelected = selectedEmployeeIds.has(seller.id);

                        const PersoncountryData = getCountryById(
                          parseInt(seller.company_overview?.hq_country)
                        );

                        return (
                          <TableRow key={seller.id ?? index}>
                            <TableCell
                              className={clsx(
                                'py-[10px] px-6 font-semibold text-gray-900 text-sm border-t border-b border-l truncate whitespace-nowrap rounded-l-lg',
                                {
                                  'border-[#064771] bg-[#F5FBFF]': isSelected,
                                  'border-[#E4E4E4] bg-white': !isSelected,
                                }
                              )}
                            >
                              <div className="flex items-center gap-2">
                                {isComponentOpen && (
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleCheckboxChange(seller.id)}
                                  />
                                )}
                                {seller.company_overview?.reg_name}
                              </div>
                            </TableCell>

                            <TableCell
                              className={clsx(
                                'py-[10px] px-6 text-center font-medium text-gray-900 text-sm border-t border-b',
                                {
                                  'border-[#064771] bg-[#F5FBFF]': isSelected,
                                  'border-[#E4E4E4] bg-white': !isSelected,
                                }
                              )}
                            >
                              <div className="inline-flex items-center gap-1.5 py-1 px-2 bg-[#0168C8] rounded-[36px] max-w-max mx-auto">
                                <span className="text-white text-xs font-medium leading-[1.4] ">
                                  Buyer
                                </span>
                              </div>
                            </TableCell>
                            <TableCell
                              className={clsx(
                                'py-[10px] px-6 text-center text-gray-900 text-sm border-t border-b',
                                {
                                  'border-[#064771] bg-[#F5FBFF]': isSelected,
                                  'border-[#E4E4E4] bg-white': !isSelected,
                                }
                              )}
                            >
                              <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                                <div className="flex justify-start items-center flex-row gap-[8.67px] ml-[55px]">
                                  {PersoncountryData?.svg_icon_url ? (
                                    <img
                                      src={PersoncountryData?.svg_icon_url}
                                      alt="flag"
                                      className="w-[26px] h-[26px] rounded-full bg-gray-200 text-gray-900 text-[10px] flex items-center justify-center"
                                    />
                                  ) : (
                                    <span className="w-[26px] h-[26px] rounded-full bg-gray-200 text-gray-900 text-[10px] flex items-center justify-center">
                                      n/a
                                    </span>
                                  )}
                                  <span className="text-gray-900 text-sm font-semibold leading-[31.78px]">
                                    {PersoncountryData?.name || 'N/A'}
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell
                              className={clsx(
                                'py-[10px] px-6 text-center text-[#064771] text-sm border-t border-b',
                                {
                                  'border-[#064771] bg-[#F5FBFF]': isSelected,
                                  'border-[#E4E4E4] bg-white': !isSelected,
                                }
                              )}
                            >
                              {seller?.buyer_id || 'N/A'}
                            </TableCell>
                            <TableCell
                              className={clsx(
                                'py-2 px-6 text-center border-t border-b border-r whitespace-nowrap rounded-r-lg',
                                {
                                  'border-[#064771] bg-[#F5FBFF]': isSelected,
                                  'border-[#E4E4E4] bg-white': !isSelected,
                                }
                              )}
                            >
                              <div className="inline-flex items-center gap-2 py-1 px-2 bg-[#0C5577] rounded-[36px] max-w-max mx-auto">
                                <svg
                                  width="9"
                                  height="8"
                                  viewBox="0 0 9 8"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M8.5 4C8.5 6.20914 6.70914 8 4.5 8C2.29086 8 0.5 6.20914 0.5 4C0.5 1.79086 2.29086 0 4.5 0C6.70914 0 8.5 1.79086 8.5 4Z"
                                    fill="white"
                                  />
                                </svg>
                                <span className="text-white text-xs font-medium leading-[1.4]">
                                  {seller?.company_overview.status || 'N/A'}
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>

                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={(page) => setCurrentPage(page)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetails;
