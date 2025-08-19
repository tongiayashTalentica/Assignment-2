/**
 * Project manager interface
 * Handles project CRUD operations, metadata, and thumbnails
 */

import { Project, ProjectMetadata } from '@/types'

export interface IProjectManager {
  // Project CRUD
  createProject(name: string, description?: string): Promise<Project>
  getProject(projectId: string): Promise<Project | null>
  updateProject(projectId: string, updates: Partial<Project>): Promise<boolean>
  deleteProject(projectId: string): Promise<boolean>
  duplicateProject(projectId: string, newName?: string): Promise<Project>

  // Project Listing & Search
  getAllProjects(): Promise<Project[]>
  getRecentProjects(limit?: number): Promise<Project[]>
  searchProjects(query: string): Promise<Project[]>
  getProjectsByTag(tag: string): Promise<Project[]>

  // Metadata Management
  getProjectMetadata(projectId: string): Promise<ProjectMetadata | null>
  updateProjectMetadata(
    projectId: string,
    metadata: Partial<ProjectMetadata>
  ): Promise<boolean>

  // Thumbnail Management
  generateThumbnail(project: Project): Promise<string>
  updateThumbnail(projectId: string, thumbnail: string): Promise<boolean>
  getThumbnail(projectId: string): Promise<string | null>

  // Project Organization
  addProjectTag(projectId: string, tag: string): Promise<boolean>
  removeProjectTag(projectId: string, tag: string): Promise<boolean>
  getProjectTags(projectId: string): Promise<string[]>

  // Validation & Cleanup
  validateProject(project: Project): boolean
  cleanupOrphanedProjects(): Promise<number>
  repairProject(projectId: string): Promise<boolean>
}
