import type { PerlerColor, PatternCell, ColorStat } from '../utils/patternUtils'

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
  originalImage: File | null
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

export interface CropperImageData {
  offsetX: number
  offsetY: number
  displayWidth: number
  displayHeight: number
  displayScaleX: number
  displayScaleY: number
  image: HTMLImageElement
}

export interface UploadedCropResult {
  file: File
  url: string
  width: number
  height: number
}

export interface SelectedImageData {
  imageData: HTMLImageElement
  imageUrl: string
}

export interface CroppedResult {
  image: HTMLImageElement
  dataUrl: string
  file: File
}

export interface ColorUsage {
  color: PerlerColor
  count: number
  code: string
}
