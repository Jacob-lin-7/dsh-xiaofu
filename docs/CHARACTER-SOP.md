# 新角色制作 SOP（桌宠配置）

> 目标：从零做一只**有动作、有表情、能在网页和桌面同时播放**的宠物形象，并打包成当前插件可直接导入的 petpack。
>
> 流程参考了  公开的素材链：**AI 提示词 → 绿幕视频 → 透明动画 → webm**。它的提示词/素材许可为「允许开源使用、禁止商用」（见其 README「许可」）。本 SOP 的提示词是面向 Hex 的原创改写，不复制它的角色、立绘和素材。

---

## 用户行动方案（TL;DR）

### 路径 A：已经有透明素材（最快，约 10–30 分钟）

1. 准备 `idle.webm`（循环）和 `click-happy.webm`（单次）。
2. 从 idle 首帧导出 `preview.png`。
3. 写 `manifest.json`，第一段必须是 idle。
4. 打包 zip，跑 `npx dsh-xiaofu validate`。
5. 设置 → 桌宠配置 →「形象」→ 上传。

### 路径 B：从零做新角色（MVP 约 1 天，完整 2–3 天）

1. **先定角色图**（不要直接文生视频）：
   - 已经有角色图：把图扔给生图 AI 做「图生图 / 轻微重绘」，整理成一张正面全身设定图；
   - 没有图：直接用角色提示词生成一张正面全身图（小符示例见 [`characters/xiaofu/prompts/reference.md`](../characters/xiaofu/prompts/reference.md)）。
2. **用定稿角色图做图生视频**：同一张图作为参考，逐条生成动作，保证角色形象稳定。
3. **做 MVP 两段**：`idle`（无缝循环）、`click`（可循环的回应）。
4. **可选完整版**：再加 5 条状态动作（working / approval / done / alert-time / alert-cost），见第 5.6 节。
5. **QC**：绿幕均匀、角色不出画、不裁切、无镜头运动、无文字、每帧亮度和人物颜色一致。
6. **抠像导出 webm**：ffmpeg 命令见第 6.3 节，确认 `yuva420p`。
7. **写 manifest + 打包 + 校验 + 导入**：第 6.6–6.8 节。
8. **验收**：第 7 节清单逐项打勾。

> 快速版见 [CHARACTER-QUICKSTART.md](./CHARACTER-QUICKSTART.md)。

### 路径 C：手里是 Live2D / Spine / 别人的动态角色

- 当前插件不能直接读 `moc3` / `.skel`；
- 要么在源工具里导出成透明视频/序列帧，再走路径 A；
- 要么等 petpack v2 + 对应运行时；
- 不要直接复制 早期桌宠项目 的角色素材（角色 IP 不一定跟代码 MIT 走）。

---

## 0. 先选路线

| 路线 | 需要什么 | 适合 |
| --- | --- | --- |
| **A. 序列帧 / 透明 webm（当前插件直接可用）** | 每个动作一段 640×360 VP9-alpha webm，或 PNG/WebP 帧序列 | 现在就能导入，动作/表情是“预渲染”的 |
| B. Live2D | `model3.json` + `.moc3` + 贴图 + motions/expressions | 要视线跟随、口型、参数混合；当前插件**不支持**，需要 v2 |
| C. Spine | `.skel/.json` + `.atlas` + 贴图 | 骨骼动作混合；当前插件**不支持**，需要 v2 |

**本 SOP 只做 A。** 它已经能做到“看起来是活的、有多个动作和表情”，也是 早期桌宠项目 实际采用的方案。

---

## 1. 最终要交付的文件

### 1.1 给插件导入的 petpack（必须）

```text
my-character.petpack.zip
├─ manifest.json              # 必须
├─ preview.png                # 强烈建议：设置页/托盘缩略图
└─ animations/
   ├─ idle.webm               # 必须：第一段，默认循环
   ├─ click-happy.webm        # 建议：点击回应（可多段）
   ├─ click-shy.webm          # 可选
   ├─ drag.webm               # 可选：被拖拽时
   ├─ sleep-loop.webm         # 可选：睡眠循环
   ├─ work-thinking.webm      # 可选：DSH 工作中
   └─ work-waiting.webm       # 可选：等待确认
```

> 当前插件只强制要求 `manifest.json` + 至少一段动画；第一段作为 idle。  
> 点击时优先找文件名含 `click` / `tap` / `点击` 的动画，否则找第一段 `mode: once` 的动画。  
> 其余动画会出现在桌面右键「动作」菜单里。

### 1.2 制作工作区（建议保留，方便返工）

```text
my-character/
├─ character.md               # 角色设定（配色/比例/服装/道具/性格）
├─ prompts/
│  ├─ base.md                 # 通用前缀（绿幕、构图、安全区）
│  ├─ idle.md
│  ├─ click.md
│  ├─ drag.md
│  ├─ sleep.md
│  └─ work.md
├─ source/                    # AI 生成的原始绿幕视频 mp4/mov
├─ frames/                    # 抠像后的 PNG/WebP 序列（可选）
├─ out/
│  ├─ animations/*.webm
│  ├─ preview.png
│  └─ manifest.json
└─ my-character.petpack.zip
```

### 1.3 仓库里的模板

本仓库提供可直接复制的模板：

```text
templates/character-pack/
├─ README.md
├─ character.md
├─ manifest.json
├─ qc.md
├─ prompts/
│  ├─ base.md
│  ├─ idle.md
│  ├─ click.md
│  ├─ drag.md
│  ├─ sleep.md
│  └─ work.md
└─ animations/                # 放导出的 webm
```

复制后把 `{{...}}` 占位符替换成你的角色即可。

---

## 2. 画面规格（所有动作必须一致）

| 项 | 规格 |
| --- | --- |
| 画布 | 16:9；母版 1280×720，导出 640×360 |
| 背景 | 纯绿幕 `#00FF00`，无阴影、渐变、杂物、边框 |
| 人物位置 | 水平居中；头顶约在画面 20% 高度，脚底约 85% |
| 人物宽度 | 最左/最右边缘约在画面 25% / 75% |
| 安全区 | 任意部位/特效距画幅边缘 ≥10%，全程不能被裁切 |
| 机位 | 固定，不推拉、不摇移、不缩放 |
| 帧率 | 24fps（母版 30fps 可，导出 24fps） |
| 时长 | idle 4–8s 循环；click 1.5–3s 单次；drag 2–4s；sleep 6–10s；工作状态 2–4s 循环 |
| 文字 | 禁止字幕、水印、logo；只允许图形化 `Zzz` 之类符号 |
| 一致性 | 所有片段的角色大小、比例、服装、配色、绿幕色值完全一致 |

**首尾帧规则**

- **循环片段**（idle / sleep-loop / work-*）：第一帧与最后一帧必须**逐帧相同**，接缝不跳。
- **单次片段**（click / drag / sleep-start / sleep-end）：首尾尽量回到中性站姿，方便切回 idle 不突兀。
- **拖拽片段**：全程是“被无形手抓住悬空”的姿势，不要真的画出人手。

---

## 3. 先做角色设定（character.md）

不要一上来就生成视频。先固定：

```markdown
# {{角色名}}

- 一句话：{{Q版/写实}}的{{物种/职业}}，{{性格}}。
- 主色：{{主色 HEX}}；辅色：{{辅色 HEX}}；点缀：{{点缀色 HEX}}。
- 体型：{{头身比}}，{{身高/胖瘦}}。
- 发型/耳朵/尾巴/翅膀：{{...}}
- 服装：{{...}}
- 道具：{{...}}
- 标志特征（必须每段都出现）：{{...}}
- 禁止出现：{{...}}
```

**验收**：只看剪影也能认出是同一个角色；不同动作里至少 2 个标志特征保持一致。

---

## 4. 通用提示词前缀（base.md）

每次生成视频都粘这段，再粘具体动作。它是“构图/绿幕/安全区”的硬约束。

```text
【通用前缀｜所有片段必须完全一致】

视频比例 16:9。背景必须是纯绿幕色 #00FF00，颜色严格统一，无阴影、无渐变、无杂物、无边框、无地面。
角色必须完整位于画面内：头顶约在画面垂直 20% 处，脚底约在 85% 处；身体最左/最右边缘约在画面水平 25%/75% 处。
角色全程水平居中，不允许左右/前后平移；只允许原地动作、重心起伏、关节运动。
任意一帧中，角色任何部位（头发、耳朵、尾巴、裙摆、手指、道具）以及所有特效，距画幅四边都必须保持 ≥10% 的安全距离，绝对不能接触、超出或被裁切。
固定机位，不推拉、不摇移、不旋转、不缩放。
所有视频的角色大小、比例、服装、配色、绿幕色值必须完全一致，像同一套素材。
原则：每一帧的亮度以及前后人物颜色保持一致；不要突然变亮/变暗、偏色或换色。
画面无文字、无字幕、无水印、无 logo；除动作里明确要求的图形符号外，不允许出现任何字符。
角色不要与镜头互动，不要看镜头外，不要走出画面。
```

**负面提示词（negative prompt）**

```text
文字, 字幕, 水印, logo, 多角色, 分屏, 画中画, 镜头运动, 推拉, 摇移, 旋转, 缩放, 景深, 运动模糊,
绿幕不纯, 阴影投在背景, 渐变背景, 地面, 道具入镜, 角色出画, 裁切, 比例变化, 服装变化, 颜色变化,
多余手指, 肢体扭曲, 面部崩坏, 真实人手, 真实场景
```

---

## 5. 动作提示词模板

### 5.1 idle（待机循环）

```text
【动作】待机呼吸
【时长】6 秒，可无缝循环
【首帧】标准正面站姿：{{站姿描述}}，双眼睁开平视前方，{{标志特征}}自然状态，画面干净无道具。
【动作分解】
0–1s：静止，胸口极轻微起伏。
1–3s：缓慢吸气，肩膀与胸口轻微抬起，{{尾巴/耳朵/呆毛}}随呼吸轻摆。
3–4s：自然眨眼一次，视线仍向前。
4–5s：缓慢呼气，回到最低点。
5–6s：姿态回到与第 0 秒完全一致，准备循环。
【尾帧】必须与首帧逐帧相同，可直接循环。
【禁止】位移、转身、说话、文字、道具、镜头运动。
```

### 5.2 click（点击回应，单次）

```text
【动作】点击回应-{{情绪，如开心/害羞/傲娇}}
【时长】2.5 秒，单次播放
【首帧】标准正面站姿，与 idle 首帧一致。
【动作分解】
0–0.4s：被点到，身体轻微一顿，眼睛睁大。
0.4–1.2s：{{反应动作，如挥手/捂脸/叉腰}}，{{尾巴/耳朵}}跟着动。
1.2–2.0s：表情{{情绪}}，小幅弹跳或摆动。
2.0–2.5s：回到标准站姿，尾帧尽量接近首帧。
【禁止】位移、转身、出画、文字、镜头运动。
```

建议至少做 3 段不同情绪：`click-happy` / `click-shy` / `click-proud`。

### 5.3 drag（被拖拽）

```text
【动作】被无形手抓住悬空
【时长】3 秒，可循环
【首帧】身体被轻轻提起，双脚离地，双臂自然下垂或微微张开，{{尾巴/头发}}因重力下垂。
【动作分解】
0–1s：身体轻微左右晃，双腿自然摆动。
1–2s：{{尾巴/耳朵}}滞后摆动，表情{{惊讶/无奈}}。
2–3s：回到与首帧接近的姿态，准备循环。
【禁止】画出人手、位移出画、镜头运动、文字。
```

### 5.4 sleep（睡眠循环）

如果需要“开始/循环/起来”三段，分别命名 `sleep-start` / `sleep-loop` / `sleep-end`；当前插件只会循环播放你指定的那段，建议先做 `sleep-loop`。

```text
【动作】原地蜷缩打盹
【时长】8 秒，可无缝循环
【首帧】蜷成一团坐着，双手垫在脸侧，{{尾巴}}绕到身前，双眼闭合，{{呆毛}}垂下。
【动作分解】
0–2s：极轻微呼吸起伏。
2–5s：{{尾巴尖/呆毛}}随呼吸轻颤，头顶飘出 2–3 个半透明 Zzz。
5–7s：Zzz 缓慢上升并完全淡出。
7–8s：呼吸回到起始相位，姿态与首帧逐帧相同。
【尾帧】必须与首帧逐帧相同。
【禁止】睁眼、起身、位移、文字、镜头运动。
```

### 5.5 动作映射（固定事件，长动作用无缝循环）

状态可能持续几分钟，所以不要做「起手 → 动作 → 收手」的短循环。正确做法：

- **首帧就是动作中段**，不是站姿；
- **首尾帧逐帧相同**，但都是动作中段；
- 不回到站姿、不收手、不在首尾停顿；
- 6–8 秒一条，减少循环频率；
- 状态持续多久，动作就循环多久；气泡同时常驻。

| 状态 | 文件 | 首帧在做什么 | 气泡 |
| --- | --- | --- | --- |
| 任务进行中 | `state-working.webm` | 前倾、拿符纸、手正要点浮起的纸 | 正在处理… |
| 等待审批 | `state-approval.webm` | 双手捧着空白符纸等确认 | 这里需要你确认一下 |
| 任务完成 | `state-done.webm` | 微蹲、合掌、正在庆祝 | 搞定啦 |
| 耗时过长 | `state-alert-time.webm` | 叉腰、鼓腮、脚尖点地 | 这一步有点久了… |
| 余额警告 | `state-alert-cost.webm` | 捧着倒过来的小葫芦在晃 | 余额/消耗提醒 |

完整可复制提示词：

- [`characters/xiaofu/prompts/states/working.md`](../characters/xiaofu/prompts/states/working.md)
- [`characters/xiaofu/prompts/states/approval.md`](../characters/xiaofu/prompts/states/approval.md)
- [`characters/xiaofu/prompts/states/done.md`](../characters/xiaofu/prompts/states/done.md)
- [`characters/xiaofu/prompts/states/alert-time.md`](../characters/xiaofu/prompts/states/alert-time.md)
- [`characters/xiaofu/prompts/states/alert-cost.md`](../characters/xiaofu/prompts/states/alert-cost.md)

状态映射、气泡文案和「为什么对话框不烧进视频」见
[`characters/xiaofu/states.md`](../characters/xiaofu/states.md)。

---

## 6. 生成与后期流程

### 6.1 生成原始绿幕视频

1. **优先图生视频**：先按第 3、4 节定一张正面全身角色图，再用它逐条生成动作；不要直接文生视频，否则每条角色都会漂。
2. 选支持 16:9、10 秒、图生视频的工具（豆包、即梦、可灵、Runway、Pika 等）。
3. 每条都上传同一张角色图，粘「通用前缀 + 动作模板 + 负面提示词」。
4. **一个动作生成一条视频**，不要一条视频里塞多个动作。
5. 每条至少生成 2–3 个候选，选背景最干净、没有裁切、没有镜头运动的。
6. 长状态（working / approval / alert）用「首帧就是动作中段」的无缝循环，不要做「起手→收手」。

### 6.2 质检原始视频（不通过就重生成）

- [ ] 背景是均匀纯绿，没有阴影/渐变/地面
- [ ] 角色没有出画、没有被裁切
- [ ] 没有镜头推拉/摇移/缩放
- [ ] 没有文字/水印/字幕
- [ ] 角色比例、服装、配色和上一条一致
- [ ] 每一帧亮度稳定，前后人物颜色一致；没有突然变亮/变暗、偏色或换色
- [ ] 首尾帧符合循环/单次规则

### 6.3 抠像 + 导出透明 webm

需要 ffmpeg。母版 1280×720，导出 640×360：

```bash
ffmpeg -i source/idle.mp4 \
  -vf "chromakey=0x00FF00:0.12:0.18,despill=type=green,format=rgba,fps=24,scale=640:360:flags=lanczos" \
  -c:v libvpx-vp9 -pix_fmt yuva420p -auto-alt-ref 0 -b:v 0 -crf 32 -row-mt 1 \
  out/animations/idle.webm
```

说明：

- `chromakey=0x00FF00:0.12:0.18`：绿色键；边缘残留就微调 `similarity` / `blend`。
- `despill=type=green`：压掉绿色反光。
- `format=rgba` + `-pix_fmt yuva420p`：保留 alpha。
- `-auto-alt-ref 0`：避免 alpha 被参考帧吃掉。
- 如果原始视频有声音，加 `-an`。

**验证 alpha：**

```bash
ffprobe -v error -select_streams v:0 -show_entries stream=pix_fmt,width,height,r_frame_rate -of default=nw=1 out/animations/idle.webm
```

应看到 `pix_fmt=yuva420p`、`640x360`、`24/1`。

### 6.4 做循环/裁剪

- 只保留动作段，去掉首尾多余静止。
- 循环片段：用剪辑软件或 ffmpeg 让最后一帧与第一帧一致；必要时复制首帧到尾部。
- 单次片段：保留自然收尾，不要硬切回站姿。

### 6.5 生成 preview.png

从 idle 首帧导出一张 640×360 PNG，透明背景：

```bash
ffmpeg -i out/animations/idle.webm -frames:v 1 -vf "scale=640:360" preview.png
```

### 6.6 写 manifest.json

```json
{
  "schema": "dsh-xiaofu.pack/1",
  "id": "my-character",
  "name": "我的角色",
  "version": "1.0.0",
  "author": "your-name",
  "license": "CC-BY-4.0",
  "animations": [
    "animations/idle.webm",
    "animations/click-happy.webm",
    "animations/click-shy.webm",
    "animations/drag.webm",
    "animations/sleep-loop.webm"
  ],
  "animationMeta": {
    "animations/idle.webm": { "fps": 24, "mode": "loop" },
    "animations/click-happy.webm": { "fps": 24, "mode": "once" },
    "animations/click-shy.webm": { "fps": 24, "mode": "once" },
    "animations/drag.webm": { "fps": 24, "mode": "loop" },
    "animations/sleep-loop.webm": { "fps": 24, "mode": "loop" }
  },
  "preview": "preview.png"
}
```

约束：

- `id` 只能 `a-z0-9-`，2–32 位，全局唯一。
- `animations` 第一段是 idle；至少 1 段。
- 动画只接受 `.webm` / `.mov`。
- 包内路径不能有 `..`、反斜杠、绝对路径。
- zip ≤ 50MB，解压后 ≤ 120MB，条目 ≤ 200。

### 6.7 打包

```powershell
Compress-Archive -Path manifest.json,preview.png,animations -DestinationPath my-character.petpack.zip -Force
```

### 6.8 校验 + 导入

```bash
npx dsh-xiaofu validate ./my-character.petpack.zip
```

通过后：设置 → 桌宠配置 →「形象」→ 选择文件 → 上传 → 设为当前形象。

---

## 7. 验收清单（导入前逐项打勾）

### 文件

- [ ] `manifest.json` 在 zip 根目录
- [ ] `animations/idle.webm` 存在且是第一段
- [ ] `preview.png` 存在（建议）
- [ ] 没有多余目录/临时文件（`.DS_Store`、`__MACOSX`、项目文件）
- [ ] `npx dsh-xiaofu validate` 通过

### 画面

- [ ] 640×360、24fps、`yuva420p`
- [ ] 背景透明，无绿边/黑底
- [ ] 角色完整，无裁切
- [ ] 所有片段角色比例/服装/配色一致
- [ ] idle 首尾帧一致，循环不跳
- [ ] click 首尾接近站姿，切回 idle 不突兀
- [ ] 没有文字/水印/镜头运动

### 插件内

- [ ] 网页端能播放、点击有回应
- [ ] 桌面端能播放、托盘/右键菜单正常
- [ ] 切换形象后重启仍保持
- [ ] 拖拽、隐藏、显示正常

---

## 8. 当前插件的限制（重要）

- 现在主要播 **idle + 点击**；`drag` / `sleep` / `work-*` 片段会出现在桌面右键「动作」里，但**还不是自动状态机**。
- 桌面端和网页端共用同一套 webm；macOS Safari 不支持 VP9-alpha，后续需要 `.mov` 分支。
- 不支持 Live2D/Spine 的参数级动画；要做视线跟随/口型，需要 petpack v2 + 对应运行时。
- 角色版权：AI 工具的商用条款、角色 IP、素材许可要自己确认；不要直接复制 早期桌宠项目 的角色素材。

---

## 9. 最小可行版本（赶时间就做这三段）

1. `idle.webm`：6 秒循环，呼吸 + 眨眼。
2. `click-happy.webm`：2.5 秒单次，挥手/开心反应。
3. `preview.png`：idle 首帧。

有这三段就已经是可用的新形象；后面再补 drag / sleep / work。
