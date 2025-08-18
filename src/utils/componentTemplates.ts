import { ComponentType, ComponentProperties, Dimensions } from '@/types'
import { getDefaultProperties } from './componentFactory'

// Component template interface
export interface ComponentTemplate {
  id: string
  name: string
  description: string
  componentType: ComponentType
  properties: ComponentProperties
  dimensions: Dimensions
  category: string
  tags: string[]
  isBuiltIn: boolean
  createdAt?: Date
  updatedAt?: Date
  usageCount?: number
}

// Preset categories
export enum TemplateCategory {
  DEFAULT = 'default',
  MINIMAL = 'minimal',
  BOLD = 'bold',
  MODERN = 'modern',
  CLASSIC = 'classic',
  CUSTOM = 'custom',
}

// Default component templates
export const COMPONENT_TEMPLATES: Record<string, ComponentTemplate> = {
  // TEXT Templates
  'text-default': {
    id: 'text-default',
    name: 'Default Text',
    description: 'Standard text component with default styling',
    componentType: ComponentType.TEXT,
    properties: getDefaultProperties(ComponentType.TEXT),
    dimensions: { width: 200, height: 40 },
    category: TemplateCategory.DEFAULT,
    tags: ['text', 'default'],
    isBuiltIn: true,
    usageCount: 0,
  },
  'text-heading': {
    id: 'text-heading',
    name: 'Heading Text',
    description: 'Large, bold text for headings and titles',
    componentType: ComponentType.TEXT,
    properties: {
      kind: 'text',
      content: 'Heading',
      fontSize: 32,
      fontWeight: 700,
      color: '#1f2937',
    },
    dimensions: { width: 300, height: 50 },
    category: TemplateCategory.BOLD,
    tags: ['text', 'heading', 'title', 'large'],
    isBuiltIn: true,
    usageCount: 0,
  },
  'text-subtitle': {
    id: 'text-subtitle',
    name: 'Subtitle Text',
    description: 'Medium-sized text for subtitles and descriptions',
    componentType: ComponentType.TEXT,
    properties: {
      kind: 'text',
      content: 'Subtitle',
      fontSize: 20,
      fontWeight: 400,
      color: '#6b7280',
    },
    dimensions: { width: 250, height: 35 },
    category: TemplateCategory.MODERN,
    tags: ['text', 'subtitle', 'description'],
    isBuiltIn: true,
    usageCount: 0,
  },
  'text-caption': {
    id: 'text-caption',
    name: 'Caption Text',
    description: 'Small text for captions and fine print',
    componentType: ComponentType.TEXT,
    properties: {
      kind: 'text',
      content: 'Caption',
      fontSize: 12,
      fontWeight: 400,
      color: '#9ca3af',
    },
    dimensions: { width: 150, height: 25 },
    category: TemplateCategory.MINIMAL,
    tags: ['text', 'caption', 'small', 'fine-print'],
    isBuiltIn: true,
    usageCount: 0,
  },

  // TEXTAREA Templates
  'textarea-default': {
    id: 'textarea-default',
    name: 'Default Text Area',
    description: 'Standard multi-line text area',
    componentType: ComponentType.TEXTAREA,
    properties: getDefaultProperties(ComponentType.TEXTAREA),
    dimensions: { width: 300, height: 120 },
    category: TemplateCategory.DEFAULT,
    tags: ['textarea', 'default', 'multiline'],
    isBuiltIn: true,
    usageCount: 0,
  },
  'textarea-large': {
    id: 'textarea-large',
    name: 'Large Text Area',
    description: 'Spacious text area for longer content',
    componentType: ComponentType.TEXTAREA,
    properties: {
      kind: 'textarea',
      content: 'Enter your text here...',
      fontSize: 16,
      color: '#374151',
      textAlign: 'left',
    },
    dimensions: { width: 400, height: 200 },
    category: TemplateCategory.MODERN,
    tags: ['textarea', 'large', 'spacious'],
    isBuiltIn: true,
    usageCount: 0,
  },
  'textarea-compact': {
    id: 'textarea-compact',
    name: 'Compact Text Area',
    description: 'Small text area for brief content',
    componentType: ComponentType.TEXTAREA,
    properties: {
      kind: 'textarea',
      content: 'Brief text...',
      fontSize: 14,
      color: '#6b7280',
      textAlign: 'left',
    },
    dimensions: { width: 200, height: 80 },
    category: TemplateCategory.MINIMAL,
    tags: ['textarea', 'compact', 'small'],
    isBuiltIn: true,
    usageCount: 0,
  },

  // IMAGE Templates
  'image-default': {
    id: 'image-default',
    name: 'Default Image',
    description: 'Standard image component',
    componentType: ComponentType.IMAGE,
    properties: getDefaultProperties(ComponentType.IMAGE),
    dimensions: { width: 200, height: 200 },
    category: TemplateCategory.DEFAULT,
    tags: ['image', 'default'],
    isBuiltIn: true,
    usageCount: 0,
  },
  'image-banner': {
    id: 'image-banner',
    name: 'Banner Image',
    description: 'Wide banner-style image',
    componentType: ComponentType.IMAGE,
    properties: {
      kind: 'image',
      src: 'https://via.placeholder.com/400x150',
      alt: 'Banner image',
      objectFit: 'cover',
      borderRadius: 8,
    },
    dimensions: { width: 400, height: 150 },
    category: TemplateCategory.MODERN,
    tags: ['image', 'banner', 'wide'],
    isBuiltIn: true,
    usageCount: 0,
  },
  'image-avatar': {
    id: 'image-avatar',
    name: 'Avatar Image',
    description: 'Circular avatar image',
    componentType: ComponentType.IMAGE,
    properties: {
      kind: 'image',
      src: 'https://via.placeholder.com/100',
      alt: 'Profile picture',
      objectFit: 'cover',
      borderRadius: 50,
    },
    dimensions: { width: 100, height: 100 },
    category: TemplateCategory.MODERN,
    tags: ['image', 'avatar', 'profile', 'circular'],
    isBuiltIn: true,
    usageCount: 0,
  },
  'image-thumbnail': {
    id: 'image-thumbnail',
    name: 'Thumbnail Image',
    description: 'Small thumbnail image',
    componentType: ComponentType.IMAGE,
    properties: {
      kind: 'image',
      src: 'https://via.placeholder.com/80',
      alt: 'Thumbnail',
      objectFit: 'cover',
      borderRadius: 4,
    },
    dimensions: { width: 80, height: 80 },
    category: TemplateCategory.MINIMAL,
    tags: ['image', 'thumbnail', 'small'],
    isBuiltIn: true,
    usageCount: 0,
  },

  // BUTTON Templates
  'button-default': {
    id: 'button-default',
    name: 'Default Button',
    description: 'Standard button component',
    componentType: ComponentType.BUTTON,
    properties: getDefaultProperties(ComponentType.BUTTON),
    dimensions: { width: 160, height: 44 },
    category: TemplateCategory.DEFAULT,
    tags: ['button', 'default'],
    isBuiltIn: true,
    usageCount: 0,
  },
  'button-primary': {
    id: 'button-primary',
    name: 'Primary Button',
    description: 'Primary action button with blue styling',
    componentType: ComponentType.BUTTON,
    properties: {
      kind: 'button',
      url: 'https://example.com',
      label: 'Primary Action',
      fontSize: 16,
      padding: 16,
      backgroundColor: '#3b82f6',
      textColor: '#ffffff',
      borderRadius: 8,
    },
    dimensions: { width: 180, height: 48 },
    category: TemplateCategory.MODERN,
    tags: ['button', 'primary', 'action', 'blue'],
    isBuiltIn: true,
    usageCount: 0,
  },
  'button-secondary': {
    id: 'button-secondary',
    name: 'Secondary Button',
    description: 'Secondary action button with gray styling',
    componentType: ComponentType.BUTTON,
    properties: {
      kind: 'button',
      url: 'https://example.com',
      label: 'Secondary',
      fontSize: 16,
      padding: 14,
      backgroundColor: '#6b7280',
      textColor: '#ffffff',
      borderRadius: 6,
    },
    dimensions: { width: 160, height: 44 },
    category: TemplateCategory.CLASSIC,
    tags: ['button', 'secondary', 'gray'],
    isBuiltIn: true,
    usageCount: 0,
  },
  'button-outline': {
    id: 'button-outline',
    name: 'Outline Button',
    description: 'Button with outline styling',
    componentType: ComponentType.BUTTON,
    properties: {
      kind: 'button',
      url: 'https://example.com',
      label: 'Outline',
      fontSize: 16,
      padding: 14,
      backgroundColor: '#ffffff',
      textColor: '#3b82f6',
      borderRadius: 6,
    },
    dimensions: { width: 150, height: 44 },
    category: TemplateCategory.MINIMAL,
    tags: ['button', 'outline', 'minimal'],
    isBuiltIn: true,
    usageCount: 0,
  },
  'button-large': {
    id: 'button-large',
    name: 'Large Button',
    description: 'Large, prominent button',
    componentType: ComponentType.BUTTON,
    properties: {
      kind: 'button',
      url: 'https://example.com',
      label: 'Large Action',
      fontSize: 18,
      padding: 20,
      backgroundColor: '#059669',
      textColor: '#ffffff',
      borderRadius: 12,
    },
    dimensions: { width: 220, height: 56 },
    category: TemplateCategory.BOLD,
    tags: ['button', 'large', 'prominent'],
    isBuiltIn: true,
    usageCount: 0,
  },
  'button-small': {
    id: 'button-small',
    name: 'Small Button',
    description: 'Compact button for tight spaces',
    componentType: ComponentType.BUTTON,
    properties: {
      kind: 'button',
      url: 'https://example.com',
      label: 'Small',
      fontSize: 14,
      padding: 8,
      backgroundColor: '#1f2937',
      textColor: '#ffffff',
      borderRadius: 4,
    },
    dimensions: { width: 120, height: 36 },
    category: TemplateCategory.MINIMAL,
    tags: ['button', 'small', 'compact'],
    isBuiltIn: true,
    usageCount: 0,
  },
}

// Template management utilities
export class TemplateManager {
  private templates: Map<string, ComponentTemplate> = new Map()
  private customTemplates: Map<string, ComponentTemplate> = new Map()

  constructor() {
    // Load built-in templates
    Object.values(COMPONENT_TEMPLATES).forEach(template => {
      this.templates.set(template.id, template)
    })
  }

  // Get all templates
  getAllTemplates(): ComponentTemplate[] {
    return [...this.templates.values(), ...this.customTemplates.values()]
  }

  // Get templates by component type
  getTemplatesByType(type: ComponentType): ComponentTemplate[] {
    return this.getAllTemplates().filter(
      template => template.componentType === type
    )
  }

  // Get templates by category
  getTemplatesByCategory(category: string): ComponentTemplate[] {
    return this.getAllTemplates().filter(
      template => template.category === category
    )
  }

  // Get template by ID
  getTemplate(id: string): ComponentTemplate | null {
    return this.templates.get(id) || this.customTemplates.get(id) || null
  }

  // Search templates
  searchTemplates(query: string): ComponentTemplate[] {
    const searchTerm = query.toLowerCase()
    return this.getAllTemplates().filter(
      template =>
        template.name.toLowerCase().includes(searchTerm) ||
        template.description.toLowerCase().includes(searchTerm) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    )
  }

  // Create custom template
  createCustomTemplate(
    name: string,
    description: string,
    componentType: ComponentType,
    properties: ComponentProperties,
    dimensions: Dimensions,
    category: string = TemplateCategory.CUSTOM,
    tags: string[] = []
  ): ComponentTemplate {
    const id = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const template: ComponentTemplate = {
      id,
      name,
      description,
      componentType,
      properties,
      dimensions,
      category,
      tags,
      isBuiltIn: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0,
    }

    this.customTemplates.set(id, template)
    return template
  }

  // Update template usage count
  incrementUsage(templateId: string): void {
    const template = this.getTemplate(templateId)
    if (template) {
      template.usageCount = (template.usageCount || 0) + 1
      template.updatedAt = new Date()
    }
  }

  // Get most used templates
  getMostUsedTemplates(limit: number = 5): ComponentTemplate[] {
    return this.getAllTemplates()
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      .slice(0, limit)
  }

  // Get recently created templates
  getRecentTemplates(limit: number = 5): ComponentTemplate[] {
    return this.getAllTemplates()
      .filter(template => template.createdAt)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime())
      .slice(0, limit)
  }

  // Delete custom template
  deleteTemplate(id: string): boolean {
    if (this.templates.has(id)) {
      // Can't delete built-in templates
      return false
    }
    return this.customTemplates.delete(id)
  }

  // Export templates for persistence
  exportTemplates(): Record<string, ComponentTemplate> {
    const exported: Record<string, ComponentTemplate> = {}
    this.customTemplates.forEach((template, id) => {
      exported[id] = template
    })
    return exported
  }

  // Import templates from persistence
  importTemplates(templates: Record<string, ComponentTemplate>): void {
    Object.values(templates).forEach(template => {
      if (!template.isBuiltIn) {
        this.customTemplates.set(template.id, template)
      }
    })
  }
}

// Singleton instance
export const templateManager = new TemplateManager()

// Utility functions
export const getTemplatesByType = (
  type: ComponentType
): ComponentTemplate[] => {
  return templateManager.getTemplatesByType(type)
}

export const getDefaultTemplate = (type: ComponentType): ComponentTemplate => {
  const templates = getTemplatesByType(type)
  const defaultTemplate = templates.find(
    t => t.category === TemplateCategory.DEFAULT
  )
  return defaultTemplate || templates[0]
}

export const createComponentFromTemplate = (
  template: ComponentTemplate,
  position: { x: number; y: number }
): import('@/types').BaseComponent => {
  // Import ComponentFactory here to avoid circular dependency
  const { ComponentFactory } = require('./componentFactory')

  templateManager.incrementUsage(template.id)

  return ComponentFactory.create(template.componentType, position, {
    dimensions: template.dimensions,
    props: template.properties as unknown as Record<string, unknown>,
  })
}
