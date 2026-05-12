# 拼豆图纸生成器

> 本项目在开发过程中使用 [Claude Code](https://github.com/anthropics/claude-code) 编程。

一个功能强大的拼豆图纸生成工具，支持上传图片自动生成拼豆图纸，包含颜色编号、数量统计和在线编辑功能。

## 功能特点

- 图片上传：支持上传各种格式的图片，内置裁剪工具和预设比例
- 颜色匹配：自动将图片颜色匹配到标准拼豆颜色（292 色）
- 参数调整：可调节网格大小、颜色数量，支持锁定宽高比
- 品牌选择：支持 MARD / COCO / 漫漫 / 盼盼 / 咪小窝 五种拼豆品牌色号
- 在线编辑：画笔、填充、橡皮、吸管、手形拖拽工具，支持撤销/重做
- 自定义快捷键：支持类 PS 等多种快捷键预设，可自定义配置
- 数量统计：自动统计每种颜色的使用数量
- 编号显示：在格子内显示颜色编号，方便对照制作
- 导出下载：导出带统计信息的完整图纸 PNG，支持 RLE 压缩字符串导入/导出
- 视图操作：图纸预览支持缩放、平移，方便查看细节
- 专注模式：高亮特定颜色，仅显示对应编号，导入压缩数据即可开始串珠
- 边缘扩展：编辑模式下拖拽四边手柄即可扩展图纸
- 多页面路由：首页、编辑器、专注串珠页面、帮助页面
- 响应式设计：适配桌面端、平板端和移动端，移动端使用抽屉式导航
- 可收起侧边栏：编辑器和专注页面均支持收起侧边栏，移动端自动切换为抽屉
- CI/CD：GitHub Actions 自动检查代码质量、测试、构建并部署

## 技术栈

- Vue 3 + TypeScript
- Vite
- Pinia (状态管理)
- Element Plus (UI 组件库)
- Canvas API (图纸渲染与编辑)

## 安装步骤

1. **克隆项目**

   ```bash
   git clone https://github.com/DerilJust/DDG.git
   cd DDG
   ```

2. **安装依赖**

   ```bash
   npm install
   ```

3. **启动开发服务器**

   ```bash
   npm run dev
   ```

4. **构建生产版本**

   ```bash
   npm run build
   ```

## 开发命令

| 命令                   | 说明                       |
| ---------------------- | -------------------------- |
| `npm run dev`          | 启动开发服务器             |
| `npm run build`        | 类型检查 + 生产构建        |
| `npm run type-check`   | 仅运行 TypeScript 类型检查 |
| `npm run lint`         | 运行 ESLint 代码检查       |
| `npm run format`       | 使用 Prettier 格式化代码   |
| `npm run format:check` | 检查代码格式是否符合规范   |
| `npm run preview`      | 预览生产构建结果           |

## 使用方法

1. **上传图片**：点击「选择图片」选取文件，再点击「上传并裁剪」调整图片区域
2. **调整参数**：
   - 网格宽度/高度：控制图纸尺寸
   - 颜色数量：控制使用的颜色种类（1-50）
   - 拼豆品牌：选择对应的品牌色号体系
   - 显示编号：切换格子内是否显示颜色编号
   - 锁定比例：保持网格宽高比与图片一致
3. **生成图纸**：点击「生成图纸」按钮
4. **编辑图纸**（可选）：切换到「拼豆图纸」标签页，使用画笔/填充/橡皮/吸管工具在线编辑
5. **查看统计**：左侧面板自动展示每种颜色的使用数量
6. **导出下载**：切换到「导出预览」标签页，下载带统计信息的完整图纸

## 项目结构

```
├── .github/
│   ├── workflows/
│   │   └── ci.yml                 # GitHub Actions CI/CD（lint + test + build + deploy）
│   └── dependabot.yml
├── public/
│   ├── logo.png                   # 网站图标
│   ├── favicon.svg                # SVG 备用图标
│   └── icons.svg                  # 图标精灵
├── src/
│   ├── components/
│   │   ├── UploadSection.vue      # 图片上传入口
│   │   ├── CropperDialog.vue      # 图片裁剪弹窗（含预设比例、缩放滑块）
│   │   ├── UploadDialog.vue       # 上传确认弹窗
│   │   ├── Controls.vue           # 参数设置（网格、颜色数、品牌）
│   │   ├── CanvasViewer.vue       # 通用 Canvas 查看器（渲染、缩放平移）
│   │   ├── PreviewSection.vue     # 拼豆图纸预览（含边缘扩展）
│   │   ├── EditPalette.vue        # 底部编辑面板（画笔/填充/橡皮/吸管/手型）
│   │   ├── PatternInfo.vue        # 侧边栏颜色数量统计
│   │   ├── ExportPreview.vue      # 导出预览 + 下载 PNG + 压缩字符串复制
│   │   ├── PatternViewer.vue      # 专注模式图纸查看器（支持高亮）
│   │   ├── ColorHighlightList.vue # 专注模式颜色高亮列表
│   │   └── ImportSection.vue      # 专注模式压缩数据导入
│   ├── composables/
│   │   ├── useAspectRatioLock.ts  # 宽高比锁定逻辑
│   │   ├── useBreakpoint.ts       # 响应式断点检测（mobile / tablet / desktop）
│   │   └── useKeyboardShortcuts.ts # 键盘快捷键预设与注册
│   ├── pages/
│   │   ├── HomePage.vue           # 首页（Hero + 功能卡片 + 统计数字）
│   │   ├── EditorPage.vue         # 编辑器主页面（侧边栏 + 图纸标签页 + 底部编辑栏）
│   │   ├── FocusBeadPage.vue      # 专注串珠页面（导入 + 颜色高亮 + 可收起侧栏）
│   │   └── HelpPage.vue           # 帮助文档页面（快速开始、编辑器、参数、快捷键）
│   ├── router/
│   │   └── index.ts               # Vue Router（Hash 模式，4 条路由全部懒加载）
│   ├── store/
│   │   └── appStore.ts            # Pinia 状态管理（核心业务逻辑）
│   ├── utils/
│   │   ├── patternUtils.ts        # 颜色匹配、量化、统计算法
│   │   ├── patternRenderer.ts     # Canvas 图纸渲染引擎
│   │   ├── editUtils.ts           # 编辑工具（泛洪填充、克隆等）
│   │   ├── selectionUtils.ts      # 选区坐标计算
│   │   ├── compressionUtils.ts    # RLE 压缩 / 解压（图纸导出）
│   │   └── shortcutStorage.ts     # 快捷键配置本地存储
│   ├── types/
│   │   └── index.ts               # TypeScript 类型定义
│   ├── colorMap/
│   │   ├── colorSystemMapping.json # 292 色 → 5 品牌色号映射
│   │   └── colorMap.json           # 颜色映射备份
│   ├── assets/
│   │   └── fonts/
│   │       └── ChillBitmap_16px.ttf # 像素字体
│   ├── App.vue                    # 根组件（Header + 响应式导航 + Drawer）
│   ├── main.ts                    # 应用入口
│   ├── style.css                  # 全局样式（CSS 变量、响应式断点）
│   └── vite-env.d.ts              # Vite 类型声明
├── tests/                          # 测试文件（9 个测试套件）
├── eslint.config.js               # ESLint 配置（flat config）
├── prettier.config.js             # Prettier 配置
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 颜色数据

`colorSystemMapping.json` 包含 292 种拼豆颜色的多品牌色号映射：

- MARD
- COCO
- 漫漫
- 盼盼
- 咪小窝

每种颜色以 HEX 值为键，值为各品牌对应的色号，确保生成的图纸颜色与实际拼豆颜色匹配。

## 浏览器兼容性

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 待办事项

- [ ] 国际化 (i18n)
- [ ] 图纸库（本地保存/管理已生成的图纸）
- [x] 使用帮助页面
- [x] 编辑快捷键（含多种预设方案）
- [x] 自适应大小（桌面端、平板端、移动端）
- [x] 导出图纸的坐标使用格子编号

## 许可证

MIT License
