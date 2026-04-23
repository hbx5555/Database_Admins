import { useCallback, useMemo, memo, useRef, useState, useEffect } from 'react'
import { DataSheetGrid, textColumn, keyColumn } from 'react-datasheet-grid'
import type { Column } from 'react-datasheet-grid'
import type { Project, ProjectUpdate, ProjectStatus, SortSpec } from '../../types/project'
import { COLUMN_LABELS } from '../../types/project'
import { RolePill } from '../shared/RolePill'
import { useColumnResize, MIN_WIDTH } from '../../hooks/useColumnResize'

const STATUS_OPTIONS: ProjectStatus[] = ['New', 'Started', 'Done']

// Operation is not re-exported from the public index — mirror the shape here
type Operation = {
  type: 'UPDATE' | 'DELETE' | 'CREATE'
  fromRowIndex: number
  toRowIndex: number
}

// Augments Project with transient selection so DSG re-renders cells when selection changes
type ProjectRow = Project & { _selected: boolean }

interface ResizeHandleProps {
  columnKey: string
  onFinalizeWidth: (key: string, width: number) => void
  currentWidth: number
}

const ResizeHandle = memo(function ResizeHandle({ columnKey, onFinalizeWidth, currentWidth }: ResizeHandleProps) {
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null)
  // Line is appended imperatively to document.body to escape DSG's stacking context
  const lineRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const line = document.createElement('div')
    Object.assign(line.style, {
      position: 'fixed', top: '0', left: '0',
      width: '2px', height: '100vh',
      background: 'var(--accent-primary)',
      pointerEvents: 'none', zIndex: '9999', display: 'none',
    })
    document.body.appendChild(line)
    lineRef.current = line
    return () => { document.body.removeChild(line); lineRef.current = null }
  }, [])

  return (
    <div
      onPointerDown={e => {
        e.preventDefault()
        e.stopPropagation()
        dragRef.current = { startX: e.clientX, startWidth: currentWidth }
        e.currentTarget.setPointerCapture(e.pointerId)
        if (lineRef.current) {
          lineRef.current.style.left = `${e.clientX}px`
          lineRef.current.style.display = 'block'
        }
      }}
      onPointerMove={e => {
        if (!dragRef.current || !lineRef.current) return
        const newWidth = dragRef.current.startWidth + (e.clientX - dragRef.current.startX)
        if (newWidth >= MIN_WIDTH) lineRef.current.style.left = `${e.clientX}px`
      }}
      onPointerUp={e => {
        if (!dragRef.current) return
        const newWidth = dragRef.current.startWidth + (e.clientX - dragRef.current.startX)
        dragRef.current = null
        if (lineRef.current) lineRef.current.style.display = 'none'
        onFinalizeWidth(columnKey, newWidth)
      }}
      style={{
        position: 'absolute', right: 0, top: 0,
        width: 4, height: '100%',
        cursor: 'col-resize', background: 'transparent',
        zIndex: 1, touchAction: 'none',
      }}
      onClick={e => e.stopPropagation()}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--border-color)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
    />
  )
})

interface ProjectsGridProps {
  rows: Project[]
  onRowChange: (id: string, changes: ProjectUpdate) => void
  selectedIds: Set<string>
  onToggleRow: (id: string) => void
  onEditRow: (id: string) => void
  sorts: SortSpec[]
  onSortField: (field: keyof Project) => void
}

// DSG Column<T, C, PasteValue> — C is the internal column-data shape; we use
// unknown here because keyColumn's ColumnData type is not publicly exported.
type ProjectColumn = Partial<Column<ProjectRow, unknown, string>>

export function ProjectsGrid({ rows, onRowChange, selectedIds, onToggleRow, onEditRow, sorts, onSortField }: ProjectsGridProps) {
  const { columnWidths, finalizeWidth } = useColumnResize()
  // Incrementing this forces DataSheetGrid to remount, which reinitialises
  // TanStack Virtual's measurement cache with the new column basis values.
  const [resizeVersion, setResizeVersion] = useState(0)

  // Merge selection into rowData so DSG sees a real data change and re-renders cells
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
          // DSG calls preventDefault() on mousedown inside the grid, which prevents
          // the click event from firing. Intercept here before DSG's document listener.
          e.nativeEvent.stopImmediatePropagation()
          onSortField(key as keyof Project)
        }}
        style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%', height: '100%', cursor: 'pointer' }}
      >
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingLeft: 10, paddingRight: 4 }}>
          {label}
        </span>
        {sort && (
          <span className="material-symbols-outlined" style={{ fontSize: 14, marginRight: 6, flexShrink: 0, color: 'var(--accent-primary)' }}>
            {sort.direction === 'desc' ? 'arrow_downward' : 'arrow_upward'}
          </span>
        )}
        <ResizeHandle columnKey={key} onFinalizeWidth={handleFinalizeWidth} currentWidth={columnWidths[key]} />
      </div>
    )
  }, [columnWidths, handleFinalizeWidth, sorts, onSortField])

  // keyColumn infers T[K] as string|null for nullable fields, which conflicts
  // with textColumn's string-only CellComponent. Double-cast via unknown.
  const columns: ProjectColumn[] = useMemo(() => [
    {
      basis: 48, grow: 0, shrink: 0,
      disableKeys: true,
      cellClassName: 'checkbox-cell',
      title: <div style={{ width: 48 }} />,
      component: ({ rowData }: { rowData: ProjectRow }) => (
        <div
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', cursor: 'pointer' }}
          onMouseDown={(e) => {
            // DSG calls event.preventDefault() on mousedown for any click inside the grid,
            // which prevents click events from firing. stopImmediatePropagation on the native
            // event intercepts before DSG's document-level listener fires.
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
      ...(keyColumn('project_name', textColumn) as unknown as ProjectColumn),
      title: colTitle('project_name', COLUMN_LABELS.project_name),
      basis: columnWidths.project_name, grow: 0, shrink: 0,
    },
    {
      ...(keyColumn('project_topic', textColumn) as unknown as ProjectColumn),
      title: colTitle('project_topic', COLUMN_LABELS.project_topic),
      basis: columnWidths.project_topic, grow: 0, shrink: 0,
    },
    {
      title: colTitle('project_status', COLUMN_LABELS.project_status),
      basis: columnWidths.project_status, grow: 0, shrink: 0,
      // keepFocus prevents the grid from stealing focus when the <select> opens
      keepFocus: true,
      component: ({ rowData, setRowData, focus }) => {
        if (focus) {
          return (
            <select
              autoFocus
              value={rowData.project_status ?? ''}
              onChange={e => {
                const val = e.target.value
                setRowData({
                  ...rowData,
                  project_status: (STATUS_OPTIONS.includes(val as ProjectStatus) ? val as ProjectStatus : null),
                })
              }}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                color: 'var(--foreground-primary)',
                cursor: 'pointer',
                padding: '0 8px',
              }}
            >
              <option value="">—</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )
        }
        return (
          <div style={{ padding: '0 8px', display: 'flex', alignItems: 'center', height: '100%' }}>
            <RolePill status={rowData.project_status} />
          </div>
        )
      },
      deleteValue: ({ rowData }) => ({ ...rowData, project_status: null }),
      copyValue: ({ rowData }) => rowData.project_status ?? '',
      pasteValue: ({ rowData, value }) => ({
        ...rowData,
        project_status: STATUS_OPTIONS.includes(value as ProjectStatus) ? value as ProjectStatus : null,
      }),
    },
    {
      title: colTitle('project_start_date', COLUMN_LABELS.project_start_date),
      basis: columnWidths.project_start_date, grow: 0, shrink: 0,
      keepFocus: true,
      component: ({ rowData, setRowData, focus }) => {
        if (focus) {
          return (
            <input
              autoFocus
              type="date"
              value={rowData.project_start_date ?? ''}
              onChange={e => setRowData({ ...rowData, project_start_date: e.target.value || null })}
              style={{
                width: '100%', height: '100%', border: 'none', outline: 'none',
                background: 'transparent', fontFamily: 'var(--font-body)',
                fontSize: 13, color: 'var(--foreground-primary)', padding: '0 8px',
                cursor: 'pointer',
              }}
            />
          )
        }
        return (
          <div style={{ padding: '0 8px', display: 'flex', alignItems: 'center', height: '100%',
            fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--foreground-secondary)' }}>
            {rowData.project_start_date ?? '—'}
          </div>
        )
      },
      deleteValue: ({ rowData }) => ({ ...rowData, project_start_date: null }),
      copyValue: ({ rowData }) => rowData.project_start_date ?? '',
      pasteValue: ({ rowData, value }) => ({ ...rowData, project_start_date: value || null }),
    },
    {
      title: colTitle('project_delivery_date', COLUMN_LABELS.project_delivery_date),
      basis: columnWidths.project_delivery_date, grow: 0, shrink: 0,
      keepFocus: true,
      component: ({ rowData, setRowData, focus }) => {
        if (focus) {
          return (
            <input
              autoFocus
              type="date"
              value={rowData.project_delivery_date ?? ''}
              onChange={e => setRowData({ ...rowData, project_delivery_date: e.target.value || null })}
              style={{
                width: '100%', height: '100%', border: 'none', outline: 'none',
                background: 'transparent', fontFamily: 'var(--font-body)',
                fontSize: 13, color: 'var(--foreground-primary)', padding: '0 8px',
                cursor: 'pointer',
              }}
            />
          )
        }
        return (
          <div style={{ padding: '0 8px', display: 'flex', alignItems: 'center', height: '100%',
            fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--foreground-secondary)' }}>
            {rowData.project_delivery_date ?? '—'}
          </div>
        )
      },
      deleteValue: ({ rowData }) => ({ ...rowData, project_delivery_date: null }),
      copyValue: ({ rowData }) => rowData.project_delivery_date ?? '',
      pasteValue: ({ rowData, value }) => ({ ...rowData, project_delivery_date: value || null }),
    },
    {
      title: colTitle('project_budget', COLUMN_LABELS.project_budget),
      basis: columnWidths.project_budget, grow: 0, shrink: 0,
      component: ({ rowData, setRowData, focus }) => {
        if (focus) {
          return (
            <input
              autoFocus
              type="number"
              min="0"
              step="0.01"
              value={rowData.project_budget ?? ''}
              onChange={e => {
                const val = e.target.value
                setRowData({
                  ...rowData,
                  project_budget: val !== '' ? parseFloat(val) : null,
                })
              }}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                outline: 'none',
                background: 'transparent',
                textAlign: 'right',
                fontFamily: 'var(--font-captions)',
                fontSize: 13,
                color: 'var(--foreground-primary)',
                padding: '0 8px',
              }}
            />
          )
        }
        return (
          <div style={{
            padding: '0 8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            width: '100%',
            height: '100%',
            fontFamily: 'var(--font-captions)',
            fontSize: 13,
            color: 'var(--foreground-secondary)',
          }}>
            {rowData.project_budget != null ? rowData.project_budget.toLocaleString() : '—'}
          </div>
        )
      },
      deleteValue: ({ rowData }) => ({ ...rowData, project_budget: null }),
      copyValue: ({ rowData }) => rowData.project_budget?.toString() ?? '',
      pasteValue: ({ rowData, value }) => ({
        ...rowData,
        project_budget: value !== '' ? parseFloat(value) : null,
      }),
    },
  ], [columnWidths, colTitle, onToggleRow])

  const handleChange = (newRows: ProjectRow[], operations: Operation[]) => {
    for (const op of operations) {
      if (op.type !== 'UPDATE') continue
      for (let i = op.fromRowIndex; i < op.toRowIndex; i++) {
        const updated = newRows[i]
        const original = rows.find(r => r.id === updated.id)
        if (!original) continue
        const changes: ProjectUpdate = {}
        if (updated.project_name !== original.project_name) changes.project_name = updated.project_name
        if (updated.project_topic !== original.project_topic) changes.project_topic = updated.project_topic
        if (updated.project_status !== original.project_status) changes.project_status = updated.project_status
        if (updated.project_start_date !== original.project_start_date) changes.project_start_date = updated.project_start_date
        if (updated.project_delivery_date !== original.project_delivery_date) changes.project_delivery_date = updated.project_delivery_date
        if (updated.project_budget !== original.project_budget) changes.project_budget = updated.project_budget
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
      <DataSheetGrid<ProjectRow>
        key={resizeVersion}
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
