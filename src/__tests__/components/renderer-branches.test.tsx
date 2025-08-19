import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ComponentRenderer } from '@/components/ui/ComponentRenderer'
import { BaseComponent, ComponentType } from '@/types'
import { CanvasPanel } from '@/components/layout/CanvasPanel'

// Mock drag hooks
jest.mock('@/hooks/useDragAndDrop', () => ({
  useCanvasDraggable: jest.fn(() => ({
    onMouseDown: jest.fn(),
    onTouchStart: jest.fn(),
  })),
  useDropTarget: jest.fn(() => ({})),
}))

// Mock store
let mockSelectedIds: string[] = []
const mockActions = {
  selectComponent: jest.fn((id: string) => {
    mockSelectedIds = [id]
  }),
  clearSelection: jest.fn(() => {
    mockSelectedIds = []
  }),
  removeComponent: jest.fn(),
  focusComponent: jest.fn(),
}

jest.mock('@/store', () => {
  const testComponent = {
    id: 'z',
    type: 'text', // Use lowercase to match ComponentType.TEXT enum value
    position: { x: 10, y: 10 },
    dimensions: { width: 100, height: 40 },
    zIndex: 1,
    props: { content: 't' },
    constraints: {
      movable: true,
      resizable: true,
      deletable: true,
      copyable: true,
    },
    metadata: { createdAt: new Date(), updatedAt: new Date(), version: 1 },
  }

  const mockStore = new Map()
  mockStore.set('z', testComponent)

  return {
    useComponents: jest.fn(() => mockStore),
    useSelectedComponents: jest.fn(() => mockSelectedIds),
    useComponentActions: jest.fn(() => mockActions),
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

const base = (over: Partial<BaseComponent>): BaseComponent => ({
  id: 'y',
  type: ComponentType.TEXT,
  position: { x: 0, y: 0 },
  dimensions: { width: 100, height: 40 },
  zIndex: 1,
  props: {},
  ...over,
})

describe('Renderer branches', () => {
  test('Unsupported type falls back to "Unsupported" text', () => {
    render(
      <ComponentRenderer
        component={base({ type: 'unknown' as any })}
        isSelected={false}
        onSelect={() => {}}
      />
    )
    expect(screen.getByText('Unsupported')).toBeInTheDocument()
  })

  test('Canvas background click clears selection', () => {
    render(<CanvasPanel />)

    const node = screen.getByTestId('component-z')
    fireEvent.click(node)

    expect(mockActions.selectComponent).toHaveBeenCalledWith('z')

    // Click background to clear selection
    const canvas = document.querySelector('.canvasArea') as HTMLElement
    fireEvent.click(canvas)

    expect(mockActions.clearSelection).toHaveBeenCalled()
  })
})
