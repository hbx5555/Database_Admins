import { useCallback, useMemo, useRef, useState } from 'react'
import { DataSheetGrid, textColumn, keyColumn } from 'react-datasheet-grid'
import type { Column } from 'react-datasheet-grid'
import type { Deal, DealUpdate, DealStatus } from '../../types/deal'
import type { Contact } from '../../types/contact'
import { DEAL_COLUMN_LABELS, DEAL_STATUS_OPTIONS, DEAL_STATUS_COLORS } from '../../types/deal'
import { useColumnResize, DEAL_COLUMN_LS_KEY, DEAL_DEFAULT_WIDTHS } from '../../hooks/useColumnResize'
import { ResizeHandle } from './ResizeHandle'
import type { GenericSortSpec } from '../../hooks/useTableData'

type Operation = { type: 'UPDATE' | 'DELETE' | 'CREATE'; fromRowIndex: number; toRowIndex: number }
type DealRow = Deal & { _selected: boolean }
type DealColumn = Partial<Column<DealRow, unknown, string>>

interface DealsGridProps {
  rows: Deal[]
  onRowChange: (id: string, changes: DealUpdate) => void
  selectedIds: Set<string>
  onToggleRow: (id: string) => void
  onEditRow: (id: string) => void
  sorts: GenericSortSpec<Deal>[]
  onSortField: (field: keyof Deal) => void
  onUploadProposal: (id: string, file: File) => Promise<void>
  onViewContact: (contact: Contact) => void
}

export function DealsGrid({
  rows, onRowChange, selectedIds, onToggleRow, onEditRow, sorts, onSortField, onUploadProposal, onViewContact,
}: DealsGridProps) {
  const { columnWidths, finalizeWidth } = useColumnResize(DEAL_COLUMN_LS_KEY, DEAL_DEFAULT_WIDTHS)
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
        onMouseDown={e => { e.nativeEvent.stopImmediatePropagation(); onSortField(key as keyof Deal) }}
        style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%', height: '100%', cursor: 'pointer' }}
      >
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingLeft: 10, paddingRight: 4 }}>
          {label}
        </span>
        <span className="material-symbols-outlined" style={{ fontSize: 36, marginRight: 4, flexShrink: 0, color: 'var(--accent-primary)', opacity: sort ? 1 : 0.3 }}>
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

  const columns: DealColumn[] = useMemo(() => [
    {
      basis: 48, grow: 0, shrink: 0,
      disableKeys: true,
      cellClassName: 'checkbox-cell',
      title: <div style={{ width: 48 }} />,
      component: ({ rowData }: { rowData: DealRow }) => (
        <div
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', cursor: 'pointer' }}
          onMouseDown={e => { e.nativeEvent.stopImmediatePropagation(); onToggleRow(rowData.id) }}
        >
          <input type="checkbox" checked={rowData._selected} readOnly
            style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--accent-primary)', pointerEvents: 'none' }} />
        </div>
      ),
    },
    {
      basis: columnWidths.contact, grow: 0, shrink: 0,
      disableKeys: true,
      // virtual join column — no sort key, so colTitle is not used
      title: (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%', height: '100%' }}>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingLeft: 10, paddingRight: 4 }}>
            Contact
          </span>
          <ResizeHandle columnKey="contact" onFinalizeWidth={handleFinalizeWidth} currentWidth={columnWidths.contact} />
        </div>
      ),
      component: ({ rowData }: { rowData: DealRow }) => {
        if (!rowData.contacts) {
          return (
            <div style={{ padding: '0 8px', display: 'flex', alignItems: 'center', height: '100%', color: 'var(--foreground-secondary)', fontSize: 13, fontFamily: 'var(--font-body)' }}>
              —
            </div>
          )
        }
        const joinedName = [rowData.contacts.first_name, rowData.contacts.last_name].filter(Boolean).join(' ')
        const displayName = rowData.contacts.full_name ?? (joinedName || '—')
        return (
          <div style={{ padding: '0 8px', display: 'flex', alignItems: 'center', height: '100%' }}>
            <button
              onMouseDown={e => e.nativeEvent.stopImmediatePropagation()}
              onClick={e => { e.stopPropagation(); onViewContact(rowData.contacts!) }}
              style={{ border: 'none', background: 'transparent', color: 'var(--accent-primary)', fontSize: 13, fontFamily: 'var(--font-body)', cursor: 'pointer', padding: 0, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}
            >
              {displayName}
            </button>
          </div>
        )
      },
      copyValue: ({ rowData }: { rowData: DealRow }) => {
        if (!rowData.contacts) return ''
        const { full_name, first_name, last_name } = rowData.contacts
        return full_name ?? [first_name, last_name].filter(Boolean).join(' ')
      },
    },
    {
      ...(keyColumn('deal_name', textColumn) as unknown as DealColumn),
      title: colTitle('deal_name', DEAL_COLUMN_LABELS.deal_name),
      basis: columnWidths.deal_name, grow: 0, shrink: 0,
    },
    {
      ...(keyColumn('deal_description', textColumn) as unknown as DealColumn),
      title: colTitle('deal_description', DEAL_COLUMN_LABELS.deal_description),
      basis: columnWidths.deal_description, grow: 0, shrink: 0,
    },
    {
      title: colTitle('last_call_datetime', DEAL_COLUMN_LABELS.last_call_datetime),
      basis: columnWidths.last_call_datetime, grow: 0, shrink: 0,
      disableKeys: true,
      component: ({ rowData }: { rowData: DealRow }) => (
        <div style={{ ...inp(true), display: 'flex', alignItems: 'center' }}>
          {rowData.last_call_datetime
            ? new Date(rowData.last_call_datetime).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
            : <span style={{ color: 'var(--foreground-secondary)' }}>—</span>}
        </div>
      ),
      copyValue: ({ rowData }: { rowData: DealRow }) => rowData.last_call_datetime ?? '',
    },
    {
      title: colTitle('proposal_filename', DEAL_COLUMN_LABELS.proposal_filename),
      basis: columnWidths.proposal_filename, grow: 0, shrink: 0,
      disableKeys: true,
      component: ({ rowData }: { rowData: DealRow }) => {
        const isOptimistic = rowData.id.startsWith('optimistic-')
        if (rowData.proposal_filename && rowData.proposal_url) {
          return (
            <div style={{ padding: '0 8px', display: 'flex', alignItems: 'center', height: '100%' }}>
              <a
                href={rowData.proposal_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                style={{ fontSize: 12, color: 'var(--accent-primary)', textDecoration: 'underline', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
              >
                {rowData.proposal_filename}
              </a>
            </div>
          )
        }
        return (
          <div style={{ padding: '0 8px', display: 'flex', alignItems: 'center', height: '100%' }}>
            {isOptimistic ? (
              <span style={{ fontSize: 11, color: 'var(--foreground-secondary)', fontFamily: 'var(--font-body)' }}>Save first</span>
            ) : (
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}
                onMouseDown={e => e.nativeEvent.stopImmediatePropagation()}>
                <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--foreground-secondary)' }}>upload_file</span>
                <span style={{ fontSize: 12, color: 'var(--foreground-secondary)', fontFamily: 'var(--font-body)' }}>Upload</span>
                <input
                  type="file"
                  style={{ display: 'none' }}
                  onChange={async e => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    await onUploadProposal(rowData.id, file)
                    e.target.value = ''
                  }}
                />
              </label>
            )}
          </div>
        )
      },
    },
    {
      title: colTitle('status', DEAL_COLUMN_LABELS.status),
      basis: columnWidths.status ?? 130, grow: 0, shrink: 0,
      keepFocus: true,
      component: ({ rowData, setRowData, focus }: { rowData: DealRow; setRowData: (r: DealRow) => void; focus: boolean }) => {
        if (focus) {
          return (
            <select
              autoFocus
              value={rowData.status ?? ''}
              onChange={e => {
                const val = e.target.value
                setRowData({ ...rowData, status: DEAL_STATUS_OPTIONS.includes(val as DealStatus) ? val as DealStatus : null })
              }}
              style={{ width: '100%', height: '100%', border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--foreground-primary)', cursor: 'pointer', padding: '0 8px' }}
            >
              <option value="">—</option>
              {DEAL_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )
        }
        return (
          <div style={{ padding: '0 8px', display: 'flex', alignItems: 'center', height: '100%' }}>
            {rowData.status
              ? <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 'var(--radius-pill)', backgroundColor: DEAL_STATUS_COLORS[rowData.status].bg, color: DEAL_STATUS_COLORS[rowData.status].text, fontSize: 12, fontFamily: 'var(--font-captions)', fontWeight: 500, lineHeight: '20px', whiteSpace: 'nowrap' }}>{rowData.status}</span>
              : <span style={{ color: 'var(--foreground-secondary)' }}>—</span>}
          </div>
        )
      },
      deleteValue: ({ rowData }: { rowData: DealRow }) => ({ ...rowData, status: null }),
      copyValue: ({ rowData }: { rowData: DealRow }) => rowData.status ?? '',
      pasteValue: ({ rowData, value }: { rowData: DealRow; value: string }) => ({
        ...rowData, status: DEAL_STATUS_OPTIONS.includes(value as DealStatus) ? value as DealStatus : null,
      }),
    },
  ], [columnWidths, colTitle, onToggleRow, onUploadProposal, onViewContact])

  const handleChange = (newRows: DealRow[], operations: Operation[]) => {
    for (const op of operations) {
      if (op.type !== 'UPDATE') continue
      for (let i = op.fromRowIndex; i < op.toRowIndex; i++) {
        const updated = newRows[i]
        const original = rows.find(r => r.id === updated.id)
        if (!original) continue
        const changes: DealUpdate = {}
        if (updated.deal_name !== original.deal_name) changes.deal_name = updated.deal_name
        if (updated.deal_description !== original.deal_description) changes.deal_description = updated.deal_description
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
        .dsg-cell-header { background: var(--surface-primary) !important; font-size: 12px; font-weight: 600; color: var(--foreground-primary); font-family: var(--font-body); }
        .dsg-cell-header-container { width: 100%; height: 100%; padding: 0; display: flex; align-items: center; line-height: normal; overflow: visible; }
        .dsg-row:hover .dsg-cell { background: var(--row-hover) !important; }
        .checkbox-cell { padding: 0 !important; }
      `}</style>
      <DataSheetGrid<DealRow>
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
