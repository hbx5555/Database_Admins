import type { ProjectStatus } from '../../types/project'
import { STATUS_COLORS } from '../../types/project'

interface RolePillProps {
  status: ProjectStatus | null
}

export function RolePill({ status }: RolePillProps) {
  if (!status) return <span style={{ color: 'var(--foreground-secondary)', fontSize: 'var(--font-size-sm)' }}>—</span>
  const { bg, text } = STATUS_COLORS[status]
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 'var(--radius-pill)',
      backgroundColor: bg,
      color: text,
      fontSize: 13,
      fontFamily: 'var(--font-captions)',
      fontWeight: 500,
      lineHeight: '20px',
      whiteSpace: 'nowrap',
    }}>
      {status}
    </span>
  )
}
