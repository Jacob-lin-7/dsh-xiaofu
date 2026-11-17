import type { Config } from './schema.js';
import { type Capabilities, type FeatureGroup, type Platform } from './features.js';
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
export declare function composeMenu(input: ComposeInput): MenuNode[];
