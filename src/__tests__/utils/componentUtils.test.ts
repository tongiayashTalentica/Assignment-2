import {
  createComponent,
  generateComponentId,
  validateComponent,
  cloneComponent,
  updateComponentMetadata,
  isPointInComponent,
  getComponentBounds,
  doComponentsOverlap,
  constrainPositionToBounds,
  constrainDimensionsToLimits,
  getComponentChildren,
  getComponentParent,
  getAllComponentDescendants,
  isComponentAncestor,
  sortComponentsByZIndex,
  sortComponentsByCreationDate,
  sortComponentsByUpdateDate,
  filterComponentsByType,
  filterComponentsByBounds,
  searchComponents,
  getDefaultComponentProps,
  getDefaultComponentDimensions,
  calculateComponentComplexity,
  estimateComponentRenderTime,
} from '@/utils/componentUtils'
import { ComponentType, BaseComponent } from '@/types'

describe('Component Utils', () => {
  describe('Component Creation', () => {
    it('should create component with required properties', () => {
      const component = createComponent(
        ComponentType.TEXT,
        { x: 100, y: 100 },
        { width: 200, height: 40 }
      )

      expect(component.id).toBeDefined()
      expect(component.type).toBe(ComponentType.TEXT)
      expect(component.position).toEqual({ x: 100, y: 100 })
      expect(component.dimensions).toEqual({ width: 200, height: 40 })
      expect(component.props).toEqual({})
      expect(component.zIndex).toBe(0)
      expect(component.constraints).toBeDefined()
      expect(component.metadata).toBeDefined()
      expect(component.metadata?.createdAt).toBeInstanceOf(Date)
      expect(component.metadata?.updatedAt).toBeInstanceOf(Date)
      expect(component.metadata?.version).toBe(1)
    })

    it('should create component with custom props', () => {
      const props = { content: 'Hello World', fontSize: 16 }
      const component = createComponent(
        ComponentType.TEXT,
        { x: 0, y: 0 },
        { width: 100, height: 50 },
        props
      )

      expect(component.props).toEqual(props)
    })

    it('should create component with overrides', () => {
      const overrides = {
        zIndex: 5,
        parentId: 'parent-component',
      }
      const component = createComponent(
        ComponentType.TEXT,
        { x: 0, y: 0 },
        { width: 100, height: 50 },
        {},
        overrides
      )

      expect(component.zIndex).toBe(5)
      expect(component.parentId).toBe('parent-component')
    })

    it('should generate unique component IDs', () => {
      const id1 = generateComponentId()
      const id2 = generateComponentId()

      expect(id1).toBeDefined()
      expect(id2).toBeDefined()
      expect(id1).not.toBe(id2)
      expect(id1).toMatch(/^component-/)
      expect(id2).toMatch(/^component-/)
    })
  })

  describe('Component Validation', () => {
    it('should validate valid component', () => {
      const component = createComponent(
        ComponentType.TEXT,
        { x: 100, y: 100 },
        { width: 200, height: 40 }
      )

      const result = validateComponent(component)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect missing required fields', () => {
      const invalidComponent = {
        id: '',
        type: ComponentType.TEXT,
        position: { x: 100, y: 100 },
        dimensions: { width: 200, height: 40 },
        props: {},
        zIndex: 0,
      } as BaseComponent

      const result = validateComponent(invalidComponent)

      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'id')).toBe(true)
    })

    it('should validate position constraints', () => {
      const component = createComponent(
        ComponentType.TEXT,
        { x: -50, y: -50 },
        { width: 200, height: 40 }
      )

      const result = validateComponent(component)

      expect(result.warnings.some(w => w.field === 'position')).toBe(true)
      expect(
        result.warnings.some(w =>
          w.message.includes('outside canvas boundaries')
        )
      ).toBe(true)
    })

    it('should validate dimensions', () => {
      const component = createComponent(
        ComponentType.TEXT,
        { x: 100, y: 100 },
        { width: 0, height: -10 }
      )

      const result = validateComponent(component)

      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'dimensions.width')).toBe(true)
      expect(result.errors.some(e => e.field === 'dimensions.height')).toBe(
        true
      )
    })

    it('should validate dimension constraints', () => {
      const component = createComponent(
        ComponentType.TEXT,
        { x: 100, y: 100 },
        { width: 10, height: 10, minWidth: 50, minHeight: 20 }
      )

      const result = validateComponent(component)

      expect(result.isValid).toBe(false)
      expect(
        result.errors.some(e => e.message.includes('less than minimum width'))
      ).toBe(true)
      expect(
        result.errors.some(e => e.message.includes('less than minimum height'))
      ).toBe(true)
    })

    it('should validate component type-specific properties', () => {
      const imageComponent = createComponent(
        ComponentType.IMAGE,
        { x: 0, y: 0 },
        { width: 100, height: 100 },
        {} // Missing src
      )

      const result = validateComponent(imageComponent)

      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'props.src')).toBe(true)
      expect(result.warnings.some(w => w.field === 'props.alt')).toBe(true)
    })
  })

  describe('Component Manipulation', () => {
    it('should clone component with new ID', () => {
      const original = createComponent(
        ComponentType.TEXT,
        { x: 100, y: 100 },
        { width: 200, height: 40 },
        { content: 'Original' }
      )

      const cloned = cloneComponent(original)

      expect(cloned.id).not.toBe(original.id)
      expect(cloned.type).toBe(original.type)
      expect(cloned.position).toEqual(original.position)
      expect(cloned.dimensions).toEqual(original.dimensions)
      expect(cloned.props).toEqual(original.props)
      expect(cloned.metadata?.version).toBe(1)
    })

    it('should clone component with overrides', () => {
      const original = createComponent(
        ComponentType.TEXT,
        { x: 100, y: 100 },
        { width: 200, height: 40 }
      )

      const cloned = cloneComponent(original, {
        position: { x: 200, y: 200 },
        props: { content: 'Cloned' },
      })

      expect(cloned.position).toEqual({ x: 200, y: 200 })
      expect(cloned.props.content).toBe('Cloned')
    })

    it('should update component metadata', () => {
      const component = createComponent(
        ComponentType.TEXT,
        { x: 100, y: 100 },
        { width: 200, height: 40 }
      )

      const originalUpdatedAt = component.metadata?.updatedAt
      const originalVersion = component.metadata?.version

      // Wait a bit to ensure different timestamp
      jest.advanceTimersByTime(10)

      const updated = updateComponentMetadata(component)

      expect(updated.metadata?.updatedAt).not.toEqual(originalUpdatedAt)
      expect(updated.metadata?.version).toBe((originalVersion ?? 0) + 1)
      expect(updated.metadata?.createdAt).toEqual(component.metadata?.createdAt)
    })
  })

  describe('Position and Dimension Utilities', () => {
    const component = createComponent(
      ComponentType.TEXT,
      { x: 100, y: 100 },
      { width: 200, height: 40 }
    )

    it('should detect point in component', () => {
      expect(isPointInComponent({ x: 150, y: 120 }, component)).toBe(true)
      expect(isPointInComponent({ x: 50, y: 120 }, component)).toBe(false)
      expect(isPointInComponent({ x: 150, y: 50 }, component)).toBe(false)
      expect(isPointInComponent({ x: 350, y: 120 }, component)).toBe(false)
      expect(isPointInComponent({ x: 150, y: 200 }, component)).toBe(false)
    })

    it('should get component bounds', () => {
      const bounds = getComponentBounds(component)

      expect(bounds).toEqual({
        left: 100,
        top: 100,
        right: 300,
        bottom: 140,
        width: 200,
        height: 40,
      })
    })

    it('should detect component overlap', () => {
      const component1 = createComponent(
        ComponentType.TEXT,
        { x: 0, y: 0 },
        { width: 100, height: 100 }
      )

      const component2 = createComponent(
        ComponentType.TEXT,
        { x: 50, y: 50 },
        { width: 100, height: 100 }
      )

      const component3 = createComponent(
        ComponentType.TEXT,
        { x: 200, y: 200 },
        { width: 100, height: 100 }
      )

      expect(doComponentsOverlap(component1, component2)).toBe(true)
      expect(doComponentsOverlap(component1, component3)).toBe(false)
    })

    it('should constrain position to bounds', () => {
      const bounds = { minX: 0, minY: 0, maxX: 800, maxY: 600 }
      const dimensions = { width: 100, height: 50 }

      // Test normal position
      expect(
        constrainPositionToBounds({ x: 100, y: 100 }, dimensions, bounds)
      ).toEqual({ x: 100, y: 100 })

      // Test position outside left boundary
      expect(
        constrainPositionToBounds({ x: -50, y: 100 }, dimensions, bounds)
      ).toEqual({ x: 0, y: 100 })

      // Test position outside top boundary
      expect(
        constrainPositionToBounds({ x: 100, y: -50 }, dimensions, bounds)
      ).toEqual({ x: 100, y: 0 })

      // Test position outside right boundary
      expect(
        constrainPositionToBounds({ x: 750, y: 100 }, dimensions, bounds)
      ).toEqual({ x: 700, y: 100 })

      // Test position outside bottom boundary
      expect(
        constrainPositionToBounds({ x: 100, y: 580 }, dimensions, bounds)
      ).toEqual({ x: 100, y: 550 })
    })

    it('should constrain dimensions to limits', () => {
      const limits = {
        minWidth: 50,
        minHeight: 20,
        maxWidth: 500,
        maxHeight: 300,
      }

      // Test normal dimensions
      expect(
        constrainDimensionsToLimits({ width: 200, height: 100 }, limits)
      ).toEqual({ width: 200, height: 100 })

      // Test dimensions below minimum
      expect(
        constrainDimensionsToLimits({ width: 10, height: 5 }, limits)
      ).toEqual({ width: 50, height: 20 })

      // Test dimensions above maximum
      expect(
        constrainDimensionsToLimits({ width: 600, height: 400 }, limits)
      ).toEqual({ width: 500, height: 300 })
    })
  })

  describe('Component Hierarchy Utilities', () => {
    const childComponent1 = createComponent(
      ComponentType.TEXT,
      { x: 50, y: 50 },
      { width: 100, height: 40 }
    )

    const childComponent2 = createComponent(
      ComponentType.BUTTON,
      { x: 200, y: 50 },
      { width: 120, height: 40 }
    )

    const parentComponent = createComponent(
      ComponentType.CONTAINER,
      { x: 0, y: 0 },
      { width: 400, height: 300 },
      {},
      { children: [childComponent1.id, childComponent2.id] }
    )

    const grandChildComponent = createComponent(
      ComponentType.TEXT,
      { x: 10, y: 10 },
      { width: 80, height: 20 },
      {},
      { parentId: childComponent1.id }
    )

    // Set parent IDs and update child1 to have grandchild
    childComponent1.parentId = parentComponent.id
    childComponent2.parentId = parentComponent.id
    childComponent1.children = [grandChildComponent.id]

    const allComponents = new Map([
      [parentComponent.id, parentComponent],
      [childComponent1.id, childComponent1],
      [childComponent2.id, childComponent2],
      [grandChildComponent.id, grandChildComponent],
    ])

    it('should get component children', () => {
      const children = getComponentChildren(parentComponent, allComponents)

      expect(children).toHaveLength(2)
      expect(children.map(c => c.id)).toContain(childComponent1.id)
      expect(children.map(c => c.id)).toContain(childComponent2.id)
    })

    it('should get component parent', () => {
      const parent = getComponentParent(childComponent1, allComponents)

      expect(parent).toBeDefined()
      expect(parent?.id).toBe(parentComponent.id)
    })

    it('should get all component descendants', () => {
      const descendants = getAllComponentDescendants(
        parentComponent,
        allComponents
      )

      expect(descendants).toHaveLength(3) // child1, child2, grandchild
      expect(descendants.map(c => c.id)).toContain(childComponent1.id)
      expect(descendants.map(c => c.id)).toContain(childComponent2.id)
      expect(descendants.map(c => c.id)).toContain(grandChildComponent.id)
    })

    it('should detect component ancestry', () => {
      expect(
        isComponentAncestor(parentComponent, childComponent1, allComponents)
      ).toBe(true)
      expect(
        isComponentAncestor(parentComponent, grandChildComponent, allComponents)
      ).toBe(true)
      expect(
        isComponentAncestor(childComponent1, grandChildComponent, allComponents)
      ).toBe(true)
      expect(
        isComponentAncestor(childComponent2, grandChildComponent, allComponents)
      ).toBe(false)
    })
  })

  describe('Component Sorting Utilities', () => {
    const components = [
      createComponent(
        ComponentType.TEXT,
        { x: 0, y: 0 },
        { width: 100, height: 40 },
        {},
        { zIndex: 3 }
      ),
      createComponent(
        ComponentType.BUTTON,
        { x: 0, y: 0 },
        { width: 100, height: 40 },
        {},
        { zIndex: 1 }
      ),
      createComponent(
        ComponentType.IMAGE,
        { x: 0, y: 0 },
        { width: 100, height: 40 },
        {},
        { zIndex: 2 }
      ),
    ]

    it('should sort components by z-index', () => {
      const sorted = sortComponentsByZIndex(components)

      expect(sorted[0]?.zIndex).toBe(1)
      expect(sorted[1]?.zIndex).toBe(2)
      expect(sorted[2]?.zIndex).toBe(3)
    })

    it('should sort components by creation date', () => {
      // Create components with different creation dates
      const oldComponent = createComponent(
        ComponentType.TEXT,
        { x: 0, y: 0 },
        { width: 100, height: 40 }
      )
      const newComponent = createComponent(
        ComponentType.BUTTON,
        { x: 0, y: 0 },
        { width: 100, height: 40 }
      )

      // Manually set different creation dates
      if (oldComponent.metadata)
        oldComponent.metadata.createdAt = new Date('2023-01-01')
      if (newComponent.metadata)
        newComponent.metadata.createdAt = new Date('2023-12-01')

      const testComponents = [newComponent, oldComponent]
      const sorted = sortComponentsByCreationDate(testComponents)

      expect(sorted[0]?.metadata?.createdAt?.getTime() ?? 0).toBeLessThan(
        sorted[1]?.metadata?.createdAt?.getTime() ?? 0
      )
    })

    it('should sort components by update date', () => {
      const components = [
        createComponent(
          ComponentType.TEXT,
          { x: 0, y: 0 },
          { width: 100, height: 40 }
        ),
        createComponent(
          ComponentType.BUTTON,
          { x: 0, y: 0 },
          { width: 100, height: 40 }
        ),
      ]

      // Manually set different update dates
      if (components[0]?.metadata)
        components[0].metadata.updatedAt = new Date('2023-01-01')
      if (components[1]?.metadata)
        components[1].metadata.updatedAt = new Date('2023-12-01')

      const sorted = sortComponentsByUpdateDate(components)

      expect(sorted[0]?.metadata?.updatedAt?.getTime() ?? 0).toBeGreaterThan(
        sorted[1]?.metadata?.updatedAt?.getTime() ?? 0
      )
    })
  })

  describe('Component Filtering Utilities', () => {
    const components = [
      createComponent(
        ComponentType.TEXT,
        { x: 0, y: 0 },
        { width: 100, height: 40 }
      ),
      createComponent(
        ComponentType.BUTTON,
        { x: 100, y: 100 },
        { width: 120, height: 40 }
      ),
      createComponent(
        ComponentType.IMAGE,
        { x: 200, y: 200 },
        { width: 150, height: 100 }
      ),
      createComponent(
        ComponentType.TEXT,
        { x: 300, y: 300 },
        { width: 100, height: 40 }
      ),
    ]

    it('should filter components by type', () => {
      const textComponents = filterComponentsByType(
        components,
        ComponentType.TEXT
      )

      expect(textComponents).toHaveLength(2)
      expect(textComponents.every(c => c.type === ComponentType.TEXT)).toBe(
        true
      )
    })

    it('should filter components by bounds', () => {
      const bounds = { x: 50, y: 50, width: 200, height: 200 }
      const filtered = filterComponentsByBounds(components, bounds)

      // Should include components that intersect with the bounds
      expect(filtered.length).toBeGreaterThan(0)
      expect(filtered.length).toBeLessThan(components.length)
    })

    it('should search components by term', () => {
      const searchableComponents = [
        createComponent(
          ComponentType.TEXT,
          { x: 0, y: 0 },
          { width: 100, height: 40 },
          { content: 'Hello World' }
        ),
        createComponent(
          ComponentType.BUTTON,
          { x: 0, y: 0 },
          { width: 100, height: 40 },
          { label: 'Submit' }
        ),
        createComponent(
          ComponentType.IMAGE,
          { x: 0, y: 0 },
          { width: 100, height: 40 },
          { alt: 'Profile picture' }
        ),
      ]

      const results = searchComponents(searchableComponents, 'hello')
      expect(results).toHaveLength(1)
      expect(results[0]?.props.content).toBe('Hello World')

      const buttonResults = searchComponents(searchableComponents, 'button')
      expect(buttonResults).toHaveLength(1)
      expect(buttonResults[0]?.type).toBe(ComponentType.BUTTON)
    })
  })

  describe('Default Component Properties', () => {
    it('should return default props for text component', () => {
      const props = getDefaultComponentProps(ComponentType.TEXT)

      expect(props).toHaveProperty('content')
      expect(props).toHaveProperty('fontSize')
      expect(props).toHaveProperty('fontFamily')
      expect(props).toHaveProperty('color')
    })

    it('should return default props for button component', () => {
      const props = getDefaultComponentProps(ComponentType.BUTTON)

      expect(props).toHaveProperty('label')
      expect(props).toHaveProperty('variant')
      expect(props).toHaveProperty('size')
      expect(props).toHaveProperty('disabled')
    })

    it('should return default dimensions for components', () => {
      const textDimensions = getDefaultComponentDimensions(ComponentType.TEXT)
      expect(textDimensions).toHaveProperty('width')
      expect(textDimensions).toHaveProperty('height')
      expect(textDimensions).toHaveProperty('minWidth')
      expect(textDimensions).toHaveProperty('minHeight')

      const buttonDimensions = getDefaultComponentDimensions(
        ComponentType.BUTTON
      )
      expect(buttonDimensions.width).toBeGreaterThan(0)
      expect(buttonDimensions.height).toBeGreaterThan(0)
    })
  })

  describe('Performance Utilities', () => {
    it('should calculate component complexity', () => {
      const simpleComponent = createComponent(
        ComponentType.TEXT,
        { x: 0, y: 0 },
        { width: 100, height: 40 },
        { content: 'Hello' }
      )

      const complexComponent = createComponent(
        ComponentType.GRID,
        { x: 0, y: 0 },
        { width: 400, height: 300 },
        {
          columns: 12,
          rows: 6,
          gap: 16,
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        { children: ['child1', 'child2', 'child3'] }
      )

      const simpleComplexity = calculateComponentComplexity(simpleComponent)
      const complexComplexity = calculateComponentComplexity(complexComponent)

      expect(simpleComplexity).toBeGreaterThan(0)
      expect(complexComplexity).toBeGreaterThan(simpleComplexity)
    })

    it('should estimate component render time', () => {
      const component = createComponent(
        ComponentType.TEXT,
        { x: 0, y: 0 },
        { width: 100, height: 40 }
      )

      const renderTime = estimateComponentRenderTime(component)

      expect(renderTime).toBeGreaterThan(0)
      expect(typeof renderTime).toBe('number')
    })
  })
})

// Setup for timer mocks
beforeEach(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  jest.runOnlyPendingTimers()
  jest.useRealTimers()
})
