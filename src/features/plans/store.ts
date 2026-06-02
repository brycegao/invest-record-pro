import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type {
  Plan,
  PlanCreatePayload,
  PlanFilter,
  PlanRule,
  PlanStatus,
  PlanUpdatePayload,
} from '@/domain/types'
import * as repository from './repository'

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message
  }

  if (typeof error === 'string' && error) {
    return error
  }

  return fallback
}

function normalizeFilters(filters: PlanFilter): PlanFilter {
  return {
    keyword: filters.keyword?.trim() || undefined,
    planType: filters.planType || undefined,
    status: filters.status || undefined,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
  }
}

/**
 * Plans 模块状态管理。
 */
export const usePlanStore = defineStore('plans', () => {
  const plans = ref<Plan[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const filters = ref<PlanFilter>({ keyword: '', planType: '', status: '' })
  const currentPlanRules = ref<PlanRule[]>([])

  const totalCount = computed(() => plans.value.length)
  const isLoading = computed(() => loading.value)
  const hasError = computed(() => !!error.value)

  /**
   * 加载所有交易计划。
   */
  async function loadPlans(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      plans.value = await repository.getPlans()
    } catch (caughtError) {
      error.value = getErrorMessage(caughtError, '加载交易计划失败')
      console.error('loadPlans error:', caughtError)
    } finally {
      loading.value = false
    }
  }

  /**
   * 按当前过滤条件搜索交易计划。
   */
  async function searchPlans(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      plans.value = await repository.queryPlans(normalizeFilters(filters.value))
    } catch (caughtError) {
      error.value = getErrorMessage(caughtError, '搜索交易计划失败')
      console.error('searchPlans error:', caughtError)
    } finally {
      loading.value = false
    }
  }

  /**
   * 创建交易计划。
   * @param payload 创建载荷
   */
  async function createPlan(payload: PlanCreatePayload): Promise<void> {
    loading.value = true
    error.value = null

    try {
      await repository.createPlan(payload)
      await loadPlans()
    } catch (caughtError) {
      error.value = getErrorMessage(caughtError, '创建交易计划失败')
      console.error('createPlan error:', caughtError)
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新交易计划。
   * @param payload 更新载荷
   */
  async function updatePlan(payload: PlanUpdatePayload): Promise<void> {
    loading.value = true
    error.value = null

    try {
      await repository.updatePlan(payload)
      await loadPlans()
    } catch (caughtError) {
      error.value = getErrorMessage(caughtError, '更新交易计划失败')
      console.error('updatePlan error:', caughtError)
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除交易计划。
   * @param id 计划 ID
   */
  async function deletePlan(id: number): Promise<void> {
    loading.value = true
    error.value = null

    try {
      await repository.deletePlan(id)
      plans.value = plans.value.filter((plan) => plan.id !== id)
    } catch (caughtError) {
      error.value = getErrorMessage(caughtError, '删除交易计划失败')
      console.error('deletePlan error:', caughtError)
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新交易计划状态。
   * @param id 计划 ID
   * @param status 新状态
   */
  async function updatePlanStatus(id: number, status: PlanStatus): Promise<void> {
    loading.value = true
    error.value = null

    try {
      await repository.updatePlanStatus(id, status)
      await loadPlans()
    } catch (caughtError) {
      error.value = getErrorMessage(caughtError, '更新计划状态失败')
      console.error('updatePlanStatus error:', caughtError)
    } finally {
      loading.value = false
    }
  }

  /**
   * 加载计划规则。
   * @param planId 计划 ID
   */
  async function loadPlanRules(planId: number): Promise<void> {
    loading.value = true
    error.value = null

    try {
      currentPlanRules.value = await repository.getPlanRules(planId)
    } catch (caughtError) {
      error.value = getErrorMessage(caughtError, '加载计划规则失败')
      console.error('loadPlanRules error:', caughtError)
    } finally {
      loading.value = false
    }
  }

  /**
   * 设置过滤条件。
   * @param newFilters 新过滤条件
   */
  function setFilters(newFilters: Partial<PlanFilter>): void {
    filters.value = {
      ...filters.value,
      ...newFilters,
    }
  }

  /**
   * 清除错误信息。
   */
  function clearError(): void {
    error.value = null
  }

  return {
    plans,
    loading,
    error,
    filters,
    currentPlanRules,
    totalCount,
    isLoading,
    hasError,
    loadPlans,
    searchPlans,
    createPlan,
    updatePlan,
    deletePlan,
    updatePlanStatus,
    loadPlanRules,
    setFilters,
    clearError,
  }
})
