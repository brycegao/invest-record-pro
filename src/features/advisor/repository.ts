/*
 * @Description: 投顾推荐 Tauri IPC 仓库
 *
 * Rust 端的 payload 结构体标了 #[serde(rename_all = "camelCase")]，
 * 因此前端直接发 camelCase 对象，无需转换。
 * invoke 命令名与 src-tauri/src/commands/advisor_commands.rs 的 #[tauri::command] 对齐。
 */
import { invoke } from '@tauri-apps/api/core'
import type {
  AdvisorSignal,
  AdvisorSignalCreatePayload,
  AdvisorSignalUpdatePayload,
  FollowUp,
  FollowUpUpsertPayload,
} from '@/domain/types'
import { createServiceError as createRepositoryError } from '@/shared/utils/error'

/** 获取所有推荐信号（带标的信息），按推荐时间倒序。 */
export async function getAdvisorSignals(): Promise<AdvisorSignal[]> {
  try {
    return await invoke<AdvisorSignal[]>('get_advisor_signals')
  } catch (error) {
    throw createRepositoryError('获取投顾推荐失败', error)
  }
}

export async function createAdvisorSignal(
  payload: AdvisorSignalCreatePayload,
): Promise<AdvisorSignal> {
  try {
    return await invoke<AdvisorSignal>('create_advisor_signal', { payload })
  } catch (error) {
    throw createRepositoryError('创建投顾推荐失败', error)
  }
}

export async function updateAdvisorSignal(
  payload: AdvisorSignalUpdatePayload,
): Promise<AdvisorSignal> {
  try {
    return await invoke<AdvisorSignal>('update_advisor_signal', { payload })
  } catch (error) {
    throw createRepositoryError('更新投顾推荐失败', error)
  }
}

export async function deleteAdvisorSignal(id: number): Promise<void> {
  try {
    await invoke<void>('delete_advisor_signal', { id })
  } catch (error) {
    throw createRepositoryError('删除投顾推荐失败', error)
  }
}

/** 获取某推荐对应的复盘记录（一对一，可能不存在）。 */
export async function getFollowUp(signalId: number): Promise<FollowUp | null> {
  try {
    return await invoke<FollowUp | null>('get_follow_up', { signalId })
  } catch (error) {
    throw createRepositoryError('获取复盘记录失败', error)
  }
}

/** 创建或更新复盘记录（按 signalId upsert）。 */
export async function upsertFollowUp(payload: FollowUpUpsertPayload): Promise<FollowUp> {
  try {
    return await invoke<FollowUp>('upsert_follow_up', { payload })
  } catch (error) {
    throw createRepositoryError('保存复盘记录失败', error)
  }
}

export async function deleteFollowUp(id: number): Promise<void> {
  try {
    await invoke<void>('delete_follow_up', { id })
  } catch (error) {
    throw createRepositoryError('删除复盘记录失败', error)
  }
}

/** 单条推荐的刷新结果 */
export interface RefreshItem {
  signalId: number
  code: string
  success: boolean
  message: string
}

/** 刷新所有推荐信号的后市行情（拉东财日线 → 缓存 → 更新追踪） */
export async function refreshAdvisorMarket(): Promise<RefreshItem[]> {
  try {
    return await invoke<RefreshItem[]>('refresh_advisor_market')
  } catch (error) {
    throw createRepositoryError('刷新行情失败', error)
  }
}

/** 策略统计（按 老师×方向 聚合） */
export interface StrategyStat {
  advisor: string
  direction: 'buy' | 'sell'
  count: number
  avgT1Pct: number | null
  avgT3Pct: number | null
  avgT5Pct: number | null
  avgT10Pct: number | null
  avgT20Pct: number | null
  avgMaxCloseDay: number | null
  avgMinCloseDay: number | null
  t5WinRate: number | null
}

export async function getStrategyStats(): Promise<StrategyStat[]> {
  try {
    return await invoke<StrategyStat[]>('get_strategy_stats')
  } catch (error) {
    throw createRepositoryError('获取策略统计失败', error)
  }
}
