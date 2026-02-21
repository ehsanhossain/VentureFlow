/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface CellTooltipProps {
    /** The content to show inside the tooltip */
    content: React.ReactNode;
    /** The cell content (children) that triggers the tooltip on hover */
    children: React.ReactNode;
    /** Delay in ms before showing tooltip (default: 200) */
    delay?: number;
    /** Whether the tooltip is enabled (default: true) */
    enabled?: boolean;
}

const CellTooltip: React.FC<CellTooltipProps> = ({
    content,
    children,
    delay = 200,
    enabled = true,
}) => {
    const [visible, setVisible] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const show = useCallback(() => {
        if (!enabled) return;
        timerRef.current = setTimeout(() => {
            if (triggerRef.current) {
                const rect = triggerRef.current.getBoundingClientRect();
                setPosition({
                    top: rect.top - 8,  // 8px gap above trigger
                    left: rect.left + rect.width / 2,
                });
                setVisible(true);
            }
        }, delay);
    }, [enabled, delay]);

    const hide = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        setVisible(false);
    }, []);

    // Adjust position after tooltip renders to avoid viewport overflow
    useEffect(() => {
        if (visible && tooltipRef.current) {
            const tooltip = tooltipRef.current;
            const rect = tooltip.getBoundingClientRect();

            let { top, left } = position;

            // Shift left if overflows right edge
            if (left + rect.width / 2 > window.innerWidth - 12) {
                left = window.innerWidth - rect.width / 2 - 12;
            }
            // Shift right if overflows left edge
            if (left - rect.width / 2 < 12) {
                left = rect.width / 2 + 12;
            }
            // Flip below if too close to top
            if (top - rect.height < 12) {
                const triggerRect = triggerRef.current?.getBoundingClientRect();
                if (triggerRect) {
                    top = triggerRect.bottom + 8;
                    tooltip.style.transform = 'translateX(-50%)';
                    tooltip.style.top = `${top}px`;
                    tooltip.style.left = `${left}px`;
                    return;
                }
            }

            tooltip.style.left = `${left}px`;
        }
    }, [visible, position]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    return (
        <>
            <div
                ref={triggerRef}
                onMouseEnter={show}
                onMouseLeave={hide}
                className="w-full"
            >
                {children}
            </div>
            {visible && createPortal(
                <div
                    ref={tooltipRef}
                    className="fixed z-[9999] pointer-events-none"
                    style={{
                        top: position.top,
                        left: position.left,
                        transform: 'translate(-50%, -100%)',
                    }}
                >
                    <div className="bg-white border border-gray-200 rounded-[3px] shadow-lg px-3 py-2 max-w-[280px] text-[13px] text-gray-700 leading-relaxed">
                        {content}
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default CellTooltip;
