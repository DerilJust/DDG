<template>
  <div class="preview-section">
    <div class="image-container">
      <h3>原始图片</h3>
      <img v-if="originalImageUrl" :src="originalImageUrl" alt="原始图片">
      <div v-else class="placeholder">请上传图片</div>
    </div>
    <div class="image-container">
      <h3>拼豆图纸</h3>
      <canvas ref="patternCanvas" id="pattern-canvas"></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

// 定义 props
const props = defineProps({
  originalImageUrl: {
    type: String,
    default: ''
  }
});

// 定义 expose
const patternCanvas = ref(null);

defineExpose({
  patternCanvas
});
</script>

<style scoped>
.preview-section {
  display: flex;
  justify-content: space-around;
  margin-bottom: 40px;
  flex-wrap: wrap;
}

.image-container {
  text-align: center;
  margin: 10px;
}

img {
  max-width: 400px;
  max-height: 400px;
  border: 1px solid #ddd;
  border-radius: 5px;
}

canvas {
  border: 1px solid #ddd;
  border-radius: 5px;
  max-width: 100%;
}

.placeholder {
  width: 400px;
  height: 300px;
  border: 1px solid #ddd;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f9f9f9;
  color: #999;
}
</style>