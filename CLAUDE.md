# CLAUDE.md

## Language

- 尽量在对话和记录中使用中文
- CLAUDE.md中已有的英文不需要修改成中文

## Verification

- 每次代码改动后，在报告完成前必须运行 `npm run type-check && npm run test`。两项都通过才能声称任务完成。
- 修改 vite.config.ts、imports 或依赖后，额外运行 `npm run build` 检查 Vite 构建是否正常。

## Git Workflow

- 每个已完成并验证通过的任务或 bug 修复，在进入下一个任务前进行 commit。
- Commit message 使用 conventional commit 前缀 (feat, fix, refactor, test, docs, chore)。

## Communication

- 如果要做出超出明确请求范围的改动，先询问：'我也可以顺便重构 X 来保持一致——需要我包含这个吗？'

## Vue Conventions

- 编辑 Vue SFC 文件时，优先使用 `<style scoped>`。
- 避免对动态内容使用 `v-html`。如果确实需要 `v-html`，立即在浏览器中测试渲染效果。

## Project Overview

拼豆图纸生成器 (Perler Bead Pattern Generator) -- a browser-based tool for generating
perler/fuse bead patterns from uploaded images. It maps image colors to 292 real-world
perler bead colors, quantizes them, and renders a numbered grid pattern with multi-brand
color code support. Includes an interactive editor with brush, fill, eraser, and
eyedropper tools.

- **Repository**: [https://github.com/DerilJust/DDG](https://github.com/DerilJust/DDG)
- **License**: MIT

## Tech Stack

- **Framework**: Vue 3 (Composition API / `<script setup>`)
- **Language**: TypeScript (strict mode via `vue-tsc`)
- **Build Tool**: Vite 8
- **State Management**: Pinia 3
- **UI Library**: Element Plus 2.8
- **Router**: vue-router 4 (hash history)
- **Rendering**: Canvas 2D API (no third-party canvas lib)
- **Icons**: @element-plus/icons-vue
- **Testing**: Vitest 4 + @vue/test-utils + happy-dom

## Directory Structure

```
LICENSE                            # MIT License
public/
  logo.png                         # Site icon / favicon
  favicon.svg                      # SVG favicon fallback
  icons.svg                        # Icon sprite sheet
src/
  main.ts                          # App entry -- creates Pinia + ElementPlus + Router + mounts
  App.vue                          # Root layout: header with responsive nav (tabs or drawer)
  style.css                        # Global CSS variables, responsive breakpoints, scrollbar, font-face
  vite-env.d.ts                    # Vite client type declarations
  router/
    index.ts                       # Vue Router 4 config (hash history, 4 lazy-loaded routes)
  pages/
    HomePage.vue                   # Landing page with hero section and feature cards
    EditorPage.vue                 # Full editor (sidebar + tabs + footer)
    FocusBeadPage.vue              # Focus mode (import + color highlight + collapsible sidebar)
    HelpPage.vue                   # Help/documentation page (quick start, editor, params, shortcuts)
  types/
    index.ts                       # All TypeScript interfaces (AppStoreState, CropperImageData, etc.)
  store/
    appStore.ts                    # Single Pinia store -- ALL application state + actions
  composables/
    useAspectRatioLock.ts          # Composable: watches gridWidth/gridHeight, cross-updates
                                   # when lockAspectRatio is on, using image's aspect ratio
    useBreakpoint.ts               # Composable: responsive breakpoint detection (mobile/tablet/desktop)
                                   # Returns isMobile, isTablet, isDesktop refs
    useKeyboardShortcuts.ts       # Composable: keyboard shortcut presets and registration
  utils/
    patternUtils.ts                # Color matching (findClosestColor), quantization
                                   # (quantizeColorsUtil), palette building, GCD, grid sizing
    patternRenderer.ts             # Canvas renderer -- draws pattern grid with labels, grid
                                   # lines, axis labels, preview overlays
    editUtils.ts                   # Grid cloning (clonePatternGrid) and flood-fill
                                   # (fillConnectedRegion via stack-based BFS)
    selectionUtils.ts              # Selection geometry -- normalize, clamp, getPendingCells
    compressionUtils.ts            # RLE string compression/decompression for pattern grid export
    shortcutStorage.ts             # LocalStorage persistence for custom shortcut configs
  components/
    UploadSection.vue              # Sidebar "图片上传" card -- opens UploadDialog
    CropperDialog.vue              # Modal dialog: image crop with handles, zoom slider,
                                   # grid/form settings, preset ratio buttons
    UploadDialog.vue               # Upload confirmation dialog
    Controls.vue                   # Sidebar "参数设置" form (grid size, color count, brand, etc.)
    CanvasViewer.vue               # Reusable Canvas viewer (render, pan, zoom)
    PatternInfo.vue                # Sidebar color usage statistics table
    PreviewSection.vue             # Tab: perler pattern canvas viewer (with edge extension)
    ExportPreview.vue              # Tab: export-ready preview + download + compressed string export
    EditPalette.vue                # Footer: color palette editor, tool selector, undo/redo
    PatternViewer.vue              # Focus mode pattern viewer (with highlight)
    ColorHighlightList.vue         # Focus mode color highlight list
    ImportSection.vue              # Focus mode compressed data import
  colorMap/
    colorSystemMapping.json        # 292 HEX keys -> { MARD, COCO, 漫漫, 盼盼, 咪小窝 } brand codes
    colorMap.json                  # Standalone color mapping data
  assets/
    fonts/ChillBitmap_16px.ttf     # Pixel font for the title
tests/
  appStore.test.ts                 # Store unit tests
  compressionUtils.test.ts         # RLE compression/decompression tests
  Controls.test.ts                 # Controls component tests
  EditPalette.test.ts              # Edit palette component tests
  editUtils.test.ts                # Edit utility tests
  PatternInfo.test.ts              # Pattern info component tests
  patternRenderer.test.ts          # Renderer tests
  patternUtils.test.ts             # Color matching / quantization tests
  selectionUtils.test.ts           # Selection geometry tests
```

## Architecture / Data Flow

### State Management (Single Store)

`useAppStore` (Pinia) is the sole source of truth. All components read/write via
`storeToRefs()` for reactive binding. Key state fields:

| Field                                                      | Type                      | Purpose                                                                                                      |
| ---------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `originalImage` / `originalImageUrl` / `originalImageSize` | File / string / ImageSize | The user's uploaded & cropped image                                                                          |
| `gridWidth` / `gridHeight`                                 | number (default 30)       | Target pattern grid dimensions                                                                               |
| `colorCount`                                               | number (1-50)             | Number of colors to quantize to                                                                              |
| `selectedBrand`                                            | string                    | Brand code system (MARD/COCO/漫漫/盼盼/咪小窝)                                                               |
| `showNumbers`                                              | boolean                   | Whether to show color codes in grid cells                                                                    |
| `lockAspectRatio`                                          | boolean (default true)    | If on, changing gridWidth auto-updates gridHeight (and vice versa) to match the image's natural aspect ratio |
| `perlerColors`                                             | PerlerColor[]             | Loaded from colorSystemMapping.json (292 entries)                                                            |
| `patternGrid`                                              | PatternCell[][]           | The generated perler pattern -- 2D array of {color, code}                                                    |
| `colorStats`                                               | ColorStat[]               | Computed usage stats from patternGrid                                                                        |
| `editMode` / `selectedTool` / `selectedEditColor`          | various                   | Editor state                                                                                                 |
| `undoStack` / `redoStack`                                  | PatternCell[][][]         | History stacks (max 50)                                                                                      |

### Routing

Vue Router 4 with hash history (`createWebHashHistory`). Four routes:

| Path      | Page          | Description                                  |
| --------- | ------------- | -------------------------------------------- |
| `/`       | HomePage      | Landing page with hero, feature cards, stats |
| `/editor` | EditorPage    | Full perler bead pattern editor              |
| `/focus`  | FocusBeadPage | Focus mode (import + color highlight)        |
| `/help`   | HelpPage      | Help/documentation page                      |

### Responsive Breakpoints

`useBreakpoint()` composable provides three reactive booleans:

| Breakpoint  | Width      | Behavior                                    |
| ----------- | ---------- | ------------------------------------------- |
| `isMobile`  | <= 767px   | Drawer nav, stacked layouts, minimal chrome |
| `isTablet`  | 768–1023px | Compact tabs, reduced sidebar, mid padding  |
| `isDesktop` | >= 1024px  | Full horizontal nav, full sidebar           |

Key responsive behaviors:

- **App.vue header**: Horizontal nav-tabs on desktop/tablet; hamburger button + `el-drawer` (ttb) on mobile
- **EditorPage / FocusBeadPage**: `el-aside` sidebar on desktop/tablet (collapsible, tablet defaults collapsed); `el-drawer` (ltr) on mobile
- **HelpPage**: `el-aside` sidebar nav on desktop/tablet; sticky horizontal scrollable top-nav on mobile

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
  |-- (header: logo + title + nav-tabs or hamburger/drawer on mobile)
  |-- <router-view>
        |-- HomePage.vue
        |-- EditorPage.vue
        |     |-- UploadSection.vue
        |     |     |-- UploadDialog.vue  (uses useAspectRatioLock composable)
        |     |-- Controls.vue            (uses useAspectRatioLock composable)
        |     |-- PatternInfo.vue
        |     |-- PreviewSection.vue
        |     |-- ExportPreview.vue
        |     |-- EditPalette.vue
        |-- FocusBeadPage.vue
        |     |-- PatternViewer.vue
        |     |-- ColorHighlightList.vue
        |     |-- ImportSection.vue
        |-- HelpPage.vue
```

### Communication Pattern

- Parent-child: props + emits (e.g., UploadDialog emits `confirm(data)`)
- Shared state: Pinia store accessed via `useAppStore()` + `storeToRefs()`
- Composables: `useAspectRatioLock()` encapsulates the lock logic, used by UploadDialog and Controls; `useBreakpoint()` provides responsive breakpoints used by all pages and App.vue; `useKeyboardShortcuts()` manages shortcut presets and registration

## Build Commands

| Command           | Description                                                    |
| ----------------- | -------------------------------------------------------------- |
| `npm run dev`     | Start Vite dev server (HMR)                                    |
| `npm run build`   | Type-check (`vue-tsc -b`) then production build (`vite build`) |
| `npm run preview` | Preview production build locally                               |

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

## Update md files

- Update README.md and CLAUDE.md if needed

## Build and Test Commands

| Command                            | Description                                                    |
| ---------------------------------- | -------------------------------------------------------------- |
| `npm run dev`                      | Start Vite dev server (HMR)                                    |
| `npm run build`                    | Type-check (`vue-tsc -b`) then production build (`vite build`) |
| `npm run preview`                  | Preview production build locally                               |
| `npm run lint`                     | Run ESLint                                                     |
| `npm run format`                   | Run Prettier                                                   |
| `npm run format:check`             | Check formatting with Prettier                                 |
| `npm run type-check`               | Run TypeScript type checking                                   |
| `npm run test`                     | Run all tests (vitest run)                                     |
| `npm run test:watch`               | Run tests in watch mode                                        |
| `npm run test:coverage`            | Run tests with coverage                                        |
| `vitest run tests/path/to/test.ts` | Run a single test file                                         |

Coverage reports are generated in the `coverage` directory with an HTML line-by-line visualization.

## Code Style Guidelines

- **Formatting**: Uses Prettier, configured in package.json
- **Linting**: ESLint with eslint-config-prettier integration
- **Modules**: ES modules with import/export syntax (type: "module")
- **JavaScript Target**: ES2020 with strict null checks
- **Error Handling**: Use try/catch with explicit error messages that provide context about what failed
- **Naming**: camelCase for variables and functions, PascalCase for classes
- **Imports**: Group by source (internal/external) with proper separation
- **Documentation**: Use JSDoc for public APIs and complex functions, add comments for non-obvious code
- **Error Messages**: Use consistent, specific error messages (e.g., "Track buffer overflow" instead of "Overflow in disc building")

## Test Organization

- **Test Consolidation**: All tests for a specific component should be consolidated in a single test file.
  For example, all tests for `emulator.js` should be in `test-emulator.js` - do not create separate test files
  for different aspects of the same component.
- **Test Structure**: Use nested describe blocks to organize tests by component features
- **Test Isolation**: When mocking components in tests, use `vi.spyOn()` with `vi.restoreAllMocks()` in
  `afterEach` hooks rather than global `vi.mock()` to prevent memory leaks and test pollution
- **Memory Management**: Avoid global mocks that can leak between tests and accumulate memory usage over time
- **Test philosophy**
  - Mock as little as possible: Try and rephrase code not to require it.
  - Try not to rely on internal state: don't manipulate objects' inner state in tests
  - Use idiomatic vitest assertions (expect/toBe/toEqual) instead of node assert

## Project-Specific Knowledge

- **Commit after verification**: 每个已完成并验证通过（type-check + test 通过）的任务，在进入下一个任务前进行 commit。使用 conventional commit 前缀。

### Code Architecture

- **General Principles**:
  - Follow the existing code style and structure
  - Use `const` and `let` instead of `var`
  - Avoid global variables; use module scope
  - Use arrow functions for callbacks
  - Prefer template literals over string concatenation
  - Use destructuring for objects and arrays when appropriate
  - Use async/await for asynchronous code instead of callbacks or promises
  - Minimise special case handling - prefer explicit over implicit behaviour
  - Consider adding tests first before implementing features
- **When simplifying existing code**
  - Prefer helper functions for repetitive operations (like the `appendParam` function)
  - Remove unnecessary type checking where types are expected to be correct
  - Replace complex conditionals with more readable alternatives when possible
  - Ensure simplifications don't break existing behavior or assumptions
  - Try and modernise the code to use ES6+ features where possible

- **Constants and Magic Numbers**:
  - Local un-exported properties should be used for shared constants
  - Local constants should be used for temporary values
  - Always use named constants instead of magic numbers in code
  - Use PascalCase for module-level constants (e.g., `const MaxHfeTrackPulses = 3132;`)
  - Prefer module-level constants over function-local constants for shared values
  - Define constants at the beginning of functions or at the class/module level as appropriate
  - Add comments explaining what the constant represents, especially for non-obvious values

- **Pre-commit Hooks**:
  - The project uses lint-staged with ESLint
  - Watch for unused variables and ensure proper error handling
  - YOU MUST NEVER bypass git commit hooks on checkins. This leads to failures in CI later on

### Git Workflow (detail)

- 创建分支时使用 `claude/` 前缀 (e.g., `claude/fix-esm-import-error`)
- 每个任务完成后执行 `git add -A && git commit -m 'feat: <description>'`
- 绝不跳过 git hooks (--no-verify), 这会导致 CI 失败
