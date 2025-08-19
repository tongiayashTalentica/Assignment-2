import React, { useRef, useEffect, useCallback, useState } from 'react'
import { BaseComponent, ComponentType } from '@/types'
import { useComponentActions } from '@/store'
import styles from './InlineTextEditor.module.css'

interface InlineTextEditorProps {
  component: BaseComponent
  isActive: boolean
  onActivate: () => void
  onDeactivate: () => void
}

export const InlineTextEditor: React.FC<InlineTextEditorProps> = ({
  component,
  isActive,
  onActivate,
  onDeactivate,
}) => {
  const { updateComponent } = useComponentActions()
  const editorRef = useRef<HTMLDivElement>(null)
  const [content, setContent] = useState('')
  const [hasChanges, setHasChanges] = useState(false)

  // Initialize content from component props
  useEffect(() => {
    if (
      component.type === ComponentType.TEXT ||
      component.type === ComponentType.TEXTAREA
    ) {
      const currentContent = (component.props as any).content || ''
      setContent(currentContent)
      setHasChanges(false)
    }
  }, [component.props, component.type])

  // Focus editor when activated
  useEffect(() => {
    if (isActive && editorRef.current) {
      editorRef.current.focus()

      // Select all text on activation
      const range = document.createRange()
      range.selectNodeContents(editorRef.current)
      const selection = window.getSelection()
      if (selection) {
        selection.removeAllRanges()
        selection.addRange(range)
      }
    }
  }, [isActive])

  // Handle content changes
  const handleInput = useCallback((event: React.FormEvent<HTMLDivElement>) => {
    const newContent = event.currentTarget.textContent || ''
    setContent(newContent)
    setHasChanges(true)
  }, [])

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      // Prevent drag operations during editing
      event.stopPropagation()

      switch (event.key) {
        case 'Enter':
          if (component.type === ComponentType.TEXT) {
            // For single-line text, finish editing
            event.preventDefault()
            finishEditing()
          }
          // For textarea, allow enter (new line)
          break

        case 'Escape':
          event.preventDefault()
          cancelEditing()
          break

        case 'Tab':
          event.preventDefault()
          finishEditing()
          break

        // Format shortcuts
        case 'b':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            document.execCommand('bold', false)
          }
          break

        case 'i':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            document.execCommand('italic', false)
          }
          break
      }
    },
    [component.type]
  )

  // Handle paste events
  const handlePaste = useCallback(
    (event: React.ClipboardEvent<HTMLDivElement>) => {
      event.preventDefault()

      // Get plain text from clipboard
      const text = event.clipboardData.getData('text/plain')

      // Insert plain text only
      if (document.selection) {
        // IE
        const range = (document.selection as any).createRange()
        range.text = text
      } else if (window.getSelection) {
        // Modern browsers
        const selection = window.getSelection()
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0)
          range.deleteContents()
          range.insertNode(document.createTextNode(text))

          // Move cursor to end of inserted text
          range.setStartAfter(range.endContainer)
          range.setEndAfter(range.endContainer)
          selection.removeAllRanges()
          selection.addRange(range)
        }
      }

      // Update content state
      const newContent = editorRef.current?.textContent || ''
      setContent(newContent)
      setHasChanges(true)
    },
    []
  )

  // Handle blur (focus lost)
  const handleBlur = useCallback((_event: React.FocusEvent<HTMLDivElement>) => {
    // Small delay to allow other click events to process
    setTimeout(() => {
      finishEditing()
    }, 150)
  }, [])

  // Finish editing and save changes
  const finishEditing = useCallback(() => {
    if (hasChanges && editorRef.current) {
      const newContent = editorRef.current.textContent || ''

      // Update component with new content
      updateComponent(component.id, {
        props: {
          ...component.props,
          content: newContent,
        },
      })
    }

    onDeactivate()
    setHasChanges(false)
  }, [hasChanges, component.id, component.props, updateComponent, onDeactivate])

  // Cancel editing without saving
  const cancelEditing = useCallback(() => {
    if (editorRef.current) {
      // Reset content to original
      editorRef.current.textContent = (component.props as any).content || ''
    }

    onDeactivate()
    setHasChanges(false)
  }, [component.props, onDeactivate])

  // Handle double click to activate
  const handleDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      if (!isActive) {
        event.preventDefault()
        event.stopPropagation()
        onActivate()
      }
    },
    [isActive, onActivate]
  )

  // Prevent drag events during editing
  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      if (isActive) {
        event.stopPropagation()
      }
    },
    [isActive]
  )

  if (!isActive) {
    // Return a transparent overlay that captures double-clicks
    return (
      <div
        className={styles.activationOverlay}
        onDoubleClick={handleDoubleClick}
        title="Double-click to edit text"
      />
    )
  }

  return (
    <div className={styles.editorContainer}>
      <div
        ref={editorRef}
        className={`${styles.editor} ${component.type === ComponentType.TEXTAREA ? styles.multiline : styles.singleLine}`}
        contentEditable={true}
        suppressContentEditableWarning={true}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onBlur={handleBlur}
        onMouseDown={handleMouseDown}
        style={{
          fontSize: (component.props as any).fontSize
            ? `${(component.props as any).fontSize}px`
            : '16px',
          fontWeight: (component.props as any).fontWeight || 400,
          color: (component.props as any).color || '#000000',
          textAlign:
            component.type === ComponentType.TEXTAREA
              ? (component.props as any).textAlign || 'left'
              : 'left',
          fontFamily: 'Arial, sans-serif',
          lineHeight: '1.4',
        }}
        role="textbox"
        aria-label="Inline text editor"
        aria-multiline={component.type === ComponentType.TEXTAREA}
        spellCheck={true}
      >
        {content}
      </div>

      {/* Editor controls */}
      <div className={styles.editorControls}>
        <div className={styles.controlsLeft}>
          <button
            type="button"
            className={styles.formatButton}
            onClick={() => document.execCommand('bold', false)}
            title="Bold (Ctrl+B)"
            aria-label="Bold"
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            className={styles.formatButton}
            onClick={() => document.execCommand('italic', false)}
            title="Italic (Ctrl+I)"
            aria-label="Italic"
          >
            <em>I</em>
          </button>
        </div>

        <div className={styles.controlsRight}>
          <button
            type="button"
            className={styles.actionButton}
            onClick={cancelEditing}
            title="Cancel (Escape)"
            aria-label="Cancel editing"
          >
            ✕
          </button>
          <button
            type="button"
            className={`${styles.actionButton} ${styles.saveButton}`}
            onClick={finishEditing}
            title="Save (Enter/Tab)"
            aria-label="Save changes"
          >
            ✓
          </button>
        </div>
      </div>

      {/* Usage hints */}
      <div className={styles.editorHints}>
        <div className={styles.hint}>
          {component.type === ComponentType.TEXT
            ? 'Press Enter or Tab to save, Escape to cancel'
            : 'Press Tab to save, Escape to cancel, Enter for new line'}
        </div>
      </div>
    </div>
  )
}
