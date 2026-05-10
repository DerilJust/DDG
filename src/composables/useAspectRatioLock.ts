import { computed, ref, watch, type Ref, type ComputedRef } from 'vue'
import { storeToRefs } from 'pinia'
import { useAppStore } from '../store/appStore'
import { gcd } from '../utils/patternUtils'

export function useAspectRatioLock(fallbackImageSize?: Ref<{ width: number; height: number }>): {
  imageRatio: ComputedRef<string>
  guardedSetGridWidth: (w: number) => void
  guardedSetGridHeight: (h: number) => void
} {
  const appStore = useAppStore()
  const { gridWidth, gridHeight, lockAspectRatio, originalImageSize } = storeToRefs(appStore)

  const ratioLocking = ref(false)

  const imageRatio = computed<string>(() => {
    const storeSize = originalImageSize.value
    if (storeSize.width && storeSize.height) {
      const ratio = gcd(storeSize.width, storeSize.height)
      return `${storeSize.width / ratio}:${storeSize.height / ratio}`
    }
    if (fallbackImageSize) {
      const fallback = fallbackImageSize.value
      if (fallback.width && fallback.height) {
        const ratio = gcd(fallback.width, fallback.height)
        return `${fallback.width / ratio}:${fallback.height / ratio}`
      }
    }
    return '暂无图片'
  })

  function getEffectiveImageSize(): { width: number; height: number } {
    const storeSize = originalImageSize.value
    if (storeSize.width && storeSize.height) return storeSize
    if (fallbackImageSize) {
      const fallback = fallbackImageSize.value
      if (fallback.width && fallback.height) return fallback
    }
    return { width: 0, height: 0 }
  }

  watch(gridWidth, (newWidth) => {
    if (ratioLocking.value) return
    if (lockAspectRatio.value) {
      const size = getEffectiveImageSize()
      if (!size.width || !size.height) return
      const ratio = size.width / size.height
      guardedSetGridHeight(Math.max(5, Math.round(newWidth / ratio)))
    }
  }, { flush: 'sync' })

  watch(gridHeight, (newHeight) => {
    if (ratioLocking.value) return
    if (lockAspectRatio.value) {
      const size = getEffectiveImageSize()
      if (!size.width || !size.height) return
      const ratio = size.width / size.height
      guardedSetGridWidth(Math.max(5, Math.round(newHeight * ratio)))
    }
  }, { flush: 'sync' })

  function guardedSetGridWidth(w: number) {
    ratioLocking.value = true
    appStore.setGridWidth(w)
    ratioLocking.value = false
  }

  function guardedSetGridHeight(h: number) {
    ratioLocking.value = true
    appStore.setGridHeight(h)
    ratioLocking.value = false
  }

  return { imageRatio, guardedSetGridWidth, guardedSetGridHeight }
}
