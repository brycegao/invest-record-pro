/*
 * @Author: brycegao
 * @Github: https://github.com/brycegao
 * @Date: 2026/06/03
 * @Description: dashboard-aggregation.service.ts 模块
 *
 * Copyright (c) 2026 brycegao
 *
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

import { invoke } from '@tauri-apps/api/core'
import dayjs from 'dayjs'
import type {
  Asset,
  AssetType,
  Plan,
  Position,
  PositionItem,
  Trade,
  TradeSummary,
} from '@/domain/types'
import { ASSET_TYPE_LABELS } from '@/domain/types'
import { createServiceError } from '@/shared/utils/error'

/** 月度盈亏趋势数据点 */
export type MonthlyPnlPoint = {
  month: string
  realizedPnl: number
  unrealizedPnl: number
  hasSnapshot: boolean
}

/** 仓位分布项 */
export type PositionDistItem = {
  name: string
  value: number
  percent: number
}

/** 仪表盘聚合数据 */
export type DashboardData = {
  // 统计卡片
  totalRealizedPnl: number
  totalUnrealizedPnl: number
  holdingAssetCount: number
  planExecutionRate: number

  // 图表数据
  monthlyPnlTrend: MonthlyPnlPoint[]
  positionDistribution: PositionDistItem[]

  // 列表数据
  recentTrades: Trade[]
  activePlans: Plan[]
}

// ---- Tauri 命令调用封装 ----

async function getAllAssets(): Promise<Asset[]> {
  try {
    return await invoke<Asset[]>('query_assets', {
      keyword: undefined,
      asset_type: undefined,
      market: undefined,
    })
  } catch (error) {
    throw createServiceError('获取资产列表失败', error)
  }
}

async function getLatestPosition(): Promise<Position | null> {
  try {
    return await invoke<Position | null>('get_latest_position')
  } catch (error) {
    throw createServiceError('获取最新仓位失败', error)
  }
}

async function getPositionItems(positionId: number): Promise<PositionItem[]> {
  try {
    return await invoke<PositionItem[]>('get_position_items', { position_id: positionId })
  } catch (error) {
    throw createServiceError('获取仓位明细失败', error)
  }
}

async function getAllPositions(): Promise<Position[]> {
  try {
    return await invoke<Position[]>('get_positions')
  } catch (error) {
    throw createServiceError('获取仓位列表失败', error)
  }
}

async function getTradeSummaryByAsset(assetId: number): Promise<TradeSummary> {
  try {
    return await invoke<TradeSummary>('get_trade_summary', { asset_id: assetId })
  } catch (error) {
    throw createServiceError('获取交易汇总失败', error)
  }
}

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

async function calculateTotalRealizedPnl(): Promise<number> {
  const assets = await getAllAssets()
  let total = 0

  for (const asset of assets) {
    try {
      const summary = await getTradeSummaryByAsset(asset.id)
      total += summary.realizedPnl
    } catch {
      // 单资产查询失败不影响整体
    }
  }

  return total
}

/**
 * 计算累计已实现盈亏和浮动盈亏。
 * 已实现盈亏来自交易汇总；浮动盈亏来自最新仓位快照。
 */
async function calculatePnlStats(): Promise<{
  totalRealizedPnl: number
  totalUnrealizedPnl: number
}> {
  const [totalRealizedPnl, latest] = await Promise.all([
    calculateTotalRealizedPnl(),
    getLatestPosition(),
  ])

  return {
    totalRealizedPnl,
    totalUnrealizedPnl: latest?.unrealizedPnl ?? 0,
  }
}

/**
 * 计算持仓标的数（交易汇总中 currentQuantity > 0 的标的数量）。
 */
async function calculateHoldingCount(): Promise<number> {
  const assets = await getAllAssets()
  let count = 0

  for (const asset of assets) {
    try {
      const summary = await getTradeSummaryByAsset(asset.id)
      if (summary.currentQuantity > 0) {
        count++
      }
    } catch {
      // 单资产查询失败不影响整体
    }
  }

  return count
}

/**
 * 计算计划执行率。
 * 公式：(completed + 0.5 × partial) / (非 canceled 总数) × 100
 */
function calculatePlanExecutionRate(plans: Plan[]): number {
  const nonCanceled = plans.filter((p) => p.status !== 'canceled')
  if (nonCanceled.length === 0) {
    return 0
  }

  const completedCount = nonCanceled.filter((p) => p.status === 'completed').length
  const partialCount = nonCanceled.filter((p) => p.status === 'partial').length

  return Math.round(((completedCount + 0.5 * partialCount) / nonCanceled.length) * 10000)
}

/**
 * 计算近 6 个月盈亏趋势。
 * 已实现盈亏来自交易汇总；未实现盈亏来自对应月份最新的仓位快照。
 */
async function calculateMonthlyPnlTrend(): Promise<MonthlyPnlPoint[]> {
  const now = dayjs()
  const months: string[] = []

  for (let i = 5; i >= 0; i--) {
    months.push(now.subtract(i, 'month').format('YYYY-MM'))
  }

  // 获取所有仓位快照，按月份分组取每月最新
  const allPositions = await getAllPositions()
  const positionByMonth = new Map<string, Position>()

  for (const position of allPositions) {
    const month = dayjs(position.snapshotAt).format('YYYY-MM')
    const existing = positionByMonth.get(month)
    if (!existing || dayjs(position.snapshotAt).isAfter(dayjs(existing.snapshotAt))) {
      positionByMonth.set(month, position)
    }
  }

  // 计算每个月的已实现盈亏：截止该月末所有卖出的已实现盈亏
  const totalRealizedPnl = await calculateTotalRealizedPnl()

  return months.map((month) => {
    const snapshot = positionByMonth.get(month)

    return {
      month,
      realizedPnl: totalRealizedPnl,
      unrealizedPnl: snapshot ? snapshot.unrealizedPnl : 0,
      hasSnapshot: !!snapshot,
    }
  })
}

/**
 * 计算当前仓位分布（按资产类型分组 + 现金）。
 */
async function calculatePositionDistribution(): Promise<PositionDistItem[]> {
  const latest = await getLatestPosition()
  if (!latest) {
    return []
  }

  const items = await getPositionItems(latest.id)

  // 按 asset type 分组聚合
  const assets = await getAllAssets()
  const assetTypeMap = new Map<number, AssetType>()
  for (const asset of assets) {
    assetTypeMap.set(asset.id, asset.type)
  }

  const typeTotalMap = new Map<string, number>()

  for (const item of items) {
    const assetType = assetTypeMap.get(item.assetId) ?? 'index'
    const label = ASSET_TYPE_LABELS[assetType]
    const current = typeTotalMap.get(label) ?? 0
    typeTotalMap.set(label, current + item.marketValue)
  }

  // 加上现金
  typeTotalMap.set('现金', latest.cash)

  const totalAssets = latest.totalAssets
  if (totalAssets <= 0) {
    return []
  }

  const result: PositionDistItem[] = []
  for (const [name, value] of typeTotalMap) {
    result.push({
      name,
      value,
      percent: Math.round((value / totalAssets) * 10000),
    })
  }

  // 按金额降序排列
  result.sort((a, b) => b.value - a.value)

  return result
}

/**
 * 获取仪表盘所需的所有数据。
 * @param _month 可选月份参数（预留，当前实现为全局最新数据）
 */
export async function getDashboardData(_month?: string): Promise<DashboardData> {
  const [pnlStats, holdingCount, plans, monthlyPnlTrend, positionDist, trades] = await Promise.all([
    calculatePnlStats(),
    calculateHoldingCount(),
    getAllPlans(),
    calculateMonthlyPnlTrend(),
    calculatePositionDistribution(),
    getAllTrades(),
  ])

  // 最近 10 条交易，按时间降序
  const recentTrades = [...trades]
    .sort((a, b) => dayjs(b.tradeAt).valueOf() - dayjs(a.tradeAt).valueOf())
    .slice(0, 10)

  // 最近 5 条活跃计划（非 canceled 且非 completed）
  const activePlans = plans
    .filter((p) => p.status !== 'canceled' && p.status !== 'completed')
    .sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf())
    .slice(0, 5)

  return {
    totalRealizedPnl: pnlStats.totalRealizedPnl,
    totalUnrealizedPnl: pnlStats.totalUnrealizedPnl,
    holdingAssetCount: holdingCount,
    planExecutionRate: calculatePlanExecutionRate(plans),
    monthlyPnlTrend,
    positionDistribution: positionDist,
    recentTrades,
    activePlans,
  }
}
