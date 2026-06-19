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
import type { AdvisorSignal, FollowUp } from '@/domain/types'
import { aggregate, evaluateSignal } from '@/services/advisor-review-calc.service'
import { formatMoney } from '@/domain/types/financial'
import { useAdvisorStore } from '../store'

const store = useAdvisorStore()
const props = defineProps<{ signals: AdvisorSignal[] }>()

interface SummaryRow {
  advisor: string
  total: number
  accuracy: string
  followedPnl: string
  missedAmount: string
  avoidedAmount: string
  contribution: string
  contributionClass: string
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
    const outcomes = sigs.map((s) => {
      const fu: FollowUp | undefined = store.getFollowUpFor(s.id)
      return evaluateSignal({
        refPrice: s.refPrice,
        followed: fu?.followed ?? false,
        actualPnl: undefined,
        hypotheticalQty: s.hypotheticalQty,
        rangeHigh: fu?.rangeHigh ?? 0,
        rangeLow: fu?.rangeLow ?? 0,
        rangeEndClose: fu?.rangeEndClose ?? 0,
      })
    })
    const sum = aggregate(outcomes)
    const contribution = sum.contribution
    result.push({
      advisor,
      total: sum.total,
      accuracy: `${(sum.accuracy * 100).toFixed(0)}%`,
      followedPnl: formatMoney(sum.followedPnl),
      missedAmount: formatMoney(sum.missedAmount),
      avoidedAmount: formatMoney(sum.avoidedAmount),
      contribution: formatMoney(contribution),
      contributionClass: contribution >= 0 ? 'pos' : 'neg',
    })
  }
  return result
})

const columns: DataTableColumns<SummaryRow> = [
  { title: '老师', key: 'advisor' },
  { title: '推荐数', key: 'total' },
  { title: '准确率', key: 'accuracy' },
  { title: '跟随收益', key: 'followedPnl' },
  { title: '踏空', key: 'missedAmount' },
  { title: '躲避', key: 'avoidedAmount' },
  {
    title: '贡献度', key: 'contribution',
    render: (r) => h('span', { class: r.contributionClass }, r.contribution),
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
