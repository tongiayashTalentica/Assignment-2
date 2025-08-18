import { ComponentType } from '@/types'
import {
  getDefaultProperties,
  validateProperties,
  createComponent,
  cloneComponent,
  ComponentFactory,
} from '@/utils/componentFactory'
import {
  getTemplatesByType,
  getDefaultTemplate,
  createComponentFromTemplate,
  // templateManager - unused variable
  TemplateManager,
  COMPONENT_TEMPLATES,
  TemplateCategory,
} from '@/utils/componentTemplates'

describe('Component Default Properties', () => {
  describe('Default Property Values', () => {
    test('TEXT component has correct default properties', () => {
      const defaults = getDefaultProperties(ComponentType.TEXT)

      expect(defaults).toEqual({
        kind: 'text',
        content: 'Text',
        fontSize: 16,
        fontWeight: 400,
        color: '#000000',
      })
    })

    test('TEXTAREA component has correct default properties', () => {
      const defaults = getDefaultProperties(ComponentType.TEXTAREA)

      expect(defaults).toEqual({
        kind: 'textarea',
        content: 'Multiline text',
        fontSize: 16,
        color: '#000000',
        textAlign: 'left',
      })
    })

    test('IMAGE component has correct default properties', () => {
      const defaults = getDefaultProperties(ComponentType.IMAGE)

      expect(defaults).toEqual({
        kind: 'image',
        src: 'https://via.placeholder.com/200',
        alt: 'Placeholder image',
        objectFit: 'cover',
        borderRadius: 0,
      })
    })

    test('BUTTON component has correct default properties', () => {
      const defaults = getDefaultProperties(ComponentType.BUTTON)

      expect(defaults).toEqual({
        kind: 'button',
        url: 'https://example.com',
        label: 'Click Me',
        fontSize: 16,
        padding: 12,
        backgroundColor: '#1f2937',
        textColor: '#ffffff',
        borderRadius: 6,
      })
    })

    test('unknown component type returns text defaults', () => {
      const unknownType = 'unknown' as ComponentType
      const defaults = getDefaultProperties(unknownType)

      expect(defaults).toEqual({
        kind: 'text',
        content: 'Text',
        fontSize: 16,
        fontWeight: 400,
        color: '#000000',
      })
    })
  })

  describe('Property Validation', () => {
    test('validates TEXT properties correctly', () => {
      const validProps = {
        kind: 'text' as const,
        content: 'Valid text',
        fontSize: 16,
        fontWeight: 400 as const,
        color: '#ff0000',
      }

      const result = validateProperties(ComponentType.TEXT, validProps)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('rejects invalid TEXT font size', () => {
      const invalidProps = {
        kind: 'text' as const,
        content: 'Text',
        fontSize: 100, // Too large
        fontWeight: 400 as const,
        color: '#000000',
      }

      const result = validateProperties(ComponentType.TEXT, invalidProps)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'props.fontSize',
          message: 'Font size must be between 8 and 72',
        })
      )
    })

    test('rejects invalid TEXT font weight', () => {
      const invalidProps = {
        kind: 'text' as const,
        content: 'Text',
        fontSize: 16,
        fontWeight: 500 as any, // Invalid weight
        color: '#000000',
      }

      const result = validateProperties(ComponentType.TEXT, invalidProps)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'props.fontWeight',
          message: 'Font weight must be 400 or 700',
        })
      )
    })

    test('rejects invalid color format', () => {
      const invalidProps = {
        kind: 'text' as const,
        content: 'Text',
        fontSize: 16,
        fontWeight: 400 as const,
        color: 'red', // Invalid hex format
      }

      const result = validateProperties(ComponentType.TEXT, invalidProps)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'props.color',
          message: 'Color must be a valid hex color',
        })
      )
    })

    test('validates TEXTAREA properties correctly', () => {
      const validProps = {
        kind: 'textarea' as const,
        content: 'Valid textarea content',
        fontSize: 14,
        color: '#333333',
        textAlign: 'center' as const,
      }

      const result = validateProperties(ComponentType.TEXTAREA, validProps)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('rejects invalid TEXTAREA text alignment', () => {
      const invalidProps = {
        kind: 'textarea' as const,
        content: 'Content',
        fontSize: 14,
        color: '#000000',
        textAlign: 'justify' as any, // Invalid alignment
      }

      const result = validateProperties(ComponentType.TEXTAREA, invalidProps)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'props.textAlign',
          message: 'Text align must be left, center, or right',
        })
      )
    })

    test('validates IMAGE properties correctly', () => {
      const validProps = {
        kind: 'image' as const,
        src: 'https://example.com/image.jpg',
        alt: 'Test image',
        objectFit: 'contain' as const,
        borderRadius: 10,
      }

      const result = validateProperties(ComponentType.IMAGE, validProps)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('rejects invalid IMAGE URL', () => {
      const invalidProps = {
        kind: 'image' as const,
        src: 'not-a-valid-url',
        alt: 'Test image',
        objectFit: 'cover' as const,
        borderRadius: 5,
      }

      const result = validateProperties(ComponentType.IMAGE, invalidProps)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'props.src',
          message: 'Image URL must be valid',
        })
      )
    })

    test('rejects invalid IMAGE border radius', () => {
      const invalidProps = {
        kind: 'image' as const,
        src: 'https://example.com/image.jpg',
        alt: 'Test image',
        objectFit: 'cover' as const,
        borderRadius: 60, // Too large
      }

      const result = validateProperties(ComponentType.IMAGE, invalidProps)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'props.borderRadius',
          message: 'Border radius must be 0-50',
        })
      )
    })

    test('validates BUTTON properties correctly', () => {
      const validProps = {
        kind: 'button' as const,
        url: 'https://example.com',
        label: 'Click me',
        fontSize: 18,
        padding: 15,
        backgroundColor: '#007bff',
        textColor: '#ffffff',
        borderRadius: 8,
      }

      const result = validateProperties(ComponentType.BUTTON, validProps)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('rejects invalid BUTTON colors', () => {
      const invalidProps = {
        kind: 'button' as const,
        url: 'https://example.com',
        label: 'Button',
        fontSize: 16,
        padding: 12,
        backgroundColor: 'blue', // Invalid hex
        textColor: 'white', // Invalid hex
        borderRadius: 6,
      }

      const result = validateProperties(ComponentType.BUTTON, invalidProps)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'props.colors',
          message: 'Colors must be valid hex values',
        })
      )
    })
  })

  describe('Component Factory', () => {
    test('creates component with default properties', () => {
      const component = createComponent(ComponentType.TEXT, { x: 10, y: 20 })

      expect(component.type).toBe(ComponentType.TEXT)
      expect(component.position).toEqual({ x: 10, y: 20 })
      expect(component.props).toEqual(getDefaultProperties(ComponentType.TEXT))
      expect(component.dimensions).toEqual({ width: 200, height: 40 })
      expect(component.id).toMatch(/^component-\d+-[a-z0-9]+$/)
    })

    test('creates component with custom overrides', () => {
      const customDimensions = { width: 300, height: 60 }
      const component = createComponent(
        ComponentType.TEXT,
        { x: 0, y: 0 },
        { zIndex: 5, dimensions: customDimensions } // Pass overrides as single parameter
      )

      expect(component.dimensions).toEqual(customDimensions)
      expect(component.zIndex).toBe(5)
    })

    test('clones component with new ID and timestamps', () => {
      const original = createComponent(ComponentType.BUTTON, { x: 50, y: 50 })

      // Wait a moment to ensure different timestamps
      const cloned = cloneComponent(original)

      expect(cloned.id).not.toBe(original.id)
      expect(cloned.type).toBe(original.type)
      expect(cloned.position).toEqual(original.position)
      expect(cloned.props).toEqual(original.props)
      expect(cloned.metadata.createdAt.getTime()).toBeGreaterThanOrEqual(
        original.metadata.createdAt.getTime()
      )
    })

    test('ComponentFactory.validateComponent works correctly', () => {
      const component = createComponent(ComponentType.TEXT, { x: 0, y: 0 })

      const result = ComponentFactory.validateComponent(component)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('Template System', () => {
    test('gets templates by component type', () => {
      const textTemplates = getTemplatesByType(ComponentType.TEXT)

      expect(textTemplates.length).toBeGreaterThan(0)
      expect(
        textTemplates.every(t => t.componentType === ComponentType.TEXT)
      ).toBe(true)
    })

    test('gets default template for component type', () => {
      const defaultTemplate = getDefaultTemplate(ComponentType.TEXT)

      expect(defaultTemplate.componentType).toBe(ComponentType.TEXT)
      expect(defaultTemplate.category).toBe(TemplateCategory.DEFAULT)
    })

    test('creates component from template', () => {
      const template = getDefaultTemplate(ComponentType.BUTTON)
      const component = createComponentFromTemplate(template, {
        x: 100,
        y: 100,
      })

      expect(component.type).toBe(ComponentType.BUTTON)
      expect(component.position).toEqual({ x: 100, y: 100 })
      expect(component.dimensions).toEqual(template.dimensions)
      expect(component.props).toEqual(template.properties)
    })

    test('template usage is tracked', () => {
      const template = getDefaultTemplate(ComponentType.TEXT)
      const initialUsage = template.usageCount || 0

      createComponentFromTemplate(template, { x: 0, y: 0 })

      expect(template.usageCount).toBe(initialUsage + 1)
    })
  })

  describe('Template Manager', () => {
    let manager: TemplateManager

    beforeEach(() => {
      manager = new TemplateManager()
    })

    test('gets all templates', () => {
      const allTemplates = manager.getAllTemplates()

      expect(allTemplates.length).toBeGreaterThan(0)
      expect(allTemplates.every(t => t.id && t.name && t.componentType)).toBe(
        true
      )
    })

    test('gets templates by category', () => {
      const boldTemplates = manager.getTemplatesByCategory(
        TemplateCategory.BOLD
      )

      expect(
        boldTemplates.every(t => t.category === TemplateCategory.BOLD)
      ).toBe(true)
    })

    test('searches templates', () => {
      const searchResults = manager.searchTemplates('heading')

      expect(searchResults.length).toBeGreaterThan(0)
      expect(
        searchResults.some(
          t =>
            t.name.toLowerCase().includes('heading') ||
            t.description.toLowerCase().includes('heading') ||
            t.tags.some(tag => tag.includes('heading'))
        )
      ).toBe(true)
    })

    test('creates custom template', () => {
      const customTemplate = manager.createCustomTemplate(
        'Custom Text',
        'My custom text component',
        ComponentType.TEXT,
        {
          kind: 'text',
          content: 'Custom',
          fontSize: 24,
          fontWeight: 700,
          color: '#ff0000',
        },
        { width: 250, height: 50 },
        TemplateCategory.CUSTOM,
        ['custom', 'red']
      )

      expect(customTemplate.id).toMatch(/^custom-\d+-[a-z0-9]+$/)
      expect(customTemplate.name).toBe('Custom Text')
      expect(customTemplate.isBuiltIn).toBe(false)
      expect(customTemplate.usageCount).toBe(0)
    })

    test('increments usage count', () => {
      const template = manager.getTemplate('text-default')
      const initialUsage = template?.usageCount || 0

      if (template) {
        manager.incrementUsage(template.id)
        expect(template.usageCount).toBe(initialUsage + 1)
      }
    })

    test('gets most used templates', () => {
      const template1 = manager.getTemplate('text-default')
      const template2 = manager.getTemplate('button-default')

      if (template1 && template2) {
        // Increment usage
        manager.incrementUsage(template1.id)
        manager.incrementUsage(template1.id)
        manager.incrementUsage(template2.id)

        const mostUsed = manager.getMostUsedTemplates(2)
        expect(mostUsed[0]).toBe(template1)
      }
    })

    test('cannot delete built-in templates', () => {
      const result = manager.deleteTemplate('text-default')
      expect(result).toBe(false)
    })

    test('can delete custom templates', () => {
      const customTemplate = manager.createCustomTemplate(
        'Test Template',
        'For deletion test',
        ComponentType.TEXT,
        getDefaultProperties(ComponentType.TEXT),
        { width: 100, height: 100 }
      )

      const result = manager.deleteTemplate(customTemplate.id)
      expect(result).toBe(true)

      const retrieved = manager.getTemplate(customTemplate.id)
      expect(retrieved).toBeNull()
    })

    test('exports and imports custom templates', () => {
      const customTemplate = manager.createCustomTemplate(
        'Export Test',
        'Template for export test',
        ComponentType.TEXT,
        getDefaultProperties(ComponentType.TEXT),
        { width: 100, height: 100 }
      )

      const exported = manager.exportTemplates()
      expect(exported[customTemplate.id]).toBeDefined()

      const newManager = new TemplateManager()
      newManager.importTemplates(exported)

      const imported = newManager.getTemplate(customTemplate.id)
      expect(imported).toEqual(customTemplate)
    })
  })

  describe('Built-in Templates', () => {
    test('all component types have default templates', () => {
      const componentTypes = [
        ComponentType.TEXT,
        ComponentType.TEXTAREA,
        ComponentType.IMAGE,
        ComponentType.BUTTON,
      ]

      componentTypes.forEach(type => {
        const defaultTemplate = getDefaultTemplate(type)
        expect(defaultTemplate).toBeDefined()
        expect(defaultTemplate.componentType).toBe(type)
      })
    })

    test('template properties match component defaults', () => {
      const componentTypes = [
        ComponentType.TEXT,
        ComponentType.TEXTAREA,
        ComponentType.IMAGE,
        ComponentType.BUTTON,
      ]

      componentTypes.forEach(type => {
        const defaultTemplate = getDefaultTemplate(type)
        const defaultProps = getDefaultProperties(type)

        expect(defaultTemplate.properties).toEqual(defaultProps)
      })
    })

    test('all built-in templates have required fields', () => {
      Object.values(COMPONENT_TEMPLATES).forEach(template => {
        expect(template.id).toBeDefined()
        expect(template.name).toBeDefined()
        expect(template.description).toBeDefined()
        expect(template.componentType).toBeDefined()
        expect(template.properties).toBeDefined()
        expect(template.dimensions).toBeDefined()
        expect(template.category).toBeDefined()
        expect(template.tags).toBeInstanceOf(Array)
        expect(template.isBuiltIn).toBe(true)
      })
    })

    test('template IDs are unique', () => {
      const ids = Object.keys(COMPONENT_TEMPLATES)
      const uniqueIds = [...new Set(ids)]

      expect(ids.length).toBe(uniqueIds.length)
    })
  })
})
