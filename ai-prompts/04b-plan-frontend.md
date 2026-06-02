# Batch 4b：Plans 模块 — 前端全套（Repository + Store + UI）

你是一个 TypeScript / Vue 3 / Rust 代码生成专家，为 invest-record-pro 项目提供高质量代码。

## 项目上下文

- 纯单机桌面应用，Tauri 2 + Vue 3 + TypeScript + Naive UI
- 类型定义在 `src/domain/types/`：Plan, PlanRule, PlanCreatePayload, PlanUpdatePayload, PlanFilter, PLAN_STATUSES, PLAN_TYPES, RULE_TYPES, RULE_OPERATORS, PLAN_STATUS_LABELS, PLAN_TYPE_LABELS
- 金融工具函数在 `src/domain/types/financial.ts`：formatPercent
- Assets 模块已完整实现（参考 `src/features/assets/` 的代码风格）
- Rust 后端已实现：get_plans, create_plan, update_plan, delete_plan, update_plan_status, query_plans, get_plan_rules

## 任务

生成 Plans 模块的前端全套代码。

## 生成文件清单

### 1. `src/features/plans/repository.ts`

函数：

```ts
export async function getPlans(): Promise<Plan[]>
export async function createPlan(payload: PlanCreatePayload): Promise<Plan>
export async function updatePlan(payload: PlanUpdatePayload): Promise<Plan>
export async function deletePlan(id: number): Promise<void>
export async function updatePlanStatus(id: number, status: PlanStatus): Promise<void>
export async function queryPlans(filter: PlanFilter): Promise<Plan[]>
export async function getPlanRules(planId: number): Promise<PlanRule[]>
```

注意参数 snake_case 转换（`plan_type` → `planType` 等）。

### 2. `src/features/plans/store.ts`

usePlanStore（Setup Store 风格）：

- State：plans, loading, error, filters, currentPlanRules（当前编辑的规则列表）
- Actions：loadPlans, searchPlans, createPlan, updatePlan, deletePlan, updatePlanStatus, loadPlanRules, setFilters, clearError
- `createPlan` 和 `updatePlan` 调用后需重新加载列表
- 参考 Assets Store 的错误处理模式

### 3. `src/features/plans/components/PlanTable.vue`

表格列：

| 列 | 字段 | 对齐 | 排序 | 宽度 |
|----|------|------|------|------|
| 创建时间 | createdAt | left | ✓ | 170 |
| 标的 | 显示 asset code + name（需在 Rust 返回中包含或前端关联） | left | — | 140 |
| 类型 | planType (tag) | center | ✓ | 70 |
| 计划仓位 | positionPercent | right | — | 100 |
| 状态 | status (tag) | center | ✓ | 100 |
| 有效期 | startDate ~ endDate | center | ✓ | 200 |
| 操作 | — | center | — | 140 |

**状态 tag 配色**（n-tag type）：
- pending → `info`
- partial → `warning`
- completed → `success`
- canceled → `default`

**类型 tag 配色**：
- buy → `success`
- sell → `error`

**操作列动态显示**（根据 status）：
- pending：`[编辑]` `[作废]` `[删除]`
- partial：`[编辑]` `[删除]`（不可作废）
- completed：`[删除]`（不可编辑、不可作废）
- canceled：`[删除]`（仅可删除）

`[作废]` 调用 `store.updatePlanStatus(row.id, 'canceled')`

**positionPercent 格式化**：使用 `formatPercent(row.positionPercent)`（如 3000 → "30.0%"）

**标的列显示**：Rust query_plans 返回的 Plan 不包含 asset code/name。有两种方案：
- 方案 A：修改 Rust Plan struct 增加 `asset_code` 和 `asset_name` 字段，query 时 JOIN assets
- 方案 B：前端创建 `src/services/asset-lookup.service.ts` 提供按 ID 查找 asset 的缓存服务

**采用方案 A**：请在 Plan struct 中增加可选字段 `asset_code: Option<String>` 和 `asset_name: Option<String>`，SQL 查询时 JOIN assets 获取。

**同步更新前端 TS 类型**：在 `src/domain/types/plan.ts` 的 `Plan` 类型中增加对应的可选字段：
```ts
export type Plan = {
  // ...existing fields
  assetCode?: string | null
  assetName?: string | null
}
```

### 4. `src/features/plans/components/PlanForm.vue`

Drawer 表单组件：

- **Drawer 宽度 560px**（因含动态规则子表单）
- 标题：新增时根据 planType 显示 "新增买入计划" / "新增卖出计划"；编辑时 "编辑计划"

**表单字段**：

| 字段 | 组件 | 必填 | 备注 |
|------|------|------|------|
| assetId | n-select | 是 | 远程搜索 assets，显示 code + name |
| planType | n-select | 是 | 新增时自动填充（由父组件传入），不可修改 |
| positionPercent | n-input-number | 否 | min=0, max=100, step=1, 后缀"%" |
| startDate | n-date-picker type="date" | 否 | |
| endDate | n-date-picker type="date" | 否 | |
| notes | n-input textarea rows=3 | 否 | |

**动态规则子表单**：

表单下方有分隔线 `── 计划规则 ──`，然后是规则列表：

```vue
<n-space v-for="(rule, index) in rules" :key="index" align="center" style="margin-bottom: 8px">
  <n-select v-model:value="rule.ruleType" :options="ruleTypeOptions" placeholder="类型" style="width: 100px" />
  <n-select v-model:value="rule.operator" :options="ruleOperatorOptions" placeholder="条件" style="width: 80px" />
  <n-input v-model:value="rule.value" placeholder="值" style="width: 120px" />
  <n-button text type="error" @click="removeRule(index)">删除</n-button>
</n-space>
<n-button dashed @click="addRule">+ 添加规则</n-button>
```

规则选项：
- ruleTypeOptions：price/index/volume/time
- ruleOperatorOptions：>/</>=/<=/==

**提交时**将 rules 数组组装到 PlanCreatePayload 中。

### 5. `src/pages/plans/PlansPage.vue`

页面组件：

- 标题：交易计划 / 创建和管理你的买入/卖出计划
- 操作按钮：`[+ 新增买入计划]` `[+ 新增卖出计划]` `[导出]`
- 筛选区：标的搜索 + 计划类型 + 状态 + 日期范围 + [搜索] [重置]
- 表格：PlanTable
- 表单 Drawer：PlanForm

`[+ 新增买入计划]` 点击时传递 planType='buy' 给表单，`[+ 新增卖出计划]` 传递 planType='sell'。

### 6. 模块导出文件

- `src/features/plans/index.ts`
- `src/features/plans/components/index.ts`

## 代码风格

- 参考 `src/features/assets/` 的代码风格
- 禁止 any 类型
- 使用 `@/` 路径别名
- `<script setup lang="ts">`，CSS `scoped`
