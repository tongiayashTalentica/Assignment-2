import React, { useState } from 'react'
import { useLayout, useAppStore, useHistoryActions } from '@/store'
import { PalettePanel } from './PalettePanel'
import { CanvasPanel } from './CanvasPanel'
import { PropertiesPanel } from './PropertiesPanel'
import { StoreDebug } from '@/components/debug/StoreDebug'
import { ProjectManager } from '@/components/ui/ProjectManager'
import { SaveStatusIndicator } from '@/components/ui/SaveStatusIndicator'
import { PreviewModal } from '@/components/ui/PreviewModal'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import styles from './MainLayout.module.css'

export const MainLayout = () => {
  const layout = useLayout()
  const [showProjectManager, setShowProjectManager] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const currentProject = useAppStore(
    state => state.application.persistence.currentProject
  )
  const { undo, redo } = useHistoryActions()
  const history = useAppStore(state => state.application.history)

  // Initialize keyboard shortcuts
  useKeyboardShortcuts()

  return (
    <div className={styles['mainLayout']}>
      <div className={styles['header']}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 className={styles['title']}>Aura</h1>
          <span className={styles['currentProject']}>
            {currentProject ? currentProject.name : 'Untitled'}
          </span>
        </div>
        <div className={styles['headerActions']}>
          <div className={styles['historyControls']}>
            <button
              className={styles['historyButton']}
              onClick={() => undo()}
              disabled={!history.canUndo}
              title="Undo (Ctrl+Z)"
            >
              ↶
            </button>
            <button
              className={styles['historyButton']}
              onClick={() => redo()}
              disabled={!history.canRedo}
              title="Redo (Ctrl+Y)"
            >
              ↷
            </button>
          </div>
          <SaveStatusIndicator />
          <button
            className={styles['previewButton']}
            onClick={() => setShowPreview(true)}
          >
            Preview
          </button>
          <button
            className={styles['projectManagerButton']}
            onClick={() => setShowProjectManager(true)}
          >
            Projects
          </button>
        </div>
      </div>

      <div className={styles['content']}>
        <PalettePanel
          className={styles['leftPanel']}
          style={{ width: `${layout.leftPanelWidth}%` }}
        />

        <CanvasPanel
          className={styles['centerPanel']}
          style={{ width: `${layout.centerPanelWidth}%` }}
        />

        <PropertiesPanel
          className={styles['rightPanel']}
          style={{ width: `${layout.rightPanelWidth}%` }}
        />
      </div>

      <StoreDebug />

      <ProjectManager
        isOpen={showProjectManager}
        onClose={() => setShowProjectManager(false)}
      />

      <PreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
      />
    </div>
  )
}
