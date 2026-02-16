import { useDroppable } from '@dnd-kit/core';
import { Deal } from '../DealPipeline';
import DealCard from './DealCard';

interface StageColumnProps {
    code: string;
    name: string;
    deals: Deal[];
    onDealClick?: (deal: Deal) => void;
    onMove?: (deal: Deal, direction: 'forward' | 'backward') => void;
    onMarkLost?: (deal: Deal) => void;
    onDelete?: (deal: Deal) => void;
    pipelineView?: 'buyer' | 'seller';
}

const StageColumn = ({ code, name, deals, onDealClick, onMove, onMarkLost, onDelete, pipelineView = 'buyer' }: StageColumnProps) => {
    const { setNodeRef, isOver } = useDroppable({
        id: code,
    });

    return (
        <div className="flex flex-col w-72 shrink-0">
            {/* Column Header */}
            <div className="flex items-center justify-between px-2 h-[42px] bg-[#F0F4F7] rounded-t-[3px]">
                <div className="flex-1 flex items-center gap-2.5 min-w-0">
                    <div className="inline-flex items-center justify-center px-2 py-1 bg-white rounded-[3px] border border-[#E5E7EB] shrink-0">
                        <span className="text-[12px] font-bold text-[#1C2536] leading-[14px] text-center">{code}</span>
                    </div>
                    <span className="text-sm font-medium text-[#1C2536] leading-[21px] truncate">{name}</span>
                </div>
                <div className="inline-flex items-center justify-center px-2 py-1 rounded-[3px] shrink-0 bg-[#064771]">
                    <span className="text-[12px] font-bold text-white leading-[14px] text-center">{deals.length}</span>
                </div>
            </div>

            {/* Droppable Area */}
            <div
                ref={setNodeRef}
                className={`flex-1 p-2 space-y-3 rounded-b-[3px] min-h-[200px] transition-all duration-200 border-l border-r border-b ${isOver
                    ? 'bg-blue-50 border-blue-300'
                    : 'bg-[#F9FAFB] border-[#E5E7EB]'
                    }`}
            >
                {deals.length === 0 ? (
                    <div className="flex items-center justify-center w-full h-[196px] text-xs text-gray-400 border-2 border-dashed border-gray-200 rounded-[3px]">
                        No deals in this stage
                    </div>
                ) : (
                    deals.map((deal) => (
                        <DealCard
                            key={deal.id}
                            deal={deal}
                            onClick={() => onDealClick?.(deal)}
                            onMove={onMove}
                            onMarkLost={onMarkLost}
                            onDelete={onDelete}
                            pipelineView={pipelineView}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default StageColumn;
