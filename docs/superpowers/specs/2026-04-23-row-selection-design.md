# Row Checkbox Selection Design

**Date:** 2026-04-23  
**Scope:** Stage 1 — visual selection only, no bulk actions yet

---

## Goal

Add a checkbox column to the projects grid so users can select individual rows. The toolbar checkbox drives select-all / deselect-all for the current page. No database interaction. No bulk actions at this stage.

---

## State (`App.tsx`)

```ts
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
```

Three callbacks defined in `App.tsx`:

```ts
const toggleRowSelection = (id: string) => setSelectedIds(prev => {
  const next = new Set(prev)
  if (next.has(id)) next.delete(id); else next.add(id)
  return next
})
const selectAll = () => setSelectedIds(new Set(displayRows.map(r => r.id)))
const clearSelection = () => setSelectedIds(new Set())
```

Selection resets to empty whenever `displayRows` changes (pagination or filter change):

```ts
useEffect(() => setSelectedIds(new Set()), [displayRows])
```

---

## GridToolbar

**New props:**

```ts
selectedCount: number        // selectedIds.size
totalCount: number           // displayRows.length
onSelectAll: () => void
onClearAll: () => void
```

The existing non-functional checkbox becomes tri-state:

| `selectedCount` | `totalCount` | Checkbox state | Click action |
|---|---|---|---|
| 0 | any | unchecked | `onSelectAll` |
| > 0 and < totalCount | any | indeterminate | `onSelectAll` |
| = totalCount (> 0) | any | checked | `onClearAll` |

`indeterminate` cannot be set via React props — use a `useRef<HTMLInputElement>` and `useEffect` to set `checkboxRef.current.indeterminate`.

`onChange` handler:

```ts
onChange={() => selectedCount === totalCount && totalCount > 0 ? onClearAll() : onSelectAll()}
```

---

## ProjectsGrid

**New props:**

```ts
selectedIds: Set<string>
onToggleRow: (id: string) => void
```

A new checkbox column is **prepended** to the `columns` array (before `project_name`):

```ts
{
  basis: 48, grow: 0, shrink: 0,
  title: <div style={{ width: 48 }} />,   // empty header — select-all is in toolbar
  component: ({ rowData }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <input
        type="checkbox"
        checked={selectedIds.has(rowData.id)}
        onChange={() => onToggleRow(rowData.id)}
        style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
      />
    </div>
  ),
  disableKeys: true,
  cellClassName: 'checkbox-cell',
}
```

`disableKeys: true` prevents DSG keyboard navigation from interfering with checkbox interaction.

---

## App.tsx wiring

```tsx
<GridToolbar
  onRefresh={refresh}
  selectedCount={selectedIds.size}
  totalCount={displayRows.length}
  onSelectAll={selectAll}
  onClearAll={clearSelection}
/>

<ProjectsGrid
  rows={displayRows}
  onRowChange={editRow}
  selectedIds={selectedIds}
  onToggleRow={toggleRowSelection}
/>
```

---

## Files Changed

| File | Change |
|------|--------|
| `src/App.tsx` | Add `selectedIds` state, 3 callbacks, `useEffect` reset, wire new props |
| `src/components/grid/GridToolbar.tsx` | Accept 4 new props, make checkbox tri-state with ref |
| `src/components/grid/ProjectsGrid.tsx` | Accept 2 new props, prepend checkbox column |

---

## Out of Scope

- Bulk actions (delete, export) — future stage
- Selecting across pages
- Shift-click range selection
- Persisting selection across refreshes
- Any visual indication in the toolbar of how many rows are selected (count badge etc.)
