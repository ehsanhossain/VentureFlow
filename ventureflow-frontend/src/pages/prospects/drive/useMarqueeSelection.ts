/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

import { useRef, useState, useCallback, useEffect } from 'react';

/* ───── Types ───── */

/**
 * Figma-style marquee selection hook.
 *
 * All internal coordinates are stored in **page space** (pageX / pageY).
 * Page coordinates never change with layout shifts — they are absolute
 * to the document origin.  At render and hit-test time we convert
 * from page space into container-viewport space using the container's
 * CURRENT getBoundingClientRect(), which means even if the container
 * moves (e.g. because a bulk-action bar appears/disappears above it)
 * the marquee rectangle and item bounds stay perfectly aligned.
 */
interface MarqueeRect {
    /** Anchor point in page coordinates */
    startPageX: number;
    startPageY: number;
    /** Current mouse position in page coordinates */
    currentPageX: number;
    currentPageY: number;
}

interface MarqueeStyle {
    top: number;
    left: number;
    width: number;
    height: number;
}

interface MarqueeSelectionResult {
    fileIds: Set<string>;
    folderIds: Set<string>;
}

interface UseMarqueeSelectionOptions {
    containerRef: React.RefObject<HTMLDivElement | null>;
    onSelectionChange: (fileIds: Set<string>, folderIds: Set<string>) => void;
    enabled?: boolean;
}

/* ───── Constants ───── */
const MIN_DRAG_DISTANCE = 5; // pixels before marquee activates

/** Apply user-select: none to an element (including webkit prefix) */
function disableUserSelect(el: HTMLElement) {
    el.style.userSelect = 'none';
    el.style.webkitUserSelect = 'none';
}

/** Remove user-select restrictions from an element */
function enableUserSelect(el: HTMLElement) {
    el.style.userSelect = '';
    el.style.webkitUserSelect = '';
}

/* ───── Helpers ───── */

/**
 * Checks if an element is a "hard" interactive target that should NEVER
 * start a marquee — buttons, inputs, textareas, links.
 */
function isHardInteractiveTarget(el: HTMLElement, container: HTMLElement): boolean {
    let current: HTMLElement | null = el;
    while (current && current !== container) {
        if (
            current.tagName === 'BUTTON' ||
            current.tagName === 'INPUT' ||
            current.tagName === 'A' ||
            current.tagName === 'TEXTAREA' ||
            current.getAttribute('role') === 'button'
        ) {
            return true;
        }
        current = current.parentElement;
    }
    return false;
}

/**
 * Convert a MarqueeRect (page coordinates) to container-content-space
 * CSS coordinates for the absolutely-positioned marquee overlay.
 *
 * Because the marquee div uses `position: absolute` inside a scrollable
 * container, its coordinates are relative to the scrollable CONTENT
 * (not the viewport).  We therefore add the container's scroll offsets
 * so the blue rectangle stays pinned to the correct content position
 * even when the user scrolls.
 */
function rectToContainerStyle(rect: MarqueeRect, container: HTMLElement): MarqueeStyle {
    const cr = container.getBoundingClientRect();
    const scrollLeft = container.scrollLeft;
    const scrollTop = container.scrollTop;

    // Convert page coords → container-content-space
    const sx = rect.startPageX - cr.left - window.scrollX + scrollLeft;
    const sy = rect.startPageY - cr.top - window.scrollY + scrollTop;
    const cx = rect.currentPageX - cr.left - window.scrollX + scrollLeft;
    const cy = rect.currentPageY - cr.top - window.scrollY + scrollTop;

    const x1 = Math.min(sx, cx);
    const y1 = Math.min(sy, cy);
    const x2 = Math.max(sx, cx);
    const y2 = Math.max(sy, cy);

    return { left: x1, top: y1, width: x2 - x1, height: y2 - y1 };
}

/** Check if two rectangles overlap */
function rectsOverlap(
    a: { left: number; top: number; right: number; bottom: number },
    b: { left: number; top: number; right: number; bottom: number },
): boolean {
    return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

/* ───── Hook ───── */
export function useMarqueeSelection({ containerRef, onSelectionChange, enabled = true }: UseMarqueeSelectionOptions) {
    const [isSelecting, setIsSelecting] = useState(false);
    const [marqueeStyle, setMarqueeStyle] = useState<MarqueeStyle | null>(null);

    const rectRef = useRef<MarqueeRect | null>(null);
    const isDragging = useRef(false);
    const rafRef = useRef<number | null>(null);
    const hasExceededThreshold = useRef(false);
    /** Client coords at mousedown — used ONLY for threshold distance check */
    const startClientRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const startedOnItemRef = useRef(false);

    // Store the latest callback in a ref so the event handlers always use the latest
    const onSelectionChangeRef = useRef(onSelectionChange);
    onSelectionChangeRef.current = onSelectionChange;

    /**
     * Run hit-testing against all [data-drive-item] elements inside the container.
     * Both the marquee rectangle and item bounds are converted to container-relative
     * space using the container's CURRENT bounding rect (layout-shift-safe).
     */
    const performHitTest = useCallback((): MarqueeSelectionResult => {
        const result: MarqueeSelectionResult = { fileIds: new Set(), folderIds: new Set() };
        const container = containerRef.current;
        const rect = rectRef.current;
        if (!container || !rect) return result;

        const containerRect = container.getBoundingClientRect();

        // Marquee bounds — convert from page coords to container-relative
        const style = rectToContainerStyle(rect, container);
        const marquee = {
            left: style.left,
            top: style.top,
            right: style.left + style.width,
            bottom: style.top + style.height,
        };

        // Query all item cards and convert their bounds to container-content-space
        // (same space as the marquee style) by adding scroll offsets.
        const scrollLeft = container.scrollLeft;
        const scrollTop = container.scrollTop;
        const items = container.querySelectorAll<HTMLElement>('[data-drive-item]');
        items.forEach(el => {
            const elRect = el.getBoundingClientRect();
            const itemBounds = {
                left: elRect.left - containerRect.left + scrollLeft,
                top: elRect.top - containerRect.top + scrollTop,
                right: elRect.right - containerRect.left + scrollLeft,
                bottom: elRect.bottom - containerRect.top + scrollTop,
            };

            if (rectsOverlap(marquee, itemBounds)) {
                const id = el.getAttribute('data-drive-item')!;
                const type = el.getAttribute('data-drive-item-type');
                if (type === 'folder') {
                    result.folderIds.add(id);
                } else {
                    result.fileIds.add(id);
                }
            }
        });

        return result;
    }, [containerRef]);

    /** React onMouseDown handler — starts the marquee tracking */
    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!enabled) return;
        if (e.button !== 0) return; // left click only
        const container = containerRef.current;
        if (!container) return;

        // Never start marquee on hard interactive elements (buttons, inputs, links)
        if (isHardInteractiveTarget(e.target as HTMLElement, container)) return;

        // Check if the click landed on a drive-item card
        let el: HTMLElement | null = e.target as HTMLElement;
        let onItem = false;
        while (el && el !== container) {
            if (el.hasAttribute('data-drive-item')) {
                onItem = true;
                break;
            }
            el = el.parentElement;
        }
        startedOnItemRef.current = onItem;

        isDragging.current = true;
        hasExceededThreshold.current = false;

        // Store client coords for threshold check
        startClientRef.current = { x: e.clientX, y: e.clientY };

        // Store anchor in PAGE coordinates (stable across layout shifts)
        rectRef.current = {
            startPageX: e.pageX,
            startPageY: e.pageY,
            currentPageX: e.pageX,
            currentPageY: e.pageY,
        };

        // Prevent text selection immediately
        disableUserSelect(container);
        disableUserSelect(document.body);
        window.getSelection()?.removeAllRanges();

        // If we started on empty space, prevent default right away.
        // If we started on an item card, DON'T prevent default yet —
        // we'll prevent it only once the drag threshold is exceeded,
        // allowing a short click to fall through to onClick.
        if (!onItem) {
            e.preventDefault();
        }
    }, [enabled, containerRef]);

    // Window-level mousemove/mouseup event handlers (attached via useEffect)
    useEffect(() => {
        const container = containerRef.current;

        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging.current || !rectRef.current || !container) return;

            // Update current position in PAGE coordinates
            rectRef.current.currentPageX = e.pageX;
            rectRef.current.currentPageY = e.pageY;

            // Check minimum distance threshold using client deltas
            if (!hasExceededThreshold.current) {
                const dx = Math.abs(e.clientX - startClientRef.current.x);
                const dy = Math.abs(e.clientY - startClientRef.current.y);
                if (dx < MIN_DRAG_DISTANCE && dy < MIN_DRAG_DISTANCE) return;

                hasExceededThreshold.current = true;
                setIsSelecting(true);

                // If the drag started on an item card, we need to suppress
                // the upcoming click event so the card doesn't navigate.
                if (startedOnItemRef.current) {
                    const suppressClick = (ev: MouseEvent) => {
                        ev.stopPropagation();
                        ev.preventDefault();
                    };
                    // Use capture phase so we intercept before React's onClick
                    window.addEventListener('click', suppressClick, { capture: true, once: true });
                }
            }

            // Prevent default to avoid text selection during drag
            e.preventDefault();

            // Throttle visual updates with requestAnimationFrame
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            rafRef.current = requestAnimationFrame(() => {
                if (!rectRef.current || !container) return;

                // Convert page coords to container-relative for rendering
                const style = rectToContainerStyle(rectRef.current, container);
                setMarqueeStyle(style);

                // Perform hit-testing and update selection
                const { fileIds, folderIds } = performHitTest();
                onSelectionChangeRef.current(fileIds, folderIds);

                // Auto-scroll when near edges
                const containerRect = container.getBoundingClientRect();
                const edgeThreshold = 40;
                const mouseY = e.clientY;
                if (mouseY < containerRect.top + edgeThreshold) {
                    container.scrollTop -= 8;
                } else if (mouseY > containerRect.bottom - edgeThreshold) {
                    container.scrollTop += 8;
                }
            });
        };

        const handleMouseUp = () => {
            if (!isDragging.current) return;
            isDragging.current = false;

            if (container) {
                enableUserSelect(container);
            }
            enableUserSelect(document.body);

            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }

            setIsSelecting(false);
            setMarqueeStyle(null);
            rectRef.current = null;
        };

        /** Prevent native text selection while dragging */
        const handleSelectStart = (e: Event) => {
            if (isDragging.current) {
                e.preventDefault();
            }
        };

        /** Prevent native HTML drag while marquee is active */
        const handleDragStart = (e: DragEvent) => {
            if (isDragging.current) {
                e.preventDefault();
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('selectstart', handleSelectStart);
        document.addEventListener('dragstart', handleDragStart);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('selectstart', handleSelectStart);
            document.removeEventListener('dragstart', handleDragStart);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            if (container) enableUserSelect(container);
            enableUserSelect(document.body);
        };
    }, [containerRef, performHitTest]);

    return { isSelecting, marqueeStyle, handleMouseDown };
}
