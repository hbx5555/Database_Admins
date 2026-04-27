# SQL Linked Tables Interactive Artifact — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a self-contained HTML artifact with two tabs showing clickable row-level linking between SQL tables (one-to-one and one-to-many relationships).

**Architecture:** Single React app scaffolded via the web-artifacts-builder skill, with all data hardcoded as constants. A generic `DataTable` component handles selection and highlight state passed in as props. App.tsx owns all state and derives linked row IDs from the current selection.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, shadcn/ui (Tabs), Parcel (bundler) — all via `web-artifacts-builder` skill scaffold.

---

## File Map

| File | Role |
|------|------|
| `src/types.ts` | TypeScript interfaces for data and column definitions |
| `src/data.ts` | Hardcoded customers, profiles, orders |
| `src/index.css` | Global styles + `@keyframes fk-pulse` animation |
| `src/components/FKBadge.tsx` | Small "FK" pill badge rendered in column headers |
| `src/components/DataTable.tsx` | Generic table: accepts rows, selectedId, linkedIds; emits row clicks |
| `src/components/TableView.tsx` | Layout: caption + two `DataTable` slots side by side |
| `src/App.tsx` | Tab state, selection state, derives linkedIds, wires everything |

---

## Task 1: Initialize Project

**Files:**
- Create: `artifacts/sql-linked-tables/` (via init script)

- [ ] **Step 1: Invoke the web-artifacts-builder skill**

  In your session, invoke the `anthropic-skills:web-artifacts-builder` skill. Note the base directory printed at the top of the skill output — you'll need it for the next step. Refer to it as `$SKILL_DIR` below.

- [ ] **Step 2: Create the project**

  ```bash
  mkdir -p /Users/haimbxpertlink/Documents/GIT_Projects/Database_Admins/artifacts
  cd /Users/haimbxpertlink/Documents/GIT_Projects/Database_Admins/artifacts
  bash "$SKILL_DIR/scripts/init-artifact.sh" sql-linked-tables
  ```

  Expected: A `sql-linked-tables/` directory is created with `src/`, `index.html`, `package.json`, `tailwind.config.js`, `tsconfig.json`, `vite.config.ts`.

- [ ] **Step 3: Verify the scaffold**

  ```bash
  cd /Users/haimbxpertlink/Documents/GIT_Projects/Database_Admins/artifacts/sql-linked-tables
  ls src/
  ```

  Expected output includes: `App.tsx  main.tsx  index.css`

- [ ] **Step 4: Commit**

  ```bash
  cd /Users/haimbxpertlink/Documents/GIT_Projects/Database_Admins
  git add artifacts/sql-linked-tables
  git commit -m "feat: scaffold sql-linked-tables artifact project"
  ```

---

## Task 2: Types and Data

**Files:**
- Create: `artifacts/sql-linked-tables/src/types.ts`
- Create: `artifacts/sql-linked-tables/src/data.ts`

- [ ] **Step 1: Write types.ts**

  Create `artifacts/sql-linked-tables/src/types.ts`:

  ```typescript
  import type { ReactNode } from 'react';

  export interface Customer {
    id: number;
    name: string;
    email: string;
  }

  export interface CustomerProfile {
    customer_id: number;
    phone: string;
    loyalty_tier: 'Bronze' | 'Silver' | 'Gold';
  }

  export interface Order {
    id: number;
    customer_id: number;
    product: string;
    amount: number;
  }

  export interface Column<T> {
    key: keyof T;
    label: string;
    isFK?: boolean;
    align?: 'left' | 'right';
    render?: (value: unknown) => ReactNode;
  }

  export type TabId = 'one-to-one' | 'one-to-many';

  export interface Selection {
    side: 'left' | 'right';
    id: number;
  }
  ```

- [ ] **Step 2: Write data.ts**

  Create `artifacts/sql-linked-tables/src/data.ts`:

  ```typescript
  import type { Customer, CustomerProfile, Order } from './types';

  export const customers: Customer[] = [
    { id: 1, name: 'Alice Johnson', email: 'alice@example.com' },
    { id: 2, name: 'Bob Smith', email: 'bob@example.com' },
    { id: 3, name: 'Carol White', email: 'carol@example.com' },
    { id: 4, name: 'David Lee', email: 'david@example.com' },
    { id: 5, name: 'Emma Davis', email: 'emma@example.com' },
  ];

  export const customerProfiles: CustomerProfile[] = [
    { customer_id: 1, phone: '555-0101', loyalty_tier: 'Gold' },
    { customer_id: 2, phone: '555-0102', loyalty_tier: 'Silver' },
    { customer_id: 3, phone: '555-0103', loyalty_tier: 'Bronze' },
    { customer_id: 4, phone: '555-0104', loyalty_tier: 'Gold' },
    { customer_id: 5, phone: '555-0105', loyalty_tier: 'Silver' },
  ];

  export const orders: Order[] = [
    { id: 1,  customer_id: 1, product: 'Laptop Stand',   amount: 49.99 },
    { id: 2,  customer_id: 1, product: 'Wireless Mouse',  amount: 29.99 },
    { id: 3,  customer_id: 1, product: 'USB Hub',         amount: 34.99 },
    { id: 4,  customer_id: 1, product: 'Monitor Cable',   amount: 14.99 },
    { id: 5,  customer_id: 2, product: 'Keyboard',        amount: 89.99 },
    { id: 6,  customer_id: 3, product: 'Webcam',          amount: 69.99 },
    { id: 7,  customer_id: 3, product: 'Desk Lamp',       amount: 39.99 },
    { id: 8,  customer_id: 3, product: 'Headset',         amount: 79.99 },
    { id: 9,  customer_id: 4, product: 'Notepad',         amount:  9.99 },
    { id: 10, customer_id: 4, product: 'Pen Set',         amount: 12.99 },
    { id: 11, customer_id: 5, product: 'Backpack',        amount: 59.99 },
    { id: 12, customer_id: 5, product: 'Phone Stand',     amount: 19.99 },
  ];
  ```

- [ ] **Step 3: Type-check**

  ```bash
  cd /Users/haimbxpertlink/Documents/GIT_Projects/Database_Admins/artifacts/sql-linked-tables
  npx tsc --noEmit
  ```

  Expected: No errors (only `types.ts` and `data.ts` exist so far; ignore any missing-module errors from the scaffold's App.tsx until Task 6).

- [ ] **Step 4: Commit**

  ```bash
  cd /Users/haimbxpertlink/Documents/GIT_Projects/Database_Admins
  git add artifacts/sql-linked-tables/src/types.ts artifacts/sql-linked-tables/src/data.ts
  git commit -m "feat: add types and sample data for linked-tables artifact"
  ```

---

## Task 3: FKBadge Component + Pulse Animation

**Files:**
- Create: `artifacts/sql-linked-tables/src/components/FKBadge.tsx`
- Modify: `artifacts/sql-linked-tables/src/index.css`

- [ ] **Step 1: Create FKBadge.tsx**

  Create `artifacts/sql-linked-tables/src/components/FKBadge.tsx`:

  ```tsx
  export function FKBadge() {
    return (
      <span className="ml-1.5 inline-flex items-center px-1 py-0.5 rounded text-[10px] font-mono font-bold border border-[#4A6B52] text-[#4A6B52] leading-none select-none">
        FK
      </span>
    );
  }
  ```

- [ ] **Step 2: Add pulse keyframes to index.css**

  Open `artifacts/sql-linked-tables/src/index.css` and append at the bottom:

  ```css
  @keyframes fk-pulse {
    0%   { opacity: 1; }
    40%  { opacity: 0.2; }
    100% { opacity: 1; }
  }

  .fk-pulse {
    animation: fk-pulse 400ms ease-in-out;
  }
  ```

- [ ] **Step 3: Commit**

  ```bash
  cd /Users/haimbxpertlink/Documents/GIT_Projects/Database_Admins
  git add artifacts/sql-linked-tables/src/components/FKBadge.tsx artifacts/sql-linked-tables/src/index.css
  git commit -m "feat: add FKBadge component and pulse animation"
  ```

---

## Task 4: DataTable Component

**Files:**
- Create: `artifacts/sql-linked-tables/src/components/DataTable.tsx`

- [ ] **Step 1: Write DataTable.tsx**

  Create `artifacts/sql-linked-tables/src/components/DataTable.tsx`:

  ```tsx
  import { FKBadge } from './FKBadge';
  import type { Column } from '../types';

  interface Props<T> {
    title: string;
    columns: Column<T>[];
    rows: T[];
    getRowId: (row: T) => number;
    selectedId: number | null;
    linkedIds: number[];
    pulseKey: number;
    onRowClick: (id: number) => void;
  }

  export function DataTable<T>({
    title,
    columns,
    rows,
    getRowId,
    selectedId,
    linkedIds,
    pulseKey,
    onRowClick,
  }: Props<T>) {
    return (
      <div className="flex flex-col min-w-0">
        <h3 className="text-xs font-semibold font-mono uppercase tracking-wide text-[#4A6B52] mb-2">
          {title}
        </h3>
        <div className="border border-[#D4D2CC] rounded-md overflow-hidden">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-[#F5F3EE]">
                {columns.map((col) => (
                  <th
                    key={String(col.key)}
                    className={`px-3 py-2 text-xs font-semibold text-[#4A6B52] border-b border-[#D4D2CC] whitespace-nowrap ${
                      col.align === 'right' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {col.label}
                    {col.isFK && <FKBadge />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const id = getRowId(row);
                const isSelected = id === selectedId;
                const isLinked = linkedIds.includes(id);
                return (
                  <tr
                    key={id}
                    onClick={() => onRowClick(id)}
                    className={`cursor-pointer border-b border-[#D4D2CC] last:border-0 transition-colors duration-100 ${
                      isSelected
                        ? 'bg-[#2D5E3A] text-white'
                        : isLinked
                        ? 'bg-[#C8DBBC] text-[#1B3A28]'
                        : 'bg-white text-[#1B3A28] hover:bg-[#EBE9E3]'
                    }`}
                  >
                    {columns.map((col) => {
                      const value = row[col.key];
                      const isFKCell = col.isFK && isLinked;
                      return (
                        <td
                          key={String(col.key)}
                          className={`px-3 py-2.5 ${
                            col.align === 'right' ? 'text-right tabular-nums' : 'text-left'
                          }`}
                        >
                          {isFKCell ? (
                            <span key={pulseKey} className="fk-pulse font-semibold">
                              {col.render ? col.render(value) : String(value)}
                            </span>
                          ) : col.render ? (
                            col.render(value)
                          ) : (
                            String(value)
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  cd /Users/haimbxpertlink/Documents/GIT_Projects/Database_Admins
  git add artifacts/sql-linked-tables/src/components/DataTable.tsx
  git commit -m "feat: add generic DataTable component with selection and linked-row highlighting"
  ```

---

## Task 5: TableView Layout Component

**Files:**
- Create: `artifacts/sql-linked-tables/src/components/TableView.tsx`

- [ ] **Step 1: Write TableView.tsx**

  Create `artifacts/sql-linked-tables/src/components/TableView.tsx`:

  ```tsx
  import type { ReactNode } from 'react';

  interface Props {
    caption: string;
    left: ReactNode;
    right: ReactNode;
  }

  export function TableView({ caption, left, right }: Props) {
    return (
      <div>
        <p className="text-sm text-[#4A6B52] mb-5 font-['Geist',ui-monospace,monospace] italic">
          {caption}
        </p>
        <div className="flex gap-8 items-start">
          <div className="flex-1 min-w-0">{left}</div>
          <div className="flex-1 min-w-0">{right}</div>
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  cd /Users/haimbxpertlink/Documents/GIT_Projects/Database_Admins
  git add artifacts/sql-linked-tables/src/components/TableView.tsx
  git commit -m "feat: add TableView layout component"
  ```

---

## Task 6: Wire App.tsx

**Files:**
- Modify: `artifacts/sql-linked-tables/src/App.tsx` (replace generated content entirely)

- [ ] **Step 1: Replace App.tsx**

  Overwrite `artifacts/sql-linked-tables/src/App.tsx` with:

  ```tsx
  import { useState, type Dispatch, type SetStateAction } from 'react';
  import { DataTable } from './components/DataTable';
  import { TableView } from './components/TableView';
  import { customers, customerProfiles, orders } from './data';
  import type { Column, Customer, CustomerProfile, Order, Selection, TabId } from './types';

  const customerColumns: Column<Customer>[] = [
    { key: 'id',    label: 'ID' },
    { key: 'name',  label: 'Name' },
    { key: 'email', label: 'Email' },
  ];

  const profileColumns: Column<CustomerProfile>[] = [
    { key: 'customer_id',  label: 'Customer ID', isFK: true },
    { key: 'phone',        label: 'Phone' },
    { key: 'loyalty_tier', label: 'Loyalty Tier' },
  ];

  const orderColumns: Column<Order>[] = [
    { key: 'id',          label: 'Order ID' },
    { key: 'customer_id', label: 'Customer ID', isFK: true },
    { key: 'product',     label: 'Product' },
    {
      key: 'amount',
      label: 'Amount',
      align: 'right',
      render: (v) => `$${(v as number).toFixed(2)}`,
    },
  ];

  const TABS: { id: TabId; label: string }[] = [
    { id: 'one-to-one',  label: 'One-to-One' },
    { id: 'one-to-many', label: 'One-to-Many' },
  ];

  function deriveOtoLinkedIds(selection: Selection | null): { leftLinked: number[]; rightLinked: number[] } {
    if (!selection) return { leftLinked: [], rightLinked: [] };
    if (selection.side === 'left')  return { leftLinked: [], rightLinked: [selection.id] };
    return { leftLinked: [selection.id], rightLinked: [] };
  }

  function deriveOtmLinkedIds(selection: Selection | null): { leftLinked: number[]; rightLinked: number[] } {
    if (!selection) return { leftLinked: [], rightLinked: [] };
    if (selection.side === 'left') {
      return { leftLinked: [], rightLinked: orders.filter(o => o.customer_id === selection.id).map(o => o.id) };
    }
    const order = orders.find(o => o.id === selection.id);
    return { leftLinked: order ? [order.customer_id] : [], rightLinked: [] };
  }

  function toggle(prev: Selection | null, side: 'left' | 'right', id: number): Selection | null {
    return prev?.side === side && prev.id === id ? null : { side, id };
  }

  export default function App() {
    const [activeTab, setActiveTab] = useState<TabId>('one-to-one');
    const [otoSel, setOtoSel] = useState<Selection | null>(null);
    const [otmSel, setOtmSel] = useState<Selection | null>(null);
    const [pulseKey, setPulseKey] = useState(0);

    function handleClick(
      setFn: Dispatch<SetStateAction<Selection | null>>,
      side: 'left' | 'right',
      id: number,
    ) {
      setFn(prev => toggle(prev, side, id));
      setPulseKey(k => k + 1);
    }

    const { leftLinked: otoLeftLinked, rightLinked: otoRightLinked } = deriveOtoLinkedIds(otoSel);
    const { leftLinked: otmLeftLinked, rightLinked: otmRightLinked } = deriveOtmLinkedIds(otmSel);

    return (
      <div className="min-h-screen bg-[#F5F3EE] p-8 font-['Inter',sans-serif]">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold text-[#1B3A28] mb-1 font-['Funnel_Sans',sans-serif]">
            SQL Table Relationships
          </h1>
          <p className="text-sm text-[#4A6B52] mb-6">
            Click any row to highlight its linked records in the other table.
          </p>

          {/* Tab bar */}
          <div className="flex gap-1 mb-6 border-b border-[#D4D2CC]">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white border border-b-white border-[#D4D2CC] text-[#1B3A28] -mb-px'
                    : 'text-[#4A6B52] hover:text-[#1B3A28]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="bg-white rounded-lg border border-[#D4D2CC] p-6">
            {activeTab === 'one-to-one' && (
              <TableView
                caption="Each customer has exactly one profile. The customer_id FK in CustomerProfile points to id in Customers."
                left={
                  <DataTable
                    title="Customers"
                    columns={customerColumns}
                    rows={customers}
                    getRowId={r => r.id}
                    selectedId={otoSel?.side === 'left' ? otoSel.id : null}
                    linkedIds={otoLeftLinked}
                    pulseKey={pulseKey}
                    onRowClick={id => handleClick(setOtoSel, 'left', id)}
                  />
                }
                right={
                  <DataTable
                    title="CustomerProfile"
                    columns={profileColumns}
                    rows={customerProfiles}
                    getRowId={r => r.customer_id}
                    selectedId={otoSel?.side === 'right' ? otoSel.id : null}
                    linkedIds={otoRightLinked}
                    pulseKey={pulseKey}
                    onRowClick={id => handleClick(setOtoSel, 'right', id)}
                  />
                }
              />
            )}

            {activeTab === 'one-to-many' && (
              <TableView
                caption="Each customer can have many orders. The customer_id FK in Orders points to id in Customers."
                left={
                  <DataTable
                    title="Customers"
                    columns={customerColumns}
                    rows={customers}
                    getRowId={r => r.id}
                    selectedId={otmSel?.side === 'left' ? otmSel.id : null}
                    linkedIds={otmLeftLinked}
                    pulseKey={pulseKey}
                    onRowClick={id => handleClick(setOtmSel, 'left', id)}
                  />
                }
                right={
                  <DataTable
                    title="Orders"
                    columns={orderColumns}
                    rows={orders}
                    getRowId={r => r.id}
                    selectedId={otmSel?.side === 'right' ? otmSel.id : null}
                    linkedIds={otmRightLinked}
                    pulseKey={pulseKey}
                    onRowClick={id => handleClick(setOtmSel, 'right', id)}
                  />
                }
              />
            )}
          </div>

          <p className="text-xs text-[#4A6B52] mt-4 text-center">
            Click the same row again to deselect.
          </p>
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 2: Type-check the full project**

  ```bash
  cd /Users/haimbxpertlink/Documents/GIT_Projects/Database_Admins/artifacts/sql-linked-tables
  npx tsc --noEmit
  ```

  Expected: Zero errors. If you see "Cannot find module" for shadcn components, that's fine — we're not using them. Any other error must be fixed before proceeding.

- [ ] **Step 3: Visual spot-check in dev server**

  ```bash
  cd /Users/haimbxpertlink/Documents/GIT_Projects/Database_Admins/artifacts/sql-linked-tables
  npm run dev
  ```

  Open the URL shown (typically `http://localhost:5173`). Verify:
  - Both tabs render side-by-side tables with correct columns
  - Clicking a customer in One-to-One tab highlights exactly one profile row (and vice versa)
  - Clicking a customer in One-to-Many tab highlights all their orders
  - Clicking an order highlights its customer
  - Clicking the same row again deselects
  - FK badge appears in profile and order column headers
  - FK column value pulses briefly on selection

  Stop the dev server (`Ctrl+C`) when done.

- [ ] **Step 4: Commit**

  ```bash
  cd /Users/haimbxpertlink/Documents/GIT_Projects/Database_Admins
  git add artifacts/sql-linked-tables/src/App.tsx
  git commit -m "feat: wire App.tsx with both tabs, selection state, and linked-row derivation"
  ```

---

## Task 7: Bundle and Share

**Files:**
- Create: `artifacts/sql-linked-tables/bundle.html` (generated)

- [ ] **Step 1: Run bundle script**

  ```bash
  cd /Users/haimbxpertlink/Documents/GIT_Projects/Database_Admins/artifacts/sql-linked-tables
  bash "$SKILL_DIR/scripts/bundle-artifact.sh"
  ```

  Expected: `bundle.html` created in the current directory. Output ends with something like "Done. bundle.html is ready."

- [ ] **Step 2: Verify bundle size is reasonable**

  ```bash
  ls -lh bundle.html
  ```

  Expected: between 200KB and 2MB. If over 5MB, something is wrong — check for accidental large asset inclusions.

- [ ] **Step 3: Share the artifact**

  Read `bundle.html` and share its contents directly in the conversation as an artifact so the user can interact with it.

- [ ] **Step 4: Commit**

  ```bash
  cd /Users/haimbxpertlink/Documents/GIT_Projects/Database_Admins
  git add artifacts/sql-linked-tables/bundle.html
  git commit -m "feat: add bundled sql-linked-tables artifact"
  ```
