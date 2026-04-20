import React from 'react'
import type { PaginationState } from '../../types/project'

interface GridStatusBarProps {
  pagination: PaginationState
  onPageChange: (page: number) => void
}

const btnBase: React.CSSProperties = {
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
  const showing = Math.min(total, pageSize)

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
        Showing {showing} of {total} records
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button
          style={{ ...btnBase, opacity: page <= 1 ? 0.4 : 1 }}
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          Previous
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
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
        ))}

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
