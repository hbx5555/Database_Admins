import { STATUS_OPTIONS, type ProjectStatus } from '../../types/project'

interface SubItemsPanelProps {
  totalCount: number
  onAddItem: () => void
  activeStatusFilter: ProjectStatus | null
  onStatusChange: (status: ProjectStatus | null) => void
}

function filterButtonStyle(active: boolean) {
  return {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 12px',
    borderRadius: active ? 'var(--radius-round)' : 'var(--radius-sm)',
    background: active ? 'var(--surface-secondary)' : 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: active ? 'var(--foreground-primary)' : 'var(--foreground-secondary)',
    fontFamily: 'var(--font-body)',
    fontSize: 13,
    fontWeight: active ? 600 : 400,
    textAlign: 'left' as const,
    width: '100%',
  }
}

export function SubItemsPanel({ totalCount, onAddItem, activeStatusFilter, onStatusChange }: SubItemsPanelProps) {
  const isAll = activeStatusFilter === null

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      background: 'var(--surface-panel)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
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

      <div style={{ padding: '4px 8px 8px' }}>
        <button
          onClick={onAddItem}
          aria-label="Add new item"
          style={{
            width: '100%',
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
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
          Edit Item
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 8px' }}>
        <button
          aria-label="All"
          aria-current={isAll ? 'page' : undefined}
          onClick={() => onStatusChange(null)}
          style={filterButtonStyle(isAll)}
        >
          All
        </button>

        {STATUS_OPTIONS.map(status => {
          const active = activeStatusFilter === status
          return (
            <button
              key={status}
              aria-label={status}
              aria-current={active ? 'page' : undefined}
              onClick={() => onStatusChange(status)}
              style={filterButtonStyle(active)}
            >
              {status}
            </button>
          )
        })}
      </div>
    </div>
  )
}
