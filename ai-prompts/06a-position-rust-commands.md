# Batch 6a：Positions 模块 — Rust Tauri 命令

你是一个 TypeScript / Vue 3 / Rust 代码生成专家，为 invest-record-pro 项目提供高质量代码。

## 项目上下文

- 纯单机桌面应用，Tauri 2 + Rust + SQLite（rusqlite bundled）
- 数据库表 `positions` 和 `position_items` 已通过迁移创建
- 金融数值存储规则：金额用分（×100），数量用千分之一（×1000），禁止 REAL/FLOAT
- 公共辅助函数在 `src-tauri/src/common.rs`

## 任务

生成 Positions 模块的 Rust 后端代码。

## 生成文件

### 文件 1：`src-tauri/src/models/position.rs`

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Position {
    pub id: i64,
    pub snapshot_at: String,
    pub cash: i64,               // 分
    pub total_assets: i64,        // 分
    pub unrealized_pnl: i64,      // 分
    pub realized_pnl: i64,        // 分
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PositionItem {
    pub id: i64,
    pub position_id: i64,
    pub asset_id: i64,
    pub quantity: i64,            // ×1000
    pub avg_cost: i64,            // ×100（分）
    pub current_price: i64,        // ×100（分）
    pub market_value: i64,         // 分
    pub unrealized_pnl: i64,      // 分
    pub created_at: String,
    pub updated_at: String,
    // 前端显示用（JOIN assets 获取）
    pub asset_code: Option<String>,
    pub asset_name: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatePositionPayload {
    pub snapshot_at: String,
    pub cash: i64,
    pub total_assets: i64,
    pub unrealized_pnl: i64,
    pub realized_pnl: i64,
    pub items: Vec<CreatePositionItemPayload>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatePositionItemPayload {
    pub asset_id: i64,
    pub quantity: i64,
    pub avg_cost: i64,
    pub current_price: i64,
    pub market_value: i64,
    pub unrealized_pnl: i64,
}
```

### 文件 2：`src-tauri/src/commands/position_commands.rs`

实现以下命令：

**1. get_positions(db: State) → Result<Vec<Position>, String>**
- `SELECT * FROM positions ORDER BY snapshot_at DESC`

**2. create_position_snapshot(db: State, payload: CreatePositionPayload) → Result<Position, String>**
- INSERT position（事务）
- 批量 INSERT position_items（事务内）
- 全部在一个事务内完成
- 返回新创建的 Position

**3. get_position_items(db: State, position_id: i64) → Result<Vec<PositionItem>, String>**
- `SELECT pi.*, a.code as asset_code, a.name as asset_name FROM position_items pi JOIN assets a ON pi.asset_id = a.id WHERE pi.position_id = ?`

**4. delete_position(db: State, id: i64) → Result<(), String>**
- DELETE FROM positions WHERE id = ?（CASCADE 自动删除 items）

**5. get_latest_position(db: State) → Result<Option<Position>, String>**
- `SELECT * FROM positions ORDER BY snapshot_at DESC LIMIT 1`
- 返回最近一次快照，可能为空

### 更新模块文件

- `src-tauri/src/models/mod.rs` — 添加 `pub mod position;`
- `src-tauri/src/commands/mod.rs` — 添加 `pub mod position_commands;`
- `src-tauri/src/main.rs` — 注册所有 position 命令

## 代码风格

- 错误返回 `Result<T, String>`，中文错误信息
- 事务：使用 `conn.transaction()`
- SQL 参数化查询
- 不得 panic
