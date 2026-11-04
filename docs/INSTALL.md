# Windows 安装与验证

适用：Windows 10/11 x64、DSH 桌面端，Node.js 22+。

## 1. 构建

在项目目录：

```powershell
npm install --ignore-scripts
npm run build
```

产物：

- `lib/host/`：插件宿主
- `lib/client.js`：设置页与网页 overlay
- `lib/desktop-helper/`：Electron 桌面窗 helper

## 2. 放进 DSH profile

默认 DSH 数据目录是 `%USERPROFILE%\.dsh`，profile 在 `profiles/<名称>/`。

把项目链接到 profile 的 `node_modules`：

```powershell
$profile = "$env:USERPROFILE\.dsh\profiles\default"
New-Item -ItemType Directory -Force "$profile\node_modules" | Out-Null
cmd /c mklink /J "$profile\node_modules\dsh-xiaofu" "D:\DSH\vibecoding\dsh-xiaofu"
```

然后重启 DSH。

## 3. Electron 运行时

桌面模式需要 Electron：

- 默认查找 `%USERPROFILE%\.dsh\electron\electron.exe`；
- 也可以设置：

```powershell
$env:DSH_PET_ELECTRON_PATH = "C:\path\to\electron.exe"
```

找不到 Electron 时，设置页「桌面模式」会显示失败原因，网页功能不受影响。

## 4. ffmpeg 首次使用

进入设置 →「桌宠配置」→「视频编码器」：

1. 点「下载 ffmpeg」；
2. 等待下载 + 解压（约 170 MB，解压后 138 MB）；
3. 状态变为 `就绪 · managed`。

也可以跳过下载：

```powershell
$env:DSH_PET_FFMPEG_PATH = "C:\path\to\ffmpeg.exe"
```

## 5. 启动桌宠

1. 设置页「桌面模式」→「启动当前宠物」或「启动全部桌面宠物」；
2. 桌面右上角出现透明窗；
3. 右键可切换形象、隐藏、退出。

## 6. 数据与日志

- 配置/包：`%DSH_HOME%\dsh-xiaofu\`
  - `config.json` + `config.json.bak.1..3`
  - `packs/<id>/`
  - `hidden.json`（桌面隐藏状态与恢复时间）
  - `generate-jobs.json`
  - `.generate-jobs/*.zip`
  - `cleanup-log.json`
- helper 日志：`%TEMP%\dsh-xiaofu-helper.log`
- 宿主日志：`%TEMP%\dsh-xiaofu-host.log`

## 7. 卸载

1. 设置页「停止」桌面窗；
2. 删除 profile 里的 `node_modules\dsh-xiaofu` 链接；
3. 可选删除 `%DSH_HOME%\dsh-xiaofu` 数据目录。

## 常见问题

- **桌面窗不出现**：看 `/dsh-xiaofu/desktop/status` 与 helper 日志；确认 Electron 路径。
- **右键无菜单**：确认 helper 版本包含本地包列表（启动参数 `--packs-file`）。
- **切换形象后窗口消失**：看宿主日志是否有 `spawn`/`exit`，常见原因是 helper 启动参数或 Electron 路径。
- **残留透明窗**：helper 有父进程看门狗；若仍有残留，结束命令行包含 `desktop-helper\main.cjs` 的 electron 进程。
- **ffmpeg 卡在解压**：新版使用显式流解压；若仍是旧版本，重新构建。
