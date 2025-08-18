import { useAppStore } from '@/store'
import { ComponentFactory } from '@/utils/componentFactory'
import { ComponentType } from '@/types'

describe('Store: move/resize boundaries', () => {
  beforeEach(() => {
    const state = useAppStore.getState()
    const ids = Array.from(state.application.canvas.components.keys())
    ids.forEach(id => state.removeComponent(id, false))
    state.clearSelection()
    state.setBoundaries({ minX: 0, minY: 0, maxX: 300, maxY: 200 })
  })

  test('move clamps to boundaries', () => {
    const { addComponent, moveComponent } = useAppStore.getState()
    const c = ComponentFactory.create(ComponentType.TEXT, { x: 0, y: 0 })
    addComponent(c, false)

    moveComponent(c.id, { x: 1000, y: 1000 }, false)
    const updated = useAppStore
      .getState()
      .application.canvas.components.get(c.id)!
    expect(updated.position.x + updated.dimensions.width).toBeLessThanOrEqual(
      300
    )
    expect(updated.position.y + updated.dimensions.height).toBeLessThanOrEqual(
      200
    )
  })

  test('resize clamps to min/max if provided', () => {
    const { addComponent, resizeComponent } = useAppStore.getState()
    const c = ComponentFactory.create(ComponentType.TEXT, { x: 0, y: 0 })
    addComponent(c, false)

    resizeComponent(
      c.id,
      { width: -10, height: -10, minWidth: 10, minHeight: 10 },
      false
    )
    const updated = useAppStore
      .getState()
      .application.canvas.components.get(c.id)!
    expect(updated.dimensions.width).toBeGreaterThanOrEqual(10)
    expect(updated.dimensions.height).toBeGreaterThanOrEqual(10)
  })
})
