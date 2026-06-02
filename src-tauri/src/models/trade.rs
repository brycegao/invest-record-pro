use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Trade {
    pub id: i64,
    pub asset_id: i64,
    pub plan_id: Option<i64>,
    pub trade_at: String,
    pub trade_type: String,
    pub quantity: i64,
    pub price: i64,
    pub total_amount: i64,
    pub fee: i64,
    pub index_point: Option<i64>,
    pub reason: Option<String>,
    pub follow_plan: bool,
    pub mood: Option<String>,
    pub notes: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub asset_code: Option<String>,
    pub asset_name: Option<String>,
    pub plan_status: Option<String>,
    pub realized_pnl: Option<i64>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateTradePayload {
    #[serde(alias = "asset_id")]
    pub asset_id: i64,
    #[serde(alias = "plan_id")]
    pub plan_id: Option<i64>,
    #[serde(alias = "trade_at")]
    pub trade_at: String,
    #[serde(alias = "trade_type")]
    pub trade_type: String,
    pub quantity: i64,
    pub price: i64,
    #[serde(alias = "total_amount")]
    pub total_amount: i64,
    pub fee: i64,
    #[serde(alias = "index_point")]
    pub index_point: Option<i64>,
    pub reason: Option<String>,
    #[serde(alias = "follow_plan")]
    pub follow_plan: Option<bool>,
    pub mood: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateTradePayload {
    pub id: i64,
    #[serde(alias = "asset_id")]
    pub asset_id: i64,
    #[serde(alias = "plan_id")]
    pub plan_id: Option<i64>,
    #[serde(alias = "trade_at")]
    pub trade_at: String,
    #[serde(alias = "trade_type")]
    pub trade_type: String,
    pub quantity: i64,
    pub price: i64,
    #[serde(alias = "total_amount")]
    pub total_amount: i64,
    pub fee: i64,
    #[serde(alias = "index_point")]
    pub index_point: Option<i64>,
    pub reason: Option<String>,
    #[serde(alias = "follow_plan")]
    pub follow_plan: bool,
    pub mood: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TradeSummary {
    pub asset_id: i64,
    pub total_buy_quantity: i64,
    pub total_sell_quantity: i64,
    pub current_quantity: i64,
    pub avg_cost: i64,
    pub remaining_cost: i64,
    pub realized_pnl: i64,
    pub total_buy_amount: i64,
    pub total_sell_amount: i64,
}
