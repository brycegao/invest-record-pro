# invest-record-pro v1 UI 交互规范

版本：v1.0.0
框架：Naive UI + Vue 3 + TypeScript
平台：桌面端，建议最小宽度 1024px，推荐 1280px
风格：极简、工具类、浅色优先、数据密度高

---

## 全局约定

### 交互铁律

1. 所有新增/编辑操作使用右侧抽屉（Drawer），不使用弹窗（Modal）
2. 金额、价格、数量字段右对齐；正数绿色，负数红色
3. 全局使用浅色卡片 + 深色分隔线 + 紧凑密度（`size="small"`）
4. 表单有修改时，Drawer 禁止 ESC / mask 关闭（防误操作）；空表单允许 ESC 关闭
5. 所有列表页面默认启用 loading 骨架屏（`n-data-table` loading 状态 + `n-skeleton`）
6. 表格预留选择列（`type: "selection"`），默认关闭，仅在批量操作（导出/删除）场景中启用
7. v1 导出统一使用 UTF-8 BOM CSV 格式
8. 筛选区「重置」按钮：点击 → 清空所有条件 → 自动执行搜索刷新列表

### Naive UI 组件映射

| 用途 | 组件 | 备注 |
|------|------|------|
| 表格 | `n-data-table` | 默认排序、搜索、分页、紧凑模式 |
| 新增/编辑表单 | `n-drawer` + `n-form` | 右侧滑出，宽度 520px |
| 筛选区 | `n-form` inline | 紧凑布局，一行放完 |
| 顶部操作按钮 | `n-button` | 主操作 `type="primary"`，次操作 `type="default"` |
| 状态标签 | `n-tag` | 不同状态不同颜色（见下方配色表） |
| 日期选择 | `n-date-picker` | `type="date"` 或 `type="daterange"` |
| 月份选择 | `n-date-picker` | `type="month"` |
| 下拉选择 | `n-select` | 紧凑尺寸 |
| 数值输入 | `n-input-number` | 设置 `step`、`min`、`precision` |
| 确认操作 | `n-popconfirm` | 删除、重置等危险操作 |
| 加载状态 | `n-spin` | 数据加载和 AI 生成时使用 |
| 空状态 | `n-empty` | 表格和列表无数据时 |
| 消息反馈 | `n-message` | 操作成功/失败提示 |
| 图表 | ECharts | 仓位饼图、盈亏折线图 |
| 页面容器 | `n-card` | 每个页面内容区用卡片包裹 |

### 通用状态配色（n-tag）

| 状态 | 类型 | color |
|------|------|-------|
| 待执行 pending | `info` | — |
| 部分执行 partial | `warning` | — |
| 已完成 completed | `success` | — |
| 已作废 canceled | `default` | — |
| 已生成 | `success` | — |
| 未生成 | `info` | — |
| 已编辑 | `warning` | — |
| 买入 | `success` | — |
| 卖出 | `error` | — |

### 通用表格规则

- 默认启用排序（`sortable: true`），日期和金额列必须支持
- 默认分页（`pagination: { pageSize: 20 }`）
- 默认远程搜索（`filter: false`，搜索走 service 层）
- 预留选择列（`type: "selection"`），默认关闭，批量操作时启用
- 默认启用 loading 状态（`loading` prop），数据加载时显示骨架屏
- 金额列格式：千分位 + 2 位小数，右对齐
- 百分比列格式：1 位小数 + `%`，右对齐
- 无数据时显示 `n-empty` 组件，提供「新增」引导按钮

### 通用表单规则

- 标记 `*` 为必填字段
- 提交前校验，错误字段高亮并显示 `n-form-item` 提示
- 提交成功后自动关闭抽屉 + 刷新列表
- 取消不保存，无需二次确认
- 抽屉标题：新增时「新增 XXX」，编辑时「编辑 XXX」

### Drawer 防误关闭规则

- 属性配置：`:mask-closable="false"` `:close-on-esc="false"`
- 表单有修改（dirty）→ ESC 不关闭、点击遮罩不关闭
- 空表单（未修改）→ 允许 ESC 关闭
- 实现：监听表单 `dirty` 状态，动态设置 drawer 的 closable

### 金额显示规则

```
正数：+12,345.67（绿色）
负数：-12,345.67（红色）
零值：0.00（灰色）
```

所有显示值从分转元：`value / 100`，使用统一的格式化工具函数。

---

## 全局布局

```
┌──────────────────────────────────────────────────┐
│ 顶部导航栏（48px，n-layout-header）              │
│   左：Logo 图标 + "Invest Record Pro"            │
│   右：主题切换(n-switch) / 备份按钮 / 关于按钮    │
├────────────┬─────────────────────────────────────┤
│ 左侧导航   │ 右侧主内容区                         │
│ 固定 220px │                                     │
│ n-menu     │   页面标题 + 一行描述                  │
│            │   操作按钮行                         │
│            │   筛选区                             │
│ 仪表盘     │   表格 / 图表 / 内容                  │
│ 投资标的   │                                     │
│ 交易计划   │                                     │
│ 交易记录   │                                     │
│ 仓位快照   │                                     │
│ 交易复盘   │                                     │
│ 市场 观 察 │                                     │
│ 月度报告   │                                     │
│ 设置       │                                     │
└────────────┴─────────────────────────────────────┘
```

**组件**：`n-layout` + `n-layout-header` + `n-layout-sider` + `n-layout-content`

**导航菜单**：使用 `n-menu`，当前页面高亮，支持键盘上下切换。

---

## 0. 仪表盘（Dashboard）

### 页面标题
```
投资仪表盘
```
无描述行。

### 筛选区
```
年月选择器：[n-date-picker type="month"]  快速切换统计周期
```

### 上部：4 张统计卡片（一行等宽，n-grid cols=4）

| 卡片 | 数据 | 格式 |
|------|------|------|
| 累计已实现盈亏 | 红或绿 | ±¥xx,xxx.xx |
| 浮动盈亏 | 红或绿 | ±¥xx,xxx.xx |
| 持仓标的数 | 深色 | x 个 |
| 计划执行率 | 深色 | xx.x% |

**组件**：`n-statistic`，外层用 `n-card`，卡片内上方小字标签 + 下方大数字。

### 中部：2 张图表（一行等宽，n-grid cols=2）

| 图表 | 类型 | 数据 |
|------|------|------|
| 近 6 个月盈亏趋势 | ECharts 折线图 | 已实现 + 未实现，双线 |
| 当前仓位分布 | ECharts 饼图 | 现金 / 股票 / ETF / 基金 |

图表卡片高度固定 280px。

### 底部：2 张列表（一行等宽，n-grid cols=2）

| 列表 | 内容 | 操作 |
|------|------|------|
| 最近 10 条交易记录 | 简化表格：时间、标的、类型、金额、盈亏 | 点击跳转交易详情 |
| 最近 5 条活跃计划 | 简化表格：标的、类型、状态、到期日 | 点击跳转计划详情 |

列表使用 `n-data-table`，无分页，只展示最近数据。

### 空状态

全部数据为空时，Dashboard 显示引导提示：
```
欢迎使用 Invest Record Pro
开始第一步：创建你的第一个投资标的 → [新增标的]
```

---

## 1. 投资标的（Assets）

### 页面标题
```
投资标的
管理你关注和持有的投资标的
```

### 操作按钮行
```
[+ 新增标的]  [导出]
```

### 筛选区（inline 表单，一行）
```
代码/名称 [n-input placeholder="搜索代码或名称"]
类型      [n-select: 全部 / 股票 / ETF / 基金 / 指数 / 债券]
市场      [n-select: 全部 / CN / HK / US]
[搜索]   [重置]
```

### 表格列定义

| 列 | 字段 | 对齐 | 排序 | 宽度 |
|----|------|------|------|------|
| 代码 | code | left | ✓ | 100 |
| 名称 | name | left | ✓ | 150 |
| 类型 | type (tag) | center | ✓ | 80 |
| 市场 | market (tag) | center | ✓ | 80 |
| 风险等级 | risk_level | center | ✓ | 90 |
| 持仓状态 | 计算字段 | center | — | 100 |

**持仓状态计算规则**：
- `持仓中`：当前持有数量 > 0（有关联交易且买入数量 > 卖出数量）
- `空仓`：曾经交易过，当前持仓 = 0（有关联交易但买入数量 = 卖出数量）
- `未交易`：从未产生任何交易记录

**持仓状态 tag 颜色**：持仓中=success, 空仓=default, 未交易=info
| 创建时间 | created_at | left | ✓ | 170 |
| 操作 | — | center | — | 120 |

操作列按钮：`[编辑] [删除]`，删除使用 `n-popconfirm` 确认。

**类型 tag 颜色**：stock=default, etf=success, fund=info, index=warning, bond=default

### 新增/编辑抽屉

```
抽屉标题：新增标的 / 编辑标的
宽度：520px

标的代码 *      [n-input]           # 纯文本输入
标的名称 *      [n-input]
类型 *          [n-select: stock/etf/fund/index/bond]
市场 *          [n-select: CN/HK/US]
风险等级        [n-slider 1-5]       # 滑块 + 数字显示
跟踪指数        [n-input]           # 如：沪深300
投资逻辑        [n-input type="textarea" rows=4]
备注            [n-input type="textarea" rows=2]

底部按钮：[取消]  [保存]
```

**校验规则**：
- code + market 联合唯一（对应数据库 UNIQUE 约束）
- code 不得包含空格
- name 长度 1-50

### 关联数据

- 删除标的前检查是否有关联的计划/交易/仓位，如有则提示「该标的存在关联数据，确认删除将同时删除关联的计划和交易记录」

---

## 2. 交易计划（Plans）

### 页面标题
```
交易计划
创建和管理你的买入/卖出计划
```

### 操作按钮行
```
[+ 新增买入计划]  [+ 新增卖出计划]  [导出]
```

### 筛选区
```
标的搜索  [n-input placeholder="搜索标的代码或名称"]
计划类型  [n-select: 全部 / 买入 / 卖出]
状态      [n-select: 全部 / 待执行 / 部分执行 / 已完成 / 已作废]
日期范围  [n-date-picker type="daterange"]
[搜索]   [重置]
```

### 表格列定义

| 列 | 字段 | 对齐 | 排序 | 宽度 |
|----|------|------|------|------|
| 创建时间 | created_at | left | ✓ | 170 |
| 标的 | asset (code-name) | left | — | 140 |
| 类型 | plan_type (tag) | center | ✓ | 70 |
| 计划仓位 | position_percent | right | — | 100 |
| 状态 | status (tag) | center | ✓ | 100 |
| 有效期 | start_date ~ end_date | center | ✓ | 200 |
| 规则数 | plan_rules count | center | — | 70 |
| 操作 | — | center | — | 140 |

操作列：`[编辑] [作废] [删除]`
- 待执行 → 可编辑、可作废
- 部分执行 → 可编辑、不可作废
- 已完成 → 不可编辑
- 已作废 → 仅可删除

### 新增/编辑抽屉

```
抽屉标题：新增买入计划 / 编辑卖出计划
宽度：560px（因含动态规则子表单，比标准 520px 略宽）

选择标的 *      [n-select 远程搜索，搜索 assets]
计划类型 *      [n-select: buy/sell，新增时自动填充，不可改]
计划仓位 *      [n-input-number min=0 max=100 step=1]%
                显示提示：「计划投入总资金的百分比」
有效期开始      [n-date-picker type="date"]
有效期结束      [n-date-picker type="date"]
计划说明        [n-input type="textarea" rows=3]

── 计划规则 ──────────────────────
（可添加多条，最少 0 条）

[+ 添加规则]

规则行：
  类型    [n-select: price/index/volume/time]
  条件    [n-select: >/</>=/<=/==]
  值      [n-input]
  [删除此规则]

底部按钮：[取消]  [保存]
```

**规则动态表单**：使用 Vue 响应式数组管理规则列表，每条规则可单独删除。

### 状态流转

```
新增 → pending
关联交易执行后 → partial
手动标记或规则全部满足 → completed
用户主动操作 → canceled
```

---

## 3. 交易记录（Trades）

### 页面标题
```
交易记录
记录每一笔实际成交
```

### 操作按钮行
```
[+ 买入]  [+ 卖出]  [导出 CSV]
```

### 筛选区
```
标的搜索        [n-input]
交易类型        [n-select: 全部 / 买入 / 卖出]
日期范围        [n-date-picker type="daterange"]
是否遵守计划    [n-select: 全部 / 是 / 否 / 部分]
情绪状态        [n-select: 全部 / calm/anxious/greedy/fearful/hesitant]
[搜索]         [重置]
```

### 表格列定义

**默认开启 `scroll-x` 横向滚动。**

**默认显示列**：

| 列 | 字段 | 对齐 | 排序 | 宽度 |
|----|------|------|------|------|
| 成交时间 | created_at | left | ✓ | 170 |
| 标的 | asset (code-name) | left | — | 120 |
| 类型 | trade_type (tag) | center | ✓ | 60 |
| 价格 | price | right | ✓ | 100 |
| 数量 | quantity | right | ✓ | 100 |
| 总金额 | total_amount | right | ✓ | 120 |
| 已实现盈亏 | 计算字段 | right | ✓ | 120 |
| 关联计划 | plan (code) | center | — | 100 |
| 遵守计划 | follow_plan (tag) | center | ✓ | 90 |
| 操作 | — | center | — | 140 |

**默认隐藏列（可通过列显示控制开关开启）**：

| 列 | 字段 | 对齐 | 宽度 |
|----|------|------|------|
| 手续费 | fee | right | 90 |
| 情绪 | mood (tag) | center | 80 |

**列显示控制**：表格右上角提供列设置按钮（`n-popover` + `n-checkbox-group`），允许用户勾选显示/隐藏列。

**已实现盈亏规则**：
- 买入交易：显示 `—`（灰色占位符）
- 卖出交易：显示计算值（正数绿色，负数红色，零值灰色）

**遵守计划 tag 颜色**：是=success, 否=error, 部分=warning, unknown=default
**情绪 tag 颜色**：calm=success, anxious=warning, greedy=error, fearful=error, hesitant=info

操作列：`[编辑] [复盘] [删除]`
- 「复盘」按钮直接跳转到复盘页面并预填关联交易
- 删除使用 `n-popconfirm`

### 买入抽屉

```
抽屉标题：买入
宽度：520px

选择标的 *                [n-select 远程搜索]
价格 *                    [n-input-number precision=2 step=0.01]  元
数量 *                    [n-input-number precision=3 min=0.001]  手/份
手续费 *                  [n-input-number precision=2 min=0]       元
总金额（自动计算）        [n-statistic readonly]                   元
                          公式：(price × quantity + fee)

大盘点位                  [n-input-number precision=2]             点
操作原因                  [n-input type="textarea" rows=2]
是否遵守计划              [n-switch]
关联计划（遵守时显示）     [n-select 筛选该标的的 buy 类型计划]
情绪状态                  [n-select: calm/anxious/greedy/fearful/hesitant/other/unknown]
备注                      [n-input type="textarea" rows=2]

底部按钮：[取消]  [确认买入]
```

**自动计算**：price 或 quantity 变化时，自动重算 total_amount。
**存储转换**：提交时 price/total_amount/fee ×100 → INTEGER，quantity ×1000 → INTEGER。

### 卖出抽屉

```
抽屉标题：卖出
宽度：520px

选择标的 *                [n-select 远程搜索]
                          选择后显示当前持仓信息：
                          「当前持仓：xxx 手，成本价 ¥x.xx，可用 xxx 手」

卖出数量 *                [n-input-number precision=3 max=当前持仓]
                          max 动态绑定当前持仓量，超出时 n-form-item 报错
价格 *                    [n-input-number precision=2 step=0.01]  元
手续费 *                  [n-input-number precision=2 min=0]       元
预计收入（自动计算）      [n-statistic readonly]                   元
预计盈亏（自动计算）      [n-statistic readonly]                   元（红/绿）
                          公式：(sell_price - avg_cost) × sell_qty - fee

是否遵守计划              [n-switch]
关联计划                  [n-select 筛选该标的的 sell 类型计划]
情绪状态                  [n-select]
备注                      [n-input type="textarea" rows=2]

底部按钮：[取消]  [确认卖出]
```

**卖出校验**：卖出数量不得超过当前持仓。选择标的后实时查询持仓。

### 关联数据

- 选择「是否遵守计划 = 否」时，`偏差原因` 字段变为必填
- 买入后自动计算加权平均成本并更新持仓
- 卖出后计算已实现盈亏

---

## 4. 仓位快照（Positions）

### 页面标题
```
仓位快照
查看你的资产配置和盈亏情况
```

### 操作按钮行
```
[+ 手动生成快照]  [导出]
```

### 顶部：当前持仓摘要卡片（n-grid cols=4）

| 卡片 | 数据 |
|------|------|
| 总资产 | ¥xxx,xxx.xx |
| 现金 | ¥xxx,xxx.xx |
| 浮动盈亏 | ±¥xxx.xx（红/绿） |
| 已实现盈亏 | ±¥xxx.xx（红/绿） |

### 快照列表

```
筛选：[n-date-picker type="daterange"]  [搜索]  [重置]
```

| 列 | 字段 | 对齐 | 宽度 |
|----|------|------|------|
| 快照时间 | snapshot_at | left | 170 |
| 现金 | cash | right | 120 |
| 总资产 | total_assets | right | 130 |
| 浮动盈亏 | unrealized_pnl | right | 130 |
| 已实现盈亏 | realized_pnl | right | 130 |
| 操作 | — | center | 100 |

操作列：`[查看明细] [删除]`

### 查看明细抽屉

```
抽屉标题：仓位明细 — 2026-06-01
宽度：640px

汇总信息（n-descriptions）：
  总资产    ¥xxx,xxx.xx
  现金      ¥xxx,xxx.xx
  持仓市值  ¥xxx,xxx.xx
  浮动盈亏  ±¥xxx.xx
  已实现盈亏 ±¥xxx.xx

仓位明细表格：
  标的 | 持仓数量 | 成本价 | 当前价 | 市值 | 浮动盈亏 | 仓位占比

**仓位占比**：前端实时计算（`当前标的市值 ÷ 账户总资产`），不存入数据库。当总资产为 0 时显示 `—`。
```

### 手动生成快照

点击「手动生成快照」按钮后弹出抽屉：

```
抽屉标题：生成仓位快照
宽度：480px

快照时间 *        [n-date-picker type="date" default=今天]
总资产 *          [n-input-number precision=2]    元
现金 *            [n-input-number precision=2]    元

── 各标的当前价格 ────────────
（自动列出当前有持仓的标的）

510050 当前价  [n-input-number precision=2]  元
510300 当前价  [n-input-number precision=2]  元
...

底部按钮：[取消]  [生成快照]
```

**自动计算**：填入当前价后自动计算市值 = 当前价 × 持仓数量，浮动盈亏 = (当前价 - 成本价) × 持仓数量。

---

## 5. 交易复盘（Reviews）

### 页面标题
```
交易复盘
记录和反思每一笔交易
```

### 操作按钮行
```
[+ 新增复盘]
```

### 筛选区
```
标的搜索    [n-input]
交易日期    [n-date-picker type="daterange"]
结果        [n-select: 全部 / 好 / 差 / 一般]
问题类型    [n-select: 全部 / 情绪 / 规则 / 纪律 / 外部]
[搜索]     [重置]
```

### 表格列定义

| 列 | 字段 | 对齐 | 宽度 |
|----|------|------|------|
| 复盘时间 | created_at | left | 170 |
| 交易信息 | 关联交易的标的+类型+时间 | left | 200 |
| 交易结果 | result (tag) | center | 90 |
| 问题类型 | issue_type (tag) | center | 90 |
| 总结 | summary（超 50 字截断） | left | — (flex) |
| 改进点 | improve（超 50 字截断） | left | — (flex) |
| 操作 | — | center | 100 |

**结果 tag**：好=success, 差=error, 一般=warning
**问题类型 tag**：情绪=warning, 规则=info, 纪律=error, 外部=default

操作列：`[编辑] [删除]`

### 新增/编辑抽屉

```
抽屉标题：新增复盘 / 编辑复盘
宽度：520px

关联交易 *      [n-select 远程搜索 trades，显示「标的-类型-时间」]
                选择后展示交易摘要：
                「510050 买入 2026-05-30 价格 3.50 数量 1000」

交易结果 *      [n-radio-group: 好 / 差 / 一般]
问题类型        [n-select: emotion/rule/discipline/external / 可多选 n-checkbox-group]
总结 *          [n-input type="textarea" rows=4]
改进点          [n-input type="textarea" rows=4]

底部按钮：[取消]  [保存]
```

### 入口说明

- 从交易记录表格「复盘」按钮进入时，自动预填关联交易
- 从复盘页面「新增复盘」进入时，需要手动选择关联交易

---

## 6. 市场观察（Market Observations）

### 页面标题
```
市场观察
记录市场环境和你的判断
```

### 操作按钮行
```
[+ 新增观察]
```

### 筛选区
```
日期范围    [n-date-picker type="daterange"]
市场情绪    [n-select: 全部 / 极低 / 低 / 中 / 高 / 极高]
[搜索]     [重置]
```

### 表格列定义

| 列 | 字段 | 对齐 | 宽度 |
|----|------|------|------|
| 观察时间 | observe_at | left | 170 |
| 指数点位 | index_level | right | 120 |
| 市场情绪 | sentiment (tag) | center | 90 |
| 重大事件 | event（超 40 字截断） | left | — (flex) |
| 个人观点 | personal_view（超 40 字截断） | left | — (flex) |
| 操作 | — | center | 100 |

**情绪 tag 颜色**：极低=error, 低=warning, 中=info, 高=success, 极高=success

### 新增/编辑抽屉

```
抽屉标题：新增市场观察 / 编辑市场观察
宽度：520px

观察时间 *        [n-date-picker type="datetime" default=现在]
指数点位          [n-input-number precision=2]           点
市场情绪          [n-select: 极低/低/中/高/极高]
重大事件          [n-input type="textarea" rows=3]
个人观点          [n-input type="textarea" rows=4]

底部按钮：[取消]  [保存]
```

### 用途

市场观察可独立于交易存在，作为投资日记使用。月报生成时会聚合当月的市场观察记录。

---

## 7. 月度报告（Monthly Reports / AI 月报）

### 页面标题
```
月度报告
AI 驱动的月度投资复盘
```

### 操作按钮行
```
[+ 生成本月报告]
```

### 月份选择
```
年份筛选：[n-select: 2024/2025/2026/...]
```

### 列表（卡片列表，n-grid cols=1，每行一张卡片）

每张月报卡片布局：

```
┌──────────────────────────────────────────────────┐
│  2026 年 05 月                          已编辑    │
│  生成时间：2026-05-31 22:30                      │
│  模型：qwen2.5:7b  |  Prompt v1                   │
│                                                  │
│  AI 摘要预览（前 100 字）...                       │
│                                                  │
│                        [查看]  [导出]  [删除]      │
└──────────────────────────────────────────────────┘
```

状态 tag：未生成=info, 已生成=success, 已编辑=warning

**不存在该月报告时**，卡片区域显示空状态引导：

```
该月尚无报告
[生成本月 AI 报告]
```

### 查看月报（大抽屉 / 全屏）

```
抽屉标题：2026 年 05 月投资复盘
宽度：800px（大抽屉）

内容区域（可滚动）：

  一、当月概况
     交易次数、买入/卖出金额、总体盈亏

  二、交易统计
     买入次数 / 卖出次数 / 总买入金额 / 总卖出金额
     （n-descriptions 两列布局）

  三、纪律执行情况
     计划执行率、遵守计划次数、偏离次数
     （n-descriptions + n-progress 执行率进度条）

  四、情绪分析
     情绪分布（calm/anxious/greedy/fearful/hesitant）
     （n-tag 统计）

  五、优势与问题
     AI 生成的分析文本（Markdown 渲染）

  六、下月改进计划
     AI 生成的建议文本（Markdown 渲染）

  ─── 用户编辑区域 ─────────────────────
  [n-input type="textarea" rows=8]
  用户可在此补充或修改 AI 内容

  ─── 元信息 ──────────────────────────
  模型：qwen2.5:7b | Prompt 版本：v1
  生成耗时：12.3s（取自 generation_duration_ms 字段，÷1000 显示秒）
  输入快照：[展开查看 JSON] / [折叠]

底部按钮：[导出 Markdown]  [保存]
```

### AI 生成流程

```
用户点击 [生成本月报告]
  → n-button loading 状态
  → n-spin 全屏遮罩「正在生成 AI 月报...」
  → 调用 MonthlyAggregationService 聚合当月数据
  → 调用 PromptTemplateService 生成 prompt
  → 调用 Ollama localhost:11434
  → 渲染结果到月报页面
  → 用户可编辑
  → 保存时更新 user_edited_summary
```

**异常处理**：
- Ollama 不可用时：`n-message.error("Ollama 未运行，请先启动 Ollama 或在设置中配置")`
- 生成超时（> 120s）：`n-message.warning("AI 生成超时，请检查模型配置")`
- 返回格式异常：`n-message.error("AI 返回格式异常，请重试")`

---

## 8. 设置（Settings）

### 页面标题
```
设置
```
无描述行。

### 布局：4 张独立卡片（n-grid cols=1，垂直排列）

### 卡片 1：数据库

```
┌─ 数据库 ─────────────────────────────────┐
│                                          │
│  数据库路径                                │
│  /Users/xxx/Library/Application Support/  │
│  invest-record-pro/data.db               │
│                                          │
│  [打开文件夹]  [备份数据库]  [恢复数据库]   │
└──────────────────────────────────────────┘
```

- 「打开文件夹」调用 Tauri filesystem 命令
- 「备份数据库」弹出文件选择器选择备份路径
- 「恢复数据库」弹出文件选择器 + `n-popconfirm` 警告「恢复将覆盖当前数据」

### 卡片 2：AI 设置

```
┌─ AI 设置 ─────────────────────────────────┐
│                                          │
│  Ollama 地址                             │
│  [n-input default="http://localhost:11434"]│
│                                          │
│  模型名称                                 │
│  [n-input placeholder="如 qwen2.5:7b"]  │
│                                          │
│  [测试连接]                               │
│                                          │
│  连接状态：✓ 已连接 / ✗ 未连接             │
└──────────────────────────────────────────┘
```

- 「测试连接」点击后显示 `n-spin`，请求 Ollama 健康检查端点：

```text
GET http://localhost:11434/api/tags
```

成功判定：HTTP 200 且响应 body 包含 `models` 数组（即 Ollama 正在运行且至少加载了模型列表）。
失败判定：连接拒绝 / 超时（5s） → 红色状态 + `n-message.error("无法连接 Ollama，请确认 Ollama 已启动且地址正确")`。
- 保存时校验 URL 格式

### 卡片 3：显示设置

```
┌─ 显示 ───────────────────────────────────┐
│                                          │
│  主题  [n-radio-group: 浅色 / 深色 / 跟随系统] │
│  语言  [n-select: 简体中文 / English]     │
└──────────────────────────────────────────┘
```

v1 语言固定为简体中文，English 预留但灰显（disabled）。

### 卡片 4：关于

```
┌─ 关于 ───────────────────────────────────┐
│                                          │
│  Invest Record Pro                       │
│  版本：1.0.0                              │
│  开源地址：[GitHub]                       │
│  许可证：MIT                               │
└──────────────────────────────────────────┘
```

---

## 页面 ↔ 数据表映射

| 页面 | 主表 | 关联表 | Pinia Store |
|------|------|--------|-------------|
| 仪表盘 | trades, positions | plans, reviews, assets | useDashboardStore |
| 投资标的 | assets | — | useAssetsStore |
| 交易计划 | plans | assets, plan_rules | usePlansStore |
| 交易记录 | trades | assets, plans | useTradesStore |
| 仓位快照 | positions | position_items, assets | usePositionsStore |
| 交易复盘 | reviews | trades | useReviewsStore |
| 市场观察 | market_observations | — | useMarketObservationsStore |
| 月度报告 | monthly_reports | — | useMonthlyReportsStore |
| 设置 | settings | — | useSettingsStore |

---

## 空状态设计汇总

| 页面 | 空状态提示 | 引导操作 |
|------|-----------|----------|
| 仪表盘 | 欢迎使用 Invest Record Pro | [新增标的] |
| 投资标的 | 暂无投资标的 | [新增标的] |
| 交易计划 | 暂无交易计划 | [新增计划] |
| 交易记录 | 暂无交易记录 | [记录买入] |
| 仓位快照 | 暂无仓位快照 | [生成快照] |
| 交易复盘 | 暂无复盘记录 | [新增复盘] |
| 市场观察 | 暂无市场观察 | [新增观察] |
| 月度报告 | 该月尚无报告 | [生成 AI 报告] |

---

## 尺寸参考

| 区域 | 尺寸 |
|------|------|
| 顶部导航栏 | 高度 48px |
| 左侧边栏 | 宽度 220px |
| 抽屉（表单） | 宽度 520px |
| 抽屉（明细） | 宽度 640px |
| 抽屉（月报） | 宽度 800px |
| 图表卡片 | 高度 280px |
| 表格分页 | 每页 20 条 |
| 筛选区 | 单行 inline |
