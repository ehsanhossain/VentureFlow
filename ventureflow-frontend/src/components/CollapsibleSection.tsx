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
        <div className={`border border-gray-200 rounded-lg mb-4 overflow-hidden bg-white shadow-sm ${className}`}>
            <div
                className="flex items-center justify-between px-6 py-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <h3 className="text-lg font-medium text-gray-800">{title}</h3>
                {isOpen ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
            </div>
            {isOpen && <div className="p-6">{children}</div>}
        </div>
    );
};
