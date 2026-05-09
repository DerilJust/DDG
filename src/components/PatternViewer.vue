<template>
  <div class="preview-section">
    <div class="canvas-wrapper">
      <div
        ref="containerRef"
        class="canvas-container"
        :style="{ cursor: isDragging ? 'grabbing' : 'grab' }"
        @wheel.prevent="handleWheel"
        @mousedown="handleMouseDown"
        @mousemove="handleMouseMove"
        @mouseup="handleMouseUp"
        @mouseleave="handleMouseUp"
      >
        <canvas
          id="focus-pattern-canvas"
          ref="patternCanvas"
          class="pattern-canvas"
        />

        <div class="floating-controls">
          <el-button size="small" circle title="缩小" @click="zoomOut"> - </el-button>
          <span class="zoom-display">{{ Math.round(viewScale * 100) }}%</span>
          <el-button size="small" circle title="放大" @click="zoomIn"> + </el-button>
          <el-button size="small" title="重置视图" @click="resetViewport"> 重置 </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useAppStore } from '../store/appStore'
import { storeToRefs } from 'pinia'

import { drawPatternToCanvas } from '../utils/patternRenderer'

const props = defineProps<{
  highlightedColorKeys: Set<string>
}>()

const appStore = useAppStore()
const { gridWidth, gridHeight, patternGrid, showNumbers } = storeToRefs(appStore)

const viewScale = ref<number>(1)
const viewOffsetX = ref<number>(0)
const viewOffsetY = ref<number>(0)
const isDragging = ref<boolean>(false)
const dragStartX = ref<number>(0)
const dragStartY = ref<number>(0)
const patternCanvas = ref<HTMLCanvasElement | null>(null)
const containerRef = ref<HTMLElement | null>(null)

let rafId: number | null = null

const cellSize = computed(() => (showNumbers.value ? 40 : 20))
const axisMargin = computed(() => (showNumbers.value ? 44 : 12))

const initCanvasSize = (): void => {
  if (!patternCanvas.value || !containerRef.value) return
  const cw = containerRef.value.clientWidth
  const ch = containerRef.value.clientHeight
  if (cw > 0 && ch > 0) {
    patternCanvas.value.width = cw
    patternCanvas.value.height = ch
  }
}

const scheduleRedraw = (): void => {
  if (rafId !== null) return
  rafId = requestAnimationFrame(() => {
    rafId = null
    if (patternGrid.value.length) {
      drawPattern()
    } else {
      drawPlaceholder()
    }
  })
}

const drawPlaceholder = (): void => {
  if (!patternCanvas.value) return
  const ctx = patternCanvas.value.getContext('2d')
  if (!ctx) return
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, patternCanvas.value.width, patternCanvas.value.height)
  ctx.fillStyle = '#dcdfe6'
  ctx.font = '16px "Microsoft YaHei", Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('请导入拼豆图纸', patternCanvas.value.width / 2, patternCanvas.value.height / 2)
}

const drawPattern = (): void => {
  if (!patternCanvas.value || !patternGrid.value.length) return
  const ctx = patternCanvas.value.getContext('2d')
  if (!ctx) return

  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, patternCanvas.value.width, patternCanvas.value.height)

  ctx.setTransform(viewScale.value, 0, 0, viewScale.value, viewOffsetX.value, viewOffsetY.value)

  drawPatternToCanvas(ctx, patternCanvas.value, patternGrid.value, {
    gridWidth: gridWidth.value,
    gridHeight: gridHeight.value,
    cellSize: cellSize.value,
    axisMargin: axisMargin.value,
    showNumbers: showNumbers.value,
    gridLineInterval: 5,
    highlightedColorKeys: props.highlightedColorKeys
  })

  ctx.setTransform(1, 0, 0, 1, 0, 0)
}

const fitToContainer = (): void => {
  if (!containerRef.value) return
  const cw = containerRef.value.clientWidth
  const ch = containerRef.value.clientHeight
  const pw = gridWidth.value * cellSize.value + axisMargin.value * 2
  const ph = gridHeight.value * cellSize.value + axisMargin.value * 2
  if (!pw || !ph || !cw || !ch) return

  viewScale.value = Math.min(cw / pw, ch / ph)
  viewScale.value = Math.max(0.5, Math.min(3, viewScale.value))
  viewOffsetX.value = (cw - pw * viewScale.value) / 2
  viewOffsetY.value = (ch - ph * viewScale.value) / 2
}

const handleWheel = (e: WheelEvent) => {
  if (e.ctrlKey || e.metaKey) {
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1
    const newScale = Math.max(0.5, Math.min(3, viewScale.value * zoomFactor))
    if (!containerRef.value) return
    const rect = containerRef.value.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    viewOffsetX.value = mouseX - (mouseX - viewOffsetX.value) * (newScale / viewScale.value)
    viewOffsetY.value = mouseY - (mouseY - viewOffsetY.value) * (newScale / viewScale.value)
    viewScale.value = newScale
    scheduleRedraw()
    return
  }
  viewOffsetY.value -= e.deltaY
  scheduleRedraw()
}

const handleMouseDown = (e: MouseEvent) => {
  isDragging.value = true
  dragStartX.value = e.clientX - viewOffsetX.value
  dragStartY.value = e.clientY - viewOffsetY.value
}

const handleMouseMove = (e: MouseEvent) => {
  if (isDragging.value) {
    viewOffsetX.value = e.clientX - dragStartX.value
    viewOffsetY.value = e.clientY - dragStartY.value
    scheduleRedraw()
  }
}

const handleMouseUp = (): void => {
  isDragging.value = false
}

const resetViewport = (): void => {
  fitToContainer()
  scheduleRedraw()
}

const zoomIn = (): void => {
  const newScale = Math.min(3, viewScale.value + 0.1)
  if (!containerRef.value) {
    viewScale.value = newScale
    scheduleRedraw()
    return
  }
  const rect = containerRef.value.getBoundingClientRect()
  const cx = rect.width / 2
  const cy = rect.height / 2
  viewOffsetX.value = cx - (cx - viewOffsetX.value) * (newScale / viewScale.value)
  viewOffsetY.value = cy - (cy - viewOffsetY.value) * (newScale / viewScale.value)
  viewScale.value = newScale
  scheduleRedraw()
}

const zoomOut = (): void => {
  const newScale = Math.max(0.5, viewScale.value - 0.1)
  if (!containerRef.value) {
    viewScale.value = newScale
    scheduleRedraw()
    return
  }
  const rect = containerRef.value.getBoundingClientRect()
  const cx = rect.width / 2
  const cy = rect.height / 2
  viewOffsetX.value = cx - (cx - viewOffsetX.value) * (newScale / viewScale.value)
  viewOffsetY.value = cy - (cy - viewOffsetY.value) * (newScale / viewScale.value)
  viewScale.value = newScale
  scheduleRedraw()
}

watch(
  () => props.highlightedColorKeys?.size ?? 0,
  () => scheduleRedraw()
)

watch(
  patternGrid,
  () => {
    scheduleRedraw()
    nextTick(() => fitToContainer())
  },
  { deep: true, immediate: true }
)

watch([gridWidth, gridHeight, cellSize, axisMargin], () => {
  if (!patternGrid.value.length) {
    initCanvasSize()
    scheduleRedraw()
    nextTick(() => fitToContainer())
  }
})

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  resizeObserver = new ResizeObserver(() => {
    initCanvasSize()
    fitToContainer()
    scheduleRedraw()
  })
  if (containerRef.value) resizeObserver.observe(containerRef.value)
  if (!patternGrid.value.length) {
    initCanvasSize()
    scheduleRedraw()
    nextTick(() => fitToContainer())
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
})
</script>

<style scoped>
.preview-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  min-height: 0;
  height: 100%;
  overflow: hidden;
  box-sizing: border-box;
}

.canvas-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e4e7ed;
  box-sizing: border-box;
}

.canvas-container {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f0f2f5 0%, #e6e8eb 100%);
  overflow: hidden;
  position: relative;
}

.pattern-canvas {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 4px;
}

.floating-controls {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(6px);
  padding: 6px 10px;
  border-radius: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.zoom-display {
  font-size: 12px;
  color: #606266;
  min-width: 40px;
  text-align: center;
  font-weight: 600;
}
</style>
