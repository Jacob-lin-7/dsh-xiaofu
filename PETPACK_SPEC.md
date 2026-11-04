# PETPACK 规范（dsh-hex-pet.pack/1）

> 一个 petpack 是一个 zip 文件，扩展名建议 `.petpack.zip`。  
> 机器可读约束见 [petpack.schema.json](./petpack.schema.json)。

## 1. 目录结构

```text
my-pet.petpack.zip
├─ manifest.json
├─ preview.png              # 可选
└─ animations/
   ├─ idle.webm
   ├─ click.webm            # 可选
   └─ drag.webm             # 可选
```

- `manifest.json` 必须在 zip 根目录。
- 所有路径使用 `/`，禁止绝对路径、`..`、反斜杠、符号链接。
- 允许的扩展名：`.webm`、`.mov`、`.png`、`.jpg`、`.jpeg`、`.webp`、`.md`、`.txt`、`.json`。
- 动画只接受 `.webm` 或 `.mov`。

## 2. manifest.json

```json
{
  "schema": "dsh-hex-pet.pack/1",
  "id": "orange-cat",
  "name": "橘猫",
  "version": "1.0.0",
  "author": "your-name",
  "license": "CC-BY-4.0",
  "animations": ["animations/idle.webm", "animations/click.webm"],
  "animationMeta": {
    "animations/idle.webm": { "fps": 24, "mode": "loop" },
    "animations/click.webm": { "fps": 24, "mode": "once" }
  },
  "preview": "preview.png"
}
```

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `schema` | 否 | 固定 `dsh-hex-pet.pack/1`，缺省视为该版本 |
| `id` | 是 | `^[a-z0-9][a-z0-9-]{1,31}$`，全局唯一 |
| `name` | 是 | 显示名，1–64 字符 |
| `version` | 否 | 缺省 `1.0.0` |
| `animations` | 是 | 至少 1 个，按播放顺序 |
| `animationMeta` | 否 | 每段 `fps`（1–60）与 `mode`（`loop` / `once`） |
| `preview` | 否 | 缩略图，必须存在 |
| `author` | 否 | 作者 |
| `license` | 否 | 素材许可证 |

约定：第一段动画是 idle，默认循环；没有 `animationMeta` 的旧包按“第一段 loop、其余 once”处理。

## 3. 限制

| 项 | 上限 |
| --- | --- |
| zip 文件 | 50 MB |
| 解压后总大小 | 120 MB |
| 条目数 | 200 |
| 单段动画 | 建议 640×360、VP9 alpha webm |

## 4. 校验

```bash
npx dsh-hex-pet validate ./my-pet.petpack.zip
npx dsh-hex-pet validate ./my-pet/            # 也可直接校验目录
npx dsh-hex-pet validate ./my-pet.petpack.zip --json
```

成功时退出码 0，打印 `id/name/version` 与文件列表；失败时退出码 1，输出稳定错误码：

| 错误码 | 含义 |
| --- | --- |
| `INVALID_ZIP` | 不是有效 zip |
| `TOO_MANY_ENTRIES` / `TOO_LARGE` | 条目数或体积超限 |
| `UNSAFE_PATH` | 非法路径 |
| `UNSUPPORTED_FILE` | 扩展名不在白名单 |
| `MISSING_MANIFEST` / `INVALID_MANIFEST` | manifest 缺失或 schema 失败 |
| `MISSING_ANIMATION` / `INVALID_ANIMATION` | 动画不存在或不是 webm/mov |
| `MISSING_PREVIEW` | preview 引用的文件不存在 |

## 5. 版本

- `schema` 为 `dsh-hex-pet.pack/1`；新增字段保持向后兼容。
- 破坏性变更时升级为 `/2`，安装器按 `schema` 分支处理。
