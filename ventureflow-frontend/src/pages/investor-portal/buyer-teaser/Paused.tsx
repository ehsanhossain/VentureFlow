import React, { useEffect, useRef, useState } from 'react';
import ArrowIcon from '../../../assets/svg/ArrowIcon';


const Paused: React.FC = () => {
  const inputRef = useRef<HTMLInputElement>(null);

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



  const [isActive, setIsActive] = useState(false);

  return (
    <div className="flex flex-col p-4 w-full font-poppins">
      <div className="flex justify-between items-center py-[25px] px-[20px] mt-[-40px]">
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
            <span className="text-gray-800 font-poppins mx-1">20</span>
            <span className="text-gray-500">of</span>
            <span className="text-gray-800 font-poppins mx-1">567</span>
            <span className="text-gray-500">Cases</span>
          </span>
          <div className="flex items-center gap-4 h-8">
            <div className="flex items-center gap-4 h-8">
              <div className="flex items-center gap-4 h-9">
                <button>
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
                </button>
              </div>

              <button>
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
              </button>

              <button>
                <div className="flex justify-center items-center gap-2 py-2 px-3 bg-white border border-gray-500 rounded-md h-[35px]">
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 17 17"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M2.82902 3.53027H13.5037C13.6 3.53027 13.6942 3.55824 13.7749 3.61078C13.8556 3.66331 13.9193 3.73815 13.9582 3.8262C13.9972 3.91425 14.0097 4.01172 13.9943 4.10676C13.9789 4.2018 13.9362 4.29033 13.8715 4.36157L9.78657 8.85495C9.70341 8.94643 9.65733 9.06562 9.65733 9.18925V12.707C9.65733 12.7888 9.63713 12.8694 9.59852 12.9415C9.55991 13.0137 9.5041 13.0752 9.43602 13.1205L7.44808 14.4458C7.37323 14.4957 7.28624 14.5244 7.19639 14.5287C7.10655 14.5331 7.0172 14.5129 6.93789 14.4705C6.85858 14.4281 6.79228 14.3649 6.74605 14.2877C6.69983 14.2105 6.67541 14.1223 6.67541 14.0323V9.18925C6.67541 9.06562 6.62933 8.94643 6.54617 8.85495L2.46128 4.36157C2.39651 4.29033 2.35383 4.2018 2.33843 4.10676C2.32303 4.01172 2.33557 3.91425 2.37452 3.8262C2.41347 3.73815 2.47716 3.66331 2.55784 3.61078C2.63853 3.55824 2.73274 3.53027 2.82902 3.53027V3.53027Z"
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
      </div>

      <table className="w-full table-fixed border-separate px-4">
        <thead>
          <tr>
            <th className="pr-0">
              <div className="flex justify-start items-center p-3 pr-0 border-t border-l border-b border-[#E4E4E4] bg-[#F9F9F9] rounded-[4px]">
                <span className="text-[#727272] text-sm font-poppins leading-normal">Prospect</span>
                <ArrowIcon />
              </div>
            </th>

            <th className="pl-0 pr-0">
              <div className="flex justify-center items-center gap-2 pt-3 pb-3 border-t border-b border-[#E4E4E4] bg-[#F9F9F9]">
                <span className="text-[#727272] text-sm font-poppins leading-normal">
                  HQ/Origin
                </span>
                <ArrowIcon />
              </div>
            </th>

            <th className="pl-0 pr-0">
              <div className="flex justify-center items-center gap-2 pt-3 pb-3 border-t border-b border-[#E4E4E4] bg-[#F9F9F9]">
                <span className="text-[#727272] text-sm font-poppins leading-normal">Source</span>
                <ArrowIcon />
              </div>
            </th>

            <th className="pl-0 pr-0">
              <div className="flex justify-center items-center gap-2 pt-3 pb-3 border-t border-b border-[#E4E4E4] bg-[#F9F9F9]">
                <span className="text-[#727272] text-sm font-poppins leading-normal">
                  Dealroom ID
                </span>
                <ArrowIcon />
              </div>
            </th>

            <th className="pl-0 pr-0">
              <div className="flex justify-center items-center gap-2 pt-3 pb-3 border-t border-b border-[#E4E4E4] bg-[#F9F9F9]">
                <span className="text-[#727272] text-sm font-poppins leading-normal">
                  Created by
                </span>
                <ArrowIcon />
              </div>
            </th>

            <th className="pl-0 pr-0">
              <div className="flex justify-center items-center gap-2 pt-3 pb-3 border-t border-b border-[#E4E4E4] bg-[#F9F9F9]">
                <span className="text-[#727272] text-sm font-poppins leading-normal">
                  Uploaded on
                </span>
                <ArrowIcon />
              </div>
            </th>

            <th className="pl-0 pr-0">
              <div className="flex justify-center items-center gap-2 pt-3 pb-3 border-t border-r border-b border-[#E4E4E4] bg-[#F9F9F9] rounded-[4px]">
                <span className="text-[#727272] text-sm font-poppins leading-normal">
                  Quick Action
                </span>
                <ArrowIcon />
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr className="h-[12px]"></tr>
          <tr className="h-[30px]">
            <td className="py-0 pr-0 align-middle border-t border-l border-b rounded-[4px]">
              <div className="flex items-center gap-3 p-3 w-full min-h-[30px] bg-white">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[#30313D] font-poppins">
                    Sheen Syndicate Co.,Ltd.
                  </span>
                </div>
              </div>
            </td>

            <td className="py-0 px-0 align-middle border-t border-b border-[#E4E4E4]">
              <div className="flex items-center justify-center gap-3 p-3 w-full min-h-[30px] bg-white">
                <svg
                  width="26"
                  height="27"
                  viewBox="0 0 26 27"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M25.2573 9.16667C23.4734 4.12093 18.6654 0.504333 13.0098 0.5H12.9902C7.3346 0.504333 2.52633 4.12093 0.742733 9.16667C0.263178 10.5224 0 11.9802 0 13.5C0 15.0198 0.263467 16.4779 0.742733 17.8333C2.52778 22.882 7.34009 26.5 13 26.5C18.6599 26.5 23.4722 22.882 25.2573 17.8333C25.7365 16.4776 26 15.0198 26 13.5C26 11.9802 25.7368 10.5224 25.2573 9.16667Z"
                    fill="#F31930"
                  />
                  <path
                    d="M12.1629 18.5066C9.34939 18.5066 7.06861 16.2648 7.06861 13.4993C7.06861 10.7338 9.34939 8.49199 12.1629 8.49199C13.6769 8.49199 15.0327 9.14488 15.9658 10.1756C14.8394 8.41283 12.8449 7.24023 10.5708 7.24023C7.05388 7.24023 4.20312 10.0425 4.20312 13.4996C4.20312 16.9567 7.05388 19.7589 10.5708 19.7589C12.8458 19.7589 14.8409 18.5855 15.967 16.8215C15.0341 17.8531 13.6778 18.5066 12.1629 18.5066Z"
                    fill="#F3F4F5"
                  />
                  <path
                    d="M18.1748 10.5684L18.1234 12.8821L15.9648 13.4682L18.0928 14.226L18.0414 16.3479L19.4292 14.6908L21.5262 15.4182L20.3132 13.6401L21.7935 11.8718L19.5216 12.4981L18.1748 10.5684Z"
                    fill="#F3F4F5"
                  />
                </svg>

                <span className="text-[#30313D] text-sm leading-[16.47343635559082px] tracking-[-0.21px]">
                  Türkiye
                </span>
              </div>
            </td>

            <td className="py-0 px-0 align-middle border-t border-b border-[#E4E4E4]">
              <div className="flex items-center justify-center gap-3 p-3 w-full min-h-[30px] bg-white">
                <p className="py-[5px] text-sm font-semibold text-center text-[#30313D] font-poppins">
                  Partner
                </p>
              </div>
            </td>

            <td className="py-0 px-0 align-middle border-t border-b border-[#E4E4E4]">
              <div className="flex items-center justify-center gap-3 p-3 w-full min-h-[30px] bg-white">
                <p className="py-[5px] text-sm font-semibold text-center text-[#30313D] font-poppins">
                  IT-S-786
                </p>
              </div>
            </td>

            <td className="py-0 px-0 align-middle border-t border-b border-[#E4E4E4]">
              <div className="flex items-center justify-center gap-3 p-3 w-full min-h-[30px] bg-white">
                <img
                  className="rounded-[64px] w-[38px] h-[38px]"
                  src="https://placehold.co/38x38"
                  style={{ objectFit: 'cover', width: '38px' }}
                />

                <span className="text-[#30313D] text-sm leading-[16.47343635559082px] tracking-[-0.21px]">
                  준호
                </span>
              </div>
            </td>

            <td className="py-0 px-0 align-middle border-t border-b border-[#E4E4E4]">
              <div className="flex items-center justify-center gap-3 p-3 w-full min-h-[30px] bg-white">
                <p className="py-[5px] text-sm font-semibold text-center text-[#30313D] font-poppins">
                  Yesterday • 1:42 PM
                </p>
              </div>
            </td>

            <td className="py-0 pl-0 align-middle border-t border-r border-b border-[#E4E4E4] rounded-[4px]">
              <div className="flex items-center justify-center gap-3 p-3 w-full min-h-[30px] bg-white">
                <div className="flex justify-start items-center flex-row gap-2">
                  <div className="flex justify-start items-start flex-row gap-2 h-[24px]">
                    <div className="flex justify-start items-center flex-row gap-2.5 py-1 h-[24px]">
                      <div className="flex justify-start items-center flex-row gap-2">
                        <span className="text-[#444444] text-sm font-medium leading-[18px]">
                          Pause
                        </span>
                      </div>
                      <div className="flex items-center justify-center min-h-[50px] ml-2">
                        <div
                          onClick={() => setIsActive(!isActive)}
                          className={`relative w-12 h-7 rounded-full cursor-pointer transition-colors duration-300 ${
                            isActive ? 'bg-[#064771]' : 'bg-gray-300'
                          }`}
                        >
                          <div
                            className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 transform ${
                              isActive ? 'translate-x-6' : 'translate-x-0'
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </td>
          </tr>
          <tr className="h-[12px]"></tr>
        </tbody>
      </table>


    </div>
  );
};

export default Paused;
