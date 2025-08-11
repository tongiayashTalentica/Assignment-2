// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react'
import { useLayout } from '@/store'
import { PalettePanel } from './PalettePanel'
import { CanvasPanel } from './CanvasPanel'
import { PropertiesPanel } from './PropertiesPanel'
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
    </div>
  )
} 