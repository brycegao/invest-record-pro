/*
 * @Author: brycegao
 * @Github: https://github.com/brycegao
 * @Date: 2026/06/03
 * @Description: 月度报告 Pinia Store
 *
 * Copyright (c) 2026 brycegao
 *
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { invoke } from '@tauri-apps/api/core'
import type {
  MonthlyReport,
  MonthlyReportCreatePayload,
  MonthlyReportUpdatePayload,
} from '@/domain/types'
import { ollamaService } from '@/services/ollama.service'
import {
  aggregateMonthlyData,
  type MonthlyAggregation,
} from '@/services/monthly-aggregation.service'
import { buildMonthlyReviewPrompt, PROMPT_VERSION } from '@/services/prompt-template.service'
import { createServiceError, getErrorMessage } from '@/shared/utils/error'

// ---- Repository ----

async function getMonthlyReports(): Promise<MonthlyReport[]> {
  try {
    return await invoke<MonthlyReport[]>('get_monthly_reports')
  } catch (error) {
    throw createServiceError('获取月报列表失败', error)
  }
}

async function createMonthlyReport(payload: MonthlyReportCreatePayload): Promise<MonthlyReport> {
  try {
    return await invoke<MonthlyReport>('create_monthly_report', { payload })
  } catch (error) {
    throw createServiceError('创建月报失败', error)
  }
}

async function updateMonthlyReport(payload: MonthlyReportUpdatePayload): Promise<MonthlyReport> {
  try {
    return await invoke<MonthlyReport>('update_monthly_report', { payload })
  } catch (error) {
    throw createServiceError('更新月报失败', error)
  }
}

async function deleteMonthlyReport(id: number): Promise<void> {
  try {
    await invoke('delete_monthly_report', { id })
  } catch (error) {
    throw createServiceError('删除月报失败', error)
  }
}

// ---- Store ----

/**
 * Monthly Reports 模块状态管理。
 */
export const useMonthlyReportsStore = defineStore('monthlyReports', () => {
  const reports = ref<MonthlyReport[]>([])
  const loading = ref(false)
  const generating = ref(false)
  const error = ref<string | null>(null)
  const selectedYear = ref<number>(new Date().getFullYear())

  const isLoading = computed(() => loading.value)
  const hasError = computed(() => !!error.value)

  /**
   * 加载所有月报。
   */
  async function loadReports(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      reports.value = await getMonthlyReports()
    } catch (caughtError) {
      error.value = getErrorMessage(caughtError, '加载月报列表失败')
      console.error('loadReports error:', caughtError)
    } finally {
      loading.value = false
    }
  }

  /**
   * 生成月度报告。
   * 先检查 Ollama 可用性 → 可用则调 AI → 不可用则降级为规则引擎摘要。
   */
  async function generateReport(month: string): Promise<void> {
    generating.value = true
    error.value = null

    try {
      // 聚合月度数据
      const aggregation: MonthlyAggregation = await aggregateMonthlyData(month)

      // 将聚合数据快照存入 inputSnapshotJson
      const inputSnapshotJson = JSON.stringify(aggregation)

      // 尝试使用 Ollama AI 生成
      const ollamaAvailable = await ollamaService.checkAvailable()

      let aiSummary: string
      let modelName: string | null = null
      let durationMs = 0

      if (ollamaAvailable) {
        // 获取可用模型
        const models = await ollamaService.listModels()
        if (models.length > 0) {
          const model = models[0].name
          const startTime = Date.now()

          // 构建 prompt
          const { system, prompt } = buildMonthlyReviewPrompt({
            month,
            tradeCount: aggregation.tradeCount,
            buyCount: aggregation.buyCount,
            sellCount: aggregation.sellCount,
            totalBuyAmount: aggregation.totalBuyAmount,
            totalSellAmount: aggregation.totalSellAmount,
            realizedPnl: aggregation.realizedPnl,
            planExecutionRate: aggregation.planExecutionRate,
            moodDistribution: aggregation.moodDistribution,
            recentTrades: aggregation.recentTrades,
            recentPlans: aggregation.activePlans,
          })

          try {
            const response = await ollamaService.generate({ model, prompt, system })
            aiSummary = response.response.trim()
            modelName = response.model
            durationMs = Date.now() - startTime
          } catch (generateError) {
            console.error('generate monthly report with Ollama error:', generateError)
            aiSummary = buildFallbackSummary(aggregation)
          }
        } else {
          aiSummary = buildFallbackSummary(aggregation)
        }
      } else {
        aiSummary = buildFallbackSummary(aggregation)
      }

      // 保存到数据库
      const payload: MonthlyReportCreatePayload = {
        month,
        inputSnapshotJson,
        aiSummary,
        userEditedSummary: null,
        modelName,
        promptVersion: PROMPT_VERSION,
        generationDurationMs: durationMs,
      }

      const newReport = await createMonthlyReport(payload)
      reports.value.unshift(newReport)
    } catch (caughtError) {
      error.value = getErrorMessage(caughtError, '生成月报失败')
      console.error('generateReport error:', caughtError)
    } finally {
      generating.value = false
    }
  }

  /**
   * 更新月报（用户编辑 AI 内容后保存）。
   */
  async function updateReport(payload: MonthlyReportUpdatePayload): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const updated = await updateMonthlyReport(payload)
      const index = reports.value.findIndex((r) => r.id === updated.id)
      if (index >= 0) {
        reports.value[index] = updated
      }
    } catch (caughtError) {
      error.value = getErrorMessage(caughtError, '更新月报失败')
      console.error('updateReport error:', caughtError)
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除月报。
   */
  async function deleteReport(id: number): Promise<void> {
    loading.value = true
    error.value = null

    try {
      await deleteMonthlyReport(id)
      reports.value = reports.value.filter((r) => r.id !== id)
    } catch (caughtError) {
      error.value = getErrorMessage(caughtError, '删除月报失败')
      console.error('deleteReport error:', caughtError)
    } finally {
      loading.value = false
    }
  }

  /**
   * 设置筛选年份。
   */
  function setYear(year: number): void {
    selectedYear.value = year
  }

  /**
   * 清除错误信息。
   */
  function clearError(): void {
    error.value = null
  }

  return {
    reports,
    loading,
    generating,
    error,
    selectedYear,
    isLoading,
    hasError,
    loadReports,
    generateReport,
    updateReport,
    deleteReport,
    setYear,
    clearError,
  }
})

// ---- 降级摘要生成 ----

function buildFallbackSummary(data: MonthlyAggregation): string {
  const lines: string[] = []
  lines.push(`## ${data.tradeCount === 0 ? '本月无交易' : '月度数据概览'}\n`)

  if (data.tradeCount > 0) {
    lines.push(
      `- **交易统计**：共 ${data.tradeCount} 笔（买入 ${data.buyCount}，卖出 ${data.sellCount}）`,
    )
    lines.push(`- **买入金额**：¥${(data.totalBuyAmount / 100).toFixed(2)}`)
    lines.push(`- **卖出金额**：¥${(data.totalSellAmount / 100).toFixed(2)}`)
    lines.push(`- **计划执行率**：${(data.planExecutionRate / 100).toFixed(1)}%`)

    if (Object.keys(data.moodDistribution).length > 0) {
      const moodParts = Object.entries(data.moodDistribution)
        .map(([mood, count]) => `${mood} ${count} 次`)
        .join('、')
      lines.push(`- **情绪分布**：${moodParts}`)
    }
  } else {
    lines.push('本月没有交易记录，暂无复盘数据。')
  }

  lines.push('')
  lines.push(
    '> ⚠️ 以上为规则引擎自动生成的摘要。如需 AI 深度分析，请确保 Ollama 服务已启动并下载模型。',
  )

  return lines.join('\n')
}
