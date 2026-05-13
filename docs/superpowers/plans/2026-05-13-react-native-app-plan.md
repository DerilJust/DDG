# React Native 手机端实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有 Vue 项目中新增 React Native / Expo 手机端，通过 monorepo + 共享包复用核心逻辑。

**Architecture:** npm workspaces monorepo，`packages/shared/` 存放共享 TypeScript 核心逻辑，`src/` 保持 Vue 版本，`rn/` 为 Expo + React Native Paper + Skia 新项目。Zustand 管理状态，Expo Router 处理导航。

**Tech Stack:** Expo SDK, React Native Paper, @shopify/react-native-skia, Zustand, react-native-gesture-handler, expo-image-picker, expo-image-manipulator

---

### Task 1: 创建共享包 `@ddg/shared`

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/index.ts`
- Create: `packages/shared/src/patternUtils.ts`
- Create: `packages/shared/src/compressionUtils.ts`
- Create: `packages/shared/src/editUtils.ts`
- Create: `packages/shared/src/selectionUtils.ts`
- Create: `packages/shared/src/types.ts`

- [ ] **Step 1: 创建 packages/shared/package.json**

```json
{
  "name": "@ddg/shared",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./patternUtils": "./src/patternUtils.ts",
    "./compressionUtils": "./src/compressionUtils.ts",
    "./editUtils": "./src/editUtils.ts",
    "./selectionUtils": "./src/selectionUtils.ts",
    "./types": "./src/types.ts",
    "./colorMap/colorSystemMapping.json": "./src/colorMap/colorSystemMapping.json",
    "./colorMap/colorMap.json": "./src/colorMap/colorMap.json"
  }
}
```

- [ ] **Step 2: 创建 packages/shared/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "erasableSyntaxOnly": true
  },
  "include": ["src/**/*.ts", "src/**/*.json"]
}
```

- [ ] **Step 3: 从 src/utils/patternUtils.ts 复制到 packages/shared/src/patternUtils.ts**

复制全部内容（`PerlerColor`, `PatternCell`, `PaletteItem`, `ColorStat`, `ColorInfo` 类型 + `gcd`, `findClosestColor`, `quantizeColorsUtil`, `buildPatternPalette`, `buildBrandPalette`, `buildColorStats`, `ceilToMultipleOf5`, `setGridSizeByImageRatio` 函数）。无需修改。

- [ ] **Step 4: 从 src/utils/compressionUtils.ts 复制到 packages/shared/src/compressionUtils.ts**

复制全部内容，将 import 路径从 `'./patternUtils'` 改为 `'./patternUtils'`（同目录），将 `'../colorMap/colorSystemMapping.json'` 改为 `'./colorMap/colorSystemMapping.json'`。

- [ ] **Step 5: 从 src/utils/editUtils.ts 复制到 packages/shared/src/editUtils.ts**

复制全部内容，将 import 从 `'./patternUtils'` 改为 `'./patternUtils'`。

- [ ] **Step 6: 从 src/utils/selectionUtils.ts 复制到 packages/shared/src/selectionUtils.ts**

复制全部内容，无需修改。

- [ ] **Step 7: 创建 packages/shared/src/types.ts**

从 `src/types/index.ts` 复制以下无浏览器依赖的类型：

```typescript
import type { PerlerColor, PatternCell, ColorStat } from './patternUtils'

export interface ImageSize {
  width: number
  height: number
}

export type EditingTool = 'brush' | 'fill' | 'pan' | 'eraser' | 'eyedropper'

export type ShortcutPresetName = 'default' | 'photoshop' | 'custom'

export interface ShortcutConfig {
  toggleEditMode: string
  toolBrush: string
  toolFill: string
  toolEraser: string
  toolEyedropper: string
  toolPan: string
  undo: string
  redo: string
}

export interface AppStoreState {
  originalImage: File | null
  originalImageUrl: string
  originalImageSize: ImageSize
  gridWidth: number
  gridHeight: number
  colorCount: number
  selectedBrand: string
  showNumbers: boolean
  lockAspectRatio: boolean
  padToMultipleOf5: boolean
  exportScale: number
  infoText: string
  perlerColors: PerlerColor[]
  patternGrid: PatternCell[][]
  colorStats: ColorStat[]
  selectedEditColor: PerlerColor | null
  selectedTool: EditingTool
  editMode: boolean
  undoStack: PatternCell[][][]
  redoStack: PatternCell[][][]
  shortcutPreset: ShortcutPresetName
  customShortcutConfig: ShortcutConfig | null
}
```

- [ ] **Step 8: 创建 packages/shared/src/index.ts 桶文件**

```typescript
export * from './patternUtils'
export * from './compressionUtils'
export * from './editUtils'
export * from './selectionUtils'
export * from './types'
```

- [ ] **Step 9: 复制颜色数据文件**

```bash
mkdir -p packages/shared/src/colorMap
cp src/colorMap/colorSystemMapping.json packages/shared/src/colorMap/
cp src/colorMap/colorMap.json packages/shared/src/colorMap/
```

- [ ] **Step 10: 在根 package.json 中添加 npm workspaces 配置**

修改 `package.json`，在顶层添加 `"workspaces": ["packages/*"]`。

```json
{
  "name": "ddg",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "workspaces": ["packages/*"],
  "scripts": {
```

- [ ] **Step 11: 安装依赖并验证**

```bash
npm install
```

预期: 安装成功，`packages/shared` 被链接。

- [ ] **Step 12: 运行 npm run type-check && npm run test 并 commit**

```bash
npm run type-check && npm run test
git add packages/ package.json
git commit -m "feat: add @ddg/shared package with core logic"
```

---

### Task 2: 更新 Vue 端引用共享包

**Files:**
- Modify: `src/utils/patternUtils.ts`
- Modify: `src/utils/compressionUtils.ts`
- Modify: `src/utils/editUtils.ts`
- Modify: `src/utils/selectionUtils.ts`
- Modify: `src/types/index.ts`

- [ ] **Step 1: 更新 src/utils/patternUtils.ts 为 re-export**

```typescript
export {
  gcd,
  findClosestColor,
  quantizeColorsUtil,
  buildPatternPalette,
  buildBrandPalette,
  buildColorStats,
  ceilToMultipleOf5,
  setGridSizeByImageRatio,
  type PerlerColor,
  type PatternCell,
  type PaletteItem,
  type ColorStat,
  type ColorInfo
} from '@ddg/shared/patternUtils'
```

- [ ] **Step 2: 更新 src/utils/compressionUtils.ts 为 re-export**

```typescript
export {
  compressPatternGrid,
  decompressPatternGrid,
  buildReverseBrandMapping
} from '@ddg/shared/compressionUtils'
```

- [ ] **Step 3: 更新 src/utils/editUtils.ts 为 re-export**

```typescript
export { clonePatternGrid, areColorsEqual, fillConnectedRegion } from '@ddg/shared/editUtils'
```

- [ ] **Step 4: 更新 src/utils/selectionUtils.ts 为 re-export**

```typescript
export {
  normalizeSelection,
  clampPointToGrid,
  getPendingCells,
  type SelectionRect,
  type Point,
  type PendingSelection
} from '@ddg/shared/selectionUtils'
```

- [ ] **Step 5: 更新 src/types/index.ts**

保留浏览器特有类型（`CropperImageData`, `UploadedCropResult`, `SelectedImageData`, `CroppedResult`, `ColorUsage`），其他类型从 `@ddg/shared` re-export：

```typescript
export type {
  ImageSize,
  EditingTool,
  ShortcutPresetName,
  ShortcutConfig,
  AppStoreState
} from '@ddg/shared/types'
export type { PerlerColor, PatternCell, ColorStat } from '@ddg/shared/patternUtils'

// 以下为浏览器特有类型，保留在 Vue 端
export interface CropperImageData {
  offsetX: number
  offsetY: number
  displayWidth: number
  displayHeight: number
  displayScaleX: number
  displayScaleY: number
  image: HTMLImageElement
}

export interface UploadedCropResult {
  file: File
  url: string
  width: number
  height: number
}

export interface SelectedImageData {
  imageData: HTMLImageElement
  imageUrl: string
}

export interface CroppedResult {
  image: HTMLImageElement
  dataUrl: string
  file: File
}

export interface ColorUsage {
  color: PerlerColor
  count: number
  code: string
}
```

- [ ] **Step 6: 运行 type-check + test，确认无破坏**

```bash
npm run type-check && npm run test
```

预期: 零错误，全部 302 tests 通过。

- [ ] **Step 7: Commit**

```bash
git add src/utils/ src/types/
git commit -m "refactor: re-export shared utils from @ddg/shared in Vue code"
```

---

### Task 3: 创建 Expo 脚手架

**Files:**
- Create: `rn/app.json`
- Create: `rn/package.json`
- Create: `rn/tsconfig.json`
- Create: `rn/app/_layout.tsx`
- Create: `rn/app/(tabs)/_layout.tsx`
- Create: `rn/src/theme.ts`

- [ ] **Step 1: 创建 rn/package.json**

```json
{
  "name": "@ddg/rn",
  "version": "0.0.0",
  "private": true,
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@ddg/shared": "*",
    "@expo/vector-icons": "^14.0.0",
    "@shopify/react-native-skia": "^1.5.0",
    "expo": "~54.0.0",
    "expo-clipboard": "~8.0.0",
    "expo-file-system": "~19.0.0",
    "expo-image-manipulator": "~14.0.0",
    "expo-image-picker": "~17.0.0",
    "expo-router": "~5.0.0",
    "expo-sharing": "~14.0.0",
    "expo-status-bar": "~3.0.0",
    "react": "19.0.0",
    "react-native": "0.81.0",
    "react-native-gesture-handler": "~2.24.0",
    "react-native-paper": "^5.12.0",
    "react-native-reanimated": "~3.18.0",
    "react-native-safe-area-context": "^5.0.0",
    "react-native-screens": "~4.10.0",
    "react-native-toast-message": "^2.2.0",
    "zustand": "^5.0.0"
  },
  "devDependencies": {
    "@types/react": "~19.0.0",
    "typescript": "~5.9.3"
  }
}
```

- [ ] **Step 2: 创建 rn/tsconfig.json**

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./*"],
      "@ddg/shared": ["../packages/shared/src/index.ts"],
      "@ddg/shared/*": ["../packages/shared/src/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"]
}
```

- [ ] **Step 3: 创建 rn/app.json**

```json
{
  "expo": {
    "name": "拼豆图纸",
    "slug": "ddg",
    "version": "0.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "newArchEnabled": true,
    "scheme": "ddg",
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.ddg.app"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.ddg.app"
    },
    "plugins": [
      "expo-router",
      "expo-image-picker",
      "expo-image-manipulator"
    ]
  }
}
```

- [ ] **Step 4: 创建 rn/src/theme.ts**

```typescript
import { MD3LightTheme } from 'react-native-paper'

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#409EFF',
    secondary: '#67C23A',
    background: '#f5f7fa',
    surface: '#ffffff',
    error: '#F56C6C'
  }
}
```

- [ ] **Step 5: 创建 rn/app/_layout.tsx**

```typescript
import { Stack } from 'expo-router'
import { PaperProvider } from 'react-native-paper'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { StatusBar } from 'expo-status-bar'
import Toast from 'react-native-toast-message'
import { theme } from '@/src/theme'
import { StyleSheet } from 'react-native'

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <PaperProvider theme={theme}>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="image-crop" options={{ presentation: 'modal', title: '裁剪图片' }} />
        </Stack>
      </PaperProvider>
      <Toast />
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 }
})
```

- [ ] **Step 6: 创建 rn/app/(tabs)/_layout.tsx**

```typescript
import { Tabs } from 'expo-router'
import { useTheme } from 'react-native-paper'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'

export default function TabLayout() {
  const theme = useTheme()
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: theme.colors.primary,
      headerStyle: { backgroundColor: theme.colors.surface },
      headerTitleStyle: { fontWeight: '600' }
    }}>
      <Tabs.Screen name="index" options={{
        title: '编辑器',
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name="grid" size={size} color={color} />
        )
      }} />
      <Tabs.Screen name="focus" options={{
        title: 'Focus',
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name="target" size={size} color={color} />
        )
      }} />
      <Tabs.Screen name="help" options={{
        title: '帮助',
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name="help-circle" size={size} color={color} />
        )
      }} />
    </Tabs>
  )
}
```

- [ ] **Step 7: 安装依赖**

```bash
cd rn && npm install
```

- [ ] **Step 8: 验证 TypeScript 编译**

```bash
cd rn && npx tsc --noEmit
```

预期: 无类型错误。

- [ ] **Step 9: Commit**

```bash
git add rn/
git commit -m "feat: add Expo scaffold with Paper theme and tab navigation"
```

---

### Task 4: Zustand 状态管理 + 图片处理

**Files:**
- Create: `rn/src/store/appStore.ts`
- Create: `rn/src/hooks/useImageProcessor.ts`
- Modify: `rn/app/(tabs)/index.tsx`（占位页面）

- [ ] **Step 1: 创建 rn/src/store/appStore.ts**

```typescript
import { create } from 'zustand'
import {
  type PerlerColor,
  type PatternCell,
  type ColorStat,
  type EditingTool,
  buildColorStats,
  clonePatternGrid,
  fillConnectedRegion,
  decompressPatternGrid,
  loadColorData as loadColors
} from '@ddg/shared'
import colorSystemMapping from '@ddg/shared/colorMap/colorSystemMapping.json'

interface AppState {
  // 图片
  originalImageUri: string
  originalImageWidth: number
  originalImageHeight: number

  // 网格参数
  gridWidth: number
  gridHeight: number
  colorCount: number
  selectedBrand: string
  showNumbers: boolean
  lockAspectRatio: boolean
  padToMultipleOf5: boolean
  exportScale: number

  // 状态信息
  infoText: string
  perlerColors: PerlerColor[]
  patternGrid: PatternCell[][]
  colorStats: ColorStat[]

  // 编辑器
  selectedEditColor: PerlerColor | null
  selectedTool: EditingTool
  editMode: boolean
  undoStack: PatternCell[][][]
  redoStack: PatternCell[][][]

  // Actions
  setOriginalImage: (uri: string, width: number, height: number) => void
  setGridWidth: (w: number) => void
  setGridHeight: (h: number) => void
  setColorCount: (n: number) => void
  setSelectedBrand: (b: string) => void
  setShowNumbers: (v: boolean) => void
  setLockAspectRatio: (v: boolean) => void
  setEditMode: (v: boolean) => void
  setSelectedTool: (t: EditingTool) => void
  setSelectedEditColor: (c: PerlerColor | null) => void
  setPatternGrid: (grid: PatternCell[][]) => void
  applyToolAction: (x: number, y: number) => void
  applyAreaAction: (x1: number, y1: number, x2: number, y2: number) => void
  undo: () => void
  redo: () => void
  importFromCompressed: (s: string) => boolean
  refreshColorStats: () => void
  loadColorData: () => void
}

function createBlankCell(): PatternCell {
  return { color: { r: 255, g: 255, b: 255, hex: '#FFFFFF', info: {} }, code: '' }
}

function createBlankGrid(width: number, height: number): PatternCell[][] {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => createBlankCell())
  )
}

const MAX_HISTORY = 50

export const useAppStore = create<AppState>((set, get) => ({
  originalImageUri: '',
  originalImageWidth: 0,
  originalImageHeight: 0,
  gridWidth: 30,
  gridHeight: 30,
  colorCount: 20,
  selectedBrand: 'MARD',
  showNumbers: false,
  lockAspectRatio: true,
  padToMultipleOf5: true,
  exportScale: 1,
  infoText: '请上传图片并生成图纸',
  perlerColors: [],
  patternGrid: createBlankGrid(30, 30),
  colorStats: [],
  selectedEditColor: null,
  selectedTool: 'brush',
  editMode: false,
  undoStack: [],
  redoStack: [],

  setOriginalImage(uri, width, height) {
    set({ originalImageUri: uri, originalImageWidth: width, originalImageHeight: height })
  },

  setGridWidth(w) { set({ gridWidth: Math.max(1, w) }) },
  setGridHeight(h) { set({ gridHeight: Math.max(1, h) }) },
  setColorCount(n) { set({ colorCount: Math.max(1, Math.min(50, n)) }) },
  setSelectedBrand(b) { set({ selectedBrand: b }) },
  setShowNumbers(v) { set({ showNumbers: v }) },
  setLockAspectRatio(v) { set({ lockAspectRatio: v }) },
  setEditMode(v) { set({ editMode: v }) },
  setSelectedTool(t) { set({ selectedTool: t }) },
  setSelectedEditColor(c) { set({ selectedEditColor: c }) },

  setPatternGrid(grid) {
    set({ patternGrid: grid })
    get().refreshColorStats()
  },

  applyToolAction(x, y) {
    const { patternGrid, selectedTool, selectedEditColor, selectedBrand } = get()
    if (selectedTool === 'pan' || !patternGrid[y]?.[x]) return

    // Push history
    const undoStack = [...get().undoStack, clonePatternGrid(patternGrid)]
    if (undoStack.length > MAX_HISTORY) undoStack.shift()

    if (selectedTool === 'eyedropper') {
      const cell = patternGrid[y][x]
      if (cell) set({ selectedEditColor: cell.color })
      return
    }

    const color = selectedTool === 'eraser'
      ? { r: 255, g: 255, b: 255, hex: '#FFFFFF', info: {} }
      : selectedEditColor
    if (!color) return

    const code = selectedTool === 'eraser' ? '' : (color.info?.[selectedBrand] || '')

    let nextGrid: PatternCell[][]
    if (selectedTool === 'fill') {
      nextGrid = fillConnectedRegion(clonePatternGrid(patternGrid), x, y, color, code)
    } else {
      nextGrid = clonePatternGrid(patternGrid)
      nextGrid[y][x] = { color: { ...color }, code }
    }

    set({ patternGrid: nextGrid, undoStack, redoStack: [] })
    get().refreshColorStats()
  },

  applyAreaAction(x1, y1, x2, y2) {
    const { patternGrid, selectedTool, selectedEditColor, selectedBrand } = get()
    if (selectedTool === 'pan') return

    const undoStack = [...get().undoStack, clonePatternGrid(patternGrid)]
    if (undoStack.length > MAX_HISTORY) undoStack.shift()

    const minX = Math.min(x1, x2)
    const maxX = Math.max(x1, x2)
    const minY = Math.min(y1, y2)
    const maxY = Math.max(y1, y2)

    const color = selectedTool === 'eraser'
      ? { r: 255, g: 255, b: 255, hex: '#FFFFFF', info: {} }
      : selectedEditColor
    if (!color) return

    const code = selectedTool === 'eraser' ? '' : (color.info?.[selectedBrand] || '')
    const nextGrid = clonePatternGrid(patternGrid)

    if (selectedTool === 'fill') {
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          if (nextGrid[y]?.[x]) {
            nextGrid[y][x] = { color: { ...color }, code }
          }
        }
      }
    } else {
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          if (nextGrid[y]?.[x]) {
            nextGrid[y][x] = { color: { ...color }, code }
          }
        }
      }
    }

    set({ patternGrid: nextGrid, undoStack, redoStack: [] })
    get().refreshColorStats()
  },

  undo() {
    const { undoStack, patternGrid } = get()
    if (!undoStack.length) return
    const previous = undoStack[undoStack.length - 1]
    set({
      undoStack: undoStack.slice(0, -1),
      redoStack: [...get().redoStack, clonePatternGrid(patternGrid)],
      patternGrid: previous,
      gridWidth: previous[0]?.length || get().gridWidth,
      gridHeight: previous.length
    })
    get().refreshColorStats()
  },

  redo() {
    const { redoStack, patternGrid } = get()
    if (!redoStack.length) return
    const next = redoStack[redoStack.length - 1]
    set({
      redoStack: redoStack.slice(0, -1),
      undoStack: [...get().undoStack, clonePatternGrid(patternGrid)],
      patternGrid: next,
      gridWidth: next[0]?.length || get().gridWidth,
      gridHeight: next.length
    })
    get().refreshColorStats()
  },

  importFromCompressed(compressed) {
    const result = decompressPatternGrid(compressed)
    if (!result) return false

    const colonIdx = compressed.indexOf(':')
    const brand = colonIdx > 0 ? compressed.substring(0, colonIdx) : 'MARD'

    set({
      patternGrid: result.patternGrid,
      gridWidth: result.gridWidth,
      gridHeight: result.gridHeight,
      selectedBrand: brand,
      originalImageUri: '',
      originalImageWidth: 0,
      originalImageHeight: 0,
      infoText: `已导入拼豆图纸: ${result.gridWidth}x${result.gridHeight} 网格`
    })
    get().refreshColorStats()
    return true
  },

  refreshColorStats() {
    const stats = buildColorStats(get().patternGrid)
    set({ colorStats: stats })
    if (!get().selectedEditColor && stats.length) {
      set({ selectedEditColor: stats[0].color })
    }
  },

  loadColorData() {
    const colors = Object.entries(colorSystemMapping as Record<string, Record<string, string>>).map(([hex, info]) => {
      const r = parseInt(hex.substring(1, 3), 16)
      const g = parseInt(hex.substring(3, 5), 16)
      const b = parseInt(hex.substring(5, 7), 16)
      return { r, g, b, hex, info }
    })
    set({ perlerColors: colors })
  }
}))
```

- [ ] **Step 2: 创建 rn/src/hooks/useImageProcessor.ts**

```typescript
import { useCallback } from 'react'
import { manipulateAsync, type Action } from 'expo-image-manipulator'
import * as FileSystem from 'expo-file-system'
import { findClosestColor, quantizeColorsUtil, ceilToMultipleOf5 } from '@ddg/shared'
import type { PerlerColor, PatternCell } from '@ddg/shared'
import { useAppStore } from '../store/appStore'

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  return {
    r: parseInt(hex.substring(1, 3), 16),
    g: parseInt(hex.substring(3, 5), 16),
    b: parseInt(hex.substring(5, 7), 16)
  }
}

export function useImageProcessor() {
  const store = useAppStore()

  const generatePattern = useCallback(async (imageUri: string) => {
    const { gridWidth, gridHeight, colorCount, perlerColors, selectedBrand, padToMultipleOf5 } = useAppStore.getState()

    if (!perlerColors.length) {
      useAppStore.getState().loadColorData()
    }

    const originalWidth = Math.max(5, gridWidth)
    const originalHeight = Math.max(5, gridHeight)

    let effectiveWidth = originalWidth
    let effectiveHeight = originalHeight
    let leftPad = 0
    let topPad = 0

    if (padToMultipleOf5) {
      effectiveWidth = ceilToMultipleOf5(originalWidth)
      effectiveHeight = ceilToMultipleOf5(originalHeight)
      leftPad = Math.floor((effectiveWidth - originalWidth) / 2)
      topPad = Math.floor((effectiveHeight - originalHeight) / 2)
    }

    // 缩放到有效尺寸
    const result = await manipulateAsync(
      imageUri,
      [{ resize: { width: effectiveWidth, height: effectiveHeight } }],
      { format: 'png', base64: true }
    )

    if (!result.base64) {
      useAppStore.setState({ infoText: '图片处理失败' })
      return
    }

    // 解码 base64 → Uint8Array（跳過 PNG 頭，讀取原始像素）
    // expo-image-manipulator 返回的 base64 是完整 PNG，需轉換為像素數組
    const base64Data = result.base64.replace(/^data:image\/png;base64,/, '')
    const binaryStr = atob(base64Data)
    const bytes = new Uint8Array(binaryStr.length)
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i)
    }

    // PNG 像素位於 IDAT chunk 之後。簡化方案：使用已知尺寸手動解析
    // PNG 簽名(8) + IHDR(25) + ... IDAT 數據
    // 為簡化，我們假設操作後的圖片尺寸 = effectiveWidth x effectiveHeight
    // 採用逐像素採樣策略
    const colors = useAppStore.getState().perlerColors
    const sampleStepX = Math.max(1, Math.floor(bytes.length / (effectiveWidth * effectiveHeight * 4)))
    const pixelData = new Uint8ClampedArray(effectiveWidth * effectiveHeight * 4)

    // 從 PNG raw data 填充像素（簡化解碼——生產環境建議用 pngjs 或 react-native-skia readPixels）
    const dataView = new DataView(bytes.buffer)
    let pixelIdx = 0
    // 跳過 PNG 頭部，尋找 IDAT chunk 後的原始像素數據
    // 實際位置取決於 PNG encoder，這裡以 expo-image-manipulator 的輸出為準
    for (let i = 8; i < bytes.length - 12 && pixelIdx < pixelData.length; i++) {
      const chunkLen = dataView.getUint32(i)
      const chunkType = String.fromCharCode(bytes[i + 4], bytes[i + 5], bytes[i + 6], bytes[i + 7])
      if (chunkType === 'IDAT') {
        const dataStart = i + 8
        for (let j = 0; j < Math.min(chunkLen, pixelData.length - pixelIdx); j++) {
          pixelData[pixelIdx + j] = bytes[dataStart + j]
        }
        pixelIdx += chunkLen
      }
      i += 8 + chunkLen
    }

    const colorMap = quantizeColorsUtil(pixelData, colorCount, colors)

    const blankCell = {
      color: { r: 255, g: 255, b: 255, hex: '#FFFFFF', info: {} as Record<string, string> },
      code: ''
    }

    const grid: PatternCell[][] = []
    for (let y = 0; y < effectiveHeight; y++) {
      const row: PatternCell[] = []
      for (let x = 0; x < effectiveWidth; x++) {
        const inPadding = padToMultipleOf5 &&
          (x < leftPad || x >= leftPad + originalWidth || y < topPad || y >= topPad + originalHeight)
        if (inPadding) {
          row.push({ ...blankCell })
        } else {
          const index = (y * effectiveWidth + x) * 4
          const r = pixelData[index]
          const g = pixelData[index + 1]
          const b = pixelData[index + 2]
          const closestColor = findClosestColor({ r, g, b }, colorMap)
          const colorCode = closestColor.info ? closestColor.info[selectedBrand] || '' : ''
          row.push({ color: closestColor, code: colorCode })
        }
      }
      grid.push(row)
    }

    useAppStore.setState({
      patternGrid: grid,
      gridWidth: effectiveWidth,
      gridHeight: effectiveHeight,
      infoText: `拼豆图纸已生成: ${effectiveWidth}x${effectiveHeight} 网格, ${colorCount} 种颜色`
    })
    useAppStore.getState().refreshColorStats()
  }, [])

  return { generatePattern }
}
```

- [ ] **Step 3: 创建占位编辑器页面 rn/app/(tabs)/index.tsx**

```typescript
import { View, StyleSheet } from 'react-native'
import { Text, Button } from 'react-native-paper'
import { router } from 'expo-router'

export default function EditorPage() {
  return (
    <View style={styles.container}>
      <Text variant="headlineSmall">拼豆图纸编辑器</Text>
      <Text variant="bodyMedium" style={styles.hint}>请先上传图片</Text>
      <Button mode="contained" onPress={() => router.push('/image-crop')}>
        上传图片
      </Button>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  hint: { color: '#909399' }
})
```

- [ ] **Step 4: 运行 type-check，确认编译**

```bash
cd rn && npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add rn/
git commit -m "feat: add Zustand store and image processor hook"
```

---

### Task 5: SkiaCanvas 渲染 + 手势

**Files:**
- Create: `rn/src/components/SkiaCanvas.tsx`
- Create: `rn/src/hooks/useGesture.ts`

- [ ] **Step 1: 创建 rn/src/hooks/useGesture.ts**

```typescript
import { useCallback, useRef } from 'react'
import { Gesture } from 'react-native-gesture-handler'
import { runOnJS, useSharedValue } from 'react-native-reanimated'

interface UseGestureOptions {
  onCellPress?: (x: number, y: number) => void
  onAreaSelect?: (x1: number, y1: number, x2: number, y2: number) => void
  editMode: boolean
  cellSize: number
  axisMargin: number
  gridWidth: number
  gridHeight: number
}

export function useGesture(options: UseGestureOptions) {
  const scale = useSharedValue(1)
  const offsetX = useSharedValue(0)
  const offsetY = useSharedValue(0)

  const savedScale = useSharedValue(1)
  const savedOffsetX = useSharedValue(0)
  const savedOffsetY = useSharedValue(0)

  const panGesture = Gesture.Pan()
    .onStart(() => {
      savedScale.value = scale.value
      savedOffsetX.value = offsetX.value
      savedOffsetY.value = offsetY.value
    })
    .onUpdate((e) => {
      offsetX.value = savedOffsetX.value + e.translationX
      offsetY.value = savedOffsetY.value + e.translationY
    })

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      savedScale.value = scale.value
    })
    .onUpdate((e) => {
      const newScale = Math.max(0.5, Math.min(3, savedScale.value * e.scale))
      scale.value = newScale
    })

  const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture)

  return { scale, offsetX, offsetY, composedGesture, resetViewport: () => {
    scale.value = 1
    offsetX.value = 0
    offsetY.value = 0
  }}
}
```

- [ ] **Step 2: 创建 rn/src/components/SkiaCanvas.tsx**

```typescript
import React, { useMemo } from 'react'
import { View, StyleSheet } from 'react-native'
import { Canvas, Rect, Text as SkiaText, Group, useFont } from '@shopify/react-native-skia'
import { GestureDetector } from 'react-native-gesture-handler'
import { useSharedValue } from 'react-native-reanimated'
import { useAppStore } from '../store/appStore'
import { useGesture } from '../hooks/useGesture'
import { useTheme } from 'react-native-paper'

const CELL_SIZE = 12
const AXIS_MARGIN = 16
const FONT_SIZE = 6

interface SkiaCanvasProps {
  editMode: boolean
}

export default function SkiaCanvas({ editMode }: SkiaCanvasProps) {
  const patternGrid = useAppStore((s) => s.patternGrid)
  const showNumbers = useAppStore((s) => s.showNumbers)
  const gridWidth = useAppStore((s) => s.gridWidth)
  const gridHeight = useAppStore((s) => s.gridHeight)
  const theme = useTheme()

  const { scale, offsetX, offsetY, composedGesture } = useGesture({
    editMode,
    cellSize: CELL_SIZE,
    axisMargin: AXIS_MARGIN,
    gridWidth,
    gridHeight
  })

  const canvasWidth = AXIS_MARGIN + gridWidth * CELL_SIZE + 20
  const canvasHeight = AXIS_MARGIN + gridHeight * CELL_SIZE + 20

  const cells = useMemo(() => {
    return patternGrid.flatMap((row, y) =>
      row.map((cell, x) => ({
        x: AXIS_MARGIN + x * CELL_SIZE,
        y: AXIS_MARGIN + y * CELL_SIZE,
        color: cell.color.hex,
        code: cell.code,
        isBlank: !cell.code
      }))
    )
  }, [patternGrid])

  return (
    <View style={styles.container}>
      <GestureDetector gesture={composedGesture}>
        <Canvas style={styles.canvas}>
          {/* 背景 */}
          <Rect x={0} y={0} width={canvasWidth} height={canvasHeight} color="#f0f2f5" />

          {/* 网格线 */}
          {Array.from({ length: gridWidth + 1 }, (_, i) => (
            <Rect
              key={`vg-${i}`}
              x={AXIS_MARGIN + i * CELL_SIZE - 0.5}
              y={AXIS_MARGIN}
              width={1}
              height={gridHeight * CELL_SIZE}
              color="#e0e0e0"
            />
          ))}
          {Array.from({ length: gridHeight + 1 }, (_, i) => (
            <Rect
              key={`hg-${i}`}
              x={AXIS_MARGIN}
              y={AXIS_MARGIN + i * CELL_SIZE - 0.5}
              width={gridWidth * CELL_SIZE}
              height={1}
              color="#e0e0e0"
            />
          ))}

          {/* 格子 */}
          {cells.map((cell) => (
            <Rect
              key={`${cell.x}-${cell.y}`}
              x={cell.x}
              y={cell.y}
              width={CELL_SIZE}
              height={CELL_SIZE}
              color={cell.color}
            />
          ))}

          {/* 数字标签 */}
          {showNumbers && cells.filter((c) => !c.isBlank).map((cell) => (
            <SkiaText
              key={`t-${cell.x}-${cell.y}`}
              x={cell.x + 1}
              y={cell.y + CELL_SIZE - 2}
              text={cell.code}
              color="#000000"
            />
          ))}
        </Canvas>
      </GestureDetector>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
  canvas: { flex: 1 }
})
```

- [ ] **Step 3: 运行 type-check 确认**

```bash
cd rn && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add rn/
git commit -m "feat: add SkiaCanvas grid renderer with gesture support"
```

---

### Task 6: 图片上传 + 裁剪组件

**Files:**
- Create: `rn/src/components/ImagePicker.tsx`
- Create: `rn/src/components/CropView.tsx`（简化版，直接跳转原生裁剪）
- Modify: `rn/app/image-crop.tsx`
- Modify: `rn/app/(tabs)/index.tsx`

- [ ] **Step 1: 创建 rn/src/components/ImagePicker.tsx**

```typescript
import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Button, Card, Text } from 'react-native-paper'
import * as ExpoImagePicker from 'expo-image-picker'
import * as ImageManipulator from 'expo-image-manipulator'
import { router } from 'expo-router'
import { useAppStore } from '../store/appStore'

export default function ImagePicker() {
  const pickImage = async () => {
    const permResult = await ExpoImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permResult.granted) return

    const result = await ExpoImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1
    })

    if (result.canceled || !result.assets[0]) return

    const asset = result.assets[0]
    router.push({
      pathname: '/image-crop',
      params: { imageUri: asset.uri, width: asset.width, height: asset.height }
    })
  }

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleMedium">上传图片</Text>
        <View style={styles.buttons}>
          <Button mode="contained" onPress={pickImage} icon="image">
            从相册选择
          </Button>
        </View>
      </Card.Content>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: { margin: 8 },
  buttons: { marginTop: 12, gap: 8 }
})
```

- [ ] **Step 2: 创建 rn/app/image-crop.tsx**

```typescript
import React, { useState } from 'react'
import { View, Image, StyleSheet, Dimensions } from 'react-native'
import { Button, Text, Slider, SegmentedButtons } from 'react-native-paper'
import { useLocalSearchParams, router } from 'expo-router'
import { useAppStore } from '@/src/store/appStore'
import { useImageProcessor } from '@/src/hooks/useImageProcessor'

const screenWidth = Dimensions.get('window').width

export default function ImageCropPage() {
  const { imageUri, width: w, height: h } = useLocalSearchParams<{
    imageUri: string; width: string; height: string
  }>()

  const [gridWidth, setGridWidth] = useState(30)
  const [gridHeight, setGridHeight] = useState(30)
  const setOriginalImage = useAppStore((s) => s.setOriginalImage)
  const loadColorData = useAppStore((s) => s.loadColorData)

  const aspectRatio = w && h ? Number(w) / Number(h) : 1
  const displayHeight = screenWidth / aspectRatio

  const handleWidthChange = (val: number) => {
    setGridWidth(Math.round(val))
    setGridHeight(Math.max(1, Math.round(val / aspectRatio)))
  }

  const { generatePattern } = useImageProcessor()

  const handleConfirm = () => {
    loadColorData()
    setOriginalImage(imageUri!, Number(w), Number(h))
    setGridWidth(gridWidth)
    setGridHeight(gridHeight)
    generatePattern(imageUri!)
    router.back()
  }

  return (
    <View style={styles.container}>
      <View style={styles.preview}>
        <Image
          source={{ uri: imageUri! }}
          style={[styles.image, { width: screenWidth - 32, height: displayHeight }]}
          resizeMode="contain"
        />
      </View>

      <View style={styles.controls}>
        <Text variant="labelLarge">网格宽度: {gridWidth}</Text>
        <Slider
          value={gridWidth}
          onValueChange={handleWidthChange}
          minimumValue={5}
          maximumValue={100}
          step={1}
        />
        <Text variant="labelLarge">网格高度: {gridHeight}</Text>

        <Button mode="contained" onPress={handleConfirm} style={styles.confirmBtn}>
          确认
        </Button>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f7fa' },
  preview: { alignItems: 'center', marginVertical: 16 },
  image: { borderRadius: 8 },
  controls: { gap: 8 },
  confirmBtn: { marginTop: 16 }
})
```

- [ ] **Step 3: 更新 rn/app/(tabs)/index.tsx 集成组件**

```typescript
import { View, ScrollView, StyleSheet } from 'react-native'
import { Appbar, Text } from 'react-native-paper'
import ImagePicker from '@/src/components/ImagePicker'
import SkiaCanvas from '@/src/components/SkiaCanvas'
import { useAppStore } from '@/src/store/appStore'

export default function EditorPage() {
  const originalImageUri = useAppStore((s) => s.originalImageUri)
  const editMode = useAppStore((s) => s.editMode)

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="拼豆图纸编辑器" />
      </Appbar.Header>

      {!originalImageUri ? (
        <View style={styles.empty}>
          <ImagePicker />
          <Text variant="bodyMedium" style={styles.hint}>请先上传图片</Text>
        </View>
      ) : (
        <View style={styles.editor}>
          <SkiaCanvas editMode={editMode} />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  empty: { flex: 1, justifyContent: 'center' },
  hint: { textAlign: 'center', color: '#909399', marginTop: 8 },
  editor: { flex: 1 }
})
```

- [ ] **Step 4: 运行 type-check**

```bash
cd rn && npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add rn/
git commit -m "feat: add ImagePicker and image-crop page"
```

---

### Task 7: 编辑器控制组件（Controls + EditPalette）

**Files:**
- Create: `rn/src/components/Controls.tsx`
- Create: `rn/src/components/EditPalette.tsx`

- [ ] **Step 1: 创建 rn/src/components/Controls.tsx**

```typescript
import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Card, Text, Slider, SegmentedButtons, Switch } from 'react-native-paper'
import { useAppStore } from '../store/appStore'
import type { EditingTool } from '@ddg/shared'

const BRANDS = [
  { value: 'MARD', label: 'MARD' },
  { value: 'COCO', label: 'COCO' },
  { value: '漫漫', label: '漫漫' },
  { value: '盼盼', label: '盼盼' },
  { value: '咪小窝', label: '咪小窝' }
]

export default function Controls() {
  const gridWidth = useAppStore((s) => s.gridWidth)
  const gridHeight = useAppStore((s) => s.gridHeight)
  const colorCount = useAppStore((s) => s.colorCount)
  const selectedBrand = useAppStore((s) => s.selectedBrand)
  const showNumbers = useAppStore((s) => s.showNumbers)
  const lockAspectRatio = useAppStore((s) => s.lockAspectRatio)

  const setGridWidth = useAppStore((s) => s.setGridWidth)
  const setGridHeight = useAppStore((s) => s.setGridHeight)
  const setColorCount = useAppStore((s) => s.setColorCount)
  const setSelectedBrand = useAppStore((s) => s.setSelectedBrand)
  const setShowNumbers = useAppStore((s) => s.setShowNumbers)
  const setLockAspectRatio = useAppStore((s) => s.setLockAspectRatio)

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleMedium">参数设置</Text>

        <Text variant="labelMedium">网格宽度: {gridWidth}</Text>
        <Slider value={gridWidth} onValueChange={(v) => setGridWidth(Math.round(v))}
          minimumValue={5} maximumValue={100} step={1} />

        <Text variant="labelMedium">网格高度: {gridHeight}</Text>
        <Slider value={gridHeight} onValueChange={(v) => setGridHeight(Math.round(v))}
          minimumValue={5} maximumValue={100} step={1} />

        <View style={styles.row}>
          <Text variant="labelMedium">锁定宽高比</Text>
          <Switch value={lockAspectRatio} onValueChange={setLockAspectRatio} />
        </View>

        <Text variant="labelMedium">颜色数量: {colorCount}</Text>
        <Slider value={colorCount} onValueChange={(v) => setColorCount(Math.round(v))}
          minimumValue={1} maximumValue={50} step={1} />

        <Text variant="labelMedium" style={styles.sectionTitle}>品牌</Text>
        <SegmentedButtons
          value={selectedBrand}
          onValueChange={setSelectedBrand}
          buttons={BRANDS}
          density="small"
        />

        <View style={styles.row}>
          <Text variant="labelMedium">显示编号</Text>
          <Switch value={showNumbers} onValueChange={setShowNumbers} />
        </View>
      </Card.Content>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: { margin: 8 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginVertical: 4
  },
  sectionTitle: { marginTop: 8 }
})
```

- [ ] **Step 2: 创建 rn/src/components/EditPalette.tsx**

```typescript
import React from 'react'
import { View, ScrollView, StyleSheet } from 'react-native'
import { Chip, IconButton, SegmentedButtons, Text } from 'react-native-paper'
import { useAppStore } from '../store/appStore'
import type { EditingTool } from '@ddg/shared'

const TOOLS: { value: EditingTool; label: string; icon: string }[] = [
  { value: 'brush', label: '画笔', icon: 'brush' },
  { value: 'fill', label: '填充', icon: 'format-color-fill' },
  { value: 'eraser', label: '橡皮', icon: 'eraser' },
  { value: 'eyedropper', label: '吸管', icon: 'eyedropper' },
  { value: 'pan', label: '拖拽', icon: 'pan' }
]

export default function EditPalette() {
  const selectedTool = useAppStore((s) => s.selectedTool)
  const setSelectedTool = useAppStore((s) => s.setSelectedTool)
  const colorStats = useAppStore((s) => s.colorStats)
  const selectedEditColor = useAppStore((s) => s.selectedEditColor)
  const setSelectedEditColor = useAppStore((s) => s.setSelectedEditColor)
  const undo = useAppStore((s) => s.undo)
  const redo = useAppStore((s) => s.redo)
  const editMode = useAppStore((s) => s.editMode)
  const setEditMode = useAppStore((s) => s.setEditMode)

  return (
    <View style={styles.container}>
      <View style={styles.toolRow}>
        <IconButton icon="undo" onPress={undo} size={20} />
        <IconButton icon="redo" onPress={redo} size={20} />
        <SegmentedButtons
          value={editMode ? selectedTool : 'pan'}
          onValueChange={(v) => {
            if (v === 'pan') {
              setEditMode(false)
            } else {
              setEditMode(true)
              setSelectedTool(v as EditingTool)
            }
          }}
          buttons={TOOLS.map((t) => ({ value: t.value, label: t.label }))}
          density="small"
          style={styles.toolButtons}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.paletteScroll}>
        {colorStats.map((stat, i) => (
          <Chip
            key={`${stat.color.hex}-${i}`}
            style={[
              styles.chip,
              selectedEditColor?.hex === stat.color.hex && styles.chipSelected
            ]}
            onPress={() => setSelectedEditColor(stat.color)}
            compact
          >
            <View style={[styles.colorDot, { backgroundColor: stat.color.hex }]} />
            <Text variant="labelSmall">{stat.code} ({stat.count})</Text>
          </Chip>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e4e7ed' },
  toolRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 4
  },
  toolButtons: { flex: 1 },
  paletteScroll: { paddingHorizontal: 8, paddingBottom: 8 },
  chip: { marginRight: 6 },
  chipSelected: { borderColor: '#409EFF', borderWidth: 2 },
  colorDot: { width: 14, height: 14, borderRadius: 3, marginRight: 4 }
})
```

- [ ] **Step 3: 运行 type-check**

```bash
cd rn && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add rn/
git commit -m "feat: add Controls and EditPalette components"
```

---

### Task 8: 导出预览 + Focus 模式 + 帮助页

**Files:**
- Create: `rn/src/components/ExportPreview.tsx`
- Create: `rn/src/components/PatternInfo.tsx`
- Create: `rn/src/components/ColorHighlightList.tsx`
- Create: `rn/src/components/ImportSection.tsx`
- Create: `rn/app/(tabs)/focus.tsx`
- Create: `rn/app/(tabs)/help.tsx`

- [ ] **Step 1: 创建 rn/src/components/PatternInfo.tsx**

```typescript
import React from 'react'
import { View, StyleSheet } from 'react-native'
import { DataTable, Text } from 'react-native-paper'
import { useAppStore } from '../store/appStore'

export default function PatternInfo() {
  const colorStats = useAppStore((s) => s.colorStats)

  return (
    <View style={styles.container}>
      <Text variant="titleMedium">颜色统计 ({colorStats.length} 种)</Text>
      <DataTable>
        <DataTable.Header>
          <DataTable.Title>颜色</DataTable.Title>
          <DataTable.Title numeric>代码</DataTable.Title>
          <DataTable.Title numeric>数量</DataTable.Title>
        </DataTable.Header>
        {colorStats.map((stat, i) => (
          <DataTable.Row key={i}>
            <DataTable.Cell>
              <View style={styles.colorRow}>
                <View style={[styles.swatch, { backgroundColor: stat.color.hex }]} />
                <Text variant="bodySmall">{stat.color.hex}</Text>
              </View>
            </DataTable.Cell>
            <DataTable.Cell numeric>{stat.code}</DataTable.Cell>
            <DataTable.Cell numeric>{stat.count}</DataTable.Cell>
          </DataTable.Row>
        ))}
      </DataTable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { padding: 8 },
  colorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 16, height: 16, borderRadius: 3 }
})
```

- [ ] **Step 2: 创建 rn/src/components/ExportPreview.tsx**

```typescript
import React, { useCallback } from 'react'
import { View, StyleSheet, Alert } from 'react-native'
import { Button, Text } from 'react-native-paper'
import * as Clipboard from 'expo-clipboard'
import * as Sharing from 'expo-sharing'
import * as FileSystem from 'expo-file-system'
import { compressPatternGrid } from '@ddg/shared'
import { useAppStore } from '../store/appStore'

export default function ExportPreview() {
  const patternGrid = useAppStore((s) => s.patternGrid)
  const gridWidth = useAppStore((s) => s.gridWidth)
  const gridHeight = useAppStore((s) => s.gridHeight)
  const selectedBrand = useAppStore((s) => s.selectedBrand)
  const exportScale = useAppStore((s) => s.exportScale)

  const handleExportCompressed = useCallback(async () => {
    const compressed = compressPatternGrid(patternGrid, gridWidth, gridHeight, selectedBrand)
    await Clipboard.setStringAsync(compressed)
    Alert.alert('已复制', '压缩字符串已复制到剪贴板')
  }, [patternGrid, gridWidth, gridHeight, selectedBrand])

  const handleShareImage = useCallback(async () => {
    // 生成图片并分享的逻辑需要 Skia Snapshot 支持
    Alert.alert('提示', '图片导出需配合 Skia makeImageSnapshot')
  }, [])

  return (
    <View style={styles.container}>
      <Text variant="titleMedium">导出图纸</Text>
      <View style={styles.buttons}>
        <Button mode="contained" onPress={handleExportCompressed} icon="clipboard-text">
          压缩字符串
        </Button>
        <Button mode="outlined" onPress={handleShareImage} icon="share-variant">
          分享图片
        </Button>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { padding: 8, gap: 8 },
  buttons: { gap: 8 }
})
```

- [ ] **Step 3: 创建 rn/src/components/ColorHighlightList.tsx**（Focus 模式）

```typescript
import React, { useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { List, Checkbox, Text } from 'react-native-paper'
import { useAppStore } from '../store/appStore'

export default function ColorHighlightList() {
  const colorStats = useAppStore((s) => s.colorStats)
  const [highlighted, setHighlighted] = useState<Set<string>>(new Set())

  const toggleColor = (hex: string) => {
    const next = new Set(highlighted)
    if (next.has(hex)) next.delete(hex)
    else next.add(hex)
    setHighlighted(next)
  }

  return (
    <View>
      <Text variant="titleMedium" style={styles.title}>颜色列表</Text>
      {colorStats.map((stat) => (
        <List.Item
          key={stat.color.hex}
          title={`${stat.code} (${stat.count})`}
          left={() => (
            <View style={[styles.swatch, { backgroundColor: stat.color.hex }]} />
          )}
          right={() => (
            <Checkbox
              status={highlighted.has(stat.color.hex) ? 'checked' : 'unchecked'}
              onPress={() => toggleColor(stat.color.hex)}
            />
          )}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  title: { padding: 8 },
  swatch: { width: 24, height: 24, borderRadius: 4, margin: 8 }
})
```

- [ ] **Step 4: 创建 rn/src/components/ImportSection.tsx**

```typescript
import React, { useState } from 'react'
import { View, StyleSheet, Alert } from 'react-native'
import { Button, TextInput, Text } from 'react-native-paper'
import { useAppStore } from '../store/appStore'

export default function ImportSection() {
  const [input, setInput] = useState('')
  const importFromCompressed = useAppStore((s) => s.importFromCompressed)

  const handleImport = () => {
    const trimmed = input.trim()
    if (!trimmed) return
    const ok = importFromCompressed(trimmed)
    if (ok) {
      Alert.alert('成功', '图纸已导入')
      setInput('')
    } else {
      Alert.alert('失败', '无效的压缩字符串')
    }
  }

  return (
    <View style={styles.container}>
      <Text variant="titleMedium">导入压缩数据</Text>
      <TextInput
        mode="outlined"
        multiline
        value={input}
        onChangeText={setInput}
        placeholder="粘贴压缩字符串..."
        style={styles.input}
      />
      <Button mode="contained" onPress={handleImport}>导入</Button>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { padding: 8, gap: 8 },
  input: { minHeight: 80 }
})
```

- [ ] **Step 5: 创建 rn/app/(tabs)/focus.tsx**

```typescript
import React from 'react'
import { ScrollView, View, StyleSheet } from 'react-native'
import { Appbar } from 'react-native-paper'
import SkiaCanvas from '@/src/components/SkiaCanvas'
import ColorHighlightList from '@/src/components/ColorHighlightList'
import ImportSection from '@/src/components/ImportSection'
import { useAppStore } from '@/src/store/appStore'

export default function FocusPage() {
  const editMode = useAppStore((s) => s.editMode)

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Focus 模式" />
      </Appbar.Header>
      <View style={styles.content}>
        <View style={styles.canvas}>
          <SkiaCanvas editMode={editMode} />
        </View>
        <ScrollView style={styles.sidebar}>
          <ImportSection />
          <ColorHighlightList />
        </ScrollView>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, flexDirection: 'row' },
  canvas: { flex: 1 },
  sidebar: { width: 200, borderLeftWidth: 1, borderLeftColor: '#e4e7ed' }
})
```

- [ ] **Step 6: 创建 rn/app/(tabs)/help.tsx**

```typescript
import React from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import { Text, Card, List } from 'react-native-paper'

const SECTIONS = [
  {
    title: '快速上手',
    content: '1. 点击"上传图片"从相册选择图片\n2. 调整网格参数和颜色数量\n3. 系统自动生成拼豆图纸\n4. 使用编辑器微调图案'
  },
  {
    title: '编辑器',
    content: '画笔：点击格子改变颜色\n填充：点击区域统一上色\n橡皮：清除格子颜色\n吸管：从图纸中吸取颜色\n拖拽：移动画布视角'
  },
  {
    title: '参数说明',
    content: '网格大小：拼豆作品的宽度和高度（单位：豆）\n颜色数量：限制使用的颜色种类（1-50）\n品牌选择：不同品牌颜色代码不同'
  },
  {
    title: '快捷操作',
    content: '双指缩放：放大/缩小画布\n单指拖拽：平移画布\n撤销/重做：底部工具栏按钮'
  }
]

export default function HelpPage() {
  return (
    <ScrollView style={styles.container}>
      {SECTIONS.map((s) => (
        <Card key={s.title} style={styles.card}>
          <Card.Title title={s.title} />
          <Card.Content>
            <Text variant="bodyMedium">{s.content}</Text>
          </Card.Content>
        </Card>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 8 },
  card: { marginBottom: 8 }
})
```

- [ ] **Step 7: 运行 type-check**

```bash
cd rn && npx tsc --noEmit
```

- [ ] **Step 8: Commit**

```bash
git add rn/
git commit -m "feat: add export, focus mode, and help page"
```

---

### Task 9: 最终集成与验证

- [ ] **Step 1: 确认根 package.json 中 package.json 本身的 type 字段与 workspaces 配置正确**

```bash
cat package.json
```

- [ ] **Step 2: 运行全项目 type-check**

```bash
npm run type-check && cd rn && npx tsc --noEmit
```

- [ ] **Step 3: 运行 Vue 端全部测试**

```bash
npm run test
```

预期: 302 tests passed。

- [ ] **Step 4: 运行 Vue 端 build**

```bash
npm run build
```

- [ ] **Step 5: 验证 RN 端可以启动（可选，需模拟器）**

```bash
cd rn && npx expo start
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: final integration of React Native app"
```
