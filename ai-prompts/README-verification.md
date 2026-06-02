# 验证检查点总览

> 每个批次 AI 生成代码后，按以下清单验证通过再进入下一个批次。
> ❌ 验证失败时，将错误信息连同代码反馈给 AI 修复，不要继续下一批。

---

## Batch 00：项目脚手架

```bash
npm run dev
```

- [ ] 左侧导航菜单可见（9 个菜单项）
- [ ] 点击菜单项可切换页面，URL 变化
- [ ] 每个页面显示对应标题
- [ ] 顶部导航栏显示 "Invest Record Pro"
- [ ] TypeScript 编译无错误（`npx vue-tsc --noEmit`）
- [ ] 目录结构完整（src/app, pages, features, services, domain, shared, platform 均存在）

---

## Batch 01：数据库 + Rust 基础设施

```bash
cargo tauri dev
```

- [ ] 应用正常启动（前端界面可见）
- [ ] 数据库文件已创建（应用数据目录下有 `data.db`）
- [ ] 用 SQLite 工具检查 10 张表 + 1 个迁移跟踪表均存在
- [ ] `_migration_version` 表中有 version=1 的记录
- [ ] Rust 编译无 warning

**验证 SQL**：
```bash
sqlite3 ~/Library/Application\ Support/invest-record-pro/data.db ".tables"
# 应输出：_migration_version  assets  market_observations  monthly_reports  plans  plan_rules  position_items  positions  reviews  settings  trades
```

---

## Batch 02：共享类型定义

```bash
npx vue-tsc --noEmit
```

- [ ] TypeScript 编译无错误
- [ ] `src/domain/types/index.ts` 存在且导出所有类型
- [ ] 金融工具函数文件存在（financial.ts）
- [ ] 无 any 类型

**手动验证**：新建临时测试文件 `src/domain/types/__test__.ts`，import 所有类型和工具函数，确认无编译报错。

---

## Batch 03a：Asset Rust 命令

```bash
cargo tauri dev
```

- [ ] Rust 编译成功
- [ ] main.rs 中注册了 5 个 asset 命令
- [ ] 前端调用 `invoke('get_assets')` 不报错（可在浏览器 console 测试）

---

## Batch 03b：Asset Repository

```bash
npx vue-tsc --noEmit
```

- [ ] TypeScript 编译无错误
- [ ] `src/features/assets/repository.ts` 导出 5 个函数
- [ ] `src/features/assets/index.ts` 导出桶文件存在

---

## Batch 03c：Asset Store

```bash
npx vue-tsc --noEmit
```

- [ ] TypeScript 编译无错误
- [ ] Store 为 Setup Store（Composition 风格）
- [ ] 导出正确的 state / getters / actions

---

## Batch 03d：Asset Table

```bash
npx vue-tsc --noEmit
```

- [ ] TypeScript 编译无错误
- [ ] 组件导出正确

---

## Batch 03e：Asset Form

```bash
npx vue-tsc --noEmit
```

- [ ] TypeScript 编译无错误
- [ ] 组件导出正确

---

## ✅ Batch 03 完整验证（关键里程碑）

> Assets 是标杆模块，此处必须彻底验证后再继续。

```bash
cargo tauri dev
```

- [ ] Assets 页面可见，点击左侧"投资标的"正常显示
- [ ] 点击 **[+ 新增标的]** → Drawer 从右侧滑出，标题"新增标的"
- [ ] 填写表单 → 点击 **保存** → 列表中出现新数据
- [ ] 点击 **[编辑]** → Drawer 预填数据 → 修改 → 保存 → 列表更新
- [ ] 点击 **[删除]** → 弹出确认框 → 确认 → 数据消失
- [ ] **[搜索]** 输入关键词 → 列表过滤
- [ ] **[重置]** → 列表恢复全部数据
- [ ] 页面刷新后数据仍然存在（SQLite 持久化）
- [ ] 金额/数量显示正确，无浮点精度问题
- [ ] 无 any 类型（`npx vue-tsc --noEmit` 通过）
- [ ] 无 Rust 编译 warning

---

## Batch 04a：Plan Rust 命令

```bash
cargo tauri dev
```

- [ ] Rust 编译成功
- [ ] 7 个 plan 命令已注册
- [ ] 事务正常工作（create_plan 同时插入 plan + rules）

---

## ✅ Batch 04 完整验证

```bash
cargo tauri dev
```

- [ ] Plans 页面正常显示
- [ ] 新增买入/卖出计划 → 保存成功
- [ ] 动态规则可添加/删除
- [ ] 状态 tag 配色正确（pending=蓝, partial=黄, completed=绿, canceled=灰）
- [ ] 作废操作正常（pending → canceled）
- [ ] 搜索/过滤正常

---

## Batch 05a：Trade Rust 命令

```bash
cargo tauri dev
```

- [ ] Rust 编译成功
- [ ] 6 个 trade 命令已注册
- [ ] get_trade_summary 计算正确（手动测试 SQL）

---

## ✅ Batch 05 完整验证

> Trades 是高复杂度模块，重点验证金融计算。

```bash
cargo tauri dev
```

- [ ] Trades 页面正常显示
- [ ] **买入**：填写/默认成交时间 + 标的 + 价格 + 数量 → 总金额自动计算 → 保存成功
- [ ] **卖出**：选择标的后显示持仓信息 → 数量不超过持仓 → 预计盈亏计算正确
- [ ] 已实现盈亏颜色正确（正数绿、负数红、买入显示 —）
- [ ] 补录历史交易时，列表和筛选按成交时间 `trade_at` 排序/过滤，不按记录创建时间排序
- [ ] 部分卖出、清仓后再买入的加权平均成本和已实现盈亏手动验算正确
- [ ] 金额格式正确（千分位、2 位小数）
- [ ] 数量格式正确
- [ ] 列显示控制切换正常（手续费/情绪列可切换）
- [ ] 卖出超过持仓时验证报错
- [ ] **重点**：手动验算一笔交易的总金额 = price × quantity，确认精度正确

---

## Batch 06a：Position Rust 命令

```bash
cargo tauri dev
```

- [ ] Rust 编译成功
- [ ] 5 个 position 命令已注册
- [ ] 事务正常（create 同时插入 position + items）

---

## ✅ Batch 06 完整验证

```bash
cargo tauri dev
```

- [ ] Positions 页面正常显示，摘要卡片数据正确
- [ ] 生成快照：填入总资产/现金/当前价 → 保存成功
- [ ] 查看明细：640px 抽屉显示持仓明细
- [ ] 仓位占比计算正确
- [ ] 浮动盈亏颜色正确
- [ ] **重点**：手动验算市值 = 当前价 × 持仓数量

---

## Batch 07a + 07b：Review 完整验证

```bash
cargo tauri dev
```

- [ ] Reviews 页面正常显示
- [ ] 新增复盘：选择关联交易 → 填写结果/总结 → 保存
- [ ] 从交易记录点击 **[复盘]** → 跳转到复盘页面并预填 tradeId
- [ ] 筛选正常（结果、问题类型）

---

## Batch 08a + 08b：MarketObs 完整验证

```bash
cargo tauri dev
```

- [ ] Market Observations 页面正常显示
- [ ] 新增观察：填写上证指数、上证50、沪深300、成交额、情绪、政策事件/宏观备注 → 保存
- [ ] 情绪 tag 配色正确
- [ ] 筛选正常

---

## ✅ Batch 09：Dashboard 验证

> 跨模块聚合，依赖前面所有模块有数据。

**前置**：确保前面模块已有测试数据（至少 1 个资产、几笔交易）。

```bash
cargo tauri dev
```

- [ ] Dashboard 页面正常显示
- [ ] 4 张统计卡片有数据（非全零）
- [ ] 月份选择器切换后数据更新
- [ ] ECharts 折线图正常渲染（近 6 个月）
- [ ] 盈亏趋势不使用买入/卖出总金额冒充盈亏；已实现盈亏来自交易计算，未实现盈亏来自仓位快照
- [ ] ECharts 饼图正常渲染（仓位分布）
- [ ] 最近交易列表显示正确
- [ ] 活跃计划列表显示正确
- [ ] 无数据时显示空状态引导

---

## Batch 10a：Ollama 服务验证

> 本批次需 Ollama 运行。

**前置**：确保 Ollama 已安装并启动（`ollama serve`），至少下载一个模型。

```bash
cargo tauri dev
```

- [ ] 在 Settings → AI 设置中点击 **[测试连接]** → 显示"已连接"
- [ ] Ollama 不可用时显示"未连接"，AI 按钮禁用
- [ ] 输入非 localhost / 127.0.0.1 / ::1 的 Ollama 地址时拒绝保存并提示错误
- [ ] Prompt 模板服务能正确组装 prompt 文本

---

## ✅ Batch 10b：Monthly Reports 完整验证

> 需要 Ollama 运行。

```bash
cargo tauri dev
```

- [ ] Monthly Reports 页面正常显示
- [ ] 点击 **[生成本月报告]** → loading 遮罩 → AI 生成内容
- [ ] 统计数据区（一~四）正常显示
- [ ] AI 内容区（五~六）有 Markdown 文本
- [ ] 用户可编辑 AI 内容 → 保存后状态变为"已编辑"
- [ ] Ollama 不可用时降级：一~四正常，五~六显示引导提示
- [ ] 元信息显示正确（模型名、耗时、Prompt 版本）
- [ ] 导出 Markdown 功能正常

---

## ✅ Batch 11：Settings + 导出 验证

```bash
cargo tauri dev
```

- [ ] Settings 页面 4 张卡片正常显示
- [ ] 数据库路径正确显示
- [ ] **[备份]** → 选择路径 → 文件保存成功
- [ ] **[恢复]** → 确认框 → 数据恢复
- [ ] **[测试连接]** → Ollama 状态正确
- [ ] 主题切换正常（浅色/深色）
- [ ] Assets 页面 **[导出]** → CSV 文件保存，Excel 打开中文不乱码
- [ ] Trades 页面 **[导出 CSV]** → 同上
- [ ] 关于页面显示版本号 1.0.0

---

## 🎉 全部完成

```bash
cargo tauri build
```

- [ ] 生产构建成功
- [ ] 安装包体积合理（< 50MB）
- [ ] 安装后首次启动 → 创建数据库 → 空白仪表盘显示引导
