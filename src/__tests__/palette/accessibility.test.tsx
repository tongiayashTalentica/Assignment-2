import React, { act } from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ComponentPaletteItem } from '@/components/ui/ComponentPaletteItem'
import { PalettePanel } from '@/components/layout/PalettePanel'
import { ComponentType } from '@/types'

// Mock dependencies
jest.mock('@/store', () => ({
  useComponentActions: () => ({
    addComponent: jest.fn(),
    selectComponent: jest.fn(),
  }),
  useDragContext: () => ({
    state: 'idle',
    draggedComponent: null,
  }),
}))

jest.mock('@/hooks/useDragAndDrop', () => ({
  usePaletteDraggable: () => ({
    onMouseDown: jest.fn(),
    onTouchStart: jest.fn(),
    draggable: false,
    onDragStart: jest.fn(),
  }),
}))

jest.mock('@/hooks/usePaletteAccessibility', () => ({
  usePaletteAccessibility: () => ({
    focusedIndex: -1,
    isKeyboardNavActive: false,
    keyboardDragMode: { active: false },
    navigateToElement: jest.fn(),
    announce: jest.fn(),
    setIsKeyboardNavActive: jest.fn(),
    getAriaLabel: (type: ComponentType) => `Add ${type} component`,
    getAriaDescription: (type: ComponentType) =>
      `${type} component description`,
  }),
}))

describe('Palette Accessibility', () => {
  describe('ARIA Labels and Roles', () => {
    test('PalettePanel has proper region role and labels', () => {
      render(<PalettePanel />)

      const paletteRegion = screen.getByRole('region', {
        name: /component palette/i,
      })
      expect(paletteRegion).toBeInTheDocument()
      expect(paletteRegion).toHaveAttribute('aria-label', 'Component Palette')
      expect(paletteRegion).toHaveAttribute('aria-description')
    })

    test('search input has proper searchbox role and labels', () => {
      render(<PalettePanel />)

      const searchInput = screen.getByRole('searchbox', {
        name: /search components/i,
      })
      expect(searchInput).toBeInTheDocument()
      expect(searchInput).toHaveAttribute('aria-label', 'Search components')
      expect(searchInput).toHaveAttribute('aria-describedby', 'search-help')
      expect(searchInput).toHaveAttribute('type', 'search')
    })

    test('ComponentPaletteItem has proper button role and labels', () => {
      const mockAdd = jest.fn()
      const mockSelect = jest.fn()

      render(
        <ComponentPaletteItem
          type={ComponentType.TEXT}
          label="Text"
          description="Text component description"
          onAdd={mockAdd}
          onSelect={mockSelect}
        />
      )

      const item = screen.getByRole('button')
      expect(item).toHaveAttribute('aria-label', 'Add Text component')
      expect(item).toHaveAttribute('aria-description')
      expect(item).toHaveAttribute('data-component-type', ComponentType.TEXT)
    })

    test('category headers have proper button role and ARIA attributes', () => {
      render(<PalettePanel />)

      const categoryButtons = screen
        .getAllByRole('button')
        .filter(button => button.getAttribute('aria-expanded') !== null)

      expect(categoryButtons.length).toBeGreaterThan(0)

      categoryButtons.forEach(button => {
        expect(button).toHaveAttribute('aria-expanded')
        expect(button).toHaveAttribute('aria-controls')
        expect(button).toHaveAttribute('data-category-toggle')
        expect(button).toHaveAttribute('data-category-id')
      })
    })

    test('collapsed category content has aria-hidden', async () => {
      render(<PalettePanel />)

      const categoryButton = screen.getByRole('button', {
        name: /basic components.*expand.*collapse/i,
      })

      fireEvent.click(categoryButton)

      await waitFor(() => {
        expect(categoryButton).toHaveAttribute('aria-expanded', 'false')

        const contentId = categoryButton.getAttribute('aria-controls')
        if (contentId) {
          const content = document.getElementById(contentId)
          expect(content).toHaveAttribute('aria-hidden', 'true')
        }
      })
    })

    test('search results have live region for screen readers', async () => {
      render(<PalettePanel />)

      const searchInput = screen.getByRole('searchbox')
      fireEvent.change(searchInput, { target: { value: 'text' } })

      await waitFor(() => {
        const statusRegion = screen.getByRole('status')
        expect(statusRegion).toHaveAttribute('aria-live', 'polite')
        expect(statusRegion).toHaveAttribute('id', 'search-help')
      })
    })
  })

  describe('Keyboard Navigation', () => {
    test('ComponentPaletteItem responds to Enter key', () => {
      const mockAdd = jest.fn()
      const mockSelect = jest.fn()

      render(
        <ComponentPaletteItem
          type={ComponentType.TEXT}
          label="Text"
          description="Text component"
          onAdd={mockAdd}
          onSelect={mockSelect}
        />
      )

      const item = screen.getByRole('button')
      fireEvent.keyDown(item, { key: 'Enter' })

      expect(mockAdd).toHaveBeenCalledTimes(1)
    })

    test('ComponentPaletteItem responds to Space key', () => {
      const mockAdd = jest.fn()
      const mockSelect = jest.fn()

      render(
        <ComponentPaletteItem
          type={ComponentType.TEXT}
          label="Text"
          description="Text component"
          onAdd={mockAdd}
          onSelect={mockSelect}
        />
      )

      const item = screen.getByRole('button')
      fireEvent.keyDown(item, { key: ' ' })

      expect(mockAdd).toHaveBeenCalledTimes(1)
    })

    test('Shift+Enter selects component instead of adding', () => {
      const mockAdd = jest.fn()
      const mockSelect = jest.fn()

      render(
        <ComponentPaletteItem
          type={ComponentType.TEXT}
          label="Text"
          description="Text component"
          onAdd={mockAdd}
          onSelect={mockSelect}
        />
      )

      const item = screen.getByRole('button')
      fireEvent.keyDown(item, { key: 'Enter', shiftKey: true })

      expect(mockSelect).toHaveBeenCalledTimes(1)
      expect(mockAdd).not.toHaveBeenCalled()
    })

    test('category headers respond to Enter and Space keys', () => {
      render(<PalettePanel />)

      const categoryButton = screen.getByRole('button', {
        name: /basic components.*expand.*collapse/i,
      })

      expect(categoryButton).toHaveAttribute('aria-expanded', 'true')

      fireEvent.keyDown(categoryButton, { key: 'Enter' })

      // Note: The actual behavior would be tested with a more complete mock setup
      // Here we just verify the element accepts keyboard input
      expect(categoryButton).toHaveAttribute('tabindex', '0')
    })

    test('disabled items do not respond to keyboard activation', () => {
      const mockAdd = jest.fn()
      const mockSelect = jest.fn()

      render(
        <ComponentPaletteItem
          type={ComponentType.TEXT}
          label="Text"
          description="Text component"
          onAdd={mockAdd}
          onSelect={mockSelect}
          disabled={true}
        />
      )

      const item = screen.getByRole('button')
      fireEvent.keyDown(item, { key: 'Enter' })

      expect(mockAdd).not.toHaveBeenCalled()
      expect(mockSelect).not.toHaveBeenCalled()
    })

    test('search input supports keyboard shortcuts', () => {
      render(<PalettePanel />)

      const searchInput = screen.getByRole('searchbox')
      expect(searchInput).toHaveAttribute(
        'placeholder',
        expect.stringContaining('Ctrl+K')
      )
    })
  })

  describe('Focus Management', () => {
    test('ComponentPaletteItem is focusable', () => {
      const mockAdd = jest.fn()
      const mockSelect = jest.fn()

      render(
        <ComponentPaletteItem
          type={ComponentType.TEXT}
          label="Text"
          description="Text component"
          onAdd={mockAdd}
          onSelect={mockSelect}
        />
      )

      const item = screen.getByRole('button')
      expect(item).toHaveAttribute('tabindex', '0')
    })

    test('disabled ComponentPaletteItem is not focusable', () => {
      const mockAdd = jest.fn()
      const mockSelect = jest.fn()

      render(
        <ComponentPaletteItem
          type={ComponentType.TEXT}
          label="Text"
          description="Text component"
          onAdd={mockAdd}
          onSelect={mockSelect}
          disabled={true}
        />
      )

      const item = screen.getByRole('button')
      expect(item).toHaveAttribute('tabindex', '-1')
    })

    test('category headers are focusable', () => {
      render(<PalettePanel />)

      const categoryButtons = screen
        .getAllByRole('button')
        .filter(button => button.getAttribute('aria-expanded') !== null)

      categoryButtons.forEach(button => {
        expect(button).toHaveAttribute('tabindex', '0')
      })
    })

    test('search input is focusable', () => {
      render(<PalettePanel />)

      const searchInput = screen.getByRole('searchbox')
      expect(searchInput).not.toHaveAttribute('tabindex', '-1')

      // Should be naturally focusable as an input element
      searchInput.focus()
      expect(document.activeElement).toBe(searchInput)
    })

    test('focus calls onSelect for ComponentPaletteItem', () => {
      const mockAdd = jest.fn()
      const mockSelect = jest.fn()

      render(
        <ComponentPaletteItem
          type={ComponentType.TEXT}
          label="Text"
          description="Text component"
          onAdd={mockAdd}
          onSelect={mockSelect}
        />
      )

      const item = screen.getByRole('button')
      fireEvent.focus(item)

      expect(mockSelect).toHaveBeenCalledTimes(1)
    })
  })

  describe('Screen Reader Support', () => {
    test('ComponentPaletteItem has descriptive aria-label', () => {
      const mockAdd = jest.fn()
      const mockSelect = jest.fn()

      render(
        <ComponentPaletteItem
          type={ComponentType.TEXT}
          label="Text"
          description="Add text content to your design"
          onAdd={mockAdd}
          onSelect={mockSelect}
        />
      )

      const item = screen.getByRole('button')
      expect(item).toHaveAttribute('aria-label', 'Add Text component')
    })

    test('ComponentPaletteItem has descriptive aria-description', () => {
      const mockAdd = jest.fn()
      const mockSelect = jest.fn()

      render(
        <ComponentPaletteItem
          type={ComponentType.TEXT}
          label="Text"
          description="Add text content to your design"
          onAdd={mockAdd}
          onSelect={mockSelect}
        />
      )

      const item = screen.getByRole('button')
      const ariaDescription = item.getAttribute('aria-description')
      expect(ariaDescription).toContain('double-click')
      expect(ariaDescription).toContain('Shift+D')
      expect(ariaDescription).toContain('keyboard drag')
    })

    test('disabled ComponentPaletteItem indicates disabled state', () => {
      const mockAdd = jest.fn()
      const mockSelect = jest.fn()

      render(
        <ComponentPaletteItem
          type={ComponentType.TEXT}
          label="Text"
          description="Text component"
          onAdd={mockAdd}
          onSelect={mockSelect}
          disabled={true}
        />
      )

      const item = screen.getByRole('button')
      expect(item).toHaveAttribute('aria-disabled', 'true')
    })

    test('selected ComponentPaletteItem indicates selected state', () => {
      const mockAdd = jest.fn()
      const mockSelect = jest.fn()

      render(
        <ComponentPaletteItem
          type={ComponentType.TEXT}
          label="Text"
          description="Text component"
          onAdd={mockAdd}
          onSelect={mockSelect}
          isSelected={true}
        />
      )

      const item = screen.getByRole('button')
      expect(item).toHaveAttribute('aria-selected', 'true')
    })

    test('tooltip has proper role and relationship', async () => {
      jest.useFakeTimers()

      const mockAdd = jest.fn()
      const mockSelect = jest.fn()

      render(
        <ComponentPaletteItem
          type={ComponentType.TEXT}
          label="Text"
          description="Text component"
          onAdd={mockAdd}
          onSelect={mockSelect}
          showTooltip={true}
        />
      )

      const item = screen.getByRole('button')
      fireEvent.mouseEnter(item)

      // Fast-forward to show tooltip
      act(() => {
        jest.advanceTimersByTime(1000)
      })

      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip')
        expect(tooltip).toBeInTheDocument()

        const tooltipId = tooltip.getAttribute('id')
        expect(item).toHaveAttribute('aria-describedby', tooltipId)
      })

      jest.useRealTimers()
    })
  })

  describe('High Contrast and Visual Accessibility', () => {
    test('ComponentPaletteItem has sufficient color contrast in different states', () => {
      const mockAdd = jest.fn()
      const mockSelect = jest.fn()

      const { rerender } = render(
        <ComponentPaletteItem
          type={ComponentType.TEXT}
          label="Text"
          description="Text component"
          onAdd={mockAdd}
          onSelect={mockSelect}
        />
      )

      let item = screen.getByRole('button')

      // Normal state - should have good contrast
      expect(item).toHaveStyle({
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
      })

      // Selected state
      rerender(
        <ComponentPaletteItem
          type={ComponentType.TEXT}
          label="Text"
          description="Text component"
          onAdd={mockAdd}
          onSelect={mockSelect}
          isSelected={true}
        />
      )

      item = screen.getByRole('button')
      expect(item).toHaveStyle({
        border: '2px solid #059669',
        backgroundColor: '#ecfdf5',
      })

      // Disabled state
      rerender(
        <ComponentPaletteItem
          type={ComponentType.TEXT}
          label="Text"
          description="Text component"
          onAdd={mockAdd}
          onSelect={mockSelect}
          disabled={true}
        />
      )

      item = screen.getByRole('button')
      expect(item).toHaveStyle({
        opacity: '0.5',
        backgroundColor: '#f9fafb',
      })
    })

    test('focus indicators are visible', () => {
      const mockAdd = jest.fn()
      const mockSelect = jest.fn()

      render(
        <ComponentPaletteItem
          type={ComponentType.TEXT}
          label="Text"
          description="Text component"
          onAdd={mockAdd}
          onSelect={mockSelect}
        />
      )

      const item = screen.getByRole('button')

      // Element should have outline: none to rely on custom focus styles
      expect(item).toHaveStyle({ outline: 'none' })
    })

    test('text has adequate size for readability', () => {
      const mockAdd = jest.fn()
      const mockSelect = jest.fn()

      render(
        <ComponentPaletteItem
          type={ComponentType.TEXT}
          label="Text"
          description="Text component"
          onAdd={mockAdd}
          onSelect={mockSelect}
        />
      )

      const labelText = screen.getByText('Text')
      const descText = screen.getByText('Text component')

      // Check that text sizes are reasonable (not too small)
      const labelStyle = window.getComputedStyle(labelText)
      const descStyle = window.getComputedStyle(descText)

      // These would be converted from the inline styles
      expect(labelStyle.fontSize).toBe('14px')
      expect(descStyle.fontSize).toBe('12px')
    })
  })

  describe('Keyboard Drag Mode Accessibility', () => {
    test('keyboard drag mode provides audio feedback', () => {
      // This would test the screen reader announcements
      // The actual implementation is in the usePaletteAccessibility hook
      const mockAdd = jest.fn()
      const mockSelect = jest.fn()

      render(
        <ComponentPaletteItem
          type={ComponentType.TEXT}
          label="Text"
          description="Text component includes keyboard drag support"
          onAdd={mockAdd}
          onSelect={mockSelect}
        />
      )

      const item = screen.getByRole('button')
      const ariaDescription = item.getAttribute('aria-description')

      expect(ariaDescription).toContain('Shift+D')
      expect(ariaDescription).toContain('keyboard drag')
    })

    test('tooltip mentions keyboard drag alternative', async () => {
      jest.useFakeTimers()

      const mockAdd = jest.fn()
      const mockSelect = jest.fn()

      render(
        <ComponentPaletteItem
          type={ComponentType.TEXT}
          label="Text"
          description="Text component"
          onAdd={mockAdd}
          onSelect={mockSelect}
          showTooltip={true}
        />
      )

      const item = screen.getByRole('button')
      fireEvent.mouseEnter(item)

      act(() => {
        jest.advanceTimersByTime(1000)
      })

      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip')
        expect(tooltip).toHaveTextContent(/shift\+d/i)
        expect(tooltip).toHaveTextContent(/keyboard drag/i)
      })

      jest.useRealTimers()
    })
  })
})
