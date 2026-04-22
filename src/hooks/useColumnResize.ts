import { useState, useCallback, useRef, useEffect } from 'react'

export const LS_KEY = 'db-admins-column-widths'
export const MIN_WIDTH = 60

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
  finalizeWidth: (key: string, width: number) => void
}

export function useColumnResize(): UseColumnResizeReturn {
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(loadFromStorage)

  // widthsRef lets finalizeWidth read latest widths synchronously without stale closure
  const widthsRef = useRef(columnWidths)
  useEffect(() => { widthsRef.current = columnWidths }, [columnWidths])

  const finalizeWidth = useCallback((key: string, width: number) => {
    const next = { ...widthsRef.current, [key]: Math.max(MIN_WIDTH, width) }
    localStorage.setItem(LS_KEY, JSON.stringify(next))
    setColumnWidths(next)
  }, [])

  return { columnWidths, finalizeWidth }
}
