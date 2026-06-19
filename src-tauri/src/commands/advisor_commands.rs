/*
 * @Description: 投顾推荐与复盘 Tauri 命令
 *
 * 金额字段全部存「分」(i64)。follow_ups.followed 在 DB 中存 0/1，
 * 在结构体层用 bool（serde 对外）。
 */

use std::sync::{Arc, Mutex};

use rusqlite::{params, Connection, Error, ErrorCode};

use crate::common::now_iso;
use crate::market::{aggregate_strategy_stats, refresh_and_cache_a_share, update_signal_tracking, StrategyStat};
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

/// 获取所有推荐信号（带标的信息），按推荐时间倒序。
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

/// 获取某推荐对应的跟随/复盘记录（一对一，可能不存在）。
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

/// 创建或更新跟随/复盘记录（按 signal_id upsert）。
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

/// 行情刷新结果（单条）
#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RefreshItem {
    pub signal_id: i64,
    pub code: String,
    pub success: bool,
    pub message: String,
}

/// 刷新所有推荐信号的后市行情：拉日线 → 缓存 → 更新 signal_tracking
#[tauri::command(rename_all = "camelCase")]
pub fn refresh_advisor_market(db: tauri::State<'_, Arc<Mutex<Connection>>>) -> Result<Vec<RefreshItem>, String> {
    let connection = lock_connection(&db)?;
    // 取所有推荐信号（含 asset code）
    let mut stmt = connection
        .prepare("SELECT s.id, s.signal_at, a.code FROM advisor_signals s INNER JOIN assets a ON s.asset_id = a.id")
        .map_err(map_advisor_error)?;
    let signals: Vec<(i64, String, String)> = stmt
        .query_map(params![], |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)))
        .map_err(map_advisor_error)?
        .collect::<Result<Vec<_>, _>>()
        .map_err(map_advisor_error)?;

    let mut results = Vec::with_capacity(signals.len());
    for (signal_id, signal_at, code) in signals {
        // signal_at 取日期部分作为拉取起点
        let beg = signal_at.get(..10).unwrap_or(&signal_at);
        // 1. 拉取并缓存日线
        if let Err(e) = refresh_and_cache_a_share(&connection, &code, beg) {
            results.push(RefreshItem {
                signal_id, code, success: false,
                message: format!("拉取行情失败: {e}"),
            });
            continue;
        }
        // 2. 计算 T+N 追踪并写入
        match update_signal_tracking(&connection, signal_id, &code, beg) {
            Ok(true) => results.push(RefreshItem {
                signal_id, code, success: true,
                message: "已更新".to_string(),
            }),
            Ok(false) => results.push(RefreshItem {
                signal_id, code, success: true,
                message: "今日新增，暂无后市数据".to_string(),
            }),
            Err(e) => results.push(RefreshItem {
                signal_id, code, success: false,
                message: format!("更新追踪失败: {e}"),
            }),
        }
    }
    Ok(results)
}

/// 获取策略统计（按 老师×方向 聚合 T+N 涨跌幅等）
#[tauri::command(rename_all = "camelCase")]
pub fn get_strategy_stats(db: tauri::State<'_, Arc<Mutex<Connection>>>) -> Result<Vec<StrategyStat>, String> {
    let connection = lock_connection(&db)?;
    aggregate_strategy_stats(&connection)
}

