import React from 'react';
import { X, MessageSquare, Clock, SkipBack, SkipForward } from 'lucide-react';
import { getCurrencySymbol, formatCompactNumber } from '../../../utils/formatters';

interface DealExpandedPreviewProps {
    deal: any;
    onClose: () => void;
    onMove?: (direction: 'forward' | 'backward') => void;
}

const DealExpandedPreview: React.FC<DealExpandedPreviewProps> = ({ deal, onClose, onMove }) => {
    // Format currency value
    const formatValue = (value: number | string | null | undefined, currency: string) => {
        if (!value) return 'N/A';
        const num = typeof value === 'string' ? parseFloat(value) : value;
        const symbol = getCurrencySymbol(currency || 'JPY');
        return `${symbol}${formatCompactNumber(num)}`;
    };

    // Get image URL
    const getImageUrl = (imagePath: string | undefined): string | null => {
        if (!imagePath) return null;
        if (imagePath.startsWith('http')) return imagePath;
        const baseURL = import.meta.env.VITE_API_BASE_URL || '';
        return `${baseURL}/storage/${imagePath.replace(/^\//, '')}`;
    };

    // Buyer details
    const buyerName = deal.buyer?.company_overview?.reg_name || 'Unknown Buyer';
    const buyerImage = getImageUrl(deal.buyer?.image);
    const budget = formatValue(deal.ticket_size || deal.estimated_ev_value, deal.estimated_ev_currency);
    const targetCountries = deal.buyer?.investment_critera?.target_countries || [];
    const displayCountry = targetCountries[0]?.name || 'Not Specified';
    const additionalCountries = targetCountries.length > 1 ? targetCountries.length - 1 : 0;
    const targetIndustries = deal.buyer?.investment_critera?.target_industries || [];
    const displayIndustries = targetIndustries.slice(0, 3).map((i: any) => i.name).join(', ') || 'Not Specified';
    const additionalIndustries = targetIndustries.length > 3 ? targetIndustries.length - 3 : 0;

    // Seller details
    const sellerName = deal.seller?.company_overview?.reg_name || 'Unknown Seller';
    const sellerImage = getImageUrl(deal.seller?.image);
    const desiredInvestment = formatValue(deal.seller?.financial_details?.desired_investment, deal.estimated_ev_currency);
    const shareRatio = deal.seller?.financial_details?.maximum_investor_shareholding_percentage ||
        deal.shareholding_ratio || 'Not Specified';
    const ebitda = deal.seller?.financial_details?.ebitda
        ? formatValue(deal.seller.financial_details.ebitda, deal.estimated_ev_currency)
        : 'N/A';

    // Acquiring info
    const acquiringRatio = deal.shareholding_ratio || deal.share_ratio || 'Majority ~70%';

    // Comment count
    const commentCount = deal.comment_count || 0;

    // Date
    const updatedDate = new Date(deal.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return (
        <div className="w-full inline-flex flex-col shadow-xl rounded-lg">
            {/* Main Card Body */}
            <div
                className="px-6 py-6 bg-white rounded-t-lg flex flex-col"
                style={{
                    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.08)',
                    border: '1px solid #E5E7EB'
                }}
            >
                <div className="flex flex-col gap-6">
                    {/* Header Row: Buyer | Acquiring | Seller */}
                    <div className="flex items-center justify-between gap-6">
                        {/* Buyer/Investor */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            {/* Buyer Avatar */}
                            <div
                                className="w-11 h-11 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm"
                                style={{ backgroundColor: '#F2B200' }}
                            >
                                {buyerImage ? (
                                    <img
                                        src={buyerImage}
                                        alt={buyerName}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                    />
                                ) : (
                                    <span className="text-sm font-semibold" style={{ color: '#3E2C06' }}>
                                        {buyerName.substring(0, 2).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <p className="text-[15px] font-semibold text-gray-900 truncate leading-6">{buyerName}</p>
                                <p className="text-[13px] text-gray-500 leading-5">Buyer/Investor</p>
                            </div>
                        </div>

                        {/* Acquiring Info */}
                        <div className="flex flex-col items-center gap-0.5 flex-shrink-0 px-4">
                            <span className="text-[13px] text-gray-400 leading-5">Acquiring</span>
                            <span className="text-[13px] font-medium text-gray-600 leading-5">{acquiringRatio}</span>
                        </div>

                        {/* Seller/Target */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            {/* Seller Avatar */}
                            <div
                                className="w-11 h-11 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm"
                                style={{ backgroundColor: '#030042' }}
                            >
                                {sellerImage ? (
                                    <img
                                        src={sellerImage}
                                        alt={sellerName}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                    />
                                ) : (
                                    <span className="text-sm font-semibold text-white">
                                        {sellerName.substring(0, 2).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <p className="text-[15px] font-semibold text-gray-900 truncate leading-6">{sellerName}</p>
                                <p className="text-[13px] text-gray-500 leading-5">Seller/Target</p>
                            </div>
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full flex-shrink-0 transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="w-full h-px bg-gray-100" />

                    {/* Details Section - Two Columns */}
                    <div className="flex justify-between gap-10">
                        {/* Left Column - Investor/Buyer Details */}
                        <div className="flex-1 flex flex-col gap-4">
                            <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Investor/Buyer Details</p>

                            {/* Budget */}
                            <div className="flex items-center gap-4">
                                <span className="text-[13px] text-gray-500 leading-5" style={{ width: 110 }}>Budget</span>
                                <span className="text-[14px] font-semibold text-gray-900 leading-5">{budget}</span>
                            </div>

                            {/* Target Country */}
                            <div className="flex items-center gap-4">
                                <span className="text-[13px] text-gray-500 leading-5" style={{ width: 110 }}>Target Country</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[14px] text-gray-900 leading-5">{displayCountry}</span>
                                    {additionalCountries > 0 && (
                                        <span
                                            className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-gray-600"
                                            style={{ background: '#F1F5F9' }}
                                        >
                                            +{additionalCountries}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Target Industry */}
                            <div className="flex items-center gap-4">
                                <span className="text-[13px] text-gray-500 leading-5" style={{ width: 110 }}>Target Industry</span>
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-[14px] text-gray-900 leading-5 truncate" style={{ maxWidth: 180 }}>{displayIndustries}</span>
                                    {additionalIndustries > 0 && (
                                        <span
                                            className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-gray-600 flex-shrink-0"
                                            style={{ background: '#F1F5F9' }}
                                        >
                                            +{additionalIndustries}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Target/Seller Details */}
                        <div className="flex-1 flex flex-col gap-4">
                            <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Target/Seller Details</p>

                            {/* Desired Investment */}
                            <div className="flex items-center gap-4">
                                <span className="text-[13px] text-gray-500 leading-5" style={{ width: 130 }}>Desired Investment</span>
                                <span className="text-[14px] font-semibold text-gray-900 leading-5">{desiredInvestment}</span>
                            </div>

                            {/* Share Ratio */}
                            <div className="flex items-center gap-4">
                                <span className="text-[13px] text-gray-500 leading-5" style={{ width: 130 }}>Share Ratio</span>
                                <span className="text-[14px] text-gray-900 leading-5">{shareRatio}</span>
                            </div>

                            {/* EBITDA */}
                            <div className="flex items-center gap-4">
                                <span className="text-[13px] text-gray-500 leading-5" style={{ width: 130 }}>EBITDA</span>
                                <span className="text-[14px] text-gray-900 leading-5">{ebitda}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div
                className="h-12 px-6 bg-white rounded-b-lg flex items-center justify-between border-t-0"
                style={{
                    border: '1px solid #E5E7EB',
                    borderTop: 'none'
                }}
            >
                {/* Left: Comment count & navigation */}
                <div className="flex items-center gap-3">
                    {/* Comment Badge */}
                    <div
                        className="flex items-center gap-2 px-3 py-1.5 rounded"
                        style={{ background: '#064771' }}
                    >
                        <MessageSquare className="w-4 h-4 text-white" />
                        <div className="flex items-center gap-1.5">
                            <span className="text-[13px] font-medium text-white">{commentCount}</span>
                            <span className="text-[13px] font-medium text-white">New Comments</span>
                        </div>
                    </div>

                    {/* Navigation Arrows */}
                    <button
                        onClick={() => onMove?.('backward')}
                        className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors"
                        title="Previous"
                    >
                        <SkipBack className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => onMove?.('forward')}
                        className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors"
                        title="Next"
                    >
                        <SkipForward className="w-5 h-5" />
                    </button>
                </div>

                {/* Right: Date */}
                <div className="flex items-center gap-2 text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span className="text-[13px]">{updatedDate}</span>
                </div>
            </div>
        </div>
    );
};

export default DealExpandedPreview;
