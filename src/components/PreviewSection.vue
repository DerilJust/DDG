<template>
  <div class="preview-section">
    <el-card class="preview-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon class="header-icon"><Picture /></el-icon>
          <span>原始图片</span>
        </div>
      </template>
      <div class="image-container">
        <el-image
          v-if="originalImageUrl"
          :src="originalImageUrl"
          fit="contain"
          class="original-image"
          :preview-src-list="[originalImageUrl]"
        >
          <template #error>
            <div class="image-error">
              <el-icon class="error-icon"><Picture /></el-icon>
              <div class="error-text">图片加载失败</div>
            </div>
          </template>
        </el-image>
        <div v-else class="image-placeholder">
          <el-icon class="placeholder-icon"><Upload /></el-icon>
          <div class="placeholder-text">请上传图片</div>
        </div>
      </div>
    </el-card>
    
    <el-card class="preview-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon class="header-icon"><Grid /></el-icon>
          <span>拼豆图纸</span>
        </div>
      </template>
      <div class="canvas-container">
        <canvas ref="patternCanvas" id="pattern-canvas" class="pattern-canvas"></canvas>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { Picture, Upload, Grid } from '@element-plus/icons-vue';

// 定义 props
const props = defineProps({
  originalImageUrl: {
    type: String,
    default: ''
  }
});

// 响应式数据
const patternCanvas = ref(null);

// 暴露 ref
defineExpose({
  patternCanvas
});

// 监听原始图片变化
watch(() => props.originalImageUrl, (newUrl) => {
  if (newUrl) {
    console.log('原始图片已更新');
  }
});
</script>

<style scoped>
.preview-section {
  display: flex;
  gap: 20px;
  height: 90%;
  min-height: 600px;
}

.preview-card {
  flex: 1;
  min-width: 400px;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.preview-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px 0 rgba(0, 0, 0, 0.15);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: bold;
  color: #303133;
  padding: 16px 20px;
  background: linear-gradient(135deg, #f6f8fa 0%, #e9ecef 100%);
  border-bottom: 1px solid #e4e7ed;
}

.header-icon {
  font-size: 20px;
  color: #409EFF;
}

.image-container {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f0f2f5 0%, #e6e8eb 100%);
  overflow: hidden;
  position: relative;
}

.image-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0) 50%);
  pointer-events: none;
}

.original-image {
  max-width: 95%;
  max-height: 95%;
  border-radius: 8px;
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.original-image:hover {
  transform: scale(1.02);
  box-shadow: 0 6px 24px 0 rgba(0, 0, 0, 0.2);
}

.canvas-container {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f0f2f5 0%, #e6e8eb 100%);
  overflow: auto;
  position: relative;
}

.canvas-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0) 50%);
  pointer-events: none;
}

.pattern-canvas {
  max-width: 95%;
  max-height: 95%;
  border-radius: 8px;
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.pattern-canvas:hover {
  box-shadow: 0 6px 24px 0 rgba(0, 0, 0, 0.2);
}

.image-error,
.image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;
  text-align: center;
  padding: 40px;
}

.error-icon,
.placeholder-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
  animation: pulse 2s infinite;
}

.error-text,
.placeholder-text {
  font-size: 16px;
  color: #909399;
  margin-top: 8px;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 0.5;
  }
}
</style>