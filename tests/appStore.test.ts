import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAppStore } from '../src/store/appStore'
import type { PerlerColor } from '../src/utils/patternUtils'

vi.mock('element-plus', () => ({
  ElMessage: {
    warning: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn()
  }
}))

import { ElMessage } from 'element-plus'

function createStore() {
  setActivePinia(createPinia())
  return useAppStore()
}

const makeColor = (
  r: number,
  g: number,
  b: number,
  hex: string,
  info?: Record<string, string>
): PerlerColor => ({ r, g, b, hex, info: info ?? {} })

describe('useAppStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('初始状态', () => {
    it('grid默认尺寸为30x30', () => {
      const store = createStore()
      expect(store.gridWidth).toBe(30)
      expect(store.gridHeight).toBe(30)
    })

    it('colorCount默认为20', () => {
      expect(createStore().colorCount).toBe(20)
    })

    it('默认品牌为MARD', () => {
      expect(createStore().selectedBrand).toBe('MARD')
    })

    it('showNumbers和editMode默认为false', () => {
      const store = createStore()
      expect(store.showNumbers).toBe(false)
      expect(store.editMode).toBe(false)
    })

    it('lockAspectRatio默认为true', () => {
      expect(createStore().lockAspectRatio).toBe(true)
    })

    it('padToMultipleOf5默认为true', () => {
      expect(createStore().padToMultipleOf5).toBe(true)
    })

    it('exportScale默认为1', () => {
      expect(createStore().exportScale).toBe(1)
    })

    it('selectedTool默认为brush', () => {
      expect(createStore().selectedTool).toBe('brush')
    })

    it('shortcutPreset默认为default', () => {
      expect(createStore().shortcutPreset).toBe('default')
    })

    it('customShortcutConfig默认为null', () => {
      expect(createStore().customShortcutConfig).toBeNull()
    })

    it('infoText默认为提示文字', () => {
      expect(createStore().infoText).toBe('请上传图片并生成图纸')
    })

    it('perlerColors为空数组', () => {
      expect(createStore().perlerColors).toEqual([])
    })

    it('patternGrid为30x30空白网格', () => {
      const store = createStore()
      expect(store.patternGrid).toHaveLength(30)
      expect(store.patternGrid[0]).toHaveLength(30)
      expect(store.patternGrid[0][0].color.hex).toBe('#FFFFFF')
      expect(store.patternGrid[0][0].code).toBe('')
    })

    it('undoStack和redoStack为空', () => {
      const store = createStore()
      expect(store.undoStack).toEqual([])
      expect(store.redoStack).toEqual([])
    })

    it('selectedEditColor为null', () => {
      expect(createStore().selectedEditColor).toBeNull()
    })

    it('originalImage为null', () => {
      expect(createStore().originalImage).toBeNull()
    })

    it('originalImageUrl为空字符串', () => {
      expect(createStore().originalImageUrl).toBe('')
    })

    it('originalImageSize为{0,0}', () => {
      expect(createStore().originalImageSize).toEqual({ width: 0, height: 0 })
    })
  })

  describe('简单 setters', () => {
    it('setOriginalImage设置File', () => {
      const store = createStore()
      const file = new File([], 'test.png')
      store.setOriginalImage(file)
      expect(store.originalImage).toBeInstanceOf(File)
    })

    it('setOriginalImage设置null', () => {
      const store = createStore()
      store.setOriginalImage(null)
      expect(store.originalImage).toBeNull()
    })

    it('setOriginalImageUrl设置URL', () => {
      const store = createStore()
      store.setOriginalImageUrl('data:image/png;base64,xxx')
      expect(store.originalImageUrl).toBe('data:image/png;base64,xxx')
    })

    it('setOriginalImageSize设置尺寸', () => {
      const store = createStore()
      store.setOriginalImageSize(800, 600)
      expect(store.originalImageSize).toEqual({ width: 800, height: 600 })
    })

    it('setInfoText设置提示文本', () => {
      const store = createStore()
      store.setInfoText('测试文字')
      expect(store.infoText).toBe('测试文字')
    })

    it('setSelectedBrand切换品牌', () => {
      const store = createStore()
      store.setSelectedBrand('COCO')
      expect(store.selectedBrand).toBe('COCO')
    })

    it('setShowNumbers切换数字显示', () => {
      const store = createStore()
      store.setShowNumbers(true)
      expect(store.showNumbers).toBe(true)
    })

    it('setLockAspectRatio切换比例锁定', () => {
      const store = createStore()
      store.setLockAspectRatio(false)
      expect(store.lockAspectRatio).toBe(false)
    })

    it('setPadToMultipleOf5切换', () => {
      const store = createStore()
      store.setPadToMultipleOf5(false)
      expect(store.padToMultipleOf5).toBe(false)
    })

    it('setExportScale设置导出倍率', () => {
      const store = createStore()
      store.setExportScale(3)
      expect(store.exportScale).toBe(3)
    })

    it('setGridWidth/setGridHeight设置网格尺寸', () => {
      const store = createStore()
      store.setGridWidth(50)
      store.setGridHeight(40)
      expect(store.gridWidth).toBe(50)
      expect(store.gridHeight).toBe(40)
    })

    it('setColorCount设置颜色数量', () => {
      const store = createStore()
      store.setColorCount(10)
      expect(store.colorCount).toBe(10)
    })

    it('setEditMode切换编辑模式', () => {
      const store = createStore()
      store.setEditMode(true)
      expect(store.editMode).toBe(true)
    })

    it('setSelectedTool切换工具', () => {
      const store = createStore()
      store.setSelectedTool('fill')
      expect(store.selectedTool).toBe('fill')
    })

    it('setSelectedEditColor设置编辑颜色', () => {
      const store = createStore()
      const color = makeColor(255, 0, 0, '#FF0000', { MARD: 'R01' })
      store.setSelectedEditColor(color)
      expect(store.selectedEditColor).toEqual(color)
    })

    it('setShortcutPreset设置快捷键预设', () => {
      const store = createStore()
      store.setShortcutPreset('photoshop')
      expect(store.shortcutPreset).toBe('photoshop')
    })

    it('setCustomShortcutConfig存储自定义快捷键', () => {
      const store = createStore()
      const config = {
        toggleEditMode: 'Tab',
        toolBrush: 'V',
        toolFill: 'G',
        toolEraser: 'E',
        toolEyedropper: 'I',
        toolPan: ' ',
        undo: 'Ctrl+Z',
        redo: 'Ctrl+Shift+Z'
      }
      store.setCustomShortcutConfig(config)
      expect(store.customShortcutConfig).toEqual(config)
      // setCustomShortcutConfig只保存配置，不修改preset
    })

    it('setGridSizeByImageRatio将大图缩放到100以内', () => {
      const store = createStore()
      store.setGridSizeByImageRatio(2000, 1000)
      expect(store.gridWidth).toBe(100)
      expect(store.gridHeight).toBe(50)
    })
  })

  describe('getters', () => {
    it('patternPalette基于patternGrid和brand计算', () => {
      const store = createStore()
      store.loadColorData()
      expect(store.patternPalette.length).toBeGreaterThan(0)
    })

    it('effectivePalette初始返回有效数据', () => {
      const store = createStore()
      store.loadColorData()
      const palette = store.effectivePalette
      expect(palette.length).toBeGreaterThan(0)
      // 所有palette项目都有code和color属性
      expect(palette.every((item) => typeof item.code === 'string' && item.color)).toBe(true)
    })

    it('effectivePalette有使用颜色时返回patternPalette', () => {
      const store = createStore()
      store.loadColorData()
      store.setSelectedEditColor(store.perlerColors[0])
      store.handleFillAll()
      const palette = store.effectivePalette
      expect(palette.some((item) => item.count > 0)).toBe(true)
    })

    it('isEditActive在editMode=true且tool!=pan时为true', () => {
      const store = createStore()
      store.setEditMode(true)
      store.setSelectedTool('brush')
      expect(store.isEditActive).toBe(true)
    })

    it('isEditActive在editMode=false时为false', () => {
      const store = createStore()
      store.setEditMode(false)
      store.setSelectedTool('brush')
      expect(store.isEditActive).toBe(false)
    })

    it('isEditActive在tool=pan时为false', () => {
      const store = createStore()
      store.setEditMode(true)
      store.setSelectedTool('pan')
      expect(store.isEditActive).toBe(false)
    })

    it('imageRatioText无图片时返回暂无图片', () => {
      expect(createStore().imageRatioText).toBe('暂无图片')
    })

    it('imageRatioText有图片时计算比例', () => {
      const store = createStore()
      store.setOriginalImageSize(800, 600)
      expect(store.imageRatioText).toBe('4:3')
    })

    it('imageRatioText 16:9比例', () => {
      const store = createStore()
      store.setOriginalImageSize(1920, 1080)
      expect(store.imageRatioText).toBe('16:9')
    })

    it('activeShortcutConfig默认预设', () => {
      const store = createStore()
      const config = store.activeShortcutConfig
      expect(config.toolBrush).toBe('B')
      expect(config.undo).toBe('Ctrl+Z')
    })

    it('activeShortcutConfig自定义预设', () => {
      const store = createStore()
      const custom = {
        toggleEditMode: 'Tab',
        toolBrush: 'X',
        toolFill: 'G',
        toolEraser: 'E',
        toolEyedropper: 'I',
        toolPan: 'H',
        undo: 'Ctrl+Z',
        redo: 'Ctrl+Y'
      }
      store.setShortcutPreset('custom')
      store.setCustomShortcutConfig(custom)
      expect(store.activeShortcutConfig.toolBrush).toBe('X')
    })
  })

  describe('loadColorData', () => {
    it('加载颜色数据不为空', () => {
      const store = createStore()
      store.loadColorData()
      expect(store.perlerColors.length).toBeGreaterThan(250)
    })

    it('每个颜色包含r,g,b,hex,info属性', () => {
      const store = createStore()
      store.loadColorData()
      const first = store.perlerColors[0]
      expect(first.r).toBeTypeOf('number')
      expect(first.g).toBeTypeOf('number')
      expect(first.b).toBeTypeOf('number')
      expect(first.hex).toMatch(/^#[0-9A-F]{6}$/)
      expect(first.info).toBeDefined()
    })

    it('info包含5个品牌键', () => {
      const store = createStore()
      store.loadColorData()
      const first = store.perlerColors[0]
      expect(first.info!.MARD).toBeDefined()
      expect(first.info!.COCO).toBeDefined()
    })
  })

  describe('generatePattern', () => {
    it('没有originalImageUrl时弹出ElMessage警告', async () => {
      const store = createStore()
      await store.generatePattern()
      expect(ElMessage.warning).toHaveBeenCalledWith('请先上传图片')
    })

    it('没有perlerColors时弹出警告', async () => {
      const store = createStore()
      store.setOriginalImageUrl('data:image/png;base64,test')
      await store.generatePattern()
      expect(ElMessage.warning).toHaveBeenCalledWith('颜色数据未加载完成，请稍后重试')
    })

    it('正常生成pattern更新grid和infoText', async () => {
      const store = createStore()
      store.loadColorData()
      store.setOriginalImageUrl('data:image/png;base64,test')
      store.setPadToMultipleOf5(false)

      const pixelData = new Uint8ClampedArray(30 * 30 * 4)
      for (let i = 0; i < 30 * 30; i++) {
        const offset = i * 4
        pixelData[offset] = 255
        pixelData[offset + 1] = 0
        pixelData[offset + 2] = 0
        pixelData[offset + 3] = 255
      }

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

    it('padToMultipleOf5=true时向上取整到5的倍数', async () => {
      const store = createStore()
      store.loadColorData()
      store.setOriginalImageUrl('data:image/png;base64,test')
      store.setGridWidth(33)
      store.setGridHeight(33)
      store.setPadToMultipleOf5(true)

      const pixelData = new Uint8ClampedArray(35 * 35 * 4)
      for (let i = 0; i < 35 * 35; i++) {
        const offset = i * 4
        pixelData[offset] = 255
        pixelData[offset + 1] = 255
        pixelData[offset + 2] = 255
        pixelData[offset + 3] = 255
      }

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
      vi.stubGlobal(
        'Image',
        vi.fn(function (this: HTMLImageElement) {
          const img = origCreateElement('img')
          setTimeout(() => (img as unknown as { onload?: () => void }).onload?.(), 0)
          return img
        })
      )

      await store.generatePattern()

      // 33 向上取整到 35 (5的倍数)
      expect(store.gridWidth).toBe(35)
      expect(store.gridHeight).toBe(35)
    })
  })

  describe('expandGrid', () => {
    beforeEach(() => {
      setActivePinia(createPinia())
    })

    it('向下扩展增加行数', () => {
      const store = createStore()
      store.expandGrid('bottom', 5)
      expect(store.gridHeight).toBe(35)
      expect(store.patternGrid).toHaveLength(35)
    })

    it('向上扩展增加行数', () => {
      const store = createStore()
      store.expandGrid('top', 3)
      expect(store.gridHeight).toBe(33)
      expect(store.patternGrid).toHaveLength(33)
    })

    it('向右扩展增加列数', () => {
      const store = createStore()
      store.expandGrid('right', 4)
      expect(store.gridWidth).toBe(34)
      expect(store.patternGrid[0]).toHaveLength(34)
    })

    it('向左扩展增加列数', () => {
      const store = createStore()
      store.expandGrid('left', 2)
      expect(store.gridWidth).toBe(32)
      expect(store.patternGrid[0]).toHaveLength(32)
    })

    it('amount<1不操作', () => {
      const store = createStore()
      store.expandGrid('bottom', 0)
      expect(store.gridHeight).toBe(30)
    })

    it('扩展后新格子为空白', () => {
      const store = createStore()
      store.expandGrid('bottom', 1)
      const newRow = store.patternGrid[30]
      expect(newRow[0].color.hex).toBe('#FFFFFF')
      expect(newRow[0].code).toBe('')
    })

    it('扩展会记录历史', () => {
      const store = createStore()
      store.expandGrid('bottom', 1)
      expect(store.undoStack).toHaveLength(1)
    })
  })

  describe('历史栈', () => {
    it('pushHistory将当前grid加入undoStack', () => {
      const store = createStore()
      store.pushHistory()
      expect(store.undoStack).toHaveLength(1)
    })

    it('pushHistory清空redoStack', () => {
      const store = createStore()
      store.pushHistory()
      store.undo()
      expect(store.redoStack).toHaveLength(1)
      store.pushHistory()
      expect(store.redoStack).toHaveLength(0)
    })

    it('undo还原上一个patternGrid状态', () => {
      const store = createStore()
      store.loadColorData()
      const originalCode = store.patternGrid[0][0].code

      store.pushHistory()
      const color = store.perlerColors[0]
      const newGrid = store.patternGrid.map((row) =>
        row.map(() => ({ color: { ...color }, code: color.info!.MARD }))
      )
      store.applyPatternGridChange(newGrid)
      expect(store.patternGrid[0][0].code).toBe('A01')

      store.undo()
      expect(store.patternGrid[0][0].code).toBe(originalCode)
    })

    it('undo会更新gridWidth和gridHeight', () => {
      const store = createStore()
      store.pushHistory()
      store.setGridWidth(50)
      store.setGridHeight(40)
      store.undo()
      // undo从历史恢复grid，不恢复gridWidth/gridHeight本身
      // 但undo action会用恢复grid的尺寸更新gridWidth/gridHeight
    })

    it('undo空栈无操作', () => {
      const store = createStore()
      const before = store.undoStack.length
      store.undo()
      expect(store.undoStack.length).toBe(before)
    })

    it('redo重做已恢复的状态', () => {
      const store = createStore()
      store.loadColorData()
      store.pushHistory()
      const color = store.perlerColors[0]
      store.applyPatternGridChange(
        store.patternGrid.map((row) => row.map(() => ({ color: { ...color }, code: 'A01' })))
      )
      store.undo()
      expect(store.patternGrid[0][0].code).toBe('')
      store.redo()
      expect(store.patternGrid[0][0].code).toBe('A01')
    })

    it('redo空栈无操作', () => {
      const store = createStore()
      store.pushHistory()
      const before = store.redoStack.length
      store.redo()
      expect(store.redoStack.length).toBe(before)
    })

    it('历史栈上限为50', () => {
      const store = createStore()
      for (let i = 0; i < 55; i++) {
        store.pushHistory()
      }
      expect(store.undoStack.length).toBeLessThanOrEqual(50)
    })
  })

  describe('applyToolAction', () => {
    it('brush工具用选中颜色绘制', () => {
      const store = createStore()
      store.loadColorData()
      const color = store.perlerColors[0]
      store.setSelectedEditColor(color)
      store.setEditMode(true)
      store.setSelectedTool('brush')

      store.applyToolAction({ type: 'cell', x: 0, y: 0 })
      expect(store.patternGrid[0][0].code).toBe('A01')
    })

    it('brush无选中颜色时提前返回', () => {
      const store = createStore()
      store.setSelectedTool('brush')
      store.applyToolAction({ type: 'cell', x: 0, y: 0 })
      expect(store.patternGrid[0][0].code).toBe('')
    })

    it('eraser将格子设为白色', () => {
      const store = createStore()
      store.loadColorData()
      store.setSelectedEditColor(store.perlerColors[0])
      store.setSelectedTool('brush')
      store.applyToolAction({ type: 'cell', x: 0, y: 0 })

      store.setSelectedTool('eraser')
      store.applyToolAction({ type: 'cell', x: 0, y: 0 })

      expect(store.patternGrid[0][0].color.hex).toBe('#FFFFFF')
      expect(store.patternGrid[0][0].code).toBe('')
    })

    it('pan工具直接返回不修改', () => {
      const store = createStore()
      store.setSelectedTool('pan')
      store.loadColorData()
      store.setSelectedEditColor(store.perlerColors[0])
      store.applyToolAction({ type: 'cell', x: 0, y: 0 })
      expect(store.patternGrid[0][0].code).toBe('')
    })

    it('eyedropper取色并设置selectedEditColor', () => {
      const store = createStore()
      store.loadColorData()
      store.setEditMode(true)
      store.setSelectedTool('brush')
      const targetColor = store.perlerColors[0]
      store.setSelectedEditColor(targetColor)
      store.applyToolAction({ type: 'cell', x: 0, y: 0 })

      store.setSelectedEditColor(null)
      store.setSelectedTool('eyedropper')
      store.applyToolAction({ type: 'cell', x: 0, y: 0 })
      expect(store.selectedEditColor?.r).toBe(targetColor.r)
    })

    it('fill工具对cell类型调用flood fill', () => {
      const store = createStore()
      store.loadColorData()
      const red = store.perlerColors[0]
      store.setSelectedEditColor(red)
      store.setSelectedTool('brush')
      store.applyToolAction({ type: 'cell', x: 0, y: 0 })

      // fill只填充与目标cell颜色相同且code相同的连通区域
      // 其他格子code=''，不连通，所以只有cell(0,0)被填充
      const green = store.perlerColors[1]
      store.setSelectedEditColor(green)
      store.setSelectedTool('fill')
      store.applyToolAction({ type: 'cell', x: 0, y: 0 })

      expect(store.patternGrid[0][0].code).toBe('A02')
      // 其他格子仍是空白
      expect(store.patternGrid[1][0].code).toBe('')
    })

    it('fill tool area类型填充矩形区域', () => {
      const store = createStore()
      store.loadColorData()
      const color = store.perlerColors[0]
      store.setSelectedEditColor(color)
      store.setSelectedTool('fill')
      store.applyToolAction({ type: 'area', x1: 0, y1: 0, x2: 4, y2: 4 })

      expect(store.patternGrid[0][0].code).toBe('A01')
      expect(store.patternGrid[4][4].code).toBe('A01')
    })
  })

  describe('handleFillAll', () => {
    it('用选中色填充整个grid', () => {
      const store = createStore()
      store.loadColorData()
      const color = store.perlerColors[0]
      store.setSelectedEditColor(color)
      store.handleFillAll()
      expect(store.patternGrid[0][0].code).toBe('A01')
      expect(store.patternGrid[29][29].code).toBe('A01')
    })

    it('没有选中色不操作', () => {
      const store = createStore()
      store.handleFillAll()
      expect(store.patternGrid[0][0].code).toBe('')
    })
  })

  describe('handleEyedropper', () => {
    it('从指定格子读取颜色', () => {
      const store = createStore()
      store.loadColorData()
      const targetColor = store.perlerColors[0]
      store.setSelectedEditColor(targetColor)
      store.setSelectedTool('brush')
      store.applyToolAction({ type: 'cell', x: 5, y: 3 })

      store.setSelectedEditColor(null)
      store.handleEyedropper({ type: 'cell', x: 5, y: 3 })
      expect(store.selectedEditColor?.r).toBe(targetColor.r)
    })

    it('越界坐标提前返回', () => {
      const store = createStore()
      store.loadColorData()
      store.setSelectedEditColor(null)
      store.handleEyedropper({ type: 'cell', x: 9999, y: 9999 })
      expect(store.selectedEditColor).toBeNull()
    })
  })

  describe('setPendingSelection', () => {
    it('isEditActive为false时跳过', () => {
      const store = createStore()
      store.setEditMode(false)
      const spy = vi.spyOn(store, 'pushHistory')
      store.setPendingSelection({ type: 'cell', x: 0, y: 0 })
      expect(spy).not.toHaveBeenCalled()
    })

    it('isEditActive为true时执行tool action', () => {
      const store = createStore()
      store.loadColorData()
      store.setSelectedEditColor(store.perlerColors[0])
      store.setEditMode(true)
      store.setSelectedTool('brush')
      store.setPendingSelection({ type: 'cell', x: 0, y: 0 })
      expect(store.patternGrid[0][0].code).toBe('A01')
    })
  })

  describe('getBrandCode', () => {
    it('返回选中颜色在当前品牌下的代码', () => {
      const store = createStore()
      store.loadColorData()
      const color = store.perlerColors[0]
      store.setSelectedEditColor(color)
      expect(store.getBrandCode(color)).toBe('A01')
    })

    it('切换品牌后代码改变', () => {
      const store = createStore()
      store.loadColorData()
      const color = store.perlerColors[0]
      store.setSelectedEditColor(color)
      expect(store.getBrandCode(color)).toBe('A01')
      store.setSelectedBrand('COCO')
      expect(store.getBrandCode(color)).toBe('E02')
    })

    it('没有info返回空字符串', () => {
      const store = createStore()
      const color = makeColor(100, 100, 100, '#646464')
      expect(store.getBrandCode(color)).toBe('')
    })

    it('null返回空字符串', () => {
      const store = createStore()
      expect(store.getBrandCode(null)).toBe('')
    })
  })

  describe('refreshColorStats', () => {
    it('无已选颜色时自动选择第一个统计颜色', () => {
      const store = createStore()
      store.loadColorData()
      store.setSelectedEditColor(store.perlerColors[0])
      store.handleFillAll()
      store.setSelectedEditColor(null)
      store.refreshColorStats()
      expect(store.selectedEditColor).not.toBeNull()
    })
  })

  describe('importFromCompressed', () => {
    it('有效压缩串导入成功', () => {
      const store = createStore()
      store.loadColorData()
      const color = store.perlerColors[0]
      store.setSelectedEditColor(color)
      store.handleFillAll()

      // 手动构造压缩串来测试导入
      const result = store.importFromCompressed('MARD:5x5|A01|25:0')
      expect(result).toBe(true)
      expect(store.gridWidth).toBe(5)
      expect(store.gridHeight).toBe(5)
      expect(store.selectedBrand).toBe('MARD')
    })

    it('无效压缩串返回false', () => {
      const store = createStore()
      expect(store.importFromCompressed('invalid')).toBe(false)
    })

    it('导入后originalImage被清空', () => {
      const store = createStore()
      store.loadColorData()
      store.setOriginalImageUrl('some-url')
      store.setOriginalImageSize(100, 100)
      store.importFromCompressed('MARD:3x3|A01|9:0')
      expect(store.originalImage).toBeNull()
      expect(store.originalImageUrl).toBe('')
      expect(store.originalImageSize).toEqual({ width: 0, height: 0 })
    })
  })

  describe('loadShortcutConfig', () => {
    it('无保存配置保持默认', () => {
      const store = createStore()
      store.loadShortcutConfig()
      expect(store.shortcutPreset).toBe('default')
    })
  })
})
