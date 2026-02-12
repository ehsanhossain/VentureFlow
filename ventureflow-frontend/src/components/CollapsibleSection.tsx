import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleSectionProps {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
    className?: string; // Allow custom classes
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
    title,
    children,
    defaultOpen = true,
    className = ""
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className={`mb-8 ${className}`}>
            <div
                className="flex items-center justify-between pb-2 border-b border-gray-200 cursor-pointer group select-none"
                onClick={() => setIsOpen(!isOpen)}
            >
                <h3 className="text-lg font-medium text-gray-900 group-hover:text-[#064771] transition-colors">{title}</h3>
                <div className="p-1 rounded-md hover:bg-gray-100 text-gray-400 group-hover:text-gray-600 transition-colors">
                    {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
            </div>
            {isOpen && <div className="mt-6">{children}</div>}
        </div>
    );
};
