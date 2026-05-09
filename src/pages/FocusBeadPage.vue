<template>
  <div class="focus-page">
    <el-container class="root-container">
      <el-aside
        :width="isCollapsed ? '0px' : '300px'"
        class="aside"
        :class="{ collapsed: isCollapsed }"
      >
        <div class="aside-header">
          <el-button
            :icon="isCollapsed ? Expand : Fold"
            circle
            size="small"
            class="collapse-btn"
            @click="toggleSidebar"
          />
        </div>
        <ImportSection ref="importSectionRef" @import="handleImport" />
        <ColorHighlightList
          v-if="colorStats.length > 0"
          :color-stats="colorStats"
          :highlighted-keys="highlightedKeys"
          @toggle-highlight="toggleHighlight"
        />
      </el-aside>

      <el-main class="main">
        <el-button
          v-if="isCollapsed"
          class="sidebar-toggle-fab"
          circle
          size="small"
          @click="toggleSidebar"
        >
          <el-icon :size="18"><Expand /></el-icon>
        </el-button>
        <div v-if="patternGrid.length && gridWidth > 0" class="viewer-wrapper">
          <PatternViewer :highlighted-color-keys="highlightedKeys" />
        </div>
        <div v-else class="empty-state">
          <el-empty description="请粘贴压缩数据导入图纸，或从编辑器页面生成图纸后跳转至此">
            <template #extra>
              <router-link to="/editor">
                <el-button type="primary">
                  <el-icon><Edit /></el-icon>
                  前往编辑器
                </el-button>
              </router-link>
            </template>
          </el-empty>
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { Edit, Expand, Fold } from '@element-plus/icons-vue'
import { useAppStore } from '../store/appStore'
import ImportSection from '../components/ImportSection.vue'
import ColorHighlightList from '../components/ColorHighlightList.vue'
import PatternViewer from '../components/PatternViewer.vue'

const appStore = useAppStore()
const { patternGrid, gridWidth, colorStats, perlerColors } = storeToRefs(appStore)

const importSectionRef = ref<InstanceType<typeof ImportSection> | null>(null)
const highlightedKeys = reactive(new Set<string>())
const isCollapsed = ref(false)

function toggleSidebar() {
  isCollapsed.value = !isCollapsed.value
}

function toggleHighlight(key: string) {
  if (highlightedKeys.has(key)) {
    highlightedKeys.delete(key)
  } else {
    highlightedKeys.add(key)
  }
}

function handleImport(compressed: string) {
  const success = appStore.importFromCompressed(compressed)
  if (success) {
    importSectionRef.value?.setStatus('导入成功', 'success')
    highlightedKeys.clear()
  } else {
    importSectionRef.value?.setStatus('导入失败：压缩数据格式无效', 'error')
  }
}

onMounted(() => {
  if (!perlerColors.value.length) {
    appStore.loadColorData()
  }
  if (patternGrid.value.length && colorStats.value.length === 0) {
    appStore.refreshColorStats()
  }
})
</script>

<style scoped>
.focus-page {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.root-container {
  height: 100%;
  flex: 1;
  min-height: 0;
}

.aside {
  display: flex;
  flex-direction: column;
  padding: 16px;
  border-right: 1px solid #e4e7ed;
  background: #fafafa;
  overflow-y: auto;
  transition: all 0.3s ease;
}

.main {
  flex: 1;
  min-width: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.viewer-wrapper {
  flex: 1;
  display: flex;
  min-height: 0;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f6f8fa 0%, #e9ecef 100%);
}

.aside-header {
  display: flex;
  justify-content: flex-end;
  padding: 8px 12px 4px;
}

.collapse-btn {
  z-index: 5;
  transition: transform 0.3s ease;
}

.collapse-btn:hover {
  transform: scale(1.1);
}

.aside.collapsed {
  padding: 0;
  overflow: hidden;
  border-right: none;
}

.sidebar-toggle-fab {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s ease;
}

.sidebar-toggle-fab:hover {
  transform: scale(1.1);
}
</style>
