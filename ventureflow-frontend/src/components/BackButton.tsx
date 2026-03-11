/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';

interface BackButtonProps {
    /** Explicit route to navigate to (e.g. '/settings/staff'). Falls back to navigate(-1) if omitted. */
    to?: string;
    /** Text label displayed next to the icon. Defaults to 'Back'. */
    label?: string;
    /** Custom click handler. Overrides `to` and default navigate(-1). */
    onClick?: () => void;
    /** Additional CSS classes to apply to the button. */
    className?: string;
}

const BackButton: React.FC<BackButtonProps> = ({ to, label = 'Back', onClick, className = '' }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        if (onClick) {
            onClick();
        } else if (to) {
            navigate(to);
        } else {
            navigate(-1);
        }
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            className={`flex flex-shrink-0 items-center gap-1 py-1 px-3 rounded bg-[#064771] hover:bg-[#053a5c] transition-colors active:scale-95 ${className}`}
            aria-label={label}
        >
            <svg
                width={14}
                height={11}
                viewBox="0 0 14 11"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M3.66681 9.85943H9.28387C11.2247 9.85943 12.8003 8.2839 12.8003 6.34304C12.8003 4.40217 11.2247 2.82666 9.28387 2.82666H1.55469"
                    stroke="white"
                    strokeWidth="1.56031"
                    strokeMiterlimit={10}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M3.17526 4.59629L1.38281 2.79245L3.17526 1"
                    stroke="white"
                    strokeWidth="1.56031"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
            <span className="text-white text-[.8125rem] font-semibold">{label}</span>
        </button>
    );
};

export default BackButton;
