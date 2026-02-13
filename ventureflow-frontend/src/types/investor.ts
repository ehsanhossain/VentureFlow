export interface InvestorContact {
    id?: number;
    name: string;
    designation: string; // Position
    department?: string;
    email: string;
    phone: string;
    is_primary: boolean;
}

export interface IntroducedProject {
    id: number;
    project_name: string;
    // Add other project fields as needed
}

export interface InvestorAudit {
    created_at?: string;
    updated_at?: string;
    created_by?: string; // Name of user
    updated_by?: string; // Name of user
}

export interface InvestorCompanyOverview {
    id: number;
    reg_name: string; // Company Name
    hq_country: string | number; // Country ID or Name
    buyer_id: string; // Project Code (e.g. TH-B-001)
    website?: string;

    // Investment Intent
    industry_ops?: string; // Main Industry (or tags in future)
    investment_budget?: string; // Budget
    reason_ma?: string; // Purpose of M&A
    target_countries?: string; // JSON or comma separated

    // Contacts (New structure)
    contacts?: InvestorContact[];

    // Legacy / Existing fields to maintain compatibility during migration
    seller_contact_name?: string;
    seller_email?: string;
    seller_phone?: string;

    // New Fields
    rank?: 'A' | 'B' | 'C';
    investor_profile_link?: string;
    introduced_projects?: IntroducedProject[];

    // Audit
    created_at?: string;
    updated_at?: string;
}

export interface Investor {
    id: number;
    buyer_id: string; // The primary foreign key/link
    company_overview_id: number;
    company_overview?: InvestorCompanyOverview;

    // Relations
    target_preference?: Record<string, unknown>;
    financial_details?: Record<string, unknown>;
    partnership_details?: Record<string, unknown>;
}
