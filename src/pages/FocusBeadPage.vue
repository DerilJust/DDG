<template>
  <div class="focus-page">
    <el-container class="root-container">
      <!-- Desktop/Tablet: sidebar as el-aside -->
      <el-aside
        v-if="!isMobile"
        :width="isCollapsed ? '0px' : isTablet ? '240px' : '300px'"
        class="aside"
        :class="{ collapsed: isCollapsed }"
      >
        <ImportSection ref="importSectionRef" @import="handleImport">
          <template #title-actions>
            <el-button
              :icon="isCollapsed ? Expand : Fold"
              circle
              size="small"
              class="collapse-btn"
              @click="toggleSidebar"
            />
          </template>
        </ImportSection>
        <ColorHighlightList
          v-if="colorStats.length > 0"
          :color-stats="colorStats"
          :highlighted-keys="highlightedKeys"
          @toggle-highlight="toggleHighlight"
        />
      </el-aside>

      <!-- Mobile: sidebar content in drawer -->
      <el-drawer
        v-else
        v-model="drawerVisible"
        direction="ltr"
        size="85%"
        :with-header="false"
        class="mobile-drawer"
      >
        <ImportSection ref="importSectionRef" @import="handleMobileImport">
          <template #title-actions>
            <el-button
              :icon="Fold"
              circle
              size="small"
              class="collapse-btn"
              @click="drawerVisible = false"
            />
          </template>
        </ImportSection>
        <ColorHighlightList
          v-if="colorStats.length > 0"
          :color-stats="colorStats"
          :highlighted-keys="highlightedKeys"
          @toggle-highlight="toggleHighlight"
        />
      </el-drawer>

      <el-main class="main">
        <el-button
          v-if="isCollapsed || isMobile"
          class="sidebar-toggle-fab"
          circle
          size="small"
          @click="openSidebar"
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

    <!-- Loading overlay -->
    <div class="page-loading" :class="{ 'loading-done': !isLoading }">
      <div class="loading-beads">
        <span
          v-for="i in 4"
          :key="i"
          class="loading-dot"
          :style="{ animationDelay: `${i * 0.15}s` }"
        />
      </div>
      <p class="loading-text">加载中...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, nextTick, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { Edit, Expand, Fold } from '@element-plus/icons-vue'
import { useAppStore } from '../store/appStore'
import { useBreakpoint } from '../composables/useBreakpoint'
import ImportSection from '../components/ImportSection.vue'
import ColorHighlightList from '../components/ColorHighlightList.vue'
import PatternViewer from '../components/PatternViewer.vue'

const appStore = useAppStore()
const { patternGrid, gridWidth, colorStats, perlerColors } = storeToRefs(appStore)

const { isMobile, isTablet } = useBreakpoint()

const importSectionRef = ref<InstanceType<typeof ImportSection> | null>(null)
const highlightedKeys = reactive(new Set<string>())
const isLoading = ref(true)
const isCollapsed = ref(false)
const drawerVisible = ref(false)

watch(
  isTablet,
  (val: any) => {
    if (val) {
      isCollapsed.value = true
    }
  },
  { immediate: true }
)

function openSidebar() {
  if (isMobile.value) {
    drawerVisible.value = true
  } else {
    isCollapsed.value = false
  }
}

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

function handleMobileImport(compressed: string) {
  handleImport(compressed)
  drawerVisible.value = false
}

onMounted(async () => {
  if (!perlerColors.value.length) {
    appStore.loadColorData()
  }
  if (patternGrid.value.length && colorStats.value.length === 0) {
    appStore.refreshColorStats()
  }
  await nextTick()
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      isLoading.value = false
    })
  })
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
  padding: 10px;
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

.aside.collapsed {
  padding: 0;
  overflow: hidden;
  border-right: none;
}

.collapse-btn {
  margin-left: auto;
  flex-shrink: 0;
  z-index: 5;
  transition: transform 0.3s ease;
}

.collapse-btn:hover {
  transform: scale(1.1);
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

/* Mobile drawer */
.mobile-drawer :deep(.el-drawer__body) {
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow-y: auto;
}

/* ---- Page Loading Overlay ---- */
.page-loading {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  background: linear-gradient(160deg, #1a1a2e 0%, #16213e 40%, #0f3460 70%, #1a1a2e 100%);
  opacity: 1;
  transition: opacity 0.35s ease;
  pointer-events: all;
}

.page-loading.loading-done {
  opacity: 0;
  pointer-events: none;
}

.loading-beads {
  display: flex;
  gap: 12px;
}

.loading-dot {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  background: linear-gradient(135deg, #667eea, #f093fb);
  animation: beadBounce 0.8s ease-in-out infinite;
}

@keyframes beadBounce {
  0%,
  100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  50% {
    transform: translateY(-16px);
    opacity: 1;
  }
}

.loading-text {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.5);
  letter-spacing: 2px;
  margin: 0;
}
</style>
