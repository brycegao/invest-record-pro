# Batch 3a：Assets 模块 — Rust Tauri 命令

你是一个 TypeScript / Vue 3 / Rust 代码生成专家，为 invest-record-pro 项目提供高质量代码。

## 项目上下文

- 纯单机桌面应用，Tauri 2 + Rust + SQLite
- 数据库已通过迁移系统初始化（`src-tauri/migrations/0001_initial.sql`）
- 数据库连接通过 `tauri::State<'_, Arc<Mutex<Connection>>>` 获取
- 依赖：rusqlite (bundled), serde (derive), chrono (serde)
- `src-tauri/src/db/mod.rs` 已提供 `init_database` 函数
- `src-tauri/src/models/mod.rs` 和 `src-tauri/src/commands/mod.rs` 已存在

## 任务

生成 Assets 模块的 Rust 后端代码。

## 生成文件

### 文件 1：`src-tauri/src/models/asset.rs`

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Asset {
    pub id: i64,
    pub code: String,
    pub name: String,
    #[serde(rename = "type")]
    pub asset_type: String,
    pub market: String,
    pub risk_level: i32,
    pub index_reference: Option<String>,
    pub logic: Option<String>,
    pub notes: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

// CreateAssetPayload 用于 create_asset 命令的参数
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateAssetPayload {
    pub code: String,
    pub name: String,
    #[serde(rename = "type")]
    pub asset_type: String,
    pub market: String,
    pub risk_level: Option<i32>,
    pub index_reference: Option<String>,
    pub logic: Option<String>,
    pub notes: Option<String>,
}

// UpdateAssetPayload 用于 update_asset 命令的参数
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateAssetPayload {
    pub id: i64,
    pub code: String,
    pub name: String,
    #[serde(rename = "type")]
    pub asset_type: String,
    pub market: String,
    pub risk_level: Option<i32>,
    pub index_reference: Option<String>,
    pub logic: Option<String>,
    pub notes: Option<String>,
}
```

注意：`type` 是 Rust 关键字，所以字段名用 `asset_type`，通过 `#[serde(rename = "type")]` 序列化为前端期望的 `type`。

### 文件 2：`src-tauri/src/commands/asset_commands.rs`

实现以下 5 个 `#[tauri::command]` 函数：

**1. get_assets**
- 参数：`db: tauri::State<'_, Arc<Mutex<Connection>>>`
- 返回：`Result<Vec<Asset>, String>`
- SQL：`SELECT * FROM assets ORDER BY created_at DESC`

**2. create_asset**
- 参数：`db: State, payload: CreateAssetPayload`
- 返回：`Result<Asset, String>`
- SQL：`INSERT INTO assets(code, name, type, market, risk_level, index_reference, logic, notes, created_at, updated_at) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
- 自动填充：risk_level 默认 3，created_at/updated_at 使用 `chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true)`
- 错误处理：UNIQUE 约束冲突 → "该代码在此市场已存在"

**3. update_asset**
- 参数：`db: State, payload: UpdateAssetPayload`
- 返回：`Result<Asset, String>`
- SQL：`UPDATE assets SET ... WHERE id = ?`
- 自动更新 updated_at
- 错误处理：记录不存在 → "资产不存在"

**4. delete_asset**
- 参数：`db: State, id: i64`
- 返回：`Result<(), String>`
- SQL：`DELETE FROM assets WHERE id = ?`
- 由于有 `ON DELETE CASCADE`，关联数据自动删除
- 注意：前端应在调用前做二次确认

**5. query_assets**
- 参数：`db: State, keyword: Option<String>, asset_type: Option<String>, market: Option<String>`
- 返回：`Result<Vec<Asset>, String>`
- SQL：动态构建 WHERE 子句：
  - keyword 匹配 code 或 name（LIKE %keyword%）
  - asset_type 精确匹配
  - market 精确匹配
- 排序：`ORDER BY created_at DESC`

### 文件 3：更新 `src-tauri/src/models/mod.rs`

添加 `pub mod asset;`，并 `pub use asset::*;`

### 文件 4：更新 `src-tauri/src/commands/mod.rs`

添加 `pub mod asset_commands;`，并 `pub use asset_commands::*;`

### 文件 5：更新 `src-tauri/src/main.rs`

在 `invoke_handler` 中注册命令：

```rust
.invoke_handler(tauri::generate_handler![
    commands::get_assets,
    commands::create_asset,
    commands::update_asset,
    commands::delete_asset,
    commands::query_assets,
])
```

## 数据库连接获取模式

```rust
use std::sync::{Arc, Mutex};
use rusqlite::Connection;

// 在每个 #[command] 函数中：
let conn = db.lock().map_err(|e| format!("获取数据库锁失败: {}", e))?;
```

## 辅助函数

```rust
fn now_iso() -> String {
    chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true)
}

fn to_err_string(e: rusqlite::Error) -> String {
    match e {
        rusqlite::Error::QueryReturnedNoRows => "记录不存在".to_string(),
        rusqlite::Error::SqliteFailure(err, _) => {
            if err.code == rusqlite::ErrorCode::ConstraintViolation {
                "数据已存在或违反约束".to_string()
            } else {
                format!("数据库错误: {}", e)
            }
        }
        _ => format!("数据库错误: {}", e),
    }
}
```

## 代码风格

- 错误返回 `Result<T, String>`，错误信息中文化
- SQL 全部参数化查询（使用 `rusqlite::params![]`）
- 注释说明"为什么"
- 不得 panic
