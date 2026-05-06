import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { useAppStore } from '../src/store/appStore'
import PatternInfo from '../src/components/PatternInfo.vue'
import ElementPlus from 'element-plus'

describe('PatternInfo', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('初始状态显示上传提示', () => {
    const wrapper = mount(PatternInfo, {
      global: {
        plugins: [ElementPlus]
      }
    })
    expect(wrapper.text()).toContain('请上传图片并生成图纸')
  })

  it('生成图纸后显示infoText', async () => {
    const store = useAppStore()
    store.loadColorData()
    store.setOriginalImageUrl('data:image/png;base64,test')
    const alertMock = vi.fn()
    vi.stubGlobal('alert', alertMock)

    // Mock Image + canvas
    const origCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string, _options?) => {
      if (tag === 'canvas') {
        const el = origCreateElement('canvas')
        vi.spyOn(el, 'getContext').mockReturnValue({
          drawImage: vi.fn(),
          getImageData: vi.fn().mockReturnValue({
            data: new Uint8ClampedArray(30 * 30 * 4)
          })
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
    vi.stubGlobal('Image', vi.fn(function (this: HTMLImageElement) {
      const img = origCreateElement('img')
      setTimeout(() => (img as unknown as { onload?: () => void }).onload?.(), 0)
      return img
    }))

    await store.generatePattern()

    const wrapper = mount(PatternInfo, {
      global: {
        plugins: [ElementPlus]
      }
    })
    expect(wrapper.text()).toContain('拼豆图纸已生成')
  })

  it('colorStats有数据显示统计表', async () => {
    const store = useAppStore()
    store.loadColorData()
    const color = store.perlerColors[0]
    store.setSelectedEditColor(color)
    store.handleFillAll()

    const wrapper = mount(PatternInfo, {
      global: {
        plugins: [ElementPlus]
      }
    })
    expect(wrapper.text()).toContain('拼豆数量统计')
  })
})
