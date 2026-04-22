# Status Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire a status filter into the SubItemsPanel sidebar so clicking New/Started/Done filters the grid; clicking All shows all records.

**Architecture:** Add a pure helper `applyStatusFilter` to `transforms.ts` (testable without Supabase), hold `activeStatusFilter` state in `useProjects`, and pass it down through `App` → `SubItemsPanel`. The existing `ViewConfig.filters` pipeline handles the actual filtering unchanged.

**Tech Stack:** React 19, TypeScript, Vitest, no new dependencies.

---

## File Map

| File | Change |
|------|--------|
| `src/types/project.ts` | Add `STATUS_OPTIONS` constant |
| `src/lib/transforms.ts` | Add `applyStatusFilter` pure helper |
| `tests/transforms.test.ts` | Add tests for `applyStatusFilter` |
| `src/hooks/useProjects.ts` | Add `activeStatusFilter` state + `setStatusFilter` |
| `src/components/layout/SubItemsPanel.tsx` | Replace hardcoded list with dynamic render |
| `src/App.tsx` | Wire new props to `SubItemsPanel` |

---

## Task 1: Add STATUS_OPTIONS constant

**Files:**
- Modify: `src/types/project.ts`

- [ ] **Step 1: Add the constant after the `ProjectStatus` type**

Open `src/types/project.ts`. After line 1 (`export type ProjectStatus = 'New' | 'Started' | 'Done'`), add:

```ts
export const STATUS_OPTIONS: ProjectStatus[] = ['New', 'Started', 'Done']
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/types/project.ts
git commit -m "feat: add STATUS_OPTIONS constant to project types"
```

---

## Task 2: Add applyStatusFilter helper and tests

**Files:**
- Modify: `src/lib/transforms.ts`
- Modify: `tests/transforms.test.ts`

- [ ] **Step 1: Write the failing tests**

Open `tests/transforms.test.ts`. Add this import at the top alongside the existing ones:

```ts
import { applyFilters, applySorts, paginateRows, applyStatusFilter } from '../src/lib/transforms'
import type { ProjectStatus } from '../src/types/project'
```

Then append a new `describe` block at the end of the file:

```ts
describe('applyStatusFilter', () => {
  it('returns empty filters when status is null and no existing filters', () => {
    expect(applyStatusFilter([], null)).toEqual([])
  })

  it('removes project_status filter when status is null', () => {
    const filters = [{ field: 'project_status' as keyof Project, value: 'New' }]
    expect(applyStatusFilter(filters, null)).toEqual([])
  })

  it('adds project_status filter when status is set', () => {
    const result = applyStatusFilter([], 'Started')
    expect(result).toEqual([{ field: 'project_status', value: 'Started' }])
  })

  it('replaces existing project_status filter when status changes', () => {
    const filters = [{ field: 'project_status' as keyof Project, value: 'New' }]
    const result = applyStatusFilter(filters, 'Done')
    expect(result).toEqual([{ field: 'project_status', value: 'Done' }])
  })

  it('preserves other filters when adding status filter', () => {
    const filters = [{ field: 'project_name' as keyof Project, value: 'test' }]
    const result = applyStatusFilter(filters, 'New')
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ field: 'project_name', value: 'test' })
    expect(result[1]).toEqual({ field: 'project_status', value: 'New' })
  })

  it('preserves other filters when clearing status filter', () => {
    const filters = [
      { field: 'project_name' as keyof Project, value: 'test' },
      { field: 'project_status' as keyof Project, value: 'New' },
    ]
    const result = applyStatusFilter(filters, null)
    expect(result).toEqual([{ field: 'project_name', value: 'test' }])
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- --run tests/transforms.test.ts
```

Expected: FAIL — `applyStatusFilter is not a function` (or similar import error).

- [ ] **Step 3: Implement applyStatusFilter in transforms.ts**

Open `src/lib/transforms.ts`. Add this import at the top:

```ts
import type { Project, FilterSpec, SortSpec, ProjectStatus } from '../types/project'
```

Then append the function at the end of the file:

```ts
export function applyStatusFilter(filters: FilterSpec[], status: ProjectStatus | null): FilterSpec[] {
  const without = filters.filter(f => f.field !== 'project_status')
  if (status === null) return without
  return [...without, { field: 'project_status', value: status }]
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test -- --run tests/transforms.test.ts
```

Expected: all `applyStatusFilter` tests PASS, all existing tests still PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/transforms.ts tests/transforms.test.ts
git commit -m "feat: add applyStatusFilter helper with tests"
```

---

## Task 3: Add activeStatusFilter state to useProjects

**Files:**
- Modify: `src/hooks/useProjects.ts`

- [ ] **Step 1: Add import for new helpers**

Open `src/hooks/useProjects.ts`. Update the import from `../lib/transforms` to include `applyStatusFilter`:

```ts
import { applyFilters, applySorts, paginateRows, applyStatusFilter } from '../lib/transforms'
```

Update the import from `../types/project` to include `ProjectStatus` and `STATUS_OPTIONS` (STATUS_OPTIONS not strictly needed here but ProjectStatus is):

```ts
import type { Project, ProjectInsert, ProjectUpdate, ViewConfig, PaginationState, ProjectStatus } from '../types/project'
```

- [ ] **Step 2: Add activeStatusFilter state**

Inside `useProjects`, after the `selectedRowId` state line, add:

```ts
const [activeStatusFilter, setActiveStatusFilter] = useState<ProjectStatus | null>(null)
```

- [ ] **Step 3: Add setStatusFilter callback**

After the `setPage` callback, add:

```ts
const setStatusFilter = useCallback((status: ProjectStatus | null) => {
  setActiveStatusFilter(status)
  setViewConfig(vc => ({ ...vc, filters: applyStatusFilter(vc.filters, status) }))
}, [])
```

- [ ] **Step 4: Add to return object**

In the `return` statement of `useProjects`, add:

```ts
activeStatusFilter,
setStatusFilter,
```

- [ ] **Step 5: Update the UseProjectsReturn interface**

Add these two lines to the `UseProjectsReturn` interface:

```ts
activeStatusFilter: ProjectStatus | null
setStatusFilter: (status: ProjectStatus | null) => void
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Run all tests**

```bash
npm test -- --run
```

Expected: all tests PASS.

- [ ] **Step 8: Commit**

```bash
git add src/hooks/useProjects.ts
git commit -m "feat: add activeStatusFilter state to useProjects"
```

---

## Task 4: Update SubItemsPanel

**Files:**
- Modify: `src/components/layout/SubItemsPanel.tsx`

- [ ] **Step 1: Replace the file content**

Replace the entire contents of `src/components/layout/SubItemsPanel.tsx` with:

```tsx
import { STATUS_OPTIONS, type ProjectStatus } from '../../types/project'

interface SubItemsPanelProps {
  totalCount: number
  onAddItem: () => void
  activeStatusFilter: ProjectStatus | null
  onStatusChange: (status: ProjectStatus | null) => void
}

function filterButtonStyle(active: boolean) {
  return {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 12px',
    borderRadius: active ? 'var(--radius-round)' : 'var(--radius-sm)',
    background: active ? 'var(--surface-secondary)' : 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: active ? 'var(--foreground-primary)' : 'var(--foreground-secondary)',
    fontFamily: 'var(--font-body)',
    fontSize: 13,
    fontWeight: active ? 600 : 400,
    textAlign: 'left',
    width: '100%',
  }
}

export function SubItemsPanel({ totalCount, onAddItem, activeStatusFilter, onStatusChange }: SubItemsPanelProps) {
  const isAll = activeStatusFilter === null

  return (
    <div style={{
      width: 200,
      minHeight: '100vh',
      background: 'var(--surface-panel)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      padding: '16px 0',
    }}>
      <div style={{ padding: '0 16px 8px' }}>
        <div style={{ fontFamily: 'var(--font-headings)', fontSize: 16, fontWeight: 700, color: 'var(--foreground-primary)' }}>
          Projects
        </div>
        <div style={{ fontFamily: 'var(--font-captions)', fontSize: 12, color: 'var(--foreground-secondary)' }}>
          {totalCount.toLocaleString()}
        </div>
      </div>

      <div style={{ padding: '4px 8px 8px' }}>
        <button
          onClick={onAddItem}
          aria-label="Add new item"
          style={{
            width: '100%',
            height: 34,
            borderRadius: 'var(--radius-round)',
            background: 'var(--accent-primary)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            fontWeight: 600,
            boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
          Add Item
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 8px' }}>
        <button
          aria-label="All"
          aria-current={isAll ? 'true' : undefined}
          onClick={() => onStatusChange(null)}
          style={filterButtonStyle(isAll)}
        >
          All
        </button>

        {STATUS_OPTIONS.map(status => {
          const active = activeStatusFilter === status
          return (
            <button
              key={status}
              aria-label={status}
              aria-current={active ? 'true' : undefined}
              onClick={() => onStatusChange(status)}
              style={filterButtonStyle(active)}
            >
              {status}
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: error in `App.tsx` about missing props `activeStatusFilter` and `onStatusChange` — this is expected and will be fixed in Task 5.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/SubItemsPanel.tsx
git commit -m "feat: replace hardcoded filter views with dynamic status filter in SubItemsPanel"
```

---

## Task 5: Wire props in App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Destructure new values from useProjects**

Open `src/App.tsx`. Update the destructuring of `useProjects()` to include:

```ts
const {
  displayRows,
  sourceRows,
  loading,
  error,
  pagination,
  refresh,
  setPage,
  editRow,
  addRow,
  activeStatusFilter,
  setStatusFilter,
} = useProjects()
```

- [ ] **Step 2: Pass new props to SubItemsPanel**

Update the `<SubItemsPanel>` JSX call to:

```tsx
<SubItemsPanel
  totalCount={sourceRows.length}
  onAddItem={handleAddItem}
  activeStatusFilter={activeStatusFilter}
  onStatusChange={setStatusFilter}
/>
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Run all tests**

```bash
npm test -- --run
```

Expected: all tests PASS.

- [ ] **Step 5: Run the dev server and verify manually**

```bash
npm run dev
```

Check:
- Sidebar shows: All, New, Started, Done (no icons)
- "All" is highlighted on load
- Clicking "New" highlights "New" and grid shows only New rows
- Clicking "Started" switches highlight and shows only Started rows
- Clicking a status with no matching rows shows the empty state
- Clicking "All" returns to full list with "All" highlighted

- [ ] **Step 6: Final commit**

```bash
git add src/App.tsx
git commit -m "feat: wire status filter from useProjects to SubItemsPanel"
```
