-- 行情缓存 + 投顾推荐后市追踪
-- 金额/价格字段全部 INTEGER 存「分」（×100），与既有表精度约定一致

-- 日线行情缓存（按 code+date 去重，upsert）
CREATE TABLE IF NOT EXISTS price_daily (
  code TEXT NOT NULL,
  trade_date TEXT NOT NULL,
  open INTEGER NOT NULL,
  high INTEGER NOT NULL,
  low INTEGER NOT NULL,
  close INTEGER NOT NULL,
  volume REAL NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (code, trade_date)
);
CREATE INDEX IF NOT EXISTS idx_price_daily_code ON price_daily(code);
CREATE INDEX IF NOT EXISTS idx_price_daily_date ON price_daily(trade_date);

-- 投顾推荐的后市行情追踪（每条推荐一行）
-- T+N 收盘价：推荐日后第 N 个交易日的收盘价（分）
-- max/min_close + 对应天数：区间内最高/最低收盘价，及出现在第几个交易日
CREATE TABLE IF NOT EXISTS signal_tracking (
  signal_id INTEGER PRIMARY KEY,
  t1_close INTEGER,
  t3_close INTEGER,
  t5_close INTEGER,
  t10_close INTEGER,
  t20_close INTEGER,
  max_close INTEGER,
  max_close_day INTEGER,
  min_close INTEGER,
  min_close_day INTEGER,
  total_days INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (signal_id) REFERENCES advisor_signals(id) ON DELETE CASCADE
);
