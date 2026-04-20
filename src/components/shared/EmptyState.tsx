export function EmptyState() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: 200,
      gap: 8,
      color: 'var(--foreground-secondary)',
      fontFamily: 'var(--font-body)',
      fontSize: 13,
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: 32, opacity: 0.4 }}>folder_open</span>
      <span>No projects found</span>
    </div>
  )
}
