import { useRef, useEffect } from 'react'

interface GridToolbarProps {
  onRefresh: () => void
  selectedCount: number
  totalCount: number
  onSelectAll: () => void
  onClearAll: () => void
}

export function GridToolbar({ onRefresh, selectedCount, totalCount, onSelectAll, onClearAll }: GridToolbarProps) {
  const checkboxRef = useRef<HTMLInputElement>(null)
  const isAllSelected = selectedCount === totalCount && totalCount > 0
  const isIndeterminate = selectedCount > 0 && selectedCount < totalCount

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = isIndeterminate
    }
  }, [isIndeterminate])

  const handleChange = () => {
    if (isAllSelected) onClearAll(); else onSelectAll()
  }

  const iconBtn = { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--foreground-secondary)', display: 'flex', alignItems: 'center' }

  return (
    <div style={{
      height: 52,
      display: 'flex',
      alignItems: 'center',
      borderBottom: '1px solid var(--border-color)',
    }}>
      {/* Refresh — 40px section matching the DSG row-number gutter width */}
      <div style={{ width: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <button onClick={onRefresh} title="Refresh" style={iconBtn}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>refresh</span>
        </button>
      </div>

      {/* Select-all checkbox — 48px section matching the checkbox column width */}
      <div style={{ width: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <input
          ref={checkboxRef}
          type="checkbox"
          aria-label="Select all rows"
          checked={isAllSelected}
          onChange={handleChange}
          style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
        />
      </div>

      {/* 3-dots — immediately right of checkbox */}
      <button title="More options" style={iconBtn}>
        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>more_vert</span>
      </button>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Right side */}
      <div style={{ width: 1, height: 20, background: 'var(--border-color)', margin: '0 4px' }} />
      <button title="View" style={iconBtn}>
        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>view_headline</span>
      </button>
      <button title="Filter & Sort" style={{ ...iconBtn, marginRight: 8 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>tune</span>
      </button>
      <div style={{
        width: 32,
        height: 32,
        borderRadius: 'var(--radius-pill)',
        background: 'var(--accent-secondary)',
        color: 'var(--foreground-inverse)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        fontFamily: 'var(--font-captions)',
        fontWeight: 600,
        cursor: 'pointer',
        marginRight: 20,
      }}>
        HD
      </div>
    </div>
  )
}
