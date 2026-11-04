# 架构 · dsh-hex-pet

> 目标：让“配置、功能开关、菜单、形象包”四条链路各自单一职责，web 与桌面共用纯逻辑。

## 1. 目录结构（规划）

```
dsh-hex-pet/
├─ package.json
├─ tsconfig.json
├─ docs/
│  ├─ PRD.md
│  ├─ FEATURE-TOGGLES.md
│  ├─ BORROW.md
│  ├─ ARCHITECTURE.md
│  └─ research/
├─ src/
│  ├─ shared/                 # 纯逻辑，无 Node/DOM 依赖
│  │  ├─ schema.ts            # zod schema + 类型
│  │  ├─ features.ts          # 注册表、解析、依赖检查
│  │  ├─ menu.ts              # composeMenu 纯函数
│  │  ├─ geometry.ts          # DIP/像素换算、命中区
│  │  ├─ petpack.ts           # manifest 类型与校验规则
│  │  └─ constants.ts
│  ├─ host/                   # Cordis 插件（Node）
│  │  ├─ index.ts             # apply：注册路由/命令/事件
│  │  ├─ config/store.ts      # 读、合并、原子写、备份、迁移
│  │  ├─ features/service.ts  # 开关读写、revision、广播
│  │  ├─ packs/service.ts     # 安装/删除/列表/导出
│  │  ├─ packs/zip.ts         # yauzl + 限制
│  │  ├─ packs/probe.ts       # 视频元数据（必要时）
│  │  ├─ routes/              # /config /features /packs /health
│  │  └─ desktop/             # helper 进程管理（M4）
│  ├─ client/                 # 浏览器端
│  │  ├─ overlay/             # 宠物渲染、动画链、拖拽
│  │  ├─ menu/                # 菜单组件（消费 composeMenu）
│  │  └─ settings/            # 设置页「功能」「形象」「外观」
│  └─ desktop-helper/         # Electron 主进程/渲染（M4）
│     ├─ main.ts
│     └─ renderer.ts
├─ assets/                    # 自有/授权素材
├─ tests/
└─ scripts/
```

> 本阶段只建 `docs/`；`src/` 在 M0 创建。

## 2. 模块职责

| 模块 | 职责 | 不做什么 |
| --- | --- | --- |
| `shared/schema` | 配置结构、默认值、版本 | 不读文件、不发请求 |
| `shared/features` | 注册表、`resolveFeature`、`checkDeps` | 不渲染、不持久化 |
| `shared/menu` | 把注册表 + 配置 + 能力 → 菜单树 | 不写 DOM、不调 API |
| `host/config` | 唯一写入者；合并、校验、备份、迁移 | 不渲染、不拼菜单 |
| `host/features` | 开关服务、revision、广播 | 不决定 UI 长什么样 |
| `host/packs` | 上传、校验、安装、删除、导出 | 不处理宠物动画播放 |
| `client/overlay` | 播放、拖拽、命中 | 不直接写配置 |
| `client/settings` | 表单与预览；调用 host API | 不实现业务规则（复用 shared） |
| `desktop-helper` | 透明窗、点击穿透、托盘 | 不重复实现配置/菜单逻辑 |

## 3. 数据流

### 3.1 配置写入

```
设置页/桌宠面板
  → PUT /config 或 /features
  → host 校验（zod + 业务规则）
  → 归一化（补齐默认、清理未知）
  → 写 temp → fsync → rename
  → 备份轮转（.bak.1..3）
  → revision++
  → 广播 features-changed / config-changed
```

- 读路径：`default ← user ← runtime`（runtime 不落盘）。
- 任何写入失败：返回字段级错误，客户端回滚乐观更新。

### 3.2 菜单渲染

```
registry + config + petId + platform + capabilities
  → resolveFeature（全局/覆盖/默认）
  → checkDeps（llm/balance/desktop/pack）
  → composeMenu（hide/disable）
  → 菜单树
  → web: React 渲染；desktop: 原生菜单/自绘
```

`composeMenu` 是纯函数，web 与桌面共用；快照测试保证一致。

### 3.3 形象包导入

```
上传 zip（≤50MB）
  → 临时目录
  → 安全解压（路径、条目数、解压比）
  → manifest 校验（schema/id/引用）
  → 素材校验（扩展名、时长、分辨率、alpha 抽样）
  → 预览（idle 循环 + 菜单）
  → 原子移动到家目录
  → 注册到 config.packs
  → revision++ / 广播
```

失败：清理临时目录，返回逐文件原因。

### 3.4 桌面 helper（M4）

```
host 启动 → 检查显示/平台/二进制
  → 拉起 helper（清理 ELECTRON_RUN_AS_NODE 等环境变量）
  → helper 建立 bridge
  → 上报 running / pid
  → 失败：记录退出码 + stderr 尾部 → 状态 failed → 熔断
```

- 用户主动退出：专用退出码/消息，不重启。
- 全屏/截图检测：暂停置顶与命中翻转。

## 4. 安全边界

| 边界 | 措施 |
| --- | --- |
| 上传 | 大小上限、扩展名白名单、魔数嗅探、拒绝可执行文件、解压比限制 |
| 路径 | 拒绝绝对路径/`..`/符号链接；安装后 realpath 必须在数据目录内 |
| 配置 | 只允许白名单字段；id 字符集限制；长度限制 |
| 渲染 | 用户素材只经 `<video>`/`<img>` 加载；不注入 HTML |
| 桌面 | 不接受远程命令；bridge 仅本机；权限最小化 |

## 5. 测试策略

| 层级 | 范围 | 工具 |
| --- | --- | --- |
| 单元 | schema、resolveFeature、composeMenu、几何换算、zip 校验 | Vitest/Node test |
| 契约 | 路由请求/响应、错误码、原子写、备份恢复 | 临时目录 + 真 HTTP |
| 快照 | 菜单在不同配置/能力下的输出 | 内联快照 |
| E2E | 安装、导入、开关、重启保持 | Playwright（web） |
| 平台 | 多屏/DPI、全屏、截图、托盘 | 手工矩阵（Win/mac/Linux） |

## 6. 构建与发布

- ESM；Node ≥ 22；`tsdown`/`tsup` 构建 host/client/desktop 多入口。
- 无原生依赖（首版）；`files` 白名单只发 `lib/`、`assets/`、`cordis.patch.yml`、`package.json`。
- 版本：`schemaVersion` 与插件版本分离；包格式遵循 `petpack/1`。
- 发布前：单测 + 契约 + E2E + 许可证审计 + 素材清单。

## 7. 命名与兼容

- 功能 id 用点号命名空间（`menu.chat`），发布后不改名。
- 配置字段用 camelCase；未知字段保留。
- 路由前缀以插件名为准；桌面 bridge 复用同一 handler 契约。
- 错误码稳定（`E_*`），文案可 i18n。
