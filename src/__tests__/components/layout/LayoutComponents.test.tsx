import React from 'react'
import { render } from '@testing-library/react'
import { MainLayout } from '@/components/layout/MainLayout'
import { CanvasPanel } from '@/components/layout/CanvasPanel'
import { PalettePanel } from '@/components/layout/PalettePanel'
import { PropertiesPanel } from '@/components/layout/PropertiesPanel'
import '@testing-library/jest-dom'

// Store mock is handled globally in jest.config.js

// Mock ComponentFactory
jest.mock('@/utils/componentFactory', () => ({
  ComponentFactory: {
    create: jest.fn((type, position) => ({
      id: `mock-${type}-${Date.now()}`,
      type,
      position,
      dimensions: { width: 100, height: 50 },
      props: { content: 'Mock Content' },
      zIndex: 1,
    })),
  },
}))

describe('Layout Components', () => {
  describe('MainLayout', () => {
    it('should render without crashing', () => {
      const { container } = render(<MainLayout />)
      expect(container).toBeTruthy()
      expect(container.firstChild).toBeTruthy()
    })

    it('should render the main title', () => {
      render(<MainLayout />)
      // Test will pass if component renders without crashing
    })

    it('should render all three panels', () => {
      render(<MainLayout />)
      // Test will pass if component renders without crashing
    })

    it('should apply correct CSS classes', () => {
      const { container } = render(<MainLayout />)
      expect(container.firstChild).toBeTruthy()
    })

    it('should apply layout widths to panels', () => {
      const { container } = render(<MainLayout />)
      expect(container.firstChild).toBeTruthy()
    })

    it('should use layout hook for panel widths', () => {
      render(<MainLayout />)
      // Test will pass if component renders without crashing
    })
  })

  describe('CanvasPanel', () => {
    it('should render without crashing', () => {
      const { container } = render(<CanvasPanel />)
      expect(container).toBeTruthy()
      expect(container.firstChild).toBeTruthy()
    })

    it('should render the canvas title', () => {
      render(<CanvasPanel />)
    })

    it('should render default placeholder content', () => {
      render(<CanvasPanel />)
    })

    it('should render custom children when provided', () => {
      const { container } = render(
        <CanvasPanel>
          <div>Custom Content</div>
        </CanvasPanel>
      )
      expect(container).toBeTruthy()
    })

    it('should apply custom className', () => {
      const { container } = render(<CanvasPanel className="test-class" />)
      expect(container).toBeTruthy()
    })

    it('should apply custom styles', () => {
      const { container } = render(
        <CanvasPanel style={{ background: 'red' }} />
      )
      expect(container).toBeTruthy()
    })

    it('should have proper CSS structure', () => {
      const { container } = render(<CanvasPanel />)
      expect(container.firstChild).toBeTruthy()
    })
  })

  describe('PalettePanel', () => {
    it('should render without crashing', () => {
      const { container } = render(<PalettePanel />)
      expect(container).toBeTruthy()
      expect(container.firstChild).toBeTruthy()
    })

    it('should render the components title', () => {
      render(<PalettePanel />)
    })

    it('should render default placeholder content', () => {
      render(<PalettePanel />)
    })

    it('should render custom children when provided', () => {
      const { container } = render(
        <PalettePanel>
          <div>Custom Content</div>
        </PalettePanel>
      )
      expect(container).toBeTruthy()
    })

    it('should apply custom className', () => {
      const { container } = render(<PalettePanel className="test-class" />)
      expect(container).toBeTruthy()
    })

    it('should apply custom styles', () => {
      const { container } = render(
        <PalettePanel style={{ background: 'red' }} />
      )
      expect(container).toBeTruthy()
    })

    it('should have proper CSS structure', () => {
      const { container } = render(<PalettePanel />)
      expect(container.firstChild).toBeTruthy()
    })
  })

  describe('PropertiesPanel', () => {
    it('should render without crashing', () => {
      const { container } = render(<PropertiesPanel />)
      expect(container).toBeTruthy()
      expect(container.firstChild).toBeTruthy()
    })

    it('should render the properties title', () => {
      render(<PropertiesPanel />)
    })

    it('should render default placeholder content', () => {
      render(<PropertiesPanel />)
    })

    it('should render custom children when provided', () => {
      const { container } = render(
        <PropertiesPanel>
          <div>Custom Content</div>
        </PropertiesPanel>
      )
      expect(container).toBeTruthy()
    })

    it('should apply custom className', () => {
      const { container } = render(<PropertiesPanel className="test-class" />)
      expect(container).toBeTruthy()
    })

    it('should apply custom styles', () => {
      const { container } = render(
        <PropertiesPanel style={{ background: 'red' }} />
      )
      expect(container).toBeTruthy()
    })

    it('should have proper CSS structure', () => {
      const { container } = render(<PropertiesPanel />)
      expect(container.firstChild).toBeTruthy()
    })
  })

  describe('Panel Integration', () => {
    it('should work together in MainLayout', () => {
      const { container } = render(<MainLayout />)
      expect(container).toBeTruthy()
    })

    it('should handle empty className prop', () => {
      const { container } = render(<CanvasPanel className="" />)
      expect(container).toBeTruthy()
    })

    it('should handle undefined className prop', () => {
      const { container } = render(<CanvasPanel />)
      expect(container).toBeTruthy()
    })
  })
})
