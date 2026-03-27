<template>
  <div class="upload-section">
    <input type="file" ref="fileInput" accept="image/*" @change="handleFileChange">
    <button @click="uploadImage" id="upload-btn">上传图片</button>
  </div>
</template>

<script setup>
import { ref } from 'vue';

// 定义 props
const emit = defineEmits(['image-uploaded']);

// 响应式数据
const fileInput = ref(null);
const originalImage = ref(null);

// 处理文件选择
const handleFileChange = (event) => {
  originalImage.value = event.target.files[0];
};

// 上传图片
const uploadImage = () => {
  if (!originalImage.value) {
    alert('请选择一个图片文件');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = (e) => {
    emit('image-uploaded', {
      file: originalImage.value,
      url: e.target.result
    });
  };
  reader.readAsDataURL(originalImage.value);
};
</script>

<style scoped>
.upload-section {
  text-align: center;
  margin-bottom: 40px;
}

#upload-btn {
  padding: 10px 20px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  margin-top: 10px;
}

#upload-btn:hover {
  background-color: #45a049;
}
</style>