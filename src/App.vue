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
            v-model:brand="selectedBrand" v-model:showNumbers="showNumbers" v-model:editMode="editMode"
            v-model:lockAspectRatio="lockAspectRatio" :imageRatio="imageRatioText" @generate="generatePattern"
            @download="downloadPattern" />
          <PatternInfo :infoText="infoText" :colorStats="colorStats" />
        </el-aside>
        <el-main class="main">
          <!-- 标签页切换 -->
          <el-tabs v-model="activeTab" class="main-tabs">
            <!-- 原图预览标签页 -->
            <el-tab-pane label="原图预览" name="original">
              <template #label>
                <el-icon>
                  <Picture />
                </el-icon>
                原图预览
              </template>
              <SourceImageCard :image-url="originalImageUrl" />
            </el-tab-pane>

            <!-- 拼豆图纸标签页 -->
            <el-tab-pane label="拼豆图纸" name="pattern">
              <template #label>
                <el-icon>
                  <Grid />
                </el-icon>
                拼豆图纸
              </template>
              <PreviewSection ref="previewSection" :originalImageUrl="originalImageUrl" :gridWidth="gridWidth"
                :gridHeight="gridHeight" :cellSize="showNumbers ? 20 : 10" :axisMargin="showNumbers ? 44 : 12"
                :editMode="editMode" :editType="editType" :patternGrid="patternGrid"
                @cell-selected="setPendingSelection" @area-selected="setPendingSelection" />
            </el-tab-pane>

            <!-- 导出预览标签页 -->
            <el-tab-pane label="导出预览" name="export">
              <template #label>
                <el-icon>
                  <Download />
                </el-icon>
                导出预览
              </template>
              <ExportPreview ref="exportPreview" :colorStats="colorStats" :patternGrid="patternGrid"
                :showNumbers="showNumbers" :gridWidth="gridWidth" :gridHeight="gridHeight"
                :selectedBrand="selectedBrand" />
            </el-tab-pane>
          </el-tabs>
        </el-main>
        <el-aside width="320px" class="edit-aside" v-show="editMode">
          <EditPalette :palette="patternPalette" :activeColor="selectedEditColor" :editMode="editMode"
            :editType="editType" :hasSelection="!!pendingSelection" :hasPendingColor="!!selectedEditColor"
            @update:editMode="editMode = $event" @update:editType="editType = $event" @select="selectEditColor"
            @fill-all="fillAllWithSelectedColor" @confirm-edit="confirmPendingEdit" @cancel-edit="cancelPendingEdit" />
        </el-aside>
      </el-container>
    </el-container>

    <CropperDialog :visible="cropperVisible" :image-data="imageData" @update:visible="cropperVisible = $event"
      @upload="handleImageUploaded" />
  </div>
</template>

<script setup lang="ts">
// ============ 导入依赖 ============
// Vue核心API
import { ref, computed, watch, nextTick } from 'vue';

// 导入组件
import UploadSection from './components/UploadSection.vue';
import Controls from './components/Controls.vue';
import PreviewSection from './components/PreviewSection.vue';
import PatternInfo from './components/PatternInfo.vue';
import SourceImageCard from './components/SourceImageCard.vue';
import EditPalette from './components/EditPalette.vue';
import CropperDialog from './components/CropperDialog.vue';
import ExportPreview from './components/ExportPreview.vue';

// 导入配置数据
import colorSystemMapping from '../src/colorMap/colorSystemMapping.json';

// 导入Element Plus图标
import { Fold, Expand, Picture, Grid, Download } from '@element-plus/icons-vue';

// 导入工具函数和类型
import {
  gcd,
  findClosestColor,
  quantizeColorsUtil,
  buildPatternPalette,
  buildColorStats,
  setGridSizeByImageRatio as computeGridSizeByImageRatio
} from './utils/patternUtils';
import type { PerlerColor, PatternCell, PaletteItem, ColorStat } from './utils/patternUtils';
import { getPendingCells as getPendingCellsUtil } from './utils/selectionUtils';
import type { PendingSelection } from './utils/selectionUtils';

// ============ 类型定义 ============
interface Selection {
  type: 'cell' | 'area';
  x?: number;
  y?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
}

interface ImageData {
  offsetX: number;
  offsetY: number;
  displayWidth: number;
  displayHeight: number;
  displayScaleX: number;
  displayScaleY: number;
  image: HTMLImageElement;
}

interface UploadedImageData {
  file: File;
  url: string;
  width?: number;
  height?: number;
}

interface SelectedImageData {
  imageData: HTMLImageElement;
  imageUrl: string;
}

interface ColorUsage {
  color: PerlerColor;
  count: number;
  code: string;
}

// ============ 响应式数据 ============
/** 原始上传的图片文件 */
const originalImage = ref<File | null>(null);

/** 原始图片的URL（可以是上传或裁剪后的） */
const originalImageUrl = ref('');

/** 拼豆图纸的格子宽度（X轴格数） */
const gridWidth = ref(30);

/** 拼豆图纸的格子高度（Y轴格数） */
const gridHeight = ref(30);

/** 颜色量化的数量（图纸中最多使用的颜色数） */
const colorCount = ref(20);

/** 页面信息文本提示 */
const infoText = ref('请上传图片并生成图纸');

/** 所有可用的拼豆颜色数组 */
const perlerColors = ref<PerlerColor[]>([]);

/** 预览组件的引用 */
const previewSection = ref<InstanceType<typeof PreviewSection> | null>(null);

/** 当前选择的拼豆品牌（如MARD、Hama等） */
const selectedBrand = ref('MARD');

/** 是否显示拼豆编号 */
const showNumbers = ref(false);

/** 拼豆颜色统计数据 */
const colorStats = ref<ColorStat[]>([]);

/** 拼豆图纸的二维数据数组 */
const patternGrid = ref<PatternCell[][]>([]);

/** 是否进入编辑模式 */
const editMode = ref(false);

/** 编辑类型（'click'=单个格子，'area'=框选区域） */
const editType = ref<'click' | 'area'>('click');

/** 当前选中的编辑颜色 */
const selectedEditColor = ref<PerlerColor | null>(null);

/** 待编辑的选择区域（还未确认修改的选择） */
const pendingSelection = ref<Selection | null>(null);

/** 是否锁定宽高比 */
const lockAspectRatio = ref<boolean>(false);

/** 原始图片的尺寸 */
const originalImageSize = ref<{ width: number; height: number }>({ width: 0, height: 0 });

/** 左侧边栏是否已收起 */
const isCollapsed = ref<boolean>(false);

/** 图片裁剪对话框的可见性 */
const cropperVisible = ref<boolean>(false);

/** 裁剪所需的图片数据 */
const imageData = ref<ImageData | null>(null);

/** 导出预览组件的引用 */
// const exportPreview = ref<InstanceType<typeof ExportPreview> | null>(null);

/** 当前激活的标签页 */
const activeTab = ref<string>('original');

/**
 * 获取可用于绘图的canvas实例
 * 有时组件 expose 的 canvas 可能是 ref 对象，也可能是 DOM 节点
 */
const getPreviewCanvas = (): HTMLCanvasElement | null => {
  const canvasRef = previewSection.value?.patternCanvas;
  if (!canvasRef) return null;
  if ('getContext' in canvasRef) {
    return canvasRef;
  }
  // @ts-ignore - 处理 canvasRef 可能是 ref 对象的情况
  return canvasRef.value || null;
};

const patternPalette = computed<PaletteItem[]>(() => {
  return buildPatternPalette(perlerColors.value, patternGrid.value, selectedBrand.value);
});

const imageRatioText = computed<string>(() => {
  const { width, height } = originalImageSize.value;
  if (!width || !height) return '暂无图片';
  const ratio = gcd(width, height);
  return `${width / ratio}:${height / ratio}`;
});

const currentImageRatio = computed<number>(() => {
  const { width, height } = originalImageSize.value;
  return width && height ? width / height : gridWidth.value / gridHeight.value;
});

const ratioLocking = ref<boolean>(false);
watch(gridWidth, (newWidth) => {
  if (!lockAspectRatio.value || ratioLocking.value) return;
  ratioLocking.value = true;
  gridHeight.value = Math.max(1, Math.round(newWidth / currentImageRatio.value));
  ratioLocking.value = false;
});
watch(gridHeight, (newHeight) => {
  if (!lockAspectRatio.value || ratioLocking.value) return;
  ratioLocking.value = true;
  gridWidth.value = Math.max(1, Math.round(newHeight * currentImageRatio.value));
  ratioLocking.value = false;
});

watch([selectedBrand, patternPalette], () => {
  const currentHex = selectedEditColor.value?.hex;
  const availableHexes = patternPalette.value.map(item => item.color.hex);

  if (!currentHex || !availableHexes.includes(currentHex)) {
    selectedEditColor.value = patternPalette.value[0]?.color || null;
  }
});

// 监听标签页切换，当切换到拼豆图纸标签页时重新渲染
watch(activeTab, (newTab) => {
  if (newTab === 'pattern' && patternGrid.value.length > 0) {
    // 延迟执行以确保组件已挂载
    nextTick(() => {
      renderPatternGrid();
    });
  }
});

// 切换侧边栏
const toggleSidebar = (): void => {
  isCollapsed.value = !isCollapsed.value;
};

// 加载颜色数据
const loadColorData = (): void => {
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
const setGridSizeByImageRatio = (width: number, height: number) => {
  const size = computeGridSizeByImageRatio(width, height);
  if (!size.width || !size.height) return;
  gridWidth.value = size.width;
  gridHeight.value = size.height;
};

const handleImageUploaded = (data: UploadedImageData) => {
  originalImage.value = data.file;
  originalImageUrl.value = data.url;
  infoText.value = `图片已上传`;

  if (data.width && data.height) {
    originalImageSize.value = { width: data.width, height: data.height };
    setGridSizeByImageRatio(data.width, data.height);
  }
};

// 处理图片选择（用于裁剪）
const handleImageSelected = (data: SelectedImageData) => {
  imageData.value = {
    offsetX: 0,
    offsetY: 0,
    displayWidth: data.imageData.width,
    displayHeight: data.imageData.height,
    displayScaleX: 1,
    displayScaleY: 1,
    image: data.imageData
  };
  originalImageUrl.value = data.imageUrl;
  cropperVisible.value = true;
};

const refreshColorStats = (): void => {
  colorStats.value = buildColorStats(patternGrid.value);
  if (!selectedEditColor.value && colorStats.value.length) {
    selectedEditColor.value = colorStats.value[0].color;
  }
};

/**
 * 渲染拼豆图纸到canvas
 * 功能：绘制网格、颜色、编号、坐标轴等
 * 细节：每5格绘制粗线，其他位置细线
 */
const renderPatternGrid = (): void => {
  // 获取canvas引用
  const canvas = getPreviewCanvas();
  if (!canvas) {
    // 如果canvas还没准备好，延迟执行
    setTimeout(renderPatternGrid, 100);
    return;
  }

  if (!patternGrid.value.length) return;

  // 获取2D绘图上下文
  const ctx = canvas.getContext('2d');

  // ========== 配置参数 ==========
  // 单个格子的像素大小
  const cellSize = showNumbers.value ? 40 : 20;
  // 坐标轴的边距
  const axisMargin = showNumbers.value ? 44 : 12;
  // 坐标标签的显示间隔
  const labelInterval = cellSize >= 40 ? 1 : 5;

  // ========== 初始化canvas ==========
  // 计算canvas总大小（包括坐标轴）
  canvas.width = gridWidth.value * cellSize + axisMargin * 2;
  canvas.height = gridHeight.value * cellSize + axisMargin * 2;

  // 清空canvas内容
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // ========== 绘制网格格子和颜色 ==========
  for (let y = 0; y < gridHeight.value; y++) {
    for (let x = 0; x < gridWidth.value; x++) {
      // 获取格子数据
      const cell = patternGrid.value[y]?.[x];
      if (!cell) continue;

      // 计算格子的实际像素位置
      const cellX = axisMargin + x * cellSize;
      const cellY = axisMargin + y * cellSize;

      // 绘制格子颜色
      ctx.fillStyle = `rgb(${cell.color.r}, ${cell.color.g}, ${cell.color.b})`;
      ctx.fillRect(cellX, cellY, cellSize, cellSize);

      // ========== 绘制网格线（每5格粗线，其他细线）==========
      // 判断是否在5格的边界上
      const isGridLine5X = (x + 1) % 5 === 0;
      const isGridLine5Y = (y + 1) % 5 === 0;

      // 根据位置决定线条粗细
      if (isGridLine5X || isGridLine5Y) {
        // 5格边界线：粗线（黑色）
        ctx.beginPath();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1.5;
        if (isGridLine5X) {
          ctx.moveTo(cellX + cellSize, cellY);
          ctx.lineTo(cellX + cellSize, cellY + cellSize);
          ctx.stroke();
        }
        if (isGridLine5Y) {
          ctx.moveTo(cellX, cellY + cellSize);
          ctx.lineTo(cellX + cellSize, cellY + cellSize);
          ctx.stroke();
        }
      } else {
        // 其他边界线：细线（浅灰色）
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(cellX, cellY, cellSize, cellSize);
      }

      // ========== 绘制拼豆编号 ==========
      if (showNumbers.value && cell.code) {
        const colorCode = cell.code;
        let fontSize = cellSize * 0.55;

        // 设置字体
        ctx.font = `${fontSize}px Arial`;
        const textWidth = ctx.measureText(colorCode).width;

        // 如果文字超过格子宽度，缩小字体
        if (textWidth > cellSize * 0.75) {
          fontSize = (cellSize * 0.75 / textWidth) * fontSize;
          ctx.font = `${fontSize}px Arial`;
        }

        // 计算文字位置（居中）
        const textX = cellX + cellSize / 2;
        const textY = cellY + cellSize / 2;

        // 绘制文字（含描边和填充以增强可读性）
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
  if (showNumbers.value) {
    ctx.save();

    // 绘制坐标轴背景（白色）
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, axisMargin);
    ctx.fillRect(0, 0, axisMargin, canvas.height);
    ctx.fillRect(0, canvas.height - axisMargin, canvas.width, axisMargin);
    ctx.fillRect(canvas.width - axisMargin, 0, axisMargin, canvas.height);

    // 绘制坐标轴边框线
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(axisMargin, axisMargin);
    ctx.lineTo(axisMargin, canvas.height - axisMargin);
    ctx.moveTo(axisMargin, axisMargin);
    ctx.lineTo(canvas.width - axisMargin, axisMargin);
    ctx.stroke();

    // ========== 绘制X轴标签 ==========
    ctx.fillStyle = '#333';
    ctx.font = 'bold 12px Arial';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < gridWidth.value; i++) {
      // 仅在边界和间隔位置显示标签
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

    // ========== 绘制Y轴标签 ==========
    for (let i = 0; i < gridHeight.value; i++) {
      // 仅在边界和间隔位置显示标签
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

  // ========== 绘制编辑预览 ==========
  // 绘制待定的编辑预览（鼠标选中但未确认的区域）
  drawPendingPreview(ctx, axisMargin, cellSize);

  // ========== 绘制统计信息（仅保留在导出预览中）==========
  // 注：现在统计信息只在导出预览中显示，主图纸中不显示
};

const updateCellColor = (gridX: number, gridY: number, color: PerlerColor) => {
  const cell = patternGrid.value[gridY]?.[gridX];
  if (!cell || !color) return;
  cell.color = color;
  cell.code = color.info?.[selectedBrand.value] || cell.code || '';
};

const drawPendingPreview = (ctx: CanvasRenderingContext2D, axisMargin: number, cellSize: number) => {
  if (!pendingSelection.value || !selectedEditColor.value) return;

  const previewCells = getPendingCellsUtil(pendingSelection.value, gridWidth.value, gridHeight.value);
  if (!previewCells.length) return;

  ctx.save();
  ctx.fillStyle = `rgba(${selectedEditColor.value.r}, ${selectedEditColor.value.g}, ${selectedEditColor.value.b}, 0.45)`;
  previewCells.forEach(({ x, y }) => {
    ctx.fillRect(axisMargin + x * cellSize, axisMargin + y * cellSize, cellSize, cellSize);
  });

  ctx.strokeStyle = '#409EFF';
  ctx.lineWidth = 2;
  if (pendingSelection.value.type === 'area') {
    const x1 = Math.min(pendingSelection.value.x1 || 0, pendingSelection.value.x2 || 0);
    const y1 = Math.min(pendingSelection.value.y1 || 0, pendingSelection.value.y2 || 0);
    const x2 = Math.max(pendingSelection.value.x1 || 0, pendingSelection.value.x2 || 0);
    const y2 = Math.max(pendingSelection.value.y1 || 0, pendingSelection.value.y2 || 0);
    ctx.strokeRect(
      axisMargin + x1 * cellSize,
      axisMargin + y1 * cellSize,
      (x2 - x1 + 1) * cellSize,
      (y2 - y1 + 1) * cellSize
    );
  } else {
    const x = pendingSelection.value.x || 0;
    const y = pendingSelection.value.y || 0;
    ctx.strokeRect(
      axisMargin + x * cellSize,
      axisMargin + y * cellSize,
      cellSize,
      cellSize
    );
  }
  ctx.restore();
};

const setPendingSelection = (selection: PendingSelection) => {
  if (!editMode.value) return;
  pendingSelection.value = selection;
  renderPatternGrid();
};

const confirmPendingEdit = (): void => {
  if (!pendingSelection.value || !selectedEditColor.value) return;

  const pendingCells = getPendingCellsUtil(pendingSelection.value, gridWidth.value, gridHeight.value);
  const color = selectedEditColor.value;
  pendingCells.forEach(({ x, y }) => {
    updateCellColor(x, y, color);
  });

  pendingSelection.value = null;
  renderPatternGrid();
  refreshColorStats();
};

const cancelPendingEdit = (): void => {
  pendingSelection.value = null;
  renderPatternGrid();
};

const fillAllWithSelectedColor = (): void => {
  const color = selectedEditColor.value;
  if (!color) return;
  patternGrid.value.forEach((row) => {
    row.forEach((cell) => {
      cell.color = color;
      cell.code = color.info?.[selectedBrand.value] || cell.code || '';
    });
  });
  pendingSelection.value = null;
  renderPatternGrid();
  refreshColorStats();
};

const selectEditColor = (color: PerlerColor) => {
  selectedEditColor.value = color;
  if (pendingSelection.value) {
    renderPatternGrid();
  }
};

// 生成拼豆图纸
const generatePattern = (): void => {
  if (!originalImage.value) {
    alert('请先上传图片');
    return;
  }

  if (perlerColors.value.length === 0) {
    alert('颜色数据未加载完成，请稍后重试');
    return;
  }

  // 切换到拼豆图纸标签页
  activeTab.value = 'pattern';

  // 等待组件挂载后再生成
  nextTick(() => {
    generatePatternData();
  });
};

// 生成拼豆图纸数据的内部函数
const generatePatternData = (): void => {

  // 绘制原始图片到临时画布进行处理
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) return;
  tempCanvas.width = Math.max(1, gridWidth.value);
  tempCanvas.height = Math.max(1, gridHeight.value);

  const img = new Image();
  img.onload = () => {
    tempCtx.drawImage(img, 0, 0, gridWidth.value, gridHeight.value);

    // 获取像素数据
    const imageData = tempCtx.getImageData(0, 0, gridWidth.value, gridHeight.value);
    const pixels = imageData.data;

    // 颜色量化
    const colorMap = quantizeColorsUtil(pixels, colorCount.value, perlerColors.value);

    const colorUsage: Record<string, ColorUsage> = {};
    patternGrid.value = [];

    for (let y = 0; y < gridHeight.value; y++) {
      const row: PatternCell[] = [];
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
    selectedEditColor.value = selectedEditColor.value || patternPalette.value[0]?.color || null;
    renderPatternGrid();
    infoText.value = `拼豆图纸已生成: ${gridWidth.value}x${gridHeight.value} 网格, ${colorCount.value} 种颜色`;
  };
  img.src = originalImageUrl.value;
};

// 下载图纸
const downloadPattern = (): void => {
  const canvas = getPreviewCanvas();
  if (!canvas || canvas.width === 0) {
    alert('请先生成拼豆图纸');
    return;
  }

  const link = document.createElement('a');
  link.download = 'perler-pattern.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
};


// 绘制统计信息到画布 (暂时未使用)
/*
const drawStatsToCanvas = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
  if (colorStats.value.length === 0) return;

  // 计算统计信息区域的高度
  const columns = 3;
  const rowHeight = 48;
  const statsHeight = Math.ceil(colorStats.value.length / columns) * rowHeight + 80;
  const originalHeight = canvas.height;

  // 调整画布大小
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) return;
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
  colorStats.value.forEach((stat: ColorStat, index) => {
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

    // 文字：编号与数量同一行显示
    tempCtx.fillStyle = '#333';
    tempCtx.font = '14px Arial';
    tempCtx.textAlign = 'left';
    tempCtx.fillText(`${stat.code}  ${stat.count} 颗`, x + 40, y + 28);
  });

  // 更新原始画布
  canvas.width = tempCanvas.width;
  canvas.height = tempCanvas.height;
  ctx.drawImage(tempCanvas, 0, 0);
};
*/

// 获取对比色（用于文字）
const getContrastColor = (r: number, g: number, b: number): string => {
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

.edit-aside {
  background-color: white;
  border-left: 1px solid #e4e7ed;
  padding: 20px;
  overflow-y: auto;
  box-shadow: -2px 0 12px 0 rgba(0, 0, 0, 0.05);
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
  background: white;
  border-radius: 8px;
  margin: 16px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.08);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.main-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.main-tabs :deep(.el-tabs__header) {
  margin: 0;
  background: linear-gradient(135deg, #f6f8fa 0%, #e9ecef 100%);
  border-bottom: 1px solid #e4e7ed;
}

.main-tabs :deep(.el-tabs__nav-wrap::after) {
  display: none;
}

.main-tabs :deep(.el-tabs__item) {
  border: none;
  background: transparent;
  color: #606266;
  font-weight: 500;
  padding: 0 24px;
  height: 56px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.main-tabs :deep(.el-tabs__item:hover) {
  color: #409EFF;
  background: rgba(64, 158, 255, 0.05);
}

.main-tabs :deep(.el-tabs__item.is-active) {
  color: #409EFF;
  background: white;
  border-bottom: 3px solid #409EFF;
  font-weight: bold;
}

.main-tabs :deep(.el-tabs__item .el-icon) {
  font-size: 18px;
}

.main-tabs :deep(.el-tabs__content) {
  flex: 1;
  padding: 0;
  overflow: hidden;
}

.main-tabs :deep(.el-tab-pane) {
  height: 100%;
  padding: 20px;
  overflow-y: auto;
}

/**
 * 拼豆图纸编辑区域
 * 包含canvas和缩放平移控件
 */
.pattern-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 400px;
}

/**
 * 图纸区域的标题
 */
.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
  padding: 0 4px;
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