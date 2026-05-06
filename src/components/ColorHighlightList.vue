<template>
  <div class="color-highlight-list">
    <h3 class="section-title">
      <el-icon><View /></el-icon>
      颜色高亮
    </h3>
    <div v-if="highlightedKeys.size > 0" class="highlight-hint">
      已高亮 {{ highlightedKeys.size }} 种颜色
    </div>
    <div class="color-items">
      <div
        v-for="stat in colorStats"
        :key="stat.code || getKey(stat)"
        class="color-item"
        :class="{ highlighted: isHighlighted(stat) }"
        @click="emit('toggle-highlight', getKey(stat))"
      >
        <el-checkbox
          :model-value="isHighlighted(stat)"
          @click.stop
          @change="emit('toggle-highlight', getKey(stat))"
        />
        <div
          class="color-chip"
          :style="{ backgroundColor: `rgb(${stat.color.r},${stat.color.g},${stat.color.b})` }"
        />
        <span class="color-code">{{ stat.code }}</span>
        <el-tag size="small" class="color-count">{{ stat.count }} 颗</el-tag>
      </div>
      <el-empty v-if="!colorStats.length" description="暂无颜色数据" :image-size="60" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { View } from '@element-plus/icons-vue'
import type { ColorStat } from '../utils/patternUtils'

const props = defineProps<{
  colorStats: ColorStat[]
  highlightedKeys: Set<string>
}>()

const emit = defineEmits<{
  'toggle-highlight': [key: string]
}>()

function getKey(stat: ColorStat): string {
  return `${stat.color.r},${stat.color.g},${stat.color.b}`
}

function isHighlighted(stat: ColorStat): boolean {
  return props.highlightedKeys.has(getKey(stat))
}
</script>

<style scoped>
.color-highlight-list {
  margin-top: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.highlight-hint {
  font-size: 12px;
  color: #409eff;
  margin-bottom: 8px;
}

.color-items {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: calc(100vh - 420px);
  overflow-y: auto;
}

.color-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
}

.color-item:hover {
  background: #f0f2f5;
}

.color-item.highlighted {
  background: rgba(64, 158, 255, 0.08);
}

.color-chip {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
  flex-shrink: 0;
}

.color-code {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
  flex: 1;
}

.color-count {
  flex-shrink: 0;
}
</style>
