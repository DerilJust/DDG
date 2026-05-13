export type {
  ImageFileData,
  ImageSize,
  EditingTool,
  ShortcutPresetName,
  ShortcutConfig,
  AppStoreState
} from '@ddg/shared/types'
export type { PerlerColor, PatternCell, ColorStat } from '@ddg/shared/patternUtils'

// 以下为浏览器特有类型，保留在 Vue 端
import type { PerlerColor } from '@ddg/shared/patternUtils'

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
