<template>
  <el-card class="export-card" shadow="hover">
    <div v-if="originalImageUrl" class="export-content">
      <div class="preview-canvas-wrapper">
        <canvas ref="previewCanvas" class="preview-canvas"></canvas>
      </div>

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
          <el-icon>
            <Download />
          </el-icon>
          下载预览
        </el-button>
        <el-button type="success" @click="copyCompressedData">
          <el-icon>
            <CopyDocument />
          </el-icon>
          复制压缩数据
        </el-button>
      </div>
    </div>
    <div v-else class="export-placeholder">
      <p>请先上传原图并生成图纸。</p>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { Download, CopyDocument } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useAppStore } from '../store/appStore'
import { compressPatternGrid } from '../utils/compressionUtils'
import { drawPatternToCanvas } from '../utils/patternRenderer'

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

const compressedData = computed(() => {
  if (!patternGrid.value.length) return ''
  return compressPatternGrid(
    patternGrid.value,
    gridWidth.value,
    gridHeight.value,
    selectedBrand.value
  )
})

const generatePreview = (): void => {
  if (!previewCanvas.value || !patternGrid.value.length) return

  const cellSize = showNumbers.value ? 20 : 10
  const axisMargin = showNumbers.value ? 44 : 12

  const tempCanvas = document.createElement('canvas')
  const tempCtx = tempCanvas.getContext('2d')
  if (!tempCtx) return

  tempCanvas.width = gridWidth.value * cellSize + axisMargin * 2
  tempCanvas.height = gridHeight.value * cellSize + axisMargin * 2

  drawPatternToCanvas(tempCtx, tempCanvas, patternGrid.value, {
    gridWidth: gridWidth.value,
    gridHeight: gridHeight.value,
    cellSize,
    axisMargin,
    showNumbers: showNumbers.value,
    gridLineInterval: 5
  })

  const columns = 3
  const rowHeight = 48
  const headerHeight = 120
  const statsHeight = Math.ceil(colorStats.value.length / columns) * rowHeight + headerHeight

  const finalCanvas = document.createElement('canvas')
  const finalCtx = finalCanvas.getContext('2d')
  if (!finalCtx) return

  finalCanvas.width = tempCanvas.width
  finalCanvas.height = tempCanvas.height + statsHeight

  finalCtx.drawImage(tempCanvas, 0, 0)

  const originalHeight = tempCanvas.height
  finalCtx.fillStyle = '#f9fafb'
  finalCtx.fillRect(0, originalHeight, finalCanvas.width, statsHeight)

  finalCtx.fillStyle = '#fff'
  finalCtx.fillRect(12, originalHeight + 12, finalCanvas.width - 24, headerHeight - 24)
  finalCtx.strokeStyle = '#e6e9ed'
  finalCtx.lineWidth = 1
  finalCtx.strokeRect(12, originalHeight + 12, finalCanvas.width - 24, headerHeight - 24)

  finalCtx.fillStyle = '#333'
  finalCtx.font = 'bold 16px Arial'
  finalCtx.textAlign = 'left'
  finalCtx.fillText('拼豆数量统计', 24, originalHeight + 38)

  const totalCount = colorStats.value.reduce((sum, stat) => sum + stat.count, 0)
  const colorCountVal = colorStats.value.length

  finalCtx.fillStyle = '#666'
  finalCtx.font = '14px Arial'
  finalCtx.fillText(`品牌: ${selectedBrand.value}`, 24, originalHeight + 58)
  finalCtx.fillText(`颜色数量: ${colorCountVal} 种`, 24, originalHeight + 78)
  finalCtx.fillText(`总数量: ${totalCount} 颗`, 24, originalHeight + 98)

  const tableStartY = originalHeight + headerHeight - 12
  finalCtx.fillStyle = '#f8f9fa'
  finalCtx.fillRect(12, tableStartY, finalCanvas.width - 24, 32)
  finalCtx.strokeStyle = '#dee2e6'
  finalCtx.lineWidth = 1
  finalCtx.strokeRect(12, tableStartY, finalCanvas.width - 24, 32)

  finalCtx.fillStyle = '#303133'
  finalCtx.font = 'bold 14px Arial'
  finalCtx.textAlign = 'left'
  finalCtx.fillText('颜色编号', 32, tableStartY + 22)
  finalCtx.textAlign = 'right'
  finalCtx.fillText('数量', finalCanvas.width - 32, tableStartY + 22)

  const tableBodyStartY = tableStartY + 32
  const tableHeight = Math.ceil(colorStats.value.length / columns) * rowHeight
  finalCtx.fillStyle = '#fff'
  finalCtx.fillRect(12, tableBodyStartY, finalCanvas.width - 24, tableHeight)
  finalCtx.strokeStyle = '#dee2e6'
  finalCtx.lineWidth = 1
  finalCtx.strokeRect(12, tableBodyStartY, finalCanvas.width - 24, tableHeight)

  colorStats.value.forEach((stat, index) => {
    const row = Math.floor(index / columns)
    const col = index % columns
    const columnWidth = (finalCanvas.width - 24) / columns
    const x = 12 + col * columnWidth
    const y = tableBodyStartY + row * rowHeight

    if (row > 0 || col > 0) {
      finalCtx.strokeStyle = '#dee2e6'
      finalCtx.lineWidth = 1
      finalCtx.beginPath()
      finalCtx.moveTo(x, y)
      finalCtx.lineTo(x + columnWidth, y)
      if (col === 0) {
        finalCtx.moveTo(x, y)
        finalCtx.lineTo(x, y + rowHeight)
      }
      finalCtx.stroke()
    }

    finalCtx.fillStyle = `rgb(${stat.color.r}, ${stat.color.g}, ${stat.color.b})`
    finalCtx.fillRect(x + 8, y + 8, 24, 24)
    finalCtx.strokeStyle = '#e4e7ed'
    finalCtx.lineWidth = 1
    finalCtx.strokeRect(x + 8, y + 8, 24, 24)

    finalCtx.fillStyle = '#333'
    finalCtx.font = '14px Arial'
    finalCtx.textAlign = 'left'
    finalCtx.fillText(stat.code, x + 40, y + 22)

    finalCtx.fillStyle = '#409EFF'
    finalCtx.font = 'bold 12px Arial'
    finalCtx.textAlign = 'right'
    finalCtx.fillText(`${stat.count} 颗`, x + columnWidth - 8, y + 22)
  })

  if (previewCanvas.value) {
    previewCanvas.value.width = finalCanvas.width
    previewCanvas.value.height = finalCanvas.height
    const ctx = previewCanvas.value.getContext('2d')
    if (ctx) {
      ctx.drawImage(finalCanvas, 0, 0)
    }
  }
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

const downloadExport = (): void => {
  if (!previewCanvas.value || previewCanvas.value.width === 0) {
    ElMessage.warning('请先生成拼豆图纸')
    return
  }

  const link = document.createElement('a')
  link.download = `perler-pattern-${Date.now()}.png`
  link.href = previewCanvas.value.toDataURL('image/png')
  link.click()
}

watch(
  [patternGrid, showNumbers, selectedBrand, colorStats],
  () => {
    generatePreview()
  },
  { deep: true, immediate: true }
)

defineExpose({
  generatePreview,
  downloadExport
})
</script>

<style scoped>
.export-card {
  border-radius: 12px;
  height: 100%;
}

.export-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preview-canvas-wrapper {
  width: 100%;
  max-height: 600px;
  overflow: auto;
  background: linear-gradient(135deg, #f0f2f5 0%, #e6e8eb 100%);
  border-radius: 10px;
  border: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.preview-canvas {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.15);
}

.compressed-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-label {
  font-size: 13px;
  font-weight: 600;
  color: #606266;
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
  justify-content: center;
  gap: 12px;
}

.export-placeholder {
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  background: #f9fafb;
  border: 1px dashed #e4e7ed;
  border-radius: 10px;
  padding: 24px;
  text-align: center;
}
</style>
