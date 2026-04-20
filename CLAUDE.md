# Database Admins — Claude Code Project Brief

## Repository

- **GitHub:** `https://github.com/hbx5555/Database_Admins`
- **Local path:** `/Users/haimbxpertlink/Documents/GIT_Projects/Database_Admins`
- **Design files:** `References/Design Guide/` (read `.pen` files via Pencil MCP only)

---

## Project Purpose

Build a React + TypeScript frontend for non-technical customers to manage CRM data stored in Supabase/PostgreSQL. The UI should feel like Airtable/Baserow — not a database admin console.

**Hosting:** Netlify (Node.js serverless). Data access via Supabase JS client (browser → Supabase API). No direct DB connection.

---

## Current Scope — Stage 1 (Single Table: Projects)

Focus on one table only: **`projects`**. Ignore multi-table navigation icons and routing — those come in a later stage.

### Actual `projects` table columns (Supabase)

| DB Column             | Label          | Width  | Notes                                      |
|-----------------------|----------------|--------|--------------------------------------------|
| (checkbox)            | —              | 48px   | Row selection                              |
| `project_name`        | Project Name   | 200px  | Primary field, foreground-primary color    |
| `project_topic`       | Topic          | 160px  | Free text                                  |
| `project_status`      | Status         | 120px  | Enum pill: New / Started / Done            |
| `project_start_date`  | Start Date     | 120px  | ISO date string                            |
| `project_delivery_date` | Delivery Date | 130px | ISO date string                            |
| `project_budget`      | Budget         | 110px  | Numeric, right-aligned                     |

---

## Mandatory Grid Library

**`react-datasheet-grid`** — do not substitute AG Grid, TanStack Table, Glide Data Grid, MUI Data Grid, or any other library. This is non-negotiable unless project instructions are explicitly changed.

---

## Layout (3-Column, Desktop-First, min 1044px)

```
┌──────┬────────────┬──────────────────────────────────────────┐
│ Icon │ Sub-Items  │                                          │
│ Side │ Panel      │   Grid Card (12px rounded, white bg)     │
│ bar  │ 200px      │                                          │
│ 56px │            │   ┌─ Toolbar (52px) ──────────────────┐  │
│      │ Projects   │   │ ☐ | ↻ ⋮          ≡ ⚙ [HD avatar] │  │
│      │ 3,306      │   ├─ Header Row (40px, surface-primary)┤  │
│      │            │   │ Project Name│First│Role│Email│...  │  │
│      │ [+Add Item]│   ├─ Data Rows (40px each, white) ─────┤  │
│      │            │   │ DOQs - Docs │Yaak │Inv │    │...   │  │
│      │ ■ All      │   ├─ Status Bar (44px, surface-primary) ┤  │
│      │   New      │   │ Showing 10 records    [Prev][1][Next]│  │
│      │   Urgent   │   └──────────────────────────────────────┘  │
│      │   Starred  │                                          │
│      │   Archived │                                          │
└──────┴────────────┴──────────────────────────────────────────┘
```

---

## Design Tokens

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

  --font-headings: 'Funnel Sans';
  --font-body: 'Inter';
  --font-captions: 'Geist';

  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 12px;
  --radius-round: 16px;
  --radius-pill: 999px;
}
```

---

## Component Structure

```
src/
  components/
    layout/
      IconSidebar.tsx       # 56px dark sidebar (stub for now — single icon active)
      SubItemsPanel.tsx     # 200px panel with filter views + Add Item button
      MainContent.tsx       # Wrapper with 16px padding
    grid/
      ProjectsGrid.tsx      # react-datasheet-grid instance for projects table
      GridToolbar.tsx       # Toolbar above grid (checkbox, refresh, pagination controls)
      GridHeader.tsx        # Column header row with sort icons
      GridStatusBar.tsx     # "Showing N records" + pagination buttons
    shared/
      RolePill.tsx          # Single-select colored pill
      WhatsAppLink.tsx      # Clickable wa.me link
  lib/
    supabase.ts             # Supabase client init (env vars)
    projectsApi.ts          # CRUD functions for projects table
  types/
    project.ts              # Row type, field config, filter/sort specs
  hooks/
    useProjects.ts          # Data fetching, state management
  App.tsx
```

---

## State Architecture

Maintain these layers — do not collapse them:

```ts
sourceRows: Project[]          // flat rows from Supabase, never mutated
viewConfig: {
  visibleColumns: string[]
  filters: FilterSpec[]
  sorts: SortSpec[]
}
displayRows: Project[]         // sourceRows after filter + sort transforms
selectedRowId: string | null
detailsPanelOpen: boolean
pagination: { page: number; pageSize: number; total: number }
```

Rules:
- `sourceRows` stays flat and relational — no reshaping
- Filtering and sorting are pure frontend transforms
- Grid edits and detail panel edits write through the same source of truth
- Use UUID/DB IDs — never row indexes — for persistence

---

## Data Access

- Use Supabase JS client from `@supabase/supabase-js`
- Env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (Netlify env)
- Keep all Supabase calls in `src/lib/projectsApi.ts` — never inline in components
- Use optimistic updates: apply locally first, rollback on error
- Scope CRUD strictly to the `projects` table in Stage 1

---

## UX Requirements

- Airtable-inspired, not a clone
- Row hover: `--row-hover` background
- Role column: colored pill (`RolePill`)
- WhatsApp column: `--accent-secondary` color link, opens new tab
- Text: left-aligned; numbers: right-aligned
- Business-friendly labels — not raw schema field names
- Good loading, empty, and error states (no silent failures)
- Pagination: 10 records per page, Previous/Next + page number buttons

---

## Stage 2 (Future — Do Not Implement Yet)

Add optional single-level client-side grouping:
- `groupBy: string | null` in viewConfig
- `collapsedGroups: Record<string, boolean>`
- Grouping is display-only; never persisted; never reshapes sourceRows
- One field at a time (status, region, owner)
- Use `react-datasheet-grid` collapsible-rows pattern for group headers only

---

## Coding Standards

- Modular files — no monolithic components
- Pure transformation functions where possible
- No index-based logic for records that can be sorted/filtered/deleted
- Stage 2 must be additive — do not rewrite Stage 1
- Production realism — no demo shortcuts
- No inline Supabase calls in UI components
- No comments explaining what the code does — only comment non-obvious WHY

---

## Implementation Order (when asked to plan or build)

1. TypeScript types (`src/types/project.ts`)
2. Supabase client + projectsApi (`src/lib/`)
3. useProjects hook
4. Layout shell (IconSidebar stub + SubItemsPanel + MainContent)
5. GridToolbar + GridStatusBar
6. ProjectsGrid with react-datasheet-grid
7. RolePill + WhatsAppLink shared components
8. Wire state → grid → persistence
9. Risks / tradeoffs
