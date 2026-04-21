import { useState, useCallback, useRef, useEffect } from 'react'

export const LS_KEY = 'db-admins-column-widths'
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
    const parsed = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return { ...DEFAULT_COLUMN_WIDTHS }
    }
    const safe = Object.fromEntries(
      Object.entries(parsed).filter(([, v]) => typeof v === 'number')
    ) as Record<string, number>
    return { ...DEFAULT_COLUMN_WIDTHS, ...safe }
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
  const listenersRef = useRef<{ move: (e: MouseEvent) => void; up: () => void } | null>(null)

  useEffect(() => {
    return () => {
      if (listenersRef.current) {
        window.removeEventListener('mousemove', listenersRef.current.move)
        window.removeEventListener('mouseup', listenersRef.current.up)
        listenersRef.current = null
      }
    }
  }, [])

  const startResize = useCallback((columnKey: string, startX: number, startWidth: number) => {
    if (listenersRef.current) {
      window.removeEventListener('mousemove', listenersRef.current.move)
      window.removeEventListener('mouseup', listenersRef.current.up)
      listenersRef.current = null
    }

    dragState.current = { key: columnKey, startX, startWidth }
    let latestWidths: Record<string, number> | null = null

    const onMouseMove = (e: MouseEvent) => {
      if (!dragState.current) return
      const { key, startX: sx, startWidth: sw } = dragState.current
      const newWidth = Math.max(MIN_WIDTH, sw + (e.clientX - sx))
      setColumnWidths(prev => {
        const next = { ...prev, [key]: newWidth }
        latestWidths = next
        return next
      })
    }

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      listenersRef.current = null
      dragState.current = null
      if (latestWidths) {
        localStorage.setItem(LS_KEY, JSON.stringify(latestWidths))
      }
    }

    listenersRef.current = { move: onMouseMove, up: onMouseUp }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }, [])

  return { columnWidths, startResize }
}
