import React, { useState, useEffect } from 'react';
import { Save, Lock, Info } from 'lucide-react';
import api from '../../../config/api';
import { showAlert } from '../../../components/Alert';
import { useTranslation } from 'react-i18next';

interface SharingConfig {
    [key: string]: boolean;
}

interface FieldDefinition {
    key: string;
    label: string;
    locked?: boolean; // If true, cannot be changed (always false/hidden)
    default?: boolean;
}

export const INVESTOR_FIELDS: { category: string; fields: FieldDefinition[] }[] = [
    {
        category: 'Identity',
        fields: [
            { key: 'buyer_id', label: 'Investor ID', default: true },
            { key: 'company_overview.reg_name', label: 'Company Name', locked: true },
            { key: 'company_overview.hq_country', label: 'HQ Country', default: true },
            { key: 'company_overview.website', label: 'Website', locked: true },
            { key: 'company_overview.hq_address', label: 'HQ Address', locked: true },
            { key: 'company_overview.rank', label: 'Rank' },
        ]
    },
    {
        category: 'Investment Intent',
        fields: [
            { key: 'company_overview.main_industry_operations', label: 'Target Industries', default: true },
            { key: 'company_overview.reason_ma', label: 'Purpose of M&A' },
            { key: 'company_overview.target_countries', label: 'Target Countries', default: true },
            { key: 'company_overview.investment_budget', label: 'Investment Budget', default: true },
            { key: 'company_overview.investment_condition', label: 'Investment Condition' },
        ]
    },
    {
        category: 'Contacts & Relationships',
        fields: [
            { key: 'company_overview.contacts', label: 'Client Side Person Info', locked: true },
            { key: 'company_overview.investor_profile_link', label: 'Investor Profile Link' },
            { key: 'company_overview.internal_pic', label: 'Internal PIC' },
            { key: 'company_overview.financial_advisor', label: 'Financial Advisor' },
        ]
    }
];

export const TARGET_FIELDS: { category: string; fields: FieldDefinition[] }[] = [
    {
        category: 'Identity',
        fields: [
            { key: 'seller_id', label: 'Target ID', default: true },
            { key: 'company_overview.reg_name', label: 'Company Name', locked: true },
            { key: 'company_overview.hq_country', label: 'HQ Country', default: true },
            { key: 'company_overview.website', label: 'Website', locked: true },
            { key: 'company_overview.company_rank', label: 'Rank' },
        ]
    },
    {
        category: 'Classification',
        fields: [
            { key: 'company_overview.industry_ops', label: 'Target Industries', default: true },
            { key: 'company_overview.niche_tags', label: 'Niche Tags' },
        ]
    },
    {
        category: 'Deal Summary',
        fields: [
            { key: 'company_overview.details', label: 'Project Details', default: true },
            { key: 'company_overview.reason_ma', label: 'Reason for M&A' },
            { key: 'financial_details.maximum_investor_shareholding_percentage', label: 'Planned Sale Share Ratio' },
            { key: 'financial_details.expected_investment_amount', label: 'Desired Investment Range', default: true },
            { key: 'financial_details.ebitda_value', label: 'EBITDA / TTM Profit' },
        ]
    },
    {
        category: 'Contacts & Relationships',
        fields: [
            { key: 'company_overview.seller_contact_name', label: 'Contact Name', locked: true },
            { key: 'company_overview.seller_designation', label: 'Contact Designation', locked: true },
            { key: 'company_overview.seller_email', label: 'Contact Email', locked: true },
            { key: 'company_overview.seller_phone', label: 'Contact Phone', locked: true },
            { key: 'company_overview.internal_pic', label: 'Internal PIC' },
            { key: 'company_overview.financial_advisor', label: 'Financial Advisor' },
            { key: 'company_overview.teaser_link', label: 'Teaser Profile Link' },
        ]
    }
];

const PartnerSharingSettings: React.FC = () => {
    const { } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [buyerConfig, setBuyerConfig] = useState<SharingConfig>({});
    const [sellerConfig, setSellerConfig] = useState<SharingConfig>({});

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/partner-settings');
            const settings = res.data; // { buyer_sharing_config: {...}, seller_sharing_config: {...} }

            if (settings.buyer_sharing_config) setBuyerConfig(settings.buyer_sharing_config);
            if (settings.seller_sharing_config) setSellerConfig(settings.seller_sharing_config);
        } catch (error) {
            console.error(error);
            showAlert({ type: 'error', message: 'Failed to fetch sharing settings' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.post('/api/partner-settings', {
                settings: {
                    buyer_sharing_config: buyerConfig,
                    seller_sharing_config: sellerConfig
                }
            });
            showAlert({ type: 'success', message: 'Sharing settings updated successfully' });
        } catch (error) {
            console.error(error);
            showAlert({ type: 'error', message: 'Failed to update settings' });
        } finally {
            setSaving(false);
        }
    };

    const toggleField = (type: 'buyer' | 'seller', key: string, locked?: boolean) => {
        if (locked) return; // Cannot toggle locked fields

        if (type === 'buyer') {
            setBuyerConfig(prev => ({ ...prev, [key]: !prev[key] }));
        } else {
            setSellerConfig(prev => ({ ...prev, [key]: !prev[key] }));
        }
    };

    const renderFieldGroup = (title: string, categories: { category: string; fields: FieldDefinition[] }[], config: SharingConfig, type: 'buyer' | 'seller') => (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                <h3 className="font-bold text-[#064771] text-lg">{title}</h3>
                <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border border-gray-200 shadow-sm">
                    {Object.keys(config).filter(k => k.startsWith('company_overview') || k === (type === 'buyer' ? 'buyer_id' : 'seller_id')).filter(k => config[k]).length} Allowed Fields
                </span>
            </div>
            <div className="p-6 space-y-8">
                {categories.map((cat, catIdx) => (
                    <div key={catIdx} className="space-y-4">
                        <div className="flex items-center gap-4">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{cat.category}</h4>
                            <div className="h-px bg-gray-100 flex-1"></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {cat.fields.map(field => {
                                const isChecked = config[field.key] === true;
                                const isLocked = field.locked;

                                return (
                                    <div
                                        key={field.key}
                                        className={`
                                            flex items-center p-3 rounded-lg border transition-all duration-200
                                            ${isLocked
                                                ? 'bg-gray-100 border-gray-200 opacity-70 cursor-not-allowed'
                                                : 'hover:border-[#064771] border-gray-200 cursor-pointer bg-white'
                                            }
                                            ${isChecked && !isLocked ? 'ring-1 ring-[#064771] border-[#064771] bg-blue-50/30' : ''}
                                        `}
                                        onClick={() => toggleField(type, field.key, isLocked)}
                                    >
                                        <div className={`
                                            w-5 h-5 rounded border flex items-center justify-center mr-3 transition-colors
                                            ${isLocked
                                                ? 'bg-gray-200 border-gray-300'
                                                : isChecked
                                                    ? 'bg-[#064771] border-[#064771]'
                                                    : 'bg-white border-gray-300'
                                            }
                                        `}>
                                            {isLocked && <Lock className="w-3 h-3 text-gray-400" />}
                                            {isChecked && !isLocked && (
                                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <span className={`text-sm font-medium ${isLocked ? 'text-gray-500' : 'text-gray-700'}`}>
                                                {field.label}
                                            </span>
                                            {isLocked && (
                                                <p className="text-[10px] text-red-400 font-medium mt-0.5 flex items-center gap-1">
                                                    <Lock className="w-2.5 h-2.5" /> Restricted
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading settings...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Info className="w-5 h-5 text-[#064771]" />
                </div>
                <div>
                    <h4 className="font-bold text-[#064771] text-sm">Data Sharing Control</h4>
                    <p className="text-sm text-[#064771]/80 mt-1">
                        Configure exactly which fields are visible to partners in their portal.
                        Locked fields contain sensitive information (like identity or contact details) and cannot be shared.
                    </p>
                </div>
            </div>

            {renderFieldGroup('Investor (Buyer) Fields', INVESTOR_FIELDS, buyerConfig, 'buyer')}
            {renderFieldGroup('Target (Seller) Fields', TARGET_FIELDS, sellerConfig, 'seller')}

            <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#064771] text-white font-bold rounded-xl hover:bg-[#053a5c] transition-all shadow-md disabled:opacity-70"
                >
                    <Save className="w-5 h-5" />
                    <span>{saving ? 'Saving...' : 'Save Settings'}</span>
                </button>
            </div>
        </div>
    );
};

export default PartnerSharingSettings;
