use std::sync::{Arc, Mutex};

use rusqlite::{params, Connection, Error, ErrorCode};

use crate::common::now_iso;
use crate::models::{Asset, CreateAssetPayload, UpdateAssetPayload};

type DbState<'a> = tauri::State<'a, Arc<Mutex<Connection>>>;

#[tauri::command]
pub fn get_assets(db: DbState<'_>) -> Result<Vec<Asset>, String> {
    let connection = lock_connection(&db)?;
    select_assets(&connection, "SELECT * FROM assets ORDER BY created_at DESC", params![])
}

#[tauri::command]
pub fn create_asset(db: DbState<'_>, payload: CreateAssetPayload) -> Result<Asset, String> {
    let connection = lock_connection(&db)?;
    let now = now_iso();
    let risk_level = payload.risk_level.unwrap_or(3);

    connection
        .execute(
            "INSERT INTO assets (
                code,
                name,
                type,
                market,
                risk_level,
                index_reference,
                logic,
                notes,
                created_at,
                updated_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            params![
                payload.code,
                payload.name,
                payload.asset_type,
                payload.market,
                risk_level,
                payload.index_reference,
                payload.logic,
                payload.notes,
                now,
                now,
            ],
        )
        .map_err(map_asset_error)?;

    let id = connection.last_insert_rowid();
    get_asset_by_id(&connection, id)
}

#[tauri::command]
pub fn update_asset(db: DbState<'_>, payload: UpdateAssetPayload) -> Result<Asset, String> {
    let connection = lock_connection(&db)?;
    let now = now_iso();
    let risk_level = payload.risk_level.unwrap_or(3);

    let changed = connection
        .execute(
            "UPDATE assets
             SET code = ?1,
                 name = ?2,
                 type = ?3,
                 market = ?4,
                 risk_level = ?5,
                 index_reference = ?6,
                 logic = ?7,
                 notes = ?8,
                 updated_at = ?9
             WHERE id = ?10",
            params![
                payload.code,
                payload.name,
                payload.asset_type,
                payload.market,
                risk_level,
                payload.index_reference,
                payload.logic,
                payload.notes,
                now,
                payload.id,
            ],
        )
        .map_err(map_asset_error)?;

    if changed == 0 {
        return Err("资产不存在".to_string());
    }

    get_asset_by_id(&connection, payload.id)
}

#[tauri::command]
pub fn delete_asset(db: DbState<'_>, id: i64) -> Result<(), String> {
    let connection = lock_connection(&db)?;
    let changed = connection
        .execute("DELETE FROM assets WHERE id = ?1", params![id])
        .map_err(map_asset_error)?;

    if changed == 0 {
        return Err("资产不存在".to_string());
    }

    Ok(())
}

#[tauri::command]
pub fn query_assets(
    db: DbState<'_>,
    keyword: Option<String>,
    asset_type: Option<String>,
    market: Option<String>,
) -> Result<Vec<Asset>, String> {
    let connection = lock_connection(&db)?;
    let keyword = normalize_filter(keyword);
    let asset_type = normalize_filter(asset_type);
    let market = normalize_filter(market);

    let mut statement = connection
        .prepare(
            "SELECT *
             FROM assets
             WHERE (?1 IS NULL OR code LIKE '%' || ?1 || '%' OR name LIKE '%' || ?1 || '%')
               AND (?2 IS NULL OR type = ?2)
               AND (?3 IS NULL OR market = ?3)
             ORDER BY created_at DESC",
        )
        .map_err(map_asset_error)?;

    let rows = statement
        .query_map(params![keyword, asset_type, market], map_asset_row)
        .map_err(map_asset_error)?;

    collect_assets(rows)
}

fn lock_connection<'a>(db: &'a DbState<'a>) -> Result<std::sync::MutexGuard<'a, Connection>, String> {
    db.lock()
        .map_err(|error| format!("获取数据库锁失败: {error}"))
}

fn get_asset_by_id(connection: &Connection, id: i64) -> Result<Asset, String> {
    connection
        .query_row("SELECT * FROM assets WHERE id = ?1", params![id], map_asset_row)
        .map_err(map_asset_error)
}

fn select_assets<P>(connection: &Connection, sql: &str, params: P) -> Result<Vec<Asset>, String>
where
    P: rusqlite::Params,
{
    let mut statement = connection.prepare(sql).map_err(map_asset_error)?;
    let rows = statement.query_map(params, map_asset_row).map_err(map_asset_error)?;
    collect_assets(rows)
}

fn collect_assets(
    rows: impl Iterator<Item = Result<Asset, rusqlite::Error>>,
) -> Result<Vec<Asset>, String> {
    rows.collect::<Result<Vec<_>, _>>().map_err(map_asset_error)
}

fn map_asset_row(row: &rusqlite::Row<'_>) -> Result<Asset, rusqlite::Error> {
    Ok(Asset {
        id: row.get("id")?,
        code: row.get("code")?,
        name: row.get("name")?,
        asset_type: row.get("type")?,
        market: row.get("market")?,
        risk_level: row.get("risk_level")?,
        index_reference: row.get("index_reference")?,
        logic: row.get("logic")?,
        notes: row.get("notes")?,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
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

fn map_asset_error(error: Error) -> String {
    match error {
        Error::QueryReturnedNoRows => "资产不存在".to_string(),
        Error::SqliteFailure(ref sqlite_error, _)
            if sqlite_error.code == ErrorCode::ConstraintViolation =>
        {
            "该代码在此市场已存在".to_string()
        }
        _ => format!("数据库错误: {error}"),
    }
}
