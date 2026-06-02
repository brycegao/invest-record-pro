# Batch 1：数据库 Schema + Rust 后端基础设施

你是一个 TypeScript / Vue 3 / Rust 代码生成专家，为 invest-record-pro 项目提供高质量代码。

## 任务

在已有的 Tauri 2 项目中（`src-tauri/` 已存在），实现 SQLite 数据库初始化、迁移系统、以及基础的 Rust 模块结构。

## 技术栈

- Tauri 2
- Rust
- rusqlite（SQLite 驱动，features = ["bundled"]）
- serde / serde_json（序列化）
- chrono（日期处理）

## 1. 配置 Cargo.toml 依赖

在 `src-tauri/Cargo.toml` 的 `[dependencies]` 中确保包含：

```toml
[dependencies]
tauri = { version = "2", features = [] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
chrono = { version = "0.4", features = ["serde"] }
rusqlite = { version = "0.31", features = ["bundled"] }
```

## 2. 创建数据库初始化模块

**文件：`src-tauri/src/db/mod.rs`**

职责：
- 提供 `init_database(app_handle: &tauri::AppHandle) -> Result<Arc<Mutex<Connection>>, String>` 函数
- 在 app data directory 下创建 `data.db`（路径：`app_data_dir/invest-record-pro/data.db`）
- 自动创建父目录
- 调用迁移系统执行所有未执行的 SQL 迁移文件

**文件：`src-tauri/src/db/migration.rs`**

职责：
- 读取 `src-tauri/migrations/` 目录下所有 `.sql` 文件
- 通过 `_migration_version` 表跟踪已执行的迁移版本号
- 按文件名前缀数字排序执行（如 `0001_initial.sql`, `0002_xxx.sql`）
- 每个迁移文件执行成功后，在 `_migration_version` 表中插入一条记录

## 3. 创建初始迁移文件

**文件：`src-tauri/migrations/0001_initial.sql`**

包含以下所有表的 CREATE TABLE 语句和索引。

### 存储规则（铁律，必须严格遵守）

| 类别 | 存储方式 | 说明 |
|------|----------|------|
| 金额 | INTEGER（分） | 价格 ×100、金额 ×100，避免浮点错误 |
| 数量 | INTEGER（千分之一） | ×1000 存储（支持三位小数） |
| 百分比 | INTEGER | 百分比数值 ×100（如 30% → 3000） |
| 指数点位 | INTEGER（百分之一） | ×100 存储 |
| 日期时间 | TEXT (ISO 8601) | 精确到毫秒 |
| **禁止使用 REAL / FLOAT** | | 所有金额、价格、数量、百分比、指数点位一律 INTEGER |

### 总金额计算公式

```text
total_amount_fen = price_fen × (quantity_int / 1000)
即：total_amount_fen = price_fen × display_quantity
注意：除法需使用整数除法（quantity_int 保证是 1000 的倍数）
```

### ER 关系

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

### 表结构（严格按此 SQL）

```sql
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
```

## 4. 创建模块占位文件

**`src-tauri/src/models/mod.rs`**：空模块，`pub mod` 声明
**`src-tauri/src/commands/mod.rs`**：空模块，`pub mod` 声明
**`src-tauri/src/lib.rs`**：`pub mod db; pub mod models; pub mod commands;`

## 5. 修改 main.rs

```rust
mod db;
mod models;
mod commands;

use std::sync::{Arc, Mutex};
use rusqlite::Connection;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let db = db::init_database(app.handle())?;
            app.manage(db);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // 后续批次逐步添加命令
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

## 代码风格要求

- 所有错误返回 `Result<T, String>`，错误信息用中文
- 注释说明"为什么"而非"是什么"
- 不得 panic，所有错误转为 Result
- 日期使用 ISO 8601 格式（chrono 的 `to_rfc3339_opts`）
- SQL 全部参数化查询，防 SQL 注入

## 禁止事项

- 禁止使用 REAL / FLOAT 类型存储任何数值
- 禁止创建任何业务命令（只搭基础设施）
- 不要引入 reqwest 或其他 HTTP 库（本批次不需要）
