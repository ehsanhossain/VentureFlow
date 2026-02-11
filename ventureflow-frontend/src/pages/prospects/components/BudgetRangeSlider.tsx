import React, { useCallback, useRef, useState, useEffect } from 'react';

interface BudgetRangeSliderProps {
    globalMin: number;
    globalMax: number;
    currentMin: string;
    currentMax: string;
    onMinChange: (val: string) => void;
    onMaxChange: (val: string) => void;
}

/**
 * Format a number with K/M/B abbreviation for display in tooltips.
 */
function formatBudget(val: number): string {
    if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`;
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K`;
    return val.toLocaleString();
}

export const BudgetRangeSlider: React.FC<BudgetRangeSliderProps> = ({
    globalMin,
    globalMax,
    currentMin,
    currentMax,
    onMinChange,
    onMaxChange,
}) => {
    const trackRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null);
    const [hovered, setHovered] = useState<'min' | 'max' | null>(null);

    // Derive numeric values from string inputs
    const minVal = currentMin ? Math.max(Number(currentMin), globalMin) : globalMin;
    const maxVal = currentMax ? Math.min(Number(currentMax), globalMax) : globalMax;

    // Calculate percentage positions
    const range = globalMax - globalMin || 1;
    const minPercent = ((minVal - globalMin) / range) * 100;
    const maxPercent = ((maxVal - globalMin) / range) * 100;

    const getValueFromPosition = useCallback((clientX: number): number => {
        if (!trackRef.current) return globalMin;
        const rect = trackRef.current.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        // Snap to reasonable steps
        const raw = globalMin + percent * range;
        const step = range > 1_000_000 ? 100_000 : range > 100_000 ? 10_000 : range > 10_000 ? 1_000 : 100;
        return Math.round(raw / step) * step;
    }, [globalMin, range]);

    const handleMouseDown = useCallback((thumb: 'min' | 'max') => (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(thumb);
    }, []);

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            const newVal = getValueFromPosition(e.clientX);
            if (isDragging === 'min') {
                const clamped = Math.min(newVal, maxVal);
                onMinChange(String(Math.max(clamped, globalMin)));
            } else {
                const clamped = Math.max(newVal, minVal);
                onMaxChange(String(Math.min(clamped, globalMax)));
            }
        };

        const handleMouseUp = () => {
            setIsDragging(null);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, minVal, maxVal, globalMin, globalMax, onMinChange, onMaxChange, getValueFromPosition]);

    const showMinTooltip = isDragging === 'min' || hovered === 'min';
    const showMaxTooltip = isDragging === 'max' || hovered === 'max';

    return (
        <div className="mt-3 mb-1 px-1">
            {/* Slider Track */}
            <div
                ref={trackRef}
                className="relative h-1.5 bg-gray-200 rounded-full cursor-pointer select-none"
                style={{ touchAction: 'none' }}
            >
                {/* Filled range between handles */}
                <div
                    className="absolute h-full rounded-full"
                    style={{
                        left: `${minPercent}%`,
                        width: `${maxPercent - minPercent}%`,
                        background: '#064771',
                    }}
                />

                {/* Min handle */}
                <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                    style={{ left: `${minPercent}%`, zIndex: isDragging === 'min' ? 20 : 10 }}
                    onMouseDown={handleMouseDown('min')}
                    onMouseEnter={() => setHovered('min')}
                    onMouseLeave={() => !isDragging && setHovered(null)}
                >
                    {/* Tooltip */}
                    <div
                        className={`absolute left-1/2 -translate-x-1/2 -top-9 px-2 py-1 rounded-[3px] text-[11px] font-medium font-['Inter'] whitespace-nowrap transition-all duration-150
                            ${showMinTooltip ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
                        style={{ background: '#064771', color: '#fff' }}
                    >
                        {formatBudget(minVal)}
                        <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 rotate-45" style={{ background: '#064771' }} />
                    </div>
                    {/* Thumb */}
                    <div
                        className={`w-4 h-4 rounded-full border-2 cursor-grab transition-shadow duration-150
                            ${isDragging === 'min' ? 'shadow-[0_0_0_4px_rgba(6,71,113,0.15)] cursor-grabbing' : 'shadow-sm hover:shadow-[0_0_0_4px_rgba(6,71,113,0.1)]'}`}
                        style={{
                            background: '#fff',
                            borderColor: '#064771',
                        }}
                    />
                </div>

                {/* Max handle */}
                <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                    style={{ left: `${maxPercent}%`, zIndex: isDragging === 'max' ? 20 : 10 }}
                    onMouseDown={handleMouseDown('max')}
                    onMouseEnter={() => setHovered('max')}
                    onMouseLeave={() => !isDragging && setHovered(null)}
                >
                    {/* Tooltip */}
                    <div
                        className={`absolute left-1/2 -translate-x-1/2 -top-9 px-2 py-1 rounded-[3px] text-[11px] font-medium font-['Inter'] whitespace-nowrap transition-all duration-150
                            ${showMaxTooltip ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
                        style={{ background: '#064771', color: '#fff' }}
                    >
                        {formatBudget(maxVal)}
                        <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 rotate-45" style={{ background: '#064771' }} />
                    </div>
                    {/* Thumb */}
                    <div
                        className={`w-4 h-4 rounded-full border-2 cursor-grab transition-shadow duration-150
                            ${isDragging === 'max' ? 'shadow-[0_0_0_4px_rgba(6,71,113,0.15)] cursor-grabbing' : 'shadow-sm hover:shadow-[0_0_0_4px_rgba(6,71,113,0.1)]'}`}
                        style={{
                            background: '#fff',
                            borderColor: '#064771',
                        }}
                    />
                </div>
            </div>

            {/* Min / Max labels */}
            <div className="flex items-center justify-between mt-1.5">
                <span className="text-[11px] text-gray-400 font-['Inter']">{formatBudget(globalMin)}</span>
                <span className="text-[11px] text-gray-400 font-['Inter']">{formatBudget(globalMax)}</span>
            </div>
        </div>
    );
};
