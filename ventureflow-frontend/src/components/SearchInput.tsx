// SearchInput.tsx
import { CommandIcon, SearchIcon } from "lucide-react";
import React, { useEffect, useRef } from "react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = "Search here",
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd/Ctrl + F
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault(); // Prevent default browser search
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const shortcutKeys = [
    { label: "Crtl", type: "text" },
    { label: "/", type: "separator" },
    { label: "command", type: "icon" },
    { label: "+", type: "separator" },
    { label: "F", type: "letter" },
  ];

  return (
    // This is now the top-level element returned by the component.
    // It is the core search bar div with its own padding, border, etc.
    // Responsive width w-full md:w-[358px] is kept.
    // The fixed top/left absolute positioning that was previously on this div has been removed.
    <div className="flex w-full md:w-[358px] h-[35px] items-center justify-between px-[11.93px] py-[9.94px] bg-white rounded-[3.98px] border-[0.5px] border-solid border-[#828282]">
      <div className="inline-flex gap-[11.93px] flex-auto mt-[-2.94px] mb-[-2.94px] items-center relative">
        <SearchIcon className="relative w-[19.88px] h-[19.88px] text-gray-500 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent border-none outline-none font-normal text-[13.9px] text-gray-500 placeholder-[#828282]"
        />
      </div>
      <div className="inline-flex gap-[7.95px] flex-shrink-0 mt-[-2.44px] mb-[-2.44px] items-center relative">
        <div className="inline-flex gap-1 flex-wrap justify-end items-center relative">
          {shortcutKeys.map((key, index) => (
            <React.Fragment key={index}>
              {key.type === "text" && (
                <div className="flex w-6 h-5 justify-center gap-[9.94px] bg-[#f1f1f1] rounded-[1.99px] items-center relative">
                  <div className="relative w-fit font-medium text-gray-500 text-[10px] tracking-[0] leading-[15px] whitespace-nowrap">
                    {key.label}
                  </div>
                </div>
              )}
              {key.type === "separator" && (
                <div className="relative w-fit font-medium text-gray-500 text-xs tracking-[0] leading-[18px] whitespace-nowrap">
                  {key.label}
                </div>
              )}
              {key.type === "icon" && (
                <div className="flex w-[19.88px] h-[19.88px] justify-center gap-[9.94px] bg-[#f1f1f1] rounded-[1.99px] items-center relative">
                  <CommandIcon className="relative w-[15.9px] h-[15.9px] text-gray-500" />
                </div>
              )}
              {key.type === "letter" && (
                <div className="flex w-[19.88px] h-[19.88px] justify-center gap-[9.94px] bg-[#f1f1f1] rounded-[1.99px] items-center relative">
                  <div className="relative w-fit mt-[-3.05px] mb-[-1.07px] font-medium text-gray-500 text-[15.9px] tracking-[0] leading-[23.9px] whitespace-nowrap">
                    {key.label}
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};