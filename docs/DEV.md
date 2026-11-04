# 本地开发与测试

> 目标：改代码 → 立刻在隔离实例里看效果，不碰主 DSH、不打断当前会话。

## 1. 隔离实例

| 项 | 值 |
| --- | --- |
| 测试 home | `.dev/home`（工作区内，已加入 `.gitignore`） |
| profile | `hex-test` |
| 端口 | `3099` |
| 插件链接 | `.dev/home/profiles/hex-test/node_modules/dsh-xiaofu` → 项目根目录 |
| 测试数据 | 5 只宠物、18 个素材包、配置与备份 |

启动：

```powershell
$env:DSH_HOME=(Resolve-Path '.dev\home').Path
node C:\nvm4w\nodejs\node_modules\@deepseek-ai\dsh\lib\bin.js `
  --profile hex-test --host 127.0.0.1 --port 3099 --no-open
```

启动日志会打印带 `?token=` 的地址。首次在新机器上启动时，DSH 需要在 profile 里创建模块回退链接；如果报 `symlink EPERM`，用一次完整权限初始化，之后可复用。

主 DSH 的 `desktop` profile 不受影响；测试数据写坏也只影响 `.dev/home`。

## 2. 改动怎么生效

| 改动位置 | 构建 | 生效方式 |
| --- | --- | --- |
| `src/client/index.js` | `npm run build` | 刷新测试页（必要时 Ctrl+F5） |
| `src/host/*`、`src/shared/*` | `npm run build` | 重启测试实例；桌面宠物重新「启动」 |
| `src/desktop-helper/*` | `npm run build` | 设置页「停止」→「启动」桌面宠物，或右键→「重新加载」 |

`npm test` 会先 build 再跑测试，改完代码建议至少跑一次。

## 3. 常用接口

```text
GET  /dsh-xiaofu/health
GET  /dsh-xiaofu/desktop/status
POST /dsh-xiaofu/desktop/start      {"all":true} 或 {"petId":"main"}
POST /dsh-xiaofu/desktop/stop       {"petId":"main"} 或 {}
POST /dsh-xiaofu/desktop/reload     {"all":true} 或 {"petId":"main"}
POST /dsh-xiaofu/desktop/reset      {"petId":"main"}
GET  /dsh-xiaofu/desktop/visibility
POST /dsh-xiaofu/desktop/show       {"petId":"main"}
GET  /dsh-xiaofu/emoji
POST /dsh-xiaofu/emoji?name=...&description=...
PUT  /dsh-xiaofu/emoji/<id>
DELETE /dsh-xiaofu/emoji/<id>
GET  /dsh-xiaofu/emoji/<id>/asset
POST /dsh-xiaofu/sound
DELETE /dsh-xiaofu/sound
GET  /dsh-xiaofu/sound/asset
GET  /dsh-xiaofu/llm/status
POST /dsh-xiaofu/llm/whisper
POST /dsh-xiaofu/llm/resume
GET  /dsh-xiaofu/state
POST /dsh-xiaofu/state/trigger     {"event":"task-start"}
POST /dsh-xiaofu/state/clear
GET  /dsh-xiaofu/balance/status
POST /dsh-xiaofu/task/start
POST /dsh-xiaofu/task/usage        {"tokens":25000}
POST /dsh-xiaofu/task/end
GET  /dsh-xiaofu/task/status
```

本地接口不需要 token；网页根路径需要启动时打印的 `?token=`。

## 4. 桌面宠物

- 设置页「桌面模式」→「启动全部桌面宠物」。
- 右键宠物可切形象、隐藏、重载、打开设置深链。
- 隐藏状态写入 `.dev/home/dsh-xiaofu/hidden.json`；重启测试实例后仍按剩余时长继续隐藏。

## 5. 什么时候装进主 DSH

测试稳定后，再把 `dsh-xiaofu` 链接进 `%USERPROFILE%\.dsh\profiles\desktop`，并加入 profile 的 `dsh.profile.bundles`。
这一步需要重启主 DSH，会中断当前会话，建议放到一个阶段的收尾。
