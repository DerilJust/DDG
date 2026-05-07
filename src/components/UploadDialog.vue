<template>
  <el-dialog
    v-model="dialogVisible"
    title="上传并生成图纸"
    width="90%"
    :close-on-click-modal="false"
    @close="handleCancel"
  >
    <div class="upload-dialog-body">
      <div class="dialog-left-panel">
        <el-card shadow="hover" :body-style="{ padding: '0px' }">
          <div class="form-wrapper">
            <el-form label-width="80px" label-position="left">
              <el-form-item label="宽度">
                <div class="slider-row">
                  <el-input-number
                    v-model="gridWidth"
                    :min="1"
                    :max="1000"
                    :step="1"
                    :controls="true"
                    size="small"
                    class="custom-input-number"
                  />
                  <span class="value-label">{{ gridWidth }}</span>
                </div>
              </el-form-item>

              <el-form-item label="高度">
                <div class="slider-row">
                  <el-input-number
                    v-model="gridHeight"
                    :min="1"
                    :max="1000"
                    :step="1"
                    :controls="true"
                    size="small"
                    class="custom-input-number"
                  />
                  <span class="value-label">{{ gridHeight }}</span>
                </div>
              </el-form-item>

              <el-form-item label="颜色数量">
                <div class="slider-row">
                  <el-slider
                    v-model="colorCount"
                    :min="1"
                    :max="50"
                    :step="1"
                    show-stops
                    class="custom-slider"
                  />
                  <span class="value-label">{{ colorCount }}</span>
                </div>
              </el-form-item>

              <el-form-item label="拼豆品牌">
                <el-select v-model="selectedBrand" placeholder="请选择" class="custom-select">
                  <el-option label="MARD" value="MARD" />
                  <el-option label="COCO" value="COCO" />
                  <el-option label="漫漫" value="漫漫" />
                  <el-option label="盼盼" value="盼盼" />
                  <el-option label="咪小窝" value="咪小窝" />
                </el-select>
              </el-form-item>

              <el-form-item label="显示编号">
                <div class="switch-wrapper">
                  <span :class="['switch-label', !showNumbers ? 'active-text' : '']">隐藏</span>
                  <el-switch v-model="showNumbers" />
                  <span :class="['switch-label', showNumbers ? 'active-text' : '']">显示</span>
                </div>
              </el-form-item>

              <el-form-item label="图片比例">
                <div class="slider-row">
                  <span>{{ imageRatio }}</span>
                </div>
              </el-form-item>

              <el-form-item label="锁定比例">
                <div class="switch-wrapper">
                  <span :class="['switch-label', !lockAspectRatio ? 'active-text' : '']">关闭</span>
                  <el-switch v-model="lockAspectRatio" />
                  <span :class="['switch-label', lockAspectRatio ? 'active-text' : '']">开启</span>
                </div>
              </el-form-item>
            </el-form>
          </div>
        </el-card>
      </div>

      <div class="dialog-right-panel">
        <el-upload
          class="dialog-upload"
          :auto-upload="false"
          :on-change="handleFileChange"
          :show-file-list="false"
          accept="image/*"
        >
          <el-button type="primary" :icon="UploadFilled">选择图片</el-button>
        </el-upload>

        <div v-if="!localImageData" class="upload-placeholder">
          <el-icon :size="64"><PictureFilled /></el-icon>
          <p>请选择图片开始裁剪</p>
        </div>

        <div v-else class="cropper-wrapper">
          <canvas ref="cropperCanvas" class="cropper-canvas" @pointerdown="startDrag"></canvas>
          <div
            v-if="cropRect.visible"
            class="crop-rect"
            :style="{
              left: cropRect.x + 'px',
              top: cropRect.y + 'px',
              width: cropRect.width + 'px',
              height: cropRect.height + 'px'
            }"
          >
            <div class="crop-handle top-left" @pointerdown="startResize('tl', $event)"></div>
            <div class="crop-handle top-right" @pointerdown="startResize('tr', $event)"></div>
            <div class="crop-handle bottom-left" @pointerdown="startResize('bl', $event)"></div>
            <div class="crop-handle bottom-right" @pointerdown="startResize('br', $event)"></div>
            <div class="crop-handle top" @pointerdown="startResize('t', $event)"></div>
            <div class="crop-handle bottom" @pointerdown="startResize('b', $event)"></div>
            <div class="crop-handle left" @pointerdown="startResize('l', $event)"></div>
            <div class="crop-handle right" @pointerdown="startResize('r', $event)"></div>
          </div>
        </div>

        <div v-if="localImageData" class="preset-ratio-section">
          <span class="preset-label">裁剪比例：</span>
          <el-button-group>
            <el-button
              size="small"
              :type="activePreset === '1:1' ? 'primary' : 'default'"
              @click="applyPresetRatio('1:1', 1)"
              >1:1</el-button
            >
            <el-button
              size="small"
              :type="activePreset === '4:3' ? 'primary' : 'default'"
              @click="applyPresetRatio('4:3', 4 / 3)"
              >4:3</el-button
            >
            <el-button
              size="small"
              :type="activePreset === '16:9' ? 'primary' : 'default'"
              @click="applyPresetRatio('16:9', 16 / 9)"
              >16:9</el-button
            >
          </el-button-group>
        </div>

        <el-slider
          v-if="localImageData"
          v-model="zoomLevel"
          :min="10"
          :max="200"
          :step="10"
          show-input
          class="zoom-slider"
        >
          <template #prefix>缩放: </template>
        </el-slider>

        <div v-if="localImageData && cropRect.visible" class="crop-info">
          <span>裁剪尺寸：{{ cropSizeInfo }}</span>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button
        type="primary"
        :disabled="!selectedFile || !cropRect.visible"
        :loading="isProcessing"
        @click="handleConfirm"
      >
        确认并生成图纸
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import { useAppStore } from '../store/appStore'
import { useAspectRatioLock } from '../composables/useAspectRatioLock'
import { UploadFilled, PictureFilled } from '@element-plus/icons-vue'
import type { CropperImageData, CroppedResult, UploadedCropResult } from '../types'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'confirm', data: UploadedCropResult): void
}>()

const appStore = useAppStore()
const { gridWidth, gridHeight, colorCount, selectedBrand, showNumbers, lockAspectRatio } =
  storeToRefs(appStore)

const dialogVisible = computed<boolean>({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const localImageNaturalSize = ref<{ width: number; height: number }>({ width: 0, height: 0 })

const { imageRatio } = useAspectRatioLock(localImageNaturalSize)

const cropperCanvas = ref<HTMLCanvasElement | null>(null)
const canvasContext = ref<CanvasRenderingContext2D | null>(null)
const localImageData = ref<CropperImageData | null>(null)
const zoomLevel = ref<number>(100)
const selectedFile = ref<File | null>(null)
const isProcessing = ref<boolean>(false)
const activePreset = ref<string | null>(null)

const cropSizeInfo = computed(() => {
  if (!localImageData.value || !cropRect.value.visible) return ''
  const img = localImageData.value
  const crop = cropRect.value
  const origW = Math.round(crop.width / img.displayScaleX)
  const origH = Math.round(crop.height / img.displayScaleY)
  return `${crop.width} x ${crop.height} px（原图 ${origW} x ${origH} px）`
})

const cropRect = ref<{
  x: number
  y: number
  width: number
  height: number
  visible: boolean
  dragging: boolean
  resizing: boolean
  resizeDirection: string
}>({
  x: 50,
  y: 50,
  width: 200,
  height: 200,
  visible: false,
  dragging: false,
  resizing: false,
  resizeDirection: ''
})
const mouseStartPos = ref<{ x: number; y: number }>({ x: 0, y: 0 })
const originalCropRect = ref<{ x: number; y: number; width: number; height: number }>({
  x: 0,
  y: 0,
  width: 0,
  height: 0
})

onMounted(() => {
  window.addEventListener('pointermove', handlePointerMove)
  window.addEventListener('pointerup', handlePointerUp)
})

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', handlePointerMove)
  window.removeEventListener('pointerup', handlePointerUp)
})

watch(
  () => props.visible,
  async (visible) => {
    if (visible && localImageData.value) {
      await nextTick()
      initCanvas()
      drawImage()
      initCropRect()
    }
  }
)

watch(zoomLevel, () => {
  if (localImageData.value && cropRect.value.visible) {
    drawImage()
  }
})

const handleFileChange = (file: { raw: File }) => {
  selectedFile.value = file.raw
  const reader = new FileReader()
  reader.onload = (e: ProgressEvent<FileReader>) => {
    if (selectedFile.value !== file.raw) return
    if (e.target?.result && typeof e.target.result === 'string') {
      const img = new Image()
      const imageUrl = e.target.result
      img.onload = () => {
        if (selectedFile.value !== file.raw) return
        localImageNaturalSize.value = { width: img.width, height: img.height }
        localImageData.value = {
          offsetX: 0,
          offsetY: 0,
          displayWidth: img.width,
          displayHeight: img.height,
          displayScaleX: 1,
          displayScaleY: 1,
          image: img
        }
        if (lockAspectRatio.value && img.width && img.height) {
          const ratio = img.width / img.height
          if (ratio >= 1) {
            appStore.setGridHeight(Math.max(1, Math.round(gridWidth.value / ratio)))
          } else {
            appStore.setGridWidth(Math.max(1, Math.round(gridHeight.value * ratio)))
          }
        }
        nextTick(() => {
          requestAnimationFrame(() => {
            initCanvas()
            drawImage()
            initCropRect()
          })
        })
      }
      img.src = imageUrl
    }
  }
  reader.readAsDataURL(file.raw)
}

const initCanvas = (): void => {
  if (!cropperCanvas.value) return
  const width = cropperCanvas.value.clientWidth
  const height = cropperCanvas.value.clientHeight
  if (width === 0 || height === 0) return
  cropperCanvas.value.width = width
  cropperCanvas.value.height = height
  canvasContext.value = cropperCanvas.value.getContext('2d')
  if (canvasContext.value) {
    canvasContext.value.setTransform(1, 0, 0, 1, 0, 0)
  }
}

const getCanvasPointerPos = (e: PointerEvent): { x: number; y: number } => {
  if (!cropperCanvas.value) return { x: 0, y: 0 }
  const rect = cropperCanvas.value.getBoundingClientRect()
  const scaleX = cropperCanvas.value.width / rect.width
  const scaleY = cropperCanvas.value.height / rect.height
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  }
}

const drawImage = (): void => {
  if (!localImageData.value || !canvasContext.value || !cropperCanvas.value) return
  const canvas = cropperCanvas.value
  const ctx = canvasContext.value
  const img = localImageData.value
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  const canvasWidth = canvas.width
  const canvasHeight = canvas.height
  const imgWidth = img.image.width
  const imgHeight = img.image.height
  const scale = zoomLevel.value / 100
  let displayWidth = imgWidth * scale
  let displayHeight = imgHeight * scale
  if (displayWidth > canvasWidth || displayHeight > canvasHeight) {
    const widthRatio = canvasWidth / displayWidth
    const heightRatio = canvasHeight / displayHeight
    const minRatio = Math.min(widthRatio, heightRatio)
    displayWidth *= minRatio
    displayHeight *= minRatio
  }
  const offsetX = (canvasWidth - displayWidth) / 2
  const offsetY = (canvasHeight - displayHeight) / 2
  ctx.drawImage(img.image, offsetX, offsetY, displayWidth, displayHeight)
  localImageData.value.offsetX = offsetX
  localImageData.value.offsetY = offsetY
  localImageData.value.displayWidth = displayWidth
  localImageData.value.displayHeight = displayHeight
  localImageData.value.displayScaleX = displayWidth / imgWidth
  localImageData.value.displayScaleY = displayHeight / imgHeight

  constrainCropRect()
}

const initCropRect = (): void => {
  if (!localImageData.value) return
  const displayWidth = localImageData.value.displayWidth
  const displayHeight = localImageData.value.displayHeight
  const offsetX = localImageData.value.offsetX
  const offsetY = localImageData.value.offsetY

  if (lockAspectRatio.value) {
    const targetAspect = gridWidth.value / gridHeight.value
    const padding = 0.8
    let cropW: number, cropH: number

    if (targetAspect >= 1) {
      cropW = Math.min(displayWidth * padding, displayHeight * padding * targetAspect)
      cropH = cropW / targetAspect
      if (cropH > displayHeight * padding) {
        cropH = displayHeight * padding
        cropW = cropH * targetAspect
      }
    } else {
      cropH = Math.min(displayHeight * padding, (displayWidth * padding) / targetAspect)
      cropW = cropH * targetAspect
      if (cropW > displayWidth * padding) {
        cropW = displayWidth * padding
        cropH = cropW / targetAspect
      }
    }

    cropW = Math.max(20, cropW)
    cropH = Math.max(20, cropH)

    cropRect.value = {
      x: offsetX + (displayWidth - cropW) / 2,
      y: offsetY + (displayHeight - cropH) / 2,
      width: cropW,
      height: cropH,
      visible: true,
      dragging: false,
      resizing: false,
      resizeDirection: ''
    }
  } else {
    const rectSize = Math.min(displayWidth, displayHeight) * 0.6
    cropRect.value = {
      x: offsetX + (displayWidth - rectSize) / 2,
      y: offsetY + (displayHeight - rectSize) / 2,
      width: rectSize,
      height: rectSize,
      visible: true,
      dragging: false,
      resizing: false,
      resizeDirection: ''
    }
  }
  constrainCropRect()
}

const applyPresetRatio = (name: string, ratio: number): void => {
  if (!localImageData.value) return

  activePreset.value = name

  const displayWidth = localImageData.value.displayWidth
  const displayHeight = localImageData.value.displayHeight
  const offsetX = localImageData.value.offsetX
  const offsetY = localImageData.value.offsetY
  const padding = 0.8

  let cropW: number, cropH: number

  if (ratio >= 1) {
    cropW = Math.min(displayWidth * padding, displayHeight * padding * ratio)
    cropH = cropW / ratio
    if (cropH > displayHeight * padding) {
      cropH = displayHeight * padding
      cropW = cropH * ratio
    }
  } else {
    cropH = Math.min(displayHeight * padding, (displayWidth * padding) / ratio)
    cropW = cropH * ratio
    if (cropW > displayWidth * padding) {
      cropW = displayWidth * padding
      cropH = cropW / ratio
    }
  }

  cropW = Math.max(20, cropW)
  cropH = Math.max(20, cropH)

  cropRect.value = {
    x: offsetX + (displayWidth - cropW) / 2,
    y: offsetY + (displayHeight - cropH) / 2,
    width: cropW,
    height: cropH,
    visible: true,
    dragging: false,
    resizing: false,
    resizeDirection: ''
  }

  constrainCropRect()

  const currentMax = Math.max(gridWidth.value, gridHeight.value)
  if (ratio >= 1) {
    appStore.setGridHeight(Math.max(1, Math.round(currentMax / ratio)))
  } else {
    appStore.setGridWidth(Math.max(1, Math.round(currentMax * ratio)))
  }
}

const startDrag = (e: PointerEvent) => {
  if (!cropRect.value.visible) return
  e.preventDefault()
  const { x, y } = getCanvasPointerPos(e)
  const crop = cropRect.value
  if (x >= crop.x && x <= crop.x + crop.width && y >= crop.y && y <= crop.y + crop.height) {
    cropRect.value.dragging = true
    mouseStartPos.value = { x, y }
    originalCropRect.value = { ...crop }
    if (cropperCanvas.value && e.pointerId != null && cropperCanvas.value.setPointerCapture) {
      cropperCanvas.value.setPointerCapture(e.pointerId)
    }
  }
}

const handlePointerMove = (e: PointerEvent) => {
  if (!cropRect.value.visible) return
  const { x, y } = getCanvasPointerPos(e)
  if (cropRect.value.dragging) {
    const start = mouseStartPos.value
    const dx = x - start.x
    const dy = y - start.y
    cropRect.value.x = originalCropRect.value.x + dx
    cropRect.value.y = originalCropRect.value.y + dy
    activePreset.value = null
    constrainCropRect()
  } else if (cropRect.value.resizing) {
    handleResize(x, y)
  }
}

const handlePointerUp = (e: PointerEvent) => {
  if (cropRect.value.dragging || cropRect.value.resizing) {
    cropRect.value.dragging = false
    cropRect.value.resizing = false
    if (cropperCanvas.value && e?.pointerId != null && cropperCanvas.value.releasePointerCapture) {
      cropperCanvas.value.releasePointerCapture(e.pointerId)
    }
  }
}

const startResize = (direction: string, e: PointerEvent) => {
  if (!cropRect.value.visible) return
  e.stopPropagation()
  e.preventDefault()
  const { x: mouseX, y: mouseY } = getCanvasPointerPos(e)
  const crop = cropRect.value
  crop.resizing = true
  crop.resizeDirection = direction
  mouseStartPos.value = { x: mouseX, y: mouseY }
  originalCropRect.value = { ...crop }
}

const applyAspectRatioResize = (direction: string, mouseX: number, mouseY: number) => {
  const original = originalCropRect.value
  const start = mouseStartPos.value
  const targetAspect = gridWidth.value / gridHeight.value

  const deltaX = mouseX - start.x
  const deltaY = mouseY - start.y

  let newW: number, newH: number, newX: number, newY: number

  if (direction === 'br') {
    newW = Math.max(20, original.width + deltaX)
    newH = newW / targetAspect
    newX = original.x
    newY = original.y
  } else if (direction === 'tl') {
    newW = Math.max(20, original.width - deltaX)
    newH = newW / targetAspect
    newX = original.x + original.width - newW
    newY = original.y + original.height - newH
  } else if (direction === 'tr') {
    newW = Math.max(20, original.width + deltaX)
    newH = newW / targetAspect
    newX = original.x
    newY = original.y + original.height - newH
  } else if (direction === 'bl') {
    newW = Math.max(20, original.width - deltaX)
    newH = newW / targetAspect
    newX = original.x + original.width - newW
    newY = original.y
  } else if (direction === 'r') {
    newW = Math.max(20, original.width + deltaX)
    newH = newW / targetAspect
    newX = original.x
    newY = original.y
  } else if (direction === 'l') {
    newW = Math.max(20, original.width - deltaX)
    newH = newW / targetAspect
    newX = original.x + original.width - newW
    newY = original.y + original.height - newH
  } else if (direction === 'b') {
    newH = Math.max(20, original.height + deltaY)
    newW = newH * targetAspect
    newX = original.x
    newY = original.y
  } else if (direction === 't') {
    newH = Math.max(20, original.height - deltaY)
    newW = newH * targetAspect
    newX = original.x + original.width - newW
    newY = original.y + original.height - newH
  } else {
    return
  }

  cropRect.value.x = newX
  cropRect.value.y = newY
  cropRect.value.width = newW
  cropRect.value.height = newH
}

const handleResize = (mouseX: number, mouseY: number) => {
  if (lockAspectRatio.value) {
    const direction = cropRect.value.resizeDirection
    applyAspectRatioResize(direction, mouseX, mouseY)
    constrainCropRect()
    mouseStartPos.value = { x: mouseX, y: mouseY }
    originalCropRect.value = { ...cropRect.value }
    return
  }

  const crop = cropRect.value
  const original = originalCropRect.value
  const direction = crop.resizeDirection
  const start = mouseStartPos.value
  let newX = original.x,
    newY = original.y,
    newWidth = original.width,
    newHeight = original.height
  if (direction.includes('l')) {
    const deltaX = mouseX - start.x
    newWidth = original.width - deltaX
    newX = original.x + deltaX
  }
  if (direction.includes('r')) {
    const deltaX = mouseX - start.x
    newWidth = original.width + deltaX
  }
  if (direction.includes('t')) {
    const deltaY = mouseY - start.y
    newHeight = original.height - deltaY
    newY = original.y + deltaY
  }
  if (direction.includes('b')) {
    const deltaY = mouseY - start.y
    newHeight = original.height + deltaY
  }
  newWidth = Math.max(20, newWidth)
  newHeight = Math.max(20, newHeight)
  cropRect.value.x = newX
  cropRect.value.y = newY
  cropRect.value.width = newWidth
  cropRect.value.height = newHeight
  constrainCropRect()
  activePreset.value = null
  mouseStartPos.value = { x: mouseX, y: mouseY }
  originalCropRect.value = { ...cropRect.value }
}

const constrainCropRect = (): void => {
  if (!localImageData.value) return
  const offsetX = localImageData.value.offsetX
  const offsetY = localImageData.value.offsetY
  const displayWidth = localImageData.value.displayWidth
  const displayHeight = localImageData.value.displayHeight
  const crop = cropRect.value
  crop.x = Math.round(Math.max(offsetX, Math.min(crop.x, offsetX + displayWidth - crop.width)))
  crop.y = Math.round(Math.max(offsetY, Math.min(crop.y, offsetY + displayHeight - crop.height)))
  const maxWidth = offsetX + displayWidth - crop.x
  const maxHeight = offsetY + displayHeight - crop.y
  crop.width = Math.round(Math.min(crop.width, maxWidth))
  crop.height = Math.round(Math.min(crop.height, maxHeight))
  crop.width = Math.max(20, crop.width)
  crop.height = Math.max(20, crop.height)
}

const cropCanvasImage = (img: CropperImageData, crop: any): Promise<CroppedResult> => {
  return new Promise((resolve, reject) => {
    const sourceX = (crop.x - img.offsetX) / img.displayScaleX
    const sourceY = (crop.y - img.offsetY) / img.displayScaleY
    const sourceWidth = crop.width / img.displayScaleX
    const sourceHeight = crop.height / img.displayScaleY
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = Math.max(1, Math.round(sourceWidth))
    tempCanvas.height = Math.max(1, Math.round(sourceHeight))
    const tempCtx = tempCanvas.getContext('2d')
    if (!tempCtx) {
      reject(new Error('无法获取Canvas上下文'))
      return
    }
    tempCtx.drawImage(
      img.image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      tempCanvas.width,
      tempCanvas.height
    )
    tempCanvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('裁剪失败'))
        return
      }
      const dataUrl = tempCanvas.toDataURL('image/png')
      const croppedFile = new File([blob], 'cropped-image.png', { type: 'image/png' })
      const croppedImage = new Image()
      croppedImage.onload = () => {
        resolve({ image: croppedImage, dataUrl, file: croppedFile })
      }
      croppedImage.onerror = () => {
        reject(new Error('裁剪图片加载失败'))
      }
      croppedImage.src = dataUrl
    }, 'image/png')
  })
}

const handleCancel = (): void => {
  dialogVisible.value = false
  cropRect.value.visible = false
  zoomLevel.value = 100
}

const handleConfirm = async () => {
  if (!localImageData.value || !cropRect.value.visible || !selectedFile.value) return
  isProcessing.value = true
  try {
    const cropped = await cropCanvasImage(localImageData.value, cropRect.value)
    appStore.setOriginalImage(cropped.file)
    appStore.setOriginalImageUrl(cropped.dataUrl)
    appStore.setInfoText('图片已上传')
    appStore.setOriginalImageSize(cropped.image.width, cropped.image.height)
    await appStore.generatePattern()
    dialogVisible.value = false
    cropRect.value.visible = false
    zoomLevel.value = 100
    emit('confirm', {
      file: cropped.file,
      url: cropped.dataUrl,
      width: cropped.image.width,
      height: cropped.image.height
    })
  } catch (error) {
    console.error('生成图纸失败：', error)
    alert('生成图纸失败，请重试')
  } finally {
    isProcessing.value = false
  }
}
</script>

<style scoped>
.upload-dialog-body {
  display: flex;
  gap: 20px;
  min-height: 500px;
}

.dialog-left-panel {
  width: 320px;
  flex-shrink: 0;
}

.dialog-right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.form-wrapper {
  padding: 20px;
  background: linear-gradient(135deg, #f6f8fa 0%, #e9ecef 100%);
}

.slider-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}

.custom-slider {
  flex: 1;
}

.value-label {
  min-width: 36px;
  text-align: right;
  font-weight: 600;
  color: #303133;
}

:deep(.el-input-number.is-controls-right .el-input__inner) {
  text-align: center;
  padding-left: 10px;
  padding-right: 40px;
}

.custom-select {
  width: 100%;
}

:deep(.el-input__wrapper) {
  border-radius: 8px;
}

.switch-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.switch-label {
  font-size: 14px;
  color: #909399;
  transition: color 0.3s;
}

.switch-label.active-text {
  color: #409eff;
}

.dialog-upload {
  text-align: center;
}

.upload-placeholder {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #c0c4cc;
  border: 2px dashed #e4e7ed;
  border-radius: 8px;
  min-height: 300px;
}

.upload-placeholder p {
  margin-top: 16px;
  font-size: 14px;
}

.cropper-wrapper {
  position: relative;
  width: 100%;
  height: clamp(280px, 50vh, 520px);
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  background-color: #f5f7fa;
}

.cropper-canvas {
  width: 100%;
  height: 100%;
  cursor: crosshair;
  touch-action: none;
}

.crop-rect {
  position: absolute;
  border: 2px solid #409eff;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
  pointer-events: none;
  z-index: 10;
}

.crop-rect::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 1px dashed #ffffff;
  opacity: 0.5;
}

.crop-handle {
  position: absolute;
  width: 12px;
  height: 12px;
  background-color: #409eff;
  border: 2px solid #ffffff;
  border-radius: 50%;
  pointer-events: auto;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.crop-handle:hover {
  background-color: #66b1ff;
  transform: scale(1.2);
}

.crop-handle.top-left {
  top: -6px;
  left: -6px;
  cursor: nw-resize;
}
.crop-handle.top-right {
  top: -6px;
  right: -6px;
  cursor: ne-resize;
}
.crop-handle.bottom-left {
  bottom: -6px;
  left: -6px;
  cursor: sw-resize;
}
.crop-handle.bottom-right {
  bottom: -6px;
  right: -6px;
  cursor: se-resize;
}
.crop-handle.top {
  top: -6px;
  left: 50%;
  transform: translateX(-50%);
  cursor: n-resize;
}
.crop-handle.bottom {
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  cursor: s-resize;
}
.crop-handle.left {
  top: 50%;
  left: -6px;
  transform: translateY(-50%);
  cursor: w-resize;
}
.crop-handle.right {
  top: 50%;
  right: -6px;
  transform: translateY(-50%);
  cursor: e-resize;
}

.crop-handle.top:hover,
.crop-handle.bottom:hover,
.crop-handle.left:hover,
.crop-handle.right:hover {
  transform: scale(1.2);
}

.crop-handle.top:hover {
  transform: translateX(-50%) scale(1.2);
}
.crop-handle.bottom:hover {
  transform: translateX(-50%) scale(1.2);
}
.crop-handle.left:hover {
  transform: translateY(-50%) scale(1.2);
}
.crop-handle.right:hover {
  transform: translateY(-50%) scale(1.2);
}

.preset-ratio-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.preset-label {
  font-size: 13px;
  color: #606266;
  font-weight: 500;
  white-space: nowrap;
}

.zoom-slider {
  width: 100%;
}

.crop-info {
  text-align: center;
  font-size: 12px;
  color: #909399;
  padding: 4px 0;
}

:deep(.el-form-item__label) {
  font-size: 16px;
  color: #606266;
  font-weight: 500;
}
</style>
