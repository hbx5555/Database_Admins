# Projects Grid — Stage 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-quality React + TypeScript CRM grid for the `projects` Supabase table, deployed on Netlify.

**Architecture:** 3-column layout (56px icon sidebar stub → 200px sub-items panel → main grid card) using `react-datasheet-grid` as the mandatory editable grid. State is split into `sourceRows` (raw from Supabase), `viewConfig` (filters/sorts), and `displayRows` (derived). All Supabase calls are isolated in `src/lib/projectsApi.ts`.

**Tech Stack:** React 18, TypeScript 5, Vite 5, react-datasheet-grid, @supabase/supabase-js, vitest, Google Fonts (Funnel Sans, Inter, Geist), Material Symbols Outlined.

---

## File Map

| File | Responsibility |
|------|---------------|
| `.env` | Supabase URL + anon key (git-ignored) |
| `vite.config.ts` | Vite + React plugin config |
| `tsconfig.json` | TypeScript strict config |
| `netlify.toml` | Netlify build + redirect config |
| `index.html` | Font imports, root mount |
| `src/index.css` | Design tokens, resets, global styles |
| `src/main.tsx` | React root render |
| `src/App.tsx` | 3-column layout composition |
| `src/types/project.ts` | Project row type, FilterSpec, SortSpec, ViewConfig, PaginationState |
| `src/lib/supabase.ts` | Supabase client singleton |
| `src/lib/projectsApi.ts` | fetchProjects, createProject, updateProject, deleteProject |
| `src/lib/transforms.ts` | Pure filter + sort functions over Project[] |
| `src/hooks/useProjects.ts` | sourceRows, viewConfig, displayRows, pagination state + actions |
| `src/components/layout/IconSidebar.tsx` | 56px dark sidebar (stub, single active icon) |
| `src/components/layout/SubItemsPanel.tsx` | 200px panel: title, count, Add Item, filter views |
| `src/components/layout/MainContent.tsx` | 16px padded wrapper for the grid card |
| `src/components/grid/GridToolbar.tsx` | Checkbox, refresh, more_vert, view/tune icons, avatar |
| `src/components/grid/GridStatusBar.tsx` | "Showing N records" + Previous/page/Next pagination |
| `src/components/grid/ProjectsGrid.tsx` | react-datasheet-grid instance, column definitions |
| `src/components/shared/RolePill.tsx` | Colored pill for project_status enum values |
| `src/components/shared/WhatsAppLink.tsx` | Truncated wa.me link opening in new tab |
| `src/components/shared/LoadingState.tsx` | Centered spinner for data loading |
| `src/components/shared/ErrorState.tsx` | Error message with retry button |
| `src/components/shared/EmptyState.tsx` | Empty grid message |
| `tests/transforms.test.ts` | Unit tests for filter + sort pure functions |
| `tests/projectsApi.test.ts` | Unit tests for API response mapping |

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `netlify.toml`
- Create: `.env`
- Create: `.gitignore`
- Create: `index.html`

- [ ] **Step 1: Initialise Vite + React + TypeScript project**

Run from `/Users/haimbxpertlink/Documents/GIT_Projects/Database_Admins`:
```bash
npm create vite@latest . -- --template react-ts --force
```
Answer "y" if prompted about existing files.

- [ ] **Step 2: Install all dependencies**

```bash
npm install @supabase/supabase-js react-datasheet-grid
npm install --save-dev vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 3: Write `vite.config.ts`**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
  },
})
```

- [ ] **Step 4: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src", "tests"]
}
```

- [ ] **Step 5: Write `netlify.toml`**

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

- [ ] **Step 6: Write `.env`**

```
VITE_SUPABASE_URL=https://jwaswjwbcdvetxxumagp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3YXN3andiY2R2ZXR4eHVtYWdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NzgyMjksImV4cCI6MjA5MjI1NDIyOX0.Ha3fDAMhbO508-wSrLSW_kWDRb1XWmSJ1T4j7H9MvB8
```

- [ ] **Step 7: Update `.gitignore` to block `.env`**

Append to the generated `.gitignore`:
```
.env
.env.local
.env.*.local
```

- [ ] **Step 8: Write `index.html` with font imports**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Database Admins</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Funnel+Sans:wght@400;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500&display=swap" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 9: Write `tests/setup.ts`**

```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 10: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: scaffold Vite + React + TS project with dependencies"
```

---

### Task 2: Design Tokens + Global CSS

**Files:**
- Create: `src/index.css`
- Modify: `src/main.tsx`

- [ ] **Step 1: Write `src/index.css`**

```css
:root {
  --surface-primary: #F5F3EE;
  --surface-secondary: #C8DBBC;
  --white: #FFFFFF;
  --row-hover: #EBE9E3;

  --foreground-primary: #1B3A28;
  --foreground-secondary: #4A6B52;
  --foreground-inverse: #FFFFFF;

  --accent-primary: #2D5E3A;
  --accent-secondary: #4A8C5E;

  --border-color: #D4D2CC;

  --font-headings: 'Funnel Sans', sans-serif;
  --font-body: 'Inter', sans-serif;
  --font-captions: 'Geist', sans-serif;

  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 12px;
  --radius-round: 16px;
  --radius-pill: 999px;
}

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--font-body);
  color: var(--foreground-primary);
  background: var(--surface-primary);
  min-width: 1044px;
  -webkit-font-smoothing: antialiased;
}

.material-symbols-outlined {
  font-size: 20px;
  user-select: none;
}
```

- [ ] **Step 2: Write `src/main.tsx`**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 3: Verify dev server starts**

```bash
npm run dev
```
Expected: Vite starts, browser shows blank page with no console errors.

- [ ] **Step 4: Commit**

```bash
git add src/index.css src/main.tsx
git commit -m "feat: add design tokens and global CSS"
```

---

### Task 3: TypeScript Types

**Files:**
- Create: `src/types/project.ts`
- Create: `tests/transforms.test.ts` (failing shell — filled in Task 5)

- [ ] **Step 1: Write `src/types/project.ts`**

```ts
export type ProjectStatus = 'New' | 'Started' | 'Done'

export interface Project {
  id: string
  project_name: string
  project_topic: string | null
  project_status: ProjectStatus | null
  project_start_date: string | null      // ISO date string "YYYY-MM-DD"
  project_delivery_date: string | null   // ISO date string "YYYY-MM-DD"
  project_budget: number | null
  created_at: string
  updated_at: string
}

export type ProjectInsert = Omit<Project, 'id' | 'created_at' | 'updated_at'>
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
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/types/project.ts
git commit -m "feat: add Project TypeScript types and constants"
```

---

### Task 4: Supabase Client + API Layer

**Files:**
- Create: `src/lib/supabase.ts`
- Create: `src/lib/projectsApi.ts`

- [ ] **Step 1: Write `src/lib/supabase.ts`**

```ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

- [ ] **Step 2: Write `src/lib/projectsApi.ts`**

```ts
import { supabase } from './supabase'
import type { Project, ProjectInsert, ProjectUpdate } from '../types/project'

export async function fetchProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data as Project[]
}

export async function createProject(row: ProjectInsert): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .insert(row)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Project
}

export async function updateProject(id: string, changes: ProjectUpdate): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .update(changes)
    .eq('id', id)
    .select()
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
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/supabase.ts src/lib/projectsApi.ts
git commit -m "feat: add Supabase client and projects API layer"
```

---

### Task 5: Pure Transform Functions + Tests

**Files:**
- Create: `src/lib/transforms.ts`
- Create: `tests/transforms.test.ts`

- [ ] **Step 1: Write failing tests in `tests/transforms.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { applyFilters, applySorts, paginateRows } from '../src/lib/transforms'
import type { Project } from '../src/types/project'

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

describe('applyFilters', () => {
  it('returns all rows when no filters', () => {
    const rows = [makeProject({ id: '1' }), makeProject({ id: '2' })]
    expect(applyFilters(rows, [])).toHaveLength(2)
  })

  it('filters by project_name case-insensitively', () => {
    const rows = [
      makeProject({ id: '1', project_name: 'Alpha' }),
      makeProject({ id: '2', project_name: 'Beta' }),
    ]
    const result = applyFilters(rows, [{ field: 'project_name', value: 'alp' }])
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })

  it('filters by project_status exact match', () => {
    const rows = [
      makeProject({ id: '1', project_status: 'New' }),
      makeProject({ id: '2', project_status: 'Done' }),
    ]
    const result = applyFilters(rows, [{ field: 'project_status', value: 'New' }])
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })
})

describe('applySorts', () => {
  it('sorts by project_name ascending', () => {
    const rows = [
      makeProject({ id: '1', project_name: 'Zebra' }),
      makeProject({ id: '2', project_name: 'Alpha' }),
    ]
    const result = applySorts(rows, [{ field: 'project_name', direction: 'asc' }])
    expect(result[0].id).toBe('2')
    expect(result[1].id).toBe('1')
  })

  it('sorts by project_name descending', () => {
    const rows = [
      makeProject({ id: '1', project_name: 'Alpha' }),
      makeProject({ id: '2', project_name: 'Zebra' }),
    ]
    const result = applySorts(rows, [{ field: 'project_name', direction: 'desc' }])
    expect(result[0].id).toBe('2')
  })

  it('returns original order when no sorts', () => {
    const rows = [makeProject({ id: '1' }), makeProject({ id: '2' })]
    expect(applySorts(rows, [])[0].id).toBe('1')
  })
})

describe('paginateRows', () => {
  it('returns first page', () => {
    const rows = Array.from({ length: 25 }, (_, i) => makeProject({ id: String(i) }))
    const result = paginateRows(rows, 1, 10)
    expect(result).toHaveLength(10)
    expect(result[0].id).toBe('0')
  })

  it('returns second page', () => {
    const rows = Array.from({ length: 25 }, (_, i) => makeProject({ id: String(i) }))
    const result = paginateRows(rows, 2, 10)
    expect(result).toHaveLength(10)
    expect(result[0].id).toBe('10')
  })

  it('returns partial last page', () => {
    const rows = Array.from({ length: 25 }, (_, i) => makeProject({ id: String(i) }))
    const result = paginateRows(rows, 3, 10)
    expect(result).toHaveLength(5)
  })
})
```

- [ ] **Step 2: Run tests — verify they FAIL**

```bash
npx vitest run tests/transforms.test.ts
```
Expected: FAIL — `applyFilters`, `applySorts`, `paginateRows` not found.

- [ ] **Step 3: Write `src/lib/transforms.ts`**

```ts
import type { Project, FilterSpec, SortSpec } from '../types/project'

export function applyFilters(rows: Project[], filters: FilterSpec[]): Project[] {
  if (filters.length === 0) return rows
  return rows.filter(row =>
    filters.every(f => {
      const value = row[f.field]
      if (value === null || value === undefined) return false
      return String(value).toLowerCase().includes(f.value.toLowerCase())
    })
  )
}

export function applySorts(rows: Project[], sorts: SortSpec[]): Project[] {
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

export function paginateRows(rows: Project[], page: number, pageSize: number): Project[] {
  const start = (page - 1) * pageSize
  return rows.slice(start, start + pageSize)
}
```

- [ ] **Step 4: Run tests — verify they PASS**

```bash
npx vitest run tests/transforms.test.ts
```
Expected: all 8 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/transforms.ts tests/transforms.test.ts tests/setup.ts
git commit -m "feat: add transform functions with passing tests"
```

---

### Task 6: useProjects Hook

**Files:**
- Create: `src/hooks/useProjects.ts`

- [ ] **Step 1: Write `src/hooks/useProjects.ts`**

```ts
import { useState, useEffect, useCallback, useMemo } from 'react'
import { fetchProjects, createProject, updateProject, deleteProject } from '../lib/projectsApi'
import { applyFilters, applySorts, paginateRows } from '../lib/transforms'
import type { Project, ProjectInsert, ProjectUpdate, ViewConfig, PaginationState } from '../types/project'
import { DEFAULT_VIEW_CONFIG, DEFAULT_PAGINATION } from '../types/project'

interface UseProjectsReturn {
  displayRows: Project[]
  sourceRows: Project[]
  loading: boolean
  error: string | null
  viewConfig: ViewConfig
  pagination: PaginationState
  selectedRowId: string | null
  setSelectedRowId: (id: string | null) => void
  setViewConfig: (config: ViewConfig) => void
  setPage: (page: number) => void
  refresh: () => Promise<void>
  addRow: (row: ProjectInsert) => Promise<void>
  editRow: (id: string, changes: ProjectUpdate) => Promise<void>
  removeRow: (id: string) => Promise<void>
}

export function useProjects(): UseProjectsReturn {
  const [sourceRows, setSourceRows] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewConfig, setViewConfig] = useState<ViewConfig>(DEFAULT_VIEW_CONFIG)
  const [pagination, setPagination] = useState<PaginationState>(DEFAULT_PAGINATION)
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const rows = await fetchProjects()
      setSourceRows(rows)
      setPagination(p => ({ ...p, total: rows.length, page: 1 }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filteredSorted = useMemo(
    () => applySorts(applyFilters(sourceRows, viewConfig.filters), viewConfig.sorts),
    [sourceRows, viewConfig.filters, viewConfig.sorts]
  )

  const displayRows = useMemo(
    () => paginateRows(filteredSorted, pagination.page, pagination.pageSize),
    [filteredSorted, pagination.page, pagination.pageSize]
  )

  // Keep total in sync with filtered count
  useEffect(() => {
    setPagination(p => ({ ...p, total: filteredSorted.length, page: 1 }))
  }, [filteredSorted.length])

  const setPage = useCallback((page: number) => {
    setPagination(p => ({ ...p, page }))
  }, [])

  const addRow = useCallback(async (row: ProjectInsert) => {
    const optimistic: Project = {
      ...row,
      id: `optimistic-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setSourceRows(prev => [optimistic, ...prev])
    try {
      const saved = await createProject(row)
      setSourceRows(prev => prev.map(r => r.id === optimistic.id ? saved : r))
    } catch (e) {
      setSourceRows(prev => prev.filter(r => r.id !== optimistic.id))
      setError(e instanceof Error ? e.message : 'Failed to create project')
    }
  }, [])

  const editRow = useCallback(async (id: string, changes: ProjectUpdate) => {
    const previous = sourceRows.find(r => r.id === id)
    setSourceRows(prev => prev.map(r => r.id === id ? { ...r, ...changes, updated_at: new Date().toISOString() } : r))
    try {
      const saved = await updateProject(id, changes)
      setSourceRows(prev => prev.map(r => r.id === id ? saved : r))
    } catch (e) {
      if (previous) setSourceRows(prev => prev.map(r => r.id === id ? previous : r))
      setError(e instanceof Error ? e.message : 'Failed to update project')
    }
  }, [sourceRows])

  const removeRow = useCallback(async (id: string) => {
    const previous = sourceRows.find(r => r.id === id)
    setSourceRows(prev => prev.filter(r => r.id !== id))
    try {
      await deleteProject(id)
    } catch (e) {
      if (previous) setSourceRows(prev => [previous, ...prev])
      setError(e instanceof Error ? e.message : 'Failed to delete project')
    }
  }, [sourceRows])

  return {
    displayRows,
    sourceRows,
    loading,
    error,
    viewConfig,
    pagination,
    selectedRowId,
    setSelectedRowId,
    setViewConfig,
    setPage,
    refresh: load,
    addRow,
    editRow,
    removeRow,
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useProjects.ts
git commit -m "feat: add useProjects hook with optimistic updates"
```

---

### Task 7: Shared Components

**Files:**
- Create: `src/components/shared/RolePill.tsx`
- Create: `src/components/shared/WhatsAppLink.tsx`
- Create: `src/components/shared/LoadingState.tsx`
- Create: `src/components/shared/ErrorState.tsx`
- Create: `src/components/shared/EmptyState.tsx`

- [ ] **Step 1: Write `src/components/shared/RolePill.tsx`**

```tsx
import type { ProjectStatus } from '../../types/project'
import { STATUS_COLORS } from '../../types/project'

interface RolePillProps {
  status: ProjectStatus | null
}

export function RolePill({ status }: RolePillProps) {
  if (!status) return <span style={{ color: 'var(--foreground-secondary)', fontSize: 13 }}>—</span>
  const { bg, text } = STATUS_COLORS[status]
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 'var(--radius-pill)',
      backgroundColor: bg,
      color: text,
      fontSize: 12,
      fontFamily: 'var(--font-captions)',
      fontWeight: 500,
      lineHeight: '20px',
      whiteSpace: 'nowrap',
    }}>
      {status}
    </span>
  )
}
```

- [ ] **Step 2: Write `src/components/shared/WhatsAppLink.tsx`**

```tsx
interface WhatsAppLinkProps {
  url: string | null
}

export function WhatsAppLink({ url }: WhatsAppLinkProps) {
  if (!url) return <span style={{ color: 'var(--foreground-secondary)', fontSize: 13 }}>—</span>
  const display = url.length > 30 ? url.slice(0, 30) + '…' : url
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        color: 'var(--accent-secondary)',
        fontSize: 13,
        textDecoration: 'none',
        fontFamily: 'var(--font-body)',
      }}
      onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
      onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
    >
      {display}
    </a>
  )
}
```

- [ ] **Step 3: Write `src/components/shared/LoadingState.tsx`**

```tsx
export function LoadingState() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: 200,
      color: 'var(--foreground-secondary)',
      fontFamily: 'var(--font-captions)',
      fontSize: 13,
      gap: 8,
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: 20, animation: 'spin 1s linear infinite' }}>
        progress_activity
      </span>
      Loading projects…
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
```

- [ ] **Step 4: Write `src/components/shared/ErrorState.tsx`**

```tsx
interface ErrorStateProps {
  message: string
  onRetry: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: 200,
      gap: 12,
      color: 'var(--foreground-secondary)',
      fontFamily: 'var(--font-body)',
      fontSize: 13,
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: 24, color: '#dc3545' }}>error</span>
      <span>{message}</span>
      <button
        onClick={onRetry}
        style={{
          padding: '6px 16px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-color)',
          background: 'var(--white)',
          color: 'var(--foreground-primary)',
          cursor: 'pointer',
          fontFamily: 'var(--font-body)',
          fontSize: 13,
        }}
      >
        Retry
      </button>
    </div>
  )
}
```

- [ ] **Step 5: Write `src/components/shared/EmptyState.tsx`**

```tsx
export function EmptyState() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: 200,
      gap: 8,
      color: 'var(--foreground-secondary)',
      fontFamily: 'var(--font-body)',
      fontSize: 13,
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: 32, opacity: 0.4 }}>folder_open</span>
      <span>No projects found</span>
    </div>
  )
}
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/shared/
git commit -m "feat: add RolePill, WhatsAppLink, and state feedback components"
```

---

### Task 8: Grid Toolbar + Status Bar

**Files:**
- Create: `src/components/grid/GridToolbar.tsx`
- Create: `src/components/grid/GridStatusBar.tsx`

- [ ] **Step 1: Write `src/components/grid/GridToolbar.tsx`**

```tsx
interface GridToolbarProps {
  onRefresh: () => void
}

export function GridToolbar({ onRefresh }: GridToolbarProps) {
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
        type="checkbox"
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

- [ ] **Step 2: Write `src/components/grid/GridStatusBar.tsx`**

```tsx
import type { PaginationState } from '../../types/project'

interface GridStatusBarProps {
  pagination: PaginationState
  onPageChange: (page: number) => void
}

const btnBase: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border-color)',
  background: 'var(--white)',
  color: 'var(--foreground-primary)',
  cursor: 'pointer',
  fontFamily: 'var(--font-captions)',
  fontSize: 12,
}

export function GridStatusBar({ pagination, onPageChange }: GridStatusBarProps) {
  const { page, pageSize, total } = pagination
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const showing = Math.min(total, pageSize)

  return (
    <div style={{
      height: 44,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      background: 'var(--surface-primary)',
      borderTop: '1px solid var(--border-color)',
      borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
    }}>
      <span style={{ fontFamily: 'var(--font-captions)', fontSize: 12, color: 'var(--foreground-secondary)' }}>
        Showing {showing} of {total} records
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button
          style={btnBase}
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          Previous
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
          <button
            key={p}
            style={{
              ...btnBase,
              width: 32,
              height: 32,
              padding: 0,
              background: p === page ? 'var(--accent-primary)' : 'var(--white)',
              color: p === page ? 'var(--foreground-inverse)' : 'var(--foreground-primary)',
              border: p === page ? 'none' : '1px solid var(--border-color)',
            }}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        ))}

        <button
          style={btnBase}
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Next
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/grid/GridToolbar.tsx src/components/grid/GridStatusBar.tsx
git commit -m "feat: add GridToolbar and GridStatusBar components"
```

---

### Task 9: ProjectsGrid (react-datasheet-grid)

**Files:**
- Create: `src/components/grid/ProjectsGrid.tsx`

- [ ] **Step 1: Write `src/components/grid/ProjectsGrid.tsx`**

```tsx
import { DataSheetGrid, textColumn, keyColumn, createTextColumn } from 'react-datasheet-grid'
import 'react-datasheet-grid/dist/style.css'
import type { Project, ProjectUpdate } from '../../types/project'
import { RolePill } from '../shared/RolePill'
import { COLUMN_LABELS } from '../../types/project'
import type { ProjectStatus } from '../../types/project'

interface ProjectsGridProps {
  rows: Project[]
  onRowChange: (id: string, changes: ProjectUpdate) => void
}

// react-datasheet-grid requires data as a plain array; it uses row index internally
// but we always resolve back to UUID before persisting
export function ProjectsGrid({ rows, onRowChange }: ProjectsGridProps) {
  const columns = [
    {
      ...keyColumn('project_name', textColumn),
      title: COLUMN_LABELS.project_name,
      minWidth: 200,
    },
    {
      ...keyColumn('project_topic', textColumn),
      title: COLUMN_LABELS.project_topic,
      minWidth: 160,
    },
    {
      title: COLUMN_LABELS.project_status,
      minWidth: 120,
      component: ({ rowData }: { rowData: Project }) => (
        <div style={{ padding: '0 8px', display: 'flex', alignItems: 'center', height: '100%' }}>
          <RolePill status={rowData.project_status as ProjectStatus | null} />
        </div>
      ),
      // Status editing is read-only in Stage 1 — inline select comes in a follow-up
      disableKeys: true,
      cellClassName: 'readonly-cell',
    },
    {
      ...keyColumn('project_start_date', textColumn),
      title: COLUMN_LABELS.project_start_date,
      minWidth: 120,
    },
    {
      ...keyColumn('project_delivery_date', textColumn),
      title: COLUMN_LABELS.project_delivery_date,
      minWidth: 130,
    },
    {
      title: COLUMN_LABELS.project_budget,
      minWidth: 110,
      component: ({ rowData }: { rowData: Project }) => (
        <div style={{
          padding: '0 8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          height: '100%',
          fontFamily: 'var(--font-captions)',
          fontSize: 13,
          color: 'var(--foreground-secondary)',
        }}>
          {rowData.project_budget != null
            ? rowData.project_budget.toLocaleString()
            : '—'}
        </div>
      ),
      disableKeys: true,
      cellClassName: 'readonly-cell',
    },
  ]

  const handleChange = (newRows: Project[], { indexes, type }: { indexes: number[]; type: string }) => {
    if (type !== 'UPDATE') return
    indexes.forEach(i => {
      const updated = newRows[i]
      const original = rows[i]
      if (!original) return
      const changes: ProjectUpdate = {}
      if (updated.project_name !== original.project_name) changes.project_name = updated.project_name
      if (updated.project_topic !== original.project_topic) changes.project_topic = updated.project_topic
      if (updated.project_start_date !== original.project_start_date) changes.project_start_date = updated.project_start_date
      if (updated.project_delivery_date !== original.project_delivery_date) changes.project_delivery_date = updated.project_delivery_date
      if (Object.keys(changes).length > 0) onRowChange(original.id, changes)
    })
  }

  return (
    <div style={{ flex: 1, overflow: 'auto' }}>
      <style>{`
        .dsg-container { font-family: var(--font-body); font-size: 13px; }
        .dsg-cell { color: var(--foreground-secondary); }
        .dsg-cell:first-child { color: var(--foreground-primary); font-weight: 500; }
        .dsg-row:hover .dsg-cell { background: var(--row-hover); }
        .dsg-header-cell { 
          background: var(--surface-primary) !important; 
          font-size: 12px; 
          font-weight: 600; 
          color: var(--foreground-primary);
          font-family: var(--font-body);
        }
        .readonly-cell { background: var(--surface-primary) !important; cursor: default; }
      `}</style>
      <DataSheetGrid
        value={rows}
        onChange={handleChange}
        columns={columns}
        rowHeight={40}
        headerRowHeight={40}
        addRowsComponent={false}
        disableContextMenu
      />
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/grid/ProjectsGrid.tsx
git commit -m "feat: add ProjectsGrid with react-datasheet-grid"
```

---

### Task 10: Layout Shell

**Files:**
- Create: `src/components/layout/IconSidebar.tsx`
- Create: `src/components/layout/SubItemsPanel.tsx`
- Create: `src/components/layout/MainContent.tsx`

- [ ] **Step 1: Write `src/components/layout/IconSidebar.tsx`**

```tsx
const icons = [
  { name: 'task_alt', label: 'Tasks', active: false },
  { name: 'folder', label: 'Projects', active: true },
  { name: 'leaderboard', label: 'Leads', active: false },
  { name: 'person', label: 'Contacts', active: false },
  { name: 'label', label: 'Statuses', active: false },
]

export function IconSidebar() {
  return (
    <div style={{
      width: 56,
      minHeight: '100vh',
      background: 'var(--accent-primary)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '16px 0',
      flexShrink: 0,
    }}>
      {/* Hamburger */}
      <button style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', marginBottom: 16, display: 'flex', alignItems: 'center' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 28 }}>menu</span>
      </button>

      {/* Nav icons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        {icons.map(icon => (
          <button
            key={icon.name}
            title={icon.label}
            style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-md)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: icon.active ? 'var(--accent-secondary)' : 'none',
            }}
          >
            <span className="material-symbols-outlined" style={{
              fontSize: 24,
              color: icon.active ? 'white' : 'rgba(255,255,255,0.6)',
            }}>
              {icon.name}
            </span>
          </button>
        ))}
      </div>

      {/* Bottom: settings + avatar */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', borderRadius: 'var(--radius-md)', padding: 4 }}>
          <span className="material-symbols-outlined" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 24 }}>settings</span>
        </button>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 'var(--radius-round)',
          background: 'var(--accent-secondary)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          fontFamily: 'var(--font-captions)',
          fontWeight: 600,
          cursor: 'pointer',
        }}>
          HD
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Write `src/components/layout/SubItemsPanel.tsx`**

```tsx
const FILTER_VIEWS = [
  { label: 'All', icon: 'inbox', active: true },
  { label: 'New', icon: 'send', active: false },
  { label: 'Urgent', icon: 'drafts', active: false },
  { label: 'Starred', icon: 'star', active: false },
  { label: 'Archived', icon: 'archive', active: false },
]

interface SubItemsPanelProps {
  totalCount: number
  onAddItem: () => void
}

export function SubItemsPanel({ totalCount, onAddItem }: SubItemsPanelProps) {
  return (
    <div style={{
      width: 200,
      minHeight: '100vh',
      background: '#fffbf1',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      padding: '16px 0',
    }}>
      {/* Header */}
      <div style={{ padding: '0 16px 8px' }}>
        <div style={{ fontFamily: 'var(--font-headings)', fontSize: 16, fontWeight: 700, color: 'var(--foreground-primary)' }}>
          Projects
        </div>
        <div style={{ fontFamily: 'var(--font-captions)', fontSize: 12, color: 'var(--foreground-secondary)' }}>
          {totalCount.toLocaleString()}
        </div>
      </div>

      {/* Add Item button */}
      <div style={{ padding: '4px 16px 8px' }}>
        <button
          onClick={onAddItem}
          style={{
            width: 175,
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

      {/* Filter views */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 8px' }}>
        {FILTER_VIEWS.map(view => (
          <button
            key={view.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              borderRadius: view.active ? 'var(--radius-round)' : 'var(--radius-sm)',
              background: view.active ? 'var(--surface-secondary)' : 'none',
              border: 'none',
              cursor: 'pointer',
              color: view.active ? 'var(--foreground-primary)' : 'var(--foreground-secondary)',
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              fontWeight: view.active ? 600 : 400,
              textAlign: 'left',
              width: '100%',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{view.icon}</span>
            {view.label}
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Write `src/components/layout/MainContent.tsx`**

```tsx
interface MainContentProps {
  children: React.ReactNode
}

export function MainContent({ children }: MainContentProps) {
  return (
    <div style={{
      flex: 1,
      padding: 16,
      minHeight: '100vh',
      background: 'var(--surface-primary)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {children}
    </div>
  )
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/
git commit -m "feat: add IconSidebar, SubItemsPanel, and MainContent layout components"
```

---

### Task 11: Wire Everything in App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Write `src/App.tsx`**

```tsx
import { useProjects } from './hooks/useProjects'
import { IconSidebar } from './components/layout/IconSidebar'
import { SubItemsPanel } from './components/layout/SubItemsPanel'
import { MainContent } from './components/layout/MainContent'
import { GridToolbar } from './components/grid/GridToolbar'
import { GridStatusBar } from './components/grid/GridStatusBar'
import { ProjectsGrid } from './components/grid/ProjectsGrid'
import { LoadingState } from './components/shared/LoadingState'
import { ErrorState } from './components/shared/ErrorState'
import { EmptyState } from './components/shared/EmptyState'

export default function App() {
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
  } = useProjects()

  const handleAddItem = async () => {
    await addRow({
      project_name: 'New Project',
      project_topic: null,
      project_status: 'New',
      project_start_date: null,
      project_delivery_date: null,
      project_budget: null,
    })
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', minWidth: 1044 }}>
      <IconSidebar />
      <SubItemsPanel totalCount={sourceRows.length} onAddItem={handleAddItem} />
      <MainContent>
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--white)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          overflow: 'hidden',
        }}>
          <GridToolbar onRefresh={refresh} />

          {loading && <LoadingState />}
          {!loading && error && <ErrorState message={error} onRetry={refresh} />}
          {!loading && !error && displayRows.length === 0 && <EmptyState />}
          {!loading && !error && displayRows.length > 0 && (
            <ProjectsGrid rows={displayRows} onRowChange={editRow} />
          )}

          <GridStatusBar pagination={pagination} onPageChange={setPage} />
        </div>
      </MainContent>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Run dev server and visually verify**

```bash
npm run dev
```
Expected:
- 3-column layout renders
- Grid shows sample row from Supabase
- Loading spinner appears briefly then data loads
- Toolbar and status bar visible
- No console errors

- [ ] **Step 4: Run all tests**

```bash
npx vitest run
```
Expected: all tests PASS.

- [ ] **Step 5: Build for production**

```bash
npm run build
```
Expected: `dist/` folder created, no build errors.

- [ ] **Step 6: Commit and push**

```bash
git add src/App.tsx
git commit -m "feat: wire all components into App — Stage 1 complete"
git push origin main
```

---

## Self-Review

### Spec Coverage Check

| Requirement | Task |
|-------------|------|
| react-datasheet-grid mandatory | Task 9 |
| 3-column layout (56px / 200px / main) | Task 10 |
| Design tokens | Task 2 |
| Project TypeScript types | Task 3 |
| Supabase client + API layer | Task 4 |
| sourceRows / viewConfig / displayRows state layers | Task 6 |
| Optimistic updates (create, update, delete) | Task 6 |
| Pagination 10 per page | Task 6 + Task 8 |
| RolePill for status | Task 7 |
| WhatsApp link (accent-secondary, new tab) | Task 7 |
| Loading / empty / error states | Task 7 |
| GridToolbar (refresh, icons, avatar) | Task 8 |
| GridStatusBar (showing N / prev/page/next) | Task 8 |
| Row hover | Task 9 (CSS) |
| netlify.toml | Task 1 |
| .env git-ignored | Task 1 |
| Pure transform functions with tests | Task 5 |
| No inline Supabase calls in components | Task 4 + Task 6 |
| Stage 2 not implemented | ✅ absent |
