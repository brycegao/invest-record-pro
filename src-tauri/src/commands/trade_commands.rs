/*
 * @Author: brycegao
 * @Github: https://github.com/brycegao
 * @Date: 2026/06/03
 * @Description: 交易记录 Tauri 命令
 *
 * Copyright (c) 2026 brycegao
 *
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

use std::collections::HashMap;
use std::sync::{Arc, Mutex};

use rusqlite::{params, Connection, Error, ErrorCode};

use crate::common::now_iso;
use crate::models::{CreateTradePayload, Trade, TradeSummary, UpdateTradePayload};

type DbState<'a> = tauri::State<'a, Arc<Mutex<Connection>>>;

#[derive(Debug, Clone)]
struct ReplayState {
    summary: TradeSummary,
    realized_by_trade_id: HashMap<i64, Option<i64>>,
}

#[tauri::command]
pub fn get_trades(db: DbState<'_>) -> Result<Vec<Trade>, String> {
    let connection = lock_connection(&db)?;
    let mut trades = select_trades(
        &connection,
        "SELECT t.*, a.code AS asset_code, a.name AS asset_name, p.status AS plan_status
         FROM trades t
         INNER JOIN assets a ON t.asset_id = a.id
         LEFT JOIN plans p ON t.plan_id = p.id
         ORDER BY t.trade_at DESC, t.created_at DESC, t.id DESC",
        params![],
    )?;
    fill_realized_pnl(&connection, &mut trades)?;
    Ok(trades)
}

#[tauri::command]
pub fn create_trade(db: DbState<'_>, payload: CreateTradePayload) -> Result<Trade, String> {
    let mut connection = lock_connection(&db)?;
    validate_trade_numbers(payload.quantity, payload.price, payload.fee)?;
    let tx = connection.transaction().map_err(map_trade_error)?;
    let now = now_iso();
    let total_amount = calculate_gross_amount(payload.price, payload.quantity);
    let follow_plan = payload.follow_plan.unwrap_or(true);

    tx.execute(
        "INSERT INTO trades (
                asset_id,
                plan_id,
                trade_at,
                trade_type,
                quantity,
                price,
                total_amount,
                fee,
                index_point,
                reason,
                follow_plan,
                mood,
                notes,
                created_at,
                updated_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)",
        params![
            payload.asset_id,
            payload.plan_id,
            payload.trade_at,
            payload.trade_type,
            payload.quantity,
            payload.price,
            total_amount,
            payload.fee,
            payload.index_point,
            payload.reason,
            follow_plan,
            payload.mood,
            payload.notes,
            now,
            now,
        ],
    )
    .map_err(map_trade_error)?;

    let id = tx.last_insert_rowid();
    let trade = get_trade_by_id(&tx, id)?;
    tx.commit().map_err(map_trade_error)?;

    Ok(trade)
}

#[tauri::command]
pub fn update_trade(db: DbState<'_>, payload: UpdateTradePayload) -> Result<Trade, String> {
    let mut connection = lock_connection(&db)?;
    validate_trade_numbers(payload.quantity, payload.price, payload.fee)?;
    let tx = connection.transaction().map_err(map_trade_error)?;
    let now = now_iso();
    let total_amount = calculate_gross_amount(payload.price, payload.quantity);

    let changed = tx
        .execute(
            "UPDATE trades
             SET asset_id = ?1,
                 plan_id = ?2,
                 trade_at = ?3,
                 trade_type = ?4,
                 quantity = ?5,
                 price = ?6,
                 total_amount = ?7,
                 fee = ?8,
                 index_point = ?9,
                 reason = ?10,
                 follow_plan = ?11,
                 mood = ?12,
                 notes = ?13,
                 updated_at = ?14
             WHERE id = ?15",
            params![
                payload.asset_id,
                payload.plan_id,
                payload.trade_at,
                payload.trade_type,
                payload.quantity,
                payload.price,
                total_amount,
                payload.fee,
                payload.index_point,
                payload.reason,
                payload.follow_plan,
                payload.mood,
                payload.notes,
                now,
                payload.id,
            ],
        )
        .map_err(map_trade_error)?;

    if changed == 0 {
        return Err("交易记录不存在".to_string());
    }

    let trade = get_trade_by_id(&tx, payload.id)?;
    tx.commit().map_err(map_trade_error)?;

    Ok(trade)
}

#[tauri::command]
pub fn delete_trade(db: DbState<'_>, id: i64) -> Result<(), String> {
    let connection = lock_connection(&db)?;
    let changed = connection
        .execute("DELETE FROM trades WHERE id = ?1", params![id])
        .map_err(map_trade_error)?;

    if changed == 0 {
        return Err("交易记录不存在".to_string());
    }

    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
pub fn query_trades(
    db: DbState<'_>,
    keyword: Option<String>,
    trade_type: Option<String>,
    start_date: Option<String>,
    end_date: Option<String>,
    follow_plan: Option<bool>,
    mood: Option<String>,
) -> Result<Vec<Trade>, String> {
    let connection = lock_connection(&db)?;
    let keyword = normalize_filter(keyword);
    let trade_type = normalize_filter(trade_type);
    let start_date = normalize_filter(start_date);
    let end_date = normalize_filter(end_date);
    let mood = normalize_filter(mood);

    let mut statement = connection
        .prepare(
            "SELECT t.*, a.code AS asset_code, a.name AS asset_name, p.status AS plan_status
             FROM trades t
             INNER JOIN assets a ON t.asset_id = a.id
             LEFT JOIN plans p ON t.plan_id = p.id
             WHERE (?1 IS NULL OR a.code LIKE '%' || ?1 || '%' OR a.name LIKE '%' || ?1 || '%')
               AND (?2 IS NULL OR t.trade_type = ?2)
               AND (?3 IS NULL OR t.trade_at >= ?3)
               AND (?4 IS NULL OR t.trade_at <= ?4)
               AND (?5 IS NULL OR t.follow_plan = ?5)
               AND (?6 IS NULL OR t.mood = ?6)
             ORDER BY t.trade_at DESC, t.created_at DESC, t.id DESC",
        )
        .map_err(map_trade_error)?;

    let rows = statement
        .query_map(
            params![keyword, trade_type, start_date, end_date, follow_plan, mood],
            map_trade_row,
        )
        .map_err(map_trade_error)?;
    let mut trades = collect_trades(rows)?;
    fill_realized_pnl(&connection, &mut trades)?;
    Ok(trades)
}

#[tauri::command(rename_all = "snake_case")]
pub fn get_trade_summary(db: DbState<'_>, asset_id: i64) -> Result<TradeSummary, String> {
    let connection = lock_connection(&db)?;
    let states = replay_all_trades(&connection)?;

    Ok(states
        .get(&asset_id)
        .map(|state| state.summary.clone())
        .unwrap_or_else(|| TradeSummary {
            asset_id,
            total_buy_quantity: 0,
            total_sell_quantity: 0,
            current_quantity: 0,
            avg_cost: 0,
            remaining_cost: 0,
            realized_pnl: 0,
            total_buy_amount: 0,
            total_sell_amount: 0,
        }))
}

fn lock_connection<'a>(
    db: &'a DbState<'a>,
) -> Result<std::sync::MutexGuard<'a, Connection>, String> {
    db.lock()
        .map_err(|error| format!("获取数据库锁失败: {error}"))
}

fn get_trade_by_id(connection: &Connection, id: i64) -> Result<Trade, String> {
    let mut trades = select_trades(
        connection,
        "SELECT t.*, a.code AS asset_code, a.name AS asset_name, p.status AS plan_status
         FROM trades t
         INNER JOIN assets a ON t.asset_id = a.id
         LEFT JOIN plans p ON t.plan_id = p.id
         WHERE t.id = ?1",
        params![id],
    )?;
    fill_realized_pnl(connection, &mut trades)?;

    trades
        .into_iter()
        .next()
        .ok_or_else(|| "交易记录不存在".to_string())
}

fn select_trades<P>(connection: &Connection, sql: &str, params: P) -> Result<Vec<Trade>, String>
where
    P: rusqlite::Params,
{
    let mut statement = connection.prepare(sql).map_err(map_trade_error)?;
    let rows = statement
        .query_map(params, map_trade_row)
        .map_err(map_trade_error)?;
    collect_trades(rows)
}

fn collect_trades(
    rows: impl Iterator<Item = Result<Trade, rusqlite::Error>>,
) -> Result<Vec<Trade>, String> {
    rows.collect::<Result<Vec<_>, _>>().map_err(map_trade_error)
}

fn replay_all_trades(connection: &Connection) -> Result<HashMap<i64, ReplayState>, String> {
    let chronological_trades = select_trades(
        connection,
        "SELECT t.*, a.code AS asset_code, a.name AS asset_name, p.status AS plan_status
         FROM trades t
         INNER JOIN assets a ON t.asset_id = a.id
         LEFT JOIN plans p ON t.plan_id = p.id
         ORDER BY t.trade_at ASC, t.created_at ASC, t.id ASC",
        params![],
    )?;
    let mut states = HashMap::<i64, ReplayState>::new();

    for trade in chronological_trades {
        let state = states.entry(trade.asset_id).or_insert_with(|| ReplayState {
            summary: TradeSummary {
                asset_id: trade.asset_id,
                total_buy_quantity: 0,
                total_sell_quantity: 0,
                current_quantity: 0,
                avg_cost: 0,
                remaining_cost: 0,
                realized_pnl: 0,
                total_buy_amount: 0,
                total_sell_amount: 0,
            },
            realized_by_trade_id: HashMap::new(),
        });
        let realized = apply_trade_to_summary(&mut state.summary, &trade)?;
        state.realized_by_trade_id.insert(trade.id, realized);
    }

    Ok(states)
}

fn apply_trade_to_summary(
    summary: &mut TradeSummary,
    trade: &Trade,
) -> Result<Option<i64>, String> {
    let gross_amount = calculate_gross_amount(trade.price, trade.quantity);

    match trade.trade_type.as_str() {
        "buy" => {
            summary.total_buy_quantity += trade.quantity;
            summary.total_buy_amount += gross_amount;
            summary.remaining_cost += gross_amount + trade.fee;
            summary.current_quantity += trade.quantity;
            summary.avg_cost = summary.remaining_cost * 1000 / summary.current_quantity;
            Ok(None)
        }
        "sell" => {
            if trade.quantity > summary.current_quantity {
                return Err("卖出数量不能超过当前持仓，v1 不支持做空".to_string());
            }

            let cost_of_sold = summary.avg_cost * trade.quantity / 1000;
            let trade_realized_pnl = gross_amount - cost_of_sold - trade.fee;
            summary.total_sell_quantity += trade.quantity;
            summary.total_sell_amount += gross_amount;
            summary.realized_pnl += trade_realized_pnl;
            summary.current_quantity -= trade.quantity;
            summary.remaining_cost -= cost_of_sold;

            if summary.current_quantity == 0 {
                summary.remaining_cost = 0;
                summary.avg_cost = 0;
            } else {
                summary.avg_cost = summary.remaining_cost * 1000 / summary.current_quantity;
            }

            Ok(Some(trade_realized_pnl))
        }
        _ => Err("交易类型无效".to_string()),
    }
}

fn fill_realized_pnl(connection: &Connection, trades: &mut [Trade]) -> Result<(), String> {
    let states = replay_all_trades(connection)?;

    for trade in trades {
        trade.realized_pnl = states
            .get(&trade.asset_id)
            .and_then(|state| state.realized_by_trade_id.get(&trade.id))
            .copied()
            .flatten();
    }

    Ok(())
}

fn calculate_gross_amount(price: i64, quantity: i64) -> i64 {
    price * quantity / 1000
}

fn validate_trade_numbers(quantity: i64, price: i64, fee: i64) -> Result<(), String> {
    if quantity <= 0 {
        return Err("交易数量必须大于 0".to_string());
    }

    if price < 0 {
        return Err("交易价格不能为负数".to_string());
    }

    if fee < 0 {
        return Err("手续费不能为负数".to_string());
    }

    Ok(())
}

fn map_trade_row(row: &rusqlite::Row<'_>) -> Result<Trade, rusqlite::Error> {
    Ok(Trade {
        id: row.get("id")?,
        asset_id: row.get("asset_id")?,
        plan_id: row.get("plan_id")?,
        trade_at: row.get("trade_at")?,
        trade_type: row.get("trade_type")?,
        quantity: row.get("quantity")?,
        price: row.get("price")?,
        total_amount: row.get("total_amount")?,
        fee: row.get("fee")?,
        index_point: row.get("index_point")?,
        reason: row.get("reason")?,
        follow_plan: row.get("follow_plan")?,
        mood: row.get("mood")?,
        notes: row.get("notes")?,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
        asset_code: row.get("asset_code")?,
        asset_name: row.get("asset_name")?,
        plan_status: row.get("plan_status")?,
        realized_pnl: None,
    })
}

fn normalize_filter(value: Option<String>) -> Option<String> {
    value.and_then(|inner| {
        let trimmed = inner.trim();
        if trimmed.is_empty() {
            None
        } else {
            Some(trimmed.to_string())
        }
    })
}

fn map_trade_error(error: Error) -> String {
    match error {
        Error::QueryReturnedNoRows => "交易记录不存在".to_string(),
        Error::SqliteFailure(ref sqlite_error, _)
            if sqlite_error.code == ErrorCode::ConstraintViolation =>
        {
            "交易数据违反约束，请检查关联标的、计划和交易内容".to_string()
        }
        _ => format!("数据库错误: {error}"),
    }
}
