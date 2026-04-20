const NAV_ICONS = [
  { name: 'task_alt', label: 'Tasks', active: false },
  { name: 'folder', label: 'Projects', active: true },
  { name: 'person', label: 'Contacts', active: false },
  { name: 'leaderboard', label: 'Leads', active: false },
  { name: 'label', label: 'Statuses', active: false },
]

export function IconSidebar() {
  return (
    <div style={{
      width: 56,
      minHeight: '100vh',
      background: 'var(--accent-primary)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '16px 0',
      flexShrink: 0,
    }}>
      <button
        aria-label="Toggle menu"
        style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', marginBottom: 16, display: 'flex', alignItems: 'center' }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 28 }}>menu</span>
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        {NAV_ICONS.map(icon => (
          <button
            key={icon.name}
            title={icon.label}
            aria-label={icon.label}
            style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-md)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: icon.active ? 'var(--accent-secondary)' : 'transparent',
            }}
          >
            <span className="material-symbols-outlined" style={{
              fontSize: 24,
              color: icon.active ? 'white' : 'rgba(255,255,255,0.6)',
            }}>
              {icon.name}
            </span>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <button
          aria-label="Settings"
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', borderRadius: 'var(--radius-md)', padding: 4 }}
        >
          <span className="material-symbols-outlined" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 24 }}>settings</span>
        </button>
        <button
          aria-label="User profile"
          style={{
            width: 32,
            height: 32,
            borderRadius: 'var(--radius-round)',
            background: 'var(--accent-secondary)',
            color: 'white',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontFamily: 'var(--font-captions)',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          HD
        </button>
      </div>
    </div>
  )
}
