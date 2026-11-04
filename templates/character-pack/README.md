# 角色制作模板

复制整个目录，按顺序改：

1. `character.md`：填角色设定。
2. `prompts/*.md`：把 `{{...}}` 换成你的角色描述。
3. `animations/`：放导出的 webm。
4. `manifest.json`：改 `id/name/animations`。
5. 打包 + `npx dsh-hex-pet validate`。

完整说明见仓库的 [docs/CHARACTER-SOP.md](../../docs/CHARACTER-SOP.md)。

最小可用：`idle.webm` + `click-happy.webm` + `preview.png`。
