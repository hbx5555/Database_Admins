export interface Contact {
  id: string
  first_name: string | null
  last_name: string | null
  full_name: string | null  // Postgres-generated, never written directly
  phone_number: string | null
  email: string | null
  role: string | null
  location: string | null
  created_at: string
  updated_at: string
}

// full_name excluded — it is computed by Postgres
export type ContactInsert = Omit<Contact, 'id' | 'full_name' | 'created_at' | 'updated_at'>
export type ContactUpdate = Partial<ContactInsert>

export interface ContactSortSpec {
  field: keyof Contact
  direction: 'asc' | 'desc'
}

export interface ContactViewConfig {
  sorts: ContactSortSpec[]
}

export const DEFAULT_CONTACT_VIEW_CONFIG: ContactViewConfig = { sorts: [] }

export const DEFAULT_CONTACT_PAGINATION = { page: 1, pageSize: 10, total: 0 }

export const CONTACT_COLUMN_LABELS: Record<string, string> = {
  full_name: 'Full Name',
  first_name: 'First Name',
  last_name: 'Last Name',
  phone_number: 'Phone',
  email: 'Email',
  role: 'Role',
  location: 'Location',
}
