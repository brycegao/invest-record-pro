# 文档索引

> 本目录包含 invest-record-pro 的全部设计文档、技术规范和业务规则。每个文档有明确职责，互不重叠。

## 文档清单

| 文件 | 职责 | 读者 |
|------|------|------|
| [README.md](../README.md) | 项目门面。产品定位、核心特性、技术栈、功能列表、下载安装。面向 GitHub 访问者和新用户。 | 所有人 |
| [PROJECT_CONTEXT.md](../PROJECT_CONTEXT.md) | 项目全局上下文。用户背景、产品方向、候选需求、MVP 范围、已决策项、待决策项。是 AI 协作和新人 onboarding 的入口。 | AI 助手、新成员 |
| [ui-spec.md](ui-spec.md) | v1 UI 交互规范。9 个页面的文字线框、布局、Naive UI 组件映射、状态配色、表单校验规则、交互铁律。前端开发的视觉依据。 | 前端工程师 |
| [database-schema.md](database-schema.md) | 数据库设计。10 张表的 SQL DDL、ER 关系、存储规则（INTEGER 标度）、精度转换示例、迁移策略。后端和前端的共享数据契约。 | 前端/后端工程师 |
| [business-rules-v1.md](business-rules-v1.md) | v1 业务规则。数值精度、盈亏计算公式、加权平均成本、计划状态流转、情绪枚举、交易校验、导入导出边界。实现和测试的权威参考。 | 全栈工程师、QA |
| [architecture.md](architecture.md) | 架构设计。特性模块划分、垂直依赖层级、模块边界规则（禁止互相导入）、跨模块数据访问模式、目录结构。所有层级的工程师都需遵守。 | 全栈工程师 |
| [technical-solution.md](technical-solution.md) | 技术方案。MVP 技术栈、架构概览、层职责定义、SQLite 规划、Ollama 集成、模块边界规则、跨模块调用链示例、测试策略、开发顺序。技术决策的细化执行文档。 | 全栈工程师 |
| [tech-decision.md](tech-decision.md) | 技术选型决策。最终栈选择理由（Tauri/Naive UI/SQLite/Ollama）、非目标清单、AI 边界、Ollama 健康检查与超时策略、已知风险。回答"为什么选这些技术"。 | 技术负责人 |
| [acceptance-criteria-v1.md](acceptance-criteria-v1.md) | v1 验收标准。分 MVP Core Gate 和 v1 Release Gate 两阶段，覆盖定位合规、架构、每个功能模块、AI、数据库、工程化。可逐项打勾的 pass/fail 清单。 | QA、产品负责人 |
| [go-to-market.md](go-to-market.md) | 上市计划。产品定位、双语标语、GitHub 双仓策略、国内外社区运营、内容边界、3 个月排期、风险红线、商业化路线。 | 产品负责人 |
| [market-analysis.md](market-analysis.md) | 市场分析。市场需求、用户痛点、竞争格局（券商/记账/交易日记工具）、核心差异化（隐私/闭环/AI/本土化）、风险、商业化可能。战略参考。 | 产品负责人 |
| [platform-posting-templates.md](platform-posting-templates.md) | 各平台发帖文案合集。知乎、V2EX、掘金、雪球、B 站、Reddit、HN、Indie Hackers 的标准模板 + 排期建议。 | 运营、产品负责人 |
| [landing/index.html](landing/index.html) | 官网单页 HTML 模板。GitHub Pages 直接部署，包含 Hero、功能特性、对比表、FAQ。 | 产品负责人 |

## 文档关系

```text
PROJECT_CONTEXT.md          ← 全局上下文入口
  ├─→ tech-decision.md     ← 选型理由
  ├─→ technical-solution.md ← 技术执行方案（依赖 tech-decision）
  ├─→ architecture.md      ← 架构规则（被 technical-solution 引用）
  ├─→ database-schema.md   ← 数据契约（被所有工程文档引用）
  ├─→ business-rules-v1.md ← 业务规则（被 database / ui-spec / acceptance 引用）
  ├─→ ui-spec.md           ← UI 规范（引用 database-schema 的标度规则）
  ├─→ acceptance-criteria-v1.md ← 验收清单（引用 business-rules / architecture）
  ├─→ go-to-market.md      ← GTM（独立于技术文档）
  └─→ market-analysis.md    ← 市场分析（独立于技术文档）

README.md                   ← 面向外部用户，独立于内部文档体系
```

## 修改原则

1. **单源真相**：每个知识点只在一个文档中定义，其他文档引用它。
2. **变更传播**：修改数据库字段时，同步检查 `database-schema.md` → `ui-spec.md` → `business-rules-v1.md` → `acceptance-criteria-v1.md`。
3. **枚举统一**：状态值（pending/partial/completed/canceled）、类型（buy/sell）、情绪（calm/anxious/...）等枚举在 `business-rules-v1.md` 中定义，所有文档保持一致。
4. **标度统一**：精度标度表在 `database-schema.md` 中定义，`business-rules-v1.md` 和 `ui-spec.md` 引用它。
