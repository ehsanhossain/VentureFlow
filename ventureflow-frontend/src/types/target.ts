/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

export interface TargetMaster {
    id?: number;
    projectCode: string; // seller_id / dealroomId
    companyName: string; // reg_name
    originCountry: {
        id: number;
        name: string;
        alpha?: string;
        flagSrc?: string;
    } | null;
    status: string; // Draft, Active, etc.
    rank: 'A' | 'B' | 'C';
    internalOwner: string; // our_person_incharge (JSON or string)

    // Classification
    industryMajor: { id: number; name: string } | null;
    industryMiddle: { id: number; name: string } | null;
    nicheTags: string[]; // local_industry_code or separate field? (Controller maps local_industry_code to string)

    // Deal Summary
    projectDetails: string; // details
    reasonForMA: string; // reason_ma
    formattedReasonMA?: { value: string; note?: string };
    plannedSaleShareRatio: string; // max_investor_shareholding_percentage (min-max or enum)
    desiredInvestmentRange: {
        min: string;
        max: string;
        currency: string;
    };

    // Contacts (Primary)
    primaryContact: {
        name: string;
        designation: string;
        email: string;
        phone: string;
    };

    // Links
    websiteUrl: string;
    teaserLink?: string;
    dataAvailabilityFlags?: {
        financials: boolean;
        orgChart: boolean;
        nda: boolean;
    };

    // Audit
    createdAt?: string;
    updatedAt?: string;
    createdBy?: { id: number; name: string };
    updatedBy?: { id: number; name: string };
}
