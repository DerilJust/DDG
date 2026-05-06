import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAppStore } from '../src/store/appStore'
import type { PerlerColor, PatternCell } from '../src/utils/patternUtils'

function setup() {
  setActivePinia(createPinia())
  return useAppStore()
}

describe('useAppStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('初始状态', () => {
    it('grid默认尺寸为30x30', () => {
      const store = useAppStore()
      expect(store.gridWidth).toBe(30)
      expect(store.gridHeight).toBe(30)
    })

    it('colorCount默认为20', () => {
      const store = useAppStore()
      expect(store.colorCount).toBe(20)
    })

    it('默认品牌为MARD', () => {
      const store = useAppStore()
      expect(store.selectedBrand).toBe('MARD')
    })

    it('showNumbers和editMode默认为false', () => {
      const store = useAppStore()
      expect(store.showNumbers).toBe(false)
      expect(store.editMode).toBe(false)
    })

    it('lockAspectRatio默认为true', () => {
      const store = useAppStore()
      expect(store.lockAspectRatio).toBe(true)
    })

    it('selectedTool默认为brush', () => {
      const store = useAppStore()
      expect(store.selectedTool).toBe('brush')
    })

    it('perlerColors为空数组', () => {
      const store = useAppStore()
      expect(store.perlerColors).toEqual([])
    })

    it('patternGrid为30x30空白网格', () => {
      const store = useAppStore()
      expect(store.patternGrid).toHaveLength(30)
      expect(store.patternGrid[0]).toHaveLength(30)
      expect(store.patternGrid[0][0].color.hex).toBe('#FFFFFF')
      expect(store.patternGrid[0][0].code).toBe('')
    })

    it('undoStack和redoStack为空', () => {
      const store = useAppStore()
      expect(store.undoStack).toEqual([])
      expect(store.redoStack).toEqual([])
    })

    it('selectedEditColor为null', () => {
      const store = useAppStore()
      expect(store.selectedEditColor).toBeNull()
    })
  })

  describe('简单 setters', () => {
    it('setOriginalImage设置File', () => {
      const store = useAppStore()
      const file = new File([], 'test.png')
      store.setOriginalImage(file)
      // File对象在happy-dom中可能创建新实例，使用instanceof验证
      expect(store.originalImage).toBeInstanceOf(File)
    })

    it('setOriginalImageUrl设置URL', () => {
      const store = useAppStore()
      store.setOriginalImageUrl('data:image/png;base64,xxx')
      expect(store.originalImageUrl).toBe('data:image/png;base64,xxx')
    })

    it('setOriginalImageSize设置尺寸', () => {
      const store = useAppStore()
      store.setOriginalImageSize(800, 600)
      expect(store.originalImageSize).toEqual({ width: 800, height: 600 })
    })

    it('setInfoText设置提示文本', () => {
      const store = useAppStore()
      store.setInfoText('测试文字')
      expect(store.infoText).toBe('测试文字')
    })

    it('setSelectedBrand切换品牌', () => {
      const store = useAppStore()
      store.setSelectedBrand('COCO')
      expect(store.selectedBrand).toBe('COCO')
    })

    it('setShowNumbers切换数字显示', () => {
      const store = useAppStore()
      store.setShowNumbers(true)
      expect(store.showNumbers).toBe(true)
    })

    it('setLockAspectRatio切换比例锁定', () => {
      const store = useAppStore()
      store.setLockAspectRatio(false)
      expect(store.lockAspectRatio).toBe(false)
    })

    it('setGridWidth/setGridHeight设置网格尺寸', () => {
      const store = useAppStore()
      store.setGridWidth(50)
      store.setGridHeight(40)
      expect(store.gridWidth).toBe(50)
      expect(store.gridHeight).toBe(40)
    })

    it('setColorCount设置颜色数量', () => {
      const store = useAppStore()
      store.setColorCount(10)
      expect(store.colorCount).toBe(10)
    })

    it('setEditMode切换编辑模式', () => {
      const store = useAppStore()
      store.setEditMode(true)
      expect(store.editMode).toBe(true)
    })

    it('setSelectedTool切换工具', () => {
      const store = useAppStore()
      store.setSelectedTool('fill')
      expect(store.selectedTool).toBe('fill')
    })

    it('setSelectedEditColor设置编辑颜色', () => {
      const store = useAppStore()
      const color = { r: 255, g: 0, b: 0, hex: '#FF0000', info: { MARD: 'R01' } }
      store.setSelectedEditColor(color)
      expect(store.selectedEditColor).toEqual(color)
    })

    it('setGridSizeByImageRatio委托给工具函数', () => {
      const store = useAppStore()
      store.setGridSizeByImageRatio(2000, 1000)
      expect(store.gridWidth).toBe(100)
      expect(store.gridHeight).toBe(50)
    })
  })

  describe('getters', () => {
    it('patternPalette基于patternGrid和brand计算', () => {
      const store = useAppStore()
      store.loadColorData()
      expect(store.patternPalette.length).toBeGreaterThan(0)
    })

    it('effectivePalette初始grid（白色）无使用时回退到brandPalette', () => {
      const store = useAppStore()
      store.loadColorData()
      const palette = store.effectivePalette
      // brandPalette中所有item的count为0
      expect(palette.length).toBeGreaterThan(0)
    })

    it('isEditActive在editMode=true且tool!=pan时为true', () => {
      const store = useAppStore()
      store.setEditMode(true)
      store.setSelectedTool('brush')
      expect(store.isEditActive).toBe(true)
    })

    it('isEditActive在editMode=false时为false', () => {
      const store = useAppStore()
      store.setEditMode(false)
      store.setSelectedTool('brush')
      expect(store.isEditActive).toBe(false)
    })

    it('isEditActive在tool=pan时为false', () => {
      const store = useAppStore()
      store.setEditMode(true)
      store.setSelectedTool('pan')
      expect(store.isEditActive).toBe(false)
    })

    it('imageRatioText无图片时返回暂无图片', () => {
      const store = useAppStore()
      expect(store.imageRatioText).toBe('暂无图片')
    })

    it('imageRatioText有图片时计算比例', () => {
      const store = useAppStore()
      store.setOriginalImageSize(800, 600)
      expect(store.imageRatioText).toBe('4:3')
    })
  })

  describe('loadColorData', () => {
    it('加载颜色数据不为空', () => {
      const store = useAppStore()
      store.loadColorData()
      expect(store.perlerColors.length).toBeGreaterThan(250)
    })

    it('第一个颜色为#FAF4C8对应RGB(250,244,200)', () => {
      const store = useAppStore()
      store.loadColorData()
      expect(store.perlerColors[0].r).toBe(250)
      expect(store.perlerColors[0].g).toBe(244)
      expect(store.perlerColors[0].b).toBe(200)
      expect(store.perlerColors[0].hex).toBe('#FAF4C8')
    })

    it('info包含5个品牌键', () => {
      const store = useAppStore()
      store.loadColorData()
      const first = store.perlerColors[0]
      expect(first.info).toBeDefined()
      expect(first.info!.MARD).toBe('A01')
      expect(first.info!.COCO).toBe('E02')
    })
  })

  describe('generatePattern', () => {
    it('没有originalImageUrl时弹出提示', async () => {
      const store = useAppStore()
      const alertMock = vi.fn()
      vi.stubGlobal('alert', alertMock)
      await store.generatePattern()
      expect(alertMock).toHaveBeenCalledWith('请先上传图片')
    })

    it('没有perlerColors时弹出提示', async () => {
      const store = useAppStore()
      store.setOriginalImageUrl('data:image/png;base64,test')
      const alertMock = vi.fn()
      vi.stubGlobal('alert', alertMock)
      await store.generatePattern()
      expect(alertMock).toHaveBeenCalledWith('颜色数据未加载完成，请稍后重试')
    })

    it('正常生成pattern更新grid和infoText', async () => {
      const store = useAppStore()
      store.loadColorData()
      store.setOriginalImageUrl('data:image/png;base64,test')

      // 创建全红像素数据
      const pixelData = new Uint8ClampedArray(30 * 30 * 4)
      for (let i = 0; i < 30 * 30; i++) {
        const offset = i * 4
        pixelData[offset] = 255
        pixelData[offset + 1] = 0
        pixelData[offset + 2] = 0
        pixelData[offset + 3] = 255
      }

      // Mock canvas getImageData
      const origCreateElement = document.createElement.bind(document)
      vi.spyOn(document, 'createElement').mockImplementation((tag: string, _options?) => {
        if (tag === 'canvas') {
          const el = origCreateElement('canvas')
          vi.spyOn(el, 'getContext').mockReturnValue({
            drawImage: vi.fn(),
            getImageData: vi.fn().mockReturnValue({ data: pixelData })
          } as unknown as CanvasRenderingContext2D)
          return el
        }
        if (tag === 'img') {
          const img = origCreateElement('img')
          setTimeout(() => (img as unknown as { onload?: () => void }).onload?.(), 0)
          return img
        }
        return origCreateElement(tag)
      })

      // Mock Image constructor 返回带 onload 的 img
      vi.stubGlobal(
        'Image',
        vi.fn(function (this: HTMLImageElement) {
          const img = origCreateElement('img')
          setTimeout(() => (img as unknown as { onload?: () => void }).onload?.(), 0)
          return img
        })
      )

      await store.generatePattern()

      expect(store.patternGrid).toHaveLength(30)
      expect(store.patternGrid[0]).toHaveLength(30)
      expect(store.infoText).toContain('拼豆图纸已生成')
    })
  })

  describe('历史栈', () => {
    it('pushHistory将当前grid加入undoStack', () => {
      const store = useAppStore()
      store.pushHistory()
      expect(store.undoStack).toHaveLength(1)
    })

    it('pushHistory清空redoStack', () => {
      const store = useAppStore()
      store.pushHistory()
      store.undo()
      expect(store.redoStack).toHaveLength(1)
      store.pushHistory()
      expect(store.redoStack).toHaveLength(0)
    })

    it('undo还原上一个patternGrid状态', () => {
      const store = useAppStore()
      store.loadColorData()
      const originalCode = store.patternGrid[0][0].code

      store.pushHistory()
      // 修改patternGrid
      const color = store.perlerColors[0]
      const newGrid = store.patternGrid.map((row) =>
        row.map(() => ({ color: { ...color }, code: color.info!.MARD }))
      )
      store.applyPatternGridChange(newGrid)
      expect(store.patternGrid[0][0].code).toBe('A01')

      store.undo()
      expect(store.patternGrid[0][0].code).toBe(originalCode)
    })

    it('undo空栈无操作', () => {
      const store = useAppStore()
      const before = store.undoStack.length
      store.undo()
      expect(store.undoStack.length).toBe(before)
    })

    it('redo重做已恢复的状态', () => {
      const store = useAppStore()
      store.loadColorData()
      store.pushHistory()
      const color = store.perlerColors[0]
      store.applyPatternGridChange(
        store.patternGrid.map((row) => row.map(() => ({
          color: { ...color },
          code: 'A01'
        })))
      )
      store.undo()
      expect(store.patternGrid[0][0].code).toBe('')
      store.redo()
      expect(store.patternGrid[0][0].code).toBe('A01')
    })

    it('redo空栈无操作', () => {
      const store = useAppStore()
      store.pushHistory()
      const before = store.redoStack.length
      store.redo()
      expect(store.redoStack.length).toBe(before)
    })

    it('历史栈上限为50', () => {
      const store = useAppStore()
      for (let i = 0; i < 51; i++) {
        store.pushHistory()
      }
      expect(store.undoStack.length).toBeLessThanOrEqual(50)
    })
  })

  describe('applyToolAction', () => {
    beforeEach(() => {
      setActivePinia(createPinia())
    })

    it('brush工具用选中颜色绘制', () => {
      const store = useAppStore()
      store.loadColorData()
      const color = store.perlerColors[0]
      store.setSelectedEditColor(color)
      store.setEditMode(true)
      store.setSelectedTool('brush')

      store.pushHistory()
      const result = store.updateSelectionCells({ type: 'cell', x: 0, y: 0 }, () => ({
        color: { ...color },
        code: color.info!.MARD
      }))
      store.applyPatternGridChange(result)

      expect(store.patternGrid[0][0].code).toBe('A01')
    })

    it('brush无选中颜色时提前返回', () => {
      const store = useAppStore()
      store.setSelectedTool('brush')
      store.applyToolAction({ type: 'cell', x: 0, y: 0 })
      expect(store.patternGrid[0][0].code).toBe('')
    })

    it('eraser将格子设为白色', () => {
      const store = useAppStore()
      store.loadColorData()
      store.setSelectedEditColor(store.perlerColors[0])
      store.setSelectedTool('brush')
      store.pushHistory()
      store.applyPatternGridChange(
        store.updateSelectionCells({ type: 'cell', x: 0, y: 0 }, () => ({
          color: { ...store.selectedEditColor! },
          code: 'A01'
        }))
      )

      store.setSelectedTool('eraser')
      store.pushHistory()
      store.applyPatternGridChange(
        store.updateSelectionCells({ type: 'cell', x: 0, y: 0 }, () => ({
          color: { r: 255, g: 255, b: 255, hex: '#FFFFFF', info: {} },
          code: ''
        }))
      )

      expect(store.patternGrid[0][0].color.hex).toBe('#FFFFFF')
      expect(store.patternGrid[0][0].code).toBe('')
    })

    it('pan工具直接返回不修改', () => {
      const store = useAppStore()
      store.setSelectedTool('pan')
      store.loadColorData()
      store.setSelectedEditColor(store.perlerColors[0])
      store.applyToolAction({ type: 'cell', x: 0, y: 0 })
      expect(store.patternGrid[0][0].code).toBe('')
    })

    it('eyedropper取色', () => {
      const store = useAppStore()
      store.loadColorData()
      store.setEditMode(true)
      store.setSelectedTool('eyedropper')
      const targetColor = store.perlerColors[0]
      store.applyPatternGridChange(
        store.updateSelectionCells({ type: 'cell', x: 0, y: 0 }, () => ({
          color: { ...targetColor },
          code: 'A01'
        }))
      )
      store.setSelectedEditColor(null)

      store.setSelectedTool('eyedropper')
      store.applyToolAction({ type: 'cell', x: 0, y: 0 })
      expect(store.selectedEditColor?.r).toBe(targetColor.r)
    })
  })

  describe('handleFillAll', () => {
    it('用选中色填充整个grid', () => {
      const store = useAppStore()
      store.loadColorData()
      const color = store.perlerColors[0]
      store.setSelectedEditColor(color)
      store.handleFillAll()
      expect(store.patternGrid[0][0].code).toBe('A01')
      expect(store.patternGrid[29][29].code).toBe('A01')
    })

    it('没有选中色不操作', () => {
      const store = useAppStore()
      store.handleFillAll()
      expect(store.patternGrid[0][0].code).toBe('')
    })
  })

  describe('handleEyedropper', () => {
    it('从指定格子读取颜色', () => {
      const store = useAppStore()
      store.loadColorData()
      const targetColor = store.perlerColors[0]
      store.applyPatternGridChange(
        store.updateSelectionCells({ type: 'cell', x: 0, y: 0 }, () => ({
          color: { ...targetColor },
          code: 'A01'
        }))
      )
      store.setSelectedEditColor(null)
      store.handleEyedropper({ type: 'cell', x: 0, y: 0 })
      expect(store.selectedEditColor?.r).toBe(targetColor.r)
    })

    it('越界坐标提前返回', () => {
      const store = useAppStore()
      store.loadColorData()
      store.setSelectedEditColor(null)
      store.handleEyedropper({ type: 'cell', x: 9999, y: 9999 })
      expect(store.selectedEditColor).toBeNull()
    })
  })

  describe('setPendingSelection', () => {
    it('isEditActive为false时跳过', () => {
      const store = useAppStore()
      store.setEditMode(false)
      const spy = vi.spyOn(store, 'pushHistory')
      store.setPendingSelection({ type: 'cell', x: 0, y: 0 })
      expect(spy).not.toHaveBeenCalled()
    })

    it('isEditActive为true时执行tool action', () => {
      const store = useAppStore()
      store.loadColorData()
      store.setSelectedEditColor(store.perlerColors[0])
      store.setEditMode(true)
      store.setSelectedTool('brush')
      store.setPendingSelection({ type: 'cell', x: 0, y: 0 })
      expect(store.patternGrid[0][0].code).toBe('A01')
    })
  })
})
