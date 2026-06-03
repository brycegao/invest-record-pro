/*
 * @Author: brycegao
 * @Github: https://github.com/brycegao
 * @Date: 2026/06/03
 * @Description: 系统设置类型定义
 *
 * Copyright (c) 2026 brycegao
 *
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

/** 系统设置 */
export type Setting = {
  id: number
  key: string
  value: string | null
  createdAt: string
  updatedAt: string
}

/** 设置载荷 */
export type SettingUpsertPayload = {
  key: string
  value: string
}

/** 已知的设置键 */
export const SETTING_KEYS = {
  OLLAMA_URL: 'ollama_url',
  OLLAMA_MODEL: 'ollama_model',
  THEME: 'theme',
  LANGUAGE: 'language',
} as const

/** 主题选项 */
export const THEME_OPTIONS = ['light', 'dark', 'system'] as const
export type ThemeOption = (typeof THEME_OPTIONS)[number]
