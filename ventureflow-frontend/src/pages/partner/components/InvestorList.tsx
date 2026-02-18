/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useContext } from 'react';
import api from '../../../config/api';
import { AuthContext } from '../../../routes/AuthContext';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../../components/table/table';
import { showAlert } from '../../../components/Alert';
import { useTranslation } from 'react-i18next';
import { BrandSpinner } from '../../../components/BrandSpinner';

interface SharedBuyer {
    id: number;
    teaser_overview: {
        hq_country?: string;
        company_type?: string;
        main_industry_operations?: string[];
        txn_timeline?: string;
    };
    target_preference?: {
        investment_size?: string;
    };
}

const InvestorList = () => {
    const { t } = useTranslation();
    const authContext = useContext(AuthContext);
    const user = authContext?.user;
    const [investors, setInvestors] = useState<SharedBuyer[]>([]);
    const [loading, setLoading] = useState(true);

    // Retrieve partner_id from user context
    const partnerId = (user as any)?.partner_id || (user as any)?.partner?.id || 1;

    useEffect(() => {
        if (partnerId) {
            const fetchInvestors = async () => {
                try {
                    const response = await api.get(`/api/partners/${partnerId}/shared-buyers`);
                    setInvestors(response.data.data);
                } catch (error) {
                    console.error("Failed to fetch investors", error);
                    showAlert({ type: "error", message: "Failed to fetch assigned investors." });
                } finally {
                    setLoading(false);
                }
            };

            fetchInvestors();
        }
    }, [partnerId]);

    if (loading) return (
        <div className="flex flex-col justify-center items-center h-screen gap-3">
            <BrandSpinner size="lg" />
            <span className="text-gray-600 ">{t('investor.loading', 'Loading Investors...')}</span>
        </div>
    );

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-medium mb-4 text-gray-900 ">
                {t('investor.title', 'Assigned Investors')}
            </h2>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto scrollbar-premium">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50/50">
                            <TableHead className="font-semibold">{t('investor.industry', 'Industry')}</TableHead>
                            <TableHead className="font-semibold">{t('investor.hqCountry', 'HQ Country')}</TableHead>
                            <TableHead className="font-semibold">{t('investor.dealTimeline', 'Deal Timeline')}</TableHead>
                            <TableHead className="font-semibold">{t('investor.investmentSize', 'Investment Size')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {investors.length > 0 ? (
                            investors.map((buyer) => (
                                <TableRow key={buyer.id} className="hover:bg-gray-50/50 transition-colors">
                                    <TableCell className="max-w-[200px]">
                                        <div className="truncate" title={Array.isArray(buyer.teaser_overview?.main_industry_operations) ? buyer.teaser_overview?.main_industry_operations.join(', ') : ''}>
                                            {Array.isArray(buyer.teaser_overview?.main_industry_operations)
                                                ? buyer.teaser_overview?.main_industry_operations.join(', ')
                                                : buyer.teaser_overview?.main_industry_operations || '-'}
                                        </div>
                                    </TableCell>
                                    <TableCell>{buyer.teaser_overview?.hq_country || '-'}</TableCell>
                                    <TableCell>{buyer.teaser_overview?.txn_timeline || '-'}</TableCell>
                                    <TableCell className="font-medium text-[#064771]">
                                        {buyer.target_preference?.investment_size || '-'}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-10 text-gray-500">
                                    {t('investor.noInvestors', 'No investors assigned yet.')}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {investors.length > 0 ? (
                    investors.map((buyer) => (
                        <div key={buyer.id} className="border border-gray-100 rounded-lg p-4 space-y-3 bg-gray-50/30">
                            <div className="flex justify-between items-start">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('investor.industry', 'Industry')}</span>
                                <span className="text-sm font-medium text-right ml-4">
                                    {Array.isArray(buyer.teaser_overview?.main_industry_operations)
                                        ? buyer.teaser_overview?.main_industry_operations.join(', ')
                                        : buyer.teaser_overview?.main_industry_operations || '-'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('investor.hqCountry', 'HQ Country')}</span>
                                <span className="text-sm">{buyer.teaser_overview?.hq_country || '-'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('investor.dealTimeline', 'Timeline')}</span>
                                <span className="text-sm">{buyer.teaser_overview?.txn_timeline || '-'}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('investor.investmentSize', 'Investment Size')}</span>
                                <span className="text-sm font-medium text-[#064771]">{buyer.target_preference?.investment_size || '-'}</span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10 text-gray-500 border border-dashed border-gray-200 rounded-lg">
                        {t('investor.noInvestors', 'No investors assigned yet.')}
                    </div>
                )}
            </div>
        </div>
    );
};

export default InvestorList;
