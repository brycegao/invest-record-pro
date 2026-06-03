/*
 * @Author: brycegao
 * @Github: https://github.com/brycegao
 * @Date: 2026/06/03
 * @Description: 月度报告 Prompt 模板服务
 *
 * Copyright (c) 2026 brycegao
 *
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

import { fenToYuan } from '@/domain/types/financial'

/** 月度复盘输入数据 */
export type MonthlyReviewInput = {
  month: string
  tradeCount: number
  buyCount: number
  sellCount: number
  totalBuyAmount: number
  totalSellAmount: number
  realizedPnl: number
  planExecutionRate: number
  moodDistribution: Record<string, number>
  recentTrades: Array<{ code: string; type: string; amount: number; mood?: string }>
  recentPlans: Array<{ code: string; type: string; status: string }>
}

/** Prompt 版本号 */
export const PROMPT_VERSION = 'v1'

/** MOOD 标签映射 */
const MOOD_LABELS: Record<string, string> = {
  calm: '平静',
  anxious: '焦虑',
  greedy: '贪婪',
  fearful: '恐惧',
  hesitant: '犹豫',
  other: '其他',
  unknown: '未知',
}

/**
 * 月度复盘 System Prompt。
 */
function buildSystemPrompt(month: string): string {
  return `你是一个投资纪律复盘助手，只根据以下投资者在 ${month} 的交易记录、计划执行和情绪数据，生成简洁的月度复盘报告。

边界：
- 不提供买入、卖出、持有建议。
- 不预测行情、指数点位或个股走势。
- 不评价具体标的是否值得投资。
- 只分析执行纪律、情绪模式、规则遵守情况和复盘改进方向。

请生成以下内容（每部分 50-100 字）：
1. 执行评价：是否按计划交易？计划执行率如何？
2. 情绪分析：发现了什么情绪驱动的交易？
3. 行为模式：识别的过度交易、追涨杀跌等模式？
4. 规则改进：针对记录习惯、计划清晰度、仓位纪律的 3 个改进点

输出格式：Markdown`
}

/**
 * 月度复盘 User Prompt。
 */
function buildUserPrompt(data: MonthlyReviewInput): string {
  const lines: string[] = []

  lines.push(`## ${data.month} 月度交易数据\n`)

  // 交易统计
  lines.push(`### 交易统计`)
  lines.push(`- 总交易次数：${data.tradeCount}`)
  lines.push(`- 买入：${data.buyCount} 次，合计 ¥${fenToYuan(data.totalBuyAmount).toFixed(2)}`)
  lines.push(`- 卖出：${data.sellCount} 次，合计 ¥${fenToYuan(data.totalSellAmount).toFixed(2)}`)
  lines.push(`- 已实现盈亏：¥${fenToYuan(data.realizedPnl).toFixed(2)}`)
  lines.push(`- 计划执行率：${(data.planExecutionRate / 100).toFixed(1)}%`)
  lines.push('')

  // 情绪分布
  if (Object.keys(data.moodDistribution).length > 0) {
    lines.push(`### 情绪分布`)
    for (const [mood, count] of Object.entries(data.moodDistribution)) {
      const label = MOOD_LABELS[mood] ?? mood
      lines.push(`- ${label}：${count} 次`)
    }
    lines.push('')
  }

  // 最近交易
  if (data.recentTrades.length > 0) {
    lines.push(`### 最近交易记录`)
    for (const trade of data.recentTrades) {
      const typeLabel = trade.type === 'buy' ? '买入' : '卖出'
      const moodStr = trade.mood ? `（${MOOD_LABELS[trade.mood] ?? trade.mood}）` : ''
      lines.push(
        `- ${trade.code} ${typeLabel} ¥${fenToYuan(trade.amount).toFixed(2)}${moodStr}`,
      )
    }
    lines.push('')
  }

  // 活跃计划
  if (data.recentPlans.length > 0) {
    lines.push(`### 活跃计划`)
    for (const plan of data.recentPlans) {
      const typeLabel = plan.type === 'buy' ? '买入计划' : '卖出计划'
      lines.push(`- ${plan.code} ${typeLabel}（${plan.status}）`)
    }
    lines.push('')
  }

  lines.push('请根据以上数据生成月度复盘报告。')

  return lines.join('\n')
}

/**
 * 构建月度复盘 prompt。
 */
export function buildMonthlyReviewPrompt(data: MonthlyReviewInput): {
  system: string
  prompt: string
} {
  return {
    system: buildSystemPrompt(data.month),
    prompt: buildUserPrompt(data),
  }
}
