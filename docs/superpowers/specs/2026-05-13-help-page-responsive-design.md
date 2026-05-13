# HelpPage 响应式布局修复

## 问题

HelpPage 在移动端（≤767px）布局失效。`el-container` 默认水平 flex，移动端 `top-nav` 与 `el-main` 并排显示而非上下堆叠。

## 方案

桌面/平板端保留现有 `el-aside` 侧边栏模式不变。移动端不再使用横向滚动 top-nav，改为在内容区顶部嵌入 `el-select` 下拉选择器。

## 模板结构

```
div.help-layout          ← 替换 el-container，普通 flex 容器
  el-aside (v-if !isMobile)   ← 保持不变
  div.help-main               ← 新增包裹层
    el-select (v-if isMobile) ← 移动端章节下拉导航
    el-main                   ← 保持不变
```

- `el-container` → `div.help-layout`：不再依赖 Element Plus 的隐式 flex 方向推断
- 去掉 `<nav class="top-nav">` 及其 5 个横向滚动链接
- `el-select` 位于 `el-main` 上方，仅在移动端渲染

## CSS

新增：
- `.help-layout`：`display: flex; flex: 1; min-height: 0;`
- `.help-main`：`flex: 1; min-width: 0; display: flex; flex-direction: column;`
- `@media (max-width: 767px)` 中 `.help-layout { flex-direction: column; }`
- `.select-nav { margin: 12px 12px 0; }`

保留现有侧边栏、内容区、步骤卡片等全部已有样式。

## 脚本逻辑

- 现有 `activeSection` ref 保持不变
- 新增 `isScrolling` guard ref，防止 select 触发的 scroll 与 IntersectionObserver 互相回弹
- `onNavSelect(id)`：设置 `isScrolling = true` → 更新 `activeSection` → 调用 `scrollTo(id)` → `setTimeout` 500ms 后释放 guard
- IntersectionObserver 回调在 `!isScrolling.value` 时才更新 `activeSection`

## 改动范围

| 文件 | 改动 |
|------|------|
| `src/pages/HelpPage.vue` 模板 | el-container → div.help-layout；去掉 top-nav（约 12 行）；添加 div.help-main 和 el-select |
| `src/pages/HelpPage.vue` script | 新增 isScrolling ref；新增 onNavSelect；IntersectionObserver 加 guard 判断 |
| `src/pages/HelpPage.vue` style | 新增 .help-layout / .help-main / .select-nav；移动端增加 flex-direction: column |

测试文件 `tests/` 下无需新增，现有 HelpPage 相关测试不会有影响（DOM 结构小改不涉及业务逻辑）。
