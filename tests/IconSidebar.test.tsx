import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { IconSidebar } from '../src/components/layout/IconSidebar'

const base = { activeView: 'projects' as const, onSelectView: vi.fn(), onTogglePanel: vi.fn() }

describe('IconSidebar', () => {
  it('calls onTogglePanel when the menu button is clicked', () => {
    const onTogglePanel = vi.fn()
    render(<IconSidebar {...base} onTogglePanel={onTogglePanel} />)
    fireEvent.click(screen.getByLabelText('Toggle menu'))
    expect(onTogglePanel).toHaveBeenCalledTimes(1)
  })

  it('does not throw when menu button is clicked multiple times', () => {
    const onTogglePanel = vi.fn()
    render(<IconSidebar {...base} onTogglePanel={onTogglePanel} />)
    fireEvent.click(screen.getByLabelText('Toggle menu'))
    fireEvent.click(screen.getByLabelText('Toggle menu'))
    expect(onTogglePanel).toHaveBeenCalledTimes(2)
  })

  it('calls onSelectView with contacts when the Contacts icon is clicked', () => {
    const onSelectView = vi.fn()
    render(<IconSidebar {...base} onSelectView={onSelectView} />)
    fireEvent.click(screen.getByLabelText('Contacts'))
    expect(onSelectView).toHaveBeenCalledWith('contacts')
  })
})
