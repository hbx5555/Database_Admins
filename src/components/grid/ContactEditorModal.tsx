import { useState } from 'react'
import type { Contact, ContactInsert, ContactUpdate, ContactStatus } from '../../types/contact'
import { CONTACT_COLUMN_LABELS, CONTACT_STATUS_OPTIONS } from '../../types/contact'

const LABEL_W = 180

interface FieldRowProps {
  label: string
  fieldKey: string
  focused: string | null
  bold?: boolean
  children: React.ReactNode
}

function FieldRow({ label, fieldKey, focused, bold, children }: FieldRowProps) {
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
          color: focused === fieldKey ? 'var(--accent-primary)' : 'var(--foreground-secondary)',
          fontWeight: bold || focused === fieldKey ? 700 : 400,
          transition: 'color 0.15s',
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

const EMPTY_DRAFT: ContactInsert = {
  first_name: null,
  last_name: null,
  phone_number: null,
  email: null,
  role: null,
  location: null,
  status: null,
}

interface ContactEditorModalProps {
  row?: Contact
  onSave: (id: string, changes: ContactUpdate) => void
  onAdd: (data: ContactInsert) => void
  onClose: () => void
}

export function ContactEditorModal({ row, onSave, onAdd, onClose }: ContactEditorModalProps) {
  const isNew = !row
  const [draft, setDraft] = useState<ContactInsert>(isNew ? { ...EMPTY_DRAFT } : {
    first_name: row.first_name,
    last_name: row.last_name,
    phone_number: row.phone_number,
    email: row.email,
    role: row.role,
    location: row.location,
    status: row.status,
  })
  const [focused, setFocused] = useState<string | null>(null)

  const set = <K extends keyof ContactInsert>(key: K, val: ContactInsert[K]) =>
    setDraft(d => ({ ...d, [key]: val }))

  const handleSave = () => {
    if (isNew) {
      onAdd({ ...draft })
    } else {
      const changes: ContactUpdate = {}
      if (draft.first_name !== row.first_name) changes.first_name = draft.first_name
      if (draft.last_name !== row.last_name) changes.last_name = draft.last_name
      if (draft.phone_number !== row.phone_number) changes.phone_number = draft.phone_number
      if (draft.email !== row.email) changes.email = draft.email
      if (draft.role !== row.role) changes.role = draft.role
      if (draft.location !== row.location) changes.location = draft.location
      if (draft.status !== row.status) changes.status = draft.status
      if (Object.keys(changes).length > 0) onSave(row.id, changes)
    }
    onClose()
  }

  const inp = (key: string): React.CSSProperties => ({
    width: '100%',
    padding: '9px 12px',
    fontSize: 13,
    fontFamily: 'var(--font-body)',
    border: `1.5px solid ${focused === key ? 'var(--accent-primary)' : 'var(--border-color)'}`,
    borderRadius: 'var(--radius-md)',
    background: 'var(--white)',
    color: 'var(--foreground-primary)',
    outline: 'none',
    transition: 'border-color 0.15s',
  })

  const textField = (key: keyof ContactInsert, bold?: boolean) => (
    <FieldRow label={CONTACT_COLUMN_LABELS[key]} fieldKey={key} focused={focused} bold={bold}>
      <input
        type="text"
        value={(draft[key] as string) ?? ''}
        onChange={e => set(key, e.target.value || null)}
        onFocus={() => setFocused(key)}
        onBlur={() => setFocused(null)}
        style={inp(key)}
      />
    </FieldRow>
  )

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

        <div style={{ width: 8, background: 'var(--accent-primary)', flexShrink: 0 }} />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--white)', minHeight: 0 }}>
          <div style={{ height: 26, flexShrink: 0 }} />

          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>

          {textField('first_name', true)}
          {textField('last_name')}
          {textField('phone_number')}
          {textField('email')}
          {textField('role')}
          {textField('location')}

          <FieldRow label={CONTACT_COLUMN_LABELS.status} fieldKey="status" focused={focused}>
            <select
              value={draft.status ?? ''}
              onChange={e => {
                const v = e.target.value
                set('status', CONTACT_STATUS_OPTIONS.includes(v as ContactStatus) ? v as ContactStatus : null)
              }}
              onFocus={() => setFocused('status')}
              onBlur={() => setFocused(null)}
              style={{ ...inp('status'), cursor: 'pointer' }}
            >
              <option value="">—</option>
              {CONTACT_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </FieldRow>

          </div>

          <div style={{ display: 'flex', borderTop: '1px solid var(--border-color)', flexShrink: 0 }}>
            <div style={{ width: LABEL_W, flexShrink: 0, background: 'var(--surface-primary)' }} />
            <div style={{ flex: 1, padding: '16px 28px', display: 'flex', gap: 10, alignItems: 'center' }}>
              <button
                onClick={handleSave}
                style={{
                  padding: '8px 20px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--accent-primary)',
                  border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: 600,
                  fontFamily: 'var(--font-body)',
                  color: 'var(--foreground-inverse)',
                }}
              >
                {isNew ? 'Add Contact' : 'Save Changes'}
              </button>
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
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
