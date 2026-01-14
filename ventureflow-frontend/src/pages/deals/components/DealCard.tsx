import { useDraggable } from '@dnd-kit/core';
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
                {/* View indicator badge */}
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${pipelineView === 'buyer'
                    ? 'bg-blue-50 text-[#064771]'
                    : 'bg-green-50 text-green-600'
                    }`}>
                    {pipelineView === 'buyer' ? 'B' : 'S'}
                </span>
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
                    <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        {deal.comment_count}
                    </span>
                    <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        {deal.attachment_count}
                    </span>
                </div>
                <span className="truncate">
                    {new Date(deal.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
            </div>
        </div>
    );
};

export default DealCard;

