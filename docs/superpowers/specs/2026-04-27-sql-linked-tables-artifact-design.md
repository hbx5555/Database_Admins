# SQL Linked Tables — Interactive Artifact Design

**Date:** 2026-04-27
**Type:** Standalone web artifact (claude.ai HTML artifact)
**Skill:** anthropic-skills:web-artifacts-builder

---

## Purpose

An interactive artifact that lets an SQL-experienced user see — and feel — how one-to-one and one-to-many table relationships work through clickable, highlighted data rows. No SQL syntax shown; purely a data-visualization tool.

---

## Audience

SQL-experienced users who understand foreign keys conceptually and want to see how row-level linking actually plays out across tables.

---

## Structure

A single-page React artifact with two tabs at the top:

- **One-to-One** — Customers ↔ CustomerProfile
- **One-to-Many** — Customers ↔ Orders

Each tab shows two tables side by side. A one-line caption below the tab title describes the relationship type (e.g. "Each customer has exactly one profile").

---

## Data Model

### One-to-One Tab

**Customers** (left)
| id | name | email |
|----|------|-------|
| 1–5 | sample names | sample emails |

**CustomerProfile** (right)
| customer_id (FK) | phone | loyalty_tier |
|-----------------|-------|-------------|
| 1–5 | sample phones | Bronze / Silver / Gold |

5 rows each, strict 1:1 mapping.

### One-to-Many Tab

**Customers** (left) — same 5 customers

**Orders** (right)
| id | customer_id (FK) | product | amount |
|----|-----------------|---------|--------|
| 1–12 | uneven distribution | sample products | dollar amounts |

10–12 orders spread unevenly: some customers have 1 order, some have 3–4, to make the one-to-many contrast visible.

The `customer_id` FK column in both right-side tables is visually distinguished with a muted color and a small "FK" badge.

---

## Interaction

- **Click any row** in either table → that row gets a solid green highlight (selected state)
- **All linked rows** in the opposite table get a lighter green highlight (linked state)
- **Click the same row again** → deselects; all highlights clear
- **Click a different row** → selection moves; highlights update immediately
- On selection, the FK column value in linked rows briefly pulses (CSS `@keyframes` opacity pulse, ~400ms) to draw attention to the connection
- No hover effects on unrelated rows — keeps the visual unambiguous

### One-to-One behavior
Click a Customer → exactly one CustomerProfile row highlights. Click a CustomerProfile → exactly one Customer row highlights.

### One-to-Many behavior
Click a Customer → all their Orders highlight. Click an Order → its single Customer highlights.

---

## Tech Stack

- React 18 + TypeScript
- Tailwind CSS (via web-artifacts-builder scaffold)
- shadcn/ui for tab component
- All data hardcoded as constants — no API calls
- Bundled to single `bundle.html` via Parcel

---

## Visual Style

- Follow project design tokens where applicable (greens, surface colors)
- Avoid centered layouts, purple gradients, uniform rounded corners
- Table rows: 40px height, left-aligned text, monospaced for IDs and FK values
- Selected row: solid `#2D5E3A` background, white text
- Linked rows: `#C8DBBC` background, dark text
- FK badge: small pill label, muted green border

---

## Out of Scope

- SQL query display
- Many-to-many relationships
- Editable data
- Animations beyond the FK pulse on selection
