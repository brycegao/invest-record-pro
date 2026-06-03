/*
 * @Author: brycegao
 * @Github: https://github.com/brycegao
 * @Date: 2026/06/03
 * @Description: Ollama 离线 AI 服务封装
 *
 * Copyright (c) 2026 brycegao
 *
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

/** Ollama 模型信息 */
export type OllamaModel = {
  name: string
  model: string
  modified_at: string
  size: number
}

/** Ollama 非流式生成响应 */
export type OllamaResponse = {
  model: string
  response: string
  done: boolean
  total_duration: number
  eval_count: number
}

/** 允许的本机地址 */
const ALLOWED_HOSTS = ['localhost', '127.0.0.1', '[::1]']

/**
 * 校验 URL 是否为本机地址。
 * @param url 待校验的 URL
 * @throws 非 localhost 地址时抛出错误
 */
function validateLoopbackUrl(url: string): void {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new Error('无效的 URL 格式')
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('仅允许 http 或 https 协议')
  }

  if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
    throw new Error(`仅允许本机地址（${ALLOWED_HOSTS.join('、')}），不允许连接远程服务器`)
  }
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string' && error) {
    return error
  }

  return fallback
}

/**
 * Ollama 离线 AI 服务
 * 只使用本地 Ollama API，不涉及任何远程调用
 */
export class OllamaService {
  private baseUrl: string

  constructor(baseUrl: string = 'http://localhost:11434') {
    validateLoopbackUrl(baseUrl)
    this.baseUrl = baseUrl
  }

  /**
   * 更新 base URL。
   * @param url 新的 Ollama 地址
   * @throws 非本机地址时抛出错误
   */
  setBaseUrl(url: string): void {
    validateLoopbackUrl(url)
    this.baseUrl = url
  }

  /**
   * 检查 Ollama 是否可用。
   * GET /api/tags，超时 5 秒
   */
  async checkAvailable(): Promise<boolean> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        signal: controller.signal,
      })
      return response.ok
    } catch {
      return false
    } finally {
      clearTimeout(timeoutId)
    }
  }

  /**
   * 获取可用模型列表。
   * GET /api/tags
   */
  async listModels(): Promise<OllamaModel[]> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`获取模型列表失败（HTTP ${response.status}）`)
      }

      const data = (await response.json()) as { models: OllamaModel[] }
      return data.models
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error('连接 Ollama 超时，请确认 Ollama 服务已启动')
      }
      throw new Error(getErrorMessage(error, '获取模型列表失败'))
    } finally {
      clearTimeout(timeoutId)
    }
  }

  /**
   * 非流式生成。
   * POST /api/generate
   */
  async generate(params: {
    model: string
    prompt: string
    system?: string
  }): Promise<OllamaResponse> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 120000)

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: params.model,
          prompt: params.prompt,
          system: params.system,
          stream: false,
        }),
      })

      if (!response.ok) {
        throw new Error(`AI 生成失败（HTTP ${response.status}）`)
      }

      return (await response.json()) as OllamaResponse
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error('AI 生成超时（120秒），请尝试更小的模型或缩短 prompt')
      }
      throw new Error(getErrorMessage(error, 'AI 生成失败'))
    } finally {
      clearTimeout(timeoutId)
    }
  }
}

/** Ollama 服务单例 */
export const ollamaService = new OllamaService()
