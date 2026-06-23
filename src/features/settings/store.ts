/*
 * @Author: brycegao
 * @Github: https://github.com/brycegao
 * @Date: 2026/06/03
 * @Description: 设置 Pinia Store — Ollama/主题/数据库操作
 *
 * Copyright (c) 2026 brycegao
 *
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { SettingUpsertPayload, ThemeOption } from '@/domain/types'
import { SETTING_KEYS } from '@/domain/types'
import { ollamaService } from '@/services/ollama.service'
import {
  upsertSetting as upsertSettingRepo,
  getAllSettingsFull,
  getDbPath,
  backupDatabase,
  restoreDatabase,
} from './repository'
import { getErrorMessage } from '@/shared/utils/error'

// ---- Store ----

/**
 * Settings 模块状态管理。
 */
export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<Map<string, string | null>>(new Map())
  const loading = ref(false)
  const error = ref<string | null>(null)
  const ollamaAvailable = ref(false)
  const ollamaUrl = ref('http://localhost:11434')
  const ollamaModel = ref('')
  const dbPath = ref('')
  const currentTheme = ref<ThemeOption>('system')

  const isLoading = computed(() => loading.value)
  const hasError = computed(() => !!error.value)

  /** 获取设置值 */
  function getSettingValue(key: string): string | null {
    return settings.value.get(key) ?? null
  }

  /**
   * 加载所有设置。
   */
  async function loadSettings(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const list = await getAllSettingsFull()
      const map = new Map<string, string | null>()
      for (const item of list) {
        map.set(item.key, item.value)
      }
      settings.value = map

      // 从设置中恢复 Ollama 配置
      const url = map.get(SETTING_KEYS.OLLAMA_URL)
      if (url) {
        ollamaUrl.value = url
        try {
          ollamaService.setBaseUrl(url)
        } catch {
          // URL 无效时忽略，保持默认
        }
      }

      const model = map.get(SETTING_KEYS.OLLAMA_MODEL)
      if (model) {
        ollamaModel.value = model
      }

      // 恢复主题设置
      const theme = map.get(SETTING_KEYS.THEME)
      if (theme === 'light' || theme === 'dark' || theme === 'system') {
        currentTheme.value = theme
      }

      // 加载数据库路径
      dbPath.value = await getDbPath()
    } catch (caughtError) {
      error.value = getErrorMessage(caughtError, '加载设置失败')
      console.error('loadSettings error:', caughtError)
    } finally {
      loading.value = false
    }
  }

  /**
   * 保存单个设置。
   */
  async function saveSetting(payload: SettingUpsertPayload): Promise<void> {
    loading.value = true
    error.value = null

    try {
      await upsertSettingRepo(payload)
      settings.value.set(payload.key, payload.value)
    } catch (caughtError) {
      error.value = getErrorMessage(caughtError, '保存设置失败')
      console.error('saveSetting error:', caughtError)
    } finally {
      loading.value = false
    }
  }

  /**
   * 设置 Ollama URL。
   * 必须通过 localhost 校验，拒绝远程 URL。
   */
  async function setOllamaUrl(url: string): Promise<void> {
    // 校验 URL（与 OllamaService 相同的校验逻辑）
    try {
      ollamaService.setBaseUrl(url)
    } catch (err) {
      error.value = getErrorMessage(err, 'Ollama 地址无效')
      return
    }

    ollamaUrl.value = url
    await saveSetting({ key: SETTING_KEYS.OLLAMA_URL, value: url })

    // URL 变更后重新检查可用性
    await checkOllama()
  }

  /**
   * 设置 Ollama 模型名称。
   */
  async function setOllamaModel(model: string): Promise<void> {
    ollamaModel.value = model
    await saveSetting({ key: SETTING_KEYS.OLLAMA_MODEL, value: model })
  }

  /**
   * 设置主题。
   */
  async function setTheme(theme: ThemeOption): Promise<void> {
    currentTheme.value = theme
    await saveSetting({ key: SETTING_KEYS.THEME, value: theme })
  }

  /**
   * 备份数据库到指定路径。
   */
  async function backup(targetPath: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await backupDatabase(targetPath)
    } catch (caughtError) {
      error.value = getErrorMessage(caughtError, '备份数据库失败')
      throw caughtError
    } finally {
      loading.value = false
    }
  }

  /**
   * 从指定路径恢复数据库。
   */
  async function restore(sourcePath: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await restoreDatabase(sourcePath)
    } catch (caughtError) {
      error.value = getErrorMessage(caughtError, '恢复数据库失败')
      throw caughtError
    } finally {
      loading.value = false
    }
  }

  /**
   * 检查 Ollama 连接状态。
   */
  async function checkOllama(): Promise<boolean> {
    try {
      ollamaAvailable.value = await ollamaService.checkAvailable()
      return ollamaAvailable.value
    } catch {
      ollamaAvailable.value = false
      return false
    }
  }

  /**
   * 清除错误信息。
   */
  function clearError(): void {
    error.value = null
  }

  return {
    settings,
    loading,
    error,
    ollamaAvailable,
    ollamaUrl,
    ollamaModel,
    dbPath,
    currentTheme,
    isLoading,
    hasError,
    getSetting: getSettingValue,
    loadSettings,
    saveSetting,
    setOllamaUrl,
    setOllamaModel,
    setTheme,
    backup,
    restore,
    checkOllama,
    clearError,
  }
})
