import type { ReactNode } from 'react'
import type { Deal, DealStatus } from '../../types/deal'
import { DEAL_COLUMN_LABELS, DEAL_STATUS_COLORS } from '../../types/deal'

const LABEL_W = 180

interface FieldRowProps {
  label: string
  bold?: boolean
  children: ReactNode
}

function FieldRow({ label, bold, children }: FieldRowProps) {
  return (
    <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
      <div style={{
        width: LABEL_W, flexShrink: 0,
        background: 'var(--surface-primary)',
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        padding: '0 20px', minHeight: 52,
      }}>
        <span style={{
          fontSize: 13, fontFamily: 'var(--font-body)',
          color: 'var(--foreground-secondary)',
          fontWeight: bold ? 700 : 400,
        }}>
          {label}
        </span>
      </div>
      <div style={{
        flex: 1, padding: '8px 28px',
        display: 'flex', alignItems: 'center',
        background: 'var(--white)',
      }}>
        {children}
      </div>
    </div>
  )
}

function renderField(value: string | null) {
  if (!value) return <span style={{ color: 'var(--foreground-secondary)', fontSize: 13, fontFamily: 'var(--font-body)' }}>—</span>
  return <span style={{ color: 'var(--foreground-primary)', fontSize: 13, fontFamily: 'var(--font-body)' }}>{value}</span>
}

function renderStatus(status: DealStatus | null) {
  if (!status) return <span style={{ color: 'var(--foreground-secondary)', fontSize: 13, fontFamily: 'var(--font-body)' }}>—</span>
  const colors = DEAL_STATUS_COLORS[status]
  return (
    <span style={{
      padding: '2px 10px',
      borderRadius: 'var(--radius-pill)',
      fontSize: 13, fontFamily: 'var(--font-captions)', fontWeight: 500,
      background: colors.bg, color: colors.text,
    }}>
      {status}
    </span>
  )
}

interface DealViewModalProps {
  deal: Deal
  onClose: () => void
}

export function DealViewModal({ deal, onClose }: DealViewModalProps) {
  const contactName = deal.contacts
    ? (deal.contacts.full_name ?? ([deal.contacts.first_name, deal.contacts.last_name].filter(Boolean).join(' ') || '—'))
    : '—'

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 500,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        width: '100%', maxWidth: 680,
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: '0 16px 64px rgba(0,0,0,0.22)',
        display: 'flex',
        maxHeight: '90vh',
        position: 'relative',
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 10, right: 10, zIndex: 1,
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--foreground-secondary)',
            display: 'flex', alignItems: 'center', padding: 4,
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
        </button>

        <div style={{ width: 8, background: 'var(--foreground-secondary)', flexShrink: 0 }} />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--white)', minHeight: 0 }}>
          <div style={{ height: 26, flexShrink: 0, background: `linear-gradient(to right, var(--surface-primary) ${LABEL_W}px, var(--white) ${LABEL_W}px)` }} />

          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>

          <FieldRow label={DEAL_COLUMN_LABELS.deal_name} bold>
            {renderField(deal.deal_name)}
          </FieldRow>

          <FieldRow label={DEAL_COLUMN_LABELS.contact_id}>
            {renderField(contactName)}
          </FieldRow>

          <FieldRow label={DEAL_COLUMN_LABELS.deal_description}>
            {renderField(deal.deal_description)}
          </FieldRow>

          <FieldRow label={DEAL_COLUMN_LABELS.last_call_datetime}>
            {renderField(
              deal.last_call_datetime
                ? new Date(deal.last_call_datetime).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
                : null
            )}
          </FieldRow>

          <FieldRow label={DEAL_COLUMN_LABELS.last_call_content}>
            {renderField(deal.last_call_content)}
          </FieldRow>

          <FieldRow label={DEAL_COLUMN_LABELS.proposal_filename}>
            {deal.proposal_url && deal.proposal_filename ? (
              <a
                href={deal.proposal_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'block', fontSize: 13, color: 'var(--accent-primary)', fontFamily: 'var(--font-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}
              >
                {deal.proposal_filename}
              </a>
            ) : (
              renderField(null)
            )}
          </FieldRow>

          <FieldRow label={DEAL_COLUMN_LABELS.contract_filename}>
            {deal.contract_url && deal.contract_filename ? (
              <a
                href={deal.contract_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'block', fontSize: 13, color: 'var(--accent-primary)', fontFamily: 'var(--font-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}
              >
                {deal.contract_filename}
              </a>
            ) : (
              renderField(null)
            )}
          </FieldRow>

          <FieldRow label={DEAL_COLUMN_LABELS.status}>
            {renderStatus(deal.status)}
          </FieldRow>

          </div>

          <div style={{ display: 'flex', borderTop: '1px solid var(--border-color)', flexShrink: 0 }}>
            <div style={{ width: LABEL_W, flexShrink: 0, background: 'var(--surface-primary)' }} />
            <div style={{ flex: 1, padding: '16px 28px', display: 'flex', gap: 10, alignItems: 'center' }}>
              <button
                onClick={onClose}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'transparent',
                  color: 'var(--foreground-secondary)',
                  border: '1.5px solid var(--border-color)',
                  cursor: 'pointer',
                  fontSize: 13, fontWeight: 500,
                  fontFamily: 'var(--font-body)',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
