/*
 * @Author: brycegao
 * @Github: https://github.com/brycegao
 * @Date: 2026/06/03
 * @Description: 月度报告详情抽屉
 *
 * Copyright (c) 2026 brycegao
 *
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

<template>
  <NDrawer v-model:show="innerShow" :width="800" placement="right">
    <NDrawerContent :title="drawerTitle" closable @close="close">
      <template v-if="report">
        <!-- 统计数据区（一~四） -->
        <n-grid cols="1" x-gap="16" y-gap="16">
          <!-- 一、当月概况 -->
          <n-grid-item>
            <n-card title="一、当月概况" size="small">
              <NDescriptions :column="2" label-placement="left" size="small">
                <NDescriptionsItem label="月份">{{ report.month }}</NDescriptionsItem>
                <NDescriptionsItem label="交易次数">{{ snapshot.tradeCount }} 笔</NDescriptionsItem>
                <NDescriptionsItem label="买入金额">
                  {{ formatMoney(snapshot.totalBuyAmount) }}
                </NDescriptionsItem>
                <NDescriptionsItem label="卖出金额">
                  {{ formatMoney(snapshot.totalSellAmount) }}
                </NDescriptionsItem>
              </NDescriptions>
            </n-card>
          </n-grid-item>

          <!-- 二、交易统计 -->
          <n-grid-item>
            <n-card title="二、交易统计" size="small">
              <NDescriptions :column="2" label-placement="left" size="small">
                <NDescriptionsItem label="买入次数">{{ snapshot.buyCount }} 次</NDescriptionsItem>
                <NDescriptionsItem label="卖出次数">{{ snapshot.sellCount }} 次</NDescriptionsItem>
                <NDescriptionsItem label="总买入金额">
                  {{ formatMoney(snapshot.totalBuyAmount) }}
                </NDescriptionsItem>
                <NDescriptionsItem label="总卖出金额">
                  {{ formatMoney(snapshot.totalSellAmount) }}
                </NDescriptionsItem>
              </NDescriptions>
            </n-card>
          </n-grid-item>

          <!-- 三、纪律执行情况 -->
          <n-grid-item>
            <n-card title="三、纪律执行情况" size="small">
              <NDescriptions :column="1" label-placement="left" size="small">
                <NDescriptionsItem label="计划执行率">
                  <div style="display: flex; align-items: center; gap: 12px; width: 100%">
                    <NProgress
                      type="line"
                      :percentage="snapshot.planExecutionRate / 100"
                      :indicator-placement="'inside'"
                      :show-indicator="true"
                      style="flex: 1"
                    />
                    <span>{{ formatPercent(snapshot.planExecutionRate) }}</span>
                  </div>
                </NDescriptionsItem>
                <NDescriptionsItem label="遵守次数">{{ snapshot.completedPlanCount }}</NDescriptionsItem>
                <NDescriptionsItem label="偏离次数">
                  {{ snapshot.totalActivePlanCount - snapshot.completedPlanCount }}
                </NDescriptionsItem>
              </NDescriptions>
            </n-card>
          </n-grid-item>

          <!-- 四、情绪分析 -->
          <n-grid-item>
            <n-card title="四、情绪分析" size="small">
              <NSpace>
                <NTag
                  v-for="(count, mood) in snapshot.moodDistribution"
                  :key="mood"
                  :type="getMoodTagType(String(mood))"
                  size="medium"
                  :bordered="false"
                >
                  {{ getMoodLabel(String(mood)) }}：{{ count }} 次
                </NTag>
                <NTag v-if="Object.keys(snapshot.moodDistribution).length === 0" size="medium">
                  无情绪记录
                </NTag>
              </NSpace>
            </n-card>
          </n-grid-item>

          <!-- 五、AI 摘要 -->
          <n-grid-item>
            <n-card title="五、AI 分析" size="small">
              <template v-if="report.aiSummary">
                <div class="detail-drawer__markdown-body" v-html="renderedSummary" />
              </template>
              <template v-else>
                <NAlert type="info" title="AI 分析未生成">
                  安装 Ollama 后可自动生成 AI 分析。请前往设置页面配置 Ollama 服务。
                </NAlert>
              </template>
            </n-card>
          </n-grid-item>

          <!-- 六、用户编辑区 -->
          <n-grid-item>
            <n-card title="六、用户补充" size="small">
              <NInput
                v-model:value="userEditContent"
                type="textarea"
                :rows="8"
                placeholder="在此补充或修改内容..."
              />
            </n-card>
          </n-grid-item>

          <!-- 元信息 -->
          <n-grid-item>
            <n-card size="small">
              <NSpace vertical :size="4">
                <span class="detail-drawer__meta">
                  <template v-if="report.modelName">模型：{{ report.modelName }}</template>
                  <template v-if="report.promptVersion">
                    <template v-if="report.modelName"> | </template>
                    Prompt 版本：{{ report.promptVersion }}
                  </template>
                </span>
                <span v-if="report.generationDurationMs > 0" class="detail-drawer__meta">
                  生成耗时：{{ (report.generationDurationMs / 1000).toFixed(1) }}s
                </span>
                <NCollapse>
                  <NCollapseItem title="展开查看输入快照 JSON" name="snapshot">
                    <pre class="detail-drawer__json">{{ formattedSnapshot }}</pre>
                  </NCollapseItem>
                </NCollapse>
              </NSpace>
            </n-card>
          </n-grid-item>
        </n-grid>
      </template>

      <!-- 底部操作栏 (NDrawerContent 的 footer slot) -->
      <template #footer>
        <NSpace v-if="report" justify="end">
          <NButton @click="handleExport">导出 Markdown</NButton>
          <NButton type="primary" :loading="saving" @click="handleSave">保存</NButton>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import DOMPurify from 'dompurify'
import MarkdownIt from 'markdown-it'
import {
  NAlert,
  NButton,
  NCard,
  NCollapse,
  NCollapseItem,
  NDescriptions,
  NDescriptionsItem,
  NDrawer,
  NDrawerContent,
  NInput,
  NProgress,
  NSpace,
  NTag,
} from 'naive-ui'
import type { MonthlyReport } from '@/domain/types'
import { useMonthlyReportsStore } from '@/features/monthly-reports/store'
import { fenToYuan } from '@/domain/types/financial'

type MonthlyAggregationSnapshot = {
  tradeCount: number
  buyCount: number
  sellCount: number
  totalBuyAmount: number
  totalSellAmount: number
  realizedPnl: number
  planExecutionRate: number
  completedPlanCount: number
  totalActivePlanCount: number
  moodDistribution: Record<string, number>
}

const EMPTY_SNAPSHOT: MonthlyAggregationSnapshot = {
  tradeCount: 0,
  buyCount: 0,
  sellCount: 0,
  totalBuyAmount: 0,
  totalSellAmount: 0,
  realizedPnl: 0,
  planExecutionRate: 0,
  completedPlanCount: 0,
  totalActivePlanCount: 0,
  moodDistribution: {},
}

const props = defineProps<{
  show: boolean
  report: MonthlyReport | null
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'saved'): void
}>()

const store = useMonthlyReportsStore()
const md = new MarkdownIt({ html: false, linkify: true, breaks: true })

const innerShow = computed({
  get: () => props.show,
  set: (val: boolean) => emit('update:show', val),
})

const saving = ref(false)
const userEditContent = ref('')

// ---- 数据解析 ----

const snapshot = computed<MonthlyAggregationSnapshot>(() => {
  if (!props.report?.inputSnapshotJson) {
    return EMPTY_SNAPSHOT
  }
  try {
    return { ...EMPTY_SNAPSHOT, ...JSON.parse(props.report.inputSnapshotJson) }
  } catch {
    return EMPTY_SNAPSHOT
  }
})

const renderedSummary = computed(() => {
  const text = props.report?.userEditedSummary ?? props.report?.aiSummary ?? ''
  if (!text) return ''
  const raw = md.render(text)
  return DOMPurify.sanitize(raw)
})

const formattedSnapshot = computed(() => {
  if (!props.report?.inputSnapshotJson) return '{}'
  try {
    return JSON.stringify(JSON.parse(props.report.inputSnapshotJson), null, 2)
  } catch {
    return props.report.inputSnapshotJson
  }
})

const drawerTitle = computed(() => {
  if (!props.report) return '月度报告'
  const parts = props.report.month.split('-')
  return `${parts[0]} 年 ${Number.parseInt(parts[1]!, 10)} 月 — 月度报告`
})

// ---- 同步用户编辑内容 ----

watch(
  () => props.report,
  (report) => {
    userEditContent.value = report?.userEditedSummary ?? ''
  },
  { immediate: true },
)

// ---- 操作 ----

function close(): void {
  innerShow.value = false
}

async function handleSave(): Promise<void> {
  if (!props.report) return
  saving.value = true
  try {
    await store.updateReport({
      id: props.report.id,
      userEditedSummary: userEditContent.value || undefined,
    })
    emit('saved')
    close()
  } finally {
    saving.value = false
  }
}

function handleExport(): void {
  if (!props.report) return
  const lines: string[] = []
  lines.push(`# 月度投资复盘 — ${props.report.month}`)
  lines.push('')
  if (props.report.modelName) {
    lines.push(`> 模型：${props.report.modelName}`)
  }
  if (props.report.promptVersion) {
    lines.push(`> Prompt 版本：${props.report.promptVersion}`)
  }
  if (props.report.generationDurationMs) {
    lines.push(`> 生成耗时：${(props.report.generationDurationMs / 1000).toFixed(1)}s`)
  }
  lines.push('')

  const content = props.report.userEditedSummary ?? props.report.aiSummary ?? ''
  lines.push(content)
  lines.push('')
  lines.push('---')
  lines.push('> 由 Invest Record Pro 生成')

  const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `月报-${props.report.month}.md`
  a.click()
  URL.revokeObjectURL(url)
}

// ---- 格式化 ----

function formatMoney(fen: number): string {
  return `¥${fenToYuan(fen).toFixed(2)}`
}

function formatPercent(basisPoints: number): string {
  return `${(basisPoints / 100).toFixed(1)}%`
}

const MOOD_LABELS: Record<string, string> = {
  calm: '平静',
  anxious: '焦虑',
  greedy: '贪婪',
  fearful: '恐惧',
  hesitant: '犹豫',
  other: '其他',
  unknown: '未知',
}

const MOOD_TAG_TYPES: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  calm: 'success',
  anxious: 'warning',
  greedy: 'error',
  fearful: 'error',
  hesitant: 'info',
  other: 'default',
  unknown: 'default',
}

function getMoodLabel(mood: string): string {
  return MOOD_LABELS[mood] ?? mood
}

function getMoodTagType(mood: string): 'success' | 'warning' | 'error' | 'info' | 'default' {
  return MOOD_TAG_TYPES[mood] ?? ('default' as const)
}
</script>

<style scoped>
.detail-drawer__markdown-body {
  font-size: 14px;
  line-height: 1.8;
  color: #374151;
}

.detail-drawer__markdown-body :deep(h2) {
  font-size: 16px;
  font-weight: 600;
  margin: 16px 0 8px;
}

.detail-drawer__markdown-body :deep(h3) {
  font-size: 15px;
  font-weight: 600;
  margin: 12px 0 6px;
}

.detail-drawer__markdown-body :deep(p) {
  margin: 4px 0;
}

.detail-drawer__markdown-body :deep(ul),
.detail-drawer__markdown-body :deep(ol) {
  padding-left: 20px;
  margin: 4px 0;
}

.detail-drawer__markdown-body :deep(blockquote) {
  border-left: 3px solid #d1d5db;
  padding-left: 12px;
  margin: 8px 0;
  color: #6b7280;
}

.detail-drawer__meta {
  font-size: 13px;
  color: #6b7280;
}

.detail-drawer__json {
  font-size: 12px;
  color: #374151;
  background: #f9fafb;
  padding: 8px;
  border-radius: 4px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 300px;
  overflow-y: auto;
}
</style>
