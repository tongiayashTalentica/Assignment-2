import { validateComponent, createComponent } from '@/utils/componentUtils'
import { ComponentType } from '@/types'

describe('Component Utils - Additional Coverage Tests', () => {
  describe('Component Validation - Missing Coverage', () => {
    it('should validate button component with empty string label', () => {
      const buttonComponent = createComponent(
        ComponentType.BUTTON,
        { x: 0, y: 0 },
        { width: 100, height: 40 },
        { label: '' } // Empty string should be valid
      )

      const result = validateComponent(buttonComponent)

      expect(result.isValid).toBe(true)
      expect(result.warnings).toHaveLength(0) // No warnings for empty string label
    })

    it('should warn for button component with missing label property', () => {
      const buttonComponent = createComponent(
        ComponentType.BUTTON,
        { x: 0, y: 0 },
        { width: 100, height: 40 },
        {} // No label property
      )

      const result = validateComponent(buttonComponent)

      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'props.label',
            message: 'Button component should have a label',
            suggestion: 'Add button label text',
          }),
        ])
      )
    })

    it('should validate image component with missing src', () => {
      const imageComponent = createComponent(
        ComponentType.IMAGE,
        { x: 0, y: 0 },
        { width: 100, height: 100 },
        {} // No src property
      )

      const result = validateComponent(imageComponent)

      expect(result.isValid).toBe(false)
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'props.src',
            message: 'Image component requires a source URL',
          }),
        ])
      )
    })

    it('should warn for input component with missing type', () => {
      const inputComponent = createComponent(
        ComponentType.INPUT,
        { x: 0, y: 0 },
        { width: 200, height: 30 },
        {} // No type property
      )

      const result = validateComponent(inputComponent)

      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'props.type',
            message: 'Input should specify a type',
            suggestion: 'Add input type (text, email, password, etc.)',
          }),
        ])
      )
    })

    it('should validate input component with type specified', () => {
      const inputComponent = createComponent(
        ComponentType.INPUT,
        { x: 0, y: 0 },
        { width: 200, height: 30 },
        { type: 'text' }
      )

      const result = validateComponent(inputComponent)

      // Should not have warnings about missing type
      const typeWarnings = result.warnings.filter(w => w.field === 'props.type')
      expect(typeWarnings).toHaveLength(0)
    })

    it('should validate container component without specific warnings', () => {
      const containerComponent = createComponent(
        ComponentType.CONTAINER,
        { x: 0, y: 0 },
        { width: 400, height: 300 },
        {}
      )

      const result = validateComponent(containerComponent)

      // Container validation is minimal - should pass basic validation
      expect(result.isValid).toBe(true)
    })

    it('should handle generic component validation for unknown types', () => {
      const genericComponent = createComponent(
        ComponentType.FORM, // Less commonly tested type
        { x: 0, y: 0 },
        { width: 400, height: 300 },
        {}
      )

      const result = validateComponent(genericComponent)

      // Should pass basic validation without type-specific errors
      expect(result.isValid).toBe(true)
    })

    it('should validate flex component without specific warnings', () => {
      const flexComponent = createComponent(
        ComponentType.FLEX,
        { x: 0, y: 0 },
        { width: 400, height: 300 },
        {}
      )

      const result = validateComponent(flexComponent)

      // Flex validation follows generic path
      expect(result.isValid).toBe(true)
    })

    it('should validate grid component with proper grid properties', () => {
      const gridComponent = createComponent(
        ComponentType.GRID,
        { x: 0, y: 0 },
        { width: 400, height: 300 },
        { columns: 12, rows: 6 }
      )

      const result = validateComponent(gridComponent)

      expect(result.isValid).toBe(true)
      // Should not have grid-specific warnings when properties are provided
      const gridWarnings = result.warnings.filter(w =>
        w.message.includes('Grid')
      )
      expect(gridWarnings).toHaveLength(0)
    })
  })
})
