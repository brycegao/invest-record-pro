/*
 * @Author: brycegao
 * @Github: https://github.com/brycegao
 * @Date: 2026/06/03
 * @Description: 主布局 — 侧边栏导航 + 内容区
 *
 * Copyright (c) 2026 brycegao
 *
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

<template>
  <NLayout class="main-layout">
    <NLayoutHeader class="main-layout__header">
      <div class="main-layout__brand">
        <div class="main-layout__mark">IR</div>
        <span>Invest Record Pro</span>
      </div>
      <div class="main-layout__actions">
        <NSwitch
          :value="isDarkTheme"
          size="small"
          @update:value="handleThemeSwitch"
        />
        <NButton size="small" secondary @click="showAbout = true">关于</NButton>
      </div>
    </NLayoutHeader>

    <!-- 关于对话框 -->
    <NModal
      v-model:show="showAbout"
      preset="card"
      :title="`Invest Record Pro`"
      class="about-dialog"
      :style="{ width: '420px' }"
      :bordered="false"
      :segmented="{ content: true }"
    >
      <div class="about-dialog__body">
        <p class="about-dialog__tagline">本地AI股票分析工具 · 纯离线运行 · 保障数据隐私</p>

        <div class="about-dialog__info">
          <div class="about-dialog__row">
            <span class="about-dialog__label">项目地址：</span>
            <a href="https://github.com/brycegao/invest-record-pro/" target="_blank" rel="noopener">
              https://github.com/brycegao/invest-record-pro/
            </a>
          </div>
          <div class="about-dialog__row">
            <span class="about-dialog__label">作&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;者：</span>
            <span>brycegao</span>
          </div>
          <div class="about-dialog__row">
            <span class="about-dialog__label">版&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;本：</span>
            <span>{{ appVersion }}</span>
          </div>
        </div>

        <div class="about-dialog__footer">
          本软件完全本地运行，不联网、不上传数据<br />
          所有分析与数据仅保存在您的设备中
        </div>
      </div>
    </NModal>

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
import { computed, onMounted, ref } from 'vue'
import {
  NButton,
  NCard,
  NLayout,
  NLayoutContent,
  NLayoutHeader,
  NLayoutSider,
  NModal,
  NSwitch,
} from 'naive-ui'
import SideNav from '@/app/layout/components/SideNav.vue'
import { useSettingsStore } from '@/features/settings/store'
import { APP_VERSION } from '@/shared/version'

const showAbout = ref(false)
const appVersion = APP_VERSION
const settingsStore = useSettingsStore()

const isDarkTheme = computed(() => settingsStore.currentTheme === 'dark')

onMounted(() => {
  settingsStore.loadSettings()
})

async function handleThemeSwitch(value: boolean): Promise<void> {
  await settingsStore.setTheme(value ? 'dark' : 'light')
}
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
  border-bottom: 1px solid var(--n-border-color);
  padding: 0 16px;
  background: var(--n-color);
}

.main-layout__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--n-text-color);
  font-size: 15px;
  font-weight: 600;
}

.main-layout__mark {
  display: grid;
  width: 26px;
  height: 26px;
  place-items: center;
  border-radius: 4px;
  background: var(--n-text-color);
  color: var(--n-color);
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
  background: var(--n-body-color);
}

.main-layout__card {
  min-height: calc(100vh - 80px);
  background: var(--n-card-color);
}

/* 关于对话框 */
.about-dialog__body {
  text-align: center;
}

.about-dialog__tagline {
  margin: 0 0 16px;
  color: var(--n-text-color-3);
  font-size: 13px;
}

.about-dialog__info {
  text-align: left;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: var(--n-action-color);
  border-radius: 6px;
  font-size: 13px;
  line-height: 2;
}

.about-dialog__label {
  color: var(--n-text-color-3);
}

.about-dialog__footer {
  padding-top: 12px;
  border-top: 1px solid var(--n-divider-color);
  color: var(--n-text-color-3);
  font-size: 12px;
  line-height: 1.8;
}
</style>
