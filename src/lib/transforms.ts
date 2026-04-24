import type { Project, FilterSpec, SortSpec, ProjectStatus } from '../types/project'

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

export function applySearch(rows: Project[], query: string): Project[] {
  const q = query.trim().toLowerCase()
  if (!q) return rows
  return rows.filter(row =>
    row.project_name?.toLowerCase().includes(q) ||
    row.project_topic?.toLowerCase().includes(q)
  )
}

export function paginateRows(rows: Project[], page: number, pageSize: number): Project[] {
  const start = (page - 1) * pageSize
  return rows.slice(start, start + pageSize)
}

export function applyStatusFilter(filters: FilterSpec[], status: ProjectStatus | null): FilterSpec[] {
  const without = filters.filter(f => f.field !== 'project_status')
  if (status === null) return without
  return [...without, { field: 'project_status', value: status }]
}

// ── Contact transforms ────────────────────────────────────────────────────────

import type { Contact } from '../types/contact'
import type { ContactSortSpec } from '../types/contact'

export function applyContactSorts(rows: Contact[], sorts: ContactSortSpec[]): Contact[] {
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

export function applyContactSearch(rows: Contact[], query: string): Contact[] {
  const q = query.trim().toLowerCase()
  if (!q) return rows
  return rows.filter(row =>
    row.full_name?.toLowerCase().includes(q) ||
    row.email?.toLowerCase().includes(q) ||
    row.role?.toLowerCase().includes(q) ||
    row.location?.toLowerCase().includes(q) ||
    row.phone_number?.toLowerCase().includes(q)
  )
}

export function paginateContactRows(rows: Contact[], page: number, pageSize: number): Contact[] {
  const start = (page - 1) * pageSize
  return rows.slice(start, start + pageSize)
}
