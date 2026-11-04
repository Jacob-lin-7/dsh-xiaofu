import type { Config } from './schema.js';

export type FeatureGroup = 'core' | 'interaction' | 'appearance' | 'display' | 'status' | 'system';
export type Platform = 'web' | 'desktop';
export type Requirement = 'llm' | 'balance' | 'desktop' | 'pack';
export type Availability = 'ok' | 'unmet';
export type Cost = 'none' | 'token' | 'network';

export interface Feature {
  /** 稳定 id，写进配置后不再改名 */
  id: string;
  label: string;
  group: FeatureGroup;
  defaultEnabled: boolean;
  scope: 'global' | 'per-pet';
  platforms: Platform[];
  requires?: Requirement[];
  /** 有 menu 的功能才会出现在右键菜单 */
  menu?: { order: number };
  cost?: Cost;
  protected?: boolean;
}

export interface Capabilities {
  llm: boolean;
  balance: boolean;
  desktop: boolean;
  pack: boolean;
}

export const FEATURES: readonly Feature[] = [
  {
    id: 'core.pet',
    label: '显示宠物',
    group: 'core',
    defaultEnabled: true,
    scope: 'global',
    platforms: ['web', 'desktop'],
    protected: true,
    cost: 'none',
  },
  {
    id: 'motion.roam',
    label: '随机漫游',
    group: 'core',
    defaultEnabled: true,
    scope: 'per-pet',
    platforms: ['web', 'desktop'],
    cost: 'none',
  },
  {
    id: 'interaction.click',
    label: '点击回应',
    group: 'core',
    defaultEnabled: true,
    scope: 'per-pet',
    platforms: ['web', 'desktop'],
    cost: 'none',
  },
  {
    id: 'interaction.drag',
    label: '拖拽甩抛',
    group: 'core',
    defaultEnabled: true,
    scope: 'per-pet',
    platforms: ['web', 'desktop'],
    cost: 'none',
  },
  {
    id: 'sound.click',
    label: '点击音效',
    group: 'interaction',
    defaultEnabled: false,
    scope: 'per-pet',
    platforms: ['web', 'desktop'],
    cost: 'none',
  },
  {
    id: 'menu.chat',
    label: '对话',
    group: 'interaction',
    defaultEnabled: true,
    scope: 'per-pet',
    platforms: ['web', 'desktop'],
    requires: ['llm'],
    menu: { order: 10 },
    cost: 'token',
  },
  {
    id: 'menu.whisper',
    label: '碎碎念',
    group: 'interaction',
    defaultEnabled: false,
    scope: 'per-pet',
    platforms: ['web', 'desktop'],
    requires: ['llm'],
    menu: { order: 55 },
    cost: 'token',
  },
  {
    id: 'menu.actions',
    label: '动作',
    group: 'interaction',
    defaultEnabled: true,
    scope: 'per-pet',
    platforms: ['web', 'desktop'],
    menu: { order: 20 },
    cost: 'none',
  },
  {
    id: 'menu.petpack',
    label: '形象',
    group: 'appearance',
    defaultEnabled: true,
    scope: 'global',
    platforms: ['web', 'desktop'],
    menu: { order: 30 },
    cost: 'none',
  },
  {
    id: 'menu.balance',
    label: '查看余额',
    group: 'status',
    defaultEnabled: true,
    scope: 'per-pet',
    platforms: ['web', 'desktop'],
    requires: ['balance'],
    menu: { order: 60 },
    cost: 'network',
  },
  {
    id: 'menu.display',
    label: '显示位置',
    group: 'display',
    defaultEnabled: true,
    scope: 'per-pet',
    platforms: ['web', 'desktop'],
    menu: { order: 40 },
    cost: 'none',
  },
  {
    id: 'menu.snooze',
    label: '暂时隐藏',
    group: 'display',
    defaultEnabled: true,
    scope: 'per-pet',
    platforms: ['web', 'desktop'],
    menu: { order: 50 },
    cost: 'none',
  },
  {
    id: 'menu.settings',
    label: '设置',
    group: 'system',
    defaultEnabled: true,
    scope: 'global',
    platforms: ['web', 'desktop'],
    menu: { order: 90 },
    protected: true,
    cost: 'none',
  },
  {
    id: 'menu.about',
    label: '关于',
    group: 'system',
    defaultEnabled: true,
    scope: 'global',
    platforms: ['web', 'desktop'],
    menu: { order: 100 },
    cost: 'none',
  },
  {
    id: 'status.work',
    label: '工作状态',
    group: 'status',
    defaultEnabled: true,
    scope: 'per-pet',
    platforms: ['web', 'desktop'],
    cost: 'none',
  },
  {
    id: 'notify.system',
    label: '系统通知',
    group: 'system',
    defaultEnabled: true,
    scope: 'global',
    platforms: ['desktop'],
    cost: 'none',
  },
  {
    id: 'tray.icon',
    label: '托盘图标',
    group: 'system',
    defaultEnabled: true,
    scope: 'global',
    platforms: ['desktop'],
    requires: ['desktop'],
    cost: 'none',
  },
  {
    id: 'pet.layoutAvoid',
    label: '多宠避让',
    group: 'core',
    defaultEnabled: true,
    scope: 'global',
    platforms: ['desktop'],
    requires: ['desktop'],
    cost: 'none',
  },
  {
    id: 'pet.collision',
    label: '宠物碰撞',
    group: 'core',
    defaultEnabled: false,
    scope: 'global',
    platforms: ['desktop'],
    requires: ['desktop'],
    cost: 'none',
  },
];

const FEATURE_BY_ID = new Map(FEATURES.map((f) => [f.id, f]));

export function getFeature(id: string): Feature | undefined {
  return FEATURE_BY_ID.get(id);
}

/** 生效值：单宠覆盖 → 全局 → 注册表默认 */
export function resolveFeature(config: Config, petId: string, id: string): boolean {
  const feature = getFeature(id);
  if (!feature) return false;
  const override = config.features.pets[petId]?.[id];
  if (typeof override === 'boolean') return override;
  const global = config.features.global[id];
  if (typeof global === 'boolean') return global;
  return feature.defaultEnabled;
}

export function checkAvailability(feature: Feature, caps: Capabilities): Availability {
  for (const requirement of feature.requires ?? []) {
    if (requirement === 'llm' && !caps.llm) return 'unmet';
    if (requirement === 'balance' && !caps.balance) return 'unmet';
    if (requirement === 'desktop' && !caps.desktop) return 'unmet';
    if (requirement === 'pack' && !caps.pack) return 'unmet';
  }
  return 'ok';
}

export function requirementReason(feature: Feature): string | undefined {
  if (feature.requires?.includes('llm')) return '需要先配置模型';
  if (feature.requires?.includes('balance')) return '需要登录账号或配置余额接口';
  if (feature.requires?.includes('pack')) return '还没有安装形象包';
  if (feature.requires?.includes('desktop')) return '仅桌面模式可用';
  return undefined;
}
