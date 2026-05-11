<template>
  <div class="home-page">
    <!-- Hero Section -->
    <section ref="heroRef" class="hero" @mousemove="onHeroMouseMove" @mouseleave="onHeroMouseLeave">
      <div class="hero-bg-grid" :style="heroGridStyle">
        <div v-for="i in 168" :key="i" class="hero-bead" :style="heroBeadStyle(i)" />
      </div>
      <div class="hero-overlay" />
      <div class="hero-content">
        <div class="hero-badge">
          <el-tag type="primary" round size="large">v1.0</el-tag>
          <a
            href="https://github.com/DerilJust/DDG"
            target="_blank"
            rel="noopener noreferrer"
            class="github-link"
            title="GitHub"
          >
            <svg class="github-icon" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path
                d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"
              />
            </svg>
          </a>
        </div>
        <h1 class="hero-title">
          <span class="title-line">拼豆图纸</span>
          <span class="title-line accent">生成器</span>
        </h1>
        <p class="hero-desc">
          上传任意图片，自动生成带编号的拼豆图纸。<br />
          支持 <strong>5 大品牌</strong>颜色编码，<strong>292 种</strong>真实拼豆颜色精准匹配。
        </p>
        <div class="hero-actions">
          <router-link to="/editor">
            <el-button type="primary" size="large" round class="cta-btn">
              <el-icon>
                <Edit />
              </el-icon>
              开始创作
            </el-button>
          </router-link>
          <el-button size="large" round class="ghost-btn" @click="scrollTo('features')">
            了解更多
            <el-icon>
              <ArrowDown />
            </el-icon>
          </el-button>
        </div>
        <div class="hero-mockup">
          <div class="mockup-card" :style="mockupCardStyle">
            <div class="mockup-dots">
              <span v-for="row in mockupRows" :key="row" class="mockup-row">
                <span
                  v-for="col in mockupCols"
                  :key="col"
                  class="mockup-dot"
                  :style="{ background: getMockBead(row - 1, col - 1) }"
                />
              </span>
            </div>
            <div class="mockup-label">30×30 · MARD · 20色</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="features reveal">
      <div class="section-header">
        <h2 class="section-title">核心功能</h2>
        <p class="section-subtitle">一站式拼豆图纸制作流程</p>
      </div>
      <el-row :gutter="28" justify="center">
        <el-col
          style="margin-bottom: 12px"
          :xs="24"
          :sm="12"
          :lg="8"
          v-for="(feat, idx) in features"
          :key="feat.title"
        >
          <div class="feature-card reveal" :style="{ transitionDelay: `${idx * 0.1}s` }">
            <div class="feature-icon-wrap" :style="{ background: feat.gradient }">
              <el-icon :size="32">
                <component :is="feat.icon" />
              </el-icon>
            </div>
            <h3>{{ feat.title }}</h3>
            <p>{{ feat.desc }}</p>
          </div>
        </el-col>
      </el-row>
    </section>

    <!-- How It Works -->
    <section class="how-it-works reveal">
      <div class="section-header">
        <h2 class="section-title">如何使用</h2>
        <p class="section-subtitle">四步生成您专属的拼豆图纸</p>
      </div>
      <div class="steps">
        <div class="step" v-for="(step, idx) in steps" :key="step.title">
          <div class="step-number" :style="{ background: step.color }">
            <el-icon :size="24">
              <component :is="step.icon" />
            </el-icon>
          </div>
          <div class="step-line" v-if="idx < steps.length - 1" />
          <div class="step-card">
            <el-card shadow="hover">
              <h4>{{ step.title }}</h4>
              <p>{{ step.desc }}</p>
            </el-card>
          </div>
        </div>
      </div>
    </section>

    <!-- Color Showcase -->
    <section class="color-showcase reveal">
      <div class="section-header">
        <h2 class="section-title">292 种真实拼豆颜色</h2>
        <p class="section-subtitle">覆盖多个主流品牌，精准还原您的创意</p>
      </div>
      <div class="color-strip">
        <div
          v-for="color in showcaseColors"
          :key="color"
          class="color-chip"
          :style="{ background: color }"
        />
      </div>
      <div class="brand-badges">
        <el-tag v-for="b in brands" :key="b" size="large" round effect="plain">
          {{ b }}
        </el-tag>
      </div>
    </section>

    <!-- Stats -->
    <section id="stats" class="stats reveal">
      <el-row :gutter="20" justify="center">
        <el-col :span="6" v-for="stat in stats" :key="stat.label">
          <div class="stat-card">
            <span class="stat-value">{{ stat.display }}</span>
            <span class="stat-label">{{ stat.label }}</span>
          </div>
        </el-col>
      </el-row>
    </section>

    <!-- CTA -->
    <section class="bottom-cta">
      <h2>准备好开始了吗？</h2>
      <p>上传您的第一张图片，生成精美的拼豆图纸。</p>
      <router-link to="/editor">
        <el-button type="primary" size="large" round class="cta-btn">
          <el-icon>
            <Edit />
          </el-icon>
          开始使用
        </el-button>
      </router-link>
    </section>

    <footer class="home-footer">
      <p>拼豆图纸生成器 &copy; {{ new Date().getFullYear() }} · Built with Vue 3 + Element Plus</p>
    </footer>

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
import { onMounted, onUnmounted, ref, reactive, nextTick } from 'vue'
import {
  Edit,
  ArrowDown,
  PictureFilled,
  Grid,
  EditPen,
  Download,
  Upload,
  Crop,
  MagicStick,
  Aim,
  Document
} from '@element-plus/icons-vue'

const features = [
  {
    icon: PictureFilled,
    title: '图片上传与裁剪',
    desc: '支持多种图片格式上传，提供精确的裁剪工具和预设比例，自由选取图案区域。',
    gradient: 'linear-gradient(135deg, #667eea, #764ba2)'
  },
  {
    icon: Grid,
    title: '智能颜色匹配',
    desc: '自动将图片颜色映射到 292 种真实拼豆颜色，支持 MARD、COCO 等 5 大品牌编码系统。',
    gradient: 'linear-gradient(135deg, #f093fb, #f5576c)'
  },
  {
    icon: EditPen,
    title: '交互式编辑',
    desc: '画笔、填充、橡皮擦、吸管四大工具，支持无限撤销/重做与自定义快捷键，随心微调每一颗拼豆。',
    gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)'
  },
  {
    icon: Aim,
    title: '专注串珠模式',
    desc: '导入压缩数据即可进入专注模式，高亮特定颜色、一键定位，串珠时不再眼花缭乱。',
    gradient: 'linear-gradient(135deg, #43e97b, #38f9d7)'
  },
  {
    icon: Upload,
    title: '多格式导出分享',
    desc: '高清 PNG 图纸导出，含颜色统计表和坐标标注，支持 RLE 压缩字符串分享给其他拼豆爱好者。',
    gradient: 'linear-gradient(135deg, #fa709a, #fee140)'
  },
  {
    icon: Document,
    title: '帮助文档与快捷键',
    desc: '内置详细帮助页面，涵盖快速开始、参数说明、快捷键参考，支持自定义快捷键预设。',
    gradient: 'linear-gradient(135deg, #a18cd1, #fbc2eb)'
  }
]

const steps = [
  {
    icon: Upload,
    title: '上传图片',
    desc: '拖拽或选择图片，支持 JPG、PNG 等常见格式，自动适配尺寸。',
    color: '#667eea'
  },
  {
    icon: Crop,
    title: '裁剪调整',
    desc: '拖拽裁剪框或选择预设比例，精确选取想要生成图纸的区域。',
    color: '#f5576c'
  },
  {
    icon: MagicStick,
    title: '生成图纸',
    desc: '设置网格大小和色阶数量，AI 智能匹配最近似的拼豆颜色。',
    color: '#4facfe'
  },
  {
    icon: Download,
    title: '导出分享',
    desc: '下载高清 PNG 图纸或复制压缩数据，与拼豆爱好者分享创作。',
    color: '#43e97b'
  }
]

const stats = [
  { value: 292, label: '真实拼豆颜色', display: 0 },
  { value: 5, label: '品牌编码系统', display: 0 },
  { value: 4, label: '功能页面', display: 0 },
  { value: 50, label: '最大色阶量化', display: 0 }
]

const brands = ['MARD', 'COCO', '漫漫', '盼盼', '咪小窝']

const showcaseColors = [
  '#FAF4C8',
  '#FCF6D6',
  '#FCEA9E',
  '#FDE278',
  '#FFD165',
  '#FEC652',
  '#FDBF3F',
  '#FDB82C',
  '#FEA819',
  '#FD9800',
  '#FFA631',
  '#F18D25',
  '#FF8C21',
  '#F0821E',
  '#EA7D1B',
  '#E57218',
  '#DD6715',
  '#D65C12',
  '#CF510F',
  '#C8460C',
  '#BC3B09',
  '#B03006',
  '#A42503',
  '#981A00',
  '#FFB5B5',
  '#FF9C9C',
  '#FF8383',
  '#FF6A6A',
  '#FF5151',
  '#FF3838',
  '#FF1F1F',
  '#FF0000',
  '#E50000',
  '#CC0000',
  '#B20000',
  '#990000',
  '#7F0000',
  '#E8B8D0',
  '#F5A2C6',
  '#EDA0C3',
  '#EEA2C4',
  '#E99BB6',
  '#E494A8',
  '#DF8D9A',
  '#DA868C',
  '#D57F7E',
  '#D07870',
  '#CB7162',
  '#E6F5C8',
  '#D4EEB0',
  '#C5E99B',
  '#B2E080',
  '#A0D668',
  '#8AC64E',
  '#75B636',
  '#60A61E',
  '#C8E6F5',
  '#B0D4EE',
  '#98C2E7',
  '#80B0E0',
  '#689ED9',
  '#508CD2',
  '#387ACB',
  '#2068C4'
]

const mockPalette = [
  '#FFD165',
  '#FF6A6A',
  '#6BCB77',
  '#4D96FF',
  '#F5A2C6',
  '#FBBF24',
  '#A3E635',
  '#C084FC',
  '#38BDF8',
  '#FB7185',
  '#FEC652',
  '#34D399',
  '#FF8C21',
  '#A0D668',
  '#80B0E0'
]

const isLoading = ref(true)

// --- animated mockup beads ---
const mockupRows = 6
const mockupCols = 10
const mockBeads = reactive(
  Array.from(
    { length: mockupRows * mockupCols },
    () => mockPalette[Math.floor(Math.random() * mockPalette.length)]
  )
)
let mockBeadTimer: ReturnType<typeof setInterval> | null = null

function cycleMockBeads() {
  const indices = new Set<number>()
  while (indices.size < 8) indices.add(Math.floor(Math.random() * mockBeads.length))
  for (const i of indices) {
    mockBeads[i] = mockPalette[Math.floor(Math.random() * mockPalette.length)]
  }
}

function getMockBead(row: number, col: number) {
  return mockBeads[row * mockupCols + col]
}

// --- stats counter animation ---
let statsAnimated = false
function animateStats() {
  if (statsAnimated) return
  statsAnimated = true
  for (const stat of stats) {
    const target = stat.value
    const duration = 1500
    const start = performance.now()
    function tick(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // ease-out
      const eased = 1 - Math.pow(1 - progress, 3)
      stat.display = Math.round(eased * target)
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }
}

// --- scroll reveal ---
let revealObserver: IntersectionObserver | null = null

function setupRevealObserver() {
  revealObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed')
          if (entry.target.id === 'stats') animateStats()
          revealObserver?.unobserve(entry.target)
        }
      }
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  )
  document.querySelectorAll('.reveal').forEach((el) => revealObserver!.observe(el))
}

// --- hero parallax ---
const heroRef = ref<HTMLElement | null>(null)
const heroGridStyle = ref<Record<string, string>>({})
const mockupCardStyle = ref<Record<string, string>>({})

function onHeroMouseMove(e: MouseEvent) {
  const el = heroRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const x = (e.clientX - rect.left) / rect.width - 0.5
  const y = (e.clientY - rect.top) / rect.height - 0.5
  heroGridStyle.value = {
    transform: `translate(${x * -12}px, ${y * -12}px)`
  }
  mockupCardStyle.value = {
    transform: `translate(${x * 18}px, ${y * 18}px) rotateX(${y * -3}deg) rotateY(${x * 3}deg)`
  }
}

function onHeroMouseLeave() {
  heroGridStyle.value = { transform: 'translate(0, 0)', transition: 'transform 0.6s ease-out' }
  mockupCardStyle.value = {
    transform: 'translate(0, 0) rotateX(0) rotateY(0)',
    transition: 'transform 0.6s ease-out'
  }
}

const heroBeadStyle = (i: number) => {
  const colors = ['#667eea22', '#764ba222', '#f093fb18', '#f5576c18', '#4facfe18', '#ffffff10']
  const size = 28 + (i % 4) * 6
  return {
    width: `${size}px`,
    height: `${size}px`,
    background: colors[i % colors.length],
    borderRadius: `${4 + (i % 3) * 2}px`,
    animationDelay: `${(i * 0.03).toFixed(2)}s`,
    animationDuration: `${3 + (i % 4)}s`
  }
}

const scrollTo = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

onMounted(async () => {
  setupRevealObserver()
  mockBeadTimer = setInterval(cycleMockBeads, 2200)
  await nextTick()
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      isLoading.value = false
    })
  })
})

onUnmounted(() => {
  revealObserver?.disconnect()
  if (mockBeadTimer) clearInterval(mockBeadTimer)
})
</script>

<style scoped>
.home-page {
  flex: 1;
  overflow-y: auto;
}

/* ========== Hero ========== */
.hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: linear-gradient(160deg, #1a1a2e 0%, #16213e 40%, #0f3460 70%, #1a1a2e 100%);
}

.hero-bg-grid {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(14, 1fr);
  grid-template-rows: repeat(12, 1fr);
  gap: 2px;
  padding: 40px;
  opacity: 0.6;
  transition: transform 0.15s ease-out;
  will-change: transform;
}

.hero-bead {
  border-radius: 4px;
  animation: heroPulse 4s ease-in-out infinite;
  backdrop-filter: blur(1px);
}

@keyframes heroPulse {
  0%,
  100% {
    opacity: 0.3;
    transform: scale(1);
  }

  50% {
    opacity: 0.6;
    transform: scale(1.05);
  }
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, transparent 30%, rgba(26, 26, 46, 0.85) 100%);
  z-index: 1;
}

.hero-content {
  position: relative;
  z-index: 2;
  text-align: center;
  padding: 40px 20px;
  max-width: 800px;
}

.hero-badge {
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.github-link {
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.55);
  transition:
    color 0.2s ease,
    transform 0.2s ease;
}

.github-link:hover {
  color: #fff;
  transform: scale(1.15);
}

.github-icon {
  display: block;
}

.hero-title {
  font-family: '寒蝉点阵体';
  margin-bottom: 24px;
  line-height: 1.2;
}

.title-line {
  display: block;
  font-size: 64px;
  color: #fff;
  text-shadow: 0 4px 20px rgba(102, 126, 234, 0.5);
  letter-spacing: 6px;
}

.title-line.accent {
  font-size: 72px;
  background: linear-gradient(135deg, #667eea, #f093fb);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: none;
  letter-spacing: 12px;
}

.hero-desc {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.8;
  margin-bottom: 36px;
}

.hero-desc strong {
  color: #f093fb;
  font-weight: 600;
}

.hero-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 48px;
}

.cta-btn {
  font-size: 18px;
  padding: 16px 40px;
  height: auto;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
}

.ghost-btn {
  background: transparent !important;
  border: 2px solid rgba(255, 255, 255, 0.3) !important;
  color: #fff !important;
  font-size: 18px;
  padding: 16px 36px;
  height: auto;
}

.ghost-btn:hover {
  border-color: rgba(255, 255, 255, 0.6) !important;
  background: rgba(255, 255, 255, 0.1) !important;
}

/* Hero mockup */
.hero-mockup {
  display: flex;
  justify-content: center;
}

.mockup-card {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  padding: 20px;
  display: inline-block;
  transition: transform 0.15s ease-out;
  will-change: transform;
  perspective: 200px;
}

.mockup-dots {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-bottom: 10px;
}

.mockup-row {
  display: flex;
  gap: 3px;
}

.mockup-dot {
  width: 18px;
  height: 18px;
  border-radius: 3px;
  transition:
    transform 0.2s,
    background 1.2s ease-in-out;
}

.mockup-dot:hover {
  transform: scale(1.3);
  z-index: 1;
}

.mockup-label {
  text-align: center;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  font-family: monospace;
  letter-spacing: 1px;
}

/* ========== Sections shared ========== */
.section-header {
  text-align: center;
  margin-bottom: 48px;
}

.section-title {
  font-size: 36px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 12px;
  letter-spacing: 1px;
}

.section-subtitle {
  font-size: 16px;
  color: #909399;
}

/* ========== Features ========== */
.features {
  padding: 80px 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.feature-card {
  text-align: center;
  padding: 40px 24px;
  border-radius: 20px;
  background: #fff;
  border: 1px solid #f0f0f0;
  transition: all 0.35s ease;
  height: 100%;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.1);
  border-color: #e0e0e0;
}

/* ---- Scroll Reveal ---- */
.reveal {
  opacity: 0;
  transform: translateY(36px);
  transition:
    opacity 0.7s ease,
    transform 0.7s ease;
}

.reveal.revealed {
  opacity: 1;
  transform: translateY(0);
}

.feature-card.revealed:hover {
  transform: translateY(-8px);
}

.feature-icon-wrap {
  width: 72px;
  height: 72px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  color: #fff;
}

.feature-card h3 {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
}

.feature-card p {
  font-size: 14px;
  color: #909399;
  line-height: 1.7;
}

/* ========== How It Works ========== */
.how-it-works {
  padding: 80px 24px;
  background: linear-gradient(135deg, #f8f9fc, #eef0f5);
}

.steps {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.step {
  display: flex;
  align-items: center;
  gap: 20px;
  position: relative;
}

.step-number {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  z-index: 1;
}

.step-line {
  position: absolute;
  left: 28px;
  top: calc(50% + 28px);
  width: 2px;
  height: calc(50% + 32px);
  background: linear-gradient(to bottom, #ddd, #e8e8e8);
}

.step-card {
  flex: 1;
}

.step-card h4 {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 6px;
}

.step-card p {
  font-size: 14px;
  color: #909399;
  line-height: 1.6;
}

/* ========== Color Showcase ========== */
.color-showcase {
  padding: 80px 24px;
  text-align: center;
}

.color-strip {
  display: flex;
  flex-wrap: wrap;
  max-width: 1000px;
  margin: 0 auto 32px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
}

.color-chip {
  flex: 0 0 calc(100% / 16);
  height: 48px;
  transition: all 0.2s;
}

.color-chip:hover {
  transform: scaleY(1.3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 1;
}

.brand-badges {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

/* ========== Stats ========== */
.stats {
  padding: 64px 24px;
  background: linear-gradient(135deg, #1a1a2e, #16213e);
}

.stat-card {
  text-align: center;
  padding: 28px 16px;
}

.stat-value {
  display: block;
  font-size: 42px;
  font-weight: 800;
  line-height: 1.15;
  background: linear-gradient(135deg, #667eea, #f093fb);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 6px;
}

.stat-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 1px;
}

/* ========== Bottom CTA ========== */
.bottom-cta {
  text-align: center;
  padding: 80px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.bottom-cta h2 {
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 12px;
}

.bottom-cta p {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 32px;
}

/* ========== Footer ========== */
.home-footer {
  text-align: center;
  padding: 24px;
  color: #c0c4cc;
  font-size: 13px;
  background: #fff;
  border-top: 1px solid #ebeef5;
}

/* ========== Responsive ========== */
@media (max-width: 768px) {
  .hero-title .title-line {
    font-size: 40px;
  }

  .hero-title .title-line.accent {
    font-size: 48px;
  }

  .hero-desc {
    font-size: 15px;
  }

  .hero-bg-grid {
    grid-template-columns: repeat(7, 1fr);
  }

  .stats .stat-value {
    font-size: 28px;
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

.loading-dot:nth-child(1) {
  animation-delay: 0s;
}
.loading-dot:nth-child(2) {
  animation-delay: 0.15s;
}
.loading-dot:nth-child(3) {
  animation-delay: 0.3s;
}
.loading-dot:nth-child(4) {
  animation-delay: 0.45s;
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
