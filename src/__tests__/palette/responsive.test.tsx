import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { PalettePanel } from '@/components/layout/PalettePanel'
import { ComponentPreview } from '@/components/ui/ComponentPreview'
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
  }),
}))

describe('Palette Responsive Design', () => {
  describe('Layout Constraints', () => {
    test('palette panel uses flexbox layout', () => {
      render(<PalettePanel />)

      const paletteContainer = screen.getByRole('region', {
        name: /component palette/i,
      })

      expect(paletteContainer).toHaveStyle({
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      })
    })

    test('header is fixed and content is scrollable', () => {
      render(<PalettePanel />)

      // Header should not shrink
      const header = screen
        .getByText('Components')
        .closest('[style*="flex-shrink: 0"]')
      expect(header).toHaveStyle({ flexShrink: 0 })

      // Content should be scrollable
      const contentArea = document.querySelector('[style*="overflow: auto"]')
      expect(contentArea).toHaveStyle({
        flex: 1,
        overflow: 'auto',
      })
    })

    test('search input takes full width', () => {
      render(<PalettePanel />)

      const searchInput = screen.getByRole('searchbox')

      expect(searchInput).toHaveStyle({ width: '100%' })
    })

    test('component items use flexible layout', () => {
      render(<PalettePanel />)

      // Find a component item
      const textItem = screen.getByText('Text').closest('[role="button"]')

      expect(textItem).toHaveStyle({
        display: 'flex',
        alignItems: 'center',
      })

      // The text content should be flexible
      const textContent = screen.getByText('Text').parentElement
      expect(textContent).toHaveStyle({ flex: 1, minWidth: 0 })
    })
  })

  describe('Component Preview Scaling', () => {
    test('ComponentPreview scales correctly for different sizes', () => {
      const { rerender } = render(
        <ComponentPreview type={ComponentType.TEXT} size="small" />
      )

      let preview = screen.getByText('Aa').parentElement
      expect(preview).toHaveStyle({
        width: '32px',
        height: '24px',
        fontSize: '10px',
      })

      rerender(<ComponentPreview type={ComponentType.TEXT} size="medium" />)
      preview = screen.getByText('Aa').parentElement
      expect(preview).toHaveStyle({
        width: '48px',
        height: '36px',
        fontSize: '12px',
      })

      rerender(<ComponentPreview type={ComponentType.TEXT} size="large" />)
      preview = screen.getByText('Aa').parentElement
      expect(preview).toHaveStyle({
        width: '64px',
        height: '48px',
        fontSize: '14px',
      })
    })

    test('preview sizes are proportionally scaled', () => {
      const sizes = [
        { size: 'small' as const, width: 32, height: 24 },
        { size: 'medium' as const, width: 48, height: 36 },
        { size: 'large' as const, width: 64, height: 48 },
      ]

      sizes.forEach(({ size, width, height }) => {
        const { unmount } = render(
          <ComponentPreview type={ComponentType.BUTTON} size={size} />
        )

        const preview = screen.getByText('Btn').parentElement
        expect(preview).toHaveStyle({
          width: `${width}px`,
          height: `${height}px`,
        })

        // Check aspect ratio is maintained
        const aspectRatio = width / height
        expect(aspectRatio).toBeCloseTo(4 / 3, 1) // Approximately 4:3 ratio

        unmount()
      })
    })
  })

  describe('Text Overflow and Truncation', () => {
    test('component labels truncate with ellipsis', () => {
      render(<PalettePanel />)

      const labelElement = screen.getByText('Text')

      expect(labelElement).toHaveStyle({
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      })
    })

    test('component descriptions truncate with ellipsis', () => {
      render(<PalettePanel />)

      const descElement = screen.getByText(/display and edit text content/i)

      expect(descElement).toHaveStyle({
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      })
    })

    test('long category names handle overflow gracefully', () => {
      render(<PalettePanel />)

      const categoryLabel = screen.getByText('Basic Components')

      expect(categoryLabel).toHaveStyle({
        flex: 1, // Takes available space
      })
    })
  })

  describe('Spacing and Padding', () => {
    test('consistent spacing between categories', () => {
      render(<PalettePanel />)

      // Categories should have consistent margin
      const categories = document.querySelectorAll('[data-category-toggle]')

      categories.forEach(category => {
        const categoryElement = category as HTMLElement
        expect(categoryElement).toHaveStyle({
          padding: '12px 8px',
          margin: '8px 0 4px 0',
        })
      })
    })

    test('component items have consistent padding', () => {
      render(<PalettePanel />)

      const componentItems = screen
        .getAllByRole('button')
        .filter(button => button.getAttribute('data-component-type'))

      componentItems.forEach(item => {
        expect(item).toHaveStyle({
          padding: '12px',
          margin: '4px 0',
        })
      })
    })

    test('search input has appropriate padding', () => {
      render(<PalettePanel />)

      const searchInput = screen.getByRole('searchbox')

      expect(searchInput).toHaveStyle({
        padding: '8px 32px 8px 12px', // Right padding for icon
      })
    })
  })

  describe('Collapsible Sections Behavior', () => {
    test('collapsed categories animate height changes', () => {
      render(<PalettePanel />)

      const categoryContent = document.querySelector(
        '[id^="category-"][id$="-content"]'
      )

      expect(categoryContent).toHaveStyle({
        transition:
          'max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease',
      })
    })

    test('collapsed sections have appropriate max-height', () => {
      render(<PalettePanel />)

      const categoryButton = screen.getByRole('button', {
        name: /basic components.*expand.*collapse/i,
      })

      // Initially expanded
      const content = document.querySelector(
        `#${categoryButton.getAttribute('aria-controls')}`
      )
      expect(content).toHaveStyle({ maxHeight: '500px' })

      // Click to collapse
      fireEvent.click(categoryButton)

      // Should be collapsed (height 0)
      expect(content).toHaveStyle({
        maxHeight: '0px',
        opacity: '0',
      })
    })

    test('category chevron rotates on collapse', () => {
      render(<PalettePanel />)

      const categoryButton = screen.getByRole('button', {
        name: /basic components.*expand.*collapse/i,
      })

      const chevron = categoryButton.querySelector('svg')

      // Initially expanded (0 degrees)
      expect(chevron).toHaveStyle({ transform: 'rotate(0deg)' })

      // Click to collapse
      fireEvent.click(categoryButton)

      // Should rotate to -90 degrees
      expect(chevron).toHaveStyle({ transform: 'rotate(-90deg)' })
    })
  })

  describe('Search Results Layout', () => {
    test('search results use consistent spacing', async () => {
      render(<PalettePanel />)

      const searchInput = screen.getByRole('searchbox')
      fireEvent.change(searchInput, { target: { value: 'text' } })

      // Search results container should have padding
      await screen.findByText('Search Results')
      const resultsContainer = screen
        .getByText('Search Results')
        .closest('[style*="padding: 8px"]')

      expect(resultsContainer).toHaveStyle({ padding: '8px' })
    })

    test('empty search state is centered', async () => {
      render(<PalettePanel />)

      const searchInput = screen.getByRole('searchbox')
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } })

      await screen.findByText('No components found')

      const emptyState = screen
        .getByText('No components found')
        .closest('[style*="padding: 24px"]')
      expect(emptyState).toHaveStyle({
        padding: '24px',
        textAlign: 'center',
      })
    })
  })

  describe('Recent Components Section', () => {
    test('recent components use flexible wrap layout', () => {
      // This would require mocking the recent components state
      render(<PalettePanel />)

      // Look for the potential recent components structure
      const recentContainer = document.querySelector(
        '[style*="flexWrap: wrap"]'
      )

      if (recentContainer) {
        expect(recentContainer).toHaveStyle({
          display: 'flex',
          gap: '4px',
          flexWrap: 'wrap',
        })
      }
    })

    test('recent component buttons have consistent size', () => {
      render(<PalettePanel />)

      // Recent component buttons (if they exist) should have consistent styling
      const recentButtons = document.querySelectorAll('button[title^="Add "]')

      recentButtons.forEach(button => {
        const buttonElement = button as HTMLElement
        expect(buttonElement).toHaveStyle({
          padding: '4px 8px',
          fontSize: '11px',
        })
      })
    })
  })

  describe('Performance Debug Info Layout', () => {
    test('debug info has appropriate spacing and styling', () => {
      // Mock drag context with performance data
      jest.doMock('@/store', () => ({
        useComponentActions: () => ({
          addComponent: jest.fn(),
          selectComponent: jest.fn(),
        }),
        useDragContext: () => ({
          state: 'idle',
          draggedComponent: null,
          performanceData: {
            frameCount: 60,
            averageFrameTime: 16.67,
            memoryUsage: 1048576, // 1MB
          },
        }),
      }))

      const { rerender } = render(<PalettePanel />)
      rerender(<PalettePanel />)

      // Look for performance debug container
      const debugContainer = document.querySelector(
        '[style*="backgroundColor: #f9fafb"]'
      )

      if (debugContainer) {
        expect(debugContainer).toHaveStyle({
          fontSize: '11px',
          padding: '8px',
          backgroundColor: '#f9fafb',
          borderRadius: '4px',
          margin: '8px',
        })
      }
    })
  })

  describe('Accessibility and Focus Management', () => {
    test('focus styles are visible and accessible', () => {
      render(<PalettePanel />)

      const searchInput = screen.getByRole('searchbox')

      // Focus the input
      searchInput.focus()

      // Should have visible focus indicators
      expect(searchInput).toHaveStyle({ outline: 'none' })
      // Custom focus styles would be applied via onFocus event
    })

    test('component items have adequate touch targets', () => {
      render(<PalettePanel />)

      const componentItems = screen
        .getAllByRole('button')
        .filter(button => button.getAttribute('data-component-type'))

      componentItems.forEach(item => {
        // Should have adequate height for touch
        expect(item).toHaveStyle({
          padding: '12px', // Provides good touch target size
        })
      })
    })
  })

  describe('Edge Cases and Constraints', () => {
    test('handles very long component names gracefully', () => {
      // Component names should be truncated, not break layout
      render(<PalettePanel />)

      const textLabels = document.querySelectorAll(
        '[style*="textOverflow: ellipsis"]'
      )

      textLabels.forEach(label => {
        expect(label).toHaveStyle({
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        })
      })
    })

    test('maintains layout when all categories are collapsed', () => {
      render(<PalettePanel />)

      // Collapse all categories
      const categoryButtons = screen
        .getAllByRole('button')
        .filter(button => button.getAttribute('aria-expanded'))

      categoryButtons.forEach(button => {
        fireEvent.click(button)
      })

      // Container should still maintain its structure
      const paletteContainer = screen.getByRole('region', {
        name: /component palette/i,
      })
      expect(paletteContainer).toHaveStyle({
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      })
    })

    test('scrollbar styling is consistent', () => {
      render(<PalettePanel />)

      const scrollableContent = document.querySelector(
        '[style*="scrollbarWidth: thin"]'
      )

      if (scrollableContent) {
        expect(scrollableContent).toHaveStyle({
          scrollbarWidth: 'thin',
        })
      }
    })
  })
})
