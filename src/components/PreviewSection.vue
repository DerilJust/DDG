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

        <!-- 选择框覆盖层 -->
        <div v-if="selectedCell" class="selection-overlay" :style="selectedCellStyle"></div>
        <div v-if="selectionRect" class="selection-overlay area" :style="selectionRectStyle"></div>

        <!-- 缩放比例提示 -->
        <div class="zoom-info">{{ Math.round(scale * 100) }}%</div>
      </div>

      <!-- 控制按钮 -->
      <div class="canvas-controls">
        <el-button type="info" size="small" @click="resetViewport">
          <!-- <el-icon><Zoom /></el-icon> -->
          重置视图
        </el-button>
        <span class="control-hint">滚轮缩放 | 拖拽移动</span>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { PropType } from 'vue';
import { Grid } from '@element-plus/icons-vue';

interface Point {
  x: number;
  y: number;
  inGrid?: boolean;
}

interface SelectionRect {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface PatternCell {
  code: string;
  color: {
    r: number;
    g: number;
    b: number;
    hex: string;
  };
}

/**
 * ============ Props定义 ============
 * 接收从App.vue传递的配置参数
 */
const props = defineProps({
  /** 原始图片URL */
  originalImageUrl: {
    type: String,
    default: ''
  },
  /** 网格宽度（X轴格数） */
  gridWidth: {
    type: Number,
    default: 30
  },
  /** 网格高度（Y轴格数） */
  gridHeight: {
    type: Number,
    default: 30
  },
  /** 单个格子的像素大小 */
  cellSize: {
    type: Number,
    default: 10
  },
  /** 坐标轴的边距 */
  axisMargin: {
    type: Number,
    default: 12
  },
  /** 是否进入编辑模式 */
  editMode: {
    type: Boolean,
    default: false
  },
  /** 编辑类型：'click'=单个格子选择，'area'=框选区域 */
  editType: {
    type: String as PropType<'click' | 'area'>,
    default: 'click'
  },
  /** 拼豆图纸数据 */
  patternGrid: {
    type: Array as PropType<PatternCell[][]>,
    default: () => []
  }
});

// 事件发射定义
const emit = defineEmits(['cell-selected', 'area-selected']);

/**
 * ============ 缩放平移相关状态 ============
 */
/** 缩放倍数 */
const scale = ref<number>(1);

/** X轴平移偏移量 */
const offsetX = ref<number>(0);

/** Y轴平移偏移量 */
const offsetY = ref<number>(0);

/** 是否正在拖拖 */
const isDragging = ref<boolean>(false);

/** 拖拖开始时的X坐标 */
const dragStartX = ref<number>(0);

/** 拖拖开始时的Y坐标 */
const dragStartY = ref<number>(0);

/**
 * ============ Canvas和选择相关状态 ============
 */
/** Canvas元素引用 */
const patternCanvas = ref<HTMLCanvasElement | null>(null);

/** 容器元素引用 */
const containerRef = ref<HTMLElement | null>(null);

/** 指针是否按下 */
const pointerDown = ref<boolean>(false);

/** 框选开始位置 */
const selectionStart = ref<Point | null>(null);

/** 框选区域 */
const selectionRect = ref<SelectionRect | null>(null);

/** 单个选中格子 */
const selectedCell = ref<Point | null>(null);

/**
 * ============ 计算属性 ============
 */

/**
 * 计算CSS变换样式（用于缩放和平移）
 */
const transformStyle = computed<{
  transform: string;
  transformOrigin: string;
  transition: string;
}>(() => {
  return {
    transform: `translate(${offsetX.value}px, ${offsetY.value}px) scale(${scale.value})`,
    transformOrigin: '0 0',
    transition: 'none'
  };
});

/**
 * 单个选中格子的样式
 */
const selectedCellStyle = computed<Record<string, string>>(() => {
  if (!selectedCell.value) return { left: '0px', top: '0px', width: '0px', height: '0px' };
  const displayScale = getDisplayScale();
  return {
    left: `${(props.axisMargin + selectedCell.value.x * props.cellSize) * displayScale.x * scale.value + offsetX.value}px`,
    top: `${(props.axisMargin + selectedCell.value.y * props.cellSize) * displayScale.y * scale.value + offsetY.value}px`,
    width: `${props.cellSize * displayScale.x * scale.value}px`,
    height: `${props.cellSize * displayScale.y * scale.value}px`
  };
});

/**
 * 框选区域的样式
 */
const selectionRectStyle = computed<Record<string, string>>(() => {
  if (!selectionRect.value) return { left: '0px', top: '0px', width: '0px', height: '0px' };
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

/**
 * ============ 工具方法 ============
 */

/**
 * 获取Canvas实际显示与内部坐标的缩放比
 */
const getDisplayScale = (): { x: number; y: number } => {
  if (!patternCanvas.value) return { x: 1, y: 1 };
  const rect = patternCanvas.value.getBoundingClientRect();
  return {
    x: patternCanvas.value.width ? rect.width / patternCanvas.value.width : 1,
    y: patternCanvas.value.height ? rect.height / patternCanvas.value.height : 1
  };
};

/**
 * 获取相对于Canvas的鼠标位置
 * @param {PointerEvent} e - 指针事件
 * @returns {Object} 包含x和y坐标的对象
 */
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

/**
 * 获取指针对应的网格格子坐标
 * @param {PointerEvent} e - 指针事件
 * @returns {Object} 包含x、y和inGrid（是否在网格内）的对象
 */
const getGridCell = (e: PointerEvent): Point | null => {
  const pointer = getCanvasPointerPos(e);
  const x = Math.floor((pointer.x - props.axisMargin) / props.cellSize);
  const y = Math.floor((pointer.y - props.axisMargin) / props.cellSize);
  const inGrid = x >= 0 && x < props.gridWidth && y >= 0 && y < props.gridHeight;
  return { x, y, inGrid };
};

/**
 * 约束点到网格范围内
 */
const clampPointToGridLocal = (x: number, y: number) => {
  return {
    x: Math.max(0, Math.min(props.gridWidth - 1, x)),
    y: Math.max(0, Math.min(props.gridHeight - 1, y))
  };
};

/**
 * 规范化选择区域
 */
const normalizeSelectionLocal = (rect: SelectionRect) => {
  const x1 = Math.max(0, Math.min(props.gridWidth - 1, rect.x1));
  const y1 = Math.max(0, Math.min(props.gridHeight - 1, rect.y1));
  const x2 = Math.max(0, Math.min(props.gridWidth - 1, rect.x2));
  const y2 = Math.max(0, Math.min(props.gridHeight - 1, rect.y2));
  return { type: 'area', x1, y1, x2, y2 };
};

/**
 * ============ 交互事件处理 ============
 */

/**
 * 处理鼠标滚轮（缩放）
 * @param {WheelEvent} e - 滚轮事件
 */
const handleWheel = (e: WheelEvent) => {
  // 计算缩放因子（向上滚+10%，向下滚-10%）
  const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
  const newScale = Math.max(0.5, Math.min(3, scale.value * zoomFactor));
  
  // 保持鼠标位置为缩放中心
  if (!containerRef.value) return;
  const rect = containerRef.value.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  
  // 缩放计算：调整偏移量使得鼠标位置保持不变
  offsetX.value = mouseX - (mouseX - offsetX.value) * (newScale / scale.value);
  offsetY.value = mouseY - (mouseY - offsetY.value) * (newScale / scale.value);
  
  scale.value = newScale;
};

/**
 * 处理鼠标按下（开始拖拖）
 * @param {MouseEvent} e - 鼠标事件
 */
const handleMouseDown = (e: MouseEvent) => {
  // 只在不在编辑模式下允许拖拖
  if (props.editMode) return;
  
  isDragging.value = true;
  dragStartX.value = e.clientX - offsetX.value;
  dragStartY.value = e.clientY - offsetY.value;
};

/**
 * 处理鼠标移动（拖拖或编辑）
 * @param {MouseEvent} e - 鼠标事件
 */
const handleMouseMove = (e: MouseEvent) => {
  if (isDragging.value) {
    // 实时更新偏移量
    offsetX.value = e.clientX - dragStartX.value;
    offsetY.value = e.clientY - dragStartY.value;
  }
};

/**
 * 处理鼠标抬起（结束拖拖）
 */
const handleMouseUp = (): void => {
  isDragging.value = false;
};

/**
 * 处理Canvas指针按下（编辑）
 * @param {PointerEvent} e - 指针事件
 */
const handleCanvasPointerDown = (e: PointerEvent) => {
  if (!props.editMode || !patternCanvas.value) return;
  e.preventDefault();
  
  const cell = getGridCell(e);
  if (!cell || !cell.inGrid) return;
  const { x, y } = cell;

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

/**
 * 处理Canvas指针移动（框选）
 * @param {PointerEvent} e - 指针事件
 */
const handleCanvasPointerMove = (e: PointerEvent) => {
  if (!props.editMode || props.editType !== 'area' || !pointerDown.value || !selectionStart.value) return;
  e.preventDefault();
  
  const cell = getGridCell(e);
  if (!cell) return;
  const { x, y } = cell;
  const point = clampPointToGridLocal(x, y);
  
  selectionRect.value = {
    x1: selectionStart.value.x,
    y1: selectionStart.value.y,
    x2: point.x,
    y2: point.y
  };
};

/**
 * 处理Canvas指针抬起（结束框选）
 * @param {PointerEvent} e - 指针事件
 */
const handleCanvasPointerUp = (e: PointerEvent) => {
  if (!props.editMode) return;
  
  if (props.editType === 'area' && selectionRect.value) {
    emit('area-selected', normalizeSelectionLocal(selectionRect.value));
  }
  
  pointerDown.value = false;
  if (patternCanvas.value && e?.pointerId != null && patternCanvas.value.releasePointerCapture) {
    patternCanvas.value.releasePointerCapture(e.pointerId);
  }
};

/**
 * 重置视图（缩放和平移）
 */
const resetViewport = (): void => {
  scale.value = 1;
  offsetX.value = 0;
  offsetY.value = 0;
};

/**
 * ============ 监听和生命周期 ============
 */

/**
 * 监听编辑模式变化
 */
watch(() => props.editMode, (value) => {
  if (!value) {
    // 退出编辑模式时重置选择
    pointerDown.value = false;
    selectionStart.value = null;
    selectionRect.value = null;
    selectedCell.value = null;
  }
});

/**
 * 监听编辑类型变化
 */
watch(() => props.editType, () => {
  pointerDown.value = false;
  selectionStart.value = null;
  selectionRect.value = null;
  selectedCell.value = null;
});

/**
 * 监听原始图片变化
 */
watch(() => props.originalImageUrl, (newUrl) => {
  if (newUrl) {
    console.log('原始图片已更新');
  }
});

/**
 * ============ 渲染逻辑 ============
 */

/**
 * 绘制拼豆图纸
 */
const drawPattern = (): void => {
  if (!patternCanvas.value || !props.patternGrid.length) return;

  const canvas = patternCanvas.value;
  const ctx = canvas.getContext('2d');
  if (!ctx) return; // 如果无法获取2D上下文，直接返回

  // 设置canvas尺寸
  canvas.width = props.gridWidth * props.cellSize + props.axisMargin * 2;
  canvas.height = props.gridHeight * props.cellSize + props.axisMargin * 2;

  // 清空canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // ========== 绘制网格 ==========
  // 绘制格子颜色
  for (let y = 0; y < props.gridHeight; y++) {
    for (let x = 0; x < props.gridWidth; x++) {
      const cell = props.patternGrid[y]?.[x];
      if (!cell) continue;

      const cellX = props.axisMargin + x * props.cellSize;
      const cellY = props.axisMargin + y * props.cellSize;

      // 绘制格子颜色
      ctx.fillStyle = `rgb(${cell.color.r}, ${cell.color.g}, ${cell.color.b})`;
      ctx.fillRect(cellX, cellY, props.cellSize, props.cellSize);

      // 绘制网格线：每5格粗线，其他细线
      const isGridLine5X = x % 5 === 4;
      const isGridLine5Y = y % 5 === 4;
      const isGridLine5 = isGridLine5X || isGridLine5Y;

      ctx.strokeStyle = isGridLine5 ? '#333' : '#ddd';
      ctx.lineWidth = isGridLine5 ? 1.5 : 0.5;
      ctx.strokeRect(cellX, cellY, props.cellSize, props.cellSize);

      // 显示拼豆编号
      if (props.cellSize >= 20 && cell.code) {
        const colorCode = cell.code;
        let fontSize = props.cellSize * 0.55;

        ctx.font = `${fontSize}px Arial`;
        const textWidth = ctx.measureText(colorCode).width;

        if (textWidth > props.cellSize * 0.75) {
          fontSize = (props.cellSize * 0.75 / textWidth) * fontSize;
          ctx.font = `${fontSize}px Arial`;
        }

        const textX = cellX + props.cellSize / 2;
        const textY = cellY + props.cellSize / 2;

        // 绘制文字（带描边和填充）
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
        ctx.lineWidth = 2;
        ctx.strokeText(colorCode, textX, textY);
        ctx.fillStyle = getContrastColor(cell.color.r, cell.color.g, cell.color.b);
        ctx.fillText(colorCode, textX, textY);
      }
    }
  }

  // ========== 绘制坐标轴 ==========
  if (props.cellSize >= 20) {
    ctx.save();
    // 坐标轴背景
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, props.axisMargin);
    ctx.fillRect(0, 0, props.axisMargin, canvas.height);
    ctx.fillRect(0, canvas.height - props.axisMargin, canvas.width, props.axisMargin);
    ctx.fillRect(canvas.width - props.axisMargin, 0, props.axisMargin, canvas.height);

    // 坐标轴线
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(props.axisMargin, props.axisMargin);
    ctx.lineTo(props.axisMargin, canvas.height - props.axisMargin);
    ctx.moveTo(props.axisMargin, props.axisMargin);
    ctx.lineTo(canvas.width - props.axisMargin, props.axisMargin);
    ctx.stroke();

    // 绘制坐标标签
    ctx.fillStyle = '#333';
    ctx.font = 'bold 12px Arial';
    ctx.textBaseline = 'middle';

    const labelInterval = props.cellSize >= 20 ? 1 : 5;

    for (let i = 0; i < props.gridWidth; i++) {
      if (i === 0 || i === props.gridWidth - 1 || (i + 1) % labelInterval === 0) {
        const label = `${i + 1}`;
        const x = props.axisMargin + i * props.cellSize + props.cellSize / 2;
        const topY = props.axisMargin / 2;
        const bottomY = canvas.height - props.axisMargin / 2;

        ctx.textAlign = 'center';
        ctx.fillText(label, x, topY);
        ctx.fillText(label, x, bottomY);
      }
    }

    for (let i = 0; i < props.gridHeight; i++) {
      if (i === 0 || i === props.gridHeight - 1 || (i + 1) % labelInterval === 0) {
        const label = `${i + 1}`;
        const y = props.axisMargin + i * props.cellSize + props.cellSize / 2;
        const leftX = props.axisMargin / 2;
        const rightX = canvas.width - props.axisMargin / 2;

        ctx.textAlign = 'right';
        ctx.fillText(label, leftX, y);
        ctx.textAlign = 'left';
        ctx.fillText(label, rightX, y);
      }
    }
    ctx.restore();
  }
};

/**
 * 监听patternGrid变化，重新绘制图纸
 */
watch(() => props.patternGrid, () => {
  drawPattern();
}, { deep: true, immediate: true });

/**
 * 获取对比色（用于文字）
 */
const getContrastColor = (r: number, g: number, b: number): string => {
  // 使用亮度公式计算背景亮度
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? '#000000' : '#ffffff';
};

/**
 * 暴露接口供父组件使用
 */
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