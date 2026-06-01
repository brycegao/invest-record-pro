# Ollama 离线 AI 集成模板

## 用途

生成与本地 Ollama AI 运行时集成的代码，支持复盘生成、行为分析、计划检查。

## 模板

```markdown
## 需求

生成 Ollama AI 集成代码，实现离线本地 AI 功能

**功能**：
- 连接本地 Ollama 服务（http://localhost:11434）
- 生成月度复盘总结和心理分析
- 执纪律分析（是否按计划交易）
- 行为模式识别（情绪驱动的交易、过度交易等）
- 改进建议生成
- 优雅降级（当 Ollama 不可用时）

**要求**：
1. 不依赖任何云 AI 服务（OpenAI、Claude 等）
2. 只使用本地 Ollama API：http://localhost:11434
3. 用户必须手动启动 Ollama 和下载模型
4. 当 Ollama 不可用时，优雅地禁用 AI 功能
5. 保存生成的 prompt、模型、耗时等元数据

**集成点**：
- 月度报告生成（MonthlyReport）
- 交易复盘（Review）
- 投资计划检查

**输出**：完整的服务类和组件集成代码
```

## 架构设计

### 三层分离

```
Frontend (Vue 页面)
    ↓ 调用
Service Layer (OllamaService)
    ↓ HTTP 请求
Backend (Rust, 可选)
    ↓ HTTP
Local Ollama (:11434)
```

### 前端检查和状态管理

```typescript
// services/ollama.service.ts
export class OllamaService {
  // 检查 Ollama 是否可用
  async checkAvailable(): Promise<boolean>
  
  // 生成月度复盘
  async generateMonthlyReview(input): Promise<ReviewResult>
  
  // 生成情绪分析
  async analyzeEmotion(trades): Promise<EmotionAnalysis>
  
  // 检查纪律执行
  async analyzeDiscipline(trades, plans): Promise<DisciplineScore>
}

// stores/ollama.store.ts
export const useOllamaStore = defineStore('ollama', () => {
  const isAvailable = ref(false)
  const isConnecting = ref(false)
  const selectedModel = ref('mistral') // 或其他模型
  
  async function checkConnection() {
    // 定期检查连接状态
  }
})
```

### 后端 Rust 集成（可选但推荐）

```rust
// src-tauri/src/services/ollama_service.rs
use reqwest::Client;

pub struct OllamaService {
    client: Client,
    base_url: String, // "http://localhost:11434"
}

impl OllamaService {
    pub async fn generate(
        &self,
        model: &str,
        prompt: &str,
        system: Option<&str>,
    ) -> Result<String, String> {
        // 调用 Ollama API
        // POST http://localhost:11434/api/generate
    }
    
    pub async fn check_available(&self) -> bool {
        // 检查服务可用性
    }
}
```

## Ollama API 调用

### 基础调用

```javascript
const response = await fetch('http://localhost:11434/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'mistral',
    prompt: 'User prompt here',
    stream: false, // 不流式，等待完整响应
  })
})

const result = await response.json()
console.log(result.response) // 生成的文本
```

### 流式响应（可选）

```javascript
const response = await fetch('http://localhost:11434/api/generate', {
  method: 'POST',
  body: JSON.stringify({
    model: 'mistral',
    prompt: '...',
    stream: true // 逐 token 流式返回
  })
})

const reader = response.body.getReader()
while (true) {
  const { done, value } = await reader.read()
  if (done) break
  const text = new TextDecoder().decode(value)
  console.log(text) // 逐行显示生成结果
}
```

## 生成提示词示例

### 月度复盘总结

```
你是一个资深投资顾问。根据以下投资者在 {month} 的交易记录，生成简洁的月度复盘报告。

## 交易统计
- 总交易数：{total_trades}
- 盈利交易数：{profit_trades}
- 亏损交易数：{loss_trades}
- 胜率：{win_rate}%
- 月度收益：{monthly_return}%

## 部分交易记录
{trades_json}

## 月度计划
{monthly_plans}

## 市场观察
{market_observations}

请生成以下内容（每部分 50-100 字）：
1. **执行评价**：是否按计划交易？计划执行率如何？
2. **情绪分析**：发现了什么情绪驱动的交易？
3. **行为模式**：识别的过度交易、追涨杀跌等模式？
4. **改进建议**：针对下月的 3 个改进点

输出格式：Markdown
```

### 情绪分析

```
根据以下交易记录，分析投资者的情绪状态：

## 交易记录
{trades_with_emotions}

## 记录的情绪
{recorded_emotions}

分析：
1. 主要情绪驱动：
2. 影响最大的交易：
3. 情绪与结果的相关性：
4. 改善建议：
```

### 纪律检查

```
评估投资者的交易纪律执行情况：

## 计划
{plans_json}

## 实际交易
{trades_json}

## 对应关系
{plan_trade_mapping}

输出：
1. 总计划数：
2. 完全执行数：
3. 部分执行数：
4. 未执行数：
5. 偏离理由统计：
6. 纪律得分（0-100）：
7. 改进建议：
```

## 优雅降级策略

### 检查机制

```typescript
// 启动时检查
onMounted(async () => {
  const available = await ollamaService.checkAvailable()
  store.setOllamaAvailable(available)
})

// 定期检查（每 30 秒）
setInterval(() => {
  ollamaService.checkAvailable().then(available => {
    store.setOllamaAvailable(available)
  })
}, 30000)
```

### UI 反应

```vue
<!-- 如果 Ollama 不可用，隐藏或禁用 AI 相关按钮 -->
<n-button
  :disabled="!ollamaStore.isAvailable"
  :type="ollamaStore.isAvailable ? 'primary' : 'default'"
  @click="generateReview"
>
  <template #icon v-if="ollamaStore.isAvailable">
    <IconSparkles />
  </template>
  {{ ollamaStore.isAvailable ? '生成 AI 复盘' : '需要启动 Ollama' }}
</n-button>

<!-- 如果不可用，显示帮助信息 -->
<n-alert
  v-if="!ollamaStore.isAvailable"
  type="warning"
  closable
>
  需要启动本地 Ollama 以使用 AI 复盘功能。
  <a href="https://ollama.ai" target="_blank">下载 Ollama</a>
</n-alert>
```

## 数据保存

### 元数据记录

```typescript
interface AiGenerationRecord {
  id: string
  model: string
  prompt_version: string
  input_snapshot: JSON // 输入数据的快照
  output: string // 生成的文本
  generation_time_ms: number
  tokens_used: number // 如果 API 提供
  created_at: DateTime
}

// 保存到数据库
async function saveReviewRecord(record: AiGenerationRecord) {
  await invoke('create_ai_review', { record })
}
```

### 用户编辑

```typescript
// 用户可以编辑 AI 生成的内容
async function updateReview(id: string, edited_output: string) {
  await invoke('update_review', {
    id,
    output: edited_output,
    manually_edited: true
  })
}
```

## 示例需求

```
需求

生成 Ollama 离线 AI 集成，实现月度复盘报告生成

**功能**：
1. 检查本地 Ollama 服务可用性（http://localhost:11434）
2. 生成月度复盘报告（500-1000 字）
3. 包含：执行评价、情绪分析、行为模式、改进建议
4. 用户可编辑生成内容
5. 保存生成元数据（模型、耗时、输入快照等）
6. 如果 Ollama 不可用，优雅禁用 AI 功能

**前端**：
- GenerateMonthlyReportButton 组件
- OllamaStatus 组件（显示连接状态）
- ReviewEditor 组件（编辑生成内容）

**后端**（Rust）：
- OllamaService（HTTP 调用）
- generate_monthly_review 命令
- save_review_record 命令

**输出**：
1. TypeScript Service + Vue 组件
2. Rust 服务和命令
3. 数据库 schema 补充
4. 设置界面（模型选择、Ollama 地址配置）
```

## 参数替换

| 占位符 | 说明 | 示例 |
|--------|------|------|
| `{model}` | 选中的模型 | mistral, llama2, neural-chat |
| `{base_url}` | Ollama 地址 | http://localhost:11434 |
| `{timeout}` | 超时时间 | 60s, 120s（取决于模型大小）|

## 注意事项

- **完全离线**：不能有任何外部 AI API 调用
- **用户控制**：用户决定何时调用 AI，不能自动后台调用
- **资源友好**：Ollama 本地运行，确保不会过度占用 CPU/内存
- **模型灵活**：支持多种开源模型（mistral, llama2, neural-chat 等）
- **结果可验证**：保存完整输入和输出，用户可以重新生成或编辑

## 推荐的开源模型

| 模型 | 大小 | 速度 | 质量 | 推荐场景 |
|------|------|------|------|---------|
| mistral | 7B | 快 | 中等 | 轻量级，日常使用 |
| llama2 | 7B/13B | 中等 | 中等 | 通用，社区支持好 |
| neural-chat | 7B | 中等 | 中等 | 对话优化 |
| orca-2 | 7B/13B | 中等 | 较好 | 逻辑推理 |

## 常见问题

**Q: 如何让用户选择模型？**

A: 在设置界面添加模型选择：

```vue
<n-select
  v-model:value="ollamaStore.selectedModel"
  :options="availableModels"
  filterable
  @update:value="updateModel"
/>
```

**Q: 如何处理生成超时？**

A: 设置合理的超时和进度显示：

```typescript
const controller = new AbortController()
const timeoutId = setTimeout(() => controller.abort(), 120000) // 2 分钟

try {
  const result = await fetch(url, { signal: controller.signal })
} catch (e) {
  if (e.name === 'AbortError') {
    message.error('生成超时，请重试或选择更快的模型')
  }
}
```

**Q: 如何支持自定义 prompt？**

A: 允许用户编辑模板：

```typescript
// Settings 中保存自定义 prompt 模板
interface PromptTemplate {
  key: string // 'monthly_review', 'emotion_analysis' 等
  system: string
  prompt: string
  temperature: number
}

async function updateTemplate(template: PromptTemplate) {
  await invoke('save_prompt_template', { template })
}
```
