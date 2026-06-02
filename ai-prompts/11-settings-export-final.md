# Batch 11：Settings + 导出 + 收尾

你是一个 TypeScript / Vue 3 / Rust 代码生成专家，为 invest-record-pro 项目提供高质量代码。

## 项目上下文

- 纯单机桌面应用，Tauri 2 + Vue 3 + TypeScript + Naive UI
- 所有 8 个业务模块已完成
- Settings Store 已有基础实现
- Ollama 服务已集成
- 数据库表 `settings` 已存在

## 任务

生成 Settings 页面、导出功能、主题切换、以及项目收尾工作。

## 生成文件清单

### 1. Rust 命令：Settings

**`src-tauri/src/commands/setting_commands.rs`**

命令：

1. **get_setting(db: State, key: String) → Result<Option<String>, String>**
   - `SELECT value FROM settings WHERE key = ?`

2. **upsert_setting(db: State, key: String, value: String) → Result<(), String>**
   - INSERT OR REPLACE INTO settings(key, value, created_at, updated_at) VALUES(?, ?, ?, ?)

3. **get_all_settings(db: State) → Result<Vec<(String, Option<String>)>, String>**
   - `SELECT key, value FROM settings`

4. **get_db_path(app: AppHandle) → Result<String, String>**
   - 返回数据库文件路径

5. **backup_database(db: State, target_path: String) → Result<(), String>**
   - 使用 rusqlite 的 backup API 或直接文件复制
   - `std::fs::copy(source, target)`

6. **restore_database(app: AppHandle, source_path: String) → Result<(), String>**
   - 停止当前连接，复制文件到 db 路径
   - **危险操作**：前端已做二次确认

7. **export_assets_csv(db: State) → Result<String, String>**
   - 生成 UTF-8 BOM CSV 字符串
   - 表头：代码,名称,类型,市场,风险等级,投资逻辑,创建时间
   - BOM：`\u{FEFF}`

8. **export_trades_csv(db: State) → Result<String, String>**
   - 生成 UTF-8 BOM CSV 字符串
   - 表头：成交时间,标的,类型,价格,数量,总金额,手续费,情绪,遵守计划
   - 成交时间必须使用 `trades.trade_at`，不要使用 `created_at`

更新 main.rs 注册所有命令。

### 2. `src/features/settings/repository.ts`

```ts
export async function getSetting(key: string): Promise<string | null>
export async function upsertSetting(key: string, value: string): Promise<void>
export async function getAllSettings(): Promise<Record<string, string | null>>
export async function getDbPath(): Promise<string>
export async function backupDatabase(targetPath: string): Promise<void>
export async function restoreDatabase(sourcePath: string): Promise<void>
export async function exportAssetsCsv(): Promise<string>
export async function exportTradesCsv(): Promise<string>
```

### 3. `src/pages/settings/SettingsPage.vue`

**标题**：设置（无描述行）

**4 张独立卡片（垂直排列）**：

#### 卡片 1：数据库

```
数据库路径
/Users/xxx/Library/Application Support/invest-record-pro/data.db

[打开文件夹]  [备份数据库]  [恢复数据库]
```

- `[打开文件夹]`：调用 Tauri shell open 命令打开文件所在目录
- `[备份数据库]`：弹出文件保存选择器（`@tauri-apps/plugin-dialog` 的 save），选择路径后调用 `backupDatabase`
- `[恢复数据库]`：弹出文件选择器（`@tauri-apps/plugin-dialog` 的 open）+ `n-popconfirm` 警告"恢复将覆盖当前数据，此操作不可撤销"，确认后调用 `restoreDatabase`

#### 卡片 2：AI 设置

```
Ollama 地址
[n-input default="http://localhost:11434"]

模型名称
[n-input placeholder="如 qwen2.5:7b"]

[测试连接]

连接状态：✓ 已连接 / ✗ 未连接
```

- 地址输入框 change 时调用 `ollamaService.setBaseUrl()`
- 地址必须校验为本机地址：hostname 只允许 `localhost`、`127.0.0.1`、`::1`。拒绝任何远程 URL、HTTPS 云端 API、OpenAI API 或局域网 IP。
- 用户输入非法地址时显示错误提示，不保存到 settings 表，不调用测试连接。
- `[测试连接]`：loading 状态 → 调用 `store.checkOllama()` → 成功/失败提示

#### 卡片 3：显示设置

```
主题  [n-radio-group: 浅色 / 深色 / 跟随系统]
语言  [n-select: 简体中文(disabled) / English(disabled)]
```

v1 语言固定中文，English 灰显。

主题切换逻辑：
- 调用 `NaiveUI` 的 `useOsTheme` + `darkTheme`
- 通过 `NConfigProvider` 的 `theme` prop 切换
- 用户选择保存到 settings 表（key=theme, value=light/dark/system）

#### 卡片 4：关于

```
Invest Record Pro
版本：1.0.0
开源地址：[GitHub]
许可证：MIT
```

### 4. 导出功能集成

在各页面启用"导出"按钮：

- AssetsPage：`[导出]` → 调用 `exportAssetsCsv()` → 下载文件（通过 Tauri save dialog 选择路径）
- TradesPage：`[导出 CSV]` → 调用 `exportTradesCsv()` → 下载文件

下载方式：生成 CSV 字符串后，通过 `@tauri-apps/plugin-dialog` 弹出保存对话框，然后用 `@tauri-apps/plugin-fs` 写入文件。

### 5. 主题切换全局实现

修改 `src/app/providers/AppProvider.vue`：

```vue
<script setup lang="ts">
import { darkTheme } from 'naive-ui'
import { computed } from 'vue'
import { useSettingsStore } from '@/features/settings/store'

const settingsStore = useSettingsStore()

const theme = computed(() => {
  if (settingsStore.currentTheme === 'dark') return darkTheme
  if (settingsStore.currentTheme === 'system') return undefined  // 跟随系统
  return undefined  // light
})
</script>

<template>
  <n-config-provider :theme="theme">
    ...
  </n-config-provider>
</template>
```

### 6. 路由 Guard

在 `src/app/router/index.ts` 中添加简单的全局路由守卫（可选）：

- 当前无认证需求，跳过
- 可添加页面标题自动更新（`document.title = route.meta.title + ' | Invest Record Pro'`）

### 7. 导出文件

- `src/features/settings/index.ts`
- `src/features/settings/components/index.ts`

## Tauri 插件

导出功能需要使用 Tauri 2 插件：
- `@tauri-apps/plugin-dialog`：文件保存/打开选择器
- `@tauri-apps/plugin-fs`：文件写入
- `@tauri-apps/plugin-shell`：打开文件夹

在 `src-tauri/tauri.conf.json` 和 `Cargo.toml` 中添加对应插件依赖，在 main.rs 的 `.plugin()` 中注册。

## 代码风格

- 禁止 any 类型
- `@/` 路径别名
- 恢复数据库操作需二次确认
- 导出 CSV 使用 UTF-8 BOM 确保 Excel 正确显示中文
