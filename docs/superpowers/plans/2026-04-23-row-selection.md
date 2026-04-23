# Row Checkbox Selection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a per-row checkbox column to the projects grid and wire the existing toolbar checkbox as a tri-state select-all / deselect-all control.

**Architecture:** `selectedIds: Set<string>` lives in `App.tsx` alongside three callbacks (`toggleRowSelection`, `selectAll`, `clearSelection`). A `useEffect` resets selection whenever `displayRows` changes. `GridToolbar` becomes tri-state via a `useRef` to set `indeterminate`. `ProjectsGrid` prepends a 48px checkbox column that reads from `selectedIds` and calls `onToggleRow`.

**Tech Stack:** React 19, TypeScript, react-datasheet-grid v4, Vitest + @testing-library/react.

---

## File Map

| File | Change |
|------|--------|
| `src/components/grid/GridToolbar.tsx` | Add 4 new props; tri-state checkbox via ref |
| `src/components/grid/ProjectsGrid.tsx` | Add 2 new props; prepend 48px checkbox column |
| `src/App.tsx` | Add `selectedIds` state + 3 callbacks + `useEffect` reset; wire new props |
| `tests/GridToolbar.test.tsx` | New — 6 tests for tri-state checkbox behaviour |

---

## Task 1: GridToolbar tri-state checkbox

**Files:**
- Modify: `src/components/grid/GridToolbar.tsx`
- Create: `tests/GridToolbar.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `tests/GridToolbar.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { GridToolbar } from '../src/components/grid/GridToolbar'

const base = { onRefresh: vi.fn(), onSelectAll: vi.fn(), onClearAll: vi.fn() }

describe('GridToolbar checkbox', () => {
  it('is unchecked and not indeterminate when selectedCount is 0', () => {
    render(<GridToolbar {...base} selectedCount={0} totalCount={5} />)
    const cb = screen.getByRole('checkbox') as HTMLInputElement
    expect(cb.checked).toBe(false)
    expect(cb.indeterminate).toBe(false)
  })

  it('is checked when all rows are selected', () => {
    render(<GridToolbar {...base} selectedCount={5} totalCount={5} />)
    const cb = screen.getByRole('checkbox') as HTMLInputElement
    expect(cb.checked).toBe(true)
    expect(cb.indeterminate).toBe(false)
  })

  it('is indeterminate when some rows are selected', () => {
    render(<GridToolbar {...base} selectedCount={3} totalCount={5} />)
    const cb = screen.getByRole('checkbox') as HTMLInputElement
    expect(cb.indeterminate).toBe(true)
  })

  it('calls onSelectAll when clicked while unchecked', () => {
    const onSelectAll = vi.fn()
    render(<GridToolbar {...base} onSelectAll={onSelectAll} selectedCount={0} totalCount={5} />)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(onSelectAll).toHaveBeenCalledTimes(1)
  })

  it('calls onSelectAll when clicked while indeterminate', () => {
    const onSelectAll = vi.fn()
    render(<GridToolbar {...base} onSelectAll={onSelectAll} selectedCount={3} totalCount={5} />)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(onSelectAll).toHaveBeenCalledTimes(1)
  })

  it('calls onClearAll when clicked while all selected', () => {
    const onClearAll = vi.fn()
    render(<GridToolbar {...base} onClearAll={onClearAll} selectedCount={5} totalCount={5} />)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(onClearAll).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- --run tests/GridToolbar.test.tsx
```

Expected: FAIL — `GridToolbar` doesn't accept the new props yet.

- [ ] **Step 3: Replace GridToolbar implementation**

Replace the entire contents of `src/components/grid/GridToolbar.tsx` with:

```tsx
import { useRef, useEffect } from 'react'

interface GridToolbarProps {
  onRefresh: () => void
  selectedCount: number
  totalCount: number
  onSelectAll: () => void
  onClearAll: () => void
}

export function GridToolbar({ onRefresh, selectedCount, totalCount, onSelectAll, onClearAll }: GridToolbarProps) {
  const checkboxRef = useRef<HTMLInputElement>(null)
  const isAllSelected = selectedCount === totalCount && totalCount > 0
  const isIndeterminate = selectedCount > 0 && selectedCount < totalCount

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = isIndeterminate
    }
  }, [isIndeterminate])

  const handleChange = () => {
    if (isAllSelected) onClearAll(); else onSelectAll()
  }

  const divider = (
    <div style={{ width: 1, height: 20, background: 'var(--border-color)', margin: '0 4px' }} />
  )

  return (
    <div style={{
      height: 52,
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      borderBottom: '1px solid var(--border-color)',
      gap: 12,
    }}>
      {/* Left side */}
      <input
        ref={checkboxRef}
        type="checkbox"
        checked={isAllSelected}
        onChange={handleChange}
        style={{ width: 20, height: 20, borderRadius: 3, cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
      />
      {divider}
      <button
        onClick={onRefresh}
        title="Refresh"
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--foreground-secondary)', display: 'flex', alignItems: 'center' }}
      >
        <span className="material-symbols-outlined">refresh</span>
      </button>
      <button
        title="More options"
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--foreground-secondary)', display: 'flex', alignItems: 'center' }}
      >
        <span className="material-symbols-outlined">more_vert</span>
      </button>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Right side */}
      {divider}
      <button
        title="View"
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--foreground-secondary)', display: 'flex', alignItems: 'center' }}
      >
        <span className="material-symbols-outlined">view_headline</span>
      </button>
      <button
        title="Filter & Sort"
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--foreground-secondary)', display: 'flex', alignItems: 'center' }}
      >
        <span className="material-symbols-outlined">tune</span>
      </button>
      <div style={{
        width: 32,
        height: 32,
        borderRadius: 'var(--radius-pill)',
        background: 'var(--accent-secondary)',
        color: 'var(--foreground-inverse)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        fontFamily: 'var(--font-captions)',
        fontWeight: 600,
        cursor: 'pointer',
      }}>
        HD
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test -- --run tests/GridToolbar.test.tsx
```

Expected: 6 tests PASS.

- [ ] **Step 5: Run full test suite**

```bash
npm test -- --run
```

Expected: all existing tests pass + 6 new. TypeScript will show errors in `App.tsx` about missing `GridToolbar` props — expected, fixed in Task 3.

- [ ] **Step 6: Commit**

```bash
git add src/components/grid/GridToolbar.tsx tests/GridToolbar.test.tsx
git commit -m "feat: add tri-state select-all checkbox to GridToolbar"
```

---

## Task 2: Add checkbox column to ProjectsGrid

**Files:**
- Modify: `src/components/grid/ProjectsGrid.tsx`

- [ ] **Step 1: Add new props to the interface**

Open `src/components/grid/ProjectsGrid.tsx`. Update the `ProjectsGridProps` interface (currently at line 78) from:

```ts
interface ProjectsGridProps {
  rows: Project[]
  onRowChange: (id: string, changes: ProjectUpdate) => void
}
```

to:

```ts
interface ProjectsGridProps {
  rows: Project[]
  onRowChange: (id: string, changes: ProjectUpdate) => void
  selectedIds: Set<string>
  onToggleRow: (id: string) => void
}
```

- [ ] **Step 2: Destructure new props in the function signature**

Update the function signature from:

```ts
export function ProjectsGrid({ rows, onRowChange }: ProjectsGridProps) {
```

to:

```ts
export function ProjectsGrid({ rows, onRowChange, selectedIds, onToggleRow }: ProjectsGridProps) {
```

- [ ] **Step 3: Prepend the checkbox column**

The `columns` array is built inside `useMemo` (around line 109). Update the `useMemo` to prepend the checkbox column as the first element, and add `selectedIds` and `onToggleRow` to the dependency array.

Replace the start of the `useMemo` (the `const columns: ProjectColumn[] = useMemo(() => [` line and its dependency array) so the full `useMemo` becomes:

```ts
const columns: ProjectColumn[] = useMemo(() => [
  {
    basis: 48, grow: 0, shrink: 0,
    disableKeys: true,
    title: <div style={{ width: 48 }} />,
    component: ({ rowData }: { rowData: Project }) => (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <input
          type="checkbox"
          checked={selectedIds.has(rowData.id)}
          onChange={() => onToggleRow(rowData.id)}
          style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
        />
      </div>
    ),
  },
  {
    ...(keyColumn('project_name', textColumn) as unknown as ProjectColumn),
    title: colTitle('project_name', COLUMN_LABELS.project_name),
    basis: columnWidths.project_name, grow: 0, shrink: 0,
  },
  {
    ...(keyColumn('project_topic', textColumn) as unknown as ProjectColumn),
    title: colTitle('project_topic', COLUMN_LABELS.project_topic),
    basis: columnWidths.project_topic, grow: 0, shrink: 0,
  },
  {
    title: colTitle('project_status', COLUMN_LABELS.project_status),
    basis: columnWidths.project_status, grow: 0, shrink: 0,
    keepFocus: true,
    component: ({ rowData, setRowData, focus }) => {
      if (focus) {
        return (
          <select
            autoFocus
            value={rowData.project_status ?? ''}
            onChange={e => {
              const val = e.target.value
              setRowData({
                ...rowData,
                project_status: (STATUS_OPTIONS.includes(val as ProjectStatus) ? val as ProjectStatus : null),
              })
            }}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              color: 'var(--foreground-primary)',
              cursor: 'pointer',
              padding: '0 8px',
            }}
          >
            <option value="">—</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )
      }
      return (
        <div style={{ padding: '0 8px', display: 'flex', alignItems: 'center', height: '100%' }}>
          <RolePill status={rowData.project_status} />
        </div>
      )
    },
    deleteValue: ({ rowData }) => ({ ...rowData, project_status: null }),
    copyValue: ({ rowData }) => rowData.project_status ?? '',
    pasteValue: ({ rowData, value }) => ({
      ...rowData,
      project_status: STATUS_OPTIONS.includes(value as ProjectStatus) ? value as ProjectStatus : null,
    }),
  },
  {
    title: colTitle('project_start_date', COLUMN_LABELS.project_start_date),
    basis: columnWidths.project_start_date, grow: 0, shrink: 0,
    keepFocus: true,
    component: ({ rowData, setRowData, focus }) => {
      if (focus) {
        return (
          <input
            autoFocus
            type="date"
            value={rowData.project_start_date ?? ''}
            onChange={e => setRowData({ ...rowData, project_start_date: e.target.value || null })}
            style={{
              width: '100%', height: '100%', border: 'none', outline: 'none',
              background: 'transparent', fontFamily: 'var(--font-body)',
              fontSize: 13, color: 'var(--foreground-primary)', padding: '0 8px',
              cursor: 'pointer',
            }}
          />
        )
      }
      return (
        <div style={{ padding: '0 8px', display: 'flex', alignItems: 'center', height: '100%',
          fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--foreground-secondary)' }}>
          {rowData.project_start_date ?? '—'}
        </div>
      )
    },
    deleteValue: ({ rowData }) => ({ ...rowData, project_start_date: null }),
    copyValue: ({ rowData }) => rowData.project_start_date ?? '',
    pasteValue: ({ rowData, value }) => ({ ...rowData, project_start_date: value || null }),
  },
  {
    title: colTitle('project_delivery_date', COLUMN_LABELS.project_delivery_date),
    basis: columnWidths.project_delivery_date, grow: 0, shrink: 0,
    keepFocus: true,
    component: ({ rowData, setRowData, focus }) => {
      if (focus) {
        return (
          <input
            autoFocus
            type="date"
            value={rowData.project_delivery_date ?? ''}
            onChange={e => setRowData({ ...rowData, project_delivery_date: e.target.value || null })}
            style={{
              width: '100%', height: '100%', border: 'none', outline: 'none',
              background: 'transparent', fontFamily: 'var(--font-body)',
              fontSize: 13, color: 'var(--foreground-primary)', padding: '0 8px',
              cursor: 'pointer',
            }}
          />
        )
      }
      return (
        <div style={{ padding: '0 8px', display: 'flex', alignItems: 'center', height: '100%',
          fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--foreground-secondary)' }}>
          {rowData.project_delivery_date ?? '—'}
        </div>
      )
    },
    deleteValue: ({ rowData }) => ({ ...rowData, project_delivery_date: null }),
    copyValue: ({ rowData }) => rowData.project_delivery_date ?? '',
    pasteValue: ({ rowData, value }) => ({ ...rowData, project_delivery_date: value || null }),
  },
  {
    title: colTitle('project_budget', COLUMN_LABELS.project_budget),
    basis: columnWidths.project_budget, grow: 0, shrink: 0,
    component: ({ rowData, setRowData, focus }) => {
      if (focus) {
        return (
          <input
            autoFocus
            type="number"
            min="0"
            step="0.01"
            value={rowData.project_budget ?? ''}
            onChange={e => {
              const val = e.target.value
              setRowData({
                ...rowData,
                project_budget: val !== '' ? parseFloat(val) : null,
              })
            }}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              textAlign: 'right',
              fontFamily: 'var(--font-captions)',
              fontSize: 13,
              color: 'var(--foreground-primary)',
              padding: '0 8px',
            }}
          />
        )
      }
      return (
        <div style={{
          padding: '0 8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          width: '100%',
          height: '100%',
          fontFamily: 'var(--font-captions)',
          fontSize: 13,
          color: 'var(--foreground-secondary)',
        }}>
          {rowData.project_budget != null ? rowData.project_budget.toLocaleString() : '—'}
        </div>
      )
    },
    deleteValue: ({ rowData }) => ({ ...rowData, project_budget: null }),
    copyValue: ({ rowData }) => rowData.project_budget?.toString() ?? '',
    pasteValue: ({ rowData, value }) => ({
      ...rowData,
      project_budget: value !== '' ? parseFloat(value) : null,
    }),
  },
], [columnWidths, colTitle, selectedIds, onToggleRow])
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: errors in `App.tsx` about missing `selectedIds` and `onToggleRow` props on `ProjectsGrid`, and missing `selectedCount`/`totalCount`/`onSelectAll`/`onClearAll` on `GridToolbar`. These are expected — fixed in Task 3.

- [ ] **Step 5: Run full test suite**

```bash
npm test -- --run
```

Expected: all tests pass (existing + 6 from Task 1).

- [ ] **Step 6: Commit**

```bash
git add src/components/grid/ProjectsGrid.tsx
git commit -m "feat: add checkbox selection column to ProjectsGrid"
```

---

## Task 3: Wire selection state in App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add useState and useEffect imports**

Open `src/App.tsx`. The first line is currently:

```ts
import { useState } from 'react'
```

Update it to:

```ts
import { useState, useEffect } from 'react'
```

- [ ] **Step 2: Add selectedIds state and callbacks**

After the `handleTogglePanel` line (currently the last line before the `return`), add:

```ts
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

const toggleRowSelection = (id: string) => setSelectedIds(prev => {
  const next = new Set(prev)
  if (next.has(id)) next.delete(id); else next.add(id)
  return next
})
const selectAll = () => setSelectedIds(new Set(displayRows.map(r => r.id)))
const clearSelection = () => setSelectedIds(new Set())

useEffect(() => { setSelectedIds(new Set()) }, [displayRows])
```

- [ ] **Step 3: Wire GridToolbar props**

Update the `<GridToolbar>` JSX from:

```tsx
<GridToolbar onRefresh={refresh} />
```

to:

```tsx
<GridToolbar
  onRefresh={refresh}
  selectedCount={selectedIds.size}
  totalCount={displayRows.length}
  onSelectAll={selectAll}
  onClearAll={clearSelection}
/>
```

- [ ] **Step 4: Wire ProjectsGrid props**

Update the `<ProjectsGrid>` JSX from:

```tsx
<ProjectsGrid rows={displayRows} onRowChange={editRow} />
```

to:

```tsx
<ProjectsGrid
  rows={displayRows}
  onRowChange={editRow}
  selectedIds={selectedIds}
  onToggleRow={toggleRowSelection}
/>
```

- [ ] **Step 5: Verify TypeScript compiles clean**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Run all tests**

```bash
npm test -- --run
```

Expected: all 31 tests pass (25 existing + 6 GridToolbar).

- [ ] **Step 7: Start dev server and verify manually**

```bash
npm run dev
```

Check:
- Each data row has a checkbox in the leftmost column
- Clicking a row checkbox checks it; clicking again unchecks it
- Toolbar checkbox is unchecked when nothing selected
- Toolbar checkbox is indeterminate when some (not all) rows are checked
- Toolbar checkbox is checked when all rows on current page are checked
- Clicking toolbar checkbox when unchecked/indeterminate → checks all rows
- Clicking toolbar checkbox when all checked → unchecks all rows
- Navigating to a different page clears all selections
- Changing the status filter clears all selections

- [ ] **Step 8: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire row selection state in App.tsx"
```
