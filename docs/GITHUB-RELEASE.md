# GitHub 发布清单

## 1. 创建仓库

```powershell
git init
git add .
git commit -m "feat: dsh-xiaofu 0.3.3"
git branch -M main
git remote add origin https://github.com/Jacob-lin-7/dsh-xiaofu.git
git push -u origin main
```

`dist/`、`.dev/`、`lib/`、原始视频和 QC 图已在 `.gitignore` 中排除，不要提交。

## 2. 补 package.json 仓库信息

```json
"repository": {
  "type": "git",
  "url": "https://github.com/Jacob-lin-7/dsh-xiaofu.git"
},
"homepage": "https://github.com/Jacob-lin-7/dsh-xiaofu#readme",
"bugs": {
  "url": "https://github.com/Jacob-lin-7/dsh-xiaofu/issues"
}
```

## 3. 生成发布文件

```powershell
npm ci
npm test
npm pack --pack-destination dist
```

发布 release 时上传：

```text
dist/dsh-xiaofu-0.3.3.tgz
dist/xiaofu.petpack.zip
```

## 4. 打 tag

```powershell
git tag v0.3.3
git push origin v0.3.3
```

## 5. npm 发布（可选）

```powershell
npm publish --access public
```

发布前确认 `dsh-xiaofu` 名称仍可用。

## 6. Release 说明建议

- 默认安装即带小符，不需要手动导入；
- 首次启动自动迁移旧数据目录；
- Windows 重点验证；macOS / Linux 实验性；
- 客户端和桌面气泡样式、字体、位置、时长一致；
- 长气泡最大 300px，自动换行；
- 动作播完回到当前事件状态；
- DSH 退出时桌面 helper 一起退出。
