/**
 * Storage services exports
 */

export { StorageManager } from './StorageManager'
export { SerializationService } from './SerializationService'
export { PersistenceService } from './PersistenceService'

// Export interfaces
export type {
  IStorageManager,
  ISerializationService,
  IPersistenceService,
  IProjectManager,
} from '@/services/interfaces'

// Export a default instance for convenience
export const defaultPersistenceService = new PersistenceService()
