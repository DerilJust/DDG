import { describe, it, expect, beforeEach } from 'vitest'
import { loadCustomShortcuts, saveCustomShortcuts } from '../src/utils/shortcutStorage'
import type { ShortcutConfig } from '../src/types'

const validConfig: ShortcutConfig = {
  toggleEditMode: 'Tab',
  toolBrush: 'B',
  toolFill: 'G',
  toolEraser: 'E',
  toolEyedropper: 'I',
  toolPan: 'H',
  undo: 'Ctrl+Z',
  redo: 'Ctrl+Y'
}

describe('shortcutStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('loadCustomShortcuts', () => {
    it('无存储数据返回null', () => {
      expect(loadCustomShortcuts()).toBeNull()
    })

    it('有有效JSON返回配置对象', () => {
      localStorage.setItem('ddg-shortcut-config', JSON.stringify(validConfig))
      const result = loadCustomShortcuts()
      expect(result).not.toBeNull()
      expect(result!.toolBrush).toBe('B')
      expect(result!.undo).toBe('Ctrl+Z')
    })

    it('无效JSON返回null', () => {
      localStorage.setItem('ddg-shortcut-config', 'not valid json')
      expect(loadCustomShortcuts()).toBeNull()
    })
  })

  describe('saveCustomShortcuts', () => {
    it('保存配置到localStorage', () => {
      saveCustomShortcuts(validConfig)
      const stored = localStorage.getItem('ddg-shortcut-config')
      expect(stored).not.toBeNull()
      const parsed = JSON.parse(stored!)
      expect(parsed.toolBrush).toBe('B')
    })

    it('覆盖已有配置', () => {
      saveCustomShortcuts(validConfig)
      const newConfig: ShortcutConfig = { ...validConfig, toolBrush: 'V' }
      saveCustomShortcuts(newConfig)
      const result = loadCustomShortcuts()
      expect(result!.toolBrush).toBe('V')
    })

    it('保存包含Space键的配置', () => {
      const config: ShortcutConfig = { ...validConfig, toolPan: ' ' }
      saveCustomShortcuts(config)
      const result = loadCustomShortcuts()
      expect(result!.toolPan).toBe(' ')
    })

    it('保存包含Ctrl+Shift组合键的配置', () => {
      const config: ShortcutConfig = { ...validConfig, redo: 'Ctrl+Shift+Z' }
      saveCustomShortcuts(config)
      const result = loadCustomShortcuts()
      expect(result!.redo).toBe('Ctrl+Shift+Z')
    })
  })
})
