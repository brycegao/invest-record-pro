import type { PlanStatus, PlanType, RuleOperator, RuleType } from './constants'

/** 投资计划 */
export type Plan = {
  id: number
  assetId: number
  planType: PlanType
  status: PlanStatus
  positionPercent: number | null
  startDate: string | null
  endDate: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  assetCode?: string | null
  assetName?: string | null
}

/** 计划规则 */
export type PlanRule = {
  id: number
  planId: number
  ruleType: RuleType
  operator: RuleOperator | null
  value: string | null
  createdAt: string
  updatedAt: string
}

/** 创建计划载荷 */
export type PlanCreatePayload = Omit<Plan, 'id' | 'createdAt' | 'updatedAt'> & {
  rules?: Omit<PlanRule, 'id' | 'planId' | 'createdAt' | 'updatedAt'>[]
}

/** 更新计划载荷 */
export type PlanUpdatePayload = Omit<Plan, 'createdAt' | 'updatedAt'> & {
  rules?: Omit<PlanRule, 'id' | 'planId' | 'createdAt' | 'updatedAt'>[]
}

/** 计划过滤条件 */
export type PlanFilter = {
  keyword?: string
  planType?: PlanType | ''
  status?: PlanStatus | ''
  startDate?: string
  endDate?: string
}

/** 计划状态标签映射 */
export const PLAN_STATUS_LABELS: Record<PlanStatus, string> = {
  pending: '待执行',
  partial: '部分执行',
  completed: '已完成',
  canceled: '已作废',
}

/** 计划类型标签映射 */
export const PLAN_TYPE_LABELS: Record<PlanType, string> = {
  buy: '买入',
  sell: '卖出',
}
