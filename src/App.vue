<template>
  <div class="app-container">
    <el-container>
      <el-header height="60px" class="header">
        <div class="header-content">
          <el-button type="primary" circle size="small" @click="toggleSidebar" class="collapse-btn">
            <template v-if="isCollapsed">
              <el-icon :size="24">
                <Expand />
              </el-icon>
            </template>
            <template v-else>
              <el-icon :size="24">
                <Fold />
              </el-icon>
            </template>
          </el-button>
          <h1 class="title">拼豆图纸生成器</h1>
        </div>
      </el-header>
      <el-container>
        <el-aside :width="isCollapsed ? '0px' : '300px'" class="aside" :class="{ 'collapsed': isCollapsed }">
          <UploadSection :image-url="originalImageUrl" @image-uploaded="handleImageUploaded"
            @image-selected="handleImageSelected" />
          <Controls v-model:gridWidth="gridWidth" v-model:gridHeight="gridHeight" v-model:colorCount="colorCount"
            v-model:brand="selectedBrand" v-model:showNumbers="showNumbers" @generate="generatePattern"
            @download="downloadPattern" />
          <EditPalette :palette="patternPalette" :activeColor="selectedEditColor" :editMode="editMode"
            @update:editMode="editMode = $event" @select="selectEditColor" @fill-all="fillAllWithSelectedColor" />
          <PatternInfo :infoText="infoText" :colorStats="colorStats" />
        </el-aside>
        <el-main class="main">
          <SourceImageCard :image-url="originalImageUrl" />
          <PreviewSection ref="previewSection" :originalImageUrl="originalImageUrl" :gridWidth="gridWidth"
            :gridHeight="gridHeight" :cellSize="showNumbers ? 20 : 10" :axisMargin="showNumbers ? 44 : 12"
            :editMode="editMode" @cell-edit="applyPatternEdit" />
        </el-main>
      </el-container>
    </el-container>

    <CropperDialog :visible="cropperVisible" :image-data="imageData" @update:visible="cropperVisible = $event"
      @upload="handleImageUploaded" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import UploadSection from './components/UploadSection.vue';
import Controls from './components/Controls.vue';
import PreviewSection from './components/PreviewSection.vue';
import PatternInfo from './components/PatternInfo.vue';
import SourceImageCard from './components/SourceImageCard.vue';
import EditPalette from './components/EditPalette.vue';
import CropperDialog from './components/CropperDialog.vue';
import colorSystemMapping from '../src/colorMap/colorSystemMapping.json';
import { Fold, Expand } from '@element-plus/icons-vue';

// 响应式数据
const originalImage = ref(null);
const originalImageUrl = ref('');
const gridWidth = ref(30);
const gridHeight = ref(30);
const colorCount = ref(8);
const infoText = ref('请上传图片并生成图纸');
const perlerColors = ref([]);
const previewSection = ref(null);
const selectedBrand = ref('MARD');
const showNumbers = ref(false);
const colorStats = ref([]);
const patternGrid = ref([]);
const editMode = ref(false);
const selectedEditColor = ref(null);
const isCollapsed = ref(false);

const patternPalette = computed(() => colorStats.value.map(item => ({
  code: item.code,
  color: item.color
})));

// 裁剪相关数据
const cropperVisible = ref(false);
const imageData = ref(null);

// 切换侧边栏
const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value;
};

// 加载颜色数据
const loadColorData = () => {
  try {
    const colors = [];

    for (const [hex, info] of Object.entries(colorSystemMapping)) {
      const r = parseInt(hex.substring(1, 3), 16);
      const g = parseInt(hex.substring(3, 5), 16);
      const b = parseInt(hex.substring(5, 7), 16);
      colors.push({ r, g, b, hex, info });
    }

    perlerColors.value = colors;
    console.log(`已加载 ${perlerColors.value.length} 种拼豆颜色`);
  } catch (error) {
    console.error('加载颜色数据失败:', error);
    infoText.value = '加载颜色数据失败，请检查colorSystemMapping.json文件';
  }
};

// 处理图片上传
const handleImageUploaded = (data) => {
  originalImage.value = data.file;
  originalImageUrl.value = data.url;
  infoText.value = `图片已上传`;
};

// 处理图片选择（用于裁剪）
const handleImageSelected = (data) => {
  imageData.value = data.imageData;
  originalImageUrl.value = data.imageUrl;
  cropperVisible.value = true;
};

// 找到最接近的颜色
const findClosestColor = (color, colorMap) => {
  let closestColor = colorMap[0];
  let minDistance = Infinity;

  colorMap.forEach(mapColor => {
    const distance = Math.sqrt(
      Math.pow(color.r - mapColor.r, 2) +
      Math.pow(color.g - mapColor.g, 2) +
      Math.pow(color.b - mapColor.b, 2)
    );

    if (distance < minDistance) {
      minDistance = distance;
      closestColor = mapColor;
    }
  });

  return closestColor;
};

// 颜色量化
const quantizeColors = (pixels, count) => {
  const colorFreq = {};

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];

    const closestColor = findClosestColor({ r, g, b }, perlerColors.value);
    const key = `${closestColor.r},${closestColor.g},${closestColor.b}`;
    colorFreq[key] = (colorFreq[key] || 0) + 1;
  }

  const sortedColors = Object.keys(colorFreq)
    .sort((a, b) => colorFreq[b] - colorFreq[a])
    .slice(0, count);

  const colorMap = [];
  sortedColors.forEach(colorStr => {
    const [r, g, b] = colorStr.split(',').map(Number);
    const colorObj = perlerColors.value.find(c => c.r === r && c.g === g && c.b === b);
    colorMap.push(colorObj || { r, g, b });
  });

  return colorMap;
};

const refreshColorStats = () => {
  const usage = {};
  patternGrid.value.forEach((row) => {
    row.forEach((cell) => {
      const key = `${cell.color.r},${cell.color.g},${cell.color.b}`;
      if (!usage[key]) {
        usage[key] = {
          color: cell.color,
          count: 0,
          code: cell.code || ''
        };
      }
      usage[key].count++;
    });
  });

  colorStats.value = Object.values(usage)
    .filter(item => item.code)
    .sort((a, b) => b.count - a.count);

  if (!selectedEditColor.value && colorStats.value.length) {
    selectedEditColor.value = colorStats.value[0].color;
  }
};

const renderPatternGrid = () => {
  const canvas = previewSection.value?.patternCanvas;
  if (!canvas || !patternGrid.value.length) return;

  const ctx = canvas.getContext('2d');
  const cellSize = showNumbers.value ? 20 : 10;
  const axisMargin = showNumbers.value ? 44 : 12;
  const labelInterval = cellSize >= 20 ? 1 : 5;

  canvas.width = gridWidth.value * cellSize + axisMargin * 2;
  canvas.height = gridHeight.value * cellSize + axisMargin * 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < gridHeight.value; y++) {
    for (let x = 0; x < gridWidth.value; x++) {
      const cell = patternGrid.value[y]?.[x];
      if (!cell) continue;
      const cellX = axisMargin + x * cellSize;
      const cellY = axisMargin + y * cellSize;

      ctx.fillStyle = `rgb(${cell.color.r}, ${cell.color.g}, ${cell.color.b})`;
      ctx.fillRect(cellX, cellY, cellSize, cellSize);
      ctx.strokeStyle = '#ddd';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(cellX, cellY, cellSize, cellSize);

      if (showNumbers.value && cell.code) {
        const colorCode = cell.code;
        let fontSize = cellSize * 0.55;
        ctx.font = `${fontSize}px Arial`;
        const textWidth = ctx.measureText(colorCode).width;
        if (textWidth > cellSize * 0.75) {
          fontSize = (cellSize * 0.75 / textWidth) * fontSize;
          ctx.font = `${fontSize}px Arial`;
        }
        const textX = cellX + cellSize / 2;
        const textY = cellY + cellSize / 2;
        const padding = 4;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.fillRect(
          textX - textWidth / 2 - padding,
          textY - fontSize / 2 - padding / 2,
          textWidth + padding * 2,
          fontSize + padding
        );

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

  if (showNumbers.value) {
    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, axisMargin);
    ctx.fillRect(0, 0, axisMargin, canvas.height);
    ctx.fillRect(0, canvas.height - axisMargin, canvas.width, axisMargin);
    ctx.fillRect(canvas.width - axisMargin, 0, axisMargin, canvas.height);

    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(axisMargin, axisMargin);
    ctx.lineTo(axisMargin, canvas.height - axisMargin);
    ctx.moveTo(axisMargin, axisMargin);
    ctx.lineTo(canvas.width - axisMargin, axisMargin);
    ctx.stroke();

    ctx.fillStyle = '#333';
    ctx.font = 'bold 12px Arial';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < gridWidth.value; i++) {
      if (i === 0 || i === gridWidth.value - 1 || (i + 1) % labelInterval === 0) {
        const label = `${i + 1}`;
        const x = axisMargin + i * cellSize + cellSize / 2;
        const topY = axisMargin / 2;
        const bottomY = canvas.height - axisMargin / 2;

        ctx.textAlign = 'center';
        ctx.fillText(label, x, topY);
        ctx.fillText(label, x, bottomY);
      }
    }

    for (let i = 0; i < gridHeight.value; i++) {
      if (i === 0 || i === gridHeight.value - 1 || (i + 1) % labelInterval === 0) {
        const label = `${i + 1}`;
        const y = axisMargin + i * cellSize + cellSize / 2;
        const leftX = axisMargin / 2;
        const rightX = canvas.width - axisMargin / 2;

        ctx.textAlign = 'right';
        ctx.fillText(label, leftX, y);
        ctx.textAlign = 'left';
        ctx.fillText(label, rightX, y);
      }
    }
    ctx.restore();
  }

  drawStatsToCanvas(ctx, canvas, cellSize);
};

const updateCellColor = (gridX, gridY, color) => {
  const cell = patternGrid.value[gridY]?.[gridX];
  if (!cell || !color) return;
  cell.color = color;
  cell.code = color.info?.[selectedBrand.value] || cell.code || '';
  renderPatternGrid();
  refreshColorStats();
};

const applyPatternEdit = ({ gridX, gridY }) => {
  if (!editMode.value || !selectedEditColor.value) return;
  updateCellColor(gridX, gridY, selectedEditColor.value);
};

const fillAllWithSelectedColor = () => {
  if (!selectedEditColor.value) return;
  patternGrid.value.forEach((row) => {
    row.forEach((cell) => {
      cell.color = selectedEditColor.value;
      cell.code = selectedEditColor.value.info?.[selectedBrand.value] || cell.code || '';
    });
  });
  renderPatternGrid();
  refreshColorStats();
};

const selectEditColor = (color) => {
  selectedEditColor.value = color;
};

// 生成拼豆图纸
const generatePattern = () => {
  if (!originalImage.value) {
    alert('请先上传图片');
    return;
  }

  if (perlerColors.value.length === 0) {
    alert('颜色数据未加载完成，请稍后重试');
    return;
  }

  const canvas = previewSection.value.patternCanvas;
  const ctx = canvas.getContext('2d');

  // 设置画布大小
  canvas.width = Math.max(1, gridWidth.value * 10);
  canvas.height = Math.max(1, gridHeight.value * 10);

  // 绘制原始图片到临时画布进行处理
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  tempCanvas.width = Math.max(1, gridWidth.value);
  tempCanvas.height = Math.max(1, gridHeight.value);

  const img = new Image();
  img.onload = () => {
    tempCtx.drawImage(img, 0, 0, gridWidth.value, gridHeight.value);

    // 获取像素数据
    const imageData = tempCtx.getImageData(0, 0, gridWidth.value, gridHeight.value);
    const pixels = imageData.data;

    // 颜色量化
    const colorMap = quantizeColors(pixels, colorCount.value);

    const cellSize = showNumbers.value ? 20 : 10;
    const axisMargin = showNumbers.value ? 44 : 12;
    const labelInterval = cellSize >= 20 ? 1 : 5;
    const colorUsage = {};
    patternGrid.value = [];

    for (let y = 0; y < gridHeight.value; y++) {
      const row = [];
      for (let x = 0; x < gridWidth.value; x++) {
        const index = (y * gridWidth.value + x) * 4;
        const r = pixels[index];
        const g = pixels[index + 1];
        const b = pixels[index + 2];
        const closestColor = findClosestColor({ r, g, b }, colorMap);
        const colorCode = closestColor.info ? closestColor.info[selectedBrand.value] || '' : '';

        row.push({
          color: closestColor,
          code: colorCode
        });

        const colorKey = `${closestColor.r},${closestColor.g},${closestColor.b}`;
        if (!colorUsage[colorKey]) {
          colorUsage[colorKey] = {
            color: closestColor,
            count: 0,
            code: colorCode
          };
        }
        colorUsage[colorKey].count++;
      }
      patternGrid.value.push(row);
    }

    refreshColorStats();
    selectedEditColor.value = selectedEditColor.value || patternPalette.value[0]?.color || selectedEditColor.value;
    renderPatternGrid();
    infoText.value = `拼豆图纸已生成: ${gridWidth.value}x${gridHeight.value} 网格, ${colorCount.value} 种颜色`;
  };
  img.src = originalImageUrl.value;
};

// 下载图纸
const downloadPattern = () => {
  const canvas = previewSection.value.patternCanvas;
  if (canvas.width === 0) {
    alert('请先生成拼豆图纸');
    return;
  }

  const link = document.createElement('a');
  link.download = 'perler-pattern.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
};


// 绘制统计信息到画布
const drawStatsToCanvas = (ctx, canvas, cellSize) => {
  if (colorStats.value.length === 0) return;

  // 计算统计信息区域的高度
  const columns = 3;
  const rowHeight = 48;
  const statsHeight = Math.ceil(colorStats.value.length / columns) * rowHeight + 80;
  const originalHeight = canvas.height;

  // 调整画布大小
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  tempCanvas.width = canvas.width;
  tempCanvas.height = originalHeight + statsHeight;

  // 复制原始画布内容
  tempCtx.drawImage(canvas, 0, 0);

  // 背景区域
  tempCtx.fillStyle = '#f9fafb';
  tempCtx.fillRect(0, originalHeight, canvas.width, statsHeight);
  tempCtx.fillStyle = '#fff';
  tempCtx.fillRect(12, originalHeight + 12, canvas.width - 24, statsHeight - 24);
  tempCtx.strokeStyle = '#e6e9ed';
  tempCtx.lineWidth = 1;
  tempCtx.strokeRect(12, originalHeight + 12, canvas.width - 24, statsHeight - 24);

  // 标题
  tempCtx.fillStyle = '#333';
  tempCtx.font = 'bold 16px Arial';
  tempCtx.textAlign = 'left';
  tempCtx.fillText('拼豆数量统计', 24, originalHeight + 38);

  const columnWidth = (canvas.width - 48) / columns;
  colorStats.value.forEach((stat, index) => {
    const row = Math.floor(index / columns);
    const col = index % columns;
    const x = 24 + col * columnWidth;
    const y = originalHeight + 60 + row * rowHeight;

    // 卡片背景
    tempCtx.fillStyle = '#ffffff';
    tempCtx.fillRect(x, y, columnWidth - 16, rowHeight - 12);
    tempCtx.strokeStyle = '#e8edf3';
    tempCtx.lineWidth = 1;
    tempCtx.strokeRect(x, y, columnWidth - 16, rowHeight - 12);

    // 颜色块
    tempCtx.fillStyle = `rgb(${stat.color.r}, ${stat.color.g}, ${stat.color.b})`;
    tempCtx.fillRect(x + 10, y + 10, 24, 24);

    // 文字
    tempCtx.fillStyle = '#333';
    tempCtx.font = '14px Arial';
    tempCtx.textAlign = 'left';
    tempCtx.fillText(stat.code, x + 40, y + 19);

    tempCtx.fillStyle = '#666';
    tempCtx.font = '12px Arial';
    tempCtx.fillText(`${stat.count} 颗`, x + 40, y + 37);
  });

  // 更新原始画布
  canvas.width = tempCanvas.width;
  canvas.height = tempCanvas.height;
  ctx.drawImage(tempCanvas, 0, 0);
};

// 获取对比色（用于文字）
const getContrastColor = (r, g, b) => {
  // 计算亮度
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? '#000000' : '#ffffff';
};

// 初始化颜色数据
loadColorData();
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
  font-family: 'Microsoft YaHei', Arial, sans-serif;
  background-color: #f0f2f5;
}

#app {
  height: 100%;
  width: 100%;
  overflow: hidden;
}

.app-container {
  height: 100%;
  width: 100%;
  overflow: hidden;
}

.header {
  background: linear-gradient(135deg, #409EFF 0%, #69c0ff 100%);
  color: white;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.header:hover {
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.15);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  padding: 0 20px;
}

.collapse-btn {
  background-color: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
}

.collapse-btn:hover {
  background-color: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  transform: scale(1.1);
}

.title {
  font-size: 28px;
  font-weight: bold;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  letter-spacing: 2px;
}

.aside {
  background-color: white;
  border-right: 1px solid #e4e7ed;
  padding: 20px;
  overflow-y: auto;
  box-shadow: 2px 0 12px 0 rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
  box-sizing: border-box;
}

.edit-panel {
  width: 100%;
}

.edit-title {
  margin-bottom: 12px;
}

.edit-card {
  width: 100%;
  border-radius: 12px;
}

.palette-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 16px;
}

.palette-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid #e9edf3;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.palette-item.active {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.12);
}

.palette-swatch {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.edit-actions {
  display: flex;
  justify-content: flex-start;
  margin-top: 16px;
}

.main {
  background-color: #f0f2f5;
  padding: 20px;
  overflow: auto;
  background-image: linear-gradient(45deg, #f5f7fa 25%, transparent 25%, transparent 75%, #f5f7fa 75%, #f5f7fa),
    linear-gradient(45deg, #f5f7fa 25%, transparent 25%, transparent 75%, #f5f7fa 75%, #f5f7fa);
  background-size: 20px 20px;
  background-position: 0 0, 10px 10px;
  height: 100%;
  box-sizing: border-box;
}

.el-container {
  height: 100%;
  width: 100%;
  min-height: 100%;
}

.el-container.is-vertical {
  height: 100%;
  min-height: 100%;
}

/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
