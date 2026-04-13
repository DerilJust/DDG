<template>
  <div class="preview-section">
    <el-card class="preview-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon class="header-icon">
            <Grid />
          </el-icon>
          <span>拼豆图纸</span>
        </div>
      </template>

      <!-- Canvas容器：支持缩放和平移 -->
      <div class="canvas-container" ref="containerRef"
        @wheel.prevent="handleWheel"
        @mousedown="handleMouseDown"
        @mousemove="handleMouseMove"
        @mouseup="handleMouseUp"
        @mouseleave="handleMouseUp"
        :style="{ cursor: isDragging ? 'grabbing' : 'grab' }">

        <!-- 变换容器：通过CSS transform实现缩放和平移 -->
        <div :style="transformStyle">
          <canvas ref="patternCanvas" id="pattern-canvas" class="pattern-canvas"
            @pointerdown.stop="handleCanvasPointerDown"
            @pointermove="handleCanvasPointerMove"
            @pointerup="handleCanvasPointerUp"
            @pointerleave="handleCanvasPointerUp">
          </canvas>
        </div>

        <!-- 单个格子选中覆盖层 -->
        <div v-if="selectedCell" class="selection-overlay" :style="selectedCellStyle"></div>

        <!-- 缩放比例提示 -->
        <div class="zoom-info">{{ Math.round(scale * 100) }}%</div>
      </div>

      <!-- 控制按钮 -->
      <div class="canvas-controls">
        <el-button type="info" size="small" @click="zoomOut">-</el-button>
        <el-button type="info" size="small" @click="zoomIn">+</el-button>
        <el-button type="info" size="small" @click="resetViewport">
          重置视图
        </el-button>
        <span class="control-hint">滚轮上下移动 | Ctrl+滚轮缩放</span>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useAppStore } from '../store/appStore';
import { storeToRefs } from 'pinia';
import { Grid } from '@element-plus/icons-vue';
import { drawPatternToCanvas } from '../utils/patternRenderer';

interface Point {
  x: number;
  y: number;
  inGrid?: boolean;
}

const appStore = useAppStore();
const { gridWidth, gridHeight, patternGrid, editMode, showNumbers } = storeToRefs(appStore);

/** 缩放倍数 */
const scale = ref<number>(1);
/** X轴平移偏移量 */
const offsetX = ref<number>(0);
/** Y轴平移偏移量 */
const offsetY = ref<number>(0);
/** 是否正在拖拽 */
const isDragging = ref<boolean>(false);
const dragStartX = ref<number>(0);
const dragStartY = ref<number>(0);
const patternCanvas = ref<HTMLCanvasElement | null>(null);
const containerRef = ref<HTMLElement | null>(null);
const pointerDown = ref<boolean>(false);
const selectedCell = ref<Point | null>(null);

const cellSize = computed(() => (showNumbers.value ? 40 : 20));
const axisMargin = computed(() => (showNumbers.value ? 44 : 12));

const transformStyle = computed(() => ({
  transform: `translate(${offsetX.value}px, ${offsetY.value}px) scale(${scale.value})`,
  transformOrigin: '0 0',
  transition: 'none'
}));

const selectedCellStyle = computed<Record<string, string>>(() => {
  if (!selectedCell.value) return { left: '0px', top: '0px', width: '0px', height: '0px' };
  const displayScale = getDisplayScale();
  return {
    left: `${(axisMargin.value + selectedCell.value.x * cellSize.value) * displayScale.x * scale.value + offsetX.value}px`,
    top: `${(axisMargin.value + selectedCell.value.y * cellSize.value) * displayScale.y * scale.value + offsetY.value}px`,
    width: `${cellSize.value * displayScale.x * scale.value}px`,
    height: `${cellSize.value * displayScale.y * scale.value}px`
  };
});

const getDisplayScale = (): { x: number; y: number } => {
  if (!patternCanvas.value) return { x: 1, y: 1 };
  const rect = patternCanvas.value.getBoundingClientRect();
  return {
    x: patternCanvas.value.width ? rect.width / patternCanvas.value.width : 1,
    y: patternCanvas.value.height ? rect.height / patternCanvas.value.height : 1
  };
};

const getCanvasPointerPos = (e: PointerEvent): { x: number; y: number } => {
  if (!patternCanvas.value) return { x: 0, y: 0 };
  const rect = patternCanvas.value.getBoundingClientRect();
  const scaleX = patternCanvas.value.width / rect.width;
  const scaleY = patternCanvas.value.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  };
};

const getGridCell = (e: PointerEvent): Point | null => {
  const pointer = getCanvasPointerPos(e);
  const x = Math.floor((pointer.x - axisMargin.value) / cellSize.value);
  const y = Math.floor((pointer.y - axisMargin.value) / cellSize.value);
  const inGrid = x >= 0 && x < gridWidth.value && y >= 0 && y < gridHeight.value;
  return { x, y, inGrid };
};

const handleWheel = (e: WheelEvent) => {
  if (e.ctrlKey || e.metaKey) {
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.5, Math.min(3, scale.value * zoomFactor));
    if (!containerRef.value) return;
    const rect = containerRef.value.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    offsetX.value = mouseX - (mouseX - offsetX.value) * (newScale / scale.value);
    offsetY.value = mouseY - (mouseY - offsetY.value) * (newScale / scale.value);
    scale.value = newScale;
    return;
  }
  offsetY.value -= e.deltaY;
};

const handleMouseDown = (e: MouseEvent) => {
  if (editMode.value) return;
  isDragging.value = true;
  dragStartX.value = e.clientX - offsetX.value;
  dragStartY.value = e.clientY - offsetY.value;
};

const handleMouseMove = (e: MouseEvent) => {
  if (isDragging.value) {
    offsetX.value = e.clientX - dragStartX.value;
    offsetY.value = e.clientY - dragStartY.value;
  }
};

const handleMouseUp = (): void => {
  isDragging.value = false;
};

const handleCanvasPointerDown = (e: PointerEvent) => {
  if (!editMode.value || !patternCanvas.value) return;
  e.preventDefault();
  const cell = getGridCell(e);
  if (!cell || !cell.inGrid) return;
  pointerDown.value = true;
  selectedCell.value = { x: cell.x, y: cell.y };
  appStore.setPendingSelection({ type: 'cell', x: cell.x, y: cell.y });
  if (patternCanvas.value.setPointerCapture) {
    patternCanvas.value.setPointerCapture(e.pointerId);
  }
};

const handleCanvasPointerMove = (e: PointerEvent) => {
  if (!editMode.value || !pointerDown.value) return;
  e.preventDefault();
  const cell = getGridCell(e);
  if (!cell || !cell.inGrid) return;
  if (selectedCell.value?.x === cell.x && selectedCell.value?.y === cell.y) return;
  selectedCell.value = { x: cell.x, y: cell.y };
  appStore.setPendingSelection({ type: 'cell', x: cell.x, y: cell.y });
};

const handleCanvasPointerUp = (e: PointerEvent) => {
  if (!editMode.value) return;
  pointerDown.value = false;
  if (patternCanvas.value && e?.pointerId != null && patternCanvas.value.releasePointerCapture) {
    patternCanvas.value.releasePointerCapture(e.pointerId);
  }
};

const resetViewport = (): void => {
  scale.value = 1;
  offsetX.value = 0;
  offsetY.value = 0;
};

const zoomIn = (): void => {
  const newScale = Math.min(3, scale.value + 0.1);
  if (!containerRef.value) {
    scale.value = newScale;
    return;
  }
  const rect = containerRef.value.getBoundingClientRect();
  const mouseX = rect.width / 2;
  const mouseY = rect.height / 2;
  offsetX.value = mouseX - (mouseX - offsetX.value) * (newScale / scale.value);
  offsetY.value = mouseY - (mouseY - offsetY.value) * (newScale / scale.value);
  scale.value = newScale;
};

const zoomOut = (): void => {
  const newScale = Math.max(0.5, scale.value - 0.1);
  if (!containerRef.value) {
    scale.value = newScale;
    return;
  }
  const rect = containerRef.value.getBoundingClientRect();
  const mouseX = rect.width / 2;
  const mouseY = rect.height / 2;
  offsetX.value = mouseX - (mouseX - offsetX.value) * (newScale / scale.value);
  offsetY.value = mouseY - (mouseY - offsetY.value) * (newScale / scale.value);
  scale.value = newScale;
};

const drawPattern = (): void => {
  if (!patternCanvas.value || !patternGrid.value.length) return;
  const ctx = patternCanvas.value.getContext('2d');
  if (!ctx) return;

  drawPatternToCanvas(ctx, patternCanvas.value, patternGrid.value, {
    gridWidth: gridWidth.value,
    gridHeight: gridHeight.value,
    cellSize: cellSize.value,
    axisMargin: axisMargin.value,
    showNumbers: showNumbers.value,
    gridLineInterval: 5
  });
};

watch(editMode, (value) => {
  if (!value) {
    pointerDown.value = false;
    selectedCell.value = null;
  }
});

watch(patternGrid, () => {
  drawPattern();
}, { deep: true, immediate: true });

defineExpose({
  get patternCanvas() {
    return patternCanvas.value;
  },
  scale,
  offsetX,
  offsetY,
  resetViewport,
  getDisplayScale
});
</script>

<style scoped>
.preview-section {
  display: flex;
  gap: 20px;
  flex: 1;
  min-height: 400px;
}

.preview-card {
  flex: 1;
  min-width: 400px;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.preview-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px 0 rgba(0, 0, 0, 0.15);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: bold;
  color: #303133;
  padding: 16px 20px;
  background: linear-gradient(135deg, #f6f8fa 0%, #e9ecef 100%);
  border-bottom: 1px solid #e4e7ed;
}

.header-icon {
  font-size: 18px;
  color: #409EFF;
}

/**
 * Canvas容器：支持缩放和平移
 */
.canvas-container {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f0f2f5 0%, #e6e8eb 100%);
  overflow: hidden;
  position: relative;
  border-radius: 0 0 8px 8px;
}

.canvas-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0) 50%);
  pointer-events: none;
}

.pattern-canvas {
  display: block;
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

/**
 * 缩放比例信息提示
 */
.zoom-info {
  position: absolute;
  bottom: 12px;
  right: 12px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  pointer-events: none;
  z-index: 5;
}

/**
 * Canvas控制按钮
 */
.canvas-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: white;
  border-top: 1px solid #e4e7ed;
}

.control-hint {
  font-size: 12px;
  color: #909399;
  margin-left: 12px;
}
</style>