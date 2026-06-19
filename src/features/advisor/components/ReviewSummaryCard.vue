<!--
  @Description: 按老师汇总 — 准确率/跟随收益/踏空/躲避/贡献度
-->
<template>
  <NCard title="按老师汇总" size="small" class="advisor-summary">
    <NDataTable :columns="columns" :data="rows" size="small" :pagination="false" />
  </NCard>
</template>

<script setup lang="ts">
import { computed, h } from 'vue'
import { NCard, NDataTable, type DataTableColumns } from 'naive-ui'
import type { AdvisorSignal } from '@/domain/types'
import { aggregate, evaluateSignal } from '@/services/advisor-review-calc.service'
import { formatMoney } from '@/domain/types/financial'
import { useAdvisorStore } from '../store'

const store = useAdvisorStore()
const props = defineProps<{ signals: AdvisorSignal[] }>()

interface SummaryRow {
  advisor: string
  total: number
  reviewedCount: number
  decisionAccuracy: string
  followedPnl: string
  totalRegret: string
  regretClass: string
}

const rows = computed<SummaryRow[]>(() => {
  const byAdvisor = new Map<string, AdvisorSignal[]>()
  for (const s of props.signals) {
    const arr = byAdvisor.get(s.advisor) ?? []
    arr.push(s)
    byAdvisor.set(s.advisor, arr)
  }
  const result: SummaryRow[] = []
  for (const [advisor, sigs] of byAdvisor) {
    // 只统计已复盘（有 rangeEndClose）的
    const reviewed = sigs.filter((s) => {
      const fu = store.getFollowUpFor(s.id)
      return fu?.rangeEndClose != null
    })
    const outcomes = reviewed.map((s) => {
      const fu = store.getFollowUpFor(s.id)!
      return evaluateSignal({
        direction: s.direction,
        refPrice: s.refPrice,
        followed: fu.followed,
        hypotheticalQty: s.hypotheticalQty,
        rangeHigh: fu.rangeHigh ?? 0,
        rangeLow: fu.rangeLow ?? 0,
        rangeEndClose: fu.rangeEndClose ?? 0,
      })
    })
    const sum = aggregate(outcomes)
    result.push({
      advisor,
      total: sigs.length,
      reviewedCount: reviewed.length,
      decisionAccuracy: `${(sum.decisionAccuracy * 100).toFixed(0)}%`,
      followedPnl: formatMoney(sum.followedPnl),
      totalRegret: formatMoney(sum.totalRegret),
      regretClass: sum.totalRegret > 0 ? 'neg' : 'pos',
    })
  }
  return result
})

const columns: DataTableColumns<SummaryRow> = [
  { title: '老师', key: 'advisor' },
  { title: '推荐数', key: 'total' },
  { title: '已复盘', key: 'reviewedCount' },
  { title: '决策正确率', key: 'decisionAccuracy' },
  { title: '跟随收益', key: 'followedPnl' },
  {
    title: '本可避免损失', key: 'totalRegret',
    render: (r) => h('span', { class: r.regretClass }, r.totalRegret),
  },
]
</script>

<style scoped>
.advisor-summary {
  margin-bottom: 16px;
}
:deep(.pos) { color: #e74c3c; font-weight: 600; }
:deep(.neg) { color: #27ae60; font-weight: 600; }
</style>
