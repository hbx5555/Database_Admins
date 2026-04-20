interface ErrorStateProps {
  message: string
  onRetry: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: 200,
      gap: 12,
      color: 'var(--foreground-secondary)',
      fontFamily: 'var(--font-body)',
      fontSize: 13,
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: 24, color: 'var(--color-error)' }}>error</span>
      <span>{message}</span>
      <button
        onClick={onRetry}
        style={{
          padding: '6px 16px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-color)',
          background: 'var(--white)',
          color: 'var(--foreground-primary)',
          cursor: 'pointer',
          fontFamily: 'var(--font-body)',
          fontSize: 13,
        }}
      >
        Retry
      </button>
    </div>
  )
}
