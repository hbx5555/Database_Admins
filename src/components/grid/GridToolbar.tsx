import { useRef, useEffect, useState } from 'react'

interface GridToolbarProps {
  onRefresh: () => void
  selectedCount: number
  totalCount: number
  onSelectAll: () => void
  onClearAll: () => void
  onDeleteSelected: () => void
  searchQuery: string
  onSearchChange: (q: string) => void
  viewMode: 'grid' | 'kanban'
  onViewModeChange: (mode: 'grid' | 'kanban') => void
}

export function GridToolbar({ onRefresh, selectedCount, totalCount, onSelectAll, onClearAll, onDeleteSelected, searchQuery, onSearchChange, viewMode, onViewModeChange }: GridToolbarProps) {
  const checkboxRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const isAllSelected = selectedCount === totalCount && totalCount > 0
  const isIndeterminate = selectedCount > 0 && selectedCount < totalCount
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = isIndeterminate
    }
  }, [isIndeterminate])

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const handleChange = () => {
    if (isAllSelected) onClearAll(); else onSelectAll()
  }

  const handleDelete = () => {
    if (selectedCount === 0) return
    onDeleteSelected()
    setMenuOpen(false)
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
      <div
        style={{ width: 48, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}
        onClick={handleChange}
      >
        <input
          ref={checkboxRef}
          type="checkbox"
          aria-label="Select all rows"
          checked={isAllSelected}
          readOnly
          style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--accent-primary)', pointerEvents: 'none' }}
        />
      </div>

      {/* 3-dots with dropdown */}
      <div ref={menuRef} style={{ position: 'relative' }}>
        <button
          title="More options"
          style={iconBtn}
          onClick={() => setMenuOpen(o => !o)}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>more_vert</span>
        </button>

        {menuOpen && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            zIndex: 200,
            background: 'var(--white)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
            minWidth: 160,
            padding: '4px 0',
          }}>
            <button
              onClick={handleDelete}
              style={{
                width: '100%',
                padding: '8px 14px',
                background: 'none',
                border: 'none',
                textAlign: 'left',
                cursor: selectedCount > 0 ? 'pointer' : 'default',
                color: selectedCount > 0 ? '#C0392B' : 'var(--foreground-secondary)',
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                opacity: selectedCount > 0 ? 1 : 0.45,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
              Delete{selectedCount > 0 ? ` (${selectedCount})` : ''}
            </button>
          </div>
        )}
      </div>

      {/* View mode toggle */}
      <button
        onClick={() => onViewModeChange(viewMode === 'grid' ? 'kanban' : 'grid')}
        title={viewMode === 'grid' ? 'Switch to Kanban view' : 'Switch to Grid view'}
        style={{
          ...iconBtn,
          color: viewMode === 'kanban' ? 'var(--accent-primary)' : 'var(--foreground-secondary)',
          marginLeft: 4,
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
          {viewMode === 'grid' ? 'view_kanban' : 'table_rows'}
        </span>
      </button>

      {/* Search */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginLeft: 16 }}>
        <span className="material-symbols-outlined" style={{
          position: 'absolute', left: 8, fontSize: 15,
          color: 'var(--foreground-secondary)', pointerEvents: 'none',
        }}>search</span>
        <input
          type="text"
          placeholder="Search…"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          style={{
            paddingLeft: 28, paddingRight: searchQuery ? 24 : 10,
            height: 28, width: 180,
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-pill)',
            fontFamily: 'var(--font-body)', fontSize: 12,
            color: 'var(--foreground-primary)',
            background: 'var(--surface-primary)',
            outline: 'none',
          }}
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            style={{
              position: 'absolute', right: 6,
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              display: 'flex', alignItems: 'center',
              color: 'var(--foreground-secondary)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
          </button>
        )}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Right side */}
      <div style={{ width: 1, height: 20, background: 'var(--border-color)', margin: '0 12px' }} />
      <button title="Help" style={{ ...iconBtn, marginRight: 16 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 30 }}>help</span>
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
