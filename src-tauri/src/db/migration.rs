use std::fs;
use std::path::{Path, PathBuf};

use rusqlite::{params, Connection};

use crate::common::now_iso;

#[derive(Debug)]
struct MigrationFile {
    version: i64,
    path: PathBuf,
}

pub fn run_migrations(connection: &mut Connection) -> Result<(), String> {
    ensure_migration_table(connection)?;

    for migration in read_migration_files()? {
        if is_migration_applied(connection, migration.version)? {
            continue;
        }

        let sql = fs::read_to_string(&migration.path).map_err(|error| {
            format!(
                "读取迁移文件失败（{}）: {error}",
                migration.path.display()
            )
        })?;

        let transaction = connection
            .transaction()
            .map_err(|error| format!("创建迁移事务失败: {error}"))?;

        transaction.execute_batch(&sql).map_err(|error| {
            format!(
                "执行迁移失败（{}）: {error}",
                migration.path.display()
            )
        })?;

        transaction
            .execute(
                "INSERT INTO _migration_version (version, applied_at) VALUES (?1, ?2)",
                params![migration.version, now_iso()],
            )
            .map_err(|error| format!("记录迁移版本失败（{}）: {error}", migration.version))?;

        transaction
            .commit()
            .map_err(|error| format!("提交迁移事务失败（{}）: {error}", migration.version))?;
    }

    Ok(())
}

fn ensure_migration_table(connection: &Connection) -> Result<(), String> {
    connection
        .execute_batch(
            "CREATE TABLE IF NOT EXISTS _migration_version (
                version INTEGER PRIMARY KEY,
                applied_at TEXT NOT NULL
            );",
        )
        .map_err(|error| format!("创建迁移版本表失败: {error}"))
}

fn read_migration_files() -> Result<Vec<MigrationFile>, String> {
    let migrations_dir = Path::new(env!("CARGO_MANIFEST_DIR")).join("migrations");
    let entries = fs::read_dir(&migrations_dir).map_err(|error| {
        format!(
            "读取迁移目录失败（{}）: {error}",
            migrations_dir.display()
        )
    })?;

    let mut migrations = Vec::new();
    for entry in entries {
        let entry = entry.map_err(|error| format!("读取迁移目录项失败: {error}"))?;
        let path = entry.path();
        if path.extension().and_then(|value| value.to_str()) != Some("sql") {
            continue;
        }

        let file_name = path
            .file_name()
            .and_then(|value| value.to_str())
            .ok_or_else(|| format!("迁移文件名无效: {}", path.display()))?;
        let version_text = file_name
            .split_once('_')
            .map(|(version, _)| version)
            .ok_or_else(|| format!("迁移文件名缺少版本前缀: {file_name}"))?;
        let version = version_text
            .parse::<i64>()
            .map_err(|error| format!("迁移文件版本号无效（{file_name}）: {error}"))?;

        migrations.push(MigrationFile { version, path });
    }

    migrations.sort_by_key(|migration| migration.version);
    Ok(migrations)
}

fn is_migration_applied(connection: &Connection, version: i64) -> Result<bool, String> {
    let count = connection
        .query_row(
            "SELECT COUNT(*) FROM _migration_version WHERE version = ?1",
            params![version],
            |row| row.get::<_, i64>(0),
        )
        .map_err(|error| format!("查询迁移版本失败（{version}）: {error}"))?;

    Ok(count > 0)
}
