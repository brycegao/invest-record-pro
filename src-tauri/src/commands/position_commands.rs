/*
 * @Author: brycegao
 * @Github: https://github.com/brycegao
 * @Date: 2026/06/03
 * @Description: 仓位快照 Tauri 命令
 *
 * Copyright (c) 2026 brycegao
 *
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

use std::sync::{Arc, Mutex};

use rusqlite::{params, Connection, Error, ErrorCode};

use crate::common::now_iso;
use crate::models::{CreatePositionItemPayload, CreatePositionPayload, Position, PositionItem};

type DbState<'a> = tauri::State<'a, Arc<Mutex<Connection>>>;

#[tauri::command]
pub fn get_positions(db: DbState<'_>) -> Result<Vec<Position>, String> {
    let connection = lock_connection(&db)?;
    select_positions(
        &connection,
        "SELECT * FROM positions ORDER BY snapshot_at DESC",
        params![],
    )
}

#[tauri::command]
pub fn create_position_snapshot(
    db: DbState<'_>,
    payload: CreatePositionPayload,
) -> Result<Position, String> {
    validate_position_payload(&payload)?;

    let mut connection = lock_connection(&db)?;
    let transaction = connection.transaction().map_err(map_position_error)?;
    let now = now_iso();

    transaction
        .execute(
            "INSERT INTO positions (
                snapshot_at,
                cash,
                total_assets,
                unrealized_pnl,
                realized_pnl,
                created_at,
                updated_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                payload.snapshot_at,
                payload.cash,
                payload.total_assets,
                payload.unrealized_pnl,
                payload.realized_pnl,
                now,
                now,
            ],
        )
        .map_err(map_position_error)?;

    let position_id = transaction.last_insert_rowid();
    for item in payload.items {
        insert_position_item(&transaction, position_id, item, &now)?;
    }

    transaction.commit().map_err(map_position_error)?;
    get_position_by_id(&connection, position_id)
}

#[tauri::command(rename_all = "snake_case")]
pub fn get_position_items(db: DbState<'_>, position_id: i64) -> Result<Vec<PositionItem>, String> {
    let connection = lock_connection(&db)?;
    let mut statement = connection
        .prepare(
            "SELECT pi.*, a.code AS asset_code, a.name AS asset_name
             FROM position_items pi
             INNER JOIN assets a ON pi.asset_id = a.id
             WHERE pi.position_id = ?1
             ORDER BY a.code ASC, pi.id ASC",
        )
        .map_err(map_position_error)?;
    let rows = statement
        .query_map(params![position_id], map_position_item_row)
        .map_err(map_position_error)?;

    collect_position_items(rows)
}

#[tauri::command]
pub fn delete_position(db: DbState<'_>, id: i64) -> Result<(), String> {
    let connection = lock_connection(&db)?;
    let changed = connection
        .execute("DELETE FROM positions WHERE id = ?1", params![id])
        .map_err(map_position_error)?;

    if changed == 0 {
        return Err("仓位快照不存在".to_string());
    }

    Ok(())
}

#[tauri::command]
pub fn get_latest_position(db: DbState<'_>) -> Result<Option<Position>, String> {
    let connection = lock_connection(&db)?;
    let mut positions = select_positions(
        &connection,
        "SELECT * FROM positions ORDER BY snapshot_at DESC LIMIT 1",
        params![],
    )?;

    Ok(positions.pop())
}

fn lock_connection<'a>(
    db: &'a DbState<'a>,
) -> Result<std::sync::MutexGuard<'a, Connection>, String> {
    db.lock()
        .map_err(|error| format!("获取数据库锁失败: {error}"))
}

fn insert_position_item(
    transaction: &rusqlite::Transaction<'_>,
    position_id: i64,
    item: CreatePositionItemPayload,
    now: &str,
) -> Result<(), String> {
    validate_position_item_payload(&item)?;

    transaction
        .execute(
            "INSERT INTO position_items (
                position_id,
                asset_id,
                quantity,
                avg_cost,
                current_price,
                market_value,
                unrealized_pnl,
                created_at,
                updated_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![
                position_id,
                item.asset_id,
                item.quantity,
                item.avg_cost,
                item.current_price,
                item.market_value,
                item.unrealized_pnl,
                now,
                now,
            ],
        )
        .map_err(map_position_error)?;

    Ok(())
}

fn get_position_by_id(connection: &Connection, id: i64) -> Result<Position, String> {
    connection
        .query_row(
            "SELECT * FROM positions WHERE id = ?1",
            params![id],
            map_position_row,
        )
        .map_err(map_position_error)
}

fn select_positions<P>(
    connection: &Connection,
    sql: &str,
    params: P,
) -> Result<Vec<Position>, String>
where
    P: rusqlite::Params,
{
    let mut statement = connection.prepare(sql).map_err(map_position_error)?;
    let rows = statement
        .query_map(params, map_position_row)
        .map_err(map_position_error)?;

    collect_positions(rows)
}

fn collect_positions(
    rows: impl Iterator<Item = Result<Position, rusqlite::Error>>,
) -> Result<Vec<Position>, String> {
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(map_position_error)
}

fn collect_position_items(
    rows: impl Iterator<Item = Result<PositionItem, rusqlite::Error>>,
) -> Result<Vec<PositionItem>, String> {
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(map_position_error)
}

fn map_position_row(row: &rusqlite::Row<'_>) -> Result<Position, rusqlite::Error> {
    Ok(Position {
        id: row.get("id")?,
        snapshot_at: row.get("snapshot_at")?,
        cash: row.get("cash")?,
        total_assets: row.get("total_assets")?,
        unrealized_pnl: row.get("unrealized_pnl")?,
        realized_pnl: row.get("realized_pnl")?,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
    })
}

fn map_position_item_row(row: &rusqlite::Row<'_>) -> Result<PositionItem, rusqlite::Error> {
    Ok(PositionItem {
        id: row.get("id")?,
        position_id: row.get("position_id")?,
        asset_id: row.get("asset_id")?,
        quantity: row.get("quantity")?,
        avg_cost: row.get("avg_cost")?,
        current_price: row.get("current_price")?,
        market_value: row.get("market_value")?,
        unrealized_pnl: row.get("unrealized_pnl")?,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
        asset_code: row.get("asset_code")?,
        asset_name: row.get("asset_name")?,
    })
}

fn validate_position_payload(payload: &CreatePositionPayload) -> Result<(), String> {
    if payload.snapshot_at.trim().is_empty() {
        return Err("快照时间不能为空".to_string());
    }

    if payload.cash < 0 {
        return Err("现金不能为负数".to_string());
    }

    if payload.total_assets < 0 {
        return Err("总资产不能为负数".to_string());
    }

    Ok(())
}

fn validate_position_item_payload(item: &CreatePositionItemPayload) -> Result<(), String> {
    if item.asset_id <= 0 {
        return Err("标的 ID 无效".to_string());
    }

    if item.quantity < 0 {
        return Err("持仓数量不能为负数".to_string());
    }

    if item.avg_cost < 0 {
        return Err("平均成本不能为负数".to_string());
    }

    if item.current_price < 0 {
        return Err("当前价格不能为负数".to_string());
    }

    if item.market_value < 0 {
        return Err("市值不能为负数".to_string());
    }

    Ok(())
}

fn map_position_error(error: Error) -> String {
    match error {
        Error::QueryReturnedNoRows => "仓位快照不存在".to_string(),
        Error::SqliteFailure(ref sqlite_error, _)
            if sqlite_error.code == ErrorCode::ConstraintViolation =>
        {
            "仓位快照数据违反约束，请检查关联标的和明细内容".to_string()
        }
        _ => format!("数据库错误: {error}"),
    }
}
