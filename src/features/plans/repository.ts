import { invoke } from '@tauri-apps/api/core'
import type {
  Plan,
  PlanCreatePayload,
  PlanFilter,
  PlanRule,
  PlanStatus,
  PlanUpdatePayload,
} from '@/domain/types'

type PlanRuleCommandPayload = {
  rule_type: PlanRule['ruleType']
  operator: PlanRule['operator']
  value: PlanRule['value']
}

type PlanCreateCommandPayload = {
  asset_id: number
  plan_type: Plan['planType']
  position_percent: Plan['positionPercent']
  start_date: Plan['startDate']
  end_date: Plan['endDate']
  notes: Plan['notes']
  rules?: PlanRuleCommandPayload[]
}

type PlanUpdateCommandPayload = PlanCreateCommandPayload & {
  id: number
  status: PlanStatus
}

type PlanRulePayload = NonNullable<PlanCreatePayload['rules']>[number]

function toRuleCommandPayload(rule: PlanRulePayload): PlanRuleCommandPayload {
  return {
    rule_type: rule.ruleType,
    operator: rule.operator,
    value: rule.value,
  }
}

function toCreateCommandPayload(payload: PlanCreatePayload): PlanCreateCommandPayload {
  return {
    asset_id: payload.assetId,
    plan_type: payload.planType,
    position_percent: payload.positionPercent,
    start_date: payload.startDate,
    end_date: payload.endDate,
    notes: payload.notes,
    rules: payload.rules?.map(toRuleCommandPayload),
  }
}

function toUpdateCommandPayload(payload: PlanUpdatePayload): PlanUpdateCommandPayload {
  return {
    id: payload.id,
    status: payload.status,
    ...toCreateCommandPayload(payload),
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
 * 获取所有交易计划。
 * @returns 交易计划列表
 */
export async function getPlans(): Promise<Plan[]> {
  try {
    return await invoke<Plan[]>('get_plans')
  } catch (error) {
    throw createRepositoryError('获取交易计划失败', error)
  }
}

/**
 * 创建交易计划。
 * @param payload 创建载荷
 * @returns 新创建的交易计划
 */
export async function createPlan(payload: PlanCreatePayload): Promise<Plan> {
  try {
    return await invoke<Plan>('create_plan', {
      payload: toCreateCommandPayload(payload),
    })
  } catch (error) {
    throw createRepositoryError('创建交易计划失败', error)
  }
}

/**
 * 更新交易计划。
 * @param payload 更新载荷
 * @returns 更新后的交易计划
 */
export async function updatePlan(payload: PlanUpdatePayload): Promise<Plan> {
  try {
    return await invoke<Plan>('update_plan', {
      payload: toUpdateCommandPayload(payload),
    })
  } catch (error) {
    throw createRepositoryError('更新交易计划失败', error)
  }
}

/**
 * 删除交易计划。
 * @param id 计划 ID
 */
export async function deletePlan(id: number): Promise<void> {
  try {
    await invoke<void>('delete_plan', { id })
  } catch (error) {
    throw createRepositoryError('删除交易计划失败', error)
  }
}

/**
 * 更新交易计划状态。
 * @param id 计划 ID
 * @param status 新状态
 */
export async function updatePlanStatus(id: number, status: PlanStatus): Promise<void> {
  try {
    await invoke<void>('update_plan_status', { id, status })
  } catch (error) {
    throw createRepositoryError('更新计划状态失败', error)
  }
}

/**
 * 按条件查询交易计划。
 * @param filter 过滤条件
 * @returns 匹配的交易计划列表
 */
export async function queryPlans(filter: PlanFilter): Promise<Plan[]> {
  try {
    return await invoke<Plan[]>('query_plans', {
      keyword: filter.keyword,
      plan_type: filter.planType,
      status: filter.status,
      start_date: filter.startDate,
      end_date: filter.endDate,
    })
  } catch (error) {
    throw createRepositoryError('查询交易计划失败', error)
  }
}

/**
 * 获取计划规则。
 * @param planId 计划 ID
 * @returns 计划规则列表
 */
export async function getPlanRules(planId: number): Promise<PlanRule[]> {
  try {
    return await invoke<PlanRule[]>('get_plan_rules', { plan_id: planId })
  } catch (error) {
    throw createRepositoryError('获取计划规则失败', error)
  }
}
