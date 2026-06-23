<!--
  @Description: 投顾页面主体 — 组合表单/汇总/列表/弹窗
-->
<template>
  <NSpace vertical :size="16">
    <AdvisorSignalForm />
    <ReviewSummaryCard :signals="store.signals" />
    <StrategyStatsPanel />
    <AdvisorSignalTable :signals="store.signals" :loading="store.loading" @review="handleReview" />
    <FollowUpDrawer v-model:show="drawerShow" :signal="activeSignal" />
  </NSpace>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { NSpace } from 'naive-ui'
import type { AdvisorSignal } from '@/domain/types'
import { useAdvisorStore } from '../store'
import AdvisorSignalForm from './AdvisorSignalForm.vue'
import AdvisorSignalTable from './AdvisorSignalTable.vue'
import ReviewSummaryCard from './ReviewSummaryCard.vue'
import StrategyStatsPanel from './StrategyStatsPanel.vue'
import FollowUpDrawer from './FollowUpDrawer.vue'

const store = useAdvisorStore()
const drawerShow = ref(false)
const activeSignal = ref<AdvisorSignal | null>(null)

onMounted(() => {
  void store.loadSignals()
})

function handleReview(signal: AdvisorSignal): void {
  activeSignal.value = signal
  drawerShow.value = true
}
</script>
