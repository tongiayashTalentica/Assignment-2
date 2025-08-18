import { useAppStore } from '@/store'
import { DragState, ComponentType } from '@/types'

describe('Store branch coverage', () => {
  beforeEach(() => {
    const store = useAppStore.getState()
    // reset zoom, panel visibility, history, drag
    store.setZoom(1)
    store.clearHistory()
    store.endDrag()
    store.updatePreferences({})
  })

  test('setZoom clamps to [0.1, 5]', () => {
    const store = useAppStore.getState()
    store.setZoom(0)
    expect(useAppStore.getState().application.canvas.zoom).toBe(0.1)
    store.setZoom(10)
    expect(useAppStore.getState().application.canvas.zoom).toBe(5)
  })

  test('togglePanelVisibility toggles values', () => {
    const store = useAppStore.getState()
    // initial palette is true per initial state
    store.togglePanelVisibility('palette')
    expect(useAppStore.getState().application.ui.panelVisibility.palette).toBe(
      false
    )
    store.togglePanelVisibility('palette')
    expect(useAppStore.getState().application.ui.panelVisibility.palette).toBe(
      true
    )
  })

  test('setAutoSaveInterval clamps to minimum 5000ms', () => {
    const store = useAppStore.getState()
    store.setAutoSaveInterval(1000)
    expect(
      useAppStore.getState().application.persistence.autoSaveInterval
    ).toBe(5000)
  })

  test('undo/redo no-ops when empty', () => {
    const store = useAppStore.getState()
    // nothing to undo/redo
    expect(() => store.undo()).not.toThrow()
    expect(() => store.redo()).not.toThrow()
  })

  test('startDrag and endDrag set proper flags', () => {
    const store = useAppStore.getState()
    store.startDrag({
      state: DragState.DRAGGING_FROM_PALETTE,
      draggedComponent: ComponentType.TEXT,
      startPosition: { x: 0, y: 0 },
      currentPosition: { x: 0, y: 0 },
      dragOffset: { x: 0, y: 0 },
      isDragValid: true,
    })
    expect(useAppStore.getState().application.ui.dragContext.state).not.toBe(
      'idle'
    )
    store.endDrag()
    const ctx = useAppStore.getState().application.ui.dragContext
    expect(ctx.state).toBe('idle')
  })

  test('exportProject returns for json/html/react', async () => {
    const store = useAppStore.getState()
    const json = await store.exportProject('json')
    expect(typeof json).toBe('string')
    const html = await store.exportProject('html')
    expect(html).toContain('HTML export not implemented yet')
    const react = await store.exportProject('react')
    expect(react).toContain('React export not implemented yet')
  })

  test('multi-select and deselect focus branch', () => {
    const store = useAppStore.getState()
    // Prepare two fake ids by manual selection
    store.selectComponent('a', true)
    store.selectComponent('b', true)
    expect(
      useAppStore.getState().application.canvas.selectedComponentIds
    ).toEqual(['a', 'b'])

    // focus is last selected
    expect(useAppStore.getState().application.canvas.focusedComponentId).toBe(
      'b'
    )

    // deselect focused should shift focus to first selected
    store.deselectComponent('b')
    expect(useAppStore.getState().application.canvas.focusedComponentId).toBe(
      'a'
    )
  })
})
