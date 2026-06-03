/*
 * @Author: brycegao
 * @Github: https://github.com/brycegao
 * @Date: 2026/06/03
 * @Description: Tauri IPC Mock 数据与脚本生成
 *
 * Copyright (c) 2026 brycegao
 *
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

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
    planId: null,
    tradeAt: '2026-05-30T09:30:00.000Z',
    tradeType: 'buy',
    quantity: 500,
    price: 3680,
    totalAmount: 1840000,
    fee: 552,
    indexPoint: null,
    reason: null,
    followPlan: true,
    mood: 'calm',
    notes: null,
    createdAt: '2026-05-30T09:30:00.000Z',
    updatedAt: '2026-05-30T09:30:00.000Z',
    assetCode: '510300',
    assetName: '沪深300ETF',
    planStatus: null,
    realizedPnl: null,
  },
  {
    id: 2,
    assetId: 2,
    planId: null,
    tradeAt: '2026-06-01T10:00:00.000Z',
    tradeType: 'buy',
    quantity: 300,
    price: 6200,
    totalAmount: 1860000,
    fee: 558,
    indexPoint: null,
    reason: null,
    followPlan: false,
    mood: 'anxious',
    notes: '追高买入',
    createdAt: '2026-06-01T10:00:00.000Z',
    updatedAt: '2026-06-01T10:00:00.000Z',
    assetCode: '510500',
    assetName: '中证500ETF',
    planStatus: null,
    realizedPnl: null,
  },
]

export const mockPlans = [
  {
    id: 1,
    assetId: 1,
    planType: 'buy',
    status: 'pending',
    positionPercent: null,
    startDate: '2026-05-25',
    endDate: '2026-06-30',
    notes: '跌破3600加仓',
    createdAt: '2026-05-25T08:00:00.000Z',
    updatedAt: '2026-05-25T08:00:00.000Z',
    assetCode: '510300',
    assetName: '沪深300ETF',
  },
  {
    id: 2,
    assetId: 2,
    planType: 'sell',
    status: 'partial',
    positionPercent: 50,
    startDate: '2026-06-01',
    endDate: '2026-07-15',
    notes: '反弹至6800减仓一半',
    createdAt: '2026-06-01T08:00:00.000Z',
    updatedAt: '2026-06-01T08:00:00.000Z',
    assetCode: '510500',
    assetName: '中证500ETF',
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

export const mockMonthlyReports = [
  {
    id: 1,
    month: '2026-05',
    inputSnapshotJson: JSON.stringify({
      tradeCount: 3,
      buyCount: 2,
      sellCount: 1,
      totalBuyAmount: 500000,
      totalSellAmount: 200000,
      realizedPnl: 50000,
      planExecutionRate: 7500,
      completedPlanCount: 1,
      totalActivePlanCount: 2,
      moodDistribution: { calm: 2, anxious: 1 },
      recentTrades: [
        { code: '510300', type: '买入', amount: 300000, mood: 'calm' },
      ],
      activePlans: [
        { code: '510300', type: 'buy', status: 'pending' },
      ],
    }),
    aiSummary: '## 2026-05 月度复盘\n\n### 执行评价\n本月执行纪律较好...\n\n### 情绪分析\n情绪整体平稳...\n\n### 行为模式\n未发现明显追涨杀跌...\n\n### 规则改进\n1. 加强计划制定 2. 控制单笔仓位 3. 记录交易理由',
    userEditedSummary: null,
    modelName: 'qwen2.5:7b',
    promptVersion: 'v1',
    generationDurationMs: 12300,
    createdAt: '2026-05-31T22:30:00.000Z',
    updatedAt: '2026-05-31T22:30:00.000Z',
  },
  {
    id: 2,
    month: '2026-04',
    inputSnapshotJson: JSON.stringify({
      tradeCount: 1,
      buyCount: 1,
      sellCount: 0,
      totalBuyAmount: 184000,
      totalSellAmount: 0,
      realizedPnl: 0,
      planExecutionRate: 5000,
      completedPlanCount: 0,
      totalActivePlanCount: 1,
      moodDistribution: { calm: 1 },
      recentTrades: [],
      activePlans: [],
    }),
    aiSummary: '## 2026-04 月度复盘\n\n本月仅有1笔买入交易，整体操作较少。',
    userEditedSummary: null,
    modelName: null,
    promptVersion: null,
    generationDurationMs: 0,
    createdAt: '2026-04-30T18:00:00.000Z',
    updatedAt: '2026-04-30T18:00:00.000Z',
  },
]

export const mockMonthlyReportCreated = {
  id: 3,
  month: '2026-06',
  inputSnapshotJson: JSON.stringify({
    tradeCount: 0,
    buyCount: 0,
    sellCount: 0,
    totalBuyAmount: 0,
    totalSellAmount: 0,
    realizedPnl: 0,
    planExecutionRate: 0,
    completedPlanCount: 0,
    totalActivePlanCount: 0,
    moodDistribution: {},
    recentTrades: [],
    activePlans: [],
  }),
  aiSummary: '## 2026-06 月度数据概览\n\n- **交易统计**：共 0 笔（买入 0，卖出 0）\n- **买入金额**：¥0.00\n- **卖出金额**：¥0.00\n- **计划执行率**：0.0%\n\n> ⚠️ 以上为规则引擎自动生成的摘要。',
  userEditedSummary: null,
  modelName: null,
  promptVersion: 'v1',
  generationDurationMs: 0,
  createdAt: '2026-06-03T12:00:00.000Z',
  updatedAt: '2026-06-03T12:00:00.000Z',
}

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

  // Settings
  get_settings: [
    { id: 1, key: 'ollama_url', value: 'http://localhost:11434', createdAt: '2026-06-01T00:00:00.000Z', updatedAt: '2026-06-01T00:00:00.000Z' },
    { id: 2, key: 'ollama_model', value: 'qwen2.5:7b', createdAt: '2026-06-01T00:00:00.000Z', updatedAt: '2026-06-01T00:00:00.000Z' },
    { id: 3, key: 'theme', value: 'system', createdAt: '2026-06-01T00:00:00.000Z', updatedAt: '2026-06-01T00:00:00.000Z' },
  ],
  get_setting: 'http://localhost:11434',
  get_all_settings: [
    ['ollama_url', 'http://localhost:11434'],
    ['ollama_model', 'qwen2.5:7b'],
    ['theme', 'system'],
  ],
  upsert_setting: undefined,
  get_db_path: '/Users/test/invest-record-pro/data.db',
  backup_database: undefined,
  restore_database: undefined,
  export_assets_csv: '\u{FEFF}代码,名称,类型,市场,风险等级,投资逻辑,创建时间\n510300,沪深300ETF,etf,CN,2,,2026-05-28T08:00:00.000Z\n510500,中证500ETF,etf,CN,3,,2026-05-29T10:00:00.000Z\n',
  export_trades_csv: '\u{FEFF}成交时间,标的,类型,价格,数量,总金额,手续费,情绪,遵守计划\n2026-05-30T09:30:00.000Z,510300,买入,3.680,500,1840.00,0.55,calm,是\n2026-06-01T10:00:00.000Z,510500,买入,6.200,300,1860.00,0.56,anxious,否\n',

  // Monthly Reports
  get_monthly_reports: mockMonthlyReports,
  get_monthly_report: mockMonthlyReports[0],
  create_monthly_report: mockMonthlyReportCreated,
  update_monthly_report: mockMonthlyReports[0],
  delete_monthly_report: undefined,
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
