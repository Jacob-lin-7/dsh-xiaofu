# 验收清单

## 文件

- [ ] manifest.json 在 zip 根目录
- [ ] animations/idle.webm 存在且为第一段
- [ ] preview.png 存在
- [ ] 没有 `.DS_Store` / `__MACOSX` / 项目文件
- [ ] `npx dsh-hex-pet validate` 通过

## 画面

- [ ] 640×360、24fps、yuva420p
- [ ] 背景透明，无绿边/黑底
- [ ] 角色完整，无裁切
- [ ] 所有片段比例/服装/配色一致
- [ ] idle 首尾帧一致，循环不跳
- [ ] click 首尾接近站姿
- [ ] 无文字/水印/镜头运动

## 插件

- [ ] 网页端播放、点击有回应
- [ ] 桌面端播放、托盘/右键菜单正常
- [ ] 切换形象后重启保持
