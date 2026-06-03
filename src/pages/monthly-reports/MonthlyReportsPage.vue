/*
 * @Author: brycegao
 * @Github: https://github.com/brycegao
 * @Date: 2026/06/03
 * @Description: 月度报告管理页面
 *
 * Copyright (c) 2026 brycegao
 *
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

<template>
  <div class="monthly-reports-page">
    <div class="monthly-reports-page__header">
      <div>
        <h2 class="monthly-reports-page__title">月度报告</h2>
        <p class="monthly-reports-page__description">AI 驱动的月度投资复盘</p>
      </div>
      <NSpace align="center">
        <NSelect
          v-model:value="yearOption"
          :options="yearOptions"
          placeholder="筛选年份"
          style="width: 120px"
        />
        <NButton
          type="primary"
          :loading="store.generating"
          :disabled="store.generating"
          @click="handleGenerate"
        >
          + 生成本月报告
        </NButton>
      </NSpace>
    </div>

    <!-- 错误提示 -->
    <NAlert
      v-if="store.hasError"
      type="error"
      closable
      @close="store.clearError()"
    >
      {{ store.error }}
    </NAlert>

    <!-- 加载中 -->
    <NSpin v-if="store.isLoading" class="monthly-reports-page__spin">
      <div style="height: 200px" />
    </NSpin>

    <!-- 报告列表 -->
    <n-grid v-else cols="1" x-gap="16" y-gap="16">
      <n-grid-item v-for="report in filteredReports" :key="report.id">
        <n-card>
          <div class="monthly-reports-page__card">
            <div class="monthly-reports-page__card-header">
              <div>
                <span class="monthly-reports-page__card-month">
                  {{ formatMonth(report.month) }}
                </span>
                <NTag
                  :type="getStatusTagType(report)"
                  size="small"
                  :bordered="false"
                  style="margin-left: 8px"
                >
                  {{ getStatusLabel(report) }}
                </NTag>
              </div>
              <div class="monthly-reports-page__card-meta">
                <span>{{ formatTime(report.createdAt) }}</span>
                <template v-if="report.modelName">
                  <span style="margin: 0 8px">|</span>
                  <span>模型：{{ report.modelName }}</span>
                </template>
                <template v-if="report.promptVersion">
                  <span style="margin: 0 8px">|</span>
                  <span>Prompt {{ report.promptVersion }}</span>
                </template>
              </div>
            </div>

            <div class="monthly-reports-page__card-body">
              {{ truncateSummary(report) }}
            </div>

            <div class="monthly-reports-page__card-actions">
              <NSpace>
                <NButton size="small" @click="openDetail(report)">查看</NButton>
                <NButton size="small" @click="handleExport(report)">导出</NButton>
                <NPopconfirm @positive-click="handleDelete(report)">
                  <template #trigger>
                    <NButton size="small" type="error" ghost>删除</NButton>
                  </template>
                  确定删除该月报告？
                </NPopconfirm>
              </NSpace>
            </div>
          </div>
        </n-card>
      </n-grid-item>

      <!-- 空状态 -->
      <n-grid-item v-if="filteredReports.length === 0">
        <NCard>
          <NEmpty description="该年暂无月度报告">
            <template #extra>
              <NButton type="primary" @click="handleGenerate">生成 AI 报告</NButton>
            </template>
          </NEmpty>
        </NCard>
      </n-grid-item>
    </n-grid>

    <!-- 详情抽屉 -->
    <MonthlyReportDetailDrawer
      v-model:show="drawerVisible"
      :report="selectedReport"
      @saved="handleDrawerSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import dayjs from 'dayjs'
import {
  NAlert,
  NButton,
  NCard,
  NEmpty,
  NGi,
  NGrid,
  NGridItem,
  NPopconfirm,
  NSelect,
  NSpace,
  NSpin,
  NTag,
} from 'naive-ui'
import { useMessage } from 'naive-ui'
import { useMonthlyReportsStore } from '@/features/monthly-reports/store'
import type { MonthlyReport } from '@/domain/types'
import MonthlyReportDetailDrawer from '@/features/monthly-reports/components/MonthlyReportDetailDrawer.vue'

const message = useMessage()
const store = useMonthlyReportsStore()

const drawerVisible = ref(false)
const selectedReport = ref<MonthlyReport | null>(null)

// ---- 年份筛选 ----

const currentYear = new Date().getFullYear()
const yearOption = ref<number>(currentYear)

const yearOptions = computed(() => {
  const years = new Set<number>()
  for (const report of store.reports) {
    if (report.month) {
      years.add(Number.parseInt(report.month.split('-')[0]!, 10))
    }
  }
  // 默认当前年 ± 2
  for (let y = currentYear - 2; y <= currentYear + 2; y++) {
    years.add(y)
  }
  return Array.from(years)
    .sort((a, b) => b - a)
    .map((y) => ({ label: `${y} 年`, value: y }))
})

const filteredReports = computed(() => {
  return store.reports.filter((r) => {
    if (!r.month) return false
    const year = Number.parseInt(r.month.split('-')[0]!, 10)
    return year === yearOption.value
  })
})

// ---- 生命周期 ----

onMounted(async () => {
  await store.loadReports()
  if (store.hasError) {
    message.error(store.error ?? '加载月报失败')
  }
})

// ---- 操作 ----

async function handleGenerate(): Promise<void> {
  const month = dayjs().format('YYYY-MM')
  await store.generateReport(month)
  if (store.hasError) {
    message.error(store.error ?? '生成报告失败')
  } else {
    message.success('月度报告已生成')
  }
}

function openDetail(report: MonthlyReport): void {
  selectedReport.value = report
  drawerVisible.value = true
}

function handleDrawerSaved(): void {
  // 刷新列表
  store.loadReports()
}

function handleExport(report: MonthlyReport): void {
  const content = buildExportContent(report)
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `月报-${report.month}.md`
  a.click()
  URL.revokeObjectURL(url)
  message.success('已导出 Markdown 文件')
}

async function handleDelete(report: MonthlyReport): Promise<void> {
  await store.deleteReport(report.id)
  message.success('报告已删除')
}

// ---- 格式化 ----

function formatMonth(month: string): string {
  const parts = month.split('-')
  return `${parts[0]} 年 ${Number.parseInt(parts[1]!, 10).toString().padStart(2, '0')} 月`
}

function formatTime(iso: string): string {
  return dayjs(iso).format('YYYY-MM-DD HH:mm')
}

function truncateSummary(report: MonthlyReport): string {
  const text = report.userEditedSummary ?? report.aiSummary ?? ''
  if (!text) return '暂无内容'
  if (text.length > 100) {
    return text.slice(0, 100) + '...'
  }
  return text
}

function getStatusLabel(report: MonthlyReport): string {
  if (!report.aiSummary) return '未生成'
  if (report.userEditedSummary) return '已编辑'
  return '已生成'
}

function getStatusTagType(report: MonthlyReport): 'info' | 'success' | 'warning' {
  if (!report.aiSummary) return 'info'
  if (report.userEditedSummary) return 'warning'
  return 'success'
}

function buildExportContent(report: MonthlyReport): string {
  const lines: string[] = []
  lines.push(`# 月度投资复盘 — ${report.month}`)
  lines.push('')
  if (report.modelName) {
    lines.push(`> 模型：${report.modelName}`)
  }
  if (report.promptVersion) {
    lines.push(`> Prompt 版本：${report.promptVersion}`)
  }
  if (report.generationDurationMs) {
    lines.push(`> 生成耗时：${(report.generationDurationMs / 1000).toFixed(1)}s`)
  }
  lines.push(`> 生成时间：${report.createdAt}`)
  lines.push('')

  const content = report.userEditedSummary ?? report.aiSummary ?? ''
  lines.push(content)

  lines.push('')
  lines.push('---')
  lines.push('> 由 Invest Record Pro 生成')

  return lines.join('\n')
}
</script>

<style scoped>
.monthly-reports-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.monthly-reports-page__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.monthly-reports-page__title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.monthly-reports-page__description {
  margin: 4px 0 0;
  color: #6b7280;
  font-size: 14px;
}

.monthly-reports-page__spin {
  display: flex;
  justify-content: center;
  align-items: center;
}

.monthly-reports-page__card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.monthly-reports-page__card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.monthly-reports-page__card-month {
  font-size: 16px;
  font-weight: 600;
}

.monthly-reports-page__card-meta {
  color: #6b7280;
  font-size: 13px;
}

.monthly-reports-page__card-body {
  color: #374151;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
}

.monthly-reports-page__card-actions {
  display: flex;
  justify-content: flex-end;
}
</style>
