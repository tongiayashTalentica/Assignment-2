import { ComponentType } from '@/types'

// Validation result interface
export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  field: string
  message: string
  severity: 'error' | 'warning'
}

export interface ValidationWarning {
  field: string
  message: string
  suggestion?: string
}

// Individual field validation rules
export interface FieldValidation {
  required?: boolean
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: RegExp
  custom?: (value: unknown, allProps?: Record<string, unknown>) => string | null
}

// Component-specific validation rules
const VALIDATION_RULES: Record<
  ComponentType,
  Record<string, FieldValidation>
> = {
  [ComponentType.TEXT]: {
    content: {
      required: false, // Allow empty content
      minLength: 0, // Allow empty strings
      maxLength: 1000,
      custom: value => {
        if (
          value !== undefined &&
          value !== null &&
          typeof value !== 'string'
        ) {
          return 'Content must be a string'
        }
        return null
      },
    },
    fontSize: {
      required: true,
      min: 8,
      max: 72,
      custom: value => {
        const num = Number(value)
        if (isNaN(num)) return 'Font size must be a number'
        if (num < 8 || num > 72)
          return 'Font size must be between 8 and 72 pixels'
        return null
      },
    },
    fontWeight: {
      required: true,
      custom: value => {
        const validWeights = [400, 700]
        if (!validWeights.includes(value as number)) {
          return 'Font weight must be 400 (Normal) or 700 (Bold)'
        }
        return null
      },
    },
    color: {
      required: true,
      pattern: /^#[0-9A-F]{6}$/i,
      custom: value => {
        if (typeof value !== 'string') return 'Color must be a string'
        if (!/^#[0-9A-F]{6}$/i.test(value))
          return 'Color must be a valid hex color (e.g., #000000)'
        return null
      },
    },
  },
  [ComponentType.TEXTAREA]: {
    content: {
      required: false, // Allow empty content
      minLength: 0, // Allow empty strings
      maxLength: 5000,
      custom: value => {
        if (
          value !== undefined &&
          value !== null &&
          typeof value !== 'string'
        ) {
          return 'Content must be a string'
        }
        return null
      },
    },
    fontSize: {
      required: true,
      min: 8,
      max: 72,
      custom: value => {
        const num = Number(value)
        if (isNaN(num)) return 'Font size must be a number'
        if (num < 8 || num > 72)
          return 'Font size must be between 8 and 72 pixels'
        return null
      },
    },
    color: {
      required: true,
      pattern: /^#[0-9A-F]{6}$/i,
      custom: value => {
        if (typeof value !== 'string') return 'Color must be a string'
        if (!/^#[0-9A-F]{6}$/i.test(value))
          return 'Color must be a valid hex color (e.g., #000000)'
        return null
      },
    },
    textAlign: {
      required: true,
      custom: value => {
        const validAlignments = ['left', 'center', 'right']
        if (!validAlignments.includes(value as string)) {
          return 'Text alignment must be left, center, or right'
        }
        return null
      },
    },
  },
  [ComponentType.IMAGE]: {
    src: {
      required: true,
      minLength: 1,
      custom: value => {
        if (typeof value !== 'string') return 'Image URL must be a string'
        if (!value) return 'Image URL is required'

        // Basic URL validation
        try {
          new URL(value)
          return null
        } catch {
          // Allow relative URLs and data URLs
          if (
            value.startsWith('/') ||
            value.startsWith('./') ||
            value.startsWith('data:')
          ) {
            return null
          }
          return 'Image URL must be a valid URL'
        }
      },
    },
    alt: {
      maxLength: 200,
      custom: value => {
        if (value && typeof value !== 'string')
          return 'Alt text must be a string'
        return null
      },
    },
    objectFit: {
      required: true,
      custom: value => {
        const validFits = ['cover', 'contain', 'fill']
        if (!validFits.includes(value as string)) {
          return 'Object fit must be cover, contain, or fill'
        }
        return null
      },
    },
    borderRadius: {
      required: true,
      min: 0,
      max: 50,
      custom: value => {
        const num = Number(value)
        if (isNaN(num)) return 'Border radius must be a number'
        if (num < 0 || num > 50)
          return 'Border radius must be between 0 and 50 pixels'
        return null
      },
    },
  },
  [ComponentType.BUTTON]: {
    url: {
      required: true,
      custom: value => {
        if (typeof value !== 'string') return 'URL must be a string'
        if (!value) return 'URL is required'

        try {
          new URL(value)
          return null
        } catch {
          // Allow relative URLs
          if (value.startsWith('/') || value.startsWith('./')) {
            return null
          }
          return 'URL must be a valid URL'
        }
      },
    },
    label: {
      required: true,
      minLength: 1,
      maxLength: 100,
      custom: value => {
        if (typeof value !== 'string') return 'Button text must be a string'
        if (!value.trim()) return 'Button text cannot be empty'
        return null
      },
    },
    fontSize: {
      required: true,
      min: 8,
      max: 72,
      custom: value => {
        const num = Number(value)
        if (isNaN(num)) return 'Font size must be a number'
        if (num < 8 || num > 72)
          return 'Font size must be between 8 and 72 pixels'
        return null
      },
    },
    padding: {
      required: true,
      min: 0,
      max: 50,
      custom: value => {
        const num = Number(value)
        if (isNaN(num)) return 'Padding must be a number'
        if (num < 0 || num > 50)
          return 'Padding must be between 0 and 50 pixels'
        return null
      },
    },
    backgroundColor: {
      required: true,
      pattern: /^#[0-9A-F]{6}$/i,
      custom: value => {
        if (typeof value !== 'string')
          return 'Background color must be a string'
        if (!/^#[0-9A-F]{6}$/i.test(value))
          return 'Background color must be a valid hex color (e.g., #000000)'
        return null
      },
    },
    textColor: {
      required: true,
      pattern: /^#[0-9A-F]{6}$/i,
      custom: value => {
        if (typeof value !== 'string') return 'Text color must be a string'
        if (!/^#[0-9A-F]{6}$/i.test(value))
          return 'Text color must be a valid hex color (e.g., #000000)'
        return null
      },
    },
    borderRadius: {
      required: true,
      min: 0,
      max: 50,
      custom: value => {
        const num = Number(value)
        if (isNaN(num)) return 'Border radius must be a number'
        if (num < 0 || num > 50)
          return 'Border radius must be between 0 and 50 pixels'
        return null
      },
    },
  },
  // Add other component types with basic validation
  [ComponentType.CONTAINER]: {},
  [ComponentType.INPUT]: {},
  [ComponentType.FORM]: {},
  [ComponentType.GRID]: {},
  [ComponentType.FLEX]: {},
}

// Validate a single field
export const validateField = (
  value: unknown,
  fieldName: string,
  rules: FieldValidation,
  allProps?: Record<string, unknown>
): ValidationError[] => {
  const errors: ValidationError[] = []

  // Required validation
  if (
    rules.required &&
    (value === undefined || value === null || value === '')
  ) {
    errors.push({
      field: fieldName,
      message: `${fieldName} is required`,
      severity: 'error',
    })
    return errors // Don't continue validation if required field is missing
  }

  // Skip other validations if value is empty and not required
  if (value === undefined || value === null || value === '') {
    return errors
  }

  // String validations
  if (typeof value === 'string') {
    if (rules.minLength !== undefined && value.length < rules.minLength) {
      errors.push({
        field: fieldName,
        message: `${fieldName} must be at least ${rules.minLength} characters long`,
        severity: 'error',
      })
    }

    if (rules.maxLength !== undefined && value.length > rules.maxLength) {
      errors.push({
        field: fieldName,
        message: `${fieldName} must be no more than ${rules.maxLength} characters long`,
        severity: 'error',
      })
    }

    if (rules.pattern && !rules.pattern.test(value)) {
      errors.push({
        field: fieldName,
        message: `${fieldName} format is invalid`,
        severity: 'error',
      })
    }
  }

  // Number validations
  if (
    typeof value === 'number' ||
    (typeof value === 'string' && !isNaN(Number(value)))
  ) {
    const numValue = Number(value)

    if (rules.min !== undefined && numValue < rules.min) {
      errors.push({
        field: fieldName,
        message: `${fieldName} must be at least ${rules.min}`,
        severity: 'error',
      })
    }

    if (rules.max !== undefined && numValue > rules.max) {
      errors.push({
        field: fieldName,
        message: `${fieldName} must be no more than ${rules.max}`,
        severity: 'error',
      })
    }
  }

  // Custom validation
  if (rules.custom) {
    const customError = rules.custom(value, allProps)
    if (customError) {
      errors.push({
        field: fieldName,
        message: customError,
        severity: 'error',
      })
    }
  }

  return errors
}

// Validate all properties for a component
export const validateComponentProperties = (
  componentType: ComponentType,
  properties: Record<string, unknown>
): ValidationResult => {
  const rules = VALIDATION_RULES[componentType]
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []

  // Validate each field according to its rules
  Object.entries(rules).forEach(([fieldName, fieldRules]) => {
    const value = properties[fieldName]
    const fieldErrors = validateField(value, fieldName, fieldRules, properties)
    errors.push(...fieldErrors)
  })

  // Add warnings for potential issues
  if (componentType === ComponentType.IMAGE && properties.src) {
    const src = properties.src as string
    if (src.startsWith('http://')) {
      warnings.push({
        field: 'src',
        message: 'Image URL uses HTTP instead of HTTPS',
        suggestion: 'Consider using HTTPS for better security',
      })
    }
  }

  if (componentType === ComponentType.BUTTON) {
    const backgroundColor = properties.backgroundColor as string
    const textColor = properties.textColor as string

    // Simple contrast warning (basic implementation)
    if (
      backgroundColor &&
      textColor &&
      backgroundColor.toLowerCase() === textColor.toLowerCase()
    ) {
      warnings.push({
        field: 'textColor',
        message: 'Text and background colors are the same',
        suggestion: 'Choose contrasting colors for better readability',
      })
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

// Validate a complete component
export const validateComponent = (component: {
  type: ComponentType
  props: Record<string, unknown>
}): ValidationResult => {
  return validateComponentProperties(component.type, component.props)
}

// Get validation rules for a specific component type
export const getValidationRules = (
  componentType: ComponentType
): Record<string, FieldValidation> => {
  return VALIDATION_RULES[componentType] || {}
}

// Check if a field has validation errors
export const hasValidationError = (
  value: unknown,
  fieldName: string,
  componentType: ComponentType
): boolean => {
  const rules = VALIDATION_RULES[componentType]?.[fieldName]
  if (!rules) return false

  const errors = validateField(value, fieldName, rules)
  return errors.length > 0
}

// Get the first validation error message for a field
export const getValidationErrorMessage = (
  value: unknown,
  fieldName: string,
  componentType: ComponentType
): string | null => {
  const rules = VALIDATION_RULES[componentType]?.[fieldName]
  if (!rules) return null

  const errors = validateField(value, fieldName, rules)
  return errors.length > 0 ? errors[0].message : null
}
