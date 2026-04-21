# Column Resize — Design Spec

**Date:** 2026-04-21  
**Scope:** `ProjectsGrid` + new `useColumnResize` hook  
**Status:** Approved

---

## Problem

`react-datasheet-grid` has no native column resizing. Column widths are static layout props set at render time. Users cannot adjust column widths interactively.

---

## Goals

- Drag-to-resize on any column header right edge
- Widths persist across page refreshes via `localStorage`
- Minimum column width: 60px
- No reset affordance needed

---

## Architecture

### Hook: `useColumnResize` (`src/hooks/useColumnResize.ts`)

Single responsibility: own column width state and drag logic.

**State:** `columnWidths: Record<string, number>`  
Keyed by DB column name (`project_name`, `project_topic`, etc.).

**Initialization:**  
Read from `localStorage` key `"db-admins-column-widths"`. Fall back to the default widths defined per column if the key is absent or a specific column is missing.

**Default widths (fallbacks):**

| Column               | Default px |
|----------------------|-----------|
| `project_name`       | 200       |
| `project_topic`      | 160       |
| `project_status`     | 120       |
| `project_start_date` | 120       |
| `project_delivery_date` | 130    |
| `project_budget`     | 110       |

**Drag lifecycle:**

1. `startResize(columnKey: string, e: React.MouseEvent)` — called on `mousedown` on a `ResizeHandle`. Captures `startX = e.clientX` and `startWidth = columnWidths[columnKey]`. Attaches `mousemove` and `mouseup` listeners to `window`.
2. `mousemove` handler — computes `newWidth = Math.max(60, startWidth + (currentX - startX))`. Updates `columnWidths` state live (grid repaints during drag).
3. `mouseup` handler — detaches listeners. Writes final `columnWidths` to `localStorage`.

**Returns:** `{ columnWidths, startResize }`

---

### Component: `ResizeHandle` (inline in `ProjectsGrid.tsx`)

A thin vertical div positioned on the right edge of each column header cell.

- Width: `4px`; height: `100%`; `cursor: col-resize`
- Default: transparent background
- Hover: `background: var(--border-color)`
- `onMouseDown`: calls `startResize(columnKey, e)` and calls `e.stopPropagation()` to prevent DSG header click handling

---

### Column title rendering

Each column's `title` prop changes from a plain string to a `ReactNode`:

```tsx
title: (
  <div style={{ display: 'flex', alignItems: 'center', width: '100%', height: '100%' }}>
    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
      {COLUMN_LABELS[key]}
    </span>
    <ResizeHandle columnKey={key} onStartResize={startResize} />
  </div>
)
```

---

### Column width application

To lock each column to its tracked width, the DSG column definition uses:

```ts
basis: columnWidths[key],
grow: 0,
shrink: 0,
minWidth: 60,
```

This overrides DSG's flex distribution and pins each column to exactly the stored pixel width.

---

## Data Flow

```
localStorage
    ↓ (init)
useColumnResize.columnWidths
    ↓
ProjectsGrid column definitions (basis prop)
    ↓
DataSheetGrid renders at tracked widths

User drags ResizeHandle
    → startResize captures startX, startWidth
    → mousemove updates columnWidths live
    → mouseup persists to localStorage
```

---

## Files Changed

| File | Change |
|------|--------|
| `src/hooks/useColumnResize.ts` | New file |
| `src/components/grid/ProjectsGrid.tsx` | Use hook, replace string titles with ResizeHandle nodes, apply basis/grow/shrink |

All other files unchanged.

---

## Out of Scope

- Reset-to-defaults affordance
- Per-user server-side persistence (localStorage only)
- Minimum width other than 60px
