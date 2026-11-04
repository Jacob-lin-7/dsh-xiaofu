# dsh-xiaofu 0.2.0 改名说明

## 名称

```text
旧：dsh-hex-pet
新：dsh-xiaofu
展示名：桌宠配置
默认角色：小符
```

设置页标题统一为 **桌宠配置**，不再把「小符」写死为插件名；角色仍然可以由用户自定义/替换。

## 名称可用性

- GitHub 仓库搜索 `dsh-xiaofu`：0 个结果；
- npm `dsh-xiaofu`：404（当前未注册）；
- 未发现同名 DSH 桌宠插件。

> 名称可用性会变化，正式发布前建议先在 GitHub / npm 占位。

## 兼容迁移

### 数据目录

```text
$DSH_HOME/dsh-hex-pet  →  $DSH_HOME/dsh-xiaofu
```

启动时如果新目录不存在、旧目录存在，会自动重命名迁移；失败则回退旧目录。

### 路由

```text
新：/dsh-xiaofu/*
旧：/dsh-hex-pet/*  仍作为别名保留
```

### 深链

```text
新：?dsh-xiaofu=settings / chat
旧：?dsh-hex-pet=settings / chat  仍可识别
```

### 形象包格式

`dsh-hex-pet.pack/1` 暂时保留，避免已安装的 petpack 失效。  
后续大版本可以增加 `dsh-xiaofu.pack/1` 并做双格式兼容。

## GitHub 发布前待填

`package.json` 目前没有写死仓库地址，发布时补：

```json
"repository": { "type": "git", "url": "https://github.com/<account>/dsh-xiaofu.git" },
"homepage": "https://github.com/<account>/dsh-xiaofu#readme",
"bugs": { "url": "https://github.com/<account>/dsh-xiaofu/issues" }
```

## 验证

```text
npm test          84/84 通过
health            name=dsh-xiaofu version=0.2.0
dataDir           .dev/home/dsh-xiaofu
legacy route      /dsh-hex-pet/health → dsh-xiaofu
packs             迁移后仍可加载
```
