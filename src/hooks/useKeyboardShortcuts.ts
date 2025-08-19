import { useEffect, useCallback } from 'react'
import {
  useHistoryActions,
  useComponentActions,
  useSelectedComponents,
} from '@/store'

/**
 * Global keyboard shortcuts hook
 * Handles common editor shortcuts like undo, redo, copy, paste, delete, etc.
 */
export const useKeyboardShortcuts = () => {
  const { undo, redo } = useHistoryActions()
  const { removeComponent, duplicateComponent } = useComponentActions()
  const selectedComponents = useSelectedComponents()

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't handle shortcuts if user is typing in an input/textarea or contentEditable
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true' ||
        target.getAttribute('role') === 'textbox'
      ) {
        return
      }

      const { ctrlKey, metaKey, shiftKey, key, altKey } = event
      const isModifierPressed = ctrlKey || metaKey

      switch (key.toLowerCase()) {
        case 'z':
          if (isModifierPressed && !shiftKey && !altKey) {
            event.preventDefault()
            undo()
          } else if (isModifierPressed && shiftKey && !altKey) {
            event.preventDefault()
            redo()
          }
          break

        case 'y':
          if (isModifierPressed && !shiftKey && !altKey) {
            event.preventDefault()
            redo()
          }
          break

        case 'delete':
        case 'backspace':
          if (!isModifierPressed && selectedComponents.length > 0) {
            event.preventDefault()
            selectedComponents.forEach(component => {
              removeComponent(component.id)
            })
          }
          break

        case 'd':
          if (isModifierPressed && !shiftKey && selectedComponents.length > 0) {
            event.preventDefault()
            selectedComponents.forEach(component => {
              duplicateComponent(component.id)
            })
          }
          break

        case 'a':
          if (isModifierPressed && !shiftKey) {
            event.preventDefault()
            // TODO: Implement select all
            // This would require adding a selectAll action to the store
          }
          break

        case 'escape':
          // TODO: Implement escape behavior (deselect, cancel current operation)
          break

        // Save shortcut (handled by auto-save, but we can trigger manual save)
        case 's':
          if (isModifierPressed && !shiftKey) {
            event.preventDefault()
            // TODO: Trigger manual save
          }
          break

        default:
          break
      }
    },
    [undo, redo, removeComponent, duplicateComponent, selectedComponents]
  )

  // Attach global keyboard event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  // Return available shortcuts for documentation/help
  return {
    shortcuts: {
      'Ctrl/Cmd + Z': 'Undo',
      'Ctrl/Cmd + Shift + Z': 'Redo',
      'Ctrl/Cmd + Y': 'Redo',
      'Delete/Backspace': 'Delete selected components',
      'Ctrl/Cmd + D': 'Duplicate selected components',
      'Ctrl/Cmd + A': 'Select all components',
      Escape: 'Deselect all',
      'Ctrl/Cmd + S': 'Save project',
    },
  }
}
