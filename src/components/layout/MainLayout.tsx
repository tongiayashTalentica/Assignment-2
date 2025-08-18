import React from 'react'
import { useLayout } from '@/store/simple'
import { PalettePanel } from './PalettePanel'
import { CanvasPanel } from './CanvasPanel'
import { PropertiesPanel } from './PropertiesPanel'
import { StoreDebug } from '@/components/debug/StoreDebug'
import styles from './MainLayout.module.css'

export const MainLayout = () => {
  const layout = useLayout()

  return (
    <div className={styles['mainLayout']}>
      <div className={styles['header']}>
        <h1 className={styles['title']}>Aura No-Code Editor</h1>
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
    </div>
  )
}
