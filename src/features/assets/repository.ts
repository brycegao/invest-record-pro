/*
 * @Author: brycegao
 * @Github: https://github.com/brycegao
 * @Date: 2026/06/03
 * @Description: 投资标的 Tauri IPC 仓库
 *
 * Copyright (c) 2026 brycegao
 *
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

import { invoke } from '@tauri-apps/api/core'
import type { Asset, AssetCreatePayload, AssetFilter, AssetUpdatePayload } from '@/domain/types'

type AssetCommandPayload = {
  code: string
  name: string
  asset_type: Asset['type']
  market: Asset['market']
  risk_level: Asset['riskLevel']
  index_reference: string | null
  logic: string | null
  notes: string | null
}

type AssetUpdateCommandPayload = AssetCommandPayload & {
  id: number
}

function toAssetCommandPayload(payload: AssetCreatePayload): AssetCommandPayload {
  return {
    code: payload.code,
    name: payload.name,
    asset_type: payload.type,
    market: payload.market,
    risk_level: payload.riskLevel,
    index_reference: payload.indexReference,
    logic: payload.logic,
    notes: payload.notes,
  }
}

function toAssetUpdateCommandPayload(asset: AssetUpdatePayload): AssetUpdateCommandPayload {
  return {
    id: asset.id,
    ...toAssetCommandPayload(asset),
  }
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

function createRepositoryError(message: string, cause: unknown): Error {
  return Object.assign(new Error(`${message}: ${getErrorMessage(cause)}`), { cause })
}

/**
 * 获取所有资产。
 * @returns 资产列表
 */
export async function getAssets(): Promise<Asset[]> {
  try {
    return await invoke<Asset[]>('get_assets')
  } catch (error) {
    throw createRepositoryError('获取资产失败', error)
  }
}

/**
 * 创建新资产。
 * @param payload 创建载荷
 * @returns 新创建的资产
 */
export async function createAsset(payload: AssetCreatePayload): Promise<Asset> {
  try {
    return await invoke<Asset>('create_asset', {
      payload: toAssetCommandPayload(payload),
    })
  } catch (error) {
    throw createRepositoryError('创建资产失败', error)
  }
}

/**
 * 更新资产。
 * @param asset 完整资产对象
 * @returns 更新后的资产
 */
export async function updateAsset(asset: AssetUpdatePayload): Promise<Asset> {
  try {
    return await invoke<Asset>('update_asset', {
      payload: toAssetUpdateCommandPayload(asset),
    })
  } catch (error) {
    throw createRepositoryError('更新资产失败', error)
  }
}

/**
 * 删除资产。
 * @param id 资产 ID
 */
export async function deleteAsset(id: number): Promise<void> {
  try {
    await invoke<void>('delete_asset', { id })
  } catch (error) {
    throw createRepositoryError('删除资产失败', error)
  }
}

/**
 * 按条件查询资产。
 * @param filter 过滤条件
 * @returns 匹配的资产列表
 */
export async function queryAssets(filter: AssetFilter): Promise<Asset[]> {
  try {
    return await invoke<Asset[]>('query_assets', {
      keyword: filter.keyword,
      asset_type: filter.type,
      market: filter.market,
    })
  } catch (error) {
    throw createRepositoryError('查询资产失败', error)
  }
}
