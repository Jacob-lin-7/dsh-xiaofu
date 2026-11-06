import type { IncomingMessage, ServerResponse } from 'node:http';
import { createReadStream, cpSync, existsSync, mkdirSync, watchFile, unwatchFile } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, resolve, sep, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ZodError } from 'zod';
import { ConfigStore, resolveDataDir } from './config.js';
import type { Config } from '../shared/schema.js';
import { FEATURES, resolveFeature } from '../shared/features.js';
import { composeMenu } from '../shared/menu.js';
import { withPetSettingsLink } from '../shared/deeplink.js';
import type { Capabilities } from '../shared/features.js';
import { installPack, listPacks, deletePack, PackError, MAX_ZIP_BYTES, manifestSchema } from './packs.js';
import type { PackInfo } from './packs.js';
import { exportPack } from './export.js';
import { applyAnimationExt } from './animation-ext.js';
import { arrangeDesktopPets } from './arrange.js';
import { EmojiStore, EmojiError, MAX_EMOJI_BYTES } from './emoji.js';
import { SoundStore, SoundError, MAX_SOUND_BYTES } from './sound.js';
import { WhisperService } from './llm.js';
import { StateController, StateError } from './state.js';
import { AutoTaskDriver } from './auto-task.js';
import { readAccountBalance, TaskUsageGuard, tokensInUsage } from './balance.js';
import { StudioStore } from './studio.js';
import { desktopManager } from './desktop.js';
import { HiddenStore } from './hidden.js';
import { MediaManager } from './media.js';
import {
  generatePack,
  inspectFrames,
  MAX_GENERATE_ZIP_BYTES,
  importTransparentWebm,
  MAX_PASSTHROUGH_BYTES,
} from './generate.js';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export const name = 'dsh-xiaofu';
export const inject = ['webServer'];

const BUBBLE_STYLE_PRESETS: Record<string, Record<string, string | number>> = {
  classic: {
    background: '#ffffff',
    color: '#1f2937',
    border: '1px solid rgba(127,127,127,0.35)',
    borderRadius: 12,
    boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
    padding: '7px 11px',
  },
  soft: {
    background: '#fffaf2',
    color: '#4b3a2f',
    border: '1px solid rgba(180,140,100,0.25)',
    borderRadius: 20,
    boxShadow: '0 10px 28px rgba(120,80,40,0.16)',
    padding: '9px 14px',
  },
  comic: {
    background: '#ffffff',
    color: '#111827',
    border: '3px solid #111827',
    borderRadius: 6,
    boxShadow: '3px 3px 0 #111827',
    padding: '6px 11px',
    fontWeight: 700,
  },
  pixel: {
    background: '#f8fafc',
    color: '#0f172a',
    border: '2px solid #0f172a',
    borderRadius: 0,
    boxShadow: '4px 4px 0 #0f172a',
    padding: '8px 12px',
    fontFamily: 'ui-monospace, Consolas, monospace',
  },
  scroll: {
    background: '#f4ecd8',
    color: '#3f2f1f',
    border: '2px solid #8b6f47',
    borderRadius: 2,
    boxShadow: '0 6px 18px rgba(80,60,30,0.18)',
    padding: '8px 13px',
  },
  dark: {
    background: 'rgba(17,24,39,0.94)',
    color: '#f8fafc',
    border: '1px solid #475569',
    borderRadius: 14,
    boxShadow: '0 8px 26px rgba(0,0,0,0.35)',
    padding: '8px 12px',
  },
};

const BUBBLE_FONT_STACKS: Record<string, string> = {
  system: 'system-ui, -apple-system, "Segoe UI", sans-serif',
  sans: 'Arial, "Microsoft YaHei", sans-serif',
  serif: 'Georgia, "Songti SC", serif',
  mono: 'ui-monospace, "Cascadia Mono", Consolas, monospace',
  cute: '"YouYuan", "幼圆", "Comic Sans MS", "Microsoft YaHei", sans-serif',
  anime: '"Segoe Print", "Comic Sans MS", "华文琥珀", "Microsoft YaHei", cursive',
  kai: '"KaiTi", "楷体", "STKaiti", serif',
  song: '"SimSun", "宋体", "Songti SC", serif',
  brush: '"STXingkai", "华文行楷", "KaiTi", cursive',
  seal: '"LiSu", "隶书", "STLiti", serif',
  round: '"Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", sans-serif',
};

const BUBBLE_BUILTIN_FONTS: Record<string, string> = {
  kuaile: 'zcool-kuaile.woff2',
  qingke: 'zcool-qingke-huangyou.woff2',
  mashan: 'ma-shan-zheng.woff2',
  zhimang: 'zhi-mang-xing.woff2',
  longcang: 'long-cang.woff2',
  xiaowei: 'zcool-xiaowei.woff2',
};

function bubbleStyleFor(
  bubble: Config['bubble'],
  petSize: number,
  dshUrl: string,
): Record<string, string | number> {
  const styleId =
    bubble.style === 'custom' && bubble.customAsset ? 'custom' : bubble.style || 'classic';
  const scale = bubble.scaleWithPet
    ? Math.max(0.85, Math.min(1.6, (petSize || 420) / 420))
    : 1;
  const style: Record<string, string | number> = {
    fontSize: Math.round((Number(bubble.fontSize) || 13) * scale),
  };
  const fontKey = bubble.fontFamily || '';
  if (fontKey && fontKey !== 'inherit' && !fontKey.includes(':')) {
    const font = BUBBLE_FONT_STACKS[fontKey];
    if (font) style.fontFamily = font;
  }
  if (fontKey.startsWith('builtin:')) {
    const id = fontKey.slice('builtin:'.length);
    const file = BUBBLE_BUILTIN_FONTS[id];
    if (file) {
      style.fontFamily = `"HexBuiltin-${id}", sans-serif`;
      style.__fontName = `HexBuiltin-${id}`;
      style.__fontUrl = `${dshUrl}/dsh-xiaofu/font/builtin/${encodeURIComponent(file)}`;
    }
  } else if (fontKey.startsWith('custom:')) {
    const asset = fontKey.slice('custom:'.length);
    const name = `HexCustom-${asset.replace(/[^a-zA-Z0-9]/g, '')}`;
    style.fontFamily = `"${name}", sans-serif`;
    style.__fontName = name;
    style.__fontUrl = `${dshUrl}/dsh-xiaofu/font/asset/${encodeURIComponent(asset)}`;
  }
  if (bubble.fontWeight === 'bold') style.fontWeight = 700;
  if (bubble.fontStyle === 'italic') style.fontStyle = 'italic';

  if (styleId === 'custom' && bubble.customAsset) {
    style.backgroundImage = `url(${dshUrl}/dsh-xiaofu/bubble/asset/${encodeURIComponent(
      bubble.customAsset,
    )})`;
    style.backgroundSize = '100% 100%';
    style.backgroundRepeat = 'no-repeat';
    style.color = '#1f2937';
    style.border = 'none';
    style.borderRadius = 12;
    style.boxShadow = 'none';
    style.padding = '16px 20px';
    return style;
  }
  return { ...(BUBBLE_STYLE_PRESETS[styleId] ?? BUBBLE_STYLE_PRESETS.classic), ...style };
}

const PLUGIN_VERSION = '0.3.0';
const ROUTE_PREFIX = '/dsh-xiaofu';
const LEGACY_ROUTE_PREFIX = '/dsh-hex-pet';
const MAX_BODY_BYTES = 1024 * 1024;
const MEDIA_TYPES: Record<string, string> = {
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

function sendFile(res: ServerResponse, file: string, size: number, contentType: string): void {
  res.writeHead(200, {
    'content-type': contentType,
    'content-length': size,
    'cache-control': 'public, max-age=3600',
  });
  createReadStream(file).pipe(res);
}

async function sendMarkdownPage(
  res: ServerResponse,
  file: string,
  title: string,
): Promise<void> {
  try {
    const markdown = await readFile(file, 'utf8');
    const escaped = markdown
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    res.writeHead(200, {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
    });
    res.end(
      `<!doctype html><meta charset="utf-8"><title>${title}</title>` +
        `<style>body{margin:0;background:#f6f5fb;color:#1f1b2e;font:14px/1.7 system-ui,"Microsoft YaHei",sans-serif}` +
        `main{max-width:900px;margin:0 auto;padding:32px 24px 64px}pre{white-space:pre-wrap;word-break:break-word;background:#fff;` +
        `border:1px solid #e4e0f0;border-radius:12px;padding:24px;box-shadow:0 8px 30px rgba(60,40,120,.08)}</style>` +
        `<main><pre>${escaped}</pre></main>`,
    );
  } catch (error) {
    sendJson(res, 404, {
      error: 'DOC_NOT_FOUND',
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const text = JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(text),
    'cache-control': 'no-store',
  });
  res.end(text);
}

function readBody(req: IncomingMessage): Promise<string> {
  return readBodyBuffer(req, MAX_BODY_BYTES).then((buffer) => buffer.toString('utf8'));
}

function readBodyBuffer(req: IncomingMessage, limit: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error('request body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function pathnameOf(url: string | undefined): string {
  const raw = url ?? '/';
  const index = raw.indexOf('?');
  return index >= 0 ? raw.slice(0, index) : raw;
}

export function apply(ctx: {
  effect(fn: () => unknown, label?: string): void;
  webServer: {
    port?: number;
    register(options: {
      kind: 'prefix';
      path: string;
      handler: (req: IncomingMessage, res: ServerResponse) => Promise<void> | void;
    }): unknown;
  };
  /** 可选：DSH 实时 Agent 注册表；旧宿主没有该服务时状态显示为不可用。 */
  agents?: {
    list(): Array<{ status?: string }>;
  };
  deepseekAccount?: {
    getBalance(): Promise<unknown>;
  };
  inject?(deps: string[], callback: (ctx: Record<string, unknown>) => unknown): unknown;
  on?(
    event: string,
    listener: (...args: any[]) => unknown,
    options?: { prepend?: boolean; global?: boolean },
  ): unknown;
}): void {
  const store = new ConfigStore({ dataDir: resolveDataDir() });

  // DSH 退出或插件卸载时，连同所有桌面 helper 一起停止。
  ctx.effect(() => () => {
    desktopManager.stop();
  }, 'dsh-xiaofu: desktop lifecycle');

  // 首次安装直接把小符形象包复制进数据目录，避免用户先看到六边形占位。
  const bundledPackDir = fileURLToPath(new URL('../../assets/xiaofu', import.meta.url));
  const installedPackDir = join(store.dataDir, 'packs', 'xiaofu');
  if (!existsSync(installedPackDir) && existsSync(bundledPackDir)) {
    try {
      mkdirSync(join(store.dataDir, 'packs'), { recursive: true });
      cpSync(bundledPackDir, installedPackDir, { recursive: true });
    } catch {
      // 复制失败时仍允许网页/手动导入角色包。
    }
  }
  const emoji = new EmojiStore(store.dataDir);
  const sound = new SoundStore(store.dataDir);
  const whisper = new WhisperService(async () => store.read());
  const stateController = new StateController(async () => store.read());
  const autoTask = new AutoTaskDriver(stateController);

  // 参考 早期桌宠项目：监听 DSH 会话事件，自动切换任务动作。
  ctx.on?.('session/event', (...args: any[]) => {
    const session = args[0] as { id?: string; header?: { id?: string } } | undefined;
    const event = args[args.length - 1] as
      | { type?: string; data?: { usage?: unknown } }
      | undefined;
    if (!event || typeof event !== 'object') return;
    if (event.type === 'assistant/message') {
      const tokens = tokensInUsage(event.data?.usage);
      if (tokens > 0) {
        taskUsage.add(tokens);
        void checkBalanceWarning();
      }
    }
    autoTask.onSessionEvent(session?.header?.id ?? session?.id ?? 'default', event);
  });
  // 审批请求期间显示“等待确认”，审批结束后恢复任务状态。
  ctx.on?.(
    'approval/request',
    (...args: any[]) => {
      const request = args[0] as
        | { agent?: { session?: { id?: string } }; session?: { id?: string } }
        | undefined;
      const next = args[args.length - 1];
      if (typeof next === 'function') {
        const sessionId = request?.agent?.session?.id ?? request?.session?.id ?? 'default';
        return autoTask.wrapApproval(sessionId, next as () => Promise<unknown>);
      }
      return undefined;
    },
    // UI 审批应答器可能先注册并 claim 这个 waterfall；必须排在它前面才能切状态。
    { prepend: true },
  );
  const taskUsage = new TaskUsageGuard();
  const studio = new StudioStore(store.dataDir);
  let getAccountBalance: (() => Promise<unknown>) | undefined;
  ctx.inject?.(['deepseekAccount'], (accountCtx) => {
    const account = accountCtx.deepseekAccount as
      | { getBalance?: () => Promise<unknown> }
      | undefined;
    if (typeof account?.getBalance === 'function') {
      getAccountBalance = () => account.getBalance!();
    }
  });

  const checkBalanceWarning = async () => {
    if (taskUsage.triggered) return null;
    if (autoTask.isApprovalActive) return null;
    const config = await store.read();
    const activePack = config.pets?.[0]?.pack;
    const mappingEntries =
      (activePack ? config.stateMapping.byCharacter?.[activePack]?.entries : undefined) ??
      config.stateMapping.entries;
    const entry = mappingEntries.find(
      (item) => item.event === 'balance-warning' && item.enabled,
    );
    if (!entry) return null;

    const reasons: string[] = [];
    const tokenThreshold = config.balanceWarning.tokenThreshold;
    if (tokenThreshold > 0 && taskUsage.tokens >= tokenThreshold) {
      reasons.push(`本次任务已用 ${taskUsage.tokens.toLocaleString()} token`);
    }
    const account = await readAccountBalance(getAccountBalance);
    for (const threshold of config.balanceWarning.thresholds) {
      const balance = account.currencies[threshold.currency];
      if (Number.isFinite(balance) && balance <= threshold.amount) {
        reasons.push(
          `${threshold.currency} 余额 ${balance.toFixed(2)} ≤ ${threshold.amount}`,
        );
      }
    }
    if (reasons.length === 0) return null;

    taskUsage.triggered = true;
    return stateController.trigger('balance-warning', reasons.join(' · '), async () => {
      // 余额警告结束后：有任务回任务动作，没有任务回空闲。
      if (autoTask.isTaskActive) await autoTask.resumeTask();
      else stateController.clear();
    });
  };
  let lastConfig: Config | undefined;
  let lastConfigJson = '';
  const rememberConfig = (config: Config): void => {
    lastConfig = config;
    lastConfigJson = JSON.stringify(config);
  };
  void store.read().then(rememberConfig).catch(() => {});
  store.onWrite(rememberConfig);

  const withPackOverrides = (config: Config, packs: PackInfo[]): PackInfo[] =>
    packs.map((pack) => ({
      ...pack,
      name: config.packs[pack.id]?.displayName?.trim() || pack.name,
      version: config.packs[pack.id]?.displayVersion?.trim() || pack.version,
      enabled: config.packs[pack.id]?.enabled ?? true,
    }));
  const media = new MediaManager(store.dataDir);

  interface PetLike {
    id: string;
    name?: string;
    pack: string;
    size?: number;
    display?: string;
    autoStart?: boolean;
    clickAction?: string;
    clickAnimation?: string;
    clickAnimations?: string[];
    doubleClickAction?: string;
    doubleClickAnimation?: string;
    doubleClickAnimations?: string[];
    trayIconPack?: string;
    position?: {
      corner?: string;
      marginX?: number;
      marginY?: number;
      x?: number;
      y?: number;
    };
  }

  const desktopHidden = new HiddenStore(join(store.dataDir, 'hidden.json'));
  desktopHidden.load();

  const startDesktopForPet = async (pet: PetLike): Promise<void> => {
    const hiddenUntil = desktopHidden.get(pet.id);
    const config = await store.read();
    const soundClick = resolveFeature(config, pet.id, 'sound.click');
    const clickEnabled = resolveFeature(config, pet.id, 'interaction.click');
    const roamEnabled = resolveFeature(config, pet.id, 'motion.roam');
    const soundVolume = config.sound.volume;
    const soundFile = config.sound.file
      ? join(store.dataDir, 'sounds', config.sound.file)
      : undefined;
    const bubbleEmoji = config.bubble.emojiId
      ? await emoji.asset(config.bubble.emojiId)
      : undefined;
    const packDir = join(store.dataDir, 'packs', pet.pack);
    const stored = manifestSchema.parse(
      JSON.parse(await readFile(join(packDir, 'manifest.json'), 'utf8')),
    );
    const manifest = await applyAnimationExt(store.dataDir, pet.pack, stored);
    const mappingEntries =
      config.stateMapping.byCharacter?.[pet.pack]?.entries ??
      config.stateMapping.entries;
    const idleMapping = mappingEntries.find(
      (entry) => entry.event === 'idle' && entry.enabled,
    );
    const animation =
      idleMapping && manifest.animations?.includes(idleMapping.animation)
        ? idleMapping.animation
        : manifest.animations?.[0];
    if (!animation) throw new Error('形象包没有动画');
    const idleNames = (
      idleMapping?.animations?.length ? idleMapping.animations : [animation]
    ).filter((name) => manifest.animations?.includes(name));
    const idleVideoPaths = (idleNames.length > 0 ? idleNames : [animation]).map(
      (name) => join(packDir, name),
    );
    const animations = (manifest.animations ?? []).map((name, index) => ({
      name,
      label:
        config.actionNames?.[`${pet.pack}/${name}`] ??
        {
          'animations/idle.webm': '空闲',
          'animations/click.webm': '点击回应',
          'animations/state-working.webm': '任务进行中',
          'animations/state-approval.webm': '等待确认',
          'animations/state-done.webm': '任务完成',
          'animations/state-alert-time.webm': '耗时过长',
          'animations/state-alert-cost.webm': '余额警告',
        }[name] ??
        name
          .replace(/^animations\//, '')
          .replace(/\.(webm|mov)$/i, '')
          .replace(/[-_]+/g, ' '),
      path: join(packDir, name),
      mode:
        manifest.animationMeta?.[name]?.mode ?? (index === 0 ? ('loop' as const) : ('once' as const)),
      fps: manifest.animationMeta?.[name]?.fps,
    }));
    const packList = withPackOverrides(config, await listPacks(store.dataDir));
    const packs = packList.map((item) => ({
      id: item.id,
      name: item.name,
    }));
    const trayPack = pet.trayIconPack
      ? packList.find((item) => item.id === pet.trayIconPack)
      : undefined;
    const desktopDir = join(store.dataDir, '.desktop');
    await mkdir(desktopDir, { recursive: true });
    const packsFile = join(desktopDir, `packs-${pet.id}.json`);
    await writeFile(packsFile, JSON.stringify(packs), 'utf8');
    const animationsFile = join(desktopDir, `animations-${pet.id}.json`);
    await writeFile(animationsFile, JSON.stringify(animations), 'utf8');
    const port = typeof ctx.webServer?.port === 'number' ? ctx.webServer.port : 0;
    const dshUrl = process.env.DSH_WEB_URL || (port ? `http://127.0.0.1:${port}` : '');
    const clickAnimation = animations.find(
      (item) => /(^|\/)(click|tap|点击)/i.test(item.name) || item.mode === 'once',
    );
    const clickNames =
      pet.clickAnimations?.length
        ? pet.clickAnimations
        : pet.clickAnimation
          ? [pet.clickAnimation]
          : [];
    const doubleClickNames =
      pet.doubleClickAnimations?.length
        ? pet.doubleClickAnimations
        : pet.doubleClickAnimation
          ? [pet.doubleClickAnimation]
          : [];
    const clickVideoPaths = clickNames.map((name) => join(packDir, name));
    const doubleClickVideoPaths = doubleClickNames.map((name) => join(packDir, name));
    desktopManager.start({
      petId: pet.id,
      name: manifest.name,
      videoPath: join(packDir, animation),
      idleVideoPaths,
      clickVideoPath: clickVideoPaths[0] ?? clickAnimation?.path,
      clickVideoPaths,
      doubleClickVideoPath: doubleClickVideoPaths[0],
      doubleClickVideoPaths,
      animations,
      animationsFile,
      packsFile,
      currentPack: pet.pack,
      dshUrl,
      iconPath: trayPack?.icon || trayPack?.preview
        ? join(
            store.dataDir,
            'packs',
            trayPack.id,
            trayPack.icon ?? trayPack.preview!,
          )
        : manifest.preview
          ? join(packDir, manifest.preview)
          : undefined,
      size: pet.size || 420,
      corner: pet.position?.corner ?? 'top-right',
      marginX: pet.position?.marginX ?? 24,
      marginY: pet.position?.marginY ?? 100,
      x: pet.position?.x,
      y: pet.position?.y,
      hiddenUntil,
      soundClick,
      soundVolume,
      soundFile,
      bubbleQuotes: config.bubble.enabled ? config.bubble.quotes : [],
      bubbleDuration: config.bubble.durationMs,
      bubbleStyle: bubbleStyleFor(config.bubble, pet.size || 420, dshUrl),
      emojiFile: bubbleEmoji?.path,
      fontFamily: config.appearance.fontFamily,
      fontSize: Math.round(
        config.appearance.fontSize *
          (config.appearance.scaleWithPet
            ? Math.max(0.85, Math.min(1.6, (pet.size || 420) / 420))
            : 1),
      ),
      clickAction: pet.clickAction ?? 'animation',
      doubleClickAction: pet.doubleClickAction ?? 'none',
      clickEnabled,
      roamEnabled,
    });
  };

  const syncDesktopAfterConfig = async (
    previous: {
      pets: PetLike[];
      sound?: { volume?: number; file?: string };
      actionNames?: Record<string, string>;
      stateMapping?: unknown;
    },
    next: {
      pets: PetLike[];
      sound?: { volume?: number; file?: string };
      actionNames?: Record<string, string>;
      stateMapping?: unknown;
    },
  ): Promise<void> => {
    const soundChanged =
      (previous.sound?.volume ?? 0.6) !== (next.sound?.volume ?? 0.6) ||
      (previous.sound?.file ?? '') !== (next.sound?.file ?? '');
    const labelsChanged =
      JSON.stringify(previous.actionNames ?? {}) !== JSON.stringify(next.actionNames ?? {});
    const mappingChanged =
      JSON.stringify(previous.stateMapping ?? null) !==
      JSON.stringify(next.stateMapping ?? null);
    for (const window of desktopManager.status().windows) {
      const oldPet = previous.pets.find((item) => item.id === window.petId);
      const newPet = next.pets.find((item) => item.id === window.petId);
      if (!newPet || !['desktop', 'both'].includes(newPet.display ?? 'web')) {
        desktopManager.stopPet(window.petId);
        continue;
      }
      const changed =
        !oldPet ||
        oldPet.pack !== newPet.pack ||
        oldPet.size !== newPet.size ||
        oldPet.clickAction !== newPet.clickAction ||
        oldPet.clickAnimation !== newPet.clickAnimation ||
        JSON.stringify(oldPet.clickAnimations ?? []) !==
          JSON.stringify(newPet.clickAnimations ?? []) ||
        oldPet.doubleClickAction !== newPet.doubleClickAction ||
        oldPet.doubleClickAnimation !== newPet.doubleClickAnimation ||
        JSON.stringify(oldPet.doubleClickAnimations ?? []) !==
          JSON.stringify(newPet.doubleClickAnimations ?? []) ||
        oldPet.trayIconPack !== newPet.trayIconPack ||
        JSON.stringify(oldPet.position ?? {}) !== JSON.stringify(newPet.position ?? {});
      if (changed || soundChanged || labelsChanged || mappingChanged) {
        desktopManager.stopPet(window.petId);
        try {
          await startDesktopForPet(newPet);
        } catch {
          // 单个宠物失败不影响配置保存
        }
      }
    }
  };

  const syncDesktopBubble = async (previous: Config, next: Config): Promise<void> => {
    if (JSON.stringify(previous.bubble) === JSON.stringify(next.bubble)) return;
    for (const window of desktopManager.status().windows) {
      const pet = next.pets.find((item) => item.id === window.petId);
      if (!pet || !['desktop', 'both'].includes(pet.display ?? 'web')) continue;
      desktopManager.stopPet(window.petId);
      try {
        await startDesktopForPet(pet);
      } catch {
        // 单个宠物失败不影响配置保存
      }
    }
  };

  const syncDesktopFeatures = async (previous: Config, next: Config): Promise<void> => {
    for (const window of desktopManager.status().windows) {
      const pet = next.pets.find((item) => item.id === window.petId);
      if (!pet) continue;
      const beforeSound = resolveFeature(previous, window.petId, 'sound.click');
      const afterSound = resolveFeature(next, window.petId, 'sound.click');
      const beforeClick = resolveFeature(previous, window.petId, 'interaction.click');
      const afterClick = resolveFeature(next, window.petId, 'interaction.click');
      const beforeRoam = resolveFeature(previous, window.petId, 'motion.roam');
      const afterRoam = resolveFeature(next, window.petId, 'motion.roam');
      if (
        beforeSound === afterSound &&
        beforeClick === afterClick &&
        beforeRoam === afterRoam
      ) {
        continue;
      }
      desktopManager.stopPet(window.petId);
      try {
        await startDesktopForPet(pet);
      } catch {
        // 单个宠物失败不影响配置保存
      }
    }
  };

  desktopManager.setRequestHandler(async (message) => {
    const petId = String(message.petId ?? '');
    const config = await store.read();
    const pet = config.pets.find((item) => item.id === petId);

    if (message.type === 'list-packs') {
      const packs = withPackOverrides(config, await listPacks(store.dataDir)).filter(
        (item) => item.enabled !== false || item.id === pet?.pack,
      );
      return {
        ok: true,
        type: 'packs-result',
        current: pet?.pack,
        packs: packs.map((item) => ({ id: item.id, name: item.name })),
      };
    }

    if (message.type === 'quit-pet') {
      desktopManager.stopPet(petId);
      return { ok: true, type: 'quit-pet-result' };
    }

    if (message.type === 'quit-all') {
      desktopManager.stop();
      return { ok: true, type: 'quit-all-result' };
    }

    if (message.type === 'reload-desktop') {
      if (!pet) return { ok: false, error: 'pet not found' };
      desktopManager.stopPet(petId);
      await startDesktopForPet(pet);
      return { ok: true, type: 'reload-result' };
    }

    if (message.type === 'query-balance') {
      const account = await readAccountBalance(getAccountBalance);
      const config = await store.read();
      return {
        ok: true,
        type: 'balance-result',
        available: account.available,
        currencies: account.currencies,
        error: account.error,
        thresholds: config.balanceWarning.thresholds,
      };
    }

    if (message.type === 'open-dsh') {
      const port = typeof ctx.webServer?.port === 'number' ? ctx.webServer.port : 0;
      const url = process.env.DSH_WEB_URL || (port ? `http://127.0.0.1:${port}` : '');
      if (!url) return { ok: false, error: 'DSH URL 不可用' };
      return { ok: true, type: 'open-dsh-result', url: withPetSettingsLink(url) };
    }

    if (message.type === 'set-hidden') {
      if (!pet) return { ok: false, error: 'pet not found' };
      const until = Number(message.until ?? 0);
      desktopHidden.set(petId, Number.isFinite(until) ? until : 0);
      return { ok: true, type: 'hidden-result' };
    }

    if (message.type === 'set-visible') {
      if (!pet) return { ok: false, error: 'pet not found' };
      desktopHidden.delete(petId);
      return { ok: true, type: 'visible-result' };
    }

    if (message.type === 'set-position') {
      if (!pet) return { ok: false, error: 'pet not found' };
      const x = Number(message.x);
      const y = Number(message.y);
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        return { ok: false, error: 'invalid position' };
      }
      pet.position = {
        ...(pet.position ?? {}),
        x: Math.round(x),
        y: Math.round(y),
      };
      await store.write(config);
      desktopManager.updatePosition(petId, Math.round(x), Math.round(y));
      return { ok: true, type: 'position-result' };
    }

    if (message.type === 'reset-position') {
      if (!pet) return { ok: false, error: 'pet not found' };
      const position = { ...(pet.position ?? {}) };
      delete position.x;
      delete position.y;
      pet.position = position;
      await store.write(config);
      return { ok: true, type: 'position-result' };
    }

    if (message.type === 'set-pack') {
      if (!pet) return { ok: false, error: 'pet not found' };
      const packId = String(message.packId ?? '');
      const packs = withPackOverrides(config, await listPacks(store.dataDir));
      const target = packs.find((item) => item.id === packId);
      if (!target) {
        return { ok: false, error: 'pack not found' };
      }
      if (target.enabled === false) {
        return { ok: false, error: 'pack disabled' };
      }
      pet.pack = packId;
      await store.write(config);
      desktopManager.stopPet(petId);
      await startDesktopForPet(pet);
      return { ok: true, type: 'pack-result', restarting: true };
    }

    if (message.type !== 'set-display') {
      return { ok: false, error: 'unknown request' };
    }
    const display = String(message.display ?? '');
    if (!['web', 'desktop', 'both', 'none'].includes(display)) {
      return { ok: false, error: 'invalid display' };
    }
    if (!pet) return { ok: false, error: 'pet not found' };
    pet.display = display as typeof pet.display;
    await store.write(config);
    if (display === 'web' || display === 'none') {
      desktopHidden.delete(petId);
      desktopManager.stopPet(petId);
    }
    return { ok: true, type: 'display-result', petId, display };
  });

  interface GenerateJobState {
    id: string;
    name: string;
    createdAt: number;
    status: 'queued' | 'running' | 'done' | 'failed' | 'cancelled';
    progress: number;
    message: string;
    finishedAt?: number;
    pack?: Record<string, unknown>;
    error?: string;
    packId?: string;
    fps?: number;
    segmentMeta?: Record<string, { fps?: number; mode?: 'loop' | 'once' }>;
    zipPath?: string;
    retryable?: boolean;
    retry?: () => void;
  }

  const generateJobs = new Map<string, GenerateJobState>();
  const jobsFile = join(store.dataDir, 'generate-jobs.json');
  const jobsDir = join(store.dataDir, '.generate-jobs');
  type CleanupRecord = {
    at: number;
    removed: number;
    reason: string;
    jobs?: string[];
  };

  let lastCleanupInfo: CleanupRecord | null = null;
  const cleanupLogFile = join(store.dataDir, 'cleanup-log.json');
  let cleanupLog: CleanupRecord[] = [];

  void (async () => {
    try {
      const raw = (await readFile(cleanupLogFile, 'utf8')).replace(/^\uFEFF/, '');
      const parsed = JSON.parse(raw) as CleanupRecord[];
      if (Array.isArray(parsed)) {
        cleanupLog = parsed.slice(-20);
        lastCleanupInfo = cleanupLog[cleanupLog.length - 1] ?? null;
      }
    } catch {
      // 没有清理日志
    }
  })();
  const getQuota = async () => {
    const config = await store.read();
    return {
      history: config.generate.history,
      zipBytes: config.generate.zipMb * 1024 * 1024,
      ttlHours: config.generate.ttlHours,
      cleanupMinutes: config.generate.cleanupMinutes,
      autoCleanup: config.generate.autoCleanup,
    };
  };

  const persistJobs = () => {
    const list = [...generateJobs.values()].map((job) => {
      const { retry, ...rest } = job;
      return { ...rest, retryable: Boolean(retry) };
    });
    void writeFile(jobsFile, `${JSON.stringify(list, null, 2)}\n`, 'utf8').catch(() => undefined);
  };

  const jobStorage = async () => {
    let zipBytes = 0;
    let zipFiles = 0;
    try {
      const files = await readdir(jobsDir);
      for (const file of files.filter((item) => item.endsWith('.zip'))) {
        zipFiles += 1;
        zipBytes += (await stat(join(jobsDir, file)).catch(() => ({ size: 0 }))).size;
      }
    } catch {
      // 没有 zip 目录
    }
    const limits = await getQuota();
    return {
      jobs: generateJobs.size,
      zipBytes,
      zipFiles,
      limits,
      lastCleanup: lastCleanupInfo,
      cleanupHistory: cleanupLog.slice(-10).reverse(),
    };
  };

  const cleanupJobs = async (
    clearAll = false,
    reason = 'manual',
  ): Promise<{ removed: number }> => {
    const limits = await getQuota();
    const maxAgeMs = limits.ttlHours * 60 * 60 * 1000;
    let removed = 0;
    const removedJobs: string[] = [];
    const finished = () =>
      [...generateJobs.values()]
        .filter((job) => job.status !== 'running' && job.status !== 'queued')
        .sort((a, b) => a.createdAt - b.createdAt);

    for (const job of finished()) {
      const tooMany = generateJobs.size > limits.history;
      const tooOld = Date.now() - job.createdAt > maxAgeMs;
      if (clearAll || tooMany || tooOld) {
        generateJobs.delete(job.id);
        if (job.zipPath) await rm(job.zipPath, { force: true }).catch(() => undefined);
        removed += 1;
        removedJobs.push(`${job.name}（${job.id}）`);
      }
    }

    try {
      const files = await readdir(jobsDir);
      const stats = await Promise.all(
        files
          .filter((file) => file.endsWith('.zip'))
          .map(async (file) => ({
            file,
            size: (await stat(join(jobsDir, file)).catch(() => ({ size: 0 }))).size,
          })),
      );
      let total = stats.reduce((sum, item) => sum + item.size, 0);
      if (total > limits.zipBytes) {
        for (const job of finished()) {
          if (total <= limits.zipBytes) break;
          const zip = stats.find((item) => item.file === `${job.id}.zip`);
          if (!zip) continue;
          await rm(join(jobsDir, zip.file), { force: true }).catch(() => undefined);
          generateJobs.delete(job.id);
          total -= zip.size;
          removed += 1;
          removedJobs.push(`${job.name}（${job.id}）`);
        }
      }
    } catch {
      // 没有 zip 目录
    }

    persistJobs();
    lastCleanupInfo = { at: Date.now(), removed, reason, jobs: removedJobs.slice(0, 50) };
    cleanupLog.push(lastCleanupInfo);
    cleanupLog = cleanupLog.slice(-20);
    void writeFile(cleanupLogFile, `${JSON.stringify(cleanupLog, null, 2)}\n`, 'utf8').catch(
      () => undefined,
    );
    return { removed };
  };

  let lastPeriodicCleanup = Date.now();
  const cleanupTimer = setInterval(async () => {
    try {
      const config = await store.read();
      if (!config.generate.autoCleanup) return;
      const minutes = config.generate.cleanupMinutes;
      if (minutes <= 0) return;
      if (Date.now() - lastPeriodicCleanup >= minutes * 60 * 1000) {
        lastPeriodicCleanup = Date.now();
        void cleanupJobs(false, 'periodic');
      }
    } catch {
      // 配置读取失败时跳过本轮
    }
  }, 60 * 1000);
  cleanupTimer.unref();

  void (async () => {
    try {
      const raw = (await readFile(jobsFile, 'utf8')).replace(/^\uFEFF/, '');
      const parsed = JSON.parse(raw) as GenerateJobState | GenerateJobState[];
      const list = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of list) {
        const unfinished = item.status === 'running' || item.status === 'queued';
        let resume = false;
        if (unfinished) {
          if (item.zipPath) {
            item.status = 'queued';
            item.message = '重启后自动续跑';
            item.error = undefined;
            resume = true;
          } else {
            item.status = 'failed';
            item.message = '服务重启后未完成';
            item.error = 'DSH 重启，原任务已中断';
          }
        }
        if (item.zipPath) {
          item.retryable = true;
          item.retry = () => {
            item.status = 'queued';
            item.progress = 0;
            item.message = '重试排队中';
            item.error = undefined;
            item.pack = undefined;
            item.finishedAt = undefined;
            void retryRestoredJob(item);
          };
        } else {
          item.retryable = false;
          item.retry = undefined;
        }
        generateJobs.set(item.id, item);

        if (resume) {
          setTimeout(() => {
            if (item.status === 'queued') void retryRestoredJob(item);
          }, 1000).unref();
        }
      }
      persistJobs();
      const config = await store.read();
      if (config.generate.autoCleanup) void cleanupJobs(false, 'startup');
    } catch {
      // 没有历史文件
    }
  })();
  const MAX_RUNNING_JOBS = 1;
  let runningJobs = 0;
  const generationQueue: Array<() => void> = [];
  const pumpGenerationQueue = () => {
    while (runningJobs < MAX_RUNNING_JOBS && generationQueue.length > 0) {
      const next = generationQueue.shift();
      next?.();
    }
  };

  interface LaunchOptions {
    name: string;
    packId: string;
    fps: number;
    segmentMeta?: Record<string, { fps?: number; mode?: 'loop' | 'once' }>;
    ffmpegPath: string;
  }

  const launchGenerationJob = (
    job: GenerateJobState,
    buffer: Buffer,
    options: LaunchOptions,
  ): void => {
    const runJob = () => {
      if (job.status === 'cancelled') {
        pumpGenerationQueue();
        return;
      }
      runningJobs += 1;
      job.status = 'running';
      job.message = '准备中';
      generatePack({
        dataDir: store.dataDir,
        buffer,
        name: options.name,
        id: options.packId,
        store,
        ffmpegPath: options.ffmpegPath,
        fps: options.fps,
        segmentMeta: options.segmentMeta,
        onProgress: (percent, message) => {
          job.progress = Math.max(job.progress, percent);
          job.message = message;
        },
        isCancelled: () => job.status === 'cancelled',
      })
        .then((pack) => {
          job.status = 'done';
          job.progress = 100;
          job.message = '完成';
          job.finishedAt = Date.now();
          job.pack = pack as unknown as Record<string, unknown>;
          persistJobs();
        })
        .catch((error) => {
          job.status =
            error instanceof Error && error.message === '已取消' ? 'cancelled' : 'failed';
          job.error = error instanceof Error ? error.message : String(error);
          job.message = job.status === 'cancelled' ? '已取消' : '失败';
          job.finishedAt = Date.now();
          persistJobs();
        })
        .finally(() => {
          runningJobs = Math.max(0, runningJobs - 1);
          pumpGenerationQueue();
        });
    };

    job.retry = () => {
      if (job.status === 'running' || job.status === 'queued') return;
      job.status = 'queued';
      job.progress = 0;
      job.message = '重试排队中';
      job.error = undefined;
      job.pack = undefined;
      job.finishedAt = undefined;
      if (runningJobs < MAX_RUNNING_JOBS) runJob();
      else generationQueue.push(runJob);
    };

    if (runningJobs < MAX_RUNNING_JOBS) {
      runJob();
    } else {
      job.status = 'queued';
      job.message = '排队中';
      generationQueue.push(runJob);
    }
  };

  async function retryRestoredJob(job: GenerateJobState): Promise<void> {
    if (!job.zipPath) return;
    const status = await media.status();
    if (!status.available || !status.path) {
      job.status = 'failed';
      job.error = status.error ?? 'ffmpeg 不可用';
      persistJobs();
      return;
    }
    let buffer: Buffer;
    try {
      buffer = await readFile(job.zipPath);
    } catch {
      job.status = 'failed';
      job.error = '原始 zip 已丢失';
      persistJobs();
      return;
    }
    job.status = 'queued';
    job.progress = 0;
    job.message = '重试排队中';
    job.error = undefined;
    job.pack = undefined;
    launchGenerationJob(job, buffer, {
      name: job.name,
      packId: job.packId ?? `gen-${Date.now().toString(36)}`,
      fps: job.fps ?? 24,
      segmentMeta: job.segmentMeta,
      ffmpegPath: status.path,
    });
    persistJobs();
  }

  const handler = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    const path = pathnameOf(req.url);
    const prefix = path.startsWith(ROUTE_PREFIX)
      ? ROUTE_PREFIX
      : path.startsWith(LEGACY_ROUTE_PREFIX)
        ? LEGACY_ROUTE_PREFIX
        : null;
    if (!prefix) {
      sendJson(res, 404, { error: 'not found' });
      return;
    }

    const route = path.slice(prefix.length) || '/';
    try {
      if (route === '/health' && req.method === 'GET') {
        const config = await store.read();
        sendJson(res, 200, {
          ok: true,
          name,
          version: PLUGIN_VERSION,
          dataDir: store.dataDir,
          desktop: desktopManager.status(),
          pets: config.pets.length,
        });
        return;
      }

      if (route === '/generate/passthrough' && req.method === 'POST') {
        const requestUrl = new URL(req.url ?? '/', 'http://127.0.0.1');
        const name = (requestUrl.searchParams.get('name') ?? '').trim() || '透明形象';
        const id =
          requestUrl.searchParams.get('id')?.trim() || `gen-${Date.now().toString(36)}`;
        if (!/^[a-z0-9][a-z0-9-]{1,31}$/.test(id)) {
          sendJson(res, 400, { error: 'INVALID_PACK_ID', message: '形象包 id 不合法' });
          return;
        }
        const existing = await listPacks(store.dataDir);
        if (existing.some((item) => item.id === id)) {
          sendJson(res, 409, { error: 'PACK_EXISTS', message: '形象包已存在' });
          return;
        }
        try {
          const buffer = await readBodyBuffer(req, MAX_PASSTHROUGH_BYTES + 1024);
          const pack = await importTransparentWebm({
            dataDir: store.dataDir,
            buffer,
            name,
            id,
            store,
          });
          sendJson(res, 201, { pack });
        } catch (error) {
          sendJson(res, 400, {
            error: 'PASSTHROUGH_FAILED',
            message: error instanceof Error ? error.message : String(error),
          });
        }
        return;
      }

      if (route === '/generate/jobs' && req.method === 'POST') {
        const requestUrl = new URL(req.url ?? '/', 'http://127.0.0.1');
        const name = (requestUrl.searchParams.get('name') ?? '').trim() || '生成形象';
        const id =
          requestUrl.searchParams.get('id')?.trim() || `gen-${Date.now().toString(36)}`;
        if (!/^[a-z0-9][a-z0-9-]{1,31}$/.test(id)) {
          sendJson(res, 400, { error: 'INVALID_PACK_ID', message: '形象包 id 不合法' });
          return;
        }
        const existing = await listPacks(store.dataDir);
        if (existing.some((item) => item.id === id)) {
          sendJson(res, 409, { error: 'PACK_EXISTS', message: '形象包已存在' });
          return;
        }

        const mediaStatus = await media.status();
        if (!mediaStatus.available || !mediaStatus.path) {
          sendJson(res, 400, {
            error: 'FFMPEG_MISSING',
            message: mediaStatus.error ?? 'ffmpeg 不可用',
          });
          return;
        }
        const ffmpegPath = mediaStatus.path;

        const fpsRaw = Number(requestUrl.searchParams.get('fps') ?? 24);
        const fps =
          Number.isFinite(fpsRaw) && fpsRaw >= 1 && fpsRaw <= 60 ? Math.round(fpsRaw) : 24;
        let segmentMeta: Record<string, { fps?: number; mode?: 'loop' | 'once' }> | undefined;
        const metaRaw = requestUrl.searchParams.get('meta');
        if (metaRaw) {
          try {
            const parsed = JSON.parse(metaRaw) as Record<
              string,
              { fps?: number; mode?: 'loop' | 'once' }
            >;
            if (parsed && typeof parsed === 'object') segmentMeta = parsed;
          } catch {
            sendJson(res, 400, { error: 'INVALID_META', message: 'meta 不是合法 JSON' });
            return;
          }
        }

        const buffer = await readBodyBuffer(req, MAX_GENERATE_ZIP_BYTES);
        const job: GenerateJobState = {
          id: `job-${Date.now().toString(36)}`,
          name,
          createdAt: Date.now(),
          status: 'running',
          progress: 5,
          message: '准备中',
        };
        generateJobs.set(job.id, job);

        job.packId = id;
        job.fps = fps;
        job.segmentMeta = segmentMeta;
        const jobsDir = join(store.dataDir, '.generate-jobs');
        await mkdir(jobsDir, { recursive: true });
        const zipPath = join(jobsDir, `${job.id}.zip`);
        await writeFile(zipPath, buffer);
        job.zipPath = zipPath;

        launchGenerationJob(job, buffer, { name, packId: id, fps, segmentMeta, ffmpegPath });
        persistJobs();
        sendJson(res, 200, { job });
        return;
      }

      if (route === '/generate/storage' && req.method === 'GET') {
        sendJson(res, 200, { storage: await jobStorage() });
        return;
      }

      if (route === '/generate/cleanup/log' && req.method === 'DELETE') {
        cleanupLog = [];
        lastCleanupInfo = null;
        await writeFile(cleanupLogFile, '[]\n', 'utf8').catch(() => undefined);
        sendJson(res, 200, { ok: true });
        return;
      }

      if (route === '/generate/cleanup/log' && req.method === 'GET') {
        sendJson(res, 200, { log: [...cleanupLog].reverse() });
        return;
      }

      if (route === '/generate/cleanup' && req.method === 'POST') {
        let payload: { all?: boolean } = {};
        try {
          payload = JSON.parse(await readBody(req)) as { all?: boolean };
        } catch {
          payload = {};
        }
        const result = await cleanupJobs(Boolean(payload.all), 'manual');
        sendJson(res, 200, {
          removed: result.removed,
          jobs: [...generateJobs.values()]
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, 20),
        });
        return;
      }

      if (route === '/generate/jobs' && req.method === 'GET') {
        const jobs = [...generateJobs.values()]
          .sort((a, b) => b.createdAt - a.createdAt)
          .slice(0, 20);
        sendJson(res, 200, { jobs });
        return;
      }

      if (route.startsWith('/generate/jobs/') && route.endsWith('/retry') && req.method === 'POST') {
        const jobId = decodeURIComponent(
          route.slice('/generate/jobs/'.length, route.length - '/retry'.length),
        );
        const job = generateJobs.get(jobId);
        if (!job || !job.retry) {
          sendJson(res, 404, { error: 'JOB_NOT_FOUND' });
          return;
        }
        if (job.status === 'running' || job.status === 'queued') {
          sendJson(res, 409, { error: 'JOB_ACTIVE', message: '任务还在运行' });
          return;
        }
        job.retry();
        persistJobs();
        sendJson(res, 200, { job });
        return;
      }

      if (route.startsWith('/generate/jobs/') && req.method === 'GET') {
        const jobId = decodeURIComponent(route.slice('/generate/jobs/'.length));
        const job = generateJobs.get(jobId);
        if (!job) {
          sendJson(res, 404, { error: 'JOB_NOT_FOUND' });
          return;
        }
        sendJson(res, 200, { job });
        return;
      }

      if (route.startsWith('/generate/jobs/') && req.method === 'DELETE') {
        const jobId = decodeURIComponent(route.slice('/generate/jobs/'.length));
        const job = generateJobs.get(jobId);
        if (!job) {
          sendJson(res, 404, { error: 'JOB_NOT_FOUND' });
          return;
        }
        if (job.status === 'running') {
          job.status = 'cancelled';
          job.message = '已取消';
          job.finishedAt = Date.now();
          persistJobs();
        }
        sendJson(res, 200, { job });
        return;
      }

      if (route === '/generate/inspect' && req.method === 'POST') {
        try {
          const buffer = await readBodyBuffer(req, MAX_GENERATE_ZIP_BYTES);
          const inspection = await inspectFrames(buffer);
          sendJson(res, 200, { inspection });
        } catch (error) {
          sendJson(res, 400, {
            error: 'INSPECT_FAILED',
            message: error instanceof Error ? error.message : String(error),
          });
        }
        return;
      }

      if (route === '/generate' && req.method === 'POST') {
        const requestUrl = new URL(req.url ?? '/', 'http://127.0.0.1');
        const name = (requestUrl.searchParams.get('name') ?? '').trim() || '生成形象';
        const id =
          requestUrl.searchParams.get('id')?.trim() || `gen-${Date.now().toString(36)}`;
        if (!/^[a-z0-9][a-z0-9-]{1,31}$/.test(id)) {
          sendJson(res, 400, { error: 'INVALID_PACK_ID', message: '形象包 id 不合法' });
          return;
        }

        const existing = await listPacks(store.dataDir);
        if (existing.some((item) => item.id === id)) {
          sendJson(res, 409, { error: 'PACK_EXISTS', message: '形象包已存在' });
          return;
        }

        const mediaStatus = await media.status();
        if (!mediaStatus.available || !mediaStatus.path) {
          sendJson(res, 400, {
            error: 'FFMPEG_MISSING',
            message: mediaStatus.error ?? 'ffmpeg 不可用',
          });
          return;
        }
        const ffmpegPath = mediaStatus.path;

        const fpsRaw = Number(requestUrl.searchParams.get('fps') ?? 24);
        const fps =
          Number.isFinite(fpsRaw) && fpsRaw >= 1 && fpsRaw <= 60 ? Math.round(fpsRaw) : 24;

        let segmentMeta: Record<string, { fps?: number; mode?: 'loop' | 'once' }> | undefined;
        const metaRaw = requestUrl.searchParams.get('meta');
        if (metaRaw) {
          try {
            const parsed = JSON.parse(metaRaw) as Record<
              string,
              { fps?: number; mode?: 'loop' | 'once' }
            >;
            if (parsed && typeof parsed === 'object') segmentMeta = parsed;
          } catch {
            sendJson(res, 400, { error: 'INVALID_META', message: 'meta 不是合法 JSON' });
            return;
          }
        }

        try {
          const buffer = await readBodyBuffer(req, MAX_GENERATE_ZIP_BYTES);
          const pack = await generatePack({
            dataDir: store.dataDir,
            buffer,
            name,
            id,
            store,
            ffmpegPath: mediaStatus.path,
            fps,
            segmentMeta,
          });
          sendJson(res, 200, { pack });
        } catch (error) {
          sendJson(res, 400, {
            error: 'GENERATE_FAILED',
            message: error instanceof Error ? error.message : String(error),
          });
        }
        return;
      }

      if (route === '/media/status' && req.method === 'GET') {
        sendJson(res, 200, { media: await media.status() });
        return;
      }

      if (route === '/media/download' && req.method === 'POST') {
        sendJson(res, 200, { download: media.startDownload() });
        return;
      }

      if (route === '/media/download/status' && req.method === 'GET') {
        sendJson(res, 200, { download: media.downloadState() });
        return;
      }

      if (route === '/config' && req.method === 'GET') {
        sendJson(res, 200, await store.read());
        return;
      }

      if (route === '/config' && req.method === 'PUT') {
        const body = await readBody(req);
        let parsed: unknown;
        try {
          parsed = JSON.parse(body);
        } catch {
          sendJson(res, 400, { error: 'invalid JSON body' });
          return;
        }
        try {
          const previous = await store.read();
          const saved = await store.write(parsed);
          await syncDesktopAfterConfig(previous, saved);
          await syncDesktopBubble(previous, saved);
          const config = await store.read();
          if (config.generate.autoCleanup) void cleanupJobs(false, 'config');
          sendJson(res, 200, saved);
        } catch (error) {
          if (error instanceof ZodError) {
            sendJson(res, 400, {
              error: 'invalid config',
              issues: error.issues.map((issue) => ({
                path: issue.path.join('.'),
                message: issue.message,
              })),
            });
            return;
          }
          throw error;
        }
        return;
      }

      if (route === '/features' && req.method === 'GET') {
        const config = await store.read();
        const petId = config.pets[0]?.id ?? 'main';
        sendJson(res, 200, {
          registryVersion: 1,
          features: FEATURES,
          effective: Object.fromEntries(
            FEATURES.map((feature) => [feature.id, resolveFeature(config, petId, feature.id)]),
          ),
        });
        return;
      }

      if (route === '/features' && req.method === 'PUT') {
        const body = await readBody(req);
        let patch: unknown;
        try {
          patch = JSON.parse(body);
        } catch {
          sendJson(res, 400, { error: 'invalid JSON body' });
          return;
        }
        if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
          sendJson(res, 400, { error: 'features patch must be an object' });
          return;
        }

        const current = await store.read();
        const next = {
          ...current,
          features: { ...current.features, ...(patch as Record<string, unknown>) },
        };
        try {
          const saved = await store.write(next);
          await syncDesktopFeatures(current, saved);
          const petId = saved.pets[0]?.id ?? 'main';
          sendJson(res, 200, {
            config: saved,
            effective: Object.fromEntries(
              FEATURES.map((feature) => [feature.id, resolveFeature(saved, petId, feature.id)]),
            ),
          });
        } catch (error) {
          if (error instanceof ZodError) {
            sendJson(res, 400, {
              error: 'invalid features',
              issues: error.issues.map((issue) => ({
                path: issue.path.join('.'),
                message: issue.message,
              })),
            });
            return;
          }
          throw error;
        }
        return;
      }

      if (route === '/menu' && req.method === 'GET') {
        const url = new URL(req.url ?? '/', 'http://127.0.0.1');
        const config = await store.read();
        const petId = url.searchParams.get('pet') ?? config.pets[0]?.id ?? 'main';
        const platform = url.searchParams.get('platform') === 'desktop' ? 'desktop' : 'web';
        const caps: Capabilities = {
          llm: url.searchParams.get('llm') !== '0',
          balance: url.searchParams.get('balance') !== '0',
          desktop: platform === 'desktop' || url.searchParams.get('desktop') === '1',
          pack: url.searchParams.get('pack') !== '0',
        };
        sendJson(res, 200, {
          petId,
          platform,
          caps,
          menu: composeMenu({ config, petId, platform, caps }),
        });
        return;
      }

      if (route === '/balance/status' && req.method === 'GET') {
        const config = await store.read();
        const account = await readAccountBalance(getAccountBalance);
        sendJson(res, 200, {
          account,
          tokenThreshold: config.balanceWarning.tokenThreshold,
          thresholds: config.balanceWarning.thresholds,
          task: { tokens: taskUsage.tokens, triggered: taskUsage.triggered },
        });
        return;
      }

      if (route === '/task/start' && req.method === 'POST') {
        taskUsage.start();
        await autoTask.startTask();
        const warning = await checkBalanceWarning();
        sendJson(res, 200, {
          ok: true,
          task: { tokens: taskUsage.tokens, triggered: taskUsage.triggered },
          warning,
        });
        return;
      }

      if (route === '/task/usage' && req.method === 'POST') {
        try {
          const body = JSON.parse((await readBody(req)) || '{}') as { tokens?: number };
          taskUsage.add(Number(body.tokens) || 0);
          const warning = await checkBalanceWarning();
          sendJson(res, 200, {
            ok: true,
            task: { tokens: taskUsage.tokens, triggered: taskUsage.triggered },
            warning,
          });
        } catch (error) {
          if (error instanceof SyntaxError) {
            sendJson(res, 400, { error: 'INVALID_BODY', message: 'body 不是 JSON' });
            return;
          }
          throw error;
        }
        return;
      }

      if (route === '/task/end' && req.method === 'POST') {
        const warning = await checkBalanceWarning();
        await autoTask.endTask();
        sendJson(res, 200, {
          ok: true,
          task: { tokens: taskUsage.tokens, triggered: taskUsage.triggered },
          warning,
        });
        return;
      }

      if (route === '/task/status' && req.method === 'GET') {
        sendJson(res, 200, {
          task: { tokens: taskUsage.tokens, triggered: taskUsage.triggered },
        });
        return;
      }

      if (route === '/state/events' && req.method === 'GET') {
        res.writeHead(200, {
          'content-type': 'text/event-stream; charset=utf-8',
          'cache-control': 'no-cache, no-transform',
          connection: 'keep-alive',
          'access-control-allow-origin': '*',
          'x-accel-buffering': 'no',
        });
        const send = (state: unknown) => {
          res.write(`data: ${JSON.stringify({ state })}\n\n`);
        };
        send(stateController.current());
        const unsubscribe = stateController.subscribe(send);
        const ping = setInterval(() => res.write(': ping\n\n'), 25_000);
        ping.unref();
        const close = () => {
          clearInterval(ping);
          unsubscribe();
        };
        req.on('close', close);
        res.on('close', close);
        return;
      }

      if (route === '/state' && req.method === 'GET') {
        sendJson(res, 200, { state: stateController.current() });
        return;
      }

      if (route === '/state/clear' && req.method === 'POST') {
        stateController.clear();
        sendJson(res, 200, { ok: true });
        return;
      }

      if (route === '/state/trigger' && req.method === 'POST') {
        try {
          const body = JSON.parse((await readBody(req)) || '{}') as {
            event?: string;
            detail?: string;
          };
          const event = String(body.event ?? '').trim();
          if (!event) {
            sendJson(res, 400, { error: 'INVALID_EVENT', message: '缺少 event' });
            return;
          }
          const active = await stateController.trigger(
            event,
            typeof body.detail === 'string' ? body.detail : undefined,
          );
          sendJson(res, 200, { state: active });
        } catch (error) {
          if (error instanceof StateError) {
            sendJson(res, error.status, { error: error.code, message: error.message });
            return;
          }
          if (error instanceof SyntaxError) {
            sendJson(res, 400, { error: 'INVALID_BODY', message: 'body 不是 JSON' });
            return;
          }
          throw error;
        }
        return;
      }

      if (route === '/llm/status' && req.method === 'GET') {
        sendJson(res, 200, { status: await whisper.status() });
        return;
      }

      if (route === '/llm/resume' && req.method === 'POST') {
        whisper.resume();
        sendJson(res, 200, { status: await whisper.status() });
        return;
      }

      if (route === '/llm/whisper' && req.method === 'POST') {
        let prompt: string | undefined;
        try {
          const parsed = JSON.parse((await readBody(req)) || '{}') as { prompt?: string };
          prompt = typeof parsed.prompt === 'string' ? parsed.prompt : undefined;
        } catch {
          prompt = undefined;
        }
        const result = await whisper.whisper(prompt);
        sendJson(res, 200, { result });
        return;
      }

      if (route === '/sound' && req.method === 'GET') {
        const config = await store.read();
        sendJson(res, 200, { file: config.sound.file ?? null });
        return;
      }

      if (route === '/sound' && req.method === 'POST') {
        try {
          const buffer = await readBodyBuffer(req, MAX_SOUND_BYTES + 1024);
          const saved = await sound.set(buffer);
          const config = await store.read();
          await store.write({ ...config, sound: { ...config.sound, file: saved.file } });
          sendJson(res, 200, { file: saved.file });
        } catch (error) {
          if (error instanceof SoundError) {
            sendJson(res, error.status, { error: error.code, message: error.message });
            return;
          }
          if (error instanceof Error && error.message.includes('too large')) {
            sendJson(res, 413, { error: 'TOO_LARGE', message: '音效文件超过 2MB' });
            return;
          }
          throw error;
        }
        return;
      }

      if (route === '/sound' && req.method === 'DELETE') {
        const config = await store.read();
        if (config.sound.file) await sound.remove(config.sound.file);
        const nextSound = { ...config.sound };
        delete nextSound.file;
        await store.write({ ...config, sound: nextSound });
        sendJson(res, 200, { ok: true });
        return;
      }

      if (route === '/sound/asset' && req.method === 'GET') {
        const config = await store.read();
        const asset = config.sound.file ? await sound.asset(config.sound.file) : undefined;
        if (!asset) {
          sendJson(res, 404, { error: 'SOUND_NOT_FOUND' });
          return;
        }
        sendFile(res, asset.path, asset.size, asset.contentType);
        return;
      }

      if (route === '/emoji' && req.method === 'GET') {
        sendJson(res, 200, { items: await emoji.list() });
        return;
      }

      if (route === '/emoji' && req.method === 'POST') {
        const url = new URL(req.url ?? '/', 'http://127.0.0.1');
        try {
          const buffer = await readBodyBuffer(req, MAX_EMOJI_BYTES + 1024);
          const item = await emoji.add({
            name: url.searchParams.get('name') ?? '',
            description: url.searchParams.get('description') ?? '',
            data: buffer,
          });
          sendJson(res, 201, { item });
        } catch (error) {
          if (error instanceof EmojiError) {
            sendJson(res, error.status, { error: error.code, message: error.message });
            return;
          }
          if (error instanceof Error && error.message.includes('too large')) {
            sendJson(res, 413, { error: 'TOO_LARGE', message: '表情图超过 5MB' });
            return;
          }
          throw error;
        }
        return;
      }

      const emojiAssetMatch = /^\/emoji\/([a-z0-9-]+)\/asset$/.exec(route);
      if (emojiAssetMatch && req.method === 'GET') {
        const asset = await emoji.asset(emojiAssetMatch[1]);
        if (!asset) {
          sendJson(res, 404, { error: 'EMOJI_NOT_FOUND' });
          return;
        }
        sendFile(res, asset.path, asset.size, asset.contentType);
        return;
      }

      const emojiUpdateMatch = /^\/emoji\/([a-z0-9-]+)$/.exec(route);
      if (emojiUpdateMatch && req.method === 'PUT') {
        try {
          const body = JSON.parse(await readBody(req)) as {
            name?: string;
            description?: string;
          };
          const item = await emoji.update(emojiUpdateMatch[1], body);
          if (!item) {
            sendJson(res, 404, { error: 'EMOJI_NOT_FOUND' });
            return;
          }
          sendJson(res, 200, { item });
        } catch {
          sendJson(res, 400, { error: 'INVALID_BODY' });
        }
        return;
      }

      const emojiDeleteMatch = /^\/emoji\/([a-z0-9-]+)$/.exec(route);
      if (emojiDeleteMatch && req.method === 'DELETE') {
        const removed = await emoji.remove(emojiDeleteMatch[1]);
        if (!removed) {
          sendJson(res, 404, { error: 'EMOJI_NOT_FOUND' });
          return;
        }
        sendJson(res, 200, { ok: true, id: emojiDeleteMatch[1] });
        return;
      }

      if (
        route.startsWith('/packs/') &&
        route.endsWith('/actions') &&
        req.method === 'POST'
      ) {
        const id = decodeURIComponent(route.slice('/packs/'.length, -'/actions'.length));
        if (!/^[a-z0-9][a-z0-9-]{1,31}$/.test(id)) {
          sendJson(res, 400, { error: 'INVALID_PACK_ID' });
          return;
        }
        try {
          const body = JSON.parse(
            (await readBodyBuffer(req, 8 * 1024 * 1024)).toString('utf8'),
          ) as { filename?: string; data?: string };
          const rawName = String(body.filename ?? 'action.webm').trim();
          const extension = rawName.toLowerCase().endsWith('.mov') ? '.mov' : '.webm';
          if (
            !rawName.toLowerCase().endsWith('.webm') &&
            !rawName.toLowerCase().endsWith('.mov')
          ) {
            sendJson(res, 400, {
              error: 'UNSUPPORTED_ACTION',
              message: '动作只支持 .webm/.mov（需要透明通道）',
            });
            return;
          }
          const data = Buffer.from(String(body.data ?? ''), 'base64');
          if (data.length === 0 || data.length > 24 * 1024 * 1024) {
            sendJson(res, 400, { error: 'INVALID_ACTION', message: '动作文件为空或过大' });
            return;
          }
          const stem =
            rawName
              .slice(0, -extension.length)
              .replace(/[^a-zA-Z0-9_-]+/g, '-')
              .replace(/^-+|-+$/g, '')
              .slice(0, 48) || 'action';
          const packDir = join(store.dataDir, 'packs', id);
          const manifestPath = join(packDir, 'manifest.json');
          const manifest = manifestSchema.parse(
            JSON.parse(await readFile(manifestPath, 'utf8')),
          );
          await mkdir(join(packDir, 'animations'), { recursive: true });
          let relative = `animations/${stem}${extension}`;
          for (let index = 2; ; index += 1) {
            try {
              await readFile(join(packDir, relative));
              relative = `animations/${stem}-${index}${extension}`;
            } catch {
              break;
            }
          }
          await writeFile(join(packDir, relative), data);
          manifest.animations.push(relative);
          manifest.animationMeta = {
            ...(manifest.animationMeta ?? {}),
            [relative]: { fps: 24, mode: 'loop' },
          };
          await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
          sendJson(res, 201, { ok: true, path: relative });
        } catch (error) {
          if (error instanceof SyntaxError) {
            sendJson(res, 400, { error: 'INVALID_BODY', message: 'body 不是 JSON' });
            return;
          }
          sendJson(res, 400, {
            error: 'UPLOAD_FAILED',
            message: error instanceof Error ? error.message : String(error),
          });
        }
        return;
      }

      if (route.startsWith('/font/builtin/') && req.method === 'GET') {
        const asset = decodeURIComponent(route.slice('/font/builtin/'.length));
        if (!/^[a-z0-9-]+\.woff2$/.test(asset)) {
          sendJson(res, 400, { error: 'INVALID_FONT_ASSET' });
          return;
        }
        try {
          const candidates = [
            fileURLToPath(new URL('../../assets/fonts/', import.meta.url)),
            resolve(process.cwd(), 'assets', 'fonts'),
            resolve(process.cwd(), 'node_modules', 'dsh-xiaofu', 'assets', 'fonts'),
          ];
          let data: Buffer | null = null;
          for (const dir of candidates) {
            try {
              data = await readFile(join(dir, asset));
              break;
            } catch {
              // try next location
            }
          }
          if (!data) throw new Error('font not found');
          res.writeHead(200, {
            'content-type': 'font/woff2',
            'cache-control': 'public, max-age=31536000, immutable',
          });
          res.end(data);
        } catch {
          sendJson(res, 404, { error: 'FONT_ASSET_NOT_FOUND' });
        }
        return;
      }

      if (route === '/font/asset' && req.method === 'POST') {
        try {
          const body = JSON.parse(
            (await readBodyBuffer(req, 12 * 1024 * 1024)).toString('utf8'),
          ) as { filename?: string; data?: string };
          const rawName = String(body.filename ?? 'font.ttf').toLowerCase();
          const extension = ['.ttf', '.otf', '.woff', '.woff2'].find((item) =>
            rawName.endsWith(item),
          );
          if (!extension) {
            sendJson(res, 400, {
              error: 'UNSUPPORTED_FONT',
              message: '字体只支持 .ttf/.otf/.woff/.woff2',
            });
            return;
          }
          const data = Buffer.from(String(body.data ?? ''), 'base64');
          if (data.length === 0 || data.length > 10 * 1024 * 1024) {
            sendJson(res, 400, { error: 'INVALID_FONT', message: '字体文件为空或过大' });
            return;
          }
          const dir = join(store.dataDir, 'fonts');
          await mkdir(dir, { recursive: true });
          const asset = `custom-${Date.now()}${extension}`;
          await writeFile(join(dir, asset), data);
          sendJson(res, 201, { ok: true, asset });
        } catch (error) {
          sendJson(res, 400, {
            error: 'FONT_UPLOAD_FAILED',
            message: error instanceof Error ? error.message : String(error),
          });
        }
        return;
      }

      if (route.startsWith('/font/asset/') && req.method === 'GET') {
        const asset = decodeURIComponent(route.slice('/font/asset/'.length));
        if (!/^[a-z0-9-]+\.(ttf|otf|woff|woff2)$/.test(asset)) {
          sendJson(res, 400, { error: 'INVALID_FONT_ASSET' });
          return;
        }
        try {
          const data = await readFile(join(store.dataDir, 'fonts', asset));
          res.writeHead(200, {
            'content-type': asset.endsWith('.woff2')
              ? 'font/woff2'
              : asset.endsWith('.woff')
                ? 'font/woff'
                : asset.endsWith('.otf')
                  ? 'font/otf'
                  : 'font/ttf',
            'cache-control': 'no-store',
          });
          res.end(data);
        } catch {
          sendJson(res, 404, { error: 'FONT_ASSET_NOT_FOUND' });
        }
        return;
      }

      if (route.startsWith('/font/asset/') && req.method === 'DELETE') {
        const asset = decodeURIComponent(route.slice('/font/asset/'.length));
        if (!/^[a-z0-9-]+\.(ttf|otf|woff|woff2)$/.test(asset)) {
          sendJson(res, 400, { error: 'INVALID_FONT_ASSET' });
          return;
        }
        try {
          await rm(join(store.dataDir, 'fonts', asset), { force: true });
          sendJson(res, 200, { ok: true });
        } catch (error) {
          sendJson(res, 400, {
            error: 'FONT_DELETE_FAILED',
            message: error instanceof Error ? error.message : String(error),
          });
        }
        return;
      }

      if (route === '/bubble/asset' && req.method === 'POST') {
        try {
          const body = JSON.parse(
            (await readBodyBuffer(req, 6 * 1024 * 1024)).toString('utf8'),
          ) as { filename?: string; data?: string };
          const rawName = String(body.filename ?? 'bubble.png').toLowerCase();
          const extension = rawName.endsWith('.svg')
            ? '.svg'
            : rawName.endsWith('.webp')
              ? '.webp'
              : rawName.endsWith('.png')
                ? '.png'
                : '';
          if (!extension) {
            sendJson(res, 400, {
              error: 'UNSUPPORTED_BUBBLE',
              message: '气泡只支持 .png/.svg/.webp',
            });
            return;
          }
          const data = Buffer.from(String(body.data ?? ''), 'base64');
          if (data.length === 0 || data.length > 4 * 1024 * 1024) {
            sendJson(res, 400, { error: 'INVALID_BUBBLE', message: '气泡图片为空或过大' });
            return;
          }
          const dir = join(store.dataDir, 'bubble');
          await mkdir(dir, { recursive: true });
          const asset = `custom-${Date.now()}${extension}`;
          await writeFile(join(dir, asset), data);
          sendJson(res, 201, { ok: true, asset });
        } catch (error) {
          sendJson(res, 400, {
            error: 'BUBBLE_UPLOAD_FAILED',
            message: error instanceof Error ? error.message : String(error),
          });
        }
        return;
      }

      if (route.startsWith('/bubble/asset/') && req.method === 'DELETE') {
        const asset = decodeURIComponent(route.slice('/bubble/asset/'.length));
        if (!/^[a-z0-9-]+\.(png|svg|webp)$/.test(asset)) {
          sendJson(res, 400, { error: 'INVALID_BUBBLE_ASSET' });
          return;
        }
        try {
          await rm(join(store.dataDir, 'bubble', asset), { force: true });
          sendJson(res, 200, { ok: true });
        } catch (error) {
          sendJson(res, 400, {
            error: 'BUBBLE_DELETE_FAILED',
            message: error instanceof Error ? error.message : String(error),
          });
        }
        return;
      }

      if (route.startsWith('/bubble/asset/') && req.method === 'GET') {
        const asset = decodeURIComponent(route.slice('/bubble/asset/'.length));
        if (!/^[a-z0-9-]+\.(png|svg|webp)$/.test(asset)) {
          sendJson(res, 400, { error: 'INVALID_BUBBLE_ASSET' });
          return;
        }
        try {
          const data = await readFile(join(store.dataDir, 'bubble', asset));
          res.writeHead(200, {
            'content-type': asset.endsWith('.svg')
              ? 'image/svg+xml'
              : asset.endsWith('.webp')
                ? 'image/webp'
                : 'image/png',
            'cache-control': 'no-store',
          });
          res.end(data);
        } catch {
          sendJson(res, 404, { error: 'BUBBLE_ASSET_NOT_FOUND' });
        }
        return;
      }

      if (route === '/studio/jobs' && req.method === 'GET') {
        sendJson(res, 200, { jobs: await studio.list() });
        return;
      }

      if (route === '/studio/jobs' && req.method === 'POST') {
        try {
          const body = JSON.parse((await readBody(req)) || '{}') as {
            kind?: string;
            note?: string;
          };
          const kind =
            body.kind === 'character' || body.kind === 'action' ? body.kind : 'other';
          const job = await studio.create(kind, String(body.note ?? '').slice(0, 2000));
          sendJson(res, 201, { ok: true, job });
        } catch (error) {
          sendJson(res, 400, {
            error: 'INVALID_STUDIO_JOB',
            message: error instanceof Error ? error.message : String(error),
          });
        }
        return;
      }

      if (route.startsWith('/studio/jobs/') && req.method === 'GET') {
        const id = decodeURIComponent(route.slice('/studio/jobs/'.length));
        const job = await studio.get(id);
        if (!job) {
          sendJson(res, 404, { error: 'STUDIO_JOB_NOT_FOUND' });
          return;
        }
        sendJson(res, 200, { job });
        return;
      }

      if (route.startsWith('/studio/jobs/') && req.method === 'POST') {
        const id = decodeURIComponent(route.slice('/studio/jobs/'.length));
        try {
          const body = JSON.parse((await readBody(req)) || '{}') as {
            status?: string;
            result?: string;
            error?: string;
          };
          const allowed = ['waiting', 'running', 'done', 'failed', 'cancelled'];
          const job = await studio.update(id, {
            ...(body.status && allowed.includes(body.status)
              ? { status: body.status as 'waiting' | 'running' | 'done' | 'failed' | 'cancelled' }
              : {}),
            ...(typeof body.result === 'string' ? { result: body.result } : {}),
            ...(typeof body.error === 'string' ? { error: body.error } : {}),
          });
          if (!job) {
            sendJson(res, 404, { error: 'STUDIO_JOB_NOT_FOUND' });
            return;
          }
          sendJson(res, 200, { ok: true, job });
        } catch (error) {
          sendJson(res, 400, {
            error: 'INVALID_STUDIO_JOB',
            message: error instanceof Error ? error.message : String(error),
          });
        }
        return;
      }

      if (route === '/packs' && req.method === 'GET') {
        const config = await store.read();
        sendJson(res, 200, {
          packs: withPackOverrides(config, await listPacks(store.dataDir)),
        });
        return;
      }

      if (route === '/packs' && req.method === 'POST') {
        let buffer: Buffer;
        try {
          buffer = await readBodyBuffer(req, MAX_ZIP_BYTES + 1024);
        } catch {
          sendJson(res, 413, { error: 'TOO_LARGE', message: '压缩包超过 50MB' });
          return;
        }

        try {
          const pack = await installPack({ dataDir: store.dataDir, buffer, store });
          sendJson(res, 201, { ok: true, pack });
        } catch (error) {
          if (error instanceof PackError) {
            sendJson(res, error.status, {
              error: error.code,
              message: error.message,
              ...(error.id ? { id: error.id } : {}),
            });
            return;
          }
          throw error;
        }
        return;
      }

      if (route.startsWith('/packs/') && req.method === 'DELETE') {
        const id = decodeURIComponent(route.slice('/packs/'.length));
        if (!/^[a-z0-9][a-z0-9-]{1,31}$/.test(id)) {
          sendJson(res, 400, { error: 'INVALID_PACK_ID' });
          return;
        }

        try {
          const previous = await store.read();
          await deletePack({ dataDir: store.dataDir, id, store });
          const next = await store.read();
          await syncDesktopAfterConfig(previous, next);
          sendJson(res, 200, { ok: true, id });
        } catch (error) {
          if (error instanceof PackError) {
            sendJson(res, error.status, { error: error.code, message: error.message });
            return;
          }
          throw error;
        }
        return;
      }

      if (route === '/desktop/start' && req.method === 'POST') {
        let payload: { petId?: string; all?: boolean } = {};
        try {
          payload = JSON.parse(await readBody(req)) as { petId?: string; all?: boolean };
        } catch {
          sendJson(res, 400, { error: 'invalid JSON body' });
          return;
        }

        const config = await store.read();
        const pets = payload.all
          ? arrangeDesktopPets(
              config.pets.filter((item) => ['desktop', 'both'].includes(item.display)),
            )
          : [config.pets.find((item) => item.id === payload.petId) ?? config.pets[0]].filter(
              Boolean,
            );

        if (pets.length === 0) {
          sendJson(res, 400, {
            error: 'NO_PET',
            message: payload.all ? '没有设置为桌面显示的宠物' : '没有可用的宠物',
          });
          return;
        }

        let lastError = '';
        for (const pet of pets) {
          const packDir = join(store.dataDir, 'packs', pet.pack);
          let manifest: Awaited<ReturnType<typeof applyAnimationExt>>;
          try {
            const stored = manifestSchema.parse(
              JSON.parse(await readFile(join(packDir, 'manifest.json'), 'utf8')),
            );
            manifest = await applyAnimationExt(store.dataDir, pet.pack, stored);
          } catch {
            lastError = `${pet.name || pet.id}：没有可用的形象包`;
            continue;
          }

          const mappingEntries =
            config.stateMapping.byCharacter?.[pet.pack]?.entries ??
            config.stateMapping.entries;
          const idleMapping = mappingEntries.find(
            (entry) => entry.event === 'idle' && entry.enabled,
          );
          const animation =
            idleMapping && manifest.animations?.includes(idleMapping.animation)
              ? idleMapping.animation
              : manifest.animations?.[0];
          if (!animation) {
            lastError = `${pet.name || pet.id}：形象包没有动画`;
            continue;
          }
          const idleNames = (
            idleMapping?.animations?.length ? idleMapping.animations : [animation]
          ).filter((name) => manifest.animations?.includes(name));
          const idleVideoPaths = (idleNames.length > 0 ? idleNames : [animation]).map(
            (name) => join(packDir, name),
          );

          const clickAnimation = manifest.animations?.find((name) =>
            /(^|\/)(click|tap|点击)/i.test(name),
          );
          const animations = (manifest.animations ?? []).map((name, index) => ({
            name,
            label:
              config.actionNames?.[`${pet.pack}/${name}`] ??
              {
                'animations/idle.webm': '空闲',
                'animations/click.webm': '点击回应',
                'animations/state-working.webm': '任务进行中',
                'animations/state-approval.webm': '等待确认',
                'animations/state-done.webm': '任务完成',
                'animations/state-alert-time.webm': '耗时过长',
                'animations/state-alert-cost.webm': '余额警告',
              }[name] ??
              name
                .replace(/^animations\//, '')
                .replace(/\.(webm|mov)$/i, '')
                .replace(/[-_]+/g, ' '),
            path: join(packDir, name),
            mode:
              manifest.animationMeta?.[name]?.mode ??
              (index === 0 ? ('loop' as const) : ('once' as const)),
            fps: manifest.animationMeta?.[name]?.fps,
          }));
          const packList = withPackOverrides(config, await listPacks(store.dataDir));
          const packs = packList.map((item) => ({
            id: item.id,
            name: item.name,
          }));
          const trayPack = pet.trayIconPack
            ? packList.find((item) => item.id === pet.trayIconPack)
            : undefined;
          const desktopDir = join(store.dataDir, '.desktop');
          await mkdir(desktopDir, { recursive: true });
          const packsFile = join(desktopDir, `packs-${pet.id}.json`);
          await writeFile(packsFile, JSON.stringify(packs), 'utf8');
          const animationsFile = join(desktopDir, `animations-${pet.id}.json`);
          await writeFile(animationsFile, JSON.stringify(animations), 'utf8');
          const port = typeof ctx.webServer?.port === 'number' ? ctx.webServer.port : 0;
          const dshUrl =
            process.env.DSH_WEB_URL || (port ? `http://127.0.0.1:${port}` : '');
          const clickNames =
            pet.clickAnimations?.length
              ? pet.clickAnimations
              : pet.clickAnimation
                ? [pet.clickAnimation]
                : [];
          const doubleClickNames =
            pet.doubleClickAnimations?.length
              ? pet.doubleClickAnimations
              : pet.doubleClickAnimation
                ? [pet.doubleClickAnimation]
                : [];
          const clickVideoPaths = clickNames.map((name) => join(packDir, name));
          const doubleClickVideoPaths = doubleClickNames.map((name) =>
            join(packDir, name),
          );
          desktopManager.start({
            petId: pet.id,
            name: manifest.name,
            videoPath: join(packDir, animation),
            idleVideoPaths,
            clickVideoPath: clickVideoPaths[0] ?? (clickAnimation
              ? join(packDir, clickAnimation)
              : undefined),
            clickVideoPaths,
            doubleClickVideoPath: doubleClickVideoPaths[0],
            doubleClickVideoPaths,
            animations,
            animationsFile,
            packsFile,
            currentPack: pet.pack,
            dshUrl,
            iconPath: trayPack?.icon || trayPack?.preview
              ? join(
                  store.dataDir,
                  'packs',
                  trayPack.id,
                  trayPack.icon ?? trayPack.preview!,
                )
              : manifest.preview
                ? join(packDir, manifest.preview)
                : undefined,
            size: pet.size || 420,
            corner: pet.position?.corner ?? 'top-right',
            marginX: pet.position?.marginX ?? 24,
            marginY: pet.position?.marginY ?? 100,
            x: pet.position?.x,
            y: pet.position?.y,
            hiddenUntil: desktopHidden.get(pet.id),
            soundClick: resolveFeature(config, pet.id, 'sound.click'),
            soundVolume: config.sound.volume,
            soundFile: config.sound.file
              ? join(store.dataDir, 'sounds', config.sound.file)
              : undefined,
            bubbleQuotes: config.bubble.enabled ? config.bubble.quotes : [],
            bubbleDuration: config.bubble.durationMs,
            bubbleStyle: bubbleStyleFor(config.bubble, pet.size || 420, dshUrl),
            emojiFile: config.bubble.emojiId
              ? (await emoji.asset(config.bubble.emojiId))?.path
              : undefined,
            fontFamily: config.appearance.fontFamily,
            fontSize: Math.round(
              config.appearance.fontSize *
                (config.appearance.scaleWithPet
                  ? Math.max(0.85, Math.min(1.6, (pet.size || 420) / 420))
                  : 1),
            ),
            clickAction: pet.clickAction ?? 'animation',
      doubleClickAction: pet.doubleClickAction ?? 'none',
            clickEnabled: resolveFeature(config, pet.id, 'interaction.click'),
            roamEnabled: resolveFeature(config, pet.id, 'motion.roam'),
          });
        }

        const snapshot = desktopManager.status();
        if (snapshot.windows.length === 0) {
          sendJson(res, 400, {
            error: 'DESKTOP_FAILED',
            message: lastError || '桌面窗没有启动',
            desktop: snapshot,
          });
          return;
        }
        sendJson(res, 200, { desktop: snapshot });
        return;
      }

      if (route === '/desktop/reload' && req.method === 'POST') {
        let payload: { all?: boolean; petId?: string } = {};
        try {
          payload = JSON.parse(await readBody(req)) as { all?: boolean; petId?: string };
        } catch {
          payload = {};
        }
        const config = await store.read();
        const pets = payload.petId
          ? config.pets.filter((item) => item.id === payload.petId)
          : payload.all
            ? config.pets.filter((item) => ['desktop', 'both'].includes(item.display))
            : [];
        for (const pet of pets) {
          desktopManager.stopPet(pet.id);
          try {
            await startDesktopForPet(pet);
          } catch {
            // 单个失败不影响其它宠物
          }
        }
        sendJson(res, 200, { desktop: desktopManager.status() });
        return;
      }

      if (route === '/desktop/web-only' && req.method === 'POST') {
        desktopHidden.clear();
        desktopManager.stop();
        const config = await store.read();
        config.pets = config.pets.map((pet) =>
          ['desktop', 'both'].includes(pet.display)
            ? { ...pet, display: 'web' as const }
            : pet,
        );
        const saved = await store.write(config);
        sendJson(res, 200, { desktop: desktopManager.status(), config: saved });
        return;
      }

      if (route === '/desktop/stop' && req.method === 'POST') {
        let payload: { petId?: string } = {};
        try {
          payload = JSON.parse(await readBody(req)) as { petId?: string };
        } catch {
          payload = {};
        }
        if (payload.petId) {
          desktopHidden.delete(payload.petId);
          sendJson(res, 200, { desktop: desktopManager.stopPet(payload.petId) });
          return;
        }
        desktopHidden.clear();
        sendJson(res, 200, { desktop: desktopManager.stop() });
        return;
      }

      if (route === '/desktop/reset' && req.method === 'POST') {
        let payload: { petId?: string } = {};
        try {
          payload = JSON.parse(await readBody(req)) as { petId?: string };
        } catch {
          payload = {};
        }
        const config = await store.read();
        const pet = config.pets.find((item) => item.id === payload.petId);
        if (!pet) {
          sendJson(res, 400, { error: 'PET_NOT_FOUND' });
          return;
        }
        const position = { ...(pet.position ?? {}) };
        delete position.x;
        delete position.y;
        pet.position = position;
        await store.write(config);
        desktopManager.stopPet(pet.id);
        if (['desktop', 'both'].includes(pet.display ?? 'web')) {
          try {
            await startDesktopForPet(pet);
          } catch (error) {
            sendJson(res, 400, {
              error: 'RESET_FAILED',
              message: error instanceof Error ? error.message : String(error),
            });
            return;
          }
        }
        sendJson(res, 200, { desktop: desktopManager.status() });
        return;
      }

      if (route === '/desktop/visibility' && req.method === 'GET') {
        sendJson(res, 200, { hidden: desktopHidden.snapshot() });
        return;
      }

      if (route === '/desktop/show' && req.method === 'POST') {
        let payload: { petId?: string } = {};
        try {
          payload = JSON.parse(await readBody(req)) as { petId?: string };
        } catch {
          payload = {};
        }
        const config = await store.read();
        const pet = config.pets.find((item) => item.id === payload.petId);
        if (!pet) {
          sendJson(res, 400, { error: 'PET_NOT_FOUND' });
          return;
        }
        desktopHidden.delete(pet.id);
        desktopManager.stopPet(pet.id);
        try {
          await startDesktopForPet(pet);
        } catch (error) {
          sendJson(res, 400, {
            error: 'SHOW_FAILED',
            message: error instanceof Error ? error.message : String(error),
          });
          return;
        }
        sendJson(res, 200, { desktop: desktopManager.status() });
        return;
      }

      if (route === '/desktop/status' && req.method === 'GET') {
        sendJson(res, 200, { desktop: desktopManager.status() });
        return;
      }

      const exportMatch = /^\/packs\/([a-z0-9][a-z0-9-]{1,31})\/export$/.exec(route);
      if (exportMatch && req.method === 'GET') {
        try {
          const { buffer, filename } = await exportPack(store.dataDir, exportMatch[1]);
          res.writeHead(200, {
            'content-type': 'application/zip',
            'content-length': buffer.length,
            'content-disposition': `attachment; filename="${filename}"`,
            'cache-control': 'no-store',
          });
          res.end(buffer);
        } catch (error) {
          if (error instanceof PackError) {
            sendJson(res, error.status, { error: error.code, message: error.message });
            return;
          }
          throw error;
        }
        return;
      }

      if (route.startsWith('/packs/') && req.method === 'GET') {
        const relative = decodeURIComponent(route.slice('/packs/'.length));
        const parts = relative.split('/').filter(Boolean);
        if (parts.length < 2) {
          sendJson(res, 404, { error: 'not found' });
          return;
        }

        const [id, ...rest] = parts;
        if (!/^[a-z0-9][a-z0-9-]{1,31}$/.test(id)) {
          sendJson(res, 400, { error: 'INVALID_PACK_ID' });
          return;
        }

        const packsRoot = resolve(store.dataDir, 'packs');
        const file = resolve(packsRoot, id, ...rest);
        if (!file.startsWith(packsRoot + sep)) {
          sendJson(res, 400, { error: 'UNSAFE_PATH' });
          return;
        }

        const contentType = MEDIA_TYPES[extname(file).toLowerCase()];
        if (!contentType) {
          sendJson(res, 404, { error: 'not found' });
          return;
        }

        try {
          const info = await stat(file);
          if (!info.isFile()) {
            sendJson(res, 404, { error: 'not found' });
            return;
          }
          sendFile(res, file, info.size, contentType);
        } catch {
          sendJson(res, 404, { error: 'not found' });
        }
        return;
      }

      if (
        (route === '/docs/character-quickstart' || route === '/docs/character-sop') &&
        req.method === 'GET'
      ) {
        const docsRoot = resolve(
          dirname(fileURLToPath(import.meta.url)),
          '../../docs',
        );
        const quick = route === '/docs/character-quickstart';
        await sendMarkdownPage(
          res,
          join(docsRoot, quick ? 'CHARACTER-QUICKSTART.md' : 'CHARACTER-SOP.md'),
          quick ? '3 步做新形象' : '桌宠新形象制作 SOP',
        );
        return;
      }

      sendJson(res, 404, { error: 'not found' });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      sendJson(res, 500, { error: message });
    }
  };

  ctx.effect(() => {
    const handleExternalChange = async (): Promise<void> => {
      try {
        const next = await store.read();
        const json = JSON.stringify(next);
        if (json === lastConfigJson) return;
        const previous = lastConfig ?? next;
        rememberConfig(next);
        await syncDesktopAfterConfig(previous, next);
        await syncDesktopBubble(previous, next);
        await syncDesktopFeatures(previous, next);
      } catch {
        // 坏配置/半写入忽略，等下一次轮询
      }
    };
    const watcher = watchFile(store.configPath, { interval: 1000 }, handleExternalChange);
    watcher.unref();
    return () => unwatchFile(store.configPath, handleExternalChange);
  }, 'dsh-xiaofu: config hot reload');

  ctx.effect(() => {
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const config = await store.read();
          for (const pet of config.pets) {
            if (!pet.autoStart) continue;
            if (!['desktop', 'both'].includes(pet.display)) continue;
            try {
              await startDesktopForPet(pet);
            } catch {
              // 单只失败不阻塞其它宠物或宿主。
            }
          }
        } catch {
          // 配置暂不可读时跳过本次自启动。
        }
      })();
    }, 1500);
    timer.unref();
    return () => clearTimeout(timer);
  }, 'dsh-xiaofu: autostart');

  ctx.effect(() => {
    const primary = ctx.webServer.register({
      kind: 'prefix',
      path: ROUTE_PREFIX,
      handler,
    }) as unknown as (() => void) | undefined;
    const legacy = ctx.webServer.register({
      kind: 'prefix',
      path: LEGACY_ROUTE_PREFIX,
      handler,
    }) as unknown as (() => void) | undefined;
    return () => {
      if (typeof primary === 'function') primary();
      if (typeof legacy === 'function') legacy();
    };
  }, 'dsh-xiaofu: routes');
}
