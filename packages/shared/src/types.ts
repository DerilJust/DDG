import type { PerlerColor, PatternCell, ColorStat } from './patternUtils'

export interface ImageFileData {
  uri: string
  name?: string
  size?: number
}

export interface ImageSize {
  width: number
  height: number
}

export type EditingTool = 'brush' | 'fill' | 'pan' | 'eraser' | 'eyedropper'

export type ShortcutPresetName = 'default' | 'photoshop' | 'custom'

export interface ShortcutConfig {
  toggleEditMode: string
  toolBrush: string
  toolFill: string
  toolEraser: string
  toolEyedropper: string
  toolPan: string
  undo: string
  redo: string
}

export interface AppStoreState {
  originalImage: ImageFileData | null
  originalImageUrl: string
  originalImageSize: ImageSize
  gridWidth: number
  gridHeight: number
  colorCount: number
  selectedBrand: string
  showNumbers: boolean
  lockAspectRatio: boolean
  padToMultipleOf5: boolean
  exportScale: number
  infoText: string
  perlerColors: PerlerColor[]
  patternGrid: PatternCell[][]
  colorStats: ColorStat[]
  selectedEditColor: PerlerColor | null
  selectedTool: EditingTool
  editMode: boolean
  undoStack: PatternCell[][][]
  redoStack: PatternCell[][][]
  shortcutPreset: ShortcutPresetName
  customShortcutConfig: ShortcutConfig | null
}
