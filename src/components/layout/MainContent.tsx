import type { ReactNode } from 'react'

interface MainContentProps {
  children: ReactNode
}

export function MainContent({ children }: MainContentProps) {
  return (
    <div style={{
      flex: 1,
      padding: 16,
      minHeight: '100vh',
      background: 'var(--page-background)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {children}
    </div>
  )
}
