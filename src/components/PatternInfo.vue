<template>
  <div id="pattern-info">
    <h3>图纸信息</h3>
    <p>{{ infoText }}</p>
    
    <div v-if="colorStats.length > 0" class="color-stats">
      <h4>拼豆数量统计</h4>
      <div class="stats-grid">
        <div v-for="stat in colorStats" :key="stat.code" class="stat-item">
          <div class="stat-color" :style="{ backgroundColor: `rgb(${stat.color.r}, ${stat.color.g}, ${stat.color.b})` }"></div>
          <span class="stat-code">{{ stat.code }}</span>
          <span class="stat-count">{{ stat.count }}颗</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// 定义 props
const props = defineProps({
  infoText: {
    type: String,
    default: '请上传图片并生成图纸'
  },
  colorStats: {
    type: Array,
    default: () => []
  }
});
</script>

<style scoped>
#pattern-info {
  text-align: center;
  margin-top: 20px;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 5px;
}

.color-stats {
  margin-top: 20px;
  text-align: left;
}

.color-stats h4 {
  text-align: center;
  margin-bottom: 15px;
  color: #333;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
  margin-top: 15px;
}

.stat-item {
  display: flex;
  align-items: center;
  padding: 8px;
  background-color: white;
  border-radius: 5px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.stat-color {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  margin-right: 10px;
  border: 1px solid #ddd;
}

.stat-code {
  font-weight: bold;
  margin-right: 10px;
  min-width: 40px;
}

.stat-count {
  color: #666;
}
</style>