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
      <div class="canvas-container">
        <canvas ref="patternCanvas" id="pattern-canvas" class="pattern-canvas" @pointerdown="handlePointerDown"
          @pointermove="handlePointerMove" @pointerup="handlePointerUp" @pointerleave="handlePointerUp"></canvas>
        <div v-if="selectedCell" class="selection-overlay" :style="selectedCellStyle"></div>
        <div v-if="selectionRect" class="selection-overlay area" :style="selectionRectStyle"></div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { Grid } from '@element-plus/icons-vue';

// 定义 props
const props = defineProps({
  originalImageUrl: {
    type: String,
    default: ''
  },
  gridWidth: {
    type: Number,
    default: 30
  },
  gridHeight: {
    type: Number,
    default: 30
  },
  cellSize: {
    type: Number,
    default: 10
  },
  axisMargin: {
    type: Number,
    default: 12
  },
  editMode: {
    type: Boolean,
    default: false
  },
  editType: {
    type: String,
    default: 'click'
  }
});
const emit = defineEmits(['cell-selected', 'area-selected']);

// 响应式数据
const patternCanvas = ref(null);
const pointerDown = ref(false);
const selectionStart = ref(null);
const selectionRect = ref(null);
const selectedCell = ref(null);

const selectedCellStyle = computed(() => {
  if (!selectedCell.value) return {};
  return {
    left: `${props.axisMargin + selectedCell.value.x * props.cellSize}px`,
    top: `${props.axisMargin + selectedCell.value.y * props.cellSize}px`,
    width: `${props.cellSize}px`,
    height: `${props.cellSize}px`
  };
});

const selectionRectStyle = computed(() => {
  if (!selectionRect.value) return {};
  const x1 = Math.min(selectionRect.value.x1, selectionRect.value.x2);
  const y1 = Math.min(selectionRect.value.y1, selectionRect.value.y2);
  const x2 = Math.max(selectionRect.value.x1, selectionRect.value.x2);
  const y2 = Math.max(selectionRect.value.y1, selectionRect.value.y2);
  return {
    left: `${props.axisMargin + x1 * props.cellSize}px`,
    top: `${props.axisMargin + y1 * props.cellSize}px`,
    width: `${(x2 - x1 + 1) * props.cellSize}px`,
    height: `${(y2 - y1 + 1) * props.cellSize}px`
  };
});

const getCanvasPointerPos = (e) => {
  if (!patternCanvas.value) return { x: 0, y: 0 };
  const rect = patternCanvas.value.getBoundingClientRect();
  const scaleX = patternCanvas.value.width / rect.width;
  const scaleY = patternCanvas.value.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  };
};

const getGridCell = (e) => {
  const pointer = getCanvasPointerPos(e);
  const x = Math.floor((pointer.x - props.axisMargin) / props.cellSize);
  const y = Math.floor((pointer.y - props.axisMargin) / props.cellSize);
  const inGrid = x >= 0 && x < props.gridWidth && y >= 0 && y < props.gridHeight;
  return { x, y, inGrid };
};

const normalizeSelection = (rect) => {
  const x1 = Math.max(0, Math.min(props.gridWidth - 1, rect.x1));
  const y1 = Math.max(0, Math.min(props.gridHeight - 1, rect.y1));
  const x2 = Math.max(0, Math.min(props.gridWidth - 1, rect.x2));
  const y2 = Math.max(0, Math.min(props.gridHeight - 1, rect.y2));
  return {
    type: 'area',
    x1,
    y1,
    x2,
    y2
  };
};

const resetSelection = () => {
  pointerDown.value = false;
  selectionStart.value = null;
  selectionRect.value = null;
  selectedCell.value = null;
};

watch(() => props.editMode, (value) => {
  if (!value) {
    resetSelection();
  }
});

watch(() => props.editType, () => {
  resetSelection();
});

const handlePointerDown = (e) => {
  if (!props.editMode || !patternCanvas.value) return;
  e.preventDefault();
  const { x, y, inGrid } = getGridCell(e);
  if (!inGrid) return;

  if (props.editType === 'click') {
    selectedCell.value = { x, y };
    emit('cell-selected', { type: 'cell', x, y });
    return;
  }

  pointerDown.value = true;
  selectionStart.value = { x, y };
  selectionRect.value = { x1: x, y1: y, x2: x, y2: y };
  if (patternCanvas.value.setPointerCapture) {
    patternCanvas.value.setPointerCapture(e.pointerId);
  }
};

const handlePointerMove = (e) => {
  if (!props.editMode || props.editType !== 'area' || !pointerDown.value || !selectionStart.value) return;
  e.preventDefault();
  const { x, y, inGrid } = getGridCell(e);
  if (!inGrid) return;
  selectionRect.value = {
    x1: selectionStart.value.x,
    y1: selectionStart.value.y,
    x2: x,
    y2: y
  };
};

const handlePointerUp = (e) => {
  if (!props.editMode) return;
  if (props.editType === 'area' && selectionRect.value) {
    emit('area-selected', normalizeSelection(selectionRect.value));
  }
  pointerDown.value = false;
  if (patternCanvas.value && e?.pointerId != null && patternCanvas.value.releasePointerCapture) {
    patternCanvas.value.releasePointerCapture(e.pointerId);
  }
};

// 暴露 ref
defineExpose({
  patternCanvas
});

// 监听原始图片变化
watch(() => props.originalImageUrl, (newUrl) => {
  if (newUrl) {
    console.log('原始图片已更新');
  }
});
</script>

<style scoped>
.preview-section {
  display: flex;
  gap: 20px;
  height: 90%;
  min-height: 600px;
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

.image-container {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f0f2f5 0%, #e6e8eb 100%);
  overflow: hidden;
  position: relative;
}

.image-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0) 50%);
  pointer-events: none;
}

.original-image {
  max-width: 95%;
  max-height: 95%;
  border-radius: 8px;
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.original-image:hover {
  transform: scale(1.02);
  box-shadow: 0 6px 24px 0 rgba(0, 0, 0, 0.2);
}

.canvas-container {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f0f2f5 0%, #e6e8eb 100%);
  overflow: auto;
  position: relative;
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
  max-width: 95%;
  max-height: 95%;
  border-radius: 8px;
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.pattern-canvas:hover {
  box-shadow: 0 6px 24px 0 rgba(0, 0, 0, 0.2);
}

.selection-overlay {
  position: absolute;
  border: 2px dashed rgba(64, 158, 255, 0.95);
  background-color: rgba(64, 158, 255, 0.18);
  pointer-events: none;
  box-sizing: border-box;
}

.selection-overlay.area {
  background-color: rgba(64, 158, 255, 0.12);
}

.image-error,
.image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;
  text-align: center;
  padding: 40px;
}

.error-icon,
.placeholder-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
  animation: pulse 2s infinite;
}

.error-text,
.placeholder-text {
  font-size: 16px;
  color: #909399;
  margin-top: 8px;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 0.5;
  }

  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }

  100% {
    transform: scale(1);
    opacity: 0.5;
  }
}
</style>