import { useState, useEffect, useCallback } from 'react'
import { useProjects } from './hooks/useProjects'
import { IconSidebar } from './components/layout/IconSidebar'
import { SubItemsPanel } from './components/layout/SubItemsPanel'
import { MainContent } from './components/layout/MainContent'
import { GridToolbar } from './components/grid/GridToolbar'
import { GridStatusBar } from './components/grid/GridStatusBar'
import { ProjectsGrid } from './components/grid/ProjectsGrid'
import { LoadingState } from './components/shared/LoadingState'
import { ErrorState } from './components/shared/ErrorState'
import { EmptyState } from './components/shared/EmptyState'
import type { ProjectInsert } from './types/project'

const NEW_PROJECT_DEFAULTS: ProjectInsert = {
  project_name: 'New Project',
  project_topic: null,
  project_status: 'New',
  project_start_date: null,
  project_delivery_date: null,
  project_budget: null,
}

export default function App() {
  const {
    displayRows,
    sourceRows,
    loading,
    error,
    pagination,
    refresh,
    setPage,
    editRow,
    addRow,
    removeRows,
    activeStatusFilter,
    setStatusFilter,
  } = useProjects()

  const [panelOpen, setPanelOpen] = useState(true)
  const handleTogglePanel = () => setPanelOpen(p => !p)

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const toggleRowSelection = useCallback((id: string) => setSelectedIds(prev => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id); else next.add(id)
    return next
  }), [])
  const selectAll = useCallback(() => setSelectedIds(new Set(displayRows.map(r => r.id))), [displayRows])
  const clearSelection = useCallback(() => setSelectedIds(new Set()), [])
  const deleteSelected = useCallback(() => {
    if (selectedIds.size === 0) return
    const ids = [...selectedIds]
    clearSelection()
    removeRows(ids).catch(() => {})
  }, [selectedIds, clearSelection, removeRows])

  useEffect(() => { setSelectedIds(new Set()) }, [displayRows])

  const handleAddItem = () => {
    addRow(NEW_PROJECT_DEFAULTS).catch(() => {
      // error is surfaced via the hook's error state
    })
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', minWidth: 1044 }}>
      <IconSidebar onTogglePanel={handleTogglePanel} />
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
          totalCount={sourceRows.length}
          onAddItem={handleAddItem}
          activeStatusFilter={activeStatusFilter}
          onStatusChange={setStatusFilter}
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
            onRefresh={refresh}
            selectedCount={selectedIds.size}
            totalCount={displayRows.length}
            onSelectAll={selectAll}
            onClearAll={clearSelection}
            onDeleteSelected={deleteSelected}
          />

          {loading && <LoadingState />}
          {!loading && error && <ErrorState message={error} onRetry={refresh} />}
          {!loading && !error && displayRows.length === 0 && <EmptyState />}
          {!loading && !error && displayRows.length > 0 && (
            <ProjectsGrid
              rows={displayRows}
              onRowChange={editRow}
              selectedIds={selectedIds}
              onToggleRow={toggleRowSelection}
            />
          )}

          {/* FAB: visible even when sidebar is collapsed */}
          <button
            onClick={handleAddItem}
            title="Add record"
            style={{
              position: 'absolute',
              bottom: 56,
              left: 40,
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'var(--accent-primary)',
              color: 'var(--foreground-inverse)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 3px 10px rgba(0,0,0,0.22)',
              zIndex: 10,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>add</span>
          </button>

          <GridStatusBar pagination={pagination} onPageChange={setPage} />
        </div>
      </MainContent>
    </div>
  )
}
