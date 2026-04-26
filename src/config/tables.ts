import type { TableConfig } from '../types/tableConfig'
import type { Project, ProjectStatus } from '../types/project'
import { STATUS_OPTIONS, STATUS_COLORS, COLUMN_LABELS } from '../types/project'
import type { Contact, ContactStatus } from '../types/contact'
import { CONTACT_STATUS_OPTIONS, CONTACT_STATUS_COLORS, CONTACT_COLUMN_LABELS } from '../types/contact'
import type { Deal, DealStatus } from '../types/deal'
import { DEAL_STATUS_OPTIONS, DEAL_STATUS_COLORS, DEAL_COLUMN_LABELS } from '../types/deal'

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

export const DEALS_CONFIG: TableConfig<Deal, DealStatus> = {
  label: 'Deals',
  statusField: 'status',
  statusOptions: DEAL_STATUS_OPTIONS,
  statusColors: DEAL_STATUS_COLORS,
  primaryField: 'deal_name',
  cardFields: ['deal_description', 'last_call_datetime'],
  columnLabels: DEAL_COLUMN_LABELS,
  defaultSorts: [],
  cardFieldFormatters: {
    last_call_datetime: (val) =>
      val ? new Date(val as string).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '',
  },
}
