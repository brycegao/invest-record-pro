# Rust Tauri 命令生成模板

## 用途

生成 Rust 代码，实现 SQLite CRUD 操作并通过 Tauri `#[command]` 宏暴露给前端。

## 使用方式

1. 复制本模板内容
2. 在"具体需求"部分填入：
   - 数据模型与表结构
   - SQL 语句或查询逻辑
   - Tauri 命令函数列表
   - 目标文件路径和名称
3. 提交给 Codex

## 模板

### 系统提示
```
[使用 prompts/codex/system/system-prompt.txt]
```

### 任务描述

你需要生成 Rust 代码，在 Tauri 后端实现 SQLite 数据库操作。

**命令职责**：
- 接收前端 JSON 参数
- 执行 SQLite 查询 / 插入 / 更新 / 删除
- 返回 Result<T, String> 类型
- 错误消息必须是用户友好的中文或英文

**技术栈**：
- Tauri 2（#[command] 宏）
- rusqlite（SQLite 驱动，本项目统一使用 rusqlite）
- serde / serde_json（序列化，需启用 camelCase 重命名）
- chrono（日期处理）

### 具体需求

**数据模型**（示例）：
```rs
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]  // 前端期望 camelCase JSON key
pub struct Asset {
    pub id: i64,
    pub code: String,
    pub name: String,
    pub asset_type: String,      // type 是 Rust 关键字，用 asset_type
    pub market: String,
    pub risk_level: String,
    pub investment_thesis: String,
    pub notes: Option<String>,
    pub created_at: String,       // ISO 8601
    pub updated_at: String,
}
// serde rename_all 会将 asset_type 序列化为 "assetType"，risk_level 为 "riskLevel"
```

**SQLite 表结构**：
```sql
CREATE TABLE assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    asset_type TEXT NOT NULL,
    market TEXT NOT NULL,
    risk_level TEXT NOT NULL,
    investment_thesis TEXT NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
)
```

**Tauri 命令**（示例）：
```rs
// 1. #[command] get_assets()
//    - 返回：Result<Vec<Asset>, String>
//    - SQL：SELECT * FROM assets ORDER BY created_at DESC
//    - 错误处理：映射 rusqlite::Error 为 String

// 2. #[command] create_asset(code: String, name: String, ...)
//    - 参数：单个字段或 JSON 对象
//    - 返回：Result<Asset, String>（新增的记录，包含自动生成的 id）
//    - 验证：code 长度、唯一性检查
//    - 插入：INSERT INTO assets(...)
//    - 错误：UNIQUE 冲突、字段空值等

// 3. #[command] update_asset(id: i64, ...)
//    - 参数：id 和要更新的字段
//    - 返回：Result<Asset, String>
//    - 更新：UPDATE assets SET ... WHERE id = ?
//    - 返回更新后的完整记录

// 4. #[command] delete_asset(id: i64)
//    - 返回：Result<(), String>
//    - SQL：DELETE FROM assets WHERE id = ?
//    - 错误：记录不存在、关联约束等

// 5. #[command] query_assets(asset_type: Option<String>, ...)
//    - 参数：过滤条件（可选）
//    - SQL：WHERE 子句动态构建
//    - 返回：Result<Vec<Asset>, String>
```

**数据库连接**（本项目统一使用 Tauri State 方式）：
```rs
use std::sync::{Arc, Mutex};
use rusqlite::Connection;

// 在 main.rs 中初始化并注册到 Tauri State
let db = Arc::new(Mutex::new(Connection::open(db_path)?));
tauri::Builder::default()
    .manage(db)
    // ...

// 在命令中通过 State 获取
#[command]
async fn get_assets(db: tauri::State<'_, Arc<Mutex<Connection>>>) -> Result<Vec<Asset>, String> {
    let conn = db.lock().map_err(|e| format!("获取数据库锁失败: {}", e))?;
    // ...
}
```

**其他要求**：
- 目标路径：`src-tauri/src/commands/asset_commands.rs`
- 所有日期用 ISO 8601 格式（created_at, updated_at）
- 所有返回都是 `Result<T, String>`，String 为错误信息
- 不能返回 panic，必须转为 Result

### 输出格式

完整的 Rust 代码，包括：
- 结构体定义（derive Serialize, Deserialize）
- 辅助函数（日期生成、错误转换等）
- #[command] 函数实现

## 核心特性

### 错误转换模式
```rs
pub fn to_err_string(e: rusqlite::Error) -> String {
    match e {
        rusqlite::Error::QueryReturnedNoRows => "记录不存在".to_string(),
        rusqlite::Error::InvalidColumn(_) => "数据库结构错误".to_string(),
        _ => format!("数据库错误: {}", e),
    }
}
```

### 日期处理模式
```rs
use chrono::Utc;

fn now_iso() -> String {
    Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true)
}
```

### 参数绑定与类型安全
```rs
conn.execute(
    "INSERT INTO assets(code, name, ...) VALUES(?1, ?2, ...)",
    rusqlite::params![code, name, ...],
)?;

// 从行读取 i64 主键需要显式类型标注
let id: i64 = row.get(0)?;
let code: String = row.get(1)?;
```

### Cargo.toml 依赖确认
```toml
[dependencies]
tauri = { version = "2", features = [] }
rusqlite = { version = "0.31", features = ["bundled"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
chrono = { version = "0.4", features = ["serde"] }
```

## 示例 Prompt 完整版

```markdown
## 生成资产 SQLite 命令

基于以下需求生成 Rust Tauri 命令：

**表结构**：
CREATE TABLE assets (
  id INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  asset_type TEXT,
  market TEXT,
  risk_level TEXT,
  investment_thesis TEXT,
  notes TEXT,
  created_at TEXT,
  updated_at TEXT
)

**数据模型**：
#[derive(Serialize, Deserialize)]
struct Asset {
  id: i64,
  code: String,
  name: String,
  asset_type: String,
  market: String,
  risk_level: String,
  investment_thesis: String,
  notes: Option<String>,
  created_at: String,
  updated_at: String,
}

**命令函数**：
- #[command] get_assets() -> Result<Vec<Asset>, String>
- #[command] create_asset(code, name, asset_type, market, risk_level, investment_thesis, notes: Option<String>) -> Result<Asset, String>
- #[command] update_asset(id: i64, ... 更新字段) -> Result<Asset, String>
- #[command] delete_asset(id: i64) -> Result<(), String>

**特殊要求**：
- 所有日期使用 ISO 8601 格式，updated_at 每次更新自动更新
- 错误信息中文化，用户友好
- 不得 panic，所有错误转为 Result Err

**目标路径**：src-tauri/src/commands/asset_commands.rs

**数据库连接**：由 Tauri State 提供 Arc<Mutex<Connection>>
```

## 常见参数

| 参数 | 说明 | 示例 |
|------|------|------|
| 错误处理 | 转换为 String | to_err_string(e) |
| 日期格式 | ISO 8601 | Utc::now().to_rfc3339() |
| 参数绑定 | SQL 注入防护 | rusqlite::params![] |
| 连接获取 | Tauri State | state.db.lock() |
| 序列化 | JSON 转换 | #[derive(Serialize)] |

## 配置检查清单

部署前检查：
- [ ] main.rs 中注册 #[command] 函数
- [ ] Cargo.toml 依赖包括 rusqlite / sqlx / chrono
- [ ] tauri.conf.json 配置数据库路径
- [ ] 所有 SQL 使用参数化查询防 SQL 注入
- [ ] 异常情况都有错误提示，不会静默失败
