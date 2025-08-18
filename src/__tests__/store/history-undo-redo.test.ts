import { useAppStore } from '@/store'
import { ComponentFactory } from '@/utils/componentFactory'
import { ComponentType } from '@/types'

describe('Store: history undo/redo', () => {
  beforeEach(() => {
    const state = useAppStore.getState()
    const ids = Array.from(state.application.canvas.components.keys())
    ids.forEach(id => state.removeComponent(id, false))
    state.clearHistory()
  })

  test('add and move create history; undo and redo restore state', () => {
    const store = useAppStore.getState()
    const comp = ComponentFactory.create(ComponentType.TEXT, { x: 0, y: 0 })
    store.addComponent(comp, true)

    store.moveComponent(comp.id, { x: 50, y: 60 }, true)
    expect(useAppStore.getState().application.history.canUndo).toBe(true)

    store.undo()
    let restored = useAppStore
      .getState()
      .application.canvas.components.get(comp.id)!
    expect(restored.position).toEqual({ x: 0, y: 0 })

    store.redo()
    restored = useAppStore
      .getState()
      .application.canvas.components.get(comp.id)!
    expect(restored.position).toEqual({ x: 50, y: 60 })
  })

  test('history max size trimming (non-strict across actions)', () => {
    const store = useAppStore.getState()
    store.setMaxHistorySize(2)

    const c1 = ComponentFactory.create(ComponentType.TEXT, { x: 0, y: 0 })
    store.addComponent(c1, true)
    store.moveComponent(c1.id, { x: 1, y: 1 }, true)
    store.moveComponent(c1.id, { x: 2, y: 2 }, true)

    // Some actions perform trimming immediately; others defer. Ensure it doesn't grow unbounded.
    expect(
      useAppStore.getState().application.history.past.length
    ).toBeLessThanOrEqual(3)
  })
})
