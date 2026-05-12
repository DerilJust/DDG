<template>
  <div class="preview-section">
    <div class="canvas-wrapper">
      <div
        ref="containerRef"
        class="canvas-container"
        :style="{ cursor: editCursor }"
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

        <div v-if="showSelectionOverlay" class="selection-overlay" :style="selectionOverlayStyle" />

        <div class="floating-controls">
          <el-button size="small" circle title="缩小" @click="zoomOut"> - </el-button>
          <span class="zoom-display">{{ Math.round(viewScale * 100) }}%</span>
          <el-button size="small" circle title="放大" @click="zoomIn"> + </el-button>
          <el-button size="small" title="重置视图" @click="resetViewport"> 重置 </el-button>
        </div>

        <template v-if="editMode && patternGrid.length">
          <div
            class="edge-handle edge-handle-top"
            :style="edgeTopStyle"
            @pointerdown.stop.prevent="startEdgeDrag('top', $event)"
            @pointermove="handleEdgeDragMove($event)"
            @pointerup="handleEdgeDragUp"
            @pointerleave="handleEdgeDragUp"
          />
          <div
            class="edge-handle edge-handle-bottom"
            :style="edgeBottomStyle"
            @pointerdown.stop.prevent="startEdgeDrag('bottom', $event)"
            @pointermove="handleEdgeDragMove($event)"
            @pointerup="handleEdgeDragUp"
            @pointerleave="handleEdgeDragUp"
          />
          <div
            class="edge-handle edge-handle-left"
            :style="edgeLeftStyle"
            @pointerdown.stop.prevent="startEdgeDrag('left', $event)"
            @pointermove="handleEdgeDragMove($event)"
            @pointerup="handleEdgeDragUp"
            @pointerleave="handleEdgeDragUp"
          />
          <div
            class="edge-handle edge-handle-right"
            :style="edgeRightStyle"
            @pointerdown.stop.prevent="startEdgeDrag('right', $event)"
            @pointermove="handleEdgeDragMove($event)"
            @pointerup="handleEdgeDragUp"
            @pointerleave="handleEdgeDragUp"
          />
          <div v-if="edgeDragPreview" class="edge-drag-preview" :style="edgeDragPreviewStyle" />
        </template>
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
const { gridWidth, gridHeight, patternGrid, editMode, showNumbers, selectedTool } =
  storeToRefs(appStore)

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

// SVG custom cursors — tool tips aligned to hotspot for intuitive clicking
const CURSOR_BRUSH =
  'url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScyNCcgaGVpZ2h0PScyNCcgdmlld0JveD0nMCAwIDI0IDI0Jz48bGluZSB4MT0nNycgeTE9JzcnIHgyPScyMCcgeTI9JzIwJyBzdHJva2U9JyNjNDlhM2MnIHN0cm9rZS13aWR0aD0nMi41JyBzdHJva2UtbGluZWNhcD0ncm91bmQnLz48cG9seWdvbiBwb2ludHM9JzcsNyAyLDUgNiwyIDksNScgZmlsbD0nIzQwOWVmZicgc3Ryb2tlPScjMmM3ZmQ4JyBzdHJva2Utd2lkdGg9JzAuOCcvPjwvc3ZnPg==) 4 4, default'
const CURSOR_ERASER =
  'url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScyNCcgaGVpZ2h0PScyNCcgdmlld0JveD0nMCAwIDI0IDI0Jz48cmVjdCB4PSc1JyB5PSc2JyB3aWR0aD0nMTQnIGhlaWdodD0nMTUnIHJ4PScyJyBmaWxsPScjZjI5YzljJyBzdHJva2U9JyNlMDYwNjAnIHN0cm9rZS13aWR0aD0nMS4yJy8+PHJlY3QgeD0nNScgeT0nMTYnIHdpZHRoPScxNCcgaGVpZ2h0PSc1JyByeD0nMScgZmlsbD0nIzNiODJmNicvPjxyZWN0IHg9JzcnIHk9JzE3JyB3aWR0aD0nMTAnIGhlaWdodD0nMS41JyByeD0nMC41JyBmaWxsPScjZmZmJyBvcGFjaXR5PScwLjQnLz48cmVjdCB4PSc1JyB5PSc3JyB3aWR0aD0nMTQnIGhlaWdodD0nMS41JyByeD0nMC41JyBmaWxsPScjZTA2MDYwJyBvcGFjaXR5PScwLjQnLz48L3N2Zz4=) 4 4, crosshair'
const CURSOR_FILL =
  'url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScyNCcgaGVpZ2h0PScyNCcgdmlld0JveD0nMCAwIDI0IDI0Jz48ZWxsaXBzZSBjeD0nNicgY3k9JzUnIHJ4PSc0JyByeT0nMi41JyBmaWxsPScjOWNhM2FmJyBzdHJva2U9JyM2YjcyODAnIHN0cm9rZS13aWR0aD0nMC43Jy8+PHBhdGggZD0nTTIgNSBMMyAxNiBRNyAxOSAxMCAxNiBMMTAgNScgZmlsbD0nI2QxZDVkYicgc3Ryb2tlPScjNmI3MjgwJyBzdHJva2Utd2lkdGg9JzAuNycgc3Ryb2tlLWxpbmVqb2luPSdyb3VuZCcvPjxwYXRoIGQ9J00yIDkgUTYgMTIgMTAgOScgZmlsbD0nbm9uZScgc3Ryb2tlPScjOWNhM2FmJyBzdHJva2Utd2lkdGg9JzAuNScvPjxwYXRoIGQ9J00yIDEyIFE2IDE1IDEwIDEyJyBmaWxsPSdub25lJyBzdHJva2U9JyM5Y2EzYWYnIHN0cm9rZS13aWR0aD0nMC41Jy8+PGNpcmNsZSBjeD0nMycgY3k9JzYnIHI9JzEuMycgZmlsbD0nI2ZiYmYyNCcgc3Ryb2tlPScjZjU5ZTBiJyBzdHJva2Utd2lkdGg9JzAuNScvPjwvc3ZnPg==) 4 8, cell'
const CURSOR_EYEDROPPER =
  'url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScyNCcgaGVpZ2h0PScyNCcgdmlld0JveD0nMCAwIDI0IDI0Jz48bGluZSB4MT0nMTknIHkxPScxNycgeDI9JzUnIHkyPSc0LjUnIHN0cm9rZT0nIzk0YTNiOCcgc3Ryb2tlLXdpZHRoPScyLjUnIHN0cm9rZS1saW5lY2FwPSdyb3VuZCcvPjxjaXJjbGUgY3g9JzUnIGN5PSc0LjUnIHI9JzInIGZpbGw9JyNmYmJmMjQnIHN0cm9rZT0nI2Y1OWUwYicgc3Ryb2tlLXdpZHRoPScwLjgnLz48bGluZSB4MT0nMTcnIHkxPScxOCcgeDI9JzIwJyB5Mj0nMTUnIHN0cm9rZT0nIzk0YTNiOCcgc3Ryb2tlLXdpZHRoPScyJyBzdHJva2UtbGluZWNhcD0ncm91bmQnLz48L3N2Zz4=) 4 4, pointer'
const CURSOR_HAND_CLOSED =
  'url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScyNCcgaGVpZ2h0PScyNCcgdmlld0JveD0nMCAwIDI0IDI0Jz48cGF0aCBkPSdNMTYgOVY1YTIgMiAwIDAgMC00IDBsLTIgNy0yLTFhMiAyIDAgMCAwLTMgMS41bDMgOWEyLjUgMi41IDAgMCAwIDIuNSAxLjVoNGEzLjUgMy41IDAgMCAwIDMuNS0zLjVWMTJhMi41IDIuNSAwIDAgMC0yLjUtMi41JyBmaWxsPScjZmJiZjI0JyBmaWxsLW9wYWNpdHk9JzAuODUnIHN0cm9rZT0nI2Q5NzcwNicgc3Ryb2tlLXdpZHRoPScwLjgnLz48L3N2Zz4=) 12 14, grabbing'
const CURSOR_HAND_OPEN =
  'url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScyNCcgaGVpZ2h0PScyNCcgdmlld0JveD0nMCAwIDI0IDI0Jz48cGF0aCBkPSdNOCAxMFY2YTIgMiAwIDAgMSA0IDB2MWwxLTFhMiAyIDAgMCAxIDMgMHYzaDFhMi41IDIuNSAwIDAgMSAyLjUgMi41djMuNWE0IDQgMCAwIDEtNCA0SDEwYTMgMyAwIDAgMS0zLTNMNCAxMWEyIDIgMCAwIDEgMy0xLjVsMSAwLjVWOGEyIDIgMCAwIDEgMy0xLjUnIGZpbGw9JyNmYmJmMjQnIGZpbGwtb3BhY2l0eT0nMC44NScgc3Ryb2tlPScjZDk3NzA2JyBzdHJva2Utd2lkdGg9JzAuOCcvPjwvc3ZnPg==) 12 14, grab'

const editCursor = computed(() => {
  if (!editMode.value) return isDragging.value ? CURSOR_HAND_CLOSED : CURSOR_HAND_OPEN
  switch (selectedTool.value) {
    case 'brush':
      return CURSOR_BRUSH
    case 'eraser':
      return CURSOR_ERASER
    case 'fill':
      return CURSOR_FILL
    case 'eyedropper':
      return CURSOR_EYEDROPPER
    case 'pan':
      return isDragging.value ? CURSOR_HAND_CLOSED : CURSOR_HAND_OPEN
    default:
      return 'default'
  }
})
const showCoordBorder = computed(() => true)
const cellSize = computed(() => (showNumbers.value ? 40 : 20))
const axisMargin = computed(() => 12)
const borderOffset = computed(() => 1)

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
    showCoordinateBorder: showCoordBorder.value,
    gridLineInterval: 5
  })

  ctx.setTransform(1, 0, 0, 1, 0, 0)
}

const fitToContainer = (): void => {
  if (!containerRef.value) return
  const cw = containerRef.value.clientWidth
  const ch = containerRef.value.clientHeight
  const effW = gridWidth.value + borderOffset.value * 2
  const effH = gridHeight.value + borderOffset.value * 2
  const pw = effW * cellSize.value + axisMargin.value * 2
  const ph = effH * cellSize.value + axisMargin.value * 2
  if (!pw || !ph || !cw || !ch) return

  viewScale.value = Math.min(cw / pw, ch / ph)
  viewScale.value = Math.max(0.5, Math.min(3, viewScale.value))
  viewOffsetX.value = (cw - pw * viewScale.value) / 2
  viewOffsetY.value = (ch - ph * viewScale.value) / 2
}

const showSelectionOverlay = computed(() => {
  if (!selectionStart.value || !selectionEnd.value) return false
  return (
    selectionStart.value.x !== selectionEnd.value.x ||
    selectionStart.value.y !== selectionEnd.value.y
  )
})

const selectionOverlayStyle = computed<Record<string, string>>(() => {
  if (!selectionStart.value)
    return { display: 'none', left: '0', top: '0', width: '0', height: '0' }
  const end = selectionEnd.value || selectionStart.value
  const minX = Math.min(selectionStart.value.x, end.x)
  const minY = Math.min(selectionStart.value.y, end.y)
  const maxX = Math.max(selectionStart.value.x, end.x)
  const maxY = Math.max(selectionStart.value.y, end.y)

  const left =
    viewOffsetX.value +
    viewScale.value * (axisMargin.value + (minX + borderOffset.value) * cellSize.value)
  const top =
    viewOffsetY.value +
    viewScale.value * (axisMargin.value + (minY + borderOffset.value) * cellSize.value)
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

// --- 边缘扩展手柄 ---
const gridPixelLeft = computed(
  () =>
    viewOffsetX.value + viewScale.value * (axisMargin.value + borderOffset.value * cellSize.value)
)
const gridPixelTop = computed(
  () =>
    viewOffsetY.value + viewScale.value * (axisMargin.value + borderOffset.value * cellSize.value)
)
const gridPixelRight = computed(
  () => gridPixelLeft.value + viewScale.value * gridWidth.value * cellSize.value
)
const gridPixelBottom = computed(
  () => gridPixelTop.value + viewScale.value * gridHeight.value * cellSize.value
)

const HANDLE_SIZE = 28
const HANDLE_OFFSET = HANDLE_SIZE + 6

const edgeTopStyle = computed(() => ({
  left: `${(gridPixelLeft.value + gridPixelRight.value) / 2 - HANDLE_SIZE / 2}px`,
  top: `${gridPixelTop.value - HANDLE_OFFSET}px`
}))
const edgeBottomStyle = computed(() => ({
  left: `${(gridPixelLeft.value + gridPixelRight.value) / 2 - HANDLE_SIZE / 2}px`,
  top: `${gridPixelBottom.value + HANDLE_OFFSET - HANDLE_SIZE}px`
}))
const edgeLeftStyle = computed(() => ({
  left: `${gridPixelLeft.value - HANDLE_OFFSET}px`,
  top: `${(gridPixelTop.value + gridPixelBottom.value) / 2 - HANDLE_SIZE / 2}px`
}))
const edgeRightStyle = computed(() => ({
  left: `${gridPixelRight.value + HANDLE_OFFSET - HANDLE_SIZE}px`,
  top: `${(gridPixelTop.value + gridPixelBottom.value) / 2 - HANDLE_SIZE / 2}px`
}))

const edgeDrag = ref<{
  direction: 'top' | 'bottom' | 'left' | 'right'
  originX: number
  originY: number
  cells: number
} | null>(null)

const edgeDragPreview = computed(() => edgeDrag.value !== null && edgeDrag.value.cells > 0)

const edgeDragPreviewStyle = computed(() => {
  if (!edgeDrag.value || edgeDrag.value.cells <= 0) return { display: 'none' }
  const d = edgeDrag.value
  const cells = d.cells
  const cellPx = viewScale.value * cellSize.value
  if (d.direction === 'top') {
    return {
      left: `${gridPixelLeft.value}px`,
      top: `${gridPixelTop.value - cells * cellPx}px`,
      width: `${gridPixelRight.value - gridPixelLeft.value}px`,
      height: `${cells * cellPx}px`,
      display: 'block'
    }
  }
  if (d.direction === 'bottom') {
    return {
      left: `${gridPixelLeft.value}px`,
      top: `${gridPixelBottom.value}px`,
      width: `${gridPixelRight.value - gridPixelLeft.value}px`,
      height: `${cells * cellPx}px`,
      display: 'block'
    }
  }
  if (d.direction === 'left') {
    return {
      left: `${gridPixelLeft.value - cells * cellPx}px`,
      top: `${gridPixelTop.value}px`,
      width: `${cells * cellPx}px`,
      height: `${gridPixelBottom.value - gridPixelTop.value}px`,
      display: 'block'
    }
  }
  return {
    left: `${gridPixelRight.value}px`,
    top: `${gridPixelTop.value}px`,
    width: `${cells * cellPx}px`,
    height: `${gridPixelBottom.value - gridPixelTop.value}px`,
    display: 'block'
  }
})

function startEdgeDrag(direction: 'top' | 'bottom' | 'left' | 'right', e: PointerEvent) {
  if (!editMode.value) return
  edgeDrag.value = { direction, originX: e.clientX, originY: e.clientY, cells: 0 }
  if (e.currentTarget instanceof HTMLElement && e.pointerId != null) {
    e.currentTarget.setPointerCapture(e.pointerId)
  }
}

function handleEdgeDragMove(e: PointerEvent) {
  if (!edgeDrag.value) return
  const d = edgeDrag.value
  const dx = e.clientX - d.originX
  const dy = e.clientY - d.originY
  const cellPx = viewScale.value * cellSize.value
  let dist = 0
  if (d.direction === 'top') dist = -dy
  else if (d.direction === 'bottom') dist = dy
  else if (d.direction === 'left') dist = -dx
  else if (d.direction === 'right') dist = dx
  edgeDrag.value.cells = Math.max(0, Math.floor(dist / cellPx))
}

function handleEdgeDragUp(e: PointerEvent) {
  if (!edgeDrag.value) return
  const { cells, direction } = edgeDrag.value
  edgeDrag.value = null
  if (e.currentTarget instanceof HTMLElement && e.pointerId != null) {
    e.currentTarget.releasePointerCapture(e.pointerId)
  }
  if (cells > 0) {
    appStore.expandGrid(direction, cells)
  }
}

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
  const bo = borderOffset.value
  const x = Math.floor((pointer.x - axisMargin.value) / cellSize.value) - bo
  const y = Math.floor((pointer.y - axisMargin.value) / cellSize.value) - bo
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

  if (selectedTool.value === 'pan') {
    isDragging.value = true
    dragStartX.value = e.clientX - viewOffsetX.value
    dragStartY.value = e.clientY - viewOffsetY.value
    if (patternCanvas.value.setPointerCapture) {
      patternCanvas.value.setPointerCapture(e.pointerId)
    }
    return
  }

  const cell = getGridCell(e)
  if (!cell || !cell.inGrid) return

  // 只有画笔和橡皮支持拖拽选区；填充和吸管点击即执行
  if (selectedTool.value === 'fill' || selectedTool.value === 'eyedropper') {
    appStore.setPendingSelection({ type: 'cell', x: cell.x, y: cell.y })
    return
  }

  pointerDown.value = true
  selectionStart.value = { x: cell.x, y: cell.y }
  selectionEnd.value = { x: cell.x, y: cell.y }
  if (patternCanvas.value.setPointerCapture) {
    patternCanvas.value.setPointerCapture(e.pointerId)
  }
}

const handleCanvasPointerMove = (e: PointerEvent) => {
  if (!editMode.value) return

  if (selectedTool.value === 'pan' && isDragging.value) {
    viewOffsetX.value = e.clientX - dragStartX.value
    viewOffsetY.value = e.clientY - dragStartY.value
    scheduleRedraw()
    return
  }

  if (!pointerDown.value) return
  e.preventDefault()
  const cell = getGridCell(e)
  if (!cell) return
  const clampedX = Math.max(0, Math.min(gridWidth.value - 1, cell.x))
  const clampedY = Math.max(0, Math.min(gridHeight.value - 1, cell.y))
  if (selectionEnd.value?.x === clampedX && selectionEnd.value?.y === clampedY) return
  selectionEnd.value = { x: clampedX, y: clampedY }
}

const handleCanvasPointerUp = (e: PointerEvent) => {
  if (!editMode.value) return

  if (selectedTool.value === 'pan') {
    isDragging.value = false
    if (patternCanvas.value && e?.pointerId != null && patternCanvas.value.releasePointerCapture) {
      patternCanvas.value.releasePointerCapture(e.pointerId)
    }
    return
  }

  if (!selectionStart.value) return
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
  const scale = appStore.exportScale
  const bo = borderOffset.value
  const gw = gridWidth.value + bo * 2
  const gh = gridHeight.value + bo * 2
  const pw = gw * cellSize.value * scale + axisMargin.value * 2
  const ph = gh * cellSize.value * scale + axisMargin.value * 2
  const c = document.createElement('canvas')
  c.width = pw
  c.height = ph
  const ctx = c.getContext('2d')
  if (!ctx) return null
  drawPatternToCanvas(ctx, c, patternGrid.value, {
    gridWidth: gridWidth.value,
    gridHeight: gridHeight.value,
    cellSize: cellSize.value * scale,
    axisMargin: axisMargin.value,
    showNumbers: showNumbers.value,
    showCoordinateBorder: showCoordBorder.value,
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
  },
  { deep: true, immediate: true }
)

watch([gridWidth, gridHeight, cellSize, axisMargin], () => {
  if (!patternGrid.value.length) {
    initCanvasSize()
    scheduleRedraw()
  }
  nextTick(() => fitToContainer())
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

/* === 边缘扩展手柄 === */
.edge-handle {
  position: absolute;
  width: 28px;
  height: 28px;
  background: rgba(64, 158, 255, 0.85);
  border: 2px solid #fff;
  border-radius: 50%;
  z-index: 15;
  cursor: pointer;
  touch-action: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: transform 0.15s ease;
}

.edge-handle:hover {
  transform: scale(1.3);
  background: rgba(64, 158, 255, 1);
}

.edge-handle:active {
  transform: scale(1.5);
}

.edge-drag-preview {
  position: absolute;
  background: rgba(64, 158, 255, 0.15);
  border: 1px dashed rgba(64, 158, 255, 0.6);
  pointer-events: none;
  z-index: 9;
}
</style>
