import { ref, computed, type Ref, type ComputedRef } from 'vue'

export type Breakpoint = 'mobile' | 'tablet' | 'desktop'

const MOBILE_MAX = 767
const TABLET_MAX = 1023

const breakpoint: Ref<Breakpoint> = ref('desktop')

function updateBreakpoint() {
  const width = window.innerWidth
  if (width <= MOBILE_MAX) {
    breakpoint.value = 'mobile'
  } else if (width <= TABLET_MAX) {
    breakpoint.value = 'tablet'
  } else {
    breakpoint.value = 'desktop'
  }
}

let _initialized = false

function ensureInit() {
  if (_initialized) return
  _initialized = true
  updateBreakpoint()
  window.addEventListener('resize', updateBreakpoint)
}

export function useBreakpoint(): {
  breakpoint: Ref<Breakpoint>
  isMobile: ComputedRef<boolean>
  isTablet: ComputedRef<boolean>
  isDesktop: ComputedRef<boolean>
} {
  ensureInit()

  const isMobile = computed(() => breakpoint.value === 'mobile')
  const isTablet = computed(() => breakpoint.value === 'tablet')
  const isDesktop = computed(() => breakpoint.value === 'desktop')

  return { breakpoint, isMobile, isTablet, isDesktop }
}
