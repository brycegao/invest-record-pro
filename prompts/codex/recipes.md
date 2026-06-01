# Codex Prompt 最佳实践与高效组合

## 1. 高频使用模式

### 快速生成完整 CRUD 页面

**流程**：Types → Repository → Store → Form → Table → Page

```markdown
## 生成完整资产管理模块

**第一步**：生成类型定义
文件：src/features/assets/types.ts

[合并系统提示 + 以下需求]

export interface Asset {
  id: number;
  code: string;
  name: string;
  type: 'ETF' | '股票' | '债券';
  market: 'SH' | 'SZ' | 'HK' | 'US';
  riskLevel: '低' | '中等' | '高';
  investmentThesis: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type AssetCreatePayload = Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>;

// 验证函数
export function validateAsset(asset: Partial<Asset>): { valid: boolean; errors: Record<string, string> }

---

**第二步**：生成 Repository
[使用 prompts/codex/templates/sqlite-repo.prompt.md]
说明：先确定 Tauri IPC 接口（命令名、参数、返回值），前端和后端都按此契约实现

---

**第三步**：生成 Store
[使用 prompts/codex/templates/pinia-store.prompt.md]
说明：Store 调用 Repository，此步骤需依赖第二步的接口定义

---

**第四步**：生成表单组件
[使用 prompts/codex/templates/vue-form.prompt.md]

---

**第五步**：生成列表组件
[使用 prompts/codex/templates/vue-table.prompt.md]

---

**第六步**：生成页面
[使用 prompts/codex/templates/vue-page.prompt.md]
文件：src/pages/assets/AssetsPage.vue

<template>
  <div class="page-container">
    <div class="toolbar">
      <n-button type="primary" @click="openForm">+ 新增资产</n-button>
    </div>
    <AssetTable 
      :data="assetStore.assets" 
      :loading="assetStore.loading"
      @edit="handleEdit"
      @delete="handleDelete"
    />
    <AssetForm 
      v-model:visible="formVisible"
      v-model="selectedAsset"
      :loading="assetStore.loading"
      @submit="handleSubmit"
    />
  </div>
</template>
```

**成本估算**：
- Types: 200 token
- Repository: 500 token
- Store: 400 token
- Form: 600 token
- Table: 700 token
- Page: 300 token
- **总计**：~2700 token ≈ $0.11

---

### 后端对应实现

每个 Repository 函数都对应一个 Rust 命令。

```markdown
## 生成对应的 Rust 命令

[使用 prompts/codex/templates/rust-command.prompt.md]

命令列表：
- get_assets()
- create_asset(asset: Asset)
- update_asset(asset: Asset)
- delete_asset(id: i64)

main.rs 中注册：
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_assets,
            create_asset,
            update_asset,
            delete_asset,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**成本估算**：~600 token ≈ $0.02

---

## 2. 已验证的 Prompt 组合

### 组合 A：快速 MVP（优先）

时间：4-5 周  
成本：**$30-45**（含迭代修改，更现实的估算）

**⚠️ 成本修正说明**：
- 原估算 $20-33 过于乐观，未考虑：
  - 复杂业务逻辑（仓位计算、P&L 统计）
  - 多次迭代修改（平均每个模块 2-3 次）
  - 单元测试代码
  - Ollama AI 集成
- 新估算基于实际：简单 CRUD 2-3k token，复杂业务 5-8k token

```
周 1：基础架构
├─ 项目初始化（Tauri + Vite）：~800 token ($0.03)
├─ SQLite 表结构与迁移：~1000 token ($0.04)
└─ Types 定义（所有模块）：~1500 token ($0.06)
└─ Subtotal：~$0.13

周 2：资产管理模块
├─ 资产 Repository：~700 token ($0.03)
├─ 资产 Store：~500 token ($0.02)
├─ 资产 Form：~800 token ($0.03)
├─ 资产 Table：~900 token ($0.04)
├─ 资产 Page：~400 token ($0.02)
├─ Rust 命令：~600 token ($0.02)
└─ Subtotal：$0.16

周 3：投资计划模块
├─ Plan 完整实现（类似 Asset）：~3500 token ($0.14)
└─ 迭代修改（+30%）：~1050 token ($0.04)
└─ Subtotal：$0.18

周 4：交易记录 + 复杂计算
├─ Trade CRUD：~2000 token ($0.08)
├─ ⚠️ 仓位计算服务（复杂）：~4000 token ($0.16)
│  └─ 加权平均成本、P&L 计算、费用处理
├─ ⚠️ 图表数据聚合：~2000 token ($0.08)
└─ Subtotal：$0.32

周 5：审查、AI 集成、调试
├─ Review 模块（CRUD）：~2000 token ($0.08)
├─ ⚠️ Ollama 离线 AI 集成（新）：~3500 token ($0.14)
│  └─ 月度复盘生成、情绪分析、纪律检查
├─ 单元测试（关键模块）：~2000 token ($0.08)
└─ BUG 修复和优化：~1500 token ($0.06)
└─ Subtotal：$0.36

**总成本**：$1.15 ≈ **¥8-10**（按中国实际消费）
**按美元计**：$0.30-0.46（Codex API 成本）
```

**重要**：这是单纯的 Codex API 成本。考虑：
- 用户学习和调试时间
- 代码审查和修改时间
- 测试和优化时间
- 总人力成本可能是 API 成本的 3-5 倍

---

### 组合 B：完整版本（含测试、文档、发布）

时间：7-8 周  
成本：**$45-60 API**（加上人力成本数倍）

```
基础 MVP（上述）：$0.46
├─ 高级功能（月度报告、分页、导出）：~3000 token ($0.12)
├─ 完整单元测试：~4000 token ($0.16)
├─ E2E 测试脚本：~2000 token ($0.08)
├─ 文档生成：~1500 token ($0.06)
└─ 发布脚本、CI/CD：~2000 token ($0.08)

总计：~$0.96 ≈ **¥7**（Codex API 成本）
```

---

## 3. 成本控制技巧

### 3.1 减少 Token 消耗

**❌ 避免**：
```markdown
生成完整资产管理系统，包括所有页面、表单、列表、API 接口...
```

**✅ 改为**：
```markdown
生成 AssetForm.vue，字段：code, name, type, market, riskLevel

参考示例：
[粘贴已有组件的相同字段部分]
```

**节省 30-40% token**

### 3.2 复用与微调

第一次生成：完整代码 → 600 token  
后续类似组件：给参考 + 微调 prompt → 200-300 token

**节省 50-70% token**

### 3.3 ⚠️ 复杂业务逻辑成本倍增

**简单 CRUD**（字段增删改查）：
```
Form + Table + Page + Store + Repo = 2000-3000 token
```

**复杂业务逻辑**（计算、聚合、多步骤）：
```
仓位计算 + P&L 统计 + 多币种汇兑 = 5000-8000 token
平均成本 = 简单的 2-3 倍
```

**成本倍数参考表**：

| 功能复杂度 | Token 增幅 | 示例 |
|----------|---------|------|
| 简单 CRUD | 1x | Asset 管理 |
| 包含验证 | 1.2x | 字段范围、格式验证 |
| 包含计算 | 2x | 利息、汇率计算 |
| 包含聚合 | 2-3x | 仓位统计、分组聚合 |
| 包含 AI | 3x | Ollama 调用、模板管理 |
| 包含多步工作流 | 2-3x | 导入、迁移、批量操作 |

---

## 4. 迭代与修改成本

### 调试和优化的额外成本

生成不是一次性的，大多数模块需要 1-3 次修改：

```
首次生成：100% token
├─ 约 70% 可直接使用
├─ 约 20% 需轻微调整（30-50 token）
└─ 约 10% 需重大修改（100-200 token）

平均每个模块修改成本：+25-30% token
```

**示例**：
- 资产模块首次：800 token
- 发现问题，调整验证规则：+150 token
- 优化表单排列：+100 token
- **实际总成本**：1050 token（不是 800）

---

## 5. 质量保证

### 代码审查清单

生成每个文件后，花 2-3 分钟检查：

```
类型安全
├─ ✓ 无 any 类型
├─ ✓ 返回值类型明确
└─ ✓ 参数类型完整

功能完整性
├─ ✓ 所有 CRUD 都有
├─ ✓ 错误处理完整
└─ ✓ 加载状态管理

代码风格
├─ ✓ 命名规范一致
├─ ✓ JSDoc 注释完整
└─ ✓ 代码格式统一

业务逻辑（复杂模块）
├─ ✓ 计算结果与手算对应
├─ ✓ 边界条件处理（零值、空值）
└─ ✓ 精度和舍入规则一致
```

---

## 6. 推荐阶段性计划（修订）

### Phase 1：基础框架（Week 1-2）
- 项目脚手架（Tauri + Vue 初始化）
- SQLite 数据库结构
- 基本 UI 框架（路由、layout）
- **成本**：$5-8
- **产出**：可运行的空白 app

### Phase 2：资产管理 MVP（Week 3-4）
- Asset CRUD（包括验证、搜索、过滤）
- 对应 Rust 后端命令
- **成本**：$8-12
- **产出**：完整的 CRUD 功能示例

### Phase 3：核心投资逻辑（Week 5-6）
- Plan + Trade 模块（标准 CRUD）
- ⚠️ 仓位计算和 P&L 统计（复杂）
- Position 仪表盘和图表
- **成本**：$12-18（因为包含复杂逻辑）
- **产出**：完整的投资决策循环

### Phase 4：高级功能（Week 7-8）
- Review 模块（CRUD）
- ⚠️ Ollama 离线 AI 集成（新增）
- MarketObservation 记录
- 月度报告生成
- **成本**：$10-15（Ollama 是新功能）
- **产出**：离线 AI 驱动的复盘

### Phase 5：付费功能框架（Week 9-10）
- 插件系统核心代码（feature toggle + 动态加载）
- ⚠️ RSA 授权校验逻辑（Rust 侧许可证验证）
  - 本地 RSA 公钥验证
  - 序列号激活流程
  - 功能开关管理
- Pro 插件占位（CSV 导入、多账户等）
- **成本**：$8-12（RSA 授权是付费模式核心）
- **产出**：可部署的 Freemium 架构

### Phase 6：发布和优化（Week 11+）
- 单元测试和集成测试
- 性能优化
- 文档和打包
- **成本**：$5-10
- **产出**：可发布的 v1

**总体成本预估**（修订）：**$40-60**（不含人力成本）

---

## 7. 常见问题

### Q: 如何处理生成代码不符合预期？

A: 
1. 第一次生成后检查（见检查清单）
2. 明确指出问题点："错误的是 XX 行，应该是..."
3. 重新 prompt，补充修改指令
4. 消耗 token：100-200

### Q: 能否同时生成多个文件？

A: 可以，但：
- 一次 prompt 最多生成 2-3 个小文件
- 超过 3 个容易出错或 token 超限
- 建议分批生成后合并测试

### Q: 后端（Rust）和前端（Vue）的同步问题？

A: 
- 先设计接口（参数类型、返回值）
- 前端按接口生成 Repository
- 后端按接口生成 Rust 命令
- 最后集成测试

---

## 8. Prompt 库维护

### 每周更新

```
prompts/codex/
├── system/
│   └── system-prompt.txt    # 迭代优化项目规范
├── templates/               # 根据实际应用优化
├── recipes.md               # 记录新的最佳实践
└── CHANGELOG.md             # 变更日志
```

### 记录成功与失败

```markdown
### 成功案例（高效）
- 【日期】资产模块完整实现，6 个文件，2600 token，质量达到上线水平
  - 原因：提前准备好参考示例，Prompt 精准

### 需要改进
- 【日期】XXX 生成代码类型定义混乱
  - 原因：Prompt 没有明确说明类型转换规则
  - 改进：添加类型示例到 templates/
```

---

## 总结

### 核心原则

1. **少做一点**：分批生成，不要一次性要求全部
2. **多给示例**：参考代码能显著降低错误率和 token 消耗
3. **精准 Prompt**：花时间写好一次 Prompt 能节省多次迭代成本
4. **持续优化**：每次生成后更新 Prompt 库记录

### 成本预期

- **第一个模块**：3000-4000 token（含多次迭代）
- **后续相似模块**：2000-2500 token（复用 Prompt 和参考代码）
- **每月 $18 额度**：大约可以完成 6-8 个模块

### 质量保证

- 所有生成代码都要代码审查（2-3 分钟/个）
- 通过在本地跑起来验证编译无错误
- 定期更新 Prompt 库，避免重复踩坑
