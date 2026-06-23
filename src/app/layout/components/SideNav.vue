/* * @Author: brycegao * @Github: https://github.com/brycegao * @Date: 2026/06/03 * @Description:
SideNav 组件 * * Copyright (c) 2026 brycegao * * Licensed under the MIT License. * See LICENSE file
in the project root for full license information. */

<template>
  <NMenu :value="activeKey" :options="menuOptions" @update:value="handleUpdateValue" />
</template>

<script setup lang="ts">
import { NMenu, type MenuOption } from 'naive-ui'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const menuOptions: MenuOption[] = [
  { label: '仪表盘', key: 'dashboard' },
  { label: '投资标的', key: 'assets' },
  { label: '交易计划', key: 'plans' },
  { label: '交易记录', key: 'trades' },
  { label: '仓位快照', key: 'positions' },
  { label: '交易复盘', key: 'reviews' },
  { label: '投顾推荐', key: 'advisor' },
  { label: '市场观察', key: 'market-observations' },
  { label: '月度报告', key: 'monthly-reports' },
  { label: '设置', key: 'settings' },
  { label: '帮助', key: 'help' },
]

const activeKey = computed(() => {
  const [, firstSegment] = route.path.split('/')
  return firstSegment || 'dashboard'
})

function handleUpdateValue(key: string): void {
  router.push({ name: key })
}
</script>
