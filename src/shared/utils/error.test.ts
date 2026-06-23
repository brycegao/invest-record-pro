import { describe, expect, it } from 'vitest'
import { createServiceError, getErrorMessage } from './error'

describe('getErrorMessage', () => {
  it('返回 Error 实例的 message', () => {
    expect(getErrorMessage(new Error('boom'))).toBe('boom')
  })

  it('Error.message 为空字符串时用 fallback', () => {
    expect(getErrorMessage(new Error(''), '兜底')).toBe('兜底')
  })

  it('非空字符串原样返回', () => {
    expect(getErrorMessage('网络错误')).toBe('网络错误')
  })

  it('空字符串用 fallback', () => {
    expect(getErrorMessage('', '兜底')).toBe('兜底')
  })

  it('其他类型用默认 fallback 未知错误', () => {
    expect(getErrorMessage(42)).toBe('未知错误')
    expect(getErrorMessage(null)).toBe('未知错误')
    expect(getErrorMessage(undefined)).toBe('未知错误')
    expect(getErrorMessage({ a: 1 })).toBe('未知错误')
  })

  it('显式 fallback 优先于默认', () => {
    expect(getErrorMessage(42, '自定义')).toBe('自定义')
  })
})

describe('createServiceError', () => {
  it('消息格式为 message: cause,且带 cause 属性', () => {
    const cause = new Error('连接超时')
    const err = createServiceError('获取行情失败', cause)
    expect(err.message).toBe('获取行情失败: 连接超时')
    expect((err as Error & { cause: unknown }).cause).toBe(cause)
  })

  it('cause 为非 Error 时经 getErrorMessage 提取', () => {
    const err = createServiceError('操作失败', '字符串原因')
    expect(err.message).toBe('操作失败: 字符串原因')
  })
})
