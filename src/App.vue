<template>
  <div class="container">
    <h1>拼豆图纸生成器</h1>
    
    <UploadSection @image-uploaded="handleImageUploaded" />
    
    <Controls 
      v-model:gridSize="gridSize"
      v-model:colorCount="colorCount"
      v-model:brand="selectedBrand"
      v-model:showNumbers="showNumbers"
      @generate="generatePattern"
      @download="downloadPattern"
    />
    
    <PreviewSection 
      ref="previewSection"
      :originalImageUrl="originalImageUrl"
    />
    
    <PatternInfo 
      :infoText="infoText"
      :colorStats="colorStats"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import UploadSection from './components/UploadSection.vue';
import Controls from './components/Controls.vue';
import PreviewSection from './components/PreviewSection.vue';
import PatternInfo from './components/PatternInfo.vue';
import colorSystemMapping from '../src/colorMap/colorSystemMapping.json';

// 响应式数据
const originalImage = ref(null);
const originalImageUrl = ref('');
const gridSize = ref(30);
const colorCount = ref(8);
const infoText = ref('请上传图片并生成图纸');
const perlerColors = ref([]);
const previewSection = ref(null);
const selectedBrand = ref('MARD');
const showNumbers = ref(false);
const colorStats = ref([]);

// 加载颜色数据
const loadColorData = () => {
  try {
    const colors = [];
    
    for (const [hex, info] of Object.entries(colorSystemMapping)) {
      const r = parseInt(hex.substring(1, 3), 16);
      const g = parseInt(hex.substring(3, 5), 16);
      const b = parseInt(hex.substring(5, 7), 16);
      colors.push({r, g, b, hex, info});
    }
    
    perlerColors.value = colors;
    console.log(`已加载 ${perlerColors.value.length} 种拼豆颜色`);
  } catch (error) {
    console.error('加载颜色数据失败:', error);
    infoText.value = '加载颜色数据失败，请检查colorSystemMapping.json文件';
  }
};

// 处理图片上传
const handleImageUploaded = (data) => {
  originalImage.value = data.file;
  originalImageUrl.value = data.url;
  infoText.value = `图片已上传`;
};

// 找到最接近的颜色
const findClosestColor = (color, colorMap) => {
  let closestColor = colorMap[0];
  let minDistance = Infinity;

  colorMap.forEach(mapColor => {
    const distance = Math.sqrt(
      Math.pow(color.r - mapColor.r, 2) +
      Math.pow(color.g - mapColor.g, 2) +
      Math.pow(color.b - mapColor.b, 2)
    );

    if (distance < minDistance) {
      minDistance = distance;
      closestColor = mapColor;
    }
  });

  return closestColor;
};

// 颜色量化
const quantizeColors = (pixels, count) => {
  const colorFreq = {};

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];

    const closestColor = findClosestColor({ r, g, b }, perlerColors.value);
    const key = `${closestColor.r},${closestColor.g},${closestColor.b}`;
    colorFreq[key] = (colorFreq[key] || 0) + 1;
  }

  const sortedColors = Object.keys(colorFreq)
    .sort((a, b) => colorFreq[b] - colorFreq[a])
    .slice(0, count);

  const colorMap = [];
  sortedColors.forEach(colorStr => {
    const [r, g, b] = colorStr.split(',').map(Number);
    const colorObj = perlerColors.value.find(c => c.r === r && c.g === g && c.b === b);
    colorMap.push(colorObj || { r, g, b });
  });

  return colorMap;
};

// 生成拼豆图纸
const generatePattern = () => {
  if (!originalImage.value) {
    alert('请先上传图片');
    return;
  }

  if (perlerColors.value.length === 0) {
    alert('颜色数据未加载完成，请稍后重试');
    return;
  }

  const canvas = previewSection.value.patternCanvas;
  const ctx = canvas.getContext('2d');

  // 设置画布大小
  canvas.width = gridSize.value * 10;
  canvas.height = gridSize.value * 10;

  // 绘制原始图片到临时画布进行处理
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  tempCanvas.width = gridSize.value;
  tempCanvas.height = gridSize.value;

  const img = new Image();
  img.onload = () => {
    tempCtx.drawImage(img, 0, 0, gridSize.value, gridSize.value);

    // 获取像素数据
    const imageData = tempCtx.getImageData(0, 0, gridSize.value, gridSize.value);
    const pixels = imageData.data;

    // 颜色量化
    const colorMap = quantizeColors(pixels, colorCount.value);

    // 设置格子大小
    const cellSize = showNumbers.value ? 20 : 10;
    
    // 重新设置画布大小
    canvas.width = gridSize.value * cellSize;
    canvas.height = gridSize.value * cellSize;
    
    // 颜色使用统计
    const colorUsage = {};
    
    // 绘制拼豆图案
    for (let y = 0; y < gridSize.value; y++) {
      for (let x = 0; x < gridSize.value; x++) {
        const index = (y * gridSize.value + x) * 4;
        const r = pixels[index];
        const g = pixels[index + 1];
        const b = pixels[index + 2];
        
        // 找到最接近的颜色
        const closestColor = findClosestColor({r, g, b}, colorMap);
        
        // 绘制豆子
        ctx.fillStyle = `rgb(${closestColor.r}, ${closestColor.g}, ${closestColor.b})`;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        
        // 绘制网格线
        ctx.strokeStyle = '#ddd'; 
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
        
        // 显示颜色编号
        if (showNumbers.value && closestColor.info && closestColor.info[selectedBrand.value]) {
          const colorCode = closestColor.info[selectedBrand.value];
          ctx.fillStyle = getContrastColor(closestColor.r, closestColor.g, closestColor.b);
          // 动态调整字体大小，确保编号不超过格子
          let fontSize = cellSize * 0.6;
          ctx.font = `${fontSize}px Arial`;
          const textWidth = ctx.measureText(colorCode).width;
          if (textWidth > cellSize * 0.8) {
            fontSize = (cellSize * 0.8 / textWidth) * fontSize;
            ctx.font = `${fontSize}px Arial`;
          }
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(colorCode, x * cellSize + cellSize / 2, y * cellSize + cellSize / 2);
        }
        
        // 统计颜色使用次数
        const colorKey = `${closestColor.r},${closestColor.g},${closestColor.b}`;
        if (!colorUsage[colorKey]) {
          colorUsage[colorKey] = {
            color: closestColor,
            count: 0
          };
        }
        colorUsage[colorKey].count++;
      }
    }
    
    // 生成颜色统计数据
    colorStats.value = Object.values(colorUsage)
      .map(item => ({
        code: item.color.info ? item.color.info[selectedBrand.value] || '' : '',
        color: item.color,
        count: item.count
      }))
      .filter(item => item.code)
      .sort((a, b) => b.count - a.count);
    
    // 绘制统计信息到画布
    drawStatsToCanvas(ctx, canvas, cellSize);
    
    infoText.value = `拼豆图纸已生成: ${gridSize.value}x${gridSize.value} 网格, ${colorCount.value} 种颜色`;
  };
  img.src = originalImageUrl.value;
};

// 下载图纸
const downloadPattern = () => {
  const canvas = previewSection.value.patternCanvas;
  if (canvas.width === 0) {
    alert('请先生成拼豆图纸');
    return;
  }
  
  const link = document.createElement('a');
  link.download = 'perler-pattern.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
};


// 绘制统计信息到画布
const drawStatsToCanvas = (ctx, canvas, cellSize) => {
  if (colorStats.value.length === 0) return;
  
  // 计算统计信息区域的高度
  const statsHeight = Math.ceil(colorStats.value.length / 5) * 40 + 60;
  const originalHeight = canvas.height;
  
  // 调整画布大小
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  tempCanvas.width = canvas.width;
  tempCanvas.height = originalHeight + statsHeight;
  
  // 复制原始画布内容
  tempCtx.drawImage(canvas, 0, 0);
  
  // 绘制统计信息标题
  tempCtx.fillStyle = '#333';
  tempCtx.font = '16px Arial';
  tempCtx.textAlign = 'center';
  tempCtx.fillText('拼豆数量统计', canvas.width / 2, originalHeight + 30);
  
  // 绘制统计信息网格
  colorStats.value.forEach((stat, index) => {
    const row = Math.floor(index / 5);
    const col = index % 5;
    const x = col * (canvas.width / 5) + 20;
    const y = originalHeight + 60 + row * 40;
    
    // 绘制颜色块
    tempCtx.fillStyle = `rgb(${stat.color.r}, ${stat.color.g}, ${stat.color.b})`;
    tempCtx.fillRect(x, y, 20, 20);
    
    // 绘制编号和数量
    tempCtx.fillStyle = '#333';
    tempCtx.font = '12px Arial';
    tempCtx.textAlign = 'left';
    tempCtx.fillText(`${stat.code}: ${stat.count}颗`, x + 30, y + 15);
  });
  
  // 更新原始画布
  canvas.width = tempCanvas.width;
  canvas.height = tempCanvas.height;
  ctx.drawImage(tempCanvas, 0, 0);
};

// 获取对比色（用于文字）
const getContrastColor = (r, g, b) => {
  // 计算亮度
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? '#000000' : '#ffffff';
};

// 初始化颜色数据
loadColorData();
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: Arial, sans-serif;
  background-color: #f0f0f0;
  padding: 20px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  background-color: white;
  border-radius: 10px;
  padding: 30px;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
}
</style>