<template>
  <div class="controls">
    <div class="control-group">
      <label for="grid-size">网格大小:</label>
      <input type="range" id="grid-size" v-model.number="localGridSize" min="10" max="100">
      <span>{{ localGridSize }}</span>
    </div>
    <div class="control-group">
      <label for="color-count">颜色数量:</label>
      <input type="range" id="color-count" v-model.number="localColorCount" min="2" max="20">
      <span>{{ localColorCount }}</span>
    </div>
    <div class="control-group">
      <label for="brand">拼豆品牌:</label>
      <select id="brand" v-model="localBrand">
        <option value="MARD">MARD</option>
        <option value="COCO">COCO</option>
        <option value="漫漫">漫漫</option>
        <option value="盼盼">盼盼</option>
        <option value="咪小窝">咪小窝</option>
      </select>
    </div>
    <div class="control-group">
      <label for="show-numbers">显示颜色编号:</label>
      <input type="checkbox" id="show-numbers" v-model="localShowNumbers">
    </div>
    <button @click="generate" id="generate-btn">生成图纸</button>
    <button @click="download" id="download-btn">下载图纸</button>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

// 定义 props
const props = defineProps({
  gridSize: {
    type: Number,
    default: 30
  },
  colorCount: {
    type: Number,
    default: 8
  },
  brand: {
    type: String,
    default: 'MARD'
  },
  showNumbers: {
    type: Boolean,
    default: false
  }
});

// 定义 emit
const emit = defineEmits(['update:gridSize', 'update:colorCount', 'update:brand', 'update:showNumbers', 'generate', 'download']);

// 本地状态
const localGridSize = ref(props.gridSize);
const localColorCount = ref(props.colorCount);
const localBrand = ref(props.brand);
const localShowNumbers = ref(props.showNumbers);

// 监听本地状态变化，更新父组件
watch(localGridSize, (newValue) => {
  emit('update:gridSize', newValue);
});

watch(localColorCount, (newValue) => {
  emit('update:colorCount', newValue);
});

watch(localBrand, (newValue) => {
  emit('update:brand', newValue);
});

watch(localShowNumbers, (newValue) => {
  emit('update:showNumbers', newValue);
});

// 方法
const generate = () => {
  emit('generate');
};

const download = () => {
  emit('download');
};
</script>

<style scoped>
.controls {
  text-align: center;
  margin-bottom: 30px;
}

.control-group {
  margin: 10px 0;
}

label {
  display: inline-block;
  width: 120px;
  text-align: right;
  margin-right: 10px;
}

input[type="range"] {
  width: 200px;
}

select {
  padding: 5px;
  border-radius: 3px;
  border: 1px solid #ddd;
}

button {
  padding: 8px 16px;
  background-color: #008CBA;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin: 0 5px;
}

button:hover {
  background-color: #007B9E;
}
</style>