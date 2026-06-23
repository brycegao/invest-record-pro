/*
 * @Author: brycegao
 * @Github: https://github.com/brycegao
 * @Date: 2026/06/03
 * @Description: 仓位快照 Pinia Store
 *
 * Copyright (c) 2026 brycegao
 *
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Position, PositionCreatePayload, PositionItem } from '@/domain/types'
import * as repository from './repository'
import { getErrorMessage } from '@/shared/utils/error'

export const usePositionStore = defineStore('positions', () => {
  const positions = ref<Position[]>([])
  const currentPositionItems = ref<PositionItem[]>([])
  const latestPosition = ref<Position | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isLoading = computed(() => loading.value)
  const hasError = computed(() => !!error.value)

  async function loadPositions(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      positions.value = await repository.getPositions()
    } catch (caughtError) {
      error.value = getErrorMessage(caughtError, '加载仓位快照失败')
      console.error('loadPositions error:', caughtError)
    } finally {
      loading.value = false
    }
  }

  async function loadLatestPosition(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      latestPosition.value = await repository.getLatestPosition()
    } catch (caughtError) {
      error.value = getErrorMessage(caughtError, '加载最新仓位失败')
      console.error('loadLatestPosition error:', caughtError)
    } finally {
      loading.value = false
    }
  }

  async function createSnapshot(payload: PositionCreatePayload): Promise<void> {
    loading.value = true
    error.value = null

    try {
      await repository.createPositionSnapshot(payload)
      await loadPositions()
      await loadLatestPosition()
    } catch (caughtError) {
      error.value = getErrorMessage(caughtError, '创建仓位快照失败')
      console.error('createSnapshot error:', caughtError)
    } finally {
      loading.value = false
    }
  }

  async function loadPositionItems(positionId: number): Promise<void> {
    loading.value = true
    error.value = null

    try {
      currentPositionItems.value = await repository.getPositionItems(positionId)
    } catch (caughtError) {
      error.value = getErrorMessage(caughtError, '加载仓位明细失败')
      console.error('loadPositionItems error:', caughtError)
    } finally {
      loading.value = false
    }
  }

  async function deletePosition(id: number): Promise<void> {
    loading.value = true
    error.value = null

    try {
      await repository.deletePosition(id)
      positions.value = positions.value.filter((position) => position.id !== id)
      if (latestPosition.value?.id === id) {
        latestPosition.value = null
        await loadLatestPosition()
      }
    } catch (caughtError) {
      error.value = getErrorMessage(caughtError, '删除仓位快照失败')
      console.error('deletePosition error:', caughtError)
    } finally {
      loading.value = false
    }
  }

  function clearError(): void {
    error.value = null
  }

  return {
    positions,
    currentPositionItems,
    latestPosition,
    loading,
    error,
    isLoading,
    hasError,
    loadPositions,
    loadLatestPosition,
    createSnapshot,
    loadPositionItems,
    deletePosition,
    clearError,
  }
})
