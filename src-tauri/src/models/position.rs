use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Position {
    pub id: i64,
    pub snapshot_at: String,
    pub cash: i64,
    pub total_assets: i64,
    pub unrealized_pnl: i64,
    pub realized_pnl: i64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PositionItem {
    pub id: i64,
    pub position_id: i64,
    pub asset_id: i64,
    pub quantity: i64,
    pub avg_cost: i64,
    pub current_price: i64,
    pub market_value: i64,
    pub unrealized_pnl: i64,
    pub created_at: String,
    pub updated_at: String,
    pub asset_code: Option<String>,
    pub asset_name: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatePositionPayload {
    pub snapshot_at: String,
    pub cash: i64,
    pub total_assets: i64,
    pub unrealized_pnl: i64,
    pub realized_pnl: i64,
    pub items: Vec<CreatePositionItemPayload>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatePositionItemPayload {
    pub asset_id: i64,
    pub quantity: i64,
    pub avg_cost: i64,
    pub current_price: i64,
    pub market_value: i64,
    pub unrealized_pnl: i64,
}
