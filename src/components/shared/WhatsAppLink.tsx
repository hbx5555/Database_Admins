interface WhatsAppLinkProps {
  url: string | null
}

export function WhatsAppLink({ url }: WhatsAppLinkProps) {
  if (!url) return <span style={{ color: 'var(--foreground-secondary)', fontSize: 13 }}>—</span>
  const display = url.length > 30 ? url.slice(0, 30) + '…' : url
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        color: 'var(--accent-secondary)',
        fontSize: 13,
        textDecoration: 'none',
        fontFamily: 'var(--font-body)',
      }}
      onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
      onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
    >
      {display}
    </a>
  )
}
