# Go-To-Market Plan

> Last updated: 2026-06-01

## 1. Positioning & Slogans

### 1.1 Official Positioning

**English**

A privacy-first, fully local desktop journal for investment tracking, trade planning and AI-powered post-trade review. All data stays on your device, no cloud uploads. Built with Tauri, Vue 3 and local LLMs (Ollama) for professional traders and privacy-conscious investors.

**中文**

隐私优先、纯本地桌面投资工具，专注交易记录、交易规划与 AI 复盘。所有数据本地存储、不上云端；基于 Tauri + Vue3 + 本地大模型 (Ollama) 打造，面向专业交易者与重视数据隐私的投资者。

### 1.2 Slogans

**中文（全渠道统一）**

```
本地隐私投资复盘工具・数据不上云・离线 AI 分析・Windows / Mac 双端支持
```

**English（海外渠道专用）**

```
Local-First Investment Journal | 100% Offline Storage | Local AI Review | Windows & macOS
```

### 1.3 Core Selling Points

| # | 中文 | English |
|---|------|---------|
| 1 | 全本地存储：交易记录、持仓、复盘报告仅保存在本机，零云端上传，杜绝数据泄露 | 100% Local Storage: All trade logs, positions and reviews remain on your local device, no cloud transmission. |
| 2 | 离线本地 AI：对接 Ollama 大模型，断网也可完成交易点评、月度复盘、纪律分析 | Offline Local AI: Integrate with Ollama LLMs to generate trade comments, monthly reports and discipline analysis without internet. |
| 3 | 专业桌面体验：表格、可视化图表、快捷键、大屏分析，适配重度使用场景 | Professional Desktop Experience: Rich tables, charts, keyboard shortcuts and large-screen layout for professional usage. |
| 4 | 个人版开源免费：代码透明可审计，基础功能永久免费使用 | Free & Open Source: Core features are permanently free for personal use, source code fully transparent. |

---

## 2. GitHub Strategy (Primary Channel)

### 2.1 Dual Repository Architecture

GitHub 单仓库无法分支私有化，强制双仓隔离：

**Public Repo: `invest-record-pro`**

- 协议：MIT License
- 内容：完整基础版代码 + 插件加载框架 + 功能开关 + UI + 文档
- 忽略：`plugins/` 目录、密钥、私有配置
- 对外：源码 + 免费版安装包（Releases）

**Private Repo: `invest-record-pro-premium`**

- 内容：付费插件源码、CSV 解析、高级 AI、授权校验逻辑
- 仅自用，永不对外公开

### 2.2 README Structure (Top-to-Bottom)

1. 顶部：3 张截图（仪表盘 / 交易记录 / AI 复盘）+ 中英双语标语
2. 核心卖点（4 条，双语）
3. 简单介绍 & 目标用户
4. 快速开始（开发运行 + 普通用户下载）
5. 功能区分：免费开源版 VS 专业付费版
6. 插件架构说明（一句话：支持模块化插件扩展）
7. 开源协议、Issue / Discussions 入口
8. 社区群、联系方式

### 2.3 GitHub Topics (一次性添加)

```
tauri, vue3, typescript, local-ai, ollama, privacy, investment,
trading-journal, trading-record, sqlite, desktop-app, offline-first
```

### 2.4 GitHub Operations Rules

- 版本节奏：小迭代每日 / 隔日更新，正式版本每周 1 个版本
- 优先回复 Issue、Discussions，建立社区信任感
- Releases 同时上传 Windows / Mac 双端安装包，标注版本更新日志
- 使用 GitHub Actions 自动构建和发布

### 2.5 Quick Start Code Block

```bash
# Clone
git clone https://github.com/brycegao/invest-record-pro.git
cd invest-record-pro

# Install dependencies
npm install

# Dev run
npm run tauri dev

# Build installer
npm run tauri build
```

---

## 3. Domestic Community Content (国内垂直社区)

### 3.1 知乎 (Zhihu)

**可用标题：**

- 《有哪些隐私安全的本地交易复盘工具推荐？》
- 《不想把交易数据上传云端，有什么好用的记账复盘软件？》

**标准回答模板：**

```
推荐一款完全本地部署、隐私优先，还自带离线AI的投资复盘桌面工具，Windows、Mac 双端可用。

✅ 全程本地存储：交易流水、持仓、复盘笔记全部留在自己电脑，不上任何云端，彻底规避数据泄露风险
✅ 离线AI分析：接入 Ollama 本地大模型，断网也能自动做交易点评、月度总结、交易纪律梳理
✅ 专业桌面体验：表格、可视化图表、快捷键，比网页、小程序更适合长期复盘使用
✅ 基础功能开源免费，代码透明可查，个人使用无门槛

适合人群：
股票、基金、ETF、可转债交易者；重视数据隐私、坚持交易复盘、喜欢本地AI工具的技术投资者。

开源地址：【GitHub 链接】
下载安装包：【GitHub Releases 链接】
```

### 3.2 V2EX

**标题：**

```
[开源] 本地隐私投资复盘工具，内置离线AI分析，Windows/Mac 双端
```

**正文：**

```
基于 Tauri + Vue3 开发的纯本地投资记录&复盘工具，分享给有需要的朋友。

核心特点：
1. 数据全本地，不上云，隐私优先
2. 支持 Ollama 本地大模型，离线AI自动复盘
3. 桌面端专业交互，适配日常交易记录与月度总结
4. 基础功能开源免费，MIT 协议

开源地址：xxx
欢迎体验、提 Issue、交流功能建议。
```

### 3.3 掘金 / InfoQ (技术向引流)

优先 3 个选题，按顺序发布：

1. 《基于 Tauri + Vue3 + Ollama 打造本地 AI 桌面投资工具实战》
2. 《隐私优先设计：为什么投资工具一定要做纯端侧架构？》
3. 《从 0 到 1：桌面应用插件化架构设计（适配免费 / 付费功能分离）》

### 3.4 雪球 / 集思录 (投资垂直社区)

文案偏交易复盘、使用体验，弱化技术：

```
一直在坚持交易复盘，又担心交易数据上传平台泄露，于是找到了这款纯本地工具。

所有记录都存在本机，搭配本地AI自动生成复盘内容，日常记账、月度总结都很方便，
Windows 和 Mac 都能用，基础功能免费开源。
有复盘习惯、看重隐私的朋友可以试试：【GitHub链接】
```

### 3.5 B 站 (Bilibili)

**视频标题（轮换使用）：**

- 本地 AI 投资复盘工具！数据不上云，隐私拉满 | 开源免费桌面应用
- 告别在线复盘平台！纯离线 AI + 本地存储，交易者必备工具
- Windows/Mac 双端可用 | 开源本地投资记录 & AI 复盘工具实测

**标准演示流程（统一脚本）：**

```
安装软件
→ 创建账户
→ 手动录入交易记录
→ 查看基础统计图表
→ 开启本地 AI 生成复盘报告
→ 演示「数据本地存放」
→ 功能介绍 & 下载指引
```

---

## 4. International Community (海外社区)

### 4.1 Reddit (r/privacy, r/LocalLLaMA, r/investing)

```
Open-source local-first investment journal with offline AI review.

Key features:
• 100% local storage, no cloud uploads
• Works with Ollama for offline LLM analysis & trade review
• Native desktop app for Windows & macOS
• Core features free & open source (MIT license)

Perfect for traders who care about data privacy and daily post-trade review.

GitHub: [link]
```

### 4.2 Hacker News / Indie Hackers

```
A privacy-focused desktop trading journal built with Tauri + Vue3.
All your trade data stays local, integrated with local LLMs (Ollama)
for AI-powered review. Fully open source for personal use.
```

---

## 5. Content Strategy Boundaries

### ✅ 持续产出方向（只做这四类）

1. 产品演示、版本更新、使用教程
2. 本地 AI + 隐私优先产品设计思路
3. Tauri / Vue / 插件化 / Ollama 技术实战文章
4. 交易复盘方法论、交易纪律（不荐股、不分析行情）

### ❌ 绝对禁止内容

1. 股票推荐、行情预测、标的分析
2. 诱导交易、收益承诺
3. 夸大 AI 能力、宣传 "智能选股"
4. 早期上线云同步、云端功能（破坏产品定位）

---

## 6. Conversion & Retention

### 6.1 Static Landing Page (GitHub Pages)

页面模块（极简设计）：

- 顶部标语 + 截图轮播
- 核心卖点（4 条）
- 功能对比表（免费版 VS 专业版）
- 下载入口（Releases）
- FAQ 常见问题
- GitHub / 社区群入口

### 6.2 Feature Tiers

**Free Open Source（公开主仓，永久免费）**

- 极简手动录入、单账户管理
- 基础统计、图表、基础模板
- 基础本地 AI 点评（单条交易）
- 本地手动备份

**Pro Plugin（私有插件，付费解锁）**

- 券商 Excel/CSV 一键导入（核心转化点）
- 多账户管理
- 高级 AI 全量复盘、月度 / 季度报告
- 高级分析图表、批量导出
- 专业复盘模板库

UI 逻辑：按钮置灰 + 悬浮提示 + 升级页面，前端控制展示，Rust 底层权限拦截。

### 6.3 Community Building

**第 1 个月：** 建立 QQ / 微信群（国内），Discord（海外）

定位：只收集反馈、解答使用问题、接收功能建议

规则：禁荐股、禁行情讨论，维持工具交流氛围

### 6.4 Upgrade Hooks (软转化，不骚扰)

- 高频操作页（录入）温和提示：「CSV 批量导入为专业版功能」
- 复盘页提示：「高级 AI 全量复盘可解锁」
- 新用户使用 7 天 / 记录 20 笔交易，首页弱提示升级入口

---

## 7. 3-Month Execution Plan

### Month 1 | 目标：0 → 200 种子用户

| 周次 | 动作 |
|------|------|
| W1-W2 | 完成 MVP 可用版本，补齐免费版全部基础功能 |
| W1-W2 | 搭建双仓库（公开主仓 + 私有插件仓），配置 .gitignore |
| W2 | 编写完整版 README、截图标注、上架 GitHub + Releases |
| W3 | 发布：知乎 1 篇、V2EX 1 篇 |
| W3-W4 | 掘金技术文 1 篇 |
| W4 | 录制 1 条 B 站演示视频并发布 |
| W4 | 开通 GitHub Discussions、初期社群 |

### Month 2 | 目标：200 → 500 用户

| 周次 | 动作 |
|------|------|
| 每周 | 固定产出 1 篇内容（教程 / 技术文 / 版本更新） |
| 每周 | 维护 GitHub Issue、社区答疑 |
| W1-W3 | 根据用户反馈优化录入、复盘体验 |
| W2-W4 | 开发 CSV 导入插件（付费核心） |
| W4 | 启动轻量老用户转介绍 |

### Month 3 | 目标：500 → 1000 用户

| 周次 | 动作 |
|------|------|
| W1 | 同步分发至海外 Reddit / Indie Hackers |
| W1-W2 | 上线高级 AI 复盘插件 |
| W2-W3 | 优化安装包、新手引导、帮助文档 |
| W3 | 整理早期用户案例、使用心得 |
| W4 | 正式上线专业版授权 + 插件售卖，启动商业化 |

---

## 8. Risk & Red Lines (风险 & 红线)

### 8.1 开源边界红线

公开仓库绝不提交任何付费插件、授权密钥、私有逻辑；`plugins/` 目录全程 .gitignore。

### 8.2 隐私定位红线

早期坚决不上云同步、云端统计，守住「纯本地」核心卖点。

### 8.3 内容红线

全程不做荐股、行情预测，只做工具 + 复盘方法论 + 技术内容。

### 8.4 开源协议红线

MIT 协议明确标注，不篡改、不模糊开源范围。

### 8.5 商业化节奏红线

0~1000 用户阶段：以拉新、打磨产品为主，不强推付费；满 1000 种子用户后正式启动插件付费。

---

## 9. Monetization Roadmap

### 前期（0~1000 用户）

- 纯免费开源，只积累信任、用户、反馈
- 功能区分仅做展示，不主动强营销

### 中期（1000+ 用户，插件正式变现）

- 付费形式：终身买断 / 年订阅 二选一
- 售卖内容：独立付费插件包 + 序列号激活
- 技术：本地 RSA 校验 + Tauri 底层权限拦截，前端仅做展示控制
- 运营：轻量发卡、自助激活，无复杂人工运维
