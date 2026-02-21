/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

import React from "react";

interface LabelProps {
    text: string;
}

export const Label: React.FC<LabelProps> = ({ text }) => {
    return (
        <div className="label-container">
            <div
                className="label-text "
                style={{
                    color: '#064771',
                    fontSize: '16px',
                    fontWeight: 500,
                    letterSpacing: '0',
                    lineHeight: 'normal',
                }}
            >
                {text}
            </div>
        </div>
    );
};
