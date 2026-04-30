<template>
  <div class="focus-placeholder">
    <el-result icon="info" title="功能开发中" sub-title="专注拼豆功能即将上线，敬请期待！">
      <template #extra>
        <router-link to="/editor">
          <el-button type="primary">
            <el-icon><Edit /></el-icon>
            返回编辑器
          </el-button>
        </router-link>
      </template>
    </el-result>
  </div>
</template>

<script setup lang="ts">
import { Edit } from '@element-plus/icons-vue'
</script>

<style scoped>
.focus-placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f6f8fa 0%, #e9ecef 100%);
}
</style>
