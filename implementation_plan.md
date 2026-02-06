# Implementation Plan - Website Column & Table Resizing Fixes

## Problem
1. **Website Column Display:** Currently displays raw JSON or URLs. Needs to show "Visit Website" with an external link icon.
2. **Website Column Interaction:** Needs a copy button on hover that copies the underlying URL.
3. **Column Resizing:** Double-clicking the resize handle acts on header width only, ignoring cell content when cells contain JSX (components).

## Proposed Changes

### 1. Fix Resizing Logic in `DataTable.tsx`
The `handleAutoFit` function fails to measure column width correctly when the `accessor` returns JSX (React Nodes) instead of a string.

**Changes:**
- Update `DataTableColumn` interface to include an optional `textAccessor?: (row: T) => string`.
- Update `handleAutoFit` to:
    1. Check for `textAccessor`.
    2. If not found, check if `accessor` returns a string.
    3. If `accessor` is a function that returns an object, try to fallback to `row[column.id]` if it's a simple type.

### 2. Update `InvestorTable.tsx`
**Website Column Logic:**
- Create a helper function `parseWebsiteUrl(value)`:
    - Handle JSON string: `[{"url": "..."}]` -> extract URL.
    - Handle plain string: use as is.
    - Handle empty/null.
- Implement the new Column Design:
    - Text: "Visit Website"
    - Icon: `ExternalLink` (lucide-react)
    - Hover Interaction: Show a `Copy` button (lucide-react) to the right.
    - Copy Action: Copy the clean URL to clipboard and show a temporary "Copied!" tooltip or toast.

**Resizing Support:**
- Add `textAccessor` to the "Website" column definition (and others where `accessor` returns JSX, like `Project Code`, `Company Name`, etc.) to ensure resizing works for them too.

## Components to Modify
1. `src/components/table/DataTable.tsx`
2. `src/pages/prospects/components/InvestorTable.tsx`

## Verification
- Check if "Website" column shows "Visit Website".
- Check if clicking the link opens the URL in a new tab.
- Check if hovering shows the copy button and clicking it copies the URL.
- Check if double-clicking the column divider resizes it to fit the widest content (not just header).
