-- 迁移版本跟踪表
CREATE TABLE IF NOT EXISTS _migration_version (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);

-- 1. 投资标的
CREATE TABLE IF NOT EXISTS assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  market TEXT DEFAULT 'CN',
  risk_level INTEGER DEFAULT 3,
  index_reference TEXT,
  logic TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(code, market)
);
CREATE INDEX IF NOT EXISTS idx_assets_code ON assets(code);

-- 2. 交易计划
CREATE TABLE IF NOT EXISTS plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id INTEGER NOT NULL,
  plan_type TEXT NOT NULL,
  status TEXT NOT NULL,
  position_percent INTEGER,
  start_date TEXT,
  end_date TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_plans_asset_id ON plans(asset_id);
CREATE INDEX IF NOT EXISTS idx_plans_status ON plans(status);

-- 3. 计划规则
CREATE TABLE IF NOT EXISTS plan_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_id INTEGER NOT NULL,
  rule_type TEXT NOT NULL,
  operator TEXT,
  value TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_plan_rules_plan_id ON plan_rules(plan_id);

-- 4. 交易记录（金额字段全部 INTEGER 存储分）
CREATE TABLE IF NOT EXISTS trades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id INTEGER NOT NULL,
  plan_id INTEGER,
  trade_at TEXT NOT NULL,
  trade_type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price INTEGER NOT NULL,
  total_amount INTEGER NOT NULL,
  fee INTEGER NOT NULL,
  index_point INTEGER,
  reason TEXT,
  follow_plan INTEGER DEFAULT 1,
  mood TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_trades_asset_id ON trades(asset_id);
CREATE INDEX IF NOT EXISTS idx_trades_plan_id ON trades(plan_id);
CREATE INDEX IF NOT EXISTS idx_trades_trade_at ON trades(trade_at);
CREATE INDEX IF NOT EXISTS idx_trades_created_at ON trades(created_at);

-- 5. 仓位快照
CREATE TABLE IF NOT EXISTS positions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  snapshot_at TEXT NOT NULL,
  cash INTEGER NOT NULL,
  total_assets INTEGER NOT NULL,
  unrealized_pnl INTEGER NOT NULL,
  realized_pnl INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_positions_snapshot_at ON positions(snapshot_at);

-- 6. 仓位明细
CREATE TABLE IF NOT EXISTS position_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  position_id INTEGER NOT NULL,
  asset_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  avg_cost INTEGER NOT NULL,
  current_price INTEGER NOT NULL,
  market_value INTEGER NOT NULL,
  unrealized_pnl INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE CASCADE,
  FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_position_items_position_id ON position_items(position_id);

-- 7. 交易复盘
CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trade_id INTEGER NOT NULL,
  result TEXT NOT NULL,
  issue_type TEXT,
  summary TEXT NOT NULL,
  improve TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (trade_id) REFERENCES trades(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_reviews_trade_id ON reviews(trade_id);

-- 8. 市场观察
CREATE TABLE IF NOT EXISTS market_observations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  observe_at TEXT NOT NULL,
  shanghai_index INTEGER,
  sse_50_index INTEGER,
  csi_300_index INTEGER,
  market_turnover INTEGER,
  sentiment TEXT,
  policy_event TEXT,
  macro_note TEXT,
  personal_view TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_market_observations_observe_at ON market_observations(observe_at);

-- 9. 月度报告
CREATE TABLE IF NOT EXISTS monthly_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  month TEXT NOT NULL,
  input_snapshot_json TEXT NOT NULL,
  ai_summary TEXT NOT NULL,
  user_edited_summary TEXT,
  model_name TEXT,
  prompt_version TEXT,
  generation_duration_ms INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(month)
);

-- 10. 系统设置
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
