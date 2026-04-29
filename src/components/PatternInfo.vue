<template>
  <div class="pattern-info">
    <h3 class="section-title">
      <el-icon class="title-icon"><InfoFilled /></el-icon>
      图纸信息
    </h3>
    
    <el-card class="info-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon class="header-icon"><Message /></el-icon>
          <span>基本信息</span>
        </div>
      </template>
      <el-empty v-if="infoText === '请上传图片并生成图纸'" description="请上传图片并生成图纸" />
      <el-alert v-else :title="infoText" type="info" show-icon :closable="false" class="info-alert" />
    </el-card>
    
    <el-card v-if="colorStats.length > 0" class="stats-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon class="header-icon"><DataAnalysis /></el-icon>
          <span>拼豆数量统计</span>
        </div>
      </template>
      <el-table :data="colorStats" style="width: 100%" stripe class="stats-table">
        <el-table-column prop="code" label="颜色编号" width="120">
          <template #default="scope">
            <div class="stat-item">
              <div class="stat-color" :style="{ backgroundColor: `rgb(${scope.row.color.r}, ${scope.row.color.g}, ${scope.row.color.b})` }"></div>
              <span>{{ scope.row.code }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="count" label="数量">
          <template #default="scope">
            <el-tag type="info" size="small" class="count-tag">
              {{ scope.row.count }} 颗
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useAppStore } from '../store/appStore';
import { InfoFilled, Message, DataAnalysis } from '@element-plus/icons-vue';

const appStore = useAppStore();
const { infoText, colorStats } = storeToRefs(appStore);
</script>

<style scoped>
.pattern-info {
  margin-bottom: 24px;
  padding: 16px;
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

.info-card,
.stats-card {
  margin-bottom: 16px;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.info-card:hover,
.stats-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: bold;
  color: #303133;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f6f8fa 0%, #e9ecef 100%);
  border-bottom: 1px solid #e4e7ed;
}

.header-icon {
  font-size: 16px;
  color: #409EFF;
}

.info-alert {
  border-radius: 8px;
}

.stats-table {
  border-radius: 0 0 12px 12px;
  overflow: hidden;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-color {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #e4e7ed;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.count-tag {
  border-radius: 12px;
  padding: 0 12px;
  font-weight: 500;
}

/* 自定义表格样式 */
:deep(.el-table th) {
  background-color: #f8f9fa;
  font-weight: bold;
  color: #303133;
}

:deep(.el-table tr:hover > td) {
  background-color: #f0f8ff !important;
}

:deep(.el-table--striped .el-table__row--striped) {
  background-color: #f9fafb;
}
</style>