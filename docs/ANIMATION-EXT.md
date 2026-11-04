# 动画池扩展

> 对应 PRD R12。给已安装的形象包追加动画，**不改原包**，升级/删除包不受影响。

## 文件位置

```text
<DSH_HOME>/dsh-hex-pet/animation-ext/<packId>-ext.json
```

例如 `hex-purple` 的扩展文件：

```text
%USERPROFILE%\.dsh\dsh-hex-pet\animation-ext\hex-purple-ext.json
```

## 格式

```json
{
  "target": "animations/idle.webm",
  "append": [
    { "name": "animations/wave.webm", "mode": "once", "fps": 24 },
    { "name": "animations/sleep.webm", "mode": "loop", "fps": 18 }
  ]
}
```

- `target`：必须是该包 `manifest.animations` 里已有的条目；追加项按顺序插在它后面。
- `append[].name`：相对包根目录的路径，文件必须真实存在。
- `mode`：`loop` / `once`，缺省 `once`。
- `fps`：1–60，可选。

## 规则

- 只追加，不替换、不删除原动画。
- 追加项必须是 `.webm` 或 `.mov`。
- 路径必须安全：不能是绝对路径、不能含 `..`、不能含反斜杠。
- 不能与已有动画重名。
- **任何一条非法都会整段忽略**，回退到原始 manifest，不会出现半套动画。
- 生效时机：下次读取包列表或启动桌面宠物时；修改后重启对应桌面宠物即可看到新动作。

## 校验

扩展文件本身没有独立 CLI；追加的文件会走与安装时相同的路径/扩展名检查。可以先：

```bash
npx dsh-hex-pet validate ./your-pack.zip
```

确认基础包合法，再加扩展。
