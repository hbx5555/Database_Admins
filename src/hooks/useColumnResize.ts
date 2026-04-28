import { useState, useCallback, useRef, useEffect } from 'react'

export const MIN_WIDTH = 60

export const PROJECT_COLUMN_LS_KEY = 'db-admins-project-widths'
export const CONTACT_COLUMN_LS_KEY = 'db-admins-contact-widths'

export const PROJECT_DEFAULT_WIDTHS: Record<string, number> = {
  project_name: 200,
  project_topic: 160,
  project_status: 120,
  project_start_date: 120,
  project_delivery_date: 130,
  project_budget: 110,
}

export const CONTACT_DEFAULT_WIDTHS: Record<string, number> = {
  full_name: 180,
  phone_number: 140,
  email: 180,
  role: 120,
  location: 130,
}

export const DEAL_COLUMN_LS_KEY = 'db-admins-deal-widths'

export const DEAL_DEFAULT_WIDTHS: Record<string, number> = {
  contact: 140,
  deal_name: 200,
  deal_description: 220,
  last_call_datetime: 160,
  proposal_filename: 160,
  status: 130,
}

function loadFromStorage(storageKey: string, defaults: Record<string, number>): Record<string, number> {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return { ...defaults }
    const parsed = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return { ...defaults }
    const safe = Object.fromEntries(
      Object.entries(parsed).filter(([, v]) => typeof v === 'number')
    ) as Record<string, number>
    return { ...defaults, ...safe }
  } catch {
    return { ...defaults }
  }
}

interface UseColumnResizeReturn {
  columnWidths: Record<string, number>
  finalizeWidth: (key: string, width: number) => void
}

export function useColumnResize(storageKey: string, defaults: Record<string, number>): UseColumnResizeReturn {
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(
    () => loadFromStorage(storageKey, defaults)
  )

  const widthsRef = useRef(columnWidths)
  useEffect(() => { widthsRef.current = columnWidths }, [columnWidths])

  const finalizeWidth = useCallback((key: string, width: number) => {
    const next = { ...widthsRef.current, [key]: Math.max(MIN_WIDTH, width) }
    localStorage.setItem(storageKey, JSON.stringify(next))
    setColumnWidths(next)
  }, [storageKey])

  return { columnWidths, finalizeWidth }
}
