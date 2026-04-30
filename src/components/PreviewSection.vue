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
          id="pattern-canvas"
          ref="patternCanvas"
          class="pattern-canvas"
          @pointerdown.stop="handleCanvasPointerDown"
          @pointermove="handleCanvasPointerMove"
          @pointerup="handleCanvasPointerUp"
          @pointerleave="handleCanvasPointerUp"
        />

        <div v-if="selectionStart" class="selection-overlay" :style="selectionOverlayStyle" />

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

interface Point {
  x: number
  y: number
  inGrid?: boolean
}

const appStore = useAppStore()
const { gridWidth, gridHeight, patternGrid, editMode, showNumbers } = storeToRefs(appStore)

const viewScale = ref<number>(1)
const viewOffsetX = ref<number>(0)
const viewOffsetY = ref<number>(0)
const isDragging = ref<boolean>(false)
const dragStartX = ref<number>(0)
const dragStartY = ref<number>(0)
const patternCanvas = ref<HTMLCanvasElement | null>(null)
const containerRef = ref<HTMLElement | null>(null)
const pointerDown = ref<boolean>(false)
const selectionStart = ref<Point | null>(null)
const selectionEnd = ref<Point | null>(null)

let rafId: number | null = null

const cellSize = computed(() => (showNumbers.value ? 40 : 20))
const axisMargin = computed(() => (showNumbers.value ? 44 : 12))

const getDisplayScale = (): { x: number; y: number } => {
  return { x: viewScale.value, y: viewScale.value }
}

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
  ctx.fillText('请先生成拼豆图纸', patternCanvas.value.width / 2, patternCanvas.value.height / 2)
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
    gridLineInterval: 5
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

const selectionOverlayStyle = computed<Record<string, string>>(() => {
  if (!selectionStart.value)
    return { display: 'none', left: '0', top: '0', width: '0', height: '0' }
  const end = selectionEnd.value || selectionStart.value
  const minX = Math.min(selectionStart.value.x, end.x)
  const minY = Math.min(selectionStart.value.y, end.y)
  const maxX = Math.max(selectionStart.value.x, end.x)
  const maxY = Math.max(selectionStart.value.y, end.y)

  const left = viewOffsetX.value + viewScale.value * (axisMargin.value + minX * cellSize.value)
  const top = viewOffsetY.value + viewScale.value * (axisMargin.value + minY * cellSize.value)
  const width = viewScale.value * (maxX - minX + 1) * cellSize.value
  const height = viewScale.value * (maxY - minY + 1) * cellSize.value

  return {
    display: 'block',
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`
  }
})

const getCanvasPointerPos = (e: PointerEvent): { x: number; y: number } => {
  if (!patternCanvas.value) return { x: 0, y: 0 }
  const rect = patternCanvas.value.getBoundingClientRect()
  const canvasX = e.clientX - rect.left
  const canvasY = e.clientY - rect.top
  return {
    x: (canvasX - viewOffsetX.value) / viewScale.value,
    y: (canvasY - viewOffsetY.value) / viewScale.value
  }
}

const getGridCell = (e: PointerEvent): Point | null => {
  const pointer = getCanvasPointerPos(e)
  const x = Math.floor((pointer.x - axisMargin.value) / cellSize.value)
  const y = Math.floor((pointer.y - axisMargin.value) / cellSize.value)
  const inGrid = x >= 0 && x < gridWidth.value && y >= 0 && y < gridHeight.value
  return { x, y, inGrid }
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
  if (editMode.value) return
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

const handleCanvasPointerDown = (e: PointerEvent) => {
  if (!editMode.value || !patternCanvas.value) return
  e.preventDefault()
  const cell = getGridCell(e)
  if (!cell || !cell.inGrid) return
  pointerDown.value = true
  selectionStart.value = { x: cell.x, y: cell.y }
  selectionEnd.value = { x: cell.x, y: cell.y }
  if (patternCanvas.value.setPointerCapture) {
    patternCanvas.value.setPointerCapture(e.pointerId)
  }
}

const handleCanvasPointerMove = (e: PointerEvent) => {
  if (!editMode.value || !pointerDown.value) return
  e.preventDefault()
  const cell = getGridCell(e)
  if (!cell) return
  const clampedX = Math.max(0, Math.min(gridWidth.value - 1, cell.x))
  const clampedY = Math.max(0, Math.min(gridHeight.value - 1, cell.y))
  if (selectionEnd.value?.x === clampedX && selectionEnd.value?.y === clampedY) return
  selectionEnd.value = { x: clampedX, y: clampedY }
}

const handleCanvasPointerUp = (e: PointerEvent) => {
  if (!editMode.value || !selectionStart.value) return
  pointerDown.value = false
  if (patternCanvas.value && e?.pointerId != null && patternCanvas.value.releasePointerCapture) {
    patternCanvas.value.releasePointerCapture(e.pointerId)
  }

  const start = selectionStart.value
  const end = selectionEnd.value || start

  if (start.x === end.x && start.y === end.y) {
    appStore.setPendingSelection({ type: 'cell', x: start.x, y: start.y })
  } else {
    appStore.setPendingSelection({ type: 'area', x1: start.x, y1: start.y, x2: end.x, y2: end.y })
  }

  selectionStart.value = null
  selectionEnd.value = null
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

const getFullResCanvas = (): HTMLCanvasElement | null => {
  if (!patternGrid.value.length) return null
  const pw = gridWidth.value * cellSize.value + axisMargin.value * 2
  const ph = gridHeight.value * cellSize.value + axisMargin.value * 2
  const c = document.createElement('canvas')
  c.width = pw
  c.height = ph
  const ctx = c.getContext('2d')
  if (!ctx) return null
  drawPatternToCanvas(ctx, c, patternGrid.value, {
    gridWidth: gridWidth.value,
    gridHeight: gridHeight.value,
    cellSize: cellSize.value,
    axisMargin: axisMargin.value,
    showNumbers: showNumbers.value,
    gridLineInterval: 5
  })
  return c
}

watch(editMode, (value) => {
  if (!value) {
    pointerDown.value = false
    selectionStart.value = null
    selectionEnd.value = null
  }
})

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

defineExpose({
  get patternCanvas() {
    return patternCanvas.value
  },
  scale: viewScale,
  offsetX: viewOffsetX,
  offsetY: viewOffsetY,
  resetViewport,
  getDisplayScale,
  getFullResCanvas
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

.canvas-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: radial-gradient(
    circle at 25% 25%,
    rgba(255, 255, 255, 0.8) 0%,
    rgba(255, 255, 255, 0) 50%
  );
  pointer-events: none;
}

.pattern-canvas {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 4px;
}

.selection-overlay {
  position: absolute;
  border: 2px dashed rgba(64, 158, 255, 0.95);
  background-color: rgba(64, 158, 255, 0.18);
  pointer-events: none;
  box-sizing: border-box;
  z-index: 10;
}

.selection-overlay.area {
  background-color: rgba(64, 158, 255, 0.12);
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
