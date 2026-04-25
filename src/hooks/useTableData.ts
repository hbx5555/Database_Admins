import { useState, useEffect, useCallback, useMemo, useRef } from 'react'

export type GenericSortSpec<T> = { field: keyof T; direction: 'asc' | 'desc' }

interface TableDataConfig<
  T extends { id: string; created_at: string; updated_at: string },
  TInsert,
  TUpdate,
  TStatus extends string = string,
> {
  fetch: () => Promise<T[]>
  create: (data: TInsert) => Promise<T>
  update: (id: string, changes: TUpdate) => Promise<T>
  deleteMany: (ids: string[]) => Promise<void>
  filterByStatus: (rows: T[], status: TStatus | null) => T[]
  sortRows: (rows: T[], sorts: GenericSortSpec<T>[]) => T[]
  searchRows: (rows: T[], query: string) => T[]
  paginate: (rows: T[], page: number, pageSize: number) => T[]
  buildOptimisticRow: (data: TInsert) => T
  pageSize?: number
}

export interface TableDataReturn<T, TInsert, TUpdate, TStatus extends string = string> {
  sourceRows: T[]
  filteredRows: T[]  // post-filter+sort+search, pre-pagination — used by KanbanBoard
  displayRows: T[]   // paginated filteredRows — used by Grid
  loading: boolean
  error: string | null
  pagination: { page: number; pageSize: number; total: number }
  activeStatusFilter: TStatus | null
  setStatusFilter: (status: TStatus | null) => void
  searchQuery: string
  setSearchQuery: (q: string) => void
  sorts: GenericSortSpec<T>[]
  setSortField: (field: keyof T) => void
  setPage: (page: number) => void
  viewMode: 'grid' | 'kanban'
  setViewMode: (mode: 'grid' | 'kanban') => void
  refresh: () => Promise<void>
  addRow: (data: TInsert) => Promise<void>
  editRow: (id: string, changes: TUpdate) => Promise<void>
  removeRows: (ids: string[]) => Promise<void>
}

export function useTableData<
  T extends { id: string; created_at: string; updated_at: string },
  TInsert,
  TUpdate,
  TStatus extends string = string,
>(config: TableDataConfig<T, TInsert, TUpdate, TStatus>): TableDataReturn<T, TInsert, TUpdate, TStatus> {
  const PAGE_SIZE = config.pageSize ?? 10
  // Store config in a ref so the stable function callbacks always see the latest version
  // without being listed as deps. All config entries are module-level function imports
  // (stable references) so in practice cfg.current never changes after mount.
  const cfg = useRef(config)
  cfg.current = config

  const [sourceRows, setSourceRows] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sorts, setSorts] = useState<GenericSortSpec<T>[]>([])
  const [pagination, setPagination] = useState({ page: 1, pageSize: PAGE_SIZE, total: 0 })
  const [searchQuery, setSearchQuery] = useState('')
  const [activeStatusFilter, setActiveStatusFilter] = useState<TStatus | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'kanban'>('grid')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const rows = await cfg.current.fetch()
      setSourceRows(rows)
      setPagination(p => ({ ...p, total: rows.length, page: 1 }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filteredSorted = useMemo(
    () => cfg.current.searchRows(
      cfg.current.sortRows(
        cfg.current.filterByStatus(sourceRows, activeStatusFilter),
        sorts
      ),
      searchQuery
    ),
    [sourceRows, sorts, searchQuery, activeStatusFilter]
  )

  const displayRows = useMemo(
    () => cfg.current.paginate(filteredSorted, pagination.page, pagination.pageSize),
    [filteredSorted, pagination.page, pagination.pageSize]
  )

  useEffect(() => {
    setPagination(p => ({ ...p, total: filteredSorted.length, page: 1 }))
  }, [filteredSorted.length])

  const setPage = useCallback((page: number) => {
    setPagination(p => ({ ...p, page }))
  }, [])

  const setStatusFilter = useCallback((status: TStatus | null) => {
    setActiveStatusFilter(status)
  }, [])

  const setSortField = useCallback((field: keyof T) => {
    setSorts(prev => {
      const existing = prev.find(s => s.field === field)
      const direction = existing?.direction === 'asc' ? 'desc' : 'asc'
      return [{ field, direction }]
    })
  }, [])

  const addRow = useCallback(async (data: TInsert) => {
    const optimistic = cfg.current.buildOptimisticRow(data)
    setSourceRows(prev => [optimistic, ...prev])
    try {
      const saved = await cfg.current.create(data)
      setSourceRows(prev => prev.map(r => r.id === optimistic.id ? saved : r))
    } catch (e) {
      setSourceRows(prev => prev.filter(r => r.id !== optimistic.id))
      setError(e instanceof Error ? e.message : 'Failed to create record')
    }
  }, [])

  const editRow = useCallback(async (id: string, changes: TUpdate) => {
    const previous = sourceRows.find(r => r.id === id)
    setSourceRows(prev => prev.map(r =>
      r.id === id ? { ...r, ...changes, updated_at: new Date().toISOString() } : r
    ))
    try {
      const saved = await cfg.current.update(id, changes)
      setSourceRows(prev => prev.map(r => r.id === id ? saved : r))
    } catch (e) {
      if (previous) setSourceRows(prev => prev.map(r => r.id === id ? previous : r))
      setError(e instanceof Error ? e.message : 'Failed to update record')
    }
  }, [sourceRows])

  const removeRows = useCallback(async (ids: string[]) => {
    const snapshot = sourceRows
    setSourceRows(prev => prev.filter(r => !ids.includes(r.id)))
    try {
      const realIds = ids.filter(id => !id.startsWith('optimistic-'))
      if (realIds.length > 0) await cfg.current.deleteMany(realIds)
    } catch (e) {
      setSourceRows(snapshot)
      setError(e instanceof Error ? e.message : 'Failed to delete records')
    }
  }, [sourceRows])

  return {
    sourceRows, filteredRows: filteredSorted, displayRows, loading, error, pagination,
    activeStatusFilter, setStatusFilter,
    searchQuery, setSearchQuery,
    sorts, setSortField,
    viewMode, setViewMode,
    setPage, refresh: load,
    addRow, editRow, removeRows,
  }
}
