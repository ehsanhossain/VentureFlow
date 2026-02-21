/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

import React, { useState, useRef } from 'react';

interface TooltipProps {
    content: React.ReactNode;
    children: React.ReactElement;
    maxWidth?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, maxWidth = 'max-w-[300px]' }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState({ x: 0, y: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);

    const handleMouseEnter = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setCoords({
            x: rect.left + rect.width / 2,
            y: rect.top - 8
        });
        setIsVisible(true);
    };

    const handleMouseLeave = () => {
        setIsVisible(false);
    };

    return (
        <>
            <div
                ref={triggerRef}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className="truncate inline-block w-full"
            >
                {children}
            </div>
            {isVisible && content && (
                <div
                    className={`fixed z-[9999] px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl pointer-events-none animate-in fade-in zoom-in-95 duration-200 origin-bottom -translate-x-1/2 -translate-y-full ${maxWidth} break-words text-center`}
                    style={{
                        left: coords.x,
                        top: coords.y
                    }}
                >
                    {content}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                </div>
            )}
        </>
    );
};
