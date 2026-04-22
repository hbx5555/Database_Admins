import { describe, it, expect } from 'vitest'
import { applyFilters, applySorts, paginateRows, applyStatusFilter } from '../src/lib/transforms'
import type { Project, ProjectStatus } from '../src/types/project'

const makeProject = (overrides: Partial<Project>): Project => ({
  id: 'test-id',
  project_name: 'Test Project',
  project_topic: null,
  project_status: 'New',
  project_start_date: null,
  project_delivery_date: null,
  project_budget: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

describe('applyFilters', () => {
  it('returns all rows when no filters', () => {
    const rows = [makeProject({ id: '1' }), makeProject({ id: '2' })]
    expect(applyFilters(rows, [])).toHaveLength(2)
  })

  it('filters by project_name case-insensitively', () => {
    const rows = [
      makeProject({ id: '1', project_name: 'Alpha' }),
      makeProject({ id: '2', project_name: 'Beta' }),
    ]
    const result = applyFilters(rows, [{ field: 'project_name', value: 'alp' }])
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })

  it('filters by project_status exact match', () => {
    const rows = [
      makeProject({ id: '1', project_status: 'New' }),
      makeProject({ id: '2', project_status: 'Done' }),
    ]
    const result = applyFilters(rows, [{ field: 'project_status', value: 'New' }])
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })
})

describe('applySorts', () => {
  it('sorts by project_name ascending', () => {
    const rows = [
      makeProject({ id: '1', project_name: 'Zebra' }),
      makeProject({ id: '2', project_name: 'Alpha' }),
    ]
    const result = applySorts(rows, [{ field: 'project_name', direction: 'asc' }])
    expect(result[0].id).toBe('2')
    expect(result[1].id).toBe('1')
  })

  it('sorts by project_name descending', () => {
    const rows = [
      makeProject({ id: '1', project_name: 'Alpha' }),
      makeProject({ id: '2', project_name: 'Zebra' }),
    ]
    const result = applySorts(rows, [{ field: 'project_name', direction: 'desc' }])
    expect(result[0].id).toBe('2')
  })

  it('returns original order when no sorts', () => {
    const rows = [makeProject({ id: '1' }), makeProject({ id: '2' })]
    expect(applySorts(rows, [])[0].id).toBe('1')
  })
})

describe('paginateRows', () => {
  it('returns first page', () => {
    const rows = Array.from({ length: 25 }, (_, i) => makeProject({ id: String(i) }))
    const result = paginateRows(rows, 1, 10)
    expect(result).toHaveLength(10)
    expect(result[0].id).toBe('0')
  })

  it('returns second page', () => {
    const rows = Array.from({ length: 25 }, (_, i) => makeProject({ id: String(i) }))
    const result = paginateRows(rows, 2, 10)
    expect(result).toHaveLength(10)
    expect(result[0].id).toBe('10')
  })

  it('returns partial last page', () => {
    const rows = Array.from({ length: 25 }, (_, i) => makeProject({ id: String(i) }))
    const result = paginateRows(rows, 3, 10)
    expect(result).toHaveLength(5)
  })
})

describe('applyStatusFilter', () => {
  it('returns empty filters when status is null and no existing filters', () => {
    expect(applyStatusFilter([], null)).toEqual([])
  })

  it('removes project_status filter when status is null', () => {
    const filters = [{ field: 'project_status' as keyof Project, value: 'New' }]
    expect(applyStatusFilter(filters, null)).toEqual([])
  })

  it('adds project_status filter when status is set', () => {
    const result = applyStatusFilter([], 'Started')
    expect(result).toEqual([{ field: 'project_status', value: 'Started' }])
  })

  it('replaces existing project_status filter when status changes', () => {
    const filters = [{ field: 'project_status' as keyof Project, value: 'New' }]
    const result = applyStatusFilter(filters, 'Done')
    expect(result).toEqual([{ field: 'project_status', value: 'Done' }])
  })

  it('preserves other filters when adding status filter', () => {
    const filters = [{ field: 'project_name' as keyof Project, value: 'test' }]
    const result = applyStatusFilter(filters, 'New')
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ field: 'project_name', value: 'test' })
    expect(result[1]).toEqual({ field: 'project_status', value: 'New' })
  })

  it('preserves other filters when clearing status filter', () => {
    const filters = [
      { field: 'project_name' as keyof Project, value: 'test' },
      { field: 'project_status' as keyof Project, value: 'New' },
    ]
    const result = applyStatusFilter(filters, null)
    expect(result).toEqual([{ field: 'project_name', value: 'test' }])
  })
})
