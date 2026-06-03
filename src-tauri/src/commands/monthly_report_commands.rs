/*
 * @Author: brycegao
 * @Github: https://github.com/brycegao
 * @Date: 2026/06/03
 * @Description: 月度报告 Tauri 命令
 *
 * Copyright (c) 2026 brycegao
 *
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

use std::sync::{Arc, Mutex};

use rusqlite::{params, Connection, Error};

use crate::common::now_iso;
use crate::models::{CreateMonthlyReportPayload, MonthlyReport, UpdateMonthlyReportPayload};

type DbState<'a> = tauri::State<'a, Arc<Mutex<Connection>>>;

#[tauri::command]
pub fn get_monthly_reports(db: DbState<'_>) -> Result<Vec<MonthlyReport>, String> {
    let connection = lock_connection(&db)?;
    select_monthly_reports(
        &connection,
        "SELECT * FROM monthly_reports ORDER BY month DESC, id DESC",
        params![],
    )
}

#[tauri::command]
pub fn get_monthly_report(db: DbState<'_>, month: String) -> Result<Option<MonthlyReport>, String> {
    let connection = lock_connection(&db)?;
    let reports = select_monthly_reports(
        &connection,
        "SELECT * FROM monthly_reports WHERE month = ?1",
        params![month],
    )?;

    Ok(reports.into_iter().next())
}

#[tauri::command]
pub fn create_monthly_report(
    db: DbState<'_>,
    payload: CreateMonthlyReportPayload,
) -> Result<MonthlyReport, String> {
    let connection = lock_connection(&db)?;
    let now = now_iso();

    connection
        .execute(
            "INSERT INTO monthly_reports (month, input_snapshot_json, ai_summary, user_edited_summary, model_name, prompt_version, generation_duration_ms, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![
                payload.month,
                payload.input_snapshot_json,
                payload.ai_summary,
                payload.user_edited_summary,
                payload.model_name,
                payload.prompt_version,
                payload.generation_duration_ms,
                now,
                now,
            ],
        )
        .map_err(map_monthly_report_error)?;

    let id = connection.last_insert_rowid();
    get_report_by_id(&connection, id)
}

#[tauri::command]
pub fn update_monthly_report(
    db: DbState<'_>,
    payload: UpdateMonthlyReportPayload,
) -> Result<MonthlyReport, String> {
    let connection = lock_connection(&db)?;
    let now = now_iso();

    let changed = connection
        .execute(
            "UPDATE monthly_reports
             SET user_edited_summary = ?1,
                 ai_summary = COALESCE(?2, ai_summary),
                 updated_at = ?3
             WHERE id = ?4",
            params![
                payload.user_edited_summary,
                payload.ai_summary,
                now,
                payload.id,
            ],
        )
        .map_err(map_monthly_report_error)?;

    if changed == 0 {
        return Err("月度报告不存在".to_string());
    }

    get_report_by_id(&connection, payload.id)
}

#[tauri::command]
pub fn delete_monthly_report(db: DbState<'_>, id: i64) -> Result<(), String> {
    let connection = lock_connection(&db)?;
    let changed = connection
        .execute("DELETE FROM monthly_reports WHERE id = ?1", params![id])
        .map_err(map_monthly_report_error)?;

    if changed == 0 {
        return Err("月度报告不存在".to_string());
    }

    Ok(())
}

fn lock_connection<'a>(
    db: &'a DbState<'a>,
) -> Result<std::sync::MutexGuard<'a, Connection>, String> {
    db.lock()
        .map_err(|error| format!("获取数据库锁失败: {error}"))
}

fn get_report_by_id(connection: &Connection, id: i64) -> Result<MonthlyReport, String> {
    let reports = select_monthly_reports(
        connection,
        "SELECT * FROM monthly_reports WHERE id = ?1",
        params![id],
    )?;

    reports
        .into_iter()
        .next()
        .ok_or_else(|| "月度报告不存在".to_string())
}

fn select_monthly_reports<P>(
    connection: &Connection,
    sql: &str,
    params: P,
) -> Result<Vec<MonthlyReport>, String>
where
    P: rusqlite::Params,
{
    let mut statement = connection
        .prepare(sql)
        .map_err(map_monthly_report_error)?;
    let rows = statement
        .query_map(params, map_report_row)
        .map_err(map_monthly_report_error)?;

    rows.collect::<Result<Vec<_>, _>>().map_err(map_monthly_report_error)
}

fn map_report_row(row: &rusqlite::Row<'_>) -> Result<MonthlyReport, rusqlite::Error> {
    Ok(MonthlyReport {
        id: row.get("id")?,
        month: row.get("month")?,
        input_snapshot_json: row.get("input_snapshot_json")?,
        ai_summary: row.get("ai_summary")?,
        user_edited_summary: row.get("user_edited_summary")?,
        model_name: row.get("model_name")?,
        prompt_version: row.get("prompt_version")?,
        generation_duration_ms: row.get("generation_duration_ms")?,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
    })
}

fn map_monthly_report_error(error: Error) -> String {
    match error {
        Error::SqliteFailure(ref sqlite_error, _)
            if sqlite_error.code == rusqlite::ErrorCode::ConstraintViolation =>
        {
            "该月份报告已存在".to_string()
        }
        _ => format!("数据库错误: {error}"),
    }
}
