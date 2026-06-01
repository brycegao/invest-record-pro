# SQLite Repository 生成模板

## 用途

生成 TypeScript repository 层，通过 Tauri 调用 Rust 后端，对 SQLite 进行 CRUD 操作。

## 使用方式

1. 复制本模板内容
2. 在"具体需求"部分填入：
   - 数据模型与表结构
   - CRUD 操作函数列表
   - 查询条件和过滤逻辑
   - 目标路径和文件名
3. 提交给 Codex

## 模板

### 系统提示
```
[使用 prompts/codex/system/system-prompt.txt]
```

### 任务描述

你需要生成一个 TypeScript repository 模块，通过 Tauri IPC 调用 Rust 后端命令，操作 SQLite 数据库。

**Repository 职责**：
- 封装数据库 CRUD 操作
- 通过 Tauri `invoke()` 调用 Rust 命令
- 处理数据序列化与反序列化
- 错误转换为友好消息
- 返回类型化的 Promise

**调用模式**：
```ts
// 前端 TypeScript
const data = await repository.getAssets()

// 调用链路
// → invoke('get_assets') 
// → Tauri 后端
// → Rust 命令处理
// → SQLite 查询
// → 返回 JSON
// → 前端反序列化
```

### 具体需求

**数据模型**（示例）：
```ts
interface Asset {
  id: number
  code: string        // 6-10 字符
  name: string        // 2-50 字符
  type: string        // ETF | 股票 | 债券
  market: string      // SH | SZ | HK | US
  riskLevel: string   // 低 | 中等 | 高
  investmentThesis: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

type AssetCreatePayload = Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>
```

**CRUD 函数**（示例）：
```ts
// 1. getAssets()
//    - Tauri 命令：get_assets
//    - 返回：Promise<Asset[]>
//    - 处理：解析日期字段

// 2. createAsset(payload: AssetCreatePayload)
//    - Tauri 命令：create_asset
//    - 参数：{ code, name, type, market, ... }
//    - 返回：Promise<Asset>
//    - 包含：新增的 id, createdAt, updatedAt

// 3. updateAsset(asset: Asset)
//    - Tauri 命令：update_asset
//    - 参数：完整的 Asset 对象
//    - 返回：Promise<Asset>
//    - 更新：updatedAt 字段

// 4. deleteAsset(id: number)
//    - Tauri 命令：delete_asset
//    - 参数：{ id }
//    - 返回：Promise<void>

// 5. queryAssets(filter?: Filter)
//    - Tauri 命令：query_assets
//    - 参数：{ type?, market?, keyword? }
//    - 返回：Promise<Asset[]>
//    - 说明：按条件过滤查询，与 getAssets（获取全部）不同，queryAssets 支持动态 WHERE 条件
//    - 适用场景：搜索框筛选、分类过滤；getAssets 适用场景：页面初始加载
```

**数据转换**：
- SQLite 的日期为 ISO 8601 string，需转为 Date 对象
- 数字字段：DECIMAL 类型需确保精度
- 枚举字段：直接返回 string，前端做类型转换

**错误处理**：
- Tauri 调用失败：捕获异常，转为 Error with message
- 数据验证失败：抛出 Error，消息为用户友好提示

**其他要求**：
- 目标路径：`src/features/[feature]/repository.ts`
- 所有函数返回 Promise<T> 或 Promise<void>
- 函数名应为动宾结构：get, create, update, delete, query
- 日期字段统一处理为 Date 对象

### 输出格式

完整的 TypeScript 代码，包括：
- 类型定义（import from types.ts）
- 日期序列化 / 反序列化辅助函数
- 各 CRUD 函数实现

## 核心特性

### 日期处理模式
```ts
// SQLite → 前端
const parseDate = (dateString: string | null): Date | null =>
  dateString ? new Date(dateString) : null

// 前端 → SQLite
const formatDate = (date: Date): string =>
  date.toISOString()
```

### 异常处理模式
```ts
try {
  const result = await invoke<Asset[]>('get_assets')
  return result.map(item => ({
    ...item,
    createdAt: parseDate(item.createdAt),
    updatedAt: parseDate(item.updatedAt)
  }))
} catch (e) {
  throw new Error(`获取资产失败: ${(e as Error).message}`)
}
```

### 类型安全
```ts
// 使用 invoke<T>() 确保返回类型
const data = await invoke<Asset[]>('command_name', { params })
```

## 示例 Prompt 完整版

```markdown
## 生成资产数据库 Repository

基于以下需求生成 TypeScript repository：

**数据模型**：Asset { id, code, name, type, market, riskLevel, investmentThesis, notes, createdAt, updatedAt }

**Tauri 命令**（由后端 Rust 提供）：
- get_assets() -> Result<Vec<Asset>, String>
- create_asset(payload) -> Result<Asset, String>
- update_asset(asset) -> Result<Asset, String>
- delete_asset(id) -> Result<(), String>

**Repository 函数**：
- async getAssets(): Promise<Asset[]>
- async createAsset(payload: AssetCreatePayload): Promise<Asset>
- async updateAsset(asset: Asset): Promise<Asset>
- async deleteAsset(id: number): Promise<void>

**特殊处理**：
- createdAt / updatedAt 为 ISO 8601 string，需转为 Date 对象
- 错误捕获，转为用户友好的中文提示

**目标路径**：src/features/assets/repository.ts

**导入**：
- import { invoke } from '@tauri-apps/api/core'
- import type { Asset, AssetCreatePayload } from './types'
```

## 常见参数

| 参数 | 说明 | 示例 |
|------|------|------|
| Tauri 调用 | IPC 命令名 | invoke('command_name', params) |
| 返回类型 | Promise 结构 | Promise<T> |
| 日期格式 | ISO 8601 | '2026-06-01T10:30:00Z' |
| 错误处理 | 异常捕获 | try-catch + 自定义提示 |
| 类型安全 | 泛型约束 | invoke<T>() |

## 后端配合（需同步）

确保 Rust 后端实现对应的 Tauri 命令：
```rust
#[command]
async fn get_assets() -> Result<Vec<Asset>, String> { ... }
```

详见 `prompts/codex/templates/rust-command.prompt.md`
