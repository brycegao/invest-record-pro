/**
 * 从 unknown 错误中提取人类可读的消息。
 * - Error 实例且 message 非空 → 返回 message
 * - 非空字符串 → 返回该字符串
 * - 其他 → 返回 fallback(默认 '未知错误')
 */
export function getErrorMessage(error: unknown, fallback = '未知错误'): string {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === 'string' && error) return error
  return fallback
}

/**
 * 构造带 cause 的服务错误,消息格式为 `${message}: ${getErrorMessage(cause)}`。
 */
export function createServiceError(message: string, cause: unknown): Error {
  return Object.assign(new Error(`${message}: ${getErrorMessage(cause)}`), { cause })
}
