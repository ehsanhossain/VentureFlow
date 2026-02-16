import React, { useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { cn } from '../../utils/cn';

interface DataTableSearchProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

const DataTableSearch: React.FC<DataTableSearchProps> = ({
    value,
    onChange,
    placeholder = "Search...",
    className
}) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
                e.preventDefault();
                e.stopPropagation();
                inputRef.current?.focus();
            }
        };

        window.addEventListener('keydown', handleKeyDown, true); // Use capture phase
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, []);

    return (
        <div className={cn("relative group w-full md:w-72", className)}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#064771] transition-colors" />
            <input
                ref={inputRef}
                type="text"
                data-local-search="true"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full h-10 pl-9 pr-14 bg-white border border-gray-200 rounded-[3px] text-sm focus:outline-none focus:ring-2 focus:ring-[#064771] transition-all"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded border border-gray-200 bg-white text-[10px] font-medium text-gray-400 opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none">
                <span className="text-xs">⌘</span> F
            </div>
        </div>
    );
};

export default DataTableSearch;
