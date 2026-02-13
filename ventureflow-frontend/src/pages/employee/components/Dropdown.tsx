import { forwardRef, useEffect, useRef, useState } from "react";
import { SearchIcon, CheckIcon, XIcon, GlobeIcon } from "lucide-react";

export interface Country {
  id: number;
  name: string;
  flagSrc: string;
  status: "registered" | "unregistered";
  alpha: string;
}

type DropdownProps = {
  countries: Country[];
  selected?: Country | Country[] | null;
  onSelect: (country: Country | Country[]) => void;
  multiSelect?: boolean;
  placeholder?: string;
};

export const Dropdown = forwardRef<HTMLDivElement, DropdownProps>((
  { countries, selected, onSelect, multiSelect = false, placeholder },
  forwardedRef
): JSX.Element => {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCountries, setSelectedCountries] = useState<Country[]>(
    Array.isArray(selected) ? selected : selected ? [selected] : []
  );
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const setRefs = (node: HTMLDivElement | null) => {
    dropdownRef.current = node;

    if (typeof forwardedRef === "function") {
      forwardedRef(node);
    } else if (forwardedRef) {
      (forwardedRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
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
    country.name.toLowerCase().includes(search.toLowerCase())
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
    <div className="relative w-full" ref={setRefs}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen ? "true" : "false"}
        className="flex w-full min-h-10 items-center gap-2 px-4 sm:px-5 py-2 rounded-md border border-gray-300 bg-white focus:outline-none flex-wrap overflow-hidden"
      >
        {selectedCountries.length > 0 ? (
          multiSelect ? (
            <div className="flex flex-wrap gap-2 items-center overflow-hidden">
              {selectedCountries.map((country) => (
                <span
                  key={country.id.toString()}
                  className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-900 max-w-full truncate"
                >
                  <img
                    src={country.flagSrc}
                    alt={country.name}
                    className="w-4 h-4 rounded-full shrink-0"
                  />
                  <span className="truncate">{country.name}</span>
                  <XIcon
                    className="w-3 h-3 ml-1 cursor-pointer shrink-0"
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
              <img
                src={selectedCountries[0].flagSrc}
                alt={selectedCountries[0].name}
                className="w-5 h-5 rounded-full shrink-0"
              />
              <span className="text-sm text-gray-900 truncate">
                {selectedCountries[0].name}
              </span>
            </div>
          )
        ) : (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <GlobeIcon className="w-4 h-4 text-gray-500" />
            {multiSelect ? "Select countries" : placeholder || "Select a country"}
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
        <div className="absolute z-50 mt-1 w-full max-h-[80vh] rounded-md border border-t-0 border-gray-300 bg-white overflow-hidden shadow-lg">
          <div className="flex flex-col w-full items-start gap-4 px-4 py-3">

            <div className="relative w-full">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-10 pr-3 py-2 rounded-full border border-[#828282] text-sm placeholder:text-gray-500 focus:outline-none"
                placeholder="Search country..."
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
                    <img
                      src={country.flagSrc}
                      alt={country.name}
                      className="w-5 h-5 rounded-full shrink-0"
                    />
                    <span className="text-sm text-gray-900 truncate">
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
});

Dropdown.displayName = 'Dropdown';
