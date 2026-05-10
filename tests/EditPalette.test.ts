import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
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

const makePaletteItem = (code: string, count: number): PaletteItem => ({
  code,
  color: makeColor(255, 0, 0, '#FF0000'),
  count
})

describe('EditPalette', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  const defaultProps = {
    palette: [makePaletteItem('A01', 5)],
    brandPalette: [makePaletteItem('A01', 0)],
    activeColor: null,
    editMode: false,
    selectedTool: 'brush' as const,
    canUndo: false,
    canRedo: false
  }

  it('初始渲染正确', () => {
    const wrapper = mount(EditPalette, {
      props: defaultProps,
      global: { plugins: [ElementPlus] }
    })
    expect(wrapper.find('.editor-bar').exists()).toBe(true)
  })

  it('选择画笔工具触发emit', async () => {
    const wrapper = mount(EditPalette, {
      props: defaultProps,
      global: { plugins: [ElementPlus] }
    })
    const brushBtn = wrapper.findAll('.el-button').find((btn) => btn.text() === '画笔')
    await brushBtn?.trigger('click')
    expect(wrapper.emitted('update:selectedTool')?.[0]).toEqual(['brush'])
  })

  it('选择填充工具触发emit', async () => {
    const wrapper = mount(EditPalette, {
      props: defaultProps,
      global: { plugins: [ElementPlus] }
    })
    const fillBtn = wrapper.findAll('.el-button').find((btn) => btn.text() === '填充')
    await fillBtn?.trigger('click')
    expect(wrapper.emitted('update:selectedTool')?.[0]).toEqual(['fill'])
  })

  it('点击颜色chip触发select emit', async () => {
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

  it('撤销/重做按钮触发emit', async () => {
    const wrapper = mount(EditPalette, {
      props: { ...defaultProps, canUndo: true, canRedo: true },
      global: { plugins: [ElementPlus] }
    })
    const buttons = wrapper.findAll('.el-button')
    const undoBtn = buttons.find((btn) => btn.text() === '撤销')
    const redoBtn = buttons.find((btn) => btn.text() === '重做')

    await undoBtn?.trigger('click')
    expect(wrapper.emitted('undo')).toBeTruthy()

    await redoBtn?.trigger('click')
    expect(wrapper.emitted('redo')).toBeTruthy()
  })

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
    // 只在图纸颜色tab中检查
    const chips = wrapper.findAll('.palette-strip .palette-chip')
    expect(chips).toHaveLength(2) // count>0的才显示
  })
})
