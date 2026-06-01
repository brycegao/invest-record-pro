# Project Architecture

## Architecture Goal

invest-record-pro uses a feature-first architecture.

Horizontal boundaries are divided by business modules. Vertical boundaries are divided by dependency layers.

Business modules must not depend on each other directly.

## Core Rule

```text
Horizontal modules cannot import from each other.
```

Allowed:

```text
features/trades -> shared/*
features/trades -> services/*
features/trades -> types/*
```

Forbidden:

```text
features/trades -> features/plans
features/reviews -> features/trades
features/monthly-reports -> features/positions
```

If one module needs data from another module, it must go through a shared service, application service, database query, or explicit DTO.

## Horizontal Business Modules

First MVP modules:

```text
assets
plans
trades
positions
reviews
market-observations
monthly-reports
settings
```

### assets

Manages investment assets.

Examples:

- 510050 SSE 50 ETF.
- CSI 300 ETF.
- Nasdaq 100 QDII fund.

Responsibilities:

- Asset list.
- Asset creation and editing.
- Asset metadata.
- Related index.
- Risk level.
- Investment thesis.

### plans

Manages buy/sell plans and structured rules.

Responsibilities:

- Buy plan.
- Sell plan.
- Plan status.
- Plan rules.
- Trigger conditions.
- Staged execution rules.
- Plan notes and risk notes.

### trades

Manages actual trade records.

Responsibilities:

- Buy/sell records.
- Price, quantity, amount, fee.
- Related index point at execution.
- Execution reason.
- Whether the trade followed a plan.
- Deviation reason.
- Emotion state.

### positions

Shows position and exposure summary.

Responsibilities:

- Current holding summary.
- Cash ratio.
- Asset allocation.
- Single asset exposure.
- Market exposure.
- Position change trend.

Note:

Positions should be calculated from trades and snapshots through services or database queries. The `positions` module must not import `trades` module UI or internal code.

### reviews

Manages post-trade review records.

Responsibilities:

- Trade review.
- Plan review.
- Discipline review.
- Mistake tagging.
- Improvement notes.
- Review status.

### market-observations

Manages market context records.

Responsibilities:

- Index points.
- Market volume.
- Policy or macro notes.
- Market sentiment.
- User judgement.

### monthly-reports

Manages monthly investment reports and AI summaries.

Responsibilities:

- Select month.
- Aggregate monthly data.
- Generate local AI summary.
- Save AI input snapshot.
- Save AI output.
- Save user-edited summary.

Note:

This module may need data from trades, plans, positions, reviews, and market observations. It must obtain that data through an application service such as `monthly-report-service`, not by importing those feature modules.

### settings

Manages local app settings.

Responsibilities:

- Ollama endpoint.
- Model name.
- Database path or backup path.
- UI preferences.
- Export settings.

## Vertical Dependency Layers

Dependencies flow downward only.

```text
app
-> pages
-> features
-> application services
-> domain
-> infrastructure
-> platform
```

No lower layer should import a higher layer.

## Layer Definitions

### app

Application bootstrap.

Responsibilities:

- App initialization.
- Router installation.
- Pinia installation.
- Naive UI provider.
- Global layout shell.

### pages

Route-level screens.

Responsibilities:

- Compose feature components.
- Define page-level layout.
- Connect route params and query params.

Rules:

- Pages may import feature public APIs.
- Pages should not contain complex business logic.
- Pages should not access Tauri commands directly.

### features

Business module UI and local state.

Each feature owns:

```text
components/
composables/
stores/
types.ts
index.ts
```

Rules:

- Feature internals are private by default.
- Expose only needed APIs through `index.ts`.
- A feature must not import another feature.
- Feature code may call application services.

### application services

Cross-module business use cases.

Responsibilities:

- Coordinate multiple domain concepts.
- Provide use-case level APIs.
- Aggregate data for reports.
- Prepare AI prompt inputs.
- Validate business workflows.

Examples:

- `monthly-report-service`
- `position-calculation-service`
- `plan-execution-service`
- `import-export-service`

Rules:

- Application services may use domain models and infrastructure repositories.
- Application services must not import Vue components or stores.
- Application services are the correct place for cross-module coordination.

### domain

Pure business model and rules.

Responsibilities:

- Entity types.
- Value objects.
- Rule evaluation.
- Domain calculations.
- Business constants.

Examples:

- Asset type.
- Plan status.
- Trade direction.
- Emotion state.
- Discipline execution rate.
- Position ratio calculation.

Rules:

- No Vue imports.
- No Tauri imports.
- No database imports.
- No HTTP imports.

### infrastructure

Persistence, AI runtime, import/export adapters.

Responsibilities:

- Repository implementations.
- SQLite query wrappers.
- Ollama client.
- File import/export helpers.
- Data mappers.

Rules:

- Infrastructure may depend on domain types.
- Infrastructure must not depend on Vue components or feature stores.

### platform

Tauri and OS-level integration.

Responsibilities:

- Tauri command wrappers.
- File system bridge.
- Native dialogs.
- SQLite native access.
- App paths.

Rules:

- Keep platform code narrow.
- Do not place product business logic here unless necessary.

## Suggested Directory Structure

```text
invest-record-pro/
  docs/
    architecture.md
    market-analysis.md
    tech-decision.md
    go-to-market.md
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
```

## Feature Public API Rule

Each feature should expose only public APIs from `index.ts`.

Example:

```text
features/assets/index.ts
```

Allowed exports:

- Page-level feature components.
- Feature store factory if needed.
- Feature-specific composables if they are intentionally public.
- Feature types if they are UI-facing.

Do not import internal paths from another feature:

```ts
// Forbidden
import AssetForm from '@/features/assets/components/AssetForm.vue'
```

If a component is truly reusable, move it to:

```text
shared/components/
```

## Cross-Module Data Access

Use application services for cross-module coordination.

Example:

```text
monthly-reports page
-> monthly-report feature
-> monthly-report-service
-> repositories
-> SQLite
```

The monthly report feature must not read directly from:

```text
features/trades
features/plans
features/reviews
```

## Recommended Dependency Direction

```text
pages
-> features
-> services
-> domain
-> infrastructure
-> platform
```

Shared code may be imported by higher layers:

```text
pages/features/services/domain/infrastructure -> shared
```

But shared code must not import business features.

## Testing Strategy By Layer

### domain

Unit tests for pure business logic.

Examples:

- Position ratio calculation.
- Plan execution rate.
- Trade amount calculation.
- Drawdown calculation.

### services

Use-case tests.

Examples:

- Monthly aggregation.
- Position calculation from trades.
- Plan execution matching.

### infrastructure

Adapter tests with controlled local database fixtures.

Examples:

- SQLite repository CRUD.
- Migration verification.
- Ollama availability detection.

### features/pages

Component tests or manual browser verification for MVP.

Examples:

- Forms.
- Tables.
- Empty states.
- Report generation interaction.

## Architecture Enforcement

Recommended later:

- ESLint import rules.
- Path aliases by layer.
- Public API convention for features.
- Dependency graph check in CI.

Initial manual rule:

```text
No feature imports another feature.
Cross-module logic belongs in services.
Domain stays pure.
Tauri/Rust stays focused on local system access.
```
