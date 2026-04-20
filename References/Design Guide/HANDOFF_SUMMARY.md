# CRM Dashboard — Design Handoff Summary

**Design file:** `/Users/haimbxpertlink/Documents/GIT_Projects/Design Guide/frame.pen`
**Target repo:** `https://github.com/hbx5555/Database_Admins`
**Tech stack:** React + TypeScript + Supabase/PostgreSQL
**Target viewport:** Desktop, minimum 1044px wide
**Design dimensions:** 1440 x 900px

---

## Layout Structure (Gmail-inspired, 3-column)

```
┌──────┬────────────┬─────────────────────────────────────────┐
│ Icon │ Sub-Items  │                                         │
│ Side │ Panel      │   Grid Card (rounded corners)           │
│ bar  │            │                                         │
│ 56px │ 200px      │   ┌─ Toolbar ─────────────────────────┐ │
│      │            │   │ ☐ | ↻ ⋮    1-25 of 3,306  < > ≡ │ │
│ ☰    │ Contacts   │   ├─ Header Row (grey bg) ────────────┤ │
│      │ 3,306      │   │ Project Name│First│Role│Email│... │ │
│ ●    │            │   ├─ Data Rows ───────────────────────┤ │
│ □    │ [+Add Item]│   │ DOQs - Docs │Yaak│Inv │    │...  │ │
│ ▲    │            │   │ KidsGuard   │CEO │    │    │...  │ │
│ ○    │ ■ All 3306 │   │ B-Z Mgmt    │Eli │Own │eli@│...  │ │
│ ◇    │   New      │   │ ...                               │ │
│      │   Urgent   │   ├─ Status Bar ──────────────────────┤ │
│      │   Starred  │   │ Showing 10 records   [Prev][1][Next]│
│ ⚙    │   Archived │   └───────────────────────────────────┘ │
│ HD   │            │                                         │
└──────┴────────────┴─────────────────────────────────────────┘
```

---

## Design Tokens (CSS Variables)

```css
:root {
  /* Surfaces */
  --surface-primary: #F5F3EE;    /* Main background, header row bg */
  --surface-secondary: #C8DBBC;  /* Active sub-item highlight */
  --surface-tertiary: #D6E4E8;   /* Reserved */
  --white: #FFFFFF;              /* Grid card bg, data row bg */
  --row-hover: #EBE9E3;         /* Row hover state */

  /* Foreground */
  --foreground-primary: #1B3A28; /* Primary text, headings */
  --foreground-secondary: #4A6B52; /* Secondary text, icons */
  --foreground-inverse: #FFFFFF; /* Text on dark/accent backgrounds */

  /* Accent */
  --accent-primary: #2D5E3A;    /* Icon sidebar bg, active page, Add button */
  --accent-secondary: #4A8C5E;  /* Active icon bg, avatar bg, link text */

  /* Border */
  --border-color: #D4D2CC;      /* All borders and dividers */

  /* Typography */
  --font-headings: 'Funnel Sans';
  --font-body: 'Inter';
  --font-captions: 'Geist';

  /* Roundness */
  --radius-sm: 4px;             /* Pagination buttons, inactive menu items */
  --radius-md: 6px;             /* Icon sidebar buttons */
  --radius-lg: 12px;            /* Grid card container */
  --radius-round: 16px;         /* Add Item button, active sub-item, avatar */
  --radius-pill: 999px;         /* User avatar circle */
}
```

---

## Component Breakdown

### 1. Icon Sidebar (56px wide)

- **Background:** `accent-primary` (#2D5E3A)
- **Top:** Hamburger menu icon (`menu`, Material Symbols Outlined, 28px, white)
- **Navigation icons** (40x40, 6px radius, centered 24px icons):
  | Order | Icon Name     | Represents | State   |
  |-------|--------------|------------|---------|
  | 1     | `task_alt`   | Tasks      | Active (accent-secondary bg) |
  | 2     | `folder`     | Projects   | Inactive (white, 60% opacity) |
  | 3     | `leaderboard`| Leads      | Inactive |
  | 4     | `person`     | Contacts   | Inactive |
  | 5     | `label`      | Statuses   | Inactive |
- **Bottom section:** Settings icon (`settings`) + Avatar circle (32px, pill, "HD" initials)
- **Gap between icons:** 4px
- **Padding:** 16px top/bottom

### 2. Sub-Items Panel (200px wide)

- **Background:** Light warm (#fffbf1)
- **Border:** Right border `border-color`
- **Header:** Table name in Funnel Sans 16px bold + count "3,306" in Geist 12px
- **Add Item button:** Full-width button, 16px corner radius, accent-primary bg, 34px height, 175px width, with `add` icon (16px) + "Add Item" text (Inter 13px semibold white). Gentle lift shadow. Positioned between header and menu list with padding [4,16,8,16].
- **Filter menu items** (padding 8x12, gap 2px):
  | Label    | Icon      | State    | Corner Radius |
  |----------|-----------|----------|---------------|
  | All      | `inbox`   | Active (surface-secondary bg, bold, shows count) | 16px |
  | New      | `send`    | Inactive (foreground-secondary) | 4px |
  | Urgent   | `drafts`  | Inactive | 4px |
  | Starred  | `star`    | Inactive | 4px |
  | Archived | `archive` | Inactive | 4px |

### 3. Main Content Area

Wrapped in 16px padding. Contains the **Grid Card** (12px rounded corners, white bg, 1px border, gentle lift shadow).

#### 3a. Toolbar (52px height)
- Left: Select-all checkbox (20px, 3px radius) → divider → refresh icon → more_vert icon
- Right (after spacer): divider → view_headline icon → tune icon → User avatar (32px, pill/999px radius, accent-secondary bg, "HD" initials)
- Gap: 12px between items
- Padding: 0 20px

#### 3b. Header Row (40px height, surface-primary bg)
| Column         | Width | Icon            |
|----------------|-------|-----------------|
| Checkbox       | 48px  | —               |
| Project Name   | 200px | `sort_by_alpha` |
| First Name     | 120px | `filter_list`   |
| Role           | 120px | `filter_list`   |
| Email          | 200px | `filter_list`   |
| Phone          | 150px | `filter_list`   |
| WhatsApp Thread| fill  | `link`          |

- Font: Inter 12px semibold, foreground-primary
- Right border on each cell except last
- Icons: 16px, foreground-secondary

#### 3c. Data Rows (40px height each, white bg)
- Same column widths as header
- Font: Inter 13px regular
- Project Name: foreground-primary
- Other fields: foreground-secondary
- Links (WhatsApp): accent-secondary color
- Bottom border on each row
- **Hover state:** row-hover (#EBE9E3) background

#### 3d. Status Bar (44px height, surface-primary bg)
- Left: "Showing 10 records" (Geist 12px, foreground-secondary)
- Right: Previous button (outlined) → Page number "1" (accent-primary bg, white text, 32x32) → Next button (outlined)
- Button style: 4px radius, padding 6x14, 1px border

---

## Corner Radius Reference

| Element                     | Radius | CSS Variable    |
|-----------------------------|--------|-----------------|
| Grid Card container         | 12px   | `--radius-lg`   |
| Add Item button             | 16px   | `--radius-round`|
| Active sub-item (All)       | 16px   | `--radius-round`|
| Icon sidebar buttons        | 6px    | `--radius-md`   |
| Inactive sub-items          | 4px    | `--radius-sm`   |
| Pagination buttons          | 4px    | `--radius-sm`   |
| Active page number          | 4px    | `--radius-sm`   |
| Row checkboxes              | 3px    | —               |
| User avatar (sidebar)       | 16px   | `--radius-round`|
| User avatar (toolbar)       | 999px  | `--radius-pill` |
| Settings button             | 6px    | `--radius-md`   |

---

## Data Model (CRM Tables)

The icon sidebar represents these database tables:
1. **Tasks** — `task_alt` icon
2. **Projects** — `folder` icon
3. **Leads** — `leaderboard` icon
4. **Contacts** — `person` icon
5. **Statuses** — `label` icon (lookup table)

Each table has filtered views in the sub-items panel (All, New, Urgent, Starred, Archived).

---

## Interactive Behaviors (for implementation)

1. **Icon sidebar click** → switches active table, updates sub-items panel title/count, reloads grid data
2. **Sub-item filter click** → filters grid data, highlights active filter
3. **Add Item button** → opens new record form/modal
4. **Column header click** → sort/filter toggle
5. **Row hover** → background changes to `row-hover`
6. **Row checkbox** → multi-select for bulk actions
7. **Pagination** → loads next/previous page of records
8. **WhatsApp links** → opens WhatsApp thread in new tab
9. **Hamburger menu** → toggles sub-items panel visibility
10. **User avatar** → user profile/logout dropdown

---

## Implementation Notes

- The grid area is designed for embedding a React data grid library (e.g., AG Grid, TanStack Table)
- The sidebar navigation maps to React Router routes
- Sub-item filters are view-layer behaviors, not database schema changes
- Grouping is single-level only, display-only (like Airtable)
- The database schema stays relational and flat — the frontend shows linked data with friendly labels
- Target desktop first (min 1044px), responsive behavior TBD

---

## File Reference

- **Design source:** `frame.pen` (read via Pencil MCP tools)
- **Design node ID:** `sArg4` (root frame)
- **Style:** Zigzag Bold Split / Forest Sage palette
