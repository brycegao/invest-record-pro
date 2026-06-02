use std::sync::{Arc, Mutex};

use rusqlite::{params, Connection, Error, ErrorCode, Transaction};

use crate::common::now_iso;
use crate::models::{CreatePlanPayload, CreatePlanRulePayload, Plan, PlanRule, UpdatePlanPayload};

type DbState<'a> = tauri::State<'a, Arc<Mutex<Connection>>>;

#[tauri::command]
pub fn get_plans(db: DbState<'_>) -> Result<Vec<Plan>, String> {
    let connection = lock_connection(&db)?;
    select_plans(
        &connection,
        "SELECT p.*, a.code AS asset_code, a.name AS asset_name
         FROM plans p
         INNER JOIN assets a ON p.asset_id = a.id
         ORDER BY p.created_at DESC",
        params![],
    )
}

#[tauri::command]
pub fn create_plan(db: DbState<'_>, payload: CreatePlanPayload) -> Result<Plan, String> {
    let mut connection = lock_connection(&db)?;
    let tx = connection.transaction().map_err(map_plan_error)?;
    let now = now_iso();
    let status = "pending";

    tx.execute(
        "INSERT INTO plans (
            asset_id,
            plan_type,
            status,
            position_percent,
            start_date,
            end_date,
            notes,
            created_at,
            updated_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![
            payload.asset_id,
            payload.plan_type,
            status,
            payload.position_percent,
            payload.start_date,
            payload.end_date,
            payload.notes,
            now,
            now,
        ],
    )
    .map_err(map_plan_error)?;

    let id = tx.last_insert_rowid();
    insert_plan_rules(&tx, id, payload.rules.as_deref())?;
    tx.commit().map_err(map_plan_error)?;

    get_plan_by_id(&connection, id)
}

#[tauri::command]
pub fn update_plan(db: DbState<'_>, payload: UpdatePlanPayload) -> Result<Plan, String> {
    let mut connection = lock_connection(&db)?;
    let tx = connection.transaction().map_err(map_plan_error)?;
    let now = now_iso();

    let changed = tx
        .execute(
            "UPDATE plans
             SET asset_id = ?1,
                 plan_type = ?2,
                 status = ?3,
                 position_percent = ?4,
                 start_date = ?5,
                 end_date = ?6,
                 notes = ?7,
                 updated_at = ?8
             WHERE id = ?9",
            params![
                payload.asset_id,
                payload.plan_type,
                payload.status,
                payload.position_percent,
                payload.start_date,
                payload.end_date,
                payload.notes,
                now,
                payload.id,
            ],
        )
        .map_err(map_plan_error)?;

    if changed == 0 {
        return Err("计划不存在".to_string());
    }

    // 规则是计划的一组子项，更新时整体替换可以避免前端维护临时规则 id。
    tx.execute(
        "DELETE FROM plan_rules WHERE plan_id = ?1",
        params![payload.id],
    )
    .map_err(map_plan_error)?;
    insert_plan_rules(&tx, payload.id, payload.rules.as_deref())?;
    tx.commit().map_err(map_plan_error)?;

    get_plan_by_id(&connection, payload.id)
}

#[tauri::command]
pub fn delete_plan(db: DbState<'_>, id: i64) -> Result<(), String> {
    let connection = lock_connection(&db)?;
    let changed = connection
        .execute("DELETE FROM plans WHERE id = ?1", params![id])
        .map_err(map_plan_error)?;

    if changed == 0 {
        return Err("计划不存在".to_string());
    }

    Ok(())
}

#[tauri::command]
pub fn update_plan_status(db: DbState<'_>, id: i64, status: String) -> Result<(), String> {
    let connection = lock_connection(&db)?;
    let now = now_iso();
    let changed = connection
        .execute(
            "UPDATE plans SET status = ?1, updated_at = ?2 WHERE id = ?3",
            params![status, now, id],
        )
        .map_err(map_plan_error)?;

    if changed == 0 {
        return Err("计划不存在".to_string());
    }

    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
pub fn query_plans(
    db: DbState<'_>,
    keyword: Option<String>,
    plan_type: Option<String>,
    status: Option<String>,
    start_date: Option<String>,
    end_date: Option<String>,
) -> Result<Vec<Plan>, String> {
    let connection = lock_connection(&db)?;
    let keyword = normalize_filter(keyword);
    let plan_type = normalize_filter(plan_type);
    let status = normalize_filter(status);
    let start_date = normalize_filter(start_date);
    let end_date = normalize_filter(end_date);

    let mut statement = connection
        .prepare(
            "SELECT p.*, a.code AS asset_code, a.name AS asset_name
             FROM plans p
             INNER JOIN assets a ON p.asset_id = a.id
             WHERE (?1 IS NULL OR a.code LIKE '%' || ?1 || '%' OR a.name LIKE '%' || ?1 || '%')
               AND (?2 IS NULL OR p.plan_type = ?2)
               AND (?3 IS NULL OR p.status = ?3)
               AND (?4 IS NULL OR p.start_date >= ?4)
               AND (?5 IS NULL OR p.end_date <= ?5)
             ORDER BY p.created_at DESC",
        )
        .map_err(map_plan_error)?;

    let rows = statement
        .query_map(
            params![keyword, plan_type, status, start_date, end_date],
            map_plan_row,
        )
        .map_err(map_plan_error)?;

    collect_plans(rows)
}

#[tauri::command(rename_all = "snake_case")]
pub fn get_plan_rules(db: DbState<'_>, plan_id: i64) -> Result<Vec<PlanRule>, String> {
    let connection = lock_connection(&db)?;
    let mut statement = connection
        .prepare("SELECT * FROM plan_rules WHERE plan_id = ?1 ORDER BY created_at ASC")
        .map_err(map_plan_error)?;
    let rows = statement
        .query_map(params![plan_id], map_plan_rule_row)
        .map_err(map_plan_error)?;

    rows.collect::<Result<Vec<_>, _>>().map_err(map_plan_error)
}

fn lock_connection<'a>(
    db: &'a DbState<'a>,
) -> Result<std::sync::MutexGuard<'a, Connection>, String> {
    db.lock()
        .map_err(|error| format!("获取数据库锁失败: {error}"))
}

fn get_plan_by_id(connection: &Connection, id: i64) -> Result<Plan, String> {
    connection
        .query_row(
            "SELECT p.*, a.code AS asset_code, a.name AS asset_name
             FROM plans p
             INNER JOIN assets a ON p.asset_id = a.id
             WHERE p.id = ?1",
            params![id],
            map_plan_row,
        )
        .map_err(map_plan_error)
}

fn select_plans<P>(connection: &Connection, sql: &str, params: P) -> Result<Vec<Plan>, String>
where
    P: rusqlite::Params,
{
    let mut statement = connection.prepare(sql).map_err(map_plan_error)?;
    let rows = statement
        .query_map(params, map_plan_row)
        .map_err(map_plan_error)?;
    collect_plans(rows)
}

fn collect_plans(
    rows: impl Iterator<Item = Result<Plan, rusqlite::Error>>,
) -> Result<Vec<Plan>, String> {
    rows.collect::<Result<Vec<_>, _>>().map_err(map_plan_error)
}

fn insert_plan_rules(
    tx: &Transaction<'_>,
    plan_id: i64,
    rules: Option<&[CreatePlanRulePayload]>,
) -> Result<(), String> {
    let Some(rules) = rules else {
        return Ok(());
    };

    for rule in rules {
        let now = now_iso();
        tx.execute(
            "INSERT INTO plan_rules (
                plan_id,
                rule_type,
                operator,
                value,
                created_at,
                updated_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![plan_id, rule.rule_type, rule.operator, rule.value, now, now],
        )
        .map_err(map_plan_error)?;
    }

    Ok(())
}

fn map_plan_row(row: &rusqlite::Row<'_>) -> Result<Plan, rusqlite::Error> {
    Ok(Plan {
        id: row.get("id")?,
        asset_id: row.get("asset_id")?,
        plan_type: row.get("plan_type")?,
        status: row.get("status")?,
        position_percent: row.get("position_percent")?,
        start_date: row.get("start_date")?,
        end_date: row.get("end_date")?,
        notes: row.get("notes")?,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
        asset_code: row.get("asset_code")?,
        asset_name: row.get("asset_name")?,
    })
}

fn map_plan_rule_row(row: &rusqlite::Row<'_>) -> Result<PlanRule, rusqlite::Error> {
    Ok(PlanRule {
        id: row.get("id")?,
        plan_id: row.get("plan_id")?,
        rule_type: row.get("rule_type")?,
        operator: row.get("operator")?,
        value: row.get("value")?,
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

fn map_plan_error(error: Error) -> String {
    match error {
        Error::QueryReturnedNoRows => "计划不存在".to_string(),
        Error::SqliteFailure(ref sqlite_error, _)
            if sqlite_error.code == ErrorCode::ConstraintViolation =>
        {
            "计划数据违反约束，请检查关联标的和规则内容".to_string()
        }
        _ => format!("数据库错误: {error}"),
    }
}
