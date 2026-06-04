/*
 * @Author: brycegao
 * @Github: https://github.com/brycegao
 * @Date: 2026/06/03
 * @Description: 数据库初始化、连接管理与共享工具函数
 *
 * Copyright (c) 2026 brycegao
 *
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

mod migration;

use std::fs;
use std::sync::{Arc, Mutex};

use rusqlite::{Connection, Error, ErrorCode};
use tauri::Manager;

/// Tauri 命令中数据库状态的类型别名。
pub type DbState<'a> = tauri::State<'a, Arc<Mutex<Connection>>>;

/// 获取数据库连接的可变引用。
pub fn lock_connection<'a>(db: &'a DbState<'a>) -> Result<std::sync::MutexGuard<'a, Connection>, String> {
    db.lock()
        .map_err(|error| format!("获取数据库锁失败: {error}"))
}

/// 规范化查询过滤条件：空白字符串转为 None。
pub fn normalize_filter(value: Option<String>) -> Option<String> {
    value.and_then(|inner| {
        let trimmed = inner.trim();
        if trimmed.is_empty() {
            None
        } else {
            Some(trimmed.to_string())
        }
    })
}

/// 将 rusqlite::Error 映射为用户友好的中文错误消息。
pub fn map_db_error(error: Error, not_found_msg: &str, constraint_msg: &str) -> String {
    match error {
        Error::QueryReturnedNoRows => not_found_msg.to_string(),
        Error::SqliteFailure(ref sqlite_error, _)
            if sqlite_error.code == ErrorCode::ConstraintViolation =>
        {
            constraint_msg.to_string()
        }
        _ => format!("数据库错误: {error}"),
    }
}

pub fn init_database(app_handle: &tauri::AppHandle) -> Result<Arc<Mutex<Connection>>, String> {
    let tauri_app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|error| format!("获取应用数据目录失败: {error}"))?;
    let app_data_dir = tauri_app_data_dir
        .parent()
        .map(|parent| parent.join("invest-record-pro"))
        .unwrap_or(tauri_app_data_dir);

    fs::create_dir_all(&app_data_dir).map_err(|error| {
        format!(
            "创建应用数据目录失败（{}）: {error}",
            app_data_dir.display()
        )
    })?;

    let db_path = app_data_dir.join("data.db");
    let mut connection = Connection::open(&db_path)
        .map_err(|error| format!("打开数据库失败（{}）: {error}", db_path.display()))?;

    connection
        .execute_batch("PRAGMA foreign_keys = ON;")
        .map_err(|error| format!("启用数据库外键约束失败: {error}"))?;

    migration::run_migrations(&mut connection)?;

    Ok(Arc::new(Mutex::new(connection)))
}
