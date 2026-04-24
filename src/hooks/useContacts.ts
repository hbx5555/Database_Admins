import { useState, useEffect, useCallback, useMemo } from 'react'
import { fetchContacts, createContact, updateContact, deleteContacts } from '../lib/contactsApi'
import { applyContactSorts, applyContactSearch, applyContactStatusFilter, paginateContactRows } from '../lib/transforms'
import type { Contact, ContactInsert, ContactUpdate, ContactViewConfig, ContactSortSpec, ContactStatus } from '../types/contact'
import { DEFAULT_CONTACT_VIEW_CONFIG, DEFAULT_CONTACT_PAGINATION } from '../types/contact'

interface UseContactsReturn {
  displayRows: Contact[]
  sourceRows: Contact[]
  loading: boolean
  error: string | null
  pagination: { page: number; pageSize: number; total: number }
  activeStatusFilter: ContactStatus | null
  setStatusFilter: (status: ContactStatus | null) => void
  searchQuery: string
  setSearchQuery: (q: string) => void
  sorts: ContactSortSpec[]
  setSortField: (field: keyof Contact) => void
  setPage: (page: number) => void
  refresh: () => Promise<void>
  addRow: (row: ContactInsert) => Promise<void>
  editRow: (id: string, changes: ContactUpdate) => Promise<void>
  removeRows: (ids: string[]) => Promise<void>
}

export function useContacts(): UseContactsReturn {
  const [sourceRows, setSourceRows] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewConfig, setViewConfig] = useState<ContactViewConfig>(DEFAULT_CONTACT_VIEW_CONFIG)
  const [pagination, setPagination] = useState(DEFAULT_CONTACT_PAGINATION)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeStatusFilter, setActiveStatusFilter] = useState<ContactStatus | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const rows = await fetchContacts()
      setSourceRows(rows)
      setPagination(p => ({ ...p, total: rows.length, page: 1 }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load contacts')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filteredSorted = useMemo(
    () => applyContactSearch(
      applyContactSorts(
        applyContactStatusFilter(sourceRows, activeStatusFilter),
        viewConfig.sorts
      ),
      searchQuery
    ),
    [sourceRows, viewConfig.sorts, searchQuery, activeStatusFilter]
  )

  const displayRows = useMemo(
    () => paginateContactRows(filteredSorted, pagination.page, pagination.pageSize),
    [filteredSorted, pagination.page, pagination.pageSize]
  )

  useEffect(() => {
    setPagination(p => ({ ...p, total: filteredSorted.length, page: 1 }))
  }, [filteredSorted.length])

  const setPage = useCallback((page: number) => {
    setPagination(p => ({ ...p, page }))
  }, [])

  const setStatusFilter = useCallback((status: ContactStatus | null) => {
    setActiveStatusFilter(status)
  }, [])

  const setSortField = useCallback((field: keyof Contact) => {
    setViewConfig(vc => {
      const existing = vc.sorts.find(s => s.field === field)
      const direction = existing?.direction === 'asc' ? 'desc' : 'asc'
      return { ...vc, sorts: [{ field, direction }] }
    })
  }, [])

  const addRow = useCallback(async (row: ContactInsert) => {
    const optimistic: Contact = {
      ...row,
      id: `optimistic-${Date.now()}`,
      full_name: [row.first_name, row.last_name].filter(Boolean).join(' ') || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setSourceRows(prev => [optimistic, ...prev])
    try {
      const saved = await createContact(row)
      setSourceRows(prev => prev.map(r => r.id === optimistic.id ? saved : r))
    } catch (e) {
      setSourceRows(prev => prev.filter(r => r.id !== optimistic.id))
      setError(e instanceof Error ? e.message : 'Failed to create contact')
    }
  }, [])

  const editRow = useCallback(async (id: string, changes: ContactUpdate) => {
    const previous = sourceRows.find(r => r.id === id)
    setSourceRows(prev => prev.map(r => r.id === id ? { ...r, ...changes, updated_at: new Date().toISOString() } : r))
    try {
      const saved = await updateContact(id, changes)
      setSourceRows(prev => prev.map(r => r.id === id ? saved : r))
    } catch (e) {
      if (previous) setSourceRows(prev => prev.map(r => r.id === id ? previous : r))
      setError(e instanceof Error ? e.message : 'Failed to update contact')
    }
  }, [sourceRows])

  const removeRows = useCallback(async (ids: string[]) => {
    const snapshot = sourceRows
    setSourceRows(prev => prev.filter(r => !ids.includes(r.id)))
    try {
      const realIds = ids.filter(id => !id.startsWith('optimistic-'))
      if (realIds.length > 0) await deleteContacts(realIds)
    } catch (e) {
      setSourceRows(snapshot)
      setError(e instanceof Error ? e.message : 'Failed to delete contacts')
    }
  }, [sourceRows])

  return {
    displayRows, sourceRows, loading, error, pagination,
    activeStatusFilter, setStatusFilter,
    searchQuery, setSearchQuery,
    sorts: viewConfig.sorts, setSortField,
    setPage, refresh: load,
    addRow, editRow, removeRows,
  }
}
