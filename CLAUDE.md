# CLAUDE.md

## Project Overview

拼豆图纸生成器 (Perler Bead Pattern Generator) -- a browser-based tool for generating
perler/fuse bead patterns from uploaded images. It maps image colors to 292 real-world
perler bead colors, quantizes them, and renders a numbered grid pattern with multi-brand
color code support. Includes an interactive editor with brush, fill, eraser, and
eyedropper tools.

## Tech Stack

- **Framework**: Vue 3 (Composition API / `<script setup>`)
- **Language**: TypeScript (strict mode via `vue-tsc`)
- **Build Tool**: Vite 6
- **State Management**: Pinia 3
- **UI Library**: Element Plus 2.8
- **Router**: vue-router 4 (hash history)
- **Rendering**: Canvas 2D API (no third-party canvas lib)
- **Icons**: @element-plus/icons-vue

## Directory Structure

```
src/
  main.ts                          # App entry -- creates Pinia + ElementPlus + Router + mounts
  App.vue                          # Root layout: header with nav tabs, <router-view>
  style.css                        # Global CSS variables, scrollbar, font-face
  router/
    index.ts                       # Vue Router 4 config (hash history, 3 lazy-loaded routes)
  pages/
    HomePage.vue                   # Landing page with hero section and feature cards
    EditorPage.vue                 # Full editor (sidebar + tabs + footer) -- migrated from App.vue
    FocusBeadPage.vue              # Placeholder "coming soon" page
  types/
    index.ts                       # All TypeScript interfaces (AppStoreState, CropperImageData, etc.)
  store/
    appStore.ts                    # Single Pinia store -- ALL application state + actions
  composables/
    useAspectRatioLock.ts          # Composable: watches gridWidth/gridHeight, cross-updates
                                   # when lockAspectRatio is on, using image's aspect ratio
  utils/
    patternUtils.ts                # Color matching (findClosestColor), quantization
                                   # (quantizeColorsUtil), palette building, GCD, grid sizing
    patternRenderer.ts             # Canvas renderer -- draws pattern grid with labels, grid
                                   # lines, axis labels, preview overlays
    editUtils.ts                   # Grid cloning (clonePatternGrid) and flood-fill
                                   # (fillConnectedRegion via stack-based BFS)
    selectionUtils.ts              # Selection geometry -- normalize, clamp, getPendingCells
    compressionUtils.ts            # RLE string compression/decompression for pattern grid export
  components/
    UploadSection.vue              # Sidebar "图片上传" card -- opens UploadDialog
    UploadDialog.vue               # Modal dialog: image upload, crop canvas with handles,
                                   # zoom slider, grid/form settings, preset ratio buttons
    Controls.vue                   # Sidebar "参数设置" form (grid size, color count, brand, etc.)
    PatternInfo.vue                # Sidebar color usage statistics table
    SourceImageCard.vue            # Tab: original image preview
    PreviewSection.vue             # Tab: perler pattern canvas viewer (with pan/zoom)
    ExportPreview.vue              # Tab: export-ready preview + download + compressed string export
    EditPalette.vue                # Footer: color palette editor, tool selector, undo/redo
  colorMap/
    colorSystemMapping.json        # 292 HEX keys -> { MARD, COCO, 漫漫, 盼盼, 咪小窝 } brand codes
  assets/
    fonts/ChillBitmap_16px.ttf     # Pixel font for the title
```

## Architecture / Data Flow

### State Management (Single Store)

`useAppStore` (Pinia) is the sole source of truth. All components read/write via
`storeToRefs()` for reactive binding. Key state fields:

| Field | Type | Purpose |
|---|---|---|
| `originalImage` / `originalImageUrl` / `originalImageSize` | File / string / ImageSize | The user's uploaded & cropped image |
| `gridWidth` / `gridHeight` | number (default 30) | Target pattern grid dimensions |
| `colorCount` | number (1-50) | Number of colors to quantize to |
| `selectedBrand` | string | Brand code system (MARD/COCO/漫漫/盼盼/咪小窝) |
| `showNumbers` | boolean | Whether to show color codes in grid cells |
| `lockAspectRatio` | boolean (default true) | If on, changing gridWidth auto-updates gridHeight (and vice versa) to match the image's natural aspect ratio |
| `perlerColors` | PerlerColor[] | Loaded from colorSystemMapping.json (292 entries) |
| `patternGrid` | PatternCell[][] | The generated perler pattern -- 2D array of {color, code} |
| `colorStats` | ColorStat[] | Computed usage stats from patternGrid |
| `editMode` / `selectedTool` / `selectedEditColor` | various | Editor state |
| `undoStack` / `redoStack` | PatternCell[][][] | History stacks (max 50) |

### Routing

Vue Router 4 with hash history (`createWebHashHistory`). Three routes:

| Path | Page | Description |
|---|---|---|
| `/` | HomePage | Landing page with hero, feature cards, stats |
| `/editor` | EditorPage | Full perler bead pattern editor |
| `/focus` | FocusBeadPage | Placeholder ("coming soon") |

### Image Processing Pipeline

1. User uploads image via `el-upload` in `UploadDialog`
2. `FileReader` loads image, sets `localImageData` ref with display dimensions
3. Canvas renders the image with zoom level applied
4. User adjusts crop rect (drag, resize, or preset buttons)
5. On confirm, `cropCanvasImage()` extracts the cropped region to a new `HTMLImageElement` + `File` + data URL
6. Store receives the cropped image via `setOriginalImage()`, `setOriginalImageUrl()`, `setOriginalImageSize()`
7. `generatePattern()` action: draws cropped image onto a `gridWidth x gridHeight` canvas, reads pixel data, quantizes using `findClosestColor()`, builds `patternGrid`
8. `patternGrid` is rendered to the preview canvas via `drawPatternToCanvas()`

### Aspect Ratio Lock Flow

The composable `useAspectRatioLock` in UploadDialog:
- Watches `gridWidth` changes: when lock is on, updates `gridHeight = round(gridWidth / effectiveAspectRatio)`
- Watches `gridHeight` changes: when lock is on, updates `gridWidth = round(gridHeight * effectiveAspectRatio)`
- `effectiveAspectRatio` is computed from `localImageNaturalSize` (dialog's image) or `originalImageSize` (store's image), falling back to 1
- Uses a `ratioLocking` guard ref to prevent recursive watcher calls
- Returns `imageRatio` as a computed string like "4:3" (simplified via GCD)

### Pattern Compression Format

`compressionUtils.ts` provides RLE (run-length encoding) for pattern grid export:

- **Format**: `WxH|count:code,count:code,...`
- Cells are scanned left-to-right, top-to-bottom; consecutive same-code cells are merged into `count:code` runs
- Blank/white cells use `_` as the code
- `compressPatternGrid()` serializes; `decompressPatternGrid()` reconstructs

### Component Dependency Tree

```
App.vue
  |-- (header with nav tabs: Home, Editor, Focus)
  |-- <router-view>
        |-- HomePage.vue
        |-- EditorPage.vue
        |     |-- UploadSection.vue
        |     |     |-- UploadDialog.vue  (uses useAspectRatioLock composable)
        |     |-- Controls.vue            (uses useAspectRatioLock composable)
        |     |-- PatternInfo.vue
        |     |-- SourceImageCard.vue
        |     |-- PreviewSection.vue
        |     |-- ExportPreview.vue
        |     |-- EditPalette.vue
        |-- FocusBeadPage.vue
```

### Communication Pattern

- Parent-child: props + emits (e.g., UploadDialog emits `confirm(data)`)
- Shared state: Pinia store accessed via `useAppStore()` + `storeToRefs()`
- Composables: `useAspectRatioLock()` encapsulates the lock logic, used by UploadDialog and Controls

## Build Commands

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server (HMR) |
| `npm run build` | Type-check (`vue-tsc -b`) then production build (`vite build`) |
| `npm run preview` | Preview production build locally |

## Key Conventions

- All components use `<script setup lang="ts">` with Composition API
- TypeScript interfaces live in `src/types/index.ts`
- Store actions mutate state directly (Pinia allows this; no Vuex-style mutations)
- Canvas operations use raw Canvas 2D API -- no image processing libraries
- CSS is scoped per component with `<style scoped>`
- Element Plus components are globally registered via `app.use(ElementPlus)` in `main.ts`
- Color matching uses Euclidean distance in RGB space (`findClosestColor`)
- Flood fill uses stack-based iterative BFS (not recursive, safe for large grids)
- History stack is capped at 50 entries
