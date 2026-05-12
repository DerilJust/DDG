<template>
  <div class="app-container">
    <el-header :height="isMobile ? '48px' : '60px'" class="header">
      <div class="header-content">
        <img src="/logo.png" alt="Logo" class="header-logo" />
        <h1 class="title">拼豆图纸生成器</h1>
        <nav v-if="!isMobile" class="nav-tabs">
          <button
            v-for="item in navItems"
            :key="item.path"
            :class="['nav-tab', { active: isActive(item.path) }]"
            @click="navigateTo(item.path)"
          >
            <el-icon><component :is="item.icon" /></el-icon>
            {{ isTablet && item.shortLabel ? item.shortLabel : item.label }}
          </button>
        </nav>
        <button v-else class="hamburger-btn" @click="toggleDrawer">
          <el-icon :size="22"><Menu /></el-icon>
        </button>
      </div>
      <el-drawer
        v-model="drawerVisible"
        direction="ttb"
        size="auto"
        :with-header="false"
        class="mobile-nav-drawer"
      >
        <div class="drawer-nav">
          <button
            v-for="item in navItems"
            :key="item.path"
            :class="['drawer-nav-item', { active: isActive(item.path) }]"
            @click="onNavClick(item.path)"
          >
            <el-icon :size="20"><component :is="item.icon" /></el-icon>
            <span>{{ item.label }}</span>
          </button>
        </div>
      </el-drawer>
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
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { HomeFilled, Edit, Aim, QuestionFilled, Menu } from '@element-plus/icons-vue'
import { useBreakpoint } from './composables/useBreakpoint'

const router = useRouter()
const route = useRoute()
const { isMobile, isTablet } = useBreakpoint()

const drawerVisible = ref(false)

function toggleDrawer() {
  drawerVisible.value = !drawerVisible.value
}

function onNavClick(path: string) {
  drawerVisible.value = false
  router.push(path)
}

const navItems = [
  { path: '/', label: '首页', icon: HomeFilled },
  { path: '/editor', label: '编辑器', icon: Edit },
  { path: '/focus', label: '专注拼豆', shortLabel: '专注', icon: Aim },
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

.header-logo {
  width: 40px;
  height: 40px;
  margin-right: 12px;
  flex-shrink: 0;
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

/* Responsive */
@media (max-width: 767px) {
  h1.title {
    font-size: 22px;
    letter-spacing: 1px;
  }

  .header-logo {
    width: 28px;
    height: 28px;
    margin-right: 8px;
  }
}

@media (min-width: 768px) and (max-width: 1023px) {
  h1.title {
    font-size: 26px;
  }

  .header-logo {
    width: 34px;
    height: 34px;
    margin-right: 10px;
  }

  .nav-tab {
    padding: 7px 13px;
    font-size: 13px;
  }
}

/* Hamburger menu button */
.hamburger-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: auto;
  background: none;
  border: none;
  color: #606266;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  transition:
    background 0.2s,
    color 0.2s;
}

.hamburger-btn:hover {
  background: rgba(0, 0, 0, 0.04);
  color: #303133;
}

/* Mobile nav drawer */
.mobile-nav-drawer :deep(.el-drawer__body) {
  padding: 8px 12px;
}

.drawer-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.drawer-nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: transparent;
  color: #606266;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.15s;
  font-family: inherit;
}

.drawer-nav-item:hover {
  color: #303133;
  background: rgba(0, 0, 0, 0.04);
}

.drawer-nav-item.active {
  color: #409eff;
  background: #ecf5ff;
  font-weight: 600;
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
