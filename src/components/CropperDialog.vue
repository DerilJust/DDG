<template>
    <el-dialog v-model="dialogVisible" title="图片裁剪" width="80%" :close-on-click-modal="false" @close="cancelCrop">
        <div class="cropper-container">
            <div class="cropper-wrapper">
                <canvas ref="cropperCanvas" class="cropper-canvas" @pointerdown="startDrag"></canvas>
                <div v-if="cropRect.visible" class="crop-rect" :style="{
                    left: cropRect.x + 'px',
                    top: cropRect.y + 'px',
                    width: cropRect.width + 'px',
                    height: cropRect.height + 'px'
                }">
                    <div class="crop-handle top-left" @mousedown="startResize('tl', $event)"></div>
                    <div class="crop-handle top-right" @mousedown="startResize('tr', $event)"></div>
                    <div class="crop-handle bottom-left" @mousedown="startResize('bl', $event)"></div>
                    <div class="crop-handle bottom-right" @mousedown="startResize('br', $event)"></div>
                    <div class="crop-handle top" @mousedown="startResize('t', $event)"></div>
                    <div class="crop-handle bottom" @mousedown="startResize('b', $event)"></div>
                    <div class="crop-handle left" @mousedown="startResize('l', $event)"></div>
                    <div class="crop-handle right" @mousedown="startResize('r', $event)"></div>
                </div>
            </div>

            <div class="cropper-controls">
                <el-slider v-model="zoomLevel" :min="10" :max="200" :step="10" show-input class="zoom-slider"
                    @input="drawImage">
                    <template #prefix>缩放: </template>
                </el-slider>

                <div class="crop-buttons">
                    <el-button @click="cancelCrop">取消</el-button>
                    <el-button type="primary" @click="applyCrop">应用裁剪</el-button>
                    <el-button type="success" @click="uploadCroppedImage">确认并上传</el-button>
                </div>
            </div>
        </div>
    </el-dialog>
</template>

<script setup>
import { ref, watch, computed, nextTick, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    },
    imageData: {
        type: Object,
        default: null
    }
});
const emit = defineEmits(['update:visible', 'upload']);

const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
});

const cropperCanvas = ref(null);
const canvasContext = ref(null);
const localImageData = ref(null);
const zoomLevel = ref(100);
const cropRect = ref({
    x: 50,
    y: 50,
    width: 200,
    height: 200,
    visible: false,
    dragging: false,
    resizing: false,
    resizeDirection: ''
});
const mouseStartPos = ref({ x: 0, y: 0 });
const originalCropRect = ref({ x: 0, y: 0, width: 0, height: 0 });
const canvasSize = ref({ width: 0, height: 0 });

onMounted(() => {
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
});

onBeforeUnmount(() => {
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
});

watch(
    () => props.imageData,
    (image) => {
        localImageData.value = image;
    },
    { immediate: true }
);

watch(
    [() => props.visible, () => localImageData.value],
    async ([visible, imageData]) => {
        if (visible && imageData) {
            await nextTick();
            initCanvas();
            drawImage();
            initCropRect();
        }
    }
);

const initCanvas = () => {
    if (!cropperCanvas.value) return;

    const width = cropperCanvas.value.clientWidth;
    const height = cropperCanvas.value.clientHeight;

    cropperCanvas.value.width = width;
    cropperCanvas.value.height = height;
    canvasSize.value = { width, height };

    canvasContext.value = cropperCanvas.value.getContext('2d');
    canvasContext.value.setTransform(1, 0, 0, 1, 0, 0);
};

const getCanvasPointerPos = (e) => {
    if (!cropperCanvas.value) return { x: 0, y: 0 };

    const rect = cropperCanvas.value.getBoundingClientRect();
    const scaleX = cropperCanvas.value.width / rect.width;
    const scaleY = cropperCanvas.value.height / rect.height;

    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
};

const drawImage = () => {
    if (!localImageData.value || !canvasContext.value) return;

    const canvas = cropperCanvas.value;
    const ctx = canvasContext.value;
    const img = localImageData.value;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const imgWidth = img.width;
    const imgHeight = img.height;
    const scale = zoomLevel.value / 100;
    let displayWidth = imgWidth * scale;
    let displayHeight = imgHeight * scale;

    if (displayWidth > canvasWidth || displayHeight > canvasHeight) {
        const widthRatio = canvasWidth / displayWidth;
        const heightRatio = canvasHeight / displayHeight;
        const minRatio = Math.min(widthRatio, heightRatio);
        displayWidth *= minRatio;
        displayHeight *= minRatio;
    }

    const offsetX = (canvasWidth - displayWidth) / 2;
    const offsetY = (canvasHeight - displayHeight) / 2;

    ctx.drawImage(img, offsetX, offsetY, displayWidth, displayHeight);

    localImageData.value.offsetX = offsetX;
    localImageData.value.offsetY = offsetY;
    localImageData.value.displayWidth = displayWidth;
    localImageData.value.displayHeight = displayHeight;
    localImageData.value.displayScaleX = displayWidth / imgWidth;
    localImageData.value.displayScaleY = displayHeight / imgHeight;
};

const initCropRect = () => {
    if (!localImageData.value) return;

    const displayWidth = localImageData.value.displayWidth;
    const displayHeight = localImageData.value.displayHeight;
    const offsetX = localImageData.value.offsetX;
    const offsetY = localImageData.value.offsetY;
    const rectSize = Math.min(displayWidth, displayHeight) * 0.6;

    cropRect.value = {
        x: offsetX + (displayWidth - rectSize) / 2,
        y: offsetY + (displayHeight - rectSize) / 2,
        width: rectSize,
        height: rectSize,
        visible: true,
        dragging: false,
        resizing: false,
        resizeDirection: ''
    };
};

const startDrag = (e) => {
    if (!cropRect.value.visible) return;

    e.preventDefault();

    const { x, y } = getCanvasPointerPos(e);
    const crop = cropRect.value;

    if (x >= crop.x && x <= crop.x + crop.width && y >= crop.y && y <= crop.y + crop.height) {
        cropRect.value.dragging = true;
        mouseStartPos.value = { x, y };
        originalCropRect.value = { ...crop };

        if (cropperCanvas.value && e.pointerId != null && cropperCanvas.value.setPointerCapture) {
            cropperCanvas.value.setPointerCapture(e.pointerId);
        }
    }
};

const handlePointerMove = (e) => {
    if (!cropRect.value.visible) return;

    const { x, y } = getCanvasPointerPos(e);

    if (cropRect.value.dragging) {
        const start = mouseStartPos.value;
        const dx = x - start.x;
        const dy = y - start.y;
        cropRect.value.x = originalCropRect.value.x + dx;
        cropRect.value.y = originalCropRect.value.y + dy;
        constrainCropRect();
    } else if (cropRect.value.resizing) {
        handleResize(x, y);
    }
};

const handlePointerUp = (e) => {
    if (cropRect.value.dragging || cropRect.value.resizing) {
        cropRect.value.dragging = false;
        cropRect.value.resizing = false;

        if (cropperCanvas.value && e?.pointerId != null && cropperCanvas.value.releasePointerCapture) {
            cropperCanvas.value.releasePointerCapture(e.pointerId);
        }
    }
};

const endDrag = () => {
    cropRect.value.dragging = false;
    cropRect.value.resizing = false;
};

const startResize = (direction, e) => {
    if (!cropRect.value.visible) return;

    e.stopPropagation();
    e.preventDefault();

    const { x: mouseX, y: mouseY } = getCanvasPointerPos(e);
    const crop = cropRect.value;
    crop.resizing = true;
    crop.resizeDirection = direction;
    mouseStartPos.value = { x: mouseX, y: mouseY };
    originalCropRect.value = { ...crop };
};

const handleResize = (mouseX, mouseY) => {
    const crop = cropRect.value;
    const original = originalCropRect.value;
    const direction = crop.resizeDirection;
    const start = mouseStartPos.value;

    let newX = original.x;
    let newY = original.y;
    let newWidth = original.width;
    let newHeight = original.height;

    if (direction.includes('l')) {
        const deltaX = mouseX - start.x;
        newWidth = original.width - deltaX;
        newX = original.x + deltaX;
    }
    if (direction.includes('r')) {
        const deltaX = mouseX - start.x;
        newWidth = original.width + deltaX;
    }
    if (direction.includes('t')) {
        const deltaY = mouseY - start.y;
        newHeight = original.height - deltaY;
        newY = original.y + deltaY;
    }
    if (direction.includes('b')) {
        const deltaY = mouseY - start.y;
        newHeight = original.height + deltaY;
    }

    newWidth = Math.max(20, newWidth);
    newHeight = Math.max(20, newHeight);

    cropRect.value.x = newX;
    cropRect.value.y = newY;
    cropRect.value.width = newWidth;
    cropRect.value.height = newHeight;
    constrainCropRect();

    mouseStartPos.value = { x: mouseX, y: mouseY };
    originalCropRect.value = { ...cropRect.value };
};

const constrainCropRect = () => {
    if (!localImageData.value) return;

    const offsetX = localImageData.value.offsetX;
    const offsetY = localImageData.value.offsetY;
    const displayWidth = localImageData.value.displayWidth;
    const displayHeight = localImageData.value.displayHeight;
    const crop = cropRect.value;

    crop.x = Math.max(offsetX, Math.min(crop.x, offsetX + displayWidth - crop.width));
    crop.y = Math.max(offsetY, Math.min(crop.y, offsetY + displayHeight - crop.height));

    const maxWidth = offsetX + displayWidth - crop.x;
    const maxHeight = offsetY + displayHeight - crop.y;
    crop.width = Math.min(crop.width, maxWidth);
    crop.height = Math.min(crop.height, maxHeight);
    crop.width = Math.max(20, crop.width);
    crop.height = Math.max(20, crop.height);
};

const cropCanvasImage = (img, crop) => {
    return new Promise((resolve, reject) => {
        const sourceX = (crop.x - img.offsetX) / img.displayScaleX;
        const sourceY = (crop.y - img.offsetY) / img.displayScaleY;
        const sourceWidth = crop.width / img.displayScaleX;
        const sourceHeight = crop.height / img.displayScaleY;

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = Math.max(1, Math.round(sourceWidth));
        tempCanvas.height = Math.max(1, Math.round(sourceHeight));
        const tempCtx = tempCanvas.getContext('2d');

        tempCtx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, tempCanvas.width, tempCanvas.height);
        tempCanvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error('裁剪失败'));
                return;
            }

            const dataUrl = tempCanvas.toDataURL('image/png');
            const croppedFile = new File([blob], 'cropped-image.png', { type: 'image/png' });
            const croppedImage = new Image();

            croppedImage.onload = () => {
                resolve({ image: croppedImage, dataUrl, file: croppedFile });
            };
            croppedImage.onerror = () => {
                reject(new Error('裁剪图片加载失败'));
            };
            croppedImage.src = dataUrl;
        }, 'image/png');
    });
};

const applyCrop = async () => {
    if (!localImageData.value || !cropRect.value.visible) return;

    try {
        const cropped = await cropCanvasImage(localImageData.value, cropRect.value);
        localImageData.value = cropped.image;
        zoomLevel.value = 100;

        await nextTick();
        initCanvas();
        drawImage();
        initCropRect();
    } catch (error) {
        console.error('应用裁剪失败：', error);
        alert('应用裁剪失败，请重试');
    }
};

const cancelCrop = () => {
    dialogVisible.value = false;
    cropRect.value.visible = false;
    zoomLevel.value = 100;
};

const uploadCroppedImage = async () => {
    if (!localImageData.value || !cropRect.value.visible) return;

    try {
        const cropped = await cropCanvasImage(localImageData.value, cropRect.value);
        emit('upload', {
            file: cropped.file,
            url: cropped.dataUrl,
            width: cropped.image.width,
            height: cropped.image.height
        });
        dialogVisible.value = false;
    } catch (error) {
        console.error('上传裁剪图片失败：', error);
        alert('上传裁剪图片失败，请重试');
    }
};
</script>

<style scoped>
.cropper-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.cropper-wrapper {
    position: relative;
    width: 100%;
    height: 400px;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    overflow: hidden;
    background-color: #f5f7fa;
}

.cropper-canvas {
    width: 100%;
    height: 100%;
    cursor: crosshair;
    touch-action: none;
}

.crop-rect {
    position: absolute;
    border: 2px solid #409EFF;
    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
    pointer-events: none;
    z-index: 10;
}

.crop-rect::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border: 1px dashed #ffffff;
    opacity: 0.5;
}

.crop-handle {
    position: absolute;
    width: 12px;
    height: 12px;
    background-color: #409EFF;
    border: 2px solid #ffffff;
    border-radius: 50%;
    pointer-events: auto;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.crop-handle:hover {
    background-color: #66b1ff;
    transform: scale(1.2);
}

.crop-handle.top-left {
    top: -6px;
    left: -6px;
    cursor: nw-resize;
}

.crop-handle.top-right {
    top: -6px;
    right: -6px;
    cursor: ne-resize;
}

.crop-handle.bottom-left {
    bottom: -6px;
    left: -6px;
    cursor: sw-resize;
}

.crop-handle.bottom-right {
    bottom: -6px;
    right: -6px;
    cursor: se-resize;
}

.crop-handle.top {
    top: -6px;
    left: 50%;
    transform: translateX(-50%);
    cursor: n-resize;
}

.crop-handle.bottom {
    bottom: -6px;
    left: 50%;
    transform: translateX(-50%);
    cursor: s-resize;
}

.crop-handle.left {
    top: 50%;
    left: -6px;
    transform: translateY(-50%);
    cursor: w-resize;
}

.crop-handle.right {
    top: 50%;
    right: -6px;
    transform: translateY(-50%);
    cursor: e-resize;
}

.cropper-controls {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.zoom-slider {
    width: 100%;
}

.zoom-slider .el-slider__runway {
    background-color: #e4e7ed;
}

.zoom-slider .el-slider__bar {
    background-color: #409EFF;
}

.zoom-slider .el-slider__button {
    border-color: #409EFF;
    background-color: #ffffff;
}

.zoom-slider .el-slider__button:hover {
    transform: scale(1.2);
}

.crop-buttons {
    display: flex;
    gap: 12px;
    justify-content: center;
}

.crop-buttons .el-button {
    min-width: 100px;
    border-radius: 8px;
    transition: all 0.3s ease;
}

.crop-buttons .el-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}
</style>
