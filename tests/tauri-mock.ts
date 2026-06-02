/**
 * Mock data for Tauri invoke calls.
 * Injected via page.addInitScript() before the app loads.
 *
 * Each key is a Tauri command name, value is the mock return data.
 * Commands not listed here will reject with "Command not mocked: xxx".
 */

// ─── Mock Data (TypeScript, for type safety) ───────────────────────────────

export const mockAssets = [
  {
    id: 1,
    code: '510300',
    name: '沪深300ETF',
    type: 'etf',
    market: 'CN',
    riskLevel: 2,
    indexReference: '沪深300',
    logic: null,
    notes: null,
    createdAt: '2026-05-28T08:00:00.000Z',
    updatedAt: '2026-05-28T08:00:00.000Z',
  },
  {
    id: 2,
    code: '510500',
    name: '中证500ETF',
    type: 'etf',
    market: 'CN',
    riskLevel: 3,
    indexReference: '中证500',
    logic: null,
    notes: null,
    createdAt: '2026-05-29T10:00:00.000Z',
    updatedAt: '2026-05-29T10:00:00.000Z',
  },
]

export const mockTrades = [
  {
    id: 1,
    assetId: 1,
    tradeAt: '2026-05-30T09:30:00.000Z',
    tradeType: 'buy',
    price: 3680,
    quantity: 500,
    amount: 1840000,
    fee: 552,
    followPlan: true,
    planId: null,
    mood: 'calm',
    notes: null,
    createdAt: '2026-05-30T09:30:00.000Z',
    updatedAt: '2026-05-30T09:30:00.000Z',
    assetCode: '510300',
    assetName: '沪深300ETF',
  },
]

export const mockPlans = [
  {
    id: 1,
    assetId: 1,
    planType: 'buy',
    targetPrice: 3600,
    quantity: 1000,
    status: 'active',
    startDate: '2026-05-25',
    endDate: '2026-06-30',
    strategy: '跌破3600加仓',
    notes: null,
    createdAt: '2026-05-25T08:00:00.000Z',
    updatedAt: '2026-05-25T08:00:00.000Z',
    assetCode: '510300',
    assetName: '沪深300ETF',
  },
]

export const mockPositions = [
  {
    id: 1,
    snapshotAt: '2026-05-30T20:00:00.000Z',
    cash: 2000000,
    totalAssets: 10000000,
    unrealizedPnl: 500000,
    realizedPnl: 150000,
    createdAt: '2026-05-30T20:00:00.000Z',
    updatedAt: '2026-05-30T20:00:00.000Z',
  },
]

export const mockPositionItems = [
  {
    id: 1,
    positionId: 1,
    assetId: 1,
    quantity: 5000,
    avgCost: 1200,
    currentPrice: 1500,
    marketValue: 750000,
    unrealizedPnl: 150000,
    createdAt: '2026-05-30T20:00:00.000Z',
    updatedAt: '2026-05-30T20:00:00.000Z',
    assetCode: '510300',
    assetName: '沪深300ETF',
  },
]

export const mockReviews = [
  {
    id: 1,
    tradeId: 1,
    result: 'good',
    issueType: 'rule',
    summary: '按照计划买入沪深300，纪律执行良好',
    improve: '可以提前一天挂单',
    createdAt: '2026-06-01T20:00:00.000Z',
    updatedAt: '2026-06-01T20:00:00.000Z',
    tradeAssetCode: '510300',
    tradeAssetName: '沪深300ETF',
    tradeType: 'buy',
    tradeCreatedAt: '2026-05-30T09:30:00.000Z',
  },
]

export const mockMarketObservations = [
  {
    id: 1,
    observeAt: '2026-06-01T15:00:00.000Z',
    shanghaiIndex: 318000,
    sse50Index: 285000,
    csi300Index: 368000,
    marketTurnover: 8500000000,
    sentiment: '中',
    policyEvent: '央行宣布降准50个基点',
    macroNote: '流动性宽松，市场情绪回暖',
    personalView: '看多信号，建议逐步建仓',
    createdAt: '2026-06-01T15:00:00.000Z',
    updatedAt: '2026-06-01T15:00:00.000Z',
  },
  {
    id: 2,
    observeAt: '2026-05-28T15:00:00.000Z',
    shanghaiIndex: 310000,
    sse50Index: 278000,
    csi300Index: 355000,
    marketTurnover: 7200000000,
    sentiment: '低',
    policyEvent: null,
    macroNote: null,
    personalView: '观望为主',
    createdAt: '2026-05-28T15:00:00.000Z',
    updatedAt: '2026-05-28T15:00:00.000Z',
  },
]

// ─── Mock Store (command → return value mapping) ───────────────────────────

/**
 * Default mock responses keyed by Tauri command name.
 * Tests can import and override specific entries before calling createTauriMockScript().
 */
export const defaultMockStore: Record<string, unknown> = {
  // Assets
  get_assets: mockAssets,
  query_assets: mockAssets,
  create_asset: { ...mockAssets[0], id: 99 },
  update_asset: mockAssets[0],
  delete_asset: undefined,

  // Trades
  get_trades: mockTrades,
  query_trades: mockTrades,
  get_trade_summary: {
    assetId: 1,
    assetCode: '510300',
    assetName: '沪深300ETF',
    totalBuyAmount: 1840000,
    totalSellAmount: 0,
    totalBuyQuantity: 500,
    totalSellQuantity: 0,
    currentQuantity: 500,
    avgCost: 3680,
    remainingCost: 1840000,
    realizedPnl: 552,
  },
  create_trade: mockTrades[0],
  update_trade: mockTrades[0],
  delete_trade: undefined,

  // Plans
  get_plans: mockPlans,
  query_plans: mockPlans,
  get_plan_rules: [],
  create_plan: mockPlans[0],
  update_plan: mockPlans[0],
  update_plan_status: undefined,
  delete_plan: undefined,

  // Positions
  get_positions: mockPositions,
  get_latest_position: mockPositions[0],
  get_position_items: mockPositionItems,
  create_position_snapshot: mockPositions[0],
  delete_position: undefined,

  // Reviews
  get_reviews: mockReviews,
  query_reviews: mockReviews,
  create_review: {
    id: 2,
    tradeId: 1,
    result: 'bad',
    issueType: 'emotion',
    summary: '恐慌时加仓，违反纪律',
    improve: null,
    createdAt: '2026-06-02T10:00:00.000Z',
    updatedAt: '2026-06-02T10:00:00.000Z',
    tradeAssetCode: '510300',
    tradeAssetName: '沪深300ETF',
    tradeType: 'buy',
    tradeCreatedAt: '2026-05-30T09:30:00.000Z',
  },
  update_review: mockReviews[0],
  delete_review: undefined,

  // Market Observations
  get_market_observations: mockMarketObservations,
  query_market_observations: mockMarketObservations,
  create_market_observation: mockMarketObservations[0],
  update_market_observation: mockMarketObservations[0],
  delete_market_observation: undefined,
}

// ─── Script Generator ─────────────────────────────────────────────────────

/**
 * Creates a JavaScript string to inject via page.addInitScript().
 * Sets up window.__TAURI_INTERNALS__ to mock Tauri v2 invoke API.
 *
 * @param overrides - Optional partial mock store to merge into defaults
 */
export function createTauriMockScript(overrides?: Record<string, unknown>): string {
  const store = { ...defaultMockStore, ...overrides }
  const serialized = JSON.stringify(store)

  return `
    // ─── Tauri v2 API Mock ─────────────────────────────────────
    (function () {
      const mockStore = ${serialized};

      // Store reference for runtime modification via page.evaluate()
      window.__TAURI_MOCK_STORE__ = mockStore;

      window.__TAURI_INTERNALS__ = {
        // Matches Tauri v2 signature: invoke(cmd, args, options)
        invoke(cmd, args, options) {
          const data = mockStore[cmd];
          if (data !== undefined) {
            return Promise.resolve(data);
          }
          console.warn('[Tauri Mock] Command not mocked:', cmd);
          return Promise.reject(new Error('Command not mocked: ' + cmd));
        },
        transformCallback(callback, once) {
          return 0;
        },
        unregisterCallback(id) {},
        convertFileSrc(filePath, protocol) {
          return filePath;
        },
        metadata: {
          currentWindow: { label: 'main' },
          currentWebview: { windowLabel: 'main', label: 'main' },
        },
        plugins: {
          path: { sep: '/', delimiter: ':' },
        },
      };

      // Required by @tauri-apps/api/event
      window.__TAURI_EVENT_PLUGIN_INTERNALS__ = {};

      console.log('[Tauri Mock] Injected', Object.keys(mockStore).length, 'mock commands');
    })();
  `
}
