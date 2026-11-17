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
    menu?: {
        order: number;
    };
    cost?: Cost;
    protected?: boolean;
}
export interface Capabilities {
    llm: boolean;
    balance: boolean;
    desktop: boolean;
    pack: boolean;
}
export declare const FEATURES: readonly Feature[];
export declare function getFeature(id: string): Feature | undefined;
/** 生效值：单宠覆盖 → 全局 → 注册表默认 */
export declare function resolveFeature(config: Config, petId: string, id: string): boolean;
export declare function checkAvailability(feature: Feature, caps: Capabilities): Availability;
export declare function requirementReason(feature: Feature): string | undefined;
