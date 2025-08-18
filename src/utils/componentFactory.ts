import {
  BaseComponent,
  ComponentType,
  Position,
  Dimensions,
  ComponentProperties,
  ValidationResult,
} from '@/types'

const generateId = (): string =>
  `component-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

const DEFAULT_DIMENSIONS: Record<ComponentType, Dimensions> = {
  [ComponentType.TEXT]: { width: 200, height: 40 },
  [ComponentType.TEXTAREA]: { width: 300, height: 120 },
  [ComponentType.IMAGE]: { width: 200, height: 200 },
  [ComponentType.BUTTON]: { width: 160, height: 44 },
  // Unused for factory in Task-003
  [ComponentType.CONTAINER]: { width: 300, height: 200 },
  [ComponentType.INPUT]: { width: 240, height: 40 },
  [ComponentType.FORM]: { width: 400, height: 400 },
  [ComponentType.GRID]: { width: 300, height: 200 },
  [ComponentType.FLEX]: { width: 300, height: 200 },
}

export const getDefaultProperties = (
  type: ComponentType
): ComponentProperties => {
  switch (type) {
    case ComponentType.TEXT:
      return {
        kind: 'text',
        content: 'Text',
        fontSize: 16,
        fontWeight: 400,
        color: '#000000',
      }
    case ComponentType.TEXTAREA:
      return {
        kind: 'textarea',
        content: 'Multiline text',
        fontSize: 16,
        color: '#000000',
        textAlign: 'left',
      }
    case ComponentType.IMAGE:
      return {
        kind: 'image',
        src: 'https://via.placeholder.com/200',
        alt: 'Placeholder image',
        objectFit: 'cover',
        borderRadius: 0,
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
    default:
      // Fallback to text
      return {
        kind: 'text',
        content: 'Text',
        fontSize: 16,
        fontWeight: 400,
        color: '#000000',
      }
  }
}

export const createComponent = (
  type: ComponentType,
  position: Position,
  overrides?: Partial<BaseComponent>
): BaseComponent => {
  const id = generateId()
  const now = new Date()
  const dimensions = overrides?.dimensions ||
    DEFAULT_DIMENSIONS[type] || { width: 200, height: 40 }

  const component: BaseComponent = {
    id,
    type,
    position,
    dimensions,
    props: getDefaultProperties(type) as unknown as Record<string, unknown>,
    zIndex: 1,
    constraints: {
      movable: true,
      resizable: true,
      deletable: true,
      copyable: true,
    },
    metadata: { createdAt: now, updatedAt: now, version: 1 },
    ...overrides,
  }

  return component
}

// Validation helpers
const isHexColor = (value: string): boolean => /^#[0-9A-Fa-f]{6}$/.test(value)
const isValidUrl = (value: string): boolean => {
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

export const validateProperties = (
  type: ComponentType,
  props: ComponentProperties
): ValidationResult => {
  const errors: ValidationResult['errors'] = []
  const warnings: ValidationResult['warnings'] = []

  const componentId = 'unknown'

  switch (type) {
    case ComponentType.TEXT: {
      const p = props as Extract<ComponentProperties, { kind: 'text' }>
      if (p.fontSize < 8 || p.fontSize > 72) {
        errors.push({
          componentId,
          field: 'props.fontSize',
          message: 'Font size must be between 8 and 72',
          severity: 'error',
        })
      }
      if (![400, 700].includes(p.fontWeight)) {
        errors.push({
          componentId,
          field: 'props.fontWeight',
          message: 'Font weight must be 400 or 700',
          severity: 'error',
        })
      }
      if (!isHexColor(p.color)) {
        errors.push({
          componentId,
          field: 'props.color',
          message: 'Color must be a valid hex color',
          severity: 'error',
        })
      }
      break
    }
    case ComponentType.TEXTAREA: {
      const p = props as Extract<ComponentProperties, { kind: 'textarea' }>
      if (p.fontSize < 8 || p.fontSize > 72) {
        errors.push({
          componentId,
          field: 'props.fontSize',
          message: 'Font size must be between 8 and 72',
          severity: 'error',
        })
      }
      if (!isHexColor(p.color)) {
        errors.push({
          componentId,
          field: 'props.color',
          message: 'Color must be a valid hex color',
          severity: 'error',
        })
      }
      if (!['left', 'center', 'right'].includes(p.textAlign)) {
        errors.push({
          componentId,
          field: 'props.textAlign',
          message: 'Text align must be left, center, or right',
          severity: 'error',
        })
      }
      break
    }
    case ComponentType.IMAGE: {
      const p = props as Extract<ComponentProperties, { kind: 'image' }>
      if (!p.src || !isValidUrl(p.src)) {
        errors.push({
          componentId,
          field: 'props.src',
          message: 'Image URL must be valid',
          severity: 'error',
        })
      }
      if (!(p.borderRadius >= 0 && p.borderRadius <= 50)) {
        errors.push({
          componentId,
          field: 'props.borderRadius',
          message: 'Border radius must be 0-50',
          severity: 'error',
        })
      }
      break
    }
    case ComponentType.BUTTON: {
      const p = props as Extract<ComponentProperties, { kind: 'button' }>
      if (!p.url || !isValidUrl(p.url)) {
        errors.push({
          componentId,
          field: 'props.url',
          message: 'URL must be valid',
          severity: 'error',
        })
      }
      if (p.fontSize < 8 || p.fontSize > 72) {
        errors.push({
          componentId,
          field: 'props.fontSize',
          message: 'Font size must be between 8 and 72',
          severity: 'error',
        })
      }
      if (!(p.borderRadius >= 0 && p.borderRadius <= 50)) {
        errors.push({
          componentId,
          field: 'props.borderRadius',
          message: 'Border radius must be 0-50',
          severity: 'error',
        })
      }
      if (!isHexColor(p.backgroundColor) || !isHexColor(p.textColor)) {
        errors.push({
          componentId,
          field: 'props.colors',
          message: 'Colors must be valid hex values',
          severity: 'error',
        })
      }
      break
    }
  }

  return { isValid: errors.length === 0, errors, warnings }
}

export const cloneComponent = (component: BaseComponent): BaseComponent => {
  const now = new Date()
  return {
    ...component,
    id: generateId(),
    metadata: {
      createdAt: now,
      updatedAt: now,
      version: 1,
    },
  }
}

export const ComponentFactory = {
  create: createComponent,
  getDefaultProperties,
  validateComponent: (component: BaseComponent): ValidationResult => {
    return validateProperties(
      component.type,
      component.props as unknown as ComponentProperties
    )
  },
  cloneComponent,
}
