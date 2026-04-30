# 拼豆图纸生成器

一个功能强大的拼豆图纸生成工具，支持上传图片自动生成拼豆图纸，包含颜色编号、数量统计和在线编辑功能。

## 功能特点

- 图片上传：支持上传各种格式的图片，内置裁剪工具
- 颜色匹配：自动将图片颜色匹配到标准拼豆颜色（292 色）
- 参数调整：可调节网格大小、颜色数量，支持锁定宽高比
- 品牌选择：支持 MARD / COCO / 漫漫 / 盼盼 / 咪小窝 五种拼豆品牌色号
- 在线编辑：画笔、填充、橡皮、吸管工具，支持撤销/重做
- 数量统计：自动统计每种颜色的使用数量
- 编号显示：在格子内显示颜色编号，方便对照制作
- 导出下载：导出带统计信息的完整图纸 PNG

## 技术栈

- Vue 3 + TypeScript
- Vite
- Pinia (状态管理)
- Element Plus (UI 组件库)
- Canvas API (图纸渲染与编辑)

## 安装步骤

1. **克隆项目**

   ```bash
   git clone <repo-url>
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
├── src/
│   ├── components/
│   │   ├── UploadSection.vue      # 图片上传组件
│   │   ├── CropperDialog.vue      # 图片裁剪弹窗
│   │   ├── Controls.vue           # 参数设置组件
│   │   ├── PreviewSection.vue     # 拼豆图纸预览（Canvas + 缩放平移）
│   │   ├── EditPalette.vue        # 颜色编辑面板（画笔/填充/橡皮/吸管）
│   │   ├── PatternInfo.vue        # 颜色数量统计
│   │   ├── ExportPreview.vue      # 导出预览与下载
│   │   └── SourceImageCard.vue    # 原图预览
│   ├── store/
│   │   └── appStore.ts            # Pinia 状态管理（核心业务逻辑）
│   ├── utils/
│   │   ├── patternUtils.ts        # 颜色匹配、量化、统计算法
│   │   ├── patternRenderer.ts     # Canvas 图纸渲染引擎
│   │   ├── editUtils.ts           # 编辑工具（泛洪填充、克隆等）
│   │   └── selectionUtils.ts      # 选区坐标计算
│   ├── types/
│   │   └── index.ts               # TypeScript 类型定义
│   ├── colorMap/
│   │   └── colorSystemMapping.json # 292 色 → 5 品牌色号映射
│   ├── App.vue                    # 根组件
│   └── main.ts                    # 应用入口
├── index.html
├── package.json
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

## 许可证

MIT License
