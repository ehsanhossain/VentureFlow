/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

/* eslint-disable react/prop-types */
import * as React from "react";

import { cn } from "../../../lib/utils";

/**
 * Global Table Component System
 * 
 * Key Features:
 * - Header: Distinct background (#f1f5f9), sticky, text wraps to 2 lines (no truncation)
 * - Rows: Clear 1px separators, hover effect, consistent padding
 * - Scrolling: Only table body scrolls, header stays fixed
 * - Scrollbar: Thin, light, positioned at bottom of container
 */

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement> & { containerClassName?: string }
>(({ className, containerClassName, ...props }, ref) => (
  <div className={cn(
    "relative w-full h-full flex flex-col min-h-0",
    containerClassName
  )}>
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm border-collapse", className)}
      {...props}
    />
  </div>
));
Table.displayName = "Table";

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn(
      // Sticky header that stays on top while scrolling
      "sticky top-0 z-20",
      // Distinct header background with bottom shadow
      "bg-[#f1f5f9] shadow-[0_2px_4px_-1px_rgba(0,0,0,0.06)]",
      className
    )}
    {...props}
  />
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("bg-white", className)}
    {...props}
  />
));
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t border-gray-200 bg-gray-50 font-medium [&>tr]:last:border-b-0",
      className,
    )}
    {...props}
  />
));
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      // Row separator - 1px solid line between every row
      "border-b border-[#e2e8f0]",
      // Smooth transition for hover effects
      "transition-colors duration-150",
      // Hover state for better scanability
      "hover:bg-[#f8fafc]",
      // Selected state
      "data-[state=selected]:bg-blue-50",
      className,
    )}
    {...props}
  />
));
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      // Min height to accommodate 2-line headers
      "min-h-[48px] h-12 px-4 py-2",
      // Text styling - allow wrap to 2 lines, NO truncation
      "text-left align-middle",
      "text-[11px] font-semibold text-gray-600 uppercase tracking-wide",
      // Allow text to wrap naturally to 2 lines
      "whitespace-normal break-words leading-[1.4]",
      // Distinct header background (inherited from thead)
      "bg-[#f1f5f9]",
      // Bottom border for header separation
      "border-b-2 border-[#cbd5e1]",
      // Checkbox alignment
      "[&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
      className,
    )}
    {...props}
  />
));
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      // Consistent padding across all cells
      "px-4 py-3",
      // Vertical alignment
      "align-middle",
      // Text styling
      "text-sm text-gray-900",
      // Inherit background for proper hover effect on row
      "bg-inherit",
      // Checkbox alignment
      "[&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
      className,
    )}
    {...props}
  />
));
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-gray-500", className)}
    {...props}
  />
));
TableCaption.displayName = "TableCaption";

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
