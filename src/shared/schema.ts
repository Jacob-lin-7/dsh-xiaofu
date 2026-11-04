import { z } from 'zod';
import { DEFAULT_CONFIG_DATA } from './default-config-data.js';

/** 宠物位置：四角 + 距角落偏移 */
export const cornerSchema = z.enum(['top-left', 'top-right', 'bottom-left', 'bottom-right']);
export type Corner = z.infer<typeof cornerSchema>;

export const displaySchema = z.enum(['web', 'desktop', 'both', 'none']);
export type Display = z.infer<typeof displaySchema>;

export const clickActionSchema = z.enum(['none', 'animation', 'open-dsh', 'chat']);
export type ClickAction = z.infer<typeof clickActionSchema>;

export const positionSchema = z.object({
  corner: cornerSchema.default('top-right'),
  marginX: z.number().default(24),
  marginY: z.number().default(100),
  /** 拖拽后的绝对坐标；存在时优先于 corner */
  x: z.number().optional(),
  y: z.number().optional(),
});

export const petSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().default('桌宠'),
  pack: z.string().default('builtin'),
  size: z.number().int().positive().default(420),
  display: displaySchema.default('web'),
  /** 左键单击行为：无 / 播放点击动画 / 打开 DSH / 打开对话 */
  clickAction: clickActionSchema.default('animation'),
  /** 单击播放的动画路径；不填则自动找 click/tap */
  clickAnimation: z.string().max(256).optional(),
  /** 单击播放列表；有值时按顺序轮播，优先于 clickAnimation */
  clickAnimations: z.array(z.string().max(256)).max(50).default([]),
  /** 左键双击行为 */
  doubleClickAction: clickActionSchema.default('none'),
  /** 双击播放的动画路径 */
  doubleClickAnimation: z.string().max(256).optional(),
  /** 双击播放列表；有值时按顺序轮播 */
  doubleClickAnimations: z.array(z.string().max(256)).max(50).default([]),
  /** 托盘图标使用哪个形象包的 preview；不填则用自身形象包 */
  trayIconPack: z.string().optional(),
  position: positionSchema.default(() => ({
    corner: 'top-right' as const,
    marginX: 24,
    marginY: 100,
  })),
});
export type Pet = z.infer<typeof petSchema>;

export const menuSchema = z.object({
  mode: z.enum(['hide', 'disable']).default('hide'),
  order: z.array(z.string()).default(() => [] as string[]),
});

export const featuresSchema = z.object({
  registryVersion: z.number().int().default(1),
  global: z.record(z.string(), z.boolean()).default(() => ({})),
  pets: z.record(z.string(), z.record(z.string(), z.boolean())).default(() => ({})),
  menu: menuSchema.default(() => ({ mode: 'hide' as const, order: [] as string[] })),
});
export type Features = z.infer<typeof featuresSchema>;

export const packSchema = z.object({
  version: z.string().default('0.0.0'),
  enabled: z.boolean().default(true),
  /** 显示名覆盖（不影响 manifest 与 id） */
  displayName: z.string().max(64).optional(),
  /** 显示版本覆盖（不影响 manifest） */
  displayVersion: z.string().max(32).optional(),
});
export type Pack = z.infer<typeof packSchema>;

export const generateSettingsSchema = z.object({
  history: z.number().int().min(1).max(500).default(50),
  zipMb: z.number().int().min(10).max(5000).default(500),
  ttlHours: z.number().int().min(1).max(720).default(24),
  cleanupMinutes: z.number().int().min(0).max(1440).default(10),
  autoCleanup: z.boolean().default(true),
});
export type GenerateSettings = z.infer<typeof generateSettingsSchema>;

export const soundSettingsSchema = z.object({
  volume: z.number().min(0).max(1).default(0.6),
  /** dataDir/sounds 下的自定义点击音效文件名 */
  file: z.string().max(128).optional(),
});
export type SoundSettings = z.infer<typeof soundSettingsSchema>;

export const appearanceSchema = z.object({
  fontFamily: z.enum(['system', 'sans', 'serif', 'mono']).default('system'),
  fontSize: z.number().int().min(11).max(20).default(13),
  scaleWithPet: z.boolean().default(false),
});
export type Appearance = z.infer<typeof appearanceSchema>;

const defaultStateQuotes = (): Record<string, string[]> => ({
  click: ['唔，戳我做什么？', '在的，说吧。', '符纸差点掉了……'],
  idle: ['今天也没什么事。', '打个盹，不算偷懒。', '香火气有点淡。'],
  'task-start': ['收到，开始。', '先理一下符纸。', '这事交给我。'],
  'task-done': ['成了。', '收工，别催。', '比预计快一点。'],
  'approval-needed': ['这一步要你点头。', '确认一下，我再往下走。', '批个准，很快的。'],
  'task-timeout': ['这一步拖得有点久。', '不是我慢，是它卡住了。', '再等等，我去看看。'],
  'balance-warning': ['余额见底了。', '这次的消耗有点扎眼。', '省着点，我还要买符纸。'],
});

const defaultStateTiming = (): Record<string, { durationMs: number; gapMs: number }> =>
  Object.fromEntries(
    ['click', 'idle', 'task-start', 'task-done', 'approval-needed', 'task-timeout', 'balance-warning'].map(
      (event) => [event, { durationMs: 8000, gapMs: 2000 }],
    ),
  );

export const bubbleSettingsSchema = z
  .object({
    enabled: z.boolean().default(true),
    durationMs: z.number().int().min(1200).max(10000).default(8000),
    quotes: z
      .array(z.string().trim().min(1).max(80))
      .max(20)
      .default(() => ['唔，戳我做什么？', '在的，说吧。', '符纸差点掉了……']),
    /** 各状态台词；click 也在里面 */
    stateQuotes: z
      .record(z.string(), z.array(z.string().trim().min(1).max(120)).max(20))
      .default(defaultStateQuotes),
    /** 各状态台词的单句展示时长与句间隔 */
    stateTiming: z
      .record(
        z.string(),
        z.object({
          durationMs: z.number().int().min(500).max(60000).default(8000),
          gapMs: z.number().int().min(0).max(60000).default(2000),
        }),
      )
      .default(defaultStateTiming),
    /** 内置气泡样式 id；custom 时用 customAsset */
    style: z.string().max(32).default('classic'),
    /** 气泡字体；inherit 跟随外观，custom:<asset> 用自定义字体 */
    fontFamily: z.string().max(64).default('inherit'),
    fontSize: z.number().int().min(11).max(32).default(13),
    scaleWithPet: z.boolean().default(false),
    fontWeight: z.enum(['normal', 'bold']).default('normal'),
    fontStyle: z.enum(['normal', 'italic']).default('normal'),
    customFont: z.string().max(128).optional(),
    customFonts: z.array(z.string().max(128)).max(30).default([]),
    customAsset: z.string().max(128).optional(),
    customAssets: z.array(z.string().max(128)).max(30).default([]),
    /** 气泡引用哪个已上传表情；不填则纯文字 */
    emojiId: z.string().max(64).optional(),
  })
  .transform((value) => {
    const stateQuotes = { ...defaultStateQuotes(), ...value.stateQuotes };
    if (!value.stateQuotes?.click && value.quotes?.length > 0) {
      stateQuotes.click = value.quotes;
    }
    const customAssets = [...value.customAssets];
    if (value.customAsset && !customAssets.includes(value.customAsset)) {
      customAssets.unshift(value.customAsset);
    }
    const customFonts = [...value.customFonts];
    if (value.customFont && !customFonts.includes(value.customFont)) {
      customFonts.unshift(value.customFont);
    }
    return {
      ...value,
      stateQuotes,
      customAssets,
      customFonts,
      stateTiming: { ...defaultStateTiming(), ...value.stateTiming },
    };
  });
export type BubbleSettings = z.infer<typeof bubbleSettingsSchema>;

const defaultBubbleSettings = (): BubbleSettings => ({
  enabled: true,
  durationMs: 8000,
  quotes: ['唔，戳我做什么？', '在的，说吧。', '符纸差点掉了……'],
  stateQuotes: defaultStateQuotes(),
  stateTiming: defaultStateTiming(),
  style: 'classic',
  fontFamily: 'inherit',
  fontSize: 13,
  scaleWithPet: false,
  fontWeight: 'normal',
  fontStyle: 'normal',
  customAssets: [],
  customFonts: [],
});

export const llmSettingsSchema = z.object({
  enabled: z.boolean().default(false),
  endpoint: z.string().max(500).default(''),
  model: z.string().max(120).default(''),
  intervalMinutes: z.number().int().min(5).max(1440).default(30),
  timeoutMs: z.number().int().min(1000).max(30000).default(8000),
});
export type LlmSettings = z.infer<typeof llmSettingsSchema>;

export const stateMappingEntrySchema = z.object({
  event: z.string().min(1).max(64),
  label: z.string().max(64).default(''),
  animation: z.string().min(1).max(256).default('animations/idle.webm'),
  /** 同一状态按顺序轮换的动作；空数组时退回 animation */
  animations: z.array(z.string().min(1).max(256)).max(20).default([]),
  bubble: z.string().max(120).default(''),
  /** 0 = 保持到下一个事件；正数 = 秒后自动回 idle */
  durationSec: z.number().int().min(0).max(3600).default(0),
  /** 事件保持时长（秒）；0 = 使用事件默认值/由任务状态决定 */
  holdSec: z.number().int().min(0).max(86400).default(0),
  enabled: z.boolean().default(true),
});
export type StateMappingEntry = z.infer<typeof stateMappingEntrySchema>;

const defaultStateEntries = (): StateMappingEntry[] => [
  {
    event: 'idle',
    label: '空闲',
    animation: 'animations/idle.webm',
    animations: ['animations/idle.webm'],
    bubble: '',
    durationSec: 0,
    holdSec: 0,
    enabled: true,
  },
  {
    event: 'task-start',
    label: '任务进行中',
    animation: 'animations/state-working.webm',
    animations: ['animations/state-working.webm'],
    bubble: '正在处理…',
    durationSec: 0,
    holdSec: 0,
    enabled: true,
  },
  {
    event: 'approval-needed',
    label: '等待确认',
    animation: 'animations/state-approval.webm',
    animations: ['animations/state-approval.webm'],
    bubble: '这里需要你确认一下',
    durationSec: 0,
    holdSec: 0,
    enabled: true,
  },
  {
    event: 'task-done',
    label: '任务完成',
    animation: 'animations/state-done.webm',
    animations: ['animations/state-done.webm'],
    bubble: '搞定啦',
    durationSec: 5,
    holdSec: 1200,
    enabled: true,
  },
  {
    event: 'task-timeout',
    label: '耗时过长',
    animation: 'animations/state-alert-time.webm',
    animations: ['animations/state-alert-time.webm'],
    bubble: '这一步有点久了…',
    durationSec: 8,
    holdSec: 300,
    enabled: true,
  },
  {
    event: 'balance-warning',
    label: '余额警告',
    animation: 'animations/state-alert-cost.webm',
    animations: ['animations/state-alert-cost.webm'],
    bubble: '余额/消耗提醒',
    durationSec: 8,
    holdSec: 120,
    enabled: true,
  },
];

export const stateMappingSchema = z
  .object({
    entries: z.array(stateMappingEntrySchema).max(20).default(defaultStateEntries),
    /** 按角色包 id 分开保存；entries 保留给当前角色/旧配置 */
    byCharacter: z
      .record(
        z.string(),
        z.object({
          entries: z.array(stateMappingEntrySchema).max(20).default(defaultStateEntries),
        }),
      )
      .default(() => ({})),
  })
  .transform((value) => {
    const normalize = (input: StateMappingEntry[]): StateMappingEntry[] => {
      let entries = input.map((entry) => {
        if (entry.event === 'token-overuse') {
          return {
            ...entry,
            event: 'balance-warning',
            label: '余额警告',
            bubble: '余额/消耗提醒',
          };
        }
        if (entry.event === 'task-start' && entry.label === '任务开始') {
          return { ...entry, label: '任务进行中' };
        }
        return entry;
      });
      if (!entries.some((entry) => entry.event === 'idle')) {
        entries = [
          {
            event: 'idle',
            label: '空闲',
            animation: 'animations/idle.webm',
            animations: ['animations/idle.webm'],
            bubble: '',
            durationSec: 0,
            holdSec: 0,
            enabled: true,
          },
          ...entries,
        ];
      }
      if (!entries.some((entry) => entry.event === 'balance-warning')) {
        entries.push({
          event: 'balance-warning',
          label: '余额警告',
          animation: 'animations/state-alert-cost.webm',
          animations: ['animations/state-alert-cost.webm'],
          bubble: '余额/消耗提醒',
          durationSec: 8,
          holdSec: 120,
          enabled: true,
        });
      }
      return entries.map((entry) => {
        const animations = entry.animations.length
          ? entry.animations
          : [entry.animation];
        return { ...entry, animations, animation: animations[0] };
      });
    };

    const entries = normalize(value.entries);
    const byCharacter = Object.fromEntries(
      Object.entries(value.byCharacter).map(([id, mapping]) => [
        id,
        { entries: normalize(mapping.entries) },
      ]),
    );
    return { entries, byCharacter };
  });
export type StateMapping = z.infer<typeof stateMappingSchema>;

/** 设置页固定事件选项；顺序即展示顺序。 */
export const ACTION_EVENT_OPTIONS = [
  { id: 'idle', label: '空闲' },
  { id: 'task-start', label: '任务进行中' },
  { id: 'task-done', label: '任务完成' },
  { id: 'approval-needed', label: '等待确认' },
  { id: 'task-timeout', label: '耗时过长' },
  { id: 'balance-warning', label: '余额警告' },
] as const;

export const balanceThresholdSchema = z.object({
  currency: z.string().min(1).max(8).default('CNY'),
  amount: z.number().min(0).max(1_000_000_000).default(0),
});
export type BalanceThreshold = z.infer<typeof balanceThresholdSchema>;

export const balanceWarningConfigSchema = z.object({
  tokenThreshold: z.number().int().min(0).max(1_000_000_000).default(20000),
  thresholds: z
    .array(balanceThresholdSchema)
    .max(10)
    .default(() => [
      { currency: 'CNY', amount: 10 },
      { currency: 'USD', amount: 1 },
    ]),
});
export type BalanceWarningConfig = z.infer<typeof balanceWarningConfigSchema>;

export const configSchema = z.object({
  schemaVersion: z.number().int().default(1),
  pets: z.array(petSchema).default(() => [
    {
      id: 'main',
      name: '桌宠',
      pack: 'builtin',
      size: 420,
      display: 'web' as const,
      clickAction: 'animation' as const,
      clickAnimations: [],
      doubleClickAction: 'none' as const,
      doubleClickAnimations: [],
      position: { corner: 'top-right' as const, marginX: 24, marginY: 100 },
    },
  ]),
  features: featuresSchema.default(() => ({
    registryVersion: 1,
    global: {},
    pets: {},
    menu: { mode: 'hide' as const, order: [] },
  })),
  packs: z.record(z.string(), packSchema).default(() => ({})),
  sound: soundSettingsSchema.default(() => ({ volume: 0.6 })),
  appearance: appearanceSchema.default(() => ({
    fontFamily: 'system' as const,
    fontSize: 13,
    scaleWithPet: false,
  })),
  bubble: bubbleSettingsSchema.default(defaultBubbleSettings()),
  llm: llmSettingsSchema.default(() => ({
    enabled: false,
    endpoint: '',
    model: '',
    intervalMinutes: 30,
    timeoutMs: 8000,
  })),
  stateMapping: stateMappingSchema.default(() => ({
    entries: defaultStateEntries(),
    byCharacter: {},
  })),
  balanceWarning: balanceWarningConfigSchema.default(() => ({
    tokenThreshold: 20000,
    thresholds: [
      { currency: 'CNY', amount: 10 },
      { currency: 'USD', amount: 1 },
    ],
  })),
  /** 动作显示名：键为 "<packId>/<animation path>" */
  actionNames: z.record(z.string(), z.string().max(64)).default(() => ({})),
  generate: generateSettingsSchema.default(() => ({
    history: 50,
    zipMb: 500,
    ttlHours: 24,
    cleanupMinutes: 10,
    autoCleanup: true,
  })),
});
export type Config = z.infer<typeof configSchema>;

/** 出厂默认配置（每次返回全新对象，避免共享引用） */
export function defaultConfig(): Config {
  return configSchema.parse(DEFAULT_CONFIG_DATA);
}
