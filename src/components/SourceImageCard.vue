<template>
    <el-card class="source-card" shadow="hover">
        <div v-if="originalImageUrl" class="source-image-wrapper">
            <el-image :src="originalImageUrl" fit="contain" class="source-image"
                :preview-src-list="[originalImageUrl]" />
        </div>
        <div v-else class="source-placeholder">
            <p>请先上传原图并生成图纸。</p>
        </div>
    </el-card>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useAppStore } from '../store/appStore';

const appStore = useAppStore();
const { originalImageUrl } = storeToRefs(appStore);
</script>

<style scoped>
.source-card {
    border-radius: 12px;
    height: 100%;
}

.source-image-wrapper {
    width: 100%;
    min-height: 220px;
}

.source-image {
    width: 100%;
    height: 700px;
    border-radius: 10px;
    border: 1px solid #e8edf3;
}

.source-placeholder {
    min-height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #909399;
    background: #f9fafb;
    border: 1px dashed #e4e7ed;
    border-radius: 10px;
    padding: 24px;
    text-align: center;
}
</style>