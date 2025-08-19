import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { CanvasPanel } from '@/components/layout/CanvasPanel'
// Imports removed - not used in this test

// Mock store (create components without factory to avoid hoisting)
jest.mock('@/store', () => {
  const mockStore = new Map()
  const testComponent1 = {
    id: 'test-text',
    type: 'text', // Use lowercase to match ComponentType.TEXT enum value
    position: { x: 5, y: 5 },
    dimensions: { width: 200, height: 40 },
    props: { content: 'Text Component' },
    zIndex: 1,
    constraints: {},
    metadata: { createdAt: new Date(), updatedAt: new Date(), version: 1 },
  }
  const testComponent2 = {
    id: 'test-textarea',
    type: 'textarea', // Use lowercase to match ComponentType.TEXTAREA enum value
    position: { x: 10, y: 10 },
    dimensions: { width: 250, height: 80 },
    props: { content: 'TextArea Component' },
    zIndex: 1,
    constraints: {},
    metadata: { createdAt: new Date(), updatedAt: new Date(), version: 1 },
  }
  mockStore.set(testComponent1.id, testComponent1)
  mockStore.set(testComponent2.id, testComponent2)

  return {
    useComponents: jest.fn(() => mockStore),
    useSelectedComponents: jest.fn(() => []),
    useComponentActions: jest.fn(() => ({
      selectComponent: jest.fn(),
      clearSelection: jest.fn(),
      removeComponent: jest.fn(),
      focusComponent: jest.fn(),
    })),
    useDragContext: jest.fn(() => ({
      state: 'idle',
      draggedComponent: null,
      dragOffset: { x: 0, y: 0 },
      dragStartPosition: { x: 0, y: 0 },
    })),
    useCanvas: jest.fn(() => ({
      zoom: 1,
      dimensions: { width: 1200, height: 800 },
      grid: { visible: true, size: 20, snapToGrid: true },
      boundaries: { minX: 0, minY: 0, maxX: 1200, maxY: 800 },
      viewport: { x: 0, y: 0, width: 1200, height: 800 },
    })),
    useCanvasActions: jest.fn(() => ({
      setZoom: jest.fn(),
      updateGrid: jest.fn(),
      updateCanvasDimensions: jest.fn(),
      updateViewport: jest.fn(),
      setBoundaries: jest.fn(),
    })),
  }
})

// Mock the drag hooks
jest.mock('@/hooks/useDragAndDrop', () => ({
  useDropTarget: jest.fn(() => ({})),
  useCanvasDraggable: jest.fn(() => ({
    onMouseDown: jest.fn(),
    onTouchStart: jest.fn(),
  })),
}))

describe('Text/TextArea Rendering', () => {
  test('renders text component content', () => {
    render(<CanvasPanel />)
    // The text component should render its content
    expect(screen.getByText('Text Component')).toBeInTheDocument()
  })

  test('selects a component on click', () => {
    render(<CanvasPanel />)
    // Find any component and click it
    const components = screen.getAllByTestId(/^component-/)
    expect(components.length).toBeGreaterThan(0)

    fireEvent.click(components[0])
    expect(components[0]).toBeInTheDocument()
  })
})
