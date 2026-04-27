<template>
  <div class="controls-container">
    <!-- 标题部分 -->
    <h3 class="section-title">
      <el-icon class="title-icon">
        <Setting />
      </el-icon>
      参数设置
    </h3>

    <el-card class="controls-card" :body-style="{ padding: '0px' }">
      <div class="form-wrapper">
        <el-form label-width="80px" label-position="left">

          <!-- 网格宽度 -->
          <el-form-item label="宽度">
            <div class="slider-row">
              <el-input-number
                v-model="gridWidth"
                :min="1"
                :max="1000"
                :step="1"
                :controls="true"
                size="small"
                class="custom-input-number"
              />
              <span class="value-label">{{ gridWidth }}</span>
            </div>
          </el-form-item>

          <!-- 网格高度 -->
          <el-form-item label="高度">
            <div class="slider-row">
              <el-input-number
                v-model="gridHeight"
                :min="1"
                :max="1000"
                :step="1"
                :controls="true"
                size="small"
                class="custom-input-number"
              />
              <span class="value-label">{{ gridHeight }}</span>
            </div>
          </el-form-item>

          <!-- 颜色数量 -->
          <el-form-item label="颜色数量">
            <div class="slider-row">
              <el-slider v-model="colorCount" :min="1" :max="50" :step="1" show-stops class="custom-slider" />
              <span class="value-label">{{ colorCount }}</span>
            </div>
          </el-form-item>

          <!-- 拼豆品牌 -->
          <el-form-item label="拼豆品牌">
            <el-select v-model="selectedBrand" placeholder="请选择" class="custom-select">
              <el-option label="MARD" value="MARD" />
              <el-option label="COCO" value="COCO" />
              <el-option label="漫漫" value="漫漫" />
              <el-option label="盼盼" value="盼盼" />
              <el-option label="咪小窝" value="咪小窝" />
            </el-select>
          </el-form-item>

          <!-- 显示编号 -->
          <el-form-item label="显示编号">
            <div class="switch-wrapper">
              <span :class="['switch-label', !showNumbers ? 'active-text' : '']">隐藏</span>
              <el-switch v-model="showNumbers" />
              <span :class="['switch-label', showNumbers ? 'active-text' : '']">显示</span>
            </div>
          </el-form-item>

          <!-- 图片比例 -->
          <el-form-item label="图片比例">
            <div class="slider-row">
              <span>{{ imageRatio }}</span>
            </div>
          </el-form-item>

          <!-- 锁定比例 -->
          <el-form-item label="锁定比例">
            <div class="switch-wrapper">
              <span :class="['switch-label', !lockAspectRatio ? 'active-text' : '']">关闭</span>
              <el-switch v-model="lockAspectRatio" />
              <span :class="['switch-label', lockAspectRatio ? 'active-text' : '']">开启</span>
            </div>
          </el-form-item>

        </el-form>
      </div>
      <!-- 底部按钮 -->
      <div class="button-footer">
        <el-button type="primary" class="btn-generate" @click="generatePattern">
          <el-icon>
            <MagicStick />
          </el-icon> 生成图纸
        </el-button>
        <el-button type="warning" class="btn-download" @click="downloadPattern">
          <el-icon>
            <Download />
          </el-icon> 下载
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useAppStore } from '../store/appStore';
import { storeToRefs } from 'pinia';
import { gcd } from '../utils/patternUtils';
import { MagicStick, Download, Setting } from '@element-plus/icons-vue';

const emit = defineEmits(['download']);
const appStore = useAppStore();
const { gridWidth, gridHeight, colorCount, selectedBrand, showNumbers, lockAspectRatio, originalImageSize } = storeToRefs(appStore);

const ratioLocking = ref(false);

watch(gridWidth, (newWidth) => {
  if (!lockAspectRatio.value || ratioLocking.value) return;
  ratioLocking.value = true;
  
  // 解析比例并计算宽高比
  const ratioParts = imageRatio.value.split(':');
  if (ratioParts.length === 2) {
    const widthRatio = Number(ratioParts[0]);
    const heightRatio = Number(ratioParts[1]);
    const aspectRatio = widthRatio / heightRatio;
    
    // 根据宽高比计算新的高度
    const newHeight = Math.max(1, Math.round(newWidth / aspectRatio));
    appStore.setGridHeight(newHeight);
  }
  
  ratioLocking.value = false;
});

watch(gridHeight, (newHeight) => {
  if (!lockAspectRatio.value || ratioLocking.value) return;
  ratioLocking.value = true;
  
  // 解析比例并计算宽高比
  const ratioParts = imageRatio.value.split(':');
  if (ratioParts.length === 2) {
    const widthRatio = Number(ratioParts[0]);
    const heightRatio = Number(ratioParts[1]);
    const aspectRatio = widthRatio / heightRatio;
    
    // 根据宽高比计算新的宽度
    const newWidth = Math.max(1, Math.round(newHeight * aspectRatio));
    appStore.setGridWidth(newWidth);
  }
  
  ratioLocking.value = false;
});

const imageRatio = computed<string>(() => {
  const { width, height } = originalImageSize.value;
  if (!width || !height) return '暂无图片';
  const ratio = gcd(width, height);
  return `${width / ratio}:${height / ratio}`;
});

const generatePattern = (): void => {
  appStore.generatePattern();
};

const downloadPattern = (): void => {
  emit('download');
};
</script>

<style scoped>
.controls-container {
  width: 100%;
  margin-bottom: 24px;
  padding: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 16px;
}

.title-icon {
  font-size: 18px;
  color: #409eff;
}

.controls-card {
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.controls-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.1);
}

.form-wrapper {
  padding: 20px;
  background: linear-gradient(135deg, #f6f8fa 0%, #e9ecef 100%);
}

.slider-row,
.item-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}

.custom-slider {
  flex: 1;
}

.value-label {
  min-width: 36px;
  text-align: right;
  font-weight: 600;
  color: #303133;
}

:deep(.el-input-number.is-controls-right .el-input__inner) {
  text-align: center;
  padding-left: 10px;
  padding-right: 40px;
}

.custom-select {
  width: 100%;
}

:deep(.el-input__wrapper) {
  border-radius: 8px;
}

.switch-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.switch-label {
  font-size: 14px;
  color: #909399;
  transition: color 0.3s;
}

.switch-label.active-text {
  color: #409eff;
}

.button-footer {
  padding: 16px;
  display: flex;
  gap: 15px;
  background-color: #fff;
  border-top: 1px solid #e9ecef;
}

.tool-button-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tool-footer {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px;
  background-color: #f7f9fc;
  border-top: 1px solid #e9ecef;
}

.btn-generate,
.btn-download {
  flex: 1;
  height: 44px;
  font-size: 15px;
  border-radius: 8px;
  border: none;
}

.btn-generate {
  background-color: #409eff;
}

.btn-download {
  background-color: #e6a23c;
}

:deep(.el-form-item__label) {
  font-size: 16px;
  color: #606266;
  font-weight: 500;
}
</style>