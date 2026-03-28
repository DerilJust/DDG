<template>
  <div class="upload-section">
    <h3 class="section-title">
      <el-icon class="title-icon"><UploadFilled /></el-icon>
      图片上传
    </h3>
    <el-card class="upload-card" shadow="hover">
      <div class="upload-content">
        <el-upload
          class="upload-demo"
          :auto-upload="false"
          :on-change="handleFileChange"
          :show-file-list="false"
          accept="image/*"
        >
          <el-button type="primary" size="large" class="upload-btn" :icon="UploadFilled">
            选择图片
          </el-button>
        </el-upload>
        <el-button 
          type="success" 
          size="large" 
          class="upload-btn" 
          @click="uploadImage"
          :disabled="!originalImage"
          :icon="Check"
        >
          上传图片
        </el-button>
      </div>
      <div v-if="originalImageUrl" class="image-preview">
        <el-image
          :src="originalImageUrl"
          fit="cover"
          class="preview-img"
          :preview-src-list="[originalImageUrl]"
        >
          <template #error>
            <div class="image-error">
              <el-icon class="error-icon"><Picture /></el-icon>
              <div class="error-text">图片加载失败</div>
            </div>
          </template>
        </el-image>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { UploadFilled, Check, Picture } from '@element-plus/icons-vue';

// 定义 props
const emit = defineEmits(['image-uploaded']);

// 响应式数据
const originalImage = ref(null);
const originalImageUrl = ref('');

// 处理文件选择
const handleFileChange = (file) => {
  originalImage.value = file.raw;
};

// 上传图片
const uploadImage = () => {
  if (!originalImage.value) {
    return;
  }
  
  const reader = new FileReader();
  reader.onload = (e) => {
    originalImageUrl.value = e.target.result;
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
  margin-bottom: 24px;
}

.section-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 16px;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  font-size: 20px;
  color: #409EFF;
}

.upload-card {
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.upload-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.1);
}

.upload-content {
  padding: 20px;
  text-align: center;
  background: linear-gradient(135deg, #f6f8fa 0%, #e9ecef 100%);
  border-radius: 12px 12px 0 0;
}

.upload-btn {
  width: 100%;
  margin-bottom: 12px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.upload-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px 0 rgba(64, 158, 255, 0.3);
}

.image-preview {
  padding: 16px;
  background-color: #f9fafb;
  border-top: 1px solid #e9ecef;
}

.preview-img {
  width: 100%;
  height: 180px;
  border-radius: 8px;
  object-fit: cover;
  box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.preview-img:hover {
  box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.15);
  transform: scale(1.02);
}

.image-error {
  width: 100%;
  height: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  color: #909399;
  border-radius: 8px;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.error-text {
  font-size: 14px;
  color: #909399;
}
</style>