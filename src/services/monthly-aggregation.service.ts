/*
 * @Author: brycegao
 * @Github: https://github.com/brycegao
 * @Date: 2026/06/03
 * @Description: monthly-aggregation.service.ts 模块
 *
 * Copyright (c) 2026 brycegao
 *
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

import { invoke } from '@tauri-apps/api/core'
import dayjs from 'dayjs'
import type { Plan, Trade } from '@/domain/types'
import { TRADE_TYPE_LABELS } from '@/domain/types'

/** 月度聚合数据 */
export type MonthlyAggregation = {
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
  recentTrades: Array<{ code: string; type: string; amount: number; mood?: string }>
  activePlans: Array<{ code: string; type: string; status: string }>
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  return '未知错误'
}

function createServiceError(message: string, cause: unknown): Error {
  return Object.assign(new Error(`${message}: ${getErrorMessage(cause)}`), { cause })
}

// ---- Tauri 命令调用封装 ----

async function getAllTrades(): Promise<Trade[]> {
  try {
    return await invoke<Trade[]>('query_trades', {
      keyword: undefined,
      trade_type: undefined,
      start_date: undefined,
      end_date: undefined,
      follow_plan: undefined,
      mood: undefined,
    })
  } catch (error) {
    throw createServiceError('获取交易列表失败', error)
  }
}

async function getAllPlans(): Promise<Plan[]> {
  try {
    return await invoke<Plan[]>('query_plans', {
      keyword: undefined,
      plan_type: undefined,
      status: undefined,
      start_date: undefined,
      end_date: undefined,
    })
  } catch (error) {
    throw createServiceError('获取计划列表失败', error)
  }
}

// ---- 聚合计算 ----

/**
 * 聚合指定月份的数据。
 * @param month 月份字符串，格式 "YYYY-MM"
 */
export async function aggregateMonthlyData(month: string): Promise<MonthlyAggregation> {
  const [trades, plans] = await Promise.all([getAllTrades(), getAllPlans()])

  // 按月份过滤交易（基于 tradeAt）
  const monthStart = dayjs(`${month}-01`).startOf('month')
  const monthEnd = monthStart.endOf('month')

  const monthTrades = trades.filter((trade) => {
    const tradeAt = dayjs(trade.tradeAt)
    return (tradeAt.isAfter(monthStart) || tradeAt.isSame(monthStart, 'day')) &&
      (tradeAt.isBefore(monthEnd) || tradeAt.isSame(monthEnd, 'day'))
  })

  // 交易统计
  const buyTrades = monthTrades.filter((t) => t.tradeType === 'buy')
  const sellTrades = monthTrades.filter((t) => t.tradeType === 'sell')
  const totalBuyAmount = buyTrades.reduce((sum, t) => sum + t.totalAmount, 0)
  const totalSellAmount = sellTrades.reduce((sum, t) => sum + t.totalAmount, 0)

  // 情绪分布
  const moodDistribution: Record<string, number> = {}
  for (const trade of monthTrades) {
    if (trade.mood) {
      moodDistribution[trade.mood] = (moodDistribution[trade.mood] ?? 0) + 1
    }
  }

  // 最近交易（最多 10 条，按时间降序）
  const recentTrades = [...monthTrades]
    .sort((a, b) => dayjs(b.tradeAt).valueOf() - dayjs(a.tradeAt).valueOf())
    .slice(0, 10)
    .map((t) => ({
      code: t.assetCode ?? '',
      type: TRADE_TYPE_LABELS[t.tradeType],
      amount: t.totalAmount,
      mood: t.mood ?? undefined,
    }))

  // 计划执行率（该月相关的计划）
  const monthPlans = plans.filter((p) => {
    if (!p.createdAt) return false
    const created = dayjs(p.createdAt)
    return created.format('YYYY-MM') === month
  })

  const nonCanceledPlans = monthPlans.filter((p) => p.status !== 'canceled')
  const completedPlans = nonCanceledPlans.filter((p) => p.status === 'completed')
  const partialPlans = nonCanceledPlans.filter((p) => p.status === 'partial')

  const planExecutionRate =
    nonCanceledPlans.length > 0
      ? Math.round(((completedPlans.length + 0.5 * partialPlans.length) / nonCanceledPlans.length) * 10000)
      : 0

  // 活跃计划（非 canceled 且非 completed）
  const activePlans = plans
    .filter((p) => p.status !== 'canceled' && p.status !== 'completed')
    .slice(0, 5)
    .map((p) => ({
      code: p.assetCode ?? '',
      type: p.planType === 'buy' ? '买入' : '卖出',
      status: p.status,
    }))

  return {
    tradeCount: monthTrades.length,
    buyCount: buyTrades.length,
    sellCount: sellTrades.length,
    totalBuyAmount,
    totalSellAmount,
    realizedPnl: 0, // 已实现盈亏需从 position/trade_summary 获取
    planExecutionRate,
    completedPlanCount: completedPlans.length,
    totalActivePlanCount: nonCanceledPlans.length,
    moodDistribution,
    recentTrades,
    activePlans,
  }
}
