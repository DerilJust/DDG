<template>
    <el-card class="palette-card" shadow="hover">
        <div class="card-header">
            <el-icon class="title-icon">
                <Brush />
            </el-icon>
            <span>颜色编辑</span>
            <div class="edit-switch">
                <span>编辑模式</span>
                <el-switch v-model="localEditMode" />
            </div>
        </div>

        <div class="palette-description">
            请选择当前品牌颜色，切换“点击修改”或“框选修改”，修改后点击确认才会应用。
        </div>

        <div class="mode-panel">
            <el-button type="text" class="mode-button" :class="{ active: localEditType === 'click' }" @click="selectMode('click')">
                <el-icon><Brush /></el-icon>
                <span>点击修改</span>
            </el-button>
            <el-button type="text" class="mode-button" :class="{ active: localEditType === 'area' }" @click="selectMode('area')">
                <el-icon><Crop /></el-icon>
                <span>框选修改</span>
            </el-button>
        </div>

        <div v-if="palette.length" class="palette-grid">
            <div v-for="item in palette" :key="item.code" class="palette-item"
                :class="{ active: item.color.hex === activeColorHex }" @click="selectColor(item.color)">
                <div class="swatch" :style="{ backgroundColor: item.color.hex }"></div>
                <div class="palette-info">
                    <div class="palette-code">{{ item.code }}</div>
                    <div class="palette-count">{{ item.count }}颗</div>
                </div>
            </div>
        </div>
        <div v-else class="palette-empty">
            先生成图纸后即可选择可编辑颜色。
        </div>

        <div class="palette-footer">
            <el-button type="primary" size="small" @click="fillAll" :disabled="!activeColorHex">
                全部填充选中色
            </el-button>
            <el-button type="success" size="small" @click="confirmEdit" :disabled="!hasSelection || !hasPendingColor">
                确认应用修改
            </el-button>
            <el-button type="danger" size="small" @click="cancelEdit" :disabled="!hasSelection">
                取消修改
            </el-button>
        </div>
    </el-card>
</template>

<script setup>
import { computed } from 'vue';
import { Brush, Crop } from '@element-plus/icons-vue';

const props = defineProps({
    palette: {
        type: Array,
        default: () => []
    },
    activeColor: {
        type: Object,
        default: null
    },
    editMode: {
        type: Boolean,
        default: false
    },
    editType: {
        type: String,
        default: 'click'
    },
    hasSelection: {
        type: Boolean,
        default: false
    },
    hasPendingColor: {
        type: Boolean,
        default: false
    }
});
const emit = defineEmits(['select', 'fill-all', 'update:editMode', 'update:editType', 'confirm-edit', 'cancel-edit']);

const activeColorHex = computed(() => props.activeColor?.hex || '');
const localEditMode = computed({
    get: () => props.editMode,
    set: (val) => emit('update:editMode', val)
});
const localEditType = computed({
    get: () => props.editType,
    set: (val) => emit('update:editType', val)
});

const selectMode = (mode) => {
    localEditType.value = mode;
};

const selectColor = (color) => {
    emit('select', color);
};

const fillAll = () => {
    emit('fill-all');
};

const confirmEdit = () => {
    emit('confirm-edit');
};

const cancelEdit = () => {
    emit('cancel-edit');
};
</script>

<style scoped>
.palette-card {
    width: 100%;
    border-radius: 12px;
}

.card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    font-size: 16px;
    font-weight: bold;
    color: #303133;
    padding: 16px 20px;
    background: linear-gradient(135deg, #f6f8fa 0%, #e9ecef 100%);
    border-bottom: 1px solid #e4e7ed;
}

.edit-switch {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #606266;
    font-size: 14px;
}

.title-icon {
    font-size: 18px;
    color: #409eff;
}

.palette-description {
    padding: 16px 20px;
    color: #606266;
    font-size: 14px;
    border-bottom: 1px solid #e8edf3;
}

.mode-panel {
    display: flex;
    gap: 10px;
    padding: 16px 20px;
    background: #ffffff;
    border-bottom: 1px solid #e8edf3;
}

.mode-button {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #606266;
    border: 1px solid transparent;
}

.mode-button.active {
    color: #409eff;
    border-color: #409eff;
    background-color: rgba(64, 158, 255, 0.08);
}

.palette-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    padding: 16px 20px 0;
}

.palette-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    border: 1px solid #e9edf3;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
    background: #fff;
}

.palette-item.active {
    border-color: #409eff;
    box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.12);
}

.palette-item:hover {
    transform: translateY(-1px);
}

.swatch {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    border: 1px solid rgba(0, 0, 0, 0.08);
}

.palette-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.palette-code {
    color: #303133;
    font-weight: 600;
}

.palette-count {
    color: #909399;
    font-size: 13px;
}

.palette-empty {
    padding: 20px;
    color: #909399;
    text-align: center;
}

.palette-footer {
    padding: 16px 20px 20px;
}
</style>
