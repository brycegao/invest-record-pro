# Batch 5a：Trades 模块 — Rust Tauri 命令

你是一个 TypeScript / Vue 3 / Rust 代码生成专家，为 invest-record-pro 项目提供高质量代码。

## 项目上下文

- 纯单机桌面应用，Tauri 2 + Rust + SQLite（rusqlite bundled）
- 数据库表 `trades` 已通过迁移创建
- 金融数值存储规则：金额用分（×100），数量用千分之一（×1000），禁止 REAL/FLOAT
- 公共辅助函数 `now_iso()` 和 `to_err_string()` 已在 `src-tauri/src/common.rs`
- 已有 asset_commands.rs 作为代码风格参考（`src-tauri/src/commands/asset_commands.rs`）

## 任务

生成 Trades 模块的 Rust 后端代码。

## 生成文件

### 文件 1：`src-tauri/src/models/trade.rs`

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Trade {
    pub id: i64,
    pub asset_id: i64,
    pub plan_id: Option<i64>,
    pub trade_at: String,        // 实际成交时间；不要用 created_at 代替
    pub trade_type: String,
    pub quantity: i64,           // ×1000 存储
    pub price: i64,             // ×100 存储（分）
    pub total_amount: i64,      // 分
    pub fee: i64,               // 分
    pub index_point: Option<i64>, // ×100 存储
    pub reason: Option<String>,
    pub follow_plan: bool,
    pub mood: Option<String>,
    pub notes: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateTradePayload {
    pub asset_id: i64,
    pub plan_id: Option<i64>,
    pub trade_at: String,
    pub trade_type: String,
    pub quantity: i64,           // ×1000
    pub price: i64,             // ×100（分）
    pub total_amount: i64,      // 分
    pub fee: i64,               // 分
    pub index_point: Option<i64>,
    pub reason: Option<String>,
    pub follow_plan: Option<bool>,
    pub mood: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateTradePayload {
    pub id: i64,
    pub asset_id: i64,
    pub plan_id: Option<i64>,
    pub trade_at: String,
    pub trade_type: String,
    pub quantity: i64,
    pub price: i64,
    pub total_amount: i64,
    pub fee: i64,
    pub index_point: Option<i64>,
    pub reason: Option<String>,
    pub follow_plan: bool,
    pub mood: Option<String>,
    pub notes: Option<String>,
}
```

### 文件 2：`src-tauri/src/commands/trade_commands.rs`

实现以下命令：

**1. get_trades(db: State) → Result<Vec<Trade>, String>**
- `SELECT * FROM trades ORDER BY trade_at DESC, created_at DESC`
- 返回的 Trade 需要附带 asset 信息，所以 JOIN assets 获取 `asset_code` 和 `asset_name`
- Trade struct 增加可选 DTO 字段：`asset_code: Option<String>`, `asset_name: Option<String>`, `plan_status: Option<String>`, `realized_pnl: Option<i64>`
- `realized_pnl` 不是数据库字段，只能由查询命令按交易顺序计算后填充。买入为 `None`，卖出为 `Some(value)`。

**2. create_trade(db: State, payload: CreateTradePayload) → Result<Trade, String>**
- INSERT INTO trades(...)
- 默认值：follow_plan 默认 true (1)，fee 默认 0
- `trade_at` 来自用户输入，必填；创建新交易时前端可默认填当前时间。不要在后端用 `created_at` 代替。
- 自动填充 created_at, updated_at。`created_at` 只表示记录创建时间，不能当作成交时间。

**3. update_trade(db: State, payload: UpdateTradePayload) → Result<Trade, String>**
- UPDATE trades SET ... WHERE id = ?
- 自动更新 updated_at

**4. delete_trade(db: State, id: i64) → Result<(), String>**
- DELETE FROM trades WHERE id = ?
- CASCADE 自动删除关联 reviews

**5. query_trades(db: State, ...) → Result<Vec<Trade>, String>**
参数：
- keyword: Option<String> — 模糊匹配 asset code/name
- trade_type: Option<String>
- start_date: Option<String> — 过滤 `trade_at`
- end_date: Option<String> — 过滤 `trade_at`
- follow_plan: Option<bool> — 注意 Rust 中是 Option<bool>
- mood: Option<String>

SQL：JOIN assets 表获取 asset_code/asset_name，动态 WHERE 条件

**6. get_trade_summary(db: State, asset_id: i64) → Result<TradeSummary, String>**

返回指定标的的交易汇总（用于卖出时显示持仓信息）：

```rust
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TradeSummary {
    pub asset_id: i64,
    pub total_buy_quantity: i64,     // 累计买入数量（×1000）
    pub total_sell_quantity: i64,    // 累计卖出数量（×1000）
    pub current_quantity: i64,       // 当前持仓 = 买入 - 卖出
    pub avg_cost: i64,               // 加权平均成本（×100，分）
    pub remaining_cost: i64,         // 剩余持仓成本（分）
    pub realized_pnl: i64,           // 累计已实现盈亏（分）
    pub total_buy_amount: i64,       // 累计买入成交额（不含手续费，分）
    pub total_sell_amount: i64,      // 累计卖出成交额（不含手续费，分）
}
```

计算逻辑：
- 必须按 `trade_at ASC, created_at ASC, id ASC` 重放该标的所有交易，不能用“累计买入金额 / 累计买入数量”的简化公式。
- 买入：
  - `gross_amount = price_fen * quantity_int / 1000`
  - `remaining_cost += gross_amount + fee`
  - `current_quantity += quantity`
  - `avg_cost = remaining_cost * 1000 / current_quantity`
- 卖出：
  - 若 `sell_quantity > current_quantity`，返回错误，v1 不支持做空。
  - `cost_of_sold = avg_cost * sell_quantity / 1000`
  - `sell_proceeds = price_fen * sell_quantity / 1000`
  - `trade_realized_pnl = sell_proceeds - cost_of_sold - fee`
  - `realized_pnl += trade_realized_pnl`
  - `current_quantity -= sell_quantity`
  - `remaining_cost -= cost_of_sold`
- 清仓：
  - 当 `current_quantity == 0` 时，`remaining_cost = 0`，`avg_cost = 0`。
  - 再次买入时从新的买入记录重新计算加权平均成本。
- 所有计算使用整数运算，避免浮点。
- `get_trades` / `query_trades` 返回列表时，也要用同一套重放算法为每笔卖出 DTO 填充 `realized_pnl`。

### 更新模块文件

- `src-tauri/src/models/mod.rs` — 添加 `pub mod trade;`
- `src-tauri/src/commands/mod.rs` — 添加 `pub mod trade_commands;`
- `src-tauri/src/main.rs` — 注册所有 trade 命令

## 精度要求

- total_amount 的计算：`price_fen × (quantity_int / 1000)` — 使用整数除法
- avg_cost 的计算：`remaining_cost_fen * 1000 / current_quantity_int` — 使用整数除法
- 已实现盈亏：`sell_price_fen * sell_quantity_int / 1000 - avg_cost_fen * sell_quantity_int / 1000 - sell_fee_fen`
- 买入手续费计入持仓成本，卖出手续费扣减已实现盈亏。
- 所有返回的金额/价格都是分（×100），数量都是 ×1000

## 代码风格

- 参考 asset_commands.rs 和 plan_commands.rs 的风格
- 错误返回 `Result<T, String>`，中文错误信息
- SQL 参数化查询
- 不得 panic
