import React, { useState, useMemo } from 'react';
import { Check, Pause } from 'lucide-react';
import Pagination from '../../../components/pagination';
import ArrowIcon from '../../../assets/svg/ArrowIcon';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/table/table';

const TeaserTable = (): JSX.Element => {
  const tableHeaders = [
    'Prospect',
    'HQ/Origin',
    'Source',
    'Declaration ID',
    'Created by',
    'Uploaded on',
    'Quick Actions',
  ];

  const teaserData = useMemo(
    () => [
      {
        name: 'Kiran Co Ltd.',
        countryFlag: '/group-291565.png',
        hq: 'Italy',
        source: 'Partner',
        declarationId: 'IT-S-9997',
        creatorImage: '/group-291491.png',
        createdBy: '준호',
        uploadedOn: 'Yesterday • 1:42 PM',
        quickActions: 'Active',
      },
    ],
    []
  );

  const [sortConfig, setSortConfig] = useState<{
    key: keyof (typeof teaserData)[0];
    direction: 'asc' | 'desc';
  } | null>(null);

  const sortedTeaserData = useMemo(() => {
    if (!sortConfig) return teaserData;

    return [...teaserData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (sortConfig.key === 'exchangeRate') {
        const parse = (val: string) => parseFloat(val.replace(/[^0-9.]/g, ''));
        return sortConfig.direction === 'asc'
          ? parse(aValue as string) - parse(bValue as string)
          : parse(bValue as string) - parse(aValue as string);
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return 0;
    });
  }, [sortConfig, teaserData]);

  const handleSort = (key: keyof (typeof teaserData)[0]) => {
    setSortConfig((prev) =>
      prev?.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' }
    );
  };
  const [isActive, setIsActive] = useState(false);
  return (
    <div className="bg-white">
      <div className="flex justify-between items-center px-[20px] ">
        <div className="flex justify-between items-center gap-3 py-2 px-3 bg-white border border-gray-500 rounded-md w-[358px] h-[35px] ml-[15px]">
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
              type="text"
              placeholder="Search Here"
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

        <div className="flex justify-start items-center gap-4 ">
          <span className="text-sm leading-5 font-poppins text-center">
            <span className="text-gray-500">Showing</span>
            <span className="text-gray-800 font-poppins mx-1">20</span>
            <span className="text-gray-500">of</span>
            <span className="text-gray-800 font-poppins mx-1">567</span>
            <span className="text-gray-500">Cases</span>
          </span>
          <div className="flex items-center gap-4 h-8">
            <div className="flex items-center gap-4 h-8">
              <div className="flex items-center gap-4 h-9">
                <div className="flex items-center gap-2 p-2 bg-[#BDEAFA] border border-[#16607B] rounded h-8">
                  <svg
                    width="21"
                    height="21"
                    viewBox="0 0 21 21"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M19.505 4.25976V6.71987C19.505 8.76995 18.685 9.58998 16.6349 9.58998H14.1748C12.1247 9.58998 11.3047 8.76995 11.3047 6.71987V4.25976C11.3047 2.20967 12.1247 1.38965 14.1748 1.38965H16.6349C18.685 1.38965 19.505 2.20967 19.505 4.25976Z"
                      stroke="#16607B"
                      strokeWidth="1.36672"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M9.48158 14.2798V16.7399C9.48158 18.79 8.66155 19.61 6.61147 19.61H4.15137C2.10128 19.61 1.28125 18.79 1.28125 16.7399V14.2798C1.28125 12.2297 2.10128 11.4097 4.15137 11.4097H6.61147C8.66155 11.4097 9.48158 12.2297 9.48158 14.2798Z"
                      stroke="#16607B"
                      strokeWidth="1.36672"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M15.2922 9.58944V11.9767C15.2922 14.4276 14.3173 15.4026 11.8663 15.4026H9.47907V14.2819C9.47907 12.2318 8.65904 11.4117 6.60899 11.4117H5.48828V9.02453C5.48828 6.57357 6.46321 5.59863 8.91416 5.59863H11.3014V6.71935C11.3014 8.76941 12.1214 9.58944 14.1715 9.58944H15.2922Z"
                      stroke="#16607B"
                      strokeWidth="1.36672"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="text-[#16607B] text-sm font-medium font-poppins leading-normal">
                    Actions
                  </span>
                </div>
              </div>

              <button>
                <div className="flex justify-center items-center flex-row gap-2 py-2 px-3 bg-[#FFFFFF] border-solid border-[#000000] border rounded h-[34px]">
                  <svg
                    width="16"
                    height="17"
                    viewBox="0 0 16 17"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4 8.5H12"
                      stroke="black"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M1.5 5.5H14.5"
                      stroke="black"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M6.5 11.5H9.5"
                      stroke="black"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="text-[#000000] text-sm font-medium leading-normal font-poppins">
                    Sort By
                  </span>
                </div>
              </button>

              <button>
                <div className="flex justify-center items-center gap-2 py-2 px-3 bg-white border border-black rounded h-[34px]">
                  <svg
                    width="16"
                    height="17"
                    viewBox="0 0 16 17"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M2.62891 3.5H13.3684C13.4652 3.5 13.56 3.52814 13.6412 3.58099C13.7224 3.63384 13.7864 3.70914 13.8256 3.79772C13.8648 3.88631 13.8774 3.98437 13.8619 4.07999C13.8464 4.1756 13.8035 4.26466 13.7383 4.33634L9.62866 8.85697C9.54499 8.949 9.49863 9.06892 9.49863 9.1933V12.7324C9.49863 12.8147 9.47831 12.8958 9.43947 12.9683C9.40063 13.0409 9.34447 13.1028 9.27598 13.1484L7.27598 14.4818C7.20068 14.532 7.11317 14.5608 7.02277 14.5652C6.93238 14.5695 6.84249 14.5493 6.7627 14.5066C6.68291 14.4639 6.61621 14.4003 6.5697 14.3227C6.52319 14.245 6.49863 14.1562 6.49863 14.0657V9.1933C6.49863 9.06892 6.45227 8.949 6.3686 8.85697L2.25894 4.33634C2.19378 4.26466 2.15084 4.1756 2.13535 4.07999C2.11985 3.98437 2.13246 3.88631 2.17165 3.79772C2.21084 3.70914 2.27491 3.63384 2.35609 3.58099C2.43726 3.52814 2.53204 3.5 2.62891 3.5V3.5Z"
                      stroke="black"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="text-black text-sm font-medium leading-normal">Filter</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <section className="flex flex-col gap-3.5 w-full px-8 mt-[15px]">
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
                      className={`cursor-pointer py-[10px] px-6 font-semibold text-[#727272] text-sm border-t border-b ${
                        idx === 0 ? 'border-l first:rounded-l-lg' : ''
                      } ${
                        idx === tableHeaders.length - 1 ? 'border-r last:rounded-r-lg' : ''
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
              {sortedTeaserData.map((teaser, index) => (
                <TableRow key={index}>
                  <TableCell className="py-[10px] px-6 font-semibold text-[#30313D] text-sm border-t border-b border-l border-[#E4E4E4] bg-white rounded-l-lg truncate whitespace-nowrap">
                    {teaser.name}
                  </TableCell>

                  <TableCell className="py-[10px] px-6 text-center font-medium text-[#30313D] text-sm border-t border-b border-[#E4E4E4] bg-white truncate whitespace-nowrap">
                    <div className="flex items-center justify-center gap-3">
                      <img
                        className="w-[26px] h-[26px] rounded-full"
                        alt={`${teaser.hq} flag`}
                        src={teaser.countryFlag}
                      />
                      <span>{teaser.hq}</span>
                    </div>
                  </TableCell>

                  <TableCell className="py-[10px] px-6 text-center text-[#30313D] text-sm border-t border-b border-[#E4E4E4] bg-white truncate whitespace-nowrap">
                    {teaser.source}
                  </TableCell>

                  <TableCell className="py-[10px] px-6 text-center text-[#30313D] text-sm border-t border-b border-[#E4E4E4] bg-white truncate whitespace-nowrap">
                    {teaser.declarationId}
                  </TableCell>

                  <TableCell className="py-[10px] px-6 text-center font-medium text-[#30313D] text-sm border-t border-b border-[#E4E4E4] bg-white truncate whitespace-nowrap">
                    <div className="flex items-center justify-center gap-3">
                      <img
                        className="w-[26px] h-[26px] rounded-full"
                        alt={`${teaser.createdBy} avatar`}
                        src={teaser.creatorImage}
                      />
                      <span>{teaser.createdBy}</span>
                    </div>
                  </TableCell>

                  <TableCell className="py-[10px] px-6 text-center text-[#30313D] text-sm border-t border-b border-[#E4E4E4] bg-white truncate whitespace-nowrap">
                    {teaser.uploadedOn}
                  </TableCell>

                  <TableCell className="py-[10px] px-6 text-center text-[#30313D] text-sm border-t border-b border-r border-[#E4E4E4] bg-white rounded-r-lg truncate whitespace-nowrap">
                    <div className="flex items-center justify-center gap-2">
                      <span
                        className={`flex items-center gap-1 text-[#444444] ${
                          isActive ? 'text-[#064771]' : ''
                        }`}
                      >
                        {isActive ? 'Active' : 'Paused'}
                      </span>

                      <div
                        onClick={() => setIsActive(!isActive)}
                        className={`relative w-12 h-6 rounded-full cursor-pointer transition-colors flex items-center px-1 ${
                          isActive ? 'bg-[#064771]' : 'bg-[#838383]'
                        }`}
                      >
                        {isActive ? (
                          <Check className="w-3.5 h-3.5 text-white transition-all" />
                        ) : (
                          <Pause
                            className={`w-3.5 h-3.5 text-white transition-all absolute right-1`}
                          />
                        )}

                        <div
                          className={`absolute top-0.5 ${
                            isActive ? 'right-0.5' : 'left-0.5'
                          } w-5 h-5 rounded-full bg-white shadow-md transition-all`}
                        />
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <Pagination />
    </div>
  );
};

export default TeaserTable;
