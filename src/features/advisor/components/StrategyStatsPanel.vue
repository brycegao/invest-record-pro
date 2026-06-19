<!--
  @Description: 投顾策略统计面板 — 按 老师×方向 聚合，展示「买入/卖出后通常几天见涨见顶」
-->
<template>
  <NCard title="策略统计" size="small" class="advisor-strategy">
    <template #header-extra>
      <NSpace align="center" :size="8">
        <NText depth="3" style="font-size: 12px">基于已复盘推荐的后市行情聚合</NText>
        <NButton size="small" type="primary" ghost :loading="refreshing" @click="handleRefresh">
          刷新行情
        </NButton>
      </NSpace>
    </template>

    <NEmpty v-if="!stats.length && !refreshing" description="暂无统计，先录入推荐并复盘后点「刷新行情」" />

    <div v-else class="advisor-strategy__grid">
      <div v-for="s in stats" :key="`${s.advisor}-${s.direction}`" class="advisor-strategy__item">
        <div class="advisor-strategy__head">
          <span class="advisor-strategy__advisor">{{ s.advisor }}</span>
          <NTag size="small" :type="s.direction === 'buy' ? 'error' : 'success'">
            {{ s.direction === 'buy' ? '买入推荐' : '卖出推荐' }}
          </NTag>
          <NText depth="3" style="font-size: 12px">{{ s.count }} 条</NText>
        </div>
        <div class="advisor-strategy__row">
          <span>T+1 均幅</span><b :class="pctClass(s.avgT1Pct)">{{ pctText(s.avgT1Pct) }}</b>
          <span>T+3 均幅</span><b :class="pctClass(s.avgT3Pct)">{{ pctText(s.avgT3Pct) }}</b>
          <span>T+5 均幅</span><b :class="pctClass(s.avgT5Pct)">{{ pctText(s.avgT5Pct) }}</b>
          <span>T+10 均幅</span><b :class="pctClass(s.avgT10Pct)">{{ pctText(s.avgT10Pct) }}</b>
          <span>T+20 均幅</span><b :class="pctClass(s.avgT20Pct)">{{ pctText(s.avgT20Pct) }}</b>
        </div>
        <div class="advisor-strategy__row">
          <span>平均见顶</span><b>{{ dayText(s.avgMaxCloseDay) }}</b>
          <span>平均见底</span><b>{{ dayText(s.avgMinCloseDay) }}</b>
          <span>T+5 胜率</span><b :class="rateClass(s.t5WinRate)">{{ rateText(s.t5WinRate) }}</b>
        </div>
      </div>
    </div>
  </NCard>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NButton, NCard, NEmpty, NSpace, NTag, NText, useMessage } from 'naive-ui'
import {
  getStrategyStats,
  refreshAdvisorMarket,
  type StrategyStat,
} from '../repository'

const message = useMessage()
const stats = ref<StrategyStat[]>([])
const refreshing = ref(false)

void loadStats()

async function loadStats(): Promise<void> {
  try {
    stats.value = await getStrategyStats()
  } catch {
    // 暂无数据时静默
  }
}

async function handleRefresh(): Promise<void> {
  refreshing.value = true
  try {
    const items = await refreshAdvisorMarket()
    const ok = items.filter((i) => i.success).length
    const fail = items.length - ok
    if (items.length === 0) {
      message.info('没有推荐信号需要刷新')
    } else {
      message.success(`已刷新 ${ok} 条${fail ? `，失败 ${fail} 条` : ''}`)
    }
    await loadStats()
  } catch (e) {
    message.error(e instanceof Error ? e.message : '刷新失败')
  } finally {
    refreshing.value = false
  }
}

function pctText(v: number | null): string {
  if (v == null) return '—'
  return `${(v * 100).toFixed(2)}%`
}
function pctClass(v: number | null): string {
  if (v == null) return ''
  return v >= 0 ? 'pos' : 'neg'
}
function dayText(v: number | null): string {
  if (v == null) return '—'
  return `第 ${v.toFixed(1)} 天`
}
function rateText(v: number | null): string {
  if (v == null) return '—'
  return `${(v * 100).toFixed(0)}%`
}
function rateClass(v: number | null): string {
  if (v == null) return ''
  return v >= 0.5 ? 'pos' : 'neg'
}
</script>

<style scoped>
.advisor-strategy {
  margin-bottom: 16px;
}
.advisor-strategy__grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.advisor-strategy__item {
  padding: 10px 12px;
  background: #fafafa;
  border-radius: 6px;
}
.advisor-strategy__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.advisor-strategy__advisor {
  font-weight: 600;
  font-size: 15px;
}
.advisor-strategy__row {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 4px 12px;
  font-size: 13px;
  align-items: center;
  margin-top: 4px;
}
.advisor-strategy__row span {
  color: #888;
}
.advisor-strategy__row b {
  font-weight: 600;
}
.pos { color: #e74c3c; }
.neg { color: #27ae60; }
</style>
