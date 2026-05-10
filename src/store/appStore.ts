import { defineStore } from 'pinia'
import colorSystemMapping from '../colorMap/colorSystemMapping.json'
import {
  ceilToMultipleOf5,
  gcd,
  setGridSizeByImageRatio,
  findClosestColor,
  quantizeColorsUtil,
  buildPatternPalette,
  buildBrandPalette,
  buildColorStats
} from '../utils/patternUtils'
import { clonePatternGrid, fillConnectedRegion } from '../utils/editUtils'
import { decompressPatternGrid } from '../utils/compressionUtils'
import type { AppStoreState } from '../types'
import type { PendingSelection } from '../utils/selectionUtils'

const createBlankGrid = (width: number, height: number) => {
  const grid: AppStoreState['patternGrid'] = []
  for (let y = 0; y < height; y++) {
    const row: AppStoreState['patternGrid'][number] = []
    for (let x = 0; x < width; x++) {
      row.push({
        color: { r: 255, g: 255, b: 255, hex: '#FFFFFF', info: {} },
        code: ''
      })
    }
    grid.push(row)
  }
  return grid
}

export const useAppStore = defineStore('app', {
  state: (): AppStoreState => ({
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
    infoText: '请上传图片并生成图纸',
    perlerColors: [],
    patternGrid: createBlankGrid(30, 30),
    colorStats: [],
    selectedEditColor: null,
    selectedTool: 'brush',
    editMode: false,
    undoStack: [],
    redoStack: []
  }),
  getters: {
    patternPalette: (state) =>
      buildPatternPalette(state.perlerColors, state.patternGrid, state.selectedBrand),
    effectivePalette(this: any) {
      const hasUsedColors = this.patternPalette.some((item: any) => item.count > 0)
      return hasUsedColors
        ? this.patternPalette
        : buildBrandPalette(this.perlerColors, this.selectedBrand)
    },
    isEditActive: (state) => state.editMode && state.selectedTool !== 'pan',
    imageRatioText: (state) => {
      const { width, height } = state.originalImageSize
      if (!width || !height) return '暂无图片'
      const ratio = gcd(width, height)
      return `${width / ratio}:${height / ratio}`
    }
  },
  actions: {
    setOriginalImage(file: File | null) {
      this.originalImage = file
    },
    setOriginalImageUrl(url: string) {
      this.originalImageUrl = url
    },
    setOriginalImageSize(width: number, height: number) {
      this.originalImageSize = { width, height }
    },
    setInfoText(text: string) {
      this.infoText = text
    },
    setSelectedBrand(brand: string) {
      this.selectedBrand = brand
    },
    setShowNumbers(value: boolean) {
      this.showNumbers = value
    },
    setLockAspectRatio(value: boolean) {
      this.lockAspectRatio = value
    },
    setPadToMultipleOf5(value: boolean) {
      this.padToMultipleOf5 = value
    },
    setGridWidth(width: number) {
      this.gridWidth = width
    },
    setGridHeight(height: number) {
      this.gridHeight = height
    },
    setColorCount(count: number) {
      this.colorCount = count
    },
    setEditMode(value: boolean) {
      this.editMode = value
    },
    setSelectedTool(tool: AppStoreState['selectedTool']) {
      this.selectedTool = tool
    },
    setSelectedEditColor(color: AppStoreState['selectedEditColor']) {
      this.selectedEditColor = color
    },
    setGridSizeByImageRatio(width: number, height: number) {
      const result = setGridSizeByImageRatio(width, height)
      if (result.width && result.height) {
        this.gridWidth = result.width
        this.gridHeight = result.height
      }
    },
    expandGrid(direction: 'top' | 'bottom' | 'left' | 'right', amount: number) {
      if (amount < 1) return
      this.pushHistory()
      const blank = {
        color: { r: 255, g: 255, b: 255, hex: '#FFFFFF', info: {} },
        code: ''
      }

      if (direction === 'top') {
        const newRows = createBlankGrid(this.gridWidth, amount)
        this.patternGrid = [...newRows, ...this.patternGrid]
        this.gridHeight += amount
      } else if (direction === 'bottom') {
        const newRows = createBlankGrid(this.gridWidth, amount)
        this.patternGrid = [...this.patternGrid, ...newRows]
        this.gridHeight += amount
      } else if (direction === 'left') {
        this.patternGrid = this.patternGrid.map((row) => [
          ...Array.from({ length: amount }, () => ({ ...blank })),
          ...row
        ])
        this.gridWidth += amount
      } else if (direction === 'right') {
        this.patternGrid = this.patternGrid.map((row) => [
          ...row,
          ...Array.from({ length: amount }, () => ({ ...blank }))
        ])
        this.gridWidth += amount
      }

      this.refreshColorStats()
    },

    loadColorData() {
      try {
        const colors = Object.entries(colorSystemMapping).map(([hex, info]) => {
          const r = parseInt(hex.substring(1, 3), 16)
          const g = parseInt(hex.substring(3, 5), 16)
          const b = parseInt(hex.substring(5, 7), 16)
          return { r, g, b, hex, info }
        })
        this.perlerColors = colors
      } catch (error) {
        console.error('加载颜色数据失败:', error)
        this.infoText = '加载颜色数据失败，请检查colorSystemMapping.json文件'
      }
    },
    refreshColorStats() {
      this.colorStats = buildColorStats(this.patternGrid)
      if (!this.selectedEditColor && this.colorStats.length) {
        this.selectedEditColor = this.colorStats[0].color
      }
    },
    pushHistory() {
      if (!this.patternGrid.length) return
      this.undoStack.push(clonePatternGrid(this.patternGrid))
      if (this.undoStack.length > 50) {
        this.undoStack.shift()
      }
      this.redoStack = []
    },
    applyPatternGridChange(newGrid: AppStoreState['patternGrid']) {
      this.patternGrid = newGrid
      this.refreshColorStats()
    },
    updateSelectionCells(
      selection: PendingSelection,
      updater: (
        cell: AppStoreState['patternGrid'][number][number]
      ) => AppStoreState['patternGrid'][number][number]
    ) {
      if (!this.patternGrid.length) return this.patternGrid
      const grid = clonePatternGrid(this.patternGrid)

      if (selection.type === 'cell') {
        const x = selection.x ?? 0
        const y = selection.y ?? 0
        if (grid[y] && grid[y][x]) {
          grid[y][x] = updater(grid[y][x])
        }
        return grid
      }

      const x1 = Math.min(selection.x1 ?? 0, selection.x2 ?? 0)
      const y1 = Math.min(selection.y1 ?? 0, selection.y2 ?? 0)
      const x2 = Math.max(selection.x1 ?? 0, selection.x2 ?? 0)
      const y2 = Math.max(selection.y1 ?? 0, selection.y2 ?? 0)

      for (let y = y1; y <= y2; y++) {
        for (let x = x1; x <= x2; x++) {
          if (grid[y] && grid[y][x]) {
            grid[y][x] = updater(grid[y][x])
          }
        }
      }

      return grid
    },
    getBrandCode(color: AppStoreState['selectedEditColor']) {
      return color?.info?.[this.selectedBrand] || ''
    },
    applyToolAction(selection: PendingSelection) {
      if (!selection || this.selectedTool === 'pan' || !this.patternGrid.length) return
      if (this.selectedTool === 'eyedropper') {
        this.handleEyedropper(selection)
        return
      }

      const color =
        this.selectedTool === 'eraser'
          ? { r: 255, g: 255, b: 255, hex: '#FFFFFF', info: {} }
          : this.selectedEditColor
      if (!color) return
      const code = this.selectedTool === 'eraser' ? '' : this.getBrandCode(color)

      this.pushHistory()

      if (this.selectedTool === 'fill') {
        if (selection.type === 'cell') {
          const x = selection.x ?? 0
          const y = selection.y ?? 0
          const nextGrid = clonePatternGrid(this.patternGrid)
          this.applyPatternGridChange(fillConnectedRegion(nextGrid, x, y, color, code))
          return
        }
        this.applyPatternGridChange(
          this.updateSelectionCells(selection, () => ({ color: { ...color }, code }))
        )
        return
      }

      this.applyPatternGridChange(
        this.updateSelectionCells(selection, () => ({ color: { ...color }, code }))
      )
    },
    handleFillAll() {
      if (!this.selectedEditColor || !this.patternGrid.length) return
      this.pushHistory()
      const code = this.getBrandCode(this.selectedEditColor)
      const nextGrid = clonePatternGrid(this.patternGrid).map((row) =>
        row.map(() => ({ color: { ...this.selectedEditColor! }, code }))
      )
      this.applyPatternGridChange(nextGrid)
    },
    handleEyedropper(selection: PendingSelection) {
      if (!this.patternGrid.length) return
      const x = selection.x ?? selection.x1 ?? 0
      const y = selection.y ?? selection.y1 ?? 0
      const cell = this.patternGrid[y]?.[x]
      if (!cell) return
      this.selectedEditColor = cell.color
    },
    undo() {
      if (!this.undoStack.length) return
      this.redoStack.push(clonePatternGrid(this.patternGrid))
      const previous = this.undoStack.pop()
      if (previous) {
        this.patternGrid = previous
        this.gridWidth = previous[0]?.length || this.gridWidth
        this.gridHeight = previous.length
        this.refreshColorStats()
      }
    },
    redo() {
      if (!this.redoStack.length) return
      this.undoStack.push(clonePatternGrid(this.patternGrid))
      const next = this.redoStack.pop()
      if (next) {
        this.patternGrid = next
        this.gridWidth = next[0]?.length || this.gridWidth
        this.gridHeight = next.length
        this.refreshColorStats()
      }
    },
    setPendingSelection(selection: PendingSelection) {
      if (!this.isEditActive) return
      this.applyToolAction(selection)
    },
    async generatePattern() {
      if (!this.originalImageUrl) {
        alert('请先上传图片')
        return
      }
      if (!this.perlerColors.length) {
        alert('颜色数据未加载完成，请稍后重试')
        return
      }

      const originalWidth = Math.max(5, this.gridWidth)
      const originalHeight = Math.max(5, this.gridHeight)

      let effectiveWidth = originalWidth
      let effectiveHeight = originalHeight
      let leftPad = 0
      let topPad = 0

      if (this.padToMultipleOf5) {
        effectiveWidth = ceilToMultipleOf5(originalWidth)
        effectiveHeight = ceilToMultipleOf5(originalHeight)
        const padW = effectiveWidth - originalWidth
        const padH = effectiveHeight - originalHeight
        leftPad = Math.floor(padW / 2)
        topPad = Math.floor(padH / 2)
      }

      const img = new Image()
      const loadPromise = new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('图片加载失败'))
      })
      img.src = this.originalImageUrl
      await loadPromise

      const tempCanvas = document.createElement('canvas')
      const tempCtx = tempCanvas.getContext('2d')
      if (!tempCtx) return
      tempCanvas.width = Math.max(1, effectiveWidth)
      tempCanvas.height = Math.max(1, effectiveHeight)
      tempCtx.drawImage(img, leftPad, topPad, originalWidth, originalHeight)

      const imageData = tempCtx.getImageData(0, 0, effectiveWidth, effectiveHeight)
      const pixels = imageData.data
      const colorMap = quantizeColorsUtil(pixels, this.colorCount, this.perlerColors)

      const blankCell = {
        color: { r: 255, g: 255, b: 255, hex: '#FFFFFF', info: {} },
        code: ''
      }

      const nextGrid = [] as AppStoreState['patternGrid']
      for (let y = 0; y < effectiveHeight; y++) {
        const row = [] as AppStoreState['patternGrid'][number]
        for (let x = 0; x < effectiveWidth; x++) {
          const inPadding =
            this.padToMultipleOf5 &&
            (x < leftPad ||
              x >= leftPad + originalWidth ||
              y < topPad ||
              y >= topPad + originalHeight)
          if (inPadding) {
            row.push({ ...blankCell })
          } else {
            const index = (y * effectiveWidth + x) * 4
            const r = pixels[index]
            const g = pixels[index + 1]
            const b = pixels[index + 2]
            const closestColor = findClosestColor({ r, g, b }, colorMap)
            const colorCode = closestColor.info ? closestColor.info[this.selectedBrand] || '' : ''
            row.push({ color: closestColor, code: colorCode })
          }
        }
        nextGrid.push(row)
      }

      this.gridWidth = effectiveWidth
      this.gridHeight = effectiveHeight
      this.patternGrid = nextGrid
      this.refreshColorStats()
      this.selectedEditColor = this.selectedEditColor || this.patternPalette[0]?.color || null
      this.infoText = `拼豆图纸已生成: ${effectiveWidth}x${effectiveHeight} 网格, ${this.colorCount} 种颜色`
    },

    importFromCompressed(compressed: string): boolean {
      const result = decompressPatternGrid(compressed)
      if (!result) return false

      this.patternGrid = result.patternGrid
      this.gridWidth = result.gridWidth
      this.gridHeight = result.gridHeight

      const colonIdx = compressed.indexOf(':')
      if (colonIdx > 0) {
        this.selectedBrand = compressed.substring(0, colonIdx)
      }

      this.originalImage = null
      this.originalImageUrl = ''
      this.originalImageSize = { width: 0, height: 0 }

      if (!this.perlerColors.length) {
        this.loadColorData()
      }

      this.refreshColorStats()
      this.infoText = `已导入拼豆图纸: ${result.gridWidth}x${result.gridHeight} 网格, ${this.colorStats.length} 种颜色`
      return true
    }
  }
})
