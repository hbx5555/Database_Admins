import type { TableConfig } from '../types/tableConfig'
import type { Project, ProjectStatus } from '../types/project'
import { STATUS_OPTIONS, STATUS_COLORS, COLUMN_LABELS } from '../types/project'
import type { Contact, ContactStatus } from '../types/contact'
import { CONTACT_STATUS_OPTIONS, CONTACT_STATUS_COLORS, CONTACT_COLUMN_LABELS } from '../types/contact'

export const PROJECTS_CONFIG: TableConfig<Project, ProjectStatus> = {
  label: 'Projects',
  statusField: 'project_status',
  statusOptions: STATUS_OPTIONS,
  statusColors: STATUS_COLORS,
  primaryField: 'project_name',
  cardFields: ['project_topic', 'project_budget'],
  columnLabels: COLUMN_LABELS,
  defaultSorts: [],
}

export const CONTACTS_CONFIG: TableConfig<Contact, ContactStatus> = {
  label: 'Contacts',
  statusField: 'status',
  statusOptions: CONTACT_STATUS_OPTIONS,
  statusColors: CONTACT_STATUS_COLORS,
  primaryField: 'full_name',
  cardFields: ['role', 'location'],
  columnLabels: CONTACT_COLUMN_LABELS,
  defaultSorts: [],
}
