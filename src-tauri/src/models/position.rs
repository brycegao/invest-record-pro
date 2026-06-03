/*
 * @Author: brycegao
 * @Github: https://github.com/brycegao
 * @Date: 2026/06/03
 * @Description: 仓位快照数据模型
 *
 * Copyright (c) 2026 brycegao
 *
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

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
