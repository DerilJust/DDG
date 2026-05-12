import { describe, it, expect, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import EditPalette from '../src/components/EditPalette.vue'
import ElementPlus from 'element-plus'
import type { PerlerColor, PaletteItem } from '../src/utils/patternUtils'

const makeColor = (r: number, g: number, b: number, hex: string): PerlerColor => ({
  r,
  g,
  b,
  hex,
  info: { MARD: 'A01' }
})

const makePaletteItem = (code: string, count: number, hex = '#FF0000'): PaletteItem => ({
  code,
  color: makeColor(255, 0, 0, hex),
  count
})

const defaultProps = {
  palette: [makePaletteItem('A01', 5), makePaletteItem('A02', 3)],
  brandPalette: [makePaletteItem('A01', 0), makePaletteItem('A02', 0), makePaletteItem('A03', 0)],
  activeColor: null as PerlerColor | null,
  editMode: false,
  selectedTool: 'brush' as const,
  canUndo: false,
  canRedo: false
}

describe('EditPalette', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('基础渲染', () => {
    it('渲染编辑器栏', () => {
      const wrapper = mount(EditPalette, {
        props: defaultProps,
        global: { plugins: [ElementPlus] }
      })
      expect(wrapper.find('.editor-bar').exists()).toBe(true)
    })

    it('渲染编辑模式开关', () => {
      const wrapper = mount(EditPalette, {
        props: defaultProps,
        global: { plugins: [ElementPlus] }
      })
      expect(wrapper.findComponent({ name: 'ElSwitch' }).exists()).toBe(true)
    })

    it('activeColor为null时显示未选择', () => {
      const wrapper = mount(EditPalette, {
        props: { ...defaultProps, activeColor: null },
        global: { plugins: [ElementPlus] }
      })
      expect(wrapper.find('.color-label').text()).toBe('未选择')
    })

    it('activeColor有值时显示hex', () => {
      const color = makeColor(255, 100, 50, '#FF6432')
      const wrapper = mount(EditPalette, {
        props: { ...defaultProps, activeColor: color },
        global: { plugins: [ElementPlus] }
      })
      expect(wrapper.find('.color-label').text()).toBe('#FF6432')
    })
  })

  describe('工具选择', () => {
    it('画笔按钮emit update:selectedTool', async () => {
      const wrapper = mount(EditPalette, {
        props: defaultProps,
        global: { plugins: [ElementPlus] }
      })
      const brushBtn = wrapper.findAll('.el-button').find((btn) => btn.text() === '画笔')
      await brushBtn?.trigger('click')
      expect(wrapper.emitted('update:selectedTool')?.[0]).toEqual(['brush'])
    })

    it('填充按钮emit update:selectedTool', async () => {
      const wrapper = mount(EditPalette, {
        props: defaultProps,
        global: { plugins: [ElementPlus] }
      })
      const fillBtn = wrapper.findAll('.el-button').find((btn) => btn.text() === '填充')
      await fillBtn?.trigger('click')
      expect(wrapper.emitted('update:selectedTool')?.[0]).toEqual(['fill'])
    })

    it('橡皮按钮emit update:selectedTool', async () => {
      const wrapper = mount(EditPalette, {
        props: defaultProps,
        global: { plugins: [ElementPlus] }
      })
      const eraserBtn = wrapper.findAll('.el-button').find((btn) => btn.text() === '橡皮')
      await eraserBtn?.trigger('click')
      expect(wrapper.emitted('update:selectedTool')?.[0]).toEqual(['eraser'])
    })

    it('吸管按钮emit update:selectedTool', async () => {
      const wrapper = mount(EditPalette, {
        props: defaultProps,
        global: { plugins: [ElementPlus] }
      })
      const eyedropperBtn = wrapper.findAll('.el-button').find((btn) => btn.text() === '吸管')
      await eyedropperBtn?.trigger('click')
      expect(wrapper.emitted('update:selectedTool')?.[0]).toEqual(['eyedropper'])
    })

    it('手形按钮emit update:selectedTool', async () => {
      const wrapper = mount(EditPalette, {
        props: defaultProps,
        global: { plugins: [ElementPlus] }
      })
      const panBtn = wrapper.findAll('.el-button').find((btn) => btn.text() === '手形')
      await panBtn?.trigger('click')
      expect(wrapper.emitted('update:selectedTool')?.[0]).toEqual(['pan'])
    })

    it('当前选中工具按钮为primary类型', () => {
      const wrapper = mount(EditPalette, {
        props: { ...defaultProps, selectedTool: 'eraser' },
        global: { plugins: [ElementPlus] }
      })
      const eraserBtn = wrapper.findAll('.el-button').find((btn) => btn.text() === '橡皮')
      expect(eraserBtn?.classes()).toContain('el-button--primary')
    })
  })

  describe('撤销/重做', () => {
    it('撤销按钮触发undo emit', async () => {
      const wrapper = mount(EditPalette, {
        props: { ...defaultProps, canUndo: true },
        global: { plugins: [ElementPlus] }
      })
      const undoBtn = wrapper.findAll('.el-button').find((btn) => btn.text() === '撤销')
      await undoBtn?.trigger('click')
      expect(wrapper.emitted('undo')).toBeTruthy()
    })

    it('重做按钮触发redo emit', async () => {
      const wrapper = mount(EditPalette, {
        props: { ...defaultProps, canRedo: true },
        global: { plugins: [ElementPlus] }
      })
      const redoBtn = wrapper.findAll('.el-button').find((btn) => btn.text() === '重做')
      await redoBtn?.trigger('click')
      expect(wrapper.emitted('redo')).toBeTruthy()
    })

    it('canUndo=false时撤销按钮禁用', () => {
      const wrapper = mount(EditPalette, {
        props: { ...defaultProps, canUndo: false },
        global: { plugins: [ElementPlus] }
      })
      const undoBtn = wrapper.findAll('.el-button').find((btn) => btn.text() === '撤销')
      expect(undoBtn?.attributes('disabled')).toBeDefined()
    })

    it('canRedo=false时重做按钮禁用', () => {
      const wrapper = mount(EditPalette, {
        props: { ...defaultProps, canRedo: false },
        global: { plugins: [ElementPlus] }
      })
      const redoBtn = wrapper.findAll('.el-button').find((btn) => btn.text() === '重做')
      expect(redoBtn?.attributes('disabled')).toBeDefined()
    })
  })

  describe('颜色选择', () => {
    it('点击palette-chip触发select emit', async () => {
      const palette = [makePaletteItem('A01', 5)]
      const wrapper = mount(EditPalette, {
        props: { ...defaultProps, palette },
        global: { plugins: [ElementPlus] }
      })
      const chip = wrapper.find('.palette-chip')
      await chip.trigger('click')
      expect(wrapper.emitted('select')).toBeTruthy()
      expect(wrapper.emitted('select')?.[0][0]).toHaveProperty('hex')
    })

    it('activeColor与chip颜色匹配时显示active类', () => {
      const color = makeColor(255, 0, 0, '#FF0000')
      const palette = [{ code: 'R01', color, count: 5 }]
      const wrapper = mount(EditPalette, {
        props: { ...defaultProps, palette, activeColor: color },
        global: { plugins: [ElementPlus] }
      })
      const chip = wrapper.find('.palette-chip')
      expect(chip.classes()).toContain('active')
    })
  })

  describe('全部填充', () => {
    it('全部填充按钮触发fill-all emit', async () => {
      const color = makeColor(255, 0, 0, '#FF0000')
      const wrapper = mount(EditPalette, {
        props: { ...defaultProps, activeColor: color },
        global: { plugins: [ElementPlus] }
      })
      const fillBtn = wrapper.find('.fill-all-btn')
      await fillBtn.trigger('click')
      expect(wrapper.emitted('fill-all')).toBeTruthy()
    })

    it('activeColor为null时fillAll按钮禁用', () => {
      const wrapper = mount(EditPalette, {
        props: { ...defaultProps, activeColor: null },
        global: { plugins: [ElementPlus] }
      })
      const fillBtn = wrapper.find('.fill-all-btn')
      expect(fillBtn.attributes('disabled')).toBeDefined()
    })
  })

  describe('调色板', () => {
    it('空palette显示提示文字', () => {
      const wrapper = mount(EditPalette, {
        props: { ...defaultProps, palette: [] },
        global: { plugins: [ElementPlus] }
      })
      expect(wrapper.text()).toContain('先生成图纸后即可选择颜色')
    })

    it('activePalette只显示count>0的颜色', () => {
      const palette = [
        makePaletteItem('A01', 5),
        makePaletteItem('A02', 0),
        makePaletteItem('A03', 3)
      ]
      const wrapper = mount(EditPalette, {
        props: { ...defaultProps, palette },
        global: { plugins: [ElementPlus] }
      })
      const chips = wrapper.findAll('.palette-strip .palette-chip')
      expect(chips).toHaveLength(2)
    })

    it('品牌调色板显示色系分组', () => {
      const brandPalette = [
        { code: 'A01', color: makeColor(255, 200, 0, '#FFC800'), count: 0 },
        { code: 'B01', color: makeColor(0, 200, 0, '#00C800'), count: 0 }
      ]
      const wrapper = mount(EditPalette, {
        props: { ...defaultProps, palette: [brandPalette[0]], brandPalette },
        global: { plugins: [ElementPlus] }
      })
      // 切换到全部颜色tab
      const tabs = wrapper.findAll('.el-tabs__item')
      const brandTab = tabs.find((t) => t.text() === '全部颜色')
      expect(brandTab).toBeDefined()
    })
  })

  describe('折叠按钮', () => {
    it('collapsed为undefined时不显示折叠按钮', () => {
      const wrapper = mount(EditPalette, {
        props: { ...defaultProps, collapsed: undefined },
        global: { plugins: [ElementPlus] }
      })
      const collapseBtn = wrapper
        .findAll('.el-button')
        .find((btn) => btn.text() === '展开调色板' || btn.text() === '收起调色板')
      expect(collapseBtn).toBeUndefined()
    })

    it('collapsed为true时显示展开调色板', () => {
      const wrapper = mount(EditPalette, {
        props: { ...defaultProps, collapsed: true },
        global: { plugins: [ElementPlus] }
      })
      const btn = wrapper.findAll('.el-button').find((btn) => btn.text() === '展开调色板')
      expect(btn).toBeDefined()
    })

    it('collapsed为false时显示收起调色板', () => {
      const wrapper = mount(EditPalette, {
        props: { ...defaultProps, collapsed: false },
        global: { plugins: [ElementPlus] }
      })
      const btn = wrapper.findAll('.el-button').find((btn) => btn.text() === '收起调色板')
      expect(btn).toBeDefined()
    })

    it('点击折叠按钮emit toggleCollapse', async () => {
      const wrapper = mount(EditPalette, {
        props: { ...defaultProps, collapsed: false },
        global: { plugins: [ElementPlus] }
      })
      const btn = wrapper.findAll('.el-button').find((btn) => btn.text() === '收起调色板')
      await btn?.trigger('click')
      expect(wrapper.emitted('toggleCollapse')).toBeTruthy()
    })
  })
})
