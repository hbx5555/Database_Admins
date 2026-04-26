# Deals Table Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Deals table (pipeline view) as a first-class view alongside Projects and Contacts, with grid + kanban, a full editor modal, and Supabase Storage-backed proposal document uploads.

**Architecture:** Follows the established pattern — `types/` → `lib/api` → `lib/transforms` → `useTableData` wrapper hook → DSG grid + KanbanBoard + editor modal. Adds `storageApi.ts` as a shared file-upload utility reusable by future tables. Wires Deals as the first nav item in the sidebar.

**Tech Stack:** React 19, TypeScript, react-datasheet-grid, @dnd-kit/core, @supabase/supabase-js, vitest + @testing-library/react

---

## File Map

| Action | Path | Role |
|---|---|---|
| Create | `src/types/deal.ts` | Deal interface, DealStatus, colors, labels |
| Create | `src/lib/storageApi.ts` | `uploadDocument` / `deleteDocument` (shared across tables) |
| Create | `src/lib/dealsApi.ts` | Supabase CRUD for `deals` table |
| Modify | `src/lib/transforms.ts` | Add 4 deal transform functions |
| Create | `src/hooks/useDeals.ts` | Thin `useTableData` wrapper |
| Modify | `src/hooks/useColumnResize.ts` | Add `DEAL_COLUMN_LS_KEY` and `DEAL_DEFAULT_WIDTHS` |
| Modify | `src/config/tables.ts` | Add `DEALS_CONFIG` |
| Create | `src/components/grid/DealsGrid.tsx` | DSG grid with proposal upload/download cell |
| Create | `src/components/grid/DealEditorModal.tsx` | Editor modal with file upload UI |
| Modify | `src/components/layout/IconSidebar.tsx` | Move `label` icon to position 1, wire `'deals'` |
| Modify | `src/components/layout/SubItemsPanel.tsx` | Add deals status filters block |
| Modify | `src/App.tsx` | Wire useDeals, renders, modal, handlers |
| Create | `tests/dealTransforms.test.ts` | Unit tests for 4 deal transform functions |

---

### Task 1: Deal Types

**Files:**
- Create: `src/types/deal.ts`

- [ ] **Step 1: Create `src/types/deal.ts`**

```typescript
export type DealStatus = 'New' | 'In Discussions' | 'Signed' | 'Rejected'
export const DEAL_STATUS_OPTIONS: DealStatus[] = ['New', 'In Discussions', 'Signed', 'Rejected']

export const DEAL_STATUS_COLORS: Record<DealStatus, { bg: string; text: string }> = {
  New:              { bg: '#E8F4EA', text: '#2D5E3A' },
  'In Discussions': { bg: '#FFF3CD', text: '#856404' },
  Signed:           { bg: '#D4EDDA', text: '#155724' },
  Rejected:         { bg: '#F8D7DA', text: '#721C24' },
}

export interface Deal {
  id: string
  deal_name: string
  deal_description: string | null
  last_call_content: string | null
  last_call_datetime: string | null  // ISO 8601 with timezone, e.g. "2026-04-26T14:30:00Z"
  proposal_url: string | null
  proposal_filename: string | null
  status: DealStatus | null
  created_at: string
  updated_at: string
}

// Excludes id, created_at, updated_at — generated server-side
export type DealInsert = Omit<Deal, 'id' | 'created_at' | 'updated_at'>
export type DealUpdate = Partial<DealInsert>

export const DEAL_COLUMN_LABELS: Record<string, string> = {
  deal_name: 'Deal Name',
  deal_description: 'Description',
  last_call_content: 'Last Call Notes',
  last_call_datetime: 'Last Call',
  proposal_url: 'Proposal',
  proposal_filename: 'Proposal',
  status: 'Status',
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/types/deal.ts
git commit -m "feat: add Deal types"
```

---

### Task 2: Storage API

**Files:**
- Create: `src/lib/storageApi.ts`

- [ ] **Step 1: Create `src/lib/storageApi.ts`**

```typescript
import { supabase } from './supabase'

// Shared upload utility for any table's file attachments.
// Path in the 'documents' bucket: {table}/{recordId}/{filename}
export async function uploadDocument(
  table: string,
  recordId: string,
  file: File,
): Promise<{ url: string; filename: string }> {
  const path = `${table}/${recordId}/${file.name}`
  const { error } = await supabase.storage
    .from('documents')
    .upload(path, file, { upsert: true })
  if (error) throw new Error(error.message)
  const { data } = supabase.storage.from('documents').getPublicUrl(path)
  return { url: data.publicUrl, filename: file.name }
}

export async function deleteDocument(
  table: string,
  recordId: string,
  filename: string,
): Promise<void> {
  const path = `${table}/${recordId}/${filename}`
  const { error } = await supabase.storage.from('documents').remove([path])
  if (error) throw new Error(error.message)
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/storageApi.ts
git commit -m "feat: add shared storageApi for Supabase Storage uploads"
```

---

### Task 3: Deals API

**Files:**
- Create: `src/lib/dealsApi.ts`

- [ ] **Step 1: Create `src/lib/dealsApi.ts`**

```typescript
import { supabase } from './supabase'
import type { Deal, DealInsert, DealUpdate } from '../types/deal'

export async function fetchDeals(): Promise<Deal[]> {
  const { data, error } = await supabase
    .from('deals')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data as Deal[]
}

export async function createDeal(row: DealInsert): Promise<Deal> {
  const { data, error } = await supabase
    .from('deals')
    .insert(row)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as Deal
}

export async function updateDeal(id: string, changes: DealUpdate): Promise<Deal> {
  const { data, error } = await supabase
    .from('deals')
    .update(changes)
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as Deal
}

export async function deleteDeals(ids: string[]): Promise<void> {
  const { error } = await supabase.from('deals').delete().in('id', ids)
  if (error) throw new Error(error.message)
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/dealsApi.ts
git commit -m "feat: add dealsApi CRUD functions"
```

---

### Task 4: Deal Transforms + Tests

**Files:**
- Modify: `src/lib/transforms.ts`
- Create: `tests/dealTransforms.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/dealTransforms.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import {
  applyDealStatusFilter,
  applyDealSorts,
  applyDealSearch,
  paginateDealRows,
} from '../src/lib/transforms'
import type { Deal } from '../src/types/deal'

function makeDeal(overrides: Partial<Deal>): Deal {
  return {
    id: '1', deal_name: 'Test Deal', deal_description: null,
    last_call_content: null, last_call_datetime: null,
    proposal_url: null, proposal_filename: null, status: 'New',
    created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('applyDealStatusFilter', () => {
  it('returns all rows when status is null', () => {
    const rows = [makeDeal({ status: 'New' }), makeDeal({ status: 'Signed' })]
    expect(applyDealStatusFilter(rows, null)).toHaveLength(2)
  })

  it('returns only rows matching status', () => {
    const rows = [makeDeal({ id: '1', status: 'New' }), makeDeal({ id: '2', status: 'Signed' })]
    const result = applyDealStatusFilter(rows, 'Signed')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('2')
  })

  it('excludes rows with null status', () => {
    const rows = [makeDeal({ id: '1', status: null }), makeDeal({ id: '2', status: 'New' })]
    expect(applyDealStatusFilter(rows, 'New')).toHaveLength(1)
  })
})

describe('applyDealSearch', () => {
  it('returns all rows for empty query', () => {
    const rows = [makeDeal({ deal_name: 'Alpha' }), makeDeal({ deal_name: 'Beta' })]
    expect(applyDealSearch(rows, '')).toHaveLength(2)
  })

  it('matches deal_name case-insensitively', () => {
    const rows = [makeDeal({ id: '1', deal_name: 'Alpha Deal' }), makeDeal({ id: '2', deal_name: 'Beta Deal' })]
    expect(applyDealSearch(rows, 'alpha')).toHaveLength(1)
    expect(applyDealSearch(rows, 'alpha')[0].id).toBe('1')
  })

  it('matches deal_description', () => {
    const rows = [
      makeDeal({ id: '1', deal_description: 'Important contract' }),
      makeDeal({ id: '2', deal_description: null }),
    ]
    expect(applyDealSearch(rows, 'contract')).toHaveLength(1)
  })

  it('returns empty array when no match', () => {
    const rows = [makeDeal({ deal_name: 'Zebra' })]
    expect(applyDealSearch(rows, 'zzz')).toHaveLength(0)
  })
})

describe('applyDealSorts', () => {
  it('returns rows unchanged when sorts is empty', () => {
    const rows = [makeDeal({ id: '1' }), makeDeal({ id: '2' })]
    expect(applyDealSorts(rows, [])).toEqual(rows)
  })

  it('sorts by deal_name ascending', () => {
    const rows = [makeDeal({ id: '1', deal_name: 'Zebra' }), makeDeal({ id: '2', deal_name: 'Alpha' })]
    const result = applyDealSorts(rows, [{ field: 'deal_name', direction: 'asc' }])
    expect(result[0].id).toBe('2')
    expect(result[1].id).toBe('1')
  })

  it('sorts by deal_name descending', () => {
    const rows = [makeDeal({ id: '1', deal_name: 'Alpha' }), makeDeal({ id: '2', deal_name: 'Zebra' })]
    const result = applyDealSorts(rows, [{ field: 'deal_name', direction: 'desc' }])
    expect(result[0].id).toBe('2')
  })

  it('does not mutate the original array', () => {
    const rows = [makeDeal({ id: '1', deal_name: 'Z' }), makeDeal({ id: '2', deal_name: 'A' })]
    applyDealSorts(rows, [{ field: 'deal_name', direction: 'asc' }])
    expect(rows[0].id).toBe('1')
  })
})

describe('paginateDealRows', () => {
  it('returns first page correctly', () => {
    const rows = Array.from({ length: 25 }, (_, i) => makeDeal({ id: String(i) }))
    const page1 = paginateDealRows(rows, 1, 10)
    expect(page1).toHaveLength(10)
    expect(page1[0].id).toBe('0')
  })

  it('returns second page correctly', () => {
    const rows = Array.from({ length: 25 }, (_, i) => makeDeal({ id: String(i) }))
    const page2 = paginateDealRows(rows, 2, 10)
    expect(page2).toHaveLength(10)
    expect(page2[0].id).toBe('10')
  })

  it('returns partial last page', () => {
    const rows = Array.from({ length: 25 }, (_, i) => makeDeal({ id: String(i) }))
    expect(paginateDealRows(rows, 3, 10)).toHaveLength(5)
  })
})
```

- [ ] **Step 2: Run tests — expect all to fail**

Run: `npm test -- dealTransforms`
Expected: FAIL — "applyDealStatusFilter is not a function" (functions don't exist yet)

- [ ] **Step 3: Add deal transforms to `src/lib/transforms.ts`**

Append to the end of the existing file (after the contact transforms section):

```typescript
// ── Deal transforms ────────────────────────────────────────────────────────────

import type { Deal, DealStatus } from '../types/deal'
import type { GenericSortSpec } from '../hooks/useTableData'

export function applyDealStatusFilter(rows: Deal[], status: DealStatus | null): Deal[] {
  if (status === null) return rows
  return rows.filter(row => row.status === status)
}

export function applyDealSorts(rows: Deal[], sorts: GenericSortSpec<Deal>[]): Deal[] {
  if (sorts.length === 0) return rows
  return [...rows].sort((a, b) => {
    for (const sort of sorts) {
      const aVal = a[sort.field] ?? ''
      const bVal = b[sort.field] ?? ''
      const cmp = String(aVal).localeCompare(String(bVal))
      if (cmp !== 0) return sort.direction === 'asc' ? cmp : -cmp
    }
    return 0
  })
}

export function applyDealSearch(rows: Deal[], query: string): Deal[] {
  const q = query.trim().toLowerCase()
  if (!q) return rows
  return rows.filter(row =>
    row.deal_name?.toLowerCase().includes(q) ||
    row.deal_description?.toLowerCase().includes(q)
  )
}

export function paginateDealRows(rows: Deal[], page: number, pageSize: number): Deal[] {
  const start = (page - 1) * pageSize
  return rows.slice(start, start + pageSize)
}
```

- [ ] **Step 4: Run tests — expect all to pass**

Run: `npm test -- dealTransforms`
Expected: PASS — 12 tests passing

- [ ] **Step 5: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add src/lib/transforms.ts tests/dealTransforms.test.ts
git commit -m "feat: add deal transform functions with tests"
```

---

### Task 5: useDeals Hook

**Files:**
- Create: `src/hooks/useDeals.ts`

- [ ] **Step 1: Create `src/hooks/useDeals.ts`**

```typescript
import { useTableData } from './useTableData'
import { fetchDeals, createDeal, updateDeal, deleteDeals } from '../lib/dealsApi'
import { applyDealStatusFilter, applyDealSorts, applyDealSearch, paginateDealRows } from '../lib/transforms'
import type { Deal, DealInsert, DealUpdate, DealStatus } from '../types/deal'

function buildOptimisticRow(data: DealInsert): Deal {
  return {
    ...data,
    id: `optimistic-${Date.now()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

// Defined at module level so the object reference is stable across renders
const DEAL_CONFIG = {
  fetch: fetchDeals,
  create: createDeal,
  update: updateDeal,
  deleteMany: deleteDeals,
  filterByStatus: applyDealStatusFilter,
  sortRows: applyDealSorts,
  searchRows: applyDealSearch,
  paginate: paginateDealRows,
  buildOptimisticRow,
}

export function useDeals() {
  return useTableData<Deal, DealInsert, DealUpdate, DealStatus>(DEAL_CONFIG)
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useDeals.ts
git commit -m "feat: add useDeals hook"
```

---

### Task 6: Config, Column Widths, and Kanban Formatter

**Files:**
- Modify: `src/types/tableConfig.ts`
- Modify: `src/components/grid/KanbanBoard.tsx`
- Modify: `src/hooks/useColumnResize.ts`
- Modify: `src/config/tables.ts`

`last_call_datetime` on Kanban cards would render as a raw ISO string without this step. Adding an optional `cardFieldFormatters` map to `TableConfig` so DEALS_CONFIG can supply a human-friendly formatter.

- [ ] **Step 1: Add `cardFieldFormatters` to `src/types/tableConfig.ts`**

Replace the entire file:

```typescript
import type { GenericSortSpec } from '../hooks/useTableData'

export interface TableConfig<TRow, TStatus extends string = string> {
  label: string
  statusField: keyof TRow
  statusOptions: TStatus[]
  statusColors: Record<TStatus, { bg: string; text: string }>
  primaryField: keyof TRow
  cardFields: (keyof TRow)[]
  columnLabels: Record<string, string>
  defaultSorts: GenericSortSpec<TRow>[]
  // Optional per-field display formatters for Kanban card body fields.
  // Key is the field name as a string; value transforms the raw value to a display string.
  cardFieldFormatters?: Record<string, (val: unknown) => string>
}
```

- [ ] **Step 2: Update `CardContent` in `src/components/grid/KanbanBoard.tsx` to use the formatter**

The `CardContentProps` interface currently is:

```typescript
interface CardContentProps<T extends { id: string }> {
  row: T
  primaryField: keyof T
  cardFields: (keyof T)[]
  columnLabels: Record<string, string>
  accentColor: string
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}
```

Replace it with (add `cardFieldFormatters`):

```typescript
interface CardContentProps<T extends { id: string }> {
  row: T
  primaryField: keyof T
  cardFields: (keyof T)[]
  columnLabels: Record<string, string>
  accentColor: string
  cardFieldFormatters?: Record<string, (val: unknown) => string>
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}
```

In the `CardContent` function signature, add `cardFieldFormatters` to destructuring:

```typescript
function CardContent<T extends { id: string }>({
  row, primaryField, cardFields, columnLabels, accentColor, cardFieldFormatters, onEdit, onDelete,
}: CardContentProps<T>) {
```

In the `visibleFields.map` block, find this line:

```typescript
            {String(row[field])}
```

Replace it with:

```typescript
            {cardFieldFormatters?.[String(field)]
              ? cardFieldFormatters[String(field)](row[field])
              : String(row[field])}
```

The `KanbanBoard` component passes `config` down to `KanbanLane`, which passes it to `KanbanCard`, which passes it to `CardContent`. Update the props chain:

In `KanbanLaneProps`, add:
```typescript
  cardFieldFormatters?: Record<string, (val: unknown) => string>
```

In `KanbanLane` function signature, add `cardFieldFormatters` to destructuring and pass it to `KanbanCard`:
```typescript
function KanbanLane<T extends { id: string }, TStatus extends string>({
  status, colors, cards, primaryField, cardFields, columnLabels, cardFieldFormatters, onEdit, onDelete,
}: KanbanLaneProps<T, TStatus>) {
```

In the `KanbanCard` call inside `KanbanLane`, add the prop:
```typescript
          <KanbanCard
            key={row.id}
            row={row}
            primaryField={primaryField}
            cardFields={cardFields}
            columnLabels={columnLabels}
            cardFieldFormatters={cardFieldFormatters}
            accentColor={colors.text}
            onEdit={onEdit}
            onDelete={onDelete}
          />
```

In `KanbanCardProps`, add:
```typescript
  cardFieldFormatters?: Record<string, (val: unknown) => string>
```

In `KanbanCard` function signature and `CardContent` call, thread `cardFieldFormatters` through:
```typescript
function KanbanCard<T extends { id: string }>({
  row, primaryField, cardFields, columnLabels, accentColor, cardFieldFormatters, onEdit, onDelete,
}: KanbanCardProps<T>) {
```

Pass it to `CardContent` inside `KanbanCard`:
```typescript
      <CardContent
        row={row}
        primaryField={primaryField}
        cardFields={cardFields}
        columnLabels={columnLabels}
        cardFieldFormatters={cardFieldFormatters}
        accentColor={accentColor}
        onEdit={onEdit}
        onDelete={onDelete}
      />
```

In `KanbanBoard`, pass `config.cardFieldFormatters` to `KanbanLane`:
```typescript
            <KanbanLane
              key={status}
              status={status}
              colors={config.statusColors[status]}
              cards={grouped[status] ?? []}
              primaryField={config.primaryField}
              cardFields={config.cardFields}
              columnLabels={config.columnLabels}
              cardFieldFormatters={config.cardFieldFormatters}
              onEdit={onEdit}
              onDelete={onDelete}
            />
```

- [ ] **Step 3: Add deal constants to `src/hooks/useColumnResize.ts`**

After the `CONTACT_DEFAULT_WIDTHS` block (line 23), add:

```typescript
export const DEAL_COLUMN_LS_KEY = 'db-admins-deal-widths'

export const DEAL_DEFAULT_WIDTHS: Record<string, number> = {
  deal_name: 200,
  deal_description: 220,
  last_call_datetime: 160,
  proposal_filename: 160,
  status: 130,
}
```

- [ ] **Step 4: Replace `src/config/tables.ts` with the version including `DEALS_CONFIG`**

```typescript
import type { TableConfig } from '../types/tableConfig'
import type { Project, ProjectStatus } from '../types/project'
import { STATUS_OPTIONS, STATUS_COLORS, COLUMN_LABELS } from '../types/project'
import type { Contact, ContactStatus } from '../types/contact'
import { CONTACT_STATUS_OPTIONS, CONTACT_STATUS_COLORS, CONTACT_COLUMN_LABELS } from '../types/contact'
import type { Deal, DealStatus } from '../types/deal'
import { DEAL_STATUS_OPTIONS, DEAL_STATUS_COLORS, DEAL_COLUMN_LABELS } from '../types/deal'

export const PROJECTS_CONFIG: TableConfig<Project, ProjectStatus> = {
  label: 'Projects',
  statusField: 'project_status',
  statusOptions: STATUS_OPTIONS,
  statusColors: STATUS_COLORS,
  primaryField: 'project_name',
  cardFields: ['project_topic', 'project_budget'],
  columnLabels: COLUMN_LABELS,
  defaultSorts: [],
}

export const CONTACTS_CONFIG: TableConfig<Contact, ContactStatus> = {
  label: 'Contacts',
  statusField: 'status',
  statusOptions: CONTACT_STATUS_OPTIONS,
  statusColors: CONTACT_STATUS_COLORS,
  primaryField: 'full_name',
  cardFields: ['role', 'location'],
  columnLabels: CONTACT_COLUMN_LABELS,
  defaultSorts: [],
}

export const DEALS_CONFIG: TableConfig<Deal, DealStatus> = {
  label: 'Deals',
  statusField: 'status',
  statusOptions: DEAL_STATUS_OPTIONS,
  statusColors: DEAL_STATUS_COLORS,
  primaryField: 'deal_name',
  cardFields: ['deal_description', 'last_call_datetime'],
  columnLabels: DEAL_COLUMN_LABELS,
  defaultSorts: [],
  cardFieldFormatters: {
    last_call_datetime: (val) =>
      val ? new Date(val as string).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '',
  },
}
```

- [ ] **Step 5: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add src/types/tableConfig.ts src/components/grid/KanbanBoard.tsx src/hooks/useColumnResize.ts src/config/tables.ts
git commit -m "feat: add cardFieldFormatters to TableConfig, deal column widths, and DEALS_CONFIG"
```

---

### Task 7: DealsGrid

**Files:**
- Create: `src/components/grid/DealsGrid.tsx`

- [ ] **Step 1: Create `src/components/grid/DealsGrid.tsx`**

```typescript
import { useCallback, useMemo, useRef, useState } from 'react'
import { DataSheetGrid, textColumn, keyColumn } from 'react-datasheet-grid'
import type { Column } from 'react-datasheet-grid'
import type { Deal, DealUpdate, DealStatus } from '../../types/deal'
import { DEAL_COLUMN_LABELS, DEAL_STATUS_OPTIONS, DEAL_STATUS_COLORS } from '../../types/deal'
import { useColumnResize, DEAL_COLUMN_LS_KEY, DEAL_DEFAULT_WIDTHS } from '../../hooks/useColumnResize'
import { ResizeHandle } from './ResizeHandle'
import type { GenericSortSpec } from '../../hooks/useTableData'

type Operation = { type: 'UPDATE' | 'DELETE' | 'CREATE'; fromRowIndex: number; toRowIndex: number }
type DealRow = Deal & { _selected: boolean }
type DealColumn = Partial<Column<DealRow, unknown, string>>

interface DealsGridProps {
  rows: Deal[]
  onRowChange: (id: string, changes: DealUpdate) => void
  selectedIds: Set<string>
  onToggleRow: (id: string) => void
  onEditRow: (id: string) => void
  sorts: GenericSortSpec<Deal>[]
  onSortField: (field: keyof Deal) => void
  onUploadProposal: (id: string, file: File) => Promise<void>
}

export function DealsGrid({
  rows, onRowChange, selectedIds, onToggleRow, onEditRow, sorts, onSortField, onUploadProposal,
}: DealsGridProps) {
  const { columnWidths, finalizeWidth } = useColumnResize(DEAL_COLUMN_LS_KEY, DEAL_DEFAULT_WIDTHS)
  const [resizeVersion, setResizeVersion] = useState(0)

  const viewRows = useMemo(
    () => rows.map(r => ({ ...r, _selected: selectedIds.has(r.id) })),
    [rows, selectedIds]
  )

  const handleFinalizeWidth = useCallback((key: string, width: number) => {
    finalizeWidth(key, width)
    setResizeVersion(v => v + 1)
  }, [finalizeWidth])

  const colTitle = useCallback((key: string, label: string) => {
    const sort = sorts.find(s => s.field === key)
    return (
      <div
        onMouseDown={e => { e.nativeEvent.stopImmediatePropagation(); onSortField(key as keyof Deal) }}
        style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%', height: '100%', cursor: 'pointer' }}
      >
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingLeft: 10, paddingRight: 4 }}>
          {label}
        </span>
        <span className="material-symbols-outlined" style={{ fontSize: 36, marginRight: 4, flexShrink: 0, color: 'var(--accent-primary)', opacity: sort ? 1 : 0.3 }}>
          {sort?.direction === 'asc' ? 'arrow_drop_down' : 'arrow_drop_up'}
        </span>
        <ResizeHandle columnKey={key} onFinalizeWidth={handleFinalizeWidth} currentWidth={columnWidths[key]} />
      </div>
    )
  }, [columnWidths, handleFinalizeWidth, sorts, onSortField])

  const sortKey = sorts.map(s => `${String(s.field)}:${s.direction}`).join(',')

  const inp = (readOnly?: boolean): React.CSSProperties => ({
    width: '100%', height: '100%', border: 'none', outline: 'none',
    background: readOnly ? '#F9F8F6' : 'transparent',
    fontFamily: 'var(--font-body)', fontSize: 13,
    color: readOnly ? 'var(--foreground-secondary)' : 'var(--foreground-primary)',
    padding: '0 8px', cursor: readOnly ? 'default' : 'text',
  })

  const columns: DealColumn[] = useMemo(() => [
    {
      basis: 48, grow: 0, shrink: 0,
      disableKeys: true,
      cellClassName: 'checkbox-cell',
      title: <div style={{ width: 48 }} />,
      component: ({ rowData }: { rowData: DealRow }) => (
        <div
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', cursor: 'pointer' }}
          onMouseDown={e => { e.nativeEvent.stopImmediatePropagation(); onToggleRow(rowData.id) }}
        >
          <input type="checkbox" checked={rowData._selected} readOnly
            style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--accent-primary)', pointerEvents: 'none' }} />
        </div>
      ),
    },
    {
      ...(keyColumn('deal_name', textColumn) as unknown as DealColumn),
      title: colTitle('deal_name', DEAL_COLUMN_LABELS.deal_name),
      basis: columnWidths.deal_name, grow: 0, shrink: 0,
    },
    {
      ...(keyColumn('deal_description', textColumn) as unknown as DealColumn),
      title: colTitle('deal_description', DEAL_COLUMN_LABELS.deal_description),
      basis: columnWidths.deal_description, grow: 0, shrink: 0,
    },
    {
      title: colTitle('last_call_datetime', DEAL_COLUMN_LABELS.last_call_datetime),
      basis: columnWidths.last_call_datetime, grow: 0, shrink: 0,
      disableKeys: true,
      component: ({ rowData }: { rowData: DealRow }) => (
        <div style={{ ...inp(true), display: 'flex', alignItems: 'center' }}>
          {rowData.last_call_datetime
            ? new Date(rowData.last_call_datetime).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
            : <span style={{ color: 'var(--foreground-secondary)' }}>—</span>}
        </div>
      ),
      copyValue: ({ rowData }: { rowData: DealRow }) => rowData.last_call_datetime ?? '',
    },
    {
      title: colTitle('proposal_filename', DEAL_COLUMN_LABELS.proposal_filename),
      basis: columnWidths.proposal_filename, grow: 0, shrink: 0,
      disableKeys: true,
      component: ({ rowData }: { rowData: DealRow }) => {
        const isOptimistic = rowData.id.startsWith('optimistic-')
        if (rowData.proposal_filename && rowData.proposal_url) {
          return (
            <div style={{ padding: '0 8px', display: 'flex', alignItems: 'center', height: '100%' }}>
              <a
                href={rowData.proposal_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                style={{ fontSize: 12, color: 'var(--accent-primary)', textDecoration: 'underline', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
              >
                {rowData.proposal_filename}
              </a>
            </div>
          )
        }
        return (
          <div style={{ padding: '0 8px', display: 'flex', alignItems: 'center', height: '100%' }}>
            {isOptimistic ? (
              <span style={{ fontSize: 11, color: 'var(--foreground-secondary)', fontFamily: 'var(--font-body)' }}>Save first</span>
            ) : (
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}
                onMouseDown={e => e.nativeEvent.stopImmediatePropagation()}>
                <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--foreground-secondary)' }}>upload_file</span>
                <span style={{ fontSize: 12, color: 'var(--foreground-secondary)', fontFamily: 'var(--font-body)' }}>Upload</span>
                <input
                  type="file"
                  style={{ display: 'none' }}
                  onChange={async e => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    await onUploadProposal(rowData.id, file)
                    e.target.value = ''
                  }}
                />
              </label>
            )}
          </div>
        )
      },
    },
    {
      title: colTitle('status', DEAL_COLUMN_LABELS.status),
      basis: columnWidths.status ?? 130, grow: 0, shrink: 0,
      keepFocus: true,
      component: ({ rowData, setRowData, focus }: { rowData: DealRow; setRowData: (r: DealRow) => void; focus: boolean }) => {
        if (focus) {
          return (
            <select
              autoFocus
              value={rowData.status ?? ''}
              onChange={e => {
                const val = e.target.value
                setRowData({ ...rowData, status: DEAL_STATUS_OPTIONS.includes(val as DealStatus) ? val as DealStatus : null })
              }}
              style={{ width: '100%', height: '100%', border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--foreground-primary)', cursor: 'pointer', padding: '0 8px' }}
            >
              <option value="">—</option>
              {DEAL_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )
        }
        return (
          <div style={{ padding: '0 8px', display: 'flex', alignItems: 'center', height: '100%' }}>
            {rowData.status
              ? <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 'var(--radius-pill)', backgroundColor: DEAL_STATUS_COLORS[rowData.status].bg, color: DEAL_STATUS_COLORS[rowData.status].text, fontSize: 12, fontFamily: 'var(--font-captions)', fontWeight: 500, lineHeight: '20px', whiteSpace: 'nowrap' }}>{rowData.status}</span>
              : <span style={{ color: 'var(--foreground-secondary)' }}>—</span>}
          </div>
        )
      },
      deleteValue: ({ rowData }: { rowData: DealRow }) => ({ ...rowData, status: null }),
      copyValue: ({ rowData }: { rowData: DealRow }) => rowData.status ?? '',
      pasteValue: ({ rowData, value }: { rowData: DealRow; value: string }) => ({
        ...rowData, status: DEAL_STATUS_OPTIONS.includes(value as DealStatus) ? value as DealStatus : null,
      }),
    },
  ], [columnWidths, colTitle, onToggleRow, onUploadProposal])

  const handleChange = (newRows: DealRow[], operations: Operation[]) => {
    for (const op of operations) {
      if (op.type !== 'UPDATE') continue
      for (let i = op.fromRowIndex; i < op.toRowIndex; i++) {
        const updated = newRows[i]
        const original = rows.find(r => r.id === updated.id)
        if (!original) continue
        const changes: DealUpdate = {}
        if (updated.deal_name !== original.deal_name) changes.deal_name = updated.deal_name
        if (updated.deal_description !== original.deal_description) changes.deal_description = updated.deal_description
        if (updated.status !== original.status) changes.status = updated.status
        if (Object.keys(changes).length > 0) onRowChange(original.id, changes)
      }
    }
  }

  const wrapperRef = useRef<HTMLDivElement>(null)

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!(e.target as HTMLElement).closest('.dsg-cell-gutter')) return
    const wrapper = wrapperRef.current
    if (!wrapper) return
    const rowIndex = Math.floor(
      (e.clientY - wrapper.getBoundingClientRect().top + wrapper.scrollTop - 40) / 40
    )
    if (rowIndex >= 0 && rowIndex < rows.length) onEditRow(rows[rowIndex].id)
  }

  return (
    <div ref={wrapperRef} onDoubleClick={handleDoubleClick} style={{ flex: 1, overflow: 'auto' }}>
      <style>{`
        .dsg-container { font-family: var(--font-body); font-size: 13px; border: none !important; }
        .dsg-cell-header { background: var(--surface-primary) !important; font-size: 12px; font-weight: 600; color: var(--foreground-primary); font-family: var(--font-body); }
        .dsg-cell-header-container { width: 100%; height: 100%; padding: 0; display: flex; align-items: center; line-height: normal; overflow: visible; }
        .dsg-row:hover .dsg-cell { background: var(--row-hover) !important; }
        .checkbox-cell { padding: 0 !important; }
      `}</style>
      <DataSheetGrid<DealRow>
        key={`${resizeVersion}-${sortKey}`}
        value={viewRows}
        onChange={handleChange}
        columns={columns}
        rowHeight={40}
        headerRowHeight={40}
        addRowsComponent={false}
        disableContextMenu
        lockRows
      />
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/grid/DealsGrid.tsx
git commit -m "feat: add DealsGrid with proposal upload/download cell"
```

---

### Task 8: DealEditorModal

**Files:**
- Create: `src/components/grid/DealEditorModal.tsx`

- [ ] **Step 1: Create `src/components/grid/DealEditorModal.tsx`**

```typescript
import { useRef, useState } from 'react'
import type { Deal, DealInsert, DealUpdate, DealStatus } from '../../types/deal'
import { DEAL_COLUMN_LABELS, DEAL_STATUS_OPTIONS } from '../../types/deal'
import { uploadDocument, deleteDocument } from '../../lib/storageApi'

const LABEL_W = 180

interface FieldRowProps {
  label: string
  fieldKey: string
  focused: string | null
  bold?: boolean
  align?: 'center' | 'start'
  children: React.ReactNode
}

function FieldRow({ label, fieldKey, focused, bold, align = 'center', children }: FieldRowProps) {
  return (
    <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
      <div style={{
        width: LABEL_W, flexShrink: 0,
        background: 'var(--surface-primary)',
        display: 'flex', alignItems: align === 'start' ? 'flex-start' : 'center',
        justifyContent: 'flex-end',
        padding: align === 'start' ? '14px 20px 0' : '0 20px', minHeight: 52,
      }}>
        <span style={{
          fontSize: 12, fontFamily: 'var(--font-body)',
          color: focused === fieldKey ? 'var(--accent-primary)' : 'var(--foreground-secondary)',
          fontWeight: bold || focused === fieldKey ? 700 : 400,
          transition: 'color 0.15s',
        }}>
          {label}
        </span>
      </div>
      <div style={{
        flex: 1, padding: '8px 28px',
        display: 'flex', alignItems: align === 'start' ? 'flex-start' : 'center',
        background: 'var(--white)',
      }}>
        {children}
      </div>
    </div>
  )
}

const EMPTY_DRAFT: DealInsert = {
  deal_name: '',
  deal_description: null,
  last_call_content: null,
  last_call_datetime: null,
  proposal_url: null,
  proposal_filename: null,
  status: null,
}

interface DealEditorModalProps {
  row?: Deal
  onSave: (id: string, changes: DealUpdate) => void
  onAdd: (data: DealInsert) => void
  onClose: () => void
}

export function DealEditorModal({ row, onSave, onAdd, onClose }: DealEditorModalProps) {
  const isNew = !row
  const [draft, setDraft] = useState<DealInsert>(isNew ? { ...EMPTY_DRAFT } : {
    deal_name: row.deal_name,
    deal_description: row.deal_description,
    last_call_content: row.last_call_content,
    last_call_datetime: row.last_call_datetime,
    proposal_url: row.proposal_url,
    proposal_filename: row.proposal_filename,
    status: row.status,
  })
  const [focused, setFocused] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const set = <K extends keyof DealInsert>(key: K, val: DealInsert[K]) =>
    setDraft(d => ({ ...d, [key]: val }))

  // Converts ISO string to value suitable for <input type="datetime-local">
  const toDatetimeLocal = (iso: string | null): string => {
    if (!iso) return ''
    return iso.slice(0, 16)
  }

  const handleSave = async () => {
    if (isNew) {
      onAdd({ ...draft })
    } else {
      // If proposal was removed, delete from storage first
      if (row.proposal_filename && !draft.proposal_filename) {
        try {
          await deleteDocument('deals', row.id, row.proposal_filename)
        } catch {
          // Non-fatal — proceed with save even if storage delete fails
        }
      }
      const changes: DealUpdate = {}
      if (draft.deal_name !== row.deal_name) changes.deal_name = draft.deal_name
      if (draft.deal_description !== row.deal_description) changes.deal_description = draft.deal_description
      if (draft.last_call_content !== row.last_call_content) changes.last_call_content = draft.last_call_content
      if (draft.last_call_datetime !== row.last_call_datetime) changes.last_call_datetime = draft.last_call_datetime
      if (draft.proposal_url !== row.proposal_url) changes.proposal_url = draft.proposal_url
      if (draft.proposal_filename !== row.proposal_filename) changes.proposal_filename = draft.proposal_filename
      if (draft.status !== row.status) changes.status = draft.status
      if (Object.keys(changes).length > 0) onSave(row.id, changes)
    }
    onClose()
  }

  const inp = (key: string): React.CSSProperties => ({
    width: '100%',
    padding: '9px 12px',
    fontSize: 13,
    fontFamily: 'var(--font-body)',
    border: `1.5px solid ${focused === key ? 'var(--accent-primary)' : 'var(--border-color)'}`,
    borderRadius: 'var(--radius-md)',
    background: 'var(--white)',
    color: 'var(--foreground-primary)',
    outline: 'none',
    transition: 'border-color 0.15s',
  })

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ width: '100%', maxWidth: 680, borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: '0 16px 64px rgba(0,0,0,0.22)', display: 'flex', maxHeight: '90vh', position: 'relative' }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 10, right: 10, zIndex: 1, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--foreground-secondary)', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 'var(--radius-sm)' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
        </button>

        <div style={{ width: 8, background: 'var(--accent-primary)', flexShrink: 0 }} />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', background: 'var(--white)' }}>
          <div style={{ height: 26 }} />

          <FieldRow label={DEAL_COLUMN_LABELS.deal_name} fieldKey="deal_name" focused={focused} bold>
            <input
              type="text"
              value={draft.deal_name ?? ''}
              onChange={e => set('deal_name', e.target.value)}
              onFocus={() => setFocused('deal_name')}
              onBlur={() => setFocused(null)}
              style={inp('deal_name')}
            />
          </FieldRow>

          <FieldRow label={DEAL_COLUMN_LABELS.deal_description} fieldKey="deal_description" focused={focused} align="start">
            <textarea
              value={draft.deal_description ?? ''}
              onChange={e => set('deal_description', e.target.value || null)}
              onFocus={() => setFocused('deal_description')}
              onBlur={() => setFocused(null)}
              rows={3}
              style={{ ...inp('deal_description'), resize: 'vertical' }}
            />
          </FieldRow>

          <FieldRow label={DEAL_COLUMN_LABELS.last_call_datetime} fieldKey="last_call_datetime" focused={focused}>
            <input
              type="datetime-local"
              value={toDatetimeLocal(draft.last_call_datetime)}
              onChange={e => set('last_call_datetime', e.target.value ? new Date(e.target.value).toISOString() : null)}
              onFocus={() => setFocused('last_call_datetime')}
              onBlur={() => setFocused(null)}
              style={inp('last_call_datetime')}
            />
          </FieldRow>

          <FieldRow label={DEAL_COLUMN_LABELS.last_call_content} fieldKey="last_call_content" focused={focused} align="start">
            <textarea
              value={draft.last_call_content ?? ''}
              onChange={e => set('last_call_content', e.target.value || null)}
              onFocus={() => setFocused('last_call_content')}
              onBlur={() => setFocused(null)}
              rows={4}
              style={{ ...inp('last_call_content'), resize: 'vertical' }}
            />
          </FieldRow>

          <FieldRow label={DEAL_COLUMN_LABELS.proposal_filename} fieldKey="proposal_filename" focused={focused}>
            {isNew ? (
              <span style={{ fontSize: 12, color: 'var(--foreground-secondary)', fontFamily: 'var(--font-body)' }}>
                Save the deal first to attach a proposal
              </span>
            ) : uploading ? (
              <span style={{ fontSize: 13, color: 'var(--foreground-secondary)', fontFamily: 'var(--font-body)' }}>
                Uploading…
              </span>
            ) : draft.proposal_filename ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
                <span style={{ fontSize: 13, fontFamily: 'var(--font-body)', color: 'var(--accent-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {draft.proposal_filename}
                </span>
                <button
                  type="button"
                  onClick={() => { set('proposal_url', null); set('proposal_filename', null) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--foreground-secondary)', fontSize: 12, fontFamily: 'var(--font-body)', flexShrink: 0 }}
                >
                  Remove
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ padding: '6px 14px', borderRadius: 'var(--radius-md)', background: 'transparent', border: '1.5px solid var(--border-color)', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-body)', color: 'var(--foreground-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>upload_file</span>
                  Choose file
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  style={{ display: 'none' }}
                  onChange={async e => {
                    const file = e.target.files?.[0]
                    if (!file || !row) return
                    setUploading(true)
                    setUploadError(null)
                    try {
                      const { url, filename } = await uploadDocument('deals', row.id, file)
                      set('proposal_url', url)
                      set('proposal_filename', filename)
                    } catch (err) {
                      setUploadError(err instanceof Error ? err.message : 'Upload failed')
                    } finally {
                      setUploading(false)
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }
                  }}
                />
                {uploadError && (
                  <span style={{ fontSize: 12, color: '#C0392B', fontFamily: 'var(--font-body)' }}>{uploadError}</span>
                )}
              </div>
            )}
          </FieldRow>

          <FieldRow label={DEAL_COLUMN_LABELS.status} fieldKey="status" focused={focused}>
            <select
              value={draft.status ?? ''}
              onChange={e => {
                const v = e.target.value
                set('status', DEAL_STATUS_OPTIONS.includes(v as DealStatus) ? v as DealStatus : null)
              }}
              onFocus={() => setFocused('status')}
              onBlur={() => setFocused(null)}
              style={{ ...inp('status'), cursor: 'pointer' }}
            >
              <option value="">—</option>
              {DEAL_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </FieldRow>

          <div style={{ display: 'flex', borderTop: '1px solid var(--border-color)' }}>
            <div style={{ width: LABEL_W, flexShrink: 0, background: 'var(--surface-primary)' }} />
            <div style={{ flex: 1, padding: '16px 28px', display: 'flex', gap: 10, alignItems: 'center' }}>
              <button
                onClick={handleSave}
                disabled={uploading}
                style={{ padding: '8px 20px', borderRadius: 'var(--radius-md)', background: 'var(--accent-primary)', border: 'none', cursor: uploading ? 'default' : 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)', color: 'var(--foreground-inverse)', opacity: uploading ? 0.6 : 1 }}
              >
                {isNew ? 'Add Deal' : 'Save Changes'}
              </button>
              <button
                onClick={onClose}
                style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', background: 'transparent', color: 'var(--foreground-secondary)', border: '1.5px solid var(--border-color)', cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-body)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/grid/DealEditorModal.tsx
git commit -m "feat: add DealEditorModal with file upload"
```

---

### Task 9: Sidebar Update

**Files:**
- Modify: `src/components/layout/IconSidebar.tsx`

- [ ] **Step 1: Update `src/components/layout/IconSidebar.tsx`**

Replace the entire file:

```typescript
export type AppView = 'deals' | 'projects' | 'contacts'

interface IconSidebarProps {
  activeView: AppView
  onSelectView: (view: AppView) => void
  onTogglePanel: () => void
}

const NAV_ICONS: { name: string; label: string; view: AppView | null }[] = [
  { name: 'label',      label: 'Deals',    view: 'deals' },
  { name: 'task_alt',   label: 'Projects', view: 'projects' },
  { name: 'person',     label: 'Contacts', view: 'contacts' },
  { name: 'folder',     label: 'Folder',   view: null },
  { name: 'leaderboard',label: 'Leads',    view: null },
]

export function IconSidebar({ activeView, onSelectView, onTogglePanel }: IconSidebarProps) {
  return (
    <div style={{ width: 56, minHeight: '100vh', background: 'var(--accent-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0', flexShrink: 0 }}>
      <button
        aria-label="Toggle menu"
        onClick={onTogglePanel}
        style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', marginBottom: 16, display: 'flex', alignItems: 'center' }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 28 }}>menu</span>
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        {NAV_ICONS.map(icon => {
          const isActive = icon.view !== null && icon.view === activeView
          return (
            <button
              key={icon.name}
              title={icon.label}
              aria-label={icon.label}
              onClick={() => { if (icon.view) onSelectView(icon.view) }}
              style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', border: 'none', cursor: icon.view ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isActive ? 'var(--accent-secondary)' : 'transparent' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 24, color: isActive ? 'white' : 'rgba(255,255,255,0.6)' }}>
                {icon.name}
              </span>
            </button>
          )
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <button
          aria-label="Settings"
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', borderRadius: 'var(--radius-md)', padding: 4 }}
        >
          <span className="material-symbols-outlined" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 24 }}>settings</span>
        </button>
        <button
          aria-label="User profile"
          style={{ width: 32, height: 32, borderRadius: 'var(--radius-round)', background: 'var(--accent-secondary)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontFamily: 'var(--font-captions)', fontWeight: 600, cursor: 'pointer' }}
        >
          HD
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: TypeScript errors about `'deals'` not being in AppView in other files — that's expected and will be fixed in the next tasks.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/IconSidebar.tsx
git commit -m "feat: add deals nav icon as first item in sidebar"
```

---

### Task 10: SubItemsPanel Update

**Files:**
- Modify: `src/components/layout/SubItemsPanel.tsx`

- [ ] **Step 1: Replace `src/components/layout/SubItemsPanel.tsx`**

```typescript
import { STATUS_OPTIONS, type ProjectStatus } from '../../types/project'
import { CONTACT_STATUS_OPTIONS, type ContactStatus } from '../../types/contact'
import { DEAL_STATUS_OPTIONS, type DealStatus } from '../../types/deal'
import type { AppView } from './IconSidebar'

interface SubItemsPanelProps {
  activeView: AppView
  totalCount: number
  onAddItem: () => void
  activeStatusFilter: ProjectStatus | null
  onStatusChange: (status: ProjectStatus | null) => void
  activeContactStatusFilter: ContactStatus | null
  onContactStatusChange: (status: ContactStatus | null) => void
  activeDealStatusFilter: DealStatus | null
  onDealStatusChange: (status: DealStatus | null) => void
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
    textAlign: 'left' as const,
    width: '100%',
  }
}

const VIEW_LABELS: Record<AppView, string> = {
  deals: 'Deals',
  projects: 'Projects',
  contacts: 'Contacts',
}

export function SubItemsPanel({
  activeView, totalCount, onAddItem,
  activeStatusFilter, onStatusChange,
  activeContactStatusFilter, onContactStatusChange,
  activeDealStatusFilter, onDealStatusChange,
}: SubItemsPanelProps) {
  const isAll = activeStatusFilter === null
  const isContactAll = activeContactStatusFilter === null
  const isDealAll = activeDealStatusFilter === null

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: 'var(--surface-panel)', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', padding: '16px 0' }}>
      <div style={{ padding: '0 16px 8px' }}>
        <div style={{ fontFamily: 'var(--font-headings)', fontSize: 16, fontWeight: 700, color: 'var(--foreground-primary)' }}>
          {VIEW_LABELS[activeView]}
        </div>
        <div style={{ fontFamily: 'var(--font-captions)', fontSize: 12, color: 'var(--foreground-secondary)' }}>
          {totalCount.toLocaleString()}
        </div>
      </div>

      <div style={{ padding: '4px 8px 8px' }}>
        <button
          onClick={onAddItem}
          aria-label="Edit item"
          style={{ width: '100%', height: 34, borderRadius: 'var(--radius-round)', background: 'var(--accent-primary)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, boxShadow: '0 2px 4px rgba(0,0,0,0.15)' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
          Edit Item
        </button>
      </div>

      {activeView === 'deals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 8px' }}>
          <button aria-label="All" aria-current={isDealAll ? 'page' : undefined} onClick={() => onDealStatusChange(null)} style={filterButtonStyle(isDealAll)}>All</button>
          {DEAL_STATUS_OPTIONS.map(status => {
            const active = activeDealStatusFilter === status
            return (
              <button key={status} aria-label={status} aria-current={active ? 'page' : undefined} onClick={() => onDealStatusChange(status)} style={filterButtonStyle(active)}>
                {status}
              </button>
            )
          })}
        </div>
      )}

      {activeView === 'projects' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 8px' }}>
          <button aria-label="All" aria-current={isAll ? 'page' : undefined} onClick={() => onStatusChange(null)} style={filterButtonStyle(isAll)}>All</button>
          {STATUS_OPTIONS.map(status => {
            const active = activeStatusFilter === status
            return (
              <button key={status} aria-label={status} aria-current={active ? 'page' : undefined} onClick={() => onStatusChange(status)} style={filterButtonStyle(active)}>
                {status}
              </button>
            )
          })}
        </div>
      )}

      {activeView === 'contacts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 8px' }}>
          <button aria-label="All" aria-current={isContactAll ? 'page' : undefined} onClick={() => onContactStatusChange(null)} style={filterButtonStyle(isContactAll)}>All</button>
          {CONTACT_STATUS_OPTIONS.map(status => {
            const active = activeContactStatusFilter === status
            return (
              <button key={status} aria-label={status} aria-current={active ? 'page' : undefined} onClick={() => onContactStatusChange(status)} style={filterButtonStyle(active)}>
                {status}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: errors about `SubItemsPanel` missing `activeDealStatusFilter` / `onDealStatusChange` props in `App.tsx` — expected, fixed in Task 11.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/SubItemsPanel.tsx
git commit -m "feat: add deals status filters to SubItemsPanel"
```

---

### Task 11: App.tsx Wiring

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Replace `src/App.tsx` with the fully wired version**

```typescript
import { useState, useEffect, useCallback } from 'react'
import { useProjects } from './hooks/useProjects'
import { useContacts } from './hooks/useContacts'
import { useDeals } from './hooks/useDeals'
import { IconSidebar, type AppView } from './components/layout/IconSidebar'
import { SubItemsPanel } from './components/layout/SubItemsPanel'
import { MainContent } from './components/layout/MainContent'
import { GridToolbar } from './components/grid/GridToolbar'
import { GridStatusBar } from './components/grid/GridStatusBar'
import { ProjectsGrid } from './components/grid/ProjectsGrid'
import { ContactsGrid } from './components/grid/ContactsGrid'
import { DealsGrid } from './components/grid/DealsGrid'
import { KanbanBoard } from './components/grid/KanbanBoard'
import { RecordEditorModal } from './components/grid/RecordEditorModal'
import { ContactEditorModal } from './components/grid/ContactEditorModal'
import { DealEditorModal } from './components/grid/DealEditorModal'
import { PROJECTS_CONFIG, CONTACTS_CONFIG, DEALS_CONFIG } from './config/tables'
import { uploadDocument } from './lib/storageApi'
import { LoadingState } from './components/shared/LoadingState'
import { ErrorState } from './components/shared/ErrorState'
import { EmptyState } from './components/shared/EmptyState'
import type { ProjectInsert, Project } from './types/project'
import type { Contact, ContactInsert } from './types/contact'
import type { Deal, DealInsert } from './types/deal'

const NEW_PROJECT_DEFAULTS: ProjectInsert = {
  project_name: 'New Project',
  project_topic: null,
  project_status: 'New',
  project_start_date: null,
  project_delivery_date: null,
  project_budget: null,
}

const NEW_CONTACT_DEFAULTS: ContactInsert = {
  first_name: 'New',
  last_name: 'Contact',
  phone_number: null,
  email: null,
  role: null,
  location: null,
  status: null,
}

const NEW_DEAL_DEFAULTS: DealInsert = {
  deal_name: 'New Deal',
  deal_description: null,
  last_call_content: null,
  last_call_datetime: null,
  proposal_url: null,
  proposal_filename: null,
  status: 'New',
}

export default function App() {
  const [activeView, setActiveView] = useState<AppView>('deals')
  const [panelOpen, setPanelOpen] = useState(true)

  // ── Projects ─────────────────────────────────────────────────────────────
  const {
    displayRows: projectRows,
    filteredRows: projectFilteredRows,
    sourceRows: projectSourceRows,
    loading: projectsLoading,
    error: projectsError,
    pagination: projectsPagination,
    refresh: refreshProjects,
    setPage: setProjectsPage,
    editRow: editProject,
    addRow: addProject,
    removeRows: removeProjects,
    activeStatusFilter,
    setStatusFilter,
    searchQuery: projectSearch,
    setSearchQuery: setProjectSearch,
    sorts: projectSorts,
    setSortField: setProjectSort,
    viewMode: projectViewMode,
    setViewMode: setProjectViewMode,
  } = useProjects()

  const [projectSelectedIds, setProjectSelectedIds] = useState<Set<string>>(new Set())
  const [editingProject, setEditingProject] = useState<Project | 'new' | null>(null)

  const toggleProjectRow = useCallback((id: string) => setProjectSelectedIds(prev => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id); else next.add(id)
    return next
  }), [])
  const selectAllProjects = useCallback(() => setProjectSelectedIds(new Set(projectRows.map(r => r.id))), [projectRows])
  const clearProjectSelection = useCallback(() => setProjectSelectedIds(new Set()), [])
  const deleteSelectedProjects = useCallback(() => {
    if (projectSelectedIds.size === 0) return
    clearProjectSelection()
    removeProjects([...projectSelectedIds]).catch(() => {})
  }, [projectSelectedIds, clearProjectSelection, removeProjects])

  useEffect(() => { setProjectSelectedIds(new Set()) }, [projectRows])

  const handleEditProject = useCallback((id: string) => {
    const row = projectRows.find(r => r.id === id)
    if (row) setEditingProject(row)
  }, [projectRows])

  const handleProjectFabClick = useCallback(() => {
    if (projectSelectedIds.size === 0) {
      setEditingProject('new')
    } else {
      const row = projectRows.find(r => r.id === [...projectSelectedIds][0])
      if (row) setEditingProject(row)
    }
  }, [projectSelectedIds, projectRows])

  // ── Contacts ─────────────────────────────────────────────────────────────
  const {
    displayRows: contactRows,
    filteredRows: contactFilteredRows,
    sourceRows: contactSourceRows,
    loading: contactsLoading,
    error: contactsError,
    pagination: contactsPagination,
    refresh: refreshContacts,
    setPage: setContactsPage,
    editRow: editContact,
    addRow: addContact,
    removeRows: removeContacts,
    searchQuery: contactSearch,
    setSearchQuery: setContactSearch,
    sorts: contactSorts,
    setSortField: setContactSort,
    activeStatusFilter: activeContactStatusFilter,
    setStatusFilter: setContactStatusFilter,
    viewMode: contactViewMode,
    setViewMode: setContactViewMode,
  } = useContacts()

  const [contactSelectedIds, setContactSelectedIds] = useState<Set<string>>(new Set())
  const [editingContact, setEditingContact] = useState<Contact | 'new' | null>(null)

  const toggleContactRow = useCallback((id: string) => setContactSelectedIds(prev => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id); else next.add(id)
    return next
  }), [])
  const selectAllContacts = useCallback(() => setContactSelectedIds(new Set(contactRows.map(r => r.id))), [contactRows])
  const clearContactSelection = useCallback(() => setContactSelectedIds(new Set()), [])
  const deleteSelectedContacts = useCallback(() => {
    if (contactSelectedIds.size === 0) return
    clearContactSelection()
    removeContacts([...contactSelectedIds]).catch(() => {})
  }, [contactSelectedIds, clearContactSelection, removeContacts])

  useEffect(() => { setContactSelectedIds(new Set()) }, [contactRows])

  const handleEditContact = useCallback((id: string) => {
    const row = contactRows.find(r => r.id === id)
    if (row) setEditingContact(row)
  }, [contactRows])

  const handleContactFabClick = useCallback(() => {
    if (contactSelectedIds.size === 0) {
      setEditingContact('new')
    } else {
      const row = contactRows.find(r => r.id === [...contactSelectedIds][0])
      if (row) setEditingContact(row)
    }
  }, [contactSelectedIds, contactRows])

  // ── Deals ─────────────────────────────────────────────────────────────────
  const {
    displayRows: dealRows,
    filteredRows: dealFilteredRows,
    sourceRows: dealSourceRows,
    loading: dealsLoading,
    error: dealsError,
    pagination: dealsPagination,
    refresh: refreshDeals,
    setPage: setDealsPage,
    editRow: editDeal,
    addRow: addDeal,
    removeRows: removeDeals,
    searchQuery: dealSearch,
    setSearchQuery: setDealSearch,
    sorts: dealSorts,
    setSortField: setDealSort,
    activeStatusFilter: activeDealStatusFilter,
    setStatusFilter: setDealStatusFilter,
    viewMode: dealViewMode,
    setViewMode: setDealViewMode,
  } = useDeals()

  const [dealSelectedIds, setDealSelectedIds] = useState<Set<string>>(new Set())
  const [editingDeal, setEditingDeal] = useState<Deal | 'new' | null>(null)

  const toggleDealRow = useCallback((id: string) => setDealSelectedIds(prev => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id); else next.add(id)
    return next
  }), [])
  const selectAllDeals = useCallback(() => setDealSelectedIds(new Set(dealRows.map(r => r.id))), [dealRows])
  const clearDealSelection = useCallback(() => setDealSelectedIds(new Set()), [])
  const deleteSelectedDeals = useCallback(() => {
    if (dealSelectedIds.size === 0) return
    clearDealSelection()
    removeDeals([...dealSelectedIds]).catch(() => {})
  }, [dealSelectedIds, clearDealSelection, removeDeals])

  useEffect(() => { setDealSelectedIds(new Set()) }, [dealRows])

  const handleEditDeal = useCallback((id: string) => {
    const row = dealRows.find(r => r.id === id)
    if (row) setEditingDeal(row)
  }, [dealRows])

  const handleDealFabClick = useCallback(() => {
    if (dealSelectedIds.size === 0) {
      setEditingDeal('new')
    } else {
      const row = dealRows.find(r => r.id === [...dealSelectedIds][0])
      if (row) setEditingDeal(row)
    }
  }, [dealSelectedIds, dealRows])

  const handleUploadProposal = useCallback(async (id: string, file: File) => {
    const { url, filename } = await uploadDocument('deals', id, file)
    editDeal(id, { proposal_url: url, proposal_filename: filename })
  }, [editDeal])

  // ── Derived values for current view ──────────────────────────────────────
  const isProjects = activeView === 'projects'
  const isContacts = activeView === 'contacts'
  const isDeals = activeView === 'deals'

  const loading = isProjects ? projectsLoading : isContacts ? contactsLoading : dealsLoading
  const error = isProjects ? projectsError : isContacts ? contactsError : dealsError
  const displayRows = isProjects ? projectRows : isContacts ? contactRows : dealRows
  const sourceCount = isProjects ? projectSourceRows.length : isContacts ? contactSourceRows.length : dealSourceRows.length
  const pagination = isProjects ? projectsPagination : isContacts ? contactsPagination : dealsPagination
  const selectedCount = isProjects ? projectSelectedIds.size : isContacts ? contactSelectedIds.size : dealSelectedIds.size
  const searchQuery = isProjects ? projectSearch : isContacts ? contactSearch : dealSearch
  const onSearchChange = isProjects ? setProjectSearch : isContacts ? setContactSearch : setDealSearch
  const onRefresh = isProjects ? refreshProjects : isContacts ? refreshContacts : refreshDeals
  const onSelectAll = isProjects ? selectAllProjects : isContacts ? selectAllContacts : selectAllDeals
  const onClearAll = isProjects ? clearProjectSelection : isContacts ? clearContactSelection : clearDealSelection
  const onDeleteSelected = isProjects ? deleteSelectedProjects : isContacts ? deleteSelectedContacts : deleteSelectedDeals
  const onPageChange = isProjects ? setProjectsPage : isContacts ? setContactsPage : setDealsPage
  const onFabClick = isProjects ? handleProjectFabClick : isContacts ? handleContactFabClick : handleDealFabClick
  const viewMode = isProjects ? projectViewMode : isContacts ? contactViewMode : dealViewMode
  const onViewModeChange = isProjects ? setProjectViewMode : isContacts ? setContactViewMode : setDealViewMode
  const filteredRows = isProjects ? projectFilteredRows : isContacts ? contactFilteredRows : dealFilteredRows

  return (
    <div style={{ display: 'flex', minHeight: '100vh', minWidth: 1044 }}>
      <IconSidebar
        activeView={activeView}
        onSelectView={setActiveView}
        onTogglePanel={() => setPanelOpen(p => !p)}
      />

      <div
        aria-hidden={!panelOpen}
        inert={!panelOpen}
        style={{ width: panelOpen ? 200 : 0, overflow: 'hidden', flexShrink: 0, transition: 'width 250ms ease' }}
      >
        <SubItemsPanel
          activeView={activeView}
          totalCount={sourceCount}
          onAddItem={onFabClick}
          activeStatusFilter={activeStatusFilter}
          onStatusChange={setStatusFilter}
          activeContactStatusFilter={activeContactStatusFilter}
          onContactStatusChange={setContactStatusFilter}
          activeDealStatusFilter={activeDealStatusFilter}
          onDealStatusChange={setDealStatusFilter}
        />
      </div>

      <MainContent>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--white)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden', position: 'relative' }}>
          <GridToolbar
            onRefresh={onRefresh}
            selectedCount={selectedCount}
            totalCount={displayRows.length}
            onSelectAll={onSelectAll}
            onClearAll={onClearAll}
            onDeleteSelected={onDeleteSelected}
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            viewMode={viewMode}
            onViewModeChange={onViewModeChange}
          />

          {loading && <LoadingState />}
          {!loading && error && <ErrorState message={error} onRetry={onRefresh} />}
          {!loading && !error && displayRows.length === 0 && <EmptyState />}

          {!loading && !error && filteredRows.length > 0 && isProjects && viewMode === 'grid' && (
            <ProjectsGrid
              rows={projectRows}
              onRowChange={editProject}
              selectedIds={projectSelectedIds}
              onToggleRow={toggleProjectRow}
              onEditRow={handleEditProject}
              sorts={projectSorts}
              onSortField={setProjectSort}
            />
          )}

          {!loading && !error && filteredRows.length > 0 && isProjects && viewMode === 'kanban' && (
            <KanbanBoard
              rows={projectFilteredRows}
              config={PROJECTS_CONFIG}
              onEdit={handleEditProject}
              onDelete={id => removeProjects([id])}
              onStatusChange={(id, status) => editProject(id, { project_status: status })}
            />
          )}

          {!loading && !error && filteredRows.length > 0 && isContacts && viewMode === 'grid' && (
            <ContactsGrid
              rows={contactRows}
              onRowChange={editContact}
              selectedIds={contactSelectedIds}
              onToggleRow={toggleContactRow}
              onEditRow={handleEditContact}
              sorts={contactSorts}
              onSortField={setContactSort}
            />
          )}

          {!loading && !error && filteredRows.length > 0 && isContacts && viewMode === 'kanban' && (
            <KanbanBoard
              rows={contactFilteredRows}
              config={CONTACTS_CONFIG}
              onEdit={handleEditContact}
              onDelete={id => removeContacts([id])}
              onStatusChange={(id, status) => editContact(id, { status })}
            />
          )}

          {!loading && !error && filteredRows.length > 0 && isDeals && viewMode === 'grid' && (
            <DealsGrid
              rows={dealRows}
              onRowChange={editDeal}
              selectedIds={dealSelectedIds}
              onToggleRow={toggleDealRow}
              onEditRow={handleEditDeal}
              sorts={dealSorts}
              onSortField={setDealSort}
              onUploadProposal={handleUploadProposal}
            />
          )}

          {!loading && !error && filteredRows.length > 0 && isDeals && viewMode === 'kanban' && (
            <KanbanBoard
              rows={dealFilteredRows}
              config={DEALS_CONFIG}
              onEdit={handleEditDeal}
              onDelete={id => removeDeals([id])}
              onStatusChange={(id, status) => editDeal(id, { status })}
            />
          )}

          {viewMode === 'grid' && (
            <button
              onClick={() => {
                if (isProjects) addProject(NEW_PROJECT_DEFAULTS).catch(() => {})
                else if (isContacts) addContact(NEW_CONTACT_DEFAULTS).catch(() => {})
                else addDeal(NEW_DEAL_DEFAULTS).catch(() => {})
              }}
              title="Add record"
              style={{ position: 'absolute', bottom: 64, left: 42, width: 44, height: 44, borderRadius: '50%', background: 'var(--accent-primary)', color: 'var(--foreground-inverse)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 10px rgba(0,0,0,0.22)', zIndex: 10 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>add</span>
            </button>
          )}

          {viewMode === 'grid' && <GridStatusBar pagination={pagination} onPageChange={onPageChange} />}
        </div>
      </MainContent>

      {editingProject !== null && (
        <RecordEditorModal
          row={editingProject === 'new' ? undefined : editingProject}
          onSave={editProject}
          onAdd={data => { addProject(data).catch(() => {}) }}
          onClose={() => setEditingProject(null)}
        />
      )}

      {editingContact !== null && (
        <ContactEditorModal
          row={editingContact === 'new' ? undefined : editingContact}
          onSave={editContact}
          onAdd={data => { addContact(data).catch(() => {}) }}
          onClose={() => setEditingContact(null)}
        />
      )}

      {editingDeal !== null && (
        <DealEditorModal
          row={editingDeal === 'new' ? undefined : editingDeal}
          onSave={editDeal}
          onAdd={data => { addDeal(data).catch(() => {}) }}
          onClose={() => setEditingDeal(null)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Run full test suite**

Run: `npm test`
Expected: all tests pass (including the 12 new deal transform tests and the existing GridToolbar tests)

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire Deals view — grid, kanban, editor modal, proposal upload"
```

- [ ] **Step 5: Push**

```bash
git push
```
