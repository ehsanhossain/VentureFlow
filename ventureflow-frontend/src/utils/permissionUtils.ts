export const ALLOWED_FIELD_MAPPING: any = {
    investors: {
        projectCode: { root: true, key: 'buyer_id' },
        rank: { rel: 'companyOverview', key: 'rank' },
        companyName: { rel: 'companyOverview', key: 'reg_name' },
        primaryContact: { rel: 'companyOverview', key: 'seller_contact_name' },
        hq: { rel: 'companyOverview', key: 'hq_country' },
        targetCountries: { rel: 'targetPreference', key: 'target_countries' },
        targetIndustries: { rel: 'companyOverview', key: 'main_industry_operations' },
        pipelineStatus: { root: true, key: 'pipeline_status' },
        budget: { rel: 'companyOverview', key: 'investment_budget' },
        companyType: { rel: 'companyOverview', key: 'company_type' },
        website: { rel: 'companyOverview', key: 'website' },
        email: { rel: 'companyOverview', key: 'email' },
        phone: { rel: 'companyOverview', key: 'phone' },
        employeeCount: { rel: 'companyOverview', key: 'emp_count' },
        yearFounded: { rel: 'companyOverview', key: 'year_founded' },
    },
    targets: {
        projectCode: { root: true, key: 'seller_id' },
        addedDate: { root: true, key: 'created_at' },
        hq: { rel: 'companyOverview', key: 'hq_country' },
        industry: { rel: 'companyOverview', key: 'industry_ops' },
        industryMiddle: { rel: 'companyOverview', key: 'industry_ops' },
        projectDetails: { rel: 'companyOverview', key: 'details' },
        desiredInvestment: { rel: 'financialDetails', key: 'expected_investment_amount' },
        reasonForMA: { rel: 'companyOverview', key: 'reason_ma' },
        saleShareRatio: { rel: 'financialDetails', key: 'maximum_investor_shareholding_percentage' },
        rank: { rel: 'companyOverview', key: 'company_rank' },
        status: { rel: 'companyOverview', key: 'status' },
        pipelineStatus: { root: true, key: 'pipeline_status' },
        internalOwner: { rel: 'companyOverview', key: 'incharge_name' },
        companyName: { rel: 'companyOverview', key: 'reg_name' },
        primaryContact: { rel: 'companyOverview', key: 'seller_contact_name' },
        primaryEmail: { rel: 'companyOverview', key: 'seller_email' },
        primaryPhone: { rel: 'companyOverview', key: 'seller_phone' },
        website: { rel: 'companyOverview', key: 'website' },
        teaserLink: { rel: 'companyOverview', key: 'teaser_link' },
    }
};

export const isFieldAllowed = (colId: string, allowedConfig: any, type: 'investors' | 'targets') => {
    if (!allowedConfig) return true;
    const map = ALLOWED_FIELD_MAPPING[type][colId];
    if (!map) return true;
    if (map.root) return allowedConfig.root?.includes(map.key);
    if (map.rel) {
        if (!allowedConfig.relationships) return false;
        return allowedConfig.relationships[map.rel]?.includes(map.key);
    }
    return false;
};

export const isBackendPropertyAllowed = (allowedConfig: any, section: string, key: string) => {
    if (!allowedConfig) return true; // Admin allowed
    if (section === 'root') return allowedConfig.root?.includes(key);
    return allowedConfig.relationships?.[section]?.includes(key);
};
