# Project → Deal Linked Field

**Date:** 2026-04-28
**Status:** Approved

---

## Overview

Each project row gains a `deal_id` FK column referencing the `deals` table. The linked deal name appears as a clickable field in both the Projects grid and the Project editor modal. Clicking opens a read-only `DealViewModal`. The link is set directly in Supabase — no picker UI in the frontend.

This mirrors the existing Deal → Contact pattern exactly.

---

## Database

Run once in Supabase SQL editor:

```sql
ALTER TABLE projects
  ADD COLUMN deal_id UUID REFERENCES deals(id) ON DELETE SET NULL;
```

---

## Types — `src/types/project.ts`

Add to the `Project` interface:

```ts
import type { Deal } from './deal'

deal_id: string | null
deals: Deal | null       // populated by Supabase join; read-only
```

Update `ProjectInsert`:

```ts
export type ProjectInsert = Omit<Project, 'id' | 'created_at' | 'updated_at' | 'deals'>
```

`deals` is excluded because it is a join result, not a writable column. `deal_id` is included (it is a real FK column the app can write).

---

## API — `src/lib/projectsApi.ts`

All three operations update their `.select()` call:

```ts
.select('*, deals(*)')
```

Affected functions: `fetchProjects`, `createProject`, `updateProject`.

---

## Hook — `src/hooks/useProjects.ts`

`buildOptimisticRow` sets `deals: null` so the returned row always matches the `Project` type contract, even before Supabase confirms the insert:

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

---

## New Component — `src/components/grid/DealViewModal.tsx`

Read-only modal displaying deal details. Props:

```ts
interface DealViewModalProps {
  deal: Deal
  onClose: () => void
}
```

Layout mirrors `ContactViewModal`:
- Grey accent stripe (`var(--foreground-secondary)`) on the left
- `FieldRow` layout (180px label + flex content), same as editor modals
- All fields rendered as `<span>` (not inputs)
- Status rendered as a colored pill using `DEAL_STATUS_COLORS`
- Proposal rendered as a clickable `<a>` link if `proposal_url` is present; otherwise `—`
- Contact name shown as plain text (not a nested clickable link — avoids 3-modal stack)
- Close button only — no Save/Cancel

Fields displayed in order:
1. Deal Name (bold)
2. Contact (plain text name derived from `deal.contacts`, or `—`)
3. Description
4. Last Call (formatted datetime)
5. Last Call Notes
6. Proposal (download link or `—`)
7. Status (colored pill)

---

## Projects Grid — `src/components/grid/ProjectsGrid.tsx`

Add a **Deal** column as the third column (after checkbox and Project Name). Column key: `deal`.

- Width: `columnWidths.deal ?? 140` from `useColumnResize`
- `disableKeys: true` (non-editable virtual join column)
- No sort arrow (join field, no DB sort key)
- Cell renders the deal name as a clickable `<button>` (accent color, underline) if `rowData.deals` is non-null; otherwise `—`
- Uses a local `const deal = rowData.deals` before the null check to avoid non-null assertions in the click handler

New prop on `ProjectsGridProps`:

```ts
onViewDeal: (deal: Deal) => void
```

---

## Record Editor Modal — `src/components/grid/RecordEditorModal.tsx`

Add a **Deal** `FieldRow` after the Project Name field.

- Read-only display (no input) — link is set in Supabase, not via this UI
- If `row.deals` is non-null, render a `<button>` with the deal name (accent color, underline) that calls `onViewDeal?.(deal)`
- If null (new record or no link), render `—`
- Use IIFE pattern for type narrowing (same approach as Contact field in `DealEditorModal`)

New optional prop:

```ts
onViewDeal?: (deal: Deal) => void
```

`deal_id` is added to the `handleSave` diff check:

```ts
if (draft.deal_id !== row.deal_id) changes.deal_id = draft.deal_id
```

And `EMPTY_DRAFT` gains:

```ts
deal_id: null,
```

---

## Column Resize — `src/hooks/useColumnResize.ts`

Add `deal: 140` to `PROJECT_DEFAULT_WIDTHS`.

---

## App Wiring — `src/App.tsx`

```ts
const [viewingDeal, setViewingDeal] = useState<Deal | null>(null)
```

Pass `onViewDeal={setViewingDeal}` to both `<ProjectsGrid>` and `<RecordEditorModal>`.

Render after the `RecordEditorModal` block:

```tsx
{viewingDeal !== null && (
  <DealViewModal
    deal={viewingDeal}
    onClose={() => setViewingDeal(null)}
  />
)}
```

---

## What Is Not Implemented

- No picker UI to assign a deal to a project from the frontend — `deal_id` is set directly in Supabase
- No clickable Contact link inside `DealViewModal` — contact name is plain text to avoid a 3-modal stack
- No changes to the Deals table or Contacts table

---

## Files Changed

| File | Change |
|---|---|
| `src/types/project.ts` | Add `deal_id`, `deals`, update `ProjectInsert` |
| `src/lib/projectsApi.ts` | Add `deals(*)` join to all 3 operations |
| `src/hooks/useProjects.ts` | Add `deals: null` to optimistic row |
| `src/components/grid/DealViewModal.tsx` | **New file** — read-only deal detail modal |
| `src/components/grid/ProjectsGrid.tsx` | Add Deal column + `onViewDeal` prop |
| `src/components/grid/RecordEditorModal.tsx` | Add Deal FieldRow + `onViewDeal` prop |
| `src/hooks/useColumnResize.ts` | Add `deal: 140` to `PROJECT_DEFAULT_WIDTHS` |
| `src/App.tsx` | Add `viewingDeal` state, pass props, render modal |
