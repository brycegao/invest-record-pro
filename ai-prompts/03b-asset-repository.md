# Batch 3b：Assets 模块 — TypeScript Repository

你是一个 TypeScript / Vue 3 / Rust 代码生成专家，为 invest-record-pro 项目提供高质量代码。

## 项目上下文

- 纯单机桌面应用，Tauri 2 + Vue 3 + TypeScript
- 共享类型已定义在 `src/domain/types/` 目录（Asset, AssetCreatePayload, AssetFilter, AssetUpdatePayload 等）
- 金融数值工具函数在 `src/domain/types/financial.ts`（fenToYuan, yuanToFen 等）
- Rust 后端已实现以下 Tauri 命令：
  - `get_assets()` → `Result<Vec<Asset>, String>`
  - `create_asset(payload: CreateAssetPayload)` → `Result<Asset, String>`
  - `update_asset(payload: UpdateAssetPayload)` → `Result<Asset, String>`
  - `delete_asset(id: i64)` → `Result<(), String>`
  - `query_assets(keyword?, asset_type?, market?)` → `Result<Vec<Asset>, String>`

## 任务

生成 Assets 模块的 TypeScript Repository 层。

## 生成文件：`src/features/assets/repository.ts`

### 函数清单

```ts
/**
 * 获取所有资产
 * @returns 资产列表
 */
export async function getAssets(): Promise<Asset[]>

/**
 * 创建新资产
 * @param payload 创建载荷
 * @returns 新创建的资产（含 id, createdAt, updatedAt）
 */
export async function createAsset(payload: AssetCreatePayload): Promise<Asset>

/**
 * 更新资产
 * @param asset 完整资产对象（含 id）
 * @returns 更新后的资产
 */
export async function updateAsset(asset: AssetUpdatePayload): Promise<Asset>

/**
 * 删除资产
 * @param id 资产 ID
 */
export async function deleteAsset(id: number): Promise<void>

/**
 * 按条件查询资产
 * @param filter 过滤条件
 * @returns 匹配的资产列表
 */
export async function queryAssets(filter: AssetFilter): Promise<Asset[]>
```

### 实现模式

```ts
import { invoke } from '@tauri-apps/api/core'
import type { Asset, AssetCreatePayload, AssetUpdatePayload, AssetFilter } from '@/domain/types'

async function getAssets(): Promise<Asset[]> {
  try {
    return await invoke<Asset[]>('get_assets')
  } catch (e) {
    throw new Error(`获取资产失败: ${(e as Error).message}`)
  }
}
```

### 注意事项

- 使用 `invoke<T>()` 泛型确保返回类型安全
- 错误捕获后转为中文友好提示，抛出 Error
- `deleteAsset` 的 Tauri 命令参数名为 `id`（非对象），调用时写 `invoke('delete_asset', { id })`
- `queryAssets` 的参数需转换为 snake_case 传给 Rust（`asset_type` 而非 `assetType`）
- `createAsset` 的 payload 中 `riskLevel` 等字段也需转为 `risk_level` 等 snake_case
- createdAt/updatedAt 保持 string 不转换（前端用 dayjs 格式化显示时再转）

## 生成文件：`src/features/assets/index.ts`

模块导出桶文件：

```ts
export { getAssets, createAsset, updateAsset, deleteAsset, queryAssets } from './repository'
```

## 代码风格

- 禁止 any 类型
- 所有 export 函数必须有 JSDoc 注释
- 使用 `@/domain/types` 导入共享类型
- 使用 `@tauri-apps/api/core` 导入 invoke
