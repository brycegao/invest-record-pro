/*
 * @Author: brycegao
 * @Github: https://github.com/brycegao
 * @Date: 2026/06/03
 * @Description: 设置 Tauri IPC 仓库
 *
 * Copyright (c) 2026 brycegao
 *
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

import { invoke } from '@tauri-apps/api/core'
import type { Setting, SettingUpsertPayload } from '@/domain/types'

/**
 * 获取单个设置值。
 */
export async function getSetting(key: string): Promise<string | null> {
  return invoke<string | null>('get_setting', { key })
}

/**
 * 创建或更新设置。
 */
export async function upsertSetting(payload: SettingUpsertPayload): Promise<void> {
  await invoke('upsert_setting', { payload })
}

/**
 * 获取所有设置（完整记录列表）。
 */
export async function getAllSettingsFull(): Promise<Setting[]> {
  return invoke<Setting[]>('get_settings')
}

/**
 * 获取所有设置（key-value 形式）。
 */
export async function getAllSettings(): Promise<Record<string, string | null>> {
  const pairs = await invoke<[string, string | null][]>('get_all_settings')
  const result: Record<string, string | null> = {}
  for (const [key, value] of pairs) {
    result[key] = value
  }
  return result
}

/**
 * 获取数据库文件路径。
 */
export async function getDbPath(): Promise<string> {
  return invoke<string>('get_db_path')
}

/**
 * 备份数据库到指定路径。
 */
export async function backupDatabase(targetPath: string): Promise<void> {
  await invoke('backup_database', { targetPath })
}

/**
 * 从指定路径恢复数据库。
 */
export async function restoreDatabase(sourcePath: string): Promise<void> {
  await invoke('restore_database', { sourcePath })
}

/**
 * 导出标的为 CSV 字符串。
 */
export async function exportAssetsCsv(): Promise<string> {
  return invoke<string>('export_assets_csv')
}

/**
 * 导出交易记录为 CSV 字符串。
 */
export async function exportTradesCsv(): Promise<string> {
  return invoke<string>('export_trades_csv')
}
