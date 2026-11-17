export interface HiddenEntry {
    petId: string;
    until: number;
}
/**
 * 桌面隐藏状态的持久化。
 *
 * `until = 0` 表示无限期隐藏（托盘「显示/隐藏」），正数是恢复时间戳。
 * 写入走 temp → rename；失败只吞掉，不让磁盘问题中断隐藏本身。
 */
export declare class HiddenStore {
    private readonly file;
    private readonly values;
    constructor(file: string);
    load(now?: number): void;
    get(petId: string, now?: number): number | undefined;
    set(petId: string, until: number): void;
    delete(petId: string): void;
    clear(): void;
    snapshot(now?: number): HiddenEntry[];
    private save;
}
