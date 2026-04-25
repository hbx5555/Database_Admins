import { useState, useEffect, useCallback } from 'react'
import { useProjects } from './hooks/useProjects'
import { useContacts } from './hooks/useContacts'
import { IconSidebar, type AppView } from './components/layout/IconSidebar'
import { SubItemsPanel } from './components/layout/SubItemsPanel'
import { MainContent } from './components/layout/MainContent'
import { GridToolbar } from './components/grid/GridToolbar'
import { GridStatusBar } from './components/grid/GridStatusBar'
import { ProjectsGrid } from './components/grid/ProjectsGrid'
import { ContactsGrid } from './components/grid/ContactsGrid'
import { KanbanBoard } from './components/grid/KanbanBoard'
import { RecordEditorModal } from './components/grid/RecordEditorModal'
import { ContactEditorModal } from './components/grid/ContactEditorModal'
import { PROJECTS_CONFIG, CONTACTS_CONFIG } from './config/tables'
import { LoadingState } from './components/shared/LoadingState'
import { ErrorState } from './components/shared/ErrorState'
import { EmptyState } from './components/shared/EmptyState'
import type { ProjectInsert, Project } from './types/project'
import type { Contact, ContactInsert } from './types/contact'

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

export default function App() {
  const [activeView, setActiveView] = useState<AppView>('projects')
  const [panelOpen, setPanelOpen] = useState(true)

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

  const handleProjectFabClick = useCallback(() => {
    if (projectSelectedIds.size === 0) {
      setEditingProject('new')
    } else {
      const row = projectRows.find(r => r.id === [...projectSelectedIds][0])
      if (row) setEditingProject(row)
    }
  }, [projectSelectedIds, projectRows])

  const handleEditProject = useCallback((id: string) => {
    const row = projectRows.find(r => r.id === id)
    if (row) setEditingProject(row)
  }, [projectRows])

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

  const handleContactFabClick = useCallback(() => {
    if (contactSelectedIds.size === 0) {
      setEditingContact('new')
    } else {
      const row = contactRows.find(r => r.id === [...contactSelectedIds][0])
      if (row) setEditingContact(row)
    }
  }, [contactSelectedIds, contactRows])

  const handleEditContact = useCallback((id: string) => {
    const row = contactRows.find(r => r.id === id)
    if (row) setEditingContact(row)
  }, [contactRows])

  // ── Derived values for current view ──────────────────────────────────────
  const isProjects = activeView === 'projects'
  const loading = isProjects ? projectsLoading : contactsLoading
  const error = isProjects ? projectsError : contactsError
  const displayRows = isProjects ? projectRows : contactRows
  const sourceCount = isProjects ? projectSourceRows.length : contactSourceRows.length
  const pagination = isProjects ? projectsPagination : contactsPagination
  const selectedCount = isProjects ? projectSelectedIds.size : contactSelectedIds.size
  const searchQuery = isProjects ? projectSearch : contactSearch
  const onSearchChange = isProjects ? setProjectSearch : setContactSearch
  const onRefresh = isProjects ? refreshProjects : refreshContacts
  const onSelectAll = isProjects ? selectAllProjects : selectAllContacts
  const onClearAll = isProjects ? clearProjectSelection : clearContactSelection
  const onDeleteSelected = isProjects ? deleteSelectedProjects : deleteSelectedContacts
  const onPageChange = isProjects ? setProjectsPage : setContactsPage
  const onFabClick = isProjects ? handleProjectFabClick : handleContactFabClick
  const viewMode = isProjects ? projectViewMode : contactViewMode
  const onViewModeChange = isProjects ? setProjectViewMode : setContactViewMode
  const filteredRows = isProjects ? projectFilteredRows : contactFilteredRows

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
        style={{
          width: panelOpen ? 200 : 0,
          overflow: 'hidden',
          flexShrink: 0,
          transition: 'width 250ms ease',
        }}
      >
        <SubItemsPanel
          activeView={activeView}
          totalCount={sourceCount}
          onAddItem={onFabClick}
          activeStatusFilter={activeStatusFilter}
          onStatusChange={setStatusFilter}
          activeContactStatusFilter={activeContactStatusFilter}
          onContactStatusChange={setContactStatusFilter}
        />
      </div>

      <MainContent>
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--white)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          overflow: 'hidden',
          position: 'relative',
        }}>
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
              onStatusChange={(id, status) => editProject(id, { project_status: status })}
            />
          )}

          {!loading && !error && filteredRows.length > 0 && !isProjects && viewMode === 'grid' && (
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

          {!loading && !error && filteredRows.length > 0 && !isProjects && viewMode === 'kanban' && (
            <KanbanBoard
              rows={contactFilteredRows}
              config={CONTACTS_CONFIG}
              onEdit={handleEditContact}
              onStatusChange={(id, status) => editContact(id, { status })}
            />
          )}

          {viewMode === 'grid' && <button
            onClick={() => { if (isProjects) addProject(NEW_PROJECT_DEFAULTS).catch(() => {}); else addContact(NEW_CONTACT_DEFAULTS).catch(() => {}) }}
            title="Add record"
            style={{
              position: 'absolute', bottom: 64, left: 42,
              width: 44, height: 44, borderRadius: '50%',
              background: 'var(--accent-primary)',
              color: 'var(--foreground-inverse)',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 3px 10px rgba(0,0,0,0.22)', zIndex: 10,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>add</span>
          </button>}

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
    </div>
  )
}
