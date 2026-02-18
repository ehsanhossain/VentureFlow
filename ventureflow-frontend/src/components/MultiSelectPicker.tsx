import React, { useState, useEffect, useRef } from "react";
import { X, Check, ChevronDown, Search } from "lucide-react";

interface Option {
    label: string;
    value: string;
}

interface MultiSelectPickerProps {
    options: Option[];
    value?: string[];
    placeholder?: string;
    onChange: (value: string[]) => void;
}

const MultiSelectPicker: React.FC<MultiSelectPickerProps> = ({
    options,
    value = [],
    placeholder = "Select options",
    onChange,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm("");
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && searchRef.current) {
            searchRef.current.focus();
        }
    }, [isOpen]);

    const filteredOptions = options.filter(
        (option) =>
            option.label &&
            option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleOption = (optionValue: string) => {
        if (value.includes(optionValue)) {
            onChange(value.filter((v) => v !== optionValue));
        } else {
            onChange([...value, optionValue]);
        }
    };

    const removeChip = (optionValue: string, e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(value.filter((v) => v !== optionValue));
    };

    const selectedLabels = value
        .map((v) => options.find((o) => o.value === v))
        .filter(Boolean) as Option[];

    return (
        <div className="relative w-full" ref={containerRef}>
            {/* Trigger */}
            <div
                onClick={() => setIsOpen((prev) => !prev)}
                className="min-h-[44px] relative cursor-pointer border border-gray-300 rounded-[3px] bg-white hover:bg-gray-50 focus-within:ring-2 focus-within:ring-[#D2EDFF] transition-colors px-3 py-2 flex items-center gap-2 flex-wrap"
            >
                {selectedLabels.length > 0 ? (
                    <>
                        {selectedLabels.slice(0, 2).map((opt) => (
                            <span
                                key={opt.value}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#D2EDFF] text-sm text-[#064771] max-w-[140px]"
                            >
                                <span className="truncate">{opt.label}</span>
                                <button
                                    type="button"
                                    onClick={(e) => removeChip(opt.value, e)}
                                    className="text-[#064771]/50 hover:text-[#064771] flex-shrink-0"
                                    title={`Remove ${opt.label}`}
                                    aria-label={`Remove ${opt.label}`}
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                        {selectedLabels.length > 2 && (
                            <span className="px-1.5 py-0.5 rounded bg-[#D2EDFF] text-sm text-[#064771]">
                                +{selectedLabels.length - 2}
                            </span>
                        )}
                    </>
                ) : (
                    <span className="text-sm text-gray-500">{placeholder}</span>
                )}

                <div className="ml-auto flex-shrink-0 pl-2">
                    <ChevronDown
                        className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    />
                </div>
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute top-full mt-1 w-full border border-gray-200 rounded-[3px] bg-white z-50 shadow-xl max-h-60 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-3.5">
                        {/* Search */}
                        <div className="flex items-center border border-gray-300 rounded px-3 py-2 mb-3">
                            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <input
                                ref={searchRef}
                                className="ml-2 w-full bg-transparent outline-none text-sm"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>

                        {/* Options */}
                        <div className="overflow-y-auto max-h-[180px] scrollbar-premium">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((option) => {
                                    const isSelected = value.includes(option.value);
                                    return (
                                        <div
                                            key={option.value}
                                            className={`flex items-center gap-2 px-3 py-2 cursor-pointer rounded transition-colors ${isSelected
                                                ? "bg-[#D2EDFF] text-[#064771]"
                                                : "hover:bg-gray-50 text-gray-700"
                                                }`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleOption(option.value);
                                            }}
                                        >
                                            <div
                                                className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${isSelected
                                                    ? "bg-[#064771] border-[#064771]"
                                                    : "border-gray-300"
                                                    }`}
                                            >
                                                {isSelected && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                            <span className="text-sm truncate">{option.label}</span>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="px-3 py-2 text-sm text-gray-500">No results found</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MultiSelectPicker;
