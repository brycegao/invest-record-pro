# Batch 5a：Trades 模块 — Rust Tauri 命令

你是一个 TypeScript / Vue 3 / Rust 代码生成专家，为 invest-record-pro 项目提供高质量代码。

## 项目上下文

- 纯单机桌面应用，Tauri 2 + Rust + SQLite（rusqlite bundled）
- 数据库表 `trades` 已通过迁移创建
- 金融数值存储规则：金额用分（×100），数量用千分之一（×1000），禁止 REAL/FLOAT
- 公共辅助函数 `now_iso()` 和 `to_err_string()` 已在 `src-tauri/src/common.rs`
- 已有 asset_commands.rs 和 plan_commands.rs 作为代码风格参考

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
- `SELECT * FROM trades ORDER BY created_at DESC`
- 返回的 Trade 需要附带 asset 信息，所以 JOIN assets 获取 `asset_code` 和 `asset_name`
- Trade struct 增加可选字段：`asset_code: Option<String>`, `asset_name: Option<String>`, `plan_status: Option<String>`

**2. create_trade(db: State, payload: CreateTradePayload) → Result<Trade, String>**
- INSERT INTO trades(...)
- 默认值：follow_plan 默认 true (1)，fee 默认 0
- 自动填充 created_at, updated_at

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
- start_date: Option<String>
- end_date: Option<String>
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
    pub total_buy_amount: i64,        // 累计买入金额（分）
    pub total_sell_amount: i64,       // 累计卖出金额（分）
}
```

计算逻辑：
- `current_quantity = total_buy_quantity - total_sell_quantity`
- `avg_cost` = 加权平均成本 = `total_buy_amount / display_quantity`（即 total_buy_amount_fen / (total_buy_quantity / 1000)）
- 注意：使用整数运算，避免浮点

### 更新模块文件

- `src-tauri/src/models/mod.rs` — 添加 `pub mod trade;`
- `src-tauri/src/commands/mod.rs` — 添加 `pub mod trade_commands;`
- `src-tauri/src/main.rs` — 注册所有 trade 命令

## 精度要求

- total_amount 的计算：`price_fen × (quantity_int / 1000)` — 使用整数除法
- avg_cost 的计算：`total_buy_amount_fen / (total_buy_quantity / 1000)` — 使用整数除法
- 所有返回的金额/价格都是分（×100），数量都是 ×1000

## 代码风格

- 参考 asset_commands.rs 和 plan_commands.rs 的风格
- 错误返回 `Result<T, String>`，中文错误信息
- SQL 参数化查询
- 不得 panic
