import { ReactNode } from 'react'

// Core application types
export interface AppState {
  isLoading: boolean
  error: string | null
}

// Layout types
export interface PanelProps {
  className?: string
  children: ReactNode
}

export interface LayoutConfig {
  leftPanelWidth: number
  rightPanelWidth: number
  centerPanelWidth: number
}

// Component types
export interface BaseComponent {
  id: string
  type: string
  props: Record<string, unknown>
}

// Store types
export interface StoreState extends AppState {
  layout: LayoutConfig
  components: BaseComponent[]
}

export interface StoreActions {
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  updateLayout: (layout: Partial<LayoutConfig>) => void
  addComponent: (component: BaseComponent) => void
  removeComponent: (id: string) => void
} 