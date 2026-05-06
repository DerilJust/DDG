import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { useAppStore } from '../src/store/appStore'
import Controls from '../src/components/Controls.vue'
import ElementPlus from 'element-plus'

describe('Controls', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('初始渲染参数设置标题', () => {
    const wrapper = mount(Controls, {
      global: { plugins: [ElementPlus] }
    })
    expect(wrapper.text()).toContain('参数设置')
  })

  it('渲染生成图纸和下载按钮', () => {
    const wrapper = mount(Controls, {
      global: { plugins: [ElementPlus] }
    })
    expect(wrapper.text()).toContain('生成图纸')
    expect(wrapper.text()).toContain('下载')
  })

  it('显示品牌选项', () => {
    const wrapper = mount(Controls, {
      global: { plugins: [ElementPlus] }
    })
    const text = wrapper.text()
    expect(text).toContain('拼豆品牌')
  })

  it('显示锁定比例开关', () => {
    const wrapper = mount(Controls, {
      global: { plugins: [ElementPlus] }
    })
    expect(wrapper.text()).toContain('锁定比例')
  })

  it('显示图片比例', () => {
    const wrapper = mount(Controls, {
      global: { plugins: [ElementPlus] }
    })
    expect(wrapper.text()).toContain('图片比例')
  })
})
