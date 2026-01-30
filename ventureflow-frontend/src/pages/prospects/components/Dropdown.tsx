
import { useState, useRef, useEffect, forwardRef } from "react";
import type { ForwardedRef, HTMLAttributes } from "react";
import { SearchIcon, CheckIcon, XIcon } from "lucide-react";

export interface Country {
    id: number;
    name: string;
    flagSrc: string;
    status: "registered" | "unregistered";
}

type DropdownCoreProps = {
    countries: Country[];
    selected?: Country | Country[] | null;
    onSelect: (country: Country | Country[]) => void;
    multiSelect?: boolean;
    disabled?: boolean;
    placeholder?: string;
    searchPlaceholder?: string;
};

type DropdownProps = DropdownCoreProps & HTMLAttributes<HTMLDivElement>;

export const Dropdown = forwardRef<HTMLDivElement, DropdownProps>(
    (
        { countries, selected, onSelect, multiSelect = false, disabled = false, className, placeholder = "Select option", searchPlaceholder = "Search...", ...rest },
        ref: ForwardedRef<HTMLDivElement>
    ): JSX.Element => {
        const [search, setSearch] = useState("");
        const [isOpen, setIsOpen] = useState(false);
        const [selectedCountries, setSelectedCountries] = useState<Country[]>(
            Array.isArray(selected) ? selected : selected ? [selected] : []
        );
        const dropdownRef = useRef<HTMLDivElement | null>(null);

        const setRefs = (node: HTMLDivElement | null) => {
            dropdownRef.current = node;
            if (typeof ref === "function") {
                ref(node);
            } else if (ref) {
                (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
            }
        };

        useEffect(() => {
            if (selected) {
                setSelectedCountries(Array.isArray(selected) ? selected : [selected]);
            } else {
                setSelectedCountries([]);
            }
        }, [selected]);

        const filteredCountries = countries.filter((country) =>
            (country.name || "").toLowerCase().includes(search.toLowerCase())
        );

        const handleSelect = (country: Country) => {
            if (multiSelect) {
                const exists = selectedCountries.some((c) => c.id === country.id);
                const newSelected = exists
                    ? selectedCountries.filter((c) => c.id !== country.id)
                    : [...selectedCountries, country];
                setSelectedCountries(newSelected);
                onSelect(newSelected);
            } else {
                setSelectedCountries([country]);
                setIsOpen(false);
                onSelect(country);
            }
        };

        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (
                    dropdownRef.current &&
                    !dropdownRef.current.contains(event.target as Node)
                ) {
                    setIsOpen(false);
                }
            };
            document.addEventListener("mousedown", handleClickOutside);
            return () => {
                document.removeEventListener("mousedown", handleClickOutside);
            };
        }, []);

        const isSelected = (country: Country) =>
            selectedCountries.some((c) => c.id === country.id);

        return (
            <div
                className={["relative w-full", className].filter(Boolean).join(" ")}
                ref={setRefs}
                {...rest}
            >

                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    aria-expanded={isOpen}
                    className={`flex w-full min-h-10 items-center gap-2 px-3 py-2 rounded border border-gray-300 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-colors ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''}`}
                >
                    {selectedCountries.length > 0 ? (
                        multiSelect ? (
                            <div className="flex flex-wrap gap-2 items-center overflow-hidden">
                                {selectedCountries.map((country) => (
                                    <span
                                        key={country.id.toString()}
                                        className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium max-w-full truncate border border-blue-100"
                                    >
                                        {country.flagSrc && (
                                            <img
                                                src={country.flagSrc}
                                                alt={country.name}
                                                className="w-3 h-3 rounded-full shrink-0"
                                            />
                                        )}
                                        <span className="truncate">{country.name}</span>
                                        <XIcon
                                            className="w-3 h-3 ml-1 cursor-pointer shrink-0 hover:text-blue-900"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSelect(country);
                                            }}
                                        />
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
                                {selectedCountries[0].flagSrc && (
                                    <img
                                        src={selectedCountries[0].flagSrc}
                                        alt={selectedCountries[0].name}
                                        className="w-5 h-5 rounded-full shrink-0"
                                    />
                                )}
                                <span className="text-sm text-gray-900 truncate">
                                    {selectedCountries[0].name}
                                </span>
                            </div>
                        )
                    ) : (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            {placeholder}
                        </div>
                    )}
                    <svg
                        className={`w-4 h-4 ml-auto text-gray-400 transform transition-transform ${isOpen ? "rotate-180" : "rotate-0"
                            }`}
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                        />
                    </svg>
                </button>

                {isOpen && (
                    <div className="absolute z-[100] mt-1 w-full max-h-[300px] rounded-md border border-gray-200 bg-white shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                        <div className="flex flex-col w-full items-start gap-2 p-2">

                            <div className="relative w-full px-1">
                                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full h-9 pl-9 pr-3 py-1.5 rounded-md border border-gray-200 bg-gray-50 text-sm focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                                    placeholder={searchPlaceholder}
                                />
                            </div>


                            <div className="flex flex-col w-full max-h-60 overflow-y-auto">
                                {filteredCountries.map((country) => (
                                    <button
                                        key={country.id.toString()}
                                        type="button"
                                        onClick={() => handleSelect(country)}
                                        className="flex items-center w-full justify-between gap-3 py-2 px-2 hover:bg-gray-100 rounded-md transition"
                                    >
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            {country.flagSrc && (
                                                <img
                                                    src={country.flagSrc}
                                                    alt={country.name}
                                                    className="w-5 h-5 rounded-full shrink-0"
                                                />
                                            )}
                                            <span className="text-sm text-[#30313d] truncate">
                                                {country.name}
                                            </span>
                                        </div>
                                        {multiSelect && (
                                            <div
                                                className={`w-5 h-5 flex items-center justify-center border rounded ${isSelected(country)
                                                    ? "bg-[#064771] border-[#064771] text-white"
                                                    : "border-gray-400"
                                                    }`}
                                            >
                                                {isSelected(country) && <CheckIcon className="w-4 h-4" />}
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }
);

Dropdown.displayName = 'Dropdown';
