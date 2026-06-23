/*
 * @Author: brycegao
 * @Github: https://github.com/brycegao
 * @Date: 2026/06/03
 * @Description: Tauri 应用主入口，注册插件与命令
 *
 * Copyright (c) 2026 brycegao
 *
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

pub mod commands;
pub mod common;
pub mod db;
pub mod market;
pub mod models;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    if let Err(error) = tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let db = db::init_database(app.handle())?;
            app.manage(db);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_assets,
            commands::create_asset,
            commands::update_asset,
            commands::delete_asset,
            commands::query_assets,
            commands::get_plans,
            commands::create_plan,
            commands::update_plan,
            commands::delete_plan,
            commands::update_plan_status,
            commands::query_plans,
            commands::get_plan_rules,
            commands::get_trades,
            commands::create_trade,
            commands::update_trade,
            commands::delete_trade,
            commands::query_trades,
            commands::get_trade_summary,
            commands::get_positions,
            commands::create_position_snapshot,
            commands::get_position_items,
            commands::delete_position,
            commands::get_latest_position,
            commands::get_reviews,
            commands::create_review,
            commands::update_review,
            commands::delete_review,
            commands::query_reviews,
            commands::get_advisor_signals,
            commands::create_advisor_signal,
            commands::update_advisor_signal,
            commands::delete_advisor_signal,
            commands::get_follow_up,
            commands::upsert_follow_up,
            commands::delete_follow_up,
            commands::refresh_advisor_market,
            commands::get_strategy_stats,
            commands::get_market_observations,
            commands::create_market_observation,
            commands::update_market_observation,
            commands::delete_market_observation,
            commands::query_market_observations,
            commands::get_monthly_reports,
            commands::get_monthly_report,
            commands::create_monthly_report,
            commands::update_monthly_report,
            commands::delete_monthly_report,
            commands::get_setting,
            commands::upsert_setting,
            commands::get_settings,
            commands::get_all_settings,
            commands::get_db_path,
            commands::backup_database,
            commands::restore_database,
            commands::export_assets_csv,
            commands::export_trades_csv,
        ])
        .run(tauri::generate_context!())
    {
        eprintln!("启动应用失败: {error}");
    }
}
