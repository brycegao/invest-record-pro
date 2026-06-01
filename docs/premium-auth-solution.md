# 付费内容鉴权技术方案

## 1. 方案目标

本方案面向 `Tauri2 + Vue3 + TS` 桌面应用，要求：

- 主工程完全开源，仅包含基础功能、插件加载框架、功能开关与 UI 主体。
- 付费插件独立闭源，编译为独立产物，不提交到公开仓库。
- 双层开关控制：运行时检测插件存在性、授权开关校验序列号。
- 分层防护：前端负责入口显隐、后端 Rust 层做最终权限拦截，防止前端篡改。
- 适配开源 + 闭源分离、小而美运营模式。

## 2. 核心规则

- 主工程可公开发布，`plugins/` 目录和私密密钥不纳入 Git 管理。
- 付费能力由插件提供。
- 前端做“展示控制”，后端做“权限最终判定”。
- 只有插件存在且授权校验通过时，付费功能才可真正启用。

## 3. 最终目录结构（建议）

```text
invest-record-pro/          # 公开主仓库（开源）
├── src/
│   ├── src-tauri/          # Tauri 核心(Rust)，权限校验、文件读取、底层拦截
│   │   ├── src/
│   │   │   ├── license/    # 开源：授权校验逻辑（仅公钥、本地校验）
│   │   │   ├── plugin_loader.rs # 开源：插件加载器
│   │   │   └── main.rs
│   │   └── tauri.conf.json
│   ├── views/              # 页面
│   │   ├── Basic/          # 免费基础页面（记账、统计）
│   │   └── Premium/        # 付费功能页面（占位/骨架，实际逻辑由插件提供）
│   ├── components/
│   │   ├── common/         # 通用组件（开源）
│   │   └── premium-entry/  # 付费入口组件（根据开关显隐）
│   ├── plugin/             # 【插件框架，开源】插件加载、类型定义、接口
│   │   ├── types.ts        # 插件标准类型、接口定义
│   │   ├── loader.ts       # 前端插件加载器
│   │   └── registry.ts     # 插件注册中心
│   ├── store/
│   │   ├── useFeature.ts   # 【功能开关核心】全局状态，管控所有付费功能
│   │   └── useLicense.ts   # 授权状态管理
│   ├── router/
│   │   ├── index.ts        # 路由动态判断，无插件则屏蔽付费路由
│   └── main.ts
├── plugins/                # 【关键】本地插件目录，.gitignore 全局忽略
│   ├── premium-core/       # 付费插件源码（私有保管，不公开）
│   │   ├── csv-import/
│   │   ├── ai-advanced/
│   │   ├── multi-account/
│   │   └── build.ts        # 插件单独编译脚本
│   └── dist/               # 编译后插件产物（*.plugin.js / 原生插件）
├── .gitignore              # 忽略 plugins/、密钥、本地配置
├── package.json
└── vite.config.ts
```

> 关键：`plugins/` 目录必须加入 `.gitignore`，所有付费插件源码 + 产物永远不上传公开仓库。

## 4. 插件标准与类型定义（开源部分）

### 4.1 插件接口规范

插件接口公开定义后，所有付费插件都遵循同一标准。

```ts
export interface PluginMeta {
  id: string;
  name: string;
  version: string;
  features: string[];
}

export interface AppPlugin {
  meta: PluginMeta;
  install(): Promise<void>;
  uninstall(): void;
}

export enum FeatureKey {
  CSV_IMPORT = 'csv_import',
  ADVANCED_AI = 'advanced_ai',
  MULTI_ACCOUNT = 'multi_account',
  BACKUP_ENCRYPT = 'backup_encrypt'
}

export type FeatureState = Record<FeatureKey, boolean>;
```

### 4.2 插件注册中心

注册中心维护插件池与功能开关状态。

```ts
export const loadedPlugins = new Map<string, AppPlugin>();
export const featureState: FeatureState = { ... };

export function setFeature(key: FeatureKey, enable: boolean) {
  featureState[key] = enable;
}

export function applyPluginFeatures(features: FeatureKey[]) {
  features.forEach(key => setFeature(key, true));
}
```

## 5. 前端插件加载与功能开关

### 5.1 前端插件加载器

前端插件加载器负责：

- 调用 Tauri 后端读取 `plugins/dist` 目录
- 动态导入插件产物
- 运行插件 `install()`
- 根据插件声明的 `features` 打开功能开关

这一步属于“运行时开关”，决定是否显示付费入口。

### 5.2 运行时开关与授权开关

双层控制逻辑：

- 运行时开关：插件文件是否存在、是否能成功加载。
- 授权开关：用户是否输入有效序列号，Tauri 本地授权校验是否通过。

只有两者同时满足，付费功能才真正启用。

## 6. 全局功能状态与授权状态

### 6.1 功能状态管理

使用 Pinia 管理功能开关，支持全局获取与更新。

```ts
export const useFeatureStore = defineStore('feature', {
  state: () => ({ features: { ...featureState } }),
  actions: {
    updateFeatures(newState: Partial<Record<FeatureKey, boolean>>) {
      Object.assign(this.features, newState);
    }
  }
});
```

### 6.2 授权状态管理

授权状态在前端只做显示，实际授权判定通过 Tauri Rust 层执行。

- `license.serial`：用户输入的激活码
- `license.status`：是否本地校验通过
- `license.expired` / `license.features`：可选扩展字段

## 7. 路由与 UI 入口控制

### 7.1 路由控制

付费路由在前端做第一层拦截：

- 如果没有相应功能开关，直接重定向到基础页面
- 如果有功能开关，则允许进入页面

这只是“体验层”控制，不能替代后端校验。

### 7.2 UI 控制

菜单、按钮、入口只在对应功能开关开启时显示。

```vue
<button v-if="hasFeature(FeatureKey.CSV_IMPORT)">券商CSV一键导入</button>
```

## 8. Tauri Rust 底层权限拦截

这部分是核心防护层。前端开关仅影响展示，所有付费能力最终都必须由 Rust 层拦截。

### 8.1 插件目录读取命令

Tauri 提供命令读取 `plugins/dist`：

- `get_plugin_files`
- `plugin_exists`

后端只返回可用插件列表，不执行业务逻辑。

### 8.2 本地授权校验

使用非对称加密做本地序列号校验：

- 开源仓库仅内置公钥
- 私钥由商业方单独保管，用于生成卡密
- 校验在本地完成，不依赖网络

```rust
#[command]
pub fn check_license(serial: String) -> bool {
  rsa_verify(&serial, PUB_KEY)
}
```

### 8.3 付费接口二次校验

所有付费接口必须在 Rust 层做二次拦截：

- 校验插件是否存在
- 校验当前授权是否有效
- 未授权则直接返回错误

示例：

```rust
#[command]
pub fn csv_import_action() -> Result<String, String> {
  if !is_licensed() {
    return Err("功能未授权".into());
  }
  Ok("导入成功".into())
}
```

## 9. 付费插件的私有分发方案

### 9.1 插件开发与打包

付费插件源码保存在私有仓库或本地私有目录：

- `plugins/premium-core/`
- `csv-import/`
- `ai-advanced/`
- `multi-account/`

通过独立编译脚本打包为 `plugins/dist/*.plugin.js` 或本地插件产物。

### 9.2 插件产物分发

推荐两种分发方式：

- 方式 A（推荐）：
  - 主程序开源发布
  - 插件产物与激活码单独售卖
  - 用户购买后手动放到软件根目录 `plugins/dist/`
  - 打开软件输入序列号激活

- 方式 B：
  - 一体包模式
  - 打包时把主程序与插件产物合并
  - 可选做代码混淆与二进制加固

## 10. .gitignore 必填项

```text
# 插件目录（闭源）
plugins/

# 密钥、本地配置
*.env
license.key
secrets/

# 编译产物
dist/
target/
```

## 11. 运行流程

软件启动后：

1. 前端执行 `loadLocalPlugins()`。
2. 检查 `plugins/dist`，尝试加载插件。
3. 若无插件，付费入口/路由隐藏。
4. 若有插件，开启运行时功能开关。
5. 用户访问付费功能时，前端做第一层拦截。
6. 发起 Tauri 后端调用，Rust 进行授权二次校验。
7. 未授权则拒绝；已授权则返回正常结果。

## 12. 优势总结

- `源码安全`：付费插件和密钥不在公开仓库。
- `架构解耦`：主工程仅负责框架与基础功能，付费功能可独立扩展。
- `防前端篡改`：UI 展示与后端权限判定双层分离。
- `维护简单`：新增付费功能时只需新增插件与功能开关，不改主工程核心逻辑。
- `适合小而美运营`：开源引流、闭源变现、轻运营、本地隐私。
