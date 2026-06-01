# Batch 4a：Plans 模块 — Rust Tauri 命令

你是一个 TypeScript / Vue 3 / Rust 代码生成专家，为 invest-record-pro 项目提供高质量代码。

## 项目上下文

- 纯单机桌面应用，Tauri 2 + Rust + SQLite（rusqlite bundled）
- 数据库表 `plans` 和 `plan_rules` 已通过迁移创建
- 数据库连接模式：`tauri::State<'_, Arc<Mutex<Connection>>>` 获取
- Asset 模块的 Rust 命令已实现（`src-tauri/src/commands/asset_commands.rs`），请参考其代码风格
- 辅助函数 `now_iso()` 和 `to_err_string()` 已在 asset_commands 中定义，请提取到公共位置复用

## 任务

生成 Plans 模块的 Rust 后端代码，包含 plans 和 plan_rules 两张表的 CRUD。

## 生成文件

### 文件 1：`src-tauri/src/models/plan.rs`

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Plan {
    pub id: i64,
    pub asset_id: i64,
    pub plan_type: String,
    pub status: String,
    pub position_percent: Option<i32>,   // 百分比 ×100 存储
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub notes: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlanRule {
    pub id: i64,
    pub plan_id: i64,
    pub rule_type: String,
    pub operator: Option<String>,
    pub value: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

// Payload 类型（带规则子数组）
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatePlanPayload {
    pub asset_id: i64,
    pub plan_type: String,
    pub position_percent: Option<i32>,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub notes: Option<String>,
    pub rules: Option<Vec<CreatePlanRulePayload>>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatePlanRulePayload {
    pub rule_type: String,
    pub operator: Option<String>,
    pub value: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdatePlanPayload {
    pub id: i64,
    pub asset_id: i64,
    pub plan_type: String,
    pub status: String,
    pub position_percent: Option<i32>,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub notes: Option<String>,
    pub rules: Option<Vec<CreatePlanRulePayload>>,
}
```

### 文件 2：`src-tauri/src/commands/plan_commands.rs`

实现以下命令：

**Plan 命令：**

1. `get_plans(db: State) → Result<Vec<Plan>, String>` — `SELECT * FROM plans ORDER BY created_at DESC`
2. `create_plan(db: State, payload: CreatePlanPayload) → Result<Plan, String>` — INSERT plan，然后批量 INSERT 规则，全部在一个事务内
3. `update_plan(db: State, payload: UpdatePlanPayload) → Result<Plan, String>` — UPDATE plan，然后 **先删除该 plan 的所有规则** 再批量 INSERT 新规则（事务）
4. `delete_plan(db: State, id: i64) → Result<(), String>` — DELETE FROM plans WHERE id = ?（CASCADE 自动删除规则）
5. `update_plan_status(db: State, id: i64, status: String) → Result<(), String>` — 仅更新 status 字段
6. `query_plans(db: State, keyword?, plan_type?, status?, start_date?, end_date?) → Result<Vec<Plan>, String>` — 动态 WHERE，keyword 模糊匹配 plans.code 或 plans.name（需 JOIN assets 表获取 code/name）

**PlanRule 命令：**

7. `get_plan_rules(db: State, plan_id: i64) → Result<Vec<PlanRule>, String>` — 获取某计划的所有规则

### 事务处理模式

create_plan 和 update_plan 必须使用事务：

```rust
conn.execute("BEGIN TRANSACTION", [])?;
// ... INSERT plan
// ... INSERT rules
conn.execute("COMMIT", [])?;
// 失败时 conn.execute("ROLLBACK", [])?;
```

或使用 rusqlite 的 `transaction()` 方法：

```rust
let tx = conn.transaction()?;
// ... 所有操作
tx.commit()?;
```

### query_plans 的 SQL

keyword 需要关联 assets 表搜索 code/name：

```sql
SELECT p.* FROM plans p
INNER JOIN assets a ON p.asset_id = a.id
WHERE (1=1)
AND (?1 IS NULL OR a.code LIKE '%' || ?1 || '%' OR a.name LIKE '%' || ?1 || '%')
AND (?2 IS NULL OR p.plan_type = ?2)
AND (?3 IS NULL OR p.status = ?3)
AND (?4 IS NULL OR p.start_date >= ?4)
AND (?5 IS NULL OR p.end_date <= ?5)
ORDER BY p.created_at DESC
```

### 更新模块文件

- `src-tauri/src/models/mod.rs` — 添加 `pub mod plan;`
- `src-tauri/src/commands/mod.rs` — 添加 `pub mod plan_commands;`
- `src-tauri/src/main.rs` — 在 invoke_handler 中注册所有 plan 命令

### 辅助函数

将 `now_iso()` 和 `to_err_string()` 提取到 `src-tauri/src/db/mod.rs` 或新建 `src-tauri/src/common.rs`，作为 `pub fn` 供所有命令模块复用。

## 代码风格

- 错误返回 `Result<T, String>`，中文错误信息
- SQL 参数化查询
- 不得 panic
- 注释说明"为什么"
