# 帧序列生成形象包（R11）

## 输入

- 一个 `.zip`，里面是 PNG 序列；
- 文件名里的数字决定顺序（`frame_0001.png`、`frame_2.png` 都行）；
- 平铺文件 → 生成单段 `idle`；
- 按目录分组 → 生成多段：`idle/`、`click/`、`drag/` 等，目录名必须匹配 `[a-z0-9-]{1,16}`；
- 非 PNG 条目会被忽略；
- 上限：300 帧、单帧 20 MB、zip 120 MB。

## 流程

1. `POST /generate?name=<名称>&id=<可选 id>&fps=<1-60>`，body 是 zip；
2. 宿主校验 id、检查包是否已存在、检查 ffmpeg 是否就绪；
3. 解压到 `dataDir/.generate-*/frames/<segment>`，按数字排序后重命名为 `frame_0001.png…`；
4. 每段分别用 ffmpeg 编码（fps 使用查询参数，默认 24）：

```sh
ffmpeg -y -framerate 24 -i frame_%04d.png \
  -c:v libvpx-vp9 -pix_fmt yuva420p -auto-alt-ref 0 \
  -b:v 0 -crf 28 -an <segment>.webm
```

5. `idle` 第一帧（没有 idle 时用第一段）复制为 `preview.png`；
6. 写 `manifest.json`：`animations` 按 `idle` 优先排序，并写入 `animationMeta`；
7. 返回 `{pack:{id,name,version,animations,animationMeta,preview,frames,segments}}`。

`animationMeta` 示例：

```json
{
  "animations/idle.webm": { "fps": 24, "mode": "loop" },
  "animations/click.webm": { "fps": 24, "mode": "once" }
}
```

网页 overlay 会按 `mode` 决定是否单次播放后回 idle；没有元数据的旧包按“idle 循环、其它单次”处理。

客户端成功后会刷新包列表并自动绑定到当前宠物。

## 检查与逐段参数

生成 UI 是两步：

1. `POST /generate/inspect`（body 为 zip）返回：

```json
{
  "inspection": {
    "segments": [{ "name": "idle", "frames": 24 }, { "name": "click", "frames": 24 }],
    "preview": "data:image/png;base64,..."
  }
}
```

2. 用户为每段设置 fps 与 `loop/once`，再提交生成：

```text
POST /generate?name=...&meta={"idle":{"fps":18,"mode":"loop"},"click":{"fps":30,"mode":"once"}}
```

`meta` 会覆盖全局 `fps`，并写入对应段的 `animationMeta`。生成的编码也使用逐段 fps。

## 异步任务与取消

设置页「开始生成」走异步任务，避免长请求：

```text
POST   /generate/jobs?name=...&fps=...&meta=...
GET    /generate/jobs              # 最近 20 条
GET    /generate/jobs/<jobId>
POST   /generate/jobs/<jobId>/retry
DELETE /generate/jobs/<jobId>
```

- 创建后立即返回 `{job:{id,status,progress,message}}`；
- `GET` 返回 `progress`（0–100）、`message`、完成后的 `pack` 或 `error`；
- `DELETE` 置为 `cancelled`，生成器在帧进度回调里检查并终止 ffmpeg、清理半成品；
- 失败/取消的任务可用 `POST /generate/jobs/<id>/retry` 重跑；任务保留原始 zip 缓冲与参数；
- 任务历史写入 `dataDir/generate-jobs.json`，原始 zip 写入 `dataDir/.generate-jobs/<jobId>.zip`；
- DSH 重启后恢复历史；重启前未完成且有 zip 的任务会自动续跑，没有 zip 的标记失败；
- 有 zip 的任务 `retryable=true`，重启后仍可重试；zip 丢失时重试会返回错误；
- 任务记录包含 `createdAt` 与 `finishedAt`；时间线优先用结束时间，未结束显示创建时间；
- 任务结果不再固定 10 分钟删除，保留时间由清理策略（TTL / 配额 / 手动）决定；
- `GET /generate/jobs` 返回最近 20 条（名称、状态、进度、错误），设置页显示「最近生成」；
- 配额：最多 50 条历史、zip 总量 500 MB、单条最长 24 小时；启动与清理时按时间删除超限项及对应 zip；
- `GET /generate/storage` 返回历史条数、zip 文件数/字节数与当前配额，设置页显示「历史 N 条 · zip X / 500 MB」；
- 配额保存在 `config.generate`，设置页可直接编辑：历史条数 / zip MB / TTL 小时 / 清理间隔分钟 / 自动清理开关；
- `autoCleanup=false` 时完全手动：启动、保存配置、定时器都不清理，只有「清理已完成」或 `POST /generate/cleanup` 生效；
- `autoCleanup=true` 且保存配置/配额后立即清理一次；后台每 60 秒检查，达到 `cleanupMinutes` 才真正清理；`cleanupMinutes=0` 只关闭定时清理；
- `GET /generate/storage` 额外返回 `lastCleanup:{at,removed,reason,jobs}` 与最近 10 条 `cleanupHistory`；设置页显示上次清理时间与最近 3 条，悬停可看被删任务名；
- 清理日志写入 `dataDir/cleanup-log.json`，保留最近 20 条，重启后仍在；`GET /generate/cleanup/log` 返回完整日志，`DELETE /generate/cleanup/log` 清空；设置页可搜索、按原因过滤、导出 JSON、两步确认清空；
- `POST /generate/cleanup` 可手动清理；设置页有「清理已完成」按钮；
- **并发上限 1**：第二个任务进入 `queued`，前一个结束后自动开始；
- 编码阶段解析 ffmpeg `-progress pipe:1` 的 `frame=`，进度按段内帧数平滑推进。

实测：两段任务从 `running/55%` 到 `done/100%`；取消任务最终 `cancelled`，`cancel-test` 包目录不存在。

## 失败处理

- 没有 PNG：`压缩包里没有 PNG 帧`；
- 帧数/体积超限：明确报错；
- ffmpeg 不可用：`FFMPEG_MISSING`，设置页提示先下载或指定路径；
- ffmpeg 编码失败：返回 stderr 末尾 500 字符；
- 任何失败都会清理 pack 目录与临时目录，不会留下半成品。

## 实测

单段，用 72 帧 640×360 的演示序列：

```json
{"pack":{"id":"gen-mvpa7q49","name":"生成测试","version":"1.0.0",
"animations":["animations/idle.webm"],"preview":"preview.png","frames":72}}
```

多段，`idle/` 24 帧 + `click/` 24 帧：

```json
{"pack":{"id":"gen-mvpeq4ge","name":"多段测试","version":"1.0.0",
"animations":["animations/idle.webm","animations/click.webm"],
"preview":"preview.png","frames":48,"segments":["idle","click"]}}
```

生成的 `idle.webm` / `click.webm` 均返回 `video/webm`，`preview.png` 返回 `image/png`。

## 已知限制

- 只支持 PNG 序列；还不支持 GIF/MP4/单张图转动画。
- 没有进度条；生成期间按钮置灰，请求可能持续数十秒。
- 多段动画生成时可逐段设置 fps 与 `loop/once`；`animationMeta` 会保存这些参数。
- 不做背景移除；需要输入已经带 alpha 的 PNG（或后续接抠图）。
- 生成包 id 自动为 `gen-<时间>`；暂不支持在 UI 里指定 id。
