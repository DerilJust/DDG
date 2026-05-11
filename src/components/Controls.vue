<template>
  <div class="controls-container">
    <!-- 标题部分 -->
    <h3 class="section-title">
      <el-icon class="title-icon">
        <Setting />
      </el-icon>
      参数设置
    </h3>

    <el-card class="controls-card" :body-style="{ padding: '0px' }">
      <div class="form-wrapper">
        <el-form label-width="80px" label-position="left">
          <!-- 网格宽度 -->
          <el-form-item label="宽度">
            <div class="slider-row">
              <el-input-number
                v-model="gridWidth"
                :min="5"
                :max="1000"
                :step="1"
                :controls="true"
                size="small"
                class="custom-input-number"
              />
              <span class="value-label">{{ gridWidth }}</span>
            </div>
          </el-form-item>

          <!-- 网格高度 -->
          <el-form-item label="高度">
            <div class="slider-row">
              <el-input-number
                v-model="gridHeight"
                :min="5"
                :max="1000"
                :step="1"
                :controls="true"
                size="small"
                class="custom-input-number"
              />
              <span class="value-label">{{ gridHeight }}</span>
            </div>
          </el-form-item>

          <!-- 颜色数量 -->
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

          <!-- 拼豆品牌 -->
          <el-form-item label="拼豆品牌">
            <el-select v-model="selectedBrand" placeholder="请选择" class="custom-select">
              <el-option label="MARD" value="MARD" />
              <el-option label="COCO" value="COCO" />
              <el-option label="漫漫" value="漫漫" />
              <el-option label="盼盼" value="盼盼" />
              <el-option label="咪小窝" value="咪小窝" />
            </el-select>
          </el-form-item>

          <!-- 显示编号 -->
          <el-form-item label="显示编号">
            <div class="switch-wrapper">
              <span :class="['switch-label', !showNumbers ? 'active-text' : '']">隐藏</span>
              <el-switch v-model="showNumbers" />
              <span :class="['switch-label', showNumbers ? 'active-text' : '']">显示</span>
            </div>
          </el-form-item>

          <!-- 图片比例 -->
          <el-form-item label="图片比例">
            <div class="slider-row">
              <span>{{ imageRatio }}</span>
            </div>
          </el-form-item>

          <!-- 锁定比例 -->
          <el-form-item label="锁定比例">
            <div class="switch-wrapper">
              <span :class="['switch-label', !lockAspectRatio ? 'active-text' : '']">关闭</span>
              <el-switch v-model="lockAspectRatio" />
              <span :class="['switch-label', lockAspectRatio ? 'active-text' : '']">开启</span>
            </div>
          </el-form-item>

          <!-- 补充空白 -->
          <el-form-item label="补充空白">
            <div class="switch-wrapper">
              <span :class="['switch-label', !padToMultipleOf5 ? 'active-text' : '']">关闭</span>
              <el-switch v-model="padToMultipleOf5" />
              <span :class="['switch-label', padToMultipleOf5 ? 'active-text' : '']">开启</span>
            </div>
          </el-form-item>

          <!-- 导出倍率 -->
          <el-form-item label="导出倍率">
            <el-select v-model="exportScale" class="custom-select">
              <el-option label="1x (标准)" :value="1" />
              <el-option label="2x (高清)" :value="2" />
              <el-option label="3x (超清)" :value="3" />
              <el-option label="4x (极清)" :value="4" />
            </el-select>
          </el-form-item>

          <!-- 快捷键预设 -->
          <el-form-item label="快捷键">
            <div class="shortcut-row">
              <el-select v-model="shortcutPreset" class="custom-select" @change="onPresetChange">
                <el-option label="默认" value="default" />
                <el-option label="类PS风格" value="photoshop" />
                <el-option label="自定义" value="custom" />
              </el-select>
              <el-button size="small" @click="showShortcutDialog = true">编辑</el-button>
            </div>
          </el-form-item>
        </el-form>
      </div>
      <!-- 底部按钮 -->
      <div class="button-footer">
        <el-button type="primary" class="btn-generate" @click="generatePattern">
          <el-icon>
            <MagicStick />
          </el-icon>
          生成图纸
        </el-button>
        <el-button type="warning" class="btn-download" @click="downloadPattern">
          <el-icon>
            <Download />
          </el-icon>
          下载
        </el-button>
      </div>
    </el-card>

    <!-- 快捷键编辑对话框 -->
    <el-dialog v-model="showShortcutDialog" title="编辑快捷键" width="400px">
      <div class="shortcut-edit-list">
        <div v-for="item in shortcutItems" :key="item.key" class="shortcut-edit-row">
          <span class="shortcut-edit-label">{{ item.label }}</span>
          <el-button
            size="small"
            :class="{ recording: recordingKey === item.key }"
            @click="startRecording(item.key)"
          >
            {{ recordingKey === item.key ? '按下按键...' : formatKey(editingConfig[item.key]) }}
          </el-button>
        </div>
      </div>
      <template #footer>
        <el-button @click="showShortcutDialog = false">取消</el-button>
        <el-button type="primary" @click="saveShortcuts">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useAppStore } from '../store/appStore'
import { storeToRefs } from 'pinia'
import { useAspectRatioLock } from '../composables/useAspectRatioLock'
import { SHORTCUT_PRESETS } from '../composables/useKeyboardShortcuts'
import { MagicStick, Download, Setting } from '@element-plus/icons-vue'
import type { ShortcutConfig, ShortcutPresetName } from '../types'

const emit = defineEmits(['download'])
const appStore = useAppStore()
const {
  gridWidth,
  gridHeight,
  colorCount,
  selectedBrand,
  showNumbers,
  lockAspectRatio,
  padToMultipleOf5,
  shortcutPreset
} = storeToRefs(appStore)

const exportScale = computed({
  get: () => appStore.exportScale,
  set: (val: number) => appStore.setExportScale(val)
})

const { imageRatio } = useAspectRatioLock()

const generatePattern = (): void => {
  appStore.generatePattern()
}

const downloadPattern = (): void => {
  emit('download')
}

// --- 快捷键预设与编辑 ---
const showShortcutDialog = ref(false)
const recordingKey = ref<string | null>(null)
const editingConfig = reactive<ShortcutConfig>({
  toggleEditMode: 'Tab',
  toolBrush: 'B',
  toolFill: 'G',
  toolEraser: 'E',
  toolEyedropper: 'I',
  toolPan: 'H',
  undo: 'Ctrl+Z',
  redo: 'Ctrl+Y'
})

const shortcutItems: Array<{ key: keyof ShortcutConfig; label: string }> = [
  { key: 'toggleEditMode', label: '切换编辑模式' },
  { key: 'toolBrush', label: '画笔工具' },
  { key: 'toolFill', label: '填充工具' },
  { key: 'toolEraser', label: '橡皮工具' },
  { key: 'toolEyedropper', label: '吸管工具' },
  { key: 'toolPan', label: '手形工具' },
  { key: 'undo', label: '撤销' },
  { key: 'redo', label: '重做' }
]

function formatKey(key: string): string {
  return key
    .replace(/Ctrl\+/g, 'Ctrl + ')
    .replace(/Shift\+/g, 'Shift + ')
    .replace(/Alt\+/g, 'Alt + ')
}

function onPresetChange(value: ShortcutPresetName) {
  appStore.setShortcutPreset(value)
  if (value !== 'custom') {
    Object.assign(editingConfig, SHORTCUT_PRESETS[value])
  } else if (appStore.customShortcutConfig) {
    Object.assign(editingConfig, appStore.customShortcutConfig)
  }
}

function startRecording(key: string) {
  recordingKey.value = key
  const onKeyDown = (e: KeyboardEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const parts: string[] = []
    if (e.ctrlKey) parts.push('Ctrl')
    if (e.shiftKey) parts.push('Shift')
    if (e.altKey) parts.push('Alt')
    if (e.key !== 'Control' && e.key !== 'Shift' && e.key !== 'Alt') {
      parts.push(e.key === ' ' ? 'Space' : e.key.length === 1 ? e.key.toUpperCase() : e.key)
    }
    const combo = parts.join('+')
    if (combo && recordingKey.value) {
      ;(editingConfig as Record<string, string>)[recordingKey.value] = combo
    }
    recordingKey.value = null
    window.removeEventListener('keydown', onKeyDown, true)
  }
  window.addEventListener('keydown', onKeyDown, true)
}

function saveShortcuts() {
  appStore.setShortcutPreset('custom')
  appStore.setCustomShortcutConfig({ ...editingConfig })
  showShortcutDialog.value = false
}
</script>

<style scoped>
.controls-container {
  width: 100%;
  padding: 10px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
}

.title-icon {
  font-size: 18px;
  color: #409eff;
}

.controls-card {
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.controls-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.1);
}

.form-wrapper {
  padding: 20px;
  background: linear-gradient(135deg, #f6f8fa 0%, #e9ecef 100%);
}

.slider-row,
.item-content {
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

.button-footer {
  padding: 16px;
  display: flex;
  gap: 15px;
  background-color: #fff;
  border-top: 1px solid #e9ecef;
}

.tool-button-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tool-footer {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px;
  background-color: #f7f9fc;
  border-top: 1px solid #e9ecef;
}

.btn-generate,
.btn-download {
  flex: 1;
  height: 44px;
  font-size: 15px;
  border-radius: 8px;
  border: none;
}

.btn-generate {
  background-color: #409eff;
}

.btn-download {
  background-color: #e6a23c;
}

.shortcut-row {
  display: flex;
  gap: 8px;
  width: 100%;
}

.shortcut-row .custom-select {
  flex: 1;
}

.shortcut-edit-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.shortcut-edit-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0;
}

.shortcut-edit-label {
  font-size: 14px;
  color: #606266;
}

.shortcut-edit-row .el-button.recording {
  border-color: #409eff;
  color: #409eff;
  animation: pulse-border 1s infinite;
}

@keyframes pulse-border {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(64, 158, 255, 0.4);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(64, 158, 255, 0);
  }
}

:deep(.el-form-item__label) {
  font-size: 16px;
  color: #606266;
  font-weight: 500;
}
</style>
