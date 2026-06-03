/*
 * @Author: brycegao
 * @Github: https://github.com/brycegao
 * @Date: 2026/06/03
 * @Description: asset-lookup.service.ts 模块
 *
 * Copyright (c) 2026 brycegao
 *
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

import { invoke } from '@tauri-apps/api/core'
import type { Asset } from '@/domain/types'

export type AssetLookupOption = {
  label: string
  value: number
}

function toAssetOption(asset: Asset): AssetLookupOption {
  return {
    label: `${asset.code} ${asset.name}`,
    value: asset.id,
  }
}

/**
 * 搜索资产下拉选项。
 * @param keyword 代码或名称关键词
 * @returns 资产选项列表
 */
export async function searchAssetOptions(keyword = ''): Promise<AssetLookupOption[]> {
  const assets = await invoke<Asset[]>('query_assets', {
    keyword,
    asset_type: undefined,
    market: undefined,
  })

  return assets.map(toAssetOption)
}
