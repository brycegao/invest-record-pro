# Technical Decision

## Project Positioning

invest-record-pro is a pure端侧, privacy-first, serverless, local-AI investment decision record system.

The product is designed for personal investment planning, execution tracking, position review, and AI-assisted investment discipline analysis.

## Document Purpose

This document records the key technology decisions for the project and explains why the selected stack, architecture direction, and product boundaries are appropriate. It is intended for architecture review and team alignment.

For implementation details, directory structure, module boundaries, and cross-module data flow, see `docs/technical-solution.md`.

## Final Stack Decision

The chosen stack is:

```text
Tauri + Vue 3 + TypeScript + SQLite + Ollama
```

This is the primary and canonical technical direction for the project.

## MVP Engineering Stack

The first MVP should use:

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

### UI Library Decision

Use Naive UI for the first version.

Reasons:

- Strong support for forms, tables, modals, tabs, menus, date pickers, and layout.
- Suitable for professional desktop tools and data-heavy screens.
- Faster MVP development than building all controls from scratch.
- Works well with Vue 3 and TypeScript.

Use ECharts for charts and visual summaries.

Likely chart needs:

- Asset allocation.
- Position changes.
- Monthly return trend.
- Plan execution rate.
- Trade count and behavior distribution.

## Product Platform Strategy

### First Stage

Build the desktop application first.

Desktop is the main product because it better supports:

- Local SQLite database.
- Local file backup.
- CSV/Excel import and export.
- Rich review and reporting screens.
- Local AI through Ollama.
- Privacy-first workflows.

### Later Stage

Mobile may be considered later only as a lightweight companion client.

Possible mobile scope:

- View plans.
- View positions.
- View monthly reports.
- Quick note or simple review.

Mobile should not be the first development target.

## Explicit Non-Goals

The project will not build:

- WeChat mini program.
- Cloud service.
- Server-based version.
- Mandatory account system.
- Cloud AI dependency.
- Stock recommendation or automated trading system.

## Rationale

### Why Tauri

- Lightweight desktop runtime.
- Strong local system integration.
- Smaller footprint than Electron.
- Suitable for privacy-first local applications.
- Works well with local files, SQLite, and desktop packaging.

### Why Vue 3

- Mature and efficient for building data-heavy UI.
- Composition API is suitable for modular business features.
- Good TypeScript support.
- Clear component structure for forms, tables, and reports.

### Why TypeScript

- Improves maintainability.
- Makes data models and service contracts explicit.
- Reduces errors in forms, reports, and aggregation logic.

### Why SQLite

- Local-first storage.
- No server required.
- Reliable and simple.
- Good fit for personal financial records.
- Easy backup and export.

### Why Ollama

- Local model runtime.
- No cloud AI dependency.
- Simple localhost API.
- Easy model switching.
- Suitable for local monthly summaries, reviews, and rule analysis.

## Architecture Direction

```text
Vue 3 UI
-> TypeScript feature modules
-> Tauri commands
-> SQLite local database
-> Local aggregation services
-> Ollama local AI generation
-> Local monthly reports and exports
```

## Layer Responsibilities

### Vue 3 UI Layer

Responsible for:

- Pages.
- Forms.
- Tables.
- Modals.
- Navigation.
- Charts.
- User interactions.
- Displaying AI-generated reports and editable summaries.

### Pinia And Composables

Responsible for:

- Feature state.
- Form state.
- List filters.
- Current selected month or asset.
- Reusable UI-side logic.

### TypeScript Service Layer

Responsible for:

- Calling Tauri commands.
- Data mapping.
- Monthly aggregation orchestration.
- Prompt assembly for AI reports.
- Business-level validation before persistence.

### Tauri/Rust Layer

Responsible for:

- SQLite access.
- File system access.
- Local backup and restore.
- CSV/Excel import and export when needed.
- Calling or proxying Ollama localhost API if this is cleaner than calling from the webview.

Keep this layer focused. Do not move all business logic into Rust unless there is a clear reason.

### SQLite Layer

Responsible for:

- Persistent local storage.
- Migrations.
- Queryable historical records.
- Data snapshots used by monthly reports.

Core tables will likely include:

- `assets`
- `plans`
- `plan_rules`
- `trades`
- `positions`
- `reviews`
- `market_observations`
- `monthly_reports`
- `settings`

### Ollama Layer

Responsible for:

- Local AI generation.
- Monthly report generation.
- Plan consistency checking.
- Review draft generation.

The app should detect whether Ollama is available at:

```text
http://localhost:11434
```

Health check endpoint:

```text
GET http://localhost:11434/api/tags
```

- Success: HTTP 200 with `models` array in response body.
- Failure: Connection refused or timeout (5s) → treat as unavailable.
- AI features should be disabled gracefully and the app should show setup guidance.

**Timeout and failure handling:**

- AI generation timeout: 120 seconds (configurable in settings).
- On timeout: show warning message, allow retry, do not block main workflow.
- On model unavailable: show error with model name, suggest user pull the model first.
- All AI errors should be logged locally (no external upload).

The first version should not bundle model files.

## AI Boundary

AI features should focus on:

- Monthly investment review.
- Discipline analysis.
- Plan consistency checks.
- Natural-language-to-structured-plan conversion.
- Emotional trading pattern summaries.
- Review draft generation.

AI features should not focus on:

- Stock recommendation.
- Deterministic buy/sell calls.
- Short-term market prediction.
- Automated trading.

## Key Implementation Notes

- Do not use IndexedDB as the main database. Use SQLite.
- Do not require login in MVP unless a local app lock is later needed.
- Do not introduce server APIs.
- Do not introduce cloud sync in MVP.
- Save AI input snapshots and generated outputs for traceability.
- AI output must be editable by the user before final saving.
- Build import/export and backup with privacy-first assumptions.
- Design database migrations early to avoid painful schema changes later.

## Known Technical Risks

- Tauri 2 permission and capability configuration requires care.
- SQLite migration design must be established early.
- Ollama may not be installed on the user's machine.
- Local model output quality may vary by model and hardware.
- Large AI models can be slow on low-end machines.
- Packaging and auto-update need later dedicated work.

## Development Order

1. Desktop project scaffold.
2. Local database schema.
3. Asset management.
4. Buy/sell plan management.
5. Trade records.
6. Position summary.
7. Review records.
8. Local AI monthly summary through Ollama.
9. Import/export and backup.
10. Packaging and local release.
