import { useState, useEffect, useCallback, useMemo } from 'react'
import { fetchProjects, createProject, updateProject, deleteProject, deleteProjects } from '../lib/projectsApi'
import { applyFilters, applySorts, applySearch, paginateRows, applyStatusFilter } from '../lib/transforms'
import type { Project, ProjectInsert, ProjectUpdate, ViewConfig, PaginationState, ProjectStatus, SortSpec } from '../types/project'
import { DEFAULT_VIEW_CONFIG, DEFAULT_PAGINATION } from '../types/project'

interface UseProjectsReturn {
  displayRows: Project[]
  sourceRows: Project[]
  loading: boolean
  error: string | null
  viewConfig: ViewConfig
  pagination: PaginationState
  selectedRowId: string | null
  setSelectedRowId: (id: string | null) => void
  setViewConfig: (config: ViewConfig) => void
  setPage: (page: number) => void
  activeStatusFilter: ProjectStatus | null
  setStatusFilter: (status: ProjectStatus | null) => void
  searchQuery: string
  setSearchQuery: (q: string) => void
  sorts: SortSpec[]
  setSortField: (field: keyof Project) => void
  refresh: () => Promise<void>
  addRow: (row: ProjectInsert) => Promise<void>
  editRow: (id: string, changes: ProjectUpdate) => Promise<void>
  removeRow: (id: string) => Promise<void>
  removeRows: (ids: string[]) => Promise<void>
}

export function useProjects(): UseProjectsReturn {
  const [sourceRows, setSourceRows] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewConfig, setViewConfig] = useState<ViewConfig>(DEFAULT_VIEW_CONFIG)
  const [pagination, setPagination] = useState<PaginationState>(DEFAULT_PAGINATION)
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null)
  const [activeStatusFilter, setActiveStatusFilter] = useState<ProjectStatus | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const rows = await fetchProjects()
      setSourceRows(rows)
      setPagination(p => ({ ...p, total: rows.length, page: 1 }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }, [])

  // load() is the intentional trigger for initial data fetch — external-system sync.
  useEffect(() => {
    load() // eslint-disable-line react-hooks/set-state-in-effect
  }, [load])

  const filteredSorted = useMemo(
    () => applySearch(applySorts(applyFilters(sourceRows, viewConfig.filters), viewConfig.sorts), searchQuery),
    [sourceRows, viewConfig.filters, viewConfig.sorts, searchQuery]
  )

  const displayRows = useMemo(
    () => paginateRows(filteredSorted, pagination.page, pagination.pageSize),
    [filteredSorted, pagination.page, pagination.pageSize]
  )

  // Resetting page to 1 when the filtered result set changes is derived state management.
  // No cleaner pattern exists here without a reducer or context — the effect is intentional.
  useEffect(() => {
    setPagination(p => ({ ...p, total: filteredSorted.length, page: 1 })) // eslint-disable-line react-hooks/set-state-in-effect
  }, [filteredSorted.length])

  const setPage = useCallback((page: number) => {
    setPagination(p => ({ ...p, page }))
  }, [])

  const setSortField = useCallback((field: keyof Project) => {
    setViewConfig(vc => {
      const existing = vc.sorts.find(s => s.field === field)
      let newSorts: SortSpec[]
      if (!existing) newSorts = [{ field, direction: 'asc' }]
      else if (existing.direction === 'asc') newSorts = [{ field, direction: 'desc' }]
      else newSorts = []
      return { ...vc, sorts: newSorts }
    })
  }, [])

  const setStatusFilter = useCallback((status: ProjectStatus | null) => {
    setActiveStatusFilter(status)
    setViewConfig(vc => ({ ...vc, filters: applyStatusFilter(vc.filters, status) }))
  }, [])

  const addRow = useCallback(async (row: ProjectInsert) => {
    const optimistic: Project = {
      ...row,
      id: `optimistic-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setSourceRows(prev => [optimistic, ...prev])
    try {
      const saved = await createProject(row)
      setSourceRows(prev => prev.map(r => r.id === optimistic.id ? saved : r))
    } catch (e) {
      setSourceRows(prev => prev.filter(r => r.id !== optimistic.id))
      setError(e instanceof Error ? e.message : 'Failed to create project')
    }
  }, [])

  const editRow = useCallback(async (id: string, changes: ProjectUpdate) => {
    // sourceRows captured at call time to snapshot `previous` for rollback.
    // sourceRows is intentionally in deps so the snapshot is always current;
    // the callback is stable enough for grid cell editors via useMemo on the consumer side.
    const previous = sourceRows.find(r => r.id === id)
    setSourceRows(prev => prev.map(r => r.id === id ? { ...r, ...changes, updated_at: new Date().toISOString() } : r))
    try {
      const saved = await updateProject(id, changes)
      setSourceRows(prev => prev.map(r => r.id === id ? saved : r))
    } catch (e) {
      if (previous) setSourceRows(prev => prev.map(r => r.id === id ? previous : r))
      setError(e instanceof Error ? e.message : 'Failed to update project')
    }
  }, [sourceRows])

  const removeRow = useCallback(async (id: string) => {
    const snapshot = sourceRows
    setSourceRows(prev => prev.filter(r => r.id !== id))
    try {
      await deleteProject(id)
    } catch (e) {
      setSourceRows(snapshot)
      setError(e instanceof Error ? e.message : 'Failed to delete project')
    }
  }, [sourceRows])

  const removeRows = useCallback(async (ids: string[]) => {
    const snapshot = sourceRows
    setSourceRows(prev => prev.filter(r => !ids.includes(r.id)))
    try {
      // Optimistic rows (not yet saved to Supabase) have no real ID to delete
      const realIds = ids.filter(id => !id.startsWith('optimistic-'))
      if (realIds.length > 0) await deleteProjects(realIds)
    } catch (e) {
      setSourceRows(snapshot)
      setError(e instanceof Error ? e.message : 'Failed to delete projects')
    }
  }, [sourceRows])

  return {
    displayRows,
    sourceRows,
    loading,
    error,
    viewConfig,
    pagination,
    selectedRowId,
    setSelectedRowId,
    setViewConfig,
    setPage,
    activeStatusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    sorts: viewConfig.sorts,
    setSortField,
    refresh: load,
    addRow,
    editRow,
    removeRow,
    removeRows,
  }
}
