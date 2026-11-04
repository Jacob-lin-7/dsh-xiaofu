# 功能开关与菜单定制 · 设计

> 对应需求 R41 · 关联 [PRD](./PRD.md)
> 目标：让用户决定“这只宠物能做什么、点开它能看到什么”，同时保证关不坏、锁不死、双端一致。

## 1. 设计原则

1. **关闭 = 不工作**：不仅是隐藏菜单，还要停掉定时器、轮询、LLM 调用与网络请求。
2. **注册表驱动**：功能清单是代码里的静态注册表，配置只存“开/关”，不存文案与逻辑。
3. **单一事实源**：host 持有配置；web 与桌面都从同一份成品配置渲染。
4. **纯函数合成**：菜单由 `composeMenu()` 纯函数生成，双端共用，用快照测试锁死一致性。
5. **永远有退路**：至少保留一个“设置/恢复”入口；全关也能恢复。
6. **默认可控**：默认菜单只放 5 项，高级/花钱的功能默认关。

## 2. 概念

| 概念 | 说明 |
| --- | --- |
| Feature（功能） | 一个可开关的能力，如“对话”“余额”“点击音效” |
| Scope（作用域） | `global` 全局默认，`per-pet` 可按宠物覆盖 |
| Requirement（依赖） | 功能运行所需条件：LLM、余额提供方、桌面端、素材包 |
| Availability | `ok` / `unmet`（依赖不满足）/ `unsupported`（平台不支持） |
| Menu Item | 功能在右键菜单里的呈现；不是所有功能都有菜单项 |
| Protected | 不可关闭的功能/入口（设置） |
| Menu Mode | 依赖不满足时 `hide`（隐藏）或 `disable`（置灰并说明） |

## 3. 功能注册表（首版）

| id | 名称 | 分组 | 默认 | 作用域 | 平台 | 依赖 | 成本 | 受保护 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `core.pet` | 显示宠物 | core | 开 | global | both | — | 无 | 是 |
| `motion.roam` | 随机漫游 | core | 开 | per-pet | both | — | 无 | 否 |
| `interaction.click` | 点击回应 | core | 开 | per-pet | both | — | 无 | 否 |
| `interaction.drag` | 拖拽/甩抛 | core | 开 | per-pet | both | — | 无 | 否 |
| `sound.click` | 点击音效 | interaction | 关 | per-pet | both | — | 无 | 否 |
| `menu.chat` | 对话 | interaction | 开 | per-pet | both | `llm` | token | 否 |
| `menu.whisper` | 碎碎念 | interaction | 关 | per-pet | both | `llm` | token | 否 |
| `menu.balance` | 查看余额 | status | 开 | per-pet | both | `balance` | 网络 | 否 |
| `menu.actions` | 动作点播 | interaction | 开 | per-pet | both | — | 无 | 否 |
| `menu.petpack` | 形象管理 | appearance | 开 | global | both | — | 无 | 否 |
| `menu.display` | 显示位置 | display | 开 | per-pet | both | — | 无 | 否 |
| `menu.snooze` | 暂时隐藏 | display | 开 | per-pet | both | — | 无 | 否 |
| `menu.settings` | 设置 | system | 开 | global | both | — | 无 | **是** |
| `menu.about` | 关于 | system | 开 | global | both | — | 无 | 否 |
| `status.work` | 工作状态 | status | 开 | per-pet | both | — | 无 | 否 |
| `notify.system` | 系统通知 | system | 开 | global | desktop | — | 无 | 否 |
| `tray.icon` | 托盘图标 | system | 开 | global | desktop | `desktop` | 无 | 否 |
| `pet.layoutAvoid` | 多宠避让 | core | 开 | global | desktop | `desktop` | 无 | 否 |
| `pet.collision` | 宠物碰撞 | core | 关 | global | desktop | `desktop` | 无 | 否 |

> 注册表是代码常量，新增功能只需加一行 + 默认值；已发布的 id 不再改名。

## 4. 配置结构

```jsonc
{
  "schemaVersion": 1,
  "features": {
    "registryVersion": 1,
    "global": {
      "menu.whisper": false,
      "sound.click": false,
      "notify.system": true
    },
    "pets": {
      "main": { "menu.balance": false }
    },
    "menu": {
      "mode": "hide",
      "order": ["menu.chat", "menu.actions", "menu.petpack", "menu.display", "menu.settings"]
    }
  }
}
```

规则：

- `global` 缺省 → 用注册表默认值。
- `pets.<id>` 缺省 → 继承 `global`；显式布尔 → 覆盖。
- `menu.order` 只影响顺序，不决定可见性；缺省用注册表顺序。
- 未知 id：读取时忽略并 `warnOnce`，保存时保留（前向兼容）。
- `registryVersion` 用于升级时补默认值；不重置用户选择。

## 5. 生效值解析

```ts
function resolveFeature(id, petId, cfg, registry): boolean {
  const override = cfg.features.pets?.[petId]?.[id];
  if (typeof override === 'boolean') return override;
  const global = cfg.features.global?.[id];
  if (typeof global === 'boolean') return global;
  return registry.get(id).defaultEnabled;
}
```

依赖检查与开关分离：`enabled` 决定“用户要不要”，`availability` 决定“现在能不能”。两者都满足才可交互。

## 6. 菜单合成

```ts
type MenuMode = 'hide' | 'disable';

function composeMenu(input: {
  registry: Feature[];
  cfg: Config;
  petId: string;
  platform: 'web' | 'desktop';
  caps: Capabilities;      // llm / balance / desktop / pack
  mode: MenuMode;
}): MenuNode[] {
  const rows = input.registry
    .filter(f => f.menu)
    .filter(f => f.platforms.includes(input.platform))
    .map(f => ({
      f,
      enabled: resolveFeature(f.id, input.petId, input.cfg, input.registry),
      availability: checkDeps(f, input.caps),
    }));

  const visible = rows.filter(r => {
    if (!r.enabled) return false;                       // 用户关掉：永远不显示
    if (r.availability === 'ok') return true;
    return input.mode === 'disable';                    // 依赖不满足：隐藏或置灰
  });

  // 保护项兜底：设置永远在
  if (!visible.some(r => r.f.protected)) {
    visible.push({ f: registry.get('menu.settings'), enabled: true, availability: 'ok' });
  }

  return sortAndGroup(visible, input.cfg.features.menu.order);
}
```

输出节点：`{ id, label, icon, group, disabled?, reason?, children? }`。

`reason` 文案示例：

- `需要先配置模型`（llm）
- `需要登录账号或配置余额接口`（balance）
- `仅桌面模式可用`（desktop）
- `还没有安装形象包`（pack）

## 7. 双端设置 UX

### 7.1 DSH 设置页：「功能」区块

- 分组列表（交互 / 形象 / 状态 / 系统），每行：
  - 开关
  - 一句话说明 + 成本徽标（无 / token / 网络）
  - 依赖状态徽标（正常 / 需配置 / 平台不支持）
  - 每宠覆盖下拉：`继承全局` / `开` / `关`（多宠时出现）
- 顶部：宠物选择器 + 「应用到全部」。
- 右侧：**菜单预览**（实时），让用户看到改完是什么样。
- 底部：「恢复默认功能」+「导出/导入配置」。

### 7.2 桌宠端：右键 →「设置」面板

- 小面板（不跳页），三个页签：
  - **功能**：只列常用 8–10 项（对话、碎碎念、余额、动作、形象、点击音效、漫游、工作状态），开关即时生效。
  - **显示**：显示位置、大小、暂时隐藏。
  - **更多**：打开 DSH 设置页（深链）、恢复默认、关于。
- 面板本身由 `menu.settings` 承载；该功能受保护，不能关闭。
- 多宠时面板顶部显示“正在设置：<宠物名>”。

### 7.3 即时反馈

- 切换后 300ms 内本地乐观更新，host 确认后落盘；失败回滚并 toast。
- 菜单重新合成；桌面端通过 bridge 收到 `features-changed`，不重启 helper。

## 8. 生效链路

```
用户操作（设置页/桌宠面板）
  → PUT /features
  → host 校验 + 原子写 + revision++
  → 广播 features-changed
  → web: 重新拉 config/features，重算菜单
  → desktop: bridge 消息，重算菜单（不重启）
```

- `revision` 单调递增；客户端发现落后即刷新。
- 关闭功能时同步执行清理：停定时器、取消进行中的请求、关闭相关窗口（如对话窗需确认）。
- 打开功能时做惰性初始化，不在启动时预加载全部能力。

## 9. 保护与恢复

| 场景 | 行为 |
| --- | --- |
| 用户关闭 `menu.settings` | 拒绝，提示“设置入口不可关闭” |
| 用户关闭所有功能 | 宠物仍显示；菜单保留「设置」「关于」；设置页可恢复 |
| 配置损坏 | 回退备份；功能恢复默认 |
| 未知功能 id | 忽略并记录一次警告；不阻塞启动 |
| 宠物被删除 | 清理该宠物的覆盖项 |
| 新版本新增功能 | 按注册表默认值生效；不覆盖用户已有的开关 |

## 10. 验收用例

1. 关闭「对话」→ 双端菜单都不显示；重启后仍关闭；后台不再发起 LLM 请求。
2. 把菜单模式设为 `disable`，在未配置模型时 → 「对话」显示但置灰，悬停提示“需要先配置模型”。
3. 尝试关闭「设置」→ UI 拒绝并解释；托盘/设置页仍可进入。
4. 关闭除「设置」「关于」外全部功能 → 宠物仍显示，菜单可用，能一键恢复。
5. 全局关闭「余额」、给 `main` 单独打开 → `main` 显示，其它宠物不显示。
6. 配置里写入未知 id → 启动正常，日志一条警告，保存后该 id 仍保留。
7. 桌宠面板切换「点击音效」→ DSH 设置页 1 秒内同步；反向亦然。
8. 导出配置 → 清空 → 导入 → 菜单与开关完全一致。

## 11. 待定

- 菜单顺序拖拽（P2）：全局顺序还是每宠独立？
- 「动作」子菜单是否支持按分类过滤（只保留“小动作”）？
- 是否提供“一键极简模式”（只留点击回应 + 设置）？
- 功能开关是否要支持“按时间段自动切换”（如工作时间关闭碎碎念）？
