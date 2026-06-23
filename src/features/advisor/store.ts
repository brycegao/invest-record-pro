/*
 * @Description: 投顾推荐 Pinia Store
 *
 * 遵循底座 reviews store 模式：用 error ref 暴露错误状态，由组件层处理用户提示，
 * store 内部不依赖 Naive UI。
 */
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type {
  AdvisorSignal,
  AdvisorSignalCreatePayload,
  AdvisorSignalUpdatePayload,
  FollowUp,
  FollowUpUpsertPayload,
} from '@/domain/types'
import * as repository from './repository'

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === 'string' && error) return error
  return fallback
}

export const useAdvisorStore = defineStore('advisor', () => {
  const signals = ref<AdvisorSignal[]>([])
  const followUps = ref<Map<number, FollowUp>>(new Map())
  const loading = ref(false)
  const error = ref<string | null>(null)

  const totalCount = computed(() => signals.value.length)
  const isLoading = computed(() => loading.value)
  const hasError = computed(() => !!error.value)
  const advisors = computed(() => {
    const set = new Set<string>()
    signals.value.forEach((s) => set.add(s.advisor))
    return Array.from(set)
  })

  /**
   * 加载所有推荐信号，并预载每条信号对应的复盘记录。
   */
  async function loadSignals(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      signals.value = await repository.getAdvisorSignals()
      const map = new Map<number, FollowUp>()
      await Promise.all(
        signals.value.map(async (signal) => {
          const fu = await repository.getFollowUp(signal.id)
          if (fu) map.set(signal.id, fu)
        }),
      )
      followUps.value = map
    } catch (caughtError) {
      error.value = getErrorMessage(caughtError, '加载投顾推荐失败')
      console.error('loadSignals error:', caughtError)
    } finally {
      loading.value = false
    }
  }

  /**
   * 创建推荐信号。
   */
  async function createSignal(payload: AdvisorSignalCreatePayload): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const created = await repository.createAdvisorSignal(payload)
      signals.value = [created, ...signals.value]
    } catch (caughtError) {
      error.value = getErrorMessage(caughtError, '创建投顾推荐失败')
      console.error('createSignal error:', caughtError)
      throw caughtError
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新推荐信号。
   */
  async function updateSignal(payload: AdvisorSignalUpdatePayload): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const updated = await repository.updateAdvisorSignal(payload)
      const index = signals.value.findIndex((s) => s.id === updated.id)
      if (index >= 0) signals.value[index] = updated
    } catch (caughtError) {
      error.value = getErrorMessage(caughtError, '更新投顾推荐失败')
      console.error('updateSignal error:', caughtError)
      throw caughtError
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除推荐信号。
   */
  async function removeSignal(id: number): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await repository.deleteAdvisorSignal(id)
      signals.value = signals.value.filter((s) => s.id !== id)
      followUps.value.delete(id)
    } catch (caughtError) {
      error.value = getErrorMessage(caughtError, '删除投顾推荐失败')
      console.error('removeSignal error:', caughtError)
      throw caughtError
    } finally {
      loading.value = false
    }
  }

  /**
   * 创建或更新复盘记录（按 signalId upsert）。
   */
  async function saveFollowUp(payload: FollowUpUpsertPayload): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const saved = await repository.upsertFollowUp(payload)
      followUps.value.set(payload.signalId, saved)
    } catch (caughtError) {
      error.value = getErrorMessage(caughtError, '保存复盘记录失败')
      console.error('saveFollowUp error:', caughtError)
      throw caughtError
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取某条推荐的复盘记录。
   */
  function getFollowUpFor(signalId: number): FollowUp | undefined {
    return followUps.value.get(signalId)
  }

  return {
    signals,
    followUps,
    loading,
    error,
    totalCount,
    isLoading,
    hasError,
    advisors,
    loadSignals,
    createSignal,
    updateSignal,
    removeSignal,
    saveFollowUp,
    getFollowUpFor,
  }
})
