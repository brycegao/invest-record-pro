<template>
  <NLayout class="main-layout">
    <NLayoutHeader class="main-layout__header">
      <div class="main-layout__brand">
        <div class="main-layout__mark">IR</div>
        <span>Invest Record Pro</span>
      </div>
      <div class="main-layout__actions">
        <NSwitch size="small" />
        <NButton size="small" secondary>备份</NButton>
        <NButton size="small" secondary>关于</NButton>
      </div>
    </NLayoutHeader>
    <NLayout has-sider class="main-layout__body">
      <NLayoutSider :width="220" :collapsed-width="0" bordered>
        <SideNav />
      </NLayoutSider>
      <NLayoutContent class="main-layout__content">
        <NCard size="small" class="main-layout__card">
          <router-view />
        </NCard>
      </NLayoutContent>
    </NLayout>
  </NLayout>
</template>

<script setup lang="ts">
import { NButton, NCard, NLayout, NLayoutContent, NLayoutHeader, NLayoutSider, NSwitch } from 'naive-ui'
import SideNav from '@/app/layout/components/SideNav.vue'
</script>

<style scoped>
.main-layout {
  min-height: 100vh;
}

.main-layout__header {
  display: flex;
  height: 48px;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #d9dee8;
  padding: 0 16px;
  background: #ffffff;
}

.main-layout__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #1f2937;
  font-size: 15px;
  font-weight: 600;
}

.main-layout__mark {
  display: grid;
  width: 26px;
  height: 26px;
  place-items: center;
  border-radius: 4px;
  background: #1f2937;
  color: #ffffff;
  font-size: 11px;
  letter-spacing: 0;
}

.main-layout__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.main-layout__body {
  min-height: calc(100vh - 48px);
}

.main-layout__content {
  padding: 16px;
  background: #f4f6f8;
}

.main-layout__card {
  min-height: calc(100vh - 80px);
}
</style>
