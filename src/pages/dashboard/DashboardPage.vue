/*
 * @Author: brycegao
 * @Github: https://github.com/brycegao
 * @Date: 2026/06/03
 * @Description: 仪表盘页面
 *
 * Copyright (c) 2026 brycegao
 *
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

<template>
  <div class="dashboard-page">
    <div class="dashboard-page__header">
      <div>
        <h2 class="dashboard-page__title">仪表盘</h2>
        <p class="dashboard-page__description">投资组合概览与关键指标一览</p>
      </div>
      <NSpace align="center">
        <NFormItem label="月份">
          <NDatePicker
            v-model:value="selectedMonthTimestamp"
            type="month"
            placeholder="选择月份"
            clearable
            style="width: 150px"
          />
        </NFormItem>
      </NSpace>
    </div>

    <!-- 空状态 — 欢迎引导 -->
    <div v-if="store.isLoading === false && store.isEmpty" class="dashboard-page__welcome">
      <div class="dashboard-page__welcome-bg">
        <div class="dashboard-page__welcome-content">
          <div class="dashboard-page__welcome-icon">📊</div>
          <h3 class="dashboard-page__welcome-title">欢迎使用 Invest Record Pro</h3>
          <p class="dashboard-page__welcome-desc">开始记录您的投资决策，让每笔交易有据可循</p>
          <NSpace justify="center" size="medium">
            <NButton type="primary" @click="$router.push({ name: 'assets' })">开始使用</NButton>
            <NButton ghost class="dashboard-page__welcome-btn-ghost" @click="$router.push({ name: 'help' })">查看帮助</NButton>
          </NSpace>
        </div>
      </div>
    </div>

    <template v-else>
      <!-- 上部：4 张统计卡片 -->
      <n-grid cols="4" x-gap="16" y-gap="16" class="dashboard-page__stats">
        <n-grid-item>
          <StatCard
            label="累计已实现盈亏"
            :value="formatSignedMoney(data.totalRealizedPnl)"
            :color="getMoneyColor(data.totalRealizedPnl)"
          />
        </n-grid-item>
        <n-grid-item>
          <StatCard
            label="浮动盈亏"
            :value="formatSignedMoney(data.totalUnrealizedPnl)"
            :color="getMoneyColor(data.totalUnrealizedPnl)"
          />
        </n-grid-item>
        <n-grid-item>
          <StatCard label="持仓标的数" :value="`${data.holdingAssetCount} 个`" />
        </n-grid-item>
        <n-grid-item>
          <StatCard
            label="计划执行率"
            :value="formatPercent(data.planExecutionRate)"
            suffix=""
          />
        </n-grid-item>
      </n-grid>

      <!-- 中部：2 张 ECharts 图表 -->
      <n-grid cols="2" x-gap="16" y-gap="16" class="dashboard-page__charts">
        <n-grid-item>
          <n-card title="近 6 个月盈亏趋势">
            <div style="height: 280px">
              <v-chart :option="pnlTrendOption" autoresize />
            </div>
          </n-card>
        </n-grid-item>
        <n-grid-item>
          <n-card title="当前仓位分布">
            <div style="height: 280px">
              <v-chart :option="positionDistOption" autoresize />
            </div>
          </n-card>
        </n-grid-item>
      </n-grid>

      <!-- 底部：2 张列表 -->
      <n-grid cols="2" x-gap="16" y-gap="16" class="dashboard-page__lists">
        <n-grid-item>
          <n-card title="最近交易">
            <NDataTable
              :columns="recentTradeColumns"
              :data="data.recentTrades"
              :loading="store.isLoading"
              :pagination="false"
              :render-empty="renderEmpty"
              :row-key="getTradeRowKey"
              size="small"
              striped
              :bordered="false"
            />
          </n-card>
        </n-grid-item>
        <n-grid-item>
          <n-card title="活跃计划">
            <NDataTable
              :columns="activePlanColumns"
              :data="data.activePlans"
              :loading="store.isLoading"
              :pagination="false"
              :render-empty="renderEmpty"
              :row-key="getPlanRowKey"
              size="small"
              striped
              :bordered="false"
            />
          </n-card>
        </n-grid-item>
      </n-grid>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  NButton,
  NCard,
  NDataTable,
  NDatePicker,
  NEmpty,
  NFormItem,
  NGi,
  NGrid,
  NGridItem,
  NSpace,
  NTag,
} from 'naive-ui'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import dayjs from 'dayjs'
import { useDashboardStore } from '@/features/dashboard/store'
import StatCard from '@/shared/components/StatCard.vue'
import type { DashboardData, MonthlyPnlPoint, PositionDistItem } from '@/services/dashboard-aggregation.service'
import type { Plan, Trade } from '@/domain/types'
import { PLAN_STATUS_LABELS, PLAN_TYPE_LABELS, TRADE_TYPE_LABELS } from '@/domain/types'
import { fenToYuan, formatPercent, formatSignedMoney, getMoneyColor } from '@/domain/types/financial'

// 注册 ECharts 组件
use([CanvasRenderer, LineChart, PieChart, GridComponent, TooltipComponent, LegendComponent])

const router = useRouter()
const store = useDashboardStore()

// ---- 月份选择器 ----

const selectedMonthTimestamp = computed<number | null>({
  get() {
    if (!store.selectedMonth) {
      return null
    }
    return dayjs(store.selectedMonth + '-01').valueOf()
  },
  set(value: number | null) {
    store.selectedMonth = value ? dayjs(value).format('YYYY-MM') : undefined
  },
})

watch(
  () => store.selectedMonth,
  () => {
    store.loadDashboard(store.selectedMonth)
  },
)

// ---- 空数据默认值 ----

const emptyData: DashboardData = {
  totalRealizedPnl: 0,
  totalUnrealizedPnl: 0,
  holdingAssetCount: 0,
  planExecutionRate: 0,
  monthlyPnlTrend: [],
  positionDistribution: [],
  recentTrades: [],
  activePlans: [],
}

const data = computed(() => store.dashboardData ?? emptyData)

// ---- 错误处理 ----

function showStoreError(): boolean {
  if (store.error) {
    return true
  }
  return false
}

// ---- 生命周期 ----

onMounted(async () => {
  await store.loadDashboard()
  showStoreError()
})

// ---- ECharts：盈亏趋势折线图 ----

const pnlTrendOption = computed(() => {
  const trend = data.value.monthlyPnlTrend

  return {
    tooltip: {
      trigger: 'axis' as const,
      formatter(params: Array<{ seriesName: string; value: number; marker: string; axisValue: string }>): string {
        if (!params.length) return ''
        let result = `${params[0].axisValue}<br/>`
        for (const p of params) {
          result += `${p.marker} ${p.seriesName}：¥${fenToYuan(p.value).toFixed(2)}<br/>`
        }
        return result
      },
    },
    legend: {
      data: ['已实现盈亏', '未实现盈亏'],
      bottom: 0,
    },
    grid: {
      top: 20,
      right: 20,
      bottom: 40,
      left: 60,
    },
    xAxis: {
      type: 'category' as const,
      data: trend.map((p: MonthlyPnlPoint) => p.month),
    },
    yAxis: {
      type: 'value' as const,
      axisLabel: {
        formatter: (val: number): string => `¥${val}`,
      },
    },
    series: [
      {
        name: '已实现盈亏',
        type: 'line' as const,
        data: trend.map((p: MonthlyPnlPoint) => fenToYuan(p.realizedPnl)),
        smooth: true,
        itemStyle: { color: '#1890ff' },
        lineStyle: { width: 2 },
      },
      {
        name: '未实现盈亏',
        type: 'line' as const,
        data: trend.map((p: MonthlyPnlPoint) => (p.hasSnapshot ? fenToYuan(p.unrealizedPnl) : null)),
        smooth: true,
        itemStyle: { color: '#faad14' },
        lineStyle: { width: 2, type: 'dashed' as const },
        connectNulls: true,
      },
    ],
  }
})

// ---- ECharts：仓位分布饼图 ----

const positionDistOption = computed(() => {
  const dist = data.value.positionDistribution

  return {
    tooltip: {
      trigger: 'item' as const,
      formatter: (params: { name: string; percent: number; value: number }): string => {
        return `${params.name}<br/>金额：¥${fenToYuan(params.value).toFixed(2)}<br/>占比：${params.percent}%`
      },
    },
    legend: {
      orient: 'vertical' as const,
      right: 10,
      top: 'center',
    },
    series: [
      {
        type: 'pie' as const,
        radius: ['40%', '70%'],
        center: ['40%', '50%'],
        avoidLabelOverlap: false,
        label: {
          show: true,
          formatter: '{b}: {d}%',
        },
        data: dist.map((item: PositionDistItem) => ({
          name: item.name,
          value: fenToYuan(item.value),
        })),
      },
    ],
  }
})

// ---- NDataTable：最近交易列 ----

const recentTradeColumns = [
  {
    title: '时间',
    key: 'tradeAt',
    width: 150,
    render(row: Trade) {
      return dayjs(row.tradeAt).format('YYYY-MM-DD HH:mm')
    },
  },
  {
    title: '标的',
    key: 'assetCode',
    width: 140,
    render(row: Trade) {
      return row.assetCode && row.assetName ? `${row.assetCode} ${row.assetName}` : '-'
    },
  },
  {
    title: '类型',
    key: 'tradeType',
    width: 80,
    align: 'center' as const,
    render(row: Trade) {
      const isBuy = row.tradeType === 'buy'
      return h(
        NTag,
        {
          bordered: false,
          size: 'small',
          type: isBuy ? ('success' as const) : ('error' as const),
        },
        { default: () => TRADE_TYPE_LABELS[row.tradeType] },
      )
    },
  },
  {
    title: '金额',
    key: 'totalAmount',
    width: 120,
    align: 'right' as const,
    render(row: Trade) {
      return formatSignedMoney(row.totalAmount)
    },
  },
]

function getTradeRowKey(row: Trade): number {
  return row.id
}

// ---- NDataTable：活跃计划列 ----

const planStatusTagType: Record<string, 'success' | 'warning' | 'info' | 'default'> = {
  pending: 'info',
  partial: 'warning',
  completed: 'success',
  canceled: 'default',
}

const activePlanColumns = [
  {
    title: '标的',
    key: 'assetCode',
    width: 140,
    render(row: Plan) {
      return row.assetCode && row.assetName ? `${row.assetCode} ${row.assetName}` : '-'
    },
  },
  {
    title: '类型',
    key: 'planType',
    width: 80,
    align: 'center' as const,
    render(row: Plan) {
      return h(
        NTag,
        { bordered: false, size: 'small' },
        { default: () => PLAN_TYPE_LABELS[row.planType] },
      )
    },
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    align: 'center' as const,
    render(row: Plan) {
      return h(
        NTag,
        {
          bordered: false,
          size: 'small',
          type: planStatusTagType[row.status] ?? ('default' as const),
        },
        { default: () => PLAN_STATUS_LABELS[row.status] },
      )
    },
  },
  {
    title: '到期日',
    key: 'endDate',
    width: 110,
    render(row: Plan) {
      return row.endDate ? dayjs(row.endDate).format('YYYY-MM-DD') : '-'
    },
  },
]

function getPlanRowKey(row: Plan): number {
  return row.id
}

// ---- 空状态渲染 ----

function renderEmpty() {
  return h(NEmpty, { description: '暂无数据' })
}
</script>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dashboard-page__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dashboard-page__title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.dashboard-page__description {
  margin: 4px 0 0;
  color: #6b7280;
  font-size: 14px;
}

.dashboard-page__stats,
.dashboard-page__charts,
.dashboard-page__lists {
  width: 100%;
}

/* 欢迎引导区域 */
.dashboard-page__welcome {
  border-radius: 12px;
  overflow: hidden;
}

.dashboard-page__welcome-bg {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 360px;
  background: linear-gradient(135deg, #1f2937 0%, #111827 40%, #0f172a 100%);
  overflow: hidden;
}

.dashboard-page__welcome-bg::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(16, 185, 129, 0.12) 0%, transparent 50%),
    radial-gradient(circle at 50% 50%, rgba(245, 158, 11, 0.08) 0%, transparent 40%);
}

.dashboard-page__welcome-bg::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: repeating-conic-gradient(
    from 0deg,
    transparent 0deg 89deg,
    rgba(255, 255, 255, 0.01) 89deg 90deg
  );
  animation: welcome-rotate 120s linear infinite;
}

@keyframes welcome-rotate {
  to { transform: rotate(360deg); }
}

.dashboard-page__welcome-content {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 40px;
}

.dashboard-page__welcome-icon {
  font-size: 56px;
  margin-bottom: 16px;
  filter: drop-shadow(0 4px 12px rgba(59, 130, 246, 0.3));
}

.dashboard-page__welcome-title {
  margin: 0 0 8px;
  color: #f9fafb;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.dashboard-page__welcome-desc {
  margin: 0 0 28px;
  color: #9ca3af;
  font-size: 15px;
  line-height: 1.6;
}

.dashboard-page__welcome-btn-ghost {
  color: #e5e7eb !important;
  border-color: rgba(255, 255, 255, 0.25) !important;
}

.dashboard-page__welcome-btn-ghost:hover {
  color: #ffffff !important;
  border-color: rgba(255, 255, 255, 0.5) !important;
}
</style>
