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
