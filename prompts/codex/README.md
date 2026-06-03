# Codex Prompt Library for invest-record-pro

本库提供了为 invest-record-pro 项目优化的 Codex AI 代码生成 prompt 集合。

## 快速开始

### 安装和配置

```bash
# 进入 prompts/codex 目录
cd prompts/codex

# 给脚本执行权限
chmod +x merge-prompts.sh

# 查看帮助
./merge-prompts.sh -h
```

### 一键生成

```bash
# 生成资产表单组件
./merge-prompts.sh vue-form "生成资产管理表单，字段：代码、名称、类型、市场、风险等级"

# 生成完整 CRUD 模块（Form + Table + Page + Store + Repository）
./merge-prompts.sh full-crud "生成资产完整 CRUD 模块"

# 生成 Ollama AI 离线集成（新）
./merge-prompts.sh ollama-integration "生成月度复盘报告生成功能"

# 生成 Rust 后端命令
./merge-prompts.sh rust-main "生成资产管理的 Rust 命令注册"
```

**输出**：生成的 prompt 会：
- 打印到终端（可复制到 Codex）
- 保存到 `merged-prompt.txt`（备查）

## 文件结构说明

```
prompts/codex/
├── README.md                        # 本文件
├── CHANGELOG.md                     # 版本历史
├── merge-prompts.sh                 # 🆕 一键合并脚本
│
├── system/
│   └── system-prompt.txt            # 通用系统提示词（所有生成都需要）
│
├── templates/
│   ├── vue-form.prompt.md           # Vue 表单组件生成模板
│   ├── vue-table.prompt.md          # Vue 表格组件生成模板
│   ├── vue-page.prompt.md           # 🆕 Vue 页面（组件组装）生成模板
│   ├── pinia-store.prompt.md        # Pinia store 生成模板（已升级为 Composition API）
│   ├── sqlite-repo.prompt.md        # SQLite repository 生成模板
│   ├── rust-command.prompt.md       # 单个 Rust 命令生成模板
│   └── rust-main.prompt.md          # 🆕 Rust 命令注册和 main.rs 集成模板
│   └── ollama-integration.prompt.md # 🆕 Ollama 离线 AI 集成模板（核心卖点）
│
├── examples/
│   ├── asset-form.example.vue       # 资产表单参考示例（已修复 `as any`）
│   └── asset-store.example.ts       # Store 参考示例（已升级为 Composition API）
│
└── recipes.md                       # 已验证的最佳 prompt 组合和成本估算
```

## 使用流程

### 方式一：使用自动化脚本（推荐）

```bash
./merge-prompts.sh <template> "具体需求"
```

**模板选项**：
- `vue-form` - 表单组件
- `vue-table` - 表格组件
- `vue-page` - 完整页面（新）
- `pinia-store` - Store 状态管理
- `sqlite-repo` - 数据库操作层
- `rust-command` - 单个 Rust 命令
- `rust-main` - Rust 命令注册（新）
- `ollama-integration` - Ollama AI 集成（新）
- `full-crud` - 完整 CRUD（Form + Table + Page + Store + Repo）
- `full-module` - 完整模块（含 Rust 命令）

### 方式二：手动合并（传统方法）

```bash
# 1. 合并系统 prompt + 模板 + 具体需求
cat system/system-prompt.txt > my_prompt.txt
cat templates/vue-form.prompt.md >> my_prompt.txt
echo "## 您的具体需求" >> my_prompt.txt
echo "生成资产表单..." >> my_prompt.txt

# 2. 复制内容到 Codex 或 API 调用
cat my_prompt.txt | pbcopy  # macOS
```

## 成本估算（修订版）

### 简单 CRUD 模块

| 模块 | Token | 成本 | 说明 |
|------|-------|------|------|
| 类型定义 | 200-300 | $0.01 | interface + enums |
| Repository | 600-800 | $0.03 | 数据库操作 |
| Store | 400-600 | $0.02 | 状态管理 |
| 表单组件 | 600-900 | $0.04 | 输入和验证 |
| 表格组件 | 800-1200 | $0.05 | 显示和操作 |
| 页面组件 | 300-500 | $0.02 | 组装和路由 |
| Rust 命令 | 600-900 | $0.04 | 后端接口 |
| **小计** | **3500-5300** | **~$0.21** | 1 个完整模块 |

### 复杂业务逻辑（成本倍增）

| 功能 | Token 倍数 | 示例 |
|------|----------|------|
| 包含验证 | 1.2x | 字段范围、格式检查 |
| 包含计算 | 2x | 利息、汇率、P&L 计算 |
| 包含聚合 | 2-3x | 仓位统计、月度汇总 |
| 包含 AI 集成 | 3-4x | Ollama 调用、prompt 管理 |

### 项目全部成本（现实估算）

| 阶段 | 内容 | Token | 成本 | 备注 |
|------|------|-------|------|------|
| Phase 1 | 基础框架 | 3000-4000 | $0.12 | 项目初始化、数据库结构 |
| Phase 2 | 资产管理 MVP | 3500-5000 | $0.18 | 标准 CRUD 示例 |
| Phase 3 | 核心逻辑 | 6000-8000 | $0.28 | 含复杂计算（仓位、P&L） |
| Phase 4 | AI 集成 | 4000-5000 | $0.18 | Ollama 离线复盘 |
| Phase 5 | 测试和优化 | 3000-4000 | $0.14 | 单元测试、BUG 修复 |
| **总计** | **完整 MVP** | **19500-26000** | **$0.90** | 不含迭代修改 |

**重要说明**：
- ✅ 上表为 Codex API 实际成本（美金）
- ⚠️ 实际总成本 = API 成本 + 人力成本（3-5 倍）
- 💡 迭代修改会额外增加 20-40% token 消耗
- 🎯 总人力投入约 4-6 周达到 MVP 发布

## 质量控制

### 生成前的准备

1. **阅读系统 prompt**：了解项目约束和风格要求
2. **阅读目标模板**：理解结构和输入输出格式
3. **参考示例代码**：参考已有实现的风格

### 生成时的配置

```
推荐设置：
- Temperature: 0.2（低随机性，确保代码一致）
- Top P: 0.9
- Token Limit: 根据模板调整（见表格）
```

### 生成后的检查清单

```
类型安全
☐ 无 `any` 类型
☐ 返回值类型明确
☐ 参数类型完整

功能完整性
☐ 所有 CRUD 操作都有
☐ 错误处理完整（try-catch 或 ?.map_err()）
☐ 加载和错误状态管理

代码风格
☐ 命名规范一致（camelCase / snake_case）
☐ JSDoc / 注释完整
☐ 代码缩进和格式统一

业务逻辑（复杂模块）
☐ 计算结果与手算验证一致
☐ 边界条件处理（零值、空值、负数）
☐ 精度和舍入规则正确
```

## 最佳实践

### 1. 快速迭代

**第一轮**：生成完整代码框架（600-1000 token）  
**第二轮**：修复特定问题（100-200 token）  
**第三轮**：优化和调整（100-200 token）

平均每个模块的实际成本 = 基础 token × 1.3-1.5

### 2. 参考示例的威力

- **无参考示例**：800 token，质量 70%
- **有参考示例**：400 token，质量 90%

结论：提供参考示例可以节省 50% token 且提升质量。

### 3. 分解复杂需求

❌ 一次性需求：
```
生成整个投资系统，包括资产、计划、交易、复盘、AI...
```

✅ 分解为多个 prompt：
```
1. 生成资产 CRUD
2. 生成计划管理
3. 生成交易记录和仓位计算
4. 生成复盘和 AI 集成
```

成本：第一种 = 8000+ token（失败率高），第二种 = 5-6 × 2000 token = 10000（成功率更高）

## 新增特性（v1.1）

### ✅ 已修复

- [x] 示例代码的 `as any` 问题（asset-form.example.vue）
- [x] Store 升级到 Composition API（asset-store.example.ts）
- [x] 添加 vue-page 模板（页面组装）
- [x] 添加 rust-main 模板（命令注册）
- [x] 添加 ollama-integration 模板（离线 AI）
- [x] 创建 merge-prompts.sh 自动化脚本
- [x] 更新成本估算（更加保守和现实）

### 📋 未来改进

- [ ] 根据实际生成结果优化 prompt
- [ ] 添加更多参考示例（Plan, Trade, Position 等）
- [ ] 补充常见问题和解决方案库
- [ ] 集成自动化测试生成（unit tests）
- [ ] 创建 GitHub Actions 集成脚本

## 常见问题

### Q: 脚本在 Windows 上不工作？

A: 脚本是 bash 格式，Windows 用户需要：
- 使用 WSL 2（Windows Subsystem for Linux）
- 或使用 Git Bash
- 或手动合并（见方式二）

### Q: 如何快速生成多个模块？

A: 
```bash
for module in Asset Plan Trade; do
  ./merge-prompts.sh full-crud "生成 $module 完整 CRUD 模块" > merged_$module.txt
done
```

### Q: 生成的代码质量参差不齐？

A:
1. 检查是否包含了 system-prompt.txt
2. 增加参考示例（复制相似代码到 prompt 中）
3. 降低 temperature（改为 0.1-0.15）
4. 分割成更小的请求

## 相关文档

- [recipes.md](./recipes.md) - 最佳实践和已验证的 prompt 组合
- [system/system-prompt.txt](./system/system-prompt.txt) - 系统规则和约束
- [CHANGELOG.md](./CHANGELOG.md) - 版本历史和改进记录

## 许可证

本 Prompt 库为项目内部工具，遵循项目主体许可证。

---

**最后更新**：2026-06-01  
**版本**：v1.1（大幅改进）  
**维护者**：Gao Rui  
**状态**：✅ 稳定可用，持续优化中
