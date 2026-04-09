<template>
  <div class="canvas-viewer-wrapper">
    <!-- Canvas容器，支持缩放和拖拖 -->
    <div class="canvas-viewer-container" ref="container"
      @wheel.prevent="handleWheel"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseUp"
      :style="{ cursor: isDragging ? 'grabbing' : 'grab' }">
      
      <!-- 变换容器，通过CSS transform实现缩放和平移 -->
      <div class="canvas-transform" :style="transformStyle">
        <canvas ref="patternCanvas" id="pattern-canvas" class="pattern-canvas"
          @pointerdown.stop="handleCanvasPointerDown"
          @pointermove="handleCanvasPointerMove"
          @pointerup="handleCanvasPointerUp"
          @pointerleave="handleCanvasPointerUp">
        </canvas>
      </div>

      <!-- 选择框覆盖层 -->
      <div v-if="selectedCell" class="selection-overlay" :style="selectedCellStyle"></div>
      <div v-if="selectionRect" class="selection-overlay area" :style="selectionRectStyle"></div>

      <!-- 缩放信息提示 -->
      <div class="zoom-info">{{ Math.round(scale * 100) }}%</div>
    </div>

    <!-- 重置按钮 -->
    <div class="canvas-controls">
      <el-button type="info" size="small" @click="resetViewport">
        <el-icon><Zoom /></el-icon>
        重置视图
      </el-button>
      <span class="control-hint">滚轮缩放 | 拖拽移动</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { Zoom } from '@element-plus/icons-vue';

// Props定义 - 接收canvas和交互相关的属性
const props = defineProps({
  // canvas 元素引用
  canvasRef: {
    type: [Object, null],
    default: null
  },
  // 网格宽度
  gridWidth: {
    type: Number,
    default: 30
  },
  // 网格高度
  gridHeight: {
    type: Number,
    default: 30
  },
  // 单个格子大小
  cellSize: {
    type: Number,
    default: 10
  },
  // 坐标轴边距
  axisMargin: {
    type: Number,
    default: 12
  },
  // 编辑模式
  editMode: {
    type: Boolean,
    default: false
  },
  // 编辑类型
  editType: {
    type: String,
    default: 'click'
  }
});

// 事件发射定义
const emit = defineEmits(['cell-selected', 'area-selected']);

// ============ 状态管理 ============

// 缩放比例，默认自适应显示
const scale = ref(1);

// 平移偏移量
const offsetX = ref(0);
const offsetY = ref(0);

// 鼠标拖拽相关状态
const isDragging = ref(false);
const dragStartX = ref(0);
const dragStartY = ref(0);

// 指针和选择相关状态
const pointerDown = ref(false);
const selectionStart = ref(null);
const selectionRect = ref(null);
const selectedCell = ref(null);

// DOM引用
const container = ref(null);
const patternCanvas = ref(null);

// ============ 计算属性 ============

// 计算变换样式
const transformStyle = computed(() => {
  return {
    transform: `translate(${offsetX.value}px, ${offsetY.value}px) scale(${scale.value})`,
    transformOrigin: '0 0',
    transition: 'none'
  };
});

// 单个选中格子的样式
const selectedCellStyle = computed(() => {
  if (!selectedCell.value) return {};
  const displayScale = getDisplayScale();
  return {
    left: `${(props.axisMargin + selectedCell.value.x * props.cellSize) * displayScale.x * scale.value + offsetX.value}px`,
    top: `${(props.axisMargin + selectedCell.value.y * props.cellSize) * displayScale.y * scale.value + offsetY.value}px`,
    width: `${props.cellSize * displayScale.x * scale.value}px`,
    height: `${props.cellSize * displayScale.y * scale.value}px`
  };
});

// 框选区域的样式
const selectionRectStyle = computed(() => {
  if (!selectionRect.value) return {};
  const x1 = Math.min(selectionRect.value.x1, selectionRect.value.x2);
  const y1 = Math.min(selectionRect.value.y1, selectionRect.value.y2);
  const x2 = Math.max(selectionRect.value.x1, selectionRect.value.x2);
  const y2 = Math.max(selectionRect.value.y1, selectionRect.value.y2);
  const displayScale = getDisplayScale();
  return {
    left: `${(props.axisMargin + x1 * props.cellSize) * displayScale.x * scale.value + offsetX.value}px`,
    top: `${(props.axisMargin + y1 * props.cellSize) * displayScale.y * scale.value + offsetY.value}px`,
    width: `${(x2 - x1 + 1) * props.cellSize * displayScale.x * scale.value}px`,
    height: `${(y2 - y1 + 1) * props.cellSize * displayScale.y * scale.value}px`
  };
});

// ============ 工具方法 ============

// 获取canvas实际显示与内部坐标的缩放比
const getDisplayScale = () => {
  if (!patternCanvas.value) return { x: 1, y: 1 };
  const rect = patternCanvas.value.getBoundingClientRect();
  return {
    x: patternCanvas.value.width ? rect.width / patternCanvas.value.width : 1,
    y: patternCanvas.value.height ? rect.height / patternCanvas.value.height : 1
  };
};

// 获取相对于canvas的鼠标位置
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

// 获取指针对应的网格格子
const getGridCell = (e) => {
  const pointer = getCanvasPointerPos(e);
  const x = Math.floor((pointer.x - props.axisMargin) / props.cellSize);
  const y = Math.floor((pointer.y - props.axisMargin) / props.cellSize);
  const inGrid = x >= 0 && x < props.gridWidth && y >= 0 && y < props.gridHeight;
  return { x, y, inGrid };
};

// 约束点到网格范围内
const clampPointToGrid = (x, y) => {
  return {
    x: Math.max(0, Math.min(props.gridWidth - 1, x)),
    y: Math.max(0, Math.min(props.gridHeight - 1, y))
  };
};

// 规范化选择区域
const normalizeSelection = (rect) => {
  const x1 = Math.max(0, Math.min(props.gridWidth - 1, rect.x1));
  const y1 = Math.max(0, Math.min(props.gridHeight - 1, rect.y1));
  const x2 = Math.max(0, Math.min(props.gridWidth - 1, rect.x2));
  const y2 = Math.max(0, Math.min(props.gridHeight - 1, rect.y2));
  return { type: 'area', x1, y1, x2, y2 };
};

// ============ 交互事件处理 ============

// 处理缩放（鼠标滚轮）
const handleWheel = (e) => {
  // 计算缩放因子（向上滚+10%，向下滚-10%）
  const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
  const newScale = Math.max(0.5, Math.min(3, scale.value * zoomFactor));
  
  // 保持鼠标位置为缩放中心
  const rect = container.value.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  
  // 缩放计算：调整偏移量使得鼠标位置保持不变
  offsetX.value = mouseX - (mouseX - offsetX.value) * (newScale / scale.value);
  offsetY.value = mouseY - (mouseY - offsetY.value) * (newScale / scale.value);
  
  scale.value = newScale;
};

// 处理鼠标按下（开始拖拖）
const handleMouseDown = (e) => {
  // 只在不在canvas编辑时允许拖拖
  if (props.editMode) return;
  
  isDragging.value = true;
  dragStartX.value = e.clientX - offsetX.value;
  dragStartY.value = e.clientY - offsetY.value;
};

// 处理鼠标移动（拖拖或编辑）
const handleMouseMove = (e) => {
  if (isDragging.value) {
    // 实时更新偏移量
    offsetX.value = e.clientX - dragStartX.value;
    offsetY.value = e.clientY - dragStartY.value;
  }
};

// 处理鼠标抬起（结束拖拖）
const handleMouseUp = () => {
  isDragging.value = false;
};

// 处理Canvas指针按下（编辑）
const handleCanvasPointerDown = (e) => {
  if (!props.editMode || !patternCanvas.value) return;
  e.preventDefault();
  
  const { x, y, inGrid } = getGridCell(e);
  if (!inGrid) return;

  // 点击模式：单个格子选择
  if (props.editType === 'click') {
    selectedCell.value = { x, y };
    emit('cell-selected', { type: 'cell', x, y });
    return;
  }

  // 框选模式：记录起点
  pointerDown.value = true;
  selectionStart.value = { x, y };
  selectionRect.value = { x1: x, y1: y, x2: x, y2: y };
  if (patternCanvas.value.setPointerCapture) {
    patternCanvas.value.setPointerCapture(e.pointerId);
  }
};

// 处理Canvas指针移动（框选）
const handleCanvasPointerMove = (e) => {
  if (!props.editMode || props.editType !== 'area' || !pointerDown.value || !selectionStart.value) return;
  e.preventDefault();
  
  const { x, y } = getGridCell(e);
  const point = clampPointToGrid(x, y);
  
  selectionRect.value = {
    x1: selectionStart.value.x,
    y1: selectionStart.value.y,
    x2: point.x,
    y2: point.y
  };
};

// 处理Canvas指针抬起（结束框选）
const handleCanvasPointerUp = (e) => {
  if (!props.editMode) return;
  
  if (props.editType === 'area' && selectionRect.value) {
    emit('area-selected', normalizeSelection(selectionRect.value));
  }
  
  pointerDown.value = false;
  if (patternCanvas.value && e?.pointerId != null && patternCanvas.value.releasePointerCapture) {
    patternCanvas.value.releasePointerCapture(e.pointerId);
  }
};

// 重置视图（回到初始状态）
const resetViewport = () => {
  scale.value = 1;
  offsetX.value = 0;
  offsetY.value = 0;
};

// ============ 监听和生命周期 ============

// 监听编辑模式变化
watch(() => props.editMode, (value) => {
  if (!value) {
    // 退出编辑模式时重置选择
    pointerDown.value = false;
    selectionStart.value = null;
    selectionRect.value = null;
    selectedCell.value = null;
  }
});

// 监听编辑类型变化
watch(() => props.editType, () => {
  pointerDown.value = false;
  selectionStart.value = null;
  selectionRect.value = null;
  selectedCell.value = null;
});

// 暴露接口供父组件使用
defineExpose({
  patternCanvas,
  scale,
  offsetX,
  offsetY,
  resetViewport,
  getDisplayScale
});
</script>

<style scoped>
.canvas-viewer-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
}

.canvas-viewer-container {
  flex: 1;
  background: linear-gradient(135deg, #f0f2f5 0%, #e6e8eb 100%);
  overflow: hidden;
  position: relative;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.canvas-transform {
  position: absolute;
  top: 0;
  left: 0;
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

.zoom-info {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  pointer-events: none;
}

.canvas-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: white;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.control-hint {
  font-size: 12px;
  color: #909399;
  margin-left: 12px;
}
</style>
