import { useState, useRef, useEffect } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { MoreVertical, MessageSquare, Clock } from 'lucide-react';
import { Deal } from '../DealPipeline';

interface DealCardProps {
    deal: Deal;
    isDragging?: boolean;
    onClick?: () => void;
    pipelineView?: 'buyer' | 'seller';
}

const DealCard = ({ deal, isDragging = false, onClick, pipelineView = 'buyer' }: DealCardProps) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
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

    const style = transform
        ? {
            transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        }
        : undefined;

    const priorityColors = {
        low: 'bg-gray-100 text-gray-600',
        medium: 'bg-yellow-100 text-yellow-700',
        high: 'bg-red-100 text-red-700',
    };


    const formatValue = (value: number | null, currency: string) => {
        if (!value) return 'N/A';
        if (value >= 1000000) {
            return `~$${(value / 1000000).toFixed(0)}M`;
        }
        if (value >= 1000) {
            return `~$${(value / 1000).toFixed(0)}K`;
        }
        return `~${currency}${value}`;
    };

    const buyerName = deal.buyer?.company_overview?.reg_name || 'Unknown Buyer';
    const sellerName = deal.seller?.company_overview?.reg_name || 'Unknown Seller';

    // For buyer view: show buyer acquiring seller
    // For seller view: show seller being acquired by buyer
    const primaryEntity = pipelineView === 'buyer' ? buyerName : sellerName;
    const secondaryEntity = pipelineView === 'buyer' ? sellerName : buyerName;
    const relationLabel = pipelineView === 'buyer' ? 'Acquiring' : 'Being acquired by';

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            onClick={onClick}
            className={`bg-white rounded-lg border shadow-sm p-4 cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md ${isDragging
                ? pipelineView === 'buyer'
                    ? 'shadow-lg opacity-90 ring-2 ring-blue-400'
                    : 'shadow-lg opacity-90 ring-2 ring-green-400'
                : ''
                }`}
        >
            {/* Primary Entity Info */}
            <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${pipelineView === 'buyer'
                    ? 'bg-blue-100 text-[#064771]'
                    : 'bg-green-100 text-green-600'
                    }`}>
                    {primaryEntity.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{primaryEntity}</div>
                </div>
                <div className="flex items-center gap-1">
                    {/* View indicator badge */}
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${pipelineView === 'buyer'
                        ? 'bg-blue-50 text-[#064771]'
                        : 'bg-green-50 text-green-600'
                        }`}>
                        {pipelineView === 'buyer' ? 'B' : 'S'}
                    </span>
                    {/* 3-dot Menu */}
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowMenu(!showMenu);
                            }}
                            className="p-1 hover:bg-gray-100 rounded text-gray-400"
                        >
                            <MoreVertical className="w-4 h-4" />
                        </button>
                        {showMenu && (
                            <div className="absolute right-0 mt-1 w-32 bg-white border rounded shadow-lg z-50 py-1">
                                <button className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 flex items-center gap-2">
                                    View Details
                                </button>
                                <button className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 flex items-center gap-2">
                                    Edit Deal
                                </button>
                                <button className="w-full text-left px-3 py-1.5 text-xs hover:bg-red-50 text-red-600 flex items-center gap-2">
                                    Archive
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Relationship label + Secondary Entity */}
            <div className="text-xs text-gray-500 mb-2">
                {relationLabel} <span className="font-medium text-gray-700">{secondaryEntity}</span>
            </div>

            {/* Deal Info */}
            <div className="space-y-1 text-xs text-gray-600 mb-3">
                {deal.industry && (
                    <div className="truncate">Industry: {deal.industry}</div>
                )}
                <div className="font-medium text-gray-800">
                    {formatValue(deal.estimated_ev_value, deal.estimated_ev_currency)}
                </div>
                {deal.pic && (
                    <div className="truncate">
                        PIC: {deal.pic.name}
                        {deal.target_close_date && ` / Target: ${new Date(deal.target_close_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`}
                    </div>
                )}
            </div>

            {/* Priority Badge */}
            <div className="flex items-center justify-between mb-3">
                <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${priorityColors[deal.priority]}`}>
                    {deal.priority}
                </span>
            </div>

            {/* Progress Bar */}
            <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>{deal.progress_percent}%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all ${pipelineView === 'buyer' ? 'bg-blue-500' : 'bg-green-500'
                            }`}
                        style={{ width: `${deal.progress_percent}%` }}
                    />
                </div>
            </div>

            {/* Footer Icons */}
            <div className="flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center gap-3">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            // This will be handled by the parent
                            if (deal.onChatClick) deal.onChatClick(deal);
                        }}
                        className="flex items-center gap-1 hover:text-[#064771] transition-colors relative"
                    >
                        <MessageSquare className="w-4 h-4" />
                        {deal.comment_count}
                        {/* Notification Dot */}
                        {deal.has_new_activity && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white" />
                        )}
                    </button>
                </div>
                <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(deal.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
            </div>
        </div>
    );
};

export default DealCard;

