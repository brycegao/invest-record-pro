<div align="center">

# Invest Record Pro

**本地隐私投资复盘工具・数据不上云・离线 AI 分析・Windows / Mac 双端支持**

**Local-First Investment Journal | 100% Offline Storage | Local AI Review | Windows & macOS**

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Tauri](https://img.shields.io/badge/Tauri-v2-blue?logo=tauri)](https://tauri.app/)
[![Vue 3](https://img.shields.io/badge/Vue-3-green?logo=vue.js)](https://vuejs.org/)
[![Ollama](https://img.shields.io/badge/Ollama-Local%20AI-orange)](https://ollama.ai/)

<!-- 截图：仪表盘 -->
<img src="docs/images/screenshot-dashboard.png" alt="Dashboard" width="800" />

</div>

---

## ✨ Core Features / 核心特性

| 中文 | English |
|------|---------|
| ✅ **全本地存储**：交易记录、持仓、复盘报告仅保存在本机，零云端上传，杜绝数据泄露 | ✅ **100% Local Storage**: All trade logs, positions and reviews remain on your local device — no cloud transmission |
| ✅ **离线本地 AI**：对接 Ollama 大模型，断网也可完成交易点评、月度复盘、纪律分析 | ✅ **Offline Local AI**: Integrate with Ollama LLMs for trade comments, monthly reports and discipline analysis — no internet required |
| ✅ **专业桌面体验**：表格、可视化图表、快捷键、大屏分析，适配重度使用场景 | ✅ **Professional Desktop**: Rich tables, charts, keyboard shortcuts and large-screen layout for power users |
| ✅ **开源免费**：代码透明可审计，基础功能永久免费使用 | ✅ **Free & Open Source**: Core features permanently free for personal use, source code fully auditable |

### More Features / 更多功能

- 📊 **完整投资闭环** / Full Investment Loop: 标的管理 → 交易计划 → 交易记录 → 仓位统计 → 深度复盘 (Asset management → Trade planning → Recording → Position analysis → Deep review)
- 📏 **纪律量化** / Discipline Tracking: 自动统计「计划执行率」，改善投资行为 (Auto-calculate plan execution rate to improve trading discipline)
- 🔌 **插件化架构** / Plugin Architecture: 模块化设计，支持免费 / 付费功能分离 (Modular design supporting free and paid feature separation)
- 💾 **轻量高性能** / Lightweight & Fast: 安装包 < 15MB，启动秒开 (Installer < 15MB, instant launch)
- 🖥️ **Windows / macOS 双端支持** / Dual Platform Support

## 🎯 Who Is This For? / 适用人群

**中文：**

- 重视数据隐私的个人投资者
- 坚持交易纪律、需要系统化复盘的人
- 喜欢本地 AI、纯端侧工具的技术用户
- 股票 / ETF / 基金 / 可转债交易者

**English:**

- Privacy-conscious individual investors who refuse to upload trading data to the cloud
- Disciplined traders who need systematic post-trade review
- Tech-savvy users interested in local AI and offline-first tools
- Stock, ETF, fund and convertible bond traders

## 📸 Screenshots / 界面预览

| 仪表盘 / Dashboard | 交易记录 / Trade Records | AI 复盘 / AI Review |
|:---:|:---:|:---:|
| <img src="docs/images/screenshot-dashboard.png" alt="Dashboard" width="280" /> | <img src="docs/images/screenshot-trades.png" alt="Trades" width="280" /> | <img src="docs/images/screenshot-review.png" alt="Review" width="280" /> |

> Screenshots are placeholders until the application is built. / 截图为占位图，待应用完成后替换。

## 🛠️ Tech Stack / 技术栈

| Layer | Technology |
|-------|-----------|
| Frontend / 前端 | Vue 3 + TypeScript + Naive UI |
| Desktop / 客户端 | Tauri 2 + Rust |
| Database / 数据库 | SQLite (local file) |
| Local AI / 本地 AI | Ollama |
| Charts / 图表 | ECharts |

## 🚀 Quick Start / 快速开始

### For Developers / 开发者

```bash
# Clone
git clone https://github.com/brycegao/invest-record-pro.git
cd invest-record-pro

# Install dependencies
npm install

# Run in dev mode
npm run tauri dev
```

### For Users / 普通用户

Download the latest installer from [GitHub Releases](https://github.com/brycegao/invest-record-pro/releases).

Supported platforms / 支持平台:
- Windows 10 / 11
- macOS

## 🔓 Open Source vs Pro / 开源版 vs 专业版

| Feature | Free (Open Source) | Pro Plugin |
|---------|:---:|:---:|
| 手动录入 / Manual entry | ✅ | ✅ |
| 单账户 / Single account | ✅ | ✅ |
| 基础统计图表 / Basic charts | ✅ | ✅ |
| 基础 AI 点评 / Basic AI review | ✅ | ✅ |
| 本地手动备份 / Manual backup | ✅ | ✅ |
| CSV/Excel 批量导入 / Bulk import | — | ✅ |
| 多账户管理 / Multi-account | — | ✅ |
| 高级 AI 全量复盘 / Advanced AI review | — | ✅ |
| 月度 / 季度报告 / Monthly & quarterly reports | — | ✅ |
| 高级分析图表 / Advanced analytics | — | ✅ |
| 批量导出 / Batch export | — | ✅ |
| 专业复盘模板库 / Pro template library | — | ✅ |

> Pro features are delivered as optional plugins. / 专业版功能以可选插件形式提供。

## 🏗️ Architecture / 架构

The application follows a modular, feature-first architecture with strict layer dependencies:

```
app → pages → features → services → domain → infrastructure → platform
```

- **Plugin system**: Free core + optional Pro plugins (paid), isolated in private repo
- **Offline-first**: No cloud dependency, all data in local SQLite
- **AI integration**: Local LLM via Ollama, no API keys required

## 📥 Download / 下载安装

[前往 Releases 下载 / Download from Releases](https://github.com/brycegao/invest-record-pro/releases)

## 💬 Community / 社区

- [GitHub Discussions](https://github.com/brycegao/invest-record-pro/discussions) — Feature requests, feedback, Q&A
- [GitHub Issues](https://github.com/brycegao/invest-record-pro/issues) — Bug reports

## 📄 License / 许可证

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

**本地隐私投资复盘工具・数据不上云・离线 AI 分析・Windows / Mac 双端支持**

**Local-First Investment Journal | 100% Offline Storage | Local AI Review | Windows & macOS**

</div>

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
