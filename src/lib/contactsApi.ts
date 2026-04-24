import { supabase } from './supabase'
import type { Contact, ContactInsert, ContactUpdate } from '../types/contact'

export async function fetchContacts(): Promise<Contact[]> {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data as Contact[]
}

export async function createContact(row: ContactInsert): Promise<Contact> {
  const { data, error } = await supabase
    .from('contacts')
    .insert(row)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as Contact
}

export async function updateContact(id: string, changes: ContactUpdate): Promise<Contact> {
  const { data, error } = await supabase
    .from('contacts')
    .update(changes)
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as Contact
}

export async function deleteContact(id: string): Promise<void> {
  const { error } = await supabase.from('contacts').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteContacts(ids: string[]): Promise<void> {
  const { error } = await supabase.from('contacts').delete().in('id', ids)
  if (error) throw new Error(error.message)
}
