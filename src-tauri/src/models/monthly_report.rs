/*
 * @Author: brycegao
 * @Github: https://github.com/brycegao
 * @Date: 2026/06/03
 * @Description: 月度报告数据模型
 *
 * Copyright (c) 2026 brycegao
 *
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MonthlyReport {
    pub id: i64,
    pub month: String,
    pub input_snapshot_json: String,
    pub ai_summary: String,
    pub user_edited_summary: Option<String>,
    pub model_name: Option<String>,
    pub prompt_version: Option<String>,
    pub generation_duration_ms: i64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateMonthlyReportPayload {
    pub month: String,
    pub input_snapshot_json: String,
    pub ai_summary: String,
    pub user_edited_summary: Option<String>,
    pub model_name: Option<String>,
    pub prompt_version: Option<String>,
    pub generation_duration_ms: i64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateMonthlyReportPayload {
    pub id: i64,
    pub user_edited_summary: Option<String>,
    pub ai_summary: Option<String>,
}
