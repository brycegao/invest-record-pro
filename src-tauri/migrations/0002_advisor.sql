-- 投顾推荐信号（价格×100 存分，数量存原始股数）
CREATE TABLE IF NOT EXISTS advisor_signals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  advisor TEXT NOT NULL,
  asset_id INTEGER NOT NULL,
  direction TEXT NOT NULL,
  signal_at TEXT NOT NULL,
  ref_price INTEGER NOT NULL,
  target_price INTEGER,
  stop_loss INTEGER,
  hypothetical_qty INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_advisor_signals_advisor ON advisor_signals(advisor);
CREATE INDEX IF NOT EXISTS idx_advisor_signals_asset ON advisor_signals(asset_id);
CREATE INDEX IF NOT EXISTS idx_advisor_signals_signal_at ON advisor_signals(signal_at);

-- 跟随 + 复盘记录
CREATE TABLE IF NOT EXISTS follow_ups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  signal_id INTEGER NOT NULL,
  followed INTEGER NOT NULL DEFAULT 0,
  actual_price INTEGER,
  actual_qty INTEGER,
  actual_at TEXT,
  linked_trade_id INTEGER,
  reason TEXT,
  range_high INTEGER,
  range_low INTEGER,
  range_end_close INTEGER,
  reviewed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (signal_id) REFERENCES advisor_signals(id) ON DELETE CASCADE,
  FOREIGN KEY (linked_trade_id) REFERENCES trades(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_follow_ups_signal ON follow_ups(signal_id);
