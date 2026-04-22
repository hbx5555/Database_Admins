# Status Filter — SubItemsPanel Design

**Date:** 2026-04-22  
**Scope:** Stage 1 — `projects` table only

---

## Goal

Replace the hardcoded `FILTER_VIEWS` list in `SubItemsPanel` with a live status filter wired to `useProjects`. Clicking a status entry filters the grid to that status; clicking "All" clears the filter and shows all records.

---

## Static Options List

Add `STATUS_OPTIONS: ProjectStatus[]` constant to `src/types/project.ts`:

```ts
export const STATUS_OPTIONS: ProjectStatus[] = ['New', 'Started', 'Done']
```

This is the single source of truth for the ordered status list. The sidebar always renders all three options regardless of how many matching records exist. Clicking a status with zero matches shows the existing `<EmptyState />`.

---

## State: `useProjects`

Add one new state field:

```ts
activeStatusFilter: ProjectStatus | null   // null = "All"
```

Expose from the hook:

```ts
activeStatusFilter: ProjectStatus | null
setStatusFilter: (status: ProjectStatus | null) => void
```

`setStatusFilter` updates `viewConfig.filters` by replacing (or removing) the `project_status` filter entry:

- `null` → remove any `{ field: 'project_status', ... }` entry from `filters`
- `ProjectStatus` → upsert `{ field: 'project_status', value: status }` into `filters`

No changes to `FilterSpec`, `ViewConfig`, or `applyFilters`.

---

## Component: `SubItemsPanel`

**New props:**

```ts
activeStatusFilter: ProjectStatus | null
onStatusChange: (status: ProjectStatus | null) => void
```

**Remove:** hardcoded `FILTER_VIEWS` array and all references to it.

**Render order:**
1. "All" row — always first, no icon
2. One row per `STATUS_OPTIONS` entry — no icon

**Active item styling** (same as existing "All" active state):
- Background: `--surface-secondary`
- Border-radius: `--radius-round`
- Font-weight: 600
- Color: `--foreground-primary`

**Inactive item styling** (same as existing inactive state):
- Background: transparent
- Border-radius: `--radius-sm`
- Font-weight: 400
- Color: `--foreground-secondary`

---

## App.tsx

Pull `activeStatusFilter` and `setStatusFilter` from `useProjects`. Pass to `SubItemsPanel`:

```tsx
<SubItemsPanel
  totalCount={sourceRows.length}
  onAddItem={handleAddItem}
  activeStatusFilter={activeStatusFilter}
  onStatusChange={setStatusFilter}
/>
```

`totalCount` always reflects `sourceRows.length` (the unfiltered total) — unchanged.

---

## Files Changed

| File | Change |
|------|--------|
| `src/types/project.ts` | Add `STATUS_OPTIONS` constant |
| `src/hooks/useProjects.ts` | Add `activeStatusFilter` state + `setStatusFilter` |
| `src/components/layout/SubItemsPanel.tsx` | Replace hardcoded list with dynamic render from `STATUS_OPTIONS` |
| `src/App.tsx` | Wire `activeStatusFilter` + `setStatusFilter` to `SubItemsPanel` |

---

## Out of Scope

- Multi-select status filtering
- Filter persistence across sessions
- Toolbar search/filter UI
- Any table other than `projects`
