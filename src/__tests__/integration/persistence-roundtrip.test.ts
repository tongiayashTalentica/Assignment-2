import { useAppStore } from '../../store/index'
import { ComponentFactory } from '@/utils/componentFactory'
import { ComponentType } from '@/types'

describe('Persistence round-trip', () => {
  beforeEach(() => {
    const state = useAppStore.getState()
    const ids = Array.from(state.application.canvas.components.keys())
    ids.forEach(id => state.removeComponent(id, false))
    state.clearHistory()
    localStorage.clear()
  })

  test('save and reload restores project metadata', async () => {
    const store = useAppStore.getState()
    await store.createProject('Test Project')

    const c = ComponentFactory.create(ComponentType.TEXT, { x: 10, y: 20 })
    store.addComponent(c, false)

    await store.saveProject()

    const id = store.application.persistence.currentProject?.id as string

    // Mutate and reload; ensure project metadata restored
    store.removeComponent(c.id, false)
    await store.loadProject(id)

    expect(
      useAppStore.getState().application.persistence.currentProject?.name
    ).toBe('Test Project')
  })
})
