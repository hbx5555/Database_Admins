import { useState } from 'react'
import type { Project, ProjectUpdate, ProjectStatus } from '../../types/project'
import { COLUMN_LABELS } from '../../types/project'

const STATUS_OPTIONS: ProjectStatus[] = ['New', 'Started', 'Done']
const LABEL_W = 180

interface FieldRowProps {
  label: string
  fieldKey: string
  focused: string | null
  children: React.ReactNode
}

function FieldRow({ label, fieldKey, focused, children }: FieldRowProps) {
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
          fontWeight: focused === fieldKey ? 600 : 400,
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

interface RecordEditorModalProps {
  row: Project
  onSave: (id: string, changes: ProjectUpdate) => void
  onClose: () => void
}

export function RecordEditorModal({ row, onSave, onClose }: RecordEditorModalProps) {
  const [draft, setDraft] = useState<Project>({ ...row })
  const [focused, setFocused] = useState<string | null>(null)

  const isDirty = JSON.stringify(draft) !== JSON.stringify(row)

  const set = <K extends keyof Project>(key: K, val: Project[K]) =>
    setDraft(d => ({ ...d, [key]: val }))

  const handleSave = () => {
    const changes: ProjectUpdate = {}
    if (draft.project_name !== row.project_name) changes.project_name = draft.project_name
    if (draft.project_topic !== row.project_topic) changes.project_topic = draft.project_topic
    if (draft.project_status !== row.project_status) changes.project_status = draft.project_status
    if (draft.project_start_date !== row.project_start_date) changes.project_start_date = draft.project_start_date
    if (draft.project_delivery_date !== row.project_delivery_date) changes.project_delivery_date = draft.project_delivery_date
    if (draft.project_budget !== row.project_budget) changes.project_budget = draft.project_budget
    if (Object.keys(changes).length > 0) onSave(row.id, changes)
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
      }}>
        {/* Accent bar */}
        <div style={{ width: 8, background: 'var(--accent-primary)', flexShrink: 0 }} />

        {/* Form */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', background: 'var(--white)' }}>

          {/* Title row */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', position: 'relative' }}>
            <div style={{ width: LABEL_W, flexShrink: 0, background: 'var(--surface-primary)' }} />
            <div style={{ flex: 1, padding: '24px 28px 18px' }}>
              <input
                value={draft.project_name ?? ''}
                onChange={e => set('project_name', e.target.value)}
                onFocus={() => setFocused('project_name')}
                onBlur={() => setFocused(null)}
                placeholder="Project name"
                style={{
                  fontSize: 20,
                  fontFamily: 'var(--font-headings)',
                  fontWeight: 600,
                  color: 'var(--foreground-primary)',
                  border: 'none',
                  borderBottom: `2px solid ${focused === 'project_name' ? 'var(--accent-primary)' : 'transparent'}`,
                  outline: 'none',
                  background: 'transparent',
                  width: '100%',
                  paddingBottom: 4,
                  transition: 'border-color 0.15s',
                }}
              />
            </div>
            <button
              onClick={onClose}
              style={{
                position: 'absolute', top: 12, right: 12,
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--foreground-secondary)',
                display: 'flex', alignItems: 'center', padding: 4,
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
            </button>
          </div>

          {/* Field rows */}
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
                style={{
                  padding: '8px 20px',
                  borderRadius: 'var(--radius-md)',
                  background: isDirty ? 'var(--accent-primary)' : 'var(--foreground-secondary)',
                  border: 'none',
                  cursor: isDirty ? 'pointer' : 'default',
                  fontSize: 13, fontWeight: 600,
                  fontFamily: 'var(--font-body)',
                  color: 'var(--foreground-inverse)',
                  opacity: isDirty ? 1 : 0.6,
                }}
              >
                Save Changes
              </button>
              {isDirty && (
                <button
                  onClick={() => setDraft({ ...row })}
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
                  Discard
                </button>
              )}
              {!isDirty && (
                <span style={{ fontSize: 12, color: 'var(--foreground-secondary)', fontStyle: 'italic' }}>
                  No unsaved changes
                </span>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
