/*
 * @Author: brycegao
 * @Github: https://github.com/brycegao
 * @Date: 2026/06/03
 * @Description: 金融工具函数 — 分转元、格式化
 *
 * Copyright (c) 2026 brycegao
 *
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

const MONEY_FORMATTER = new Intl.NumberFormat('zh-CN', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
})

const QUANTITY_FORMATTER = new Intl.NumberFormat('zh-CN', {
  maximumFractionDigits: 3,
  minimumFractionDigits: 0,
})

const INDEX_FORMATTER = new Intl.NumberFormat('zh-CN', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
})

/**
 * 安全数值：将 NaN / undefined / null 统一转为 0。
 */
function safeNumber(value: number): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0
  }
  return value
}

/**
 * 分转元（数据库存储 → 前端显示）。
 * @param fen 数据库中的分值
 * @returns 元值
 */
export function fenToYuan(fen: number): number {
  return safeNumber(fen) / 100
}

/**
 * 元转分（前端输入 → 数据库存储）。
 * @param yuan 前端显示的元值
 * @returns 分值
 */
export function yuanToFen(yuan: number): number {
  return Math.round(safeNumber(yuan) * 100)
}

/**
 * 存储数量转显示数量。
 * @param stored 数据库存储值（×1000）
 * @returns 显示数量
 */
export function displayQuantity(stored: number): number {
  return stored / 1000
}

/**
 * 显示数量转存储数量。
 * @param display 显示数量
 * @returns 存储值
 */
export function storeQuantity(display: number): number {
  return Math.round(display * 1000)
}

/**
 * 格式化金额。
 * @param fen 分值
 * @returns 格式化后的金额字符串
 */
export function formatMoney(fen: number): string {
  return `¥${MONEY_FORMATTER.format(fenToYuan(safeNumber(fen)))}`
}

/**
 * 格式化带正负号的金额。
 * @param fen 分值
 * @returns 带符号的金额字符串
 */
export function formatSignedMoney(fen: number): string {
  const value = safeNumber(fen)
  if (value > 0) {
    return `+${formatMoney(value)}`
  }

  if (value < 0) {
    return `-${formatMoney(Math.abs(value))}`
  }

  return formatMoney(0)
}

/**
 * 格式化百分比。
 * @param stored 百分比 ×100 存储
 * @returns 格式化后的百分比字符串
 */
export function formatPercent(stored: number): string {
  return `${(safeNumber(stored) / 100).toFixed(2)}%`
}

/**
 * 格式化数量。
 * @param stored 存储值（×1000）
 * @returns 显示数量字符串
 */
export function formatQuantity(stored: number): string {
  return QUANTITY_FORMATTER.format(displayQuantity(safeNumber(stored)))
}

/**
 * 格式化指数点位。
 * @param stored ×100 存储
 * @returns 显示值字符串
 */
export function formatIndexPoint(stored: number): string {
  return INDEX_FORMATTER.format(safeNumber(stored) / 100)
}

/**
 * 计算总金额。
 * @param priceFen 价格（分）
 * @param quantityInt 数量（×1000 存储）
 * @returns 总金额（分）
 */
export function calculateTotalAmount(priceFen: number, quantityInt: number): number {
  return Math.round((safeNumber(priceFen) * safeNumber(quantityInt)) / 1000)
}

/**
 * 获取金额对应的 CSS 颜色类名。
 * @param fen 金额（分）
 * @returns 颜色类名
 */
export function getMoneyColor(fen: number): string {
  const value = safeNumber(fen)
  if (value > 0) {
    return 'money-positive'
  }

  if (value < 0) {
    return 'money-negative'
  }

  return 'money-zero'
}
