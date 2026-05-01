import { useState, useRef } from 'react'
import type { Project, ProjectInsert, ProjectUpdate, ProjectStatus } from '../../types/project'
import { COLUMN_LABELS } from '../../types/project'
import type { Deal } from '../../types/deal'
import { uploadDocument, deleteDocument } from '../../lib/storageApi'

const STATUS_OPTIONS: ProjectStatus[] = ['New', 'Started', 'Done']
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

const EMPTY_DRAFT: ProjectInsert = {
  project_name: '',
  project_topic: null,
  project_status: null,
  project_start_date: null,
  project_delivery_date: null,
  project_budget: null,
  spec_url: null,
  spec_filename: null,
  deal_id: null,
}

interface RecordEditorModalProps {
  row?: Project
  onSave: (id: string, changes: ProjectUpdate) => void
  onAdd: (data: ProjectInsert) => void
  onClose: () => void
  onViewDeal?: (deal: Deal) => void
}

export function RecordEditorModal({ row, onSave, onAdd, onClose, onViewDeal }: RecordEditorModalProps) {
  const isNew = !row
  const [draft, setDraft] = useState<ProjectInsert>(isNew ? { ...EMPTY_DRAFT } : {
    project_name: row.project_name,
    project_topic: row.project_topic,
    project_status: row.project_status,
    project_start_date: row.project_start_date,
    project_delivery_date: row.project_delivery_date,
    project_budget: row.project_budget,
    spec_url: row.spec_url,
    spec_filename: row.spec_filename,
    deal_id: row.deal_id,
  })
  const [focused, setFocused] = useState<string | null>(null)
  const [uploadingSpec, setUploadingSpec] = useState(false)
  const [uploadErrorSpec, setUploadErrorSpec] = useState<string | null>(null)
  const specFileInputRef = useRef<HTMLInputElement>(null)

  const set = <K extends keyof ProjectInsert>(key: K, val: ProjectInsert[K]) =>
    setDraft(d => ({ ...d, [key]: val }))

  const handleSave = async () => {
    if (isNew) {
      onAdd({ ...draft })
    } else {
      if (row.spec_filename && !draft.spec_filename) {
        try {
          await deleteDocument('projects', row.id, row.spec_filename)
        } catch {
          // Non-fatal
        }
      }
      const changes: ProjectUpdate = {}
      if (draft.project_name !== row.project_name) changes.project_name = draft.project_name
      if (draft.project_topic !== row.project_topic) changes.project_topic = draft.project_topic
      if (draft.project_status !== row.project_status) changes.project_status = draft.project_status
      if (draft.project_start_date !== row.project_start_date) changes.project_start_date = draft.project_start_date
      if (draft.project_delivery_date !== row.project_delivery_date) changes.project_delivery_date = draft.project_delivery_date
      if (draft.project_budget !== row.project_budget) changes.project_budget = draft.project_budget
      if (draft.spec_url !== row.spec_url) changes.spec_url = draft.spec_url
      if (draft.spec_filename !== row.spec_filename) changes.spec_filename = draft.spec_filename
      if (draft.deal_id !== row.deal_id) changes.deal_id = draft.deal_id
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
        {/* Close button */}
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

        {/* Accent bar */}
        <div style={{ width: 8, background: 'var(--accent-primary)', flexShrink: 0 }} />

        {/* Form */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', background: 'var(--white)' }}>

          <div style={{ height: 26, background: `linear-gradient(to right, var(--surface-primary) ${LABEL_W}px, #ffffff ${LABEL_W}px)` }} />

          {/* Field rows */}
          <FieldRow label={COLUMN_LABELS.project_name} fieldKey="project_name" focused={focused} bold>
            <input
              type="text"
              value={draft.project_name ?? ''}
              onChange={e => set('project_name', e.target.value)}
              onFocus={() => setFocused('project_name')}
              onBlur={() => setFocused(null)}
              style={inp('project_name')}
            />
          </FieldRow>

          <FieldRow label={COLUMN_LABELS.deal_id} fieldKey="deal" focused={focused}>
            {(() => {
              const deal = !isNew ? row?.deals ?? null : null
              if (deal) {
                return (
                  <button
                    type="button"
                    onClick={() => onViewDeal?.(deal)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 13, fontFamily: 'var(--font-body)', color: 'var(--accent-primary)', textDecoration: 'underline' }}
                  >
                    {deal.deal_name}
                  </button>
                )
              }
              return <span style={{ fontSize: 13, color: 'var(--foreground-secondary)', fontFamily: 'var(--font-body)' }}>—</span>
            })()}
          </FieldRow>

          <FieldRow label={COLUMN_LABELS.project_topic} fieldKey="project_topic" focused={focused}>
            <input
              type="text"
              value={draft.project_topic ?? ''}
              onChange={e => set('project_topic', e.target.value || null)}
              onFocus={() => setFocused('project_topic')}
              onBlur={() => setFocused(null)}
              style={inp('project_topic')}
            />
          </FieldRow>

          <FieldRow label={COLUMN_LABELS.project_status} fieldKey="project_status" focused={focused}>
            <select
              value={draft.project_status ?? ''}
              onChange={e => {
                const v = e.target.value
                set('project_status', STATUS_OPTIONS.includes(v as ProjectStatus) ? v as ProjectStatus : null)
              }}
              onFocus={() => setFocused('project_status')}
              onBlur={() => setFocused(null)}
              style={{ ...inp('project_status'), cursor: 'pointer' }}
            >
              <option value="">—</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </FieldRow>

          <FieldRow label={COLUMN_LABELS.spec_filename} fieldKey="spec_filename" focused={focused}>
            {isNew ? (
              <span style={{ fontSize: 12, color: 'var(--foreground-secondary)', fontFamily: 'var(--font-body)' }}>
                Save the project first to attach a spec
              </span>
            ) : uploadingSpec ? (
              <span style={{ fontSize: 13, color: 'var(--foreground-secondary)', fontFamily: 'var(--font-body)' }}>
                Uploading…
              </span>
            ) : draft.spec_filename ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
                <span style={{ fontSize: 13, fontFamily: 'var(--font-body)', color: 'var(--accent-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {draft.spec_filename}
                </span>
                <button
                  type="button"
                  onClick={() => { set('spec_url', null); set('spec_filename', null) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--foreground-secondary)', fontSize: 12, fontFamily: 'var(--font-body)', flexShrink: 0 }}
                >
                  Remove
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => specFileInputRef.current?.click()}
                  style={{ padding: '6px 14px', borderRadius: 'var(--radius-md)', background: 'transparent', border: '1.5px solid var(--border-color)', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-body)', color: 'var(--foreground-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>upload_file</span>
                  Choose file
                </button>
                <input
                  ref={specFileInputRef}
                  type="file"
                  style={{ display: 'none' }}
                  onChange={async e => {
                    const file = e.target.files?.[0]
                    if (!file || !row) return
                    setUploadingSpec(true)
                    setUploadErrorSpec(null)
                    try {
                      const { url, filename } = await uploadDocument('projects', row.id, file)
                      set('spec_url', url)
                      set('spec_filename', filename)
                    } catch (err) {
                      setUploadErrorSpec(err instanceof Error ? err.message : 'Upload failed')
                    } finally {
                      setUploadingSpec(false)
                      if (specFileInputRef.current) specFileInputRef.current.value = ''
                    }
                  }}
                />
                {uploadErrorSpec && (
                  <span style={{ fontSize: 12, color: '#C0392B', fontFamily: 'var(--font-body)' }}>{uploadErrorSpec}</span>
                )}
              </div>
            )}
          </FieldRow>

          <FieldRow label={COLUMN_LABELS.project_start_date} fieldKey="project_start_date" focused={focused}>
            <input
              type="date"
              value={draft.project_start_date ?? ''}
              onChange={e => set('project_start_date', e.target.value || null)}
              onFocus={() => setFocused('project_start_date')}
              onBlur={() => setFocused(null)}
              style={inp('project_start_date')}
            />
          </FieldRow>

          <FieldRow label={COLUMN_LABELS.project_delivery_date} fieldKey="project_delivery_date" focused={focused}>
            <input
              type="date"
              value={draft.project_delivery_date ?? ''}
              onChange={e => set('project_delivery_date', e.target.value || null)}
              onFocus={() => setFocused('project_delivery_date')}
              onBlur={() => setFocused(null)}
              style={inp('project_delivery_date')}
            />
          </FieldRow>

          <FieldRow label={COLUMN_LABELS.project_budget} fieldKey="project_budget" focused={focused}>
            <input
              type="number"
              min="0"
              step="0.01"
              value={draft.project_budget ?? ''}
              onChange={e => set('project_budget', e.target.value !== '' ? parseFloat(e.target.value) : null)}
              onFocus={() => setFocused('project_budget')}
              onBlur={() => setFocused(null)}
              style={{ ...inp('project_budget'), textAlign: 'right' }}
            />
          </FieldRow>

          {/* Action bar */}
          <div style={{ display: 'flex', borderTop: '1px solid var(--border-color)' }}>
            <div style={{ width: LABEL_W, flexShrink: 0, background: 'var(--surface-primary)' }} />
            <div style={{ flex: 1, padding: '16px 28px', display: 'flex', gap: 10, alignItems: 'center' }}>
              <button
                onClick={handleSave}
                disabled={uploadingSpec}
                style={{
                  padding: '8px 20px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--accent-primary)',
                  border: 'none',
                  cursor: uploadingSpec ? 'default' : 'pointer',
                  fontSize: 13, fontWeight: 600,
                  fontFamily: 'var(--font-body)',
                  color: 'var(--foreground-inverse)',
                  opacity: uploadingSpec ? 0.6 : 1,
                }}
              >
                {isNew ? 'Add Record' : 'Save Changes'}
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
