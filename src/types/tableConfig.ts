import type { GenericSortSpec } from '../hooks/useTableData'

export interface TableConfig<TRow, TStatus extends string = string> {
  label: string
  statusField: keyof TRow
  statusOptions: TStatus[]
  statusColors: Record<TStatus, { bg: string; text: string }>
  primaryField: keyof TRow
  cardFields: (keyof TRow)[]
  columnLabels: Record<string, string>
  defaultSorts: GenericSortSpec<TRow>[]
  // Optional per-field display formatters for Kanban card body fields.
  // Key is the field name as a string; value transforms the raw value to a display string.
  cardFieldFormatters?: Record<string, (val: unknown) => string>
}
