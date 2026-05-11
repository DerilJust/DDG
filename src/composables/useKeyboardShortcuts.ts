import { onMounted, onUnmounted } from 'vue'
import type { ShortcutConfig, ShortcutPresetName } from '../types'

export const SHORTCUT_PRESETS: Record<ShortcutPresetName, ShortcutConfig> = {
  default: {
    toggleEditMode: 'Tab',
    toolBrush: 'B',
    toolFill: 'G',
    toolEraser: 'E',
    toolEyedropper: 'I',
    toolPan: 'H',
    undo: 'Ctrl+Z',
    redo: 'Ctrl+Y'
  },
  photoshop: {
    toggleEditMode: 'Tab',
    toolBrush: 'V',
    toolFill: 'G',
    toolEraser: 'E',
    toolEyedropper: 'I',
    toolPan: ' ',
    undo: 'Ctrl+Z',
    redo: 'Ctrl+Shift+Z'
  },
  custom: {
    toggleEditMode: 'Tab',
    toolBrush: 'B',
    toolFill: 'G',
    toolEraser: 'E',
    toolEyedropper: 'I',
    toolPan: 'H',
    undo: 'Ctrl+Z',
    redo: 'Ctrl+Y'
  }
}

function parseKeyCombination(key: string): {
  key: string
  ctrl: boolean
  shift: boolean
  alt: boolean
} {
  const parts = key.split('+')
  return {
    ctrl: parts.includes('Ctrl'),
    shift: parts.includes('Shift'),
    alt: parts.includes('Alt'),
    key: parts[parts.length - 1]
  }
}

function matchesShortcut(e: KeyboardEvent, shortcut: string): boolean {
  const parsed = parseKeyCombination(shortcut)
  if (e.key !== parsed.key) return false
  if (e.ctrlKey !== parsed.ctrl) return false
  if (e.shiftKey !== parsed.shift) return false
  if (e.altKey !== parsed.alt) return false
  // Don't match if meta key is involved
  if (e.metaKey) return false
  return true
}

export function useKeyboardShortcuts(
  config: () => ShortcutConfig,
  handlers: {
    toggleEditMode: () => void
    setTool: (tool: string) => void
    undo: () => void
    redo: () => void
  },
  guard: () => boolean = () => true
) {
  const onKeyDown = (e: KeyboardEvent) => {
    if (!guard()) return

    // Skip if user is typing in an input/textarea
    const tag = (e.target as HTMLElement)?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

    const cfg = config()

    if (matchesShortcut(e, cfg.toggleEditMode)) {
      e.preventDefault()
      handlers.toggleEditMode()
      return
    }

    if (matchesShortcut(e, cfg.undo)) {
      e.preventDefault()
      handlers.undo()
      return
    }

    if (matchesShortcut(e, cfg.redo)) {
      e.preventDefault()
      handlers.redo()
      return
    }

    if (matchesShortcut(e, cfg.toolBrush)) {
      e.preventDefault()
      handlers.setTool('brush')
      return
    }
    if (matchesShortcut(e, cfg.toolFill)) {
      e.preventDefault()
      handlers.setTool('fill')
      return
    }
    if (matchesShortcut(e, cfg.toolEraser)) {
      e.preventDefault()
      handlers.setTool('eraser')
      return
    }
    if (matchesShortcut(e, cfg.toolEyedropper)) {
      e.preventDefault()
      handlers.setTool('eyedropper')
      return
    }
    if (matchesShortcut(e, cfg.toolPan)) {
      e.preventDefault()
      handlers.setTool('pan')
      return
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', onKeyDown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', onKeyDown)
  })
}
