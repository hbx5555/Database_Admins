import type { GenericSortSpec } from '../hooks/useTableData'

// Describes the Kanban-relevant shape of any table. Used by KanbanBoard<T> to know
// which field drives lanes and what the ordered lane values are.
export interface TableConfig<TRow, TStatus extends string = string> {
  label: string
  // Field on TRow whose values correspond to Kanban lanes (e.g. 'project_status', 'status')
  statusField: keyof TRow
  // Ordered list — determines lane display order in Kanban view
  statusOptions: TStatus[]
  statusColors: Record<TStatus, { bg: string; text: string }>
  // Which field to display as the card title in Kanban view
  primaryField: keyof TRow
  defaultSorts: GenericSortSpec<TRow>[]
}
