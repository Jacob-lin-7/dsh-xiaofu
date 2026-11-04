# 3 步做新角色

## 开始之前：先有一张角色图

**不要直接文生视频。** 先定一张正面全身图，再拿它做图生视频，角色形象才稳定。

两条路，任选一条：

### A. 已经有角色图

把图扔给生图 AI，用「图生图 / 轻微重绘」整理成：

- 正面、全身、Q 版约 2.3 头身；
- 浅灰纯色背景；
- 无文字、无水印、无多角色；
- 发型、服装、配色清楚。

重绘强度调低，只修构图和清晰度，不要换脸换衣服。

### B. 没有图，直接用提示词生图

把小符的示例改成你的角色即可：

```text
原创角色设定图，Q 版约 2.3 头身，全身正面站姿。

外形：白色长发，发尾银白渐变，一侧编一条细辫；银白狐眸，平时半睁；额前一枚小小的弯月符纹。
服装：纯白长道袍，白色内衬，长裙摆，不露裤子；腰间别一只银白色小葫芦；双手自然垂下；赤脚，双脚落地。
表情：平静、有点困、慢半拍，轻微傲娇；站姿自然，不要夸张动作，不要悬浮。
风格：干净的二次元赛璐璐上色，线条清晰，白色里保留银灰阴影，配色克制（白/银灰/月银），角色设计统一。
构图：纯浅灰背景，全身完整居中，不要裁切，16:9，脚底留一点空间。
限制：不要文字、不要水印、不要 logo、不要多角色、不要分屏、不要真实照片风。
```

定稿一张图后，**后面所有视频都用这张图做图生视频**。

---

## 第 1 步：生成角色图

用豆包 / 即梦 / Midjourney 等：

- 已有图：图生图，低重绘强度；
- 没有图：复制上面的提示词直接生图；
- 生成 3–5 张，选一张正面、全身、比例稳定的；
- 不要选动作夸张、裁切、侧身、带文字水印的。

小符的完整参考图和提示词：

- [reference.png](../characters/xiaofu/reference.png)
- [prompts/reference.md](../characters/xiaofu/prompts/reference.md)

---

## 第 2 步：用这张图生成绿幕视频

工具选「图生视频」，上传第 1 步的定稿图，比例 16:9，固定机位。

先粘**绿幕前缀**：

```text
16:9 视频，纯绿幕背景 #00FF00，颜色统一，无阴影、无渐变、无杂物、无地面、无边框。
角色完整居中：头顶约在画面 20%，脚底约在 85%，左右在 25%–75%；
任意部位距画幅边缘至少 10%，全程不能被裁切。
固定机位，不推拉、不摇移、不缩放。无文字、无字幕、无水印。
角色大小、比例、服装、配色全程不变。
原则：每一帧的亮度以及前后人物颜色保持一致；不要突然变亮/变暗、偏色或换色。
```

### 必做两条

**idle（无缝循环，6 秒）**

```text
动作：待机呼吸。
首帧就是动作中段，不要从站姿起手。
缓慢呼吸，胸口和肩膀轻微起伏；自然眨眼一次；
发尾和小葫芦轻轻晃；最后回到首帧姿态。
首帧和末帧逐帧相同，不要收手、不要回到站姿。
```

**click（无缝循环，3–4 秒）**

```text
动作：被点击后的回应。
首帧就是动作中段，不要从站姿起手。
抬手挥一下、表情从困变认真、小幅点头；
最后回到首帧姿态。
首帧和末帧逐帧相同，不要收手、不要回到站姿。
```

### 可选：5 条动作

- [state-working](../characters/xiaofu/prompts/states/working.md)：6 秒循环
- [state-approval](../characters/xiaofu/prompts/states/approval.md)：8 秒循环
- [state-done](../characters/xiaofu/prompts/states/done.md)：4 秒循环
- [state-alert-time](../characters/xiaofu/prompts/states/alert-time.md)：6 秒循环
- [state-alert-cost](../characters/xiaofu/prompts/states/alert-cost.md)：6 秒循环

状态动作的共同规则：**首帧就是动作中段，首尾逐帧相同，不收手**。

---

## 第 3 步：抠像、打包、上传

### 抠成透明 webm

```powershell
ffmpeg -i idle.mp4 -vf "chromakey=0x00FF00:0.12:0.18,despill=type=green,format=rgba,fps=24,scale=640:360:flags=lanczos" -c:v libvpx-vp9 -pix_fmt yuva420p -auto-alt-ref 0 -b:v 0 -crf 32 -an animations/idle.webm
```

click 同理，换输入输出文件名。

从 idle 截预览图：

```powershell
ffmpeg -i animations/idle.webm -frames:v 1 -vf "scale=640:360" preview.png
```

确认 alpha：

```powershell
ffprobe -v error -select_streams v:0 -show_entries stream=pix_fmt,width,height -of default=nw=1 animations/idle.webm
```

应看到 `yuva420p` 和 `640x360`。

### 写 manifest

```json
{
  "schema": "dsh-xiaofu.pack/1",
  "id": "my-pet",
  "name": "我的宠物",
  "version": "1.0.0",
  "animations": ["animations/idle.webm", "animations/click.webm"],
  "animationMeta": {
    "animations/idle.webm": { "fps": 24, "mode": "loop" },
    "animations/click.webm": { "fps": 24, "mode": "loop" }
  },
  "preview": "preview.png"
}
```

### 打包 + 校验 + 上传

```powershell
Compress-Archive -Path manifest.json,preview.png,animations -DestinationPath my-pet.petpack.zip -Force
npx dsh-xiaofu validate .\my-pet.petpack.zip
```

设置 → 桌宠配置 →「形象」→ 选择 zip → 设为当前形象。

---

## 就这三步

```text
① 一张角色图（图生图或提示词直出）
② 用这张图生成绿幕视频（idle / click / 可选状态）
③ 抠像 + manifest + zip + 上传
```

完整规格、更多动作和提示词细节见 [完整 SOP](./CHARACTER-SOP.md)。  
状态映射和气泡见 [states.md](../characters/xiaofu/states.md)。
