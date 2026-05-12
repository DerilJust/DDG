import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useBreakpoint } from '../src/composables/useBreakpoint'
import { nextTick } from 'vue'

// Breakpoint 模块使用模块级单例，需要在测试间重置
// 我们通过直接操作 window.innerWidth 和触发 resize 事件来测试

const setWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width
  })
  window.dispatchEvent(new Event('resize'))
}

describe('useBreakpoint', () => {
  const originalWidth = window.innerWidth

  afterEach(() => {
    // 恢复原始宽度
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalWidth
    })
  })

  describe('断点检测', () => {
    it('宽度<=767返回isMobile', async () => {
      setWidth(500)
      const { isMobile, isTablet, isDesktop } = useBreakpoint()
      await nextTick()
      expect(isMobile.value).toBe(true)
      expect(isTablet.value).toBe(false)
      expect(isDesktop.value).toBe(false)
    })

    it('宽度768-1023返回isTablet', async () => {
      setWidth(800)
      const { isMobile, isTablet, isDesktop } = useBreakpoint()
      await nextTick()
      expect(isMobile.value).toBe(false)
      expect(isTablet.value).toBe(true)
      expect(isDesktop.value).toBe(false)
    })

    it('宽度>=1024返回isDesktop', async () => {
      setWidth(1200)
      const { isMobile, isTablet, isDesktop } = useBreakpoint()
      await nextTick()
      expect(isMobile.value).toBe(false)
      expect(isTablet.value).toBe(false)
      expect(isDesktop.value).toBe(true)
    })

    it('边界值767返回mobile', async () => {
      setWidth(767)
      const { isMobile } = useBreakpoint()
      await nextTick()
      expect(isMobile.value).toBe(true)
    })

    it('边界值768返回tablet', async () => {
      setWidth(768)
      const { isTablet } = useBreakpoint()
      await nextTick()
      expect(isTablet.value).toBe(true)
    })

    it('边界值1023返回tablet', async () => {
      setWidth(1023)
      const { isTablet } = useBreakpoint()
      await nextTick()
      expect(isTablet.value).toBe(true)
    })

    it('边界值1024返回desktop', async () => {
      setWidth(1024)
      const { isDesktop } = useBreakpoint()
      await nextTick()
      expect(isDesktop.value).toBe(true)
    })
  })

  describe('断点单例复用', () => {
    it('多次调用返回值一致', () => {
      setWidth(800)
      const a = useBreakpoint()
      const b = useBreakpoint()
      expect(a.isMobile.value).toBe(b.isMobile.value)
      expect(a.isTablet.value).toBe(b.isTablet.value)
      expect(a.isDesktop.value).toBe(b.isDesktop.value)
    })
  })
})
