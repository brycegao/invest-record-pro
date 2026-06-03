/*
 * @Author: brycegao
 * @Github: https://github.com/brycegao
 * @Date: 2026/06/03
 * @Description: 交易复盘 Tauri 命令
 *
 * Copyright (c) 2026 brycegao
 *
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

use std::sync::{Arc, Mutex};

use rusqlite::{params, Connection, Error, ErrorCode};

use crate::common::now_iso;
use crate::models::{CreateReviewPayload, Review, UpdateReviewPayload};

type DbState<'a> = tauri::State<'a, Arc<Mutex<Connection>>>;

#[tauri::command]
pub fn get_reviews(db: DbState<'_>) -> Result<Vec<Review>, String> {
    let connection = lock_connection(&db)?;
    select_reviews(
        &connection,
        "SELECT r.*,
                a.code AS trade_asset_code,
                a.name AS trade_asset_name,
                t.trade_type AS trade_type,
                t.created_at AS trade_created_at
         FROM reviews r
         INNER JOIN trades t ON r.trade_id = t.id
         INNER JOIN assets a ON t.asset_id = a.id
         ORDER BY r.created_at DESC, r.id DESC",
        params![],
    )
}

#[tauri::command]
pub fn create_review(db: DbState<'_>, payload: CreateReviewPayload) -> Result<Review, String> {
    let connection = lock_connection(&db)?;
    let now = now_iso();

    connection
        .execute(
            "INSERT INTO reviews (trade_id, result, issue_type, summary, improve, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                payload.trade_id,
                payload.result,
                payload.issue_type,
                payload.summary,
                payload.improve,
                now,
                now,
            ],
        )
        .map_err(map_review_error)?;

    let id = connection.last_insert_rowid();
    get_review_by_id(&connection, id)
}

#[tauri::command]
pub fn update_review(db: DbState<'_>, payload: UpdateReviewPayload) -> Result<Review, String> {
    let connection = lock_connection(&db)?;
    let now = now_iso();

    let changed = connection
        .execute(
            "UPDATE reviews
             SET trade_id = ?1,
                 result = ?2,
                 issue_type = ?3,
                 summary = ?4,
                 improve = ?5,
                 updated_at = ?6
             WHERE id = ?7",
            params![
                payload.trade_id,
                payload.result,
                payload.issue_type,
                payload.summary,
                payload.improve,
                now,
                payload.id,
            ],
        )
        .map_err(map_review_error)?;

    if changed == 0 {
        return Err("复盘记录不存在".to_string());
    }

    get_review_by_id(&connection, payload.id)
}

#[tauri::command]
pub fn delete_review(db: DbState<'_>, id: i64) -> Result<(), String> {
    let connection = lock_connection(&db)?;
    let changed = connection
        .execute("DELETE FROM reviews WHERE id = ?1", params![id])
        .map_err(map_review_error)?;

    if changed == 0 {
        return Err("复盘记录不存在".to_string());
    }

    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
pub fn query_reviews(
    db: DbState<'_>,
    keyword: Option<String>,
    start_date: Option<String>,
    end_date: Option<String>,
    result: Option<String>,
    issue_type: Option<String>,
) -> Result<Vec<Review>, String> {
    let connection = lock_connection(&db)?;
    let keyword = normalize_filter(keyword);
    let start_date = normalize_filter(start_date);
    let end_date = normalize_filter(end_date);
    let result = normalize_filter(result);
    let issue_type = normalize_filter(issue_type);

    let mut statement = connection
        .prepare(
            "SELECT r.*,
                    a.code AS trade_asset_code,
                    a.name AS trade_asset_name,
                    t.trade_type AS trade_type,
                    t.created_at AS trade_created_at
             FROM reviews r
             INNER JOIN trades t ON r.trade_id = t.id
             INNER JOIN assets a ON t.asset_id = a.id
             WHERE (?1 IS NULL OR a.code LIKE '%' || ?1 || '%' OR a.name LIKE '%' || ?1 || '%')
               AND (?2 IS NULL OR r.created_at >= ?2)
               AND (?3 IS NULL OR r.created_at <= ?3)
               AND (?4 IS NULL OR r.result = ?4)
               AND (?5 IS NULL OR r.issue_type = ?5)
             ORDER BY r.created_at DESC, r.id DESC",
        )
        .map_err(map_review_error)?;

    let rows = statement
        .query_map(params![keyword, start_date, end_date, result, issue_type], map_review_row)
        .map_err(map_review_error)?;

    rows.collect::<Result<Vec<_>, _>>().map_err(map_review_error)
}

fn lock_connection<'a>(
    db: &'a DbState<'a>,
) -> Result<std::sync::MutexGuard<'a, Connection>, String> {
    db.lock()
        .map_err(|error| format!("获取数据库锁失败: {error}"))
}

fn get_review_by_id(connection: &Connection, id: i64) -> Result<Review, String> {
    let reviews = select_reviews(
        connection,
        "SELECT r.*,
                a.code AS trade_asset_code,
                a.name AS trade_asset_name,
                t.trade_type AS trade_type,
                t.created_at AS trade_created_at
         FROM reviews r
         INNER JOIN trades t ON r.trade_id = t.id
         INNER JOIN assets a ON t.asset_id = a.id
         WHERE r.id = ?1",
        params![id],
    )?;

    reviews
        .into_iter()
        .next()
        .ok_or_else(|| "复盘记录不存在".to_string())
}

fn select_reviews<P>(connection: &Connection, sql: &str, params: P) -> Result<Vec<Review>, String>
where
    P: rusqlite::Params,
{
    let mut statement = connection.prepare(sql).map_err(map_review_error)?;
    let rows = statement
        .query_map(params, map_review_row)
        .map_err(map_review_error)?;

    rows.collect::<Result<Vec<_>, _>>().map_err(map_review_error)
}

fn map_review_row(row: &rusqlite::Row<'_>) -> Result<Review, rusqlite::Error> {
    Ok(Review {
        id: row.get("id")?,
        trade_id: row.get("trade_id")?,
        result: row.get("result")?,
        issue_type: row.get("issue_type")?,
        summary: row.get("summary")?,
        improve: row.get("improve")?,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
        trade_asset_code: row.get("trade_asset_code")?,
        trade_asset_name: row.get("trade_asset_name")?,
        trade_type: row.get("trade_type")?,
        trade_created_at: row.get("trade_created_at")?,
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

fn map_review_error(error: Error) -> String {
    match error {
        Error::QueryReturnedNoRows => "复盘记录不存在".to_string(),
        Error::SqliteFailure(ref sqlite_error, _)
            if sqlite_error.code == ErrorCode::ConstraintViolation =>
        {
            "复盘数据违反约束，请检查关联交易".to_string()
        }
        _ => format!("数据库错误: {error}"),
    }
}
