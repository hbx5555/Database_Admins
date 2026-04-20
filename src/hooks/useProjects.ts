import { useState, useEffect, useCallback, useMemo } from 'react'
import { fetchProjects, createProject, updateProject, deleteProject } from '../lib/projectsApi'
import { applyFilters, applySorts, paginateRows } from '../lib/transforms'
import type { Project, ProjectInsert, ProjectUpdate, ViewConfig, PaginationState } from '../types/project'
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
  refresh: () => Promise<void>
  addRow: (row: ProjectInsert) => Promise<void>
  editRow: (id: string, changes: ProjectUpdate) => Promise<void>
  removeRow: (id: string) => Promise<void>
}

export function useProjects(): UseProjectsReturn {
  const [sourceRows, setSourceRows] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewConfig, setViewConfig] = useState<ViewConfig>(DEFAULT_VIEW_CONFIG)
  const [pagination, setPagination] = useState<PaginationState>(DEFAULT_PAGINATION)
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null)

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
    () => applySorts(applyFilters(sourceRows, viewConfig.filters), viewConfig.sorts),
    [sourceRows, viewConfig.filters, viewConfig.sorts]
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
    // sourceRows captured at call time to snapshot `previous` for rollback — same pattern as editRow.
    const previous = sourceRows.find(r => r.id === id)
    setSourceRows(prev => prev.filter(r => r.id !== id))
    try {
      await deleteProject(id)
    } catch (e) {
      if (previous) setSourceRows(prev => [previous, ...prev])
      setError(e instanceof Error ? e.message : 'Failed to delete project')
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
    refresh: load,
    addRow,
    editRow,
    removeRow,
  }
}
