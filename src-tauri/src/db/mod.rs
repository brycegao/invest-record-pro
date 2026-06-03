/*
 * @Author: brycegao
 * @Github: https://github.com/brycegao
 * @Date: 2026/06/03
 * @Description: 数据库初始化与连接管理
 *
 * Copyright (c) 2026 brycegao
 *
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

mod migration;

use std::fs;
use std::sync::{Arc, Mutex};

use rusqlite::Connection;
use tauri::Manager;

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
