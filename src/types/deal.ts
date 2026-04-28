import type { Contact } from './contact'

export type DealStatus = 'New' | 'In Discussions' | 'Signed' | 'Rejected'
export const DEAL_STATUS_OPTIONS: DealStatus[] = ['New', 'In Discussions', 'Signed', 'Rejected']

export const DEAL_STATUS_COLORS: Record<DealStatus, { bg: string; text: string }> = {
  New:              { bg: '#E8F4EA', text: '#2D5E3A' },
  'In Discussions': { bg: '#FFF3CD', text: '#856404' },
  Signed:           { bg: '#D4EDDA', text: '#155724' },
  Rejected:         { bg: '#F8D7DA', text: '#721C24' },
}

export interface Deal {
  id: string
  deal_name: string
  deal_description: string | null
  last_call_content: string | null
  last_call_datetime: string | null  // ISO 8601 with timezone, e.g. "2026-04-26T14:30:00Z"
  proposal_url: string | null
  proposal_filename: string | null
  status: DealStatus | null
  contact_id: string | null
  contacts: Contact | null
  created_at: string
  updated_at: string
}

// Excludes id, created_at, updated_at, contacts — contacts is a Supabase join result, not a DB column
export type DealInsert = Omit<Deal, 'id' | 'created_at' | 'updated_at' | 'contacts'>
export type DealUpdate = Partial<DealInsert>

export const DEAL_COLUMN_LABELS: Record<string, string> = {
  deal_name: 'Deal Name',
  deal_description: 'Description',
  last_call_content: 'Last Call Notes',
  last_call_datetime: 'Last Call',
  proposal_url: 'Proposal',
  proposal_filename: 'Proposal',
  status: 'Status',
}
