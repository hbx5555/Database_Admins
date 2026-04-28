import { useTableData } from './useTableData'
import { fetchDeals, createDeal, updateDeal, deleteDeals } from '../lib/dealsApi'
import { applyDealStatusFilter, applyDealSorts, applyDealSearch, paginateDealRows } from '../lib/transforms'
import type { Deal, DealInsert, DealUpdate, DealStatus } from '../types/deal'

function buildOptimisticRow(data: DealInsert): Deal {
  return {
    ...data,
    id: `optimistic-${Date.now()}`,
    contact_id: data.contact_id ?? null,
    contacts: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

// Defined at module level so the object reference is stable across renders
const DEAL_CONFIG = {
  fetch: fetchDeals,
  create: createDeal,
  update: updateDeal,
  deleteMany: deleteDeals,
  filterByStatus: applyDealStatusFilter,
  sortRows: applyDealSorts,
  searchRows: applyDealSearch,
  paginate: paginateDealRows,
  buildOptimisticRow,
}

export function useDeals() {
  return useTableData<Deal, DealInsert, DealUpdate, DealStatus>(DEAL_CONFIG)
}
