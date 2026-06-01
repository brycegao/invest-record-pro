# Batch 7b：Market Observations 模块 — Rust Tauri 命令

你是一个 TypeScript / Vue 3 / Rust 代码生成专家，为 invest-record-pro 项目提供高质量代码。

## 项目上下文

- 纯单机桌面应用，Tauri 2 + Rust + SQLite（rusqlite bundled）
- 数据库表 `market_observations` 已通过迁移创建
- 公共辅助函数在 `src-tauri/src/common.rs`

## 任务

生成 Market Observations 模块的 Rust 后端代码（简单独立 CRUD）。

## 生成文件

### 文件 1：`src-tauri/src/models/market_observation.rs`

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MarketObservation {
    pub id: i64,
    pub observe_at: String,
    pub index_level: Option<i64>,    // ×100 存储
    pub sentiment: Option<String>,
    pub event: Option<String>,
    pub personal_view: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateMarketObservationPayload {
    pub observe_at: String,
    pub index_level: Option<i64>,
    pub sentiment: Option<String>,
    pub event: Option<String>,
    pub personal_view: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateMarketObservationPayload {
    pub id: i64,
    pub observe_at: String,
    pub index_level: Option<i64>,
    pub sentiment: Option<String>,
    pub event: Option<String>,
    pub personal_view: Option<String>,
}
```

### 文件 2：`src-tauri/src/commands/market_observation_commands.rs`

命令：

1. **get_market_observations(db: State) → Result<Vec<MarketObservation>, String>**
   - ORDER BY observe_at DESC

2. **create_market_observation(db: State, payload: CreateMarketObservationPayload) → Result<MarketObservation, String>**

3. **update_market_observation(db: State, payload: UpdateMarketObservationPayload) → Result<MarketObservation, String>**

4. **delete_market_observation(db: State, id: i64) → Result<(), String>**

5. **query_market_observations(db: State, start_date?, end_date?, sentiment?) → Result<Vec<MarketObservation>, String>**

### 更新模块文件

- models/mod.rs, commands/mod.rs, main.rs

## 代码风格

- 同已有模块
