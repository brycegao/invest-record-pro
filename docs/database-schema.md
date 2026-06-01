# invest-record-pro 数据库设计

版本：v1.0.0
数据库：SQLite（纯本地文件）

## 存储规则

| 类别 | 存储方式 | 说明 |
|------|----------|------|
| 金额 | INTEGER（分） | 价格 ×100、金额 ×100，避免浮点错误 |
| 数量 | INTEGER（千分之一） | ×1000 存储（支持三位小数） |
| 百分比 | INTEGER（百分之一） | ×100 存储（如 30% → 3000） |
| 指数点位 | INTEGER（百分之一） | ×100 存储 |
| 日期时间 | TEXT (ISO 8601) | 精确到毫秒，如 `2026-06-01T10:30:00.000+08:00` |

**禁止使用 `REAL` / `FLOAT`。所有金额、价格、数量、百分比、指数点位一律使用 INTEGER 存储。**

## 通用约定

- 每张表必须包含 `id INTEGER PRIMARY KEY AUTOINCREMENT`
- 每张表必须包含 `created_at TEXT NOT NULL` 和 `updated_at TEXT NOT NULL`
- 外键删除策略：主业务数据使用 `ON DELETE CASCADE`，可选关联使用 `ON DELETE SET NULL`
- 所有结构变更必须走迁移文件

## ER 关系

```text
assets 1──N plans
plans   1──N plan_rules
assets  1──N trades
plans   1──N trades（可选关联）
trades  1──N reviews
positions 1──N position_items
assets  1──N position_items

market_observations  （独立）
monthly_reports      （独立）
settings             （独立，key-value）
```

## 迁移策略

- 迁移文件目录：`src-tauri/migrations/`
- 版本命名：`0001_initial.sql`, `0002_xxx.sql`
- 应用启动时自动执行未执行的迁移
- 通过 `_migration_version` 表跟踪已执行的版本

```sql
CREATE TABLE IF NOT EXISTS _migration_version (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);
```

## 表结构

### 1. assets（投资标的）

```sql
CREATE TABLE assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL,                    -- 标的代码（600036、510300）
  name TEXT NOT NULL,                    -- 标的名称
  type TEXT NOT NULL,                    -- 类型：stock / etf / fund / index / bond
  market TEXT DEFAULT 'CN',              -- 市场：CN / HK / US
  risk_level INTEGER DEFAULT 3,          -- 风险等级 1-5
  index_reference TEXT,                  -- 跟踪指数
  logic TEXT,                            -- 投资逻辑
  notes TEXT,                            -- 备注
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(code, market)
);

CREATE INDEX idx_assets_code ON assets(code);
```

### 2. plans（投资计划）

```sql
CREATE TABLE plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id INTEGER NOT NULL,             -- 关联标的
  plan_type TEXT NOT NULL,               -- buy / sell
  status TEXT NOT NULL,                  -- pending / partial / completed / canceled
  position_percent INTEGER,              -- 计划仓位百分比 ×100 存储
  start_date TEXT,                       -- 开始日期
  end_date TEXT,                         -- 到期日
  notes TEXT,                            -- 计划说明
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
);

CREATE INDEX idx_plans_asset_id ON plans(asset_id);
CREATE INDEX idx_plans_status ON plans(status);
```

### 3. plan_rules（计划规则）

```sql
CREATE TABLE plan_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_id INTEGER NOT NULL,
  rule_type TEXT NOT NULL,               -- price / index / volume / time
  operator TEXT,                         -- > < >= <= ==
  value TEXT,                            -- 规则值
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE
);

CREATE INDEX idx_plan_rules_plan_id ON plan_rules(plan_id);
```

### 4. trades（交易记录）

金额字段全部使用 INTEGER 存储分：

```sql
CREATE TABLE trades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id INTEGER NOT NULL,
  plan_id INTEGER,                       -- 关联计划（可为空）
  trade_type TEXT NOT NULL,              -- buy / sell
  quantity INTEGER NOT NULL,             -- 数量 ×1000 存储（三位小数）
  price INTEGER NOT NULL,                -- 价格 ×100 存储
  total_amount INTEGER NOT NULL,         -- 总金额 = price × quantity
  fee INTEGER NOT NULL,                  -- 手续费（分）
  index_point INTEGER,                   -- 大盘点位 ×100 存储
  reason TEXT,                           -- 操作原因
  follow_plan INTEGER DEFAULT 1,          -- 是否遵守计划 0=否 1=是
  mood TEXT,                             -- 情绪：calm / anxious / greedy / fearful / hesitant / other / unknown
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE SET NULL
);

CREATE INDEX idx_trades_asset_id ON trades(asset_id);
CREATE INDEX idx_trades_plan_id ON trades(plan_id);
CREATE INDEX idx_trades_created_at ON trades(created_at);
```

### 5. positions（仓位快照）

```sql
CREATE TABLE positions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  snapshot_at TEXT NOT NULL,              -- 快照时间
  cash INTEGER NOT NULL,                 -- 现金（分）
  total_assets INTEGER NOT NULL,         -- 总资产（分）
  unrealized_pnl INTEGER NOT NULL,       -- 浮动盈亏（分）
  realized_pnl INTEGER NOT NULL,         -- 已实现盈亏（分）
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_positions_snapshot_at ON positions(snapshot_at);
```

### 6. position_items（仓位明细）

```sql
CREATE TABLE position_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  position_id INTEGER NOT NULL,
  asset_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,             -- 持仓数量 ×1000
  avg_cost INTEGER NOT NULL,             -- 加权成本 ×100
  current_price INTEGER NOT NULL,        -- 当前价 ×100
  market_value INTEGER NOT NULL,         -- 市值（分）
  unrealized_pnl INTEGER NOT NULL,       -- 浮动盈亏（分）
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE CASCADE,
  FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
);

CREATE INDEX idx_position_items_position_id ON position_items(position_id);
```

### 7. reviews（交易复盘）

```sql
CREATE TABLE reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trade_id INTEGER NOT NULL,
  result TEXT NOT NULL,                  -- good / bad / neutral
  issue_type TEXT,                       -- emotion / rule / discipline / external
  summary TEXT NOT NULL,                 -- 总结
  improve TEXT,                          -- 改进点
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (trade_id) REFERENCES trades(id) ON DELETE CASCADE
);

CREATE INDEX idx_reviews_trade_id ON reviews(trade_id);
```

### 8. market_observations（市场观察）

```sql
CREATE TABLE market_observations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  observe_at TEXT NOT NULL,              -- 观察时间
  index_level INTEGER,                    -- 指数点位 ×100 存储
  sentiment TEXT,                        -- 市场情绪
  event TEXT,                            -- 重大事件
  personal_view TEXT,                    -- 个人观点
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_market_observations_observe_at ON market_observations(observe_at);
```

### 9. monthly_reports（AI 月报）

```sql
CREATE TABLE monthly_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  month TEXT NOT NULL,                   -- YYYY-MM
  input_snapshot_json TEXT NOT NULL,     -- 原始数据快照
  ai_summary TEXT NOT NULL,              -- AI 生成内容
  user_edited_summary TEXT,              -- 用户编辑后内容
  model_name TEXT,                       -- 使用的模型名称
  prompt_version TEXT,                   -- prompt 模板版本
  generation_duration_ms INTEGER NOT NULL DEFAULT 0, -- AI 生成耗时（毫秒）
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(month)
);
```

### 10. settings（系统设置）

```sql
CREATE TABLE settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

## 业务约束汇总

| 约束 | 规则 |
|------|------|
| 标的唯一性 | `UNIQUE(code, market)` — 不同市场可存在相同代码 |
| 计划删除 | `ON DELETE CASCADE` — 删除标的时级联删除关联计划 |
| 交易关联计划 | `ON DELETE SET NULL` — 删除计划时交易保留，关联置空 |
| 月报唯一性 | `UNIQUE(month)` — 每月只允许一条月报记录 |
| 设置唯一性 | `UNIQUE(key)` — 每个设置项只允许一条值 |
| 卖出校验 | 应用层校验：卖出数量不得超过当前持仓数量 |
| 精度安全 | 绝对不使用 `REAL` / `FLOAT`，所有金融数值使用 INTEGER |
