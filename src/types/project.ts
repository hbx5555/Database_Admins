import type { Deal } from './deal'

export type ProjectStatus = 'New' | 'Started' | 'Done'
export const STATUS_OPTIONS: ProjectStatus[] = ['New', 'Started', 'Done']

export interface Project {
  id: string
  project_name: string
  project_topic: string | null
  project_status: ProjectStatus | null
  project_start_date: string | null      // ISO date string "YYYY-MM-DD"
  project_delivery_date: string | null   // ISO date string "YYYY-MM-DD"
  project_budget: number | null
  spec_url: string | null
  spec_filename: string | null
  deal_id: string | null
  deals: Deal | null                     // populated by Supabase join; not a DB column
  created_at: string
  updated_at: string
}

export type ProjectInsert = Omit<Project, 'id' | 'created_at' | 'updated_at' | 'deals'>
export type ProjectUpdate = Partial<ProjectInsert>

export interface FilterSpec {
  field: keyof Project
  value: string
}

export interface SortSpec {
  field: keyof Project
  direction: 'asc' | 'desc'
}

export interface ViewConfig {
  visibleColumns: (keyof Project)[]
  filters: FilterSpec[]
  sorts: SortSpec[]
}

export interface PaginationState {
  page: number
  pageSize: number
  total: number
}

export const DEFAULT_VIEW_CONFIG: ViewConfig = {
  visibleColumns: [
    'project_name',
    'project_topic',
    'project_status',
    'project_start_date',
    'project_delivery_date',
    'project_budget',
  ],
  filters: [],
  sorts: [],
}

export const DEFAULT_PAGINATION: PaginationState = {
  page: 1,
  pageSize: 10,
  total: 0,
}

export const STATUS_COLORS: Record<ProjectStatus, { bg: string; text: string }> = {
  New: { bg: '#E8F4EA', text: '#2D5E3A' },
  Started: { bg: '#FFF3CD', text: '#856404' },
  Done: { bg: '#D4EDDA', text: '#155724' },
}

export const COLUMN_LABELS: Record<string, string> = {
  project_name: 'Project Name',
  project_topic: 'Topic',
  project_status: 'Status',
  project_start_date: 'Start Date',
  project_delivery_date: 'Delivery Date',
  project_budget: 'Budget',
  deal_id: 'Deal',
  spec_filename: 'Spec',
}
