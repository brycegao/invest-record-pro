/*
 * @Author: brycegao
 * @Github: https://github.com/brycegao
 * @Date: 2026/06/03
 * @Description: 市场观察数据模型
 *
 * Copyright (c) 2026 brycegao
 *
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MarketObservation {
    pub id: i64,
    pub observe_at: String,
    pub shanghai_index: Option<i64>,
    pub sse_50_index: Option<i64>,
    pub csi_300_index: Option<i64>,
    pub market_turnover: Option<i64>,
    pub sentiment: Option<String>,
    pub policy_event: Option<String>,
    pub macro_note: Option<String>,
    pub personal_view: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateMarketObservationPayload {
    pub observe_at: String,
    pub shanghai_index: Option<i64>,
    pub sse_50_index: Option<i64>,
    pub csi_300_index: Option<i64>,
    pub market_turnover: Option<i64>,
    pub sentiment: Option<String>,
    pub policy_event: Option<String>,
    pub macro_note: Option<String>,
    pub personal_view: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateMarketObservationPayload {
    pub id: i64,
    pub observe_at: String,
    pub shanghai_index: Option<i64>,
    pub sse_50_index: Option<i64>,
    pub csi_300_index: Option<i64>,
    pub market_turnover: Option<i64>,
    pub sentiment: Option<String>,
    pub policy_event: Option<String>,
    pub macro_note: Option<String>,
    pub personal_view: Option<String>,
}
