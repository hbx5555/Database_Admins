# Column Resize Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add drag-to-resize on all `ProjectsGrid` column headers with widths persisted to `localStorage`.

**Architecture:** A `useColumnResize` hook owns width state (initialized from `localStorage`, clamped to min 60px) and exposes a `startResize` callback that drives mouse drag tracking via `window` listeners. `ProjectsGrid` calls the hook, replaces each column's `title` string with a `ReactNode` containing a `ResizeHandle`, and feeds `basis/grow/shrink` back into each DSG column definition to pin widths.

**Tech Stack:** React 19, TypeScript, `react-datasheet-grid` (basis/grow/shrink column props), `localStorage`, Vitest + Testing Library.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/hooks/useColumnResize.ts` | Width state, localStorage I/O, drag lifecycle |
| Modify | `src/components/grid/ProjectsGrid.tsx` | Wire hook, replace titles, apply basis props |
| Create | `tests/useColumnResize.test.ts` | Unit tests for the hook |

---

## Task 1: `useColumnResize` hook — tests first

**Files:**
- Create: `tests/useColumnResize.test.ts`
- Create: `src/hooks/useColumnResize.ts`

### Default widths constant (needed by both test and implementation)

The hook exports a `DEFAULT_COLUMN_WIDTHS` constant used as fallback when `localStorage` is empty:

```ts
export const DEFAULT_COLUMN_WIDTHS: Record<string, number> = {
  project_name: 200,
  project_topic: 160,
  project_status: 120,
  project_start_date: 120,
  project_delivery_date: 130,
  project_budget: 110,
}
```

---

- [ ] **Step 1: Write failing tests**

Create `tests/useColumnResize.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useColumnResize, DEFAULT_COLUMN_WIDTHS } from '../src/hooks/useColumnResize'

const LS_KEY = 'db-admins-column-widths'

beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('useColumnResize — initialization', () => {
  it('returns default widths when localStorage is empty', () => {
    const { result } = renderHook(() => useColumnResize())
    expect(result.current.columnWidths).toEqual(DEFAULT_COLUMN_WIDTHS)
  })

  it('merges stored widths over defaults', () => {
    localStorage.setItem(LS_KEY, JSON.stringify({ project_name: 300 }))
    const { result } = renderHook(() => useColumnResize())
    expect(result.current.columnWidths.project_name).toBe(300)
    expect(result.current.columnWidths.project_topic).toBe(DEFAULT_COLUMN_WIDTHS.project_topic)
  })

  it('falls back to defaults when localStorage contains invalid JSON', () => {
    localStorage.setItem(LS_KEY, 'not-json')
    const { result } = renderHook(() => useColumnResize())
    expect(result.current.columnWidths).toEqual(DEFAULT_COLUMN_WIDTHS)
  })
})

describe('useColumnResize — drag', () => {
  it('clamps width to 60px minimum during drag', () => {
    const { result } = renderHook(() => useColumnResize())

    act(() => {
      result.current.startResize('project_name', 500, 200)
    })

    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 200 }))
    })

    expect(result.current.columnWidths.project_name).toBe(60)
  })

  it('increases width when dragged right', () => {
    const { result } = renderHook(() => useColumnResize())

    act(() => {
      result.current.startResize('project_name', 500, 200)
    })

    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 550 }))
    })

    expect(result.current.columnWidths.project_name).toBe(250)
  })

  it('persists widths to localStorage on mouseup', () => {
    const { result } = renderHook(() => useColumnResize())

    act(() => {
      result.current.startResize('project_name', 500, 200)
    })
    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 560 }))
    })
    act(() => {
      window.dispatchEvent(new MouseEvent('mouseup'))
    })

    const stored = JSON.parse(localStorage.getItem(LS_KEY)!)
    expect(stored.project_name).toBe(260)
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd /Users/haimbxpertlink/Documents/GIT_Projects/Database_Admins && npm test -- tests/useColumnResize.test.ts
```

Expected: FAIL — `Cannot find module '../src/hooks/useColumnResize'`

- [ ] **Step 3: Implement `useColumnResize`**

Create `src/hooks/useColumnResize.ts`:

```ts
import { useState, useCallback, useRef } from 'react'

const LS_KEY = 'db-admins-column-widths'
const MIN_WIDTH = 60

export const DEFAULT_COLUMN_WIDTHS: Record<string, number> = {
  project_name: 200,
  project_topic: 160,
  project_status: 120,
  project_start_date: 120,
  project_delivery_date: 130,
  project_budget: 110,
}

function loadFromStorage(): Record<string, number> {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return { ...DEFAULT_COLUMN_WIDTHS }
    return { ...DEFAULT_COLUMN_WIDTHS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_COLUMN_WIDTHS }
  }
}

interface UseColumnResizeReturn {
  columnWidths: Record<string, number>
  startResize: (columnKey: string, startX: number, startWidth: number) => void
}

export function useColumnResize(): UseColumnResizeReturn {
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(loadFromStorage)

  const dragState = useRef<{ key: string; startX: number; startWidth: number } | null>(null)

  const startResize = useCallback((columnKey: string, startX: number, startWidth: number) => {
    dragState.current = { key: columnKey, startX, startWidth }

    const onMouseMove = (e: MouseEvent) => {
      if (!dragState.current) return
      const { key, startX: sx, startWidth: sw } = dragState.current
      const newWidth = Math.max(MIN_WIDTH, sw + (e.clientX - sx))
      setColumnWidths(prev => ({ ...prev, [key]: newWidth }))
    }

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      setColumnWidths(prev => {
        localStorage.setItem(LS_KEY, JSON.stringify(prev))
        return prev
      })
      dragState.current = null
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }, [])

  return { columnWidths, startResize }
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
cd /Users/haimbxpertlink/Documents/GIT_Projects/Database_Admins && npm test -- tests/useColumnResize.test.ts
```

Expected: all 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useColumnResize.ts tests/useColumnResize.test.ts
git commit -m "feat: add useColumnResize hook with localStorage persistence"
```

---

## Task 2: Wire resize into `ProjectsGrid`

**Files:**
- Modify: `src/components/grid/ProjectsGrid.tsx`

This task replaces each column's `title` string with a `ReactNode` containing a `ResizeHandle`, and changes `minWidth` to `basis/grow/shrink` so DSG locks to the tracked pixel width.

- [ ] **Step 1: Add `ResizeHandle` component and update imports**

At the top of `src/components/grid/ProjectsGrid.tsx`, add the import and the `ResizeHandle` component **before** the `ProjectsGrid` function:

Replace:
```ts
import { DataSheetGrid, textColumn, keyColumn } from 'react-datasheet-grid'
import type { Column } from 'react-datasheet-grid'
import type { Project, ProjectUpdate, ProjectStatus } from '../../types/project'
import { COLUMN_LABELS } from '../../types/project'
import { RolePill } from '../shared/RolePill'
```

With:
```ts
import { DataSheetGrid, textColumn, keyColumn } from 'react-datasheet-grid'
import type { Column } from 'react-datasheet-grid'
import type { Project, ProjectUpdate, ProjectStatus } from '../../types/project'
import { COLUMN_LABELS } from '../../types/project'
import { RolePill } from '../shared/RolePill'
import { useColumnResize } from '../../hooks/useColumnResize'

interface ResizeHandleProps {
  columnKey: string
  onStartResize: (key: string, startX: number, startWidth: number) => void
  currentWidth: number
}

function ResizeHandle({ columnKey, onStartResize, currentWidth }: ResizeHandleProps) {
  return (
    <div
      onMouseDown={e => {
        e.stopPropagation()
        onStartResize(columnKey, e.clientX, currentWidth)
      }}
      style={{
        position: 'absolute',
        right: 0,
        top: 0,
        width: 4,
        height: '100%',
        cursor: 'col-resize',
        background: 'transparent',
        zIndex: 1,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--border-color)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
    />
  )
}
```

- [ ] **Step 2: Wire the hook and build column titles**

Inside `ProjectsGrid`, add the hook call and a `columnTitle` helper right after the function signature:

Replace:
```ts
export function ProjectsGrid({ rows, onRowChange }: ProjectsGridProps) {
  // keyColumn infers T[K] as string|null for nullable fields, which conflicts
  // with textColumn's string-only CellComponent. Double-cast via unknown.
  const columns: ProjectColumn[] = [
```

With:
```ts
export function ProjectsGrid({ rows, onRowChange }: ProjectsGridProps) {
  const { columnWidths, startResize } = useColumnResize()

  const colTitle = (key: string, label: string) => (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%', height: '100%' }}>
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }}>
        {label}
      </span>
      <ResizeHandle columnKey={key} onStartResize={startResize} currentWidth={columnWidths[key]} />
    </div>
  )

  // keyColumn infers T[K] as string|null for nullable fields, which conflicts
  // with textColumn's string-only CellComponent. Double-cast via unknown.
  const columns: ProjectColumn[] = [
```

- [ ] **Step 3: Replace column definitions to use `basis/grow/shrink` and `colTitle`**

Replace the entire `columns` array (from the opening `[` to the closing `]`) with:

```ts
  const columns: ProjectColumn[] = [
    {
      ...(keyColumn('project_name', textColumn) as unknown as ProjectColumn),
      title: colTitle('project_name', COLUMN_LABELS.project_name),
      basis: columnWidths.project_name,
      grow: 0,
      shrink: 0,
      minWidth: 60,
    },
    {
      ...(keyColumn('project_topic', textColumn) as unknown as ProjectColumn),
      title: colTitle('project_topic', COLUMN_LABELS.project_topic),
      basis: columnWidths.project_topic,
      grow: 0,
      shrink: 0,
      minWidth: 60,
    },
    {
      title: colTitle('project_status', COLUMN_LABELS.project_status),
      basis: columnWidths.project_status,
      grow: 0,
      shrink: 0,
      minWidth: 60,
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
      basis: columnWidths.project_start_date,
      grow: 0,
      shrink: 0,
      minWidth: 60,
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
      basis: columnWidths.project_delivery_date,
      grow: 0,
      shrink: 0,
      minWidth: 60,
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
      basis: columnWidths.project_budget,
      grow: 0,
      shrink: 0,
      minWidth: 60,
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
  ]
```

- [ ] **Step 4: Run the full test suite**

```bash
cd /Users/haimbxpertlink/Documents/GIT_Projects/Database_Admins && npm test
```

Expected: all tests PASS (transforms + useColumnResize)

- [ ] **Step 5: TypeScript check**

```bash
cd /Users/haimbxpertlink/Documents/GIT_Projects/Database_Admins && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add src/components/grid/ProjectsGrid.tsx
git commit -m "feat: wire column resize handles into ProjectsGrid"
```

---

## Task 3: Manual smoke test

- [ ] **Step 1: Start dev server**

```bash
cd /Users/haimbxpertlink/Documents/GIT_Projects/Database_Admins && npm run dev
```

Open `http://localhost:5173`

- [ ] **Step 2: Verify resize works**

1. Hover over the right edge of any column header — cursor should change to `col-resize`
2. Drag right — column should widen live
3. Drag left past content — column should stop at 60px
4. Release — width stays
5. Reload page — widths should be restored from `localStorage`

- [ ] **Step 3: Commit plan + final state**

```bash
git add docs/superpowers/plans/2026-04-21-column-resize.md
git commit -m "docs: add column resize implementation plan"
```
