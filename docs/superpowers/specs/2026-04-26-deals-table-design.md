# Deals Table Implementation Design

**Goal:** Add a Deals table (pipeline of potential and signed deals) as a first-class view alongside Projects and Contacts, including Supabase Storage-backed file uploads for proposal documents.

**Architecture:** Follows the established Projects/Contacts pattern — `types/` → `lib/api` → `useTableData` wrapper → grid + kanban + editor modal. Adds a shared `storageApi.ts` for file uploads, reusable by any future table.

**Tech Stack:** React + TypeScript, react-datasheet-grid, @dnd-kit/core (kanban), Supabase JS client (data + storage)

---

## 1. Database Schema

Run once in the Supabase SQL editor:

```sql
CREATE TABLE deals (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_name          TEXT        NOT NULL,
  deal_description   TEXT,
  last_call_content  TEXT,
  last_call_datetime TIMESTAMPTZ,
  proposal_url       TEXT,
  proposal_filename  TEXT,
  status             TEXT        CHECK (status IN ('New','In Discussions','Signed','Rejected')),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prerequisite: update_updated_at_column() must exist (created by the projects table migration).
-- If it does not exist, create it first:
-- CREATE OR REPLACE FUNCTION update_updated_at_column()
-- RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER deals_updated_at
  BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

`proposal_url` holds the Supabase Storage public URL. `proposal_filename` holds the original filename for display. Both are nullable — a deal can exist without a proposal attached.

---

## 2. Supabase Storage

Create once in the Supabase dashboard:

- Bucket name: `documents`
- Access: **public** (files accessible via URL without auth tokens)
- Path convention: `{table}/{record_id}/{filename}` — e.g. `deals/abc-123/proposal.pdf`
- RLS policies:
  - Public `SELECT` (read) on all paths
  - Authenticated `INSERT` / `DELETE` on own paths

This bucket is shared across all future tables that need file uploads. The first path segment (`table`) namespaces each entity type.

---

## 3. File Upload Architecture

### `src/lib/storageApi.ts` (new)

Two functions used by any table:

```ts
uploadDocument(table: string, recordId: string, file: File): Promise<{ url: string; filename: string }>
deleteDocument(table: string, recordId: string, filename: string): Promise<void>
```

Path built as `{table}/{recordId}/{file.name}`. Returns the public URL from `supabase.storage.from('documents').getPublicUrl(path)`.

### Editor Modal (primary upload surface)

- Proposal field renders: empty state → "Choose file" button
- On file pick: uploads immediately, button replaced by "Uploading…", save button disabled
- On success: shows `proposal_filename` as text + "Remove" link
- Remove: calls `deleteDocument`, clears both fields on save
- Upload errors surface inline next to the field

### Grid Cell (inline upload)

- `proposal_filename` set → renders as blue underlined text → click opens `proposal_url` in new tab
- Empty → renders "Upload" button → click triggers hidden `<input type="file">` → uploads inline → optimistically updates the row
- Optimistic row (id starts with `"optimistic-"`) → upload button disabled, tooltip: "Save the record first"
- No previewer in this version — all clicks open a new tab

---

## 4. Deal Status

```ts
type DealStatus = 'New' | 'In Discussions' | 'Signed' | 'Rejected'
```

Status colors:

| Status | Background | Text |
|---|---|---|
| New | `#E8F4EA` | `#2D5E3A` |
| In Discussions | `#FFF3CD` | `#856404` |
| Signed | `#D4EDDA` | `#155724` |
| Rejected | `#F8D7DA` | `#721C24` |

---

## 5. File Structure

### New files

| Path | Role |
|---|---|
| `src/types/deal.ts` | `Deal`, `DealInsert` (omits `id`, `created_at`, `updated_at`), `DealUpdate`, `DealStatus`, colors, labels |
| `src/lib/dealsApi.ts` | `fetchDeals`, `createDeal`, `updateDeal`, `deleteDeals` |
| `src/lib/storageApi.ts` | `uploadDocument`, `deleteDocument` |
| `src/hooks/useDeals.ts` | Thin `useTableData` wrapper |
| `src/components/grid/DealsGrid.tsx` | DSG grid with proposal cell |
| `src/components/grid/DealEditorModal.tsx` | Editor modal with file upload UI |

### Modified files

| Path | Change |
|---|---|
| `src/config/tables.ts` | Add `DEALS_CONFIG` |
| `src/components/layout/IconSidebar.tsx` | Reorder icons, add `'deals'` to `AppView` |
| `src/components/layout/SubItemsPanel.tsx` | Add deals status filter block |
| `src/App.tsx` | Wire `useDeals`, renders, modal, FAB |

---

## 6. Kanban Configuration

```ts
DEALS_CONFIG = {
  label: 'Deals',
  statusField: 'status',
  statusOptions: ['New', 'In Discussions', 'Signed', 'Rejected'],
  primaryField: 'deal_name',
  cardFields: ['deal_description', 'last_call_datetime'],
  ...
}
```

`last_call_datetime` renders on cards as `"Last call: {toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}"` — e.g. "Last call: 26 Apr 2026, 14:30". Kanban drag-and-drop moves deals between status lanes.

---

## 7. Grid Columns

| Column | Width | Notes |
|---|---|---|
| (checkbox) | 48px | Row selection |
| `deal_name` | 200px | Primary field |
| `deal_description` | 220px | Free text |
| `last_call_datetime` | 160px | `toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })` |
| `proposal_filename` | 160px | Upload button or download link |
| `status` | 130px | Status pill |

---

## 8. Sidebar Icon Order

`AppView` becomes `'deals' | 'projects' | 'contacts'`.

| Position | Icon | Label | View |
|---|---|---|---|
| 1 | `label` | Deals | `'deals'` |
| 2 | `task_alt` | Projects | `'projects'` |
| 3 | `person` | Contacts | `'contacts'` |
| 4 | `folder` | Folder | stub |
| 5 | `leaderboard` | Leads | stub |

---

## 9. Default New Deal

```ts
const NEW_DEAL_DEFAULTS: DealInsert = {
  deal_name: 'New Deal',
  deal_description: null,
  last_call_content: null,
  last_call_datetime: null,
  proposal_url: null,
  proposal_filename: null,
  status: 'New',
}
```

---

## 10. Out of Scope

- Document previewer (future feature — click always opens new tab for now)
- File versioning or multiple attachments per deal
- Storage usage tracking
- Proposal field on Projects or Contacts tables (reuse of `storageApi` is ready but not wired)
