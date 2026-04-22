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
    activeStatusFilter,
    setStatusFilter,
  } = useProjects()

  const handleAddItem = () => {
    addRow(NEW_PROJECT_DEFAULTS).catch(() => {
      // error is surfaced via the hook's error state
    })
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', minWidth: 1044 }}>
      <IconSidebar />
      <SubItemsPanel
          totalCount={sourceRows.length}
          onAddItem={handleAddItem}
          activeStatusFilter={activeStatusFilter}
          onStatusChange={setStatusFilter}
        />
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
        }}>
          <GridToolbar onRefresh={refresh} />

          {loading && <LoadingState />}
          {!loading && error && <ErrorState message={error} onRetry={refresh} />}
          {!loading && !error && displayRows.length === 0 && <EmptyState />}
          {!loading && !error && displayRows.length > 0 && (
            <ProjectsGrid rows={displayRows} onRowChange={editRow} />
          )}

          <GridStatusBar pagination={pagination} onPageChange={setPage} />
        </div>
      </MainContent>
    </div>
  )
}
