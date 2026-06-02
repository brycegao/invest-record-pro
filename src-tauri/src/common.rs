use chrono::SecondsFormat;

pub fn now_iso() -> String {
    chrono::Utc::now().to_rfc3339_opts(SecondsFormat::Millis, true)
}

pub fn to_err_string(error: impl std::fmt::Display) -> String {
    error.to_string()
}
