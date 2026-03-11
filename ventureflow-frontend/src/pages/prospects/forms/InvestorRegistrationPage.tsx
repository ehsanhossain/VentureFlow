/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

import React from 'react';
import BackButton from '../../../components/BackButton';
import { InvestorRegistration } from './InvestorRegistration';

const InvestorRegistrationPage: React.FC = () => {

    return (
        <div className="flex flex-col h-full min-h-screen bg-white">
            {/* Header */}
            <div className="flex items-center gap-4 px-4 md:px-6 py-4 bg-white border-b">
                <BackButton to="/prospects?tab=investors" />
                <h1 className="text-xl md:text-2xl font-medium text-gray-900">Add Investor</h1>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto p-4 md:p-6 scrollbar-premium">
                <div className="w-full">
                    <InvestorRegistration />
                </div>
            </div>
        </div>
    );
};

export default InvestorRegistrationPage;
