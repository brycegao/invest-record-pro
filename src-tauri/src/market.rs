/*
 * @Description: 东财日线行情拉取 + 价格缓存 + 投顾追踪
 *
 * 数据源：东方财富 push2his 接口（免费、免 token）
 *   GET https://push2his.eastmoney.com/api/qt/stock/kline/get
 *   secid = {market}.{code}  沪市=1, 深市=0
 *   klines 每行: "日期,开盘,收盘,最高,最低,成交量,成交额,振幅"
 *
 * 价格统一存「分」(×100)，与既有表精度约定一致。
 */

use std::sync::{Arc, Mutex};

use rusqlite::{params, Connection};
use serde::Deserialize;

use crate::common::now_iso;

const EASTMONEY_KLINE_URL: &str = "https://push2his.eastmoney.com/api/qt/stock/kline/get";

/// 东财接口返回结构（仅取需要的字段）
#[derive(Debug, Deserialize)]
struct KlineResponse {
    data: Option<KlineData>,
}

#[derive(Debug, Deserialize)]
struct KlineData {
    klines: Option<Vec<String>>,
}

/// 单根日 K 线（解析后）
pub struct DailyBar {
    pub trade_date: String, // YYYY-MM-DD
    pub open: i64,          // 分
    pub close: i64,         // 分
    pub high: i64,          // 分
    pub low: i64,           // 分
    pub volume: f64,
}

/// 根据 A 股代码判断东财市场前缀（沪市=1, 深市=0）
/// 沪市：6/9 开头（600xxx、688xxx、900xxx B 股）
/// 深市：0/2/3 开头（000xxx、002xxx、300xxx）
pub fn a_share_market_prefix(code: &str) -> Option<&'static str> {
    let first = code.chars().next()?;
    match first {
        '6' | '9' => Some("1"),
        '0' | '2' | '3' => Some("0"),
        _ => None,
    }
}

/// 解析一根 kline 字符串："2026-06-18,1235.00,1215.00,1238.87,1211.22,57472,..."
fn parse_kline(line: &str) -> Option<DailyBar> {
    let parts: Vec<&str> = line.split(',').collect();
    if parts.len() < 6 {
        return None;
    }
    let to_cents = |s: &str| -> Option<i64> {
        let v: f64 = s.parse().ok()?;
        Some((v * 100.0).round() as i64)
    };
    Some(DailyBar {
        trade_date: parts[0].to_string(),
        open: to_cents(parts[1])?,
        close: to_cents(parts[2])?,
        high: to_cents(parts[3])?,
        low: to_cents(parts[4])?,
        volume: parts[5].parse().unwrap_or(0.0),
    })
}

/// 从东财拉取某 A 股代码的日线（beg/end 格式 YYYYMMDD）
pub fn fetch_a_share_daily(code: &str, beg: &str, end: &str) -> Result<Vec<DailyBar>, String> {
    let prefix = a_share_market_prefix(code).ok_or_else(|| format!("无法识别 A 股代码 {} 的市场", code))?;
    let secid = format!("{}.{}", prefix, code);
    let url = format!(
        "{}?secid={}&fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56,f57,f58&klt=101&fqt=0&beg={}&end={}&lmt=120",
        EASTMONEY_KLINE_URL, secid, beg, end
    );

    let client = reqwest::blocking::Client::builder()
        .user_agent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)")
        .timeout(std::time::Duration::from_secs(15))
        .build()
        .map_err(|e| format!("构建 HTTP 客户端失败: {e}"))?;

    let resp = client
        .get(&url)
        .send()
        .map_err(|e| format!("请求东财接口失败: {e}"))?;
    let body: KlineResponse = resp
        .json()
        .map_err(|e| format!("解析东财返回失败: {e}"))?;

    let data = body.data.ok_or_else(|| "东财返回 data 为空".to_string())?;
    let klines = data.klines.unwrap_or_default();
    Ok(klines.iter().filter_map(|s| parse_kline(s)).collect())
}

/// 把日线 upsert 到 price_daily 表
pub fn upsert_daily_bars(connection: &Connection, code: &str, bars: &[DailyBar]) -> Result<(), String> {
    let now = now_iso();
    for bar in bars {
        connection
            .execute(
                "INSERT INTO price_daily (code, trade_date, open, high, low, close, volume, updated_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
                 ON CONFLICT(code, trade_date) DO UPDATE SET
                   open=excluded.open, high=excluded.high, low=excluded.low,
                   close=excluded.close, volume=excluded.volume, updated_at=excluded.updated_at",
                params![code, bar.trade_date, bar.open, bar.high, bar.low, bar.close, bar.volume, now],
            )
            .map_err(|e| format!("写入 price_daily 失败: {e}"))?;
    }
    Ok(())
}

/// 拉取并缓存某 A 股从某日期至今的日线。返回缓存的日线数量。
pub fn refresh_and_cache_a_share(
    connection: &Connection,
    code: &str,
    beg_date_iso: &str, // YYYY-MM-DD
) -> Result<usize, String> {
    let beg = beg_date_iso.replace('-', "");
    let end = chrono::Local::now().format("%Y%m%d").to_string();
    let bars = fetch_a_share_daily(code, &beg, &end)?;
    let count = bars.len();
    upsert_daily_bars(connection, code, &bars)?;
    Ok(count)
}

/// 从 price_daily 取某代码在 [from, end]（含）的所有日线，按日期升序
pub fn query_daily_bars(
    connection: &Connection,
    code: &str,
    from_iso: &str,
    end_iso: &str,
) -> Result<Vec<DailyBar>, String> {
    let mut stmt = connection
        .prepare(
            "SELECT trade_date, open, high, low, close, volume FROM price_daily
             WHERE code = ?1 AND trade_date >= ?2 AND trade_date <= ?3
             ORDER BY trade_date ASC",
        )
        .map_err(|e| format!("查询 price_daily 失败: {e}"))?;
    let rows = stmt
        .query_map(params![code, from_iso, end_iso], |row| {
            Ok(DailyBar {
                trade_date: row.get(0)?,
                open: row.get(1)?,
                high: row.get(2)?,
                low: row.get(3)?,
                close: row.get(4)?,
                volume: row.get(5)?,
            })
        })
        .map_err(|e| format!("读取 price_daily 行失败: {e}"))?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("收集 price_daily 行失败: {e}"))
}

/// 根据 signal_at 之后的日线，计算 T+N 收盘价 + 区间最高最低，写入 signal_tracking
pub fn update_signal_tracking(
    connection: &Connection,
    signal_id: i64,
    code: &str,
    signal_at_iso: &str, // YYYY-MM-DD（取日期部分）
) -> Result<(), String> {
    // 取推荐日之后到今天的日线
    let today = chrono::Local::now().format("%Y-%m-%d").to_string();
    let bars = query_daily_bars(connection, code, signal_at_iso, &today)?;
    // 只取推荐日「之后」的（严格大于 signal_at 的日期部分）
    let signal_day = signal_at_iso.get(..10).unwrap_or(signal_at_iso);
    let after: Vec<&DailyBar> = bars.iter().filter(|b| b.trade_date.as_str() > signal_day).collect();

    if after.is_empty() {
        return Err(format!("代码 {} 在 {} 之后无可用日线", code, signal_day));
    }

    let total_days = after.len() as i64;
    let pick = |n: usize| -> Option<i64> { after.get(n - 1).map(|b| b.close) };
    let t1 = pick(1);
    let t3 = pick(3);
    let t5 = pick(5);
    let t10 = pick(10);
    let t20 = pick(20);

    // 区间最高/最低收盘价 + 出现天数（第几个交易日，从 1 起）
    let mut max_close = i64::MIN;
    let mut max_close_day = 0i64;
    let mut min_close = i64::MAX;
    let mut min_close_day = 0i64;
    for (i, b) in after.iter().enumerate() {
        let day = (i + 1) as i64;
        if b.close > max_close {
            max_close = b.close;
            max_close_day = day;
        }
        if b.close < min_close {
            min_close = b.close;
            min_close_day = day;
        }
    }

    let now = now_iso();
    connection
        .execute(
            "INSERT INTO signal_tracking
                (signal_id, t1_close, t3_close, t5_close, t10_close, t20_close,
                 max_close, max_close_day, min_close, min_close_day, total_days, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)
             ON CONFLICT(signal_id) DO UPDATE SET
                t1_close=excluded.t1_close, t3_close=excluded.t3_close,
                t5_close=excluded.t5_close, t10_close=excluded.t10_close,
                t20_close=excluded.t20_close, max_close=excluded.max_close,
                max_close_day=excluded.max_close_day, min_close=excluded.min_close,
                min_close_day=excluded.min_close_day, total_days=excluded.total_days,
                updated_at=excluded.updated_at",
            params![
                signal_id, t1, t3, t5, t10, t20,
                max_close, max_close_day, min_close, min_close_day, total_days, now
            ],
        )
        .map_err(|e| format!("写入 signal_tracking 失败: {e}"))?;
    Ok(())
}

/// 供命令层使用的 DB 句柄别名
#[allow(dead_code)]
pub type DbRef<'a> = &'a Arc<Mutex<Connection>>;
