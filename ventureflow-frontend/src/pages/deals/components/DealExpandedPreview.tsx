/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

import React, { useState, useRef, useEffect } from 'react';
import { X, MessageSquare, Clock, SkipBack, SkipForward, MoreVertical, Pencil, ArrowRight, ArrowLeft, XCircle, Trash2, CalendarDays } from 'lucide-react';
import { getCurrencySymbol, formatCompactNumber, formatCompactBudget } from '../../../utils/formatters';
import { Deal } from '../DealPipeline';

interface DealExpandedPreviewProps {
    deal: Deal;
    onClose: () => void;
    onMove?: (direction: 'forward' | 'backward') => void;
    onEdit?: (deal: Deal) => void;
    onMarkLost?: (deal: Deal) => void;
    onDelete?: (deal: Deal) => void;
}

const DealExpandedPreview: React.FC<DealExpandedPreviewProps> = ({ deal, onClose, onMove, onEdit, onMarkLost, onDelete }) => {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };
        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showMenu]);
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
        const baseURL = '';
        return `${baseURL}/api/files/${imagePath.replace(/^\//, '')}`;
    };

    // Buyer details
    const buyerName = deal.buyer?.company_overview?.reg_name || (deal.buyer_id ? 'To be declared' : 'Undefined');
    const buyerCode = (deal.buyer as any)?.buyer_id || '';
    const buyerImage = getImageUrl(deal.buyer?.image);
    // Budget range from investor profile
    const investmentBudget = deal.buyer?.company_overview?.investment_budget;
    const budgetDisplay = investmentBudget
        ? formatCompactBudget(investmentBudget as any, getCurrencySymbol('USD'))
        : formatValue(deal.ticket_size || deal.estimated_ev_value, deal.estimated_ev_currency);
    const targetCountries = deal.buyer?.investment_critera?.target_countries || [];

    // Seller details
    const sellerName = deal.seller?.company_overview?.reg_name || (deal.seller_id ? 'To be declared' : 'Undefined');
    const sellerCode = (deal.seller as any)?.seller_id || '';
    const sellerImage = getImageUrl(deal.seller?.image);
    const desiredInvestment = deal.seller?.financial_details?.desired_investment
        ? formatCompactBudget(deal.seller.financial_details.desired_investment as any, getCurrencySymbol('USD'))
        : 'N/A';
    const shareRatio = deal.seller?.financial_details?.maximum_investor_shareholding_percentage ||
        deal.shareholding_ratio || 'Not Specified';
    const ebitda = deal.seller?.financial_details?.ebitda
        ? formatValue(deal.seller.financial_details.ebitda, deal.estimated_ev_currency)
        : 'N/A';

    // Acquiring info
    const acquiringRatio = deal.shareholding_ratio || deal.share_ratio || 'Majority (51–99%)';

    // Dynamic deal type label
    const getDealTypeLabel = (): string => {
        const type = (deal as any).deal_type || 'acquisition';
        const labels: Record<string, string> = {
            acquisition: 'Acquisition',
            merger: 'Merger',
            joint_venture: 'Joint Venture',
            strategic_investment: 'Strategic Investment',
            minority_stake: 'Minority Stake',
            majority_stake: 'Majority Stake',
            buyout: 'Buyout',
            partnership: 'Partnership',
            management_buyout: 'MBO',
            leveraged_buyout: 'LBO',
            // Legacy fallback
            acquiring: 'Acquisition',
        };
        return labels[type] || 'Acquisition';
    };
    const relationLabel = getDealTypeLabel();

    // Comment count
    const commentCount = deal.comment_count || 0;

    // Date
    const updatedDate = new Date(deal.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return (
        <div className="w-full inline-flex flex-col shadow-xl rounded-[3px]">
            {/* Main Card Body */}
            <div
                className="px-6 py-6 bg-white rounded-t-[3px] flex flex-col"
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
                                {buyerCode && <p className="text-[11px] text-gray-400 leading-4 truncate">{buyerCode}</p>}
                            </div>
                        </div>

                        {/* Acquiring Info */}
                        <div className="flex flex-col items-center gap-0.5 flex-shrink-0 px-4">
                            <span className="text-[13px] text-gray-400 leading-5">{relationLabel}</span>
                            <span className="text-[13px] font-medium text-gray-600 leading-5">{acquiringRatio}</span>
                            {(deal as any).investment_condition && (
                                <span className="text-[11px] text-gray-400 leading-4">{(deal as any).investment_condition}</span>
                            )}
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
                                {sellerCode && <p className="text-[11px] text-gray-400 leading-4 truncate">{sellerCode}</p>}
                            </div>
                        </div>

                        {/* Actions: 3-dot menu + Close */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                            {/* 3-Dot Menu */}
                            <div className="relative" ref={menuRef}>
                                <button
                                    onClick={() => setShowMenu(!showMenu)}
                                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
                                    aria-label="Deal actions"
                                >
                                    <MoreVertical className="w-5 h-5 text-gray-400" />
                                </button>
                                {showMenu && (
                                    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-[3px] shadow-lg border border-gray-200 py-1 z-50">
                                        <button
                                            onClick={() => { setShowMenu(false); onEdit?.(deal); }}
                                            className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                        >
                                            <Pencil className="w-4 h-4 text-gray-400" />
                                            Edit Deal
                                        </button>
                                        <button
                                            onClick={() => { setShowMenu(false); onMove?.('forward'); }}
                                            className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                        >
                                            <ArrowRight className="w-4 h-4 text-gray-400" />
                                            Move Forward
                                        </button>
                                        <button
                                            onClick={() => { setShowMenu(false); onMove?.('backward'); }}
                                            className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                        >
                                            <ArrowLeft className="w-4 h-4 text-gray-400" />
                                            Move Backward
                                        </button>
                                        <div className="h-px bg-gray-100 my-1" />
                                        <button
                                            onClick={() => { setShowMenu(false); onMarkLost?.(deal); }}
                                            className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                        >
                                            <XCircle className="w-4 h-4 text-red-400" />
                                            Mark as Lost
                                        </button>
                                        <button
                                            onClick={() => { setShowMenu(false); onDelete?.(deal); }}
                                            className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4 text-red-400" />
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
                                aria-label="Close preview"
                            >
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="w-full h-px bg-gray-100" />

                    {/* Current Stage Deadline Display */}
                    {(() => {
                        const currentDl = deal.stage_deadlines?.find(
                            dl => dl.stage_code === deal.stage_code && !dl.is_completed
                        );
                        if (!currentDl?.end_date) return null;
                        const now = new Date();
                        now.setHours(0, 0, 0, 0);
                        const end = new Date(currentDl.end_date);
                        end.setHours(0, 0, 0, 0);
                        const start = currentDl.start_date ? new Date(currentDl.start_date) : null;
                        const daysUntil = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                        const fmtOpts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
                        const startStr = start ? start.toLocaleDateString('en-US', fmtOpts) : '';
                        const endStr = end.toLocaleDateString('en-US', fmtOpts);

                        let statusBadge;
                        if (daysUntil < 0) {
                            statusBadge = <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-red-100 text-red-700">Overdue</span>;
                        } else if (daysUntil <= 3) {
                            statusBadge = <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-100 text-amber-700">Due Soon</span>;
                        } else {
                            statusBadge = <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-green-100 text-green-700">On Track</span>;
                        }

                        return (
                            <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 rounded-[3px]">
                                <CalendarDays className="w-4 h-4 text-gray-400 shrink-0" />
                                <div className="flex items-center gap-2 text-[13px]">
                                    <span className="font-medium text-gray-700">Stage {deal.stage_code}</span>
                                    <span className="text-gray-400">·</span>
                                    <span className="text-gray-600">{startStr}{startStr ? ' – ' : ''}{endStr}</span>
                                </div>
                                {statusBadge}
                            </div>
                        );
                    })()}

                    {/* Details Section - Two Columns */}
                    <div className="flex justify-between gap-10">
                        {/* Left Column - Investor/Buyer Details */}
                        <div className="flex-1 flex flex-col gap-4">
                            <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Investor Details</p>

                            {/* Budget */}
                            <div className="flex items-center gap-4">
                                <span className="text-[13px] text-gray-500 leading-5" style={{ width: 110 }}>Budget</span>
                                <span className="text-[14px] font-semibold text-gray-900 leading-5">{budgetDisplay}</span>
                            </div>

                            {/* Target Country */}
                            <div className="flex items-start gap-4">
                                <span className="text-[13px] text-gray-500 leading-5" style={{ width: 110 }}>Target Country</span>
                                <div className="flex flex-col gap-1">
                                    {targetCountries.length > 0 ? targetCountries.map((c, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            {c.svg_icon_url ? (
                                                <img src={c.svg_icon_url} alt={c.name} className="w-4 h-3 object-cover rounded-sm" />
                                            ) : (
                                                <span className="text-xs">🏳️</span>
                                            )}
                                            <span className="text-[14px] text-gray-900 leading-5">{c.name}</span>
                                        </div>
                                    )) : (
                                        <span className="text-[14px] text-gray-900 leading-5">Not Specified</span>
                                    )}
                                </div>
                            </div>

                        </div>

                        {/* Right Column - Target/Seller Details */}
                        <div className="flex-1 flex flex-col gap-4">
                            <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Target Details</p>

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
                className="h-12 px-6 bg-white rounded-b-[3px] flex items-center justify-between border-t-0"
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
                            <span className="text-[13px] font-medium text-white">Chats</span>
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
