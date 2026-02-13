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
import { BrandSpinner } from '../../../components/BrandSpinner';

interface SharedSeller {
    id: number;
    teaser_overview: {
        hq_country?: string;
        industry_ops?: string[];
        year_founded?: string;
        description?: string;
    };
    financial_details?: {
        revenue?: string;
        ebitda?: string;
    };
}

const SellerList = () => {
    const authContext = useContext(AuthContext);
    const user = authContext?.user;
    const [sellers, setSellers] = useState<SharedSeller[]>([]);
    const [loading, setLoading] = useState(true);

    // Retrieve partner_id from user context
    const partnerId = (user as any)?.partner_id || (user as any)?.partner?.id || 1;

    useEffect(() => {
        if (partnerId) {
            const fetchSellers = async () => {
                try {
                    const response = await api.get(`/api/partners/${partnerId}/shared-sellers`);
                    setSellers(response.data.data);
                } catch (error) {
                    console.error("Failed to fetch sellers", error);
                    showAlert({ type: "error", message: "Failed to fetch assigned targets." });
                } finally {
                    setLoading(false);
                }
            };

            fetchSellers();
        }
    }, [partnerId]);

    if (loading) return (
        <div className="flex flex-col justify-center items-center h-full gap-3">
            <BrandSpinner size="lg" />
            <span className="text-gray-600 ">Loading Targets...</span>
        </div>
    );

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-medium mb-4 text-gray-900 ">Assigned Targets</h2>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50/50">
                            <TableHead className="font-semibold">Industry</TableHead>
                            <TableHead className="font-semibold">HQ Country</TableHead>
                            <TableHead className="font-semibold">Year Founded</TableHead>
                            <TableHead className="font-semibold">Revenue</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sellers.length > 0 ? (
                            sellers.map((seller) => (
                                <TableRow key={seller.id} className="hover:bg-gray-50/50 transition-colors">
                                    <TableCell className="max-w-[200px]">
                                        <div className="truncate" title={Array.isArray(seller.teaser_overview?.industry_ops) ? seller.teaser_overview?.industry_ops.join(', ') : ''}>
                                            {Array.isArray(seller.teaser_overview?.industry_ops)
                                                ? seller.teaser_overview?.industry_ops.join(', ')
                                                : seller.teaser_overview?.industry_ops || '-'}
                                        </div>
                                    </TableCell>
                                    <TableCell>{seller.teaser_overview?.hq_country || '-'}</TableCell>
                                    <TableCell>{seller.teaser_overview?.year_founded || '-'}</TableCell>
                                    <TableCell className="font-medium text-[#064771]">
                                        {seller.financial_details?.revenue || '-'}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-10 text-gray-500">
                                    No targets assigned yet.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {sellers.length > 0 ? (
                    sellers.map((seller) => (
                        <div key={seller.id} className="border border-gray-100 rounded-lg p-4 space-y-3 bg-gray-50/30">
                            <div className="flex justify-between items-start">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Industry</span>
                                <span className="text-sm font-medium text-right ml-4">
                                    {Array.isArray(seller.teaser_overview?.industry_ops)
                                        ? seller.teaser_overview?.industry_ops.join(', ')
                                        : seller.teaser_overview?.industry_ops || '-'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">HQ Country</span>
                                <span className="text-sm">{seller.teaser_overview?.hq_country || '-'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Founded</span>
                                <span className="text-sm">{seller.teaser_overview?.year_founded || '-'}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Revenue</span>
                                <span className="text-sm font-medium text-[#064771]">{seller.financial_details?.revenue || '-'}</span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10 text-gray-500 border border-dashed border-gray-200 rounded-lg">
                        No targets assigned yet.
                    </div>
                )}
            </div>
        </div>
    );
};

export default SellerList;
