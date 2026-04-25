import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import type { TableConfig } from '../../types/tableConfig'

const CARD_BG = 'var(--white)'
const BOARD_BG = '#f4f1e9'
const CARD_RADIUS = 8

// ── Card content — rendered both in-lane and inside DragOverlay ───────────────
// When onEdit + onDelete are provided a permanent icon strip appears on the right.
// DragOverlay omits them so the floating preview stays clean.

interface CardContentProps<T extends { id: string }> {
  row: T
  primaryField: keyof T
  cardFields: (keyof T)[]
  columnLabels: Record<string, string>
  accentColor: string
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

function CardContent<T extends { id: string }>({
  row, primaryField, cardFields, columnLabels, accentColor, onEdit, onDelete,
}: CardContentProps<T>) {
  const visibleFields = cardFields.filter(f => {
    const v = row[f]
    return v !== null && v !== undefined && v !== ''
  })
  const showActions = !!(onEdit && onDelete)

  return (
    <div style={{
      display: 'flex',
      background: CARD_BG,
      borderRadius: CARD_RADIUS,
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    }}>
      {/* Status accent bar — mirrors the form modal's left stripe */}
      <div style={{ width: 5, flexShrink: 0, background: accentColor }} />

      {/* Text content */}
      <div style={{ flex: 1, padding: '10px 12px' }}>
        <div style={{
          fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
          color: 'var(--foreground-primary)', lineHeight: 1.4,
          marginBottom: visibleFields.length > 0 ? 8 : 0,
        }}>
          {String(row[primaryField] ?? '—')}
        </div>
        {visibleFields.map(field => (
          <div key={String(field)} style={{
            fontFamily: 'var(--font-body)', fontSize: 11,
            color: 'var(--foreground-secondary)', lineHeight: 1.5, marginTop: 7,
          }}>
            <span style={{ fontWeight: 500 }}>{columnLabels[String(field)] ?? String(field)}: </span>
            {String(row[field])}
          </div>
        ))}
      </div>

      {/* Permanent action strip — vertical column on the right */}
      {showActions && (
        <div style={{
          width: 34, flexShrink: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'flex-start', gap: 2,
          paddingTop: 8,
          borderLeft: '1px solid var(--border-color)',
        }}>
          <button
            title="Edit"
            onPointerDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onEdit!(row.id) }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15, color: 'var(--foreground-secondary)' }}>edit</span>
          </button>
          <button
            title="Delete"
            onPointerDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onDelete!(row.id) }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#C0392B' }}>delete</span>
          </button>
        </div>
      )}
    </div>
  )
}

// ── Draggable card ───────────────────────────────────────────────────────────

interface KanbanCardProps<T extends { id: string }> {
  row: T
  primaryField: keyof T
  cardFields: (keyof T)[]
  columnLabels: Record<string, string>
  accentColor: string
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

function KanbanCard<T extends { id: string }>({
  row, primaryField, cardFields, columnLabels, accentColor, onEdit, onDelete,
}: KanbanCardProps<T>) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: row.id })

  if (isDragging) {
    return (
      <div ref={setNodeRef} style={{
        height: 52,
        border: '2px dashed var(--border-color)',
        borderRadius: CARD_RADIUS,
        marginBottom: 8,
        background: 'rgba(0,0,0,0.03)',
      }} />
    )
  }

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ marginBottom: 8, cursor: 'grab' }}
      onDoubleClick={() => onEdit(row.id)}
    >
      <CardContent
        row={row}
        primaryField={primaryField}
        cardFields={cardFields}
        columnLabels={columnLabels}
        accentColor={accentColor}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  )
}

// ── Droppable lane ───────────────────────────────────────────────────────────

interface KanbanLaneProps<T extends { id: string }, TStatus extends string> {
  status: TStatus
  colors: { bg: string; text: string }
  cards: T[]
  primaryField: keyof T
  cardFields: (keyof T)[]
  columnLabels: Record<string, string>
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

function KanbanLane<T extends { id: string }, TStatus extends string>({
  status, colors, cards, primaryField, cardFields, columnLabels, onEdit, onDelete,
}: KanbanLaneProps<T, TStatus>) {
  const { isOver, setNodeRef } = useDroppable({ id: status })

  return (
    <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
      {/* Lane header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 10, flexShrink: 0 }}>
        <span style={{
          display: 'inline-block', padding: '2px 10px',
          borderRadius: 'var(--radius-pill)',
          background: colors.bg, color: colors.text,
          fontSize: 12, fontFamily: 'var(--font-captions)', fontWeight: 600,
          lineHeight: '20px', whiteSpace: 'nowrap',
        }}>
          {status}
        </span>
        <span style={{ fontFamily: 'var(--font-captions)', fontSize: 12, color: 'var(--foreground-secondary)' }}>
          {cards.length}
        </span>
      </div>

      {/* Cards area — droppable */}
      <div
        ref={setNodeRef}
        style={{
          flex: 1, overflowY: 'auto', borderRadius: CARD_RADIUS, padding: 8,
          background: isOver ? 'rgba(44,94,58,0.05)' : 'transparent',
          outline: isOver ? '2px dashed rgba(44,94,58,0.25)' : '2px dashed transparent',
          transition: 'background 0.15s, outline-color 0.15s',
          minHeight: 80,
        }}
      >
        {cards.map(row => (
          <KanbanCard
            key={row.id}
            row={row}
            primaryField={primaryField}
            cardFields={cardFields}
            columnLabels={columnLabels}
            accentColor={colors.text}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
        {cards.length === 0 && (
          <div style={{
            height: 56, border: '2px dashed var(--border-color)',
            borderRadius: CARD_RADIUS,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--foreground-secondary)', fontFamily: 'var(--font-body)', fontSize: 12,
          }}>
            Drop here
          </div>
        )}
      </div>
    </div>
  )
}

// ── Board ────────────────────────────────────────────────────────────────────

interface KanbanBoardProps<T extends { id: string }, TStatus extends string> {
  rows: T[]
  config: TableConfig<T, TStatus>
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, newStatus: TStatus) => void
}

export function KanbanBoard<T extends { id: string }, TStatus extends string>({
  rows, config, onEdit, onDelete, onStatusChange,
}: KanbanBoardProps<T, TStatus>) {
  const [activeId, setActiveId] = useState<string | null>(null)

  // Drag only activates after 8 px of movement so clicks are never swallowed
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const grouped: Partial<Record<TStatus, T[]>> = {}
  for (const status of config.statusOptions) {
    grouped[status] = rows.filter(
      r => (r[config.statusField] as unknown as TStatus | null) === status
    )
  }

  const unassignedCount = rows.filter(
    r => !config.statusOptions.includes(r[config.statusField] as unknown as TStatus)
  ).length

  const activeRow = activeId ? rows.find(r => r.id === activeId) ?? null : null
  const activeStatus = activeRow
    ? (activeRow[config.statusField] as unknown as TStatus | null)
    : null
  const activeAccentColor = activeStatus && config.statusColors[activeStatus]
    ? config.statusColors[activeStatus].text
    : 'var(--accent-primary)'

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null)
    const { active, over } = event
    if (!over) return
    const newStatus = over.id as string
    if (config.statusOptions.includes(newStatus as TStatus)) {
      onStatusChange(active.id as string, newStatus as TStatus)
    }
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        {unassignedCount > 0 && (
          <div style={{
            padding: '6px 16px', background: '#FFF8E7',
            borderBottom: '1px solid var(--border-color)',
            fontFamily: 'var(--font-body)', fontSize: 12, color: '#856404', flexShrink: 0,
          }}>
            {unassignedCount} record{unassignedCount > 1 ? 's' : ''} without a status are not shown — set a status in grid view to include them.
          </div>
        )}
        <div style={{
          display: 'flex', gap: 20, padding: 20,
          overflowX: 'auto', overflowY: 'hidden',
          flex: 1, alignItems: 'flex-start',
          background: BOARD_BG,
        }}>
          {config.statusOptions.map(status => (
            <KanbanLane
              key={status}
              status={status}
              colors={config.statusColors[status]}
              cards={grouped[status] ?? []}
              primaryField={config.primaryField}
              cardFields={config.cardFields}
              columnLabels={config.columnLabels}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      </div>

      {/* Drag preview — no action strip so it stays clean while dragging */}
      <DragOverlay>
        {activeRow && (
          <div style={{
            cursor: 'grabbing', transform: 'rotate(1.5deg)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            borderRadius: CARD_RADIUS, width: 280,
          }}>
            <CardContent
              row={activeRow}
              primaryField={config.primaryField}
              cardFields={config.cardFields}
              columnLabels={config.columnLabels}
              accentColor={activeAccentColor}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
