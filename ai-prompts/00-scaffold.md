# Batch 0：初始化项目脚手架

你是一个 TypeScript / Vue 3 / Rust 代码生成专家，为 invest-record-pro 项目提供高质量代码。

## 项目背景

- **项目名称**：invest-record-pro
- **产品定位**：个人投资决策记录与复盘系统
- **部署模式**：纯单机桌面应用（Tauri），所有数据存储在本地 SQLite，AI 能力依赖本地 Ollama，不涉及任何网络请求或云端服务
- **目标用户**：有投资纪律需求的散户投资者

## 任务

基于 Tauri 2 + Vue 3 + TypeScript + Vite 初始化桌面项目脚手架。

## 技术栈

- Tauri 2（最新稳定版）
- Vue 3（Composition API + `<script setup>`）
- TypeScript（strict: true）
- Vite（打包工具）
- Pinia（状态管理）
- Vue Router（路由）
- Naive UI（组件库）
- ECharts（图表）

## 执行步骤

### 1. 项目初始化

使用 `npm create tauri-app` 初始化项目，选择 Vue + TS 模板。项目根目录为当前工作目录。

### 2. 安装依赖

```
pinia, vue-router, naive-ui, echarts, echarts-vue, @tauri-apps/api
```

### 3. 创建目录结构

```
src/
├── app/
│   ├── App.vue
│   ├── main.ts
│   ├── router/
│   │   └── index.ts
│   ├── providers/
│   │   └── AppProvider.vue
│   └── layout/
│       ├── MainLayout.vue
│       └── components/
│           └── SideNav.vue
├── pages/
│   ├── dashboard/
│   │   └── DashboardPage.vue
│   ├── assets/
│   │   └── AssetsPage.vue
│   ├── plans/
│   │   └── PlansPage.vue
│   ├── trades/
│   │   └── TradesPage.vue
│   ├── positions/
│   │   └── PositionsPage.vue
│   ├── reviews/
│   │   └── ReviewsPage.vue
│   ├── market-observations/
│   │   └── MarketObservationsPage.vue
│   ├── monthly-reports/
│   │   └── MonthlyReportsPage.vue
│   └── settings/
│       └── SettingsPage.vue
├── features/          (空目录占位)
├── services/          (空目录占位)
├── domain/
│   └── types/         (空目录占位)
├── infrastructure/    (空目录占位)
├── shared/
│   └── utils/        (空目录占位)
└── platform/         (空目录占位)
```

### 4. 配置文件

**tsconfig.json**：
- `strict: true`
- 路径别名：`"@/*"` → `"./src/*"`

**vite.config.ts**：
- 配置 `@` 别名
- Naive UI 按需引入（使用 unplugin-vue-components + unplugin-auto-import 或手动按需）

**env.d.ts**：
- 声明 `*.vue` 模块类型

### 5. 入口文件

**src/main.ts**：
- 创建 Vue app
- 注册 Pinia
- 注册 Vue Router
- 挂载 AppProvider（Naive UI NConfigProvider）
- 挂载到 `#app`

**src/app/App.vue**：
- 仅包含 `<router-view />`

**src/app/providers/AppProvider.vue**：
- 使用 Naive UI 的 `NConfigProvider`、`NMessageProvider`、`NDialogProvider`、`NNotificationProvider`
- 配置全局 `locale` 为 `zhCN`（naive-ui 的中文语言包）
- 配置全局 `theme`（浅色为默认）

### 6. 路由配置

**src/app/router/index.ts**：

```ts
const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/dashboard', name: 'dashboard', component: DashboardPage, meta: { title: '仪表盘' } },
  { path: '/assets', name: 'assets', component: AssetsPage, meta: { title: '投资标的' } },
  { path: '/plans', name: 'plans', component: PlansPage, meta: { title: '交易计划' } },
  { path: '/trades', name: 'trades', component: TradesPage, meta: { title: '交易记录' } },
  { path: '/positions', name: 'positions', component: PositionsPage, meta: { title: '仓位快照' } },
  { path: '/reviews', name: 'reviews', component: ReviewsPage, meta: { title: '交易复盘' } },
  { path: '/market-observations', name: 'market-observations', component: MarketObservationsPage, meta: { title: '市场观察' } },
  { path: '/monthly-reports', name: 'monthly-reports', component: MonthlyReportsPage, meta: { title: '月度报告' } },
  { path: '/settings', name: 'settings', component: SettingsPage, meta: { title: '设置' } },
]
```

### 7. 主布局

**src/app/layout/MainLayout.vue**：

使用 Naive UI 的 `n-layout` + `n-layout-header` + `n-layout-sider` + `n-layout-content`：

```
┌──────────────────────────────────────────────────┐
│ 顶部导航栏（48px，n-layout-header）              │
│   左：Logo 图标 + "Invest Record Pro"            │
│   右：主题切换(n-switch) / 备份按钮 / 关于按钮    │
├────────────┬─────────────────────────────────────┤
│ 左侧导航   │ 右侧主内容区                         │
│ 固定 220px │   <router-view />                    │
│ n-menu     │                                     │
└────────────┴─────────────────────────────────────┘
```

- 顶部导航栏高度 48px
- 左侧导航固定 220px
- `n-layout-sider` 设置 `:width="220"` `:collapsed-width="0"`（暂不实现折叠）
- `n-layout-content` 内部用 `n-card` 包裹 `<router-view />`，带 padding

**src/app/layout/components/SideNav.vue**：

使用 `n-menu`，菜单项：

```ts
const menuOptions = [
  { label: '仪表盘', key: 'dashboard' },
  { label: '投资标的', key: 'assets' },
  { label: '交易计划', key: 'plans' },
  { label: '交易记录', key: 'trades' },
  { label: '仓位快照', key: 'positions' },
  { label: '交易复盘', key: 'reviews' },
  { label: '市场观察', key: 'market-observations' },
  { label: '月度报告', key: 'monthly-reports' },
  { label: '设置', key: 'settings' },
]
```

- 当前路由高亮（通过 `router.currentRoute.value.path` 匹配 `key`）
- 点击菜单项使用 `router.push`

### 8. 页面占位组件

每个 Page 组件（共 9 个）暂时只显示页面标题，如：

```vue
<template>
  <div>
    <h1>仪表盘</h1>
  </div>
</template>
```

## 代码风格要求

- TypeScript `strict: true`，禁止 any 类型
- 使用 `<script setup>` 语法
- 使用 `@` 路径别名，不用相对路径
- CSS 使用 `scoped`
- 组件用 `PascalCase`，文件名用 `PascalCase.vue`
- 单文件不超 1000 行

## 禁止事项

- 不要使用 any 类型
- 不要创建任何业务逻辑代码（只搭骨架）
- 不要连接数据库
- 不要引入 ECharts（后续批次再引入）

## 验证

完成后 `npm run dev` 应能看到：
- 左侧导航菜单
- 点击菜单项切换页面
- 每个页面显示对应标题
