/**
 * 桌面 helper 与宿主共用的深链约定。
 * 打开 DSH 网页时附带该参数，client 半侧会直接展开「桌宠配置」设置页。
 */
export declare const PET_SETTINGS_PARAM = "dsh-xiaofu";
export declare const PET_SETTINGS_VALUE = "settings";
export declare function withPetSettingsLink(raw: string): string;
