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
        ])
        .run(tauri::generate_context!())
    {
        eprintln!("启动应用失败: {error}");
    }
}
