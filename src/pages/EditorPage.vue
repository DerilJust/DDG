<template>
  <div class="editor-page">
    <el-container class="root-container">
      <el-container>
        <!-- Desktop/Tablet: sidebar as el-aside -->
        <el-aside
          v-if="!isMobile"
          :width="isCollapsed ? '0px' : isTablet ? '240px' : '300px'"
          class="aside"
          :class="{ collapsed: isCollapsed }"
        >
          <UploadSection>
            <template #title-actions>
              <el-button
                :icon="isCollapsed ? Expand : Fold"
                circle
                size="small"
                class="collapse-btn"
                @click="toggleSidebar"
              />
            </template>
          </UploadSection>
          <Controls @generate="generatePattern" @download="downloadPattern" />
          <PatternInfo />
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
          <UploadSection>
            <template #title-actions>
              <el-button
                :icon="Fold"
                circle
                size="small"
                class="collapse-btn"
                @click="drawerVisible = false"
              />
            </template>
          </UploadSection>
          <Controls @generate="onMobileGenerate" @download="downloadPattern" />
          <PatternInfo />
        </el-drawer>

        <div class="main-wrapper">
          <el-main class="main">
            <el-button
              v-if="isCollapsed || isMobile"
              class="sidebar-toggle-fab"
              circle
              size="small"
              @click="openSidebar"
            >
              <el-icon :size="18">
                <Expand />
              </el-icon>
            </el-button>
            <el-tabs v-model="activeTab" class="main-tabs">
              <el-tab-pane style="height: 100%" label="拼豆图纸" name="pattern">
                <template #label>
                  <el-icon>
                    <Grid />
                  </el-icon>
                  拼豆图纸
                </template>
                <PreviewSection ref="previewSection" />
              </el-tab-pane>

              <el-tab-pane style="height: 100%" label="导出预览" name="export">
                <template #label>
                  <el-icon>
                    <Download />
                  </el-icon>
                  导出预览
                </template>
                <ExportPreview />
              </el-tab-pane>
            </el-tabs>
          </el-main>
          <el-footer :height="isMobile ? 'auto' : '180px'" class="editor-footer">
            <EditPalette
              :palette="effectivePalette"
              :brand-palette="brandPalette"
              :active-color="selectedEditColor"
              :edit-mode="editMode"
              :selected-tool="selectedTool"
              :can-undo="undoStack.length > 0"
              :can-redo="redoStack.length > 0"
              :collapsed="isMobile && paletteCollapsed"
              @select="onEditSelectColor"
              @fill-all="onEditFillAll"
              @undo="onEditUndo"
              @redo="onEditRedo"
              @update:edit-mode="appStore.setEditMode($event)"
              @update:selected-tool="appStore.setSelectedTool($event)"
              @toggle-collapse="paletteCollapsed = !paletteCollapsed"
            />
          </el-footer>
        </div>
      </el-container>
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
import { computed, onMounted, ref, nextTick, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useAppStore } from '../store/appStore'
import { useKeyboardShortcuts } from '../composables/useKeyboardShortcuts'
import { useBreakpoint } from '../composables/useBreakpoint'
import { buildBrandPalette } from '../utils/patternUtils'
import UploadSection from '../components/UploadSection.vue'
import Controls from '../components/Controls.vue'
import PreviewSection from '../components/PreviewSection.vue'
import EditPalette from '../components/EditPalette.vue'
import PatternInfo from '../components/PatternInfo.vue'

import ExportPreview from '../components/ExportPreview.vue'
import { Expand, Fold, Grid, Download } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const appStore = useAppStore()
const {
  editMode,
  selectedTool,
  selectedEditColor,
  undoStack,
  redoStack,
  effectivePalette,
  perlerColors,
  selectedBrand
} = storeToRefs(appStore)

const { isMobile, isTablet } = useBreakpoint()

const brandPalette = computed(() => buildBrandPalette(perlerColors.value, selectedBrand.value))

const isLoading = ref(true)
const previewSection = ref<InstanceType<typeof PreviewSection> | null>(null)
const isCollapsed = ref(false)
const activeTab = ref('pattern')
const drawerVisible = ref(false)
const paletteCollapsed = ref(true)

onMounted(async () => {
  appStore.loadColorData()
  appStore.loadShortcutConfig()
  await nextTick()
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      isLoading.value = false
    })
  })
})

// Collapse sidebar by default on tablet
watch(
  isTablet,
  (val: any) => {
    if (val) {
      isCollapsed.value = true
    }
  },
  { immediate: true }
)

useKeyboardShortcuts(() => appStore.activeShortcutConfig, {
  toggleEditMode: () => appStore.setEditMode(!editMode.value),
  setTool: (tool) => appStore.setSelectedTool(tool as typeof selectedTool.value),
  undo: () => {
    if (undoStack.value.length > 0) appStore.undo()
  },
  redo: () => {
    if (redoStack.value.length > 0) appStore.redo()
  }
})

const openSidebar = (): void => {
  if (isMobile.value) {
    drawerVisible.value = true
  } else {
    isCollapsed.value = false
  }
}

const toggleSidebar = (): void => {
  isCollapsed.value = !isCollapsed.value
}

const onMobileGenerate = (): void => {
  generatePattern()
  drawerVisible.value = false
}

const generatePattern = (): void => {
  appStore.generatePattern()
  activeTab.value = 'pattern'
}

const downloadPattern = (): void => {
  const canvas = previewSection.value?.getFullResCanvas?.()
  if (!canvas) {
    ElMessage.warning('请先生成拼豆图纸')
    return
  }

  const link = document.createElement('a')
  link.download = 'perler-pattern.png'
  link.href = canvas.toDataURL('image/png')
  link.click()
}

const onEditSelectColor = (color: typeof selectedEditColor.value) => {
  appStore.setSelectedEditColor(color)
}

const onEditFillAll = () => {
  appStore.handleFillAll()
}

const onEditUndo = () => {
  appStore.undo()
}

const onEditRedo = () => {
  appStore.redo()
}
</script>

<style scoped>
.editor-page {
  flex: 1;
  min-height: 0;
}

.root-container {
  height: 100%;
}

.root-container > .el-container {
  flex: 1;
  min-height: 0;
}

.aside {
  background-color: white;
  border-right: 1px solid #e4e7ed;
  overflow-y: auto;
  box-shadow: 2px 0 12px 0 rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 0;
  height: 100%;
  box-sizing: border-box;
}

.aside.collapsed {
  padding: 0;
  overflow: hidden;
  border-right: none;
  box-shadow: none;
}

.collapse-btn {
  margin-left: auto;
  flex-shrink: 0;
  transition: transform 0.3s ease;
}

.collapse-btn:hover {
  transform: scale(1.1);
}

.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  position: relative;
}

.main {
  background: white;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.08);
  padding-top: 0px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.main .el-tabs {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.main .el-tabs__content {
  flex: 1;
  min-height: 0;
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

.editor-footer {
  flex-shrink: 0;
  padding: 10px 16px;
  background: #fff;
  border: 1px solid #e4e7ed;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.06);
}

/* Mobile drawer */
.mobile-drawer :deep(.el-drawer__body) {
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow-y: auto;
}

/* Responsive */
@media (max-width: 767px) {
  .editor-footer {
    padding: 6px 8px;
  }
}

@media (min-width: 768px) and (max-width: 1023px) {
  .editor-footer {
    padding: 8px 12px;
  }
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
