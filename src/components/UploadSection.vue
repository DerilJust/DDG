<template>
  <div class="upload-section">
    <h3 class="section-title">
      <el-icon class="title-icon">
        <UploadFilled />
      </el-icon>
      图片上传
    </h3>
    <el-card class="upload-card" shadow="hover">
      <div class="upload-content">
        <el-upload class="upload-demo" :auto-upload="false" :on-change="handleFileChange" :show-file-list="false"
          accept="image/*">
          <el-button type="primary" size="large" class="upload-btn" :icon="UploadFilled">
            选择图片
          </el-button>
        </el-upload>
        <el-button type="success" size="large" class="upload-btn" @click="showCropper" :disabled="!originalImage"
          :icon="Check">
          上传并裁剪
        </el-button>
      </div>

      <div v-if="previewUrl" class="image-preview">
        <el-image :src="previewUrl" fit="cover" class="preview-img" :preview-src-list="[previewUrl]" preview-teleported>
          <template #error>
            <div class="image-error">
              <el-icon class="error-icon">
                <Picture />
              </el-icon>
              <div class="error-text">图片加载失败</div>
            </div>
          </template>
        </el-image>
      </div>
    </el-card>
  </div>

  <CropperDialog :visible="cropperVisible" :image-data="imageData" @update:visible="cropperVisible = $event"
    @upload="handleImageUploaded" />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { UploadFilled, Check, Picture } from '@element-plus/icons-vue';
import CropperDialog from './CropperDialog.vue';
import { useAppStore } from '../store/appStore';
import type { CropperImageData, SelectedImageData, UploadedCropResult } from '../types';

const appStore = useAppStore();
const { originalImageUrl } = storeToRefs(appStore);

/** 裁剪所需的图片数据 */
const imageData = ref<CropperImageData | null>(null);
const originalImage = ref<File | null>(null);
const previewUrl = ref<string>(originalImageUrl.value || '');

watch(originalImageUrl, (value: string) => {
  previewUrl.value = value;
});

// 处理文件选择
const handleFileChange = (file: { raw: File }) => {
  originalImage.value = file.raw;
  const reader = new FileReader();
  reader.onload = (e: ProgressEvent<FileReader>) => {
    if (e.target?.result && typeof e.target.result === 'string') {
      previewUrl.value = e.target.result;
    }
  };
  reader.readAsDataURL(file.raw);
};

// 显示裁剪器
const showCropper = (): void => {
  if (!originalImage.value) {
    return;
  }

  const reader = new FileReader();
  reader.onload = (e: ProgressEvent<FileReader>) => {
    if (e.target?.result && typeof e.target.result === 'string') {
      previewUrl.value = e.target.result;
      const img = new Image();
      const imageUrl = e.target.result;
      img.onload = () => {
        handleImageSelected({
          imageData: img,
          imageUrl: imageUrl
        });
      };
      img.src = imageUrl;
    }
  };
  reader.readAsDataURL(originalImage.value);
};

/** 图片裁剪对话框的可见性 */
const cropperVisible = ref<boolean>(false);

const handleImageUploaded = (data: UploadedCropResult) => {
  originalImage.value = data.file;
  previewUrl.value = data.url;
  appStore.setOriginalImage(data.file);
  appStore.setOriginalImageUrl(data.url);
  appStore.setInfoText('图片已上传');
  appStore.setOriginalImageSize(data.width, data.height);
  appStore.setGridSizeByImageRatio(data.width, data.height);
};

// 处理图片选择（用于裁剪）
const handleImageSelected = (data: SelectedImageData) => {
  imageData.value = {
    offsetX: 0,
    offsetY: 0,
    displayWidth: data.imageData.width,
    displayHeight: data.imageData.height,
    displayScaleX: 1,
    displayScaleY: 1,
    image: data.imageData
  };
  previewUrl.value = data.imageUrl;
  cropperVisible.value = true;
};

</script>

<style scoped>
.upload-section {
  padding: 20px;
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
  font-size: 18px;
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