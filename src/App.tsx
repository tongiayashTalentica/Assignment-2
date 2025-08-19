import React, { useEffect } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { usePersistenceActions } from '@/store'
import '@/styles/globals.css'

function App() {
  const { loadProject } = usePersistenceActions()

  // Load saved project on app startup
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Initializing app and loading saved project...')
        await loadProject('default') // Load the default project
      } catch (error) {
        console.error('Failed to initialize app:', error)
      }
    }

    initializeApp()
  }, [loadProject])

  return <MainLayout />
}

export default App
