import React, { useState, useEffect } from 'react'
import { usePersistence, usePersistenceActions } from '@/store'
import styles from './ProjectManager.module.css'

interface ProjectManagerProps {
  isOpen: boolean
  onClose: () => void
}

interface ProjectFormData {
  name: string
  description: string
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({
  isOpen,
  onClose,
}) => {
  const persistence = usePersistence()
  const { createProject, loadProject, deleteProject, saveProject } =
    usePersistenceActions()

  const [showNewProjectForm, setShowNewProjectForm] = useState(false)
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
  })
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Close modal on escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        handleClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleClose = () => {
    setShowNewProjectForm(false)
    setFormData({ name: '', description: '' })
    setError(null)
    onClose()
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      setError('Project name is required')
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      await createProject(formData.name.trim(), formData.description.trim())
      setShowNewProjectForm(false)
      setFormData({ name: '', description: '' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project')
    } finally {
      setIsCreating(false)
    }
  }

  const handleLoadProject = async (projectId: string) => {
    try {
      await loadProject(projectId)
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project')
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this project? This action cannot be undone.'
      )
    ) {
      return
    }

    try {
      await deleteProject(projectId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project')
    }
  }

  const handleSaveCurrentProject = async () => {
    try {
      await saveProject()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save project')
    }
  }

  if (!isOpen) return null

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-manager-title"
    >
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <h2 id="project-manager-title" className={styles.title}>
            Project Manager
          </h2>
          <button
            className={styles.closeButton}
            onClick={handleClose}
            aria-label="Close project manager"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {error && (
            <div className={styles.error} role="alert">
              <span className={styles.errorIcon}>⚠️</span>
              {error}
              <button
                className={styles.errorClose}
                onClick={() => setError(null)}
                aria-label="Dismiss error"
              >
                ×
              </button>
            </div>
          )}

          {/* Current Project */}
          {persistence.currentProject && (
            <div className={styles.currentProject}>
              <h3 className={styles.sectionTitle}>Current Project</h3>
              <div className={styles.projectCard}>
                <div className={styles.projectInfo}>
                  <h4 className={styles.projectName}>
                    {persistence.currentProject.name}
                  </h4>
                  {persistence.currentProject.description && (
                    <p className={styles.projectDescription}>
                      {persistence.currentProject.description}
                    </p>
                  )}
                  <div className={styles.projectMeta}>
                    <span className={styles.projectDate}>
                      Created:{' '}
                      {new Date(
                        persistence.currentProject.createdAt
                      ).toLocaleDateString()}
                    </span>
                    {persistence.isDirty && (
                      <span className={styles.unsavedIndicator}>
                        Unsaved changes
                      </span>
                    )}
                  </div>
                </div>
                <div className={styles.projectActions}>
                  {persistence.isDirty && (
                    <button
                      className={styles.saveButton}
                      onClick={handleSaveCurrentProject}
                      disabled={persistence.savingInProgress}
                    >
                      Save
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* New Project */}
          <div className={styles.newProject}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Create New Project</h3>
              {!showNewProjectForm && (
                <button
                  className={styles.newProjectButton}
                  onClick={() => setShowNewProjectForm(true)}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  New Project
                </button>
              )}
            </div>

            {showNewProjectForm && (
              <form
                className={styles.newProjectForm}
                onSubmit={handleCreateProject}
              >
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="project-name">
                    Project Name *
                  </label>
                  <input
                    id="project-name"
                    type="text"
                    className={styles.formInput}
                    value={formData.name}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="My Awesome Design"
                    maxLength={100}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label
                    className={styles.formLabel}
                    htmlFor="project-description"
                  >
                    Description
                  </label>
                  <textarea
                    id="project-description"
                    className={styles.formTextarea}
                    value={formData.description}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Optional project description..."
                    maxLength={500}
                    rows={3}
                  />
                </div>
                <div className={styles.formActions}>
                  <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={() => {
                      setShowNewProjectForm(false)
                      setFormData({ name: '', description: '' })
                      setError(null)
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={styles.createButton}
                    disabled={isCreating || !formData.name.trim()}
                  >
                    {isCreating ? 'Creating...' : 'Create Project'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Recent Projects */}
          <div className={styles.recentProjects}>
            <h3 className={styles.sectionTitle}>Recent Projects</h3>
            {persistence.projectList.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📁</div>
                <p className={styles.emptyText}>
                  No projects found. Create your first project to get started!
                </p>
              </div>
            ) : (
              <div className={styles.projectsList}>
                {persistence.projectList.map(project => (
                  <div key={project.id} className={styles.projectCard}>
                    <div className={styles.projectInfo}>
                      <h4 className={styles.projectName}>{project.name}</h4>
                      {project.description && (
                        <p className={styles.projectDescription}>
                          {project.description}
                        </p>
                      )}
                      <div className={styles.projectMeta}>
                        <span className={styles.projectDate}>
                          Modified:{' '}
                          {new Date(project.updatedAt).toLocaleDateString()}
                        </span>
                        <span className={styles.projectSize}>
                          {project.componentCount} components
                        </span>
                      </div>
                    </div>
                    <div className={styles.projectActions}>
                      <button
                        className={styles.loadButton}
                        onClick={() => handleLoadProject(project.id)}
                        title={`Load ${project.name}`}
                      >
                        Load
                      </button>
                      <button
                        className={styles.deleteButton}
                        onClick={() => handleDeleteProject(project.id)}
                        title={`Delete ${project.name}`}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.footerInfo}>
            Projects are saved to your browser's local storage
          </div>
          <div className={styles.footerActions}>
            <button className={styles.footerButton} onClick={handleClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
