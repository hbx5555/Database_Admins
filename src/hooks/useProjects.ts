import { useTableData } from './useTableData'
import { fetchProjects, createProject, updateProject, deleteProjects } from '../lib/projectsApi'
import { applySorts, applySearch, paginateRows } from '../lib/transforms'
import type { Project, ProjectInsert, ProjectUpdate, ProjectStatus } from '../types/project'

function filterByStatus(rows: Project[], status: ProjectStatus | null): Project[] {
  if (status === null) return rows
  return rows.filter(r => r.project_status === status)
}

function buildOptimisticRow(data: ProjectInsert): Project {
  return {
    ...data,
    id: `optimistic-${Date.now()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

// Defined at module level so the object reference is stable across renders
const PROJECT_CONFIG = {
  fetch: fetchProjects,
  create: createProject,
  update: updateProject,
  deleteMany: deleteProjects,
  filterByStatus,
  sortRows: applySorts,
  searchRows: applySearch,
  paginate: paginateRows,
  buildOptimisticRow,
}

export function useProjects() {
  return useTableData<Project, ProjectInsert, ProjectUpdate, ProjectStatus>(PROJECT_CONFIG)
}
