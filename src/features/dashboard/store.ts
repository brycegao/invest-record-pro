import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { DashboardData } from '@/services/dashboard-aggregation.service'
import { getDashboardData } from '@/services/dashboard-aggregation.service'

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message
  }

  if (typeof error === 'string' && error) {
    return error
  }

  return fallback
}

/**
 * Dashboard 模块状态管理。
 */
export const useDashboardStore = defineStore('dashboard', () => {
  const dashboardData = ref<DashboardData | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const selectedMonth = ref<string | undefined>(undefined)

  const isLoading = computed(() => loading.value)
  const hasError = computed(() => !!error.value)
  const isEmpty = computed(() => {
    if (!dashboardData.value) {
      return true
    }
    const data = dashboardData.value
    return (
      data.totalRealizedPnl === 0 &&
      data.totalUnrealizedPnl === 0 &&
      data.holdingAssetCount === 0 &&
      data.recentTrades.length === 0 &&
      data.activePlans.length === 0
    )
  })

  /**
   * 加载仪表盘数据。
   * @param month 可选月份参数
   */
  async function loadDashboard(month?: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      dashboardData.value = await getDashboardData(month)
    } catch (caughtError) {
      error.value = getErrorMessage(caughtError, '加载仪表盘失败')
      console.error('loadDashboard error:', caughtError)
    } finally {
      loading.value = false
    }
  }

  /**
   * 清除错误信息。
   */
  function clearError(): void {
    error.value = null
  }

  return {
    dashboardData,
    loading,
    error,
    selectedMonth,
    isLoading,
    hasError,
    isEmpty,
    loadDashboard,
    clearError,
  }
})
