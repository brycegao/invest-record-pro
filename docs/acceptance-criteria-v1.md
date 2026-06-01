# invest-record-pro v1 Acceptance Criteria

This document defines the v1 acceptance criteria for `invest-record-pro`.

The criteria align with the v1 product positioning and architecture. They are written as verifiable pass/fail requirements and should be used as the basis for development, testing, and release readiness.

## Acceptance Stages

v1 acceptance is split into two stages:

```text
MVP Core Gate
-> v1 Release Gate
```

MVP Core Gate verifies the core investment decision loop. v1 Release Gate verifies packaging, export, restore, and release-level polish.

## 1. Project-Level Acceptance

### 1.1 Positioning And Compliance

- [ ] Does not automatically provide or fetch real-time market data.
- [ ] Allows users to manually record market observations such as index points and turnover.
- [ ] Does not provide stock recommendation, prediction, or investment advice.
- [ ] Does not provide automated trading.
- [ ] Does not depend on cloud services.
- [ ] Does not force user login.
- [ ] Does not include an account system.
- [ ] Stores all user data locally.

### 1.2 Pure Local-First Behavior

- [ ] The app can run completely offline except for user-triggered local Ollama calls.
- [ ] The app makes no external network requests.
- [ ] The only allowed HTTP endpoint is local Ollama:

```text
http://localhost:11434
```

- [ ] The app does not make background external HTTP requests.
- [ ] The app does not upload data to any third party.
- [ ] The app has no analytics, telemetry, tracking, or push notification.

**Allowed network exceptions（仅限用户主动触发）**:

- [ ] Ollama local API（`http://localhost:11434/*`）：用户触发 AI 生成或连接测试时。
- [ ] GitHub Releases：用户手动点击「检查更新」时（需 opt-in，非自动后台）。
- [ ] 以上请求均为用户主动行为，应用不会在后台自动发起任何网络请求。

### 1.3 Privacy

- [ ] The app shows the local database file path to the user.
- [ ] The app supports local database backup.
- [ ] The app supports local data export.
- [ ] The app supports local data deletion.

## 2. Technical Architecture Acceptance

### 2.1 Layering

- [ ] Dependency direction follows the architecture document.
- [ ] UI layers may depend on use-case services.
- [ ] Services may depend on domain and infrastructure.
- [ ] Infrastructure may depend on platform adapters.
- [ ] `domain` has no dependency on Vue, Tauri, SQLite, HTTP, or infrastructure.
- [ ] Features do not directly import from each other.
- [ ] Cross-module logic lives in `services`.

Reference dependency shape:

```text
app/pages/features -> services
services -> domain
services -> infrastructure
infrastructure -> platform
domain -> no framework/runtime dependencies
```

### 2.2 Module Boundaries

- [ ] Each feature exposes public APIs only through `index.ts`.
- [ ] No module imports another feature's internal components directly.
- [ ] Shared UI components are placed in `shared/components`.
- [ ] Database operations are collected in `infrastructure/repositories`.

### 2.3 Technology Stack

- [ ] Tauri 2.
- [ ] Vue 3.
- [ ] TypeScript.
- [ ] Vite.
- [ ] Pinia.
- [ ] Vue Router.
- [ ] Naive UI.
- [ ] ECharts.
- [ ] SQLite.
- [ ] Ollama local runtime.

## 3. MVP Core Gate

MVP Core Gate is complete when the investment decision loop works end to end:

```text
Create asset
-> Create buy/sell plan
-> Record trade
-> View position and profit/loss
-> Write review
-> Generate or draft monthly review with local AI
```

### 3.1 Assets

- [ ] Supports create, edit, delete, and list.
- [ ] Includes fields:
  - Code.
  - Name.
  - Type.
  - Market.
  - Risk level.
  - Related index.
  - Investment thesis.
  - Notes.
- [ ] Persists data to SQLite.
- [ ] Supports search.
- [ ] Supports filtering.

### 3.2 Plans

- [ ] Supports buy plans.
- [ ] Supports sell plans.
- [ ] Supports trigger conditions.
- [ ] Supports staged rules.
- [ ] Supports planned position ratio or amount.
- [ ] Supports related index point.
- [ ] Supports effective period.
- [ ] Supports status flow:

```text
pending -> partial -> completed -> canceled
```

- [ ] Stores plan rules structurally in `plan_rules`.
- [ ] Plans can be linked to assets.

### 3.3 Trades

- [ ] Supports buy records.
- [ ] Supports sell records.
- [ ] Can link to an asset.
- [ ] Can optionally link to a plan.
- [ ] Records price.
- [ ] Records quantity.
- [ ] Records amount.
- [ ] Records fee.
- [ ] Records related index point.
- [ ] Records operation reason.
- [ ] Records whether the trade followed the plan.
- [ ] Records emotion state.
- [ ] Records deviation reason.
- [ ] Calculates realized profit/loss according to `business-rules-v1.md`.
- [ ] Uses weighted average cost for profit/loss calculation.
- [ ] Includes buy fees in holding cost.
- [ ] Deducts sell fees from realized profit/loss.
- [ ] Resets cost to zero after position quantity becomes zero.

### 3.4 Positions

- [ ] Supports manual position snapshots.
- [ ] Supports calculated position summary from local trade records where possible.
- [ ] Displays total assets.
- [ ] Displays cash.
- [ ] Displays asset class allocation.
- [ ] Displays single asset allocation.
- [ ] Displays market allocation.
- [ ] Shows position charts with ECharts.
- [ ] Shows overweight and underweight hints according to configured or plan-based thresholds.
- [ ] Calculates unrealized profit/loss from user-entered current price or position snapshot.
- [ ] Does not fetch current prices from network sources.

### 3.5 Reviews

- [ ] Supports single-trade review.
- [ ] Records execution quality.
- [ ] Records emotional issues.
- [ ] Records improvement notes.
- [ ] Can link to a trade.
- [ ] Supports review tags:
  - Good execution.
  - Poor execution.
  - Rule issue.
  - Emotional issue.

### 3.6 Market Observations

- [ ] Records date.
- [ ] Records manually entered index points.
- [ ] Records manually entered market turnover.
- [ ] Records market sentiment.
- [ ] Records policy notes.
- [ ] Records personal judgement.
- [ ] Can be used as an investment journal.

### 3.7 Monthly Reports

- [ ] Aggregates monthly trades.
- [ ] Aggregates monthly plans.
- [ ] Aggregates monthly reviews.
- [ ] Aggregates monthly positions.
- [ ] Calls local Ollama to generate review content when available.
- [ ] Outputs discipline execution rate.
- [ ] Outputs emotion analysis.
- [ ] Outputs improvement suggestions.
- [ ] AI result is editable by the user.
- [ ] Saves `input_snapshot_json`.
- [ ] Saves model information.
- [ ] Saves prompt version.
- [ ] Saves generation duration.
- [ ] Gracefully degrades when Ollama is not running.
- [ ] Does not crash when Ollama is unavailable.

### 3.8 MVP Settings And Local Data

- [ ] Shows database path.
- [ ] Supports local SQLite backup.
- [ ] Supports local data deletion.
- [ ] Supports at least CSV export for trade records.

## 4. v1 Release Gate

v1 Release Gate is complete when the MVP Core Gate has passed and the following release-level requirements are also satisfied.

### 4.1 Import, Export, Backup, Restore

- [ ] Supports one-click SQLite backup.
- [ ] Supports one-click restore.
- [ ] Exports trade records to Excel or CSV.
- [ ] Exports monthly reports to PDF or Markdown.
- [ ] Data can be migrated across versions through migrations.

### 4.2 Packaging

- [ ] Windows can install and uninstall normally.
- [ ] macOS can install and uninstall normally.
- [ ] Windows build package works.
- [ ] macOS build package works.

### 4.3 Client Experience

- [ ] All tables support search where applicable.
- [ ] All tables support sorting where applicable.
- [ ] All tables support filtering where applicable.
- [ ] All dialogs can close normally.
- [ ] All dialogs can submit normally.
- [ ] All dialogs can cancel normally.
- [ ] Form validation covers required fields.
- [ ] Form validation covers numeric ranges.
- [ ] Form validation covers data formats.
- [ ] No UI freeze in core flows.
- [ ] No visible runtime error in core flows.

### 4.4 Target Metrics

These metrics are target acceptance goals. They should be optimized toward but should not block early MVP validation unless the deviation is severe.

- [ ] Startup time target: less than 2 seconds.
- [ ] Installer size target: less than 15MB.
- [ ] Memory usage target: less than 100MB.

## 5. AI Acceptance

### 5.1 AI Scope

- [ ] AI only performs review summary.
- [ ] AI only performs discipline analysis.
- [ ] AI only performs plan checking.
- [ ] AI only performs behavior pattern summary.
- [ ] AI does not recommend stocks.
- [ ] AI does not predict markets.
- [ ] AI does not provide automated trading.
- [ ] AI does not provide deterministic buy/sell points.

### 5.2 Local Constraint

- [ ] AI only accesses local Ollama:

```text
http://localhost:11434
```

- [ ] No external AI service is used.
- [ ] No user data is uploaded.

### 5.3 Robustness

- [ ] If Ollama is not running, AI features are hidden or disabled with setup guidance.
- [ ] If selected model is unavailable, the app does not crash.
- [ ] If selected model is unavailable, the app does not block the main workflow.
- [ ] AI output can be edited and manually corrected.

## 6. Database Acceptance

- [ ] Uses local SQLite file.
- [ ] Does not use IndexedDB as the primary database.
- [ ] Includes tables:
  - `assets`
  - `plans`
  - `plan_rules`
  - `trades`
  - `positions`
  - `reviews`
  - `market_observations`
  - `monthly_reports`
  - `settings`
- [ ] Supports migrations.
- [ ] Data can be backed up.
- [ ] Data can be migrated.
- [ ] Data can be exported.
- [ ] Numeric precision follows `business-rules-v1.md`.
- [ ] Decimal values do not suffer from floating-point calculation errors.
- [ ] Displayed money amounts keep 2 decimal places.
- [ ] v1 does not calculate dividends.
- [ ] v1 does not calculate splits.
- [ ] v1 does not support leverage.
- [ ] v1 does not support multi-currency accounting.

## 7. Development And Engineering Acceptance

- [ ] TypeScript has no unsafe broad `any` usage.
- [ ] ESLint has no errors.
- [ ] Path aliases are consistent.
- [ ] Shared logic is extracted to `composables` or `utils`.
- [ ] Business logic and UI are separated.
- [ ] Git commits are clear.
- [ ] The app builds successfully:

```bash
npm run tauri build
```

## 8. Final v1 Completion Rule

v1 is complete only when:

- [ ] MVP Core Gate passes.
- [ ] v1 Release Gate passes.
- [ ] AI acceptance passes.
- [ ] Database acceptance passes.
- [ ] Engineering acceptance passes.
- [ ] No external network request exists.
- [ ] No user data upload exists.
