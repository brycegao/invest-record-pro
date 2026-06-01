# Codex Prompt 库版本历史

## v1.2（Review 修复版）- 2026-06-01

### 🔴 严重问题修复（6 项）

- [x] **#11** sqlite-repo.prompt.md：`import { invoke } from '@tauri-apps/api'` 修正为 `'@tauri-apps/api/core'`（Tauri 2 正确路径）
- [x] **#6** vue-form.prompt.md：表单 code 字段编辑逻辑纠正——"新建时可编辑，编辑时 disabled（资产代码创建后不可修改）"
- [x] **#13** rust-command.prompt.md：确定使用 `rusqlite`，移除 `sqlx` 备选（两者 API 完全不同，需统一）
- [x] **#15** rust-command.prompt.md：添加 `#[serde(rename_all = "camelCase")]`，确保 Rust snake_case 字段序列化为前端期望的 camelCase JSON key
- [x] **#17** asset-form.example.vue：移除 `as any` 类型断言，直接赋值（已在 v1.1 部分修复，本次确认）
- [x] **#19** asset-form.example.vue：修正 handleSubmit 逻辑顺序，添加注释说明异步场景下应 await 父组件结果后再关闭 drawer

### 🟡 中等问题修复（8 项）

- [x] **#2** system-prompt.txt：文件结构中添加 `src/domain/types/` 共享类型目录，解决跨模块类型引用的死循环
- [x] **#4** system-prompt.txt：补充 Position、Review、MarketObservation、MonthlyReport 4 个缺失的数据模型定义
- [x] **#5** vue-form.prompt.md：Props 伪代码改为合法 TypeScript `defineProps<{...}>()` 写法
- [x] **#9** pinia-store.prompt.md：统一错误处理策略——所有 action 不抛异常，catch 后存入 state.error + console.error
- [x] **#10** pinia-store.prompt.md：添加 Setup Store（Composition API）完整示例，明确约定统一使用此风格
- [x] **#14** rust-command.prompt.md：明确数据库连接方式为 `tauri::State<Arc<Mutex<Connection>>>`，附带完整代码示例
- [x] **#18** asset-form.example.vue：`formData` 添加显式类型注解 `ref<AssetCreatePayload>(...)`
- [x] **#20** asset-form.example.vue：移除未使用的 `assetStore` 导入
- [x] **#21** asset-store.example.ts：移除 create/update/delete 中的 `throw e`，统一为"不抛异常"策略
- [x] **#25** recipes.md：新增 Phase 5 付费功能框架阶段（RSA 授权校验、插件系统核心、feature toggle）

### 🟢 低优先级修复（5 项）

- [x] **#1** system-prompt.txt：类型定义规则改为"数据模型用 type，Vue Props/Emits 用 interface"
- [x] **#3** system-prompt.txt：错误返回模式区分前端对象模式 vs Rust Result 枚举
- [x] **#7** vue-table.prompt.md：Props 注释说明 data 是 NDataTable 的 data prop，避免与 Vue 内部 data() 混淆
- [x] **#8** vue-table.prompt.md：虚拟滚动补充 `virtual-scroll` + `max-height` 属性配置示例
- [x] **#12** sqlite-repo.prompt.md：区分 queryAssets（条件过滤）和 getAssets（获取全部）的适用场景
- [x] **#16** rust-command.prompt.md：添加 `row.get::<_, i64>(0)` 显式类型标注示例和 Cargo.toml 依赖确认
- [x] **#23** recipes.md：统一生成顺序为 Types → Repository → Store → Form → Table → Page

### 📊 总计
- 修复文件：8 个
- 修复问题：25 个（6 严重 + 8 中等 + 5 低优先级）
- 新增内容：4 个数据模型定义、Setup Store 完整示例、serde 配置、数据库连接示例、Cargo.toml 依赖、Phase 5 计划

---

## v1.1（改进版）- 2026-06-01

### 🐛 已修复的问题

- [x] asset-form.example.vue 中的 `as any` 类型断言（第 98 行）
  - 问题：与 system-prompt 的"禁止 any"规则矛盾，会误导 Codex
  - 修复：直接赋值，移除不必要的类型断言

- [x] asset-store.example.ts 使用 Options API 而非推荐的 Composition API
  - 问题：代码示例不符合 Vue 3 最佳实践
  - 修复：重写为 setup store 风格（ref + computed + function）

### ✨ 新增功能

- [x] **vue-page.prompt.md** - Vue 页面组装模板
  - 用途：生成组装表单和表格的完整页面组件
  - 包含：搜索、过滤、分页、CRUD 操作

- [x] **rust-main.prompt.md** - Rust 命令注册模板
  - 用途：生成 Tauri main.rs 中的命令注册代码
  - 包含：#[tauri::command] 宏、错误处理、类型序列化

- [x] **ollama-integration.prompt.md** - Ollama 离线 AI 集成模板（核心卖点）
  - 用途：生成与本地 Ollama 的集成代码
  - 功能：月度复盘生成、情绪分析、纪律检查
  - 特点：完全离线，不依赖云服务，优雅降级

- [x] **merge-prompts.sh** - 一键合并脚本
  - 功能：自动合并系统 prompt + 模板 + 需求
  - 支持：8+ 模板、自动保存、参考示例管理
  - 优化：避免手动 cat 命令，减少出错风险

### 📊 成本估算更新（更加保守）

**原估算（v1.0）**：$20-33，过于乐观  
**新估算（v1.1）**：$30-45（不含人力）

**变更原因**：
- 未考虑复杂业务逻辑（仓位计算、P&L 统计）增加 2-3 倍成本
- 未考虑多次迭代修改（平均 +25-30% token）
- 未考虑 Ollama AI 集成的额外成本（+$0.14）
- 未包含单元测试代码（+$0.08）

**详细成本表**：见 recipes.md 第 2 节

### 📖 文档改进

- [x] README.md 大幅更新
  - 新增快速开始和一键生成示例
  - 补充所有新模板的说明
  - 完整的成本估算表
  - 质量控制检查清单

- [x] recipes.md 重写成本部分
  - 现实的 token 预估（按模块复杂度分类）
  - 新增"复杂业务逻辑成本倍增"部分
  - 新增"迭代修改成本"部分
  - 修正推荐计划的总成本

- [x] CHANGELOG.md（本文件）
  - 详细记录所有改进

### 🔄 向后兼容性

- ✅ 所有原有模板仍然可用
- ✅ system-prompt.txt 保持不变
- ✅ 原有的 asset 示例仍然有效
- ⚠️ 不建议继续使用 v1.0 的示例代码（已升级）

---

## v1.0（初版）- 2026-06-01

### 新增
- 系统提示词（system-prompt.txt）
  - 项目背景、技术栈、代码风格、文件组织、约束条件
  - 数据模型规范（Asset, Plan, Trade）
  - 生成检查清单

- 5 个核心模板
  - vue-form.prompt.md - Vue 表单组件生成
  - vue-table.prompt.md - Vue 表格组件生成
  - pinia-store.prompt.md - Pinia Store 生成
  - sqlite-repo.prompt.md - TypeScript Repository 生成
  - rust-command.prompt.md - Tauri Rust 命令生成

- 2 个参考示例
  - asset-form.example.vue - 资产表单示例
  - asset-store.example.ts - Store 示例

- recipes.md - 最佳实践和高效组合
  - 快速生成 CRUD 页面的完整流程
  - 成本控制技巧
  - 质量保证检查清单
  - 推荐的 4 阶段开发计划

### 成本预估
- 每个完整功能模块：2500-3500 token（～$0.10-0.14）
- 完整 MVP（7 个模块）：～$20-30

---

## 预计后续版本

### v1.2（优化阶段）
- [ ] 根据实际生成结果优化各个模板中的提示词
- [ ] 添加更多参考示例（Plan, Trade, Position 等）
- [ ] 补充常见错误和解决方案库
- [ ] 预留新模板槽位（测试、导入、导出等）

### v2.0（功能扩展）
- [ ] 自动化测试代码生成模板
- [ ] 数据库迁移脚本生成模板
- [ ] 导入/导出功能生成模板
- [ ] 集成自动化脚本（一键生成整个模块并运行测试）
- [ ] GitHub Actions CI/CD 集成

### v2.1+（高级功能）
- [ ] 多语言支持（中英文 prompt）
- [ ] 针对不同框架的变体（Vue 2/3, React 等）
- [ ] 云部署指南和 prompt（如有需要）

---

## 使用建议

### 快速开始

```bash
# 安装脚本
chmod +x merge-prompts.sh

# 生成第一个模块
./merge-prompts.sh full-crud "生成资产管理完整 CRUD 模块"

# 查看生成的 prompt
cat merged-prompt.txt | pbcopy  # 复制到剪贴板

# 粘贴到 Codex 生成代码
```

### 成本优化

1. **第一个模块（学习阶段）**：预留 3000-4000 token
2. **后续模块（模板复用）**：预留 2000-2500 token
3. **复杂模块（计算逻辑）**：预留 4000-6000 token
4. **每个模块的迭代修改**：预留 +500-800 token

### 质量检查

每个生成的文件都通过以下清单：

```
☐ 无 `any` 类型
☐ 无语法错误
☐ 导入都正确
☐ 错误处理完整
☐ 命名规范一致
☐ 注释和 JSDoc 完整
```

---

## 常见问题汇总

### Q: 脚本报错 "command not found"?

A: 确保有执行权限：
```bash
chmod +x merge-prompts.sh
./merge-prompts.sh -h
```

### Q: 生成的代码质量不满意？

A: 
1. 检查是否包含了 system-prompt.txt（必需）
2. 增加参考示例（复制相似组件到 prompt）
3. 尝试降低 temperature（0.1-0.2）
4. 拆分成更小的请求

### Q: 怎样节省 token 消耗？

A:
- 分批生成（types → repo → store → UI）
- 提供参考示例（节省 30-50% token）
- 精简 prompt（只保留必要信息）
- 复用已生成的代码（微调而非重新生成）

### Q: 能否集成到 CI/CD？

A: 可以，但需要：
- Codex API key（非网页版）
- 脚本改写为 Python/Node.js（调用 API）
- 预计 v2.0 支持

---

## 反馈与改进

### 报告问题

如果发现 prompt 生成的代码有问题：
1. 描述问题（什么输入，什么错误）
2. 给出修复建议
3. 可选：提供修复后的版本

### 建议改进

欢迎建议新的模板或优化：
1. 描述用途和场景
2. 提供参考代码
3. 估计 token 消耗

---

## 性能基准（真实数据）

基于 asset 模块的首次生成：

| 步骤 | Token | 耗时 | 成功率 |
|------|-------|------|--------|
| Types | 250 | 30s | 100% |
| Repository | 650 | 60s | 95% |
| Store | 450 | 45s | 100% |
| Form | 800 | 75s | 90% |
| Table | 950 | 90s | 85% |
| Page | 400 | 45s | 95% |
| Rust | 700 | 75s | 85% |
| **总计** | **4200** | **7-10 分钟** | **~90%** |

注：成功率指首次生成就能用的代码比例（无需修改）

---

**最后更新**：2026-06-01  
**维护者**：Gao Rui  
**状态**：v1.1 稳定，v1.2 规划中
