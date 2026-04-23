import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { GridToolbar } from '../src/components/grid/GridToolbar'

const base = { onRefresh: vi.fn(), onSelectAll: vi.fn(), onClearAll: vi.fn() }

describe('GridToolbar checkbox', () => {
  beforeEach(() => vi.clearAllMocks())
  it('is unchecked and not indeterminate when selectedCount is 0', () => {
    render(<GridToolbar {...base} selectedCount={0} totalCount={5} />)
    const cb = screen.getByRole('checkbox') as HTMLInputElement
    expect(cb.checked).toBe(false)
    expect(cb.indeterminate).toBe(false)
  })

  it('is checked when all rows are selected', () => {
    render(<GridToolbar {...base} selectedCount={5} totalCount={5} />)
    const cb = screen.getByRole('checkbox') as HTMLInputElement
    expect(cb.checked).toBe(true)
    expect(cb.indeterminate).toBe(false)
  })

  it('is indeterminate when some rows are selected', () => {
    render(<GridToolbar {...base} selectedCount={3} totalCount={5} />)
    const cb = screen.getByRole('checkbox') as HTMLInputElement
    expect(cb.indeterminate).toBe(true)
  })

  it('calls onSelectAll when clicked while unchecked', () => {
    const onSelectAll = vi.fn()
    render(<GridToolbar {...base} onSelectAll={onSelectAll} selectedCount={0} totalCount={5} />)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(onSelectAll).toHaveBeenCalledTimes(1)
  })

  it('calls onSelectAll when clicked while indeterminate', () => {
    const onSelectAll = vi.fn()
    render(<GridToolbar {...base} onSelectAll={onSelectAll} selectedCount={3} totalCount={5} />)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(onSelectAll).toHaveBeenCalledTimes(1)
  })

  it('calls onClearAll when clicked while all selected', () => {
    const onClearAll = vi.fn()
    render(<GridToolbar {...base} onClearAll={onClearAll} selectedCount={5} totalCount={5} />)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(onClearAll).toHaveBeenCalledTimes(1)
  })
})
