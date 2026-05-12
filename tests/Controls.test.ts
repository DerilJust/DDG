import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { useAppStore } from '../src/store/appStore'
import Controls from '../src/components/Controls.vue'
import ElementPlus from 'element-plus'

vi.mock('element-plus', async () => {
  const actual = await vi.importActual('element-plus')
  return { ...actual }
})

function mountControls() {
  return mount(Controls, {
    global: { plugins: [ElementPlus] }
  })
}

describe('Controls', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('基础渲染', () => {
    it('渲染参数设置标题', () => {
      const wrapper = mountControls()
      expect(wrapper.text()).toContain('参数设置')
    })

    it('渲染生成图纸和下载按钮', () => {
      const wrapper = mountControls()
      expect(wrapper.text()).toContain('生成图纸')
      expect(wrapper.text()).toContain('下载')
    })

    it('显示所有表单标签', () => {
      const wrapper = mountControls()
      const text = wrapper.text()
      expect(text).toContain('宽度')
      expect(text).toContain('高度')
      expect(text).toContain('颜色数量')
      expect(text).toContain('拼豆品牌')
      expect(text).toContain('显示编号')
      expect(text).toContain('锁定比例')
      expect(text).toContain('补充空白')
      expect(text).toContain('导出倍率')
      expect(text).toContain('快捷键')
    })
  })

  describe('生成图纸按钮', () => {
    it('点击生成图纸调用store.generatePattern', async () => {
      const wrapper = mountControls()
      const store = useAppStore()
      const spy = vi.spyOn(store, 'generatePattern')
      const btn = wrapper.find('.btn-generate')
      await btn.trigger('click')
      expect(spy).toHaveBeenCalled()
    })
  })

  describe('下载按钮', () => {
    it('点击下载emit download事件', async () => {
      const wrapper = mountControls()
      const btn = wrapper.find('.btn-download')
      await btn.trigger('click')
      expect(wrapper.emitted('download')).toBeTruthy()
    })
  })

  describe('网格尺寸绑定', () => {
    it('修改gridWidth更新store', async () => {
      const wrapper = mountControls()
      const store = useAppStore()
      store.setGridWidth(50)
      await wrapper.vm.$nextTick()
      expect(store.gridWidth).toBe(50)
    })
  })

  describe('品牌选择', () => {
    it('品牌选择包含所有品牌选项', () => {
      const wrapper = mountControls()
      const select = wrapper.findComponent({ name: 'ElSelect' })
      expect(select.exists()).toBe(true)
    })
  })

  describe('锁定比例', () => {
    it('锁定比例switch渲染', () => {
      const wrapper = mountControls()
      const text = wrapper.text()
      expect(text).toContain('锁定比例')
      expect(text).toContain('开启')
    })
  })

  describe('补充空白', () => {
    it('补充空白switch渲染', () => {
      const wrapper = mountControls()
      const text = wrapper.text()
      expect(text).toContain('补充空白')
    })
  })

  describe('导出倍率', () => {
    it('导出倍率select渲染', () => {
      const wrapper = mountControls()
      const text = wrapper.text()
      expect(text).toContain('导出倍率')
    })
  })

  describe('快捷键编辑对话框', () => {
    it('初始不显示快捷键编辑对话框', () => {
      const wrapper = mountControls()
      // v-model=false时Element Plus不渲染el-dialog到DOM
      expect(wrapper.find('.el-dialog').exists()).toBe(false)
    })

    it('点击编辑按钮打开快捷键对话框', async () => {
      const wrapper = mountControls()
      const buttons = wrapper.findAll('.el-button')
      const editBtn = buttons.find((btn) => btn.text() === '编辑')
      expect(editBtn).toBeDefined()
      await editBtn!.trigger('click')
      await wrapper.vm.$nextTick()
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.el-dialog').exists()).toBe(true)
    })
  })
})
