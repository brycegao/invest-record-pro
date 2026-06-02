/** 仓位快照 */
export type Position = {
  id: number
  snapshotAt: string
  cash: number
  totalAssets: number
  unrealizedPnl: number
  realizedPnl: number
  createdAt: string
  updatedAt: string
}

/** 仓位明细 */
export type PositionItem = {
  id: number
  positionId: number
  assetId: number
  quantity: number
  avgCost: number
  currentPrice: number
  marketValue: number
  unrealizedPnl: number
  createdAt: string
  updatedAt: string
  assetCode?: string | null
  assetName?: string | null
}

/** 创建快照载荷 */
export type PositionCreatePayload = Omit<Position, 'id' | 'createdAt' | 'updatedAt'> & {
  items: Omit<PositionItem, 'id' | 'positionId' | 'createdAt' | 'updatedAt'>[]
}

/** 创建快照时填写的标的当前价 */
export type PositionAssetPrice = {
  assetId: number
  assetCode: string
  assetName: string
  currentPrice: number
}
