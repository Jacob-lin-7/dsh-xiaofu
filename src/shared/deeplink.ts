/**
 * 桌面 helper 与宿主共用的深链约定。
 * 打开 DSH 网页时附带该参数，client 半侧会直接展开「桌宠配置」设置页。
 */
export const PET_SETTINGS_PARAM = 'dsh-xiaofu';
export const PET_SETTINGS_VALUE = 'settings';

export function withPetSettingsLink(raw: string): string {
  if (!raw) return raw;
  try {
    const url = new URL(raw);
    url.searchParams.set(PET_SETTINGS_PARAM, PET_SETTINGS_VALUE);
    return url.toString();
  } catch {
    return raw;
  }
}
