import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useColumnResize, DEFAULT_COLUMN_WIDTHS, LS_KEY } from '../src/hooks/useColumnResize'

beforeEach(() => {
  localStorage.clear()
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

describe('useColumnResize — finalizeWidth', () => {
  it('clamps width to 60px minimum', () => {
    const { result } = renderHook(() => useColumnResize())
    act(() => { result.current.finalizeWidth('project_name', 30) })
    expect(result.current.columnWidths.project_name).toBe(60)
  })

  it('updates width to the provided value when above minimum', () => {
    const { result } = renderHook(() => useColumnResize())
    act(() => { result.current.finalizeWidth('project_name', 250) })
    expect(result.current.columnWidths.project_name).toBe(250)
  })

  it('does not affect other column widths', () => {
    const { result } = renderHook(() => useColumnResize())
    act(() => { result.current.finalizeWidth('project_name', 250) })
    expect(result.current.columnWidths.project_topic).toBe(DEFAULT_COLUMN_WIDTHS.project_topic)
  })

  it('persists the new width to localStorage immediately', () => {
    const { result } = renderHook(() => useColumnResize())
    act(() => { result.current.finalizeWidth('project_name', 260) })
    const stored = JSON.parse(localStorage.getItem(LS_KEY)!)
    expect(stored.project_name).toBe(260)
  })

  it('persists all column widths, not just the changed one', () => {
    const { result } = renderHook(() => useColumnResize())
    act(() => { result.current.finalizeWidth('project_name', 260) })
    const stored = JSON.parse(localStorage.getItem(LS_KEY)!)
    expect(stored.project_topic).toBe(DEFAULT_COLUMN_WIDTHS.project_topic)
    expect(stored.project_status).toBe(DEFAULT_COLUMN_WIDTHS.project_status)
  })
})
