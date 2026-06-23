# 共享错误处理工具抽取 — 设计规格

**日期:** 2026-06-23
**状态:** Draft → 待用户审查
**相关:** PR #5(ci 质量门禁)、wiki/projects/invest-record-pro-ci-quality-gates.md

## 目标

消除 `getErrorMessage`(22 份)和 `createServiceError`/`createRepositoryError`(5+ 份)的重复定义,统一错误消息提取行为,降低因行为不一致导致的隐患。

## 背景与问题

当前代码库中,错误处理工具被复制了 34 份,存在三类问题:

1. **签名不一致**:10 份 `getErrorMessage` 是 `(error: unknown): string`(1-arg,repository/service 层),12 份是 `(error: unknown, fallback: string): string`(2-arg,store 层)。
2. **行为不一致**:2-arg 版本检查 `error.message` 非空(`&& error.message`)和字符串非空(`&& error`),1-arg 版本不检查,可能返回空字符串。
3. **命名不一致**:12 个错误构造函数,repository 层叫 `createRepositoryError`(7 个),service/store 层叫 `createServiceError`(5 个),实现完全相同。

调用面:60 处 `getErrorMessage` + 57 处 `createServiceError`/`createRepositoryError`。

## 设计

### 单一超集函数 + 默认参数

**核心洞察**:`(error, fallback)` 是 `(error)` 的超集。统一成一个带默认参数的函数,所有调用点零语义退化。

新建 `src/shared/utils/error.ts`:

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

**行为统一为 2-arg 严谨版**(检查非空)。这是更安全的选择:
- 原 1-arg 调用点从"可能返回空字符串"变为"返回 '未知错误'"——属改进(空错误消息对用户无意义)。
- 原 2-arg 调用点行为完全不变。

### 测试

新建 `src/shared/utils/error.test.ts`,覆盖:
- `Error` 实例(有 message / 空 message)
- 字符串(非空 / 空字符串)
- 其他类型(number / undefined / null / object)
- `fallback` 默认值与显式传参
- `createServiceError` 的消息格式与 `cause` 属性

### 迁移策略(分批,每批独立 commit + 验证)

**批次划分**:

| 批次 | 文件 | 改动 |
|------|------|------|
| 0 | `src/shared/utils/error.ts` + `.test.ts` | 新建共享工具 + 单测 |
| 1 | 7 个 repository:`advisor/plans/market-observations/trades/positions/assets/reviews` | 删本地 `getErrorMessage`+`createRepositoryError`,改 import |
| 2 | 5 个 service:`ollama/position-calculation/trade-query/dashboard-aggregation/monthly-aggregation` | 删本地定义,改 import |
| 3 | 8 个 store:`settings/advisor/plans/market-observations/trades/dashboard/positions/monthly-reports/assets/reviews` | 删本地 `getErrorMessage`,改 import |
| 4 | 清理 | grep 确认无残留本地定义 |

每批完成后跑 `npm run check && npm run test`,通过才进下一批。

### 1-arg 调用点的处理

原 1-arg 调用点(如 `plans/repository.ts`)改为 `getErrorMessage(e)`(用默认 fallback `'未知错误'`)。少数原本无默认值、可能返回空字符串的场景,统一后返回 `'未知错误'`——这是行为修正,符合"空错误消息对用户无意义"。

## 非目标(YAGNI)

- 不改动 `createServiceError`/`createRepositoryError` 的消息格式(`${message}: ${cause}`)——现有日志/用户提示依赖这个格式。
- 不引入第三方错误处理库。
- 不重构 try/catch 结构本身,只替换工具函数。

## 成功标准

1. `grep -rn "function getErrorMessage\|function createServiceError\|function createRepositoryError" src/` → 0 匹配(无本地定义残留)。
2. `npm run check` 全绿。
3. `npm run test` 全绿,且新增 `error.test.ts` 的用例通过。
4. 每批有独立 commit,可单独 revert。
5. 行为变化仅为"原返回空字符串的场景 → 返回 '未知错误'",无其他语义改变。

## 风险与回滚

- **风险低**:纯机械替换,删除重复定义 + 改 import。唯一行为变化是空消息 → '未知错误'(改进)。
- **回滚**:每批独立 commit,任一出问题可 `git revert <sha>`。
- **CI 保护**:PR #5 的 CI workflow(待批准)会在 GitHub 上自动验证。
