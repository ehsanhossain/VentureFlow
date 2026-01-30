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
    pipelineView?: 'buyer' | 'seller';
}

const StageColumn = ({ code, name, deals, onDealClick, onMove, onMarkLost, pipelineView = 'buyer' }: StageColumnProps) => {
    const { setNodeRef, isOver } = useDroppable({
        id: code,
    });

    return (
        <div className="flex flex-col w-72 shrink-0">
            {/* Column Header */}
            <div className={`flex items-center justify-between px-3 py-2 rounded-t-lg border ${pipelineView === 'buyer'
                ? 'bg-blue-50 border-blue-200'
                : 'bg-green-50 border-green-200'
                }`}>
                <div className="flex items-center gap-2">
                    <span className={`font-semibold ${pipelineView === 'buyer' ? 'text-blue-800' : 'text-green-800'
                        }`}>{code}</span>
                    <span className={`text-sm truncate ${pipelineView === 'buyer' ? 'text-[#064771]' : 'text-green-600'
                        }`}>{name}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${pipelineView === 'buyer'
                    ? 'bg-blue-100 text-[#053a5c]'
                    : 'bg-green-100 text-green-700'
                    }`}>
                    {deals.length}
                </span>
            </div>

            {/* Droppable Area */}
            <div
                ref={setNodeRef}
                className={`flex-1 p-2 space-y-3 border border-t-0 rounded-b-lg min-h-[200px] transition-colors ${isOver
                    ? pipelineView === 'buyer'
                        ? 'bg-blue-50 border-blue-300'
                        : 'bg-green-50 border-green-300'
                    : 'bg-gray-50 border-gray-200'
                    }`}
            >
                {deals.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-sm text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
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
                            pipelineView={pipelineView}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default StageColumn;

