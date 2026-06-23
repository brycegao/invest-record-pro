# 共享错误处理工具抽取 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 34 份重复的错误处理工具定义(22 个 `getErrorMessage` + 12 个 `createServiceError`/`createRepositoryError`)抽取到单一共享模块 `src/shared/utils/error.ts`,统一行为,消除复制粘贴导致的不一致隐患。

**Architecture:** 新建 `src/shared/utils/error.ts`,导出 `getErrorMessage(error, fallback='未知错误')` 和 `createServiceError(message, cause)` 两个函数(行为采用现有 2-arg 严谨版)。分 4 批迁移调用点(共享模块 → repository → service → store → 清理),每批删除本地定义、改 import,跑 `npm run check && npm run test` 验证后独立提交。repository 层的 `createRepositoryError` 统一改名为 `createServiceError`(实现相同)。

**Tech Stack:** TypeScript, Vitest, ESLint, vue-tsc。

**基线:** 本分支 `refactor/shared-error-utils` 基于 `fix/ci-quality-gates-and-main-fixes`(已含 P0 的 lint 修复 + CI workflow),起始 `npm run check` 全绿、`npm run test` 153 passed。

---

## File Structure

| 文件 | 操作 | 职责 |
|------|------|------|
| `src/shared/utils/error.ts` | 新建 | 共享 `getErrorMessage` + `createServiceError` |
| `src/shared/utils/error.test.ts` | 新建 | 单元测试 |
| `src/features/{advisor,plans,market-observations,trades,positions,assets,reviews}/repository.ts` | 修改(7 个) | 删本地定义,import 共享,`createRepositoryError`→`createServiceError` |
| `src/services/{ollama,position-calculation,trade-query,dashboard-aggregation,monthly-aggregation}.service.ts` | 修改(5 个) | 删本地定义,import 共享 |
| `src/features/{settings,advisor,plans,market-observations,trades,dashboard,positions,monthly-reports,assets,reviews}/store.ts` | 修改(9 个) | 删本地 `getErrorMessage`,import 共享 |

---

## Task 1: 新建共享错误工具 + 单测(TDD)

**Files:**
- Create: `src/shared/utils/error.ts`
- Create: `src/shared/utils/error.test.ts`

- [ ] **Step 1: 先写失败的测试**

创建 `src/shared/utils/error.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { createServiceError, getErrorMessage } from './error'

describe('getErrorMessage', () => {
  it('返回 Error 实例的 message', () => {
    expect(getErrorMessage(new Error('boom'))).toBe('boom')
  })

  it('Error.message 为空字符串时用 fallback', () => {
    expect(getErrorMessage(new Error(''), '兜底')).toBe('兜底')
  })

  it('非空字符串原样返回', () => {
    expect(getErrorMessage('网络错误')).toBe('网络错误')
  })

  it('空字符串用 fallback', () => {
    expect(getErrorMessage('', '兜底')).toBe('兜底')
  })

  it('其他类型用默认 fallback 未知错误', () => {
    expect(getErrorMessage(42)).toBe('未知错误')
    expect(getErrorMessage(null)).toBe('未知错误')
    expect(getErrorMessage(undefined)).toBe('未知错误')
    expect(getErrorMessage({ a: 1 })).toBe('未知错误')
  })

  it('显式 fallback 优先于默认', () => {
    expect(getErrorMessage(42, '自定义')).toBe('自定义')
  })
})

describe('createServiceError', () => {
  it('消息格式为 message: cause,且带 cause 属性', () => {
    const cause = new Error('连接超时')
    const err = createServiceError('获取行情失败', cause)
    expect(err.message).toBe('获取行情失败: 连接超时')
    expect((err as Error & { cause: unknown }).cause).toBe(cause)
  })

  it('cause 为非 Error 时经 getErrorMessage 提取', () => {
    const err = createServiceError('操作失败', '字符串原因')
    expect(err.message).toBe('操作失败: 字符串原因')
  })
})
```

- [ ] **Step 2: 运行测试,确认失败(模块不存在)**

Run: `npx vitest run src/shared/utils/error.test.ts`
Expected: FAIL,`Failed to resolve import "./error"` 或类似。

- [ ] **Step 3: 实现共享模块**

创建 `src/shared/utils/error.ts`:

```ts
/**
 * 从 unknown 错误中提取人类可读的消息。
 * - Error 实例且 message 非空 → 返回 message
 * - 非空字符串 → 返回该字符串
 * - 其他 → 返回 fallback(默认 '未知错误')
 */
export function getErrorMessage(error: unknown, fallback = '未知错误'): string {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === 'string' && error) return error
  return fallback
}

/**
 * 构造带 cause 的服务错误,消息格式为 `${message}: ${getErrorMessage(cause)}`。
 */
export function createServiceError(message: string, cause: unknown): Error {
  return Object.assign(new Error(`${message}: ${getErrorMessage(cause)}`), { cause })
}
```

- [ ] **Step 4: 运行测试,确认通过**

Run: `npx vitest run src/shared/utils/error.test.ts`
Expected: PASS,所有用例通过(约 8 个)。

- [ ] **Step 5: 确认全量门禁仍绿**

Run: `npm run check && npm run test`
Expected: 全绿(单测数从 153 增至约 161,error.test.ts 新增 8 个)。

- [ ] **Step 6: Commit**

```bash
git add src/shared/utils/error.ts src/shared/utils/error.test.ts
git commit -m "feat(shared): add shared error utils with tests

新增 src/shared/utils/error.ts,导出统一的 getErrorMessage(error, fallback='未知错误')
和 createServiceError(message, cause)。为后续消除 34 份重复定义做准备。"
```

---

## Task 2: 迁移 7 个 repository 文件

**Files:**
- Modify: `src/features/advisor/repository.ts`
- Modify: `src/features/plans/repository.ts`
- Modify: `src/features/market-observations/repository.ts`
- Modify: `src/features/trades/repository.ts`
- Modify: `src/features/positions/repository.ts`
- Modify: `src/features/assets/repository.ts`
- Modify: `src/features/reviews/repository.ts`

**统一手法(每个 repository 相同):**
1. 在 import 区(紧接 `@/domain/types` 之后)加:`import { createRepositoryError as createServiceError, getErrorMessage } from '@/shared/utils/error'` —— **注意:repository 调用点用 `createRepositoryError`,但共享模块导出的是 `createServiceError`,用 `as` 别名保持调用点不变**(减少改动面)。
2. 删除本地的 `function getErrorMessage(...)` 和 `function createRepositoryError(...)` 整块。

**示例(advisor/repository.ts):**

- [ ] **Step 1: 改 advisor/repository.ts**

在 `} from '@/domain/types'` 之后加一行:

```ts
import { createServiceError as createRepositoryError, getErrorMessage } from '@/shared/utils/error'
```

删除第 17-25 行(两个本地函数定义):

```ts
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return '未知错误'
}

function createRepositoryError(message: string, cause: unknown): Error {
  return Object.assign(new Error(`${message}: ${getErrorMessage(cause)}`), { cause })
}
```

(调用点 `throw createRepositoryError(...)` 保持不变,因 import 用了 `as`。)

- [ ] **Step 2: 对其余 6 个 repository 重复 Step 1 的两步操作**

文件:`plans/market-observations/trades/positions/assets/reviews` 的 `repository.ts`。每个文件:
- 加 import 行(同上,放在 `@/domain/types` import 之后)
- 删除本地 `getErrorMessage` + `createRepositoryError` 两个函数定义

(各文件这两个函数的实现略有格式差异——有的带换行有的不带——但逻辑相同,整块删除即可。)

- [ ] **Step 3: 验证 type-check + lint**

Run: `npm run check`
Expected: 全绿(若某个 repository 的本地 `getErrorMessage` 被别处调用导致 unused import,lint 会报;若调用点改了名导致找不到,type-check 会报——逐个修正)。

- [ ] **Step 4: 验证单测**

Run: `npm run test`
Expected: 全绿(数量不变,约 161)。

- [ ] **Step 5: 确认无残留**

Run: `grep -rn "function getErrorMessage\|function createRepositoryError" src/features/*/repository.ts`
Expected: 无输出。

- [ ] **Step 6: Commit**

```bash
git add src/features/*/repository.ts
git commit -m "refactor(repository): use shared error utils in 7 repositories

advisor/plans/market-observations/trades/positions/assets/reviews 的
repository.ts 改用 @/shared/utils/error,删除本地 getErrorMessage
和 createRepositoryError 定义(共 14 份)。createRepositoryError 通过
import as 别名保持调用点不变。"
```

---

## Task 3: 迁移 5 个 service 文件

**Files:**
- Modify: `src/services/ollama.service.ts`
- Modify: `src/services/position-calculation.service.ts`
- Modify: `src/services/trade-query.service.ts`
- Modify: `src/services/dashboard-aggregation.service.ts`
- Modify: `src/services/monthly-aggregation.service.ts`

**统一手法(每个 service 相同):**
1. 在 import 区加:`import { createServiceError, getErrorMessage } from '@/shared/utils/error'`(service 调用点本就用 `createServiceError`,无需别名)。
2. 删除本地 `function getErrorMessage(...)` 和 `function createServiceError(...)` 整块。

**注意:** `ollama.service.ts` 的本地 `getErrorMessage` 是 **2-arg 签名**(带 fallback),其余 4 个是 1-arg。统一后行为一致(2-arg 是超集),调用点不变。

- [ ] **Step 1: 改 5 个 service 文件**

对每个 `src/services/*.service.ts`:
- 加 import 行(放在现有 import 之后)
- 删除本地 `getErrorMessage` + `createServiceError` 两个函数定义

(各文件这两个函数的位置和格式略异,整块删除即可。)

- [ ] **Step 2: 验证 type-check + lint**

Run: `npm run check`
Expected: 全绿。

- [ ] **Step 3: 验证单测**

Run: `npm run test`
Expected: 全绿。

- [ ] **Step 4: 确认无残留**

Run: `grep -rn "function getErrorMessage\|function createServiceError" src/services/`
Expected: 无输出。

- [ ] **Step 5: Commit**

```bash
git add src/services/*.service.ts
git commit -m "refactor(services): use shared error utils in 5 services

ollama/position-calculation/trade-query/dashboard-aggregation/monthly-aggregation
的 service.ts 改用 @/shared/utils/error,删除本地 getErrorMessage
和 createServiceError 定义(共 10 份)。"
```

---

## Task 4: 迁移 9 个 store 文件

**Files:**
- Modify: `src/features/settings/store.ts`
- Modify: `src/features/advisor/store.ts`
- Modify: `src/features/plans/store.ts`
- Modify: `src/features/market-observations/store.ts`
- Modify: `src/features/trades/store.ts`
- Modify: `src/features/dashboard/store.ts`
- Modify: `src/features/positions/store.ts`
- Modify: `src/features/monthly-reports/store.ts`
- Modify: `src/features/assets/store.ts`
- Modify: `src/features/reviews/store.ts`

**注意:** 实际是 10 个 store(grep 显示 settings/advisor/plans/market-observations/trades/dashboard/positions/monthly-reports/assets/reviews)。

**统一手法(每个 store 相同):**
1. 在 import 区加:`import { getErrorMessage } from '@/shared/utils/error'`(store 只用 `getErrorMessage`,不用 createServiceError)。
2. 删除本地 `function getErrorMessage(error: unknown, fallback: string): string {...}` 整块。

store 的调用点都是 `error.value = getErrorMessage(err, '消息')` 形式,签名完全匹配共享版本,无需改动。

**特殊:** `monthly-reports/store.ts` 还有本地 `createServiceError` 定义,一并删除并 import。

- [ ] **Step 1: 改 10 个 store 文件**

对每个 `src/features/*/store.ts`:
- 加 `import { getErrorMessage } from '@/shared/utils/error'`(放在现有 import 之后)
- 删除本地 `function getErrorMessage(...) {...}` 整块

对 `monthly-reports/store.ts` 额外:
- import 改为 `import { createServiceError, getErrorMessage } from '@/shared/utils/error'`
- 删除本地 `function createServiceError(...) {...}` 整块

- [ ] **Step 2: 验证 type-check + lint**

Run: `npm run check`
Expected: 全绿。

- [ ] **Step 3: 验证单测**

Run: `npm run test`
Expected: 全绿。

- [ ] **Step 4: 确认全库无残留**

Run: `grep -rn "function getErrorMessage\|function createServiceError\|function createRepositoryError" src/`
Expected: 无输出(34 份本地定义全部消除)。

- [ ] **Step 5: Commit**

```bash
git add src/features/*/store.ts
git commit -m "refactor(stores): use shared error utils in 10 stores

settings/advisor/plans/market-observations/trades/dashboard/positions/
monthly-reports/assets/reviews 的 store.ts 改用 @/shared/utils/error,
删除本地 getErrorMessage 定义(共 10 份,monthly-reports 另含
createServiceError 1 份)。至此 34 份重复定义全部消除。"
```

---

## Task 5: 最终验证 + 推送

**Files:** 无(纯验证)

- [ ] **Step 1: 全量门禁**

Run: `npm run check`
Expected: 全绿。

- [ ] **Step 2: 全量单测**

Run: `npm run test 2>&1 | tail -5`
Expected: 全绿,单测数约 161(原 153 + error.test.ts 约 8)。

- [ ] **Step 3: 确认零残留(成功标准 1)**

Run: `grep -rn "function getErrorMessage\|function createServiceError\|function createRepositoryError" src/ | wc -l`
Expected: `0`。

- [ ] **Step 4: 确认 import 统一(成功标准辅助)**

Run: `grep -rn "from '@/shared/utils/error'" src/ | wc -l`
Expected: 约 22(每个迁移文件 1 行 import)。

- [ ] **Step 5: 推送分支**

Run: `git push -u fork refactor/shared-error-utils`

- [ ] **Step 6: 创建 PR**

从 `RainGodPRC:refactor/shared-error-utils` 向 `brycegao:main` 提 PR。PR body 说明:消除 34 份重复,统一行为,依赖 PR #5 的 CI workflow 验证。

---

## 完成判据(Success Criteria)

1. `grep -rn "function getErrorMessage\|function createServiceError\|function createRepositoryError" src/` → 0 匹配。
2. `npm run check` 全绿。
3. `npm run test` 全绿,含新增 `error.test.ts`。
4. 4 个迁移 commit(Task 2/3/4 各一)+ Task 1 的工具 commit,每个可单独 revert。
5. 行为变化仅为"原 1-arg 返回空字符串 → 返回 '未知错误'",无其他语义改变。
6. PR 已创建,CI workflow(若 PR #5 已合并)在 GitHub 上验证通过。

---

## 风险与回滚

- **风险极低**:纯删除重复 + 改 import。唯一行为变化是空消息 → '未知错误'(改进)。
- **repository 别名策略**:`createRepositoryError as createRepositoryError` 这种 import 让调用点零改动,降低出错面。若 lint 报 `getErrorMessage` unused(某文件删了定义但没调用),则不 import 它。
- **回滚**:每批独立 commit,`git revert <sha>` 即可。
- **依赖 PR #5**:本分支基于 P0 分支。若 PR #5 先合并,本分支 rebase 到新 main;若 PR #5 被拒,需把 P0 的 gitignore/lint 修复 cherry-pick 过来。
