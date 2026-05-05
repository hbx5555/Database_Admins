# Database Admins - App Summary

**Tech Stack:** React 19 + TypeScript + Vite + Supabase + `react-datasheet-grid`

## Core Purpose
A project management CRUD application for tracking database projects with fields like name, topic, status, dates, and budget.

## Data Model (`Project`)
- **Fields:** `project_name`, `project_topic`, `project_status` (New/Started/Done), `project_start_date`, `project_delivery_date`, `project_budget`
- **Backend:** Supabase table `projects`

## Architecture

### State Management
Custom hook `useProjects()` handles:
- Optimistic updates with rollback on error
- Filtering, sorting, pagination (client-side)
- Status filtering
- Selection state

### API Layer
`src/lib/projectsApi.ts` — Supabase CRUD operations

### Components Structure
- `layout/` — `IconSidebar`, `SubItemsPanel`, `MainContent` (3-panel layout with collapsible sidebar)
- `grid/` — `ProjectsGrid` (spreadsheet via `react-datasheet-grid`), `GridToolbar`, `GridStatusBar`
- `shared/` — Loading, error, empty states

## Key Features
1. **Spreadsheet-like editing** — In-cell editing with `react-datasheet-grid`
2. **Bulk operations** — Select all/clear/delete multiple rows
3. **Status filtering** — Filter by New/Started/Done in sidebar
4. **Pagination** — 10 items per page
5. **Optimistic UI** — Instant UI updates with rollback on API failure

## File Organization
```
src/
├── App.tsx (main layout, selection state)
├── hooks/
│   ├── useProjects.ts (data fetching, CRUD, pagination)
│   └── useColumnResize.ts
├── lib/
│   ├── supabase.ts (client config)
│   ├── projectsApi.ts (Supabase API)
│   └── transforms.ts (filter/sort/paginate logic)
├── types/project.ts (TypeScript types, defaults)
└── components/
    ├── grid/ (ProjectsGrid, toolbar, status bar)
    ├── layout/ (sidebar, panels)
    └── shared/ (status components)
```

## Testing
Vitest with `@testing-library/react`, jsdom environment. Tests in `/tests/` folder.
