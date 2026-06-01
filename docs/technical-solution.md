# Technical Solution

## Project Positioning

`invest-record-pro` is a desktop tool for:

```text
pure端侧 + privacy-first + serverless + local AI + investment decision records
```

The product is not a stock recommendation tool or a market data terminal. It helps individual investors complete the full decision loop:

## Document Purpose

This document explains how to implement the chosen architecture and key technical decisions. It focuses on directory structure, feature boundaries, data flow, and concrete implementation guidance.

For the high-level stack rationale and technology choice justification, see `docs/tech-decision.md`.

```text
Asset management
-> Investment plan
-> Trade execution
-> Position tracking
-> Review
-> Rule improvement
```

## MVP Technology Stack

```text
Tauri 2
Vue 3
TypeScript
Vite
Pinia
Vue Router
Naive UI
ECharts
SQLite
Ollama
```

| Technology | Role |
|---|---|
| Tauri 2 | Desktop shell, local file access, SQLite, native capabilities |
| Vue 3 | UI for forms, tables, reports, and workflows |
| TypeScript | Type safety for plans, trades, positions, and reports |
| Vite | Frontend build tool |
| Pinia | Frontend state management |
| Vue Router | Page routing |
| Naive UI | Forms, tables, modals, menus, layout components |
| ECharts | Charts for positions, returns, and execution metrics |
| SQLite | Local database without server dependency |
| Ollama | Local AI runtime for review and summary generation |

## Platform Strategy

The first stage only targets desktop:

```text
Windows + macOS
```

Mobile may be considered later only as a lightweight viewing client.

Explicit non-goals:

```text
WeChat mini program
Cloud service
Mandatory account system
Cloud AI
Automated trading
Stock recommendation system
```

## Architecture Overview

Vertical dependency flow:

```text
app
-> pages
-> features
-> application services
-> domain
-> infrastructure
-> platform
```

Dependencies must flow downward only. Lower layers must not depend on upper layers.

Horizontal business modules:

```text
assets              Asset management
plans               Buy/sell plans
trades              Trade records
positions           Position statistics
reviews             Review records
market-observations Market observations
monthly-reports     Monthly reports / AI summaries
settings            Local settings
```

Core architecture rule:

```text
Horizontal modules must not depend on each other directly.
```

Forbidden examples:

```text
features/trades -> features/plans
features/monthly-reports -> features/trades
features/reviews -> features/positions
```

Cross-module coordination must go through:

```text
application services
repositories
DTOs
database queries
```

## Recommended Directory Structure

```text
invest-record-pro/
  src/
    app/
      App.vue
      main.ts
      router/
      providers/
      layout/

    pages/
      dashboard/
      assets/
      plans/
      trades/
      positions/
      reviews/
      market-observations/
      monthly-reports/
      settings/

    features/
      assets/
        components/
        composables/
        stores/
        types.ts
        index.ts
      plans/
      trades/
      positions/
      reviews/
      market-observations/
      monthly-reports/
      settings/

    services/
      monthly-report-service/
      position-calculation-service/
      plan-execution-service/
      import-export-service/

    domain/
      assets/
      plans/
      trades/
      positions/
      reviews/
      market/
      reports/
      shared/

    infrastructure/
      repositories/
      sqlite/
      ollama/
      import-export/
      mappers/

    platform/
      tauri/
      filesystem/
      app-paths/

    shared/
      components/
      composables/
      utils/
      constants/
      types/

  src-tauri/
    src/
    migrations/
    capabilities/

  docs/
```

## Layer Responsibilities

### app

- Application bootstrap.
- Router initialization.
- Pinia initialization.
- Naive UI provider.
- Global layout.

### pages

- Route-level screens.
- Compose feature components.
- Handle page-level layout.
- Avoid complex business logic.

### features

- Business module UI.
- Module components.
- Module stores.
- Module composables.
- Module-level UI types.
- Expose only public APIs through `index.ts`.
- Do not import other features directly.

### services

- Cross-module use cases.
- Monthly report aggregation.
- Position calculation.
- Plan execution matching.
- Import/export orchestration.
- AI prompt assembly.

### domain

- Pure business models.
- Pure business rules.
- Trade direction.
- Plan status.
- Position ratio.
- Execution rate calculation.
- No dependency on Vue, Tauri, SQLite, or HTTP.

### infrastructure

- SQLite repositories.
- Ollama client.
- Import/export adapters.
- Data mappers.

### platform

- Tauri command wrappers.
- File system access.
- Local app paths.
- Native capability bridge.

## SQLite Plan

The main database uses SQLite. Do not use IndexedDB as the primary database.

Core tables:

```text
assets
plans
plan_rules
trades
positions
reviews
market_observations
monthly_reports
settings
```

Principles:

- Local storage.
- Easy backup.
- Easy migration.
- Easy export.
- Migrations should be designed early.
- AI monthly reports must save input snapshots for traceability.

## Ollama And Local AI Plan

AI only uses local Ollama.

Default detection endpoint:

```text
http://localhost:11434
```

If Ollama is unavailable:

```text
Disable AI features gracefully.
Show installation/configuration guidance.
Keep all non-AI core features available.
```

The first version does not bundle model files.

AI feature scope:

```text
Monthly investment review
Discipline analysis
Plan consistency check
Natural-language-to-structured-plan conversion
Emotional trading pattern summary
Review draft generation
```

AI must not do:

```text
Stock recommendation
Deterministic buy/sell points
Short-term market prediction
Automated trading
```

## AI Monthly Report Flow

```text
SQLite raw data
-> MonthlyAggregationService
-> Structured monthly summary JSON
-> PromptTemplateService
-> Ollama local model
-> User edits and confirms
-> Save monthly_reports
```

`monthly_reports` should save:

```text
month
input_snapshot_json
ai_summary
user_edited_summary
model_name
prompt_version
generation_duration_ms
created_at
updated_at
```

## Module Boundary Rules

Each feature exposes only public APIs through `index.ts`.

Forbidden:

```ts
import AssetForm from '@/features/assets/components/AssetForm.vue'
```

If a component is truly reusable, move it to:

```text
shared/components/
```

When monthly reports need data from trades, plans, reviews, or positions:

```text
monthly-reports feature
-> monthly-report-service
-> repositories
-> SQLite
```

The monthly report feature must not directly import:

```text
features/trades
features/plans
features/reviews
features/positions
```

### Cross-Module Data Access Example

When `monthly-reports` needs trades, plans, reviews, and positions data, the call chain looks like:

```text
pages/monthly-reports/
  → features/monthly-reports/stores/useMonthlyReportsStore.ts
    → services/monthly-report-service/index.ts
      → infrastructure/repositories/TradeRepository.ts   // direct SQL
      → infrastructure/repositories/PlanRepository.ts     // direct SQL
      → infrastructure/repositories/ReviewRepository.ts  // direct SQL
      → infrastructure/repositories/PositionRepository.ts // direct SQL
        → platform/tauri/sqlite-commands.ts              // Tauri invoke
```

`monthly-report-service` example interface:

```ts
// services/monthly-report-service/types.ts
interface MonthlyReportInput {
  month: string                     // "2026-05"
  trades: AggregatedTrade[]         // from TradeRepository
  plans: AggregatedPlan[]           // from PlanRepository
  reviews: AggregatedReview[]       // from ReviewRepository
  positions: AggregatedPosition[]   // from PositionRepository
  marketObservations: MarketObservation[] // from MarketObservationRepository
}

// services/monthly-report-service/index.ts
export async function generateMonthlyReport(
  month: string
): Promise<MonthlyReportInput> {
  const [trades, plans, reviews, positions, observations] = await Promise.all([
    tradeRepo.findByMonth(month),
    planRepo.findByMonth(month),
    reviewRepo.findByMonth(month),
    positionRepo.findByMonth(month),
    marketObsRepo.findByMonth(month),
  ])

  return {
    month,
    trades: aggregateTrades(trades),
    plans: aggregatePlans(plans),
    reviews,
    positions,
    marketObservations: observations,
  }
}
```

This pattern ensures:
- No feature module imports another feature module.
- Cross-module data flows through services → repositories → platform.
- Each repository encapsulates its own SQL queries.

## MVP Development Order

```text
1. Desktop project scaffold
2. SQLite schema and migration
3. Asset management
4. Buy/sell plans
5. Trade records
6. Position statistics
7. Review records
8. Market observations
9. AI monthly summary
10. Import/export/backup
11. Packaging and release
```

## Testing Strategy

### domain

- Pure unit tests.
- Position ratio.
- Execution rate.
- Trade amount.
- Drawdown calculation.

### services

- Use-case tests.
- Monthly aggregation.
- Position calculation.
- Plan matching.

### infrastructure

- SQLite repository tests.
- Migration tests.
- Ollama availability detection.

### features/pages

- Component tests where useful.
- Manual browser verification for MVP.

## Architecture Constraints

Recommended later:

```text
ESLint import rules
Path aliases
Feature public API convention
Dependency graph check
```

Manual rules from day one:

```text
No feature imports another feature.
Cross-module logic belongs in services.
Domain stays pure.
Tauri/Rust stays focused on local system access.
```

## Key Risks

```text
Tauri 2 permission configuration needs care.
SQLite migration design should start early.
Ollama may not be installed on the user's machine.
Local model quality may vary by model and hardware.
AI output must be editable.
Large models can be slow on low-end machines.
Packaging and auto-update need dedicated work later.
```

## Summary

The MVP uses:

```text
Tauri 2 + Vue 3 + TypeScript + SQLite + Ollama
```

It builds a local privacy-first desktop investment review tool. Horizontally, business modules are isolated. Vertically, dependencies flow downward. AI is used only for local review, discipline analysis, and summary generation, not for stock recommendation or automated trading.
