<div align="center">

# Invest Record Pro

**个人投资决策记录系统・纯本地存储・离线 AI 分析・Tauri 2 桌面应用**

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Tauri 2](https://img.shields.io/badge/Tauri-v2-blue?logo=tauri)](https://tauri.app/)
[![Vue 3](https://img.shields.io/badge/Vue-3-green?logo=vue.js)](https://vuejs.org/)
[![Ollama](https://img.shields.io/badge/Ollama-Local%20AI-orange)](https://ollama.ai/)

<!-- 桌面端UI效果 -->
![image](./UI.gif)

</div>

---

## ✨ 核心特性

- 🔒 **纯本地存储** — 交易记录、持仓快照、复盘报告全部保存在本机 SQLite，零云端传输
- 🤖 **离线 AI 分析** — 对接 Ollama 本地大模型，断网也可完成交易点评、月度复盘、纪律分析
- 📊 **完整投资闭环** — 标的管理 → 交易计划 → 交易记录 → 仓位快照 → 深度复盘 → 月度报告
- 📏 **纪律量化** — 自动统计计划执行率，量化交易纪律
- 🖥️ **专业桌面体验** — Tauri 2 原生窗口，表格、可视化图表、侧边导航，适配重度使用场景
- 💾 **轻量高性能** — Rust 后端 + SQLite，启动秒开

## 📸 界面预览

| 仪表盘 | 交易计划 | AI 月报 |
|:---:|:---:|:---:|
| <img src="pictures/仪表盘.png" alt="Dashboard" width="280" /> | <img src="pictures/交易计划.png" alt="Plans" width="380" /> | <img src="pictures/月度报告.png" alt="Report" width="380" /> |

## 🛠️ 技术栈

| 层级 | 技术 |
|------|------|
| 桌面端 | Tauri 2 + Rust |
| 前端 | Vue 3 + TypeScript + Vite |
| 状态管理 | Pinia |
| UI 组件 | Naive UI |
| 图表 | ECharts (vue-echarts) |
| 数据库 | SQLite (rusqlite, bundled) |
| 本地 AI | Ollama (fetch API) |
| 单元测试 | Vitest + @vue/test-utils (132 tests) |
| E2E 测试 | Playwright (89 tests) |

## 🏗️ 架构

Feature-first 分层架构，业务模块互相隔离：

```
src/
├── domain/types/          # 领域类型定义（无框架依赖）
├── shared/                # 共享组件与工具
├── services/              # 应用服务（跨模块协调）
├── features/              # 8 个业务模块
│   ├── assets/            # 投资标的（CRUD）
│   ├── plans/             # 交易计划（计划 + 规则）
│   ├── trades/            # 交易记录（买入/卖出）
│   ├── positions/         # 仓位快照（手动记录）
│   ├── reviews/           # 交易复盘（关联交易）
│   ├── market-observations/  # 市场观察
│   ├── monthly-reports/   # AI 月度报告
│   └── settings/         # 系统设置
├── pages/                 # 页面组件（路由级）
├── layouts/               # 布局组件
└── router/                # Vue Router
```

**关键设计决策：**

- **金融精度安全** — 所有金额/价格/数量/百分比使用 INTEGER 存储，禁止 REAL/FLOAT。金额 ×100（分），数量 ×1000，百分比 ×100，指数点位 ×100
- **Rust 严格模式** — clippy 配置 `unwrap_used = "deny"`, `expect_used = "deny"`, `panic = "deny"`
- **模块隔离** — `features/trades` 不导入 `features/plans`，跨模块数据通过 service / DB query

## 📋 页面

| 页面 | 路由 | 功能 |
|------|------|------|
| 仪表盘 | `/dashboard` | 盈亏统计、近 6 月趋势图、仓位分布、最近交易、活跃计划 |
| 投资标的 | `/assets` | 标的 CRUD，支持股票/ETF/基金/指数/可转债 |
| 交易计划 | `/plans` | 计划制定、触发规则、执行跟踪、状态管理 |
| 交易记录 | `/trades` | 买入/卖出录入、情绪标记、计划关联、多维筛选 |
| 仓位快照 | `/positions` | 手动记录持仓快照、市值与浮动盈亏 |
| 交易复盘 | `/reviews` | 逐笔交易复盘、结果评价、AI 辅助分析 |
| 市场观察 | `/market-observations` | 大盘点位、市场情绪、重大事件记录 |
| 月度报告 | `/monthly-reports` | AI 生成月度投资总结、人工编辑、导出 |
| 设置 | `/settings` | Ollama 模型配置、数据备份/恢复、主题切换 |

## 🚀 快速开始

### 开发者

```bash
git clone https://github.com/brycegao/invest-record-pro.git
cd invest-record-pro
npm install
npm run tauri dev
```

### 前置条件

- [Node.js](https://nodejs.org/) >= 18
- [Rust](https://rustup.rs/) (stable)
- [Tauri Prerequisites](https://tauri.app/start/prerequisites/)
- [Ollama](https://ollama.ai/)（可选，用于 AI 功能）

### 开发命令

```bash
npm run dev              # Vite 开发服务器 (port 1420)
npm run build            # vue-tsc + vite build
npm run check            # lint + type-check + format:check
npm run check:fix        # lint:fix + format
npm run test             # Vitest 单元测试 (132 tests)
npm run test:e2e         # Playwright E2E 测试 (89 tests)
npm run test:e2e:ui      # Playwright UI 模式
```

### 普通用户

从 [GitHub Releases](https://github.com/brycegao/invest-record-pro/releases) 下载安装包。

支持平台：Windows 10/11、macOS

## 💬 Community / 社区

- [GitHub Discussions](https://github.com/brycegao/invest-record-pro/discussions) — Feature requests, feedback, Q&A
- [GitHub Issues](https://github.com/brycegao/invest-record-pro/issues) — Bug reports

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

<div align="center">

**个人投资决策记录系统・纯本地存储・离线 AI 分析・Tauri 2 桌面应用**

</div>
