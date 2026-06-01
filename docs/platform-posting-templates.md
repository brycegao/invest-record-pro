# Platform Posting Templates / 各平台发帖文案合集

> 本文档整理了所有平台的发帖文案模板，可直接复制使用。
> 替换【GitHub 链接】为实际地址后再发布。

---

## 一、国内社区 (Domestic)

### 1. 知乎 (Zhihu) — 回答模板

#### 可用问题标题

- 《有哪些隐私安全的本地交易复盘工具推荐？》
- 《不想把交易数据上传云端，有什么好用的记账复盘软件？》

#### 标准回答

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

---

### 2. V2EX — 发帖

#### 标题

```
[开源] 本地隐私投资复盘工具，内置离线AI分析，Windows/Mac 双端
```

#### 正文

```
基于 Tauri + Vue3 开发的纯本地投资记录&复盘工具，分享给有需要的朋友。

核心特点：
1. 数据全本地，不上云，隐私优先
2. 支持 Ollama 本地大模型，离线AI自动复盘
3. 桌面端专业交互，适配日常交易记录与月度总结
4. 基础功能开源免费，MIT 协议

开源地址：【GitHub 链接】
欢迎体验、提 Issue、交流功能建议。
```

---

### 3. 掘金 / InfoQ — 技术文章选题 & 模板

#### 选题 1：《基于 Tauri + Vue3 + Ollama 打造本地 AI 桌面投资工具实战》

```
# 摘要
本文记录了从零开始，用 Tauri 2 + Vue 3 + TypeScript + SQLite + Ollama 构建一款纯本地、隐私优先的投资复盘桌面工具的全过程。

## 为什么做这个？
- 市面上的复盘工具几乎都需要上传交易数据到云端
- 个人投资者对交易隐私有强烈需求
- 本地大模型（Ollama）的成熟让离线 AI 成为现实

## 技术选型
- Tauri 2：轻量桌面框架，安装包小，性能好
- Vue 3 + TypeScript + Naive UI：前端生态成熟
- SQLite：纯本地文件数据库，零运维
- Ollama：本地 LLM 运行时，支持多种开源模型
- ECharts：专业图表库

## 架构设计
- 插件化架构：免费核心 + 可选付费插件
- 严格的分层依赖：app → pages → features → services → domain → infrastructure → platform
- 功能模块化：每个业务模块独立开发、测试

## 踩坑记录
（根据实际开发填写）

## 总结
开源地址：【GitHub 链接】
```

#### 选题 2：《隐私优先设计：为什么投资工具一定要做纯端侧架构？》

```
# 摘要
从产品设计角度分析：为什么投资复盘工具应该坚持纯端侧架构，以及如何在功能和隐私之间取得平衡。

## 核心观点
1. 交易数据是高度敏感的个人数据
2. 云端服务增加了数据泄露的攻击面
3. 本地 LLM 让端侧 AI 能力不再是瓶颈

## 设计原则
- 零网络传输（无数据上传）
- 本地 SQLite 存储
- 本地 Ollama AI 推理
- 开源代码可审计

## 技术实现要点
（根据实际开发填写）

开源地址：【GitHub 链接】
```

#### 选题 3：《从 0 到 1：桌面应用插件化架构设计》

```
# 摘要
介绍 invest-record-pro 的插件化架构设计，如何实现免费核心和付费功能的安全分离。

## 设计目标
- 公开仓库不包含任何付费逻辑
- 插件可独立开发、热加载
- 授权校验在 Rust 底层完成，前端仅做展示控制

## 架构方案
- Tauri 插件系统扩展
- 动态加载机制
- 本地 RSA 授权校验
- 前端功能开关

## 实际效果
（根据实际开发填写）

开源地址：【GitHub 链接】
```

---

### 4. 雪球 / 集思录 — 使用体验分享

```
一直在坚持交易复盘，又担心交易数据上传平台泄露，于是找到了这款纯本地工具。

所有记录都存在本机，搭配本地AI自动生成复盘内容，日常记账、月度总结都很方便，
Windows 和 Mac 都能用，基础功能免费开源。

有复盘习惯、看重隐私的朋友可以试试：【GitHub 链接】
```

---

### 5. B 站 (Bilibili) — 视频演示

#### 视频标题（轮换使用）

1. 本地 AI 投资复盘工具！数据不上云，隐私拉满 | 开源免费桌面应用
2. 告别在线复盘平台！纯离线 AI + 本地存储，交易者必备工具
3. Windows/Mac 双端可用 | 开源本地投资记录 & AI 复盘工具实测

#### 视频标签

```
投资复盘, 本地AI, Ollama, 开源, 桌面应用, Tauri, 隐私保护, 交易记录, ETF
```

#### 标准演示脚本

```
[开场 10s]
大家好，今天分享一款我最近在用的本地投资复盘工具，完全开源免费。

[安装 & 首次启动 30s]
- 展示从 GitHub Releases 下载安装包
- 安装过程（Windows / Mac 各一次）
- 首次启动界面

[核心功能演示 3-5min]
1. 创建投资标的 → 录入基本信息
2. 创建交易计划 → 设定买入/卖出规则
3. 手动录入一笔交易 → 记录价格、仓位、情绪
4. 查看持仓统计 → 资产分布图表
5. 创建单笔复盘 → 填写回顾要点

[AI 复盘演示 2min]
- 展示 Ollama 本地运行状态
- 点击「AI 生成复盘」→ 自动生成分析
- 生成月度复盘报告

[数据本地性验证 30s]
- 打开本地数据文件目录
- 展示 SQLite 文件
- 断网状态下所有功能正常运行

[结尾 20s]
- 功能总结 + 下载指引
- GitHub 地址展示
- 欢迎提 Issue 和建议
```

#### 视频简介（标准模板）

```
完全本地的开源投资复盘桌面工具，数据不上云，内置离线 AI 分析。

核心亮点：
✅ 100% 本地存储，交易数据不离开你的电脑
✅ 接入 Ollama 本地大模型，断网也能 AI 复盘
✅ 专业桌面体验，表格+图表+快捷键
✅ 开源免费，MIT 协议

下载地址：【GitHub Releases 链接】
开源地址：【GitHub 链接】
```

---

## 二、海外社区 (International)

### 1. Reddit — 通用帖文

**适用 Subreddit：** r/privacy, r/LocalLLaMA, r/investing, r/selfhosted

```
Title: Open-source local-first investment journal with offline AI review

I built a privacy-focused desktop trading journal where all your data stays on your machine — no cloud uploads, no API keys required.

Key features:
• 100% local storage (SQLite), no network transmission
• Works with Ollama for offline LLM analysis & trade review
• Native desktop app for Windows & macOS (built with Tauri)
• Core features free & open source (MIT license)

It's designed for traders who do daily post-trade review and care about keeping their trade history private.

GitHub: [link]

Feedback and feature requests welcome!
```

### 2. Reddit r/LocalLLaMA — 专用帖文

```
Title: Using Ollama for offline investment trade review — open source desktop app

I've integrated Ollama into a local-first trading journal for offline AI analysis. The app generates trade comments, monthly reviews and discipline analysis — all running locally with zero cloud dependency.

If you're interested in practical Ollama use-cases beyond chatbots, check it out.

GitHub: [link]
```

### 3. Hacker News — Show HN

```
Title: Show HN: Local-First Investment Journal with Offline AI Review

A desktop trading journal built with Tauri + Vue3 where all trade data stays local. Integrated with Ollama for AI-powered post-trade review. No cloud, no API keys. MIT licensed.

GitHub: [link]
```

### 4. Indie Hackers — 产品分享帖

```
Title: I built a local-first investment journal that keeps all your trading data offline

I wanted a trading review tool that never sends data to the cloud, so I built one.

- All data stored locally in SQLite
- AI review powered by Ollama (runs offline)
- Desktop app (Tauri) for Windows & macOS
- Open source, MIT license

Core features are free. Planning to add optional paid plugins later for advanced features.

Would love feedback from fellow indie builders and traders.

GitHub: [link]
```

---

## 三、内容排期建议

### Month 1 发帖排期

| 周次 | 平台 | 内容类型 | 备注 |
|------|------|----------|------|
| W3 | 知乎 | 回答 | 选热度高的问题 |
| W3 | V2EX | 发帖 | 新建帖 |
| W3-W4 | 掘金 | 技术文 | 选题 1 |
| W4 | B 站 | 演示视频 | 标准脚本 |
| W4 | GitHub | Release v0.1.0 | 首个公开版本 |

### Month 2 发帖排期

| 周次 | 平台 | 内容类型 | 备注 |
|------|------|----------|------|
| W1 | 掘金 | 技术文 | 选题 2 |
| W2 | 知乎 | 回答/文章 | 复盘方法论 |
| W3 | 雪球 | 体验分享 | 弱技术向 |
| W4 | 掘金/InfoQ | 技术文 | 选题 3 |

### Month 3 发帖排期

| 周次 | 平台 | 内容类型 | 备注 |
|------|------|----------|------|
| W1 | Reddit | 帖文 | r/privacy |
| W1 | Reddit | 帖文 | r/LocalLLaMA |
| W1 | Hacker News | Show HN | 配合 GitHub star |
| W2 | Indie Hackers | 帖文 | 产品分享 |
| W3 | Reddit | 帖文 | r/investing |
| W4 | B 站 | 更新视频 | 新功能演示 |

---

## 四、发帖注意事项

### ✅ 必须做

- 每篇内容附带 GitHub 链接和下载链接
- 统一使用产品标语和核心卖点
- 回复所有评论和提问（48 小时内）
- 截图和视频使用真实产品界面

### ❌ 禁止做

- 荐股、行情预测、标的分析
- 夸大 AI 能力（不提"智能选股"）
- 一稿多发完全相同内容（每个平台适当调整语气）
- 付费广告（0-1000 用户阶段）
- 发布包含付费插件细节的技术内容
