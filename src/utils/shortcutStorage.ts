import type { ShortcutConfig } from '../types'

const STORAGE_KEY = 'ddg-shortcut-config'

export function loadCustomShortcuts(): ShortcutConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as ShortcutConfig
  } catch {
    return null
  }
}

export function saveCustomShortcuts(config: ShortcutConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}
