import { useRef, useState } from 'react'
import type { Deal, DealInsert, DealUpdate, DealStatus } from '../../types/deal'
import { DEAL_COLUMN_LABELS, DEAL_STATUS_OPTIONS } from '../../types/deal'
import type { Contact } from '../../types/contact'
import { uploadDocument, deleteDocument } from '../../lib/storageApi'

const LABEL_W = 180

interface FieldRowProps {
  label: string
  fieldKey: string
  focused: string | null
  bold?: boolean
  align?: 'center' | 'start'
  children: React.ReactNode
}

function FieldRow({ label, fieldKey, focused, bold, align = 'center', children }: FieldRowProps) {
  return (
    <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
      <div style={{
        width: LABEL_W, flexShrink: 0,
        background: 'var(--surface-primary)',
        display: 'flex', alignItems: align === 'start' ? 'flex-start' : 'center',
        justifyContent: 'flex-end',
        padding: align === 'start' ? '14px 20px 0' : '0 20px', minHeight: 52,
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
        display: 'flex', alignItems: align === 'start' ? 'flex-start' : 'center',
        background: 'var(--white)',
      }}>
        {children}
      </div>
    </div>
  )
}

const EMPTY_DRAFT: DealInsert = {
  deal_name: '',
  deal_description: null,
  last_call_content: null,
  last_call_datetime: null,
  proposal_url: null,
  proposal_filename: null,
  contract_url: null,
  contract_filename: null,
  status: null,
  contact_id: null,
}

interface DealEditorModalProps {
  row?: Deal
  onSave: (id: string, changes: DealUpdate) => void
  onAdd: (data: DealInsert) => void
  onClose: () => void
  onViewContact?: (contact: Contact) => void
}

export function DealEditorModal({ row, onSave, onAdd, onClose, onViewContact }: DealEditorModalProps) {
  const isNew = !row
  const [draft, setDraft] = useState<DealInsert>(isNew ? { ...EMPTY_DRAFT } : {
    deal_name: row.deal_name,
    deal_description: row.deal_description,
    last_call_content: row.last_call_content,
    last_call_datetime: row.last_call_datetime,
    proposal_url: row.proposal_url,
    proposal_filename: row.proposal_filename,
    contract_url: row.contract_url,
    contract_filename: row.contract_filename,
    status: row.status,
    contact_id: row.contact_id,
  })
  const [focused, setFocused] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingContract, setUploadingContract] = useState(false)
  const [uploadErrorContract, setUploadErrorContract] = useState<string | null>(null)
  const contractFileInputRef = useRef<HTMLInputElement>(null)

  const set = <K extends keyof DealInsert>(key: K, val: DealInsert[K]) =>
    setDraft(d => ({ ...d, [key]: val }))

  // Converts ISO string to value suitable for <input type="datetime-local"> using local timezone
  // so the displayed time matches what the user entered, not a UTC-shifted equivalent.
  const toDatetimeLocal = (iso: string | null): string => {
    if (!iso) return ''
    const d = new Date(iso)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  const handleSave = async () => {
    if (isNew) {
      onAdd({ ...draft })
    } else {
      if (row.proposal_filename && !draft.proposal_filename) {
        try {
          await deleteDocument('deals', row.id, row.proposal_filename)
        } catch {
          // Non-fatal — proceed with save even if storage delete fails
        }
      }
      if (row.contract_filename && !draft.contract_filename) {
        try {
          await deleteDocument('deals', row.id, row.contract_filename)
        } catch {
          // Non-fatal
        }
      }
      const changes: DealUpdate = {}
      if (draft.deal_name !== row.deal_name) changes.deal_name = draft.deal_name
      if (draft.deal_description !== row.deal_description) changes.deal_description = draft.deal_description
      if (draft.last_call_content !== row.last_call_content) changes.last_call_content = draft.last_call_content
      if (draft.last_call_datetime !== row.last_call_datetime) changes.last_call_datetime = draft.last_call_datetime
      if (draft.proposal_url !== row.proposal_url) changes.proposal_url = draft.proposal_url
      if (draft.proposal_filename !== row.proposal_filename) changes.proposal_filename = draft.proposal_filename
      if (draft.contract_url !== row.contract_url) changes.contract_url = draft.contract_url
      if (draft.contract_filename !== row.contract_filename) changes.contract_filename = draft.contract_filename
      if (draft.status !== row.status) changes.status = draft.status
      if (draft.contact_id !== row.contact_id) changes.contact_id = draft.contact_id
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

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ width: '100%', maxWidth: 680, borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: '0 16px 64px rgba(0,0,0,0.22)', display: 'flex', maxHeight: '90vh', position: 'relative' }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 10, right: 10, zIndex: 1, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--foreground-secondary)', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 'var(--radius-sm)' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
        </button>

        <div style={{ width: 8, background: 'var(--accent-primary)', flexShrink: 0 }} />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', background: 'var(--white)' }}>
          <div style={{ height: 26 }} />

          <FieldRow label={DEAL_COLUMN_LABELS.deal_name} fieldKey="deal_name" focused={focused} bold>
            <input
              type="text"
              value={draft.deal_name ?? ''}
              onChange={e => set('deal_name', e.target.value)}
              onFocus={() => setFocused('deal_name')}
              onBlur={() => setFocused(null)}
              style={inp('deal_name')}
            />
          </FieldRow>

          <FieldRow label="Contact" fieldKey="contact" focused={focused}>
            {(() => {
              const contact = !isNew ? row?.contacts ?? null : null
              if (contact) {
                const name = contact.full_name ?? ([contact.first_name, contact.last_name].filter(Boolean).join(' ') || '—')
                return (
                  <button
                    type="button"
                    onClick={() => onViewContact?.(contact)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 13, fontFamily: 'var(--font-body)', color: 'var(--accent-primary)', textDecoration: 'underline' }}
                  >
                    {name}
                  </button>
                )
              }
              return <span style={{ fontSize: 13, color: 'var(--foreground-secondary)', fontFamily: 'var(--font-body)' }}>—</span>
            })()}
          </FieldRow>

          <FieldRow label={DEAL_COLUMN_LABELS.deal_description} fieldKey="deal_description" focused={focused} align="start">
            <textarea
              value={draft.deal_description ?? ''}
              onChange={e => set('deal_description', e.target.value || null)}
              onFocus={() => setFocused('deal_description')}
              onBlur={() => setFocused(null)}
              rows={3}
              style={{ ...inp('deal_description'), resize: 'vertical' }}
            />
          </FieldRow>

          <FieldRow label={DEAL_COLUMN_LABELS.last_call_datetime} fieldKey="last_call_datetime" focused={focused}>
            <input
              type="datetime-local"
              value={toDatetimeLocal(draft.last_call_datetime)}
              onChange={e => set('last_call_datetime', e.target.value ? new Date(e.target.value).toISOString() : null)}
              onFocus={() => setFocused('last_call_datetime')}
              onBlur={() => setFocused(null)}
              style={inp('last_call_datetime')}
            />
          </FieldRow>

          <FieldRow label={DEAL_COLUMN_LABELS.last_call_content} fieldKey="last_call_content" focused={focused} align="start">
            <textarea
              value={draft.last_call_content ?? ''}
              onChange={e => set('last_call_content', e.target.value || null)}
              onFocus={() => setFocused('last_call_content')}
              onBlur={() => setFocused(null)}
              rows={4}
              style={{ ...inp('last_call_content'), resize: 'vertical' }}
            />
          </FieldRow>

          <FieldRow label={DEAL_COLUMN_LABELS.proposal_filename} fieldKey="proposal_filename" focused={focused}>
            {isNew ? (
              <span style={{ fontSize: 12, color: 'var(--foreground-secondary)', fontFamily: 'var(--font-body)' }}>
                Save the deal first to attach a proposal
              </span>
            ) : uploading ? (
              <span style={{ fontSize: 13, color: 'var(--foreground-secondary)', fontFamily: 'var(--font-body)' }}>
                Uploading…
              </span>
            ) : draft.proposal_filename ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
                <span style={{ fontSize: 13, fontFamily: 'var(--font-body)', color: 'var(--accent-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {draft.proposal_filename}
                </span>
                <button
                  type="button"
                  onClick={() => { set('proposal_url', null); set('proposal_filename', null) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--foreground-secondary)', fontSize: 12, fontFamily: 'var(--font-body)', flexShrink: 0 }}
                >
                  Remove
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ padding: '6px 14px', borderRadius: 'var(--radius-md)', background: 'transparent', border: '1.5px solid var(--border-color)', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-body)', color: 'var(--foreground-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>upload_file</span>
                  Choose file
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  style={{ display: 'none' }}
                  onChange={async e => {
                    const file = e.target.files?.[0]
                    if (!file || !row) return
                    setUploading(true)
                    setUploadError(null)
                    try {
                      const { url, filename } = await uploadDocument('deals', row.id, file)
                      set('proposal_url', url)
                      set('proposal_filename', filename)
                    } catch (err) {
                      setUploadError(err instanceof Error ? err.message : 'Upload failed')
                    } finally {
                      setUploading(false)
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }
                  }}
                />
                {uploadError && (
                  <span style={{ fontSize: 12, color: '#C0392B', fontFamily: 'var(--font-body)' }}>{uploadError}</span>
                )}
              </div>
            )}
          </FieldRow>

          <FieldRow label={DEAL_COLUMN_LABELS.contract_filename} fieldKey="contract_filename" focused={focused}>
            {isNew ? (
              <span style={{ fontSize: 12, color: 'var(--foreground-secondary)', fontFamily: 'var(--font-body)' }}>
                Save the deal first to attach a contract
              </span>
            ) : uploadingContract ? (
              <span style={{ fontSize: 13, color: 'var(--foreground-secondary)', fontFamily: 'var(--font-body)' }}>
                Uploading…
              </span>
            ) : draft.contract_filename ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
                <span style={{ fontSize: 13, fontFamily: 'var(--font-body)', color: 'var(--accent-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {draft.contract_filename}
                </span>
                <button
                  type="button"
                  onClick={() => { set('contract_url', null); set('contract_filename', null) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--foreground-secondary)', fontSize: 12, fontFamily: 'var(--font-body)', flexShrink: 0 }}
                >
                  Remove
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => contractFileInputRef.current?.click()}
                  style={{ padding: '6px 14px', borderRadius: 'var(--radius-md)', background: 'transparent', border: '1.5px solid var(--border-color)', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-body)', color: 'var(--foreground-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>upload_file</span>
                  Choose file
                </button>
                <input
                  ref={contractFileInputRef}
                  type="file"
                  style={{ display: 'none' }}
                  onChange={async e => {
                    const file = e.target.files?.[0]
                    if (!file || !row) return
                    setUploadingContract(true)
                    setUploadErrorContract(null)
                    try {
                      const { url, filename } = await uploadDocument('deals', row.id, file)
                      set('contract_url', url)
                      set('contract_filename', filename)
                    } catch (err) {
                      setUploadErrorContract(err instanceof Error ? err.message : 'Upload failed')
                    } finally {
                      setUploadingContract(false)
                      if (contractFileInputRef.current) contractFileInputRef.current.value = ''
                    }
                  }}
                />
                {uploadErrorContract && (
                  <span style={{ fontSize: 12, color: '#C0392B', fontFamily: 'var(--font-body)' }}>{uploadErrorContract}</span>
                )}
              </div>
            )}
          </FieldRow>

          <FieldRow label={DEAL_COLUMN_LABELS.status} fieldKey="status" focused={focused}>
            <select
              value={draft.status ?? ''}
              onChange={e => {
                const v = e.target.value
                set('status', DEAL_STATUS_OPTIONS.includes(v as DealStatus) ? v as DealStatus : null)
              }}
              onFocus={() => setFocused('status')}
              onBlur={() => setFocused(null)}
              style={{ ...inp('status'), cursor: 'pointer' }}
            >
              <option value="">—</option>
              {DEAL_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </FieldRow>

          <div style={{ display: 'flex', borderTop: '1px solid var(--border-color)' }}>
            <div style={{ width: LABEL_W, flexShrink: 0, background: 'var(--surface-primary)' }} />
            <div style={{ flex: 1, padding: '16px 28px', display: 'flex', gap: 10, alignItems: 'center' }}>
              <button
                onClick={handleSave}
                disabled={uploading || uploadingContract}
                style={{ padding: '8px 20px', borderRadius: 'var(--radius-md)', background: 'var(--accent-primary)', border: 'none', cursor: (uploading || uploadingContract) ? 'default' : 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)', color: 'var(--foreground-inverse)', opacity: (uploading || uploadingContract) ? 0.6 : 1 }}
              >
                {isNew ? 'Add Deal' : 'Save Changes'}
              </button>
              <button
                onClick={onClose}
                style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', background: 'transparent', color: 'var(--foreground-secondary)', border: '1.5px solid var(--border-color)', cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-body)' }}
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
