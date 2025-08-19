import React, { useState, useCallback, useRef } from 'react'
import { ComponentType } from '@/types'
import { ComponentPaletteItem } from './ComponentPaletteItem'
import {
  PaletteCategory as CategoryType,
  COMPONENT_METADATA,
} from './PaletteState'

interface PaletteCategoryProps {
  category: CategoryType
  selectedComponentType?: ComponentType | null
  searchQuery?: string
  onComponentAdd: (type: ComponentType) => void
  onComponentSelect: (type: ComponentType) => void
  onToggleCollapse: (categoryId: string) => void
  showDescriptions?: boolean
}

export const PaletteCategory: React.FC<PaletteCategoryProps> = ({
  category,
  selectedComponentType,
  searchQuery = '',
  onComponentAdd,
  onComponentSelect,
  onToggleCollapse,
  showDescriptions: _showDescriptions = true,
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const headerRef = useRef<HTMLDivElement>(null)

  // Filter components based on search query
  const filteredComponents = category.components.filter(type => {
    if (!searchQuery.trim()) return true

    const metadata = COMPONENT_METADATA[type]
    const query = searchQuery.toLowerCase()

    return (
      metadata.label.toLowerCase().includes(query) ||
      metadata.description.toLowerCase().includes(query) ||
      metadata.tags.some(tag => tag.toLowerCase().includes(query))
    )
  })

  // Hide category if no components match search
  if (filteredComponents.length === 0 && searchQuery.trim()) {
    return null
  }

  const handleToggleCollapse = useCallback(() => {
    onToggleCollapse(category.id)
  }, [category.id, onToggleCollapse])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        handleToggleCollapse()
      }
    },
    [handleToggleCollapse]
  )

  const categoryHeaderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 8px',
    margin: '8px 0 4px 0',
    borderRadius: '6px',
    cursor: 'pointer',
    userSelect: 'none',
    backgroundColor: isHovered ? '#f3f4f6' : 'transparent',
    border: isHovered ? '1px solid #e5e7eb' : '1px solid transparent',
    transition: 'all 0.2s ease',
    outline: 'none',
  }

  const chevronStyle: React.CSSProperties = {
    width: '16px',
    height: '16px',
    transition: 'transform 0.2s ease',
    transform: category.isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
    color: '#6b7280',
  }

  const categoryContentStyle: React.CSSProperties = {
    overflow: 'hidden',
    transition:
      'max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease',
    maxHeight: category.isCollapsed ? '0px' : '500px', // Reasonable max height
    opacity: category.isCollapsed ? 0 : 1,
  }

  return (
    <div style={{ marginBottom: '16px' }}>
      {/* Category Header */}
      <div
        ref={headerRef}
        style={categoryHeaderStyle}
        onClick={handleToggleCollapse}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        tabIndex={0}
        role="button"
        aria-expanded={!category.isCollapsed}
        aria-controls={`category-${category.id}-content`}
        aria-label={`${category.label} - Expand or Collapse category`}
        data-category-toggle
        data-category-id={category.id}
      >
        {/* Chevron Icon */}
        <svg
          style={chevronStyle}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>

        {/* Category Icon */}
        <span style={{ fontSize: '16px' }}>{category.icon}</span>

        {/* Category Label */}
        <span
          style={{
            fontWeight: 600,
            fontSize: '14px',
            color: '#374151',
            flex: 1,
          }}
        >
          {category.label}
        </span>

        {/* Component Count */}
        <span
          style={{
            fontSize: '12px',
            color: '#6b7280',
            backgroundColor: '#f3f4f6',
            padding: '2px 6px',
            borderRadius: '8px',
            minWidth: '20px',
            textAlign: 'center',
          }}
        >
          {filteredComponents.length}
        </span>
      </div>

      {/* Category Content */}
      <div
        id={`category-${category.id}-content`}
        style={categoryContentStyle}
        aria-hidden={category.isCollapsed}
      >
        <div style={{ padding: '0 8px' }}>
          {filteredComponents.map(type => {
            const metadata = COMPONENT_METADATA[type]
            return (
              <ComponentPaletteItem
                key={type}
                type={type}
                label={metadata.label}
                description=""
                category={category.id}
                onAdd={() => onComponentAdd(type)}
                onSelect={() => onComponentSelect(type)}
                isSelected={selectedComponentType === type}
                disabled={false}
                showTooltip={true}
              />
            )
          })}
        </div>
      </div>

      {/* Empty State for Search */}
      {filteredComponents.length === 0 && !searchQuery.trim() && (
        <div
          style={{
            padding: '16px',
            textAlign: 'center',
            color: '#9ca3af',
            fontSize: '12px',
            fontStyle: 'italic',
          }}
        >
          No components in this category
        </div>
      )}
    </div>
  )
}
