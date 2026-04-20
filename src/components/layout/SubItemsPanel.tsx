const FILTER_VIEWS = [
  { label: 'All', icon: 'inbox', active: true },
  { label: 'New', icon: 'send', active: false },
  { label: 'Urgent', icon: 'drafts', active: false },
  { label: 'Starred', icon: 'star', active: false },
  { label: 'Archived', icon: 'archive', active: false },
]

interface SubItemsPanelProps {
  totalCount: number
  onAddItem: () => void
}

export function SubItemsPanel({ totalCount, onAddItem }: SubItemsPanelProps) {
  return (
    <div style={{
      width: 200,
      minHeight: '100vh',
      background: '#fffbf1',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      padding: '16px 0',
    }}>
      <div style={{ padding: '0 16px 8px' }}>
        <div style={{ fontFamily: 'var(--font-headings)', fontSize: 16, fontWeight: 700, color: 'var(--foreground-primary)' }}>
          Projects
        </div>
        <div style={{ fontFamily: 'var(--font-captions)', fontSize: 12, color: 'var(--foreground-secondary)' }}>
          {totalCount.toLocaleString()}
        </div>
      </div>

      <div style={{ padding: '4px 16px 8px' }}>
        <button
          onClick={onAddItem}
          style={{
            width: 175,
            height: 34,
            borderRadius: 'var(--radius-round)',
            background: 'var(--accent-primary)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            fontWeight: 600,
            boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
          Add Item
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 8px' }}>
        {FILTER_VIEWS.map(view => (
          <button
            key={view.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              borderRadius: view.active ? 'var(--radius-round)' : 'var(--radius-sm)',
              background: view.active ? 'var(--surface-secondary)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: view.active ? 'var(--foreground-primary)' : 'var(--foreground-secondary)',
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              fontWeight: view.active ? 600 : 400,
              textAlign: 'left',
              width: '100%',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{view.icon}</span>
            {view.label}
          </button>
        ))}
      </div>
    </div>
  )
}
