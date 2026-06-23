# 投顾推荐追踪 + 复盘模块 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 invest-record-pro 底座上零侵入式新增「投顾推荐追踪 + 按需复盘」模块，实现录入老师推荐、记录是否跟随、手动填区间价后计算踏空/躲避金额。

**Architecture:** 完全顺从底座的 Tauri2 + Vue3 + Rust(rusqlite) 架构。新增 1 个 migration（自动发现机制，不改 migration.rs）+ 1 个 Rust model 模块 + 1 个 Rust command 模块 + 1 个 Vue feature 模块 + 1 个页面。复盘计算（踏空/躲避）做成纯前端 TS 函数（带单测），不依赖 Rust。价格手动录入，与持仓快照设计一致。

**Tech Stack:** Rust(rusqlite + serde) + Vue 3 + TypeScript + Pinia + Naive UI + Vitest

**规格文档:** `docs/superpowers/specs/2026-06-19-advisor-module-design.md`

---

## 文件结构总览

| 文件 | 动作 | 职责 |
|---|---|---|
| `src-tauri/migrations/0002_advisor.sql` | 新建 | 建 2 张表 |
| `src-tauri/src/models/advisor.rs` | 新建 | AdvisorSignal / FollowUp 结构体 + payload |
| `src-tauri/src/models/mod.rs` | 修改 | 加 `pub mod advisor; pub use advisor::*;` |
| `src-tauri/src/commands/advisor_commands.rs` | 新建 | Tauri command（CRUD + 汇总查询） |
| `src-tauri/src/commands/mod.rs` | 修改 | 加模块声明 |
| `src-tauri/src/lib.rs` | 修改 | 注册新 command 到 invoke_handler |
| `src/domain/types/advisor.ts` | 新建 | TS 类型 + 标签映射 |
| `src/domain/types/index.ts` | 修改 | 导出新类型 |
| `src/services/advisor-review-calc.service.ts` | 新建 | 复盘计算纯函数 |
| `src/services/advisor-review-calc.service.test.ts` | 新建 | 单元测试 |
| `src/features/advisor/repository.ts` | 新建 | Tauri invoke 封装 |
| `src/features/advisor/store.ts` | 新建 | Pinia store |
| `src/features/advisor/components/AdvisorSignalForm.vue` | 新建 | 录入推荐表单 |
| `src/features/advisor/components/AdvisorSignalTable.vue` | 新建 | 推荐列表 |
| `src/features/advisor/components/FollowUpDrawer.vue` | 新建 | 跟随/复盘弹窗 |
| `src/features/advisor/components/ReviewSummaryCard.vue` | 新建 | 按老师汇总卡片 |
| `src/features/advisor/components/AdvisorPageBody.vue` | 新建 | 页面主体（组合组件） |
| `src/pages/advisor/AdvisorPage.vue` | 新建 | 投顾页入口 |
| `src/app/router/index.ts` | 修改 | 加路由 `/advisor` |
| `src/app/layout/components/SideNav.vue` | 修改 | 加导航项 |

## 关键约定（写代码前必读）

1. **金额精度**：Rust 端 `i64` 存「分」，TS 端 `number` 存「分」。UI 输入「元」时乘 100 取整入库。与 `trades.price` 等字段一致。
2. **数量**：`i64` 存原始股数（不 ×1000，按 trades.quantity 一致）。本模块 `hypothetical_qty` 同此。
3. **serde 命名**：Rust 结构体用 `#[serde(rename_all = "camelCase")]`，TS 用 camelCase。repository.ts 负责 camelCase↔snake_case 转换。
4. **时间**：用 `crate::common::now_iso()` 生成 ISO 时间戳。
5. **错误处理**：command 返回 `Result<T, String>`，照抄 `review_commands.rs` 的 `map_xxx_error` 模式。
6. **数据库连接**：`type DbState<'a> = tauri::State<'a, Arc<Mutex<Connection>>>`，用 `lock_connection` 获取 guard。

---

## Task 1: 数据库迁移

**Files:**
- Create: `src-tauri/migrations/0002_advisor.sql`

- [ ] **Step 1: 写迁移文件**

创建 `src-tauri/migrations/0002_advisor.sql`：

```sql
-- 投顾推荐信号（价格×100 存分，数量存原始股数）
CREATE TABLE IF NOT EXISTS advisor_signals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  advisor TEXT NOT NULL,
  asset_id INTEGER NOT NULL,
  direction TEXT NOT NULL,
  signal_at TEXT NOT NULL,
  ref_price INTEGER NOT NULL,
  target_price INTEGER,
  stop_loss INTEGER,
  hypothetical_qty INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_advisor_signals_advisor ON advisor_signals(advisor);
CREATE INDEX IF NOT EXISTS idx_advisor_signals_asset ON advisor_signals(asset_id);
CREATE INDEX IF NOT EXISTS idx_advisor_signals_signal_at ON advisor_signals(signal_at);

-- 跟随 + 复盘记录
CREATE TABLE IF NOT EXISTS follow_ups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  signal_id INTEGER NOT NULL,
  followed INTEGER NOT NULL DEFAULT 0,
  actual_price INTEGER,
  actual_qty INTEGER,
  actual_at TEXT,
  linked_trade_id INTEGER,
  reason TEXT,
  range_high INTEGER,
  range_low INTEGER,
  range_end_close INTEGER,
  reviewed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (signal_id) REFERENCES advisor_signals(id) ON DELETE CASCADE,
  FOREIGN KEY (linked_trade_id) REFERENCES trades(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_follow_ups_signal ON follow_ups(signal_id);
```

- [ ] **Step 2: 验证迁移会被执行**

```bash
cd /Users/geralt/projects/Zcode/invest-record-pro
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$HOME/.rustup/toolchains/stable-x86_64-apple-darwin/bin:/opt/homebrew/bin:$PATH"
rm -f data/ledger.db data/ledger.db-*
npm run tauri dev &  # 后台启动，等编译
sleep 90  # 首次编译需时间；若已编译过则秒开
```

应用启动后，用 sqlite3 检查表是否创建：

```bash
sqlite3 data/ledger.db ".tables" | tr ' ' '\n' | grep -E "advisor_signals|follow_ups"
```

Expected: 输出 `advisor_signals` 和 `follow_ups`

```bash
sqlite3 data/ledger.db "SELECT version FROM _migration_version ORDER BY version"
```

Expected: 输出含 `2`

关闭应用：`pkill -f invest-record-pro`

- [ ] **Step 3: Commit**

```bash
git add src-tauri/migrations/0002_advisor.sql
git commit -m "feat(advisor): add migration for advisor_signals and follow_ups tables"
```

---

## Task 2: Rust 数据模型

**Files:**
- Create: `src-tauri/src/models/advisor.rs`
- Modify: `src-tauri/src/models/mod.rs`

- [ ] **Step 1: 写 app/src-tauri/src/models/advisor.rs**

```rust
/*
 * @Description: 投顾推荐与复盘数据模型
 */

use serde::{Deserialize, Serialize};

/// 投顾推荐信号（金额字段存「分」）
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AdvisorSignal {
    pub id: i64,
    pub advisor: String,
    pub asset_id: i64,
    pub direction: String,
    pub signal_at: String,
    pub ref_price: i64,
    pub target_price: Option<i64>,
    pub stop_loss: Option<i64>,
    pub hypothetical_qty: i64,
    pub note: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    // JOIN 出来的标的信息，便于前端展示
    pub asset_code: Option<String>,
    pub asset_name: Option<String>,
    pub asset_market: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateAdvisorSignalPayload {
    pub advisor: String,
    pub asset_id: i64,
    pub direction: String,
    pub signal_at: String,
    pub ref_price: i64,
    pub target_price: Option<i64>,
    pub stop_loss: Option<i64>,
    pub hypothetical_qty: i64,
    pub note: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateAdvisorSignalPayload {
    pub id: i64,
    pub advisor: String,
    pub asset_id: i64,
    pub direction: String,
    pub signal_at: String,
    pub ref_price: i64,
    pub target_price: Option<i64>,
    pub stop_loss: Option<i64>,
    pub hypothetical_qty: i64,
    pub note: Option<String>,
}

/// 跟随 + 复盘记录
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FollowUp {
    pub id: i64,
    pub signal_id: i64,
    pub followed: bool,
    pub actual_price: Option<i64>,
    pub actual_qty: Option<i64>,
    pub actual_at: Option<String>,
    pub linked_trade_id: Option<i64>,
    pub reason: Option<String>,
    pub range_high: Option<i64>,
    pub range_low: Option<i64>,
    pub range_end_close: Option<i64>,
    pub reviewed_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpsertFollowUpPayload {
    pub signal_id: i64,
    pub followed: bool,
    pub actual_price: Option<i64>,
    pub actual_qty: Option<i64>,
    pub actual_at: Option<String>,
    pub linked_trade_id: Option<i64>,
    pub reason: Option<String>,
    pub range_high: Option<i64>,
    pub range_low: Option<i64>,
    pub range_end_close: Option<i64>,
    pub reviewed_at: Option<String>,
}
```

- [ ] **Step 2: 修改 `src-tauri/src/models/mod.rs`**

在 `pub mod review;` 之后加一行 `pub mod advisor;`，并在 `pub use review::*;` 之后加 `pub use advisor::*;`：

```rust
pub mod advisor;
pub mod asset;
pub mod market_observation;
pub mod monthly_report;
pub mod plan;
pub mod position;
pub mod review;
pub mod trade;

pub use advisor::*;
pub use asset::*;
pub use market_observation::*;
pub use monthly_report::*;
pub use plan::*;
pub use position::*;
pub use review::*;
pub use trade::*;
```

- [ ] **Step 3: 验证编译**

```bash
cd /Users/geralt/projects/Zcode/invest-record-pro
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$HOME/.rustup/toolchains/stable-x86_64-apple-darwin/bin:/opt/homebrew/bin:$PATH"
cd src-tauri && cargo check 2>&1 | tail -5
```

Expected: `Finished` 无错误（warning 可接受）

- [ ] **Step 4: Commit**

```bash
git add src-tauri/src/models/advisor.rs src-tauri/src/models/mod.rs
git commit -m "feat(advisor): add Rust data models for advisor signals and follow-ups"
```

---

## Task 3: Rust Tauri 命令（CRUD）

**Files:**
- Create: `src-tauri/src/commands/advisor_commands.rs`
- Modify: `src-tauri/src/commands/mod.rs`
- Modify: `src-tauri/src/lib.rs`

- [ ] **Step 1: 写 `src-tauri/src/commands/advisor_commands.rs`**

```rust
/*
 * @Description: 投顾推荐与复盘 Tauri 命令
 */

use std::sync::{Arc, Mutex};

use rusqlite::{params, Connection, Error, ErrorCode};

use crate::common::now_iso;
use crate::models::{
    AdvisorSignal, CreateAdvisorSignalPayload, FollowUp, UpdateAdvisorSignalPayload,
    UpsertFollowUpPayload,
};

type DbState<'a> = tauri::State<'a, Arc<Mutex<Connection>>>;

const SIGNAL_SELECT: &str = "SELECT s.*, a.code AS asset_code, a.name AS asset_name, a.market AS asset_market
    FROM advisor_signals s
    INNER JOIN assets a ON s.asset_id = a.id";

fn map_signal_row(row: &rusqlite::Row<'_>) -> Result<AdvisorSignal, rusqlite::Error> {
    Ok(AdvisorSignal {
        id: row.get("id")?,
        advisor: row.get("advisor")?,
        asset_id: row.get("asset_id")?,
        direction: row.get("direction")?,
        signal_at: row.get("signal_at")?,
        ref_price: row.get("ref_price")?,
        target_price: row.get("target_price")?,
        stop_loss: row.get("stop_loss")?,
        hypothetical_qty: row.get("hypothetical_qty")?,
        note: row.get("note")?,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
        asset_code: row.get("asset_code")?,
        asset_name: row.get("asset_name")?,
        asset_market: row.get("asset_market")?,
    })
}

fn map_follow_up_row(row: &rusqlite::Row<'_>) -> Result<FollowUp, rusqlite::Error> {
    let followed_int: i64 = row.get("followed")?;
    Ok(FollowUp {
        id: row.get("id")?,
        signal_id: row.get("signal_id")?,
        followed: followed_int != 0,
        actual_price: row.get("actual_price")?,
        actual_qty: row.get("actual_qty")?,
        actual_at: row.get("actual_at")?,
        linked_trade_id: row.get("linked_trade_id")?,
        reason: row.get("reason")?,
        range_high: row.get("range_high")?,
        range_low: row.get("range_low")?,
        range_end_close: row.get("range_end_close")?,
        reviewed_at: row.get("reviewed_at")?,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
    })
}

fn lock_connection<'a>(
    db: &'a DbState<'a>,
) -> Result<std::sync::MutexGuard<'a, Connection>, String> {
    db.lock().map_err(|error| format!("获取数据库锁失败: {error}"))
}

fn map_advisor_error(error: Error) -> String {
    match error {
        Error::QueryReturnedNoRows => "投顾记录不存在".to_string(),
        Error::SqliteFailure(ref sqlite_error, _)
            if sqlite_error.code == ErrorCode::ConstraintViolation =>
        {
            "投顾数据违反约束，请检查关联标的".to_string()
        }
        _ => format!("数据库错误: {error}"),
    }
}

/// 获取所有推荐信号（带标的信息），按推荐时间倒序
#[tauri::command]
pub fn get_advisor_signals(db: DbState<'_>) -> Result<Vec<AdvisorSignal>, String> {
    let connection = lock_connection(&db)?;
    let sql = format!("{SIGNAL_SELECT} ORDER BY s.signal_at DESC, s.id DESC");
    let mut statement = connection.prepare(&sql).map_err(map_advisor_error)?;
    let rows = statement
        .query_map(params![], map_signal_row)
        .map_err(map_advisor_error)?;
    rows.collect::<Result<Vec<_>, _>>().map_err(map_advisor_error)
}

#[tauri::command]
pub fn create_advisor_signal(
    db: DbState<'_>,
    payload: CreateAdvisorSignalPayload,
) -> Result<AdvisorSignal, String> {
    let connection = lock_connection(&db)?;
    let now = now_iso();
    connection
        .execute(
            "INSERT INTO advisor_signals
                (advisor, asset_id, direction, signal_at, ref_price, target_price, stop_loss,
                 hypothetical_qty, note, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
            params![
                payload.advisor,
                payload.asset_id,
                payload.direction,
                payload.signal_at,
                payload.ref_price,
                payload.target_price,
                payload.stop_loss,
                payload.hypothetical_qty,
                payload.note,
                now,
                now,
            ],
        )
        .map_err(map_advisor_error)?;
    let id = connection.last_insert_rowid();
    get_signal_by_id(&connection, id)
}

#[tauri::command]
pub fn update_advisor_signal(
    db: DbState<'_>,
    payload: UpdateAdvisorSignalPayload,
) -> Result<AdvisorSignal, String> {
    let connection = lock_connection(&db)?;
    let now = now_iso();
    let changed = connection
        .execute(
            "UPDATE advisor_signals
             SET advisor = ?1, asset_id = ?2, direction = ?3, signal_at = ?4,
                 ref_price = ?5, target_price = ?6, stop_loss = ?7,
                 hypothetical_qty = ?8, note = ?9, updated_at = ?10
             WHERE id = ?11",
            params![
                payload.advisor,
                payload.asset_id,
                payload.direction,
                payload.signal_at,
                payload.ref_price,
                payload.target_price,
                payload.stop_loss,
                payload.hypothetical_qty,
                payload.note,
                now,
                payload.id,
            ],
        )
        .map_err(map_advisor_error)?;
    if changed == 0 {
        return Err("投顾记录不存在".to_string());
    }
    get_signal_by_id(&connection, payload.id)
}

#[tauri::command]
pub fn delete_advisor_signal(db: DbState<'_>, id: i64) -> Result<(), String> {
    let connection = lock_connection(&db)?;
    let changed = connection
        .execute("DELETE FROM advisor_signals WHERE id = ?1", params![id])
        .map_err(map_advisor_error)?;
    if changed == 0 {
        return Err("投顾记录不存在".to_string());
    }
    Ok(())
}

fn get_signal_by_id(connection: &Connection, id: i64) -> Result<AdvisorSignal, String> {
    let sql = format!("{SIGNAL_SELECT} WHERE s.id = ?1");
    let mut statement = connection.prepare(&sql).map_err(map_advisor_error)?;
    let mut rows = statement
        .query_map(params![id], map_signal_row)
        .map_err(map_advisor_error)?;
    rows.next()
        .ok_or_else(|| "投顾记录不存在".to_string())?
        .map_err(map_advisor_error)
}

/// 获取某推荐对应的跟随/复盘记录（一对一，可能不存在）
#[tauri::command]
pub fn get_follow_up(db: DbState<'_>, signal_id: i64) -> Result<Option<FollowUp>, String> {
    let connection = lock_connection(&db)?;
    let mut statement = connection
        .prepare("SELECT * FROM follow_ups WHERE signal_id = ?1 ORDER BY id DESC LIMIT 1")
        .map_err(map_advisor_error)?;
    let mut rows = statement
        .query_map(params![signal_id], map_follow_up_row)
        .map_err(map_advisor_error)?;
    match rows.next() {
        Some(row) => Ok(Some(row.map_err(map_advisor_error)?)),
        None => Ok(None),
    }
}

/// 创建或更新跟随/复盘记录（按 signal_id upsert）
#[tauri::command(rename_all = "camelCase")]
pub fn upsert_follow_up(
    db: DbState<'_>,
    payload: UpsertFollowUpPayload,
) -> Result<FollowUp, String> {
    let connection = lock_connection(&db)?;
    let now = now_iso();
    let followed_int: i64 = if payload.followed { 1 } else { 0 };

    // 先查是否已存在
    let existing_id: Option<i64> = connection
        .query_row(
            "SELECT id FROM follow_ups WHERE signal_id = ?1 ORDER BY id DESC LIMIT 1",
            params![payload.signal_id],
            |row| row.get(0),
        )
        .ok();

    if let Some(id) = existing_id {
        connection
            .execute(
                "UPDATE follow_ups
                 SET followed = ?1, actual_price = ?2, actual_qty = ?3, actual_at = ?4,
                     linked_trade_id = ?5, reason = ?6, range_high = ?7, range_low = ?8,
                     range_end_close = ?9, reviewed_at = ?10, updated_at = ?11
                 WHERE id = ?12",
                params![
                    followed_int,
                    payload.actual_price,
                    payload.actual_qty,
                    payload.actual_at,
                    payload.linked_trade_id,
                    payload.reason,
                    payload.range_high,
                    payload.range_low,
                    payload.range_end_close,
                    payload.reviewed_at,
                    now,
                    id,
                ],
            )
            .map_err(map_advisor_error)?;
        get_follow_up_by_id(&connection, id)
    } else {
        connection
            .execute(
                "INSERT INTO follow_ups
                    (signal_id, followed, actual_price, actual_qty, actual_at, linked_trade_id,
                     reason, range_high, range_low, range_end_close, reviewed_at, created_at, updated_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
                params![
                    payload.signal_id,
                    followed_int,
                    payload.actual_price,
                    payload.actual_qty,
                    payload.actual_at,
                    payload.linked_trade_id,
                    payload.reason,
                    payload.range_high,
                    payload.range_low,
                    payload.range_end_close,
                    payload.reviewed_at,
                    now,
                    now,
                ],
            )
            .map_err(map_advisor_error)?;
        let id = connection.last_insert_rowid();
        get_follow_up_by_id(&connection, id)
    }
}

#[tauri::command]
pub fn delete_follow_up(db: DbState<'_>, id: i64) -> Result<(), String> {
    let connection = lock_connection(&db)?;
    let changed = connection
        .execute("DELETE FROM follow_ups WHERE id = ?1", params![id])
        .map_err(map_advisor_error)?;
    if changed == 0 {
        return Err("复盘记录不存在".to_string());
    }
    Ok(())
}

fn get_follow_up_by_id(connection: &Connection, id: i64) -> Result<FollowUp, String> {
    let mut statement = connection
        .prepare("SELECT * FROM follow_ups WHERE id = ?1")
        .map_err(map_advisor_error)?;
    let mut rows = statement
        .query_map(params![id], map_follow_up_row)
        .map_err(map_advisor_error)?;
    rows.next()
        .ok_or_else(|| "复盘记录不存在".to_string())?
        .map_err(map_advisor_error)
}
```

- [ ] **Step 2: 修改 `src-tauri/src/commands/mod.rs`**

加 `pub mod advisor_commands;` 和 `pub use advisor_commands::*;`：

```rust
pub mod advisor_commands;
pub mod asset_commands;
pub mod market_observation_commands;
pub mod monthly_report_commands;
pub mod plan_commands;
pub mod position_commands;
pub mod review_commands;
pub mod setting_commands;
pub mod trade_commands;

pub use advisor_commands::*;
pub use asset_commands::*;
pub use market_observation_commands::*;
pub use monthly_report_commands::*;
pub use plan_commands::*;
pub use position_commands::*;
pub use review_commands::*;
pub use setting_commands::*;
pub use trade_commands::*;
```

- [ ] **Step 3: 修改 `src-tauri/src/lib.rs` 的 invoke_handler**

在 `commands::query_reviews,`（或任意 review 命令）之后，追加 7 个新命令：

```rust
            commands::get_advisor_signals,
            commands::create_advisor_signal,
            commands::update_advisor_signal,
            commands::delete_advisor_signal,
            commands::get_follow_up,
            commands::upsert_follow_up,
            commands::delete_follow_up,
```

- [ ] **Step 4: 验证编译**

```bash
cd /Users/geralt/projects/Zcode/invest-record-pro/src-tauri
export PATH="$HOME/.rustup/toolchains/stable-x86_64-apple-darwin/bin:/opt/homebrew/bin:$PATH"
cargo check 2>&1 | tail -5
```

Expected: `Finished` 无错误

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/commands/advisor_commands.rs src-tauri/src/commands/mod.rs src-tauri/src/lib.rs
git commit -m "feat(advisor): add Tauri commands for advisor signals and follow-ups"
```

---

## Task 4: 复盘计算纯函数（TDD）

**Files:**
- Create: `src/services/advisor-review-calc.service.ts`
- Test: `src/services/advisor-review-calc.service.test.ts`

**说明:** 这块是核心算法，必须 TDD。金额用「分」。先写测试再写实现。

- [ ] **Step 1: 写失败测试 `src/services/advisor-review-calc.service.test.ts`**

```typescript
/*
 * @Description: 投顾复盘计算单元测试
 */
import { describe, it, expect } from 'vitest'
import {
  evaluateSignal,
  aggregate,
  type ReviewInput,
} from './advisor-review-calc.service'

describe('evaluateSignal', () => {
  it('跟随时返回 followed 并透传 actualPnl', () => {
    const inp: ReviewInput = {
      refPrice: 1000, followed: true, actualPnl: 32000,
      hypotheticalQty: 0, rangeHigh: 0, rangeLow: 0, rangeEndClose: 0,
    }
    expect(evaluateSignal(inp)).toEqual({ outcomeType: 'followed', actualPnl: 32000 })
  })

  it('未跟随且上涨 → 踏空（有假设量算金额）', () => {
    const inp: ReviewInput = {
      refPrice: 1000, followed: false, actualPnl: 0,
      hypotheticalQty: 1000,
      rangeHigh: 1200, rangeLow: 950, rangeEndClose: 1150,
    }
    const out = evaluateSignal(inp)
    expect(out.outcomeType).toBe('missed_gain')
    expect(out.missedAmount).toBe(200000) // (1200-1000)*1000
    expect(out.missedPct).toBeCloseTo(0.2, 9)
  })

  it('未跟随且下跌 → 躲避（有假设量算金额）', () => {
    const inp: ReviewInput = {
      refPrice: 1000, followed: false, actualPnl: 0,
      hypotheticalQty: 1000,
      rangeHigh: 1020, rangeLow: 800, rangeEndClose: 850,
    }
    const out = evaluateSignal(inp)
    expect(out.outcomeType).toBe('avoided_loss')
    expect(out.avoidedAmount).toBe(200000) // (1000-800)*1000
    expect(out.avoidedPct).toBeCloseTo(0.2, 9)
  })

  it('未跟随且假设量为0 → 只返回比例不返回金额', () => {
    const inp: ReviewInput = {
      refPrice: 1000, followed: false, actualPnl: 0,
      hypotheticalQty: 0,
      rangeHigh: 1200, rangeLow: 950, rangeEndClose: 1150,
    }
    const out = evaluateSignal(inp)
    expect(out.outcomeType).toBe('missed_gain')
    expect(out.missedAmount).toBeUndefined()
    expect(out.missedPct).toBeCloseTo(0.2, 9)
  })

  it('refPrice <= 0 时退化为 avoided_loss', () => {
    const inp: ReviewInput = {
      refPrice: 0, followed: false, actualPnl: 0,
      hypotheticalQty: 1000, rangeHigh: 0, rangeLow: 0, rangeEndClose: 0,
    }
    expect(evaluateSignal(inp).outcomeType).toBe('avoided_loss')
  })
})

describe('aggregate', () => {
  it('正确汇总五条 outcome', () => {
    const outcomes = [
      evaluateSignal({ refPrice: 1000, followed: true, actualPnl: 32000, hypotheticalQty: 0, rangeHigh: 0, rangeLow: 0, rangeEndClose: 0 }),
      evaluateSignal({ refPrice: 1000, followed: true, actualPnl: -10000, hypotheticalQty: 0, rangeHigh: 0, rangeLow: 0, rangeEndClose: 0 }),
      evaluateSignal({ refPrice: 1000, followed: false, actualPnl: 0, hypotheticalQty: 1000, rangeHigh: 1200, rangeLow: 950, rangeEndClose: 1150 }),
      evaluateSignal({ refPrice: 1000, followed: false, actualPnl: 0, hypotheticalQty: 1000, rangeHigh: 1150, rangeLow: 950, rangeEndClose: 1100 }),
      evaluateSignal({ refPrice: 1000, followed: false, actualPnl: 0, hypotheticalQty: 1000, rangeHigh: 1020, rangeLow: 920, rangeEndClose: 950 }),
    ]
    const summary = aggregate(outcomes)
    expect(summary.total).toBe(5)
    expect(summary.followedCount).toBe(2)
    expect(summary.missedCount).toBe(2)
    expect(summary.avoidedCount).toBe(1)
    expect(summary.followedPnl).toBe(22000) // 32000 - 10000
    expect(summary.missedAmount).toBe(350000) // 200000 + 150000
    expect(summary.avoidedAmount).toBe(80000) // (1000-920)*1000
    expect(summary.accuracy).toBeCloseTo(4 / 5, 9)
    expect(summary.contribution).toBe(22000 - 350000)
  })

  it('空列表返回全零', () => {
    const summary = aggregate([])
    expect(summary.total).toBe(0)
    expect(summary.accuracy).toBe(0)
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

```bash
cd /Users/geralt/projects/Zcode/invest-record-pro
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:/opt/homebrew/bin:$PATH"
npm test -- --run advisor-review-calc 2>&1 | tail -10
```

Expected: FAIL — 找不到模块

- [ ] **Step 3: 写实现 `src/services/advisor-review-calc.service.ts`**

```typescript
/*
 * @Description: 投顾复盘计算 — 踏空/躲避金额（纯函数，金额用「分」）
 */

export type OutcomeType = 'followed' | 'missed_gain' | 'avoided_loss'

export interface ReviewInput {
  /** 推荐参考价（分） */
  refPrice: number
  followed: boolean
  /** 跟随时的实际盈亏（分） */
  actualPnl?: number
  /** 假设仓位（股数） */
  hypotheticalQty: number
  /** 区间最高价（分，手填） */
  rangeHigh: number
  /** 区间最低价（分，手填） */
  rangeLow: number
  /** 区间终点收盘价（分，手填） */
  rangeEndClose: number
}

export interface ReviewOutcome {
  outcomeType: OutcomeType
  actualPnl?: number
  missedAmount?: number
  missedPct?: number
  avoidedAmount?: number
  avoidedPct?: number
}

export interface WeeklySummary {
  total: number
  followedCount: number
  missedCount: number
  avoidedCount: number
  followedPnl: number
  missedAmount: number
  avoidedAmount: number
  accuracy: number
  contribution: number
}

/** 评估单条推荐信号（推荐区间法）。 */
export function evaluateSignal(inp: ReviewInput): ReviewOutcome {
  if (inp.followed) {
    return { outcomeType: 'followed', actualPnl: inp.actualPnl ?? 0 }
  }

  const ref = inp.refPrice
  if (ref <= 0) return { outcomeType: 'avoided_loss' }

  const rose = inp.rangeEndClose >= ref

  if (rose) {
    const amt =
      inp.hypotheticalQty > 0 ? (inp.rangeHigh - ref) * inp.hypotheticalQty : undefined
    const pct = (inp.rangeHigh - ref) / ref
    return { outcomeType: 'missed_gain', missedAmount: amt, missedPct: pct }
  }

  const amt =
    inp.hypotheticalQty > 0 ? (ref - inp.rangeLow) * inp.hypotheticalQty : undefined
  const pct = (ref - inp.rangeLow) / ref
  return { outcomeType: 'avoided_loss', avoidedAmount: amt, avoidedPct: pct }
}

/** 汇总一批 outcome（按老师/周聚合）。 */
export function aggregate(outcomes: ReviewOutcome[]): WeeklySummary {
  const total = outcomes.length
  const followed = outcomes.filter((o) => o.outcomeType === 'followed')
  const missed = outcomes.filter((o) => o.outcomeType === 'missed_gain')
  const avoided = outcomes.filter((o) => o.outcomeType === 'avoided_loss')
  const followedPnl = followed.reduce((s, o) => s + (o.actualPnl ?? 0), 0)
  const missedAmount = missed.reduce((s, o) => s + (o.missedAmount ?? 0), 0)
  const avoidedAmount = avoided.reduce((s, o) => s + (o.avoidedAmount ?? 0), 0)
  const hits = followed.length + missed.length
  return {
    total,
    followedCount: followed.length,
    missedCount: missed.length,
    avoidedCount: avoided.length,
    followedPnl,
    missedAmount,
    avoidedAmount,
    accuracy: total > 0 ? hits / total : 0,
    contribution: followedPnl - missedAmount,
  }
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
npm test -- --run advisor-review-calc 2>&1 | tail -10
```

Expected: 全部 PASS（7 个测试）

- [ ] **Step 5: Commit**

```bash
git add src/services/advisor-review-calc.service.ts src/services/advisor-review-calc.service.test.ts
git commit -m "feat(advisor): add review calc pure functions with unit tests"
```

---

## Task 5: 前端类型定义

**Files:**
- Create: `src/domain/types/advisor.ts`
- Modify: `src/domain/types/index.ts`

- [ ] **Step 1: 写 `src/domain/types/advisor.ts`**

```typescript
/*
 * @Description: 投顾推荐类型定义（金额字段存「分」）
 */

/** 推荐方向 */
export type AdvisorDirection = 'buy' | 'sell'

/** 投顾推荐信号 */
export type AdvisorSignal = {
  id: number
  advisor: string
  assetId: number
  direction: AdvisorDirection
  signalAt: string
  /** 推荐参考价（分） */
  refPrice: number
  /** 目标价（分，可空） */
  targetPrice: number | null
  /** 止损位（分，可空） */
  stopLoss: number | null
  /** 假设仓位（股数） */
  hypotheticalQty: number
  note: string | null
  createdAt: string
  updatedAt: string
  // JOIN 字段
  assetCode?: string | null
  assetName?: string | null
  assetMarket?: string | null
}

export type AdvisorSignalCreatePayload = Omit<
  AdvisorSignal,
  'id' | 'createdAt' | 'updatedAt' | 'assetCode' | 'assetName' | 'assetMarket'
>

export type AdvisorSignalUpdatePayload = Omit<
  AdvisorSignal,
  'createdAt' | 'updatedAt' | 'assetCode' | 'assetName' | 'assetMarket'
>

/** 跟随 + 复盘记录 */
export type FollowUp = {
  id: number
  signalId: number
  followed: boolean
  actualPrice: number | null
  actualQty: number | null
  actualAt: string | null
  linkedTradeId: number | null
  reason: string | null
  rangeHigh: number | null
  rangeLow: number | null
  rangeEndClose: number | null
  reviewedAt: string | null
  createdAt: string
  updatedAt: string
}

export type FollowUpUpsertPayload = Omit<FollowUp, 'id' | 'createdAt' | 'updatedAt'>

/** 推荐方向标签 */
export const ADVISOR_DIRECTION_LABELS: Record<AdvisorDirection, string> = {
  buy: '买入推荐',
  sell: '卖出推荐',
}
```

- [ ] **Step 2: 修改 `src/domain/types/index.ts`**

先读该文件看现有导出格式：

```bash
cat src/domain/types/index.ts
```

在文件末尾追加（保持与现有导出风格一致）：

```typescript
export * from './advisor'
```

- [ ] **Step 3: 类型检查**

```bash
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:/opt/homebrew/bin:$PATH"
npm run check 2>&1 | tail -10
```

Expected: 无类型错误（可能有现有项目的 warning，无视）

- [ ] **Step 4: Commit**

```bash
git add src/domain/types/advisor.ts src/domain/types/index.ts
git commit -m "feat(advisor): add TypeScript domain types"
```

---

## Task 6: 前端 Repository（Tauri invoke 封装）

**Files:**
- Create: `src/features/advisor/repository.ts`

- [ ] **Step 1: 写 `src/features/advisor/repository.ts`**

```typescript
/*
 * @Description: 投顾推荐 Tauri IPC 仓库（camelCase↔snake_case 转换）
 */
import { invoke } from '@tauri-apps/api/core'
import type {
  AdvisorSignal,
  AdvisorSignalCreatePayload,
  AdvisorSignalUpdatePayload,
  FollowUp,
  FollowUpUpsertPayload,
} from '@/domain/types'

function toCreateSignalCommandPayload(payload: AdvisorSignalCreatePayload) {
  return {
    advisor: payload.advisor,
    asset_id: payload.assetId,
    direction: payload.direction,
    signal_at: payload.signalAt,
    ref_price: payload.refPrice,
    target_price: payload.targetPrice,
    stop_loss: payload.stopLoss,
    hypothetical_qty: payload.hypotheticalQty,
    note: payload.note,
  }
}

function toUpdateSignalCommandPayload(payload: AdvisorSignalUpdatePayload) {
  return { id: payload.id, ...toCreateSignalCommandPayload(payload) }
}

function toUpsertFollowUpCommandPayload(payload: FollowUpUpsertPayload) {
  return {
    signal_id: payload.signalId,
    followed: payload.followed,
    actual_price: payload.actualPrice,
    actual_qty: payload.actualQty,
    actual_at: payload.actualAt,
    linked_trade_id: payload.linkedTradeId,
    reason: payload.reason,
    range_high: payload.rangeHigh,
    range_low: payload.rangeLow,
    range_end_close: payload.rangeEndClose,
    reviewed_at: payload.reviewedAt,
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return '未知错误'
}

function createRepositoryError(message: string, cause: unknown): Error {
  return Object.assign(new Error(`${message}: ${getErrorMessage(cause)}`), { cause })
}

export async function getAdvisorSignals(): Promise<AdvisorSignal[]> {
  try {
    return await invoke<AdvisorSignal[]>('get_advisor_signals')
  } catch (error) {
    throw createRepositoryError('获取投顾推荐失败', error)
  }
}

export async function createAdvisorSignal(
  payload: AdvisorSignalCreatePayload,
): Promise<AdvisorSignal> {
  try {
    return await invoke<AdvisorSignal>('create_advisor_signal', {
      payload: toCreateSignalCommandPayload(payload),
    })
  } catch (error) {
    throw createRepositoryError('创建投顾推荐失败', error)
  }
}

export async function updateAdvisorSignal(
  payload: AdvisorSignalUpdatePayload,
): Promise<AdvisorSignal> {
  try {
    return await invoke<AdvisorSignal>('update_advisor_signal', {
      payload: toUpdateSignalCommandPayload(payload),
    })
  } catch (error) {
    throw createRepositoryError('更新投顾推荐失败', error)
  }
}

export async function deleteAdvisorSignal(id: number): Promise<void> {
  try {
    await invoke<void>('delete_advisor_signal', { id })
  } catch (error) {
    throw createRepositoryError('删除投顾推荐失败', error)
  }
}

export async function getFollowUp(signalId: number): Promise<FollowUp | null> {
  try {
    return await invoke<FollowUp | null>('get_follow_up', { signalId })
  } catch (error) {
    throw createRepositoryError('获取复盘记录失败', error)
  }
}

export async function upsertFollowUp(payload: FollowUpUpsertPayload): Promise<FollowUp> {
  try {
    return await invoke<FollowUp>('upsert_follow_up', {
      payload: toUpsertFollowUpCommandPayload(payload),
    })
  } catch (error) {
    throw createRepositoryError('保存复盘记录失败', error)
  }
}

export async function deleteFollowUp(id: number): Promise<void> {
  try {
    await invoke<void>('delete_follow_up', { id })
  } catch (error) {
    throw createRepositoryError('删除复盘记录失败', error)
  }
}
```

- [ ] **Step 2: 类型检查**

```bash
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:/opt/homebrew/bin:$PATH"
npm run check 2>&1 | tail -10
```

Expected: 无新增类型错误

- [ ] **Step 3: Commit**

```bash
git add src/features/advisor/repository.ts
git commit -m "feat(advisor): add Tauri IPC repository"
```

---

## Task 7: 前端 Pinia Store

**Files:**
- Create: `src/features/advisor/store.ts`

- [ ] **Step 1: 写 `src/features/advisor/store.ts`**

```typescript
/*
 * @Description: 投顾推荐 Pinia Store
 */
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useMessage } from 'naive-ui'
import type {
  AdvisorSignal,
  AdvisorSignalCreatePayload,
  AdvisorSignalUpdatePayload,
  FollowUp,
  FollowUpUpsertPayload,
} from '@/domain/types'
import * as repository from './repository'

export const useAdvisorStore = defineStore('advisor', () => {
  const signals = ref<AdvisorSignal[]>([])
  const followUps = ref<Map<number, FollowUp>>(new Map())
  const loading = ref(false)
  const error = ref<string | null>(null)
  const message = useMessage()

  const advisors = computed(() => {
    const set = new Set<string>()
    signals.value.forEach((s) => set.add(s.advisor))
    return Array.from(set)
  })

  async function loadSignals(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      signals.value = await repository.getAdvisorSignals()
      // 预载每条信号的复盘记录
      const map = new Map<number, FollowUp>()
      await Promise.all(
        signals.value.map(async (s) => {
          const fu = await repository.getFollowUp(s.id)
          if (fu) map.set(s.id, fu)
        }),
      )
      followUps.value = map
    } catch (e) {
      error.value = e instanceof Error ? e.message : '加载失败'
      message.error(error.value)
    } finally {
      loading.value = false
    }
  }

  async function createSignal(payload: AdvisorSignalCreatePayload): Promise<void> {
    try {
      const created = await repository.createAdvisorSignal(payload)
      signals.value = [created, ...signals.value]
      message.success('推荐已创建')
    } catch (e) {
      message.error(e instanceof Error ? e.message : '创建失败')
      throw e
    }
  }

  async function updateSignal(payload: AdvisorSignalUpdatePayload): Promise<void> {
    try {
      const updated = await repository.updateAdvisorSignal(payload)
      const idx = signals.value.findIndex((s) => s.id === updated.id)
      if (idx >= 0) signals.value[idx] = updated
      message.success('推荐已更新')
    } catch (e) {
      message.error(e instanceof Error ? e.message : '更新失败')
      throw e
    }
  }

  async function removeSignal(id: number): Promise<void> {
    try {
      await repository.deleteAdvisorSignal(id)
      signals.value = signals.value.filter((s) => s.id !== id)
      followUps.value.delete(id)
      message.success('推荐已删除')
    } catch (e) {
      message.error(e instanceof Error ? e.message : '删除失败')
      throw e
    }
  }

  async function saveFollowUp(payload: FollowUpUpsertPayload): Promise<void> {
    try {
      const saved = await repository.upsertFollowUp(payload)
      followUps.value.set(payload.signalId, saved)
      message.success('复盘已保存')
    } catch (e) {
      message.error(e instanceof Error ? e.message : '保存失败')
      throw e
    }
  }

  function getFollowUpFor(signalId: number): FollowUp | undefined {
    return followUps.value.get(signalId)
  }

  return {
    signals,
    followUps,
    loading,
    error,
    advisors,
    loadSignals,
    createSignal,
    updateSignal,
    removeSignal,
    saveFollowUp,
    getFollowUpFor,
  }
})
```

- [ ] **Step 2: 类型检查**

```bash
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:/opt/homebrew/bin:$PATH"
npm run check 2>&1 | tail -10
```

Expected: 无新增类型错误

- [ ] **Step 3: Commit**

```bash
git add src/features/advisor/store.ts
git commit -m "feat(advisor): add Pinia store"
```

---

## Task 8: 录入推荐表单组件

**Files:**
- Create: `src/features/advisor/components/AdvisorSignalForm.vue`

**说明:** 用 Naive UI 表单。金额输入「元」，提交前 ×100 转分。需读 assets 列表做下拉，所以先看现有 asset store 的 API。

- [ ] **Step 1: 确认 asset store API**

```bash
grep -n "export const useAssetStore\|async function load\|assets = " src/features/assets/store.ts | head -10
```

记下 asset store 的加载方法和 signals ref 名（通常是 `assets` 和 `loadAssets`）。

- [ ] **Step 2: 写 `src/features/advisor/components/AdvisorSignalForm.vue`**

```vue
<!--
  @Description: 录入投顾推荐表单（金额输入元，内部转分）
-->
<template>
  <NCard title="录入推荐" size="small" class="mb-4">
    <NForm ref="formRef" :model="form" :rules="rules" label-placement="left" label-width="90">
      <NFormItem label="老师" path="advisor">
        <NInput v-model:value="form.advisor" placeholder="如 张老师" />
      </NFormItem>
      <NFormItem label="标的" path="assetId">
        <NSelect
          v-model:value="form.assetId"
          :options="assetOptions"
          placeholder="选择标的"
          filterable
        />
      </NFormItem>
      <NFormItem label="方向" path="direction">
        <NRadioGroup v-model:value="form.direction">
          <NRadioButton value="buy">买入推荐</NRadioButton>
          <NRadioButton value="sell">卖出推荐</NRadioButton>
        </NRadioGroup>
      </NFormItem>
      <NFormItem label="推荐时间" path="signalAt">
        <NDatePicker v-model:value="signalAtTs" type="datetime" />
      </NFormItem>
      <NFormItem label="参考价" path="refPrice">
        <NInputNumber v-model:value="form.refPrice" :precision="2" placeholder="元" />
      </NFormItem>
      <NFormItem label="目标价">
        <NInputNumber v-model:value="form.targetPrice" :precision="2" placeholder="元（可选）" />
      </NFormItem>
      <NFormItem label="止损位">
        <NInputNumber v-model:value="form.stopLoss" :precision="2" placeholder="元（可选）" />
      </NFormItem>
      <NFormItem label="假设量">
        <NInputNumber v-model:value="form.hypotheticalQty" :precision="0" placeholder="股数" />
      </NFormItem>
      <NFormItem label="备注">
        <NInput v-model:value="form.note" type="textarea" :autosize="{ minRows: 2 }" />
      </NFormItem>
      <NFormItem :label-width="0">
        <NSpace>
          <NButton type="primary" :loading="submitting" @click="handleSubmit">提交</NButton>
          <NButton @click="handleReset">重置</NButton>
        </NSpace>
      </NFormItem>
    </NForm>
  </NCard>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import {
  NCard, NForm, NFormItem, NInput, NInputNumber, NSelect, NRadioGroup,
  NRadioButton, NDatePicker, NButton, NSpace, useMessage,
  type FormInst, type FormRules,
} from 'naive-ui'
import { useAssetStore } from '@/features/assets'
import { useAdvisorStore } from '../store'
import type { AdvisorDirection, AdvisorSignalCreatePayload } from '@/domain/types'

const assetStore = useAssetStore()
const advisorStore = useAdvisorStore()
const message = useMessage()
const formRef = ref<FormInst | null>(null)
const submitting = ref(false)

// 金额以「元」输入，提交时转分
const form = reactive({
  advisor: '',
  assetId: number | null,
  direction: 'buy' as AdvisorDirection,
  refPrice: number | null,       // 元
  targetPrice: number | null,    // 元
  stopLoss: number | null,       // 元
  hypotheticalQty: 1000,
  note: '',
})
const signalAtTs = ref<number>(Date.now())

const rules: FormRules = {
  advisor: { required: true, message: '请输入老师名', trigger: 'blur' },
  assetId: { required: true, type: 'number', message: '请选择标的', trigger: 'change' },
  refPrice: { required: true, type: 'number', message: '请输入参考价', trigger: 'blur' },
}

const assetOptions = computed(() =>
  (assetStore.assets ?? []).map((a) => ({
    label: `${a.code} ${a.name}`,
    value: a.id,
  })),
)

// 首次进入时确保 asset 列表已加载
void assetStore.loadAssets?.().catch(() => {
  /* 若 store 无 loadAssets 方法，下方 watch 会兜底 */
})

async function handleSubmit() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }
  if (form.assetId == null || form.refPrice == null) {
    message.warning('请完善必填项')
    return
  }
  submitting.value = true
  const payload: AdvisorSignalCreatePayload = {
    advisor: form.advisor.trim(),
    assetId: form.assetId,
    direction: form.direction,
    signalAt: new Date(signalAtTs.value).toISOString(),
    refPrice: Math.round(form.refPrice * 100),
    targetPrice: form.targetPrice == null ? null : Math.round(form.targetPrice * 100),
    stopLoss: form.stopLoss == null ? null : Math.round(form.stopLoss * 100),
    hypotheticalQty: form.hypotheticalQty,
    note: form.note.trim() || null,
  }
  try {
    await advisorStore.createSignal(payload)
    handleReset()
  } finally {
    submitting.value = false
  }
}

function handleReset() {
  form.advisor = ''
  form.assetId = null
  form.direction = 'buy'
  form.refPrice = null
  form.targetPrice = null
  form.stopLoss = null
  form.hypotheticalQty = 1000
  form.note = ''
  signalAtTs.value = Date.now()
  formRef.value?.restoreValidation()
}
</script>
```

- [ ] **Step 3: 类型检查**

```bash
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:/opt/homebrew/bin:$PATH"
npm run check 2>&1 | tail -15
```

如果报 `assetStore.loadAssets` 或 `assetStore.assets` 不存在，去 `src/features/assets/store.ts` 核对真实导出名并修正（用 Step 1 查到的名字）。

Expected: 无新增类型错误

- [ ] **Step 4: Commit**

```bash
git add src/features/advisor/components/AdvisorSignalForm.vue
git commit -m "feat(advisor): add signal form component"
```

---

## Task 9: 跟随/复盘弹窗（核心交互）

**Files:**
- Create: `src/features/advisor/components/FollowUpDrawer.vue`

**说明:** 这是模块核心。录入跟随情况 + 区间价，实时预览踏空/躲避金额。金额输入元、内部转分、计算结果再转回元展示。

- [ ] **Step 1: 写 `src/features/advisor/components/FollowUpDrawer.vue`**

```vue
<!--
  @Description: 跟随/复盘弹窗 — 手填区间价，实时算踏空/躲避
-->
<template>
  <NDrawer :show="show" :width="520" @update:show="(v) => emit('update:show', v)">
    <NDrawerContent title="复盘推荐" closable>
      <NSpace vertical :size="16">
        <NRadioGroup v-model:value="followed">
          <NRadioButton :value="true">已跟随</NRadioButton>
          <NRadioButton :value="false">未跟随</NRadioButton>
        </NRadioGroup>

        <template v-if="followed">
          <NFormItem label="实际价（元）">
            <NInputNumber v-model:value="actualPrice" :precision="2" />
          </NFormItem>
          <NFormItem label="实际数量">
            <NInputNumber v-model:value="actualQty" :precision="0" />
          </NFormItem>
          <NFormItem label="实际日期">
            <NDatePicker v-model:value="actualAtTs" type="datetime" />
          </NFormItem>
          <NFormItem label="实际盈亏（元，可选）">
            <NInputNumber v-model:value="actualPnlYuan" :precision="2" />
          </NFormItem>
        </template>

        <template v-else>
          <NFormItem label="未跟随原因">
            <NInput v-model:value="reason" type="textarea" :autosize="{ minRows: 2 }" />
          </NFormItem>
          <NFormItem label="区间最高价（元）">
            <NInputNumber v-model:value="rangeHigh" :precision="2" />
          </NFormItem>
          <NFormItem label="区间最低价（元）">
            <NInputNumber v-model:value="rangeLow" :precision="2" />
          </NFormItem>
          <NFormItem label="区间终点收盘价（元）">
            <NInputNumber v-model:value="rangeEndClose" :precision="2" />
          </NFormItem>
        </template>

        <NCard title="实时计算结果" size="small" :bordered="true">
          <NSpace vertical :size="8">
            <div>结果类型：<NTag :type="outcomeTagType">{{ outcomeLabel }}</NTag></div>
            <div v-if="outcome?.missedAmount != null" class="pos">
              踏空金额：¥{{ (outcome.missedAmount / 100).toFixed(2) }}
              （{{ ((outcome.missedPct ?? 0) * 100).toFixed(1) }}%）
            </div>
            <div v-else-if="outcome?.missedPct != null">
              踏空比例：{{ ((outcome.missedPct) * 100).toFixed(1) }}%（未填假设量）
            </div>
            <div v-if="outcome?.avoidedAmount != null" class="neg">
              躲避金额：¥{{ (outcome.avoidedAmount / 100).toFixed(2) }}
              （{{ ((outcome.avoidedPct ?? 0) * 100).toFixed(1) }}%）
            </div>
            <div v-else-if="outcome?.avoidedPct != null">
              躲避比例：{{ ((outcome.avoidedPct) * 100).toFixed(1) }}%（未填假设量）
            </div>
            <div v-if="outcome?.outcomeType === 'followed' && actualPnlYuan != null" class="pos">
              跟随盈亏：¥{{ actualPnlYuan.toFixed(2) }}
            </div>
            <div class="muted">参考价：¥{{ (signal?.refPrice ?? 0) / 100 }}</div>
          </NSpace>
        </NCard>
      </NSpace>

      <template #footer>
        <NSpace>
          <NButton @click="emit('update:show', false)">取消</NButton>
          <NButton type="primary" :loading="saving" @click="handleSave">保存复盘</NButton>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  NDrawer, NDrawerContent, NSpace, NRadioGroup, NRadioButton, NFormItem,
  NInputNumber, NInput, NDatePicker, NButton, NCard, NTag,
} from 'naive-ui'
import { evaluateSignal, type ReviewOutcome } from '@/services/advisor-review-calc.service'
import { useAdvisorStore } from '../store'
import type { AdvisorSignal, FollowUpUpsertPayload } from '@/domain/types'

const props = defineProps<{ show: boolean; signal: AdvisorSignal | null }>()
const emit = defineEmits<{ 'update:show': [boolean] }>()
const advisorStore = useAdvisorStore()
const saving = ref(false)

const followed = ref(true)
const actualPrice = ref<number | null>(null)       // 元
const actualQty = ref<number | null>(null)
const actualAtTs = ref<number>(Date.now())
const actualPnlYuan = ref<number | null>(null)     // 元
const reason = ref('')
const rangeHigh = ref<number | null>(null)         // 元
const rangeLow = ref<number | null>(null)
const rangeEndClose = ref<number | null>(null)

// 弹窗打开时，用已有 follow_up 预填
watch(
  () => [props.show, props.signal?.id],
  ([show]) => {
    if (!show || !props.signal) return
    const existing = advisorStore.getFollowUpFor(props.signal.id)
    followed.value = existing?.followed ?? true
    actualPrice.value = existing?.actualPrice != null ? existing.actualPrice / 100 : null
    actualQty.value = existing?.actualQty ?? null
    actualAtTs.value = existing?.actualAt ? new Date(existing.actualAt).getTime() : Date.now()
    actualPnlYuan.value = null
    reason.value = existing?.reason ?? ''
    rangeHigh.value = existing?.rangeHigh != null ? existing.rangeHigh / 100 : null
    rangeLow.value = existing?.rangeLow != null ? existing.rangeLow / 100 : null
    rangeEndClose.value = existing?.rangeEndClose != null ? existing.rangeEndClose / 100 : null
  },
  { immediate: true },
)

const outcome = computed<ReviewOutcome | null>(() => {
  if (!props.signal) return null
  return evaluateSignal({
    refPrice: props.signal.refPrice,
    followed: followed.value,
    actualPnl: actualPnlYuan.value != null ? Math.round(actualPnlYuan.value * 100) : undefined,
    hypotheticalQty: props.signal.hypotheticalQty,
    rangeHigh: rangeHigh.value != null ? Math.round(rangeHigh.value * 100) : 0,
    rangeLow: rangeLow.value != null ? Math.round(rangeLow.value * 100) : 0,
    rangeEndClose: rangeEndClose.value != null ? Math.round(rangeEndClose.value * 100) : 0,
  })
})

const outcomeLabel = computed(() => {
  switch (outcome.value?.outcomeType) {
    case 'followed': return '已跟随'
    case 'missed_gain': return '踏空'
    case 'avoided_loss': return '躲避'
    default: return '—'
  }
})
const outcomeTagType = computed<'success' | 'warning' | 'error'>(() => {
  switch (outcome.value?.outcomeType) {
    case 'followed': return 'success'
    case 'missed_gain': return 'error'
    case 'avoided_loss': return 'warning'
    default: return 'warning'
  }
})

async function handleSave() {
  if (!props.signal) return
  if (!followed.value && (rangeHigh.value == null || rangeLow.value == null || rangeEndClose.value == null)) {
    return
  }
  saving.value = true
  const payload: FollowUpUpsertPayload = {
    signalId: props.signal.id,
    followed: followed.value,
    actualPrice: actualPrice.value != null ? Math.round(actualPrice.value * 100) : null,
    actualQty: actualQty.value,
    actualAt: followed.value ? new Date(actualAtTs.value).toISOString() : null,
    linkedTradeId: null,
    reason: reason.value.trim() || null,
    rangeHigh: rangeHigh.value != null ? Math.round(rangeHigh.value * 100) : null,
    rangeLow: rangeLow.value != null ? Math.round(rangeLow.value * 100) : null,
    rangeEndClose: rangeEndClose.value != null ? Math.round(rangeEndClose.value * 100) : null,
    reviewedAt: new Date().toISOString(),
  }
  try {
    await advisorStore.saveFollowUp(payload)
    emit('update:show', false)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.pos { color: #e74c3c; font-weight: 600; }
.neg { color: #27ae60; font-weight: 600; }
.muted { color: #999; font-size: 12px; }
</style>
```

- [ ] **Step 2: 类型检查**

```bash
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:/opt/homebrew/bin:$PATH"
npm run check 2>&1 | tail -15
```

Expected: 无新增类型错误

- [ ] **Step 3: Commit**

```bash
git add src/features/advisor/components/FollowUpDrawer.vue
git commit -m "feat(advisor): add follow-up drawer with live review calc"
```

---

## Task 10: 推荐列表 + 汇总卡片 + 页面主体

**Files:**
- Create: `src/features/advisor/components/AdvisorSignalTable.vue`
- Create: `src/features/advisor/components/ReviewSummaryCard.vue`
- Create: `src/features/advisor/components/AdvisorPageBody.vue`

- [ ] **Step 1: 写 `src/features/advisor/components/AdvisorSignalTable.vue`**

```vue
<!--
  @Description: 推荐列表 — 含复盘按钮，触发 FollowUpDrawer
-->
<template>
  <NCard title="推荐列表" size="small">
    <NDataTable
      :columns="columns"
      :data="signals"
      :loading="loading"
      :pagination="{ pageSize: 15 }"
      size="small"
    />
  </NCard>
</template>

<script setup lang="ts">
import { h } from 'vue'
import { NCard, NDataTable, NButton, NTag, type DataTableColumns } from 'naive-ui'
import type { AdvisorSignal, FollowUp } from '@/domain/types'
import { ADVISOR_DIRECTION_LABELS } from '@/domain/types'
import { useAdvisorStore } from '../store'

const store = useAdvisorStore()
const props = defineProps<{
  signals: AdvisorSignal[]
  loading: boolean
}>()
const emit = defineEmits<{ review: [AdvisorSignal] }>()

function yuan(cents: number | null | undefined): string {
  if (cents == null) return '—'
  return (cents / 100).toFixed(2)
}

function statusOf(s: AdvisorSignal): { label: string; type: 'default' | 'success' | 'warning' } {
  const fu: FollowUp | undefined = store.getFollowUpFor(s.id)
  if (!fu) return { label: '待复盘', type: 'default' }
  if (fu.followed) return { label: '已跟随', type: 'success' }
  // 未跟随
  if (fu.rangeEndClose != null && s.refPrice > 0) {
    return fu.rangeEndClose >= s.refPrice
      ? { label: '踏空', type: 'warning' }
      : { label: '躲避', type: 'success' }
  }
  return { label: '未跟随', type: 'default' }
}

const columns: DataTableColumns<AdvisorSignal> = [
  { title: '老师', key: 'advisor', width: 90 },
  {
    title: '时间', key: 'signalAt', width: 150,
    render: (r) => new Date(r.signalAt).toLocaleString('zh-CN'),
  },
  {
    title: '标的', key: 'asset', width: 130,
    render: (r) => `${r.assetCode ?? ''} ${r.assetName ?? ''}`,
  },
  {
    title: '方向', key: 'direction', width: 90,
    render: (r) => ADVISOR_DIRECTION_LABELS[r.direction],
  },
  { title: '参考价', key: 'refPrice', width: 90, render: (r) => yuan(r.refPrice) },
  { title: '目标价', key: 'targetPrice', width: 90, render: (r) => yuan(r.targetPrice) },
  { title: '止损', key: 'stopLoss', width: 90, render: (r) => yuan(r.stopLoss) },
  { title: '假设量', key: 'hypotheticalQty', width: 80 },
  {
    title: '状态', key: 'status', width: 90,
    render: (r) => {
      const st = statusOf(r)
      return h(NTag, { type: st.type, size: 'small' }, { default: () => st.label })
    },
  },
  {
    title: '操作', key: 'actions', width: 120,
    render: (r) =>
      h(NButton, { size: 'small', type: 'primary', ghost: true, onClick: () => emit('review', r) },
        { default: () => '复盘' }),
  },
]
</script>
```

- [ ] **Step 2: 写 `src/features/advisor/components/ReviewSummaryCard.vue`**

```vue
<!--
  @Description: 按老师汇总 — 准确率/跟随收益/踏空/躲避/贡献度
-->
<template>
  <NCard title="按老师汇总" size="small" class="mb-4">
    <NDataTable :columns="columns" :data="rows" size="small" :pagination="false" />
  </NCard>
</template>

<script setup lang="ts">
import { computed, h } from 'vue'
import { NCard, NDataTable, type DataTableColumns } from 'naive-ui'
import type { AdvisorSignal, FollowUp } from '@/domain/types'
import { aggregate, evaluateSignal } from '@/services/advisor-review-calc.service'
import { useAdvisorStore } from '../store'

const store = useAdvisorStore()
const props = defineProps<{ signals: AdvisorSignal[] }>()

interface SummaryRow {
  advisor: string
  total: number
  accuracy: string
  followedPnl: string
  missedAmount: string
  avoidedAmount: string
  contribution: string
  contributionClass: string
}

const rows = computed<SummaryRow[]>(() => {
  // 按老师分组
  const byAdvisor = new Map<string, AdvisorSignal[]>()
  for (const s of props.signals) {
    const arr = byAdvisor.get(s.advisor) ?? []
    arr.push(s)
    byAdvisor.set(s.advisor, arr)
  }
  const result: SummaryRow[] = []
  for (const [advisor, sigs] of byAdvisor) {
    const outcomes = sigs.map((s) => {
      const fu: FollowUp | undefined = store.getFollowUpFor(s.id)
      return evaluateSignal({
        refPrice: s.refPrice,
        followed: fu?.followed ?? false,
        actualPnl: undefined,
        hypotheticalQty: s.hypotheticalQty,
        rangeHigh: fu?.rangeHigh ?? 0,
        rangeLow: fu?.rangeLow ?? 0,
        rangeEndClose: fu?.rangeEndClose ?? 0,
      })
    })
    const sum = aggregate(outcomes)
    const contribution = sum.contribution
    result.push({
      advisor,
      total: sum.total,
      accuracy: `${(sum.accuracy * 100).toFixed(0)}%`,
      followedPnl: `¥${(sum.followedPnl / 100).toFixed(2)}`,
      missedAmount: `¥${(sum.missedAmount / 100).toFixed(2)}`,
      avoidedAmount: `¥${(sum.avoidedAmount / 100).toFixed(2)}`,
      contribution: `¥${(contribution / 100).toFixed(2)}`,
      contributionClass: contribution >= 0 ? 'pos' : 'neg',
    })
  }
  return result
})

const columns: DataTableColumns<SummaryRow> = [
  { title: '老师', key: 'advisor' },
  { title: '推荐数', key: 'total' },
  { title: '准确率', key: 'accuracy' },
  { title: '跟随收益', key: 'followedPnl' },
  { title: '踏空', key: 'missedAmount' },
  { title: '躲避', key: 'avoidedAmount' },
  {
    title: '贡献度', key: 'contribution',
    render: (r) => h('span', { class: r.contributionClass }, r.contribution),
  },
]
</script>

<style scoped>
:deep(.pos) { color: #e74c3c; font-weight: 600; }
:deep(.neg) { color: #27ae60; font-weight: 600; }
</style>
```

- [ ] **Step 3: 写 `src/features/advisor/components/AdvisorPageBody.vue`**

```vue
<!--
  @Description: 投顾页面主体 — 组合表单/汇总/列表/弹窗
-->
<template>
  <NSpace vertical :size="16">
    <AdvisorSignalForm />
    <ReviewSummaryCard :signals="store.signals" />
    <AdvisorSignalTable
      :signals="store.signals"
      :loading="store.loading"
      @review="handleReview"
    />
    <FollowUpDrawer v-model:show="drawerShow" :signal="activeSignal" />
  </NSpace>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { NSpace } from 'naive-ui'
import type { AdvisorSignal } from '@/domain/types'
import { useAdvisorStore } from '../store'
import AdvisorSignalForm from './AdvisorSignalForm.vue'
import AdvisorSignalTable from './AdvisorSignalTable.vue'
import ReviewSummaryCard from './ReviewSummaryCard.vue'
import FollowUpDrawer from './FollowUpDrawer.vue'

const store = useAdvisorStore()
const drawerShow = ref(false)
const activeSignal = ref<AdvisorSignal | null>(null)

onMounted(() => {
  void store.loadSignals()
})

function handleReview(signal: AdvisorSignal) {
  activeSignal.value = signal
  drawerShow.value = true
}
</script>
```

- [ ] **Step 4: 类型检查**

```bash
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:/opt/homebrew/bin:$PATH"
npm run check 2>&1 | tail -15
```

Expected: 无新增类型错误

- [ ] **Step 5: Commit**

```bash
git add src/features/advisor/components/
git commit -m "feat(advisor): add signal table, summary card, page body"
```

---

## Task 11: 接入路由与导航

**Files:**
- Create: `src/pages/advisor/AdvisorPage.vue`
- Modify: `src/app/router/index.ts`
- Modify: `src/app/layout/components/SideNav.vue`

- [ ] **Step 1: 写 `src/pages/advisor/AdvisorPage.vue`**

```vue
<template>
  <div class="p-4">
    <AdvisorPageBody />
  </div>
</template>

<script setup lang="ts">
import AdvisorPageBody from '@/features/advisor/components/AdvisorPageBody.vue'
</script>
```

- [ ] **Step 2: 修改 `src/app/router/index.ts`**

在 imports 区（与其它 Page import 并列）加：

```typescript
import AdvisorPage from '@/pages/advisor/AdvisorPage.vue'
```

在 children 数组中，于 `reviews` 路由之后加：

```typescript
      { path: 'advisor', name: 'advisor', component: AdvisorPage, meta: { title: '投顾推荐' } },
```

- [ ] **Step 3: 修改 `src/app/layout/components/SideNav.vue`**

在 `menuOptions` 数组中，于 `reviews` 之后加：

```typescript
  { label: '投顾推荐', key: 'advisor' },
```

- [ ] **Step 4: 完整启动验证（端到端冒烟）**

```bash
cd /Users/geralt/projects/Zcode/invest-record-pro
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$HOME/.rustup/toolchains/stable-x86_64-apple-darwin/bin:/opt/homebrew/bin:$PATH"
npm run tauri dev &  # 后台
sleep 120  # 等编译+启动
```

手动在应用窗口验证（由人或下一轮 Agent 执行）：
1. 左侧导航出现「投顾推荐」菜单
2. 点进去，看到「录入推荐」表单 + 汇总卡片 + 列表
3. 录入一条推荐（需先在「投资标的」页有一个标的）→ 列表出现
4. 点「复盘」→ 弹窗 → 选「未跟随」→ 填区间价 → 实时显示踏空/躲避金额
5. 保存 → 汇总卡片更新

```bash
pkill -f invest-record-pro
```

- [ ] **Step 5: 跑全量测试确保未破坏现有**

```bash
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:/opt/homebrew/bin:$PATH"
npm test -- --run 2>&1 | tail -15
```

Expected: 原有 132 个测试 + 新增 7 个 advisor 测试 = 139 个全部 PASS

- [ ] **Step 6: Commit**

```bash
git add src/pages/advisor/ src/app/router/index.ts src/app/layout/components/SideNav.vue
git commit -m "feat(advisor): wire up advisor page route and nav"
```

---

## 自检清单（计划作者自查）

### 规格覆盖

| 规格要求 | 对应任务 |
|---|---|
| advisor_signals 表 | Task 1 |
| follow_ups 表 | Task 1 |
| Rust model（含 JOIN 字段） | Task 2 |
| Tauri command CRUD | Task 3 |
| 复盘算法 evaluateSignal（followed/missed_gain/avoided_loss） | Task 4 |
| aggregate 汇总 | Task 4 |
| 前端类型 + 标签映射 | Task 5 |
| repository（camelCase↔snake_case） | Task 6 |
| Pinia store | Task 7 |
| 录入推荐表单（金额元↔分） | Task 8 |
| 跟随/复盘弹窗（手动填区间价 + 实时计算） | Task 9 |
| 推荐列表（含状态标签） | Task 10 |
| 按老师汇总卡片 | Task 10 |
| 路由 + 导航接入 | Task 11 |

### 类型/命名一致性

- Rust `AdvisorSignal` 字段 `ref_price` ↔ TS `refPrice` ↔ 前端 payload 转换 ✓（Task 2/5/6 对齐）
- Rust command 名 `create_advisor_signal` ↔ TS invoke `'create_advisor_signal'` ✓
- `evaluateSignal` 入参 `ReviewInput`（Task 4 定义）在 Task 9/10 使用一致 ✓
- `hypotheticalQty` 在 Rust `i64`、TS `number`、表单 `:precision="0"` ✓

### 占位符扫描

- 无 TBD/TODO ✓
- 每个代码步骤含完整代码 ✓
- Task 8 Step 1 有「核对真实 asset store 导出名」的验证步骤（因为该 API 名需读实际代码）✓
