import { useTableData } from './useTableData'
import { fetchContacts, createContact, updateContact, deleteContacts } from '../lib/contactsApi'
import { applyContactStatusFilter, applyContactSorts, applyContactSearch, paginateContactRows } from '../lib/transforms'
import type { Contact, ContactInsert, ContactUpdate, ContactStatus } from '../types/contact'

function buildOptimisticRow(data: ContactInsert): Contact {
  return {
    ...data,
    id: `optimistic-${Date.now()}`,
    full_name: [data.first_name, data.last_name].filter(Boolean).join(' ') || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

// Defined at module level so the object reference is stable across renders
const CONTACT_CONFIG = {
  fetch: fetchContacts,
  create: createContact,
  update: updateContact,
  deleteMany: deleteContacts,
  filterByStatus: applyContactStatusFilter,
  sortRows: applyContactSorts,
  searchRows: applyContactSearch,
  paginate: paginateContactRows,
  buildOptimisticRow,
}

export function useContacts() {
  return useTableData<Contact, ContactInsert, ContactUpdate, ContactStatus>(CONTACT_CONFIG)
}
