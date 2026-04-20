import type { Project, FilterSpec, SortSpec } from '../types/project'

export function applyFilters(rows: Project[], filters: FilterSpec[]): Project[] {
  if (filters.length === 0) return rows
  return rows.filter(row =>
    filters.every(f => {
      const value = row[f.field]
      if (value === null || value === undefined) return false
      return String(value).toLowerCase().includes(f.value.toLowerCase())
    })
  )
}

export function applySorts(rows: Project[], sorts: SortSpec[]): Project[] {
  if (sorts.length === 0) return rows
  return [...rows].sort((a, b) => {
    for (const sort of sorts) {
      const aVal = a[sort.field] ?? ''
      const bVal = b[sort.field] ?? ''
      const cmp = String(aVal).localeCompare(String(bVal))
      if (cmp !== 0) return sort.direction === 'asc' ? cmp : -cmp
    }
    return 0
  })
}

export function paginateRows(rows: Project[], page: number, pageSize: number): Project[] {
  const start = (page - 1) * pageSize
  return rows.slice(start, start + pageSize)
}
