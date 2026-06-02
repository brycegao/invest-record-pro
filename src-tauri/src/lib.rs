pub mod commands;
pub mod common;
pub mod db;
pub mod models;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    if let Err(error) = tauri::Builder::default()
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
        ])
        .run(tauri::generate_context!())
    {
        eprintln!("启动应用失败: {error}");
    }
}
