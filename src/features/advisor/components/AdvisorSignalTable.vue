<!--
  @Description: 推荐列表 — 含复盘按钮，触发 FollowUpDrawer
-->
<template>
  <NCard title="推荐列表" size="small">
    <NDataTable
      :columns="columns"
      :data="signals"
      :loading="loading"
      :pagination="{ pageSize: 15 }"
      size="small"
    />
  </NCard>
</template>

<script setup lang="ts">
import { h } from 'vue'
import { NButton, NCard, NDataTable, NTag, type DataTableColumns } from 'naive-ui'
import type { AdvisorSignal, FollowUp } from '@/domain/types'
import { ADVISOR_DIRECTION_LABELS } from '@/domain/types'
import { formatMoney } from '@/domain/types/financial'
import { useAdvisorStore } from '../store'

const store = useAdvisorStore()
defineProps<{
  signals: AdvisorSignal[]
  loading: boolean
}>()
const emit = defineEmits<{ review: [AdvisorSignal] }>()

function statusOf(s: AdvisorSignal): { label: string; type: 'default' | 'success' | 'warning' } {
  const fu: FollowUp | undefined = store.getFollowUpFor(s.id)
  if (!fu) return { label: '待复盘', type: 'default' }
  if (fu.followed) return { label: '已跟随', type: 'success' }
  if (fu.rangeEndClose != null && s.refPrice > 0) {
    return fu.rangeEndClose >= s.refPrice
      ? { label: '踏空', type: 'warning' }
      : { label: '躲避', type: 'success' }
  }
  return { label: '未跟随', type: 'default' }
}

/** 可空金额格式化：null/undefined 显示 — */
function moneyOrDash(fen: number | null | undefined): string {
  if (fen == null) return '—'
  return formatMoney(fen)
}

const columns: DataTableColumns<AdvisorSignal> = [
  { title: '老师', key: 'advisor', width: 90 },
  {
    title: '时间', key: 'signalAt', width: 150,
    render: (r) => new Date(r.signalAt).toLocaleString('zh-CN'),
  },
  {
    title: '标的', key: 'asset', width: 130,
    render: (r) => `${r.assetCode ?? ''} ${r.assetName ?? ''}`,
  },
  {
    title: '方向', key: 'direction', width: 90,
    render: (r) => ADVISOR_DIRECTION_LABELS[r.direction],
  },
  { title: '参考价', key: 'refPrice', width: 100, render: (r) => formatMoney(r.refPrice) },
  { title: '目标价', key: 'targetPrice', width: 100, render: (r) => moneyOrDash(r.targetPrice) },
  { title: '止损', key: 'stopLoss', width: 100, render: (r) => moneyOrDash(r.stopLoss) },
  { title: '假设量', key: 'hypotheticalQty', width: 80 },
  {
    title: '状态', key: 'status', width: 90,
    render: (r) => {
      const st = statusOf(r)
      return h(NTag, { type: st.type, size: 'small' }, { default: () => st.label })
    },
  },
  {
    title: '操作', key: 'actions', width: 120,
    render: (r) =>
      h(
        NButton,
        { size: 'small', type: 'primary', ghost: true, onClick: () => emit('review', r) },
        { default: () => '复盘' },
      ),
  },
]
</script>
