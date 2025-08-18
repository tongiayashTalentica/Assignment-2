import { ComponentType } from '@/types'

export interface PaletteCategory {
  id: string
  label: string
  icon: string
  description: string
  components: ComponentType[]
  isCollapsed?: boolean
  isVisible?: boolean
}

export interface PalettePreferences {
  searchQuery: string
  selectedCategory: string | null
  recentComponents: ComponentType[]
  favoriteComponents: ComponentType[]
  collapsedCategories: Set<string>
  sortOrder: 'alphabetical' | 'usage' | 'recent'
  showDescriptions: boolean
  previewSize: 'small' | 'medium' | 'large'
}

export interface PaletteState {
  selectedComponentType: ComponentType | null
  activeCategory: string | null
  searchQuery: string
  isSearchActive: boolean
  keyboardNavigationIndex: number
  focusedComponentType: ComponentType | null
  dragStartPosition: { x: number; y: number } | null
  preferences: PalettePreferences
  interactionHistory: PaletteInteraction[]
}

export interface PaletteInteraction {
  id: string
  type: 'drag' | 'add' | 'select' | 'search' | 'category_toggle'
  componentType?: ComponentType
  category?: string
  timestamp: Date
  metadata?: Record<string, unknown>
}

// Default palette categories
export const DEFAULT_CATEGORIES: PaletteCategory[] = [
  {
    id: 'basic',
    label: 'Basic Components',
    icon: '🧩',
    description: 'Essential UI components for building interfaces',
    components: [ComponentType.TEXT, ComponentType.BUTTON],
    isCollapsed: false,
    isVisible: true,
  },
  {
    id: 'input',
    label: 'Input Components',
    icon: '📝',
    description: 'Components for user input and text entry',
    components: [ComponentType.TEXTAREA],
    isCollapsed: false,
    isVisible: true,
  },
  {
    id: 'media',
    label: 'Media Components',
    icon: '🖼️',
    description: 'Components for displaying images and media',
    components: [ComponentType.IMAGE],
    isCollapsed: false,
    isVisible: true,
  },
]

// Component metadata for enhanced previews
export interface ComponentMetadata {
  type: ComponentType
  label: string
  description: string
  category: string
  tags: string[]
  usageFrequency: number
  isNew?: boolean
  isDeprecated?: boolean
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

export const COMPONENT_METADATA: Record<ComponentType, ComponentMetadata> = {
  [ComponentType.TEXT]: {
    type: ComponentType.TEXT,
    label: 'Text',
    description: 'Display and edit text content',
    category: 'basic',
    tags: ['text', 'content', 'typography'],
    usageFrequency: 95,
    difficulty: 'beginner',
  },
  [ComponentType.TEXTAREA]: {
    type: ComponentType.TEXTAREA,
    label: 'Text Area',
    description: 'Multi-line text input and display',
    category: 'input',
    tags: ['text', 'input', 'multiline', 'form'],
    usageFrequency: 70,
    difficulty: 'beginner',
  },
  [ComponentType.IMAGE]: {
    type: ComponentType.IMAGE,
    label: 'Image',
    description: 'Display images and visual content',
    category: 'media',
    tags: ['image', 'media', 'visual', 'content'],
    usageFrequency: 80,
    difficulty: 'beginner',
  },
  [ComponentType.BUTTON]: {
    type: ComponentType.BUTTON,
    label: 'Button',
    description: 'Interactive button for user actions',
    category: 'basic',
    tags: ['button', 'action', 'interactive', 'click'],
    usageFrequency: 90,
    difficulty: 'beginner',
  },
  // Placeholder metadata for unused types
  [ComponentType.CONTAINER]: {
    type: ComponentType.CONTAINER,
    label: 'Container',
    description: 'Container for grouping components',
    category: 'layout',
    tags: ['container', 'layout'],
    usageFrequency: 0,
    difficulty: 'intermediate',
  },
  [ComponentType.INPUT]: {
    type: ComponentType.INPUT,
    label: 'Input',
    description: 'Single-line text input',
    category: 'input',
    tags: ['input', 'form'],
    usageFrequency: 0,
    difficulty: 'beginner',
  },
  [ComponentType.FORM]: {
    type: ComponentType.FORM,
    label: 'Form',
    description: 'Form container',
    category: 'input',
    tags: ['form', 'input'],
    usageFrequency: 0,
    difficulty: 'advanced',
  },
  [ComponentType.GRID]: {
    type: ComponentType.GRID,
    label: 'Grid',
    description: 'Grid layout container',
    category: 'layout',
    tags: ['grid', 'layout'],
    usageFrequency: 0,
    difficulty: 'intermediate',
  },
  [ComponentType.FLEX]: {
    type: ComponentType.FLEX,
    label: 'Flex',
    description: 'Flexible layout container',
    category: 'layout',
    tags: ['flex', 'layout'],
    usageFrequency: 0,
    difficulty: 'intermediate',
  },
}

// Default preferences
export const DEFAULT_PALETTE_PREFERENCES: PalettePreferences = {
  searchQuery: '',
  selectedCategory: null,
  recentComponents: [],
  favoriteComponents: [],
  collapsedCategories: new Set(),
  sortOrder: 'usage',
  showDescriptions: true,
  previewSize: 'medium',
}

// Default palette state
export const DEFAULT_PALETTE_STATE: PaletteState = {
  selectedComponentType: null,
  activeCategory: null,
  searchQuery: '',
  isSearchActive: false,
  keyboardNavigationIndex: -1,
  focusedComponentType: null,
  dragStartPosition: null,
  preferences: DEFAULT_PALETTE_PREFERENCES,
  interactionHistory: [],
}

// Utility functions
export const filterComponentsBySearch = (
  components: ComponentType[],
  searchQuery: string
): ComponentType[] => {
  if (!searchQuery.trim()) return components

  const query = searchQuery.toLowerCase()
  return components.filter(type => {
    const metadata = COMPONENT_METADATA[type]
    return (
      metadata.label.toLowerCase().includes(query) ||
      metadata.description.toLowerCase().includes(query) ||
      metadata.tags.some(tag => tag.toLowerCase().includes(query))
    )
  })
}

export const sortComponents = (
  components: ComponentType[],
  sortOrder: PalettePreferences['sortOrder'],
  recentComponents: ComponentType[] = []
): ComponentType[] => {
  switch (sortOrder) {
    case 'alphabetical':
      return [...components].sort((a, b) =>
        COMPONENT_METADATA[a].label.localeCompare(COMPONENT_METADATA[b].label)
      )

    case 'usage':
      return [...components].sort(
        (a, b) =>
          COMPONENT_METADATA[b].usageFrequency -
          COMPONENT_METADATA[a].usageFrequency
      )

    case 'recent':
      return [...components].sort((a, b) => {
        const aIndex = recentComponents.indexOf(a)
        const bIndex = recentComponents.indexOf(b)

        if (aIndex === -1 && bIndex === -1) {
          return (
            COMPONENT_METADATA[b].usageFrequency -
            COMPONENT_METADATA[a].usageFrequency
          )
        }
        if (aIndex === -1) return 1
        if (bIndex === -1) return -1
        return aIndex - bIndex
      })

    default:
      return components
  }
}

export const addToRecentComponents = (
  recentComponents: ComponentType[],
  componentType: ComponentType,
  maxRecent: number = 10
): ComponentType[] => {
  const filtered = recentComponents.filter(type => type !== componentType)
  return [componentType, ...filtered].slice(0, maxRecent)
}

export const createPaletteInteraction = (
  type: PaletteInteraction['type'],
  options: Partial<PaletteInteraction> = {}
): PaletteInteraction => ({
  id: `interaction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  type,
  timestamp: new Date(),
  ...options,
})
