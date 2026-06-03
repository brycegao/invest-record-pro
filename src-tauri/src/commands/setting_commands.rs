/*
 * @Author: brycegao
 * @Github: https://github.com/brycegao
 * @Date: 2026/06/03
 * @Description: 设置相关 Tauri 命令
 *
 * Copyright (c) 2026 brycegao
 *
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

use std::sync::{Arc, Mutex};

use rusqlite::params;

use tauri::Manager;

use crate::common::now_iso;

type DbState<'a> = tauri::State<'a, Arc<Mutex<rusqlite::Connection>>>;

#[tauri::command]
pub fn get_setting(db: DbState<'_>, key: String) -> Result<Option<String>, String> {
    let connection = db.lock().map_err(|e| format!("获取数据库锁失败: {e}"))?;
    let mut statement = connection
        .prepare("SELECT value FROM settings WHERE key = ?1")
        .map_err(|e| format!("数据库错误: {e}"))?;
    let value = statement
        .query_row(params![key], |row| row.get::<_, Option<String>>(0))
        .unwrap_or(None);
    Ok(value)
}

#[tauri::command]
pub fn upsert_setting(db: DbState<'_>, payload: serde_json::Value) -> Result<(), String> {
    let connection = db.lock().map_err(|e| format!("获取数据库锁失败: {e}"))?;
    let key = payload["key"].as_str().unwrap_or_default().to_string();
    let value = payload["value"].as_str().unwrap_or_default().to_string();
    let now = now_iso();

    connection
        .execute(
            "INSERT INTO settings (key, value, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?3)
             ON CONFLICT(key) DO UPDATE SET value = ?2, updated_at = ?3",
            params![key, value, now],
        )
        .map_err(|e| format!("保存设置失败: {e}"))?;

    Ok(())
}

#[tauri::command]
pub fn get_settings(db: DbState<'_>) -> Result<Vec<serde_json::Value>, String> {
    let connection = db.lock().map_err(|e| format!("获取数据库锁失败: {e}"))?;
    let mut statement = connection
        .prepare("SELECT id, key, value, created_at, updated_at FROM settings ORDER BY key")
        .map_err(|e| format!("数据库错误: {e}"))?;
    let rows = statement
        .query_map([], |row| {
            Ok(serde_json::json!({
                "id": row.get::<_, i64>(0)?,
                "key": row.get::<_, String>(1)?,
                "value": row.get::<_, Option<String>>(2)?,
                "createdAt": row.get::<_, String>(3)?,
                "updatedAt": row.get::<_, String>(4)?,
            }))
        })
        .map_err(|e| format!("查询设置失败: {e}"))?;

    let settings: Vec<serde_json::Value> = rows.filter_map(|r| r.ok()).collect();
    Ok(settings)
}

#[tauri::command]
pub fn get_all_settings(db: DbState<'_>) -> Result<Vec<(String, Option<String>)>, String> {
    let connection = db.lock().map_err(|e| format!("获取数据库锁失败: {e}"))?;
    let mut statement = connection
        .prepare("SELECT key, value FROM settings ORDER BY key")
        .map_err(|e| format!("数据库错误: {e}"))?;
    let rows = statement
        .query_map([], |row| Ok((row.get::<_, String>(0)?, row.get::<_, Option<String>>(1)?)))
        .map_err(|e| format!("查询设置失败: {e}"))?;

    let result: Vec<(String, Option<String>)> = rows.filter_map(|r| r.ok()).collect();
    Ok(result)
}

#[tauri::command]
pub fn get_db_path(app: tauri::AppHandle) -> Result<String, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("获取应用数据目录失败: {e}"))?;
    let db_dir = app_data_dir
        .parent()
        .map(|p| p.join("invest-record-pro"))
        .unwrap_or(app_data_dir);
    let db_path = db_dir.join("data.db");
    Ok(db_path.to_string_lossy().to_string())
}

#[tauri::command]
pub fn backup_database(db: DbState<'_>, target_path: String) -> Result<(), String> {
    let connection = db.lock().map_err(|e| format!("获取数据库锁失败: {e}"))?;

    // 使用 rusqlite 的 backup API：backup(DatabaseName, dst_path, progress)
    connection
        .backup(rusqlite::DatabaseName::Main, &target_path, None)
        .map_err(|e| format!("数据库备份失败: {e}"))?;

    Ok(())
}

#[tauri::command]
pub fn restore_database(app: tauri::AppHandle, source_path: String) -> Result<(), String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("获取应用数据目录失败: {e}"))?;
    let db_dir = app_data_dir
        .parent()
        .map(|p| p.join("invest-record-pro"))
        .unwrap_or(app_data_dir);
    let db_path = db_dir.join("data.db");

    let source = std::path::Path::new(&source_path);
    if !source.exists() {
        return Err("源数据库文件不存在".to_string());
    }

    std::fs::copy(source, &db_path)
        .map_err(|e| format!("恢复数据库失败: {e}"))?;

    Ok(())
}

#[tauri::command]
pub fn export_assets_csv(db: DbState<'_>) -> Result<String, String> {
    let connection = db.lock().map_err(|e| format!("获取数据库锁失败: {e}"))?;
    let mut statement = connection
        .prepare("SELECT code, name, type, market, risk_level, logic, created_at FROM assets ORDER BY id")
        .map_err(|e| format!("查询标的失败: {e}"))?;

    let mut csv = String::from("\u{FEFF}"); // UTF-8 BOM
    csv.push_str("代码,名称,类型,市场,风险等级,投资逻辑,创建时间\n");

    let rows = statement
        .query_map([], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, Option<String>>(3)?,
                row.get::<_, Option<i64>>(4)?,
                row.get::<_, Option<String>>(5)?,
                row.get::<_, String>(6)?,
            ))
        })
        .map_err(|e| format!("查询标的失败: {e}"))?;

    for row in rows {
        let (code, name, asset_type, market, risk_level, logic, created_at) =
            row.map_err(|e| format!("读取标的数据失败: {e}"))?;
        let risk_str = risk_level.map(|r| r.to_string()).unwrap_or_default();
        let logic_str = logic.unwrap_or_default();
        csv.push_str(&csv_escape(&code));
        csv.push(',');
        csv.push_str(&csv_escape(&name));
        csv.push(',');
        csv.push_str(&csv_escape(&asset_type));
        csv.push(',');
        csv.push_str(&csv_escape(&market.unwrap_or_default()));
        csv.push(',');
        csv.push_str(&csv_escape(&risk_str));
        csv.push(',');
        csv.push_str(&csv_escape(&logic_str));
        csv.push(',');
        csv.push_str(&csv_escape(&created_at));
        csv.push('\n');
    }

    Ok(csv)
}

#[tauri::command]
pub fn export_trades_csv(db: DbState<'_>) -> Result<String, String> {
    let connection = db.lock().map_err(|e| format!("获取数据库锁失败: {e}"))?;
    let mut statement = connection
        .prepare(
            "SELECT t.trade_at, a.code, a.name, t.trade_type, t.price, t.quantity, t.total_amount, t.fee, t.mood, t.follow_plan
             FROM trades t
             INNER JOIN assets a ON t.asset_id = a.id
             ORDER BY t.trade_at DESC, t.id DESC",
        )
        .map_err(|e| format!("查询交易失败: {e}"))?;

    let mut csv = String::from("\u{FEFF}"); // UTF-8 BOM
    csv.push_str("成交时间,标的,类型,价格,数量,总金额,手续费,情绪,遵守计划\n");

    let rows = statement
        .query_map([], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, String>(3)?,
                row.get::<_, i64>(4)?,
                row.get::<_, i64>(5)?,
                row.get::<_, i64>(6)?,
                row.get::<_, i64>(7)?,
                row.get::<_, Option<String>>(8)?,
                row.get::<_, bool>(9)?,
            ))
        })
        .map_err(|e| format!("查询交易失败: {e}"))?;

    for row in rows {
        let (trade_at, code, name, trade_type, price, quantity, total_amount, fee, mood, follow_plan) =
            row.map_err(|e| format!("读取交易数据失败: {e}"))?;
        let mood_str = mood.unwrap_or_default();
        let follow_str = if follow_plan { "是" } else { "否" };
        // 价格转换为元（数据库存储为分×1000）
        let price_yuan = price as f64 / 1000.0;
        let total_yuan = total_amount as f64 / 1000.0;
        let fee_yuan = fee as f64 / 1000.0;
        csv.push_str(&csv_escape(&trade_at));
        csv.push(',');
        csv.push_str(&csv_escape(&code));
        csv.push(',');
        csv.push_str(&csv_escape(&trade_type));
        csv.push(',');
        csv.push_str(&csv_escape(&format!("{price_yuan:.3}")));
        csv.push(',');
        csv.push_str(&csv_escape(&quantity.to_string()));
        csv.push(',');
        csv.push_str(&csv_escape(&format!("{total_yuan:.2}")));
        csv.push(',');
        csv.push_str(&csv_escape(&format!("{fee_yuan:.2}")));
        csv.push(',');
        csv.push_str(&csv_escape(&mood_str));
        csv.push(',');
        csv.push_str(&csv_escape(follow_str));
        csv.push('\n');
    }

    Ok(csv)
}

fn csv_escape(s: &str) -> String {
    if s.contains(',') || s.contains('"') || s.contains('\n') {
        format!("\"{}\"", s.replace('"', "\"\""))
    } else {
        s.to_string()
    }
}
