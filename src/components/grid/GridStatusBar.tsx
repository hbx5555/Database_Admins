import type { CSSProperties } from 'react'
import type { PaginationState } from '../../types/project'

interface GridStatusBarProps {
  pagination: PaginationState
  onPageChange: (page: number) => void
}

function getPageWindow(current: number, total: number): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | null)[] = []
  const addPage = (p: number) => { if (!pages.includes(p)) pages.push(p) }
  const addEllipsis = () => { if (pages[pages.length - 1] !== null) pages.push(null) }

  addPage(1)
  if (current > 3) addEllipsis()
  for (let p = Math.max(2, current - 2); p <= Math.min(total - 1, current + 2); p++) addPage(p)
  if (current < total - 2) addEllipsis()
  addPage(total)

  return pages
}

const btnBase: CSSProperties = {
  padding: '6px 14px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border-color)',
  background: 'var(--white)',
  color: 'var(--foreground-primary)',
  cursor: 'pointer',
  fontFamily: 'var(--font-captions)',
  fontSize: 12,
}

export function GridStatusBar({ pagination, onPageChange }: GridStatusBarProps) {
  const { page, pageSize, total } = pagination
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  return (
    <div style={{
      height: 44,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      background: 'var(--surface-primary)',
      borderTop: '1px solid var(--border-color)',
      borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
    }}>
      <span style={{ fontFamily: 'var(--font-captions)', fontSize: 12, color: 'var(--foreground-secondary)' }}>
        {total === 0 ? 'No records' : `Showing ${start}–${end} of ${total} records`}
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button
          style={{ ...btnBase, opacity: page <= 1 ? 0.4 : 1 }}
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          Previous
        </button>

        {getPageWindow(page, totalPages).map((p, i) =>
          p === null ? (
            <span key={`ellipsis-${i}`} style={{ padding: '0 4px', color: 'var(--foreground-secondary)', fontSize: 12 }}>…</span>
          ) : (
            <button
              key={p}
              style={{
                ...btnBase,
                width: 32,
                height: 32,
                padding: 0,
                background: p === page ? 'var(--accent-primary)' : 'var(--white)',
                color: p === page ? 'var(--foreground-inverse)' : 'var(--foreground-primary)',
                border: p === page ? 'none' : '1px solid var(--border-color)',
              }}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          )
        )}

        <button
          style={{ ...btnBase, opacity: page >= totalPages ? 0.4 : 1 }}
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Next
        </button>
      </div>
    </div>
  )
}
