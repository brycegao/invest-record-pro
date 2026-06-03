/*
 * @Author: brycegao
 * @Github: https://github.com/brycegao
 * @Date: 2026/06/03
 * @Description: 月度报告类型定义
 *
 * Copyright (c) 2026 brycegao
 *
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

/** 月度报告 */
export type MonthlyReport = {
  id: number
  month: string
  inputSnapshotJson: string
  aiSummary: string
  userEditedSummary: string | null
  modelName: string | null
  promptVersion: string | null
  generationDurationMs: number
  createdAt: string
  updatedAt: string
}

/** 创建月报载荷 */
export type MonthlyReportCreatePayload = Omit<MonthlyReport, 'id' | 'createdAt' | 'updatedAt'>

/** 更新月报载荷 */
export type MonthlyReportUpdatePayload = {
  id: number
  userEditedSummary?: string
  aiSummary?: string
}
