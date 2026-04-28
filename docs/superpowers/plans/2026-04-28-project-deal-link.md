# Project → Deal Linked Field Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Each project row gains a `deal_id` FK; the linked deal name appears as a clickable field in the Projects grid and editor modal, opening a read-only `DealViewModal`.

**Architecture:** Mirrors the existing Deal → Contact pattern. `deal_id` + `deals: Deal | null` are added to the `Project` type; all Supabase queries use `.select('*, deals(*)')`. A new `DealViewModal` shows deal details read-only. `ProjectsGrid` and `RecordEditorModal` gain a Deal column/row; `App.tsx` wires a single `viewingDeal` state.

**Tech Stack:** React 18, TypeScript, Supabase JS client, react-datasheet-grid, Vite/Vitest

---

## File Map

| File | Action | What changes |
|---|---|---|
| `src/types/project.ts` | Modify | Add `deal_id`, `deals`; update `ProjectInsert` |
| `src/hooks/useColumnResize.ts` | Modify | Add `deal: 140` to `PROJECT_DEFAULT_WIDTHS` |
| `src/lib/projectsApi.ts` | Modify | Add `deals(*)` join to all 3 select calls |
| `src/hooks/useProjects.ts` | Modify | Add `deals: null` to optimistic row |
| `src/components/grid/DealViewModal.tsx` | **Create** | Read-only deal detail modal |
| `src/components/grid/ProjectsGrid.tsx` | Modify | Add Deal column + `onViewDeal` prop |
| `src/components/grid/RecordEditorModal.tsx` | Modify | Add Deal FieldRow + `onViewDeal` prop |
| `src/App.tsx` | Modify | Add `viewingDeal` state, render `DealViewModal` |
| `tests/transforms.test.ts` | Modify | Update `makeProject` factory with new fields |

---

## Task A: Types + Column Resize

**Files:**
- Modify: `src/types/project.ts`
- Modify: `src/hooks/useColumnResize.ts`
- Modify: `tests/transforms.test.ts`

- [ ] **Step 1: Update `src/types/project.ts`**

Replace the entire file content with:

```ts
import type { Deal } from './deal'

export type ProjectStatus = 'New' | 'Started' | 'Done'
export const STATUS_OPTIONS: ProjectStatus[] = ['New', 'Started', 'Done']

export interface Project {
  id: string
  project_name: string
  project_topic: string | null
  project_status: ProjectStatus | null
  project_start_date: string | null      // ISO date string "YYYY-MM-DD"
  project_delivery_date: string | null   // ISO date string "YYYY-MM-DD"
  project_budget: number | null
  deal_id: string | null
  deals: Deal | null                     // populated by Supabase join; not a DB column
  created_at: string
  updated_at: string
}

// Excludes id, created_at, updated_at, deals — deals is a Supabase join result, not a writable column
export type ProjectInsert = Omit<Project, 'id' | 'created_at' | 'updated_at' | 'deals'>
export type ProjectUpdate = Partial<ProjectInsert>

export interface FilterSpec {
  field: keyof Project
  value: string
}

export interface SortSpec {
  field: keyof Project
  direction: 'asc' | 'desc'
}

export interface ViewConfig {
  visibleColumns: (keyof Project)[]
  filters: FilterSpec[]
  sorts: SortSpec[]
}

export interface PaginationState {
  page: number
  pageSize: number
  total: number
}

export const DEFAULT_VIEW_CONFIG: ViewConfig = {
  visibleColumns: [
    'project_name',
    'project_topic',
    'project_status',
    'project_start_date',
    'project_delivery_date',
    'project_budget',
  ],
  filters: [],
  sorts: [],
}

export const DEFAULT_PAGINATION: PaginationState = {
  page: 1,
  pageSize: 10,
  total: 0,
}

export const STATUS_COLORS: Record<ProjectStatus, { bg: string; text: string }> = {
  New: { bg: '#E8F4EA', text: '#2D5E3A' },
  Started: { bg: '#FFF3CD', text: '#856404' },
  Done: { bg: '#D4EDDA', text: '#155724' },
}

export const COLUMN_LABELS: Record<string, string> = {
  project_name: 'Project Name',
  project_topic: 'Topic',
  project_status: 'Status',
  project_start_date: 'Start Date',
  project_delivery_date: 'Delivery Date',
  project_budget: 'Budget',
  deal_id: 'Deal',
}
```

- [ ] **Step 2: Add `deal: 140` to `PROJECT_DEFAULT_WIDTHS` in `src/hooks/useColumnResize.ts`**

Find:
```ts
export const PROJECT_DEFAULT_WIDTHS: Record<string, number> = {
  project_name: 200,
  project_topic: 160,
  project_status: 120,
  project_start_date: 120,
  project_delivery_date: 130,
  project_budget: 110,
}
```

Replace with:
```ts
export const PROJECT_DEFAULT_WIDTHS: Record<string, number> = {
  project_name: 200,
  deal: 140,
  project_topic: 160,
  project_status: 120,
  project_start_date: 120,
  project_delivery_date: 130,
  project_budget: 110,
}
```

- [ ] **Step 3: Update `makeProject` factory in `tests/transforms.test.ts`**

Find the `makeProject` factory at the top of the file:
```ts
const makeProject = (overrides: Partial<Project>): Project => ({
  id: 'test-id',
  project_name: 'Test Project',
  project_topic: null,
  project_status: 'New',
  project_start_date: null,
  project_delivery_date: null,
  project_budget: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
})
```

Replace with:
```ts
const makeProject = (overrides: Partial<Project>): Project => ({
  id: 'test-id',
  project_name: 'Test Project',
  project_topic: null,
  project_status: 'New',
  project_start_date: null,
  project_delivery_date: null,
  project_budget: null,
  deal_id: null,
  deals: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
})
```

- [ ] **Step 4: Run TypeScript check and tests**

```bash
npx tsc --noEmit && npm test -- --run tests/transforms.test.ts
```

Expected: 0 TypeScript errors, all existing transforms tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/types/project.ts src/hooks/useColumnResize.ts tests/transforms.test.ts
git commit -m "feat: add deal_id and deals join relation to Project type"
```

---

## Task B: API — Add Deals Join

**Files:**
- Modify: `src/lib/projectsApi.ts`

- [ ] **Step 1: Update all three select calls in `src/lib/projectsApi.ts`**

Replace the entire file:

```ts
import { supabase } from './supabase'
import type { Project, ProjectInsert, ProjectUpdate } from '../types/project'

export async function fetchProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*, deals(*)')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data as Project[]
}

export async function createProject(row: ProjectInsert): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .insert(row)
    .select('*, deals(*)')
    .single()

  if (error) throw new Error(error.message)
  return data as Project
}

export async function updateProject(id: string, changes: ProjectUpdate): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .update(changes)
    .eq('id', id)
    .select('*, deals(*)')
    .single()

  if (error) throw new Error(error.message)
  return data as Project
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function deleteProjects(ids: string[]): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .delete()
    .in('id', ids)

  if (error) throw new Error(error.message)
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/projectsApi.ts
git commit -m "feat: add deals(*) join to projectsApi fetch/create/update"
```

---

## Task C: Hook — Optimistic Row

**Files:**
- Modify: `src/hooks/useProjects.ts`

- [ ] **Step 1: Add `deals: null` to `buildOptimisticRow`**

Find:
```ts
function buildOptimisticRow(data: ProjectInsert): Project {
  return {
    ...data,
    id: `optimistic-${Date.now()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}
```

Replace with:
```ts
function buildOptimisticRow(data: ProjectInsert): Project {
  return {
    ...data,
    id: `optimistic-${Date.now()}`,
    deals: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useProjects.ts
git commit -m "feat: set deals: null in project optimistic row"
```

---

## Task D: DealViewModal Component

**Files:**
- Create: `src/components/grid/DealViewModal.tsx`

- [ ] **Step 1: Create `src/components/grid/DealViewModal.tsx`**

```tsx
import type { ReactNode } from 'react'
import type { Deal, DealStatus } from '../../types/deal'
import { DEAL_COLUMN_LABELS, DEAL_STATUS_COLORS } from '../../types/deal'

const LABEL_W = 180

interface FieldRowProps {
  label: string
  bold?: boolean
  children: ReactNode
}

function FieldRow({ label, bold, children }: FieldRowProps) {
  return (
    <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
      <div style={{
        width: LABEL_W, flexShrink: 0,
        background: 'var(--surface-primary)',
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        padding: '0 20px', minHeight: 52,
      }}>
        <span style={{
          fontSize: 12, fontFamily: 'var(--font-body)',
          color: 'var(--foreground-secondary)',
          fontWeight: bold ? 700 : 400,
        }}>
          {label}
        </span>
      </div>
      <div style={{
        flex: 1, padding: '8px 28px',
        display: 'flex', alignItems: 'center',
        background: 'var(--white)',
      }}>
        {children}
      </div>
    </div>
  )
}

function renderField(value: string | null) {
  if (!value) return <span style={{ color: 'var(--foreground-secondary)', fontSize: 13, fontFamily: 'var(--font-body)' }}>—</span>
  return <span style={{ color: 'var(--foreground-primary)', fontSize: 13, fontFamily: 'var(--font-body)' }}>{value}</span>
}

function renderStatus(status: DealStatus | null) {
  if (!status) return <span style={{ color: 'var(--foreground-secondary)', fontSize: 13, fontFamily: 'var(--font-body)' }}>—</span>
  const colors = DEAL_STATUS_COLORS[status]
  return (
    <span style={{
      padding: '2px 10px',
      borderRadius: 'var(--radius-pill)',
      fontSize: 12, fontFamily: 'var(--font-captions)', fontWeight: 500,
      background: colors.bg, color: colors.text,
    }}>
      {status}
    </span>
  )
}

interface DealViewModalProps {
  deal: Deal
  onClose: () => void
}

export function DealViewModal({ deal, onClose }: DealViewModalProps) {
  const contactName = deal.contacts
    ? (deal.contacts.full_name ?? [deal.contacts.first_name, deal.contacts.last_name].filter(Boolean).join(' ') || '—')
    : '—'

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 500,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        width: '100%', maxWidth: 680,
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: '0 16px 64px rgba(0,0,0,0.22)',
        display: 'flex',
        maxHeight: '90vh',
        position: 'relative',
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 10, right: 10, zIndex: 1,
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--foreground-secondary)',
            display: 'flex', alignItems: 'center', padding: 4,
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
        </button>

        <div style={{ width: 8, background: 'var(--foreground-secondary)', flexShrink: 0 }} />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', background: 'var(--white)' }}>
          <div style={{ height: 26 }} />

          <FieldRow label={DEAL_COLUMN_LABELS.deal_name} bold>
            {renderField(deal.deal_name)}
          </FieldRow>

          <FieldRow label={DEAL_COLUMN_LABELS.contact_id}>
            {renderField(contactName)}
          </FieldRow>

          <FieldRow label={DEAL_COLUMN_LABELS.deal_description}>
            {renderField(deal.deal_description)}
          </FieldRow>

          <FieldRow label={DEAL_COLUMN_LABELS.last_call_datetime}>
            {renderField(
              deal.last_call_datetime
                ? new Date(deal.last_call_datetime).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
                : null
            )}
          </FieldRow>

          <FieldRow label={DEAL_COLUMN_LABELS.last_call_content}>
            {renderField(deal.last_call_content)}
          </FieldRow>

          <FieldRow label={DEAL_COLUMN_LABELS.proposal_filename}>
            {deal.proposal_url && deal.proposal_filename ? (
              <a
                href={deal.proposal_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'block', fontSize: 13, color: 'var(--accent-primary)', fontFamily: 'var(--font-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}
              >
                {deal.proposal_filename}
              </a>
            ) : (
              renderField(null)
            )}
          </FieldRow>

          <FieldRow label={DEAL_COLUMN_LABELS.status}>
            {renderStatus(deal.status)}
          </FieldRow>

          <div style={{ display: 'flex', borderTop: '1px solid var(--border-color)' }}>
            <div style={{ width: LABEL_W, flexShrink: 0, background: 'var(--surface-primary)' }} />
            <div style={{ flex: 1, padding: '16px 28px', display: 'flex', gap: 10, alignItems: 'center' }}>
              <button
                onClick={onClose}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'transparent',
                  color: 'var(--foreground-secondary)',
                  border: '1.5px solid var(--border-color)',
                  cursor: 'pointer',
                  fontSize: 13, fontWeight: 500,
                  fontFamily: 'var(--font-body)',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/grid/DealViewModal.tsx
git commit -m "feat: add DealViewModal read-only component"
```

---

## Task E: ProjectsGrid — Deal Column

**Files:**
- Modify: `src/components/grid/ProjectsGrid.tsx`

- [ ] **Step 1: Add `Deal` import and `onViewDeal` prop**

At the top of `src/components/grid/ProjectsGrid.tsx`, add the Deal import alongside the existing imports:

```ts
import type { Deal } from '../../types/deal'
```

Change the `ProjectsGridProps` interface from:

```ts
interface ProjectsGridProps {
  rows: Project[]
  onRowChange: (id: string, changes: ProjectUpdate) => void
  selectedIds: Set<string>
  onToggleRow: (id: string) => void
  onEditRow: (id: string) => void
  sorts: SortSpec[]
  onSortField: (field: keyof Project) => void
}
```

To:

```ts
interface ProjectsGridProps {
  rows: Project[]
  onRowChange: (id: string, changes: ProjectUpdate) => void
  selectedIds: Set<string>
  onToggleRow: (id: string) => void
  onEditRow: (id: string) => void
  sorts: SortSpec[]
  onSortField: (field: keyof Project) => void
  onViewDeal: (deal: Deal) => void
}
```

Update the function signature to destructure `onViewDeal`:

```ts
export function ProjectsGrid({ rows, onRowChange, selectedIds, onToggleRow, onEditRow, sorts, onSortField, onViewDeal }: ProjectsGridProps) {
```

- [ ] **Step 2: Add the Deal column as the 3rd column in the `columns` useMemo**

The `columns` array currently starts with the checkbox column followed immediately by `project_name`. Insert the Deal column between `project_name` and `project_topic`.

Find the block:
```ts
    {
      ...(keyColumn('project_name', textColumn) as unknown as ProjectColumn),
      title: colTitle('project_name', COLUMN_LABELS.project_name),
      basis: columnWidths.project_name, grow: 0, shrink: 0,
    },
    {
      ...(keyColumn('project_topic', textColumn) as unknown as ProjectColumn),
```

Replace with:
```ts
    {
      ...(keyColumn('project_name', textColumn) as unknown as ProjectColumn),
      title: colTitle('project_name', COLUMN_LABELS.project_name),
      basis: columnWidths.project_name, grow: 0, shrink: 0,
    },
    {
      basis: columnWidths.deal ?? 140, grow: 0, shrink: 0,
      disableKeys: true,
      title: (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%', height: '100%' }}>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingLeft: 10, paddingRight: 4 }}>
            {COLUMN_LABELS.deal_id}
          </span>
          <ResizeHandle columnKey="deal" onFinalizeWidth={handleFinalizeWidth} currentWidth={columnWidths.deal} />
        </div>
      ),
      component: ({ rowData }: { rowData: ProjectRow }) => {
        const deal = rowData.deals
        if (!deal) {
          return (
            <div style={{ padding: '0 8px', display: 'flex', alignItems: 'center', height: '100%', color: 'var(--foreground-secondary)', fontSize: 13, fontFamily: 'var(--font-body)' }}>
              —
            </div>
          )
        }
        return (
          <div style={{ padding: '0 8px', display: 'flex', alignItems: 'center', height: '100%' }}>
            <button
              onMouseDown={e => e.nativeEvent.stopImmediatePropagation()}
              onClick={e => { e.stopPropagation(); onViewDeal(deal) }}
              style={{ border: 'none', background: 'transparent', color: 'var(--accent-primary)', fontSize: 13, fontFamily: 'var(--font-body)', cursor: 'pointer', padding: 0, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}
            >
              {deal.deal_name}
            </button>
          </div>
        )
      },
      copyValue: ({ rowData }: { rowData: ProjectRow }) => rowData.deals?.deal_name ?? '',
    },
    {
      ...(keyColumn('project_topic', textColumn) as unknown as ProjectColumn),
```

- [ ] **Step 3: Add `onViewDeal` to the `columns` useMemo dependency array**

Find the end of the columns useMemo:
```ts
  ], [columnWidths, colTitle, onToggleRow])
```

Replace with:
```ts
  ], [columnWidths, colTitle, onToggleRow, onViewDeal])
```

- [ ] **Step 4: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/grid/ProjectsGrid.tsx
git commit -m "feat: add clickable Deal column to ProjectsGrid"
```

---

## Task F: RecordEditorModal — Deal FieldRow

**Files:**
- Modify: `src/components/grid/RecordEditorModal.tsx`

- [ ] **Step 1: Add imports and `onViewDeal` prop**

Add to the import block at the top of `src/components/grid/RecordEditorModal.tsx`:

```ts
import type { Deal } from '../../types/deal'
```

Change the `RecordEditorModalProps` interface from:

```ts
interface RecordEditorModalProps {
  row?: Project
  onSave: (id: string, changes: ProjectUpdate) => void
  onAdd: (data: ProjectInsert) => void
  onClose: () => void
}
```

To:

```ts
interface RecordEditorModalProps {
  row?: Project
  onSave: (id: string, changes: ProjectUpdate) => void
  onAdd: (data: ProjectInsert) => void
  onClose: () => void
  onViewDeal?: (deal: Deal) => void
}
```

Update the function signature to destructure `onViewDeal`:

```ts
export function RecordEditorModal({ row, onSave, onAdd, onClose, onViewDeal }: RecordEditorModalProps) {
```

- [ ] **Step 2: Add `deal_id` to `EMPTY_DRAFT` and the draft initializer**

Find:
```ts
const EMPTY_DRAFT: ProjectInsert = {
  project_name: '',
  project_topic: null,
  project_status: null,
  project_start_date: null,
  project_delivery_date: null,
  project_budget: null,
}
```

Replace with:
```ts
const EMPTY_DRAFT: ProjectInsert = {
  project_name: '',
  project_topic: null,
  project_status: null,
  project_start_date: null,
  project_delivery_date: null,
  project_budget: null,
  deal_id: null,
}
```

Find the draft initializer in `useState`:
```ts
  const [draft, setDraft] = useState<ProjectInsert>(isNew ? { ...EMPTY_DRAFT } : {
    project_name: row.project_name,
    project_topic: row.project_topic,
    project_status: row.project_status,
    project_start_date: row.project_start_date,
    project_delivery_date: row.project_delivery_date,
    project_budget: row.project_budget,
  })
```

Replace with:
```ts
  const [draft, setDraft] = useState<ProjectInsert>(isNew ? { ...EMPTY_DRAFT } : {
    project_name: row.project_name,
    project_topic: row.project_topic,
    project_status: row.project_status,
    project_start_date: row.project_start_date,
    project_delivery_date: row.project_delivery_date,
    project_budget: row.project_budget,
    deal_id: row.deal_id,
  })
```

- [ ] **Step 3: Add `deal_id` diff check to `handleSave`**

Find inside `handleSave`:
```ts
      if (draft.project_budget !== row.project_budget) changes.project_budget = draft.project_budget
      if (Object.keys(changes).length > 0) onSave(row.id, changes)
```

Replace with:
```ts
      if (draft.project_budget !== row.project_budget) changes.project_budget = draft.project_budget
      if (draft.deal_id !== row.deal_id) changes.deal_id = draft.deal_id
      if (Object.keys(changes).length > 0) onSave(row.id, changes)
```

- [ ] **Step 4: Add the Deal FieldRow after the Project Name field**

Find the Project Name FieldRow closing tag and the start of the Topic FieldRow:
```tsx
          <FieldRow label={COLUMN_LABELS.project_name} fieldKey="project_name" focused={focused} bold>
            <input
              type="text"
              value={draft.project_name ?? ''}
              onChange={e => set('project_name', e.target.value)}
              onFocus={() => setFocused('project_name')}
              onBlur={() => setFocused(null)}
              style={inp('project_name')}
            />
          </FieldRow>

          <FieldRow label={COLUMN_LABELS.project_topic} fieldKey="project_topic" focused={focused}>
```

Replace with:
```tsx
          <FieldRow label={COLUMN_LABELS.project_name} fieldKey="project_name" focused={focused} bold>
            <input
              type="text"
              value={draft.project_name ?? ''}
              onChange={e => set('project_name', e.target.value)}
              onFocus={() => setFocused('project_name')}
              onBlur={() => setFocused(null)}
              style={inp('project_name')}
            />
          </FieldRow>

          <FieldRow label={COLUMN_LABELS.deal_id} fieldKey="deal" focused={focused}>
            {(() => {
              const deal = !isNew ? row?.deals ?? null : null
              if (deal) {
                return (
                  <button
                    type="button"
                    onClick={() => onViewDeal?.(deal)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 13, fontFamily: 'var(--font-body)', color: 'var(--accent-primary)', textDecoration: 'underline' }}
                  >
                    {deal.deal_name}
                  </button>
                )
              }
              return <span style={{ fontSize: 13, color: 'var(--foreground-secondary)', fontFamily: 'var(--font-body)' }}>—</span>
            })()}
          </FieldRow>

          <FieldRow label={COLUMN_LABELS.project_topic} fieldKey="project_topic" focused={focused}>
```

- [ ] **Step 5: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/grid/RecordEditorModal.tsx
git commit -m "feat: add Deal FieldRow to RecordEditorModal"
```

---

## Task G: App.tsx — Wire State

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add `DealViewModal` import and `Deal` type import**

Find the existing imports near the top of `src/App.tsx`. Add:

```ts
import { DealViewModal } from './components/grid/DealViewModal'
import type { Deal } from './types/deal'
```

(The `Deal` type import may already exist — if so, skip adding it again.)

- [ ] **Step 2: Add `viewingDeal` state**

Find the line:
```ts
  const [viewingContact, setViewingContact] = useState<Contact | null>(null)
```

Add directly after it:
```ts
  const [viewingDeal, setViewingDeal] = useState<Deal | null>(null)
```

- [ ] **Step 3: Pass `onViewDeal` to `ProjectsGrid`**

Find the `<ProjectsGrid` JSX block. It currently ends with props like `sorts={projectSorts}` and `onSortField={setProjectSort}`. Add the new prop:

```tsx
onViewDeal={setViewingDeal}
```

- [ ] **Step 4: Pass `onViewDeal` to `RecordEditorModal`**

Find the `<RecordEditorModal` JSX block and add:

```tsx
onViewDeal={setViewingDeal}
```

- [ ] **Step 5: Render `DealViewModal`**

Find the `{viewingContact !== null && (` block:

```tsx
      {viewingContact !== null && (
        <ContactViewModal
          contact={viewingContact}
          onClose={() => setViewingContact(null)}
        />
      )}
```

Add directly after it:

```tsx
      {viewingDeal !== null && (
        <DealViewModal
          deal={viewingDeal}
          onClose={() => setViewingDeal(null)}
        />
      )}
```

- [ ] **Step 6: TypeScript check and full test run**

```bash
npx tsc --noEmit && npm test -- --run
```

Expected: 0 TypeScript errors, all tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire viewingDeal state and render DealViewModal for Project → Deal links"
```

---

## SQL to run in Supabase (user action, not code)

```sql
ALTER TABLE projects
  ADD COLUMN deal_id UUID REFERENCES deals(id) ON DELETE SET NULL;
```

This must be executed in the Supabase SQL editor before testing the feature end-to-end. The frontend will work without it (all projects will show `—` in the Deal column) but the FK link will not persist.
