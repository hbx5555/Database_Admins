import { supabase } from './supabase'
import type { Deal, DealInsert, DealUpdate } from '../types/deal'

export async function fetchDeals(): Promise<Deal[]> {
  const { data, error } = await supabase
    .from('deals')
    .select('*, contacts(*)')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data as Deal[]
}

export async function createDeal(row: DealInsert): Promise<Deal> {
  const { data, error } = await supabase
    .from('deals')
    .insert(row)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as Deal
}

export async function updateDeal(id: string, changes: DealUpdate): Promise<Deal> {
  const { data, error } = await supabase
    .from('deals')
    .update(changes)
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as Deal
}

export async function deleteDeals(ids: string[]): Promise<void> {
  const { error } = await supabase.from('deals').delete().in('id', ids)
  if (error) throw new Error(error.message)
}
