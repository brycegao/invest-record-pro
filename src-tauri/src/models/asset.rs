/*
 * @Author: brycegao
 * @Github: https://github.com/brycegao
 * @Date: 2026/06/03
 * @Description: 投资标的数据模型
 *
 * Copyright (c) 2026 brycegao
 *
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Asset {
    pub id: i64,
    pub code: String,
    pub name: String,
    #[serde(rename = "type")]
    pub asset_type: String,
    pub market: String,
    pub risk_level: i32,
    pub index_reference: Option<String>,
    pub logic: Option<String>,
    pub notes: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateAssetPayload {
    pub code: String,
    pub name: String,
    #[serde(rename = "type", alias = "asset_type")]
    pub asset_type: String,
    pub market: String,
    #[serde(alias = "risk_level")]
    pub risk_level: Option<i32>,
    #[serde(alias = "index_reference")]
    pub index_reference: Option<String>,
    pub logic: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateAssetPayload {
    pub id: i64,
    pub code: String,
    pub name: String,
    #[serde(rename = "type", alias = "asset_type")]
    pub asset_type: String,
    pub market: String,
    #[serde(alias = "risk_level")]
    pub risk_level: Option<i32>,
    #[serde(alias = "index_reference")]
    pub index_reference: Option<String>,
    pub logic: Option<String>,
    pub notes: Option<String>,
}
