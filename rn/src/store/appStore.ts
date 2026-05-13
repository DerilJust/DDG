import { create } from 'zustand'
import {
  type PerlerColor,
  type PatternCell,
  type ColorStat,
  type EditingTool,
  type ImageFileData,
  buildColorStats,
  clonePatternGrid,
  fillConnectedRegion,
  decompressPatternGrid
} from '@ddg/shared'
import colorSystemMapping from '@ddg/shared/colorMap/colorSystemMapping.json'

const MAX_HISTORY = 50

function createBlankCell(): PatternCell {
  return { color: { r: 255, g: 255, b: 255, hex: '#FFFFFF', info: {} }, code: '' }
}

function createBlankGrid(width: number, height: number): PatternCell[][] {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => createBlankCell())
  )
}

interface AppState {
  originalImage: ImageFileData | null
  originalImageUrl: string
  originalImageSize: { width: number; height: number }

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

  // Actions
  setOriginalImage: (data: ImageFileData) => void
  setOriginalImageSize: (width: number, height: number) => void
  clearImage: () => void
  setGridWidth: (w: number) => void
  setGridHeight: (h: number) => void
  setColorCount: (n: number) => void
  setSelectedBrand: (b: string) => void
  setShowNumbers: (v: boolean) => void
  setLockAspectRatio: (v: boolean) => void
  setEditMode: (v: boolean) => void
  setSelectedTool: (t: EditingTool) => void
  setSelectedEditColor: (c: PerlerColor | null) => void
  setPatternGrid: (grid: PatternCell[][]) => void
  applyToolAction: (x: number, y: number) => void
  applyAreaAction: (x1: number, y1: number, x2: number, y2: number) => void
  undo: () => void
  redo: () => void
  importFromCompressed: (s: string) => boolean
  refreshColorStats: () => void
  loadColorData: () => void
}

export const useAppStore = create<AppState>((set, get) => ({
  originalImage: null,
  originalImageUrl: '',
  originalImageSize: { width: 0, height: 0 },

  gridWidth: 30,
  gridHeight: 30,
  colorCount: 20,
  selectedBrand: 'MARD',
  showNumbers: false,
  lockAspectRatio: true,
  padToMultipleOf5: true,
  exportScale: 1,

  infoText: '请上传图片并生成图纸',
  perlerColors: [],
  patternGrid: createBlankGrid(30, 30),
  colorStats: [],

  selectedEditColor: null,
  selectedTool: 'brush',
  editMode: false,
  undoStack: [],
  redoStack: [],

  setOriginalImage(data) {
    // ImageFileData.size 为文件字节大小，像素尺寸由调用方通过 Image.getSize 异步获取后单独设置
    set({
      originalImage: data,
      originalImageUrl: data.uri,
      originalImageSize: { width: 0, height: 0 }
    })
  },

  setOriginalImageSize(width: number, height: number) {
    set({ originalImageSize: { width, height } })
  },

  clearImage() {
    set({ originalImage: null, originalImageUrl: '', originalImageSize: { width: 0, height: 0 } })
  },

  setGridWidth(w) {
    set({ gridWidth: Math.max(1, Math.round(w)) })
  },
  setGridHeight(h) {
    set({ gridHeight: Math.max(1, Math.round(h)) })
  },
  setColorCount(n) {
    set({ colorCount: Math.max(1, Math.min(50, Math.round(n))) })
  },
  setSelectedBrand(b) {
    set({ selectedBrand: b })
  },
  setShowNumbers(v) {
    set({ showNumbers: v })
  },
  setLockAspectRatio(v) {
    set({ lockAspectRatio: v })
  },
  setEditMode(v) {
    set({ editMode: v })
  },
  setSelectedTool(t) {
    set({ selectedTool: t })
  },
  setSelectedEditColor(c) {
    set({ selectedEditColor: c })
  },

  setPatternGrid(grid) {
    set({ patternGrid: grid })
    get().refreshColorStats()
  },

  applyToolAction(x, y) {
    const { patternGrid, selectedTool, selectedEditColor, selectedBrand } = get()
    if (selectedTool === 'pan' || !patternGrid[y]?.[x]) return

    const undoStack = [...get().undoStack, clonePatternGrid(patternGrid)]
    if (undoStack.length > MAX_HISTORY) undoStack.shift()

    if (selectedTool === 'eyedropper') {
      const cell = patternGrid[y]?.[x]
      if (cell) set({ selectedEditColor: cell.color })
      return
    }

    const color =
      selectedTool === 'eraser'
        ? { r: 255, g: 255, b: 255, hex: '#FFFFFF', info: {} as Record<string, string> }
        : selectedEditColor
    if (!color) return
    const code = selectedTool === 'eraser' ? '' : color.info?.[selectedBrand] || ''

    let nextGrid: PatternCell[][]
    if (selectedTool === 'fill') {
      nextGrid = fillConnectedRegion(clonePatternGrid(patternGrid), x, y, color, code)
    } else {
      nextGrid = clonePatternGrid(patternGrid)
      nextGrid[y][x] = { color: { ...color }, code }
    }

    set({ patternGrid: nextGrid, undoStack, redoStack: [] })
    get().refreshColorStats()
  },

  applyAreaAction(x1, y1, x2, y2) {
    const { patternGrid, selectedTool, selectedEditColor, selectedBrand } = get()
    if (selectedTool === 'pan') return

    const undoStack = [...get().undoStack, clonePatternGrid(patternGrid)]
    if (undoStack.length > MAX_HISTORY) undoStack.shift()

    const minX = Math.max(0, Math.min(x1, x2))
    const maxX = Math.min(get().gridWidth - 1, Math.max(x1, x2))
    const minY = Math.max(0, Math.min(y1, y2))
    const maxY = Math.min(get().gridHeight - 1, Math.max(y1, y2))

    const color =
      selectedTool === 'eraser'
        ? { r: 255, g: 255, b: 255, hex: '#FFFFFF', info: {} as Record<string, string> }
        : selectedEditColor
    if (!color) return
    const code = selectedTool === 'eraser' ? '' : color.info?.[selectedBrand] || ''

    const nextGrid = clonePatternGrid(patternGrid)
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        if (nextGrid[y]?.[x]) {
          nextGrid[y][x] = { color: { ...color }, code }
        }
      }
    }

    set({ patternGrid: nextGrid, undoStack, redoStack: [] })
    get().refreshColorStats()
  },

  undo() {
    const { undoStack, patternGrid } = get()
    if (!undoStack.length) return
    const previous = undoStack[undoStack.length - 1]
    set({
      undoStack: undoStack.slice(0, -1),
      redoStack: [...get().redoStack, clonePatternGrid(patternGrid)],
      patternGrid: previous,
      gridWidth: previous[0]?.length || get().gridWidth,
      gridHeight: previous.length
    })
    get().refreshColorStats()
  },

  redo() {
    const { redoStack, patternGrid } = get()
    if (!redoStack.length) return
    const next = redoStack[redoStack.length - 1]
    set({
      redoStack: redoStack.slice(0, -1),
      undoStack: [...get().undoStack, clonePatternGrid(patternGrid)],
      patternGrid: next,
      gridWidth: next[0]?.length || get().gridWidth,
      gridHeight: next.length
    })
    get().refreshColorStats()
  },

  importFromCompressed(compressed) {
    const result = decompressPatternGrid(compressed)
    if (!result) return false
    const colonIdx = compressed.indexOf(':')
    const brand = colonIdx > 0 ? compressed.substring(0, colonIdx) : 'MARD'
    set({
      patternGrid: result.patternGrid,
      gridWidth: result.gridWidth,
      gridHeight: result.gridHeight,
      selectedBrand: brand,
      originalImage: null,
      originalImageUrl: '',
      originalImageSize: { width: 0, height: 0 }
    })
    get().refreshColorStats()
    const freshStats = get().colorStats
    set({
      infoText: `已导入: ${result.gridWidth}x${result.gridHeight} 网格, ${freshStats.length} 种颜色`
    })
    return true
  },

  refreshColorStats() {
    const stats = buildColorStats(get().patternGrid)
    set({ colorStats: stats })
    if (!get().selectedEditColor && stats.length) {
      set({ selectedEditColor: stats[0].color })
    }
  },

  loadColorData() {
    if (get().perlerColors.length) return
    const colors = Object.entries(colorSystemMapping as Record<string, Record<string, string>>).map(
      ([hex, info]) => {
        const r = parseInt(hex.substring(1, 3), 16)
        const g = parseInt(hex.substring(3, 5), 16)
        const b = parseInt(hex.substring(5, 7), 16)
        return { r, g, b, hex, info }
      }
    )
    set({ perlerColors: colors })
  }
}))
