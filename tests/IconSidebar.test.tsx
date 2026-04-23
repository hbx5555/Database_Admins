import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { IconSidebar } from '../src/components/layout/IconSidebar'

describe('IconSidebar', () => {
  it('calls onTogglePanel when the menu button is clicked', () => {
    const onTogglePanel = vi.fn()
    render(<IconSidebar onTogglePanel={onTogglePanel} />)
    fireEvent.click(screen.getByLabelText('Toggle menu'))
    expect(onTogglePanel).toHaveBeenCalledTimes(1)
  })

  it('does not throw when menu button is clicked multiple times', () => {
    const onTogglePanel = vi.fn()
    render(<IconSidebar onTogglePanel={onTogglePanel} />)
    fireEvent.click(screen.getByLabelText('Toggle menu'))
    fireEvent.click(screen.getByLabelText('Toggle menu'))
    expect(onTogglePanel).toHaveBeenCalledTimes(2)
  })
})
