# HelpPage 响应式布局修复 - 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复 HelpPage 移动端布局失效：el-container 水平 flex 导致 top-nav 与 el-main 并排显示

**Architecture:** 将 el-container 替换为普通 div flex 容器；桌面/平板端保留 el-aside 侧边栏不变；移动端用 el-select 下拉替代横向滚动 top-nav

**Tech Stack:** Vue 3 SFC, Element Plus (el-select), TypeScript, CSS media queries

---

## 文件结构

仅修改一个文件：
- `src/pages/HelpPage.vue` — 模板、脚本、样式三部分改动

---

### Task 1: 修改模板结构

**Files:**
- Modify: `src/pages/HelpPage.vue:1-166`

- [ ] **Step 1: 替换模板外层和侧边栏/导航区域**

将行 2-32（help-page div 开头到 top-nav 结束）替换为：

```html
  <div class="help-layout">
    <!-- Desktop/Tablet: sidebar -->
    <el-aside v-if="!isMobile" :width="isTablet ? '160px' : '200px'" class="help-sidebar">
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
    </el-aside>

    <div class="help-main">
      <!-- Mobile: section select dropdown -->
      <el-select
        v-if="isMobile"
        v-model="activeSection"
        class="select-nav"
        placeholder="选择章节"
        @change="onNavSelect"
      >
        <el-option
          v-for="section in sections"
          :key="section.id"
          :label="section.title"
          :value="section.id"
        />
      </el-select>

      <el-main class="help-content">
```

将结尾 `</el-container>` (行 165) 改为：

```html
      </el-main>
    </div>
  </div>
```

- [ ] **Step 2: 检查模板完整性**

确认模板结构：`div.help-layout > [el-aside (v-if)] + div.help-main > [el-select (v-if)] + el-main`

### Task 2: 修改脚本逻辑

**Files:**
- Modify: `src/pages/HelpPage.vue:191-297`

- [ ] **Step 1: 添加 isScrolling guard ref**

在 `const activeSection = ref('quick-start')` 之后添加：

```typescript
const isScrolling = ref(false)
```

- [ ] **Step 2: 添加 onNavSelect 函数**

在 `scrollTo` 函数之后添加：

```typescript
function onNavSelect(id: string) {
  isScrolling.value = true
  activeSection.value = id
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  setTimeout(() => {
    isScrolling.value = false
  }, 500)
}
```

- [ ] **Step 3: 修改 IntersectionObserver 回调加 guard**

将 onMounted 中的回调 (行 274-281)：

```typescript
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          activeSection.value = entry.target.id
        }
      }
    },
```

改为：

```typescript
    (entries) => {
      if (isScrolling.value) return
      for (const entry of entries) {
        if (entry.isIntersecting) {
          activeSection.value = entry.target.id
        }
      }
    },
```

### Task 3: 修改 CSS 样式

**Files:**
- Modify: `src/pages/HelpPage.vue:301-747`

- [ ] **Step 1: 将 .help-page 替换为 .help-layout**

将行 302-305：

```css
.help-page {
  flex: 1;
  min-height: 0;
}
```

替换为：

```css
.help-layout {
  display: flex;
  flex: 1;
  min-height: 0;
}

.help-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.help-page {
  flex: 1;
  min-height: 0;
}
```

（保留 `.help-page` 用于 root element，添加 `.help-layout` 和 `.help-main`）

- [ ] **Step 2: 删除 top-nav 相关样式**

删除行 711-748（`/* ---- top nav (mobile) ---- */` 块及其全部 `.top-nav` / `.top-nav-link` / `.top-nav-link.active` 样式）。

- [ ] **Step 3: 在移动端 Media Query 中添加 flex-direction: column 和 select-nav 样式**

在 `@media (max-width: 767px)` 块（行 751-837 内）的最前面添加：

```css
  .help-layout {
    flex-direction: column;
  }

  .select-nav {
    margin: 12px 12px 0;
  }
```

### Task 4: 验证

**Files:**
- Modify: 无（验证步骤）

- [ ] **Step 1: Type-check**

```bash
npm run type-check
```

预期：通过，无类型错误

- [ ] **Step 2: Run tests**

```bash
npm run test
```

预期：全部通过

- [ ] **Step 3: Build**

```bash
npm run build
```

预期：Vite 构建成功

- [ ] **Step 4: Commit**

```bash
git add src/pages/HelpPage.vue
git commit -m "fix: repair HelpPage mobile responsive layout"
```
