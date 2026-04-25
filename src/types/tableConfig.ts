import type { GenericSortSpec } from '../hooks/useTableData'

export interface TableConfig<TRow, TStatus extends string = string> {
  label: string
  // Field whose values correspond to Kanban lanes (e.g. 'project_status', 'status')
  statusField: keyof TRow
  // Ordered list — determines lane display order in Kanban view
  statusOptions: TStatus[]
  statusColors: Record<TStatus, { bg: string; text: string }>
  // Card title field (bold, shown at top of each card)
  primaryField: keyof TRow
  // Additional fields shown on card body
  cardFields: (keyof TRow)[]
  // Labels for card fields (used instead of raw field names)
  columnLabels: Record<string, string>
  defaultSorts: GenericSortSpec<TRow>[]
}
