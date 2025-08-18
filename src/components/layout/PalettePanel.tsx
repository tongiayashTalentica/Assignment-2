import React, { useState, useCallback, useRef, useEffect } from 'react'
import { PanelProps, ComponentType } from '@/types'
import styles from './Panel.module.css'
import { useComponentActions, useDragContext } from '@/store/simple'
import { ComponentFactory } from '@/utils/componentFactory'
import { PaletteCategory } from '@/components/ui/PaletteCategory'
import { ComponentPaletteItem } from '@/components/ui/ComponentPaletteItem'
import { usePaletteAccessibility } from '@/hooks/usePaletteAccessibility'
import {
  DEFAULT_CATEGORIES,
  DEFAULT_PALETTE_STATE,
  PaletteState,
  filterComponentsBySearch,
  addToRecentComponents,
  createPaletteInteraction,
  COMPONENT_METADATA,
} from '@/components/ui/PaletteState'

interface PalettePanelProps extends PanelProps {
  style?: React.CSSProperties
}

export const PalettePanel = ({
  className,
  children,
  style,
}: PalettePanelProps) => {
  const { addComponent, selectComponent } = useComponentActions()
  const dragContext = useDragContext()

  // Enhanced palette state
  const [paletteState, setPaletteState] = useState<PaletteState>(
    DEFAULT_PALETTE_STATE
  )
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const paletteRef = useRef<HTMLDivElement>(null)

  // Handle component addition
  const handleAddComponent = useCallback(
    (type: ComponentType) => {
      const component = ComponentFactory.create(type, { x: 40, y: 40 })
      addComponent(component)
      selectComponent(component.id)

      // Update recent components and interaction history
      setPaletteState(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          recentComponents: addToRecentComponents(
            prev.preferences.recentComponents,
            type
          ),
        },
        interactionHistory: [
          createPaletteInteraction('add', { componentType: type }),
          ...prev.interactionHistory.slice(0, 49), // Keep last 50 interactions
        ],
      }))
    },
    [addComponent, selectComponent]
  )

  // Handle component selection
  const handleSelectComponent = useCallback((type: ComponentType) => {
    setPaletteState(prev => ({
      ...prev,
      selectedComponentType: prev.selectedComponentType === type ? null : type,
      focusedComponentType: type,
      interactionHistory: [
        createPaletteInteraction('select', { componentType: type }),
        ...prev.interactionHistory.slice(0, 49),
      ],
    }))
  }, [])

  // Handle search input
  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const query = event.target.value
      setPaletteState(prev => ({
        ...prev,
        searchQuery: query,
        isSearchActive: query.trim().length > 0,
        preferences: {
          ...prev.preferences,
          searchQuery: query,
        },
        interactionHistory: query.trim()
          ? [
              createPaletteInteraction('search', { metadata: { query } }),
              ...prev.interactionHistory.slice(0, 49),
            ]
          : prev.interactionHistory,
      }))
    },
    []
  )

  // Handle category collapse toggle
  const handleToggleCategoryCollapse = useCallback((categoryId: string) => {
    setCategories(prev =>
      prev.map(cat =>
        cat.id === categoryId ? { ...cat, isCollapsed: !cat.isCollapsed } : cat
      )
    )

    setPaletteState(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        collapsedCategories: new Set(prev.preferences.collapsedCategories),
      },
      interactionHistory: [
        createPaletteInteraction('category_toggle', { category: categoryId }),
        ...prev.interactionHistory.slice(0, 49),
      ],
    }))
  }, [])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case 'f':
          event.preventDefault()
          searchInputRef.current?.focus()
          break
        case 'k':
          event.preventDefault()
          searchInputRef.current?.focus()
          break
      }
    }

    if (event.key === 'Escape') {
      setPaletteState(prev => ({
        ...prev,
        searchQuery: '',
        isSearchActive: false,
        selectedComponentType: null,
        keyboardNavigationIndex: -1,
      }))

      if (searchInputRef.current) {
        searchInputRef.current.value = ''
        searchInputRef.current.blur()
      }
    }
  }, [])

  // Clear search
  const handleClearSearch = useCallback(() => {
    setPaletteState(prev => ({
      ...prev,
      searchQuery: '',
      isSearchActive: false,
      preferences: {
        ...prev.preferences,
        searchQuery: '',
      },
    }))

    if (searchInputRef.current) {
      searchInputRef.current.value = ''
      searchInputRef.current.focus()
    }
  }, [])

  // Enhanced accessibility (after callback definitions)
  // Enhanced accessibility (after callback definitions) - currently for future enhancements
  const _accessibility = usePaletteAccessibility({
    // eslint-disable-line @typescript-eslint/no-unused-vars
    containerId: 'palette-panel',
    onComponentAdd: handleAddComponent,
    onComponentSelect: handleSelectComponent,
    onCategoryToggle: handleToggleCategoryCollapse,
    enableKeyboardDrag: true,
    enableScreenReader: true,
    enableFocusTrapping: false, // Allow focus to move to canvas
  })

  // Setup keyboard event listener
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (
        event.target === document.body ||
        paletteRef.current?.contains(event.target as Node)
      ) {
        handleKeyDown(event as unknown as React.KeyboardEvent)
      }
    }

    document.addEventListener('keydown', handleGlobalKeyDown)
    return () => document.removeEventListener('keydown', handleGlobalKeyDown)
  }, [handleKeyDown])

  // Get filtered and sorted components for quick access
  const allComponents = categories.flatMap(cat => cat.components)
  const filteredComponents = filterComponentsBySearch(
    allComponents,
    paletteState.searchQuery
  )
  const hasSearchResults =
    paletteState.isSearchActive && filteredComponents.length > 0
  const hasNoSearchResults =
    paletteState.isSearchActive && filteredComponents.length === 0

  return (
    <div
      id="palette-panel"
      ref={paletteRef}
      className={`${styles['panel']} ${className || ''}`}
      style={{
        ...style,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      role="region"
      aria-label="Component Palette"
      aria-description="Browse and add components to the canvas. Use arrow keys to navigate, Enter to add components, Ctrl+K to search."
    >
      {/* Enhanced Header */}
      <div className={styles['panelHeader']} style={{ flexShrink: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px',
          }}
        >
          <h2
            className={styles['panelTitle']}
            style={{ margin: 0, fontSize: '16px' }}
          >
            Components
          </h2>

          {dragContext?.state !== 'idle' && (
            <div
              style={{
                fontSize: '12px',
                color: '#059669',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  backgroundColor: '#059669',
                  borderRadius: '50%',
                  animation: 'pulse 2s infinite',
                }}
              />
              Dragging...
            </div>
          )}
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative' }}>
          <input
            ref={searchInputRef}
            type="search"
            placeholder="Search components... (Ctrl+K)"
            value={paletteState.searchQuery}
            onChange={handleSearchChange}
            role="searchbox"
            aria-label="Search components"
            aria-describedby="search-help"
            style={{
              width: '100%',
              padding: '8px 32px 8px 12px',
              fontSize: '14px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: '#ffffff',
              outline: 'none',
              transition: 'border-color 0.2s ease',
            }}
            onFocus={e => {
              e.target.style.borderColor = '#3b82f6'
              e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
            }}
            onBlur={e => {
              e.target.style.borderColor = '#d1d5db'
              e.target.style.boxShadow = 'none'
            }}
          />

          {/* Search Icon / Clear Button */}
          {paletteState.searchQuery ? (
            <button
              onClick={handleClearSearch}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                color: '#6b7280',
              }}
              aria-label="Clear search"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          ) : (
            <svg
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9ca3af',
                pointerEvents: 'none',
              }}
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          )}
        </div>

        {/* Search Results Summary */}
        {paletteState.isSearchActive && (
          <div
            id="search-help"
            role="status"
            aria-live="polite"
            style={{
              fontSize: '12px',
              color: '#6b7280',
              marginTop: '4px',
              textAlign: 'center',
            }}
          >
            {hasNoSearchResults
              ? 'No matching components'
              : `${filteredComponents.length} component${filteredComponents.length === 1 ? '' : 's'} found`}
          </div>
        )}
      </div>

      {/* Scrollable Content */}
      <div
        className={styles['panelContent']}
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '0',
          scrollbarWidth: 'thin',
        }}
      >
        {children || (
          <div style={{ padding: '0 4px' }}>
            {/* Categories */}
            {!paletteState.isSearchActive && (
              <>
                <div
                  style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    marginBottom: '12px',
                    textAlign: 'center',
                    fontStyle: 'italic',
                  }}
                >
                  Drag components to canvas or double-click to add
                </div>

                {categories.map(category => (
                  <PaletteCategory
                    key={category.id}
                    category={category}
                    selectedComponentType={paletteState.selectedComponentType}
                    onComponentAdd={handleAddComponent}
                    onComponentSelect={handleSelectComponent}
                    onToggleCollapse={handleToggleCategoryCollapse}
                    showDescriptions={paletteState.preferences.showDescriptions}
                  />
                ))}
              </>
            )}

            {/* Search Results */}
            {hasSearchResults && (
              <div style={{ padding: '8px' }}>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '12px',
                  }}
                >
                  Search Results
                </div>

                {filteredComponents.map(type => {
                  const metadata = COMPONENT_METADATA[type]
                  return (
                    <ComponentPaletteItem
                      key={type}
                      type={type}
                      label={metadata.label}
                      description={metadata.description}
                      onAdd={() => handleAddComponent(type)}
                      onSelect={() => handleSelectComponent(type)}
                      isSelected={paletteState.selectedComponentType === type}
                      disabled={false}
                      showTooltip={true}
                    />
                  )
                })}
              </div>
            )}

            {/* No Search Results */}
            {hasNoSearchResults && (
              <div
                style={{
                  padding: '24px',
                  textAlign: 'center',
                  color: '#9ca3af',
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    marginBottom: '4px',
                  }}
                >
                  No components found
                </div>
                <div style={{ fontSize: '12px' }}>
                  Try a different search term
                </div>
              </div>
            )}

            {/* Performance Debug Info */}
            {dragContext?.performanceData && (
              <div
                style={{
                  fontSize: '11px',
                  color: '#9ca3af',
                  padding: '8px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '4px',
                  margin: '8px',
                  border: '1px solid #f3f4f6',
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    marginBottom: '4px',
                    color: '#6b7280',
                  }}
                >
                  Drag Performance
                </div>
                <div>Frames: {dragContext.performanceData.frameCount}</div>
                <div>
                  Avg Frame:{' '}
                  {dragContext.performanceData.averageFrameTime.toFixed(2)}ms
                </div>
                <div>
                  Memory:{' '}
                  {(
                    dragContext.performanceData.memoryUsage /
                    1024 /
                    1024
                  ).toFixed(2)}
                  MB
                </div>
              </div>
            )}

            {/* Recent Components (when not searching) */}
            {!paletteState.isSearchActive &&
              paletteState.preferences.recentComponents.length > 0 && (
                <div
                  style={{
                    margin: '16px 8px 8px 8px',
                    padding: '12px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#64748b',
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Recently Used
                  </div>
                  <div
                    style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}
                  >
                    {paletteState.preferences.recentComponents
                      .slice(0, 4)
                      .map(type => {
                        const metadata = COMPONENT_METADATA[type]
                        return (
                          <button
                            key={type}
                            onClick={() => handleAddComponent(type)}
                            style={{
                              padding: '4px 8px',
                              fontSize: '11px',
                              backgroundColor: '#ffffff',
                              border: '1px solid #e2e8f0',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              color: '#475569',
                              transition: 'all 0.2s ease',
                            }}
                            onMouseOver={e => {
                              e.currentTarget.style.backgroundColor = '#f1f5f9'
                              e.currentTarget.style.borderColor = '#cbd5e1'
                            }}
                            onMouseOut={e => {
                              e.currentTarget.style.backgroundColor = '#ffffff'
                              e.currentTarget.style.borderColor = '#e2e8f0'
                            }}
                            title={`Add ${metadata.label}`}
                          >
                            {metadata.label}
                          </button>
                        )
                      })}
                  </div>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  )
}
