<template>
  <div class="export-preview">
    <template v-if="originalImageUrl">
      <el-card class="preview-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon class="header-icon"><PictureFilled /></el-icon>
            <span>图纸预览</span>
          </div>
        </template>
        <div ref="canvasWrapperRef" class="preview-canvas-wrapper">
          <canvas ref="previewCanvas" class="preview-canvas"></canvas>
        </div>
      </el-card>

      <div class="info-row">
        <el-card class="stats-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon class="header-icon"><DataAnalysis /></el-icon>
              <span>拼豆数量统计</span>
            </div>
          </template>

          <div class="stats-summary">
            <div class="summary-item">
              <span class="summary-dot"></span>
              <span>品牌：</span>
              <span class="summary-value">{{ selectedBrand }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-dot"></span>
              <span>颜色：</span>
              <span class="summary-value">{{ colorCount }} 种</span>
            </div>
            <div class="summary-item">
              <span class="summary-dot"></span>
              <span>总数：</span>
              <span class="summary-value">{{ totalBeads }} 颗</span>
            </div>
          </div>

          <el-table
            :data="colorStats"
            style="width: 100%"
            stripe
            max-height="400"
            class="stats-table"
          >
            <el-table-column prop="code" label="颜色编号" width="140">
              <template #default="scope">
                <div class="stat-item">
                  <div
                    class="stat-color"
                    :style="{
                      backgroundColor: `rgb(${scope.row.color.r}, ${scope.row.color.g}, ${scope.row.color.b})`
                    }"
                  ></div>
                  <span class="stat-code">{{ scope.row.code }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="count" label="数量" align="center">
              <template #default="scope">
                <el-tag type="info" size="small" class="count-tag">
                  {{ scope.row.count }} 颗
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <el-card class="export-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon class="header-icon"><Files /></el-icon>
              <span>导出数据</span>
            </div>
          </template>

          <div class="compressed-section">
            <div class="section-label">压缩数据</div>
            <el-input
              v-model="compressedData"
              type="textarea"
              :rows="4"
              readonly
              resize="none"
              class="compressed-textarea"
            />
          </div>

          <div class="export-actions">
            <el-button type="primary" @click="downloadExport">
              <el-icon><Download /></el-icon>
              下载预览
            </el-button>
            <el-button type="success" @click="copyCompressedData">
              <el-icon><CopyDocument /></el-icon>
              复制压缩数据
            </el-button>
          </div>
        </el-card>
      </div>
    </template>

    <template v-else>
      <el-card class="empty-card" shadow="hover">
        <el-empty description="请先上传图片并生成图纸" :image-size="120" />
      </el-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { Download, CopyDocument, PictureFilled, DataAnalysis, Files } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useAppStore } from '../store/appStore'
import { compressPatternGrid } from '../utils/compressionUtils'
import { drawPatternToCanvas } from '../utils/patternRenderer'
import type { ColorStat } from '../utils/patternUtils'

const appStore = useAppStore()
const {
  originalImageUrl,
  patternGrid,
  showNumbers,
  gridWidth,
  gridHeight,
  selectedBrand,
  colorStats
} = storeToRefs(appStore)

const previewCanvas = ref<HTMLCanvasElement | null>(null)
const canvasWrapperRef = ref<HTMLElement | null>(null)

const compressedData = computed(() => {
  if (!patternGrid.value.length) return ''
  return compressPatternGrid(
    patternGrid.value,
    gridWidth.value,
    gridHeight.value,
    selectedBrand.value
  )
})

const totalBeads = computed(() => colorStats.value.reduce((sum, stat) => sum + stat.count, 0))

const colorCount = computed(() => colorStats.value.length)

const generatePreview = (): void => {
  if (!previewCanvas.value || !patternGrid.value.length) return

  const cellSize = showNumbers.value ? 20 : 10
  const axisMargin = 16
  const borderOffset = 1
  const effGridWidth = gridWidth.value + borderOffset * 2
  const effGridHeight = gridHeight.value + borderOffset * 2
  const gridCanvasWidth = effGridWidth * cellSize + axisMargin * 2
  const gridCanvasHeight = effGridHeight * cellSize + axisMargin * 2

  const gridCanvas = document.createElement('canvas')
  gridCanvas.width = gridCanvasWidth
  gridCanvas.height = gridCanvasHeight
  const gridCtx = gridCanvas.getContext('2d')
  if (!gridCtx) return

  drawPatternToCanvas(gridCtx, gridCanvas, patternGrid.value, {
    gridWidth: gridWidth.value,
    gridHeight: gridHeight.value,
    cellSize,
    axisMargin,
    showNumbers: showNumbers.value,
    gridLineInterval: 5,
    showCoordinateBorder: true
  })

  const columns = 3
  const rowHeight = 48
  const headerHeight = 120
  const statsHeight = Math.ceil(colorStats.value.length / columns) * rowHeight + headerHeight

  const combinedCanvas = document.createElement('canvas')
  combinedCanvas.width = gridCanvasWidth
  combinedCanvas.height = gridCanvasHeight + statsHeight
  const combinedCtx = combinedCanvas.getContext('2d')
  if (!combinedCtx) return

  combinedCtx.drawImage(gridCanvas, 0, 0)
  drawStatsPanel(
    combinedCtx,
    combinedCanvas.width,
    gridCanvasHeight,
    colorStats.value,
    selectedBrand.value
  )

  previewCanvas.value.width = combinedCanvas.width
  previewCanvas.value.height = combinedCanvas.height
  const ctx = previewCanvas.value.getContext('2d')
  if (ctx) {
    ctx.drawImage(combinedCanvas, 0, 0)
  }
}

function drawStatsPanel(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  startY: number,
  statsData: ColorStat[],
  brand: string
): number {
  const sorted = [...statsData].sort((a, b) => b.count - a.count)
  const totalCount = sorted.reduce((sum, stat) => sum + stat.count, 0)
  const maxCount = sorted[0]?.count ?? 1

  const pad = 16
  const innerW = canvasWidth - pad * 2

  const titleH = 36
  const summaryH = 28
  const headerH = titleH + summaryH

  const columns = 2
  const colW = (innerW - pad) / columns
  const rowH = 32
  const rows = Math.ceil(sorted.length / columns)
  const tableH = rows * rowH

  const totalH = pad + headerH + pad + tableH + pad

  // Background
  ctx.fillStyle = '#fafbfc'
  ctx.fillRect(0, startY, canvasWidth, totalH)

  // Title
  ctx.fillStyle = '#1a1a2e'
  ctx.font = 'bold 15px "Microsoft YaHei", Arial, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('拼豆数量统计', pad, startY + pad + 22)

  // Summary line
  const summaryY = startY + pad + titleH + 6
  ctx.fillStyle = '#555'
  ctx.font = '12px "Microsoft YaHei", Arial, sans-serif'
  const summaryParts = [`品牌: ${brand}`, `颜色: ${sorted.length} 种`, `总数: ${totalCount} 颗`]
  let summaryX = pad
  summaryParts.forEach((part) => {
    ctx.fillText(part, summaryX, summaryY + 16)
    summaryX += ctx.measureText(part).width + 20
  })

  // Separator
  const sepY = startY + pad + headerH + pad
  ctx.strokeStyle = '#e8ecf1'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(pad, sepY)
  ctx.lineTo(canvasWidth - pad, sepY)
  ctx.stroke()

  // Color rows
  const tableY = sepY
  const barMaxW = colW - 86

  sorted.forEach((stat, index) => {
    const col = index % columns
    const row = Math.floor(index / columns)
    const x = pad + col * (colW + pad)
    const y = tableY + row * rowH
    const pct = ((stat.count / totalCount) * 100).toFixed(1)
    const barW = (stat.count / maxCount) * barMaxW

    // Swatch
    ctx.fillStyle = `rgb(${stat.color.r}, ${stat.color.g}, ${stat.color.b})`
    ctx.fillRect(x, y + 7, 16, 16)
    ctx.strokeStyle = '#d5d8dd'
    ctx.lineWidth = 1
    ctx.strokeRect(x, y + 7, 16, 16)

    // Code
    ctx.fillStyle = '#222'
    ctx.font = '11px "Consolas", "Courier New", monospace'
    ctx.textAlign = 'left'
    ctx.fillText(stat.code, x + 22, y + 17)

    // Bar background
    const barX = x + 72
    const barY = y + 11
    ctx.fillStyle = '#eef0f4'
    ctx.fillRect(barX, barY, barMaxW, 10)

    // Bar fill
    if (barW > 0) {
      ctx.fillStyle = `rgba(${stat.color.r}, ${stat.color.g}, ${stat.color.b}, 0.7)`
      ctx.fillRect(barX, barY, barW, 10)
    }

    // Count
    ctx.fillStyle = '#333'
    ctx.font = 'bold 11px "Microsoft YaHei", Arial, sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(`${stat.count} 颗 (${pct}%)`, x + colW, y + 17)
  })

  return totalH
}

const downloadExport = (): void => {
  if (!patternGrid.value.length) {
    ElMessage.warning('请先生成拼豆图纸')
    return
  }

  const cellSize = showNumbers.value ? 20 : 10
  const axisMargin = 16
  const borderOffset = 1
  const effGridWidth = gridWidth.value + borderOffset * 2
  const effGridHeight = gridHeight.value + borderOffset * 2
  const gridCanvasWidth = effGridWidth * cellSize + axisMargin * 2
  const gridCanvasHeight = effGridHeight * cellSize + axisMargin * 2

  const gridCanvas = document.createElement('canvas')
  gridCanvas.width = gridCanvasWidth
  gridCanvas.height = gridCanvasHeight
  const gridCtx = gridCanvas.getContext('2d')
  if (!gridCtx) return

  drawPatternToCanvas(gridCtx, gridCanvas, patternGrid.value, {
    gridWidth: gridWidth.value,
    gridHeight: gridHeight.value,
    cellSize,
    axisMargin,
    showNumbers: showNumbers.value,
    gridLineInterval: 5,
    showCoordinateBorder: true
  })

  const columns = 3
  const rowHeight = 48
  const headerHeight = 120
  const statsHeight = Math.ceil(colorStats.value.length / columns) * rowHeight + headerHeight

  const finalCanvas = document.createElement('canvas')
  const finalCtx = finalCanvas.getContext('2d')
  if (!finalCtx) return

  finalCanvas.width = gridCanvasWidth
  finalCanvas.height = gridCanvasHeight + statsHeight

  finalCtx.drawImage(gridCanvas, 0, 0)

  drawStatsPanel(
    finalCtx,
    finalCanvas.width,
    gridCanvasHeight,
    colorStats.value,
    selectedBrand.value
  )

  const link = document.createElement('a')
  link.download = `perler-pattern-${Date.now()}.png`
  link.href = finalCanvas.toDataURL('image/png')
  link.click()

  ElMessage.success('预览图已下载')
}

const copyCompressedData = async (): Promise<void> => {
  if (!compressedData.value) {
    ElMessage.warning('请先生成拼豆图纸')
    return
  }
  try {
    await navigator.clipboard.writeText(compressedData.value)
    ElMessage.success(`压缩数据已复制到剪贴板 (${compressedData.value.length} 字符)`)
  } catch {
    ElMessage.error('复制失败，请手动复制')
  }
}

watch(
  [patternGrid, showNumbers, selectedBrand, colorStats, gridWidth, gridHeight],
  () => {
    generatePreview()
  },
  { deep: true, immediate: true }
)

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  if (canvasWrapperRef.value) {
    resizeObserver = new ResizeObserver(() => {
      generatePreview()
    })
    resizeObserver.observe(canvasWrapperRef.value)
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
})

defineExpose({
  generatePreview,
  downloadExport
})
</script>

<style scoped>
.export-preview {
  height: 100%;
  overflow-y: auto;
  padding: 16px;
}

/* === Section Title === */
.section-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 16px;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  font-size: 18px;
  color: #409eff;
}

/* === Preview Card === */
.preview-card {
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  margin-bottom: 16px;
}

.preview-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: bold;
  color: #303133;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f6f8fa 0%, #e9ecef 100%);
  border-bottom: 1px solid #e4e7ed;
}

.header-icon {
  font-size: 16px;
  color: #409eff;
}

.preview-canvas-wrapper {
  width: 100%;
  max-height: 500px;
  overflow: auto;
  background: linear-gradient(135deg, #f0f2f5 0%, #e6e8eb 100%);
  text-align: center;
  padding: 16px;
}

.preview-canvas {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

/* === Info Row === */
.info-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.info-row > * {
  flex: 1;
  min-width: 260px;
}

/* === Stats Card === */
.stats-card {
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.stats-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.1);
}

.stats-summary {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  padding: 12px 16px;
  background: #f9fafb;
  border-bottom: 1px solid #e9ecef;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #606266;
}

.summary-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #409eff;
  flex-shrink: 0;
}

.summary-value {
  font-weight: 600;
  color: #303133;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-color {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #e4e7ed;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.stat-code {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
}

.count-tag {
  border-radius: 12px;
  padding: 0 12px;
  font-weight: 500;
}

.stats-table {
  border-radius: 0 0 12px 12px;
  overflow: hidden;
}

/* === Export Card === */
.export-card {
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.export-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.1);
}

.compressed-section {
  padding: 4px 0;
}

.section-label {
  font-size: 13px;
  font-weight: 600;
  color: #606266;
  margin-bottom: 8px;
}

.compressed-textarea :deep(.el-textarea__inner) {
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 12px;
  color: #303133;
  background: #f9fafb;
  border-radius: 8px;
  word-break: break-all;
}

.export-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.export-actions .el-button {
  flex: 1;
  height: 44px;
  font-size: 15px;
  border-radius: 8px;
}

/* === Stats Table Deep Overrides === */
.stats-card :deep(.el-table th) {
  background-color: #f8f9fa;
  font-weight: bold;
  color: #303133;
}

.stats-card :deep(.el-table tr:hover > td) {
  background-color: #f0f8ff !important;
}

.stats-card :deep(.el-table--striped .el-table__row--striped) {
  background-color: #f9fafb;
}

/* === Empty State === */
.empty-card {
  border-radius: 12px;
  transition: all 0.3s ease;
}

.empty-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.1);
}
</style>
