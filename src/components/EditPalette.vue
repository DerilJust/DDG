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
            请选择当前颜色后直接点击或拖动绘制，Ctrl+滚轮缩放画布，滚轮上下移动视图。
        </div>

        <div v-if="activeColorHex" class="current-color-panel">
            <div class="current-color-swatch" :style="{ backgroundColor: activeColorHex }"></div>
            <div class="current-color-label">当前颜色: {{ activeColorHex }}</div>
        </div>


        <div class="tool-panel">
            <el-button size="small" :type="localSelectedTool === 'brush' ? 'primary' : 'default'" @click="selectTool('brush')">画笔</el-button>
            <el-button size="small" :type="localSelectedTool === 'fill' ? 'primary' : 'default'" @click="selectTool('fill')">填充</el-button>
            <el-button size="small" :type="localSelectedTool === 'eraser' ? 'primary' : 'default'" @click="selectTool('eraser')">橡皮</el-button>
            <el-button size="small" :type="localSelectedTool === 'eyedropper' ? 'primary' : 'default'" @click="selectTool('eyedropper')">吸管</el-button>
            <el-button size="small" :type="localSelectedTool === 'pan' ? 'primary' : 'default'" @click="selectTool('pan')">手形</el-button>
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

        <div class="tool-footer">
            <el-button size="small" @click="undo" :disabled="!canUndo">撤销</el-button>
            <el-button size="small" @click="redo" :disabled="!canRedo">重做</el-button>
        </div>

        <div class="palette-footer">
            <el-button type="primary" size="small" @click="fillAll" :disabled="!activeColorHex">
                全部填充选中色
            </el-button>
        </div>
    </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { PropType } from 'vue';
import { Brush } from '@element-plus/icons-vue';
import type { PerlerColor, PaletteItem, ColorInfo } from '../utils/patternUtils';

const props = defineProps({
    palette: {
        type: Array as PropType<PaletteItem[]>,
        default: () => []
    },
    activeColor: {
        type: Object as PropType<ColorInfo | null>,
        default: null
    },
    editMode: {
        type: Boolean,
        default: false
    },
    selectedTool: {
        type: String as PropType<'brush' | 'fill' | 'pan' | 'eraser' | 'eyedropper'>,
        default: 'brush'
    },
    canUndo: {
        type: Boolean,
        default: false
    },
    canRedo: {
        type: Boolean,
        default: false
    }
});
const emit = defineEmits(['select', 'fill-all', 'update:editMode', 'update:selectedTool', 'undo', 'redo']);

const activeColorHex = computed<string>(() => props.activeColor?.hex || '');
const localEditMode = computed<boolean>({
    get: () => props.editMode,
    set: (val) => emit('update:editMode', val)
});
const localSelectedTool = computed<'brush' | 'fill' | 'pan' | 'eraser' | 'eyedropper'>({
    get: () => props.selectedTool,
    set: (val) => emit('update:selectedTool', val)
});

const selectTool = (tool: 'brush' | 'fill' | 'pan' | 'eraser' | 'eyedropper'): void => {
    localSelectedTool.value = tool;
};

const selectColor = (color: PerlerColor): void => {
    emit('select', color);
};

const fillAll = (): void => {
    emit('fill-all');
};

const undo = (): void => {
    emit('undo');
};

const redo = (): void => {
    emit('redo');
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

.current-color-panel {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 20px;
    background: #fff;
    border-bottom: 1px solid #e8edf3;
}

.current-color-swatch {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    border: 1px solid rgba(0, 0, 0, 0.08);
}

.current-color-label {
    color: #303133;
    font-weight: 600;
}

.tool-panel {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    padding: 16px 20px;
    background: #ffffff;
    border-bottom: 1px solid #e8edf3;
}

.tool-footer {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 16px 20px 0;
}
</style>