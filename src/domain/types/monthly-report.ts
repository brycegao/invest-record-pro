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
