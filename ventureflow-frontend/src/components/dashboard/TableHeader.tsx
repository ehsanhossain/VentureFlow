/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

import React from "react";
import Vector from "./Vector";

interface Column {
  label: string;
  width?: string;
  sortable?: boolean;
}

interface TableHeaderProps {
  columns: Column[];
}

const TableHeader: React.FC<TableHeaderProps> = ({ columns }) => {
  if (!columns || columns.length === 0) {
    return null;
  }

  const spanCount = Math.max(columns.length, 1);

  return (
    <th colSpan={spanCount} className="p-0">
      <div className="flex flex-wrap h-10 items-center rounded border border-[var(--Color-Tokens-Border-Primary,#E4E4E4)] bg-white w-full overflow-hidden">
        {columns.map((column, index) => (
          <div
            key={index}
            className={`flex h-10 px-3 py-2 items-center gap-2 ${column.width || "flex-1 min-w-[100px]"} truncate`}
          >
            <span className="truncate text-[var(--Color-Tokens-Content-Dark-Secondary,#727272)] text-sm font-medium leading-[150%]">
              {column.label}
            </span>
            {column.sortable && (
              <div className="w-[4.5px] h-[2.25px] shrink-0 stroke-[1.5px] stroke-[var(--Color-Tokens-Content-Dark-Secondary,#727272)]">
                <Vector />
              </div>
            )}
          </div>
        ))}
      </div>
    </th>
  );
};

export default TableHeader;