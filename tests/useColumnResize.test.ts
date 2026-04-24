import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useColumnResize, PROJECT_DEFAULT_WIDTHS, PROJECT_COLUMN_LS_KEY } from '../src/hooks/useColumnResize'

const call = () => useColumnResize(PROJECT_COLUMN_LS_KEY, PROJECT_DEFAULT_WIDTHS)

beforeEach(() => {
  localStorage.clear()
})

describe('useColumnResize — initialization', () => {
  it('returns default widths when localStorage is empty', () => {
    const { result } = renderHook(call)
    expect(result.current.columnWidths).toEqual(PROJECT_DEFAULT_WIDTHS)
  })

  it('merges stored widths over defaults', () => {
    localStorage.setItem(PROJECT_COLUMN_LS_KEY, JSON.stringify({ project_name: 300 }))
    const { result } = renderHook(call)
    expect(result.current.columnWidths.project_name).toBe(300)
    expect(result.current.columnWidths.project_topic).toBe(PROJECT_DEFAULT_WIDTHS.project_topic)
  })

  it('falls back to defaults when localStorage contains invalid JSON', () => {
    localStorage.setItem(PROJECT_COLUMN_LS_KEY, 'not-json')
    const { result } = renderHook(call)
    expect(result.current.columnWidths).toEqual(PROJECT_DEFAULT_WIDTHS)
  })
})

describe('useColumnResize — finalizeWidth', () => {
  it('clamps width to 60px minimum', () => {
    const { result } = renderHook(call)
    act(() => { result.current.finalizeWidth('project_name', 30) })
    expect(result.current.columnWidths.project_name).toBe(60)
  })

  it('updates width to the provided value when above minimum', () => {
    const { result } = renderHook(call)
    act(() => { result.current.finalizeWidth('project_name', 250) })
    expect(result.current.columnWidths.project_name).toBe(250)
  })

  it('does not affect other column widths', () => {
    const { result } = renderHook(call)
    act(() => { result.current.finalizeWidth('project_name', 250) })
    expect(result.current.columnWidths.project_topic).toBe(PROJECT_DEFAULT_WIDTHS.project_topic)
  })

  it('persists the new width to localStorage immediately', () => {
    const { result } = renderHook(call)
    act(() => { result.current.finalizeWidth('project_name', 260) })
    const stored = JSON.parse(localStorage.getItem(PROJECT_COLUMN_LS_KEY)!)
    expect(stored.project_name).toBe(260)
  })

  it('persists all column widths, not just the changed one', () => {
    const { result } = renderHook(call)
    act(() => { result.current.finalizeWidth('project_name', 260) })
    const stored = JSON.parse(localStorage.getItem(PROJECT_COLUMN_LS_KEY)!)
    expect(stored.project_topic).toBe(PROJECT_DEFAULT_WIDTHS.project_topic)
    expect(stored.project_status).toBe(PROJECT_DEFAULT_WIDTHS.project_status)
  })
})
