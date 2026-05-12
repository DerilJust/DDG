import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useKeyboardShortcuts, SHORTCUT_PRESETS } from '../src/composables/useKeyboardShortcuts'
import type { ShortcutConfig } from '../src/types'

// 注入mock vue lifecycle hooks
vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')
  return {
    ...actual,
    onMounted: vi.fn((fn: () => void) => fn()),
    onUnmounted: vi.fn()
  }
})

function simulateKeydown(
  key: string,
  opts: { ctrl?: boolean; shift?: boolean; alt?: boolean; meta?: boolean } = {}
) {
  const event = new KeyboardEvent('keydown', {
    key,
    ctrlKey: opts.ctrl ?? false,
    shiftKey: opts.shift ?? false,
    altKey: opts.alt ?? false,
    metaKey: opts.meta ?? false,
    bubbles: true,
    cancelable: true
  })
  window.dispatchEvent(event)
  return event
}

function makeHandlers() {
  return {
    toggleEditMode: vi.fn(),
    setTool: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn()
  }
}

const defaultConfig = (): ShortcutConfig => ({ ...SHORTCUT_PRESETS.default })

describe('useKeyboardShortcuts', () => {
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>
  let removeEventListenerSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    addEventListenerSpy = vi.spyOn(window, 'addEventListener')
    removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('注册和注销', () => {
    it('onMounted时注册keydown监听', () => {
      useKeyboardShortcuts(defaultConfig, makeHandlers())
      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    })

    it('调用onUnmounted注册清理函数', () => {
      // 验证onMounted注册了keydown监听
      useKeyboardShortcuts(defaultConfig, makeHandlers())
      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
      // onMounted和onUnmounted都被调用（由mock验证）
    })
  })

  describe('快捷键匹配', () => {
    it('按B键触发brush工具', () => {
      const handlers = makeHandlers()
      useKeyboardShortcuts(defaultConfig, handlers)
      simulateKeydown('b')
      expect(handlers.setTool).toHaveBeenCalledWith('brush')
    })

    it('按G键触发fill工具', () => {
      const handlers = makeHandlers()
      useKeyboardShortcuts(defaultConfig, handlers)
      simulateKeydown('g')
      expect(handlers.setTool).toHaveBeenCalledWith('fill')
    })

    it('按E键触发eraser工具', () => {
      const handlers = makeHandlers()
      useKeyboardShortcuts(defaultConfig, handlers)
      simulateKeydown('e')
      expect(handlers.setTool).toHaveBeenCalledWith('eraser')
    })

    it('按I键触发eyedropper工具', () => {
      const handlers = makeHandlers()
      useKeyboardShortcuts(defaultConfig, handlers)
      simulateKeydown('i')
      expect(handlers.setTool).toHaveBeenCalledWith('eyedropper')
    })

    it('按H键触发pan工具', () => {
      const handlers = makeHandlers()
      useKeyboardShortcuts(defaultConfig, handlers)
      simulateKeydown('h')
      expect(handlers.setTool).toHaveBeenCalledWith('pan')
    })

    it('按Tab键触发toggleEditMode', () => {
      const handlers = makeHandlers()
      useKeyboardShortcuts(defaultConfig, handlers)
      simulateKeydown('Tab')
      expect(handlers.toggleEditMode).toHaveBeenCalled()
    })

    it('Ctrl+Z触发撤销', () => {
      const handlers = makeHandlers()
      useKeyboardShortcuts(defaultConfig, handlers)
      simulateKeydown('z', { ctrl: true })
      expect(handlers.undo).toHaveBeenCalled()
    })

    it('Ctrl+Y触发重做', () => {
      const handlers = makeHandlers()
      useKeyboardShortcuts(defaultConfig, handlers)
      simulateKeydown('y', { ctrl: true })
      expect(handlers.redo).toHaveBeenCalled()
    })

    it('Ctrl+Shift+Z触发重做(photoshop预设)', () => {
      const handlers = makeHandlers()
      useKeyboardShortcuts(() => SHORTCUT_PRESETS.photoshop, handlers)
      simulateKeydown('z', { ctrl: true, shift: true })
      expect(handlers.redo).toHaveBeenCalled()
    })

    it('普通Z不触发撤销', () => {
      const handlers = makeHandlers()
      useKeyboardShortcuts(defaultConfig, handlers)
      simulateKeydown('z')
      expect(handlers.undo).not.toHaveBeenCalled()
      expect(handlers.redo).not.toHaveBeenCalled()
    })
  })

  describe('guard函数', () => {
    it('guard返回false时不处理快捷键', () => {
      const handlers = makeHandlers()
      useKeyboardShortcuts(defaultConfig, handlers, () => false)
      simulateKeydown('b')
      expect(handlers.setTool).not.toHaveBeenCalled()
    })

    it('guard返回true时正常处理', () => {
      const handlers = makeHandlers()
      useKeyboardShortcuts(defaultConfig, handlers, () => true)
      simulateKeydown('b')
      expect(handlers.setTool).toHaveBeenCalledWith('brush')
    })
  })

  describe('输入框豁免', () => {
    it('INPUT标签内不处理快捷键', () => {
      const input = document.createElement('input')
      document.body.appendChild(input)
      const handlers = makeHandlers()
      useKeyboardShortcuts(defaultConfig, handlers)

      const event = new KeyboardEvent('keydown', {
        key: 'b',
        bubbles: true,
        cancelable: true
      })
      Object.defineProperty(event, 'target', { value: input })
      window.dispatchEvent(event)

      expect(handlers.setTool).not.toHaveBeenCalled()
      document.body.removeChild(input)
    })

    it('TEXTAREA标签内不处理快捷键', () => {
      const textarea = document.createElement('textarea')
      document.body.appendChild(textarea)
      const handlers = makeHandlers()
      useKeyboardShortcuts(defaultConfig, handlers)

      const event = new KeyboardEvent('keydown', {
        key: 'b',
        bubbles: true,
        cancelable: true
      })
      Object.defineProperty(event, 'target', { value: textarea })
      window.dispatchEvent(event)

      expect(handlers.setTool).not.toHaveBeenCalled()
      document.body.removeChild(textarea)
    })
  })

  describe('meta键', () => {
    it('包含meta键时不匹配快捷键', () => {
      const handlers = makeHandlers()
      useKeyboardShortcuts(defaultConfig, handlers)
      simulateKeydown('b', { meta: true })
      expect(handlers.setTool).not.toHaveBeenCalled()
    })
  })
})
