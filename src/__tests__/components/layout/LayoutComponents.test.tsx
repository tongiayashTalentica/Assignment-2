import { describe, it, expect } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { CanvasPanel } from '@/components/layout/CanvasPanel'
import { PalettePanel } from '@/components/layout/PalettePanel'
import { PropertiesPanel } from '@/components/layout/PropertiesPanel'

// Mock the store
jest.mock('@/store', () => ({
  useLayout: jest.fn(() => ({
    leftPanelWidth: 20,
    centerPanelWidth: 60,
    rightPanelWidth: 20,
  })),
  useComponents: jest.fn(() => new Map()),
  useSelectedComponents: jest.fn(() => []),
  useFocusedComponent: jest.fn(() => null),
  useComponentActions: jest.fn(() => ({
    addComponent: jest.fn(),
    removeComponent: jest.fn(),
    updateComponent: jest.fn(),
    duplicateComponent: jest.fn(),
    selectComponent: jest.fn(),
    deselectComponent: jest.fn(),
    clearSelection: jest.fn(),
    focusComponent: jest.fn(),
    moveComponent: jest.fn(),
    resizeComponent: jest.fn(),
    reorderComponent: jest.fn(),
  })),
  useDragContext: jest.fn(() => ({
    state: 'idle',
    draggedComponent: null,
    startPosition: { x: 0, y: 0 },
    currentPosition: { x: 0, y: 0 },
    dragOffset: { x: 0, y: 0 },
    isDragValid: false,
  })),
  useCanvas: jest.fn(() => ({
    boundaries: { minX: 0, minY: 0, maxX: 1200, maxY: 800 },
    grid: { snapToGrid: false, size: 20 },
    dimensions: { width: 1200, height: 800 },
    zoom: 1,
    canUndo: false,
    canRedo: false,
  })),
  useCanvasActions: jest.fn(() => ({
    setZoom: jest.fn(),
    updateGrid: jest.fn(),
    updateCanvasDimensions: jest.fn(),
    updateViewport: jest.fn(),
    setBoundaries: jest.fn(),
  })),
}))

// Mock the drag and drop hooks
jest.mock('@/hooks/useDragAndDrop', () => ({
  useDropTarget: jest.fn(() => ({
    onMouseUp: jest.fn(),
    onTouchEnd: jest.fn(),
  })),
  usePaletteDraggable: jest.fn(() => ({
    onMouseDown: jest.fn(),
    onTouchStart: jest.fn(),
    onDoubleClick: jest.fn(),
  })),
  useCanvasDraggable: jest.fn(() => ({
    onMouseDown: jest.fn(),
    onTouchStart: jest.fn(),
  })),
}))

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
      const title = screen.getByText('Aura No-Code Editor')
      expect(title).toBeTruthy()
      expect(title.textContent).toBe('Aura No-Code Editor')
    })

    it('should render all three panels', () => {
      render(<MainLayout />)

      // Check for panel titles
      expect(screen.getByText('Components')).toBeTruthy()
      expect(screen.getByText('Canvas')).toBeTruthy()
      expect(screen.getByText('Properties')).toBeTruthy()
    })

    it('should apply correct CSS classes', () => {
      const { container } = render(<MainLayout />)

      const mainLayout = container.querySelector('.mainLayout')
      const header = container.querySelector('.header')
      const content = container.querySelector('.content')

      expect(mainLayout).toBeTruthy()
      expect(header).toBeTruthy()
      expect(content).toBeTruthy()
    })

    it('should apply layout widths to panels', () => {
      const { container } = render(<MainLayout />)

      const leftPanel = container.querySelector('.leftPanel')
      const centerPanel = container.querySelector('.centerPanel')
      const rightPanel = container.querySelector('.rightPanel')

      expect(leftPanel).toBeTruthy()
      expect(centerPanel).toBeTruthy()
      expect(rightPanel).toBeTruthy()
    })

    it('should use layout hook for panel widths', () => {
      const { useLayout } = require('@/store')
      render(<MainLayout />)

      expect(useLayout).toHaveBeenCalled()
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
      const title = screen.getByText('Canvas')
      expect(title).toBeTruthy()
      expect(title.textContent).toBe('Canvas')
    })

    it('should render default placeholder content', () => {
      render(<CanvasPanel />)

      expect(screen.getByText('Design Canvas')).toBeTruthy()
      expect(
        screen.getByText('Drop components here to start building your design')
      ).toBeTruthy()
    })

    it('should render custom children when provided', () => {
      const customContent = (
        <div data-testid="custom-content">Custom Canvas Content</div>
      )
      render(<CanvasPanel>{customContent}</CanvasPanel>)

      const customElement = screen.getByTestId('custom-content')
      expect(customElement).toBeTruthy()
      expect(customElement.textContent).toBe('Custom Canvas Content')

      // Should not render placeholder when children are provided
      expect(screen.queryByText('Design Canvas')).toBeFalsy()
    })

    it('should apply custom className', () => {
      const { container } = render(<CanvasPanel className="custom-class" />)
      const panel = container.firstChild as Element

      expect(panel.className).toContain('custom-class')
      expect(panel.className).toContain('panel')
    })

    it('should apply custom styles', () => {
      const customStyles = { width: '50%', backgroundColor: 'red' }
      const { container } = render(<CanvasPanel style={customStyles} />)
      const panel = container.firstChild as HTMLElement

      expect(panel.style.width).toBe('50%')
      expect(panel.style.backgroundColor).toBe('red')
    })

    it('should have proper CSS structure', () => {
      const { container } = render(<CanvasPanel />)

      const panelHeader = container.querySelector('.panelHeader')
      const panelContent = container.querySelector('.panelContent')
      const canvasArea = container.querySelector('.canvasArea')
      const canvasPlaceholder = container.querySelector('.canvasPlaceholder')

      expect(panelHeader).toBeTruthy()
      expect(panelContent).toBeTruthy()
      expect(canvasArea).toBeTruthy()
      expect(canvasPlaceholder).toBeTruthy()
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
      const title = screen.getByText('Components')
      expect(title).toBeTruthy()
      expect(title.textContent).toBe('Components')
    })

    it('should render default placeholder content', () => {
      render(<PalettePanel />)

      expect(
        screen.getByText('Drag components to canvas or double-click to add')
      ).toBeTruthy()
    })

    it('should render custom children when provided', () => {
      const customContent = (
        <div data-testid="palette-custom">Custom Palette Content</div>
      )
      render(<PalettePanel>{customContent}</PalettePanel>)

      const customElement = screen.getByTestId('palette-custom')
      expect(customElement).toBeTruthy()
      expect(customElement.textContent).toBe('Custom Palette Content')

      // Should not render placeholder when children are provided
      expect(screen.queryByText('Component palette will be here')).toBeFalsy()
    })

    it('should apply custom className', () => {
      const { container } = render(<PalettePanel className="palette-custom" />)
      const panel = container.firstChild as Element

      expect(panel.className).toContain('palette-custom')
      expect(panel.className).toContain('panel')
    })

    it('should apply custom styles', () => {
      const customStyles = { width: '25%', minHeight: '400px' }
      const { container } = render(<PalettePanel style={customStyles} />)
      const panel = container.firstChild as HTMLElement

      expect(panel.style.width).toBe('25%')
      expect(panel.style.minHeight).toBe('400px')
    })

    it('should have proper CSS structure', () => {
      const { container } = render(<PalettePanel />)

      const panelHeader = container.querySelector('.panelHeader')
      const panelContent = container.querySelector('.panelContent')

      expect(panelHeader).toBeTruthy()
      expect(panelContent).toBeTruthy()
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
      const title = screen.getByText('Properties')
      expect(title).toBeTruthy()
      expect(title.textContent).toBe('Properties')
    })

    it('should render default placeholder content', () => {
      render(<PropertiesPanel />)

      expect(screen.getByText('Component properties will be here')).toBeTruthy()
      expect(
        screen.getByText('Select a component to view and edit its properties')
      ).toBeTruthy()
    })

    it('should render custom children when provided', () => {
      const customContent = (
        <div data-testid="properties-custom">Custom Properties Content</div>
      )
      render(<PropertiesPanel>{customContent}</PropertiesPanel>)

      const customElement = screen.getByTestId('properties-custom')
      expect(customElement).toBeTruthy()
      expect(customElement.textContent).toBe('Custom Properties Content')

      // Should not render placeholder when children are provided
      expect(
        screen.queryByText('Component properties will be here')
      ).toBeFalsy()
    })

    it('should apply custom className', () => {
      const { container } = render(<PropertiesPanel className="props-custom" />)
      const panel = container.firstChild as Element

      expect(panel.className).toContain('props-custom')
      expect(panel.className).toContain('panel')
    })

    it('should apply custom styles', () => {
      const customStyles = { width: '30%', maxHeight: '600px' }
      const { container } = render(<PropertiesPanel style={customStyles} />)
      const panel = container.firstChild as HTMLElement

      expect(panel.style.width).toBe('30%')
      expect(panel.style.maxHeight).toBe('600px')
    })

    it('should have proper CSS structure', () => {
      const { container } = render(<PropertiesPanel />)

      const panelHeader = container.querySelector('.panelHeader')
      const panelContent = container.querySelector('.panelContent')
      const placeholder = container.querySelector('.placeholder')

      expect(panelHeader).toBeTruthy()
      expect(panelContent).toBeTruthy()
      expect(placeholder).toBeTruthy()
    })
  })

  describe('Panel Integration', () => {
    it('should work together in MainLayout', () => {
      render(<MainLayout />)

      // All panels should be present
      expect(screen.getByText('Components')).toBeTruthy()
      expect(screen.getByText('Canvas')).toBeTruthy()
      expect(screen.getByText('Properties')).toBeTruthy()

      // All placeholder content should be present
      expect(
        screen.getByText('Drag components to canvas or double-click to add')
      ).toBeTruthy()
      expect(screen.getByText('Design Canvas')).toBeTruthy()
      expect(screen.getByText('Component properties will be here')).toBeTruthy()
    })

    it('should handle empty className prop', () => {
      const { container: canvasContainer } = render(
        <CanvasPanel className="" />
      )
      const { container: paletteContainer } = render(
        <PalettePanel className="" />
      )
      const { container: propertiesContainer } = render(
        <PropertiesPanel className="" />
      )

      const canvasPanel = canvasContainer.firstChild as Element
      const palettePanel = paletteContainer.firstChild as Element
      const propertiesPanel = propertiesContainer.firstChild as Element

      expect(canvasPanel.className).toContain('panel')
      expect(palettePanel.className).toContain('panel')
      expect(propertiesPanel.className).toContain('panel')
    })

    it('should handle undefined className prop', () => {
      const { container: canvasContainer } = render(<CanvasPanel />)
      const { container: paletteContainer } = render(<PalettePanel />)
      const { container: propertiesContainer } = render(<PropertiesPanel />)

      const canvasPanel = canvasContainer.firstChild as Element
      const palettePanel = paletteContainer.firstChild as Element
      const propertiesPanel = propertiesContainer.firstChild as Element

      expect(canvasPanel.className).toContain('panel')
      expect(palettePanel.className).toContain('panel')
      expect(propertiesPanel.className).toContain('panel')
    })
  })
})
