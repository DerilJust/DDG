<template>
  <div class="app-container">
    <el-container class="root-container">
      <el-header height="60px" class="header">
        <div class="header-content">
          <el-button size="small" @click="toggleSidebar" class="collapse-btn">
            <template v-if="isCollapsed">
              <el-icon :size="24">
                <Expand />
              </el-icon>
            </template>
            <template v-else>
              <el-icon :size="24">
                <Fold />
              </el-icon>
            </template>
          </el-button>
          <h1 class="title">拼豆图纸生成器</h1>
        </div>
      </el-header>
      <el-container>
        <el-aside :width="isCollapsed ? '0px' : '300px'" class="aside" :class="{ 'collapsed': isCollapsed }">
          <UploadSection />
          <Controls @generate="generatePattern" @download="downloadPattern" />
          <PatternInfo />
        </el-aside>
        <div class="main-wrapper">
          <el-main class="main">
            <el-tabs v-model="activeTab" class="main-tabs">
              <el-tab-pane label="原图预览" name="original">
                <template #label>
                  <el-icon>
                    <Picture />
                  </el-icon>
                  原图预览
                </template>
                <SourceImageCard />
              </el-tab-pane>

              <el-tab-pane style="height: 100%;" label="拼豆图纸" name="pattern">
                <template #label>
                  <el-icon>
                    <Grid />
                  </el-icon>
                  拼豆图纸
                </template>
                <PreviewSection ref="previewSection" />
              </el-tab-pane>

              <el-tab-pane label="导出预览" name="export">
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
            <EditPalette :palette="effectivePalette" :brand-palette="brandPalette" :active-color="selectedEditColor"
              :edit-mode="editMode" :selected-tool="selectedTool" :can-undo="undoStack.length > 0"
              :can-redo="redoStack.length > 0" @select="onEditSelectColor" @fill-all="onEditFillAll" @undo="onEditUndo"
              @redo="onEditRedo" @update:edit-mode="appStore.setEditMode($event)"
              @update:selected-tool="appStore.setSelectedTool($event)" />
          </el-footer>
        </div>
      </el-container>
    </el-container>

  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useAppStore } from './store/appStore';
import { buildBrandPalette } from './utils/patternUtils';
import UploadSection from './components/UploadSection.vue';
import Controls from './components/Controls.vue';
import PreviewSection from './components/PreviewSection.vue';
import EditPalette from './components/EditPalette.vue';
import PatternInfo from './components/PatternInfo.vue';
import SourceImageCard from './components/SourceImageCard.vue';
import ExportPreview from './components/ExportPreview.vue';
import { Fold, Expand, Picture, Grid, Download } from '@element-plus/icons-vue';

const appStore = useAppStore();
const {
  editMode,
  selectedTool,
  selectedEditColor,
  undoStack,
  redoStack,
  effectivePalette,
  perlerColors,
  selectedBrand
} = storeToRefs(appStore);

const brandPalette = computed(() => buildBrandPalette(perlerColors.value, selectedBrand.value));

const previewSection = ref<InstanceType<typeof PreviewSection> | null>(null);
const isCollapsed = ref(false);
const activeTab = ref('original');

onMounted(() => {
  appStore.loadColorData();
});

const toggleSidebar = (): void => {
  isCollapsed.value = !isCollapsed.value;
};

const generatePattern = (): void => {
  appStore.generatePattern();
  activeTab.value = 'pattern';
};

const downloadPattern = (): void => {
  const canvas = previewSection.value?.getFullResCanvas?.();
  if (!canvas) {
    alert('请先生成拼豆图纸');
    return;
  }

  const link = document.createElement('a');
  link.download = 'perler-pattern.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
};

const onEditSelectColor = (color: typeof selectedEditColor.value) => {
  appStore.setSelectedEditColor(color);
};

const onEditFillAll = () => {
  appStore.handleFillAll();
};

const onEditUndo = () => {
  appStore.undo();
};

const onEditRedo = () => {
  appStore.redo();
};
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
  font-family: 'Microsoft YaHei', Arial, sans-serif;
  background-color: #f0f2f5;
}

#app {
  height: 100%;
  width: 100%;
  overflow: hidden;
}

.app-container {
  height: 100%;
  width: 100%;
  overflow: hidden;
}

.header {
  background: #fff;
  color: white;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  border-bottom: 1px solid rgb(196, 195, 195);
  transition: all 0.3s ease;
}

.header:hover {
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.15);
}

.header-content {
  display: flex;
  align-items: center;
  width: 100%;
}

.collapse-btn {
  border-color: transparent !important;
}

.collapse-btn:hover {
  background-color: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  transform: scale(1.1);
}

h1.title {
  font-family: '寒蝉点阵体';
  font-size: 32px;
  font-weight: bold;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  letter-spacing: 2px;
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

.root-container {
  height: 100%;
}

.root-container>.el-container {
  flex: 1;
  min-height: 0;
}

.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.main {
  background: white;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.08);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.main-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.main-tabs :deep(.el-tabs__header) {
  margin: 0;
  background: linear-gradient(135deg, #f6f8fa 0%, #e9ecef 100%);
  border-bottom: 1px solid #e4e7ed;
}

.main-tabs :deep(.el-tabs__nav-wrap::after) {
  display: none;
}

.main-tabs :deep(.el-tabs__item) {
  border: none;
  background: transparent;
  color: #606266;
  font-weight: 500;
  padding: 0 24px;
  height: 56px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.main-tabs :deep(.el-tabs__item:hover) {
  color: #409EFF;
  background: rgba(64, 158, 255, 0.05);
}

.main-tabs :deep(.el-tabs__item.is-active) {
  color: #409EFF;
  background: white;
  border-bottom: 3px solid #409EFF;
  font-weight: bold;
}

.main-tabs :deep(.el-tabs__item .el-icon) {
  font-size: 18px;
}

.main-tabs :deep(.el-tabs__content) {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
}

.main-tabs :deep(.el-tab-pane) {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
  min-height: 0;
}

/**
 * 拼豆图纸编辑区域
 * 包含canvas和缩放平移控件
 */
.pattern-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 400px;
}

/**
 * 图纸区域的标题
 */
.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
  padding: 0 4px;
}


/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.editor-footer {
  flex-shrink: 0;
  padding: 10px 16px;
  background: #fff;
  border: 1px solid #e4e7ed;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.06);
}
</style>