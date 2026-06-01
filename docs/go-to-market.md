# Go-To-Market Plan

## Positioning

invest-record-pro is a privacy-first, pure端侧, local-AI desktop tool for investment planning, trading records, and post-trade review.

The product should grow through precise communities, content marketing, GitHub open source distribution, and word of mouth. No paid ads are needed in the early stage.

## 3-Month Goal

Acquire 500-1000 seed users in the first 3 months.

The early growth strategy is:

```text
Precise community
-> Content seeding
-> GitHub open source trust
-> User feedback
-> Word-of-mouth growth
```

## Product Slogan

```text
本地隐私投资复盘工具・数据不上云・自带 AI 分析・Windows/Mac 双端
```

## Core Selling Points

- 100% local storage: trades, reviews, positions, and reports stay on the user's own computer.
- Pure local AI: Ollama local models support offline AI review and monthly summaries.
- Desktop professional experience: tables, charts, keyboard shortcuts, and large-screen analysis.
- Free and open source for personal use: transparent and auditable.

## Target Users

- Individual investors in stocks, funds, ETFs, and convertible bonds.
- Traders and review-oriented investors.
- Users who care strongly about privacy and do not want to upload trading records to platforms.
- Programmers and technical users interested in local AI and privacy-first tools.

## Promotion Channels

### 1. GitHub

GitHub is the most important early channel because it provides free distribution, trust, and technical credibility.

Actions:

- Open-source the Tauri + Vue 3 + TypeScript project.
- Use MIT license unless a later decision changes it.
- Write a strong README.
- Put 3 screenshots at the top:
  - Main dashboard.
  - Review page.
  - AI analysis/monthly report page.
- Include the slogan near the top.
- Show the 4 core selling points clearly.
- Provide quick start commands.
- Provide GitHub Releases download links.
- Use topics:
  - `tauri`
  - `vue3`
  - `local-ai`
  - `privacy`
  - `investment`
  - `trading-journal`
  - `sqlite`
  - `ollama`
- Open GitHub Discussions.
- Respond to Issues actively.
- Ship small updates frequently and larger versions weekly in the early stage.

README quick start example:

```bash
npm install
npm run tauri dev
```

### 2. Domestic Vertical Communities

Priority channels:

- Zhihu.
- Juejin.
- InfoQ.
- V2EX.
- Bilibili.
- Xueqiu.
- Jisilu.

Suggested topics:

- 有没有隐私优先的本地投资复盘工具？
- 我用 Tauri + Vue 3 + SQLite + Ollama 做了一个本地 AI 投资复盘工具。
- 为什么我不再用在线复盘工具，转而做本地版？
- 本地 AI 如何帮助投资者做交易复盘？

V2EX title:

```text
[开源] 本地隐私投资复盘工具，自带 AI 分析
```

Bilibili demo flow:

```text
Install
-> Create asset
-> Import or record trade
-> Create review
-> Generate local AI monthly report
-> Show data stored locally
```

### 3. International Technical Communities

Auxiliary channels:

- Reddit r/privacy.
- Reddit r/LocalLLaMA.
- Reddit r/investing.
- Hacker News.
- Indie Hackers.

Suggested positioning:

```text
Local-first, privacy-first investment journal with local AI review.
```

## Content Strategy

Publish content continuously to build trust.

Suggested content types:

- Product demo videos.
- Local AI review examples.
- Privacy-first tool design notes.
- Tauri + Vue 3 + SQLite + Ollama technical articles.
- Investment discipline and review methodology.
- Release notes and user case studies.

Avoid broad stock-picking or market prediction content. Focus on:

```text
local-first + privacy + AI + investment review
```

## Copywriting Templates

### Zhihu Answer Template

```text
推荐一个完全本地、隐私优先、自带 AI 的投资复盘工具，Windows/Mac 都能用。

✅ 所有数据（交易记录、复盘笔记、仓位）只存在你自己电脑，不上云、不泄露
✅ 支持 Ollama 本地大模型，离线 AI 复盘、自动生成月报、风险分析
✅ Tauri 桌面应用，专业表格 + 图表 + 快捷键，比手机 / 小程序好用太多
✅ 个人免费，开源透明

适合：重视隐私、不想把交易数据给平台、喜欢本地 AI 的投资者。

下载：GitHub Releases
开源地址：xxx
```

### Bilibili Video Titles

```text
本地 AI 投资复盘工具！数据不上云，隐私拉满｜Tauri 桌面应用
```

```text
告别在线平台！用本地 AI 做交易复盘，安全又免费
```

```text
Windows/Mac 双端！纯端侧 AI 投资工具，开源免费
```

## Conversion And Retention

### Website

Build a simple single-page website using GitHub Pages or another free static hosting option.

Content:

- Screenshots.
- Slogan.
- Core selling points.
- Download links.
- FAQ.
- GitHub link.

### Auto Update

Use Tauri auto-update later to reduce user friction.

### Community

Create one or more communities:

- QQ group.
- WeChat group.
- Discord for international users.

Purpose:

- Collect feedback.
- Answer usage questions.
- Discuss feature requests.
- Build early user identity.

### Data Import

Support broker Excel/CSV import when feasible, because migration cost is one of the biggest adoption barriers.

### Template Library

Provide built-in templates:

- ETF low-buy staged plan.
- Monthly investment review.
- Trade discipline review.
- AI prompt templates.

## Pitfalls To Avoid

- Do not spend money on paid ads in the early stage.
- Do not create generic stock-picking content.
- Do not ignore README and documentation quality.
- Do not close-source too early, because open source is a trust signal for privacy-first tools.
- Do not position the product as an investment recommendation system.
- Do not introduce cloud services in early versions.

## 3-Month Execution Plan

### Month 1: 0 To 200 Users

- Complete usable product MVP.
- Open-source on GitHub.
- Write README with screenshots and quick start.
- Publish one Zhihu post.
- Publish one V2EX post.
- Publish one Juejin technical article.
- Record one Bilibili demo video.

### Month 2: 200 To 500 Users

- Publish one content piece per week.
- Maintain GitHub Issues and Discussions.
- Collect seed-user feedback.
- Improve import/export and review experience.
- Start a small referral plan.

### Month 3: 500 To 1000 Users

- Try to gain GitHub visibility.
- Publish to international technical communities.
- Share early user cases.
- Release advanced local AI review features.
- Improve installer, onboarding, and documentation.

## Monetization

Early stage:

- 0-1000 users: free and open source.
- Goal is trust, feedback, retention, and product-market fit.

Later stage possibilities:

- Paid pro version.
- Advanced templates.
- Advanced analytics.
- Paid one-time license or annual license.
- Optional sync or backup only if it does not break the privacy-first positioning.

Important:

- Cloud backup is not part of the current product direction.
- Any future sync/backup feature must be optional and designed around privacy-first principles.
