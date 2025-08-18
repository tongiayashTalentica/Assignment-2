import { useEffect, useCallback, useRef, useState } from 'react'
import { ComponentType } from '@/types'
import { COMPONENT_METADATA } from '@/components/ui/PaletteState'

// Keyboard navigation directions
type NavigationDirection = 'up' | 'down' | 'left' | 'right' | 'first' | 'last'

// Focusable element info
interface FocusableElement {
  element: HTMLElement
  componentType?: ComponentType
  categoryId?: string
  index: number
}

// Screen reader announcements
interface Announcement {
  message: string
  priority: 'polite' | 'assertive'
  delay?: number
}

export interface PaletteAccessibilityOptions {
  containerId: string
  onComponentAdd?: (type: ComponentType) => void
  onComponentSelect?: (type: ComponentType) => void
  onCategoryToggle?: (categoryId: string) => void
  enableKeyboardDrag?: boolean
  enableScreenReader?: boolean
  enableFocusTrapping?: boolean
}

export const usePaletteAccessibility = (
  options: PaletteAccessibilityOptions
) => {
  const {
    containerId,
    onComponentAdd,
    onComponentSelect: _onComponentSelect, // eslint-disable-line @typescript-eslint/no-unused-vars
    onCategoryToggle,
    enableKeyboardDrag = true,
    enableScreenReader = true,
    enableFocusTrapping = true,
  } = options

  const [focusedIndex, setFocusedIndex] = useState(-1)
  const [isKeyboardNavActive, setIsKeyboardNavActive] = useState(false)
  const [keyboardDragMode, setKeyboardDragMode] = useState<{
    active: boolean
    componentType?: ComponentType
  }>({ active: false })

  const containerRef = useRef<HTMLElement | null>(null)
  const announcementRef = useRef<HTMLDivElement | null>(null)
  const focusableElementsRef = useRef<FocusableElement[]>([])
  const _lastFocusedElementRef = useRef<HTMLElement | null>(null) // eslint-disable-line @typescript-eslint/no-unused-vars

  // Initialize container reference
  useEffect(() => {
    containerRef.current = document.getElementById(containerId)
  }, [containerId])

  // Create screen reader announcement region
  useEffect(() => {
    if (!enableScreenReader) return

    if (!announcementRef.current) {
      const announcementDiv = document.createElement('div')
      announcementDiv.setAttribute('aria-live', 'polite')
      announcementDiv.setAttribute('aria-atomic', 'true')
      announcementDiv.setAttribute('aria-relevant', 'text')
      announcementDiv.style.cssText = `
        position: absolute;
        left: -10000px;
        top: auto;
        width: 1px;
        height: 1px;
        overflow: hidden;
      `
      document.body.appendChild(announcementDiv)
      announcementRef.current = announcementDiv
    }

    return () => {
      if (announcementRef.current) {
        document.body.removeChild(announcementRef.current)
        announcementRef.current = null
      }
    }
  }, [enableScreenReader])

  // Announce messages to screen readers
  const announce = useCallback(
    (announcement: Announcement) => {
      if (!enableScreenReader || !announcementRef.current) return

      const { message, priority = 'polite', delay = 0 } = announcement

      setTimeout(() => {
        if (announcementRef.current) {
          announcementRef.current.setAttribute('aria-live', priority)
          announcementRef.current.textContent = message

          // Clear after announcement to allow repeat announcements
          setTimeout(() => {
            if (announcementRef.current) {
              announcementRef.current.textContent = ''
            }
          }, 1000)
        }
      }, delay)
    },
    [enableScreenReader]
  )

  // Find all focusable elements in the palette
  const updateFocusableElements = useCallback(() => {
    if (!containerRef.current) return

    const focusableSelectors = [
      '[data-component-type]',
      '[data-category-toggle]',
      'input[type="search"]',
      'button:not([disabled])',
      '[tabindex="0"]',
    ].join(', ')

    const elements = Array.from(
      containerRef.current.querySelectorAll(focusableSelectors)
    ) as HTMLElement[]

    focusableElementsRef.current = elements.map((element, index) => ({
      element,
      componentType: element.getAttribute(
        'data-component-type'
      ) as ComponentType,
      categoryId: element.getAttribute('data-category-id') || undefined,
      index,
    }))
  }, [])

  // Update focusable elements when DOM changes
  useEffect(() => {
    updateFocusableElements()

    // Set up mutation observer to detect DOM changes
    if (containerRef.current) {
      const observer = new MutationObserver(() => {
        updateFocusableElements()
      })

      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: [
          'data-component-type',
          'data-category-id',
          'tabindex',
        ],
      })

      return () => observer.disconnect()
    }
  }, [updateFocusableElements])

  // Navigate to element by direction
  const navigateToElement = useCallback(
    (direction: NavigationDirection, fromIndex?: number) => {
      const elements = focusableElementsRef.current
      if (elements.length === 0) return

      const currentIndex = fromIndex ?? focusedIndex
      let newIndex: number

      switch (direction) {
        case 'up':
          newIndex = currentIndex > 0 ? currentIndex - 1 : elements.length - 1
          break
        case 'down':
          newIndex = currentIndex < elements.length - 1 ? currentIndex + 1 : 0
          break
        case 'first':
          newIndex = 0
          break
        case 'last':
          newIndex = elements.length - 1
          break
        default:
          return
      }

      const targetElement = elements[newIndex]
      if (targetElement) {
        targetElement.element.focus()
        setFocusedIndex(newIndex)

        // Announce navigation for screen readers
        const componentType = targetElement.componentType
        if (componentType && enableScreenReader) {
          const metadata = COMPONENT_METADATA[componentType]
          announce({
            message: `${metadata.label} component, ${metadata.description}`,
            priority: 'polite',
          })
        }
      }
    },
    [focusedIndex, announce, enableScreenReader]
  )

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isKeyboardNavActive && !event.target) return

      const target = event.target as HTMLElement
      const isInPalette = containerRef.current?.contains(target)

      if (!isInPalette) return

      // Global palette keyboard shortcuts
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'f':
          case 'k':
            event.preventDefault()
            {
              const searchInput = containerRef.current?.querySelector(
                'input[type="search"]'
              ) as HTMLInputElement
              if (searchInput) {
                searchInput.focus()
                announce({
                  message: 'Search components',
                  priority: 'polite',
                })
              }
            }
            return
        }
      }

      // Keyboard drag mode handling
      if (keyboardDragMode.active) {
        handleKeyboardDragMode(event)
        return
      }

      // Navigation keys
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          setIsKeyboardNavActive(true)
          navigateToElement('down')
          break

        case 'ArrowUp':
          event.preventDefault()
          setIsKeyboardNavActive(true)
          navigateToElement('up')
          break

        case 'Home':
          event.preventDefault()
          setIsKeyboardNavActive(true)
          navigateToElement('first')
          break

        case 'End':
          event.preventDefault()
          setIsKeyboardNavActive(true)
          navigateToElement('last')
          break

        case 'Enter':
        case ' ':
          event.preventDefault()
          handleActivation(target)
          break

        case 'Escape':
          handleEscape()
          break

        // Keyboard drag initiation
        case 'd':
          if (enableKeyboardDrag && event.shiftKey) {
            event.preventDefault()
            initiateKeyboardDrag(target)
          }
          break
      }
    },
    [
      isKeyboardNavActive,
      keyboardDragMode.active,
      navigateToElement,
      enableKeyboardDrag,
    ]
  )

  // Handle activation (Enter/Space)
  const handleActivation = useCallback(
    (target: HTMLElement) => {
      const componentType = target.getAttribute(
        'data-component-type'
      ) as ComponentType
      const categoryId = target.getAttribute('data-category-id')

      if (componentType) {
        if (onComponentAdd) {
          onComponentAdd(componentType)
          announce({
            message: `${COMPONENT_METADATA[componentType].label} component added to canvas`,
            priority: 'assertive',
          })
        }
      } else if (categoryId && onCategoryToggle) {
        onCategoryToggle(categoryId)
        announce({
          message: 'Category toggled',
          priority: 'polite',
        })
      }
    },
    [onComponentAdd, onCategoryToggle, announce]
  )

  // Handle escape key
  const handleEscape = useCallback(() => {
    if (keyboardDragMode.active) {
      setKeyboardDragMode({ active: false })
      announce({
        message: 'Keyboard drag mode cancelled',
        priority: 'polite',
      })
    } else {
      setIsKeyboardNavActive(false)
      setFocusedIndex(-1)

      // Return focus to last focused element or search input
      const searchInput = containerRef.current?.querySelector(
        'input[type="search"]'
      ) as HTMLInputElement
      if (searchInput) {
        searchInput.focus()
      }
    }
  }, [keyboardDragMode.active, announce])

  // Initiate keyboard drag mode
  const initiateKeyboardDrag = useCallback(
    (target: HTMLElement) => {
      const componentType = target.getAttribute(
        'data-component-type'
      ) as ComponentType

      if (componentType) {
        setKeyboardDragMode({ active: true, componentType })
        announce({
          message: `Keyboard drag mode activated for ${COMPONENT_METADATA[componentType].label}. Use arrow keys to position, Enter to place, Escape to cancel`,
          priority: 'assertive',
        })
      }
    },
    [announce]
  )

  // Handle keyboard drag mode
  const handleKeyboardDragMode = useCallback(
    (event: KeyboardEvent) => {
      event.preventDefault()

      switch (event.key) {
        case 'Enter':
          if (keyboardDragMode.componentType && onComponentAdd) {
            onComponentAdd(keyboardDragMode.componentType)
            setKeyboardDragMode({ active: false })
            announce({
              message: `${COMPONENT_METADATA[keyboardDragMode.componentType].label} component placed`,
              priority: 'assertive',
            })
          }
          break

        case 'Escape':
          setKeyboardDragMode({ active: false })
          announce({
            message: 'Keyboard drag cancelled',
            priority: 'polite',
          })
          break

        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight':
          // Visual feedback for drag positioning (implementation depends on canvas)
          announce({
            message: `Moving ${keyboardDragMode.componentType ? COMPONENT_METADATA[keyboardDragMode.componentType].label : 'component'}`,
            priority: 'polite',
          })
          break
      }
    },
    [keyboardDragMode, onComponentAdd, announce]
  )

  // Focus trap for modal-like behavior
  const setupFocusTrap = useCallback(() => {
    if (!enableFocusTrapping || !containerRef.current) return

    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement
      if (!containerRef.current?.contains(target)) {
        // Focus escaped palette, return it
        const firstFocusable = focusableElementsRef.current[0]
        if (firstFocusable) {
          firstFocusable.element.focus()
        }
      }
    }

    document.addEventListener('focusin', handleFocusIn)
    return () => document.removeEventListener('focusin', handleFocusIn)
  }, [enableFocusTrapping])

  // Setup keyboard event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Setup focus trap if enabled
  useEffect(() => {
    if (enableFocusTrapping) {
      return setupFocusTrap()
    }
  }, [setupFocusTrap, enableFocusTrapping])

  // Focus first element when navigation becomes active
  useEffect(() => {
    if (isKeyboardNavActive && focusedIndex === -1) {
      navigateToElement('first')
    }
  }, [isKeyboardNavActive, focusedIndex, navigateToElement])

  return {
    // State
    focusedIndex,
    isKeyboardNavActive,
    keyboardDragMode,

    // Actions
    navigateToElement,
    announce,
    setIsKeyboardNavActive,

    // Utilities
    updateFocusableElements,

    // Event handlers
    handleKeyDown,

    // Focus management
    focusFirst: () => navigateToElement('first'),
    focusLast: () => navigateToElement('last'),

    // Accessibility helpers
    getAriaLabel: (componentType: ComponentType) => {
      const metadata = COMPONENT_METADATA[componentType]
      return `Add ${metadata.label} component - ${metadata.description}`
    },

    getAriaDescription: (componentType: ComponentType) => {
      const metadata = COMPONENT_METADATA[componentType]
      return `${metadata.description}. Press Enter to add to canvas, Shift+D for keyboard drag mode.`
    },
  }
}
