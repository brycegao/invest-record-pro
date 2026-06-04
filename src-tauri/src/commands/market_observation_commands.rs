/*
 * @Author: brycegao
 * @Github: https://github.com/brycegao
 * @Date: 2026/06/03
 * @Description: 市场观察 Tauri 命令
 *
 * Copyright (c) 2026 brycegao
 *
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

use rusqlite::{params, Connection, Error};

use crate::common::now_iso;
use crate::db::{lock_connection, normalize_filter, DbState};
use crate::models::{CreateMarketObservationPayload, MarketObservation, UpdateMarketObservationPayload};

#[tauri::command]
pub fn get_market_observations(db: DbState<'_>) -> Result<Vec<MarketObservation>, String> {
    let connection = lock_connection(&db)?;
    select_market_observations(
        &connection,
        "SELECT * FROM market_observations ORDER BY observe_at DESC, id DESC",
        params![],
    )
}

#[tauri::command]
pub fn create_market_observation(
    db: DbState<'_>,
    payload: CreateMarketObservationPayload,
) -> Result<MarketObservation, String> {
    let connection = lock_connection(&db)?;
    let now = now_iso();

    connection
        .execute(
            "INSERT INTO market_observations (
                observe_at, shanghai_index, sse_50_index, csi_300_index,
                market_turnover, sentiment, policy_event, macro_note, personal_view,
                created_at, updated_at
             ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
            params![
                payload.observe_at,
                payload.shanghai_index,
                payload.sse_50_index,
                payload.csi_300_index,
                payload.market_turnover,
                payload.sentiment,
                payload.policy_event,
                payload.macro_note,
                payload.personal_view,
                now,
                now,
            ],
        )
        .map_err(map_error)?;

    let id = connection.last_insert_rowid();
    get_market_observation_by_id(&connection, id)
}

#[tauri::command]
pub fn update_market_observation(
    db: DbState<'_>,
    payload: UpdateMarketObservationPayload,
) -> Result<MarketObservation, String> {
    let connection = lock_connection(&db)?;
    let now = now_iso();

    let changed = connection
        .execute(
            "UPDATE market_observations
             SET observe_at = ?1,
                 shanghai_index = ?2,
                 sse_50_index = ?3,
                 csi_300_index = ?4,
                 market_turnover = ?5,
                 sentiment = ?6,
                 policy_event = ?7,
                 macro_note = ?8,
                 personal_view = ?9,
                 updated_at = ?10
             WHERE id = ?11",
            params![
                payload.observe_at,
                payload.shanghai_index,
                payload.sse_50_index,
                payload.csi_300_index,
                payload.market_turnover,
                payload.sentiment,
                payload.policy_event,
                payload.macro_note,
                payload.personal_view,
                now,
                payload.id,
            ],
        )
        .map_err(map_error)?;

    if changed == 0 {
        return Err("市场观察记录不存在".to_string());
    }

    get_market_observation_by_id(&connection, payload.id)
}

#[tauri::command]
pub fn delete_market_observation(db: DbState<'_>, id: i64) -> Result<(), String> {
    let connection = lock_connection(&db)?;
    let changed = connection
        .execute("DELETE FROM market_observations WHERE id = ?1", params![id])
        .map_err(map_error)?;

    if changed == 0 {
        return Err("市场观察记录不存在".to_string());
    }

    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
pub fn query_market_observations(
    db: DbState<'_>,
    start_date: Option<String>,
    end_date: Option<String>,
    sentiment: Option<String>,
) -> Result<Vec<MarketObservation>, String> {
    let connection = lock_connection(&db)?;
    let start_date = normalize_filter(start_date);
    let end_date = normalize_filter(end_date);
    let sentiment = normalize_filter(sentiment);

    let mut statement = connection
        .prepare(
            "SELECT * FROM market_observations
             WHERE (?1 IS NULL OR observe_at >= ?1)
               AND (?2 IS NULL OR observe_at <= ?2)
               AND (?3 IS NULL OR sentiment = ?3)
             ORDER BY observe_at DESC, id DESC",
        )
        .map_err(map_error)?;

    let rows = statement
        .query_map(params![start_date, end_date, sentiment], map_row)
        .map_err(map_error)?;

    rows.collect::<Result<Vec<_>, _>>().map_err(map_error)
}

fn get_market_observation_by_id(
    connection: &Connection,
    id: i64,
) -> Result<MarketObservation, String> {
    let reviews = select_market_observations(
        connection,
        "SELECT * FROM market_observations WHERE id = ?1",
        params![id],
    )?;

    reviews
        .into_iter()
        .next()
        .ok_or_else(|| "市场观察记录不存在".to_string())
}

fn select_market_observations<P>(
    connection: &Connection,
    sql: &str,
    params: P,
) -> Result<Vec<MarketObservation>, String>
where
    P: rusqlite::Params,
{
    let mut statement = connection.prepare(sql).map_err(map_error)?;
    let rows = statement
        .query_map(params, map_row)
        .map_err(map_error)?;

    rows.collect::<Result<Vec<_>, _>>().map_err(map_error)
}

fn map_row(row: &rusqlite::Row<'_>) -> Result<MarketObservation, rusqlite::Error> {
    Ok(MarketObservation {
        id: row.get("id")?,
        observe_at: row.get("observe_at")?,
        shanghai_index: row.get("shanghai_index")?,
        sse_50_index: row.get("sse_50_index")?,
        csi_300_index: row.get("csi_300_index")?,
        market_turnover: row.get("market_turnover")?,
        sentiment: row.get("sentiment")?,
        policy_event: row.get("policy_event")?,
        macro_note: row.get("macro_note")?,
        personal_view: row.get("personal_view")?,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
    })
}

fn map_error(error: Error) -> String {
    crate::db::map_db_error(error, "市场观察记录不存在", "市场观察数据违反约束")
}
