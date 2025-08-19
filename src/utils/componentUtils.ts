import {
  BaseComponent,
  ComponentType,
  Position,
  Dimensions,
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from '@/types'

// Component creation utilities
export const createComponent = (
  type: ComponentType,
  position: Position,
  dimensions: Dimensions,
  props: Record<string, unknown> = {},
  overrides: Partial<BaseComponent> = {}
): BaseComponent => {
  const id = generateComponentId()
  const now = new Date()

  return {
    id,
    type,
    position,
    dimensions,
    props,
    zIndex: 0,
    constraints: {
      movable: true,
      resizable: true,
      deletable: true,
      copyable: true,
    },
    metadata: {
      createdAt: now,
      updatedAt: now,
      version: 1,
    },
    ...overrides,
  }
}

export const generateComponentId = (): string =>
  `component-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// Component validation utilities
export const validateComponent = (
  component: BaseComponent
): ValidationResult => {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []

  // Required field validation
  if (!component.id) {
    errors.push({
      componentId: component.id || 'unknown',
      field: 'id',
      message: 'Component ID is required',
      severity: 'error',
    })
  }

  if (!component.type) {
    errors.push({
      componentId: component.id,
      field: 'type',
      message: 'Component type is required',
      severity: 'error',
    })
  } else {
    // Validate component type is one of the valid enum values
    const validTypes = Object.values(ComponentType)
    if (!validTypes.includes(component.type)) {
      errors.push({
        componentId: component.id,
        field: 'type',
        message: `Invalid component type: ${component.type}. Must be one of: ${validTypes.join(', ')}`,
        severity: 'error',
      })
    }
  }

  if (!component.position) {
    errors.push({
      componentId: component.id,
      field: 'position',
      message: 'Component position is required',
      severity: 'error',
    })
  } else {
    // Position validation
    if (
      typeof component.position.x !== 'number' ||
      isNaN(component.position.x)
    ) {
      errors.push({
        componentId: component.id,
        field: 'position.x',
        message: 'Position X must be a valid number',
        severity: 'error',
      })
    }

    if (
      typeof component.position.y !== 'number' ||
      isNaN(component.position.y)
    ) {
      errors.push({
        componentId: component.id,
        field: 'position.y',
        message: 'Position Y must be a valid number',
        severity: 'error',
      })
    }

    // Position boundary warnings
    if (component.position.x < 0 || component.position.y < 0) {
      warnings.push({
        componentId: component.id,
        field: 'position',
        message: 'Component position is outside canvas boundaries',
        suggestion: 'Move component to positive coordinates',
      })
    }
  }

  if (!component.dimensions) {
    errors.push({
      componentId: component.id,
      field: 'dimensions',
      message: 'Component dimensions are required',
      severity: 'error',
    })
  } else {
    // Dimensions validation
    if (
      typeof component.dimensions.width !== 'number' ||
      component.dimensions.width <= 0
    ) {
      errors.push({
        componentId: component.id,
        field: 'dimensions.width',
        message: 'Width must be a positive number',
        severity: 'error',
      })
    }

    if (
      typeof component.dimensions.height !== 'number' ||
      component.dimensions.height <= 0
    ) {
      errors.push({
        componentId: component.id,
        field: 'dimensions.height',
        message: 'Height must be a positive number',
        severity: 'error',
      })
    }

    // Dimension constraint validation
    if (
      component.dimensions.minWidth &&
      component.dimensions.width < component.dimensions.minWidth
    ) {
      errors.push({
        componentId: component.id,
        field: 'dimensions.width',
        message: `Width (${component.dimensions.width}) is less than minimum width (${component.dimensions.minWidth})`,
        severity: 'error',
      })
    }

    if (
      component.dimensions.maxWidth &&
      component.dimensions.width > component.dimensions.maxWidth
    ) {
      errors.push({
        componentId: component.id,
        field: 'dimensions.width',
        message: `Width (${component.dimensions.width}) exceeds maximum width (${component.dimensions.maxWidth})`,
        severity: 'error',
      })
    }

    if (
      component.dimensions.minHeight &&
      component.dimensions.height < component.dimensions.minHeight
    ) {
      errors.push({
        componentId: component.id,
        field: 'dimensions.height',
        message: `Height (${component.dimensions.height}) is less than minimum height (${component.dimensions.minHeight})`,
        severity: 'error',
      })
    }

    if (
      component.dimensions.maxHeight &&
      component.dimensions.height > component.dimensions.maxHeight
    ) {
      errors.push({
        componentId: component.id,
        field: 'dimensions.height',
        message: `Height (${component.dimensions.height}) exceeds maximum height (${component.dimensions.maxHeight})`,
        severity: 'error',
      })
    }
  }

  // Z-index validation
  if (typeof component.zIndex !== 'number') {
    errors.push({
      componentId: component.id,
      field: 'zIndex',
      message: 'Z-index must be a number',
      severity: 'error',
    })
  }

  // Type-specific validation
  validateComponentByType(component, errors, warnings)

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

const validateComponentByType = (
  component: BaseComponent,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void => {
  switch (component.type) {
    case ComponentType.TEXT:
      if (!component.props.content && component.props.content !== '') {
        warnings.push({
          componentId: component.id,
          field: 'props.content',
          message: 'Text component should have content',
          suggestion: 'Add text content to display',
        })
      }
      break

    case ComponentType.BUTTON:
      if (!component.props.label && component.props.label !== '') {
        warnings.push({
          componentId: component.id,
          field: 'props.label',
          message: 'Button component should have a label',
          suggestion: 'Add button label text',
        })
      }
      break

    case ComponentType.IMAGE:
      if (!component.props.src) {
        errors.push({
          componentId: component.id,
          field: 'props.src',
          message: 'Image component requires a source URL',
          severity: 'error',
        })
      }
      if (!component.props.alt) {
        warnings.push({
          componentId: component.id,
          field: 'props.alt',
          message: 'Image should have alt text for accessibility',
          suggestion: 'Add descriptive alt text',
        })
      }
      break

    case ComponentType.INPUT:
      if (!component.props.type) {
        warnings.push({
          componentId: component.id,
          field: 'props.type',
          message: 'Input should specify a type',
          suggestion: 'Add input type (text, email, password, etc.)',
        })
      }
      break

    case ComponentType.CONTAINER:
      // Container-specific validation can be added here
      break

    default:
      // Generic component validation
      break
  }
}

// Component manipulation utilities
export const cloneComponent = (
  component: BaseComponent,
  overrides: Partial<BaseComponent> = {}
): BaseComponent => {
  const now = new Date()

  return {
    ...component,
    id: generateComponentId(),
    metadata: {
      ...component.metadata,
      createdAt: now,
      updatedAt: now,
      version: 1,
    },
    ...overrides,
  }
}

export const updateComponentMetadata = (
  component: BaseComponent
): BaseComponent => {
  return {
    ...component,
    metadata: {
      createdAt: component.metadata?.createdAt ?? new Date(),
      ...component.metadata,
      updatedAt: new Date(),
      version: (component.metadata?.version ?? 0) + 1,
    },
  }
}

// Position and dimension utilities
export const isPointInComponent = (
  point: Position,
  component: BaseComponent
): boolean => {
  return (
    point.x >= component.position.x &&
    point.x <= component.position.x + component.dimensions.width &&
    point.y >= component.position.y &&
    point.y <= component.position.y + component.dimensions.height
  )
}

export const getComponentBounds = (component: BaseComponent) => {
  return {
    left: component.position.x,
    top: component.position.y,
    right: component.position.x + component.dimensions.width,
    bottom: component.position.y + component.dimensions.height,
    width: component.dimensions.width,
    height: component.dimensions.height,
  }
}

export const doComponentsOverlap = (
  component1: BaseComponent,
  component2: BaseComponent
): boolean => {
  const bounds1 = getComponentBounds(component1)
  const bounds2 = getComponentBounds(component2)

  return !(
    bounds1.right <= bounds2.left ||
    bounds1.left >= bounds2.right ||
    bounds1.bottom <= bounds2.top ||
    bounds1.top >= bounds2.bottom
  )
}

export const constrainPositionToBounds = (
  position: Position,
  dimensions: Dimensions,
  bounds:
    | { x: number; y: number; width: number; height: number }
    | { minX: number; minY: number; maxX: number; maxY: number }
): Position => {
  // Handle both bounds formats
  let minX: number, minY: number, maxX: number, maxY: number

  if ('width' in bounds && 'height' in bounds) {
    // Format: { x, y, width, height }
    minX = bounds.x
    minY = bounds.y
    maxX = bounds.x + bounds.width
    maxY = bounds.y + bounds.height
  } else {
    // Format: { minX, minY, maxX, maxY }
    minX = (bounds as any).minX
    minY = (bounds as any).minY
    maxX = (bounds as any).maxX
    maxY = (bounds as any).maxY
  }

  return {
    x: Math.max(minX, Math.min(maxX - dimensions.width, position.x)),
    y: Math.max(minY, Math.min(maxY - dimensions.height, position.y)),
  }
}

export const constrainDimensionsToLimits = (
  dimensions: Dimensions,
  limits: {
    minWidth?: number
    minHeight?: number
    maxWidth?: number
    maxHeight?: number
  }
): Dimensions => {
  return {
    ...dimensions,
    width: Math.max(
      limits.minWidth ?? 1,
      Math.min(limits.maxWidth ?? Infinity, dimensions.width)
    ),
    height: Math.max(
      limits.minHeight ?? 1,
      Math.min(limits.maxHeight ?? Infinity, dimensions.height)
    ),
  }
}

// Component hierarchy utilities
export const getComponentChildren = (
  component: BaseComponent,
  allComponents: Map<string, BaseComponent>
): BaseComponent[] => {
  if (!component.children) return []

  return component.children
    .map(childId => allComponents.get(childId))
    .filter(Boolean) as BaseComponent[]
}

export const getComponentParent = (
  component: BaseComponent,
  allComponents: Map<string, BaseComponent>
): BaseComponent | null => {
  if (!component.parentId) return null
  return allComponents.get(component.parentId) || null
}

export const getAllComponentDescendants = (
  component: BaseComponent,
  allComponents: Map<string, BaseComponent>
): BaseComponent[] => {
  const descendants: BaseComponent[] = []
  const children = getComponentChildren(component, allComponents)

  for (const child of children) {
    descendants.push(child)
    descendants.push(...getAllComponentDescendants(child, allComponents))
  }

  return descendants
}

export const isComponentAncestor = (
  potentialAncestor: BaseComponent,
  component: BaseComponent,
  allComponents: Map<string, BaseComponent>
): boolean => {
  let current = getComponentParent(component, allComponents)

  while (current) {
    if (current.id === potentialAncestor.id) {
      return true
    }
    current = getComponentParent(current, allComponents)
  }

  return false
}

// Component sorting utilities
export const sortComponentsByZIndex = (
  components: BaseComponent[]
): BaseComponent[] => {
  return [...components].sort((a, b) => a.zIndex - b.zIndex)
}

export const sortComponentsByCreationDate = (
  components: BaseComponent[]
): BaseComponent[] => {
  return [...components].sort((a, b) => {
    const dateA = a.metadata?.createdAt?.getTime() ?? 0
    const dateB = b.metadata?.createdAt?.getTime() ?? 0
    return dateA - dateB
  })
}

export const sortComponentsByUpdateDate = (
  components: BaseComponent[]
): BaseComponent[] => {
  return [...components].sort((a, b) => {
    const dateA = a.metadata?.updatedAt?.getTime() ?? 0
    const dateB = b.metadata?.updatedAt?.getTime() ?? 0
    return dateB - dateA // Most recently updated first
  })
}

// Component filtering utilities
export const filterComponentsByType = (
  components: BaseComponent[],
  type: ComponentType
): BaseComponent[] => {
  return components.filter(component => component.type === type)
}

export const filterComponentsByBounds = (
  components: BaseComponent[],
  bounds: { x: number; y: number; width: number; height: number }
): BaseComponent[] => {
  return components.filter(component => {
    const componentBounds = getComponentBounds(component)
    return !(
      componentBounds.right <= bounds.x ||
      componentBounds.left >= bounds.x + bounds.width ||
      componentBounds.bottom <= bounds.y ||
      componentBounds.top >= bounds.y + bounds.height
    )
  })
}

export const searchComponents = (
  components: BaseComponent[],
  searchTerm: string
): BaseComponent[] => {
  if (!searchTerm.trim()) return components

  const term = searchTerm.toLowerCase()

  return components.filter(component => {
    // Search in component type
    if (component.type.toLowerCase().includes(term)) return true

    // Search in component ID
    if (component.id.toLowerCase().includes(term)) return true

    // Search in component props
    const propsString = JSON.stringify(component.props).toLowerCase()
    if (propsString.includes(term)) return true

    return false
  })
}

// Default component templates
export const getDefaultComponentProps = (
  type: ComponentType
): Record<string, unknown> => {
  switch (type) {
    case ComponentType.TEXT:
      return {
        content: 'Text content',
        fontSize: 16,
        fontFamily: 'Arial, sans-serif',
        color: '#000000',
        textAlign: 'left',
        fontWeight: 'normal',
      }

    case ComponentType.BUTTON:
      return {
        kind: 'button',
        url: 'https://example.com',
        label: 'Click Me',
        fontSize: 16,
        padding: 12,
        backgroundColor: '#1f2937',
        textColor: '#ffffff',
        borderRadius: 6,
      }

    case ComponentType.IMAGE:
      return {
        src: '',
        alt: '',
        objectFit: 'cover',
        loading: 'lazy',
      }

    case ComponentType.INPUT:
      return {
        type: 'text',
        placeholder: 'Enter text...',
        value: '',
        required: false,
        disabled: false,
      }

    case ComponentType.CONTAINER:
      return {
        backgroundColor: 'transparent',
        padding: 16,
        border: 'none',
        borderRadius: 0,
      }

    case ComponentType.FORM:
      return {
        method: 'POST',
        action: '',
        noValidate: false,
      }

    case ComponentType.GRID:
      return {
        columns: 12,
        gap: 16,
        alignItems: 'stretch',
        justifyContent: 'start',
      }

    case ComponentType.FLEX:
      return {
        direction: 'row',
        wrap: 'nowrap',
        alignItems: 'stretch',
        justifyContent: 'start',
        gap: 8,
      }

    default:
      return {}
  }
}

export const getDefaultComponentDimensions = (
  type: ComponentType
): Dimensions => {
  switch (type) {
    case ComponentType.TEXT:
      return { width: 200, height: 40, minWidth: 50, minHeight: 20 }

    case ComponentType.BUTTON:
      return { width: 120, height: 40, minWidth: 80, minHeight: 32 }

    case ComponentType.IMAGE:
      return { width: 200, height: 150, minWidth: 50, minHeight: 50 }

    case ComponentType.INPUT:
      return { width: 200, height: 40, minWidth: 100, minHeight: 32 }

    case ComponentType.CONTAINER:
      return { width: 300, height: 200, minWidth: 100, minHeight: 100 }

    case ComponentType.FORM:
      return { width: 400, height: 300, minWidth: 200, minHeight: 150 }

    case ComponentType.GRID:
      return { width: 600, height: 400, minWidth: 200, minHeight: 200 }

    case ComponentType.FLEX:
      return { width: 400, height: 200, minWidth: 150, minHeight: 100 }

    default:
      return { width: 100, height: 100, minWidth: 50, minHeight: 50 }
  }
}

// Component performance utilities
export const calculateComponentComplexity = (
  component: BaseComponent
): number => {
  let complexity = 1 // Base complexity

  // Add complexity based on props
  complexity += Object.keys(component.props).length * 0.1

  // Add complexity based on children
  if (component.children) {
    complexity += component.children.length * 0.5
  }

  // Type-specific complexity
  switch (component.type) {
    case ComponentType.GRID:
    case ComponentType.FLEX:
      complexity += 2 // Layout components are more complex
      break
    case ComponentType.FORM:
      complexity += 1.5 // Forms have validation logic
      break
    default:
      break
  }

  return Math.round(complexity * 10) / 10
}

export const estimateComponentRenderTime = (
  component: BaseComponent
): number => {
  const complexity = calculateComponentComplexity(component)
  return complexity * 2 // Estimated milliseconds
}
