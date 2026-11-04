import type { Config } from './schema.js';
import {
  FEATURES,
  checkAvailability,
  getFeature,
  requirementReason,
  resolveFeature,
  type Capabilities,
  type FeatureGroup,
  type Platform,
} from './features.js';

export type MenuMode = 'hide' | 'disable';

export interface MenuNode {
  id: string;
  label: string;
  group: FeatureGroup;
  disabled: boolean;
  reason?: string;
}

export interface ComposeInput {
  config: Config;
  petId: string;
  platform: Platform;
  caps: Capabilities;
  /** 覆盖配置里的 menu.mode，便于测试与预览 */
  mode?: MenuMode;
}

/**
 * 菜单合成：纯函数，web 与桌面共用。
 * - 用户关闭的功能永远不显示；
 * - 依赖不满足时按 hide / disable 处理；
 * - 设置入口受保护，始终兜底存在。
 */
export function composeMenu(input: ComposeInput): MenuNode[] {
  const { config, petId, platform, caps } = input;
  const mode = input.mode ?? config.features.menu.mode;

  const nodes: MenuNode[] = [];
  for (const feature of FEATURES) {
    if (!feature.menu) continue;
    if (!feature.platforms.includes(platform)) continue;
    if (!resolveFeature(config, petId, feature.id)) continue;

    const availability = checkAvailability(feature, caps);
    if (availability === 'unmet' && mode === 'hide') continue;

    nodes.push({
      id: feature.id,
      label: feature.label,
      group: feature.group,
      disabled: availability === 'unmet',
      reason: availability === 'unmet' ? requirementReason(feature) : undefined,
    });
  }

  // 保护项：设置永远在，避免用户把入口关死
  if (!nodes.some((n) => n.id === 'menu.settings')) {
    const settings = getFeature('menu.settings');
    if (settings) {
      nodes.push({
        id: settings.id,
        label: settings.label,
        group: settings.group,
        disabled: false,
      });
    }
  }

  const order = config.features.menu.order;
  const orderIndex = new Map(order.map((id, index) => [id, index]));

  return nodes.sort((a, b) => {
    const ai = orderIndex.get(a.id);
    const bi = orderIndex.get(b.id);
    if (ai !== undefined || bi !== undefined) {
      return (ai ?? Number.MAX_SAFE_INTEGER) - (bi ?? Number.MAX_SAFE_INTEGER);
    }
    const af = getFeature(a.id)?.menu?.order ?? 0;
    const bf = getFeature(b.id)?.menu?.order ?? 0;
    return af - bf;
  });
}
