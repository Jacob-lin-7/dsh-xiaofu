export interface ArrangePet {
    id: string;
    size?: number;
    display?: string;
    position?: {
        corner?: string;
        marginX?: number;
        marginY?: number;
        x?: number;
        y?: number;
    };
}
/**
 * 多只桌面宠物同角落启动时，按垂直方向自动错开。
 * 只影响本次启动参数，不写回配置；已有 x/y 的手动位置不参与。
 */
export declare function arrangeDesktopPets<T extends ArrangePet>(pets: T[]): T[];
