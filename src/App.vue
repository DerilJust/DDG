<template>
  <div class="app-container">
    <el-header height="60px" class="header">
      <div class="header-content">
        <h1 class="title">拼豆图纸生成器</h1>
        <nav class="nav-tabs">
          <button
            v-for="item in navItems"
            :key="item.path"
            :class="['nav-tab', { active: isActive(item.path) }]"
            @click="navigateTo(item.path)"
          >
            <el-icon><component :is="item.icon" /></el-icon>
            {{ item.label }}
          </button>
        </nav>
      </div>
    </el-header>
    <div class="page-wrapper">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <keep-alive>
            <component :is="Component" />
          </keep-alive>
        </transition>
      </router-view>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { HomeFilled, Edit, Aim, QuestionFilled } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

const navItems = [
  { path: '/', label: '首页', icon: HomeFilled },
  { path: '/editor', label: '编辑器', icon: Edit },
  { path: '/focus', label: '专注拼豆', icon: Aim },
  { path: '/help', label: '帮助', icon: QuestionFilled }
]

const isActive = (path: string): boolean => route.path === path

const navigateTo = (path: string): void => {
  router.push(path)
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
  font-family: 'Microsoft YaHei', Arial, sans-serif;
  background-color: #f0f2f5;
}

#app {
  height: 100%;
  width: 100%;
}

.app-container {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.page-wrapper {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.page-wrapper > .fade-enter-active,
.page-wrapper > .fade-leave-active {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.header {
  background: #fff;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  border-bottom: 1px solid rgb(196, 195, 195);
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.header:hover {
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.15);
}

.header-content {
  display: flex;
  align-items: center;
  width: 100%;
}

h1.title {
  font-family: '寒蝉点阵体';
  font-size: 32px;
  font-weight: bold;
  margin: 0;
  text-shadow: 1px 2px 4px rgba(0, 0, 0, 0.3);
  letter-spacing: 2px;
}

.nav-tabs {
  display: flex;
  gap: 4px;
  margin-left: auto;
}

.nav-tab {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: #606266;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 6px;
  transition:
    color 0.2s,
    background 0.2s;
  font-family: inherit;
  line-height: 1;
}

.nav-tab:hover {
  color: #303133;
  background: rgba(0, 0, 0, 0.04);
}

.nav-tab.active {
  color: #409eff;
  font-weight: 600;
}

.nav-tab.active::after {
  content: '';
  position: absolute;
  bottom: 2px;
  left: 12px;
  right: 12px;
  height: 2px;
  background: #409eff;
  border-radius: 1px;
  transition:
    left 0.2s,
    right 0.2s;
}

/* Page transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
