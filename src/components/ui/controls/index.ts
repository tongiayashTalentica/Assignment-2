// Export all control components
export { ColorPicker } from './ColorPicker'
export { Slider } from './Slider'
export {
  ButtonGroup,
  ALIGNMENT_OPTIONS,
  OBJECT_FIT_OPTIONS,
} from './ButtonGroup'
export {
  Dropdown,
  FONT_WEIGHT_OPTIONS,
  OBJECT_FIT_DROPDOWN_OPTIONS,
} from './Dropdown'

// Common validation utilities for controls
export const validateHexColor = (value: string): boolean => {
  return /^#[0-9A-F]{6}$/i.test(value) || value === ''
}

export const validateRange = (
  value: number,
  min: number,
  max: number
): boolean => {
  return !isNaN(value) && value >= min && value <= max
}

export const validateUrl = (url: string): boolean => {
  if (!url) return true // Allow empty URLs
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// Control field types for dynamic form generation
export type ControlType =
  | 'color'
  | 'slider'
  | 'dropdown'
  | 'text'
  | 'textarea'
  | 'buttonGroup'
  | 'number'
  | 'url'

export interface ControlField {
  name: string
  type: ControlType
  label: string
  validation?: {
    required?: boolean
    min?: number
    max?: number
    minLength?: number
    maxLength?: number
    pattern?: RegExp
    custom?: (value: unknown) => boolean | string
  }
  options?: Array<{ value: unknown; label: string; description?: string }>
  props?: Record<string, unknown>
}

// Utility to get control component by type
export const getControlComponent = (type: ControlType) => {
  switch (type) {
    case 'color':
      return ColorPicker
    case 'slider':
    case 'number':
      return Slider
    case 'dropdown':
      return Dropdown
    case 'buttonGroup':
      return ButtonGroup
    default:
      return null
  }
}
