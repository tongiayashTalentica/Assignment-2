import { ComponentType } from '@/types'
import {
  DEFAULT_CATEGORIES,
  DEFAULT_PALETTE_STATE,
  DEFAULT_PALETTE_PREFERENCES,
  COMPONENT_METADATA,
  filterComponentsBySearch,
  sortComponents,
  addToRecentComponents,
  createPaletteInteraction,
  PaletteState,
  // PaletteCategory - unused variable
  ComponentMetadata,
} from '@/components/ui/PaletteState'

describe('Palette State Management', () => {
  describe('Default State and Configuration', () => {
    test('DEFAULT_PALETTE_STATE has correct initial values', () => {
      expect(DEFAULT_PALETTE_STATE).toEqual({
        selectedComponentType: null,
        activeCategory: null,
        searchQuery: '',
        isSearchActive: false,
        keyboardNavigationIndex: -1,
        focusedComponentType: null,
        dragStartPosition: null,
        preferences: DEFAULT_PALETTE_PREFERENCES,
        interactionHistory: [],
      })
    })

    test('DEFAULT_PALETTE_PREFERENCES has correct initial values', () => {
      expect(DEFAULT_PALETTE_PREFERENCES).toEqual({
        searchQuery: '',
        selectedCategory: null,
        recentComponents: [],
        favoriteComponents: [],
        collapsedCategories: new Set(),
        sortOrder: 'usage',
        showDescriptions: true,
        previewSize: 'medium',
      })
    })

    test('DEFAULT_CATEGORIES contains all expected categories', () => {
      expect(DEFAULT_CATEGORIES).toHaveLength(3)

      const categoryIds = DEFAULT_CATEGORIES.map(cat => cat.id)
      expect(categoryIds).toContain('basic')
      expect(categoryIds).toContain('input')
      expect(categoryIds).toContain('media')

      DEFAULT_CATEGORIES.forEach(category => {
        expect(category).toHaveProperty('id')
        expect(category).toHaveProperty('label')
        expect(category).toHaveProperty('icon')
        expect(category).toHaveProperty('description')
        expect(category).toHaveProperty('components')
        expect(category.components).toBeInstanceOf(Array)
        expect(category.isCollapsed).toBe(false)
        expect(category.isVisible).toBe(true)
      })
    })

    test('categories contain correct components', () => {
      const basicCategory = DEFAULT_CATEGORIES.find(cat => cat.id === 'basic')
      const inputCategory = DEFAULT_CATEGORIES.find(cat => cat.id === 'input')
      const mediaCategory = DEFAULT_CATEGORIES.find(cat => cat.id === 'media')

      expect(basicCategory?.components).toEqual([
        ComponentType.TEXT,
        ComponentType.BUTTON,
      ])
      expect(inputCategory?.components).toEqual([ComponentType.TEXTAREA])
      expect(mediaCategory?.components).toEqual([ComponentType.IMAGE])
    })
  })

  describe('Component Metadata', () => {
    test('COMPONENT_METADATA contains all component types', () => {
      const componentTypes = [
        ComponentType.TEXT,
        ComponentType.TEXTAREA,
        ComponentType.IMAGE,
        ComponentType.BUTTON,
      ]

      componentTypes.forEach(type => {
        expect(COMPONENT_METADATA[type]).toBeDefined()
      })
    })

    test('each component metadata has required fields', () => {
      Object.values(COMPONENT_METADATA).forEach(
        (metadata: ComponentMetadata) => {
          expect(metadata).toHaveProperty('type')
          expect(metadata).toHaveProperty('label')
          expect(metadata).toHaveProperty('description')
          expect(metadata).toHaveProperty('category')
          expect(metadata).toHaveProperty('tags')
          expect(metadata).toHaveProperty('usageFrequency')
          expect(metadata).toHaveProperty('difficulty')

          expect(metadata.tags).toBeInstanceOf(Array)
          expect(typeof metadata.usageFrequency).toBe('number')
          expect(['beginner', 'intermediate', 'advanced']).toContain(
            metadata.difficulty
          )
        }
      )
    })

    test('component metadata has realistic usage frequencies', () => {
      const textMeta = COMPONENT_METADATA[ComponentType.TEXT]
      const buttonMeta = COMPONENT_METADATA[ComponentType.BUTTON]
      const imageMeta = COMPONENT_METADATA[ComponentType.IMAGE]
      const textareaMeta = COMPONENT_METADATA[ComponentType.TEXTAREA]

      expect(textMeta.usageFrequency).toBeGreaterThan(0)
      expect(buttonMeta.usageFrequency).toBeGreaterThan(0)
      expect(imageMeta.usageFrequency).toBeGreaterThan(0)
      expect(textareaMeta.usageFrequency).toBeGreaterThan(0)

      // Text and Button should be most commonly used
      expect(textMeta.usageFrequency).toBeGreaterThanOrEqual(90)
      expect(buttonMeta.usageFrequency).toBeGreaterThanOrEqual(90)
    })

    test('component tags are meaningful', () => {
      const textTags = COMPONENT_METADATA[ComponentType.TEXT].tags
      const buttonTags = COMPONENT_METADATA[ComponentType.BUTTON].tags
      const imageTags = COMPONENT_METADATA[ComponentType.IMAGE].tags
      const textareaTags = COMPONENT_METADATA[ComponentType.TEXTAREA].tags

      expect(textTags).toContain('text')
      expect(buttonTags).toContain('button')
      expect(imageTags).toContain('image')
      expect(textareaTags).toContain('text')
      expect(textareaTags).toContain('multiline')
    })
  })

  describe('Search Filtering', () => {
    test('filterComponentsBySearch returns all components for empty query', () => {
      const allComponents = [
        ComponentType.TEXT,
        ComponentType.BUTTON,
        ComponentType.IMAGE,
        ComponentType.TEXTAREA,
      ]
      const result = filterComponentsBySearch(allComponents, '')

      expect(result).toEqual(allComponents)
    })

    test('filterComponentsBySearch returns all components for whitespace query', () => {
      const allComponents = [
        ComponentType.TEXT,
        ComponentType.BUTTON,
        ComponentType.IMAGE,
        ComponentType.TEXTAREA,
      ]
      const result = filterComponentsBySearch(allComponents, '   ')

      expect(result).toEqual(allComponents)
    })

    test('filterComponentsBySearch filters by component label', () => {
      const allComponents = [
        ComponentType.TEXT,
        ComponentType.BUTTON,
        ComponentType.IMAGE,
        ComponentType.TEXTAREA,
      ]
      const result = filterComponentsBySearch(allComponents, 'text')

      expect(result).toContain(ComponentType.TEXT)
      expect(result).toContain(ComponentType.TEXTAREA) // "Text Area" contains "text"
      expect(result).not.toContain(ComponentType.BUTTON)
      expect(result).not.toContain(ComponentType.IMAGE)
    })

    test('filterComponentsBySearch filters by description', () => {
      const allComponents = [
        ComponentType.TEXT,
        ComponentType.BUTTON,
        ComponentType.IMAGE,
        ComponentType.TEXTAREA,
      ]
      const result = filterComponentsBySearch(allComponents, 'interactive')

      // Button has "Interactive button" in description
      expect(result).toContain(ComponentType.BUTTON)
    })

    test('filterComponentsBySearch filters by tags', () => {
      const allComponents = [
        ComponentType.TEXT,
        ComponentType.BUTTON,
        ComponentType.IMAGE,
        ComponentType.TEXTAREA,
      ]
      const result = filterComponentsBySearch(allComponents, 'media')

      // Image component has "media" tag
      expect(result).toContain(ComponentType.IMAGE)
    })

    test('filterComponentsBySearch is case insensitive', () => {
      const allComponents = [ComponentType.TEXT, ComponentType.BUTTON]
      const result1 = filterComponentsBySearch(allComponents, 'TEXT')
      const result2 = filterComponentsBySearch(allComponents, 'text')
      const result3 = filterComponentsBySearch(allComponents, 'Text')

      expect(result1).toEqual(result2)
      expect(result2).toEqual(result3)
      expect(result1).toContain(ComponentType.TEXT)
    })

    test('filterComponentsBySearch returns empty array for no matches', () => {
      const allComponents = [
        ComponentType.TEXT,
        ComponentType.BUTTON,
        ComponentType.IMAGE,
        ComponentType.TEXTAREA,
      ]
      const result = filterComponentsBySearch(allComponents, 'nonexistent')

      expect(result).toEqual([])
    })
  })

  describe('Component Sorting', () => {
    test('sortComponents with alphabetical order', () => {
      const components = [
        ComponentType.TEXT,
        ComponentType.BUTTON,
        ComponentType.IMAGE,
        ComponentType.TEXTAREA,
      ]
      const result = sortComponents(components, 'alphabetical')

      // Should be sorted by label: Button, Image, Text, Text Area
      expect(result[0]).toBe(ComponentType.BUTTON)
      expect(result[1]).toBe(ComponentType.IMAGE)
      expect(result[2]).toBe(ComponentType.TEXT)
      expect(result[3]).toBe(ComponentType.TEXTAREA)
    })

    test('sortComponents with usage order', () => {
      const components = [
        ComponentType.TEXTAREA,
        ComponentType.IMAGE,
        ComponentType.BUTTON,
        ComponentType.TEXT,
      ]
      const result = sortComponents(components, 'usage')

      // Should be sorted by usage frequency (descending)
      // TEXT (95) > BUTTON (90) > IMAGE (80) > TEXTAREA (70)
      expect(result[0]).toBe(ComponentType.TEXT)
      expect(result[1]).toBe(ComponentType.BUTTON)
      expect(result[2]).toBe(ComponentType.IMAGE)
      expect(result[3]).toBe(ComponentType.TEXTAREA)
    })

    test('sortComponents with recent order uses recent components first', () => {
      const components = [
        ComponentType.TEXT,
        ComponentType.BUTTON,
        ComponentType.IMAGE,
        ComponentType.TEXTAREA,
      ]
      const recentComponents = [ComponentType.IMAGE, ComponentType.TEXTAREA]
      const result = sortComponents(components, 'recent', recentComponents)

      // Recent components should come first, in order of recency
      expect(result[0]).toBe(ComponentType.IMAGE)
      expect(result[1]).toBe(ComponentType.TEXTAREA)
      // Rest should be sorted by usage
      expect(result[2]).toBe(ComponentType.TEXT)
      expect(result[3]).toBe(ComponentType.BUTTON)
    })

    test('sortComponents with recent order falls back to usage for non-recent', () => {
      const components = [
        ComponentType.TEXT,
        ComponentType.BUTTON,
        ComponentType.IMAGE,
        ComponentType.TEXTAREA,
      ]
      const recentComponents: ComponentType[] = []
      const result = sortComponents(components, 'recent', recentComponents)

      // Should fall back to usage order when no recent components
      expect(result[0]).toBe(ComponentType.TEXT)
      expect(result[1]).toBe(ComponentType.BUTTON)
      expect(result[2]).toBe(ComponentType.IMAGE)
      expect(result[3]).toBe(ComponentType.TEXTAREA)
    })

    test('sortComponents returns original array for unknown sort order', () => {
      const components = [
        ComponentType.TEXTAREA,
        ComponentType.IMAGE,
        ComponentType.BUTTON,
        ComponentType.TEXT,
      ]
      const result = sortComponents(components, 'unknown' as any)

      expect(result).toEqual(components)
    })

    test('sortComponents does not modify original array', () => {
      const components = [
        ComponentType.TEXTAREA,
        ComponentType.IMAGE,
        ComponentType.BUTTON,
        ComponentType.TEXT,
      ]
      const original = [...components]

      sortComponents(components, 'alphabetical')

      expect(components).toEqual(original)
    })
  })

  describe('Recent Components Management', () => {
    test('addToRecentComponents adds new component to front', () => {
      const recent = [ComponentType.TEXT, ComponentType.BUTTON]
      const result = addToRecentComponents(recent, ComponentType.IMAGE)

      expect(result[0]).toBe(ComponentType.IMAGE)
      expect(result[1]).toBe(ComponentType.TEXT)
      expect(result[2]).toBe(ComponentType.BUTTON)
    })

    test('addToRecentComponents moves existing component to front', () => {
      const recent = [
        ComponentType.TEXT,
        ComponentType.BUTTON,
        ComponentType.IMAGE,
      ]
      const result = addToRecentComponents(recent, ComponentType.BUTTON)

      expect(result[0]).toBe(ComponentType.BUTTON)
      expect(result[1]).toBe(ComponentType.TEXT)
      expect(result[2]).toBe(ComponentType.IMAGE)
      expect(result).toHaveLength(3) // No duplicates
    })

    test('addToRecentComponents respects max limit', () => {
      const recent = Array.from(
        { length: 10 },
        (_, i) => `component-${i}` as ComponentType
      )
      const result = addToRecentComponents(recent, ComponentType.TEXT, 10)

      expect(result).toHaveLength(10)
      expect(result[0]).toBe(ComponentType.TEXT)
      expect(result).not.toContain('component-9') // Last item should be removed
    })

    test('addToRecentComponents uses default max of 10', () => {
      const recent = Array.from(
        { length: 10 },
        (_, i) => `component-${i}` as ComponentType
      )
      const result = addToRecentComponents(recent, ComponentType.TEXT)

      expect(result).toHaveLength(10)
    })

    test('addToRecentComponents works with empty array', () => {
      const result = addToRecentComponents([], ComponentType.TEXT)

      expect(result).toEqual([ComponentType.TEXT])
    })
  })

  describe('Interaction History', () => {
    test('createPaletteInteraction creates interaction with required fields', () => {
      const interaction = createPaletteInteraction('add')

      expect(interaction).toHaveProperty('id')
      expect(interaction).toHaveProperty('type', 'add')
      expect(interaction).toHaveProperty('timestamp')
      expect(interaction.timestamp).toBeInstanceOf(Date)
      expect(interaction.id).toMatch(/^interaction-\d+-[a-z0-9]+$/)
    })

    test('createPaletteInteraction accepts optional parameters', () => {
      const interaction = createPaletteInteraction('drag', {
        componentType: ComponentType.TEXT,
        category: 'basic',
        metadata: { position: { x: 10, y: 20 } },
      })

      expect(interaction.type).toBe('drag')
      expect(interaction.componentType).toBe(ComponentType.TEXT)
      expect(interaction.category).toBe('basic')
      expect(interaction.metadata).toEqual({ position: { x: 10, y: 20 } })
    })

    test('createPaletteInteraction generates unique IDs', () => {
      const interaction1 = createPaletteInteraction('add')
      const interaction2 = createPaletteInteraction('add')

      expect(interaction1.id).not.toBe(interaction2.id)
    })

    test('interaction types are correctly typed', () => {
      const validTypes = [
        'drag',
        'add',
        'select',
        'search',
        'category_toggle',
      ] as const

      validTypes.forEach(type => {
        const interaction = createPaletteInteraction(type)
        expect(interaction.type).toBe(type)
      })
    })
  })

  describe('State Updates and Immutability', () => {
    test('state updates should be immutable', () => {
      const initialState = { ...DEFAULT_PALETTE_STATE }

      // Simulate state update
      const updatedState: PaletteState = {
        ...initialState,
        searchQuery: 'text',
        isSearchActive: true,
      }

      expect(initialState.searchQuery).toBe('')
      expect(initialState.isSearchActive).toBe(false)
      expect(updatedState.searchQuery).toBe('text')
      expect(updatedState.isSearchActive).toBe(true)
    })

    test('preferences updates should be immutable', () => {
      const initialPrefs = { ...DEFAULT_PALETTE_PREFERENCES }

      const updatedPrefs = {
        ...initialPrefs,
        sortOrder: 'alphabetical' as const,
        previewSize: 'large' as const,
      }

      expect(initialPrefs.sortOrder).toBe('usage')
      expect(initialPrefs.previewSize).toBe('medium')
      expect(updatedPrefs.sortOrder).toBe('alphabetical')
      expect(updatedPrefs.previewSize).toBe('large')
    })

    test('category updates should be immutable', () => {
      const initialCategories = [...DEFAULT_CATEGORIES]

      const updatedCategories = initialCategories.map(cat =>
        cat.id === 'basic' ? { ...cat, isCollapsed: true } : cat
      )

      const originalBasic = initialCategories.find(cat => cat.id === 'basic')
      const updatedBasic = updatedCategories.find(cat => cat.id === 'basic')

      expect(originalBasic?.isCollapsed).toBe(false)
      expect(updatedBasic?.isCollapsed).toBe(true)
    })
  })

  describe('Edge Cases and Error Handling', () => {
    test('filterComponentsBySearch handles empty component array', () => {
      const result = filterComponentsBySearch([], 'text')
      expect(result).toEqual([])
    })

    test('sortComponents handles empty component array', () => {
      const result = sortComponents([], 'alphabetical')
      expect(result).toEqual([])
    })

    test('addToRecentComponents handles negative max limit', () => {
      const recent = [ComponentType.TEXT]
      const result = addToRecentComponents(recent, ComponentType.BUTTON, -1)

      // Should handle gracefully, likely by using 0 or default
      expect(Array.isArray(result)).toBe(true)
    })

    test('metadata is consistent with categories', () => {
      DEFAULT_CATEGORIES.forEach(category => {
        category.components.forEach(componentType => {
          const metadata = COMPONENT_METADATA[componentType]
          expect(metadata.category).toBe(category.id)
        })
      })
    })
  })
})
