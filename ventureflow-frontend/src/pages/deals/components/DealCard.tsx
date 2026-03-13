/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect } from 'react';
import { useSortable, defaultAnimateLayoutChanges } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { AnimateLayoutChanges } from '@dnd-kit/sortable';
import { MoreVertical, MessageSquare, ChevronLeft, ChevronRight, Pencil } from 'lucide-react';
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
    onEdit?: (deal: Deal) => void;
    pipelineView?: 'buyer' | 'seller';
    activeDealId?: number | null;
}

// Skip layout animation when the item is being actively dragged to prevent jitter
const animateLayoutChanges: AnimateLayoutChanges = (args) => {
    const { isSorting, wasDragging } = args;
    if (isSorting || wasDragging) return defaultAnimateLayoutChanges(args);
    return true;
};

const DealCard = ({ deal, isDragging: isDraggingProp = false, onClick, onMove, onMarkLost, onDelete, onEdit, pipelineView = 'buyer', activeDealId }: DealCardProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging: isBeingDragged,
        isOver,
    } = useSortable({
        id: deal.id,
        animateLayoutChanges,
        transition: {
            duration: 250,
            easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
        },
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

    // Show indicator when another card is being dragged over this card
    const showDropIndicator = isOver && activeDealId != null && activeDealId !== deal.id;

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition: transition || 'transform 250ms cubic-bezier(0.25, 1, 0.5, 1)',
        cursor: isBeingDragged ? 'grabbing' : 'grab',
    };

    const formatValue = (value: number | string | null, currency: string) => {
        if (!value) return 'N/A';
        const num = typeof value === 'string' ? parseFloat(value) : value;
        const symbol = getCurrencySymbol(currency);
        return `${symbol}${formatCompactNumber(num)}`;
    };



    const buyerName = deal.buyer?.company_overview?.reg_name || (deal.buyer_id ? 'To be declared' : 'Undefined');
    const sellerName = deal.seller?.company_overview?.reg_name || (deal.seller_id ? 'To be declared' : 'Undefined');
    const buyerCode = deal.buyer?.buyer_id || '';
    const sellerCode = deal.seller?.seller_id || '';
    const buyerImage = deal.buyer?.image;
    const sellerImage = deal.seller?.image;
    const buyerHqCountry = deal.buyer?.company_overview?.hq_country;
    const sellerHqCountry = deal.seller?.company_overview?.hq_country;
    const buyerCountry = typeof buyerHqCountry === 'object' && buyerHqCountry ? buyerHqCountry : undefined;
    const sellerCountry = typeof sellerHqCountry === 'object' && sellerHqCountry ? sellerHqCountry : undefined;

    // For buyer view: show buyer acquiring seller
    // For seller view: show seller being acquired by buyer
    const primaryEntity = pipelineView === 'buyer' ? buyerName : sellerName;
    const secondaryEntity = pipelineView === 'buyer' ? sellerName : buyerName;
    const primaryCode = pipelineView === 'buyer' ? buyerCode : sellerCode;
    const secondaryCode = pipelineView === 'buyer' ? sellerCode : buyerCode;
    const primaryImage = pipelineView === 'buyer' ? buyerImage : sellerImage;
    const secondaryImage = pipelineView === 'buyer' ? sellerImage : buyerImage;
    const primaryCountry = pipelineView === 'buyer' ? buyerCountry : sellerCountry;
    const secondaryCountry = pipelineView === 'buyer' ? sellerCountry : buyerCountry;

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

    const dealValue = formatValue((deal as any).ticket_size || deal.estimated_ev_value, deal.estimated_ev_currency);

    // Compute deal age in days
    const getDealAge = (): string => {
        if (!deal.created_at) return '';
        const created = new Date(deal.created_at);
        const now = new Date();
        const diffMs = now.getTime() - created.getTime();
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (days === 0) return 'Today';
        if (days === 1) return '1d';
        return `${days}d`;
    };

    // Get stage deadline info for the current stage
    const getStageDeadlineInfo = () => {
        const currentDl = deal.stage_deadlines?.find(
            dl => dl.stage_code === deal.stage_code && !dl.is_completed
        );
        if (!currentDl?.end_date) return { endDate: null, daysUntil: null, status: 'none' as const };
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const end = new Date(currentDl.end_date);
        end.setHours(0, 0, 0, 0);
        const daysUntil = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const status = daysUntil < 0 ? 'overdue' as const : daysUntil <= 3 ? 'due_soon' as const : 'ok' as const;
        return { endDate: currentDl.end_date, daysUntil, status };
    };

    const deadlineInfo = getStageDeadlineInfo();
    const dealAge = getDealAge();

    // Get base URL for images
    const getImageUrl = (imagePath: string | undefined): string | null => {
        if (!imagePath) return null;
        if (imagePath.startsWith('http')) return imagePath;
        const baseURL = '';
        return `${baseURL}/api/files/${imagePath.replace(/^\//, '')}`;
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
            className={`inline-flex flex-col w-full cursor-grab active:cursor-grabbing transition-shadow duration-200 ${isDraggingProp ? 'shadow-2xl scale-[1.02] z-50' : ''} ${isBeingDragged ? 'deal-card-ghost' : ''}`}
        >
            {/* Brand-color drop indicator line */}
            {showDropIndicator && (
                <div className="deal-drop-indicator" />
            )}
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
                        {/* Primary Name + Code */}
                        <div className="flex-1 min-w-0 overflow-hidden">
                            <span className="text-xs font-medium text-[#111827] leading-4 truncate block">
                                {primaryEntity}
                            </span>
                            {primaryCode && (
                                <span className="text-[10px] text-gray-400 leading-3 truncate block flex items-center gap-1">
                                    {primaryCountry?.svg_icon_url && (
                                        <img src={primaryCountry.svg_icon_url} alt="" className="w-3.5 h-2.5 object-cover rounded-[1px] flex-shrink-0" />
                                    )}
                                    {primaryCode}
                                </span>
                            )}
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
                                <button
                                    onClick={(e) => { e.stopPropagation(); onEdit?.(deal); setShowMenu(false); }}
                                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 flex items-center gap-2"
                                >
                                    <Pencil className="w-3 h-3 text-gray-400" />
                                    Edit Deal
                                </button>
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

                {/* Relation Label (deal type only, no investment condition) */}
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
                    {/* Secondary Name + Code */}
                    <div className="flex-1 min-w-0 overflow-hidden">
                        <span className="text-xs font-medium text-[#111827] leading-4 truncate block">
                            {secondaryEntity}
                        </span>
                        {secondaryCode && (
                            <span className="text-[10px] text-gray-400 leading-3 truncate block flex items-center gap-1">
                                {secondaryCountry?.svg_icon_url && (
                                    <img src={secondaryCountry.svg_icon_url} alt="" className="w-3.5 h-2.5 object-cover rounded-[1px] flex-shrink-0" />
                                )}
                                {secondaryCode}
                            </span>
                        )}
                    </div>
                </div>

                {/* Deal Value & Stage Status Row */}
                <div className="flex items-end justify-between mt-6">
                    <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-[#111827] leading-5">{dealValue}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Overdue / Due Soon Badge — moved here from old position */}
                        {deadlineInfo.status === 'overdue' && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-700">
                                Overdue
                            </span>
                        )}
                        {deadlineInfo.status === 'due_soon' && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700">
                                Due Soon
                            </span>
                        )}
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
                        className="relative flex items-center gap-1 px-2 py-0.5 rounded bg-[#064771] text-white"
                    >
                        <MessageSquare className="w-4 h-4" />
                        <span className="text-xs font-medium">{deal.comment_count || 0}</span>
                        {(deal.unread_comment_count ?? 0) > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold border-2 border-white">
                                {deal.unread_comment_count}
                            </span>
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

                {/* Right: Deal age & deadline */}
                <div className="flex items-center gap-1.5 text-gray-400">
                    {dealAge && (
                        <span className="text-[11px] font-medium text-gray-500">{dealAge}</span>
                    )}
                    {deadlineInfo.endDate && (
                        <>
                            <span className="text-[10px] text-gray-300">→</span>
                            <span className={`text-[11px] font-medium ${
                                deadlineInfo.status === 'overdue' ? 'text-red-500' :
                                deadlineInfo.status === 'due_soon' ? 'text-amber-500' :
                                'text-gray-400'
                            }`}>
                                {new Date(deadlineInfo.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DealCard;
