use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Review {
    pub id: i64,
    pub trade_id: i64,
    pub result: String,
    pub issue_type: Option<String>,
    pub summary: String,
    pub improve: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub trade_asset_code: Option<String>,
    pub trade_asset_name: Option<String>,
    pub trade_type: Option<String>,
    pub trade_created_at: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateReviewPayload {
    pub trade_id: i64,
    pub result: String,
    pub issue_type: Option<String>,
    pub summary: String,
    pub improve: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateReviewPayload {
    pub id: i64,
    pub trade_id: i64,
    pub result: String,
    pub issue_type: Option<String>,
    pub summary: String,
    pub improve: Option<String>,
}
