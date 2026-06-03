/*
 * @Author: brycegao
 * @Github: https://github.com/brycegao
 * @Date: 2026/06/03
 * @Description: 交易计划数据模型
 *
 * Copyright (c) 2026 brycegao
 *
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Plan {
    pub id: i64,
    pub asset_id: i64,
    pub plan_type: String,
    pub status: String,
    pub position_percent: Option<i32>,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub notes: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub asset_code: Option<String>,
    pub asset_name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlanRule {
    pub id: i64,
    pub plan_id: i64,
    pub rule_type: String,
    pub operator: Option<String>,
    pub value: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatePlanPayload {
    #[serde(alias = "asset_id")]
    pub asset_id: i64,
    #[serde(alias = "plan_type")]
    pub plan_type: String,
    #[serde(alias = "position_percent")]
    pub position_percent: Option<i32>,
    #[serde(alias = "start_date")]
    pub start_date: Option<String>,
    #[serde(alias = "end_date")]
    pub end_date: Option<String>,
    pub notes: Option<String>,
    pub rules: Option<Vec<CreatePlanRulePayload>>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatePlanRulePayload {
    #[serde(alias = "rule_type")]
    pub rule_type: String,
    pub operator: Option<String>,
    pub value: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdatePlanPayload {
    pub id: i64,
    #[serde(alias = "asset_id")]
    pub asset_id: i64,
    #[serde(alias = "plan_type")]
    pub plan_type: String,
    pub status: String,
    #[serde(alias = "position_percent")]
    pub position_percent: Option<i32>,
    #[serde(alias = "start_date")]
    pub start_date: Option<String>,
    #[serde(alias = "end_date")]
    pub end_date: Option<String>,
    pub notes: Option<String>,
    pub rules: Option<Vec<CreatePlanRulePayload>>,
}
