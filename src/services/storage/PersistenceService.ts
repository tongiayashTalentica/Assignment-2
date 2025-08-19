/**
 * Main Persistence Service - Orchestrates all persistence operations
 * This is the main entry point for all persistence-related functionality
 */

import {
  IPersistenceService,
  IStorageManager,
  ISerializationService,
} from '@/services/interfaces'
import { Project, UserSettings, StorageMetadata } from '@/types'
import { StorageManager } from './StorageManager'
import { SerializationService } from './SerializationService'

export class PersistenceService implements IPersistenceService {
  private storage: IStorageManager
  private serialization: ISerializationService
  private autoSaveTimer: NodeJS.Timeout | null = null
  private autoSaveEnabled = false
  private lastSaveTime: Date | null = null

  constructor() {
    this.storage = new StorageManager()
    this.serialization = new SerializationService()
  }

  /**
   * Project Operations
   */
  async saveProject(projectId: string, project: Project): Promise<boolean> {
    try {
      const serializedProject =
        await this.serialization.serializeProject(project)
      const success = await this.storage.setItem(
        `projects:${projectId}`,
        serializedProject
      )

      if (success) {
        this.lastSaveTime = new Date()
        await this.updateProjectMetadata(project)
      }

      return success
    } catch (error) {
      console.error('Failed to save project:', projectId, error)
      return false
    }
  }

  async loadProject(projectId: string): Promise<Project | null> {
    try {
      const serializedProject = await this.storage.getItem(
        `projects:${projectId}`
      )
      if (!serializedProject) return null

      return await this.serialization.deserializeProject(serializedProject)
    } catch (error) {
      console.error('Failed to load project:', projectId, error)
      return null
    }
  }

  async deleteProject(projectId: string): Promise<boolean> {
    try {
      const results = await Promise.all([
        this.storage.removeItem(`projects:${projectId}`),
        this.storage.removeItem(`metadata:${projectId}`),
        this.storage.removeItem(`thumbnails:${projectId}`),
      ])

      return results.every(result => result)
    } catch (error) {
      console.error('Failed to delete project:', projectId, error)
      return false
    }
  }

  async listProjects(): Promise<Project[]> {
    try {
      const projectKeys = await this.storage.getKeysByPrefix('projects:')
      const projects: Project[] = []

      for (const key of projectKeys) {
        const projectId = key.replace('aura-editor:projects:', '')
        const project = await this.loadProject(projectId)
        if (project) {
          projects.push(project)
        }
      }

      // Sort by updatedAt descending (handle both Date objects and date strings)
      return projects.sort((a, b) => {
        const aDate =
          a.updatedAt instanceof Date ? a.updatedAt : new Date(a.updatedAt)
        const bDate =
          b.updatedAt instanceof Date ? b.updatedAt : new Date(b.updatedAt)
        return bDate.getTime() - aDate.getTime()
      })
    } catch (error) {
      console.error('Failed to list projects:', error)
      return []
    }
  }

  async createProject(
    name: string,
    description: string,
    canvas: CanvasState,
    template?: string
  ): Promise<Project> {
    try {
      const projectId = `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // Convert CanvasState to CanvasSnapshot
      const canvasSnapshot: CanvasSnapshot = {
        id: `canvas-${Date.now()}`,
        timestamp: Date.now(),
        components: canvas.components,
        selectedComponentIds: canvas.selectedComponentIds,
        focusedComponentId: canvas.focusedComponentId,
        canvasDimensions: canvas.dimensions,
        dimensions: canvas.dimensions,
        viewport: canvas.viewport,
        zoom: canvas.zoom,
        grid: canvas.grid,
        boundaries: canvas.boundaries,
      }

      const project: Project = {
        id: projectId,
        name,
        description,
        version: '1.0.0',
        createdAt: new Date(),
        updatedAt: new Date(),
        canvas: canvasSnapshot,
        ui: {},
        metadata: {
          id: projectId,
          name,
          createdAt: new Date(),
          updatedAt: new Date(),
          size: 0,
          componentCount: canvas.components.size,
          tags: template ? [template] : [],
        },
      }

      // Save the project
      const success = await this.saveProject(projectId, project)
      if (!success) {
        throw new Error('Failed to save new project')
      }

      return project
    } catch (error) {
      console.error('Failed to create project:', error)
      throw new Error('Project creation failed')
    }
  }

  async duplicateProject(
    projectId: string,
    newName?: string
  ): Promise<Project> {
    try {
      const originalProject = await this.loadProject(projectId)
      if (!originalProject) {
        throw new Error('Original project not found')
      }

      const duplicateId = `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const duplicateName = newName || `${originalProject.name} (Copy)`

      const duplicatedProject: Project = {
        ...originalProject,
        id: duplicateId,
        name: duplicateName,
        createdAt: new Date(),
        updatedAt: new Date(),
        canvas: {
          ...originalProject.canvas,
          id: `canvas-${Date.now()}`,
          timestamp: Date.now(),
        },
        metadata: {
          ...originalProject.metadata,
          id: duplicateId,
          name: duplicateName,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      }

      // Save the duplicated project
      const success = await this.saveProject(duplicateId, duplicatedProject)
      if (!success) {
        throw new Error('Failed to save duplicated project')
      }

      return duplicatedProject
    } catch (error) {
      console.error('Failed to duplicate project:', error)
      throw new Error('Project duplication failed')
    }
  }

  /**
   * Auto-Save Operations
   */
  enableAutoSave(): void {
    if (this.autoSaveEnabled) return

    this.autoSaveEnabled = true
    this.startAutoSaveTimer()
  }

  disableAutoSave(): void {
    this.autoSaveEnabled = false
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer)
      this.autoSaveTimer = null
    }
  }

  isAutoSaveEnabled(): boolean {
    return this.autoSaveEnabled
  }

  getLastSaveTime(): Date | null {
    return this.lastSaveTime
  }

  /**
   * Settings & Metadata
   */
  async saveSettings(settings: UserSettings): Promise<boolean> {
    try {
      const serializedSettings = await this.serialization.serialize(settings)
      return await this.storage.setItem('settings:user', serializedSettings)
    } catch (error) {
      console.error('Failed to save settings:', error)
      return false
    }
  }

  async loadSettings(): Promise<UserSettings | null> {
    try {
      const serializedSettings = await this.storage.getItem('settings:user')
      if (!serializedSettings) return null

      return await this.serialization.deserialize<UserSettings>(
        serializedSettings
      )
    } catch (error) {
      console.error('Failed to load settings:', error)
      return null
    }
  }

  async getStorageInfo(): Promise<StorageMetadata> {
    try {
      const storageInfo = await this.storage.getStorageInfo()
      const projects = await this.listProjects()

      return {
        version: this.serialization.getCurrentVersion(),
        storageUsage: storageInfo.used,
        availableSpace: storageInfo.available,
        totalProjects: projects.length,
        lastCleanup: new Date(), // TODO: Track actual cleanup time
        keyCount: storageInfo.keys,
      }
    } catch (error) {
      console.error('Failed to get storage info:', error)
      return {
        version: '1.0.0',
        storageUsage: 0,
        availableSpace: 5242880, // 5MB
        totalProjects: 0,
        lastCleanup: new Date(),
        keyCount: 0,
      }
    }
  }

  /**
   * Storage Capacity Management
   */
  async getDetailedStorageInfo() {
    return await this.storage.getDetailedStorageInfo()
  }

  async checkStorageWarnings() {
    return await this.storage.checkCapacityWarnings()
  }

  async performStorageCleanup(maxPercentage: number = 80) {
    return await this.storage.performAutomaticCleanup(maxPercentage)
  }

  async getOldestProjects(count: number = 5) {
    return await this.storage.getOldestProjects(count)
  }

  async getStorageOptimizationSuggestions() {
    return await this.storage.suggestOptimizations()
  }

  async enableAutomaticCleanup(threshold: number = 80) {
    // Store cleanup settings
    await this.storage.setItem(
      'settings:auto-cleanup',
      JSON.stringify({
        enabled: true,
        threshold,
        lastRun: Date.now(),
      })
    )

    // Set up periodic cleanup check (every hour)
    setInterval(
      async () => {
        const warnings = await this.checkStorageWarnings()
        if (warnings.level === 'critical' || warnings.level === 'full') {
          console.log(
            '🧹 Auto-cleanup: Storage usage critical, performing cleanup...'
          )
          const result = await this.performStorageCleanup(threshold)
          console.log(`🧹 Auto-cleanup: ${result.message}`)
        }
      },
      60 * 60 * 1000
    ) // Check every hour
  }

  async disableAutomaticCleanup() {
    await this.storage.removeItem('settings:auto-cleanup')
  }

  /**
   * Data Recovery & Crash Protection
   */

  async createBackup(projectId?: string): Promise<{
    success: boolean
    backupId?: string
    message: string
  }> {
    try {
      const backupId = `backup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      if (projectId) {
        // Backup specific project
        const project = await this.loadProject(projectId)
        if (!project) {
          return { success: false, message: 'Project not found' }
        }

        const backupData = {
          type: 'project',
          projectId,
          project,
          timestamp: Date.now(),
          version: this.serialization.getCurrentVersion(),
        }

        const serializedBackup =
          await this.serialization.serializeWithIntegrity(backupData)
        await this.storage.setItem(`backup:${backupId}`, serializedBackup)

        return {
          success: true,
          backupId,
          message: `Project backup created: ${backupId}`,
        }
      } else {
        // Full backup of all projects
        const projects = await this.listProjects()
        const allBackupData = {
          type: 'full',
          projects,
          timestamp: Date.now(),
          version: this.serialization.getCurrentVersion(),
          projectCount: projects.length,
        }

        const serializedBackup =
          await this.serialization.serializeWithIntegrity(allBackupData)
        await this.storage.setItem(`backup:${backupId}`, serializedBackup)

        return {
          success: true,
          backupId,
          message: `Full backup created: ${backupId} (${projects.length} projects)`,
        }
      }
    } catch (error) {
      console.error('Backup creation failed:', error)
      return { success: false, message: `Backup failed: ${error}` }
    }
  }

  async restoreFromBackup(backupId: string): Promise<{
    success: boolean
    restoredProjects: number
    message: string
  }> {
    try {
      const backupData = await this.storage.getItem(`backup:${backupId}`)
      if (!backupData) {
        return {
          success: false,
          restoredProjects: 0,
          message: 'Backup not found',
        }
      }

      const result =
        await this.serialization.deserializeWithIntegrity(backupData)
      if (!result.success || !result.data) {
        return {
          success: false,
          restoredProjects: 0,
          message: result.error || 'Backup data corrupted',
        }
      }

      const backup = result.data as any

      if (backup.type === 'project') {
        // Restore single project
        const project = backup.project
        const success = await this.saveProject(project.id, project)
        if (success) {
          return {
            success: true,
            restoredProjects: 1,
            message: `Project restored: ${project.name}`,
          }
        } else {
          return {
            success: false,
            restoredProjects: 0,
            message: 'Failed to restore project',
          }
        }
      } else if (backup.type === 'full') {
        // Restore all projects
        const projects = backup.projects
        let restoredCount = 0

        for (const project of projects) {
          const success = await this.saveProject(project.id, project)
          if (success) {
            restoredCount++
          }
        }

        return {
          success: restoredCount > 0,
          restoredProjects: restoredCount,
          message: `Restored ${restoredCount} of ${projects.length} projects`,
        }
      } else {
        return {
          success: false,
          restoredProjects: 0,
          message: 'Invalid backup format',
        }
      }
    } catch (error) {
      console.error('Backup restoration failed:', error)
      return {
        success: false,
        restoredProjects: 0,
        message: `Restore failed: ${error}`,
      }
    }
  }

  async listBackups(): Promise<
    Array<{
      id: string
      type: 'project' | 'full'
      timestamp: number
      age: string
      size: number
    }>
  > {
    try {
      const backupKeys = await this.storage.getKeysByPrefix('backup:')
      const backups: Array<{
        id: string
        type: 'project' | 'full'
        timestamp: number
        age: string
        size: number
      }> = []

      for (const key of backupKeys) {
        const backupId = key.replace('backup:', '')
        const backupData = await this.storage.getItem(key)

        if (backupData) {
          try {
            const result =
              await this.serialization.deserializeWithIntegrity(backupData)
            if (result.success && result.data) {
              const backup = result.data as any
              const ageInMs = Date.now() - backup.timestamp
              const ageInHours = Math.floor(ageInMs / (1000 * 60 * 60))
              const ageInDays = Math.floor(ageInHours / 24)

              let age = ''
              if (ageInDays > 0) {
                age = `${ageInDays} days ago`
              } else if (ageInHours > 0) {
                age = `${ageInHours} hours ago`
              } else {
                age = 'Less than 1 hour ago'
              }

              backups.push({
                id: backupId,
                type: backup.type || 'unknown',
                timestamp: backup.timestamp,
                age,
                size: backupData.length,
              })
            }
          } catch {
            // Skip corrupted backup
          }
        }
      }

      return backups.sort((a, b) => b.timestamp - a.timestamp)
    } catch (error) {
      console.error('Failed to list backups:', error)
      return []
    }
  }

  async deleteBackup(backupId: string): Promise<boolean> {
    try {
      return await this.storage.removeItem(`backup:${backupId}`)
    } catch (error) {
      console.error('Failed to delete backup:', error)
      return false
    }
  }

  async enableCrashRecovery(): Promise<void> {
    try {
      // Store crash recovery settings
      await this.storage.setItem(
        'settings:crash-recovery',
        JSON.stringify({
          enabled: true,
          lastHeartbeat: Date.now(),
          recoveryEnabled: true,
        })
      )

      // Set up heartbeat to detect crashes
      const heartbeatInterval = setInterval(async () => {
        try {
          await this.storage.setItem('crash:heartbeat', Date.now().toString())
        } catch (error) {
          console.error('Heartbeat failed:', error)
          clearInterval(heartbeatInterval)
        }
      }, 30000) // Update every 30 seconds

      console.log('🛡️ Crash recovery system enabled')
    } catch (error) {
      console.error('Failed to enable crash recovery:', error)
    }
  }

  async checkForCrashRecovery(): Promise<{
    crashDetected: boolean
    recoveryData?: any
    lastSave?: Date
    message: string
  }> {
    try {
      // Check if crash recovery is enabled
      const settingsData = await this.storage.getItem('settings:crash-recovery')
      if (!settingsData) {
        return { crashDetected: false, message: 'Crash recovery not enabled' }
      }

      JSON.parse(settingsData) // Parse settings but don't store (validation only)
      const lastHeartbeat = await this.storage.getItem('crash:heartbeat')

      if (!lastHeartbeat) {
        return { crashDetected: false, message: 'No previous session detected' }
      }

      const lastHeartbeatTime = parseInt(lastHeartbeat)
      const timeSinceLastHeartbeat = Date.now() - lastHeartbeatTime

      // If more than 5 minutes since last heartbeat, consider it a crash
      if (timeSinceLastHeartbeat > 5 * 60 * 1000) {
        // Look for recovery data
        const recoveryData = await this.storage.getItem(
          'recovery:current-project'
        )
        const autoSaveData = await this.storage.getItem('autosave:current')

        if (recoveryData || autoSaveData) {
          const lastSaveTime = recoveryData
            ? new Date(JSON.parse(recoveryData).timestamp)
            : new Date(JSON.parse(autoSaveData || '{}').timestamp || 0)

          return {
            crashDetected: true,
            recoveryData: recoveryData
              ? JSON.parse(recoveryData)
              : JSON.parse(autoSaveData || '{}'),
            lastSave: lastSaveTime,
            message: `Crash detected! Last save: ${lastSaveTime.toLocaleString()}`,
          }
        }

        return {
          crashDetected: true,
          message: 'Crash detected but no recovery data found',
        }
      }

      return { crashDetected: false, message: 'No crash detected' }
    } catch (error) {
      console.error('Failed to check for crash recovery:', error)
      return { crashDetected: false, message: `Crash check failed: ${error}` }
    }
  }

  async saveRecoveryData(projectData: any): Promise<void> {
    try {
      const recoveryData = {
        project: projectData,
        timestamp: Date.now(),
        version: this.serialization.getCurrentVersion(),
      }

      await this.storage.setItem(
        'recovery:current-project',
        JSON.stringify(recoveryData)
      )
    } catch (error) {
      console.error('Failed to save recovery data:', error)
    }
  }

  async clearRecoveryData(): Promise<void> {
    try {
      await this.storage.removeItem('recovery:current-project')
      await this.storage.removeItem('autosave:current')
    } catch (error) {
      console.error('Failed to clear recovery data:', error)
    }
  }

  /**
   * Backup & Export
   */
  async exportProject(
    projectId: string,
    format: 'json' | 'html'
  ): Promise<string> {
    try {
      const project = await this.loadProject(projectId)
      if (!project) {
        throw new Error('Project not found')
      }

      switch (format) {
        case 'json':
          return await this.serialization.serialize(project)

        case 'html':
          return this.generateHtmlExport(project)

        default:
          throw new Error('Unsupported export format')
      }
    } catch (error) {
      console.error('Failed to export project:', projectId, error)
      throw error
    }
  }

  async importProject(data: string, format: 'json'): Promise<Project> {
    try {
      if (format !== 'json') {
        throw new Error('Unsupported import format')
      }

      if (!this.serialization.validateProject(data)) {
        throw new Error('Invalid project data')
      }

      return await this.serialization.deserialize<Project>(data)
    } catch (error) {
      console.error('Failed to import project:', error)
      throw error
    }
  }

  /**
   * Recovery & Validation
   */
  async validateData(): Promise<boolean> {
    try {
      return await this.storage.validateStorage()
    } catch (error) {
      console.error('Data validation failed:', error)
      return false
    }
  }

  async recoverFromCrash(): Promise<Project | null> {
    try {
      // Look for auto-save data
      const autoSaveData = await this.storage.getItem('autosave:current')
      if (autoSaveData) {
        return await this.serialization.deserialize<Project>(autoSaveData)
      }

      // Look for the most recent project
      const projects = await this.listProjects()
      return projects[0] || null
    } catch (error) {
      console.error('Crash recovery failed:', error)
      return null
    }
  }

  async cleanup(): Promise<void> {
    try {
      // Remove auto-save data older than 1 day
      const autoSaveData = await this.storage.getItem('autosave:current')
      if (autoSaveData) {
        const parsed = JSON.parse(autoSaveData)
        if (
          parsed.timestamp &&
          Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000
        ) {
          await this.storage.removeItem('autosave:current')
        }
      }

      console.log('Storage cleanup completed')
    } catch (error) {
      console.error('Storage cleanup failed:', error)
    }
  }

  /**
   * Private Helper Methods
   */
  private startAutoSaveTimer(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer)
    }

    this.autoSaveTimer = setInterval(() => {
      // This will be implemented when we integrate with the store
      console.log('Auto-save timer triggered (store integration pending)')
    }, 30000) // 30 seconds
  }

  private async updateProjectMetadata(project: Project): Promise<void> {
    try {
      const metadata = {
        id: project.id,
        name: project.name,
        description: project.description,
        updatedAt: new Date(),
        componentCount: project.canvas.components.size,
        size: this.serialization.estimateSize(project),
      }

      const serializedMetadata = await this.serialization.serialize(metadata)
      await this.storage.setItem(`metadata:${project.id}`, serializedMetadata)
    } catch (error) {
      console.error('Failed to update project metadata:', error)
    }
  }

  private generateHtmlExport(project: Project): string {
    // Simple HTML export - can be enhanced later
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${project.name}</title>
    <style>
        body { margin: 0; font-family: Arial, sans-serif; }
        .canvas { position: relative; width: ${project.canvas.dimensions.width}px; height: ${project.canvas.dimensions.height}px; }
    </style>
</head>
<body>
    <div class="canvas">
        <!-- Components would be rendered here -->
        <p>Project: ${project.name}</p>
        <p>Components: ${project.canvas.components.size}</p>
    </div>
</body>
</html>
    `.trim()
  }
}
