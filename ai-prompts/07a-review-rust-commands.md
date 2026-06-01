# Batch 7a：Reviews 模块 — Rust Tauri 命令

你是一个 TypeScript / Vue 3 / Rust 代码生成专家，为 invest-record-pro 项目提供高质量代码。

## 项目上下文

- 纯单机桌面应用，Tauri 2 + Rust + SQLite（rusqlite bundled）
- 数据库表 `reviews` 已通过迁移创建
- 公共辅助函数在 `src-tauri/src/common.rs`
- 已有 asset/plan/trade/position commands 作为参考

## 任务

生成 Reviews 模块的 Rust 后端代码。

## 生成文件

### 文件 1：`src-tauri/src/models/review.rs`

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Review {
    pub id: i64,
    pub trade_id: i64,
    pub result: String,
    pub issue_type: Option<String>,
    pub summary: String,
    pub improve: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateReviewPayload {
    pub trade_id: i64,
    pub result: String,
    pub issue_type: Option<String>,
    pub summary: String,
    pub improve: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateReviewPayload {
    pub id: i64,
    pub trade_id: i64,
    pub result: String,
    pub issue_type: Option<String>,
    pub summary: String,
    pub improve: Option<String>,
}
```

### 文件 2：`src-tauri/src/commands/review_commands.rs`

命令：

1. **get_reviews(db: State) → Result<Vec<Review>, String>**
   - JOIN trades 和 assets 获取 trade 信息
   - 返回增加可选字段：trade_asset_code, trade_asset_name, trade_type, trade_created_at

2. **create_review(db: State, payload: CreateReviewPayload) → Result<Review, String>**
   - INSERT INTO reviews(...)

3. **update_review(db: State, payload: UpdateReviewPayload) → Result<Review, String>**
   - UPDATE reviews SET ... WHERE id = ?

4. **delete_review(db: State, id: i64) → Result<(), String>**
   - DELETE FROM reviews WHERE id = ?

5. **query_reviews(db: State, keyword?, start_date?, end_date?, result?, issue_type?) → Result<Vec<Review>, String>**
   - keyword 模糊匹配 trades 的 asset code/name
   - 动态 WHERE 条件

### 更新模块文件

- models/mod.rs, commands/mod.rs, main.rs

## 代码风格

- 同已有模块，错误返回 Result<T, String>，中文信息
- SQL 参数化，不得 panic
