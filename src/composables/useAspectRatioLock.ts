import { computed, ref, watch, type Ref, type ComputedRef } from 'vue'
import { storeToRefs } from 'pinia'
import { useAppStore } from '../store/appStore'
import { ceilToMultipleOf5, gcd } from '../utils/patternUtils'

export function useAspectRatioLock(fallbackImageSize?: Ref<{ width: number; height: number }>): {
  imageRatio: ComputedRef<string>
} {
  const appStore = useAppStore()
  const { gridWidth, gridHeight, lockAspectRatio, originalImageSize } = storeToRefs(appStore)

  const ratioLocking = ref(false)

  const effectiveAspectRatio = computed(() => {
    if (fallbackImageSize?.value?.width && fallbackImageSize.value.width > 0) {
      return fallbackImageSize.value.width / fallbackImageSize.value.height
    }
    if (originalImageSize.value.width > 0) {
      return originalImageSize.value.width / originalImageSize.value.height
    }
    return 1
  })

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

  watch(gridWidth, (newWidth) => {
    if (!lockAspectRatio.value || ratioLocking.value) return
    const aspectRatio = effectiveAspectRatio.value
    if (isNaN(aspectRatio)) return
    ratioLocking.value = true
    appStore.setGridHeight(ceilToMultipleOf5(Math.max(5, Math.round(newWidth / aspectRatio))))
    ratioLocking.value = false
  })

  watch(gridHeight, (newHeight) => {
    if (!lockAspectRatio.value || ratioLocking.value) return
    const aspectRatio = effectiveAspectRatio.value
    if (isNaN(aspectRatio)) return
    ratioLocking.value = true
    appStore.setGridWidth(ceilToMultipleOf5(Math.max(5, Math.round(newHeight * aspectRatio))))
    ratioLocking.value = false
  })

  return { imageRatio }
}
