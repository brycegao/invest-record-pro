/*
 * @Description: 投顾推荐 Tauri IPC 仓库（camelCase↔snake_case 转换）
 *
 * 前端用 camelCase，Tauri command 用 snake_case，此处负责转换。
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

function toCreateSignalCommandPayload(payload: AdvisorSignalCreatePayload) {
  return {
    advisor: payload.advisor,
    asset_id: payload.assetId,
    direction: payload.direction,
    signal_at: payload.signalAt,
    ref_price: payload.refPrice,
    target_price: payload.targetPrice,
    stop_loss: payload.stopLoss,
    hypothetical_qty: payload.hypotheticalQty,
    note: payload.note,
  }
}

function toUpdateSignalCommandPayload(payload: AdvisorSignalUpdatePayload) {
  return { id: payload.id, ...toCreateSignalCommandPayload(payload) }
}

function toUpsertFollowUpCommandPayload(payload: FollowUpUpsertPayload) {
  return {
    signal_id: payload.signalId,
    followed: payload.followed,
    actual_price: payload.actualPrice,
    actual_qty: payload.actualQty,
    actual_at: payload.actualAt,
    linked_trade_id: payload.linkedTradeId,
    reason: payload.reason,
    range_high: payload.rangeHigh,
    range_low: payload.rangeLow,
    range_end_close: payload.rangeEndClose,
    reviewed_at: payload.reviewedAt,
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return '未知错误'
}

function createRepositoryError(message: string, cause: unknown): Error {
  return Object.assign(new Error(`${message}: ${getErrorMessage(cause)}`), { cause })
}

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
    return await invoke<AdvisorSignal>('create_advisor_signal', {
      payload: toCreateSignalCommandPayload(payload),
    })
  } catch (error) {
    throw createRepositoryError('创建投顾推荐失败', error)
  }
}

export async function updateAdvisorSignal(
  payload: AdvisorSignalUpdatePayload,
): Promise<AdvisorSignal> {
  try {
    return await invoke<AdvisorSignal>('update_advisor_signal', {
      payload: toUpdateSignalCommandPayload(payload),
    })
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
    return await invoke<FollowUp>('upsert_follow_up', {
      payload: toUpsertFollowUpCommandPayload(payload),
    })
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
