/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { MoreVertical, MessageSquare, Clock, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { Trash2 } from 'lucide-react';
import { getCurrencySymbol, formatCompactNumber } from '../../../utils/formatters';
import { Deal } from '../DealPipeline';

interface DealCardProps {
    deal: Deal;
    isDragging?: boolean;
    onClick?: () => void;
    onMove?: (deal: Deal, direction: 'forward' | 'backward') => void;
    onMarkLost?: (deal: Deal) => void;
    onDelete?: (deal: Deal) => void;
    pipelineView?: 'buyer' | 'seller';
}

const DealCard = ({ deal, isDragging: isDraggingProp = false, onClick, onMove, onMarkLost, onDelete, pipelineView = 'buyer' }: DealCardProps) => {
    const { attributes, listeners, setNodeRef, isDragging: isBeingDragged } = useDraggable({
        id: deal.id,
    });

    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // When using DragOverlay, the original card stays in place but fades.
    // The overlay handles the cursor-following visual.
    const style: React.CSSProperties | undefined = isBeingDragged
        ? { opacity: 0.3, cursor: 'grabbing', transition: 'opacity 200ms ease' }
        : { transition: 'opacity 200ms ease, transform 200ms ease' };

    const formatValue = (value: number | string | null, currency: string) => {
        if (!value) return 'N/A';
        const num = typeof value === 'string' ? parseFloat(value) : value;
        const symbol = getCurrencySymbol(currency);
        return `${symbol}${formatCompactNumber(num)}`;
    };

    // Get shareholding ratio (majority percentage)
    const getShareholdingRatio = (): string => {
        const ratio = (deal as any).shareholding_ratio || (deal as any).share_ratio;
        if (ratio) return ratio;
        // Fallback to seller financial details if available
        const sellerRatio = deal.seller?.financial_details?.maximum_investor_shareholding_percentage;
        if (sellerRatio) return sellerRatio;
        return '';
    };

    // Get priority label and color
    const getPriorityInfo = () => {
        const priority = deal.priority || 'medium';
        const priorityMap: Record<string, { label: string; color: string }> = {
            low: { label: 'Low', color: '#9CA3AF' },
            medium: { label: 'Medium', color: '#064771' },
            high: { label: 'High', color: '#DC2626' },
        };
        return priorityMap[priority] || priorityMap.medium;
    };

    const buyerName = deal.buyer?.company_overview?.reg_name || (deal.buyer_id ? 'Unknown Buyer' : 'Investor TBD');
    const sellerName = deal.seller?.company_overview?.reg_name || (deal.seller_id ? 'Unknown Seller' : 'Target TBD');
    const buyerImage = deal.buyer?.image;
    const sellerImage = deal.seller?.image;

    // For buyer view: show buyer acquiring seller
    // For seller view: show seller being acquired by buyer
    const primaryEntity = pipelineView === 'buyer' ? buyerName : sellerName;
    const secondaryEntity = pipelineView === 'buyer' ? sellerName : buyerName;
    const primaryImage = pipelineView === 'buyer' ? buyerImage : sellerImage;
    const secondaryImage = pipelineView === 'buyer' ? sellerImage : buyerImage;

    // Dynamic deal type label from deal data
    const getDealTypeLabel = (): string => {
        const type = (deal as any).deal_type || 'acquisition';
        const labels: Record<string, { buyer: string; seller: string }> = {
            acquisition: { buyer: 'Acquisition', seller: 'Divestiture' },
            merger: { buyer: 'Merger', seller: 'Merger' },
            joint_venture: { buyer: 'Joint Venture', seller: 'Joint Venture' },
            strategic_investment: { buyer: 'Strategic Investment', seller: 'Capital Raise' },
            minority_stake: { buyer: 'Minority Acquisition', seller: 'Minority Divestiture' },
            majority_stake: { buyer: 'Majority Acquisition', seller: 'Majority Divestiture' },
            buyout: { buyer: 'Buyout', seller: 'Sell-out' },
            partnership: { buyer: 'Partnership', seller: 'Partnership' },
            management_buyout: { buyer: 'MBO', seller: 'MBO' },
            leveraged_buyout: { buyer: 'LBO', seller: 'LBO' },
            // Legacy value fallback
            acquiring: { buyer: 'Acquisition', seller: 'Divestiture' },
        };
        const pair = labels[type] || labels.acquisition;
        return pipelineView === 'buyer' ? pair.buyer : pair.seller;
    };
    const relationLabel = getDealTypeLabel();

    const priorityInfo = getPriorityInfo();
    const shareholdingRatio = getShareholdingRatio();
    const dealValue = formatValue((deal as any).ticket_size || deal.estimated_ev_value, deal.estimated_ev_currency);

    // Get base URL for images
    const getImageUrl = (imagePath: string | undefined): string | null => {
        if (!imagePath) return null;
        if (imagePath.startsWith('http')) return imagePath;
        const baseURL = import.meta.env.VITE_API_BASE_URL || '';
        return `${baseURL}/storage/${imagePath.replace(/^\//, '')}`;
    };

    const primaryImageUrl = getImageUrl(primaryImage);
    const secondaryImageUrl = getImageUrl(secondaryImage);

    // Generate avatar color — consistent across all views
    const getAvatarColor = (isPrimary: boolean) => {
        if (isPrimary) {
            return { bg: '#F2B200', text: '#3E2C06' };  // Gold for primary
        }
        return { bg: '#030042', text: '#FFFFFF' }; // Dark blue for secondary
    };

    const primaryColor = getAvatarColor(true);
    const secondaryColor = getAvatarColor(false);

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={`inline-flex flex-col w-full cursor-grab active:cursor-grabbing transition-opacity duration-200 ${isDraggingProp ? 'shadow-2xl scale-[1.02]' : ''}`}
        >
            {/* Main Card Body */}
            <div
                onClick={onClick}
                className="flex flex-col gap-2 px-3 py-3 bg-white rounded-t-[3px] border border-[#E5E7EB]"
                style={{ boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)' }}
            >
                {/* Primary Entity Row */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        {/* Primary Avatar */}
                        <div
                            className="w-7 h-7 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
                            style={{ backgroundColor: primaryColor.bg }}
                        >
                            {primaryImageUrl ? (
                                <img
                                    src={primaryImageUrl}
                                    alt={primaryEntity}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                            ) : (
                                <span
                                    className="text-xs font-medium"
                                    style={{ color: primaryColor.text }}
                                >
                                    {primaryEntity.substring(0, 2).toUpperCase()}
                                </span>
                            )}
                        </div>
                        {/* Primary Name */}
                        <div className="flex-1 min-w-0 overflow-hidden">
                            <span className="text-xs font-medium text-[#111827] leading-4 truncate block">
                                {primaryEntity}
                            </span>
                        </div>
                    </div>
                    {/* 3-Dot Menu */}
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowMenu(!showMenu);
                            }}
                            className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded"
                            title="Deal options"
                            aria-label="Deal options"
                        >
                            <MoreVertical className="w-4 h-4 text-gray-400" />
                        </button>
                        {showMenu && (
                            <div className="absolute right-0 mt-1 w-32 bg-white border rounded shadow-lg z-50 py-1">
                                {deal.status === 'active' && (
                                    <>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onMove?.(deal, 'forward'); setShowMenu(false); }}
                                            className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 flex items-center gap-2"
                                        >
                                            Move Forward
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onMove?.(deal, 'backward'); setShowMenu(false); }}
                                            className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 flex items-center gap-2"
                                        >
                                            Move Backward
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onMarkLost?.(deal); setShowMenu(false); }}
                                            className="w-full text-left px-3 py-1.5 text-xs hover:bg-red-50 text-red-600 flex items-center gap-2"
                                        >
                                            Mark as Lost
                                        </button>
                                    </>
                                )}
                                <button className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 flex items-center gap-2 border-t">
                                    View Details
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDelete?.(deal); setShowMenu(false); }}
                                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-red-50 text-red-600 flex items-center gap-2 border-t"
                                >
                                    <Trash2 className="w-3 h-3" />
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Relation Label */}
                <div className="text-xs text-[#6B7280] leading-4">
                    {relationLabel}
                </div>

                {/* Secondary Entity Row */}
                <div className="flex items-center gap-1.5">
                    {/* Secondary Avatar */}
                    <div
                        className="w-7 h-7 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
                        style={{ backgroundColor: secondaryColor.bg }}
                    >
                        {secondaryImageUrl ? (
                            <img
                                src={secondaryImageUrl}
                                alt={secondaryEntity}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                        ) : (
                            <span
                                className="text-xs font-medium"
                                style={{ color: secondaryColor.text }}
                            >
                                {secondaryEntity.substring(0, 2).toUpperCase()}
                            </span>
                        )}
                    </div>
                    {/* Secondary Name */}
                    <div className="flex-1 min-w-0 overflow-hidden">
                        <span className="text-xs font-medium text-[#111827] leading-4 truncate block">
                            {secondaryEntity}
                        </span>
                    </div>
                </div>

                {/* Deal Value & Priority Row */}
                <div className="flex items-end justify-between mt-6">
                    <div className="flex flex-col gap-1">
                        {shareholdingRatio && (
                            <span className="text-xs text-gray-500">{shareholdingRatio}</span>
                        )}
                        <span className="text-sm font-medium text-[#111827] leading-5">{dealValue}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Download className="w-4 h-4" style={{ color: priorityInfo.color }} />
                        <span
                            className="text-xs font-medium"
                            style={{ color: priorityInfo.color }}
                        >
                            {priorityInfo.label}
                        </span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div
                className="flex items-center justify-between px-3 h-[30px] bg-white rounded-b-[3px] border-l border-r border-b border-[#E5E7EB]"
            >
                {/* Left: Comment count & navigation */}
                <div className="flex items-center gap-1.5">
                    {/* Comment Badge */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if ((deal as any).onChatClick) (deal as any).onChatClick(deal);
                        }}
                        className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#064771] text-white"
                    >
                        <MessageSquare className="w-4 h-4" />
                        <span className="text-xs font-medium">{deal.comment_count || 0}</span>
                        {deal.has_new_activity && (
                            <span className="w-2 h-2 bg-red-500 rounded-full ml-1" />
                        )}
                    </button>
                    {/* Navigation Arrows */}
                    <button
                        onClick={(e) => { e.stopPropagation(); onMove?.(deal, 'backward'); }}
                        className="p-0.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
                        title="Move Backward"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onMove?.(deal, 'forward'); }}
                        className="p-0.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
                        title="Move Forward"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                {/* Right: Date */}
                <div className="flex items-center gap-1 text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs">
                        {new Date(deal.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default DealCard;
