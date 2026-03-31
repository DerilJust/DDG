<template>
    <el-card class="source-card" shadow="hover">
        <div class="card-header" @click="toggleCollapsed">
            <div class="header-left">
                <el-icon class="title-icon">
                    <PictureFilled />
                </el-icon>
                <span>原图预览</span>
            </div>
            <el-button type="text" class="collapse-button" @click.stop="toggleCollapsed">
                <el-icon>
                    <ArrowDown v-if="collapsed" />
                    <ArrowUp v-else />
                </el-icon>
                {{ collapsed ? '展开' : '收起' }}
            </el-button>
        </div>

        <transition name="collapse">
            <div v-show="!collapsed" class="source-body">
                <div v-if="imageUrl" class="source-image-wrapper">
                    <el-image :src="imageUrl" fit="contain" class="source-image" :preview-src-list="[imageUrl]" />
                </div>
                <div v-else class="source-placeholder">
                    <p>请先上传原图并生成图纸。</p>
                </div>
            </div>
        </transition>
    </el-card>
</template>

<script setup>
import { ref } from 'vue';
import { PictureFilled, ArrowDown, ArrowUp } from '@element-plus/icons-vue';

const props = defineProps({
    imageUrl: {
        type: String,
        default: ''
    }
});

const collapsed = ref(false);

const toggleCollapsed = () => {
    collapsed.value = !collapsed.value;
};
</script>

<style scoped>
.source-card {
    border-radius: 12px;
    overflow: hidden;
}

.card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 16px 20px;
    background: linear-gradient(135deg, #f6f8fa 0%, #e9ecef 100%);
    border-bottom: 1px solid #e4e7ed;
    cursor: pointer;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
}

.title-icon {
    font-size: 18px;
    color: #409EFF;
}

.collapse-button {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #606266;
    font-size: 14px;
}

.source-body {
    padding: 16px;
    background-color: #fff;
}

.source-image-wrapper {
    width: 100%;
    min-height: 220px;
}

.source-image {
    width: 100%;
    height: 260px;
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
