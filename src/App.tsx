import { useState, useEffect, useCallback } from 'react'
import { useProjects } from './hooks/useProjects'
import { useContacts } from './hooks/useContacts'
import { useDeals } from './hooks/useDeals'
import { IconSidebar, type AppView } from './components/layout/IconSidebar'
import { SubItemsPanel } from './components/layout/SubItemsPanel'
import { MainContent } from './components/layout/MainContent'
import { GridToolbar } from './components/grid/GridToolbar'
import { GridStatusBar } from './components/grid/GridStatusBar'
import { ProjectsGrid } from './components/grid/ProjectsGrid'
import { ContactsGrid } from './components/grid/ContactsGrid'
import { DealsGrid } from './components/grid/DealsGrid'
import { KanbanBoard } from './components/grid/KanbanBoard'
import { RecordEditorModal } from './components/grid/RecordEditorModal'
import { ContactEditorModal } from './components/grid/ContactEditorModal'
import { DealEditorModal } from './components/grid/DealEditorModal'
import { PROJECTS_CONFIG, CONTACTS_CONFIG, DEALS_CONFIG } from './config/tables'
import { uploadDocument } from './lib/storageApi'
import { LoadingState } from './components/shared/LoadingState'
import { ErrorState } from './components/shared/ErrorState'
import { EmptyState } from './components/shared/EmptyState'
import type { ProjectInsert, Project } from './types/project'
import type { Contact, ContactInsert } from './types/contact'
import type { Deal, DealInsert } from './types/deal'

const NEW_PROJECT_DEFAULTS: ProjectInsert = {
  project_name: 'New Project',
  project_topic: null,
  project_status: 'New',
  project_start_date: null,
  project_delivery_date: null,
  project_budget: null,
}

const NEW_CONTACT_DEFAULTS: ContactInsert = {
  first_name: 'New',
  last_name: 'Contact',
  phone_number: null,
  email: null,
  role: null,
  location: null,
  status: null,
}

const NEW_DEAL_DEFAULTS: DealInsert = {
  deal_name: 'New Deal',
  deal_description: null,
  last_call_content: null,
  last_call_datetime: null,
  proposal_url: null,
  proposal_filename: null,
  status: 'New',
}

export default function App() {
  const [activeView, setActiveView] = useState<AppView>('deals')
  const [panelOpen, setPanelOpen] = useState(true)
  const [dealUploadError, setDealUploadError] = useState<string | null>(null)

  // ── Projects ─────────────────────────────────────────────────────────────
  const {
    displayRows: projectRows,
    filteredRows: projectFilteredRows,
    sourceRows: projectSourceRows,
    loading: projectsLoading,
    error: projectsError,
    pagination: projectsPagination,
    refresh: refreshProjects,
    setPage: setProjectsPage,
    editRow: editProject,
    addRow: addProject,
    removeRows: removeProjects,
    activeStatusFilter,
    setStatusFilter,
    searchQuery: projectSearch,
    setSearchQuery: setProjectSearch,
    sorts: projectSorts,
    setSortField: setProjectSort,
    viewMode: projectViewMode,
    setViewMode: setProjectViewMode,
  } = useProjects()

  const [projectSelectedIds, setProjectSelectedIds] = useState<Set<string>>(new Set())
  const [editingProject, setEditingProject] = useState<Project | 'new' | null>(null)

  const toggleProjectRow = useCallback((id: string) => setProjectSelectedIds(prev => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id); else next.add(id)
    return next
  }), [])
  const selectAllProjects = useCallback(() => setProjectSelectedIds(new Set(projectRows.map(r => r.id))), [projectRows])
  const clearProjectSelection = useCallback(() => setProjectSelectedIds(new Set()), [])
  const deleteSelectedProjects = useCallback(() => {
    if (projectSelectedIds.size === 0) return
    clearProjectSelection()
    removeProjects([...projectSelectedIds]).catch(() => {})
  }, [projectSelectedIds, clearProjectSelection, removeProjects])

  useEffect(() => { setProjectSelectedIds(new Set()) }, [projectRows])

  const handleEditProject = useCallback((id: string) => {
    const row = projectRows.find(r => r.id === id)
    if (row) setEditingProject(row)
  }, [projectRows])

  const handleProjectFabClick = useCallback(() => {
    if (projectSelectedIds.size === 0) {
      setEditingProject('new')
    } else {
      const row = projectRows.find(r => r.id === [...projectSelectedIds][0])
      if (row) setEditingProject(row)
    }
  }, [projectSelectedIds, projectRows])

  // ── Contacts ─────────────────────────────────────────────────────────────
  const {
    displayRows: contactRows,
    filteredRows: contactFilteredRows,
    sourceRows: contactSourceRows,
    loading: contactsLoading,
    error: contactsError,
    pagination: contactsPagination,
    refresh: refreshContacts,
    setPage: setContactsPage,
    editRow: editContact,
    addRow: addContact,
    removeRows: removeContacts,
    searchQuery: contactSearch,
    setSearchQuery: setContactSearch,
    sorts: contactSorts,
    setSortField: setContactSort,
    activeStatusFilter: activeContactStatusFilter,
    setStatusFilter: setContactStatusFilter,
    viewMode: contactViewMode,
    setViewMode: setContactViewMode,
  } = useContacts()

  const [contactSelectedIds, setContactSelectedIds] = useState<Set<string>>(new Set())
  const [editingContact, setEditingContact] = useState<Contact | 'new' | null>(null)

  const toggleContactRow = useCallback((id: string) => setContactSelectedIds(prev => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id); else next.add(id)
    return next
  }), [])
  const selectAllContacts = useCallback(() => setContactSelectedIds(new Set(contactRows.map(r => r.id))), [contactRows])
  const clearContactSelection = useCallback(() => setContactSelectedIds(new Set()), [])
  const deleteSelectedContacts = useCallback(() => {
    if (contactSelectedIds.size === 0) return
    clearContactSelection()
    removeContacts([...contactSelectedIds]).catch(() => {})
  }, [contactSelectedIds, clearContactSelection, removeContacts])

  useEffect(() => { setContactSelectedIds(new Set()) }, [contactRows])

  const handleEditContact = useCallback((id: string) => {
    const row = contactRows.find(r => r.id === id)
    if (row) setEditingContact(row)
  }, [contactRows])

  const handleContactFabClick = useCallback(() => {
    if (contactSelectedIds.size === 0) {
      setEditingContact('new')
    } else {
      const row = contactRows.find(r => r.id === [...contactSelectedIds][0])
      if (row) setEditingContact(row)
    }
  }, [contactSelectedIds, contactRows])

  // ── Deals ─────────────────────────────────────────────────────────────────
  const {
    displayRows: dealRows,
    filteredRows: dealFilteredRows,
    sourceRows: dealSourceRows,
    loading: dealsLoading,
    error: dealsError,
    pagination: dealsPagination,
    refresh: refreshDeals,
    setPage: setDealsPage,
    editRow: editDeal,
    addRow: addDeal,
    removeRows: removeDeals,
    searchQuery: dealSearch,
    setSearchQuery: setDealSearch,
    sorts: dealSorts,
    setSortField: setDealSort,
    activeStatusFilter: activeDealStatusFilter,
    setStatusFilter: setDealStatusFilter,
    viewMode: dealViewMode,
    setViewMode: setDealViewMode,
  } = useDeals()

  const [dealSelectedIds, setDealSelectedIds] = useState<Set<string>>(new Set())
  const [editingDeal, setEditingDeal] = useState<Deal | 'new' | null>(null)

  const toggleDealRow = useCallback((id: string) => setDealSelectedIds(prev => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id); else next.add(id)
    return next
  }), [])
  const selectAllDeals = useCallback(() => setDealSelectedIds(new Set(dealRows.map(r => r.id))), [dealRows])
  const clearDealSelection = useCallback(() => setDealSelectedIds(new Set()), [])
  const deleteSelectedDeals = useCallback(() => {
    if (dealSelectedIds.size === 0) return
    clearDealSelection()
    removeDeals([...dealSelectedIds]).catch(() => {})
  }, [dealSelectedIds, clearDealSelection, removeDeals])

  useEffect(() => { setDealSelectedIds(new Set()) }, [dealRows])

  const handleEditDeal = useCallback((id: string) => {
    const row = dealRows.find(r => r.id === id)
    if (row) setEditingDeal(row)
  }, [dealRows])

  const handleDealFabClick = useCallback(() => {
    if (dealSelectedIds.size === 0) {
      setEditingDeal('new')
    } else {
      const row = dealRows.find(r => r.id === [...dealSelectedIds][0])
      if (row) setEditingDeal(row)
    }
  }, [dealSelectedIds, dealRows])

  const handleUploadProposal = useCallback(async (id: string, file: File) => {
    setDealUploadError(null)
    try {
      const { url, filename } = await uploadDocument('deals', id, file)
      editDeal(id, { proposal_url: url, proposal_filename: filename })
    } catch (err) {
      setDealUploadError(err instanceof Error ? err.message : 'Upload failed')
    }
  }, [editDeal])

  // ── Derived values for current view ──────────────────────────────────────
  const isProjects = activeView === 'projects'
  const isContacts = activeView === 'contacts'
  const isDeals = activeView === 'deals'

  const loading = isProjects ? projectsLoading : isContacts ? contactsLoading : dealsLoading
  const error = isProjects ? projectsError : isContacts ? contactsError : dealsError
  const displayRows = isProjects ? projectRows : isContacts ? contactRows : dealRows
  const sourceCount = isProjects ? projectSourceRows.length : isContacts ? contactSourceRows.length : dealSourceRows.length
  const pagination = isProjects ? projectsPagination : isContacts ? contactsPagination : dealsPagination
  const selectedCount = isProjects ? projectSelectedIds.size : isContacts ? contactSelectedIds.size : dealSelectedIds.size
  const searchQuery = isProjects ? projectSearch : isContacts ? contactSearch : dealSearch
  const onSearchChange = isProjects ? setProjectSearch : isContacts ? setContactSearch : setDealSearch
  const onRefresh = isProjects ? refreshProjects : isContacts ? refreshContacts : refreshDeals
  const onSelectAll = isProjects ? selectAllProjects : isContacts ? selectAllContacts : selectAllDeals
  const onClearAll = isProjects ? clearProjectSelection : isContacts ? clearContactSelection : clearDealSelection
  const onDeleteSelected = isProjects ? deleteSelectedProjects : isContacts ? deleteSelectedContacts : deleteSelectedDeals
  const onPageChange = isProjects ? setProjectsPage : isContacts ? setContactsPage : setDealsPage
  const onFabClick = isProjects ? handleProjectFabClick : isContacts ? handleContactFabClick : handleDealFabClick
  const viewMode = isProjects ? projectViewMode : isContacts ? contactViewMode : dealViewMode
  const onViewModeChange = isProjects ? setProjectViewMode : isContacts ? setContactViewMode : setDealViewMode
  const filteredRows = isProjects ? projectFilteredRows : isContacts ? contactFilteredRows : dealFilteredRows

  return (
    <div style={{ display: 'flex', minHeight: '100vh', minWidth: 1044 }}>
      <IconSidebar
        activeView={activeView}
        onSelectView={setActiveView}
        onTogglePanel={() => setPanelOpen(p => !p)}
      />

      <div
        aria-hidden={!panelOpen}
        inert={!panelOpen}
        style={{ width: panelOpen ? 200 : 0, overflow: 'hidden', flexShrink: 0, transition: 'width 250ms ease' }}
      >
        <SubItemsPanel
          activeView={activeView}
          totalCount={sourceCount}
          onAddItem={onFabClick}
          activeStatusFilter={activeStatusFilter}
          onStatusChange={setStatusFilter}
          activeContactStatusFilter={activeContactStatusFilter}
          onContactStatusChange={setContactStatusFilter}
          activeDealStatusFilter={activeDealStatusFilter}
          onDealStatusChange={setDealStatusFilter}
        />
      </div>

      <MainContent>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--white)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden', position: 'relative' }}>
          <GridToolbar
            onRefresh={onRefresh}
            selectedCount={selectedCount}
            totalCount={displayRows.length}
            onSelectAll={onSelectAll}
            onClearAll={onClearAll}
            onDeleteSelected={onDeleteSelected}
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            viewMode={viewMode}
            onViewModeChange={onViewModeChange}
          />

          {loading && <LoadingState />}
          {!loading && error && <ErrorState message={error} onRetry={onRefresh} />}
          {isDeals && dealUploadError && <ErrorState message={dealUploadError} onRetry={() => setDealUploadError(null)} />}
          {!loading && !error && displayRows.length === 0 && <EmptyState />}

          {!loading && !error && filteredRows.length > 0 && isProjects && viewMode === 'grid' && (
            <ProjectsGrid
              rows={projectRows}
              onRowChange={editProject}
              selectedIds={projectSelectedIds}
              onToggleRow={toggleProjectRow}
              onEditRow={handleEditProject}
              sorts={projectSorts}
              onSortField={setProjectSort}
            />
          )}

          {!loading && !error && filteredRows.length > 0 && isProjects && viewMode === 'kanban' && (
            <KanbanBoard
              rows={projectFilteredRows}
              config={PROJECTS_CONFIG}
              onEdit={handleEditProject}
              onDelete={id => removeProjects([id])}
              onStatusChange={(id, status) => editProject(id, { project_status: status })}
            />
          )}

          {!loading && !error && filteredRows.length > 0 && isContacts && viewMode === 'grid' && (
            <ContactsGrid
              rows={contactRows}
              onRowChange={editContact}
              selectedIds={contactSelectedIds}
              onToggleRow={toggleContactRow}
              onEditRow={handleEditContact}
              sorts={contactSorts}
              onSortField={setContactSort}
            />
          )}

          {!loading && !error && filteredRows.length > 0 && isContacts && viewMode === 'kanban' && (
            <KanbanBoard
              rows={contactFilteredRows}
              config={CONTACTS_CONFIG}
              onEdit={handleEditContact}
              onDelete={id => removeContacts([id])}
              onStatusChange={(id, status) => editContact(id, { status })}
            />
          )}

          {!loading && !error && filteredRows.length > 0 && isDeals && viewMode === 'grid' && (
            <DealsGrid
              rows={dealRows}
              onRowChange={editDeal}
              selectedIds={dealSelectedIds}
              onToggleRow={toggleDealRow}
              onEditRow={handleEditDeal}
              sorts={dealSorts}
              onSortField={setDealSort}
              onUploadProposal={handleUploadProposal}
            />
          )}

          {!loading && !error && filteredRows.length > 0 && isDeals && viewMode === 'kanban' && (
            <KanbanBoard
              rows={dealFilteredRows}
              config={DEALS_CONFIG}
              onEdit={handleEditDeal}
              onDelete={id => removeDeals([id])}
              onStatusChange={(id, status) => editDeal(id, { status })}
            />
          )}

          {viewMode === 'grid' && (
            <button
              onClick={() => {
                if (isProjects) addProject(NEW_PROJECT_DEFAULTS).catch(() => {})
                else if (isContacts) addContact(NEW_CONTACT_DEFAULTS).catch(() => {})
                else addDeal(NEW_DEAL_DEFAULTS).catch(() => {})
              }}
              title="Add record"
              style={{ position: 'absolute', bottom: 64, left: 42, width: 44, height: 44, borderRadius: '50%', background: 'var(--accent-primary)', color: 'var(--foreground-inverse)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 10px rgba(0,0,0,0.22)', zIndex: 10 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>add</span>
            </button>
          )}

          {viewMode === 'grid' && <GridStatusBar pagination={pagination} onPageChange={onPageChange} />}
        </div>
      </MainContent>

      {editingProject !== null && (
        <RecordEditorModal
          row={editingProject === 'new' ? undefined : editingProject}
          onSave={editProject}
          onAdd={data => { addProject(data).catch(() => {}) }}
          onClose={() => setEditingProject(null)}
        />
      )}

      {editingContact !== null && (
        <ContactEditorModal
          row={editingContact === 'new' ? undefined : editingContact}
          onSave={editContact}
          onAdd={data => { addContact(data).catch(() => {}) }}
          onClose={() => setEditingContact(null)}
        />
      )}

      {editingDeal !== null && (
        <DealEditorModal
          row={editingDeal === 'new' ? undefined : editingDeal}
          onSave={editDeal}
          onAdd={data => { addDeal(data).catch(() => {}) }}
          onClose={() => setEditingDeal(null)}
        />
      )}
    </div>
  )
}
