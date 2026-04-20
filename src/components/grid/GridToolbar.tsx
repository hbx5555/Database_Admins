interface GridToolbarProps {
  onRefresh: () => void
}

export function GridToolbar({ onRefresh }: GridToolbarProps) {
  const divider = (
    <div style={{ width: 1, height: 20, background: 'var(--border-color)', margin: '0 4px' }} />
  )

  return (
    <div style={{
      height: 52,
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      borderBottom: '1px solid var(--border-color)',
      gap: 12,
    }}>
      {/* Left side */}
      <input
        type="checkbox"
        style={{ width: 20, height: 20, borderRadius: 3, cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
      />
      {divider}
      <button
        onClick={onRefresh}
        title="Refresh"
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--foreground-secondary)', display: 'flex', alignItems: 'center' }}
      >
        <span className="material-symbols-outlined">refresh</span>
      </button>
      <button
        title="More options"
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--foreground-secondary)', display: 'flex', alignItems: 'center' }}
      >
        <span className="material-symbols-outlined">more_vert</span>
      </button>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Right side */}
      {divider}
      <button
        title="View"
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--foreground-secondary)', display: 'flex', alignItems: 'center' }}
      >
        <span className="material-symbols-outlined">view_headline</span>
      </button>
      <button
        title="Filter & Sort"
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--foreground-secondary)', display: 'flex', alignItems: 'center' }}
      >
        <span className="material-symbols-outlined">tune</span>
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
      }}>
        HD
      </div>
    </div>
  )
}
