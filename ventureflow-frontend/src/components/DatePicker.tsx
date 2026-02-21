/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

import React, { useState, useRef, useEffect } from "react";

interface DatePickerProps {
  value?: Date | null;
  placeholder?: string;
  icon?: React.ReactNode;
  onChange: (value: Date) => void;
  yearPicker?: boolean; // Prop for year only mode
}

type ViewMode = 'day' | 'month' | 'year';

const DatePicker: React.FC<DatePickerProps> = ({
  value = null,
  placeholder = "Select date",
  icon,
  onChange,
  yearPicker = false, // Default to false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(value);
  const [currentDate, setCurrentDate] = useState(value instanceof Date ? value : new Date());
  const [viewMode, setViewMode] = useState<ViewMode>(yearPicker ? 'year' : 'day');

  const pickerRef = useRef<HTMLDivElement>(null);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  

  // Effect to handle clicks outside the date picker
  useEffect(() => {
  
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
       
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
    
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // useEffect to synchronize internal state with value prop
  useEffect(() => {
   
    if (selectedDate !== value) {
       
        setSelectedDate(value);
        // Only update currentDate if value is a valid Date object, otherwise calendar might jump unexpectedly
        if (value instanceof Date) {
            setCurrentDate(value);
             // Optionally, if not in yearPicker mode and a date is set, switch to day view
            if (!yearPicker && viewMode !== 'day') {
                 setViewMode('day');
            }
        } else {
             // If value becomes null, you might want to reset currentDate to today or keep the current view
             // Keeping the current view is less disruptive:
             // setCurrentDate(new Date()); // Uncomment this if you want to jump to today on null
        }
    }

  }, [value, yearPicker, selectedDate, viewMode]); // Depend on 'value' and 'yearPicker'


  const getDaysInMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

  const getFirstDayOfMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const formatDate = (date: Date) => {
    if (yearPicker) {
      return date.getFullYear().toString();
    }
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  const handleDaySelect = (day: number) => {
   
    const newDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    );
    setSelectedDate(newDate); // Update internal state
    setIsOpen(false); // Close the picker
    onChange(newDate); // Notify parent component
  };

  const handleMonthSelect = (monthIndex: number) => {
   
    setCurrentDate(new Date(currentDate.getFullYear(), monthIndex, 1)); // Update internal state
    if (!yearPicker) {
      setViewMode('day'); // Switch view if not yearPicker mode
    }
  };

  const handleYearSelect = (year: number) => {
    
    const newDate = new Date(year, yearPicker ? 0 : currentDate.getMonth(), yearPicker ? 1 : currentDate.getDate());
    setCurrentDate(newDate); // Update internal state for calendar view

    if (yearPicker) {
      setSelectedDate(newDate); // Update internal state for display
      onChange(newDate); // Notify parent
      setIsOpen(false); // Close picker in yearPicker mode
    } else {
      setViewMode('month'); // Switch to month view in standard mode
    }
  };

  const changePeriod = (increment: number) => {
     
    if (viewMode === 'day') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + increment, 1));
    } else if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear() + increment, currentDate.getMonth(), 1));
    } else if (viewMode === 'year') {
      setCurrentDate(new Date(currentDate.getFullYear() + increment * 12, currentDate.getMonth(), 1));
    }
  };

  const generateCalendarDays = () => {
    // ... (rest of the function remains the same)
     const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 w-8" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        day
      );
      const isToday = new Date().toDateString() === dayDate.toDateString();
      const isSelected =
        selectedDate?.getDate() === day &&
        selectedDate?.getMonth() === currentDate.getMonth() &&
        selectedDate?.getFullYear() === currentDate.getFullYear();

      days.push(
        <button
          type="button"
          key={day}
          onClick={() => handleDaySelect(day)}
          className={`h-8 w-8 rounded-full flex items-center justify-center text-sm transition
            ${isToday ? "bg-blue-100 text-[#064771]" : "hover:bg-gray-100"}
            ${isSelected ? "bg-blue-500 text-white hover:bg-[#064771]" : ""}`}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const generateYearRange = () => {
    // ... (rest of the function remains the same)
    const startYear = Math.floor(currentDate.getFullYear() / 10) * 10 - 1;
    const years = [];
    for (let i = 0; i < 12; i++) {
      years.push(startYear + i);
    }
    return years;
  }


  return (
    <div className="relative w-full" ref={pickerRef}> {/* Attach ref to the root */}
      <div className="relative flex items-center">
        {/* Icon */}
        <div className="flex flex-col w-[52px] h-10 items-center justify-center absolute left-0 z-10 bg-[#bde9f9] rounded-[36px] border-[0.5px] border-solid border-[#005d7f]">
          {icon ?? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="16"
              viewBox="0 0 18 16"
              fill="none"
            >
              <path
                d="M12.3897 6.70475C9.77323 6.70475 7.64355 8.77865 7.64355 11.3281C7.64355 13.863 9.77323 15.9257 12.3897 15.9257C15.0062 15.9257 17.1359 13.8518 17.1359 11.3023C17.1359 8.76742 15.0062 6.70475 12.3897 6.70475ZM12.3897 14.6047C10.5204 14.6047 8.99961 13.1345 8.99961 11.3281C8.99961 9.50715 10.5204 8.0257 12.3897 8.0257C14.2591 8.0257 15.7799 9.49592 15.7799 11.3023C15.7799 13.1233 14.2591 14.6047 12.3897 14.6047ZM13.5471 11.4958C13.8122 11.7541 13.8122 12.1715 13.5471 12.4298C13.4149 12.5586 13.2413 12.6233 13.0678 12.6233C12.8942 12.6233 12.7206 12.5586 12.5884 12.4298L11.9104 11.7693C11.7829 11.6451 11.7117 11.4774 11.7117 11.3023V9.98137C11.7117 9.61679 12.0148 9.3209 12.3897 9.3209C12.7647 9.3209 13.0678 9.61679 13.0678 9.98137V11.0289L13.5471 11.4958ZM17.1359 4.69756V6.01851C17.1359 6.3831 16.8329 6.67899 16.4579 6.67899C16.083 6.67899 15.7799 6.3831 15.7799 6.01851V4.69756C15.7799 3.60513 14.8673 2.71613 13.7458 2.71613H4.25342C3.13196 2.71613 2.21934 3.60513 2.21934 4.69756V5.35804H8.32158C8.69585 5.35804 8.99961 5.65393 8.99961 6.01851C8.99961 6.3831 8.69585 6.67899 8.32158 6.67899H2.21934V12.6233C2.21934 13.7157 3.13196 14.6047 4.25342 14.6047H6.96552C7.33979 14.6047 7.64355 14.9006 7.64355 15.2652C7.64355 15.6298 7.33979 15.9257 6.96552 15.9257H4.25342C2.3841 15.9257 0.863281 14.4442 0.863281 12.6233V4.69756C0.863281 2.87662 2.3841 1.39517 4.25342 1.39517H4.93144V0.734696C4.93144 0.370112 5.2352 0.0742188 5.60947 0.0742188C5.98374 0.0742188 6.2875 0.370112 6.2875 0.734696V1.39517H11.7117V0.734696C11.7117 0.370112 12.0148 0.0742188 12.3897 0.0742188C12.7647 0.0742188 13.0678 0.370112 13.0678 0.734696V1.39517H13.7458C15.6151 1.39517 17.1359 2.87662 17.1359 4.69756Z"
                fill="#005E80"
              />
            </svg>
          )}
        </div>

        {/* Date Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full h-10 pl-[47px] pr-10 py-2 ml-[17px] bg-white rounded-[0px_53px_53px_0px] border-[0.5px] border-solid border-gray-300 text-left relative"
        >
          <span className="text-sm text-gray-500 font-normal truncate overflow-hidden whitespace-nowrap max-w-full">
            {selectedDate ? formatDate(selectedDate) : placeholder}
          </span>

          <div
            className={`absolute right-4 top-1/2 -translate-y-1/2 transition-transform ${isOpen ? "rotate-180" : ""
              }`}
          >
            <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
              <path
                d="M1 1.5L6 6.5L11 1.5"
                stroke="#8A8A8A"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </button>

        {/* Calendar Dropdown */}
        {isOpen && (
          <div className="absolute w-[320px] mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-4 top-full right-0">
            <div className="flex justify-between items-center mb-4">
              {/* Previous Period Button */}
              <button
                type="button"
                onClick={() => changePeriod(-1)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>

              {/* Header Text and View Switcher */}
              <h2
                className={`font-semibold ${!yearPicker && viewMode !== 'year' ? 'cursor-pointer' : ''}`}
                onClick={() => {
                  if (!yearPicker) {
                    if (viewMode === 'day') setViewMode('month');
                    else if (viewMode === 'month') setViewMode('year');
                  }
                }}
              >
                {viewMode === 'day' && `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
                {viewMode === 'month' && currentDate.getFullYear()}
                {viewMode === 'year' && `${generateYearRange()[0]} - ${generateYearRange()[11]}`}
              </h2>

              {/* Next Period Button */}
              <button
                type="button"
                onClick={() => changePeriod(1)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>

            {/* Calendar Grid Area */}
            {viewMode === 'day' && (
              <>
                {/* Weekdays */}
                <div className="grid grid-cols-7 gap-1 mb-2 text-xs text-gray-500 text-center">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div key={day}>{day}</div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                  {generateCalendarDays()}
                </div>
              </>
            )}

            {viewMode === 'month' && (
              <div className="grid grid-cols-3 gap-1 text-center">
                {months.map((month, index) => {
                  const isCurrentMonth = new Date().getMonth() === index && new Date().getFullYear() === currentDate.getFullYear();
                  const isSelectedMonth = selectedDate?.getMonth() === index && selectedDate?.getFullYear() === currentDate.getFullYear();
                  return (
                    <button
                      type="button"
                      key={month}
                      onClick={() => handleMonthSelect(index)}
                      className={`p-2 rounded-md hover:bg-gray-100 ${isCurrentMonth ? 'bg-blue-100 text-[#064771]' : ''} ${isSelectedMonth ? 'bg-blue-500 text-white hover:bg-[#064771]' : ''}`}
                    >
                      {month.substring(0, 3)}
                    </button>
                  );
                })}
              </div>
            )}

            {viewMode === 'year' && (
              <div className="grid grid-cols-4 gap-1 text-center">
                {generateYearRange().map((year) => {
                  const isCurrentYear = new Date().getFullYear() === year;
                  const isSelectedYear = selectedDate?.getFullYear() === year && yearPicker;
                  return (
                    <button
                      type="button"
                      key={year}
                      onClick={() => handleYearSelect(year)}
                      className={`p-2 rounded-md hover:bg-gray-100 ${isCurrentYear ? 'bg-blue-100 text-[#064771]' : ''} ${isSelectedYear ? 'bg-blue-500 text-white hover:bg-[#064771]' : ''}`}
                    >
                      {year}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DatePicker;
