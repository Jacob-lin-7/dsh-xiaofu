# 桌面模式（M4）

## 组成

- **宿主**：`src/host/desktop.ts`
  - 管理 `petId → Electron helper` 的多进程映射；
  - 提供 `start / stopPet / stop / status`；
  - 失败退避重启：1s / 2s / 4s，连续 3 次失败熔断；
  - 每个 helper 的 stdout 按行读取，仅处理 `HEX_PET:` 前缀的 JSON；
  - 响应写回 helper 的 stdin，并带回 `requestId`。
- **helper**：`src/desktop-helper/`
  - `main.cjs`：透明无边框窗口、置顶、跳过任务栏、托盘、命中区、拖拽、原生右键菜单；
  - `preload.cjs`：只暴露 `dragStart/dragMove/dragEnd/showMenu/quit`；
  - `index.html`：视频播放、click 动画、Q 弹、指针事件。
- **宿主路由**：
  - `POST /desktop/start`：`{petId?}` 或 `{all:true}`；
  - `POST /desktop/stop`：`{petId?}`；不带 `petId` 时全部停止；
  - `POST /desktop/reload`：`{all:true}` 或 `{petId}`；
  - `POST /desktop/reset`：`{petId}`，清掉持久化坐标并回到主屏角落；
  - `GET /packs/<id>/export`：把已安装形象包导出为 zip；
  - `GET /desktop/status`。
- **设置页**：`桌面` 分区提供逐只管理表格——显示位置（网页/桌面/两者/不显示）、大小、桌面状态、单独启动/停止、回到角落；另有启动全部/重载/停止全局按钮。顶部状态条 3 秒刷新，失败时提供「重试 / 仅用网页 / 复制诊断」。
- **点击音效**：`sound.click` 开启后，web 与桌面共用内置合成音；音量来自 `config.sound.volume`，helper 启动时以 `--sound-click` / `--sound-volume` 传入。
- **左键动作**：每只宠物 `clickAction`（`none` / `animation` / `open-dsh` / `chat`），helper 以 `--click-action` / `--click-enabled` 传入；`chat` 会打开 `?dsh-hex-pet=chat` 并聚焦输入框。
- **随机漫游**：`motion.roam` 默认开，helper 以 `--roam` 传入；每 18–30 秒在屏内随机移动，拖动/菜单/隐藏时暂停；关闭后固定。
- **点击气泡**：`bubble` 配置随 `--bubbles-b64` / `--bubble-duration` 传入，点击时随机显示一句；`--emoji-file` 可带一张表情图；字体由 `--font-family` / `--font-size` 控制。

## stdio 协议

helper → 宿主（stdout，每行一条）：

```json
{"type":"set-display","petId":"main","display":"both"}
{"type":"list-packs","petId":"main","requestId":3}
{"type":"set-pack","petId":"main","packId":"hex-demo4","requestId":4}
{"type":"set-position","petId":"main","x":120,"y":80,"requestId":5}
{"type":"reset-position","petId":"main","requestId":6}
{"type":"reload-desktop","petId":"main","requestId":7}
{"type":"open-dsh","petId":"main","requestId":8}
```

宿主 → helper（stdin，JSON 一行）：

```json
{"ok":true,"type":"packs-result","current":"hex-demo4","packs":[...],"requestId":3}
{"ok":true,"type":"display-result","petId":"main","display":"desktop","requestId":2}
```

规则：

- 只有 `HEX_PET:` 前缀的行会被宿主解析；Electron 日志被忽略。
- 带 `requestId` 的请求必须回带同一个 `requestId`。
- helper 发出的消息默认带 `petId`（`protocol.cjs` 的 `buildMessage`）；漏掉会让 `set-position` / `reset-position` / `reload-desktop` 被宿主判成 `pet not found`。
- helper 侧 4 秒超时，避免菜单永久挂起。

## 设置深链

桌面菜单「打开 DSH 设置（网页）」不是只打开首页：

```
helper：shell.openExternal(<dshUrl>?dsh-hex-pet=settings)
  → 网页 client 读取参数
  → history.replaceState 清掉参数，避免刷新重复触发
  → 点击「设置」按钮，再切到「Hex 桌宠」分区
```

宿主 `open-dsh` 请求返回的 URL 也带同一参数；helper 自己有 `dshUrl` 时直接拼，不依赖宿主在线。
如果 DSH 改版换了设置按钮的 `aria-label` 或分区标题，需要同步 `src/client/index.js` 里的选择器。

## 动画与元数据

宿主启动 helper 时把形象包的动画列表以 `--animations` JSON 传入：

```json
[
  { "name": "animations/idle.webm", "path": "...", "mode": "loop", "fps": 24 },
  { "name": "animations/click.webm", "path": "...", "mode": "once", "fps": 24 }
]
```

- 右键菜单「动作」列出所有动画，`mode: once` 标注「单次」；
- 选 loop 动画持续播放；选 once 动画播完回 idle；
- 点击身体优先播放 `click`，没有则播第一个 `once`；
- 没有 `animationMeta` 的旧包：第一段 loop，其余 once。

## 命中区

画布按 640×360 设计，命中矩形 `200..440 × 50..335`，按窗口尺寸等比缩放。每 60ms 轮询 `screen.getCursorScreenPoint()`：

- 在矩形内：`setIgnoreMouseEvents(false)`；
- 在矩形外：`setIgnoreMouseEvents(true, { forward: true })`。

拖拽时按光标所在显示器的 `workArea` 夹紧坐标，避免把宠物拖出屏幕；`drag-end` 再把最终位置写回宿主。

## 隐藏状态

- 宿主把隐藏状态写入数据目录的 `hidden.json`：`{ "version": 1, "hidden": { "<petId>": until } }`。
- `until = 0` 表示无限期隐藏（托盘「显示 / 隐藏」）；正数是恢复时间戳。
- 启动 helper 时通过 `--hidden-until` 传入；helper 起窗后保持不可见，到点 `showInactive()` 并回报 `set-visible`。
- `/desktop/visibility` 读持久化快照；`/desktop/show` 清除记录并重启为可见。
- DSH 重启后不会自动拉起桌面窗；下次「启动」时会按剩余时长继续隐藏。
- 读取失败按空状态处理，写入走 temp → rename，磁盘异常不会让隐藏本身失效。

## 平台状态

| 平台 | 状态 | 说明 |
| --- | --- | --- |
| Windows 10/11 x64 | 已验证 | 透明、穿透、拖拽、点击动画、每窗托盘、多窗、重启；混合 DPI 使用 DIP 坐标 |
| macOS 13+ | 代码分支已留，未真机验证 | `setVisibleOnAllWorkspaces`、Electron 路径 |
| Linux X11 | 代码分支已留，未真机验证 | `screen-saver` 层级，失败回退 floating |
| Linux Wayland | 实验性 | 穿透/置顶依赖合成器 |

### Windows 混合 DPI

主屏 200% + 副屏 100% 时，Electron 的 `Display.workArea` 已经是 DIP（例如 3200×2000 物理屏报 1600×952），不要再按 `scaleFactor` 除一次；窗口坐标、命中区和配置坐标统一用 DIP。

拖拽不使用 renderer 的 `screenX/Y`，而是每帧读取系统光标 `screen.getCursorScreenPoint()` 并按归一化工作区夹紧。光标不会离开真实屏幕，因此宠物不会被拖到完全不可见的位置。

夹紧按**宠物中心**计算：中心可以覆盖当前显示器的完整工作区（边缘留 24 DIP），贴边时允许身体少量出屏；拖到扩展屏时按光标所在显示器切换。

拖拽期间 `pointerTimer` 暂停，窗口保持 `setIgnoreMouseEvents(false)`；渲染层用 `setPointerCapture` 锁定 pointer，并在 `pointerup` / `pointercancel` / `blur` 时结束拖拽，避免窗口移动导致鼠标事件被切成穿透、`drag-end` 丢失。

多屏下 Electron 的副屏原点也按 DIP 排布（主屏 1600 DIP 宽，副屏从 x=1600 开始），不要用 Windows 物理坐标的 3200 去推算。

## 已知限制

- 多显示器按 `getDisplayNearestPoint` 选择显示器，混合 DPI 未实测。
- 每只桌面宠物都有独立托盘图标（显示/隐藏、打开设置、重载配置、退出本窗/全部）；图标可在设置页选择任一已安装 pack 的 `preview`，暂不支持上传自定义图标。
- 「打开 DSH 设置」会带 `?dsh-hex-pet=settings` 打开网页，并自动展开设置页的「Hex 桌宠」分区；如果 DSH 改版调整了设置按钮，需要同步 `src/client/index.js` 里的选择器。
- 桌面端写配置不会主动推送到已打开的网页，网页刷新后才同步。
- 切换形象会重启窗口，临时拖拽位置可能被配置位置覆盖。
