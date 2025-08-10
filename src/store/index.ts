import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { StoreState, StoreActions, LayoutConfig, BaseComponent } from '@/types'

// Initial state
const initialState: Omit<StoreState, keyof StoreActions> = {
  isLoading: false,
  error: null,
  layout: {
    leftPanelWidth: 20,
    centerPanelWidth: 60,
    rightPanelWidth: 20,
  },
  components: [],
}

// Store type combining state and actions
type Store = StoreState & StoreActions

// Create the store
export const useAppStore = create<Store>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Actions
        setLoading: (loading: boolean) =>
          set({ isLoading: loading }, false, 'setLoading'),

        setError: (error: string | null) =>
          set({ error }, false, 'setError'),

        updateLayout: (layoutUpdate: Partial<LayoutConfig>) =>
          set(
            (state) => ({
              layout: { ...state.layout, ...layoutUpdate },
            }),
            false,
            'updateLayout'
          ),

        addComponent: (component: BaseComponent) =>
          set(
            (state) => ({
              components: [...state.components, component],
            }),
            false,
            'addComponent'
          ),

        removeComponent: (id: string) =>
          set(
            (state) => ({
              components: state.components.filter((comp) => comp.id !== id),
            }),
            false,
            'removeComponent'
          ),
      }),
      {
        name: 'aura-editor-store',
        partialize: (state) => ({
          layout: state.layout,
          components: state.components,
        }),
      }
    ),
    {
      name: 'aura-editor',
    }
  )
)

// Selectors for better performance
export const useLayout = () => useAppStore((state) => state.layout)
export const useComponents = () => useAppStore((state) => state.components)
export const useAppState = () => useAppStore((state) => ({ 
  isLoading: state.isLoading, 
  error: state.error 
}))

// Action selectors
export const useAppActions = () => useAppStore((state) => ({
  setLoading: state.setLoading,
  setError: state.setError,
  updateLayout: state.updateLayout,
  addComponent: state.addComponent,
  removeComponent: state.removeComponent,
})) 