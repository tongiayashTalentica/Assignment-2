/**
 * Main persistence service interface
 * Orchestrates all persistence operations
 */

import { Project, UserSettings, StorageMetadata } from '@/types'

export interface IPersistenceService {
  // Project Operations
  saveProject(projectId: string, project: Project): Promise<boolean>
  loadProject(projectId: string): Promise<Project | null>
  deleteProject(projectId: string): Promise<boolean>
  listProjects(): Promise<Project[]>

  // Auto-Save Operations
  enableAutoSave(): void
  disableAutoSave(): void
  isAutoSaveEnabled(): boolean
  getLastSaveTime(): Date | null

  // Settings & Metadata
  saveSettings(settings: UserSettings): Promise<boolean>
  loadSettings(): Promise<UserSettings | null>
  getStorageInfo(): Promise<StorageMetadata>

  // Backup & Export
  exportProject(projectId: string, format: 'json' | 'html'): Promise<string>
  importProject(data: string, format: 'json'): Promise<Project>

  // Recovery & Validation
  validateData(): Promise<boolean>
  recoverFromCrash(): Promise<Project | null>
  cleanup(): Promise<void>
}
