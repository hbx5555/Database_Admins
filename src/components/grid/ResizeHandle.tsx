import { memo, useRef, useEffect } from 'react'
import { MIN_WIDTH } from '../../hooks/useColumnResize'

interface ResizeHandleProps {
  columnKey: string
  onFinalizeWidth: (key: string, width: number) => void
  currentWidth: number
}

export const ResizeHandle = memo(function ResizeHandle({ columnKey, onFinalizeWidth, currentWidth }: ResizeHandleProps) {
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null)
  const lineRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const line = document.createElement('div')
    Object.assign(line.style, {
      position: 'fixed', top: '0', left: '0',
      width: '2px', height: '100vh',
      background: 'var(--accent-primary)',
      pointerEvents: 'none', zIndex: '9999', display: 'none',
    })
    document.body.appendChild(line)
    lineRef.current = line
    return () => { document.body.removeChild(line); lineRef.current = null }
  }, [])

  return (
    <div
      onPointerDown={e => {
        e.preventDefault()
        e.stopPropagation()
        dragRef.current = { startX: e.clientX, startWidth: currentWidth }
        e.currentTarget.setPointerCapture(e.pointerId)
        if (lineRef.current) {
          lineRef.current.style.left = `${e.clientX}px`
          lineRef.current.style.display = 'block'
        }
      }}
      onPointerMove={e => {
        if (!dragRef.current || !lineRef.current) return
        const newWidth = dragRef.current.startWidth + (e.clientX - dragRef.current.startX)
        if (newWidth >= MIN_WIDTH) lineRef.current.style.left = `${e.clientX}px`
      }}
      onPointerUp={e => {
        if (!dragRef.current) return
        const newWidth = dragRef.current.startWidth + (e.clientX - dragRef.current.startX)
        dragRef.current = null
        if (lineRef.current) lineRef.current.style.display = 'none'
        onFinalizeWidth(columnKey, newWidth)
      }}
      style={{
        position: 'absolute', right: 0, top: 0,
        width: 4, height: '100%',
        cursor: 'col-resize', background: 'transparent',
        zIndex: 1, touchAction: 'none',
      }}
      onClick={e => e.stopPropagation()}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--border-color)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
    />
  )
})
