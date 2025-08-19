import React, { useEffect, useState } from 'react'
import { usePersistence, usePersistenceActions } from '@/store'
import styles from './SaveStatusIndicator.module.css'

export const SaveStatusIndicator: React.FC = () => {
  const persistence = usePersistence()
  const { saveProject } = usePersistenceActions()
  const [lastSaveText, setLastSaveText] = useState<string>('')

  // Auto-save functionality
  useEffect(() => {
    if (!persistence.autoSaveEnabled || !persistence.isDirty) return

    const autoSaveTimer = setInterval(async () => {
      if (persistence.isDirty && !persistence.savingInProgress) {
        try {
          await saveProject()
        } catch (error) {
          console.error('Auto-save failed:', error)
        }
      }
    }, persistence.autoSaveInterval)

    return () => clearInterval(autoSaveTimer)
  }, [
    persistence.autoSaveEnabled,
    persistence.isDirty,
    persistence.autoSaveInterval,
    persistence.savingInProgress,
    saveProject,
  ])

  // Update last save text
  useEffect(() => {
    if (persistence.lastSaved) {
      const now = new Date()
      const timeDiff = now.getTime() - persistence.lastSaved.getTime()

      if (timeDiff < 60000) {
        // Less than 1 minute
        setLastSaveText('Just saved')
      } else if (timeDiff < 3600000) {
        // Less than 1 hour
        const minutes = Math.floor(timeDiff / 60000)
        setLastSaveText(`Saved ${minutes}m ago`)
      } else if (timeDiff < 86400000) {
        // Less than 1 day
        const hours = Math.floor(timeDiff / 3600000)
        setLastSaveText(`Saved ${hours}h ago`)
      } else {
        const days = Math.floor(timeDiff / 86400000)
        setLastSaveText(`Saved ${days}d ago`)
      }
    } else {
      setLastSaveText('Not saved')
    }
  }, [persistence.lastSaved])

  // Update last save text periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (persistence.lastSaved) {
        const now = new Date()
        const timeDiff = now.getTime() - persistence.lastSaved.getTime()

        if (timeDiff < 60000) {
          setLastSaveText('Just saved')
        } else if (timeDiff < 3600000) {
          const minutes = Math.floor(timeDiff / 60000)
          setLastSaveText(`Saved ${minutes}m ago`)
        } else if (timeDiff < 86400000) {
          const hours = Math.floor(timeDiff / 3600000)
          setLastSaveText(`Saved ${hours}h ago`)
        } else {
          const days = Math.floor(timeDiff / 86400000)
          setLastSaveText(`Saved ${days}d ago`)
        }
      }
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [persistence.lastSaved])

  const handleManualSave = async () => {
    if (persistence.savingInProgress) return

    try {
      await saveProject()
    } catch (error) {
      console.error('Manual save failed:', error)
    }
  }

  const getSaveStatus = () => {
    if (persistence.savingInProgress) {
      return { text: 'Saving...', icon: '⏳', className: styles.saving }
    }

    if (!persistence.isDirty) {
      return { text: lastSaveText, icon: '✓', className: styles.saved }
    }

    return { text: 'Unsaved changes', icon: '●', className: styles.unsaved }
  }

  const status = getSaveStatus()

  return (
    <div className={styles.saveStatus}>
      <button
        className={`${styles.statusButton} ${status.className}`}
        onClick={handleManualSave}
        disabled={persistence.savingInProgress || !persistence.isDirty}
        title={
          persistence.isDirty ? 'Click to save manually' : 'All changes saved'
        }
        aria-label={`Save status: ${status.text}`}
      >
        <span className={styles.statusIcon} aria-hidden="true">
          {status.icon}
        </span>
        <span className={styles.statusText}>{status.text}</span>
      </button>

      {persistence.autoSaveEnabled && (
        <div className={styles.autoSaveIndicator} title="Auto-save is enabled">
          <span className={styles.autoSaveIcon} aria-hidden="true">
            🔄
          </span>
          <span className={styles.autoSaveText}>
            Auto-save: {persistence.autoSaveInterval / 1000}s
          </span>
        </div>
      )}
    </div>
  )
}
