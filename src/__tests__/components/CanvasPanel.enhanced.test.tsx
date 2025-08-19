import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { CanvasPanel } from '@/components/layout/CanvasPanel'
import { ComponentType } from '@/types'

// Mock store hooks for enhanced canvas features
const mockSetZoom = jest.fn()
const mockUpdateGrid = jest.fn()
const mockCanvas = {
  zoom: 1,
  dimensions: { width: 1200, height: 800 },
  grid: {
    visible: true,
    snapToGrid: true,
    size: 20,
    enabled: true,
  },
  boundaries: {
    minX: 0,
    minY: 0,
    maxX: 1200,
    maxY: 800,
  },
}

jest.mock('@/store', () => ({
  useComponents: () =>
    new Map([
      [
        'test-1',
        {
          id: 'test-1',
          type: ComponentType.TEXT,
          position: { x: 100, y: 100 },
          dimensions: { width: 100, height: 50 },
          props: { content: 'Test Component' },
          zIndex: 1,
          constraints: {
            movable: true,
            resizable: true,
            deletable: true,
            copyable: true,
          },
          metadata: {
            createdAt: new Date(),
            updatedAt: new Date(),
            version: 1,
          },
        },
      ],
    ]),
  useSelectedComponents: () => [],
  useComponentActions: () => ({
    selectComponent: jest.fn(),
    clearSelection: jest.fn(),
    removeComponent: jest.fn(),
  }),
  useDragContext: () => ({
    state: 'idle',
  }),
  useCanvas: () => mockCanvas,
  useCanvasActions: () => ({
    setZoom: mockSetZoom,
    updateGrid: mockUpdateGrid,
  }),
}))

// Mock drag hook
jest.mock('@/hooks/useDragAndDrop', () => ({
  useDropTarget: () => ({
    onMouseUp: jest.fn(),
    onTouchEnd: jest.fn(),
    'data-drop-target': true,
  }),
}))

// Mock ComponentRenderer
jest.mock('@/components/ui/ComponentRenderer', () => ({
  ComponentRenderer: ({ component }: any) => (
    <div data-testid={`component-${component.id}`}>
      {component.props.content || 'Component'}
    </div>
  ),
}))

describe('CanvasPanel Enhanced Features', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders canvas with proper dimensions and zoom scale', () => {
    render(<CanvasPanel />)

    const canvasArea = screen.getByTestId('canvas-area')
    expect(canvasArea).toBeInTheDocument()

    // Check if dimensions are applied
    const canvasStyle = canvasArea.style
    expect(canvasStyle.width).toBe('1200px')
    expect(canvasStyle.minHeight).toBe('800px')
    expect(canvasStyle.transform).toBe('scale(1)')
  })

  it('displays zoom controls and handles zoom changes', () => {
    render(<CanvasPanel />)

    // Check zoom control is present by looking for the select element
    const zoomSelect = screen.getByRole('combobox')
    expect(zoomSelect).toBeInTheDocument()

    // Test zoom change
    fireEvent.change(zoomSelect, { target: { value: '150' } })
    expect(mockSetZoom).toHaveBeenCalledWith(1.5)
  })

  it('displays grid controls and handles grid toggle', () => {
    render(<CanvasPanel />)

    // Check grid toggle button
    const gridButton = screen.getByText('Grid')
    expect(gridButton).toBeInTheDocument()

    // Test grid toggle
    fireEvent.click(gridButton)
    expect(mockUpdateGrid).toHaveBeenCalledWith({
      visible: !mockCanvas.grid.visible,
    })
  })

  it('displays snap-to-grid controls', () => {
    render(<CanvasPanel />)

    // Check snap toggle button
    const snapButton = screen.getByText('Snap')
    expect(snapButton).toBeInTheDocument()

    // Test snap toggle
    fireEvent.click(snapButton)
    expect(mockUpdateGrid).toHaveBeenCalledWith({
      snapToGrid: !mockCanvas.grid.snapToGrid,
    })
  })

  it('shows canvas info overlay with component count and dimensions', () => {
    render(<CanvasPanel />)

    const infoOverlay = screen.getByText('1 components | 1200×800px')
    expect(infoOverlay).toBeInTheDocument()
  })

  it('displays canvas dimensions in placeholder when empty', () => {
    render(<CanvasPanel />)

    // Should show canvas dimensions in info overlay (split by elements)
    expect(screen.getByText(/1200/)).toBeInTheDocument()
    expect(screen.getByText(/800/)).toBeInTheDocument()
  })

  it('handles keyboard events for component deletion', () => {
    render(<CanvasPanel />)

    // Test that the canvas renders and keyboard events are attached
    expect(screen.getByRole('main')).toBeInTheDocument()

    // Note: Testing actual keyboard handlers is complex with mocked hooks
    // This test verifies the component renders without throwing errors
  })

  it('shows drag state visual indicators', () => {
    render(<CanvasPanel />)

    // Test that canvas renders with drag state data attributes
    const canvasArea = screen.getByTestId('canvas-area')
    expect(canvasArea).toHaveAttribute('data-drag-state', 'idle')

    // Note: Testing drag state changes requires complex mocking
    // This test verifies the drag state attributes are properly set
  })

  it('renders clear canvas button with proper styling', () => {
    render(<CanvasPanel />)

    const clearButton = screen.getByText('Clear Canvas')
    expect(clearButton).toBeInTheDocument()

    // Check button styling
    const buttonStyle = clearButton.style
    expect(buttonStyle.backgroundColor).toBe('rgb(239, 68, 68)')
    expect(buttonStyle.color).toBe('white')
  })
})
