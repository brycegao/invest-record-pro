/*
 * @Author: brycegao
 * @Github: https://github.com/brycegao
 * @Date: 2026/06/03
 * @Description: 投资标的类型定义
 *
 * Copyright (c) 2026 brycegao
 *
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

import type { AssetType, Market, RiskLevel } from './constants'

/** 投资标的 */
export type Asset = {
  id: number
  code: string
  name: string
  type: AssetType
  market: Market
  riskLevel: RiskLevel
  indexReference: string | null
  logic: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

/** 创建资产载荷 */
export type AssetCreatePayload = Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>

/** 更新资产载荷 */
export type AssetUpdatePayload = Omit<Asset, 'createdAt' | 'updatedAt'>

/** 资产过滤条件 */
export type AssetFilter = {
  keyword?: string
  type?: AssetType | ''
  market?: Market | ''
}

/** 资产类型标签映射 */
export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  stock: '股票',
  etf: 'ETF',
  fund: '基金',
  index: '指数',
  bond: '债券',
}

/** 市场标签映射 */
export const MARKET_LABELS: Record<Market, string> = {
  CN: 'A股',
  HK: '港股',
  US: '美股',
}

/** 验证结果 */
export type ValidationResult = {
  valid: boolean
  errors: Record<string, string>
}

/**
 * 验证资产数据。
 * @param asset 待验证的资产创建载荷
 * @returns 验证结果和字段错误
 */
export function validateAsset(asset: Partial<AssetCreatePayload>): ValidationResult {
  const errors: Record<string, string> = {}

  if (!asset.code?.trim()) {
    errors.code = '请输入标的代码'
  } else if (asset.code.length > 20 || /\s/.test(asset.code)) {
    errors.code = '标的代码不能包含空格，且不能超过 20 个字符'
  }

  if (!asset.name?.trim()) {
    errors.name = '请输入标的名称'
  } else if (asset.name.length > 50) {
    errors.name = '标的名称不能超过 50 个字符'
  }

  if (!asset.type) {
    errors.type = '请选择资产类型'
  }

  if (!asset.market) {
    errors.market = '请选择市场'
  }

  if (asset.riskLevel !== undefined && (asset.riskLevel < 1 || asset.riskLevel > 5)) {
    errors.riskLevel = '风险等级必须在 1 到 5 之间'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}
