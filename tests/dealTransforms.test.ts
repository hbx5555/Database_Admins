import { describe, it, expect } from 'vitest'
import {
  applyDealStatusFilter,
  applyDealSorts,
  applyDealSearch,
  paginateDealRows,
} from '../src/lib/transforms'
import type { Deal } from '../src/types/deal'

function makeDeal(overrides: Partial<Deal>): Deal {
  return {
    id: '1', deal_name: 'Test Deal', deal_description: null,
    last_call_content: null, last_call_datetime: null,
    proposal_url: null, proposal_filename: null, contract_url: null, contract_filename: null, status: 'New',
    contact_id: null, contacts: null,
    created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('applyDealStatusFilter', () => {
  it('returns all rows when status is null', () => {
    const rows = [makeDeal({ status: 'New' }), makeDeal({ status: 'Signed' })]
    expect(applyDealStatusFilter(rows, null)).toHaveLength(2)
  })

  it('returns only rows matching status', () => {
    const rows = [makeDeal({ id: '1', status: 'New' }), makeDeal({ id: '2', status: 'Signed' })]
    const result = applyDealStatusFilter(rows, 'Signed')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('2')
  })

  it('excludes rows with null status', () => {
    const rows = [makeDeal({ id: '1', status: null }), makeDeal({ id: '2', status: 'New' })]
    expect(applyDealStatusFilter(rows, 'New')).toHaveLength(1)
  })
})

describe('applyDealSearch', () => {
  it('returns all rows for empty query', () => {
    const rows = [makeDeal({ deal_name: 'Alpha' }), makeDeal({ deal_name: 'Beta' })]
    expect(applyDealSearch(rows, '')).toHaveLength(2)
  })

  it('matches deal_name case-insensitively', () => {
    const rows = [makeDeal({ id: '1', deal_name: 'Alpha Deal' }), makeDeal({ id: '2', deal_name: 'Beta Deal' })]
    expect(applyDealSearch(rows, 'alpha')).toHaveLength(1)
    expect(applyDealSearch(rows, 'alpha')[0].id).toBe('1')
  })

  it('matches deal_description', () => {
    const rows = [
      makeDeal({ id: '1', deal_description: 'Important contract' }),
      makeDeal({ id: '2', deal_description: null }),
    ]
    expect(applyDealSearch(rows, 'contract')).toHaveLength(1)
  })

  it('returns empty array when no match', () => {
    const rows = [makeDeal({ deal_name: 'Zebra' })]
    expect(applyDealSearch(rows, 'zzz')).toHaveLength(0)
  })
})

describe('applyDealSorts', () => {
  it('returns rows unchanged when sorts is empty', () => {
    const rows = [makeDeal({ id: '1' }), makeDeal({ id: '2' })]
    expect(applyDealSorts(rows, [])).toEqual(rows)
  })

  it('sorts by deal_name ascending', () => {
    const rows = [makeDeal({ id: '1', deal_name: 'Zebra' }), makeDeal({ id: '2', deal_name: 'Alpha' })]
    const result = applyDealSorts(rows, [{ field: 'deal_name', direction: 'asc' }])
    expect(result[0].id).toBe('2')
    expect(result[1].id).toBe('1')
  })

  it('sorts by deal_name descending', () => {
    const rows = [makeDeal({ id: '1', deal_name: 'Alpha' }), makeDeal({ id: '2', deal_name: 'Zebra' })]
    const result = applyDealSorts(rows, [{ field: 'deal_name', direction: 'desc' }])
    expect(result[0].id).toBe('2')
  })

  it('does not mutate the original array', () => {
    const rows = [makeDeal({ id: '1', deal_name: 'Z' }), makeDeal({ id: '2', deal_name: 'A' })]
    applyDealSorts(rows, [{ field: 'deal_name', direction: 'asc' }])
    expect(rows[0].id).toBe('1')
  })
})

describe('paginateDealRows', () => {
  it('returns first page correctly', () => {
    const rows = Array.from({ length: 25 }, (_, i) => makeDeal({ id: String(i) }))
    const page1 = paginateDealRows(rows, 1, 10)
    expect(page1).toHaveLength(10)
    expect(page1[0].id).toBe('0')
  })

  it('returns second page correctly', () => {
    const rows = Array.from({ length: 25 }, (_, i) => makeDeal({ id: String(i) }))
    const page2 = paginateDealRows(rows, 2, 10)
    expect(page2).toHaveLength(10)
    expect(page2[0].id).toBe('10')
  })

  it('returns partial last page', () => {
    const rows = Array.from({ length: 25 }, (_, i) => makeDeal({ id: String(i) }))
    expect(paginateDealRows(rows, 3, 10)).toHaveLength(5)
  })
})
