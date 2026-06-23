/*
 * @Description: 投顾推荐与复盘数据模型
 *
 * 金额字段（ref_price/target_price/stop_loss/actual_price/range_*）一律存「分」(i64)。
 * 数量字段（hypothetical_qty/actual_qty）存原始股数。
 */

use serde::{Deserialize, Serialize};

/// 投顾推荐信号（金额字段存「分」）
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AdvisorSignal {
    pub id: i64,
    pub advisor: String,
    pub asset_id: i64,
    pub direction: String,
    pub signal_at: String,
    pub ref_price: i64,
    pub target_price: Option<i64>,
    pub stop_loss: Option<i64>,
    pub hypothetical_qty: i64,
    pub note: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    // JOIN 出来的标的信息，便于前端展示
    pub asset_code: Option<String>,
    pub asset_name: Option<String>,
    pub asset_market: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateAdvisorSignalPayload {
    pub advisor: String,
    pub asset_id: i64,
    pub direction: String,
    pub signal_at: String,
    pub ref_price: i64,
    pub target_price: Option<i64>,
    pub stop_loss: Option<i64>,
    pub hypothetical_qty: i64,
    pub note: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateAdvisorSignalPayload {
    pub id: i64,
    pub advisor: String,
    pub asset_id: i64,
    pub direction: String,
    pub signal_at: String,
    pub ref_price: i64,
    pub target_price: Option<i64>,
    pub stop_loss: Option<i64>,
    pub hypothetical_qty: i64,
    pub note: Option<String>,
}

/// 跟随 + 复盘记录
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FollowUp {
    pub id: i64,
    pub signal_id: i64,
    pub followed: bool,
    pub actual_price: Option<i64>,
    pub actual_qty: Option<i64>,
    pub actual_at: Option<String>,
    pub linked_trade_id: Option<i64>,
    pub reason: Option<String>,
    pub range_high: Option<i64>,
    pub range_low: Option<i64>,
    pub range_end_close: Option<i64>,
    pub reviewed_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpsertFollowUpPayload {
    pub signal_id: i64,
    pub followed: bool,
    pub actual_price: Option<i64>,
    pub actual_qty: Option<i64>,
    pub actual_at: Option<String>,
    pub linked_trade_id: Option<i64>,
    pub reason: Option<String>,
    pub range_high: Option<i64>,
    pub range_low: Option<i64>,
    pub range_end_close: Option<i64>,
    pub reviewed_at: Option<String>,
}
