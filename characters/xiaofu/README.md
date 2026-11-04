# 小符 · 制作进度

## 已完成

- [x] 角色设定
- [x] 第一张正面参考图（豆包生成）
- [x] 裁掉右下角水印、补成 16:9
- [x] 根据实际出图更新设定：白发、银白狐眸、纯白道袍、银白葫芦、赤脚站立
- [x] idle：6 秒循环、640×360、VP9 alpha、去水印、首尾接近
- [x] idle-2（空闲2）：10 秒循环、640×360、VP9 alpha、去水印
- [x] click：7 秒单次、首尾站姿、中段挥手、640×360、VP9 alpha
- [x] preview：idle 首帧
- [x] manifest + zip + 校验
- [x] 已导入测试实例并绑定 main

文件：`reference.png`、`green-reference.png`、`animations/idle.webm`、`animations/idle-2.webm`、`animations/click.webm`、`preview.png`、`manifest.json`、`xiaofu.petpack.zip`（约 4.1MB）

## 已完成

小符现已作为测试实例 main 的当前形象。桌面宠物仍保持关闭；网页刷新后可见。

## 动作映射（提示词已写好，待生成/已生成）

状态可能持续几分钟，所以动作是**无缝循环**：首帧就是动作中段，首尾逐帧相同，不回到站姿、不收手。

- [state-working](prompts/states/working.md)：任务进行中，6 秒循环（已生成 `animations/state-working.webm`）
- [state-approval](prompts/states/approval.md)：等待审批，8 秒循环（已生成 `animations/state-approval.webm`）
- [state-done](prompts/states/done.md)：任务完成，2.4 秒循环（已生成 `animations/state-done.webm`）
- [state-alert-time](prompts/states/alert-time.md)：耗时过长，6 秒循环（已生成 `animations/state-alert-time.webm`）
- [state-alert-cost](prompts/states/alert-cost.md)：token 过多，9 秒往返循环（已生成 `animations/state-alert-cost.webm`）

映射、气泡文案和循环设计见 [states.md](states.md)。

> 实际约 2.3 头身，比原计划的 1.5 更适合桌宠；第一版按站立做，不做悬浮。

## 第 4 步：打包

两条 webm + preview.png + manifest.json → zip → 校验 → 设置页上传。

---

## 文件

- `character.md`：角色设定、配色、禁止项
- `reference.png`：已裁水印的参考图
- `prompts/reference.md`：重新生成参考图时用
- `prompts/idle.md`：6 秒待机循环
- `prompts/click.md`：2.5 秒点击回应
