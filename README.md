# 拼豆图纸生成器

一个功能强大的拼豆图纸生成工具，支持上传图片自动生成拼豆图纸，包含颜色编号和数量统计。

## 功能特点

- 📷 **图片上传**：支持上传各种格式的图片
- 🎨 **颜色匹配**：自动将图片颜色匹配到标准拼豆颜色
- 🔧 **参数调整**：可调节网格大小和颜色数量
- 🏷️ **品牌选择**：支持多种拼豆品牌的颜色编号
- 📊 **数量统计**：自动统计每种颜色的使用数量
- 🖨️ **编号显示**：在格子内显示颜色编号，方便识别
- 💾 **图片下载**：生成的图纸可直接下载保存

## 技术栈

- Vue 3 + Vite
- JavaScript
- Canvas API
- 响应式设计

## 安装步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/yourusername/perler-pattern-generator.git
   cd perler-pattern-generator
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

1. **上传图片**：点击「上传图片」按钮选择要转换的图片
2. **调整参数**：
   - 网格大小：控制图纸的精细程度
   - 颜色数量：控制使用的颜色种类
   - 拼豆品牌：选择使用的拼豆品牌
   - 显示编号：选择是否在格子内显示颜色编号
3. **生成图纸**：点击「生成图纸」按钮
4. **查看统计**：生成后会显示每种颜色的使用数量
5. **下载图纸**：点击「下载图纸」按钮保存生成的图纸

## 项目结构

```
├── src/
│   ├── components/
│   │   ├── UploadSection.vue     # 文件上传组件
│   │   ├── Controls.vue          # 控制参数组件
│   │   ├── PreviewSection.vue    # 预览显示组件
│   │   └── PatternInfo.vue       # 信息统计组件
│   ├── colorMap/
│   │   └── colorSystemMapping.json  # 拼豆颜色映射数据
│   ├── App.vue                   # 主应用组件
│   └── main.js                   # 应用入口
├── index.html                    # HTML模板
├── package.json                  # 项目配置
└── README.md                     # 项目说明
```

## 颜色数据

项目使用 `colorSystemMapping.json` 文件存储拼豆颜色数据，包含以下品牌的颜色映射：
- MARD
- COCO
- 漫漫
- 盼盼
- 咪小窝

每种颜色都包含对应的色号，确保生成的图纸颜色与实际拼豆颜色匹配。

## 浏览器兼容性

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目！

## 鸣谢

- 感谢所有贡献者的努力
- 感谢拼豆爱好者的支持

---

**享受拼豆创作的乐趣！** 🎉# Vue 3 + TypeScript + Vite

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about the recommended Project Setup and IDE Support in the [Vue Docs TypeScript Guide](https://vuejs.org/guide/typescript/overview.html#project-setup).