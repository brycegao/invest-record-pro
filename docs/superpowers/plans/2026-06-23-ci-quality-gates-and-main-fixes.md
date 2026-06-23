# CI 质量门禁 + main 分支修复 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 main 分支止血(修掉 lint/type 错误 + 解除 `*.md` gitignore 误伤),并加一个 PR/push 触发的前端全量 CI 质量门禁,永久防止这类回归。

**Architecture:** 三条独立因果链合并成一个计划:(1) 修复 advisor 表单绑定 bug + 2 处死代码 → 让 lint/type-check 在 main 转绿;(2) 收紧 `.gitignore` 的 `*.md` 通配规则 → 让 CHANGELOG.md 等正常文档可提交;(3) 新增 `.github/workflows/ci.yml`,在 PR 和 push to main 时跑 lint + type-check + unit test + format check + cross-deps 检查。三者互相独立,但 (3) 是杠杆点,完成后 (1) 类问题不再发生。

**Tech Stack:** GitHub Actions, Node 20, npm, ESLint, vue-tsc, Vitest, Prettier, bash (cross-deps 脚本)。

---

## File Structure

| 文件 | 操作 | 职责 |
|------|------|------|
| `src/features/advisor/components/AdvisorSignalForm.vue` | 修改第 66 行 | 修复 hypotheticalQty 双向绑定断裂 |
| `src/features/positions/components/PositionDetailDrawer.vue` | 修改第 60-61 行 | 删除未使用的 ref/watch import,合并 vue import |
| `src/features/settings/store.ts` | 修改第 15、19、39 行 | 删除 3 个未使用 import/函数 |
| `.gitignore` | 修改 md 规则段 | 收紧 `*.md` 通配为具体路径,解除对 CHANGELOG 的误伤 |
| `.github/workflows/ci.yml` | 新建 | PR/push 触发的前端全量质量门禁 |

每个文件单一职责,改动互不耦合,可独立提交。

---

## Task 1: 修复 advisor 表单 hypotheticalQty 绑定 bug

**Files:**
- Modify: `src/features/advisor/components/AdvisorSignalForm.vue:66`

**背景:** 模板第 66 行绑定 `formData.hypotheticalQty`,但 `formData` ref(第 103-108 行)只含 `advisor/assetId/direction/signalAt` 四个字段,没有 `hypotheticalQty`。实际值存在独立的 `hypotheticalQty` ref(第 113 行)。`buildPayload()`(第 156 行)和 `handleReset()`(第 190 行)都正确用了独立 ref,只有模板绑错了对象,导致输入框双向绑定断裂。修复方式:把模板绑定指向已存在的独立 ref,与 buildPayload/handleReset 的现有逻辑保持一致。

- [ ] **Step 1: 修改模板绑定**

将 `src/features/advisor/components/AdvisorSignalForm.vue:66`:

```
            <NInputNumber v-model:value="formData.hypotheticalQty" :precision="0" :step="100" :min="0" placeholder="股数" />
```

改为:

```
            <NInputNumber v-model:value="hypotheticalQty" :precision="0" :step="100" :min="0" placeholder="股数" />
```

- [ ] **Step 2: 验证 type-check 通过(此文件不再报 TS2339)**

Run: `npm run type-check`
Expected: `AdvisorSignalForm.vue` 不再出现在错误输出中(其余两个文件的错误此时仍在,属正常,后续 Task 处理)。

- [ ] **Step 3: Commit**

```bash
git add src/features/advisor/components/AdvisorSignalForm.vue
git commit -m "fix(advisor): bind hypotheticalQty to its standalone ref

模板误绑 formData.hypotheticalQty(不存在该字段),导致输入框双向绑定
断裂。改为绑定独立的 hypotheticalQty ref,与 buildPayload/handleReset
的现有逻辑一致。"
```

---

## Task 2: 清理 PositionDetailDrawer.vue 未使用 import

**Files:**
- Modify: `src/features/positions/components/PositionDetailDrawer.vue:60-61`

**背景:** 第 60 行 `import { computed, ref, watch } from 'vue'` 中 `ref` 和 `watch` 未使用(只用了 `computed`);第 61 行 `import { h } from 'vue'` 是另一次 vue import。两行都来自 vue,合并成一行并只保留实际使用的 `computed` 和 `h`。

- [ ] **Step 1: 合并 vue import 并删除未使用符号**

将 `src/features/positions/components/PositionDetailDrawer.vue:60-61`:

```
import { computed, ref, watch } from 'vue'
import { h } from 'vue'
```

改为:

```
import { computed, h } from 'vue'
```

- [ ] **Step 2: 验证 lint 此文件不再报错**

Run: `npm run lint`
Expected: `PositionDetailDrawer.vue` 不再出现在错误输出中。

- [ ] **Step 3: 验证 type-check 仍通过**

Run: `npm run type-check`
Expected: 无新增错误(`computed` 和 `h` 确实在文件中被使用)。

- [ ] **Step 4: Commit**

```bash
git add src/features/positions/components/PositionDetailDrawer.vue
git commit -m "refactor(positions): remove unused vue imports in PositionDetailDrawer

清理 ref/watch 未使用 import,合并两行 vue import 为一行。"
```

---

## Task 3: 清理 settings/store.ts 未使用 import 和函数

**Files:**
- Modify: `src/features/settings/store.ts:15,19,39-44`

**背景:** 三处未使用:`Setting` 类型(第 15 行 import)、`getSetting`(第 19 行从 repository import)、`createServiceError`(第 39-44 行定义的函数)。store 实际用的是 `SettingUpsertPayload`、`ThemeOption`、`upsertSettingRepo` 等其他符号。注意:`getErrorMessage`(第 27 行)是**被使用的**,不要动。

- [ ] **Step 1: 删除未使用的 Setting 类型 import**

将 `src/features/settings/store.ts:15`:

```
import type { Setting, SettingUpsertPayload, ThemeOption } from '@/domain/types'
```

改为:

```
import type { SettingUpsertPayload, ThemeOption } from '@/domain/types'
```

- [ ] **Step 2: 删除未使用的 getSetting repo import**

将 `src/features/settings/store.ts:18-25`:

```
import {
  getSetting,
  upsertSetting as upsertSettingRepo,
  getAllSettingsFull,
  getDbPath,
  backupDatabase,
  restoreDatabase,
} from './repository'
```

改为:

```
import {
  upsertSetting as upsertSettingRepo,
  getAllSettingsFull,
  getDbPath,
  backupDatabase,
  restoreDatabase,
} from './repository'
```

- [ ] **Step 3: 删除未使用的 createServiceError 函数**

删除 `src/features/settings/store.ts:39-44` 整个函数定义:

```
function createServiceError(message: string, cause: unknown): Error {
  const msg = cause instanceof Error && cause.message ? `${message}: ${cause.message}`
    : typeof cause === 'string' && cause ? `${message}: ${cause}`
    : message
  return Object.assign(new Error(msg), { cause })
}

```

(连同其后空行一起删除,使 `// ---- Store ----` 注释与上方 `getErrorMessage` 函数之间保持一个空行。)

- [ ] **Step 4: 验证 lint 此文件不再报错**

Run: `npm run lint`
Expected: 0 errors(`settings/store.ts` 不再出现)。

- [ ] **Step 5: 验证 type-check 通过**

Run: `npm run type-check`
Expected: 0 errors(整个项目 type-check 全绿,因为 Task 1 已修了 advisor)。

- [ ] **Step 6: 验证单元测试不受影响**

Run: `npm run test`
Expected: 153 passed(删除的符号未被任何测试或运行时代码引用)。

- [ ] **Step 7: Commit**

```bash
git add src/features/settings/store.ts
git commit -m "refactor(settings): remove unused imports and createServiceError

清理未使用的 Setting 类型、getSetting、createServiceError。
getErrorMessage 保留(仍在使用)。"
```

---

## Task 4: 收紧 .gitignore 的 *.md 规则

**Files:**
- Modify: `.gitignore`

**背景:** 现有规则 `*.md` + `!README.md` 会忽略**所有** markdown 文件,导致 CHANGELOG.md(被 CI Release workflow 引用)无法提交,贡献者的文档也无法提交。需收紧为只忽略真正私密的文档目录,放行 CHANGELOG.md 和 docs/ 下的文档。

**验证基准(改前):** `git check-ignore CHANGELOG.md docs/README.md` → 两者都被忽略(CHANGELOG 被 ignore,docs/README 因历史已 tracked 不显示)。

- [ ] **Step 1: 查看当前 md 规则段**

Run: `grep -n '\.md' .gitignore`
Expected: 看到形如 `*.md` 和 `!README.md` 两行(在 "Private docs" 段)。

- [ ] **Step 2: 替换 md 规则段**

找到 `.gitignore` 末尾的:

```
# ---------- Private docs (keep only README.md in git) ----------
*.md
!README.md
```

替换为:

```
# ---------- Private docs ----------
# 只忽略真正私密的内部文档,放行 CHANGELOG / docs / 公开说明
docs/private/
*.private.md
*.internal.md
```

- [ ] **Step 3: 验证 CHANGELOG.md 不再被忽略**

Run: `git check-ignore CHANGELOG.md`
Expected: 无输出(表示未被忽略)。

- [ ] **Step 4: 验证 README.md 仍正常追踪**

Run: `git check-ignore README.md docs/README.md`
Expected: 无输出。

- [ ] **Step 5: 验证不误伤已追踪文件**

Run: `git status`
Expected: 只有 `.gitignore` 出现在改动列表,不会因为规则变化导致已追踪的 .md 文件被标记为删除。

- [ ] **Step 6: Commit**

```bash
git add .gitignore
git commit -m "chore: scope down gitignore *.md rule

\`*.md\` 通配误伤 CHANGELOG.md(被 CI Release 引用)和贡献者文档。
收紧为 docs/private/ + *.private.md + *.internal.md,
放行 CHANGELOG 和公开 docs。"
```

---

## Task 5: 新增 CI 质量门禁 workflow

**Files:**
- Create: `.github/workflows/ci.yml`

**背景:** 现有 `.github/workflows/` 只有 Release(tag 触发构建)。需加一个 PR + push to main 触发的质量门禁,跑前端全量检查:lint + type-check + unit test + format check + cross-deps。Node 20(与现有 Release workflow 对齐)。依赖 `package.json` 中已有的脚本:`lint`/`type-check`/`test`/`format:check`,以及 `scripts/check-cross-deps.sh`。

**设计决策(已与用户确认):**
- 范围:前端全量(不含 Rust clippy,不含 E2E)。
- 触发:pull_request + push to main。

- [ ] **Step 1: 创建 workflow 文件**

创建 `.github/workflows/ci.yml`,完整内容:

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

# 同一分支的新 run 取消旧的,省 CI 资源
concurrency:
  group: ci-${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  quality:
    name: Lint + Type-check + Unit tests + Format
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Format check (Prettier)
        run: npm run format:check

      - name: Lint (ESLint)
        run: npm run lint

      - name: Type-check (vue-tsc)
        run: npm run type-check

      - name: Cross-module dependency check
        run: bash scripts/check-cross-deps.sh

      - name: Unit tests (Vitest)
        run: npm run test
```

- [ ] **Step 2: 本地预演所有 CI 步骤(顺序与 workflow 一致)**

Run:
```bash
npm run format:check && npm run lint && npm run type-check && bash scripts/check-cross-deps.sh && npm run test
```
Expected: 全部成功退出(exit 0)。Task 1-3 修完后这一串应当全绿;若 format:check 失败,先单独 `npm run format` 修正再提交(但 Task 1-3 的改动应已符合 prettier 规范)。

- [ ] **Step 3: 校验 workflow 语法(本地基本检查)**

Run: `cat .github/workflows/ci.yml | head -5`
Expected: 文件头为 `name: CI` 等正确内容,无格式错乱。

(注:YAML 完整校验依赖 GitHub Actions runner,本地无 actionlint 时不强求;核心是 Step 2 的本地预演能过。)

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add frontend quality gate on PR and push to main

新增 CI workflow,在 PR 和 push to main 时跑:
format:check + lint + type-check + cross-deps + unit test。
防止 lint/type 错误进入 main(此前 main 上 check 已红)。"
```

---

## Task 6: 最终验证 + README 测试数同步

**Files:**
- Modify: `README.md`

**背景:** README 写"Vitest 单元测试(132个用例)",实际已是 153 个。趁此次修复顺带同步,避免误导。同时做一次 main 全量验证确认全部 P0 达成。

- [ ] **Step 1: 运行项目自己的全量 check 脚本**

Run: `npm run check`
Expected: 全部通过(lint + type-check + format:check + cross-deps)。

- [ ] **Step 2: 运行单元测试确认数量**

Run: `npm run test 2>&1 | tail -5`
Expected: `Tests  153 passed (153)`。

- [ ] **Step 3: 同步 README 测试数**

在 `README.md` 中找到(技术栈表格 + 快速开始两处):

```
| 单元测试 | Vitest + @vue/test-utils（132个用例） |
```

改为:

```
| 单元测试 | Vitest + @vue/test-utils（153个用例） |
```

以及:

```
npm run test             # Vitest 单元测试 (132 tests)
```

改为:

```
npm run test             # Vitest 单元测试 (153 tests)
```

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: sync unit test count 132 → 153

实际单测已增至 153 个,README 同步。"
```

---

## 完成判据(Success Criteria)

全部满足才算完成:

1. `npm run check` 在 main 上退出码 0(lint + type-check + format:check + cross-deps 全绿)。
2. `npm run test` 显示 153 passed。
3. `git check-ignore CHANGELOG.md` 无输出(不再被忽略)。
4. `.github/workflows/ci.yml` 存在且 `head -5` 显示正确 YAML 头。
5. advisor 表单模板第 66 行绑定的是 `hypotheticalQty`(独立 ref),不再是 `formData.hypotheticalQty`。
6. 每个 Task 都有独立 commit(共 6 个 commit)。
7. README 测试数显示 153。

---

## 风险与回滚

- **风险极低**:所有改动都是删除死代码、改一行绑定、改 gitignore 规则、加一个 workflow 文件。无运行时行为变更(advisor 修复反而修正了断裂的绑定)。
- **回滚**:每个 Task 独立 commit,任一 commit 出问题可单独 `git revert <sha>`。
- **CI workflow 首次运行**:push 后在 GitHub Actions 页面观察首次 run。若 `npm ci` 因 lockfile 不同步失败,本地跑 `npm install` 更新 `package-lock.json` 后单独提交。
