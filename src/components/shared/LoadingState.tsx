export function LoadingState() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: 200,
      color: 'var(--foreground-secondary)',
      fontFamily: 'var(--font-captions)',
      fontSize: 13,
      gap: 8,
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: 20, animation: 'spin 1s linear infinite' }}>
        progress_activity
      </span>
      Loading projects…
    </div>
  )
}
