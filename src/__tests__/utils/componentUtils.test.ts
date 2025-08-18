import {
  createComponent,
  generateComponentId,
  validateComponent,
  cloneComponent,
  // updateComponentMetadata - unused
  isPointInComponent,
  getComponentBounds,
  doComponentsOverlap,
  constrainPositionToBounds,
  constrainDimensionsToLimits,
  // getComponentChildren - unused
  sortComponentsByZIndex,
  filterComponentsByType,
  searchComponents,
  getDefaultComponentProps,
  // getDefaultComponentDimensions - unused
  calculateComponentComplexity,
} from '@/utils/componentUtils'
import { ComponentType, BaseComponent, Position, Dimensions } from '@/types'

describe('Component Utils', () => {
  const mockComponent: BaseComponent = {
    id: 'test-component',
    type: ComponentType.TEXT,
    position: { x: 100, y: 100 },
    dimensions: { width: 200, height: 50 },
    props: { text: 'Hello World' },
    zIndex: 1,
    constraints: {
      movable: true,
      resizable: true,
      deletable: true,
      copyable: true,
    },
    metadata: {
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      version: 1,
    },
  }

  describe('createComponent', () => {
    it('should create a basic component', () => {
      const position: Position = { x: 50, y: 50 }
      const dimensions: Dimensions = { width: 100, height: 100 }
      const component = createComponent(
        ComponentType.BUTTON,
        position,
        dimensions
      )

      expect(component.type).toBe(ComponentType.BUTTON)
      expect(component.position).toEqual(position)
      expect(component.dimensions).toEqual(dimensions)
      expect(component.id).toBeDefined()
      expect(component.zIndex).toBe(0)
    })

    it('should create component with props and overrides', () => {
      const position: Position = { x: 0, y: 0 }
      const dimensions: Dimensions = { width: 50, height: 50 }
      const props = { backgroundColor: '#ff0000' }
      const overrides = { zIndex: 10 }

      const component = createComponent(
        ComponentType.IMAGE,
        position,
        dimensions,
        props,
        overrides
      )

      expect(component.props).toEqual(props)
      expect(component.zIndex).toBe(10)
    })
  })

  describe('generateComponentId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateComponentId()
      const id2 = generateComponentId()

      expect(id1).not.toBe(id2)
      expect(id1).toContain('component-')
      expect(id2).toContain('component-')
    })
  })

  describe('validateComponent', () => {
    it('should validate a valid component', () => {
      const result = validateComponent(mockComponent)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect invalid component type', () => {
      const invalidComponent = {
        ...mockComponent,
        type: 'invalid' as ComponentType,
      }
      const result = validateComponent(invalidComponent)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('constrainPositionToBounds', () => {
    it('should constrain position within bounds', () => {
      const position = { x: 1000, y: 700 }
      const dimensions = { width: 100, height: 50 }
      const bounds = { x: 0, y: 0, width: 800, height: 600 }

      const constrained = constrainPositionToBounds(
        position,
        dimensions,
        bounds
      )
      expect(constrained.x).toBeLessThanOrEqual(bounds.width - dimensions.width)
      expect(constrained.y).toBeLessThanOrEqual(
        bounds.height - dimensions.height
      )
    })
  })

  describe('constrainDimensionsToLimits', () => {
    it('should constrain dimensions to limits', () => {
      const dimensions = { width: 1000, height: 5 }
      const limits = {
        minWidth: 20,
        maxWidth: 500,
        minHeight: 10,
        maxHeight: 300,
      }

      const constrained = constrainDimensionsToLimits(dimensions, limits)
      expect(constrained.width).toBe(500)
      expect(constrained.height).toBe(10)
    })
  })

  describe('filterComponentsByType', () => {
    const components = [
      mockComponent,
      { ...mockComponent, id: 'button-1', type: ComponentType.BUTTON },
      { ...mockComponent, id: 'text-2', type: ComponentType.TEXT },
    ]

    it('should find components by type', () => {
      const textComponents = filterComponentsByType(
        components,
        ComponentType.TEXT
      )
      expect(textComponents).toHaveLength(2)
      expect(textComponents.every(c => c.type === ComponentType.TEXT)).toBe(
        true
      )
    })
  })

  describe('getComponentBounds', () => {
    it('should calculate component bounds', () => {
      const bounds = getComponentBounds(mockComponent)

      expect(bounds.left).toBe(100)
      expect(bounds.top).toBe(100)
      expect(bounds.width).toBe(200)
      expect(bounds.height).toBe(50)
    })
  })

  describe('doComponentsOverlap', () => {
    const component1 = mockComponent
    const component2 = {
      ...mockComponent,
      id: 'overlap-test',
      position: { x: 150, y: 125 },
    }

    it('should detect overlapping components', () => {
      const overlaps = doComponentsOverlap(component1, component2)
      expect(overlaps).toBe(true)
    })

    it('should detect non-overlapping components', () => {
      const component3 = {
        ...mockComponent,
        id: 'no-overlap',
        position: { x: 400, y: 400 },
      }
      const overlaps = doComponentsOverlap(component1, component3)
      expect(overlaps).toBe(false)
    })
  })

  describe('cloneComponent', () => {
    it('should create a deep copy with new ID', () => {
      const cloned = cloneComponent(mockComponent)

      expect(cloned).not.toBe(mockComponent)
      expect(cloned.id).not.toBe(mockComponent.id)
      expect(cloned.type).toBe(mockComponent.type)
    })
  })

  describe('isPointInComponent', () => {
    it('should detect if point is within component', () => {
      const pointInside = { x: 150, y: 125 }
      const pointOutside = { x: 500, y: 500 }

      expect(isPointInComponent(pointInside, mockComponent)).toBe(true)
      expect(isPointInComponent(pointOutside, mockComponent)).toBe(false)
    })
  })

  describe('getDefaultComponentProps', () => {
    it('should return default props for component type', () => {
      const textProps = getDefaultComponentProps(ComponentType.TEXT)
      const buttonProps = getDefaultComponentProps(ComponentType.BUTTON)

      expect(textProps).toBeDefined()
      expect(buttonProps).toBeDefined()
      expect(typeof textProps).toBe('object')
    })
  })

  describe('calculateComponentComplexity', () => {
    it('should calculate component complexity score', () => {
      const complexity = calculateComponentComplexity(mockComponent)

      expect(typeof complexity).toBe('number')
      expect(complexity).toBeGreaterThanOrEqual(0)
    })
  })

  describe('sortComponentsByZIndex', () => {
    const components = [
      { ...mockComponent, zIndex: 3 },
      { ...mockComponent, id: 'comp-2', zIndex: 1 },
      { ...mockComponent, id: 'comp-3', zIndex: 2 },
    ]

    it('should sort components by zIndex', () => {
      const sorted = sortComponentsByZIndex(components)

      expect(sorted[0].zIndex).toBe(1)
      expect(sorted[1].zIndex).toBe(2)
      expect(sorted[2].zIndex).toBe(3)
    })
  })

  describe('searchComponents', () => {
    const components = [
      mockComponent,
      {
        ...mockComponent,
        id: 'button-test',
        type: ComponentType.BUTTON,
        props: { text: 'Click me' },
      },
    ]

    it('should search components by text content', () => {
      const results = searchComponents(components, 'Hello')
      expect(results.length).toBeGreaterThan(0)
    })
  })
})
