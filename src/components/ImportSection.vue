<template>
  <div class="import-section">
    <h3 class="section-title">
      <el-icon><Upload /></el-icon>
      导入图纸
      <slot name="title-actions"></slot>
    </h3>
    <el-input
      v-model="inputText"
      type="textarea"
      :rows="4"
      placeholder="粘贴压缩数据（格式: BRAND:WxH|PALETTE|RUNS）"
      resize="none"
      class="import-textarea"
    />
    <div class="import-actions">
      <el-button type="primary" @click="handleImport" :disabled="!inputText.trim()">
        <el-icon><Upload /></el-icon>
        导入
      </el-button>
      <el-button @click="inputText = ''" :disabled="!inputText">清空</el-button>
    </div>
    <el-alert
      v-if="statusMessage"
      :title="statusMessage"
      :type="statusType"
      show-icon
      :closable="false"
      class="status-alert"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Upload } from '@element-plus/icons-vue'

const emit = defineEmits<{
  import: [compressed: string]
}>()

const inputText = ref('')
const statusMessage = ref('')
const statusType = ref<'success' | 'error'>('success')

function handleImport() {
  const text = inputText.value.trim()
  if (!text) return
  statusMessage.value = ''
  emit('import', text)
}

function setStatus(msg: string, type: 'success' | 'error') {
  statusMessage.value = msg
  statusType.value = type
}

defineExpose({ setStatus })
</script>

<style scoped>
.import-section {
  margin-bottom: 8px;
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

.import-textarea {
  margin-bottom: 8px;
}

.import-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.status-alert {
  margin-top: 4px;
}
</style>
