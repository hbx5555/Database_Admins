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

// ── Card content — rendered both in place and inside DragOverlay ─────────────

interface CardContentProps<T> {
  row: T
  primaryField: keyof T
  cardFields: (keyof T)[]
  columnLabels: Record<string, string>
}

function CardContent<T>({ row, primaryField, cardFields, columnLabels }: CardContentProps<T>) {
  return (
    <div style={{
      background: 'var(--white)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      padding: '10px 12px',
    }}>
      <div style={{
        fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
        color: 'var(--foreground-primary)',
        marginBottom: cardFields.length > 0 ? 4 : 0,
        lineHeight: 1.4,
      }}>
        {String(row[primaryField] ?? '—')}
      </div>
      {cardFields.map(field => {
        const val = row[field]
        if (val === null || val === undefined || val === '') return null
        return (
          <div key={String(field)} style={{
            fontFamily: 'var(--font-body)', fontSize: 11,
            color: 'var(--foreground-secondary)', marginTop: 2,
          }}>
            <span style={{ fontWeight: 500 }}>{columnLabels[String(field)] ?? String(field)}: </span>
            {String(val)}
          </div>
        )
      })}
    </div>
  )
}

// ── Draggable card ───────────────────────────────────────────────────────────

interface KanbanCardProps<T extends { id: string }> {
  row: T
  primaryField: keyof T
  cardFields: (keyof T)[]
  columnLabels: Record<string, string>
  onEdit: (id: string) => void
}

function KanbanCard<T extends { id: string }>({
  row, primaryField, cardFields, columnLabels, onEdit,
}: KanbanCardProps<T>) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: row.id })

  if (isDragging) {
    return (
      <div ref={setNodeRef} style={{
        height: 52,
        border: '2px dashed var(--border-color)',
        borderRadius: 'var(--radius-md)',
        marginBottom: 8,
        background: 'var(--surface-primary)',
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
}

function KanbanLane<T extends { id: string }, TStatus extends string>({
  status, colors, cards, primaryField, cardFields, columnLabels, onEdit,
}: KanbanLaneProps<T, TStatus>) {
  const { isOver, setNodeRef } = useDroppable({ id: status })

  return (
    <div
      ref={setNodeRef}
      style={{
        width: 280,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        background: isOver ? 'rgba(44,94,58,0.06)' : 'var(--surface-primary)',
        borderRadius: 'var(--radius-md)',
        border: `1px solid ${isOver ? 'var(--accent-secondary)' : 'var(--border-color)'}`,
        transition: 'background 0.15s, border-color 0.15s',
        overflow: 'hidden',
      }}
    >
      {/* Lane header */}
      <div style={{
        padding: '10px 12px 8px',
        display: 'flex', alignItems: 'center', gap: 8,
        flexShrink: 0,
        borderBottom: '1px solid var(--border-color)',
      }}>
        <span style={{
          display: 'inline-block',
          padding: '2px 10px',
          borderRadius: 'var(--radius-pill)',
          background: colors.bg,
          color: colors.text,
          fontSize: 12, fontFamily: 'var(--font-captions)', fontWeight: 600,
          lineHeight: '20px', whiteSpace: 'nowrap',
        }}>
          {status}
        </span>
        <span style={{
          fontFamily: 'var(--font-captions)', fontSize: 12,
          color: 'var(--foreground-secondary)',
        }}>
          {cards.length}
        </span>
      </div>

      {/* Cards */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 10px 4px' }}>
        {cards.map(row => (
          <KanbanCard
            key={row.id}
            row={row}
            primaryField={primaryField}
            cardFields={cardFields}
            columnLabels={columnLabels}
            onEdit={onEdit}
          />
        ))}
        {cards.length === 0 && (
          <div style={{
            height: 56,
            border: '2px dashed var(--border-color)',
            borderRadius: 'var(--radius-md)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--foreground-secondary)',
            fontFamily: 'var(--font-body)', fontSize: 12,
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
  onStatusChange: (id: string, newStatus: TStatus) => void
}

export function KanbanBoard<T extends { id: string }, TStatus extends string>({
  rows, config, onEdit, onStatusChange,
}: KanbanBoardProps<T, TStatus>) {
  const [activeId, setActiveId] = useState<string | null>(null)

  // Drag only activates after 8 px of movement so clicks/double-clicks are never swallowed
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
            padding: '6px 16px',
            background: '#FFF8E7',
            borderBottom: '1px solid var(--border-color)',
            fontFamily: 'var(--font-body)', fontSize: 12,
            color: '#856404', flexShrink: 0,
          }}>
            {unassignedCount} record{unassignedCount > 1 ? 's' : ''} without a status are not shown — set a status in grid view to include them.
          </div>
        )}
        <div style={{
          display: 'flex', gap: 12, padding: 16,
          overflowX: 'auto', overflowY: 'hidden',
          flex: 1, alignItems: 'stretch',
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
            />
          ))}
        </div>
      </div>

      <DragOverlay>
        {activeRow && (
          <div style={{
            cursor: 'grabbing',
            transform: 'rotate(1.5deg)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            borderRadius: 'var(--radius-md)',
            width: 280,
          }}>
            <CardContent
              row={activeRow}
              primaryField={config.primaryField}
              cardFields={config.cardFields}
              columnLabels={config.columnLabels}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
