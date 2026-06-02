# Batch 10a：Ollama 服务基础 + AI 集成框架

你是一个 TypeScript / Vue 3 / Rust 代码生成专家，为 invest-record-pro 项目提供高质量代码。

## 项目上下文

- 纯单机桌面应用，Tauri 2 + Vue 3 + TypeScript + Naive UI
- **纯单机架构**：AI 能力仅依赖本地 Ollama（http://localhost:11434），禁止任何远程 API 调用
- 所有模块的 Store 和 Repository 已实现

## 任务

生成 Ollama 离线 AI 集成的基础代码和 Prompt 模板服务。

## 生成文件清单

### 1. `src/services/ollama.service.ts`

Ollama 服务类（纯前端直接调用 localhost:11434）：

```ts
/**
 * Ollama 离线 AI 服务
 * 只使用本地 Ollama API，不涉及任何远程调用
 */
export class OllamaService {
  private baseUrl: string

  constructor(baseUrl: string = 'http://localhost:11434') {
    this.baseUrl = baseUrl
  }

  /**
   * 检查 Ollama 是否可用
   * GET /api/tags，超时 5 秒
   */
  async checkAvailable(): Promise<boolean>

  /**
   * 获取可用模型列表
   * GET /api/tags
   */
  async listModels(): Promise<OllamaModel[]>

  /**
   * 非流式生成
   * POST /api/generate
   */
  async generate(params: {
    model: string
    prompt: string
    system?: string
    stream?: boolean  // 默认 false
  }): Promise<OllamaResponse>

  /**
   * 更新 base URL
   */
  setBaseUrl(url: string): void
}

type OllamaModel = {
  name: string
  model: string
  modified_at: string
  size: number
}

type OllamaResponse = {
  model: string
  response: string
  done: boolean
  total_duration: number  // 纳秒
  eval_count: number
}
```

**实现要点**：
- `baseUrl` 必须校验为本机地址，仅允许：
  - `http://localhost:11434`
  - `http://127.0.0.1:11434`
  - `http://[::1]:11434`
  - 端口可由用户配置，但 hostname 必须是 localhost / 127.0.0.1 / ::1
- `setBaseUrl` 对非本机 URL 必须抛出中文错误，不允许保存或调用远程 Ollama / OpenAI / 其他云端 API。
- `checkAvailable`：使用 `AbortController` 设置 5 秒超时，请求 `GET /api/tags`
- `generate`：POST `/api/generate`，`stream: false`，设置 120 秒超时
- 错误处理：网络错误、超时、Ollama 返回错误都转为用户友好中文提示
- 导出单例：`export const ollamaService = new OllamaService()`

### 2. `src/services/prompt-template.service.ts`

AI Prompt 模板服务（不调用 AI，只负责组装 prompt）：

```ts
/**
 * AI Prompt 模板服务
 * 负责将业务数据组装为 Ollama 的 prompt
 */

/** 月度复盘 prompt */
export function buildMonthlyReviewPrompt(data: MonthlyReviewInput): {
  system: string
  prompt: string
}

type MonthlyReviewInput = {
  month: string
  tradeCount: number
  buyCount: number
  sellCount: number
  totalBuyAmount: number    // 分
  totalSellAmount: number   // 分
  realizedPnl: number      // 分
  planExecutionRate: number
  moodDistribution: Record<string, number>
  recentTrades: Array<{ code: string; type: string; amount: number; mood?: string }>
  recentPlans: Array<{ code: string; type: string; status: string }>
}

/** Prompt 版本号 */
export const PROMPT_VERSION = 'v1'
```

**月度复盘 System Prompt**：

```
你是一个投资纪律复盘助手，只根据以下投资者在 {month} 的交易记录、计划执行和情绪数据，生成简洁的月度复盘报告。

边界：
- 不提供买入、卖出、持有建议。
- 不预测行情、指数点位或个股走势。
- 不评价具体标的是否值得投资。
- 只分析执行纪律、情绪模式、规则遵守情况和复盘改进方向。

请生成以下内容（每部分 50-100 字）：
1. 执行评价：是否按计划交易？计划执行率如何？
2. 情绪分析：发现了什么情绪驱动的交易？
3. 行为模式：识别的过度交易、追涨杀跌等模式？
4. 规则改进：针对记录习惯、计划清晰度、仓位纪律的 3 个改进点

输出格式：Markdown
```

**月度复盘 User Prompt**：将 MonthlyReviewInput 中的数据格式化为结构化文本。

### 3. `src/services/monthly-aggregation.service.ts`

月度数据聚合服务（规则引擎，不依赖 AI）：

```ts
/**
 * 月度数据聚合服务
 * 纯数据聚合，不依赖 Ollama
 * 用于 Dashboard 和 Monthly Report 的统计数据
 */
export async function aggregateMonthlyData(month: string): Promise<MonthlyAggregation>

type MonthlyAggregation = {
  tradeCount: number
  buyCount: number
  sellCount: number
  totalBuyAmount: number    // 分
  totalSellAmount: number   // 分
  realizedPnl: number      // 分
  planExecutionRate: number  // ×100
  completedPlanCount: number
  totalActivePlanCount: number
  moodDistribution: Record<string, number>
  recentTrades: Array<...>
  activePlans: Array<...>
}
```

通过调用各模块的 repository 获取指定月份的数据并聚合。

### 4. `src/features/monthly-reports/store.ts`

useMonthlyReportsStore（Setup Store 风格）：

- State：reports, loading, generating, error, selectedYear
- Actions：loadReports, generateReport(month), updateReport, deleteReport, setYear
- `generateReport`：先检查 Ollama 可用性 → 可用则调 AI → 不可用则降级为规则引擎

### 5. `src/features/settings/store.ts`

useSettingsStore（Setup Store 风格）：

- State：settings (key-value map), loading, error, ollamaAvailable, ollamaUrl, ollamaModel
- Actions：loadSettings, upsertSetting, checkOllama, setOllamaUrl, setOllamaModel
- `setOllamaUrl`：必须调用与 OllamaService 相同的 localhost 校验，拒绝远程 URL。
- `checkOllama`：调用 `ollamaService.checkAvailable()`

## 代码风格

- 禁止 any 类型
- 禁止任何 fetch/axios 调用非本机 loopback 地址的 URL
- 使用 `@/` 路径别名
