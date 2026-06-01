# invest-record-pro v1 Business Rules

This document defines calculation rules, status rules, and data interpretation rules for v1.

It is the reference for implementation and acceptance tests. If implementation behavior conflicts with this document, this document wins unless explicitly revised.

## 1. Market Data Boundary

v1 does not fetch or provide real-time market data.

Allowed:

- User manually records index points.
- User manually records ETF/fund/stock prices.
- User manually records market turnover.
- User manually records market sentiment and policy notes.

Not allowed:

- Automatically fetching real-time quotes.
- Automatically fetching market news.
- Providing predictive market signals.
- Providing buy/sell recommendations.

## 2. Numeric Precision

Financial calculations must avoid binary floating-point errors.

Rules:

- Amounts are stored as decimal strings or integer minor units.
- Quantity can use decimal string if fractional units are needed.
- Display formatting is separate from stored values.
- Calculation utilities must use decimal-safe logic.

Recommended precision:

- Price: 4 decimal places by default.
- Amount: 2 decimal places by default.
- Quantity: 4 decimal places by default.
- Ratio: 4 decimal places internally, percentage display can use 2 decimal places.
- All displayed money amounts use 2 decimal places.

## 3. Asset Rules

An asset represents an investable object.

Required fields:

- Code.
- Name.
- Type.
- Market.

Optional fields:

- Related index.
- Risk level.
- Investment thesis.
- Notes.

Asset code uniqueness:

- `market + code` should be unique.
- Assets from different markets may share the same code.

## 4. Plan Rules

Plans represent intended investment actions before actual trades.

### 4.1 Plan Types

Supported plan types:

- Buy.
- Sell.

### 4.2 Plan Status

Supported statuses:

```text
pending
partial
completed
canceled
```

Status rules:

- New plans start as `pending`.
- A plan becomes `partial` when at least one linked trade is executed but not all planned rules are completed.
- A plan becomes `completed` when the user marks it completed or all planned staged rules are fulfilled.
- A plan becomes `canceled` only through explicit user action.
- A `canceled` plan should not be treated as executable.

### 4.3 Plan Rules

Each structured plan rule may include:

- Trigger type.
- Trigger condition.
- Target index point.
- Target asset price.
- Planned amount.
- Planned position ratio.
- Action direction.
- Notes.

v1 does not automatically execute plan rules.

Plan rules are used for:

- User reference.
- Trade-plan matching.
- Discipline analysis.
- Monthly report aggregation.

## 5. Trade Rules

Trades are actual user-recorded buy/sell executions.

### 5.1 Trade Direction

Supported directions:

- Buy.
- Sell.

### 5.2 Trade Amount

Default calculation:

```text
gross_amount = price * quantity
net_amount_for_buy = gross_amount + fee
net_amount_for_sell = gross_amount - fee
```

The app may allow users to override calculated amount if broker statement values differ.

### 5.3 Fee

All buy and sell fees are included in profit/loss calculation. Fees are not tracked as a separate expense category in v1.

Rules:

- Buy fee increases holding cost.
- Sell fee reduces realized profit/loss.

## 6. Profit And Loss Rules

v1 uses weighted average cost as the default cost method.

Summary:

```text
Cost method: weighted average cost
Buy fee: included in holding cost
Sell fee: deducted from realized profit/loss
Realized profit/loss: generated only when selling
Unrealized profit/loss: depends on user-entered current price or position snapshot
Unsupported in v1: dividends, splits, leverage, multi-currency, multi-account
```

### 6.1 Buy Cost

When buying:

```text
buy_unit_cost = (buy_amount + buy_fee) / buy_quantity
new_total_cost = previous_total_cost + gross_amount + fee
new_quantity = previous_quantity + buy_quantity
new_average_cost = new_total_cost / new_quantity
```

Where:

```text
gross_amount = buy_price * buy_quantity
buy_amount = gross_amount
```

### 6.2 Sell Realized Profit/Loss

Realized profit/loss is generated only when selling.

When selling:

```text
realized_profit_loss = (sell_price - previous_average_cost) * sell_quantity - sell_fee
remaining_quantity = previous_quantity - sell_quantity
remaining_total_cost = previous_average_cost * remaining_quantity
```

Equivalent expanded form:

```text
sell_proceeds = sell_price * sell_quantity
cost_of_sold_quantity = previous_average_cost * sell_quantity
realized_profit_loss = sell_proceeds - cost_of_sold_quantity - sell_fee
```

Realized profit/loss is permanently recorded in account results and does not change with later price movement.

### 6.3 Invalid Sell

A sell trade is invalid if:

```text
sell_quantity > current_holding_quantity
```

Unless the user explicitly enables a future short-selling mode. v1 does not support short selling.

### 6.4 Clearing Position

When holding quantity becomes 0:

```text
remaining_quantity = 0
remaining_total_cost = 0
average_cost = 0
```

If the user buys again after clearing a position, weighted average cost starts from the new buy records.

### 6.5 Unrealized Profit/Loss

Unrealized profit/loss is the floating profit/loss of unsold holdings.

v1 does not fetch current market prices.

Current price must come from:

- User manual input.
- Position snapshot.

No network quote source is allowed in v1.

Default calculation:

```text
unrealized_profit_loss = (current_price - average_cost) * holding_quantity
```

Equivalent expanded form:

```text
current_market_value = current_price * holding_quantity
unrealized_profit_loss = current_market_value - remaining_total_cost
```

If current price is unavailable, unrealized profit/loss should display as unavailable.

### 6.6 Total Profit/Loss

Total profit/loss:

```text
total_profit_loss = cumulative_realized_profit_loss + current_unrealized_profit_loss
```

### 6.7 Dividends, Splits, And Corporate Actions

v1 does not fully support:

- Dividends.
- Splits.
- Bonus shares.
- Fund distributions.
- Corporate actions.
- IPO/new share subscription.
- Rights issue or placement.
- Margin trading.
- Leverage.
- Multi-account.
- Multi-currency.

These should be handled later as v1.1+ features, or recorded manually as notes/adjustments in v1.

## 7. Position Rules

Positions can be derived from trades and/or manually saved as snapshots.

### 7.1 Calculated Position

Calculated position comes from local trade records.

For each asset:

```text
holding_quantity = sum(buy_quantity) - sum(sell_quantity)
holding_cost = remaining_total_cost after weighted average cost calculation
```

If current price is unavailable, market value may use:

- Last user-entered price.
- Manual snapshot value.
- Cost value as fallback, clearly labeled.

### 7.2 Manual Position Snapshot

Manual snapshot may include:

- Snapshot date.
- Total assets.
- Cash amount.
- Asset market value.
- Asset quantity.
- Notes.

Manual snapshots are treated as user-provided truth for that date.

### 7.3 Position Ratio

Default calculation:

```text
asset_position_ratio = asset_market_value / total_assets
cash_ratio = cash_amount / total_assets
market_position_ratio = market_asset_value / total_assets
```

If `total_assets` is missing or zero, ratios should display as unavailable instead of throwing an error.

### 7.4 Overweight And Underweight

Overweight/underweight hints require a threshold.

Threshold source order:

1. Plan-specific target ratio or max ratio.
2. Asset-level configured max ratio.
3. Global settings.

If no threshold is configured, the app should not show overweight/underweight judgement.

## 8. Discipline Execution Rules

Discipline execution evaluates whether trades followed plans.

### 8.1 Trade-Level Execution Flag

Each trade records:

- Followed plan: yes/no/partial/unknown.
- Linked plan id, optional.
- Deviation reason, required when followed plan is `no` or `partial`.

### 8.2 Execution Rate

Default monthly execution rate:

```text
execution_rate = planned_or_evaluated_compliant_trade_count / evaluated_trade_count
```

Where:

- `evaluated_trade_count` excludes trades marked `unknown`.
- `planned_or_evaluated_compliant_trade_count` includes trades marked `yes`.
- Trades marked `partial` count as 0.5 by default.
- Trades marked `no` count as 0.

If no evaluated trades exist, execution rate should display as unavailable.

## 9. Emotion Rules

Supported v1 emotion states:

```text
calm
anxious
greedy
fearful
hesitant
other
unknown
```

Emotion state is used for:

- Trade review.
- Monthly report aggregation.
- AI behavior pattern summary.

## 10. Review Rules

Reviews can be linked to:

- A trade.
- A plan.
- A month.

v1 must support trade-linked reviews.

Plan-linked and month-linked reviews are allowed if implementation is simple, but not required for MVP Core Gate.

Supported review tags:

- Good execution.
- Poor execution.
- Rule issue.
- Emotional issue.

Review completion rule:

- A trade is considered reviewed when it has at least one linked review.

## 11. Monthly Report Rules

Monthly report aggregation period:

```text
calendar month, local timezone
```

Monthly report should aggregate:

- Trades in the month.
- Plans active or executed in the month.
- Reviews created in the month.
- Position snapshots in the month.
- Market observations in the month.

Monthly report must save:

- Input snapshot JSON.
- AI summary.
- User-edited summary.
- Model runtime.
- Model name.
- Prompt version.
- Generation duration.
- Status.

If AI is unavailable:

- The app should still show structured monthly statistics.
- The app should allow manual monthly report notes.
- The app should not crash.

## 12. Import And Export Rules

MVP Core Gate:

- Trade records export to CSV is sufficient.

v1 Release Gate:

- Trade records export to Excel or CSV.
- Monthly reports export to PDF or Markdown.
- SQLite backup and restore are supported.

Exports should never require network access.

## 13. Authentication And App Lock

v1 does not include:

- Account system.
- Login.
- Cloud identity.

Future optional local app lock may be considered later, but it is not part of v1.
