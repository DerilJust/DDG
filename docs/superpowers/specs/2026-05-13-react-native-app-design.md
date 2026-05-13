# React Native 手机端设计文档

**日期**: 2026-05-13
**状态**: 设计完成

## 概述

在现有 Vue 3 拼豆图纸生成器项目中新增 React Native 手机端，通过 monorepo + 共享包复用核心逻辑，实现 Android/iOS 全功能覆盖。

## 目录结构

```
DDG/
├── packages/shared/                    # 共享核心逻辑（新建）
│   ├── src/
│   │   ├── patternUtils.ts
│   │   ├── compressionUtils.ts
│   │   ├── editUtils.ts
│   │   ├── selectionUtils.ts
│   │   ├── types.ts
│   │   └── colorMap/
│   │       ├── colorSystemMapping.json
│   │       └── colorMap.json
│   ├── package.json
│   └── tsconfig.json
├── src/                               # Vue 版本（引用 @ddg/shared）
├── rn/                                # React Native / Expo（新建）
│   ├── app/                           # Expo Router 文件路由
│   │   ├── (tabs)/
│   │   │   ├── index.tsx              # Editor 页
│   │   │   ├── focus.tsx              # Focus 模式
│   │   │   └── help.tsx               # 帮助页
│   │   ├── _layout.tsx                # 根布局
│   │   └── image-crop.tsx             # 图片裁剪模态页
│   ├── src/
│   │   ├── store/
│   │   │   ├── appStore.ts            # Zustand 核心状态
│   │   │   └── historyStore.ts        # Undo/redo
│   │   ├── components/
│   │   │   ├── SkiaCanvas.tsx         # Skia 网格渲染 + 手势
│   │   │   ├── ImagePicker.tsx        # 图片上传入口
│   │   │   ├── CropView.tsx           # 裁剪界面
│   │   │   ├── Controls.tsx           # 参数设置
│   │   │   ├── EditPalette.tsx        # 底部调色板 + 工具
│   │   │   ├── PatternInfo.tsx        # 颜色使用统计
│   │   │   ├── ExportPreview.tsx      # 导出预览 + 分享
│   │   │   └── ColorHighlightList.tsx # Focus 高亮
│   │   ├── hooks/
│   │   │   ├── useImageProcessor.ts   # 图片 → patternGrid
│   │   │   ├── useGesture.ts          # Pan + Pinch
│   │   │   └── useAspectRatioLock.ts  # 宽高比锁定
│   │   └── theme.ts                   # Paper 主题
│   ├── package.json
│   ├── tsconfig.json
│   └── app.json
├── package.json                       # npm workspaces
└── tsconfig.base.json
```

## 技术栈

| 层 | Vue 版本 | React Native 版本 |
|---|---|---|
| 框架 | Vue 3 | Expo SDK + Expo Router |
| 状态管理 | Pinia | Zustand |
| 渲染 | Canvas 2D API | @shopify/react-native-skia |
| UI 组件 | Element Plus | React Native Paper |
| 手势 | — | react-native-gesture-handler |
| 图片处理 | FileReader + Canvas | expo-image-picker + expo-image-manipulator |
| 路由 | vue-router (hash) | Expo Router (file-based) |

## 共享包 `@ddg/shared`

从现有 `src/utils/` 和 `src/types/` 抽取，Vue 和 RN 两边 import 同一份代码：

- `patternUtils.ts` — 颜色匹配（findClosestColor）、量化（quantizeColorsUtil）、统计（buildColorStats/buildPatternPalette）、网格尺寸（setGridSizeByImageRatio/GCD）
- `compressionUtils.ts` — RLE 压缩/解压（compressPatternGrid/decompressPatternGrid）
- `editUtils.ts` — 网格克隆（clonePatternGrid）、flood fill（fillConnectedRegion）、颜色比较（areColorsEqual）
- `selectionUtils.ts` — 选择区域几何运算
- `types.ts` — PerlerColor / PatternCell / ColorStat / AppStoreState 等接口，去除 HTMLImageElement/File 等浏览器类型
- `colorMap/` — colorSystemMapping.json（292 色映射）、colorMap.json

Vue 端改造：将 `src/utils/` 中原文件改为从 `@ddg/shared` re-export。

## 组件迁移映射

| Vue 组件 | RN 组件 | 说明 |
|---|---|---|
| `CanvasViewer.vue` | `SkiaCanvas.tsx` | Skia Canvas + Gesture Handler |
| `UploadSection.vue` | `ImagePicker.tsx` | expo-image-picker + Paper Button |
| `CropperDialog.vue` | `CropView.tsx` | expo-image-manipulator + 手势裁剪 |
| `Controls.vue` | `Controls.tsx` | Paper Slider/SegmentedButtons/Switch |
| `EditPalette.vue` | `EditPalette.tsx` | Paper Chip + SegmentedButtons + IconButton |
| `PatternInfo.vue` | `PatternInfo.tsx` | Paper DataTable |
| `ExportPreview.vue` | `ExportPreview.tsx` | Skia 渲染 + Share API |
| `ColorHighlightList.vue` | `ColorHighlightList.tsx` | Paper List + Checkbox |
| `HelpPage.vue` | `help.tsx` | Paper Card/List/Typography |
| `PreviewSection.vue` | 合并入 SkiaCanvas | — |

## 数据流

```
expo-image-picker
      │
      ▼
  ImagePicker ──pixels──► useImageProcessor
                              │
                         findClosestColor()
                         quantizeColorsUtil()
                         (from @ddg/shared)
                              │
                              ▼
                         Zustand Store ────────────► SkiaCanvas (渲染)
                              │                         │
                              ▼                         ▼
                         Controls ◄──────────► EditPalette
                         (grid size,            (tool, color,
                          color count,           undo/redo)
                          brand, etc.)
```

## 图片处理流水线

1. `expo-image-picker` 选取图片（相册/相机）
2. `expo-image-manipulator` 裁剪 + 缩放
3. 读取像素数据
4. 逐像素 `findClosestColor()` 映射到 292 拼豆色
5. `quantizeColorsUtil()` 量化到目标颜色数
6. 生成 `patternGrid`，写入 Zustand store
7. Skia Canvas 响应式渲染

## 手势系统

- 单指拖拽：平移画布
- 双指缩放：以双指中心为原点缩放
- 编辑模式：
  - 点击（brush/eraser/eyedropper）：选中格子
  - 拖拽（area select + fill）：框选区域

## 导出功能

- 使用 `expo-file-system` 写入临时文件
- 使用 `expo-sharing` 分享图片
- 压缩字符串导出到剪贴板（`expo-clipboard`）

## 实施阶段

1. **Monorepo + 共享包** — 配置 npm workspaces，抽取 `@ddg/shared`，Vue 端引用更新
2. **Expo 脚手架** — `npx create-expo-app@latest rn`，安装依赖，配置 Paper 主题
3. **核心状态 + 图片处理** — Zustand store + useImageProcessor hook
4. **SkiaCanvas 渲染** — 网格渲染 + 手势系统
5. **编辑器组件** — Controls, EditPalette, ImagePicker, CropView
6. **导出 + Focus 模式** — ExportPreview, ColorHighlightList
7. **帮助页 + 打磨** — HelpPage, 响应式适配, 测试
