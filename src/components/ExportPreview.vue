<template>
  <div class="export-preview-section">
    <!-- 展开/收起按钮 -->
    <div class="export-header" @click="isExpanded = !isExpanded">
      <div class="header-content">
        <el-icon class="header-icon">
          <component :is="isExpanded ? 'CaretBottom' : 'CaretRight'" />
        </el-icon>
        <span class="title">导出预览</span>
        <el-tag v-if="colorStats.length" type="info" size="small">{{ colorStats.length }}种颜色</el-tag>
      </div>
    </div>

    <!-- 导出预览内容 -->
    <div v-if="isExpanded" class="export-content">
      <el-card class="preview-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span>预览图</span>
            <el-button type="primary" size="small" @click="downloadExport">
              <el-icon><Download /></el-icon>
              下载预览
            </el-button>
          </div>
        </template>

        <!-- 预览Canvas -->
        <div class="preview-canvas-wrapper">
          <canvas ref="previewCanvas" class="preview-canvas"></canvas>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { CaretRight, CaretBottom, Download } from '@element-plus/icons-vue';

// ============ Props定义 ============
// 接收要导出的配置信息
const props = defineProps({
  // 拼豆颜色数组
  colorStats: {
    type: Array,
    default: () => []
  },
  // 拼豆图纸数据
  patternGrid: {
    type: Array,
    default: () => []
  },
  // 显示数字标签
  showNumbers: {
    type: Boolean,
    default: false
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
  // 品牌标识
  selectedBrand: {
    type: String,
    default: 'MARD'
  }
});

// ============ 状态管理 ============

// 是否展开预览
const isExpanded = ref(false);

// Canvas引用
const previewCanvas = ref(null);

// ============ 事件处理 ============

// 获取对比色（用于文字）
const getContrastColor = (r, g, b) => {
  // 使用亮度公式计算背景亮度
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? '#000000' : '#ffffff';
};

// 生成导出预览图
const generatePreview = () => {
  if (!previewCanvas.value || !props.patternGrid.length) return;

  // 配置参数
  const cellSize = props.showNumbers ? 20 : 10;
  const axisMargin = props.showNumbers ? 44 : 12;
  const labelInterval = cellSize >= 20 ? 1 : 5;

  // 创建临时canvas用于绘制图纸
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  tempCanvas.width = props.gridWidth * cellSize + axisMargin * 2;
  tempCanvas.height = props.gridHeight * cellSize + axisMargin * 2;

  // ========== 绘制网格 ==========
  // 绘制格子颜色
  for (let y = 0; y < props.gridHeight; y++) {
    for (let x = 0; x < props.gridWidth; x++) {
      const cell = props.patternGrid[y]?.[x];
      if (!cell) continue;
      const cellX = axisMargin + x * cellSize;
      const cellY = axisMargin + y * cellSize;

      // 绘制格子颜色
      tempCtx.fillStyle = `rgb(${cell.color.r}, ${cell.color.g}, ${cell.color.b})`;
      tempCtx.fillRect(cellX, cellY, cellSize, cellSize);

      // 绘制网格线：每5格粗线，其他细线
      const isGridLine5X = x % 5 === 4;
      const isGridLine5Y = y % 5 === 4;
      const isGridLine5 = isGridLine5X || isGridLine5Y;

      tempCtx.strokeStyle = isGridLine5 ? '#333' : '#ddd';
      tempCtx.lineWidth = isGridLine5 ? 1.5 : 0.5;
      tempCtx.strokeRect(cellX, cellY, cellSize, cellSize);

      // 显示拼豆编号
      if (props.showNumbers && cell.code) {
        const colorCode = cell.code;
        let fontSize = cellSize * 0.55;
        tempCtx.font = `${fontSize}px Arial`;
        const textWidth = tempCtx.measureText(colorCode).width;
        if (textWidth > cellSize * 0.75) {
          fontSize = (cellSize * 0.75 / textWidth) * fontSize;
          tempCtx.font = `${fontSize}px Arial`;
        }
        const textX = cellX + cellSize / 2;
        const textY = cellY + cellSize / 2;
        const padding = 4;

        // 绘制文字背景
        tempCtx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        tempCtx.fillRect(
          textX - textWidth / 2 - padding,
          textY - fontSize / 2 - padding / 2,
          textWidth + padding * 2,
          fontSize + padding
        );

        // 绘制文字（带描边和填充）
        tempCtx.textAlign = 'center';
        tempCtx.textBaseline = 'middle';
        tempCtx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
        tempCtx.lineWidth = 2;
        tempCtx.strokeText(colorCode, textX, textY);
        tempCtx.fillStyle = getContrastColor(cell.color.r, cell.color.g, cell.color.b);
        tempCtx.fillText(colorCode, textX, textY);
      }
    }
  }

  // ========== 绘制坐标轴 ==========
  if (props.showNumbers) {
    tempCtx.save();
    // 坐标轴背景
    tempCtx.fillStyle = '#fff';
    tempCtx.fillRect(0, 0, tempCanvas.width, axisMargin);
    tempCtx.fillRect(0, 0, axisMargin, tempCanvas.height);
    tempCtx.fillRect(0, tempCanvas.height - axisMargin, tempCanvas.width, axisMargin);
    tempCtx.fillRect(tempCanvas.width - axisMargin, 0, axisMargin, tempCanvas.height);

    // 坐标轴线
    tempCtx.strokeStyle = '#666';
    tempCtx.lineWidth = 1.5;
    tempCtx.beginPath();
    tempCtx.moveTo(axisMargin, axisMargin);
    tempCtx.lineTo(axisMargin, tempCanvas.height - axisMargin);
    tempCtx.moveTo(axisMargin, axisMargin);
    tempCtx.lineTo(tempCanvas.width - axisMargin, axisMargin);
    tempCtx.stroke();

    // 绘制坐标标签
    tempCtx.fillStyle = '#333';
    tempCtx.font = 'bold 12px Arial';
    tempCtx.textBaseline = 'middle';

    for (let i = 0; i < props.gridWidth; i++) {
      if (i === 0 || i === props.gridWidth - 1 || (i + 1) % labelInterval === 0) {
        const label = `${i + 1}`;
        const x = axisMargin + i * cellSize + cellSize / 2;
        const topY = axisMargin / 2;
        const bottomY = tempCanvas.height - axisMargin / 2;

        tempCtx.textAlign = 'center';
        tempCtx.fillText(label, x, topY);
        tempCtx.fillText(label, x, bottomY);
      }
    }

    for (let i = 0; i < props.gridHeight; i++) {
      if (i === 0 || i === props.gridHeight - 1 || (i + 1) % labelInterval === 0) {
        const label = `${i + 1}`;
        const y = axisMargin + i * cellSize + cellSize / 2;
        const leftX = axisMargin / 2;
        const rightX = tempCanvas.width - axisMargin / 2;

        tempCtx.textAlign = 'right';
        tempCtx.fillText(label, leftX, y);
        tempCtx.textAlign = 'left';
        tempCtx.fillText(label, rightX, y);
      }
    }
    tempCtx.restore();
  }

  // ========== 绘制拼豆数量统计 ==========
  // 计算统计信息区域的尺寸
  const columns = 3;
  const rowHeight = 48;
  const statsHeight = Math.ceil(props.colorStats.length / columns) * rowHeight + 80;

  // 调整canvas大小以容纳统计信息
  const finalCanvas = document.createElement('canvas');
  const finalCtx = finalCanvas.getContext('2d');
  finalCanvas.width = tempCanvas.width;
  finalCanvas.height = tempCanvas.height + statsHeight;

  // 复制原始图纸到新canvas
  finalCtx.drawImage(tempCanvas, 0, 0);

  // 绘制统计信息背景区域
  const originalHeight = tempCanvas.height;
  finalCtx.fillStyle = '#f9fafb';
  finalCtx.fillRect(0, originalHeight, finalCanvas.width, statsHeight);
  finalCtx.fillStyle = '#fff';
  finalCtx.fillRect(12, originalHeight + 12, finalCanvas.width - 24, statsHeight - 24);
  finalCtx.strokeStyle = '#e6e9ed';
  finalCtx.lineWidth = 1;
  finalCtx.strokeRect(12, originalHeight + 12, finalCanvas.width - 24, statsHeight - 24);

  // 绘制统计信息标题
  finalCtx.fillStyle = '#333';
  finalCtx.font = 'bold 16px Arial';
  finalCtx.textAlign = 'left';
  finalCtx.fillText('拼豆数量统计', 24, originalHeight + 38);

  // 绘制统计信息卡片
  const columnWidth = (finalCanvas.width - 48) / columns;
  props.colorStats.forEach((stat, index) => {
    const row = Math.floor(index / columns);
    const col = index % columns;
    const x = 24 + col * columnWidth;
    const y = originalHeight + 60 + row * rowHeight;

    // 卡片背景和边框
    finalCtx.fillStyle = '#ffffff';
    finalCtx.fillRect(x, y, columnWidth - 16, rowHeight - 12);
    finalCtx.strokeStyle = '#e8edf3';
    finalCtx.lineWidth = 1;
    finalCtx.strokeRect(x, y, columnWidth - 16, rowHeight - 12);

    // 颜色块
    finalCtx.fillStyle = `rgb(${stat.color.r}, ${stat.color.g}, ${stat.color.b})`;
    finalCtx.fillRect(x + 10, y + 10, 24, 24);

    // 文字：编号与数量
    finalCtx.fillStyle = '#333';
    finalCtx.font = '14px Arial';
    finalCtx.textAlign = 'left';
    finalCtx.fillText(`${stat.code}  ${stat.count} 颗`, x + 40, y + 28);
  });

  // 显示预览canvas
  previewCanvas.value.width = finalCanvas.width;
  previewCanvas.value.height = finalCanvas.height;
  const ctx = previewCanvas.value.getContext('2d');
  ctx.drawImage(finalCanvas, 0, 0);
};

// 下载导出图
const downloadExport = () => {
  if (!previewCanvas.value || previewCanvas.value.width === 0) {
    ElMessage.warning('请先生成拼豆图纸');
    return;
  }

  const link = document.createElement('a');
  link.download = `perler-pattern-${Date.now()}.png`;
  link.href = previewCanvas.value.toDataURL('image/png');
  link.click();
};

// 监听相关属性变化，重新生成预览
watch([() => props.patternGrid, () => props.showNumbers, () => props.selectedBrand, () => props.colorStats], () => {
  if (isExpanded.value) {
    generatePreview();
  }
}, { deep: true });

// 监听展开状态，展开时生成预览
watch(isExpanded, (value) => {
  if (value) {
    generatePreview();
  }
});

// 暴露接口供父组件使用
defineExpose({
  generatePreview,
  downloadExport
});
</script>

<style scoped>
.export-preview-section {
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e4e7ed;
}

.export-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f6f8fa 0%, #e9ecef 100%);
  border-bottom: 1px solid #e4e7ed;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.3s ease;
}

.export-header:hover {
  background: linear-gradient(135deg, #f0f2f5 0%, #e0e3e8 100%);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.header-icon {
  font-size: 16px;
  color: #409EFF;
  transition: transform 0.3s ease;
}

.title {
  font-weight: bold;
  color: #303133;
  flex: 1;
}

.export-content {
  padding: 12px;
  background: white;
  min-height: 200px;
  max-height: 600px;
  overflow-y: auto;
}

.preview-card {
  width: 100%;
  border-radius: 8px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.preview-canvas-wrapper {
  width: 100%;
  max-height: 500px;
  overflow: auto;
  background: linear-gradient(135deg, #f0f2f5 0%, #e6e8eb 100%);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
}

.preview-canvas {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
