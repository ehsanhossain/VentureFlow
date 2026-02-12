/* eslint-disable react/prop-types */
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { GripVertical } from 'lucide-react';
import { cn } from '../../utils/cn';

// Custom table icons from Figma
import SortDefaultIcon from '../../assets/icons/table/sort-default.svg';
import SortAscIcon from '../../assets/icons/table/sort-asc.svg';
import SortDescIcon from '../../assets/icons/table/sort-desc.svg';
import CheckboxDefaultIcon from '../../assets/icons/table/checkbox-default.svg';
import CheckboxSomeIcon from '../../assets/icons/table/checkbox-some.svg';
import CheckboxAllIcon from '../../assets/icons/table/checkbox-all.svg';
import RowUncheckedIcon from '../../assets/icons/table/row-unchecked.svg';
import RowCheckedIcon from '../../assets/icons/table/row-checked.svg';

// ============ TYPE DEFINITIONS ============
export interface DataTableColumn<T> {
    id: string;
    header: string | React.ReactNode;
    accessor: keyof T | ((row: T) => React.ReactNode);
    width?: number;
    minWidth?: number;
    sortable?: boolean;
    sticky?: 'left' | 'right';
    draggable?: boolean;
    className?: string;
    headerClassName?: string;
    cellClassName?: string;
    textAccessor?: (row: T) => string; // Helper for auto-sizing logic when accessor returns JSX
}

export interface DataTableProps<T> {
    data: T[];
    columns: DataTableColumn<T>[];
    isLoading?: boolean;
    emptyMessage?: string;
    emptyIcon?: React.ReactNode;
    emptyAction?: React.ReactNode;
    onRowClick?: (row: T, index: number) => void;
    onRowContextMenu?: (e: React.MouseEvent, row: T, index: number) => void;
    rowClassName?: (row: T, index: number) => string;
    getRowId?: (row: T) => string | number;
    sortConfig?: { key: string; direction: 'asc' | 'desc' | null };
    onSortChange?: (key: string, direction: 'asc' | 'desc' | null) => void;
    stickyHeader?: boolean;
    columnOrder?: string[];
    onColumnOrderChange?: (newOrder: string[]) => void;
    columnWidths?: Record<string, number>;
    onColumnWidthChange?: (columnId: string, width: number) => void;
    className?: string;
    containerClassName?: string;
    // Selection
    selectedIds?: Set<string | number>;
    onSelectionChange?: (ids: Set<string | number>) => void;
    selectable?: boolean;
    selectColumn?: React.ReactNode;
    // Header slot for checkbox/actions
    headerSelectSlot?: React.ReactNode;
    // Actions column
    actionsColumn?: (row: T, index: number) => React.ReactNode;
    actionsColumnWidth?: number;
    // Pagination
    pagination?: {
        currentPage: number;
        totalPages: number;
        onPageChange: (page: number) => void;
        totalItems?: number;
        itemsPerPage?: number;
    };
}

// ============ UTILITY COMPONENTS ============
const ResizeHandle: React.FC<{
    onMouseDown: (e: React.MouseEvent) => void;
    onDoubleClick?: (e: React.MouseEvent) => void;
    isResizing?: boolean;
}> = ({ onMouseDown, onDoubleClick, isResizing }) => (
    <div
        className={cn(
            'absolute right-0 top-0 h-full w-[5px] cursor-col-resize',
            'select-none z-20 group/handle transition-all duration-200',
            'hover:w-[7px]',
            isResizing && 'w-[7px]'
        )}
        onMouseDown={onMouseDown}
        onDoubleClick={onDoubleClick}
    >
        {/* Full-height line — only visible when actively resizing */}
        {isResizing && (
            <div className="absolute right-0 top-0 h-full w-[1px] bg-[#064771]" />
        )}
        {/* The pill-shaped grab indicator (semi-transparent at rest, full on hover) */}
        <div className={cn(
            'absolute right-[-1px] top-1/2 -translate-y-1/2 h-8 w-[3px]',
            'bg-[#064771] rounded-full opacity-0 group-hover/handle:opacity-100',
            'transition-all shadow-[0_0_10px_rgba(6,71,113,0.3)]',
            isResizing && 'opacity-100'
        )} />
    </div>
);

const SortIcon: React.FC<{ direction: 'asc' | 'desc' | null }> = ({ direction }) => {
    if (direction === 'asc') return <img src={SortAscIcon} alt="" className="w-4 h-4" draggable={false} />;
    if (direction === 'desc') return <img src={SortDescIcon} alt="" className="w-4 h-4" draggable={false} />;
    return <img src={SortDefaultIcon} alt="" className="w-4 h-4 opacity-50 group-hover/header:opacity-80 transition-opacity" draggable={false} />;
};

const DragHandle: React.FC<{ isDragging?: boolean }> = ({ isDragging }) => (
    <div className={cn(
        'w-4 h-4 text-gray-400 opacity-0 group-hover/header:opacity-100 transition-opacity cursor-grab flex items-center justify-center',
        isDragging && 'opacity-100 text-[#064771] cursor-grabbing'
    )}>
        <GripVertical className="w-3.5 h-3.5" />
    </div>
);

// ============ LOADING SKELETON ============
const LoadingSkeleton: React.FC<{ columns: number; rows?: number }> = ({ columns, rows = 8 }) => (
    <>
        {Array.from({ length: rows }).map((_, i) => (
            <tr key={`skeleton-${i}`} className="h-14 animate-pulse border-b border-[#f1f5f9]">
                {Array.from({ length: columns }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                        <div className="h-4 rounded bg-gray-100/60 w-full" />
                    </td>
                ))}
            </tr>
        ))}
    </>
);

// ============ EMPTY STATE ============
const EmptyState: React.FC<{
    message?: string;
    icon?: React.ReactNode;
    emptyAction?: React.ReactNode;
    colSpan: number;
}> = ({ message = 'No Data Found', colSpan, emptyAction }) => (
    <tr>
        <td colSpan={colSpan} className="h-[calc(100vh-320px)] min-h-[320px] border-b border-[#f1f5f9] p-0">
            <div className="sticky left-0 w-[calc(100vw-80px)] flex items-center justify-center">
                <div className="flex flex-col items-center justify-center gap-2 py-12">
                    <img
                        src="/images/no-records-found.png"
                        alt="No records found"
                        className="w-36 h-auto mb-2"
                        draggable={false}
                    />
                    <p className="text-lg font-medium text-gray-700 ">{message}</p>
                    <p className="text-sm text-gray-400  text-center max-w-[320px]">
                        We couldn't find any results matching your search or filters.
                        Would you like to register a new prospect instead?
                    </p>
                    {emptyAction && (
                        <div className="mt-4">
                            {emptyAction}
                        </div>
                    )}
                </div>
            </div>
        </td>
    </tr>
);

// ============ MAIN DATATABLE COMPONENT ============
function DataTable<T>({
    data,
    columns,
    isLoading = false,
    emptyMessage,
    emptyIcon,
    emptyAction,
    onRowClick,
    onRowContextMenu,
    rowClassName,
    getRowId,
    sortConfig,
    onSortChange,
    stickyHeader = true,
    columnOrder: externalColumnOrder,
    onColumnOrderChange,
    columnWidths: externalColumnWidths,
    onColumnWidthChange,
    className,
    containerClassName,
    selectedIds,
    onSelectionChange,
    selectable = false,
    // selectColumn, // Removed as per instruction
    // headerSelectSlot, // Removed as per instruction
    actionsColumn,
    actionsColumnWidth = 80,
    pagination,
}: DataTableProps<T>) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scrolledLeft, setScrolledLeft] = useState(0);

    // ============ COLUMN ORDER STATE ============
    const [internalColumnOrder, setInternalColumnOrder] = useState<string[]>(
        columns.map(c => c.id)
    );

    // Sync internal column order when columns prop changes (e.g. toggling visibility)
    useEffect(() => {
        const currentColIds = new Set(columns.map(c => c.id));
        setInternalColumnOrder(prev => {
            // Keep existing order for columns that still exist
            const kept = prev.filter(id => currentColIds.has(id));
            // Add any new columns that weren't in the previous order
            const keptSet = new Set(kept);
            const added = columns.filter(c => !keptSet.has(c.id)).map(c => c.id);
            const merged = [...kept, ...added];
            // Only update if actually changed to avoid unnecessary re-renders
            if (merged.length === prev.length && merged.every((id, i) => prev[i] === id)) {
                return prev;
            }
            return merged;
        });
    }, [columns]);

    const columnOrder = externalColumnOrder || internalColumnOrder;

    // ============ COLUMN WIDTHS STATE ============
    const defaultWidths = useMemo(() => {
        const widths: Record<string, number> = {};
        columns.forEach(col => {
            if (col.width) {
                widths[col.id] = col.width;
            } else if (typeof col.header === 'string') {
                // Estimate width based on header text (approx 8px per char + padding/icons)
                widths[col.id] = Math.max(80, (col.header.length * 8.5) + 60);
            } else {
                widths[col.id] = 150;
            }
        });
        return widths;
    }, [columns]);

    const [internalColumnWidths, setInternalColumnWidths] = useState<Record<string, number>>(defaultWidths);

    // Sync widths when columns change — add widths for new columns, clean up removed ones
    useEffect(() => {
        setInternalColumnWidths(prev => {
            const merged = { ...prev };
            let changed = false;
            // Add defaults for any new columns
            for (const [id, width] of Object.entries(defaultWidths)) {
                if (!(id in merged)) {
                    merged[id] = width;
                    changed = true;
                }
            }
            return changed ? merged : prev;
        });
    }, [defaultWidths]);

    const columnWidths = externalColumnWidths || internalColumnWidths;

    // Synchronize CSS variables for widths
    useEffect(() => {
        if (!containerRef.current) return;
        Object.entries(columnWidths).forEach(([id, width]) => {
            containerRef.current?.style.setProperty(`--col-width-${id}`, `${width}px`);
        });
    }, [columnWidths]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        setScrolledLeft(e.currentTarget.scrollLeft);
    };

    // ============ RESIZING STATE ============
    const [resizingColumn, setResizingColumn] = useState<string | null>(null);
    const resizeStartX = useRef<number>(0);
    const resizeStartWidth = useRef<number>(0);
    const currentResizedWidth = useRef<number>(0);

    // ============ AUTO-FIT COLUMN ============
    const handleAutoFit = useCallback((columnId: string) => {
        const column = columns.find(c => c.id === columnId);
        if (!column) return;

        // Approximate calculation - in real app would use canvas measureText
        let maxWidth = 80;
        if (typeof column.header === 'string') {
            maxWidth = Math.max(maxWidth, column.header.length * 8.5 + 40);
        }

        data.forEach(row => {
            let val = '';

            // Priority 1: Use specific textAccessor if available (best for JSX columns)
            if (column.textAccessor) {
                val = column.textAccessor(row);
            }
            // Priority 2: Use accessor if it's a string
            else if (typeof column.accessor === 'function') {
                const result = column.accessor(row);
                if (typeof result === 'string' || typeof result === 'number') {
                    val = String(result);
                }
                // If it returns an object/JSX, we skip unless textAccessor provided
            }
            // Priority 3: Direct property access
            else {
                val = String(row[column.accessor as keyof T] || '');
            }

            if (val) {
                // improved calculation: approx 7-8px per char for normal font
                maxWidth = Math.max(maxWidth, val.length * 8 + 32);
            }
        });

        const finalWidth = Math.min(600, maxWidth);
        if (onColumnWidthChange) {
            onColumnWidthChange(columnId, finalWidth);
        } else {
            setInternalColumnWidths(prev => ({ ...prev, [columnId]: finalWidth }));
        }
    }, [data, columns, onColumnWidthChange]);

    // ============ SELECT ALL LOGIC ============
    const isAllSelected = data.length > 0 && Array.from(selectedIds || []).length >= data.length;
    const isSomeSelected = Array.from(selectedIds || []).length > 0 && !isAllSelected;

    const toggleSelectAll = useCallback(() => {
        if (!onSelectionChange) return;
        if (isAllSelected) {
            onSelectionChange(new Set());
        } else {
            const allIds = data.map((row, idx) => {
                const id = getRowId ? getRowId(row) : idx;
                return typeof id === 'string' ? String(id) : Number(id);
            });
            onSelectionChange(new Set(allIds as any));
        }
    }, [data, isAllSelected, onSelectionChange, getRowId]);

    // ============ DRAG & DROP STATE ============
    const [draggingColumn, setDraggingColumn] = useState<string | null>(null);
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

    // ============ RESIZE HANDLERS ============
    const handleResizeStart = useCallback((e: React.MouseEvent, columnId: string) => {
        e.preventDefault();
        e.stopPropagation();
        setResizingColumn(columnId);
        resizeStartX.current = e.pageX;
        resizeStartWidth.current = columnWidths[columnId] || 150;
        currentResizedWidth.current = resizeStartWidth.current;
    }, [columnWidths]);

    useEffect(() => {
        if (!resizingColumn) return;

        const handleMouseMove = (e: MouseEvent) => {
            const delta = e.pageX - resizeStartX.current;
            const col = columns.find(c => c.id === resizingColumn);
            const minWidth = col?.minWidth || 40;
            const newWidth = Math.max(minWidth, resizeStartWidth.current + delta);

            // Directly update CSS variable for zero-latency resizing
            containerRef.current?.style.setProperty(`--col-width-${resizingColumn}`, `${newWidth}px`);
            currentResizedWidth.current = newWidth;
        };

        const handleMouseUp = () => {
            const finalWidth = currentResizedWidth.current;
            if (onColumnWidthChange) {
                onColumnWidthChange(resizingColumn, finalWidth);
            } else {
                setInternalColumnWidths(prev => ({ ...prev, [resizingColumn]: finalWidth }));
            }
            setResizingColumn(null);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [resizingColumn, columns, onColumnWidthChange]);

    // ============ DRAG & DROP HANDLERS ============
    const handleDragStart = useCallback((e: React.DragEvent, columnId: string) => {
        setDraggingColumn(columnId);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', columnId);
        e.dataTransfer.setDragImage(new Image(), 0, 0);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent, columnId: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (columnId !== draggingColumn && draggingColumn) {
            setDragOverColumn(columnId);
        }
    }, [draggingColumn]);

    const handleDragEnd = useCallback(() => {
        setDraggingColumn(null);
        setDragOverColumn(null);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent, targetColumnId: string) => {
        e.preventDefault();
        const sourceColumnId = e.dataTransfer.getData('text/plain');

        if (sourceColumnId && sourceColumnId !== targetColumnId) {
            const newOrder = [...columnOrder];
            const sourceIndex = newOrder.indexOf(sourceColumnId);
            const targetIndex = newOrder.indexOf(targetColumnId);

            newOrder.splice(sourceIndex, 1);
            newOrder.splice(targetIndex, 0, sourceColumnId);

            if (onColumnOrderChange) {
                onColumnOrderChange(newOrder);
            } else {
                setInternalColumnOrder(newOrder);
            }
        }

        setDraggingColumn(null);
        setDragOverColumn(null);
    }, [columnOrder, onColumnOrderChange]);

    // ============ SORT HANDLER ============
    const handleSort = useCallback((columnId: string) => {
        if (!onSortChange) return;

        const currentDirection = sortConfig?.key === columnId ? sortConfig.direction : null;
        let newDirection: 'asc' | 'desc' | null = 'asc';

        if (currentDirection === 'asc') newDirection = 'desc';
        else if (currentDirection === 'desc') newDirection = null;

        onSortChange(columnId, newDirection);
    }, [sortConfig, onSortChange]);

    // ============ ORDERED COLUMNS ============
    const orderedColumns = useMemo(() => {
        const colMap = new Map(columns.map(c => [c.id, c]));
        return columnOrder
            .map(id => colMap.get(id))
            .filter((c): c is DataTableColumn<T> => c !== undefined);
    }, [columns, columnOrder]);

    const stickyLeftOffset = selectable ? 50 : 0;

    // ============ RENDER CELL VALUE ============
    const renderCellValue = useCallback((column: DataTableColumn<T>, row: T): React.ReactNode => {
        if (typeof column.accessor === 'function') {
            return column.accessor(row);
        }
        const value = row[column.accessor as keyof T];
        if (value === null || value === undefined) return '-';
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
    }, []);

    const totalColumns = orderedColumns.length + (selectable ? 1 : 0) + (actionsColumn ? 1 : 0);

    return (
        <div
            ref={containerRef}
            className={cn(
                'w-full h-full flex flex-col min-h-0 bg-white rounded-[3px] overflow-hidden border border-gray-200',
                containerClassName
            )}
        >
            <div
                className="flex-1 overflow-auto scrollbar-premium"
                onScroll={handleScroll}
            >
                <table className={cn(
                    'w-full table-fixed border-collapse',
                    className
                )}>
                    <thead className={cn(
                        stickyHeader && 'sticky top-0 z-20',
                        'bg-[#f1f5f9] shadow-[0_1px_2px_rgba(0,0,0,0.05)]'
                    )}>
                        <tr className="table-header-row h-12">
                            {selectable && (
                                <th className={cn(
                                    "w-[50px] text-center sticky top-0 left-0 z-50 p-2 border-b border-[#cbd5e1] transition-shadow bg-[#f1f5f9]",
                                    scrolledLeft > 0 && "shadow-[2px_0_5px_rgba(0,0,0,0.05)]"
                                )}>
                                    <div className="flex items-center justify-center">
                                        <button
                                            type="button"
                                            onClick={toggleSelectAll}
                                            className="flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                                            style={{ width: 28, height: 28 }}
                                        >
                                            <img
                                                src={isAllSelected ? CheckboxAllIcon : isSomeSelected ? CheckboxSomeIcon : CheckboxDefaultIcon}
                                                alt=""
                                                style={{ width: 28, height: 28 }}
                                                draggable={false}
                                            />
                                        </button>
                                    </div>
                                </th>
                            )}

                            {orderedColumns.map((column) => {
                                const isSortable = column.sortable !== false && onSortChange;
                                const isCurrentSort = sortConfig?.key === column.id;
                                const isDragging = draggingColumn === column.id;
                                const isDragOver = dragOverColumn === column.id;
                                const canDrag = column.draggable !== false;
                                const isStickyLeft = column.sticky === 'left';
                                const stickyLeftStyle = isStickyLeft ? { left: stickyLeftOffset } : {};

                                return (
                                    <th
                                        key={column.id}
                                        style={{
                                            width: `var(--col-width-${column.id})`,
                                            ...stickyLeftStyle
                                        }}
                                        className={cn(
                                            'relative p-0 border-b border-[#cbd5e1] h-12 bg-[#f1f5f9]',
                                            'transition-colors duration-200',
                                            isStickyLeft && 'sticky z-30 transition-shadow',
                                            isStickyLeft && scrolledLeft > 0 && 'shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)]',
                                            column.sticky === 'right' && 'sticky right-0 z-30 shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.15)]',
                                            isDragging && 'opacity-50',
                                            isDragOver && 'bg-[#EDF8FF] shadow-[inset_3px_0_0_0_#064771]',
                                            column.headerClassName
                                        )}
                                        draggable={canDrag}
                                        onDragStart={(e) => canDrag && handleDragStart(e, column.id)}
                                        onDragOver={(e) => handleDragOver(e, column.id)}
                                        onDragEnd={handleDragEnd}
                                        onDrop={(e) => handleDrop(e, column.id)}
                                    >
                                        <div
                                            className={cn(
                                                'flex items-center gap-1.5 px-[3px] py-2 h-full group/header min-h-[48px]',
                                                isSortable && 'cursor-pointer hover:bg-gray-200/50',
                                                'select-none transition-colors'
                                            )}
                                            onClick={() => isSortable && handleSort(column.id)}
                                        >
                                            {canDrag && <DragHandle isDragging={isDragging} />}
                                            {typeof column.header === 'string' ? (
                                                <span className="text-[11px] font-medium text-gray-600 uppercase tracking-wide flex-1 text-left whitespace-nowrap overflow-hidden text-ellipsis px-[3px]">
                                                    {column.header}
                                                </span>
                                            ) : (
                                                <div className="flex-1 flex items-center overflow-hidden px-[3px]">{column.header}</div>
                                            )}
                                            {isSortable && (
                                                <SortIcon direction={isCurrentSort ? sortConfig!.direction : null} />
                                            )}
                                        </div>
                                        <ResizeHandle
                                            onMouseDown={(e) => handleResizeStart(e, column.id)}
                                            onDoubleClick={() => handleAutoFit(column.id)}
                                            isResizing={resizingColumn === column.id}
                                        />
                                    </th>
                                );
                            })}

                            {actionsColumn && (
                                <th
                                    style={{ width: actionsColumnWidth }}
                                    className="sticky right-0 bg-[#f1f5f9] z-30 border-b border-[#cbd5e1] h-12 shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.15)]"
                                >
                                    <div className="flex items-center justify-end px-4 h-full min-h-[48px]">
                                        {/* Actions Header remains blank */}
                                    </div>
                                </th>
                            )}
                        </tr>
                    </thead>

                    <tbody>
                        {isLoading ? (
                            <LoadingSkeleton
                                columns={totalColumns}
                                rows={pagination?.itemsPerPage || 10}
                            />
                        ) : data.length === 0 ? (
                            <EmptyState
                                message={emptyMessage}
                                icon={emptyIcon}
                                emptyAction={emptyAction}
                                colSpan={totalColumns}
                            />
                        ) : (
                            data.map((row, index) => {
                                const rowId = getRowId ? getRowId(row) : index;
                                const isSelected = selectedIds?.has(rowId);

                                return (
                                    <tr
                                        key={rowId}
                                        data-row-id={rowId}
                                        onClick={(e) => {
                                            // Don't navigate if user clicked an interactive element (link, button, input)
                                            const target = e.target as HTMLElement;
                                            if (target.closest('a, button, input, select, textarea, [role="button"]')) return;
                                            onRowClick?.(row, index);
                                        }}
                                        onContextMenu={(e) => onRowContextMenu?.(e, row, index)}
                                        className={cn(
                                            'group h-14 transition-colors duration-150 cursor-pointer',
                                            'border-b border-[#f1f5f9]',
                                            isSelected ? 'bg-blue-50/70' : 'hover:bg-[#f8fafc]',
                                            rowClassName?.(row, index)
                                        )}
                                    >
                                        {selectable && (
                                            <td className={cn(
                                                "px-4 py-3 text-center sticky left-0 z-20 border-b border-[#f1f5f9] transition-shadow",
                                                isSelected ? 'bg-blue-50/70 group-hover:bg-[#f1f5f9]' : 'bg-white group-hover:bg-[#f8fafc]',
                                                scrolledLeft > 0 && "shadow-[2px_0_5px_rgba(0,0,0,0.05)]"
                                            )}>
                                                <div className="flex items-center justify-center h-14">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (!onSelectionChange) return;
                                                            const newSet = new Set(selectedIds);
                                                            const id = typeof rowId === 'string' ? String(rowId) : Number(rowId);
                                                            if (isSelected) {
                                                                (newSet as any).delete(id);
                                                            } else {
                                                                (newSet as any).add(id);
                                                            }
                                                            onSelectionChange(newSet);
                                                        }}
                                                        className="flex items-center justify-center w-5 h-5 cursor-pointer hover:opacity-80 transition-opacity"
                                                    >
                                                        <img src={isSelected ? RowCheckedIcon : RowUncheckedIcon} alt="" className="w-5 h-5" draggable={false} />
                                                    </button>
                                                </div>
                                            </td>
                                        )}

                                        {orderedColumns.map((column) => {
                                            const isStickyLeft = column.sticky === 'left';
                                            const stickyLeftStyle = isStickyLeft ? { left: stickyLeftOffset } : {};
                                            return (
                                                <td
                                                    key={column.id}
                                                    style={{
                                                        width: `var(--col-width-${column.id})`,
                                                        ...stickyLeftStyle
                                                    }}
                                                    className={cn(
                                                        'px-4 py-3 text-[13.5px] text-gray-600 border-b border-[#f1f5f9]',
                                                        'align-middle overflow-hidden whitespace-nowrap text-ellipsis',
                                                        isStickyLeft && cn(
                                                            'sticky z-10 transition-shadow',
                                                            isSelected ? 'bg-blue-50/70 group-hover:bg-[#f1f5f9]' : 'bg-white group-hover:bg-[#f8fafc]',
                                                            scrolledLeft > 0 && "shadow-[2px_0_5px_rgba(0,0,0,0.05)]"
                                                        ),
                                                        column.sticky === 'right' && cn(
                                                            'sticky right-0 z-10 border-l border-[#cbd5e1] shadow-[-2px_0_5px_rgba(0,0,0,0.05)]',
                                                            isSelected ? 'bg-blue-50/70 group-hover:bg-[#f1f5f9]' : 'bg-white group-hover:bg-[#f8fafc]'
                                                        ),
                                                        column.cellClassName,
                                                        column.className
                                                    )}
                                                >
                                                    <div className="w-full h-full flex items-center overflow-hidden whitespace-nowrap text-ellipsis">
                                                        {renderCellValue(column, row)}
                                                    </div>
                                                </td>
                                            );
                                        })}

                                        {actionsColumn && (
                                            <td
                                                style={{ width: actionsColumnWidth }}
                                                className={cn(
                                                    "sticky right-0 z-10 border-b border-[#f1f5f9] shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.15)]",
                                                    isSelected ? 'bg-blue-50/70 group-hover:bg-[#f1f5f9]' : 'bg-white group-hover:bg-[#f8fafc]'
                                                )}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <div className="flex items-center justify-end px-4">
                                                    {actionsColumn(row, index)}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Footer */}
            {pagination && pagination.totalPages > 0 && (
                <div className="flex items-center justify-between px-4 py-2.5 bg-white border-t border-gray-100">
                    <div className="text-[11px] text-gray-500 font-normal">
                        Showing {((pagination.currentPage - 1) * (pagination.itemsPerPage || 20)) + 1} to {Math.min(pagination.currentPage * (pagination.itemsPerPage || 20), pagination.totalItems || 0)} of {pagination.totalItems} entries
                    </div>
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => pagination.onPageChange(Math.max(1, pagination.currentPage - 1))}
                            disabled={pagination.currentPage === 1}
                            className="p-1.5 rounded-[3px] text-gray-400 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>

                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                // Logic to show window of pages around current page
                                let pageNum = i + 1;
                                if (pagination.totalPages > 5) {
                                    if (pagination.currentPage > 3) {
                                        pageNum = pagination.currentPage - 2 + i;
                                    }
                                    if (pageNum > pagination.totalPages) {
                                        pageNum = pagination.totalPages - 4 + i;
                                    }
                                }

                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => pagination.onPageChange(pageNum)}
                                        className={cn(
                                            "min-w-[28px] h-7 rounded-[3px] text-xs font-medium transition-all",
                                            pagination.currentPage === pageNum
                                                ? "bg-[#064771] text-white shadow-sm shadow-blue-900/10"
                                                : "text-gray-500 hover:bg-gray-100"
                                        )}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => pagination.onPageChange(Math.min(pagination.totalPages, pagination.currentPage + 1))}
                            disabled={pagination.currentPage === pagination.totalPages}
                            className="p-1.5 rounded-[3px] text-gray-400 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DataTable;

// Re-export types
export type { DataTableColumn as Column };
