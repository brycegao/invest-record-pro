import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Review, ReviewCreatePayload, ReviewFilter, ReviewUpdatePayload } from '@/domain/types'
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

function normalizeFilters(filters: ReviewFilter): ReviewFilter {
  return {
    keyword: filters.keyword?.trim() || undefined,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
    result: filters.result || undefined,
    issueType: filters.issueType || undefined,
  }
}

/**
 * Reviews 模块状态管理。
 */
export const useReviewStore = defineStore('reviews', () => {
  const reviews = ref<Review[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const filters = ref<ReviewFilter>({
    keyword: '',
    startDate: '',
    endDate: '',
    result: '',
    issueType: '',
  })

  const totalCount = computed(() => reviews.value.length)
  const isLoading = computed(() => loading.value)
  const hasError = computed(() => !!error.value)

  /**
   * 加载所有复盘记录。
   */
  async function loadReviews(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      reviews.value = await repository.getReviews()
    } catch (caughtError) {
      error.value = getErrorMessage(caughtError, '加载复盘记录失败')
      console.error('loadReviews error:', caughtError)
    } finally {
      loading.value = false
    }
  }

  /**
   * 按当前过滤条件搜索复盘记录。
   */
  async function searchReviews(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      reviews.value = await repository.queryReviews(normalizeFilters(filters.value))
    } catch (caughtError) {
      error.value = getErrorMessage(caughtError, '搜索复盘记录失败')
      console.error('searchReviews error:', caughtError)
    } finally {
      loading.value = false
    }
  }

  /**
   * 创建新复盘记录。
   * @param payload 创建载荷
   */
  async function createReview(payload: ReviewCreatePayload): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const newReview = await repository.createReview(payload)
      reviews.value.unshift(newReview)
    } catch (caughtError) {
      error.value = getErrorMessage(caughtError, '创建复盘记录失败')
      console.error('createReview error:', caughtError)
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新复盘记录。
   * @param payload 更新载荷
   */
  async function updateReview(payload: ReviewUpdatePayload): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const updatedReview = await repository.updateReview(payload)
      const index = reviews.value.findIndex((r) => r.id === updatedReview.id)

      if (index >= 0) {
        reviews.value[index] = updatedReview
      }
    } catch (caughtError) {
      error.value = getErrorMessage(caughtError, '更新复盘记录失败')
      console.error('updateReview error:', caughtError)
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除复盘记录。
   * @param id 复盘记录 ID
   */
  async function deleteReview(id: number): Promise<void> {
    loading.value = true
    error.value = null

    try {
      await repository.deleteReview(id)
      reviews.value = reviews.value.filter((r) => r.id !== id)
    } catch (caughtError) {
      error.value = getErrorMessage(caughtError, '删除复盘记录失败')
      console.error('deleteReview error:', caughtError)
    } finally {
      loading.value = false
    }
  }

  /**
   * 设置过滤条件。
   * @param newFilters 新过滤条件
   */
  function setFilters(newFilters: Partial<ReviewFilter>): void {
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
    reviews,
    loading,
    error,
    filters,
    totalCount,
    isLoading,
    hasError,
    loadReviews,
    searchReviews,
    createReview,
    updateReview,
    deleteReview,
    setFilters,
    clearError,
  }
})
