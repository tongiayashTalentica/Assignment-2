import { ComponentType } from '@/types'
import { ControlField } from '@/components/ui/controls'
import { OBJECT_FIT_DROPDOWN_OPTIONS } from '@/components/ui/controls/Dropdown'
import {
  ALIGNMENT_OPTIONS,
  FONT_WEIGHT_BUTTON_OPTIONS,
} from '@/components/ui/controls/ButtonGroup'

// Form generation interface
export interface PropertyForm {
  componentType: ComponentType
  fields: PropertyField[]
  layout: FormLayout
}

export interface PropertyField extends ControlField {
  id: string
  order: number
  group?: string
  dependencies?: string[] // Fields that this field depends on
  conditional?: {
    field: string
    value: unknown
    operator: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan'
  }
}

export interface FormLayout {
  columns: number
  groups: FormGroup[]
}

export interface FormGroup {
  id: string
  title: string
  fields: string[] // Field IDs
  collapsible?: boolean
  defaultExpanded?: boolean
}

// Component-specific form field definitions
const COMPONENT_FORM_FIELDS: Record<ComponentType, PropertyField[]> = {
  [ComponentType.TEXT]: [
    {
      id: 'content',
      name: 'content',
      type: 'textarea',
      label: 'Content',
      order: 1,
      group: 'content',
      validation: {
        required: true,
        minLength: 1,
        maxLength: 1000,
      },
      props: {
        placeholder: 'Enter text content...',
        rows: 3,
      },
    },
    {
      id: 'fontSize',
      name: 'fontSize',
      type: 'slider',
      label: 'Font Size',
      order: 2,
      group: 'typography',
      validation: {
        required: true,
        min: 8,
        max: 72,
      },
      props: {
        min: 8,
        max: 72,
        step: 1,
        unit: 'px',
        showNumericInput: true,
      },
    },
    {
      id: 'fontWeight',
      name: 'fontWeight',
      type: 'buttonGroup',
      label: 'Font Weight',
      order: 3,
      group: 'typography',
      validation: {
        required: true,
      },
      options: FONT_WEIGHT_BUTTON_OPTIONS.map(opt => ({
        value: opt.value,
        label: opt.label,
        icon: opt.icon,
        'aria-label': opt['aria-label'],
      })),
      props: {
        variant: 'default',
      },
    },
    {
      id: 'color',
      name: 'color',
      type: 'color',
      label: 'Text Color',
      order: 4,
      group: 'appearance',
      validation: {
        required: true,
        pattern: /^#[0-9A-F]{6}$/i,
      },
    },
  ],

  [ComponentType.TEXTAREA]: [
    {
      id: 'content',
      name: 'content',
      type: 'textarea',
      label: 'Content',
      order: 1,
      group: 'content',
      validation: {
        required: true,
        minLength: 1,
        maxLength: 5000,
      },
      props: {
        placeholder: 'Enter multi-line text...',
        rows: 4,
      },
    },
    {
      id: 'fontSize',
      name: 'fontSize',
      type: 'slider',
      label: 'Font Size',
      order: 2,
      group: 'typography',
      validation: {
        required: true,
        min: 8,
        max: 72,
      },
      props: {
        min: 8,
        max: 72,
        step: 1,
        unit: 'px',
        showNumericInput: true,
      },
    },
    {
      id: 'color',
      name: 'color',
      type: 'color',
      label: 'Text Color',
      order: 3,
      group: 'appearance',
      validation: {
        required: true,
        pattern: /^#[0-9A-F]{6}$/i,
      },
    },
    {
      id: 'textAlign',
      name: 'textAlign',
      type: 'buttonGroup',
      label: 'Text Alignment',
      order: 4,
      group: 'appearance',
      validation: {
        required: true,
      },
      options: ALIGNMENT_OPTIONS.map(opt => ({
        value: opt.value,
        label: opt.label,
      })),
      props: {
        variant: 'default',
      },
    },
  ],

  [ComponentType.IMAGE]: [
    {
      id: 'src',
      name: 'src',
      type: 'url',
      label: 'Image URL',
      order: 1,
      group: 'source',
      validation: {
        required: true,
        minLength: 1,
        custom: (value: unknown) => {
          if (typeof value !== 'string') return false
          if (!value) return false
          try {
            new URL(value)
            return true
          } catch {
            return (
              value.startsWith('/') ||
              value.startsWith('./') ||
              value.startsWith('data:')
            )
          }
        },
      },
      props: {
        placeholder: 'https://example.com/image.jpg',
      },
    },
    {
      id: 'alt',
      name: 'alt',
      type: 'text',
      label: 'Alt Text',
      order: 2,
      group: 'accessibility',
      validation: {
        maxLength: 200,
      },
      props: {
        placeholder: 'Describe the image...',
      },
    },
    {
      id: 'objectFit',
      name: 'objectFit',
      type: 'dropdown',
      label: 'Object Fit',
      order: 3,
      group: 'appearance',
      validation: {
        required: true,
      },
      options: OBJECT_FIT_DROPDOWN_OPTIONS.map(opt => ({
        value: opt.value,
        label: opt.label,
        description: opt.description,
      })),
      props: {
        searchable: false,
      },
    },
    {
      id: 'borderRadius',
      name: 'borderRadius',
      type: 'slider',
      label: 'Border Radius',
      order: 4,
      group: 'appearance',
      validation: {
        required: true,
        min: 0,
        max: 50,
      },
      props: {
        min: 0,
        max: 50,
        step: 1,
        unit: 'px',
        showNumericInput: true,
      },
    },
  ],

  [ComponentType.BUTTON]: [
    {
      id: 'url',
      name: 'url',
      type: 'url',
      label: 'Target URL',
      order: 1,
      group: 'action',
      validation: {
        required: true,
        custom: (value: unknown) => {
          if (typeof value !== 'string') return false
          if (!value) return false
          try {
            new URL(value)
            return true
          } catch {
            return value.startsWith('/') || value.startsWith('./')
          }
        },
      },
      props: {
        placeholder: 'https://example.com',
      },
    },
    {
      id: 'label',
      name: 'label',
      type: 'text',
      label: 'Button Text',
      order: 2,
      group: 'content',
      validation: {
        required: true,
        minLength: 1,
        maxLength: 100,
      },
      props: {
        placeholder: 'Click me',
      },
    },
    {
      id: 'fontSize',
      name: 'fontSize',
      type: 'slider',
      label: 'Font Size',
      order: 3,
      group: 'typography',
      validation: {
        required: true,
        min: 8,
        max: 72,
      },
      props: {
        min: 8,
        max: 72,
        step: 1,
        unit: 'px',
        showNumericInput: true,
      },
    },
    {
      id: 'padding',
      name: 'padding',
      type: 'slider',
      label: 'Padding',
      order: 4,
      group: 'layout',
      validation: {
        required: true,
        min: 0,
        max: 50,
      },
      props: {
        min: 0,
        max: 50,
        step: 1,
        unit: 'px',
        showNumericInput: true,
      },
    },
    {
      id: 'backgroundColor',
      name: 'backgroundColor',
      type: 'color',
      label: 'Background Color',
      order: 5,
      group: 'appearance',
      validation: {
        required: true,
        pattern: /^#[0-9A-F]{6}$/i,
      },
    },
    {
      id: 'textColor',
      name: 'textColor',
      type: 'color',
      label: 'Text Color',
      order: 6,
      group: 'appearance',
      validation: {
        required: true,
        pattern: /^#[0-9A-F]{6}$/i,
      },
    },
    {
      id: 'borderRadius',
      name: 'borderRadius',
      type: 'slider',
      label: 'Border Radius',
      order: 7,
      group: 'appearance',
      validation: {
        required: true,
        min: 0,
        max: 50,
      },
      props: {
        min: 0,
        max: 50,
        step: 1,
        unit: 'px',
        showNumericInput: true,
      },
    },
  ],

  // Default empty definitions for other component types
  [ComponentType.CONTAINER]: [],
  [ComponentType.INPUT]: [],
  [ComponentType.FORM]: [],
  [ComponentType.GRID]: [],
  [ComponentType.FLEX]: [],
}

// Form layout definitions
const COMPONENT_FORM_LAYOUTS: Record<ComponentType, FormLayout> = {
  [ComponentType.TEXT]: {
    columns: 2,
    groups: [
      {
        id: 'content',
        title: 'Content',
        fields: ['content'],
        defaultExpanded: true,
      },
      {
        id: 'typography',
        title: 'Typography',
        fields: ['fontSize', 'fontWeight'],
        defaultExpanded: true,
      },
      {
        id: 'appearance',
        title: 'Appearance',
        fields: ['color'],
        defaultExpanded: true,
      },
    ],
  },

  [ComponentType.TEXTAREA]: {
    columns: 2,
    groups: [
      {
        id: 'content',
        title: 'Content',
        fields: ['content'],
        defaultExpanded: true,
      },
      {
        id: 'typography',
        title: 'Typography',
        fields: ['fontSize'],
        defaultExpanded: true,
      },
      {
        id: 'appearance',
        title: 'Appearance',
        fields: ['color', 'textAlign'],
        defaultExpanded: true,
      },
    ],
  },

  [ComponentType.IMAGE]: {
    columns: 2,
    groups: [
      {
        id: 'source',
        title: 'Source',
        fields: ['src'],
        defaultExpanded: true,
      },
      {
        id: 'accessibility',
        title: 'Accessibility',
        fields: ['alt'],
        defaultExpanded: true,
      },
      {
        id: 'appearance',
        title: 'Appearance',
        fields: ['objectFit', 'borderRadius'],
        defaultExpanded: true,
      },
    ],
  },

  [ComponentType.BUTTON]: {
    columns: 2,
    groups: [
      {
        id: 'action',
        title: 'Action',
        fields: ['url'],
        defaultExpanded: true,
      },
      {
        id: 'content',
        title: 'Content',
        fields: ['label'],
        defaultExpanded: true,
      },
      {
        id: 'typography',
        title: 'Typography',
        fields: ['fontSize'],
        defaultExpanded: true,
      },
      {
        id: 'layout',
        title: 'Layout',
        fields: ['padding'],
        defaultExpanded: true,
      },
      {
        id: 'appearance',
        title: 'Appearance',
        fields: ['backgroundColor', 'textColor', 'borderRadius'],
        defaultExpanded: true,
      },
    ],
  },

  // Default layouts for other component types
  [ComponentType.CONTAINER]: { columns: 2, groups: [] },
  [ComponentType.INPUT]: { columns: 2, groups: [] },
  [ComponentType.FORM]: { columns: 2, groups: [] },
  [ComponentType.GRID]: { columns: 2, groups: [] },
  [ComponentType.FLEX]: { columns: 2, groups: [] },
}

// Form generation utilities
export const generatePropertyForm = (
  componentType: ComponentType
): PropertyForm => {
  const fields = COMPONENT_FORM_FIELDS[componentType] || []
  const layout = COMPONENT_FORM_LAYOUTS[componentType] || {
    columns: 2,
    groups: [],
  }

  return {
    componentType,
    fields: [...fields].sort((a, b) => a.order - b.order),
    layout,
  }
}

export const getFieldsByGroup = (
  fields: PropertyField[],
  groupId: string
): PropertyField[] => {
  return fields.filter(field => field.group === groupId)
}

export const getFieldById = (
  fields: PropertyField[],
  fieldId: string
): PropertyField | undefined => {
  return fields.find(field => field.id === fieldId)
}

export const shouldShowField = (
  field: PropertyField,
  currentValues: Record<string, unknown>
): boolean => {
  if (!field.conditional) return true

  const {
    field: conditionField,
    value: conditionValue,
    operator,
  } = field.conditional
  const currentValue = currentValues[conditionField]

  switch (operator) {
    case 'equals':
      return currentValue === conditionValue
    case 'notEquals':
      return currentValue !== conditionValue
    case 'greaterThan':
      return (
        typeof currentValue === 'number' &&
        typeof conditionValue === 'number' &&
        currentValue > conditionValue
      )
    case 'lessThan':
      return (
        typeof currentValue === 'number' &&
        typeof conditionValue === 'number' &&
        currentValue < conditionValue
      )
    default:
      return true
  }
}

export const getFieldDependencies = (field: PropertyField): string[] => {
  const dependencies = field.dependencies || []
  if (field.conditional) {
    dependencies.push(field.conditional.field)
  }
  return dependencies
}

// Form validation utilities
export const validateFormData = (
  fields: PropertyField[],
  values: Record<string, unknown>
): { isValid: boolean; errors: Record<string, string[]> } => {
  const errors: Record<string, string[]> = {}

  fields.forEach(field => {
    if (!shouldShowField(field, values)) return

    const fieldErrors: string[] = []
    const value = values[field.name]
    const validation = field.validation

    if (!validation) return

    // Required validation
    if (
      validation.required &&
      (value === undefined || value === null || value === '')
    ) {
      fieldErrors.push(`${field.label} is required`)
    }

    // Skip other validations if field is empty and not required
    if (value === undefined || value === null || value === '') {
      if (fieldErrors.length > 0) {
        errors[field.name] = fieldErrors
      }
      return
    }

    // String validations
    if (typeof value === 'string') {
      if (
        validation.minLength !== undefined &&
        value.length < validation.minLength
      ) {
        fieldErrors.push(
          `${field.label} must be at least ${validation.minLength} characters`
        )
      }
      if (
        validation.maxLength !== undefined &&
        value.length > validation.maxLength
      ) {
        fieldErrors.push(
          `${field.label} must be no more than ${validation.maxLength} characters`
        )
      }
      if (validation.pattern && !validation.pattern.test(value)) {
        fieldErrors.push(`${field.label} format is invalid`)
      }
    }

    // Number validations
    if (
      typeof value === 'number' ||
      (typeof value === 'string' && !isNaN(Number(value)))
    ) {
      const numValue = Number(value)
      if (validation.min !== undefined && numValue < validation.min) {
        fieldErrors.push(`${field.label} must be at least ${validation.min}`)
      }
      if (validation.max !== undefined && numValue > validation.max) {
        fieldErrors.push(
          `${field.label} must be no more than ${validation.max}`
        )
      }
    }

    // Custom validation
    if (validation.custom) {
      const isValid = validation.custom(value)
      if (!isValid) {
        fieldErrors.push(`${field.label} is invalid`)
      }
    }

    if (fieldErrors.length > 0) {
      errors[field.name] = fieldErrors
    }
  })

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

// Default values for form fields
export const getDefaultFormValues = (
  fields: PropertyField[]
): Record<string, unknown> => {
  const defaults: Record<string, unknown> = {}

  fields.forEach(field => {
    switch (field.type) {
      case 'text':
      case 'textarea':
      case 'url':
        defaults[field.name] = ''
        break
      case 'number':
      case 'slider': {
        const min = (field.props?.min as number) || 0
        defaults[field.name] = min
        break
      }
      case 'color':
        defaults[field.name] = '#000000'
        break
      case 'dropdown':
      case 'buttonGroup':
        if (field.options && field.options.length > 0) {
          defaults[field.name] = field.options[0].value
        }
        break
      default:
        defaults[field.name] = null
    }
  })

  return defaults
}
