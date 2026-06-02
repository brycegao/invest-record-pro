import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { invoke } from '@tauri-apps/api/core'
import type { Setting, SettingUpsertPayload } from '@/domain/types'
import { SETTING_KEYS } from '@/domain/types'
import { ollamaService } from '@/services/ollama.service'

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message
  }

  if (typeof error === 'string' && error) {
    return error
  }

  return fallback
}

function createServiceError(message: string, cause: unknown): Error {
  const msg = cause instanceof Error && cause.message ? `${message}: ${cause.message}`
    : typeof cause === 'string' && cause ? `${message}: ${cause}`
    : message
  return Object.assign(new Error(msg), { cause })
}

// ---- Repository ----

async function getAllSettings(): Promise<Setting[]> {
  try {
    return await invoke<Setting[]>('get_settings')
  } catch (error) {
    throw createServiceError('获取设置列表失败', error)
  }
}

async function upsertSetting(payload: SettingUpsertPayload): Promise<void> {
  try {
    await invoke('upsert_setting', { payload })
  } catch (error) {
    throw createServiceError('保存设置失败', error)
  }
}

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

  const isLoading = computed(() => loading.value)
  const hasError = computed(() => !!error.value)

  /** 获取设置值 */
  function getSetting(key: string): string | null {
    return settings.value.get(key) ?? null
  }

  /**
   * 加载所有设置。
   */
  async function loadSettings(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const list = await getAllSettings()
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
      await upsertSetting(payload)
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
    isLoading,
    hasError,
    getSetting,
    loadSettings,
    saveSetting,
    setOllamaUrl,
    setOllamaModel,
    checkOllama,
    clearError,
  }
})
