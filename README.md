# dsh-xiaofu · 桌宠配置

一个给 DSH 的通用桌宠插件：**装了就看得见、形象能自己换、动作和气泡由自己定。**

默认角色是「小符」，但插件本身不绑定某个角色；用户可以导入自己的 petpack、动作、表情和气泡。

![小符](characters/xiaofu/preview.png)

## 功能

- 网页 overlay + Windows 桌面透明窗
- 自定义角色包：`manifest.json` + `animations/*.webm|mov` + `preview.png` / `icon.png`
- 单击 / 双击动作播放列表，点 `+` 继续添加，轮流播放
- 手动动作播完回到当前事件状态，没有事件才回空闲
- DSH 任务自动跟随：
  - `turn/start` → 任务进行中
  - `turn/end` → 任务完成
  - 审批请求 → 等待确认
  - 超时、余额警告
- 前端 / 后台 session 区分；后台任务不抢当前桌宠状态
- `GET /state/events` SSE 即时推送，断线自动轮询兜底
- 气泡文案、样式、字体、字号、时长 / 间隔可配置，客户端与桌面一致
- 长气泡自动换行，最大宽度 300px
- 表情包、点击音效、右键菜单、隐藏 / 恢复、位置持久化
- 余额警告；可选 OpenAI 兼容 LLM 碎碎念
- 形象包导入 / 导出、动作库、动作改名
- 首次启动自带小符形象包，不需要再手动导入

## 环境

- Windows 10/11 x64（当前主要验证平台）
- Node.js 22+
- DSH 桌面端
- 桌面模式需要 Electron：
  - 默认查找 `%USERPROFILE%\.dsh\electron\electron.exe`
  - 或设置 `DSH_PET_ELECTRON_PATH`

## 安装

### 从本地包安装

```powershell
$profile = "$env:USERPROFILE\.dsh\profiles\desktop"

npm install --prefix "$profile" --no-save `
  "D:\path\to\dsh-xiaofu-0.3.6.tgz"
```

完全退出 DSH 后重新打开。

### 开发模式

```powershell
npm install --ignore-scripts
npm run build
npm test
```

把项目链到隔离 profile 的 `node_modules` 下，具体见 [docs/INSTALL.md](docs/INSTALL.md)。

## 第一次打开

默认配置已经绑定小符形象包，正常不需要手动导入。

如果需要换角色：

```text
设置 → 桌宠配置 → 角色库
→ 高级 · 手动导入角色包（zip）
```

## 配置位置

```text
%DSH_HOME%\dsh-xiaofu\
  packs/<角色>
  emoji/
  sounds/
  fonts/
  animations/
  main-config.json
```

旧数据目录 `dsh-hex-pet` 首次启动会自动迁移。

## 制作自己的角色

```text
my-pet/
  manifest.json
  preview.png
  icon.png
  animations/
    idle.webm
    click.webm
    state-working.webm
    state-done.webm
```

`manifest.json` 示例：

```json
{
  "schema": "dsh-hex-pet.pack/1",
  "id": "my-pet",
  "name": "我的桌宠",
  "version": "1.0.0",
  "animations": [
    "animations/idle.webm",
    "animations/click.webm"
  ],
  "preview": "preview.png",
  "icon": "icon.png"
}
```

校验：

```powershell
npx dsh-xiaofu validate my-pet.zip
```

完整规范见 [PETPACK_SPEC.md](PETPACK_SPEC.md) 与 [docs/CHARACTER-QUICKSTART.md](docs/CHARACTER-QUICKSTART.md)。

## 已知限制

- 当前重点验证 Windows；macOS / Linux 尚未完整真机回归
- 多显示器、混合 DPI 仍是实验性
- 素材工坊没有自动 AI worker，生成任务需要本地 ffmpeg
- 默认形象包的小符素材版权见 [ASSETS_LICENSE.md](ASSETS_LICENSE.md)

## 开发

```powershell
npm run build
npm test
npm pack
```

测试覆盖 schema、配置、host 路由、client factory、petpack、ffmpeg、动作状态、多 session、余额恢复等。

## 许可证

代码 MIT，见 [LICENSE](LICENSE)。  
角色素材单独授权，见 [ASSETS_LICENSE.md](ASSETS_LICENSE.md)。
