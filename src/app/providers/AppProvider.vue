/*
 * @Author: brycegao
 * @Github: https://github.com/brycegao
 * @Date: 2026/06/03
 * @Description: 全局 Provider — Naive UI 主题/国际化
 *
 * Copyright (c) 2026 brycegao
 *
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

<template>
  <NConfigProvider :locale="zhCN" :date-locale="dateZhCN" :theme="theme">
    <NMessageProvider>
      <NDialogProvider>
        <NNotificationProvider>
          <App />
        </NNotificationProvider>
      </NDialogProvider>
    </NMessageProvider>
  </NConfigProvider>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  darkTheme,
  dateZhCN,
  NConfigProvider,
  NDialogProvider,
  NMessageProvider,
  NNotificationProvider,
  zhCN,
} from 'naive-ui'
import App from '@/app/App.vue'
import { useSettingsStore } from '@/features/settings/store'

const settingsStore = useSettingsStore()

const theme = computed(() => {
  if (settingsStore.currentTheme === 'dark') return darkTheme
  return undefined // light 或 system 跟随系统，默认浅色
})
</script>
