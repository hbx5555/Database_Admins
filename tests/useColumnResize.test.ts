import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useColumnResize, DEFAULT_COLUMN_WIDTHS } from '../src/hooks/useColumnResize'

const LS_KEY = 'db-admins-column-widths'

beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('useColumnResize — initialization', () => {
  it('returns default widths when localStorage is empty', () => {
    const { result } = renderHook(() => useColumnResize())
    expect(result.current.columnWidths).toEqual(DEFAULT_COLUMN_WIDTHS)
  })

  it('merges stored widths over defaults', () => {
    localStorage.setItem(LS_KEY, JSON.stringify({ project_name: 300 }))
    const { result } = renderHook(() => useColumnResize())
    expect(result.current.columnWidths.project_name).toBe(300)
    expect(result.current.columnWidths.project_topic).toBe(DEFAULT_COLUMN_WIDTHS.project_topic)
  })

  it('falls back to defaults when localStorage contains invalid JSON', () => {
    localStorage.setItem(LS_KEY, 'not-json')
    const { result } = renderHook(() => useColumnResize())
    expect(result.current.columnWidths).toEqual(DEFAULT_COLUMN_WIDTHS)
  })
})

describe('useColumnResize — drag', () => {
  it('clamps width to 60px minimum during drag', () => {
    const { result } = renderHook(() => useColumnResize())

    act(() => {
      result.current.startResize('project_name', 500, 200)
    })

    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 200 }))
    })

    expect(result.current.columnWidths.project_name).toBe(60)
  })

  it('increases width when dragged right', () => {
    const { result } = renderHook(() => useColumnResize())

    act(() => {
      result.current.startResize('project_name', 500, 200)
    })

    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 550 }))
    })

    expect(result.current.columnWidths.project_name).toBe(250)
  })

  it('persists widths to localStorage on mouseup', () => {
    const { result } = renderHook(() => useColumnResize())

    act(() => {
      result.current.startResize('project_name', 500, 200)
    })
    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 560 }))
    })
    act(() => {
      window.dispatchEvent(new MouseEvent('mouseup'))
    })

    const stored = JSON.parse(localStorage.getItem(LS_KEY)!)
    expect(stored.project_name).toBe(260)
  })
})
