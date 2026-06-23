# 投顾推荐追踪 + 复盘模块 改造设计

- **日期**: 2026-06-19
- **状态**: approved (pending review)
- **底座项目**: invest-record-pro (Tauri2 + Vue3 + Rust + rusqlite)
- **改造原则**: 零侵入式扩展,完全顺从底座架构,不修改它的盈亏/持仓/行情逻辑

---

## 1. 背景与决策

### 1.1 为何选 invest-record-pro 做底座

经代码核查(非 README),该项目的现成能力:
- ✅ 完整的交易记账(`trades` 表,金额 INTEGER 存分)
- ✅ `trades.fee` 手动填费用字段 —— 完美匹配"费用自己手算"需求
- ✅ 持仓快照机制(`positions`/`position_items`,价格手动录)
- ✅ 单笔交易复盘模块(`reviews`,可复用 UI 模式)
- ✅ AI 月报闭环(`ollama.service`,可复用 AI 链路)
- ✅ 132 单元测试全绿,工程质量可信

### 1.2 已知限制(接受,不改造)

- **盈亏是总额差法,非 FIFO 配对**: `realizedPnl = totalSellAmount - totalBuyAmount`。算不出单次建仓→清仓盈亏,也算不出做T。**本次改造不碰这块**,投顾复盘独立计算。
- **无行情抓取**: Cargo.toml 无 reqwest/http 库,价格全手动录。**投顾复盘的区间最高/最低价由用户手动填入**,与持仓快照设计一致。
- **港股费用**: assets.market 有 HK 字段,但费用无子项拆分。fee 手动填,用户自行按港股费率算后填入。

### 1.3 本次改造范围(唯一目标)

**在底座上新增一个「投顾推荐追踪 + 按需复盘」模块**,实现:
1. 录入投顾老师的买卖推荐(老师/标的/方向/推荐时点价/目标价/止损/假设仓位)
2. 记录是否跟随(跟随则填实际操作,可关联到 trades)
3. 按需复盘:用户手动填入区间最高/最低/收盘价,系统计算踏空/躲避金额
4. 复盘结果汇总(准确率、踏空总额、躲避总额、贡献度)

---

## 2. 数据模型

### 2.1 新增 migration: `src-tauri/migrations/0002_advisor.sql`

```sql
-- 投顾推荐信号（价格×100 存分，数量×1000，严守底座金额精度约定）
CREATE TABLE IF NOT EXISTS advisor_signals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  advisor TEXT NOT NULL,                  -- 老师名（如"张老师"）
  asset_id INTEGER NOT NULL,              -- 关联 assets.id（复用现成标的库）
  direction TEXT NOT NULL,                -- 'buy' | 'sell'
  signal_at TEXT NOT NULL,                -- 推荐日期时间 ISO8601
  ref_price INTEGER NOT NULL,             -- 推荐时点参考价（分）
  target_price INTEGER,                   -- 目标卖点（分,可空）
  stop_loss INTEGER,                      -- 止损位（分,可空）
  hypothetical_qty INTEGER DEFAULT 0,     -- 假设仓位（股数,千分单位）
  note TEXT,                              -- 推荐理由/原话
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_advisor_signals_advisor ON advisor_signals(advisor);
CREATE INDEX IF NOT EXISTS idx_advisor_signals_asset ON advisor_signals(asset_id);
CREATE INDEX IF NOT EXISTS idx_advisor_signals_signal_at ON advisor_signals(signal_at);

-- 跟随 + 复盘记录（一对一关联推荐）
CREATE TABLE IF NOT EXISTS follow_ups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  signal_id INTEGER NOT NULL,
  followed INTEGER NOT NULL DEFAULT 0,        -- 0=未跟随 1=已跟随
  actual_price INTEGER,                       -- 实际跟进价（分）
  actual_qty INTEGER,                         -- 实际数量
  actual_at TEXT,                             -- 实际操作时间
  linked_trade_id INTEGER,                    -- 可选:关联 trades.id
  reason TEXT,                                -- 未跟随原因
  -- 复盘用区间价（用户手动填,分）
  range_high INTEGER,                         -- 区间最高价
  range_low INTEGER,                          -- 区间最低价
  range_end_close INTEGER,                    -- 区间终点收盘价
  reviewed_at TEXT,                           -- 复盘时间
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (signal_id) REFERENCES advisor_signals(id) ON DELETE CASCADE,
  FOREIGN KEY (linked_trade_id) REFERENCES trades(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_follow_ups_signal ON follow_ups(signal_id);
```

### 2.2 设计要点

- **价格全部 INTEGER 存分**(×100),数量按底座约定(×1000)。与 `trades` 表精度规范一致。
- **`asset_id` 关联现成 `assets` 表**:A股/港股/美股代码都能进,复用它的标的库,不重复造。
- **区间价放 `follow_ups`**:因为你按需复盘某条推荐时才填,手动录入,与持仓快照同思路。
- **`linked_trade_id` 可选关联**:跟随后可关联到一笔真实交易,后续可从该交易读实际盈亏(本次先留字段,读取逻辑后续补)。

---

## 3. 复盘算法(纯前端 TS)

放 `src/services/advisor-review-calc.service.ts`,**纯函数**,带单测。不依赖 Rust 后端算。

### 3.1 算法(推荐区间法)

对每条「买入推荐 + 对应 follow_up」:

```
ref = signal.ref_price
if followed == 1:
    outcome = "followed"
    actual_pnl = 从 linked_trade 读取（若有）否则手填 actual_price*qty - ref*hypo_qty
elif range_end_close >= ref:      # 区间净涨 → 踏空
    outcome = "missed_gain"
    missed_amount = (range_high - ref) × hypothetical_qty   # 填了假设量才算
    missed_pct = (range_high - ref) / ref
else:                             # 区间净跌 → 躲避
    outcome = "avoided_loss"
    avoided_amount = (ref - range_low) × hypothetical_qty
    avoided_pct = (ref - range_low) / ref
```

### 3.2 汇总(WeeklySummary)

```
total = 推荐总数
followed_count / missed_count / avoided_count
followed_pnl = Σ 已跟随的实际收益
missed_amount = Σ 踏空金额
avoided_amount = Σ 躲避金额
accuracy = (followed + missed_gain) / total   # 跟随命中 + 涨了踏空都算"推荐对了"
contribution = followed_pnl - missed_amount   # 贡献度
```

---

## 4. 改造文件清单

### 4.1 Rust 后端(照抄 review 模块模式)

| 文件 | 动作 | 职责 |
|---|---|---|
| `src-tauri/migrations/0002_advisor.sql` | 新建 | 建表 |
| `src-tauri/src/models/advisor.rs` | 新建 | AdvisorSignal / FollowUp 结构体 + CRUD payload |
| `src-tauri/src/models/mod.rs` | 修改 | 加 `pub mod advisor;` |
| `src-tauri/src/commands/advisor_commands.rs` | 新建 | Tauri command:create/query/update/delete |
| `src-tauri/src/commands/mod.rs` | 修改 | 加 `pub mod advisor_commands;` |
| `src-tauri/src/lib.rs` | 修改 | 注册新 command 到 invoke_handler |
| `src-tauri/src/db/migration.rs` | **不改** | 它是自动发现机制:扫描 migrations/*.sql 按版本号排序执行,新建 0002 文件即自动加载 |

### 4.2 前端(照抄 features/reviews 结构)

| 文件 | 动作 | 职责 |
|---|---|---|
| `src/domain/types/advisor.ts` | 新建 | 类型定义 + label 映射 |
| `src/domain/types/index.ts` | 修改 | 导出新类型 |
| `src/services/advisor-review-calc.service.ts` | 新建 | 复盘计算纯函数 |
| `src/services/advisor-review-calc.service.test.ts` | 新建 | 单元测试 |
| `src/features/advisor/repository.ts` | 新建 | Tauri invoke 封装 |
| `src/features/advisor/store.ts` | 新建 | Pinia store |
| `src/features/advisor/components/AdvisorSignalForm.vue` | 新建 | 录入推荐表单 |
| `src/features/advisor/components/AdvisorSignalTable.vue` | 新建 | 推荐列表 |
| `src/features/advisor/components/FollowUpDrawer.vue` | 新建 | 跟随/复盘弹窗(填区间价) |
| `src/features/advisor/components/ReviewSummaryCard.vue` | 新建 | 汇总卡片 |
| `src/features/advisor/components/index.ts` | 新建 | 导出 |
| `src/features/advisor/index.ts` | 新建 | 模块入口 |
| `src/pages/advisor/AdvisorPage.vue` | 新建 | 投顾页 |
| `src/app/router/index.ts` | 修改 | 加路由 `/advisor` |
| `src/app/layout/components/SideNav.vue` | 修改 | 加导航项 |

---

## 5. 页面交互(按需复盘)

```
【投顾推荐页】
┌─────────────────────────────────────────────┐
│ [录入推荐] 表单:老师/标的/方向/推荐价/目标/止损/假设量 │
├─────────────────────────────────────────────┤
│ 推荐列表                                     │
│ 老师 | 日期 | 标的 | 方向 | 推荐价 | 状态 | 操作 │
│ 张老师|06-15|600519|买入|10.0 |待复盘|[复盘] │
├─────────────────────────────────────────────┤
│ 点击[复盘] → 弹出 FollowUpDrawer             │
│  ○ 已跟随  ○ 未跟随                          │
│  [若跟随] 实际价/数量/日期/关联交易            │
│  [若未跟随] 区间最高/最低/收盘价(手动填)       │
│  → 实时显示:踏空/躲避金额计算结果             │
├─────────────────────────────────────────────┤
│ [按老师汇总] 准确率/踏空/躲避/贡献度          │
└─────────────────────────────────────────────┘
```

---

## 6. 测试策略

- **复盘算法单测**(`advisor-review-calc.service.test.ts`):覆盖 followed/missed_gain/avoided_loss 三种 outcome + 汇总
- **Rust CRUD**:手动 invoke 验证(它现有测试都是前端 vitest,Rust 端靠 E2E)
- **不破坏现有 132 测试**:改造完成后 `npm test` 必须仍全绿

---

## 7. 不做的事(YAGNI)

- ❌ 不改底座的盈亏算法(总额差法保留)
- ❌ 不加行情抓取(价格手动填)
- ❌ 不加做T识别(后续再说)
- ❌ 不加费用自动计算(fee 手动填)
- ❌ 不加港股费用子项拆分(fee 手动填)
