import { z } from 'zod';
/** 宠物位置：四角 + 距角落偏移 */
export declare const cornerSchema: z.ZodEnum<{
    "top-right": "top-right";
    "top-left": "top-left";
    "bottom-left": "bottom-left";
    "bottom-right": "bottom-right";
}>;
export type Corner = z.infer<typeof cornerSchema>;
export declare const displaySchema: z.ZodEnum<{
    both: "both";
    web: "web";
    desktop: "desktop";
    none: "none";
}>;
export type Display = z.infer<typeof displaySchema>;
export declare const clickActionSchema: z.ZodEnum<{
    animation: "animation";
    "open-dsh": "open-dsh";
    none: "none";
    chat: "chat";
}>;
export type ClickAction = z.infer<typeof clickActionSchema>;
export declare const positionSchema: z.ZodObject<{
    corner: z.ZodDefault<z.ZodEnum<{
        "top-right": "top-right";
        "top-left": "top-left";
        "bottom-left": "bottom-left";
        "bottom-right": "bottom-right";
    }>>;
    marginX: z.ZodDefault<z.ZodNumber>;
    marginY: z.ZodDefault<z.ZodNumber>;
    x: z.ZodOptional<z.ZodNumber>;
    y: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const petSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodDefault<z.ZodString>;
    pack: z.ZodDefault<z.ZodString>;
    size: z.ZodDefault<z.ZodNumber>;
    display: z.ZodDefault<z.ZodEnum<{
        both: "both";
        web: "web";
        desktop: "desktop";
        none: "none";
    }>>;
    autoStart: z.ZodDefault<z.ZodBoolean>;
    clickAction: z.ZodDefault<z.ZodEnum<{
        animation: "animation";
        "open-dsh": "open-dsh";
        none: "none";
        chat: "chat";
    }>>;
    clickAnimation: z.ZodOptional<z.ZodString>;
    clickAnimations: z.ZodDefault<z.ZodArray<z.ZodString>>;
    doubleClickAction: z.ZodDefault<z.ZodEnum<{
        animation: "animation";
        "open-dsh": "open-dsh";
        none: "none";
        chat: "chat";
    }>>;
    doubleClickAnimation: z.ZodOptional<z.ZodString>;
    doubleClickAnimations: z.ZodDefault<z.ZodArray<z.ZodString>>;
    trayIconPack: z.ZodOptional<z.ZodString>;
    position: z.ZodDefault<z.ZodObject<{
        corner: z.ZodDefault<z.ZodEnum<{
            "top-right": "top-right";
            "top-left": "top-left";
            "bottom-left": "bottom-left";
            "bottom-right": "bottom-right";
        }>>;
        marginX: z.ZodDefault<z.ZodNumber>;
        marginY: z.ZodDefault<z.ZodNumber>;
        x: z.ZodOptional<z.ZodNumber>;
        y: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type Pet = z.infer<typeof petSchema>;
export declare const menuSchema: z.ZodObject<{
    mode: z.ZodDefault<z.ZodEnum<{
        hide: "hide";
        disable: "disable";
    }>>;
    order: z.ZodDefault<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export declare const featuresSchema: z.ZodObject<{
    registryVersion: z.ZodDefault<z.ZodNumber>;
    global: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodBoolean>>;
    pets: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodRecord<z.ZodString, z.ZodBoolean>>>;
    menu: z.ZodDefault<z.ZodObject<{
        mode: z.ZodDefault<z.ZodEnum<{
            hide: "hide";
            disable: "disable";
        }>>;
        order: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type Features = z.infer<typeof featuresSchema>;
export declare const packSchema: z.ZodObject<{
    version: z.ZodDefault<z.ZodString>;
    enabled: z.ZodDefault<z.ZodBoolean>;
    displayName: z.ZodOptional<z.ZodString>;
    displayVersion: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type Pack = z.infer<typeof packSchema>;
export declare const generateSettingsSchema: z.ZodObject<{
    history: z.ZodDefault<z.ZodNumber>;
    zipMb: z.ZodDefault<z.ZodNumber>;
    ttlHours: z.ZodDefault<z.ZodNumber>;
    cleanupMinutes: z.ZodDefault<z.ZodNumber>;
    autoCleanup: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export type GenerateSettings = z.infer<typeof generateSettingsSchema>;
export declare const soundSettingsSchema: z.ZodObject<{
    volume: z.ZodDefault<z.ZodNumber>;
    file: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type SoundSettings = z.infer<typeof soundSettingsSchema>;
export declare const appearanceSchema: z.ZodObject<{
    fontFamily: z.ZodDefault<z.ZodEnum<{
        system: "system";
        sans: "sans";
        serif: "serif";
        mono: "mono";
    }>>;
    fontSize: z.ZodDefault<z.ZodNumber>;
    scaleWithPet: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export type Appearance = z.infer<typeof appearanceSchema>;
export declare const bubbleSettingsSchema: z.ZodPipe<z.ZodObject<{
    enabled: z.ZodDefault<z.ZodBoolean>;
    durationMs: z.ZodDefault<z.ZodNumber>;
    quotes: z.ZodDefault<z.ZodArray<z.ZodString>>;
    stateQuotes: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString>>>;
    stateTiming: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodObject<{
        durationMs: z.ZodDefault<z.ZodNumber>;
        gapMs: z.ZodDefault<z.ZodNumber>;
        followAction: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strip>>>;
    style: z.ZodDefault<z.ZodString>;
    fontFamily: z.ZodDefault<z.ZodString>;
    latinFontFamily: z.ZodDefault<z.ZodString>;
    fontSize: z.ZodDefault<z.ZodNumber>;
    scaleWithPet: z.ZodDefault<z.ZodBoolean>;
    fontWeight: z.ZodDefault<z.ZodEnum<{
        normal: "normal";
        bold: "bold";
    }>>;
    fontStyle: z.ZodDefault<z.ZodEnum<{
        normal: "normal";
        italic: "italic";
    }>>;
    customFont: z.ZodOptional<z.ZodString>;
    customFonts: z.ZodDefault<z.ZodArray<z.ZodString>>;
    customAsset: z.ZodOptional<z.ZodString>;
    customAssets: z.ZodDefault<z.ZodArray<z.ZodString>>;
    emojiId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, z.ZodTransform<{
    stateQuotes: {
        [x: string]: string[];
    };
    customAssets: string[];
    customFonts: string[];
    stateTiming: {
        [x: string]: {
            durationMs: number;
            gapMs: number;
            followAction: boolean;
        } | {
            durationMs: number;
            gapMs: number;
            followAction: boolean;
        };
    };
    enabled: boolean;
    durationMs: number;
    quotes: string[];
    style: string;
    fontFamily: string;
    latinFontFamily: string;
    fontSize: number;
    scaleWithPet: boolean;
    fontWeight: "normal" | "bold";
    fontStyle: "normal" | "italic";
    customFont?: string | undefined;
    customAsset?: string | undefined;
    emojiId?: string | undefined;
}, {
    enabled: boolean;
    durationMs: number;
    quotes: string[];
    stateQuotes: Record<string, string[]>;
    stateTiming: Record<string, {
        durationMs: number;
        gapMs: number;
        followAction: boolean;
    }>;
    style: string;
    fontFamily: string;
    latinFontFamily: string;
    fontSize: number;
    scaleWithPet: boolean;
    fontWeight: "normal" | "bold";
    fontStyle: "normal" | "italic";
    customFonts: string[];
    customAssets: string[];
    customFont?: string | undefined;
    customAsset?: string | undefined;
    emojiId?: string | undefined;
}>>;
export type BubbleSettings = z.infer<typeof bubbleSettingsSchema>;
export declare const llmSettingsSchema: z.ZodObject<{
    enabled: z.ZodDefault<z.ZodBoolean>;
    endpoint: z.ZodDefault<z.ZodString>;
    model: z.ZodDefault<z.ZodString>;
    intervalMinutes: z.ZodDefault<z.ZodNumber>;
    timeoutMs: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export type LlmSettings = z.infer<typeof llmSettingsSchema>;
export declare const stateMappingEntrySchema: z.ZodObject<{
    event: z.ZodString;
    label: z.ZodDefault<z.ZodString>;
    animation: z.ZodDefault<z.ZodString>;
    animations: z.ZodDefault<z.ZodArray<z.ZodString>>;
    bubble: z.ZodDefault<z.ZodString>;
    durationSec: z.ZodDefault<z.ZodNumber>;
    holdSec: z.ZodDefault<z.ZodNumber>;
    enabled: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export type StateMappingEntry = z.infer<typeof stateMappingEntrySchema>;
export declare const stateMappingSchema: z.ZodPipe<z.ZodObject<{
    entries: z.ZodDefault<z.ZodArray<z.ZodObject<{
        event: z.ZodString;
        label: z.ZodDefault<z.ZodString>;
        animation: z.ZodDefault<z.ZodString>;
        animations: z.ZodDefault<z.ZodArray<z.ZodString>>;
        bubble: z.ZodDefault<z.ZodString>;
        durationSec: z.ZodDefault<z.ZodNumber>;
        holdSec: z.ZodDefault<z.ZodNumber>;
        enabled: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strip>>>;
    byCharacter: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodObject<{
        entries: z.ZodDefault<z.ZodArray<z.ZodObject<{
            event: z.ZodString;
            label: z.ZodDefault<z.ZodString>;
            animation: z.ZodDefault<z.ZodString>;
            animations: z.ZodDefault<z.ZodArray<z.ZodString>>;
            bubble: z.ZodDefault<z.ZodString>;
            durationSec: z.ZodDefault<z.ZodNumber>;
            holdSec: z.ZodDefault<z.ZodNumber>;
            enabled: z.ZodDefault<z.ZodBoolean>;
        }, z.core.$strip>>>;
    }, z.core.$strip>>>;
}, z.core.$strip>, z.ZodTransform<{
    entries: {
        event: string;
        label: string;
        animation: string;
        animations: string[];
        bubble: string;
        durationSec: number;
        holdSec: number;
        enabled: boolean;
    }[];
    byCharacter: {
        [k: string]: {
            entries: {
                event: string;
                label: string;
                animation: string;
                animations: string[];
                bubble: string;
                durationSec: number;
                holdSec: number;
                enabled: boolean;
            }[];
        };
    };
}, {
    entries: {
        event: string;
        label: string;
        animation: string;
        animations: string[];
        bubble: string;
        durationSec: number;
        holdSec: number;
        enabled: boolean;
    }[];
    byCharacter: Record<string, {
        entries: {
            event: string;
            label: string;
            animation: string;
            animations: string[];
            bubble: string;
            durationSec: number;
            holdSec: number;
            enabled: boolean;
        }[];
    }>;
}>>;
export type StateMapping = z.infer<typeof stateMappingSchema>;
/** 设置页固定事件选项；顺序即展示顺序。 */
export declare const ACTION_EVENT_OPTIONS: readonly [{
    readonly id: "idle";
    readonly label: "空闲";
}, {
    readonly id: "task-start";
    readonly label: "任务进行中";
}, {
    readonly id: "task-done";
    readonly label: "任务完成";
}, {
    readonly id: "approval-needed";
    readonly label: "等待确认";
}, {
    readonly id: "task-timeout";
    readonly label: "耗时过长";
}, {
    readonly id: "balance-warning";
    readonly label: "余额警告";
}];
export declare const balanceThresholdSchema: z.ZodObject<{
    currency: z.ZodDefault<z.ZodString>;
    amount: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export type BalanceThreshold = z.infer<typeof balanceThresholdSchema>;
export declare const balanceWarningConfigSchema: z.ZodObject<{
    tokenThreshold: z.ZodDefault<z.ZodNumber>;
    thresholds: z.ZodDefault<z.ZodArray<z.ZodObject<{
        currency: z.ZodDefault<z.ZodString>;
        amount: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export type BalanceWarningConfig = z.infer<typeof balanceWarningConfigSchema>;
export declare const configSchema: z.ZodObject<{
    schemaVersion: z.ZodDefault<z.ZodNumber>;
    pets: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodDefault<z.ZodString>;
        pack: z.ZodDefault<z.ZodString>;
        size: z.ZodDefault<z.ZodNumber>;
        display: z.ZodDefault<z.ZodEnum<{
            both: "both";
            web: "web";
            desktop: "desktop";
            none: "none";
        }>>;
        autoStart: z.ZodDefault<z.ZodBoolean>;
        clickAction: z.ZodDefault<z.ZodEnum<{
            animation: "animation";
            "open-dsh": "open-dsh";
            none: "none";
            chat: "chat";
        }>>;
        clickAnimation: z.ZodOptional<z.ZodString>;
        clickAnimations: z.ZodDefault<z.ZodArray<z.ZodString>>;
        doubleClickAction: z.ZodDefault<z.ZodEnum<{
            animation: "animation";
            "open-dsh": "open-dsh";
            none: "none";
            chat: "chat";
        }>>;
        doubleClickAnimation: z.ZodOptional<z.ZodString>;
        doubleClickAnimations: z.ZodDefault<z.ZodArray<z.ZodString>>;
        trayIconPack: z.ZodOptional<z.ZodString>;
        position: z.ZodDefault<z.ZodObject<{
            corner: z.ZodDefault<z.ZodEnum<{
                "top-right": "top-right";
                "top-left": "top-left";
                "bottom-left": "bottom-left";
                "bottom-right": "bottom-right";
            }>>;
            marginX: z.ZodDefault<z.ZodNumber>;
            marginY: z.ZodDefault<z.ZodNumber>;
            x: z.ZodOptional<z.ZodNumber>;
            y: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>>;
    }, z.core.$strip>>>;
    features: z.ZodDefault<z.ZodObject<{
        registryVersion: z.ZodDefault<z.ZodNumber>;
        global: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodBoolean>>;
        pets: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodRecord<z.ZodString, z.ZodBoolean>>>;
        menu: z.ZodDefault<z.ZodObject<{
            mode: z.ZodDefault<z.ZodEnum<{
                hide: "hide";
                disable: "disable";
            }>>;
            order: z.ZodDefault<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    packs: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodObject<{
        version: z.ZodDefault<z.ZodString>;
        enabled: z.ZodDefault<z.ZodBoolean>;
        displayName: z.ZodOptional<z.ZodString>;
        displayVersion: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
    sound: z.ZodDefault<z.ZodObject<{
        volume: z.ZodDefault<z.ZodNumber>;
        file: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    appearance: z.ZodDefault<z.ZodObject<{
        fontFamily: z.ZodDefault<z.ZodEnum<{
            system: "system";
            sans: "sans";
            serif: "serif";
            mono: "mono";
        }>>;
        fontSize: z.ZodDefault<z.ZodNumber>;
        scaleWithPet: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strip>>;
    bubble: z.ZodDefault<z.ZodPipe<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        durationMs: z.ZodDefault<z.ZodNumber>;
        quotes: z.ZodDefault<z.ZodArray<z.ZodString>>;
        stateQuotes: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString>>>;
        stateTiming: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodObject<{
            durationMs: z.ZodDefault<z.ZodNumber>;
            gapMs: z.ZodDefault<z.ZodNumber>;
            followAction: z.ZodDefault<z.ZodBoolean>;
        }, z.core.$strip>>>;
        style: z.ZodDefault<z.ZodString>;
        fontFamily: z.ZodDefault<z.ZodString>;
        latinFontFamily: z.ZodDefault<z.ZodString>;
        fontSize: z.ZodDefault<z.ZodNumber>;
        scaleWithPet: z.ZodDefault<z.ZodBoolean>;
        fontWeight: z.ZodDefault<z.ZodEnum<{
            normal: "normal";
            bold: "bold";
        }>>;
        fontStyle: z.ZodDefault<z.ZodEnum<{
            normal: "normal";
            italic: "italic";
        }>>;
        customFont: z.ZodOptional<z.ZodString>;
        customFonts: z.ZodDefault<z.ZodArray<z.ZodString>>;
        customAsset: z.ZodOptional<z.ZodString>;
        customAssets: z.ZodDefault<z.ZodArray<z.ZodString>>;
        emojiId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>, z.ZodTransform<{
        stateQuotes: {
            [x: string]: string[];
        };
        customAssets: string[];
        customFonts: string[];
        stateTiming: {
            [x: string]: {
                durationMs: number;
                gapMs: number;
                followAction: boolean;
            } | {
                durationMs: number;
                gapMs: number;
                followAction: boolean;
            };
        };
        enabled: boolean;
        durationMs: number;
        quotes: string[];
        style: string;
        fontFamily: string;
        latinFontFamily: string;
        fontSize: number;
        scaleWithPet: boolean;
        fontWeight: "normal" | "bold";
        fontStyle: "normal" | "italic";
        customFont?: string | undefined;
        customAsset?: string | undefined;
        emojiId?: string | undefined;
    }, {
        enabled: boolean;
        durationMs: number;
        quotes: string[];
        stateQuotes: Record<string, string[]>;
        stateTiming: Record<string, {
            durationMs: number;
            gapMs: number;
            followAction: boolean;
        }>;
        style: string;
        fontFamily: string;
        latinFontFamily: string;
        fontSize: number;
        scaleWithPet: boolean;
        fontWeight: "normal" | "bold";
        fontStyle: "normal" | "italic";
        customFonts: string[];
        customAssets: string[];
        customFont?: string | undefined;
        customAsset?: string | undefined;
        emojiId?: string | undefined;
    }>>>;
    llm: z.ZodDefault<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        endpoint: z.ZodDefault<z.ZodString>;
        model: z.ZodDefault<z.ZodString>;
        intervalMinutes: z.ZodDefault<z.ZodNumber>;
        timeoutMs: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strip>>;
    stateMapping: z.ZodDefault<z.ZodPipe<z.ZodObject<{
        entries: z.ZodDefault<z.ZodArray<z.ZodObject<{
            event: z.ZodString;
            label: z.ZodDefault<z.ZodString>;
            animation: z.ZodDefault<z.ZodString>;
            animations: z.ZodDefault<z.ZodArray<z.ZodString>>;
            bubble: z.ZodDefault<z.ZodString>;
            durationSec: z.ZodDefault<z.ZodNumber>;
            holdSec: z.ZodDefault<z.ZodNumber>;
            enabled: z.ZodDefault<z.ZodBoolean>;
        }, z.core.$strip>>>;
        byCharacter: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodObject<{
            entries: z.ZodDefault<z.ZodArray<z.ZodObject<{
                event: z.ZodString;
                label: z.ZodDefault<z.ZodString>;
                animation: z.ZodDefault<z.ZodString>;
                animations: z.ZodDefault<z.ZodArray<z.ZodString>>;
                bubble: z.ZodDefault<z.ZodString>;
                durationSec: z.ZodDefault<z.ZodNumber>;
                holdSec: z.ZodDefault<z.ZodNumber>;
                enabled: z.ZodDefault<z.ZodBoolean>;
            }, z.core.$strip>>>;
        }, z.core.$strip>>>;
    }, z.core.$strip>, z.ZodTransform<{
        entries: {
            event: string;
            label: string;
            animation: string;
            animations: string[];
            bubble: string;
            durationSec: number;
            holdSec: number;
            enabled: boolean;
        }[];
        byCharacter: {
            [k: string]: {
                entries: {
                    event: string;
                    label: string;
                    animation: string;
                    animations: string[];
                    bubble: string;
                    durationSec: number;
                    holdSec: number;
                    enabled: boolean;
                }[];
            };
        };
    }, {
        entries: {
            event: string;
            label: string;
            animation: string;
            animations: string[];
            bubble: string;
            durationSec: number;
            holdSec: number;
            enabled: boolean;
        }[];
        byCharacter: Record<string, {
            entries: {
                event: string;
                label: string;
                animation: string;
                animations: string[];
                bubble: string;
                durationSec: number;
                holdSec: number;
                enabled: boolean;
            }[];
        }>;
    }>>>;
    balanceWarning: z.ZodDefault<z.ZodObject<{
        tokenThreshold: z.ZodDefault<z.ZodNumber>;
        thresholds: z.ZodDefault<z.ZodArray<z.ZodObject<{
            currency: z.ZodDefault<z.ZodString>;
            amount: z.ZodDefault<z.ZodNumber>;
        }, z.core.$strip>>>;
    }, z.core.$strip>>;
    actionNames: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
    generate: z.ZodDefault<z.ZodObject<{
        history: z.ZodDefault<z.ZodNumber>;
        zipMb: z.ZodDefault<z.ZodNumber>;
        ttlHours: z.ZodDefault<z.ZodNumber>;
        cleanupMinutes: z.ZodDefault<z.ZodNumber>;
        autoCleanup: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type Config = z.infer<typeof configSchema>;
/** 出厂默认配置（每次返回全新对象，避免共享引用） */
export declare function defaultConfig(): Config;
