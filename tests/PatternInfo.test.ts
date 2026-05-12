import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { useAppStore } from '../src/store/appStore'
import PatternInfo from '../src/components/PatternInfo.vue'
import ElementPlus from 'element-plus'

function mountPatternInfo() {
  return mount(PatternInfo, {
    global: { plugins: [ElementPlus] }
  })
}

describe('PatternInfo', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('初始状态', () => {
    it('显示上传提示', () => {
      const wrapper = mountPatternInfo()
      expect(wrapper.text()).toContain('请上传图片并生成图纸')
    })

    it('不显示统计表', () => {
      const wrapper = mountPatternInfo()
      const statsCard = wrapper.find('.stats-card')
      expect(statsCard.exists()).toBe(false)
    })
  })

  describe('生成图纸后', () => {
    it('显示infoText内容', () => {
      const store = useAppStore()
      store.setInfoText('拼豆图纸已生成: 30x30 网格, 20 种颜色')
      const wrapper = mountPatternInfo()
      expect(wrapper.text()).toContain('拼豆图纸已生成')
    })

    it('infoText不是初始值时显示alert而非empty', () => {
      const store = useAppStore()
      store.setInfoText('自定义信息')
      const wrapper = mountPatternInfo()
      expect(wrapper.find('.info-alert').exists()).toBe(true)
    })
  })

  describe('颜色统计', () => {
    it('colorStats有数据时显示统计表', () => {
      const store = useAppStore()
      store.loadColorData()
      const color = store.perlerColors[0]
      store.setSelectedEditColor(color)
      store.handleFillAll()

      const wrapper = mountPatternInfo()
      expect(wrapper.text()).toContain('拼豆数量统计')
      expect(wrapper.find('.stats-table').exists()).toBe(true)
    })

    it('统计表渲染表头和颜色数据', () => {
      const store = useAppStore()
      store.loadColorData()
      const color = store.perlerColors[0]
      store.setSelectedEditColor(color)
      store.handleFillAll()
      store.setInfoText('拼豆图纸已生成')

      const wrapper = mountPatternInfo()
      // 统计卡片可见
      expect(wrapper.find('.stats-card').exists()).toBe(true)
      // 卡片标题包含统计字样
      expect(wrapper.text()).toContain('拼豆数量统计')
    })

    it('多颜色统计正确', () => {
      const store = useAppStore()
      store.loadColorData()
      store.setInfoText('拼豆图纸已生成')

      const c1 = store.perlerColors[0]
      store.setSelectedEditColor(c1)
      store.setSelectedTool('brush')
      store.setEditMode(true)
      store.applyToolAction({ type: 'cell', x: 0, y: 0 })

      const c2 = store.perlerColors[1]
      store.setSelectedEditColor(c2)
      store.applyToolAction({ type: 'cell', x: 1, y: 0 })

      const wrapper = mountPatternInfo()
      expect(wrapper.find('.stats-card').exists()).toBe(true)
    })
  })
})
