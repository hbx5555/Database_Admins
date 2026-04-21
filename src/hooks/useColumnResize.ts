import { useState, useCallback, useRef } from 'react'

const LS_KEY = 'db-admins-column-widths'
const MIN_WIDTH = 60

export const DEFAULT_COLUMN_WIDTHS: Record<string, number> = {
  project_name: 200,
  project_topic: 160,
  project_status: 120,
  project_start_date: 120,
  project_delivery_date: 130,
  project_budget: 110,
}

function loadFromStorage(): Record<string, number> {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return { ...DEFAULT_COLUMN_WIDTHS }
    return { ...DEFAULT_COLUMN_WIDTHS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_COLUMN_WIDTHS }
  }
}

interface UseColumnResizeReturn {
  columnWidths: Record<string, number>
  startResize: (columnKey: string, startX: number, startWidth: number) => void
}

export function useColumnResize(): UseColumnResizeReturn {
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(loadFromStorage)

  const dragState = useRef<{ key: string; startX: number; startWidth: number } | null>(null)

  const startResize = useCallback((columnKey: string, startX: number, startWidth: number) => {
    dragState.current = { key: columnKey, startX, startWidth }

    const onMouseMove = (e: MouseEvent) => {
      if (!dragState.current) return
      const { key, startX: sx, startWidth: sw } = dragState.current
      const newWidth = Math.max(MIN_WIDTH, sw + (e.clientX - sx))
      setColumnWidths(prev => ({ ...prev, [key]: newWidth }))
    }

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      setColumnWidths(prev => {
        localStorage.setItem(LS_KEY, JSON.stringify(prev))
        return prev
      })
      dragState.current = null
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }, [])

  return { columnWidths, startResize }
}
