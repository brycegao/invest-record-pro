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
    <n-statistic :label="label" :value="formattedValue" :value-style="valueStyle" />
  </n-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NCard, NStatistic } from 'naive-ui'

const props = withDefaults(
  defineProps<{
    label: string
    value: string
    color?: string
    suffix?: string
  }>(),
  {
    color: undefined,
    suffix: undefined,
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
