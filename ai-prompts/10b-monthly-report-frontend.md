# Batch 10b：Monthly Reports — Rust 命令 + 前端 UI

你是一个 TypeScript / Vue 3 / Rust 代码生成专家，为 invest-record-pro 项目提供高质量代码。

## 项目上下文

- 纯单机桌面应用，Tauri 2 + Vue 3 + TypeScript + Naive UI
- 类型定义：MonthlyReport, MonthlyReportCreatePayload, MonthlyReportUpdatePayload
- Ollama 服务已实现：`src/services/ollama.service.ts`
- 月度聚合服务已实现：`src/services/monthly-aggregation.service.ts`
- Prompt 模板服务已实现：`src/services/prompt-template.service.ts`
- MonthlyReports Store 已实现：`src/features/monthly-reports/store.ts`

## 任务

生成月度报告模块的 Rust 后端命令和前端 UI。

## 生成文件清单

### 1. `src-tauri/src/models/monthly_report.rs`

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MonthlyReport {
    pub id: i64,
    pub month: String,               // YYYY-MM
    pub input_snapshot_json: String,
    pub ai_summary: String,
    pub user_edited_summary: Option<String>,
    pub model_name: Option<String>,
    pub prompt_version: Option<String>,
    pub generation_duration_ms: i64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateMonthlyReportPayload {
    pub month: String,
    pub input_snapshot_json: String,
    pub ai_summary: String,
    pub user_edited_summary: Option<String>,
    pub model_name: Option<String>,
    pub prompt_version: Option<String>,
    pub generation_duration_ms: i64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateMonthlyReportPayload {
    pub id: i64,
    pub user_edited_summary: Option<String>,
    pub ai_summary: Option<String>,
}
```

### 2. `src-tauri/src/commands/monthly_report_commands.rs`

命令：

1. **get_monthly_reports(db: State) → Result<Vec<MonthlyReport>, String>**
   - ORDER BY month DESC

2. **get_monthly_report(db: State, month: String) → Result<Option<MonthlyReport>, String>**
   - 按 month 查询

3. **create_monthly_report(db: State, payload: CreateMonthlyReportPayload) → Result<MonthlyReport, String>**
   - INSERT，month 有 UNIQUE 约束

4. **update_monthly_report(db: State, payload: UpdateMonthlyReportPayload) → Result<MonthlyReport, String>**
   - 仅更新 user_edited_summary 和 ai_summary

5. **delete_monthly_report(db: State, id: i64) → Result<(), String>**

更新 main.rs 注册命令。

### 3. `src/features/monthly-reports/repository.ts`

```ts
export async function getMonthlyReports(): Promise<MonthlyReport[]>
export async function getMonthlyReport(month: string): Promise<MonthlyReport | null>
export async function createMonthlyReport(payload: MonthlyReportCreatePayload): Promise<MonthlyReport>
export async function updateMonthlyReport(payload: MonthlyReportUpdatePayload): Promise<MonthlyReport>
export async function deleteMonthlyReport(id: number): Promise<void>
```

### 4. `src/pages/monthly-reports/MonthlyReportsPage.vue`

**页面标题**：月度报告 / AI 驱动的月度投资复盘

**操作按钮**：`[+ 生成本月报告]`

**年份筛选**：`n-select` 显示年份列表（从 reports 中提取，或默认当前年 ± 2 年）

**卡片列表（n-grid cols=1）**：

每张卡片：

```
┌──────────────────────────────────────────────────┐
│  2026 年 05 月                          [状态tag]  │
│  生成时间：2026-05-31 22:30                      │
│  模型：qwen2.5:7b  |  Prompt v1                   │
│                                                  │
│  AI 摘要预览（前 100 字）...                       │
│                                                  │
│                        [查看]  [导出]  [删除]      │
└──────────────────────────────────────────────────┘
```

状态 tag：无 ai_summary → "未生成"(info)，有 ai_summary 无 user_edited_summary → "已生成"(success)，有 user_edited_summary → "已编辑"(warning)

**空状态**：该月尚无报告 + [生成 AI 报告] 按钮

### 5. `src/features/monthly-reports/components/MonthlyReportDetailDrawer.vue`

**大抽屉 width=800px**

**一~四：统计数据区（始终显示，不依赖 AI）**

```
一、当月概况
   n-descriptions: 交易次数、买入/卖出金额

二、交易统计
   n-descriptions 两列：买入次数、卖出次数、总买入金额、总卖出金额

三、纪律执行情况
   n-descriptions + n-progress：计划执行率进度条、遵守/偏离次数

四、情绪分析
   n-tag 统计各情绪状态出现次数
```

**五~六：AI 生成区（依赖 Ollama）**

- Ollama 可用且 ai_summary 有内容 → 渲染 Markdown 文本（使用 v-html 或 markdown 渲染组件）
- Ollama 不可用 → 显示引导提示："安装 Ollama 后可自动生成 AI 分析"

**用户编辑区**：

```vue
<n-input type="textarea" rows="8" v-model:value="userEditContent" placeholder="在此补充或修改内容..." />
```

**元信息**：

```
模型：qwen2.5:7b | Prompt 版本：v1
生成耗时：12.3s
输入快照：[展开查看 JSON] / [折叠]
```

`generation_duration_ms` 显示为秒（÷1000，保留 1 位小数）。

输入快照用 `n-collapse` 折叠，展开后显示 `input_snapshot_json`（格式化 JSON）。

**底部按钮**：`[导出 Markdown]` `[保存]`

**AI 生成流程**：

用户点击 "生成 AI 报告" 按钮 →
1. 显示全屏 n-spin 遮罩 "正在生成 AI 月报..."
2. 调用 `aggregateMonthlyData(month)` 聚合数据
3. 调用 `ollamaService.checkAvailable()` 检查
4. 可用：调用 `buildMonthlyReviewPrompt` → `ollamaService.generate()` → 保存结果
5. 不可用：使用规则引擎统计数据填充一~四，五~六显示引导
6. 关闭遮罩，显示结果

超时处理：> 120s 显示 warning "AI 生成超时，已回退为统计数据月报"

### 6. 模块导出文件

## 代码风格

- 禁止 any 类型
- `@/` 路径别名
- AI 生成部分做好降级处理，不阻断用户操作
