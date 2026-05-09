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

  watch(gridWidth, (_newWidth) => {
    if (ratioLocking.value) return
    if (lockAspectRatio.value) {
      appStore.setLockAspectRatio(false)
    }
  }, { flush: 'sync' })

  watch(gridHeight, (_newHeight) => {
    if (ratioLocking.value) return
    if (lockAspectRatio.value) {
      appStore.setLockAspectRatio(false)
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
