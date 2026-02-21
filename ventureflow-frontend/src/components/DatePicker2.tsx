/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

import { useState } from "react";
import { format } from "date-fns";
import { DayPicker } from "react-day-picker";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

type SelectDateProps = {
  date: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  placeholder?: string;
};

export const SelectDate = ({ date, onDateChange, placeholder = "Select date" }: SelectDateProps) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  return (
    <div className="relative w-[183px] h-10">
      <Button 
        className="absolute left-0 w-[52px] h-10 rounded-[36px] bg-[#bde9f9] border-[0.5px] border-solid border-[#005d7f] p-0 flex items-center justify-center z-10"
      >
        <img src="/frame-1000001074.svg" alt="Calendar" className="w-[17px] h-[17px]" />
      </Button>

      <div 
        onClick={() => setIsCalendarOpen(!isCalendarOpen)}
        className="absolute left-[17px] w-[166px] h-10 pl-[50px] pr-5 py-2 rounded-[0px_53px_53px_0px] border-[0.5px] border-solid border-gray-300 flex items-center justify-between bg-white cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <span className="text-gray-500 text-sm">
          {date ? format(date, "MMM dd, yyyy") : placeholder}
        </span>
        {isCalendarOpen ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </div>

      {isCalendarOpen && (
        <div className="absolute top-12 left-0 z-20 bg-white shadow-xl rounded-lg p-2">
          <DayPicker
            mode="single"
            selected={date}
            onSelect={(newDate) => {
              onDateChange(newDate);
              setIsCalendarOpen(false);
            }}
            modifiersStyles={{
              selected: {
                backgroundColor: "#005d7f",
                color: "white",
              },
            }}
            styles={{
              caption: { color: "#005d7f" },
              head_cell: { color: "#8a8a8a" },
              nav_button_previous: { color: "#005d7f" },
              nav_button_next: { color: "#005d7f" },
            }}
            className="bg-white rounded-lg [&_.rdp-day:hover:not(.rdp-day_selected)]:bg-[#bde9f9] [&_.rdp-day]:transition-colors [&_.rdp-caption]:mb-1 [&_.rdp-head_cell]:p-0 [&_.rdp-cell]:p-0"
          />
        </div>
      )}
    </div>
  );
};
