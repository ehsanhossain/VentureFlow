/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { TargetRegistration } from './TargetRegistration';

const TargetRegistrationPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col h-full min-h-screen bg-white">
            {/* Header */}
            <div className="flex items-center gap-4 px-4 md:px-6 py-4 bg-white border-b">
                <button
                    type="button"
                    className="flex items-center gap-2 px-4 py-2 rounded-[3px] bg-[#064771] hover:bg-[#053a5c] text-white text-sm font-medium transition-all active:scale-95"
                    onClick={() => navigate('/prospects?tab=targets')}
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                </button>
                <h1 className="text-xl md:text-2xl font-medium text-gray-900">Add Target</h1>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto p-4 md:p-6 scrollbar-premium">
                <div className="w-full">
                    <TargetRegistration />
                </div>
            </div>
        </div>
    );
};

export default TargetRegistrationPage;
