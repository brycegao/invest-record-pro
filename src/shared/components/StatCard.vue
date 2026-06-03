/*
 * @Author: brycegao
 * @Github: https://github.com/brycegao
 * @Date: 2026/06/03
 * @Description: StatCard 组件
 *
 * Copyright (c) 2026 brycegao
 *
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

<template>
  <n-card>
    <n-statistic :value="formattedValue" :value-style="valueStyle">
      <template #label>
        <span class="stat-card__label">
          <span>{{ label }}</span>
          <n-tooltip v-if="tooltip" trigger="hover">
            <template #trigger>
              <button class="stat-card__help" type="button" :aria-label="`${label}统计口径`">?</button>
            </template>
            {{ tooltip }}
          </n-tooltip>
        </span>
      </template>
    </n-statistic>
  </n-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NCard, NStatistic, NTooltip } from 'naive-ui'

const props = withDefaults(
  defineProps<{
    label: string
    value: string
    color?: string
    suffix?: string
    tooltip?: string
  }>(),
  {
    color: undefined,
    suffix: undefined,
    tooltip: undefined,
  },
)

const formattedValue = computed(() => {
  return props.suffix ? `${props.value}${props.suffix}` : props.value
})

const valueStyle = computed(() => {
  if (!props.color) {
    return undefined
  }
  return { color: props.color }
})
</script>

<style scoped>
.stat-card__label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.stat-card__help {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  padding: 0;
  border: 1px solid #c9cdd4;
  border-radius: 50%;
  background: transparent;
  color: #86909c;
  font-size: 12px;
  line-height: 1;
  cursor: help;
}

.stat-card__help:hover,
.stat-card__help:focus-visible {
  border-color: #18a058;
  color: #18a058;
  outline: none;
}
</style>
