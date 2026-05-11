<template>
  <div class="help-page">
    <aside class="help-sidebar">
      <div class="sidebar-header">帮助文档</div>
      <nav class="sidebar-nav">
        <a
          v-for="section in sections"
          :key="section.id"
          :class="['sidebar-link', { active: activeSection === section.id }]"
          :href="`#${section.id}`"
          @click.prevent="scrollTo(section.id)"
        >
          <el-icon><component :is="section.icon" /></el-icon>
          {{ section.title }}
        </a>
      </nav>
    </aside>

    <main class="help-content">
      <!-- 快速开始 -->
      <section id="quick-start" class="doc-section">
        <h2 class="section-title"><span class="title-number">1</span>快速开始</h2>
        <div class="steps-grid">
          <div v-for="(s, i) in quickSteps" :key="i" :class="['step-card', `step-card--${i + 1}`]">
            <div class="step-num">{{ i + 1 }}</div>
            <div class="step-connector"></div>
            <div class="step-body">
              <h4>
                <el-icon :size="16"><component :is="s.icon" /></el-icon>{{ s.title }}
              </h4>
              <p>{{ s.desc }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- 编辑器使用 -->
      <section id="editor" class="doc-section">
        <h2 class="section-title"><span class="title-number">2</span>编辑器使用</h2>
        <div class="info-card">
          <h4>编辑模式</h4>
          <p>点击底部工具栏的<strong>编辑</strong>开关进入编辑模式，使用各种工具修改图纸。</p>
        </div>
        <div class="tools-row">
          <div v-for="tool in editorTools" :key="tool.name" class="tool-chip">
            <el-icon :size="18"><component :is="tool.icon" /></el-icon>
            <span class="tool-name">{{ tool.name }}</span>
            <span class="tool-desc">{{ tool.desc }}</span>
          </div>
        </div>
        <div class="info-grid">
          <div class="info-card">
            <h4>撤销 / 重做</h4>
            <p>支持最多 <strong>50 步</strong>撤销历史，可使用快捷键操作。</p>
          </div>
          <div class="info-card">
            <h4>边缘扩展</h4>
            <p>拖拽图纸四边的蓝色手柄可在任意方向扩展图纸，新增格子为空白。</p>
          </div>
          <div class="info-card">
            <h4>全部填充</h4>
            <p>选择颜色后点击"全部填充"可将整个图纸填充为该颜色。</p>
          </div>
        </div>
      </section>

      <!-- 参数说明 -->
      <section id="params" class="doc-section">
        <h2 class="section-title"><span class="title-number">3</span>参数说明</h2>
        <div class="param-table">
          <div v-for="p in paramsList" :key="p.name" class="param-row">
            <div class="param-name">{{ p.name }}</div>
            <div class="param-desc">{{ p.desc }}</div>
          </div>
        </div>
      </section>

      <!-- 快捷键参考 -->
      <section id="shortcuts" class="doc-section">
        <h2 class="section-title"><span class="title-number">4</span>快捷键参考</h2>
        <div class="preset-group">
          <table class="shortcut-table">
            <thead>
              <tr>
                <th>功能</th>
                <th>默认预设</th>
                <th>类PS风格</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in combinedShortcutRows" :key="row.label">
                <td class="fn-col">{{ row.label }}</td>
                <td class="key-col">
                  <span v-for="key in row.defaultKeys" :key="key" class="keycap">{{ key }}</span>
                </td>
                <td class="key-col">
                  <span v-for="key in row.psKeys" :key="key" class="keycap">{{ key }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="hint">
          <el-icon><InfoFilled /></el-icon>
          在编辑器侧边栏中可以切换快捷键预设或自定义每个快捷键
        </p>
      </section>

      <!-- 导出说明 -->
      <section id="export" class="doc-section">
        <h2 class="section-title"><span class="title-number">5</span>导出说明</h2>
        <div class="info-grid">
          <div class="info-card">
            <h4>下载 PNG</h4>
            <p>在"导出预览"标签页或侧边栏点击下载按钮，获得带坐标轴边框的图纸图片。</p>
          </div>
          <div class="info-card">
            <h4>导出倍率</h4>
            <p>支持 1x ~ 4x 倍率导出，获取更高分辨率图片。</p>
          </div>
          <div class="info-card">
            <h4>压缩字符串</h4>
            <p>使用 RLE 行程编码压缩图纸数据，方便在专注拼豆页面导入分享。</p>
          </div>
        </div>
      </section>

      <footer class="help-footer">
        <span>拼豆图纸生成器 DDG</span>
        <a href="https://github.com/DerilJust/DDG" target="_blank">GitHub</a>
      </footer>
    </main>

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
import { onMounted, onUnmounted, ref, nextTick } from 'vue'
import {
  Document,
  Edit,
  Setting,
  MagicStick,
  Download,
  Brush,
  Pouring,
  Delete,
  Aim,
  Pointer,
  InfoFilled,
  Upload,
  Crop,
  Picture
} from '@element-plus/icons-vue'
import { SHORTCUT_PRESETS } from '../composables/useKeyboardShortcuts'
import type { ShortcutConfig } from '../types'

const isLoading = ref(true)
const activeSection = ref('quick-start')

const sections = [
  { id: 'quick-start', title: '快速开始', icon: Document },
  { id: 'editor', title: '编辑器使用', icon: Edit },
  { id: 'params', title: '参数说明', icon: Setting },
  { id: 'shortcuts', title: '快捷键参考', icon: MagicStick },
  { id: 'export', title: '导出说明', icon: Download }
]

const quickSteps = [
  {
    icon: Upload,
    title: '上传图片',
    desc: '在编辑器页面左侧点击上传区域，选择图片（支持 PNG、JPG、WebP 等格式）'
  },
  {
    icon: Crop,
    title: '裁剪与设置',
    desc: '拖拽调整裁剪区域，使用预设比例按钮快速裁剪，设置目标网格尺寸和颜色数量'
  },
  {
    icon: Picture,
    title: '生成图纸',
    desc: '确认裁剪后点击"生成图纸"，系统自动将图片颜色映射到拼豆颜色并生成网格图案'
  },
  {
    icon: Edit,
    title: '编辑与导出',
    desc: '使用编辑工具微调图纸，在导出预览标签页下载 PNG 或分享压缩数据'
  }
]

const editorTools = [
  { name: '画笔', desc: '拖拽涂色', icon: Brush },
  { name: '填充', desc: '区域替换', icon: Pouring },
  { name: '橡皮', desc: '擦除还原', icon: Delete },
  { name: '吸管', desc: '取色', icon: Aim },
  { name: '手形', desc: '拖拽视角', icon: Pointer }
]

const paramsList = [
  { name: '宽度 / 高度', desc: '网格尺寸，范围 5-1000。开启比例锁定时联动调整。' },
  { name: '颜色数量', desc: '量化颜色种类数，范围 1-50。数量少则简化，多则丰富。' },
  { name: '拼豆品牌', desc: '颜色编码体系：MARD、COCO、漫漫、盼盼、咪小窝。' },
  {
    name: '显示编号',
    desc: '格子上显示品牌颜色代码，方便对照购买。关闭后显示坐标轴边框辅助定位。'
  },
  { name: '锁定比例', desc: '修改宽/高时另一维度自动按图片原始比例调整。' },
  { name: '补充空白', desc: '自动将网格尺寸补充为 5 的倍数，四周均匀填充白色格子。' },
  { name: '导出倍率', desc: '导出 PNG 图片的放大倍率：1x (标准) ~ 4x (极清)。' }
]

const shortcutLabels: Record<string, string> = {
  toggleEditMode: '切换编辑模式',
  toolBrush: '画笔工具',
  toolFill: '填充工具',
  toolEraser: '橡皮工具',
  toolEyedropper: '吸管工具',
  toolPan: '手形工具',
  undo: '撤销',
  redo: '重做'
}

const combinedShortcutRows = Object.keys(SHORTCUT_PRESETS.default).map((k) => ({
  label: shortcutLabels[k] || k,
  defaultKeys: SHORTCUT_PRESETS.default[k as keyof ShortcutConfig].split('+'),
  psKeys: SHORTCUT_PRESETS.photoshop[k as keyof ShortcutConfig].split('+')
}))

function scrollTo(id: string) {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

let observer: IntersectionObserver | null = null

onMounted(async () => {
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          activeSection.value = entry.target.id
        }
      }
    },
    { rootMargin: '-10% 0px -75% 0px' }
  )
  for (const section of sections) {
    const el = document.getElementById(section.id)
    if (el) observer.observe(el)
  }
  await nextTick()
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      isLoading.value = false
    })
  })
})

onUnmounted(() => {
  observer?.disconnect()
})
</script>

<style scoped>
.help-page {
  flex: 1;
  display: flex;
  min-height: 0;
  background: #f8f9fb;
}

/* ---- sidebar ---- */
.help-sidebar {
  width: 200px;
  flex-shrink: 0;
  border-right: 1px solid #e9edf4;
  padding: 0;
  overflow-y: auto;
  background: #fff;
}

.sidebar-header {
  padding: 20px 16px 12px;
  font-weight: 700;
  font-size: 13px;
  color: #909399;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 0 8px;
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 13px;
  color: #606266;
  text-decoration: none;
  border-radius: 6px;
  transition: all 0.15s;
}

.sidebar-link:hover {
  color: #303133;
  background: #f0f2f5;
}

.sidebar-link.active {
  color: #409eff;
  background: #ecf5ff;
  font-weight: 600;
}

/* ---- content ---- */
.help-content {
  flex: 1;
  padding: 36px 56px 64px;
  overflow-y: auto;
  min-width: 0;
}

.doc-section {
  margin-bottom: 56px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 22px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 20px;
  padding-bottom: 0;
  border-bottom: none;
}

.title-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  background: #409eff;
  border-radius: 8px;
  flex-shrink: 0;
}

/* ---- steps ---- */
.steps-grid {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.step-card {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  background: #fff;
  border: 1px solid #e9edf4;
  border-left: 3px solid #e9edf4;
  border-radius: 10px;
  padding: 20px 24px;
  position: relative;
  transition: all 0.2s;
}

.step-card:not(:last-child) {
  margin-bottom: 16px;
}

.step-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border-left-color: #409eff;
}

.step-card--1 {
  border-left-color: #409eff;
}
.step-card--2 {
  border-left-color: #67c23a;
}
.step-card--3 {
  border-left-color: #e6a23c;
}
.step-card--4 {
  border-left-color: #f56c6c;
}

.step-num {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  border-radius: 50%;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.step-card--1 .step-num {
  background: #409eff;
}
.step-card--2 .step-num {
  background: #67c23a;
}
.step-card--3 .step-num {
  background: #e6a23c;
}
.step-card--4 .step-num {
  background: #f56c6c;
}

/* connector line between step numbers */
.step-connector {
  position: absolute;
  left: 39px;
  top: 64px;
  bottom: -16px;
  width: 2px;
  background: #dcdfe6;
  border-radius: 1px;
}

.step-card:last-child .step-connector {
  display: none;
}

.step-body {
  flex: 1;
  min-width: 0;
}

.step-body h4 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 6px 0;
}

.step-body h4 .el-icon {
  flex-shrink: 0;
}

.step-body p {
  font-size: 13px;
  line-height: 1.7;
  color: #606266;
  margin: 0;
}

/* ---- tools ---- */
.tools-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.tool-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #fff;
  border: 1px solid #e9edf4;
  border-radius: 8px;
  padding: 10px 16px;
  flex: 1 1 auto;
  min-width: 100px;
  transition: all 0.2s;
}

.tool-chip:hover {
  border-color: #c8d6e5;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.tool-chip .el-icon {
  color: #409eff;
  flex-shrink: 0;
}

.tool-name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.tool-desc {
  font-size: 12px;
  color: #909399;
  margin-left: auto;
}

/* ---- info cards ---- */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
  margin-bottom: 8px;
}

.info-card {
  background: #fff;
  border: 1px solid #e9edf4;
  border-radius: 10px;
  padding: 16px 20px;
  margin-bottom: 16px;
}

.info-card h4 {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 6px 0;
}

.info-card p {
  font-size: 13px;
  line-height: 1.6;
  color: #606266;
  margin: 0;
}

.info-card strong {
  color: #409eff;
}

/* ---- param table ---- */
.param-table {
  background: #fff;
  border: 1px solid #e9edf4;
  border-radius: 10px;
  overflow: hidden;
}

.param-row {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  padding: 14px 20px;
  border-bottom: 1px solid #f0f2f5;
}

.param-row:last-child {
  border-bottom: none;
}

.param-name {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  min-width: 90px;
  flex-shrink: 0;
  padding-top: 1px;
}

.param-desc {
  font-size: 13px;
  line-height: 1.6;
  color: #606266;
}

/* ---- shortcut table ---- */
.preset-group {
  background: #fff;
  border: 1px solid #e9edf4;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 16px;
}

.shortcut-table {
  width: 100%;
  border-collapse: collapse;
}

.shortcut-table th {
  padding: 12px 20px 8px;
  font-size: 11px;
  font-weight: 600;
  color: #909399;
  border-bottom: 1px solid #f0f2f5;
}

.shortcut-table td {
  padding: 10px 20px;
  font-size: 13px;
}

.fn-col {
  color: #303133;
  font-weight: 500;
}

.key-col {
  white-space: nowrap;
}

.hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #909399;
  margin: 0;
}

.hint .el-icon {
  color: #409eff;
}

/* ---- brands ---- */
.section-intro {
  font-size: 14px;
  color: #555;
  margin: 0 0 14px 0;
}

.section-intro strong {
  color: #409eff;
  font-size: 18px;
}

.brand-list {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.brand-badge {
  display: inline-flex;
  align-items: center;
  padding: 8px 20px;
  font-size: 14px;
  font-weight: 600;
  color: #3c4a5e;
  background: #fff;
  border: 1px solid #e9edf4;
  border-radius: 20px;
  transition: all 0.2s;
}

.brand-badge:hover {
  border-color: #409eff;
  color: #409eff;
  background: #ecf5ff;
}

.section-note {
  font-size: 13px;
  color: #909399;
  margin: 0;
}

/* ---- footer ---- */
.help-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 20px;
  border-top: 1px solid #e9edf4;
  font-size: 12px;
  color: #909399;
}

.help-footer a {
  color: #409eff;
  text-decoration: none;
}

.help-footer a:hover {
  text-decoration: underline;
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

<style>
/* non-scoped: keycap styles for v-html (if any) and global fallback */
.help-page .keycap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 26px;
  height: 26px;
  padding: 0 6px;
  font-size: 11px;
  font-family: 'Consolas', 'Courier New', monospace;
  font-weight: 600;
  color: #3c4a5e;
  background: linear-gradient(180deg, #fdfdfd 0%, #edf0f4 100%);
  border: 1px solid #cdd3db;
  border-bottom-width: 2px;
  border-radius: 5px;
  box-shadow:
    0 1px 0 rgba(0, 0, 0, 0.06),
    inset 0 1px 0 #fff;
  vertical-align: middle;
}

.help-page .key-plus {
  display: inline-flex;
  align-items: center;
  margin: 0 4px;
  font-size: 12px;
  color: #b0b8c4;
  font-weight: 400;
  vertical-align: middle;
}
</style>
