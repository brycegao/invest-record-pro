# Rust 命令注册模板

## 用途

生成 Tauri 主入口文件的命令注册代码，将 Rust 命令暴露给前端。

## 模板

```markdown
## 需求

生成 Tauri 2 命令注册代码：`src-tauri/src/main.rs` 的命令注册部分

**功能**：
- 定义 `#[tauri::command]` 宏的 {Feature} 命令集合
- 与前端 Rust 命令通信接口
- 包含数据库操作、业务逻辑
- 错误处理和返回值序列化

**命令清单**：
1. `get_{feature}s` - 获取所有 {feature}
2. `create_{feature}` - 创建新 {feature}
3. `update_{feature}` - 更新 {feature}
4. `delete_{feature}` - 删除 {feature}

**要求**：
1. 使用 `#[tauri::command]` 宏
2. 输入参数和返回值使用 serde 序列化
3. 错误处理使用自定义 Result<T, String>
4. 与 `src-tauri/src/db/repositories/{feature}_repository.rs` 交互
5. 事务管理（如需要）

**参考**：
- Database: src-tauri/src/db/repositories/{feature}_repository.rs
- Models: src-tauri/src/models/{feature}.rs

**输出**：可复制到 main.rs 的完整命令定义
```

## 关键要点

### 命令结构

```rust
use serde::{Deserialize, Serialize};
use tauri::State;
use crate::db::{Database, repositories};
use crate::models::*;

#[tauri::command]
async fn get_{features}(db: State<'_, Database>) -> Result<Vec<{Feature}>, String> {
    let conn = db.get_connection()
        .map_err(|e| format!("Database error: {}", e))?;
    repositories::{feature}::{Feature}Repository::get_all(&conn)
        .map_err(|e| format!("Failed to fetch {features}: {}", e))
}

#[tauri::command]
async fn create_{feature}(
    db: State<'_, Database>,
    payload: Create{Feature}Payload,
) -> Result<{Feature}, String> {
    let conn = db.get_connection()
        .map_err(|e| format!("Database error: {}", e))?;
    repositories::{feature}::{Feature}Repository::create(&conn, payload)
        .map_err(|e| format!("Failed to create {feature}: {}", e))
}

#[tauri::command]
async fn update_{feature}(
    db: State<'_, Database>,
    id: i64,
    payload: Update{Feature}Payload,
) -> Result<{Feature}, String> {
    let conn = db.get_connection()
        .map_err(|e| format!("Database error: {}", e))?;
    repositories::{feature}::{Feature}Repository::update(&conn, id, payload)
        .map_err(|e| format!("Failed to update {feature}: {}", e))
}

#[tauri::command]
async fn delete_{feature}(
    db: State<'_, Database>,
    id: i64,
) -> Result<(), String> {
    let conn = db.get_connection()
        .map_err(|e| format!("Database error: {}", e))?;
    repositories::{feature}::{Feature}Repository::delete(&conn, id)
        .map_err(|e| format!("Failed to delete {feature}: {}", e))
}
```

### 在 main.rs 中注册

```rust
fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_{features},
            create_{feature},
            update_{feature},
            delete_{feature},
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 错误处理

- 使用 `Result<T, String>` 类型，统一错误为 String
- 数据库错误、业务逻辑错误都转换为字符串消息
- 前端会在 catch 中接收错误消息

### 与前端通信

前端调用示例（使用 `tauri` crate）：

```typescript
import { invoke } from '@tauri-apps/api/core'

const assets = await invoke('get_assets')
const newAsset = await invoke('create_asset', { payload })
await invoke('update_asset', { id, payload })
await invoke('delete_asset', { id })
```

## 示例需求

```
需求

生成 Tauri 2 命令注册代码，将资产 CRUD 操作暴露给前端

**命令清单**：
1. get_assets - 返回 Vec<Asset>
2. create_asset - 接收 CreateAssetPayload，返回 Asset
3. update_asset - 接收 id 和 UpdateAssetPayload，返回 Asset
4. delete_asset - 接收 id，返回 ()

**参考**：
- Models: src-tauri/src/models/asset.rs
- Repository: src-tauri/src/db/repositories/asset_repository.rs

**输出**：可复制到 main.rs 的完整命令代码 + invoke_handler 注册示例
```

## 参数替换

| 占位符 | 说明 | 示例 |
|--------|------|------|
| `{Feature}` | 功能模块名（首字母大写）| Asset, Plan, Trade |
| `{feature}` | 功能模块名（小写）| asset, plan, trade |
| `{features}` | 功能模块复数形式 | assets, plans, trades |
| `Create{Feature}Payload` | 创建负载类型 | CreateAssetPayload |
| `Update{Feature}Payload` | 更新负载类型 | UpdateAssetPayload |

## 注意事项

- **异步处理**：使用 `async fn` 和 `await`
- **状态注入**：`State<'_, Database>` 从 Tauri 容器中自动注入
- **错误映射**：使用 `.map_err()` 将 Rust 错误转换为字符串
- **类型序列化**：确保所有返回类型都实现了 `Serialize`
- **命名一致**：前端调用的命令名必须与这里定义的函数名一致

## 性能优化

### 批量操作

如果需要高效处理大量数据，可以添加批量命令：

```rust
#[tauri::command]
async fn batch_create_{features}(
    db: State<'_, Database>,
    payloads: Vec<Create{Feature}Payload>,
) -> Result<Vec<{Feature}>, String> {
    let conn = db.get_connection()?;
    let mut results = Vec::new();
    for payload in payloads {
        let item = repositories::{feature}::{Feature}Repository::create(&conn, payload)?;
        results.push(item);
    }
    Ok(results)
}
```

### 分页查询

```rust
#[tauri::command]
async fn get_{features}_page(
    db: State<'_, Database>,
    offset: i64,
    limit: i64,
) -> Result<({features}Page), String> {
    let conn = db.get_connection()?;
    repositories::{feature}::{Feature}Repository::get_page(&conn, offset, limit)
}
```

## 常见问题

**Q: 如何处理事务？**

A: 在命令中使用 SQLite 事务：

```rust
#[tauri::command]
async fn complex_operation(db: State<'_, Database>) -> Result<(), String> {
    let conn = db.get_connection()?;
    conn.execute("BEGIN TRANSACTION")?;
    
    // 多个操作
    
    conn.execute("COMMIT")?;
    Ok(())
}
```

**Q: 如何验证输入参数？**

A: 在 Payload 类型中使用 validation crate 或手动验证：

```rust
#[tauri::command]
async fn create_asset(
    db: State<'_, Database>,
    payload: CreateAssetPayload,
) -> Result<Asset, String> {
    if payload.code.is_empty() {
        return Err("Asset code cannot be empty".to_string());
    }
    // ...
}
```

**Q: 如何返回分页结果？**

A: 定义一个 Payload 结构：

```rust
#[derive(Serialize)]
pub struct Page<T> {
    pub items: Vec<T>,
    pub total: i64,
    pub page: i64,
    pub page_size: i64,
}
```
