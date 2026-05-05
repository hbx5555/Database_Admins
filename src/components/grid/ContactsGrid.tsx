import { useCallback, useMemo, useRef, useState } from 'react'
import { DataSheetGrid, textColumn, keyColumn } from 'react-datasheet-grid'
import type { Column } from 'react-datasheet-grid'
import type { Contact, ContactUpdate, ContactSortSpec, ContactStatus } from '../../types/contact'
import { CONTACT_COLUMN_LABELS, CONTACT_STATUS_OPTIONS, CONTACT_STATUS_COLORS } from '../../types/contact'
import { useColumnResize, CONTACT_COLUMN_LS_KEY, CONTACT_DEFAULT_WIDTHS } from '../../hooks/useColumnResize'
import { ResizeHandle } from './ResizeHandle'

type Operation = {
  type: 'UPDATE' | 'DELETE' | 'CREATE'
  fromRowIndex: number
  toRowIndex: number
}

type ContactRow = Contact & { _selected: boolean }
type ContactColumn = Partial<Column<ContactRow, unknown, string>>

interface ContactsGridProps {
  rows: Contact[]
  onRowChange: (id: string, changes: ContactUpdate) => void
  selectedIds: Set<string>
  onToggleRow: (id: string) => void
  onEditRow: (id: string) => void
  sorts: ContactSortSpec[]
  onSortField: (field: keyof Contact) => void
}

export function ContactsGrid({ rows, onRowChange, selectedIds, onToggleRow, onEditRow, sorts, onSortField }: ContactsGridProps) {
  const { columnWidths, finalizeWidth } = useColumnResize(CONTACT_COLUMN_LS_KEY, CONTACT_DEFAULT_WIDTHS)
  const [resizeVersion, setResizeVersion] = useState(0)

  const viewRows = useMemo(
    () => rows.map(r => ({ ...r, _selected: selectedIds.has(r.id) })),
    [rows, selectedIds]
  )

  const handleFinalizeWidth = useCallback((key: string, width: number) => {
    finalizeWidth(key, width)
    setResizeVersion(v => v + 1)
  }, [finalizeWidth])

  const colTitle = useCallback((key: string, label: string) => {
    const sort = sorts.find(s => s.field === key)
    return (
      <div
        onMouseDown={e => {
          e.nativeEvent.stopImmediatePropagation()
          onSortField(key as keyof Contact)
        }}
        style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%', height: '100%', cursor: 'pointer' }}
      >
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingLeft: 10, paddingRight: 4 }}>
          {label}
        </span>
        <span className="material-symbols-outlined" style={{
          fontSize: 36, marginRight: 4, flexShrink: 0,
          color: 'var(--accent-primary)',
          opacity: sort ? 1 : 0.3,
        }}>
          {sort?.direction === 'asc' ? 'arrow_drop_down' : 'arrow_drop_up'}
        </span>
        <ResizeHandle columnKey={key} onFinalizeWidth={handleFinalizeWidth} currentWidth={columnWidths[key]} />
      </div>
    )
  }, [columnWidths, handleFinalizeWidth, sorts, onSortField])

  const sortKey = sorts.map(s => `${String(s.field)}:${s.direction}`).join(',')

  const inp = (readOnly?: boolean): React.CSSProperties => ({
    width: '100%', height: '100%', border: 'none', outline: 'none',
    background: readOnly ? '#F9F8F6' : 'transparent',
    fontFamily: 'var(--font-body)', fontSize: 13,
    color: readOnly ? 'var(--foreground-secondary)' : 'var(--foreground-primary)',
    padding: '0 8px', cursor: readOnly ? 'default' : 'text',
  })

  const columns: ContactColumn[] = useMemo(() => [
    {
      basis: 48, grow: 0, shrink: 0,
      disableKeys: true,
      cellClassName: 'checkbox-cell',
      title: <div style={{ width: 48 }} />,
      component: ({ rowData }: { rowData: ContactRow }) => (
        <div
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', cursor: 'pointer' }}
          onMouseDown={e => {
            e.nativeEvent.stopImmediatePropagation()
            onToggleRow(rowData.id)
          }}
        >
          <input
            type="checkbox"
            checked={rowData._selected}
            readOnly
            style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--accent-primary)', pointerEvents: 'none' }}
          />
        </div>
      ),
    },
    {
      title: colTitle('full_name', CONTACT_COLUMN_LABELS.full_name),
      basis: columnWidths.full_name, grow: 0, shrink: 0,
      disableKeys: true,
      component: ({ rowData }: { rowData: ContactRow }) => (
        <div style={{ ...inp(true), display: 'flex', alignItems: 'center', fontWeight: 500 }}>
          {rowData.full_name ?? '—'}
        </div>
      ),
      copyValue: ({ rowData }) => rowData.full_name ?? '',
    },
    {
      ...(keyColumn('phone_number', textColumn) as unknown as ContactColumn),
      title: colTitle('phone_number', CONTACT_COLUMN_LABELS.phone_number),
      basis: columnWidths.phone_number, grow: 0, shrink: 0,
    },
    {
      ...(keyColumn('email', textColumn) as unknown as ContactColumn),
      title: colTitle('email', CONTACT_COLUMN_LABELS.email),
      basis: columnWidths.email, grow: 0, shrink: 0,
    },
    {
      ...(keyColumn('role', textColumn) as unknown as ContactColumn),
      title: colTitle('role', CONTACT_COLUMN_LABELS.role),
      basis: columnWidths.role, grow: 0, shrink: 0,
    },
    {
      ...(keyColumn('location', textColumn) as unknown as ContactColumn),
      title: colTitle('location', CONTACT_COLUMN_LABELS.location),
      basis: columnWidths.location, grow: 0, shrink: 0,
    },
    {
      title: colTitle('status', CONTACT_COLUMN_LABELS.status),
      basis: columnWidths.status ?? 120, grow: 0, shrink: 0,
      keepFocus: true,
      component: ({ rowData, setRowData, focus }: { rowData: ContactRow; setRowData: (r: ContactRow) => void; focus: boolean }) => {
        if (focus) {
          return (
            <select
              autoFocus
              value={rowData.status ?? ''}
              onChange={e => {
                const val = e.target.value
                setRowData({ ...rowData, status: (CONTACT_STATUS_OPTIONS.includes(val as ContactStatus) ? val as ContactStatus : null) })
              }}
              style={{ width: '100%', height: '100%', border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--foreground-primary)', cursor: 'pointer', padding: '0 8px' }}
            >
              <option value="">—</option>
              {CONTACT_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )
        }
        return (
          <div style={{ padding: '0 8px', display: 'flex', alignItems: 'center', height: '100%' }}>
            {rowData.status
              ? <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 'var(--radius-pill)', backgroundColor: CONTACT_STATUS_COLORS[rowData.status].bg, color: CONTACT_STATUS_COLORS[rowData.status].text, fontSize: 13, fontFamily: 'var(--font-captions)', fontWeight: 500, lineHeight: '20px', whiteSpace: 'nowrap' }}>{rowData.status}</span>
              : <span style={{ color: 'var(--foreground-secondary)' }}>—</span>
            }
          </div>
        )
      },
      deleteValue: ({ rowData }: { rowData: ContactRow }) => ({ ...rowData, status: null }),
      copyValue: ({ rowData }: { rowData: ContactRow }) => rowData.status ?? '',
      pasteValue: ({ rowData, value }: { rowData: ContactRow; value: string }) => ({ ...rowData, status: CONTACT_STATUS_OPTIONS.includes(value as ContactStatus) ? value as ContactStatus : null }),
    },
  ], [columnWidths, colTitle, onToggleRow])

  const handleChange = (newRows: ContactRow[], operations: Operation[]) => {
    for (const op of operations) {
      if (op.type !== 'UPDATE') continue
      for (let i = op.fromRowIndex; i < op.toRowIndex; i++) {
        const updated = newRows[i]
        const original = rows.find(r => r.id === updated.id)
        if (!original) continue
        const changes: ContactUpdate = {}
        if (updated.phone_number !== original.phone_number) changes.phone_number = updated.phone_number
        if (updated.email !== original.email) changes.email = updated.email
        if (updated.role !== original.role) changes.role = updated.role
        if (updated.location !== original.location) changes.location = updated.location
        if (updated.status !== original.status) changes.status = updated.status
        if (Object.keys(changes).length > 0) onRowChange(original.id, changes)
      }
    }
  }

  const wrapperRef = useRef<HTMLDivElement>(null)

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!(e.target as HTMLElement).closest('.dsg-cell-gutter')) return
    const wrapper = wrapperRef.current
    if (!wrapper) return
    const rowIndex = Math.floor(
      (e.clientY - wrapper.getBoundingClientRect().top + wrapper.scrollTop - 40) / 40
    )
    if (rowIndex >= 0 && rowIndex < rows.length) onEditRow(rows[rowIndex].id)
  }

  return (
    <div ref={wrapperRef} onDoubleClick={handleDoubleClick} style={{ flex: 1, overflow: 'auto' }}>
      <style>{`
        .dsg-container { font-family: var(--font-body); font-size: 13px; border: none !important; }
        .dsg-cell-header { background: var(--surface-primary) !important; font-size: 13px; font-weight: 600; color: var(--foreground-primary); font-family: var(--font-body); }
        .dsg-cell-header-container { width: 100%; height: 100%; padding: 0; display: flex; align-items: center; line-height: normal; overflow: visible; }
        .dsg-row:hover .dsg-cell { background: var(--row-hover) !important; }
        .checkbox-cell { padding: 0 !important; }
      `}</style>
      <DataSheetGrid<ContactRow>
        key={`${resizeVersion}-${sortKey}`}
        value={viewRows}
        onChange={handleChange}
        columns={columns}
        rowHeight={40}
        headerRowHeight={40}
        addRowsComponent={false}
        disableContextMenu
        lockRows
      />
    </div>
  )
}
