import { useAppStore } from '@/store'
// ComponentFactory and ComponentType imports removed - not used

describe('Store negative branches with invalid ids', () => {
  beforeEach(() => {
    const state = useAppStore.getState()
    const ids = Array.from(state.application.canvas.components.keys())
    ids.forEach(id => state.removeComponent(id, false))
    state.clearSelection()
  })

  test('removeComponent no-ops on unknown id', () => {
    const store = useAppStore.getState()
    const initialSize = store.application.canvas.components.size
    store.removeComponent('does-not-exist', true)
    expect(store.application.canvas.components.size).toBe(initialSize)
  })

  test('updateComponent no-ops on unknown id', () => {
    const store = useAppStore.getState()
    const initialHistory = store.application.history.past.length
    store.updateComponent('missing', { zIndex: 99 }, true)
    expect(store.application.history.past.length).toBe(initialHistory)
  })

  test('move/resize/reorder no-op on unknown id', () => {
    const store = useAppStore.getState()
    store.moveComponent('missing', { x: 10, y: 10 }, true)
    store.resizeComponent('missing', { width: 10, height: 10 }, true)
    store.reorderComponent('missing', 10, true)
    // Ensure still empty and no crashes
    expect(store.application.canvas.components.size).toBe(0)
  })

  test('deselect/focus/selection with unknown id does not throw', () => {
    const store = useAppStore.getState()
    expect(() => store.deselectComponent('unknown')).not.toThrow()
    expect(() => store.focusComponent('unknown')).not.toThrow()
    expect(() => store.selectComponent('unknown', true)).not.toThrow()
  })
})
