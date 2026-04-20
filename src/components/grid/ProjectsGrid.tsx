import { DataSheetGrid, textColumn, keyColumn } from 'react-datasheet-grid'
import type { Column } from 'react-datasheet-grid'
import type { Project, ProjectUpdate, ProjectStatus } from '../../types/project'
import { COLUMN_LABELS } from '../../types/project'
import { RolePill } from '../shared/RolePill'

const STATUS_OPTIONS: ProjectStatus[] = ['New', 'Started', 'Done']

// Operation is not re-exported from the public index — mirror the shape here
type Operation = {
  type: 'UPDATE' | 'DELETE' | 'CREATE'
  fromRowIndex: number
  toRowIndex: number
}

interface ProjectsGridProps {
  rows: Project[]
  onRowChange: (id: string, changes: ProjectUpdate) => void
}

// DSG Column<T, C, PasteValue> — C is the internal column-data shape; we use
// unknown here because keyColumn's ColumnData type is not publicly exported.
type ProjectColumn = Partial<Column<Project, unknown, string>>

export function ProjectsGrid({ rows, onRowChange }: ProjectsGridProps) {
  // keyColumn infers T[K] as string|null for nullable fields, which conflicts
  // with textColumn's string-only CellComponent. Double-cast via unknown.
  const columns: ProjectColumn[] = [
    {
      ...(keyColumn('project_name', textColumn) as unknown as ProjectColumn),
      title: COLUMN_LABELS.project_name,
      minWidth: 200,
    },
    {
      ...(keyColumn('project_topic', textColumn) as unknown as ProjectColumn),
      title: COLUMN_LABELS.project_topic,
      minWidth: 160,
    },
    {
      title: COLUMN_LABELS.project_status,
      minWidth: 120,
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
      ...(keyColumn('project_start_date', textColumn) as unknown as ProjectColumn),
      title: COLUMN_LABELS.project_start_date,
      minWidth: 120,
    },
    {
      ...(keyColumn('project_delivery_date', textColumn) as unknown as ProjectColumn),
      title: COLUMN_LABELS.project_delivery_date,
      minWidth: 130,
    },
    {
      title: COLUMN_LABELS.project_budget,
      minWidth: 110,
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
  ]

  const handleChange = (newRows: Project[], operations: Operation[]) => {
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

  return (
    <div style={{ flex: 1, overflow: 'auto' }}>
      <style>{`
        .dsg-container { font-family: var(--font-body); font-size: 13px; border: none !important; }
        .dsg-header-cell { background: var(--surface-primary) !important; font-size: 12px; font-weight: 600; color: var(--foreground-primary); font-family: var(--font-body); }
        .dsg-row:hover .dsg-cell { background: var(--row-hover) !important; }
      `}</style>
      <DataSheetGrid<Project>
        value={rows}
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
