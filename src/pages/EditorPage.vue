<template>
  <div class="editor-page">
    <el-container class="root-container">
      <el-container>
        <el-aside
          :width="isCollapsed ? '0px' : '300px'"
          class="aside"
          :class="{ collapsed: isCollapsed }"
        >
          <UploadSection />
          <Controls @generate="generatePattern" @download="downloadPattern" />
          <PatternInfo />
        </el-aside>
        <div class="main-wrapper">
          <el-main class="main">
            <el-button
              v-if="isCollapsed"
              class="sidebar-toggle-fab"
              circle
              size="small"
              @click="toggleSidebar"
            >
              <el-icon :size="18">
                <Expand />
              </el-icon>
            </el-button>
            <el-tabs v-model="activeTab" class="main-tabs">
              <el-tab-pane style="height: 100%" label="原图预览" name="original">
                <template #label>
                  <el-icon>
                    <Picture />
                  </el-icon>
                  原图预览
                </template>
                <SourceImageCard />
              </el-tab-pane>

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
          <el-footer height="180px" class="editor-footer">
            <EditPalette
              :palette="effectivePalette"
              :brand-palette="brandPalette"
              :active-color="selectedEditColor"
              :edit-mode="editMode"
              :selected-tool="selectedTool"
              :can-undo="undoStack.length > 0"
              :can-redo="redoStack.length > 0"
              @select="onEditSelectColor"
              @fill-all="onEditFillAll"
              @undo="onEditUndo"
              @redo="onEditRedo"
              @update:edit-mode="appStore.setEditMode($event)"
              @update:selected-tool="appStore.setSelectedTool($event)"
            />
          </el-footer>
        </div>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useAppStore } from '../store/appStore'
import { buildBrandPalette } from '../utils/patternUtils'
import UploadSection from '../components/UploadSection.vue'
import Controls from '../components/Controls.vue'
import PreviewSection from '../components/PreviewSection.vue'
import EditPalette from '../components/EditPalette.vue'
import PatternInfo from '../components/PatternInfo.vue'
import SourceImageCard from '../components/SourceImageCard.vue'
import ExportPreview from '../components/ExportPreview.vue'
import { Expand, Picture, Grid, Download } from '@element-plus/icons-vue'

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

const brandPalette = computed(() => buildBrandPalette(perlerColors.value, selectedBrand.value))

const previewSection = ref<InstanceType<typeof PreviewSection> | null>(null)
const isCollapsed = ref(false)
const activeTab = ref('original')

onMounted(() => {
  appStore.loadColorData()
})

const toggleSidebar = (): void => {
  isCollapsed.value = !isCollapsed.value
}

const generatePattern = (): void => {
  appStore.generatePattern()
  activeTab.value = 'pattern'
}

const downloadPattern = (): void => {
  const canvas = previewSection.value?.getFullResCanvas?.()
  if (!canvas) {
    alert('请先生成拼豆图纸')
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
  gap: 20px;
  height: 100%;
  box-sizing: border-box;
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
}

.editor-footer {
  flex-shrink: 0;
  padding: 10px 16px;
  background: #fff;
  border: 1px solid #e4e7ed;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.06);
}
</style>
