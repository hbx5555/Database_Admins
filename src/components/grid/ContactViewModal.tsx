import type { ReactNode } from 'react'
import type { Contact, ContactStatus } from '../../types/contact'
import { CONTACT_COLUMN_LABELS, CONTACT_STATUS_COLORS } from '../../types/contact'

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
          fontSize: 12, fontFamily: 'var(--font-body)',
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
  if (value === null || value === '') return <span style={{ color: 'var(--foreground-primary)', fontSize: 13, fontFamily: 'var(--font-body)' }}>—</span>
  return <span style={{ color: 'var(--foreground-primary)', fontSize: 13, fontFamily: 'var(--font-body)' }}>{value}</span>
}

function renderStatus(status: ContactStatus | null) {
  if (!status) return <span style={{ color: 'var(--foreground-primary)', fontSize: 13, fontFamily: 'var(--font-body)' }}>—</span>
  const colors = CONTACT_STATUS_COLORS[status]
  return (
    <span style={{
      padding: '2px 10px',
      borderRadius: 'var(--radius-pill)',
      fontSize: 12,
      fontFamily: 'var(--font-captions)',
      fontWeight: 500,
      background: colors.bg,
      color: colors.text,
    }}>
      {status}
    </span>
  )
}

interface ContactViewModalProps {
  contact: Contact
  onClose: () => void
}

export function ContactViewModal({ contact, onClose }: ContactViewModalProps) {
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

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', background: 'var(--white)' }}>
          <div style={{ height: 26, background: `linear-gradient(to right, var(--surface-primary) ${LABEL_W}px, #ffffff ${LABEL_W}px)` }} />

          <FieldRow label={CONTACT_COLUMN_LABELS.first_name} bold>
            {renderField(contact.first_name)}
          </FieldRow>

          <FieldRow label={CONTACT_COLUMN_LABELS.last_name}>
            {renderField(contact.last_name)}
          </FieldRow>

          <FieldRow label={CONTACT_COLUMN_LABELS.phone_number}>
            {renderField(contact.phone_number)}
          </FieldRow>

          <FieldRow label={CONTACT_COLUMN_LABELS.email}>
            {renderField(contact.email)}
          </FieldRow>

          <FieldRow label={CONTACT_COLUMN_LABELS.role}>
            {renderField(contact.role)}
          </FieldRow>

          <FieldRow label={CONTACT_COLUMN_LABELS.location}>
            {renderField(contact.location)}
          </FieldRow>

          <FieldRow label={CONTACT_COLUMN_LABELS.status}>
            {renderStatus(contact.status)}
          </FieldRow>

          <div style={{ display: 'flex', borderTop: '1px solid var(--border-color)' }}>
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
