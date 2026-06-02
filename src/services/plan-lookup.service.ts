import { invoke } from '@tauri-apps/api/core'
import type { Plan, PlanType } from '@/domain/types'
import { PLAN_STATUS_LABELS, PLAN_TYPE_LABELS } from '@/domain/types'

export type PlanLookupOption = {
  label: string
  value: number
}

function toPlanOption(plan: Plan): PlanLookupOption {
  const assetLabel = `${plan.assetCode ?? ''} ${plan.assetName ?? ''}`.trim() || `#${plan.assetId}`

  return {
    label: `${assetLabel} · ${PLAN_TYPE_LABELS[plan.planType]} · ${PLAN_STATUS_LABELS[plan.status]}`,
    value: plan.id,
  }
}

/**
 * 获取指定标的和类型的计划选项。
 * @param assetId 标的 ID
 * @param planType 计划类型
 * @returns 计划选项列表
 */
export async function getPlanOptions(
  assetId: number,
  planType: PlanType,
): Promise<PlanLookupOption[]> {
  const plans = await invoke<Plan[]>('get_plans')

  return plans
    .filter(
      (plan) =>
        plan.assetId === assetId && plan.planType === planType && plan.status !== 'canceled',
    )
    .map(toPlanOption)
}
