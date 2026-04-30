<template>
  <div class="editor-bar">
    <div class="editor-row editor-tool-row">
      <el-switch v-model="localEditMode" active-text="编辑" />

      <span class="tool-sep"></span>

      <el-button-group class="tool-group">
        <el-button
          size="small"
          :icon="Brush"
          :type="localSelectedTool === 'brush' ? 'primary' : 'default'"
          @click="selectTool('brush')"
          >画笔</el-button
        >
        <el-button
          size="small"
          :icon="Pouring"
          :type="localSelectedTool === 'fill' ? 'primary' : 'default'"
          @click="selectTool('fill')"
          >填充</el-button
        >
        <el-button
          size="small"
          :icon="Delete"
          :type="localSelectedTool === 'eraser' ? 'primary' : 'default'"
          @click="selectTool('eraser')"
          >橡皮</el-button
        >
        <el-button
          size="small"
          :icon="Aim"
          :type="localSelectedTool === 'eyedropper' ? 'primary' : 'default'"
          @click="selectTool('eyedropper')"
          >吸管</el-button
        >
        <el-button
          size="small"
          :icon="Pointer"
          :type="localSelectedTool === 'pan' ? 'primary' : 'default'"
          @click="selectTool('pan')"
          >手形</el-button
        >
      </el-button-group>

      <span class="tool-sep"></span>

      <el-button size="small" :icon="RefreshLeft" @click="undo" :disabled="!canUndo"
        >撤销</el-button
      >
      <el-button size="small" :icon="RefreshRight" @click="redo" :disabled="!canRedo"
        >重做</el-button
      >
    </div>

    <div class="editor-row editor-color-row">
      <div class="current-color">
        <div class="color-swatch" :style="{ backgroundColor: activeColorHex || '#fff' }"></div>
        <span class="color-label">{{ activeColorHex || '未选择' }}</span>
      </div>

      <div class="palette-area">
        <el-tabs v-model="activeTab" class="palette-tabs">
          <el-tab-pane label="图纸颜色" name="drawing">
            <div class="palette-strip">
              <div
                v-for="item in activePalette"
                :key="item.code"
                class="palette-chip"
                :class="{ active: item.color.hex === activeColorHex }"
                @click="selectColor(item.color)"
                :title="`${item.code} (${item.count}颗)`"
              >
                <div class="chip-swatch" :style="{ backgroundColor: item.color.hex }"></div>
                <span class="chip-code">{{ item.code }}</span>
              </div>
              <div v-if="!activePalette.length" class="palette-empty-hint">
                先生成图纸后即可选择颜色
              </div>
            </div>
          </el-tab-pane>
          <el-tab-pane label="全部颜色" name="brand">
            <div class="palette-grid">
              <div v-for="family in colorFamilies" :key="family.prefix" class="color-family">
                <div class="family-label">
                  {{ family.name }} <span class="family-prefix">({{ family.prefix }})</span>
                </div>
                <div class="family-chips">
                  <div
                    v-for="item in family.items"
                    :key="item.code"
                    class="palette-chip"
                    :class="{ active: item.color.hex === activeColorHex }"
                    @click="selectColor(item.color)"
                    :title="item.code"
                  >
                    <div class="chip-swatch" :style="{ backgroundColor: item.color.hex }"></div>
                    <span class="chip-code">{{ item.code }}</span>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>

      <el-button
        type="primary"
        size="small"
        class="fill-all-btn"
        @click="fillAll"
        :disabled="!activeColorHex"
        >全部填充</el-button
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  Brush,
  Pouring,
  Delete,
  Aim,
  Pointer,
  RefreshLeft,
  RefreshRight
} from '@element-plus/icons-vue'
import type { PropType } from 'vue'
import type { PerlerColor, PaletteItem, ColorInfo } from '../utils/patternUtils'

const COLOR_FAMILY_MAP: Record<string, string> = {
  A: '黄色系',
  B: '绿色系',
  C: '浅色系',
  D: '蓝色系',
  E: '粉色系',
  F: '红色系',
  G: '橙色系',
  H: '灰白色系',
  M: '灰绿色系',
  P: '混色系',
  Q: '特殊色系',
  R: '红橙色系',
  T: '特殊色系',
  Y: '棕色系',
  ZG: '珠光色系'
}

interface ColorFamily {
  prefix: string
  name: string
  items: PaletteItem[]
}

const props = defineProps({
  palette: {
    type: Array as PropType<PaletteItem[]>,
    default: () => []
  },
  brandPalette: {
    type: Array as PropType<PaletteItem[]>,
    default: () => []
  },
  activeColor: {
    type: Object as PropType<ColorInfo | null>,
    default: null
  },
  editMode: {
    type: Boolean,
    default: false
  },
  selectedTool: {
    type: String as PropType<'brush' | 'fill' | 'pan' | 'eraser' | 'eyedropper'>,
    default: 'brush'
  },
  canUndo: {
    type: Boolean,
    default: false
  },
  canRedo: {
    type: Boolean,
    default: false
  }
})
const emit = defineEmits([
  'select',
  'fill-all',
  'update:editMode',
  'update:selectedTool',
  'undo',
  'redo'
])

const activeColorHex = computed<string>(() => props.activeColor?.hex || '')
const localEditMode = computed<boolean>({
  get: () => props.editMode,
  set: (val) => emit('update:editMode', val)
})
const localSelectedTool = computed<'brush' | 'fill' | 'pan' | 'eraser' | 'eyedropper'>({
  get: () => props.selectedTool,
  set: (val) => emit('update:selectedTool', val)
})

const activeTab = ref<'drawing' | 'brand'>('drawing')

const activePalette = computed<PaletteItem[]>(() => {
  if (!props.palette || !props.palette.length) return []
  return props.palette.filter((item) => item.count > 0).slice(0, 40)
})

const colorFamilies = computed<ColorFamily[]>(() => {
  const groups: Record<string, PaletteItem[]> = {}
  for (const item of props.brandPalette) {
    const prefix = item.code.replace(/[0-9]/g, '')
    if (!groups[prefix]) groups[prefix] = []
    groups[prefix].push(item)
  }
  const order = Object.keys(COLOR_FAMILY_MAP)
  return order
    .filter((p) => groups[p])
    .map((p) => ({
      prefix: p,
      name: COLOR_FAMILY_MAP[p],
      items: groups[p]
    }))
})

const selectTool = (tool: 'brush' | 'fill' | 'pan' | 'eraser' | 'eyedropper'): void => {
  localSelectedTool.value = tool
}

const selectColor = (color: PerlerColor): void => {
  emit('select', color)
}

const fillAll = (): void => {
  emit('fill-all')
}

const undo = (): void => {
  emit('undo')
}

const redo = (): void => {
  emit('redo')
}
</script>

<style scoped>
.editor-bar {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
}

.editor-row {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
}

.editor-tool-row {
  flex-shrink: 0;
}

.editor-color-row {
  flex: 1;
  min-height: 0;
  align-items: stretch;
}

.palette-area {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.current-color {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  align-self: flex-start;
  margin-top: 3px;
}

.color-swatch {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  flex-shrink: 0;
}

.color-label {
  font-size: 13px;
  color: #606266;
  font-weight: 600;
  white-space: nowrap;
}

.tool-group {
  display: flex;
}

.tool-sep {
  width: 1px;
  height: 20px;
  background: #dcdfe6;
  flex-shrink: 0;
  align-self: center;
}

.palette-tabs {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.palette-tabs :deep(.el-tabs__header) {
  margin-bottom: 2px;
}
.palette-tabs :deep(.el-tabs__item) {
  font-size: 13px;
  height: 28px;
  line-height: 28px;
  padding: 0 12px;
}
.palette-tabs :deep(.el-tabs__nav-wrap::after) {
  display: none;
}

.palette-tabs :deep(.el-tabs__content) {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.palette-tabs :deep(.el-tab-pane) {
  height: 100%;
}

.palette-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 4px 0;
  align-content: flex-start;
}

.palette-strip::-webkit-scrollbar {
  width: 4px;
}

.palette-grid {
  height: 100%;
  overflow-y: auto;
  padding: 4px 0;
}

.palette-grid::-webkit-scrollbar {
  width: 4px;
}

.color-family {
  margin-bottom: 8px;
}

.family-label {
  font-size: 12px;
  font-weight: 700;
  color: #606266;
  margin-bottom: 4px;
  padding-left: 2px;
}

.family-prefix {
  font-weight: 400;
  color: #909399;
  font-size: 11px;
}

.family-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.palette-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border: 1px solid #e9edf3;
  border-radius: 6px;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s;
}

.palette-chip:hover {
  background: #f5f7fa;
}

.palette-chip.active {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.15);
}

.chip-swatch {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.chip-code {
  font-size: 12px;
  color: #303133;
  font-weight: 600;
}

.palette-empty-hint {
  font-size: 13px;
  color: #909399;
  padding: 4px 0;
  white-space: nowrap;
}

.fill-all-btn {
  flex-shrink: 0;
  align-self: flex-end;
  margin-bottom: 3px;
}
</style>
