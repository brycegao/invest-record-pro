# invest-record-pro Project Context

## Project Name

invest-record-pro

## Product Direction

Personal investment decision record system.

The system should help the user record investment plans, execution, position changes, and post-trade reviews. The core value is not real-time market data, but improving investment discipline and long-term decision quality.

Market and positioning notes are saved in `docs/market-analysis.md`.
Go-to-market and early growth notes are saved in `docs/go-to-market.md`.
Architecture notes are saved in `docs/architecture.md`.
Acceptance criteria are saved in `docs/acceptance-criteria-v1.md`.
Business rules are saved in `docs/business-rules-v1.md`.
Database model and storage notes are saved in `docs/database-schema.md`.
Technical decision rationale is saved in `docs/tech-decision.md`.
Concrete implementation and architecture guidance is saved in `docs/technical-solution.md`.
UI layout and screen specifications are saved in `docs/ui-spec.md`.
Release and posting template notes are saved in `docs/platform-posting-templates.md`.
Premium plugin authorization design is saved in `docs/premium-auth-solution.md`.
Docs folder overview and metadata are saved in `docs/README.md`.

## User Background And Intent

- User is interested in A-share index investing, especially SSE 50 ETF.
- User prefers disciplined, staged buying and selling rather than emotional trading.
- User wants to use Codex AI to build a real product from 0 to 1.
- User has programming experience and wants to combine global thinking, product thinking, and AI-assisted development.
- Short-term employment pressure is low, so this project can also serve as a long-term practice project for AI-enhanced product development.

## Recent Investment Discussion Notes

These notes are only project context, not investment advice.

- User considered buying SSE 50 ETF.
- A conservative view was discussed: wait for the Shanghai Composite Index to fall below 3900 before buying 30% planned position.
- Possible staged plan:
  - Shanghai Composite below 3900: buy 30% planned position.
  - 3800-3850: consider adding another 30%.
  - 3700-3750: evaluate market conditions before adding further.
  - Below 3700 with heavy volume: pause adding and wait for stabilization.
  - 4250 or above: consider partial profit taking.
  - Around 4350: stronger sell/trim zone.
- For SSE 50 ETF, the system should support linking ETF price levels with broader index points.

## Core Product Questions

The product should help answer:

1. Why did I buy?
2. Did I follow the plan?
3. What can this result teach me about my rules?

## Candidate Requirements

### Asset Management

- Asset code, name, type, market, related index, risk level.
- Investment thesis and notes.
- Examples: 510050, SSE 50 ETF, CSI 300 ETF, Nasdaq 100 QDII.

### Buy Plan

- Plan name.
- Asset.
- Total planned capital.
- Planned position.
- Trigger conditions.
- Staged buying rules.
- Related index point.
- Related ETF price.
- Effective period.
- Status: pending, partial, completed, canceled.
- Market view and risk note.

### Sell Plan

- Profit-taking levels.
- Stop-loss levels.
- Staged selling rules.
- Maximum acceptable drawdown.
- Sell reason.
- Adjustment history.

### Trade Record

- Trade date.
- Asset.
- Direction: buy or sell.
- Price.
- Quantity.
- Amount.
- Fee.
- Related index point at execution.
- Execution reason.
- Whether the trade followed the plan.
- Deviation reason.
- Emotion state: calm, anxious, greedy, fearful, hesitant.
- Optional attachments or screenshots.

### Position Management

- Total assets.
- Cash position.
- ETF/stock position.
- Single asset position.
- Market exposure.
- Planned max position.
- Available capital.
- Whether current position is overweight or underweight.

### Market Observation

- Date.
- Shanghai Composite Index point.
- SSE 50 Index point.
- CSI 300 point.
- Trading volume.
- Macro data or policy events.
- Market sentiment.
- User judgement.
- Optional AI summary.

### Strategy Rule Library

- Strategy name.
- Applicable assets.
- Buy rules.
- Sell rules.
- Add-position rules.
- Reduce-position rules.
- Stop-loss rules.
- Position cap.
- Invalid conditions.
- Historical notes.

### Review System

- Whether the original plan was clear.
- Whether execution followed the plan.
- Whether the trade was impulsive.
- Whether buy/sell timing was too early or too late.
- Position sizing quality.
- Profit/loss result.
- Max drawdown.
- Holding days.
- Improvement notes.

### AI-Assisted Analysis

- Convert natural language plans into structured rules.
- Check if a plan is self-consistent.
- Generate risk notes.
- Summarize monthly investment behavior.
- Detect repeated mistakes.
- Compare trades with original plans.
- Generate post-trade review drafts.

### Reminders And Monitoring

First version can use manual input. Later versions may support:

- Index point reminders.
- ETF price reminders.
- Position limit reminders.
- Plan expiration reminders.
- Missing review reminders.

### Statistics

- Total return.
- Annualized return.
- Max drawdown.
- Win rate.
- Profit/loss ratio.
- Average holding days.
- Plan execution rate.
- Number of impulsive trades.
- Strategy comparison.
- Asset comparison.

### Import And Export

- CSV import/export.
- Excel import/export.
- Monthly report export.
- Annual review export.

## Recommended MVP

First version should focus on the complete decision loop:

1. Asset management.
2. Buy/sell plan.
3. Trade record.
4. Position summary.
5. Review record.
6. AI monthly summary or AI review draft.

The MVP can use manual market data input first. Real-time market data is not required for the first version.

## Suggested MVP Flow

```text
Create asset
-> Create buy/sell plan
-> Record actual trade
-> Mark whether execution followed plan
-> View position and profit/loss
-> Generate review
```

## Development Principles

- Build the actual usable product, not a landing page.
- Keep the first version small and complete.
- Prefer clear data models and workflows over decorative UI.
- Make plan execution and review quality first-class concepts.
- Use AI where it improves judgement, review, and productivity.
- Keep private financial data local or clearly configurable.
- Project positioning is pure端侧, privacy-first, serverless, local AI, and investment decision recording.
- The chosen technical stack is Tauri + Vue 3 + TypeScript + SQLite + Ollama.
- Desktop is the primary product. Mobile may be considered later for read-only or lightweight viewing.
- Do not build a WeChat mini program.
- Do not build a cloud/server-based version.

## Product Positioning

invest-record-pro is a niche, professional, high-value, high-threshold, high-loyalty tool for serious investors.

**Who it is for:**
- Investors who value trading discipline and systematic review.
- Users willing to manually record trades and investment decisions.
- Users who prioritize data privacy over convenience.
- Desktop-first users comfortable with local software.
- Users willing to set up local AI (Ollama) for enhanced analysis.

**Who it is NOT for:**
- Casual stock watchers or market data consumers.
- Users who expect automatic real-time data feeds.
- Users who want a simple bookkeeping app.

**Key retention principle:**
Manual data entry is the biggest retention risk. Every design decision should minimize the friction of recording a trade. v1.0 targets a 3-field minimum for trade entry (asset, price, quantity), with all other fields defaulting to sensible values. v1.1 must support broker CSV import to eliminate manual entry entirely.

## Pending Decisions

- ~~First MVP screen structure.~~ Resolved: see `docs/ui-spec.md` for 9-page layout.
- v1 batch operation scope: selection column default off, export-only in MVP (no batch delete).
- v1 import scope: CSV trade import deferred to v1.1; v1 only supports CSV export.
- Auto-update strategy: deferred to post-v1; must be opt-in per `docs/acceptance-criteria-v1.md`.

## v1 Decisions

- v1 has no account system.
- v1 has no login.
- v1 may consider optional local app lock later, but it is not part of v1.
